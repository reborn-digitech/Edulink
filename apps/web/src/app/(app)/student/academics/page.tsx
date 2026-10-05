import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheckIcon, ChartBarIcon, ChatsCircleIcon, ExamIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { CONDONATION_GROUNDS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK, ModuleFlash, NUM, TD, TH } from "@/components/module-flash";
import { AttendanceTable, CondonationBadge, GROUND_KEY, INTERNAL_KIND_KEY, WeekList, clock, lectureKindLabel } from "@/components/academics/parts";
import { streamsOf } from "@/lib/streams";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { studentAcademics } from "@/lib/academics-homes";
import { getLocale, getT } from "@/lib/i18n/server";
import { askCondonationAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.studentTitle") };
}

/**
 * A student's academics (4 October 2026): today's lectures and the week,
 * attendance per course with how many more may be missed, a condonation
 * ask, internal marks as the HOD releases them, the course files of what I
 * am registered on, and my mentor.
 */
export default async function StudentAcademicsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("STUDENT");
  const [t, locale, streams] = await Promise.all([getT(), getLocale(), streamsOf(ctx.schoolId)]);
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "ACADEMICS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={isCollegeKind(kind)} />;
  const a = await studentAcademics(ctx);
  const term = a.registration.term;
  const short = a.attendance.filter((x) => !x.eligible);
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.studentTitle")} description={a.registration.programme ? `${a.registration.programme.code} · ${t("academics.semesterShort", { semester: a.registration.programme.semester })}${term ? ` · ${term.name}` : ""}` : t("academics.noSeatBody")} />
      <ModuleFlash t={t} params={await searchParams} />
      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("academics.todayLectures")} />
        <CardBody>
          {a.today.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("academics.noLectures")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {a.today.map((c) => (
                <li key={c.slotId}>
                  <span className="tabular-nums text-fg-muted">{clock(c.startMinute, c.endMinute)}</span> <span className="font-medium text-fg">{c.courseCode}</span> <span className="text-fg-muted">{[lectureKindLabel(c.kind, t, streams), c.roomName, c.facultyName].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm">
            <Link className={LINK} href="/student/registration">{t("academics.registrationTitle")}</Link>
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("academics.myAttendance")} description={t("academics.myAttendanceBody")} />
        <CardBody>
          <AttendanceTable t={t} rows={a.attendance} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("academics.condonationsTitle")} description={t("academics.condonationAskBody")} />
        <CardBody className="space-y-4">
          {a.condonations.length ? (
            <ul className="divide-y divide-border text-sm">
              {a.condonations.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-fg">{[c.termName, c.courseCode ?? t("academics.allCourses"), t(GROUND_KEY[c.ground]!)].join(" · ")}</span>
                  <CondonationBadge t={t} c={c} />
                  {c.decisionNote ? <span className="text-fg-muted">{c.decisionNote}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {term && (short.length || a.attendance.length) ? (
            <form action={askCondonationAction} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="termId" value={term.id} />
              <SelectField label={t("academics.fieldCourse")} name="offeringId" defaultValue={short[0]?.offeringId ?? ""}>
                <option value="">{t("academics.allCourses")}</option>
                {a.attendance.map((x) => <option key={x.offeringId} value={x.offeringId}>{`${x.courseCode} · ${x.percent === null ? "—" : `${x.percent}%`}`}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldGround")} name="ground" defaultValue="MEDICAL">
                {CONDONATION_GROUNDS.map((g) => <option key={g} value={g}>{t(GROUND_KEY[g]!)}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldDocument")} name="document" type="file" accept="image/*,application/pdf" />
              <TextAreaField className="sm:col-span-2" label={t("academics.fieldWhy")} name="note" required minLength={4} maxLength={600} rows={3} />
              <div className="self-end">
                <Button type="submit">{t("academics.askCondonation")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ExamIcon weight="duotone" className="size-5" />} title={t("academics.myMarks")} description={t("academics.myMarksBody")} />
        <CardBody className="space-y-4">
          {a.marks.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.marksNone")} description={t("academics.marksNoneBody")} />
          ) : (
            a.marks.map((m) => (
              <div key={m.offeringId}>
                <h3 className="text-sm font-semibold text-fg">{`${m.courseCode} · ${m.courseName}`}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className={TH}>{t("academics.fieldComponent")}</th>
                      <th scope="col" className={`${TH} text-right`}>{t("academics.colMarksOf")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {m.components.map((k) => (
                      <tr key={k.name}>
                        <td className={TD}>{`${k.name} · ${t(INTERNAL_KIND_KEY[k.kind]!)}`}</td>
                        <td className={NUM}>{k.marks === null ? t("academics.absentShort") : `${k.marks} / ${k.maxMarks}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("academics.myWeek")} description={t("academics.myWeekBody")} />
        <CardBody>
          <WeekList t={t} locale={locale} weekdays={a.week.weekdays} cells={a.week.cells} streams={streams} linkFor={(c) => `/student/academics/${c.offeringId}`} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={t("academics.myMentor")} />
        <CardBody className="text-sm">{a.mentor ? t("academics.mentorIs", { name: a.mentor.facultyName, group: a.mentor.groupName }) : <span className="text-fg-muted">{t("academics.noMentor")}</span>}</CardBody>
      </Card>
    </div>
  );
}
