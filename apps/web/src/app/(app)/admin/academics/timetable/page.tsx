import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDotsIcon } from "@phosphor-icons/react/ssr";
import { LECTURE_KINDS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LECTURE_KIND_KEY, OfficeTop, WeekList, clock } from "@/components/academics/parts";
import { TermPicker } from "@/components/academics/term-picker";
import { academicsStructure, academicsTimetable, listOfferings } from "@/lib/academics";
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
  const { ctx, t, locale, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const divisionId = one(params.division);
  const [s, o] = await Promise.all([academicsStructure(ctx), listOfferings(ctx, { termId: one(params.termId) })]);
  const grid = await academicsTimetable(ctx, { termId: o.termId ?? undefined, divisionId });
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
          {s.periods.length === 0 ? <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noBells")} description={t("academics.noBellsBody")} /> : <WeekList t={t} locale={locale} weekdays={grid.weekdays} cells={grid.cells} />}
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
                {LECTURE_KINDS.map((k) => <option key={k} value={k}>{t(LECTURE_KIND_KEY[k]!)}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldRoom")} name="roomId" defaultValue="">
                <option value="">{t("academics.offeringRoom")}</option>
                {s.rooms.map((r) => <option key={r.id} value={r.id}>{`${r.name} (${r.capacity})`}</option>)}
              </SelectField>
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
                    <span>{`${weekdayName(c.weekday, locale)} ${clock(c.startMinute, c.endMinute)} · ${c.courseCode}${c.divisionName ? ` · ${c.divisionName}` : ""}`}</span>
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
