import type { Metadata } from "next";
import { ExamIcon, SirenIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { examSquadDesk } from "@/lib/duty-desks";
import { db } from "@/lib/db";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { squadVisitAction } from "../actions";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.examSquad.title") };
}

/**
 * THE EXAM FLYING SQUAD'S DESK (5 Oct 2026): the papers being sat and about
 * to be with their halls, the squad's visits — logged here by a member
 * holding the duty; one that found something tells the exam controllers — and
 * the cases of unfair means the exam cell entered, with their decision. The
 * office, the head and the exam controller read. lib/duty-desks.ts.
 */
export default async function ExamSquadPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, moduleOn } = await dutyPageContext("EXAM_SQUAD", "EXAMS", ["ADMIN", "PRINCIPAL", "EXAM_CONTROLLER"]);
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff page module="EXAMS" t={t} college />;
  const params = await searchParams;
  const [d, school] = await Promise.all([examSquadDesk(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const when = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: school.timezone }).format(new Date(iso));
  const holder = ctx.role === "FACULTY" || ctx.role === "HOD";
  const halls = d.papers.flatMap((p) => (p.halls.length ? p.halls.map((h) => ({ value: `${p.scheduleId}|${h.id}`, label: [p.courseCode, h.name, when(p.at)].join(" · ") })) : [{ value: `${p.scheduleId}|`, label: [p.courseCode, when(p.at)].join(" · ") }]));
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.examSquad.title")} description={t("duties.examSquad.intro")} />
      <RecordsFlash t={t} params={params} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.examSquad.statPapers")} value={d.papers.length} />
        <StatTile label={t("duties.examSquad.statVisits")} value={d.visits.length} />
        <StatTile label={t("duties.examSquad.statFlagged")} value={d.visits.filter((v) => v.flagged).length} tone={d.visits.some((v) => v.flagged) ? "warn" : "neutral"} />
        <StatTile label={t("duties.examSquad.statOpenCases")} value={d.cases.filter((c) => !c.decided).length} />
      </div>

      <Card>
        <CardHeader icon={<ExamIcon weight="duotone" className="size-5" />} title={t("duties.examSquad.papersTitle")} description={t("duties.examSquad.papersBody")} />
        <CardBody className="space-y-4">
          {d.papers.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t("duties.examSquad.noPapers")}
              description={t("duties.examSquad.noPapersBody")}
              action={
                // The exam cell schedules the papers (5 Oct 2026, the UX pass): its way on for those who open it.
                ctx.role === "ADMIN" || ctx.role === "PRINCIPAL" || ctx.role === "EXAM_CONTROLLER" ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/exam-cell">{t("examCell.title")}</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.papers.map((p) => (
                <li key={p.scheduleId} className="py-2">
                  <span className="font-medium text-fg">{[p.courseCode, p.courseName].join(" · ")}</span>
                  <span className="text-fg-muted"> · {t("duties.examSquad.paperLine", { session: p.sessionName, when: when(p.at), halls: p.halls.map((h) => h.name).join(", ") || "—", visits: p.visits })}</span>
                </li>
              ))}
            </ul>
          )}
          {holder && halls.length > 0 ? (
            <form action={squadVisitAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <SelectField name="hall" label={t("duties.examSquad.fieldHall")} required>
                {halls.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </SelectField>
              <TextField name="members" label={t("duties.examSquad.fieldMembers")} maxLength={300} />
              <TextField name="note" label={t("duties.examSquad.fieldNote")} maxLength={1000} className="sm:col-span-2" />
              <CheckboxField name="flagged" label={t("duties.examSquad.fieldFlagged")} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit">{t("duties.examSquad.logVisit")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<SirenIcon weight="duotone" className="size-5" />} title={t("duties.examSquad.visitsTitle")} description={t("duties.examSquad.visitsBody")} />
        <CardBody>
          {d.visits.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.examSquad.noVisits")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.visits.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-fg">{t("duties.examSquad.visitLine", { course: v.courseCode, hall: v.hallName ?? "—", when: when(v.at), by: v.byName })}</span>
                  {v.flagged ? <Badge tone="warn">{t("duties.examSquad.flagged")}</Badge> : <Badge tone="ok">{t("duties.examSquad.clear")}</Badge>}
                  {v.note ? <span className="text-fg-muted">— {v.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<WarningIcon weight="duotone" className="size-5" />} title={t("duties.examSquad.casesTitle")} description={t("duties.examSquad.casesBody")} />
        <CardBody>
          {d.cases.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.examSquad.noCases")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.cases.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-fg">{t("duties.examSquad.caseLine", { course: c.courseCode, session: c.sessionName, day: formatDateKey(c.reportedOn, { dateStyle: "medium" }, locale), student: c.studentName })}</span>
                  {c.decided ? <Badge tone="neutral">{t("duties.examSquad.decided")}</Badge> : <Badge tone="warn">{t("duties.examSquad.pending")}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
