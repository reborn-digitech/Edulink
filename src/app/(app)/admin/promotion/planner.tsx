"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDownIcon, CaretUpIcon, GraduationCapIcon } from "@phosphor-icons/react";
import type { Destination, PromotionClass, PromotionMove } from "@/lib/promotion";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { promoteSchoolAction } from "./actions";

type Row = {
  kind: Destination["kind"];
  classId: string;
  newName: string;
  newGrade: string;
  holdBack: Set<string>;
  open: boolean;
};

function initialRow(klass: PromotionClass): Row {
  const s = klass.suggested;
  return {
    kind: s.kind,
    classId: s.kind === "CLASS" ? s.classId : (klass.candidates[0]?.id ?? ""),
    newName: s.kind === "NEW" ? s.name : klass.name,
    newGrade: s.kind === "NEW" ? (s.gradeLevel ?? "") : (klass.gradeLevel ?? ""),
    holdBack: new Set(),
    open: false,
  };
}

/**
 * One row per class. The suggestion is pre-chosen — the top grade leaves,
 * everyone else goes to the class one grade up, made here if it does not
 * exist — so the common case is "read the page, press the button", and the
 * exceptions (a repeater, a class kept as it is) are one tick each.
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

  const totals = useMemo(() => {
    let moving = 0;
    let leaving = 0;
    let held = 0;
    let newClasses = 0;
    for (const klass of plan) {
      const row = rows[klass.id]!;
      if (row.kind === "STAY") continue;
      const goes = klass.pupils.filter((p) => !row.holdBack.has(p.membershipId)).length;
      held += klass.pupils.length - goes;
      if (row.kind === "LEAVE") leaving += goes;
      else moving += goes;
      if (row.kind === "NEW") newClasses += 1;
    }
    return { moving, leaving, held, newClasses };
  }, [plan, rows]);

  function submit() {
    const moves: PromotionMove[] = plan.map((klass) => {
      const row = rows[klass.id]!;
      const to: Destination =
        row.kind === "CLASS"
          ? { kind: "CLASS", classId: row.classId }
          : row.kind === "NEW"
            ? { kind: "NEW", name: row.newName, gradeLevel: row.newGrade || null }
            : row.kind === "LEAVE"
              ? { kind: "LEAVE" }
              : { kind: "STAY" };
      return { fromClassId: klass.id, to, holdBack: [...row.holdBack] };
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
        description: t("promotion.doneBody", {
          moved: result.moved,
          left: result.left,
          held: result.heldBack,
          created: result.created,
          archived: result.archived,
        }),
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
          return (
            <li key={klass.id}>
              <Card>
                <CardBody className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-semibold text-fg">{klass.name}</p>
                      <p className="text-xs text-fg-muted">
                        {klass.pupils.length === 0
                          ? t("promotion.emptyClass")
                          : klass.pupils.length === 1
                            ? t("promotion.pupilsCountOne")
                            : t("promotion.pupilsCount", { count: klass.pupils.length })}
                        {row.holdBack.size > 0 && (
                          <> · {t("promotion.heldBackCount", { count: row.holdBack.size })}</>
                        )}
                      </p>
                    </div>

                    <div className="grid min-w-[16rem] flex-[2] gap-2 sm:grid-cols-2">
                      <SelectField
                        label={t("promotion.goesTo")}
                        value={row.kind}
                        onChange={(e) => update(klass.id, { kind: e.target.value as Row["kind"] })}
                      >
                        {klass.candidates.length > 0 && (
                          <option value="CLASS">{t("promotion.destExisting")}</option>
                        )}
                        <option value="NEW">{t("promotion.destNew")}</option>
                        <option value="LEAVE">{t("promotion.destLeave")}</option>
                        <option value="STAY">{t("promotion.destStay")}</option>
                      </SelectField>

                      {row.kind === "CLASS" && (
                        <SelectField
                          label={t("promotion.fromClass")}
                          value={row.classId}
                          onChange={(e) => update(klass.id, { classId: e.target.value })}
                        >
                          {klass.candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
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
                          <TextField
                            label={t("promotion.newClassGrade")}
                            value={row.newGrade}
                            onChange={(e) => update(klass.id, { newGrade: e.target.value })}
                          />
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

                  {klass.pupils.length > 0 && row.kind !== "STAY" && (
                    <div>
                      <button
                        type="button"
                        onClick={() => update(klass.id, { open: !row.open })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
                        aria-expanded={row.open}
                      >
                        {row.open ? <CaretUpIcon className="size-3.5" /> : <CaretDownIcon className="size-3.5" />}
                        {t("promotion.holdBack")}
                      </button>
                      {row.open && (
                        <div className="mt-2 rounded-[--radius-md] border border-border p-3">
                          <p className="mb-2 text-xs text-fg-muted">{t("promotion.holdBackHint")}</p>
                          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                            {klass.pupils.map((p) => {
                              const checked = row.holdBack.has(p.membershipId);
                              return (
                                <li key={p.membershipId}>
                                  <label
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm",
                                      checked ? "bg-warn-soft text-fg" : "text-fg-muted hover:bg-surface-muted",
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = new Set(row.holdBack);
                                        if (e.target.checked) next.add(p.membershipId);
                                        else next.delete(p.membershipId);
                                        update(klass.id, { holdBack: next });
                                      }}
                                    />
                                    {p.name}
                                  </label>
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
              <p className="text-sm text-fg">
                {t("promotion.confirm", { moving: totals.moving, leaving: totals.leaving })}
              </p>
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
