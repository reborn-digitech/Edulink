import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BooksIcon, ChartBarIcon, NotePencilIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listPlanTemplates, staffSyllabus } from "@/lib/syllabus";
import { formatDateKey, todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { LessonForm } from "./lesson-form";
import { LessonStatusControl, UnitStatusControl } from "./progress-controls";
import { ApplyTemplatePanel, SaveTemplateButton } from "./template-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("syllabus.metaTitle") };
}

const UNIT_STATUS_KEY: Record<"NOT_STARTED" | "IN_PROGRESS" | "DONE", TranslationKey> = { NOT_STARTED: "syllabus.notStarted", IN_PROGRESS: "syllabus.inProgress", DONE: "syllabus.done" };
const UNIT_STATUS_TONE = { NOT_STARTED: "neutral", IN_PROGRESS: "accent", DONE: "ok" } as const;
const LESSON_STATUS_KEY: Record<"PLANNED" | "TAUGHT" | "SKIPPED", TranslationKey> = { PLANNED: "syllabus.planned", TAUGHT: "syllabus.taught", SKIPPED: "syllabus.skipped" };
const LESSON_STATUS_TONE = { PLANNED: "neutral", TAUGHT: "ok", SKIPPED: "warn" } as const;

/**
 * A class's syllabus for one subject: the grade's chapters with where this
 * class is on each, the lessons planned and taught, and the form for the
 * next one. The class's teachers and the office reach it — the head's
 * coverage table links here — and a class this teacher does not teach is a
 * 404, the same as the class page.
 */
export default async function ClassSyllabusPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ subject?: string }> }) {
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const { classId } = await params;
  const { subject: wantedSubject } = await searchParams;

  let view;
  try {
    view = await staffSyllabus(ctx, { classId, subject: wantedSubject?.slice(0, 60) || undefined });
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  // The school's templates for this subject, for the "copy one in" panel beside the plan form.
  const templates = view.subject ? (await listPlanTemplates(ctx, { subject: view.subject })).items : [];
  const subjectHref = (s: string) => `/teacher/classes/${view.classId}/syllabus?subject=${encodeURIComponent(s)}`;
  const day = (key: string) => formatDateKey(key, { weekday: "short", day: "numeric", month: "short" }, locale);
  const doneCount = view.units.filter((u) => u.status === "DONE").length;
  const chaptersHint = [t("syllabus.done"), t("syllabus.unitsCount", { count: view.units.length })].join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/teacher/classes/${view.classId}`, label: view.className }}
        title={view.subject ? t("syllabus.classTitle", { className: view.className, subject: view.subject }) : view.className}
        description={t("syllabus.lessonsHint")}
      />

      {view.subjects.length === 0 ? (
        <EmptyState icon={<BooksIcon weight="duotone" className="size-6" />} title={t("syllabus.noSubjects")} />
      ) : (
        <>
          {/* ---- the subject tabs ---- */}
          <nav aria-label={t("syllabus.subject")} className="overflow-x-auto" tabIndex={0}>
            <ul className="flex gap-2">
              {view.subjects.map((s) => {
                const current = s === view.subject;
                return (
                  <li key={s} className="shrink-0">
                    <Link
                      href={subjectHref(s)}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${current ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
                    >
                      {s}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ---- where the class is ---- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <StatTile
              label={t("syllabus.status")}
              value={view.percent === null ? "—" : `${view.percent}%`}
              tone={view.percent === null ? "neutral" : view.percent === 100 ? "ok" : "accent"}
              icon={<ChartBarIcon weight="duotone" className="size-5" />}
              hint={view.percent === null ? t("syllabus.noUnitsForClass") : t("syllabus.percentDone", { percent: view.percent })}
            />
            <StatTile label={t("syllabus.chapters")} value={`${doneCount}/${view.units.length}`} hint={chaptersHint} icon={<BooksIcon weight="duotone" className="size-5" />} />
          </div>

          {/* ---- the chapters ---- */}
          <Card>
            <CardHeader icon={<BooksIcon weight="duotone" className="size-5" />} title={t("syllabus.chapters")} description={view.subject ?? undefined} />
            <CardBody>
              {view.units.length === 0 ? (
                <EmptyState className="border-0 bg-transparent py-6" title={t("syllabus.noUnitsForClass")} description={t("syllabus.noUnitsForClassBody")} />
              ) : (
                <ol className="divide-y divide-border">
                  {view.units.map((unit) => (
                    <li key={unit.id} className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap">
                      <span className="w-6 shrink-0 pt-0.5 text-right text-sm tabular-nums text-fg-muted" aria-hidden="true">
                        {unit.position}.
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-fg">{unit.title}</span>
                          <Badge tone={UNIT_STATUS_TONE[unit.status]} size="sm">
                            {t(UNIT_STATUS_KEY[unit.status])}
                          </Badge>
                        </p>
                        <p className="text-xs text-fg-muted">
                          {[
                            unit.periodsPlanned !== null ? `${t("syllabus.periodsPlanned")} ${unit.periodsPlanned}` : null,
                            `${t("syllabus.lessons")} ${unit.lessons}`,
                            unit.status === "DONE" && unit.doneOn ? t("syllabus.doneOn", { date: day(unit.doneOn) }) : null,
                            unit.status !== "NOT_STARTED" && unit.byName ? t("syllabus.doneBy", { name: unit.byName }) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {view.canEdit && (
                        <div className="w-full shrink-0 sm:w-auto">
                          <UnitStatusControl classId={view.classId} unitId={unit.id} title={unit.title} status={unit.status} />
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          {/* ---- the lessons ---- */}
          {view.subject && (
            <Card>
              <CardHeader icon={<NotePencilIcon weight="duotone" className="size-5" />} title={t("syllabus.lessons")} description={t("syllabus.lessonsHint")} />
              <CardBody className="space-y-5">
                {view.canEdit && (
                  <section aria-label={t("syllabus.planLesson")} className="rounded-[--radius-md] border border-border p-3.5">
                    <h3 className="mb-3 text-sm font-semibold text-fg">{t("syllabus.planLesson")}</h3>
                    <LessonForm key={view.subject} classId={view.classId} subject={view.subject} today={today} units={view.units.map((u) => ({ id: u.id, title: u.title }))} />
                  </section>
                )}
                {view.canEdit && (
                  <section aria-label={t("planTemplates.title")} className="rounded-[--radius-md] border border-border p-3.5">
                    <h3 className="mb-1 text-sm font-semibold text-fg">{t("planTemplates.title")}</h3>
                    <p className="mb-3 text-xs text-fg-muted">{t("planTemplates.hint")}</p>
                    <ApplyTemplatePanel key={`${view.subject}:${templates.length}`} classId={view.classId} templates={templates} units={view.units.map((u) => ({ id: u.id, title: u.title }))} today={today} />
                  </section>
                )}

                {view.lessons.length === 0 ? (
                  <p className="py-4 text-center text-sm text-fg-muted">{t("syllabus.noLessons")}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {view.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs tabular-nums text-fg-muted">{day(lesson.dateKey)}</span>
                            <span className="text-sm font-medium text-fg">{lesson.topic}</span>
                            <Badge tone={LESSON_STATUS_TONE[lesson.status]} size="sm">
                              {t(LESSON_STATUS_KEY[lesson.status])}
                            </Badge>
                          </p>
                          <p className="text-xs text-fg-muted">
                            {[`${t("syllabus.lessonUnit")}: ${lesson.unitTitle ?? t("syllabus.lessonNoUnit")}`, t("syllabus.byTeacher", { name: lesson.teacherName })].join(" · ")}
                          </p>
                          {lesson.notes && <p className="whitespace-pre-line text-sm text-fg">{lesson.notes}</p>}
                          {lesson.homework && (
                            <p className="text-sm text-fg">
                              <span className="font-medium">{t("syllabus.lessonHomework")}:</span> {lesson.homework}
                            </p>
                          )}
                        </div>
                        {view.canEdit && (
                          <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:items-end">
                            <LessonStatusControl lessonId={lesson.id} topic={lesson.topic} status={lesson.status} />
                            <SaveTemplateButton lessonId={lesson.id} topic={lesson.topic} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
