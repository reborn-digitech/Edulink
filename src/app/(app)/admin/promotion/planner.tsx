"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDownIcon, CaretUpIcon, GraduationCapIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import type { Destination, PromotionClass, PromotionMove } from "@/lib/promotion";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { nameCarriesSection } from "@/lib/codes";
import { promoteSchoolAction } from "./actions";

/** A new class this row owns beyond its own destination — the B to its A. */
type Extra = { key: string; name: string; grade: string; section: string };

type Row = {
  kind: Destination["kind"];
  classId: string;
  newName: string;
  newGrade: string;
  newSection: string;
  holdBack: Set<string>;
  /** Pupils going somewhere other than the class's destination, by destination key. */
  assign: Map<string, string>;
  extras: Extra[];
  open: boolean;
};

/**
 * DESTINATION KEYS tie the pickers together. "with" is the class's own
 * destination; "class:<id>" an existing class; "new:<key>" a new class —
 * this row's own (`from:<classId>`), one of its sections
 * (`from:<classId>:B`), or ANOTHER row's, which is how two classes merge
 * into one new one and one class splits across several.
 */
const WITH = "with";

function initialRow(klass: PromotionClass): Row {
  const s = klass.suggested;
  return {
    kind: s.kind,
    classId: s.kind === "CLASS" ? s.classId : (klass.candidates[0]?.id ?? ""),
    newName: s.kind === "NEW" ? s.name : klass.name,
    newGrade: s.kind === "NEW" ? (s.gradeLevel ?? "") : (klass.gradeLevel ?? ""),
    newSection: s.kind === "NEW" ? (s.section ?? "") : (klass.section ?? ""),
    holdBack: new Set(),
    assign: new Map(),
    extras: [],
    open: false,
  };
}

function nextLetter(used: string[]): string {
  const taken = new Set(used.map((u) => u.trim().toUpperCase()));
  for (const letter of "ABCDEFGHIJ") if (!taken.has(letter)) return letter;
  return String(used.length + 1);
}

/** "Class 6A" from "Class 6" + "A"; a name already ending in the section is left alone. */
function withSection(name: string, section: string): string {
  const trimmed = name.trim();
  if (!section) return trimmed;
  if (trimmed.toUpperCase().endsWith(section.toUpperCase())) return trimmed;
  return /\d$/.test(trimmed) ? `${trimmed}${section}` : `${trimmed} ${section}`;
}

/**
 * One row per class. The suggestion is pre-chosen — the top grade leaves,
 * everyone else goes to the class one grade up, made here if it does not
 * exist — so the common case is "read the page, press the button", and the
 * exceptions (a repeater, a class kept as it is, a big class split into
 * sections, two small ones merged, a stream forming) are each a tick or a
 * pick on a pupil.
 */
export function PromotionPlanner({ plan }: { plan: PromotionClass[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(plan.map((k) => [k.id, initialRow(k)])),
  );
  const [lastDay, setLastDay] = useState("");
  const [confirming, setConfirming] = useState(false);

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));
  }

  /** Every destination a pupil could be sent to, across the whole plan. */
  const destinations = useMemo(() => {
    const list: { key: string; label: string; ownerId: string | null }[] = [];
    for (const klass of plan) {
      const row = rows[klass.id]!;
      if (row.kind === "NEW") list.push({ key: `new:from:${klass.id}`, label: row.newName, ownerId: klass.id });
      else if (row.kind === "CLASS" && row.classId) {
        const c = klass.candidates.find((x) => x.id === row.classId);
        if (c && !list.some((d) => d.key === `class:${c.id}`)) list.push({ key: `class:${c.id}`, label: c.name, ownerId: null });
      }
      for (const extra of row.extras) list.push({ key: `new:${extra.key}`, label: extra.name, ownerId: klass.id });
    }
    for (const klass of plan) {
      for (const c of klass.candidates) {
        if (!list.some((d) => d.key === `class:${c.id}`)) list.push({ key: `class:${c.id}`, label: c.name, ownerId: null });
      }
    }
    return list;
  }, [plan, rows]);

  const totals = useMemo(() => {
    let moving = 0;
    let leaving = 0;
    let held = 0;
    const newKeys = new Set<string>();
    for (const klass of plan) {
      const row = rows[klass.id]!;
      for (const p of klass.pupils) {
        if (row.holdBack.has(p.membershipId)) {
          held += 1;
          continue;
        }
        const dest = row.assign.get(p.membershipId) ?? WITH;
        const kind = dest === WITH ? row.kind : dest === "leave" ? "LEAVE" : dest.startsWith("new:") ? "NEW" : "CLASS";
        if (kind === "STAY") continue;
        if (kind === "LEAVE") leaving += 1;
        else moving += 1;
        if (kind === "NEW") newKeys.add(dest === WITH ? `new:from:${klass.id}` : dest);
      }
    }
    return { moving, leaving, held, newClasses: newKeys.size };
  }, [plan, rows]);

  function destinationFor(key: string, klass: PromotionClass): Exclude<Destination, { kind: "STAY" }> | null {
    if (key === "leave") return { kind: "LEAVE" };
    if (key.startsWith("class:")) return { kind: "CLASS", classId: key.slice(6) };
    if (key.startsWith("new:")) {
      const newKey = key.slice(4);
      // This row's own destination or one of its sections…
      const ownerRow = rows[klass.id]!;
      const extra = ownerRow.extras.find((e) => e.key === newKey);
      if (extra) return { kind: "NEW", key: newKey, name: extra.name, gradeLevel: extra.grade || null, section: extra.section || null };
      // …or another row's. The first naming wins server-side; we pass the owner's spelling.
      const ownerId = newKey.startsWith("from:") ? newKey.slice(5).split(":")[0]! : null;
      const owner = ownerId ? rows[ownerId] : undefined;
      const ownerExtra = owner?.extras.find((e) => e.key === newKey);
      if (ownerExtra) return { kind: "NEW", key: newKey, name: ownerExtra.name, gradeLevel: ownerExtra.grade || null, section: ownerExtra.section || null };
      if (owner) return { kind: "NEW", key: newKey, name: owner.newName, gradeLevel: owner.newGrade || null, section: owner.newSection || null };
    }
    return null;
  }

  function submit() {
    const moves: PromotionMove[] = plan.map((klass) => {
      const row = rows[klass.id]!;
      const to: Destination =
        row.kind === "CLASS"
          ? { kind: "CLASS", classId: row.classId }
          : row.kind === "NEW"
            ? { kind: "NEW", key: `from:${klass.id}`, name: row.newName, gradeLevel: row.newGrade || null, section: row.newSection || null }
            : row.kind === "LEAVE"
              ? { kind: "LEAVE" }
              : { kind: "STAY" };
      const reassign: NonNullable<PromotionMove["reassign"]> = [];
      for (const [membershipId, key] of row.assign) {
        if (key === WITH || row.holdBack.has(membershipId)) continue;
        const dest = destinationFor(key, klass);
        if (dest) reassign.push({ membershipId, to: dest });
      }
      return { fromClassId: klass.id, to, holdBack: [...row.holdBack], ...(reassign.length > 0 ? { reassign } : {}) };
    });
    startTransition(async () => {
      const result = await promoteSchoolAction(moves, lastDay);
      if (!result.ok) {
        toast({ tone: "warn", title: t("promotion.notDone"), description: actionError(t, result) });
        setConfirming(false);
        return;
      }
      toast({
        tone: "ok",
        title: t("promotion.done"),
        description: [
          t("promotion.doneBody", {
            moved: result.moved,
            left: result.left,
            held: result.heldBack,
            created: result.created,
            archived: result.archived,
          }),
          t("promotion.doneCloseYear"),
        ].join(" "),
      });
      router.push("/admin/classes");
      router.refresh();
    });
  }

  const nothingToDo = totals.moving + totals.leaving === 0;

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {plan.map((klass) => {
          const row = rows[klass.id]!;
          const goes = klass.pupils.length - row.holdBack.size;
          // Not the class's own new row (that is "with the class"), and never
          // the class itself — a pupil cannot move into where they already are.
          const pupilOptions = destinations.filter(
            (d) => (d.key !== `new:from:${klass.id}` || row.kind !== "NEW") && d.key !== `class:${klass.id}`,
          );
          return (
            <li key={klass.id} data-testid={`promo-row-${klass.id}`}>
              <Card>
                <CardBody className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-semibold text-fg">
                        {klass.name}
                        {klass.section && !nameCarriesSection(klass.name, klass.section) && <span className="ml-1.5 text-xs font-normal text-fg-muted">· {t("promotion.sectionLabel", { section: klass.section })}</span>}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {klass.pupils.length === 0
                          ? t("promotion.emptyClass")
                          : klass.pupils.length === 1
                            ? t("promotion.pupilsCountOne")
                            : t("promotion.pupilsCount", { count: klass.pupils.length })}
                        {row.holdBack.size > 0 && <> · {t("promotion.heldBackCount", { count: row.holdBack.size })}</>}
                        {row.assign.size > 0 && <> · {t("promotion.reassignedCount", { count: [...row.assign.values()].filter((v) => v !== WITH).length })}</>}
                      </p>
                    </div>

                    <div className="grid min-w-[16rem] flex-[2] gap-2 sm:grid-cols-3">
                      <SelectField
                        label={t("promotion.goesTo")}
                        value={row.kind}
                        onChange={(e) => update(klass.id, { kind: e.target.value as Row["kind"] })}
                      >
                        {klass.candidates.length > 0 && <option value="CLASS">{t("promotion.destExisting")}</option>}
                        <option value="NEW">{t("promotion.destNew")}</option>
                        <option value="LEAVE">{t("promotion.destLeave")}</option>
                        <option value="STAY">{t("promotion.destStay")}</option>
                      </SelectField>

                      {row.kind === "CLASS" && (
                        <SelectField
                          label={t("promotion.fromClass")}
                          value={row.classId}
                          onChange={(e) => update(klass.id, { classId: e.target.value })}
                          className="sm:col-span-2"
                        >
                          {klass.candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.pupils === 0 ? c.name : t("promotion.candidateWithPupils", { name: c.name, count: c.pupils })}
                            </option>
                          ))}
                        </SelectField>
                      )}
                      {row.kind === "NEW" && (
                        <>
                          <TextField
                            label={t("promotion.newClassName")}
                            value={row.newName}
                            required
                            onChange={(e) => update(klass.id, { newName: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <TextField
                              label={t("promotion.newClassGrade")}
                              value={row.newGrade}
                              onChange={(e) => update(klass.id, { newGrade: e.target.value })}
                            />
                            <TextField
                              label={t("promotion.newClassSection")}
                              value={row.newSection}
                              placeholder="A"
                              onChange={(e) => update(klass.id, { newSection: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                      {row.kind === "LEAVE" && (
                        <div className="flex items-end pb-2">
                          <Badge tone="warn" size="sm">
                            <GraduationCapIcon weight="bold" className="mr-1 size-3.5" />
                            {goes}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extra sections this row opens: the B, C to its A. */}
                  {row.extras.length > 0 && (
                    <ul className="space-y-2">
                      {row.extras.map((extra) => (
                        <li key={extra.key} className="grid gap-2 rounded-[--radius-md] border border-dashed border-border p-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                          <TextField
                            label={t("promotion.newClassName")}
                            value={extra.name}
                            onChange={(e) => update(klass.id, { extras: row.extras.map((x) => (x.key === extra.key ? { ...x, name: e.target.value } : x)) })}
                          />
                          <TextField
                            label={t("promotion.newClassGrade")}
                            value={extra.grade}
                            className="sm:w-20"
                            onChange={(e) => update(klass.id, { extras: row.extras.map((x) => (x.key === extra.key ? { ...x, grade: e.target.value } : x)) })}
                          />
                          <TextField
                            label={t("promotion.newClassSection")}
                            value={extra.section}
                            className="sm:w-20"
                            onChange={(e) => update(klass.id, { extras: row.extras.map((x) => (x.key === extra.key ? { ...x, section: e.target.value } : x)) })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<XIcon />}
                            aria-label={t("promotion.removeSection")}
                            onClick={() => {
                              const assign = new Map(row.assign);
                              for (const [m, k] of assign) if (k === `new:${extra.key}`) assign.delete(m);
                              update(klass.id, { extras: row.extras.filter((x) => x.key !== extra.key), assign });
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {klass.pupils.length > 0 && (
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => update(klass.id, { open: !row.open })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
                          aria-expanded={row.open}
                        >
                          {row.open ? <CaretUpIcon className="size-3.5" /> : <CaretDownIcon className="size-3.5" />}
                          {t("promotion.sortPupils")}
                        </button>
                        {row.kind !== "LEAVE" && row.kind !== "STAY" && (
                          <button
                            type="button"
                            data-testid={`promo-add-section-${klass.id}`}
                            onClick={() => {
                              const used = [row.newSection, ...row.extras.map((e) => e.section)];
                              const section = nextLetter(used);
                              const base = row.kind === "NEW" ? row.newName : (klass.candidates.find((c) => c.id === row.classId)?.name ?? klass.name);
                              const stem = row.newSection && base.toUpperCase().endsWith(row.newSection.toUpperCase()) ? base.slice(0, -row.newSection.length).trim() : base;
                              const extra: Extra = { key: `from:${klass.id}:${section}`, name: withSection(stem, section), grade: row.newGrade || klass.gradeLevel || "", section };
                              // The main class wears its letter too, so "7A" and "7B" are siblings on the board.
                              const mainSection = row.newSection || "A";
                              update(klass.id, {
                                extras: [...row.extras, extra],
                                open: true,
                                ...(row.kind === "NEW" ? { newSection: mainSection, newName: withSection(row.newName, mainSection) } : {}),
                              });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
                          >
                            <PlusIcon className="size-3.5" />
                            {t("promotion.addSection")}
                          </button>
                        )}
                      </div>
                      {row.open && (
                        <div className="mt-2 rounded-[--radius-md] border border-border p-3">
                          <p className="mb-2 text-xs text-fg-muted">{t("promotion.sortPupilsHint")}</p>
                          <ul className="grid gap-1 sm:grid-cols-2">
                            {klass.pupils.map((p) => {
                              const held = row.holdBack.has(p.membershipId);
                              const dest = row.assign.get(p.membershipId) ?? WITH;
                              return (
                                <li key={p.membershipId} className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-sm", held ? "bg-warn-soft" : "hover:bg-surface-muted")}>
                                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={held}
                                      aria-label={t("promotion.holdBack")}
                                      onChange={(e) => {
                                        const next = new Set(row.holdBack);
                                        if (e.target.checked) next.add(p.membershipId);
                                        else next.delete(p.membershipId);
                                        update(klass.id, { holdBack: next });
                                      }}
                                    />
                                    <span className={cn("truncate", held ? "text-fg" : "text-fg-muted")}>{p.name}</span>
                                  </label>
                                  {!held && (
                                    <select
                                      aria-label={t("promotion.pupilGoesTo", { name: p.name })}
                                      data-testid={`promo-pupil-${p.membershipId}`}
                                      value={dest}
                                      onChange={(e) => {
                                        const assign = new Map(row.assign);
                                        if (e.target.value === WITH) assign.delete(p.membershipId);
                                        else assign.set(p.membershipId, e.target.value);
                                        update(klass.id, { assign });
                                      }}
                                      className="max-w-[11rem] rounded-[--radius-sm] border border-border bg-surface px-1.5 py-0.5 text-xs text-fg"
                                    >
                                      <option value={WITH}>{row.kind === "STAY" ? t("promotion.staysHere") : t("promotion.withTheClass")}</option>
                                      {pupilOptions.map((d) => (
                                        <option key={d.key} value={d.key}>{d.label}</option>
                                      ))}
                                      {row.kind !== "LEAVE" && <option value="leave">{t("promotion.destLeave")}</option>}
                                    </select>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card>
        <CardHeader
          icon={<GraduationCapIcon weight="duotone" className="size-5" />}
          title={t("promotion.summary", {
            moving: totals.moving,
            leaving: totals.leaving,
            held: totals.held,
            newClasses: totals.newClasses,
          })}
        />
        <CardBody className="space-y-3">
          {totals.leaving > 0 && (
            <DateField
              label={t("promotion.lastDay")}
              hint={t("promotion.lastDayHint")}
              value={lastDay}
              onChange={(e) => setLastDay(e.target.value)}
              className="max-w-xs"
            />
          )}
          {!confirming ? (
            <Button onClick={() => setConfirming(true)} disabled={nothingToDo || pending}>
              {t("promotion.go")}
            </Button>
          ) : (
            <div className="rounded-[--radius-md] border border-warn/40 bg-warn-soft/50 p-3">
              <p className="text-sm text-fg">{t("promotion.confirm", { moving: totals.moving, leaving: totals.leaving })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={submit} loading={pending}>
                  {t("promotion.confirmGo")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
                  {t("promotion.notYet")}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
