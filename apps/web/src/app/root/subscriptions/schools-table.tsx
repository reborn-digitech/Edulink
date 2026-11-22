"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckSquareIcon, XIcon } from "@phosphor-icons/react";
import type { BulkAction, PartTermsBody } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableScroll } from "@/components/ui/table-scroll";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "@/lib/navigation";
import { useT } from "@/lib/i18n";
import { bulkAction, premiumSwitchAction } from "./actions";
import { Said, Sheet } from "./sheet";
import { usePendingWrites } from "./pending-writes";
import { PremiumSwitch } from "./premium-switch";

/** The terms a row showed, sent back with a switch so a stale row is refused (compare-and-set). */
type Seen = { termsSetAt: string | null; premiumStudents: boolean; premiumTeachers: boolean; subscription: PartTermsBody; premium: PartTermsBody };

/** One school's row, its words worded by the server (the page): only the switches and the choosing are this component's. */
export type SchoolRow = {
  id: string;
  name: string;
  college: boolean;
  termsSet: boolean;
  pays: string | null;
  premium: string;
  students: boolean;
  teachers: boolean;
  renews: string | null;
  state: string;
  tone: "ok" | "info" | "warn" | "danger" | "neutral";
  seen: Seen;
};

type Role = "students" | "teachers";
type Moved = { on: boolean; rows: SchoolRow[] };

/**
 * THE SCHOOLS TAB'S TABLE (§2.1; the coordinating session's C5). A premium switch, drawn as a switch, turned on shows the
 * server's sentence in a toast with Undo and is written only when the toast goes (onCommit, TA-216), or at once should the
 * page be hidden or left first (C5 point 1); turned off, a sheet with the server's sentence first. Schools are chosen for one
 * change over them all (the sticky bar): premium on for students or teachers (a toast with Undo, the chosen rows turning as
 * one switch would), off (a sheet), or our prices for both parts (a sheet naming each school's terms before); the confirm
 * writes the schools its preview named. Pause is never in the bar. A refusal because the terms changed meanwhile refreshes
 * the list (C5 point 2).
 */
export function SchoolsTable({ rows }: { rows: SchoolRow[] }) {
  const t = useT();
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const hold = usePendingWrites();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  // A switch shown moved: kept until the list is drawn again from the server (the review, C4), so it never flicks back.
  const [moved, setMoved] = useState<Record<string, Moved>>({});
  const [off, setOff] = useState<{ row: SchoolRow; role: Role; sentence: string } | null>(null);
  const [bulk, setBulk] = useState<{ action: "OFF" | "OUR_PRICES"; role: Role; sentence: string | null; reason: string; schoolIds: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Rows whose toast is still on the screen: their switches wait, so a second press cannot cross the first's commit.
  const [waiting, setWaiting] = useState<Set<string>>(new Set());
  const wait = (ids: string[], on: boolean) =>
    setWaiting((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const key = (id: string, role: Role) => `${id}:${role}`;
  const isOn = (row: SchoolRow, role: Role) => {
    const m = moved[key(row.id, role)];
    return m && m.rows === rows ? m.on : row[role];
  };
  const show = (ids: string[], role: Role, on: boolean | null) =>
    setMoved((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (on === null) delete next[key(id, role)];
        else next[key(id, role)] = { on, rows };
      }
      return next;
    });
  const failed = (message: string) => toast({ tone: "danger", title: t("root.didNotWork"), description: message, duration: null });
  /** A refusal: its sentence, and, where the terms changed meanwhile, the list drawn again from the server (C5 point 2). */
  const refused = (result: { error: string; stale?: boolean }, say: (message: string) => void = failed) => {
    say(result.error);
    if (result.stale) router.refresh();
  };

  function flip(row: SchoolRow, role: Role) {
    const on = !isOn(row, role);
    startTransition(async () => {
      const preview = await premiumSwitchAction(row.id, { role, on, seen: row.seen, preview: true });
      if (!preview.ok) return refused(preview);
      if (!on) {
        setError(null);
        setOff({ row, role, sentence: preview.sentence });
        return;
      }
      show([row.id], role, true);
      wait([row.id], true);
      let toastId = "";
      const write = hold(
        () => {
          void premiumSwitchAction(row.id, { role, on: true, seen: row.seen, preview: false }).then((saved) => {
            wait([row.id], false);
            if (!saved.ok) {
              show([row.id], role, null);
              return refused(saved);
            }
            router.refresh();
          });
        },
        // The page hidden or left before the toast goes: the same switch to the terms door, with the terms the preview was
        // reckoned against, the note included (a row shows none), as the action itself would send them.
        () => ({ url: `/api/v1/operator/schools/${row.id}/terms`, method: "PUT", body: { premium: { [role]: true }, expect: preview.expect } }),
        {
          onSending: () => dismiss(toastId),
          onSent: (ok) => {
            wait([row.id], false);
            if (!ok) {
              show([row.id], role, null);
              failed(t("subs.earlyNotSaved"));
            }
            router.refresh();
          },
        },
      );
      toastId = toast({
        tone: "ok",
        title: preview.sentence,
        onUndo: () => {
          write.undo();
          show([row.id], role, null);
          wait([row.id], false);
        },
        onCommit: write.commit,
      });
    });
  }

  function confirmOff() {
    if (!off) return;
    const { row, role } = off;
    startTransition(async () => {
      const saved = await premiumSwitchAction(row.id, { role, on: false, seen: row.seen, preview: false });
      if (!saved.ok) return refused(saved, setError);
      setOff(null);
      toast({ tone: "ok", title: saved.sentence });
      router.refresh();
    });
  }

  const ids = rows.filter((r) => chosen.has(r.id)).map((r) => r.id);
  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function bulkOn(role: Role) {
    const action: BulkAction = role === "students" ? "STUDENTS_ON" : "TEACHERS_ON";
    const schoolIds = ids;
    startTransition(async () => {
      const preview = await bulkAction({ schoolIds, action, preview: true });
      if (!preview.ok) return refused(preview);
      // Nothing to change: said, with no Undo for an act that does nothing (the review, B7).
      if (!preview.changed) {
        toast({ tone: "neutral", title: preview.sentence });
        return;
      }
      // The chosen rows turn while the Undo is up, as one switch would (the review, C7).
      const turning = schoolIds.filter((id) => !rows.find((r) => r.id === id)?.college || role === "students");
      show(turning, role, true);
      wait(schoolIds, true);
      let toastId = "";
      const write = hold(
        () => {
          void bulkAction({ schoolIds, action }).then((saved) => {
            wait(schoolIds, false);
            if (!saved.ok) {
              show(turning, role, null);
              return refused(saved);
            }
            setChosen(new Set());
            router.refresh();
          });
        },
        () => ({ url: "/api/v1/operator/subscriptions/bulk", method: "POST", body: { schoolIds, action } }),
        {
          onSending: () => dismiss(toastId),
          onSent: (ok) => {
            wait(schoolIds, false);
            if (ok) setChosen(new Set());
            else {
              show(turning, role, null);
              failed(t("subs.earlyNotSaved"));
            }
            router.refresh();
          },
        },
      );
      toastId = toast({
        tone: "ok",
        title: preview.sentence,
        onUndo: () => {
          write.undo();
          show(turning, role, null);
          wait(schoolIds, false);
        },
        onCommit: write.commit,
      });
    });
  }

  function previewBulk(action: "OFF" | "OUR_PRICES", role: Role) {
    setError(null);
    const real: BulkAction = action === "OUR_PRICES" ? "OUR_PRICES" : role === "students" ? "STUDENTS_OFF" : "TEACHERS_OFF";
    // The schools this preview names are the ones its confirm writes (the review, C3).
    const schoolIds = ids;
    setBulk((b) => ({ action, role, sentence: null, reason: b?.reason ?? "", schoolIds }));
    startTransition(async () => {
      const preview = await bulkAction({ schoolIds, action: real, preview: true });
      if (!preview.ok) return refused(preview, setError);
      // The reason as typed meanwhile is kept: only the sentence is the answer's.
      setBulk((b) => (b ? { ...b, sentence: preview.sentence } : b));
    });
  }

  function confirmBulk() {
    if (!bulk) return;
    const real: BulkAction = bulk.action === "OUR_PRICES" ? "OUR_PRICES" : bulk.role === "students" ? "STUDENTS_OFF" : "TEACHERS_OFF";
    startTransition(async () => {
      const saved = await bulkAction({ schoolIds: bulk.schoolIds, action: real, ...(bulk.reason.trim() ? { reason: bulk.reason.trim() } : {}) });
      if (!saved.ok) return refused(saved, setError);
      setBulk(null);
      setChosen(new Set());
      toast({ tone: "ok", title: saved.sentence });
      router.refresh();
    });
  }

  function switchCell(row: SchoolRow, role: Role) {
    if (role === "teachers" && row.college) {
      return (
        <span title={t("subs.collegeNoTeachers")} className="text-fg-subtle">
          —
        </span>
      );
    }
    return (
      <PremiumSwitch
        on={isOn(row, role)}
        label={t(role === "students" ? "subs.switchStudents" : "subs.switchTeachers", { school: row.name })}
        disabled={pending || waiting.has(row.id)}
        onToggle={() => flip(row, role)}
        testId={`premium-${role}-${row.id}`}
      />
    );
  }

  const cancel = () => {
    setOff(null);
    setBulk(null);
    setError(null);
  };

  return (
    <>
      <TableScroll label={t("subs.tableLabel")}>
        <table className="w-full text-sm" data-testid="subscriptions-table">
          <thead>
            {/* The columns as §2.1 draws them, under the two parts' names (C5 point 7). */}
            <tr className="text-left text-xs font-semibold text-fg-muted">
              <th scope="col" rowSpan={2} className="w-11 py-2 pr-2 align-bottom">
                <span className="sr-only">{t("subs.colSchool")}</span>
              </th>
              <th scope="col" rowSpan={2} className="py-2 pr-3 align-bottom">
                {t("subs.colSchool")}
              </th>
              <th scope="colgroup" className="border-b border-border pt-2 pr-3">
                {t("subs.colGroupSubscription")}
              </th>
              <th scope="colgroup" colSpan={3} className="border-b border-border pt-2 pr-3">
                {t("subs.colGroupPremium")}
              </th>
              <th scope="col" rowSpan={2} className="py-2 pr-3 align-bottom">
                {t("subs.colRenews")}
              </th>
              <th scope="col" rowSpan={2} className="py-2 align-bottom">
                {t("subs.colState")}
              </th>
            </tr>
            <tr className="border-b border-border text-left text-xs font-semibold text-fg-muted">
              <th scope="col" className="py-2 pr-3">
                {t("subs.colPrice")}
              </th>
              <th scope="col" className="py-2 pr-3">
                {t("subs.colStudents")}
              </th>
              <th scope="col" className="py-2 pr-3">
                {t("subs.colTeachers")}
              </th>
              <th scope="col" className="py-2 pr-3">
                {t("subs.colPremiumPrice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 align-middle">
                <td className="py-1 pr-2">
                  <label className="grid size-11 place-items-center">
                    <input type="checkbox" checked={chosen.has(row.id)} onChange={() => toggle(row.id)} aria-label={t("subs.choose", { school: row.name })} className="size-5 accent-accent" />
                  </label>
                </td>
                <td className="py-2 pr-3 font-medium text-fg">
                  <Link href={`/root/${row.id}#subscription`} className="hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  {row.pays ? (
                    <Link href={`/root/${row.id}?sheet=subscription#subscription`} className="text-fg hover:underline">
                      {row.pays}
                    </Link>
                  ) : (
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="warn" size="sm">
                        {t("subs.badgeTermsNotSet")}
                      </Badge>
                      <Link href={`/root/${row.id}?sheet=subscription#subscription`} className="text-xs font-semibold text-accent-strong hover:underline">
                        {t("subs.setTerms")}
                      </Link>
                    </span>
                  )}
                </td>
                <td className="py-1 pr-3">{switchCell(row, "students")}</td>
                <td className="py-1 pr-3">{switchCell(row, "teachers")}</td>
                <td className="py-2 pr-3 text-xs text-fg-muted">
                  <Link href={`/root/${row.id}?sheet=premium#subscription`} className="hover:underline">
                    {row.premium}
                  </Link>
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-xs">{row.renews ?? <span className="text-fg-subtle">{t("root.subscriptionNotRecorded")}</span>}</td>
                <td className="py-2">
                  <Badge tone={row.tone} size="sm">
                    {row.state}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      {ids.length > 0 && (
        <div role="region" aria-label={ids.length === 1 ? t("subs.bulkChosenOne") : t("subs.bulkChosenMany", { count: ids.length })} className="sticky bottom-20 z-30 flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-lg lg:bottom-4" data-testid="subscriptions-bulk">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <CheckSquareIcon weight="fill" className="size-5 text-accent" />
            {ids.length === 1 ? t("subs.bulkChosenOne") : t("subs.bulkChosenMany", { count: ids.length })}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulkOn("students")}>
              {t("subs.bulkStudentsOn")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulkOn("teachers")}>
              {t("subs.bulkTeachersOn")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => previewBulk("OFF", "students")}>
              {t("subs.bulkPremiumOff")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => previewBulk("OUR_PRICES", "students")}>
              {t("subs.bulkOurPrices")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChosen(new Set())} icon={<XIcon weight="bold" />}>
              {t("subs.bulkClear")}
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={off !== null}
        title={off ? t(off.role === "students" ? "subs.offTitleStudents" : "subs.offTitleTeachers", { school: off.row.name }) : ""}
        onClose={cancel}
        testId="premium-off-sheet"
        footer={
          <>
            <Button variant="ghost" onClick={cancel}>
              {t("common.cancel")}
            </Button>
            <Button loading={pending} onClick={confirmOff}>
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Said sentence={off?.sentence ?? null} />
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </Sheet>

      <Sheet
        open={bulk !== null}
        title={bulk?.action === "OUR_PRICES" ? t("subs.bulkOursTitle") : t("subs.bulkOffTitle")}
        onClose={cancel}
        testId="bulk-sheet"
        footer={
          <>
            <Button variant="ghost" onClick={cancel}>
              {t("common.cancel")}
            </Button>
            <Button loading={pending} disabled={!bulk?.sentence} onClick={confirmBulk}>
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        {bulk?.action === "OFF" && (
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{t("subs.bulkOffTitle")}</legend>
            {(["students", "teachers"] as const).map((role) => (
              <Button key={role} size="sm" variant={bulk.role === role ? "primary" : "secondary"} aria-pressed={bulk.role === role} onClick={() => previewBulk("OFF", role)}>
                {t(role === "students" ? "subs.bulkOffForStudents" : "subs.bulkOffForTeachers")}
              </Button>
            ))}
          </fieldset>
        )}
        <Said sentence={bulk?.sentence ?? null} />
        {bulk && <TextField label={t("subs.reasonOptional")} hint={t("subs.reasonSchoolReads")} value={bulk.reason} maxLength={500} onChange={(e) => setBulk({ ...bulk, reason: e.target.value })} />}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </Sheet>
    </>
  );
}
