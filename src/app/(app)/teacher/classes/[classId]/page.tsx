import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  ChatCircleDotsIcon,
  FileTextIcon,
  ClipboardTextIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole, assertClassAccess, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getAttendanceSummary } from "@/lib/attendance";
import { addDaysToKey, relativeTime, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { listGradeCategories } from "@/lib/grading";
import { ClassCode } from "./class-code";
import { GradeWeights } from "./weights";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.klass") };
}

const RANGE_DAYS = 28;

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");
  const { classId } = await params;

  let klass;
  try {
    klass = await assertClassAccess(ctx, classId);
  } catch (error) {
    // A class in another school, or one this teacher does not teach, is a 404.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });
  const today = todayKey(school.timezone);
  const from = addDaysToKey(today, -RANGE_DAYS);

  const [enrollments, todaySession, assignments, ungraded] = await Promise.all([
    db.enrollment.findMany({
      where: { classId, status: "ACTIVE" },
      include: {
        student: {
          include: {
            user: { select: { name: true, preferredName: true, avatarKey: true } },
            guardianships: { where: { status: "ACTIVE" }, select: { id: true } },
          },
        },
      },
    }),
    db.attendanceSession.findUnique({
      where: { classId_dateKey: { classId, dateKey: today } },
      select: { takenAt: true, _count: { select: { records: true } } },
    }),
    db.assignment.findMany({
      where: { classId, schoolId: ctx.schoolId },
      select: {
        id: true,
        title: true,
        dueAt: true,
        publishedAt: true,
        _count: { select: { grades: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    db.submission.count({
      where: { schoolId: ctx.schoolId, status: "SUBMITTED", assignment: { classId } },
    }),
  ]);

  // One attendance summary per student. Fine for a class-sized roster; if this
  // ever needs to run over a whole school, it wants a single grouped query.
  const roster = await Promise.all(
    enrollments.map(async (enrollment) => {
      const summary = await getAttendanceSummary(
        ctx.schoolId,
        enrollment.studentMembershipId,
        from,
        today,
      );
      return {
        membershipId: enrollment.studentMembershipId,
        name: enrollment.student.user.preferredName ?? enrollment.student.user.name,
        fullName: enrollment.student.user.name,
        avatarKey: enrollment.student.user.avatarKey,
        percent: summary.percent,
        absences: summary.counts.ABSENT,
        hasGuardian: enrollment.student.guardianships.length > 0,
      };
    }),
  );

  roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const withoutGuardian = roster.filter((r) => !r.hasGuardian).length;
  // Below 90% is the threshold most schools act on.
  const ofConcern = roster.filter((r) => r.percent !== null && r.percent < 90);

  const [weights, usedCategories] = await Promise.all([
    listGradeCategories(ctx, classId),
    db.assignment.findMany({
      where: { classId, schoolId: ctx.schoolId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);
  const categoriesInUse = usedCategories
    .map((a) => a.category!)
    .filter((c) => c.trim().length > 0)
    .sort();

  return (
    <div className="space-y-5">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("teacher.myClasses")}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-12 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: klass.color ?? "var(--accent)" }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{klass.name}</h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              {roster.length} student{roster.length === 1 ? "" : "s"}
              {klass.subject ? ` · ${klass.subject}` : ""}
              {klass.room ? ` · Room ${klass.room}` : ""}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/teacher/attendance?classId=${klass.id}`}>
            {todaySession ? t("teacher.editTodaysRegister") : t("teacher.takeRegister")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("teacher.registerToday")}
          value={todaySession ? t("teacher.done") : t("teacher.toDo")}
          tone={todaySession ? "ok" : "warn"}
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={
            todaySession
              ? t("teacher.markedAgo", { count: todaySession._count.records, when: relativeTime(todaySession.takenAt) })
              : t("teacher.nobodyMarkedYet")
          }
        />
        <StatTile
          label={t("teacher.toMark")}
          value={ungraded}
          tone={ungraded > 0 ? "warn" : "neutral"}
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          hint={ungraded === 0 ? t("teacher.nothingWaiting") : t("teacher.handedInNotMarked")}
        />
        <StatTile
          label={t("teacher.attendanceConcern")}
          value={ofConcern.length}
          tone={ofConcern.length > 0 ? "warn" : "ok"}
          icon={<WarningCircleIcon weight="duotone" className="size-5" />}
          hint={t("teacher.belowNinety", { days: RANGE_DAYS })}
        />
        <StatTile
          label={t("teacher.noGuardian")}
          value={withoutGuardian}
          tone={withoutGuardian > 0 ? "warn" : "ok"}
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          hint={
            withoutGuardian === 0
              ? t("teacher.everyChildLinked")
              : t("teacher.nobodyReceivesNotifs")
          }
        />
      </div>

      {/* The class teacher writes this class's report cards. Offered here
          because this is the page they are already on when the term ends. */}
      <Card>
        <Link
          href={`/teacher/classes/${klass.id}/report-cards`}
          className="flex items-center gap-3 p-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-fg">{t("teacher.reportCards")}</span>
            <span className="block text-xs text-fg-muted">
              {t("teacher.reportCardsBlurb")}
            </span>
          </span>
        </Link>
      </Card>

      <ClassCode joinCode={klass.joinCode} className={klass.name} />

      {/* ---------------- roster ---------------- */}
      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("teacher.whoIsInClass")}
          description={t("teacher.attendanceOver", { days: RANGE_DAYS })}
        />
        <CardBody>
          {roster.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title={t("teacher.nobodyJoined")}
              description={t("teacher.shareCodeBlurb")}
            />
          ) : (
            <ul className="divide-y divide-border">
              {roster.map((student) => (
                <li key={student.membershipId} className="flex items-center gap-3 py-2.5">
                  <Avatar avatarKey={student.avatarKey} name={student.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{student.name}</p>
                    <p className="truncate text-xs text-fg-muted">{student.fullName}</p>
                  </div>

                  {!student.hasGuardian && (
                    <Badge tone="warn" size="sm">
                      {t("teacher.noGuardian")}
                    </Badge>
                  )}

                  <span className="shrink-0 text-right">
                    <span
                      className={
                        student.percent === null
                          ? "block text-sm text-fg-subtle"
                          : student.percent >= 95
                            ? "block text-sm font-bold tabular-nums text-ok"
                            : student.percent >= 90
                              ? "block text-sm font-bold tabular-nums text-warn"
                              : "block text-sm font-bold tabular-nums text-danger"
                      }
                    >
                      {student.percent === null ? "—" : `${student.percent}%`}
                    </span>
                    {student.absences > 0 && (
                      <span className="block text-xs text-fg-muted">
                        {student.absences} absence{student.absences === 1 ? "" : "s"}
                      </span>
                    )}
                  </span>

                  <Button asChild size="sm" variant="ghost" className="shrink-0">
                    <Link href={`/reports/${student.membershipId}`}>
                      <FileTextIcon weight="bold" className="size-4" />
                      <span className="sr-only">Progress report for {student.name}</span>
                    </Link>
                  </Button>

                  <Button asChild size="sm" variant="ghost" className="shrink-0">
                    <Link href={`/remarks/new?student=${student.membershipId}`}>
                      <ChatCircleDotsIcon weight="bold" className="size-4" />
                      <span className="sr-only">{t("teacher.messageGuardiansOf", { name: student.name })}</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------- recent work ---------------- */}
      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("teacher.recentWork")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href={`/teacher/assignments/new?classId=${klass.id}`}>{t("teacher.setWork")}</Link>
            </Button>
          }
        />
        <CardBody>
          {assignments.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              {t("teacher.nothingSetYet")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {assignment.title}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {assignment.dueAt ? t("teacher.dueWhen", { when: relativeTime(assignment.dueAt) }) : t("teacher.noDueDate")}
                        {" · "}
                        {assignment._count.grades} of {roster.length} marked
                      </span>
                    </span>
                    {!assignment.publishedAt && (
                      <Badge tone="warn" size="sm">
                        {t("teacher.draft")}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <GradeWeights
        classId={classId}
        initial={weights.map((w) => ({ name: w.name, weightBps: w.weightBps }))}
        categoriesInUse={categoriesInUse}
      />
    </div>
  );
}
