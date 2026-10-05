import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDotsIcon } from "@phosphor-icons/react/ssr";
import { LECTURE_KINDS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop, WeekList, clock, lectureKindLabel } from "@/components/academics/parts";
import { TermPicker } from "@/components/academics/term-picker";
import { academicsStructure, academicsTimetable, listOfferings } from "@/lib/academics";
import { labDivisions } from "@/lib/stream-records";
import { weekdayName } from "@/lib/school-day";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";
import { removeSlotAction, saveSlotAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabTimetable") };
}

/**
 * The term's weekly grid by division, on the college's own bells: each
 * offering's hours, with a clash of faculty, room, division or student, or a
 * room too small, refused when an hour is added.
 */
export default async function TimetablePage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, locale, on, college, canEdit, streams } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const divisionId = one(params.division);
  const [s, o] = await Promise.all([academicsStructure(ctx), listOfferings(ctx, { termId: one(params.termId) })]);
  const grid = await academicsTimetable(ctx, { termId: o.termId ?? undefined, divisionId });
  // Lab batches (stream records, 5 Oct 2026): a LAB hour may be one batch's.
  const batches = (await labDivisions(ctx.schoolId, divisionId)).flatMap((d) => d.batches.map((b) => ({ id: b.id, label: [d.name, t("streamRecords.batchN", { name: b.name })].join(" · ") })));
  const extra = divisionId ? `&division=${divisionId}` : "";
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="timetable" params={params} />
      <TermPicker t={t} terms={s.terms} current={o.termId} path="/admin/academics/timetable" extra={extra} />
      {s.divisions.length ? (
        <nav aria-label={t("academics.fieldDivision")} className="flex flex-wrap gap-2 text-sm">
          <Link href={`/admin/academics/timetable?termId=${o.termId ?? ""}`} className={!divisionId ? "rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-strong" : "rounded-full border border-border px-3 py-1 text-fg-muted"}>{t("academics.allDivisions")}</Link>
          {s.divisions.map((d) => (
            <Link key={d.id} href={`/admin/academics/timetable?termId=${o.termId ?? ""}&division=${d.id}`} className={divisionId === d.id ? "rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-strong" : "rounded-full border border-border px-3 py-1 text-fg-muted"}>{d.name}</Link>
          ))}
        </nav>
      ) : null}
      <Card>
        <CardHeader icon={<CalendarDotsIcon weight="duotone" className="size-5" />} title={t("academics.timetableTitle")} description={t("academics.timetableBody")} />
        <CardBody className="space-y-5">
          {s.periods.length === 0 ? <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noBells")} description={t("academics.noBellsBody")} /> : <WeekList t={t} locale={locale} weekdays={grid.weekdays} cells={grid.cells} streams={streams} />}
          {canEdit && o.termId && o.offerings.length && s.periods.length ? (
            <form action={saveSlotAction} className="grid gap-3 sm:grid-cols-5">
              <input type="hidden" name="termId" value={o.termId} />
              <SelectField label={t("academics.fieldOffering")} name="offeringId" required>
                {o.offerings.map((x) => <option key={x.id} value={x.id}>{`${x.courseCode} · ${x.divisionName ?? t("academics.sharedAcrossDivisions")}`}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldWeekday")} name="weekday" defaultValue="1">
                {grid.weekdays.map((d) => <option key={d} value={d}>{weekdayName(d, locale)}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldPeriod")} name="periodId" required>
                {s.periods.map((p) => <option key={p.id} value={p.id}>{`${p.name} · ${clock(p.startMinute, p.endMinute)}`}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldLectureKind")} name="kind" defaultValue="LECTURE">
                {LECTURE_KINDS.map((k) => <option key={k} value={k}>{lectureKindLabel(k, t, streams)}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldRoom")} name="roomId" defaultValue="">
                <option value="">{t("academics.offeringRoom")}</option>
                {s.rooms.map((r) => <option key={r.id} value={r.id}>{`${r.name} (${r.capacity})`}</option>)}
              </SelectField>
              {batches.length ? (
                <SelectField label={t("streamRecords.fieldLabBatch")} name="labBatchId" defaultValue="" hint={t("streamRecords.fieldLabBatchHint")}>
                  <option value="">{t("streamRecords.wholeDivision")}</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </SelectField>
              ) : null}
              <div>
                <Button type="submit">{t("academics.addHour")}</Button>
              </div>
            </form>
          ) : null}
          {canEdit && grid.cells.length ? (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-fg">{t("academics.removeHours")}</summary>
              <ul className="mt-2 divide-y divide-border">
                {grid.cells.map((c) => (
                  <li key={c.slotId} className="flex items-center justify-between gap-2 py-1.5">
                    <span>{`${weekdayName(c.weekday, locale)} ${clock(c.startMinute, c.endMinute)} · ${c.courseCode}${c.divisionName ? ` · ${c.divisionName}` : ""}${c.labBatchName ? ` · ${t("streamRecords.batchN", { name: c.labBatchName })}` : ""}`}</span>
                    <form action={removeSlotAction}>
                      <input type="hidden" name="termId" value={o.termId ?? ""} />
                      <input type="hidden" name="slotId" value={c.slotId} />
                      <Button type="submit" size="sm" variant="ghost">{t("academics.remove")}</Button>
                    </form>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
