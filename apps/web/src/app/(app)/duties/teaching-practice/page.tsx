import type { Metadata } from "next";
import { ChalkboardTeacherIcon, EyeIcon, BuildingsIcon } from "@phosphor-icons/react/ssr";
import { LESSON_GRADES } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { teachingPracticeDesk } from "@/lib/teaching-practice";
import { db } from "@/lib/db";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { lessonObservationAction, practicePostingAction, practiceSchoolAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.teachingPractice.title") };
}

/**
 * TEACHING PRACTICE (an education college's, 5 Oct 2026): the practice
 * schools, each student teacher's postings with the lessons planned and
 * watched, and how many final-year student teachers have served their weeks
 * (TA-379, TA-475). The coordinator (the duty) and the
 * office keep schools and postings; the coordinator records what they watch;
 * the head reads. lib/teaching-practice.ts.
 */
export default async function TeachingPracticePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, moduleOn } = await dutyPageContext("PRACTICE_TEACHING_COORDINATOR", "ACADEMICS");
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const [d, school] = await Promise.all([teachingPracticeDesk(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const today = todayKey(school.timezone);
  const day = (k: string) => formatDateKey(k, { dateStyle: "medium" }, locale);
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.teachingPractice.title")} description={t("duties.teachingPractice.introServed", { weeks: d.summary.minimumWeeks })} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.teachingPractice.notOffered")}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("streamRecords.statPracticeSchools")} value={d.summary.practiceSchools} />
        <StatTile label={t("streamRecords.statPostings")} value={d.summary.postings} />
        <StatTile label={t("streamRecords.statObserved")} value={`${d.summary.lessonsObserved} / ${d.summary.lessonsPlanned}`} />
        <StatTile label={t("streamRecords.statServedFinalYear")} value={`${d.summary.meetingMinimum} / ${d.summary.students}`} tone={d.summary.meetingMinimum < d.summary.students ? "warn" : "ok"} />
      </div>

      <Card>
        <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("duties.teachingPractice.schoolsTitle")} description={t("duties.teachingPractice.schoolsBody")} />
        <CardBody className="space-y-4">
          {d.schools.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.teachingPractice.noSchools")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.schools.map((s) => (
                <li key={s.id} className="py-2">
                  <span className="font-medium text-fg">{s.name}</span>
                  <span className="text-fg-muted"> · {[s.udise ? t("duties.teachingPractice.udiseLine", { udise: s.udise }) : null, s.contact || null, t("duties.teachingPractice.postingsN", { count: s.postings })].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
          {d.canManage ? (
            <form id="practice-school-form" action={practiceSchoolAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <TextField name="name" label={t("duties.teachingPractice.fieldSchool")} required minLength={2} maxLength={160} />
              <TextField name="udise" label={t("duties.teachingPractice.fieldUdise")} inputMode="numeric" pattern="\d{11}" maxLength={11} hint={t("duties.teachingPractice.udiseHint")} />
              <TextField name="contact" label={t("duties.teachingPractice.fieldContact")} maxLength={200} />
              <div className="sm:col-span-3">
                <Button type="submit" variant="secondary">{t("duties.teachingPractice.addSchool")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("duties.teachingPractice.postingsTitle")} description={t("duties.teachingPractice.postingsBody")} />
        <CardBody className="space-y-4">
          {d.postings.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t("duties.teachingPractice.noPostings")}
              description={t(d.canManage ? "duties.teachingPractice.noPostingsBody" : "duties.teachingPractice.noPostingsRead")}
              action={
                // The way on (5 Oct 2026, the UX pass): to the posting form, or first to a practice school.
                d.canManage ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href={d.schools.length > 0 && d.students.length > 0 ? "#posting-form" : "#practice-school-form"}>{t(d.schools.length > 0 && d.students.length > 0 ? "duties.teachingPractice.addPosting" : "duties.teachingPractice.addSchool")}</a>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {d.postings.map((p) => (
                <li key={p.id} className="space-y-2 py-3" data-posting={p.id}>
                  <p className="text-sm text-fg">
                    <span className="font-semibold">{p.studentName}</span> · {p.practiceSchoolName} · {t("duties.teachingPractice.spanLine", { from: day(p.from), to: day(p.to), weeks: p.weeks, planned: p.lessonsPlanned, observed: p.observations.length })}
                  </p>
                  {p.observations.length > 0 ? (
                    <ul className="text-sm text-fg-muted">
                      {p.observations.map((o) => (
                        <li key={o.id} className="flex flex-wrap items-center gap-1.5">
                          <EyeIcon className="size-4" aria-hidden="true" />
                          {t("duties.teachingPractice.observationLine", { day: day(o.at), observer: o.observerName })}
                          <Badge tone="info">{t("duties.teachingPractice.gradeN", { grade: o.grade })}</Badge>
                          {o.note ? <span>— {o.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {d.canObserve && p.from <= today ? (
                    <form action={lessonObservationAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="postingId" value={p.id} />
                      <DateField name="at" label={t("duties.teachingPractice.fieldLessonDay")} required defaultValue={today < p.to ? today : p.to} min={p.from} max={today < p.to ? today : p.to} className="w-44" />
                      <SelectField name="grade" label={t("duties.teachingPractice.fieldGrade")} required defaultValue="B" className="w-28">
                        {LESSON_GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </SelectField>
                      <TextField name="note" label={t("duties.teachingPractice.fieldNote")} maxLength={1000} className="max-w-sm flex-1" />
                      <Button type="submit" size="sm" variant="secondary">{t("duties.teachingPractice.observe")}</Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {d.canManage && d.schools.length > 0 && d.students.length > 0 ? (
            <form id="posting-form" action={practicePostingAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-5">
              <SelectField name="studentMembershipId" label={t("duties.teachingPractice.fieldStudent")} required>
                {d.students.map((s) => (
                  <option key={s.membershipId} value={s.membershipId}>{`${s.name} (${s.programmeCode})`}</option>
                ))}
              </SelectField>
              <SelectField name="practiceSchoolId" label={t("duties.teachingPractice.fieldSchool")} required>
                {d.schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectField>
              <DateField name="from" label={t("duties.teachingPractice.fieldFrom")} required defaultValue={today} />
              <DateField name="to" label={t("duties.teachingPractice.fieldTo")} required defaultValue={today} />
              <TextField name="lessonsPlanned" type="number" min={0} max={400} label={t("duties.teachingPractice.fieldPlanned")} defaultValue="20" />
              <div className="sm:col-span-2 lg:col-span-5">
                <Button type="submit">{t("duties.teachingPractice.addPosting")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
