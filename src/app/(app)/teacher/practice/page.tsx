import type { Metadata } from "next";
import Link from "next/link";
import { BrainIcon, FlagIcon, CheckCircleIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { normaliseLanguage, SUBJECT_KEY, TIER_NAMES, MAX_LEVEL, type QuizSubject } from "@/lib/quiz";
import {
  classPracticeHeatmap,
  assignmentsForClass,
  classWeekly,
  classGapAlerts,
} from "@/lib/practice-insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { setPractice, removePractice } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("practice.teacherTitle") };
}

/**
 * Practice insights for a teacher: where the class stands, chapter by rung —
 * COUNTS, never rankings — and the chapters they have set, with attainment
 * derived live from the same mastery the child sees. Nothing here is marked
 * by hand and nothing can be, which is the point: the ladder already proved
 * every answer.
 */
export default async function TeacherPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; error?: string }>;
}) {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const { classId: requested, error } = await searchParams;

  const classes = await db.class.findMany({
    where: {
      schoolId: ctx.schoolId!,
      archivedAt: null,
      teachers: { some: { teacherMembershipId: ctx.membershipId! } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, gradeLevel: true },
  });

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("practice.teacherTitle")}
        </h1>
        <EmptyState
          icon={<BrainIcon weight="duotone" className="size-8" />}
          title={t("practice.teacherTitle")}
          description={t("teacher.noClassesYet")}
        />
      </div>
    );
  }

  const selected = classes.find((c) => c.id === requested) ?? classes[0]!;
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const [heatmap, assignments, weekly, gaps] = await Promise.all([
    classPracticeHeatmap(ctx, selected.id, language),
    assignmentsForClass(ctx, selected.id, language),
    classWeekly(ctx, selected.id),
    classGapAlerts(ctx, selected.id, language),
  ]);

  // Chapters offered for assignment: the class's own grade when it names one,
  // every grade otherwise — a Grade 5 form group should not scroll past
  // Class 12 integrals to set fractions homework.
  const grade = Number.parseInt(selected.gradeLevel ?? "", 10);
  const topicOptions = await db.quizTopic.findMany({
    where: Number.isInteger(grade) ? { classLevel: grade } : {},
    orderBy: [{ classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
    select: { slug: true, name: true, subject: true, classLevel: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("practice.teacherTitle")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t("practice.teacherIntro")}</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/teacher/worksheets">{t("worksheets.title")}</Link>
        </Button>
      </div>

      {classes.length > 1 && (
        <nav aria-label={t("nav.classes")} className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/practice?classId=${c.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                selected.id === c.id ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}

      {/* ---- this week, at a glance ---- */}
      {weekly.pupilCount > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={`${weekly.practiced}/${weekly.pupilCount}`} label={t("practice.weeklyPracticed")} />
          <StatTile value={String(weekly.answers)} label={t("practice.weeklyAnswers")} />
          <StatTile value={String(weekly.climbs)} label={t("practice.weeklyClimbs")} />
          <StatTile value={String(weekly.misses)} label={t("practice.weeklyMisses")} />
        </div>
      )}

      {/* ---- where the class is stuck ---- */}
      {gaps.length > 0 && (
        <Card>
          <CardHeader
            icon={<WarningIcon weight="duotone" className="size-5" />}
            title={t("practice.gapsTitle")}
            description={t("practice.gapsHint")}
          />
          <CardBody className="space-y-2">
            {gaps.map((gap) => (
              <p key={gap.slug} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-fg">
                  {gap.name}
                  <span className="ml-2 text-xs text-fg-muted">
                    {subjectName(gap.subject)}
                  </span>
                </span>
                <span className="text-fg-muted">
                  {t("practice.gapsStuck", { count: gap.stuckCount, level: gap.level })}
                </span>
              </p>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<BrainIcon weight="duotone" className="size-5" />}
          title={t("practice.heatmapTitle")}
          description={t("practice.heatmapHint")}
        />
        <CardBody className="overflow-x-auto p-0">
          {heatmap.rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-fg-muted">{t("practice.heatmapEmpty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="px-4 py-2 font-medium">{t("practice.colChapter")}</th>
                  {Array.from({ length: MAX_LEVEL }, (_, i) => (
                    <th key={i} className="px-2 py-2 text-center font-medium">
                      L{i + 1}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-medium">{t("practice.colPupils")}</th>
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map((row) => (
                  <tr key={row.slug} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-fg">{row.name}</span>
                      <span className="ml-2 text-xs text-fg-muted">
                        {subjectName(row.subject)}
                      </span>
                    </td>
                    {row.atLevel.map((n, i) => (
                      <td key={i} className="px-2 py-2.5 text-center">
                        {n > 0 ? (
                          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-strong">
                            {n}
                          </span>
                        ) : (
                          <span className="text-fg-muted">·</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right text-fg-muted">
                      {row.tried}/{heatmap.pupilCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<FlagIcon weight="duotone" className="size-5" />}
          title={t("practice.setTitle")}
          description={t("practice.setHint")}
        />
        <CardBody>
          <form action={setPractice} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="classId" value={selected.id} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldChapter")}</span>
              <select
                name="topicSlug"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              >
                {topicOptions.map((topic) => (
                  <option key={topic.slug} value={topic.slug}>
                    {Number.isInteger(grade) ? "" : `${t("practice.classN", { n: topic.classLevel })} · `}
                    {subjectName(topic.subject)} ·{" "}
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldTarget")}</span>
              <select
                name="targetLevel"
                required
                defaultValue="3"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    L{i + 1} · {TIER_NAMES[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldNote")}</span>
              <input
                type="text"
                name="note"
                maxLength={200}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldDue")}</span>
              <input
                type="date"
                name="dueAt"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">{t("practice.setSubmit")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<CheckCircleIcon weight="duotone" className="size-5" />}
          title={t("practice.assignmentsTitle")}
        />
        <CardBody className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("practice.assignmentsEmpty")}</p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-fg">{a.topicName}</p>
                    <p className="text-xs text-fg-muted">
                      {t("practice.assignedTarget", { tier: a.targetTierName, level: a.targetLevel })}
                      {a.dueAt ? ` · ${formatDate(a.dueAt)}` : ""}
                      {a.note ? ` · ${a.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-fg">
                      {t("practice.reachedCount", { reached: a.reached, total: a.pupilCount })}
                    </span>
                    <form action={removePractice}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="classId" value={selected.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        {t("practice.remove")}
                      </Button>
                    </form>
                  </div>
                </div>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {a.pupils.map((p) => (
                    <li
                      key={p.name}
                      className="flex items-center justify-between rounded px-2 py-1 text-sm odd:bg-surface-muted/50"
                    >
                      <span className="text-fg">{p.name}</span>
                      {p.reached ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                          <CheckCircleIcon weight="fill" className="size-3.5" />
                          L{p.level}
                        </span>
                      ) : (
                        <span className="text-xs text-fg-muted">{p.level > 0 ? `L${p.level}` : "—"}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[--radius-md] border border-border bg-surface p-3.5">
      <p className="text-xl font-bold tabular-nums text-fg">{value}</p>
      <p className="mt-0.5 text-xs text-fg-muted">{label}</p>
    </div>
  );
}
