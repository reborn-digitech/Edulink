import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BooksIcon, CalendarCheckIcon, ChartBarIcon, ChatCircleDotsIcon, FileTextIcon, ClipboardTextIcon, FirstAidKitIcon, UsersThreeIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { requireRole, assertClassAccess, AccessError, teachesClass } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getAttendanceSummary } from "@/lib/attendance";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { listGradeCategories } from "@/lib/grading";
import { healthFlagsFor } from "@/lib/health";
import { openIncidentCounts } from "@/lib/incidents";
import { ClassCode } from "./class-code";
import { GradeWeights } from "./weights";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.klass") };
}

const RANGE_DAYS = 28;

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");
  const { classId } = await params;
  const { filter: rawFilter } = await searchParams;
  const filter = rawFilter === "concern" || rawFilter === "noguardian" ? rawFilter : null;

  let klass;
  try {
    klass = await assertClassAccess(ctx, classId);
  } catch (error) {
    // A class in another school, or one this teacher does not teach, is a 404.
    if (error instanceof AccessError) notFound();
    throw error;
  }
  // A teacher the timetable alone sends here (owner's item 1, 27 Oct 2026): their own work in the class,
  // and none of the register, the report cards, the join code or the weights, which stay its form teacher's.
  const teaching = (await teachesClass(ctx, classId)) ?? { formTeacher: true, subjects: [] };
  const formTeacher = teaching.formTeacher;
  const mine = formTeacher ? {} : { authorMembershipId: ctx.membershipId };

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
      where: { classId, schoolId: ctx.schoolId, ...mine },
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
      where: { schoolId: ctx.schoolId, status: "SUBMITTED", assignment: { classId, ...mine } },
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
  // The tiles are the filters: a "3 of concern" that you cannot press is a
  // number to scan forty rows for.
  const shownRoster =
    filter === "concern" ? ofConcern : filter === "noguardian" ? roster.filter((r) => !r.hasGuardian) : roster;

  // The one-glance health flags: an allergy, a condition or a medicine on
  // a pupil's card is a chip beside the name, and the card is on the person
  // page the name opens.
  // The health card is the class's own teachers' (owner's item 1): no flags for a teacher the timetable alone sends here.
  const healthFlags = formTeacher ? await healthFlagsFor(ctx.schoolId, roster.map((r) => r.membershipId)) : new Map<string, never>();
  const anyFlagged = roster.some((r) => healthFlags.has(r.membershipId));
  // An open incident is a chip too: a fall not yet followed up is something
  // the next lesson's teacher should see before the name is called.
  const openIncidents = await openIncidentCounts(klass.schoolId, roster.map((r) => r.membershipId));

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
      <PageHeader
        back={{ href: "/teacher/classes", label: t("teacher.myClasses") }}
        title={
          <>
            <span
              aria-hidden="true"
              className="h-8 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: klass.color ?? "var(--accent)" }}
            />
            {klass.name}
          </>
        }
        description={
          <>
            {roster.length} student{roster.length === 1 ? "" : "s"}
            {klass.subject ? ` · ${klass.subject}` : ""}
            {klass.room ? ` · Room ${klass.room}` : ""}
          </>
        }
        actions={
          formTeacher ? (
            <Button asChild>
              <Link href={`/teacher/attendance?classId=${klass.id}`}>
                {todaySession ? t("teacher.editTodaysRegister") : t("teacher.takeRegister")}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/teacher/assignments/new?classId=${klass.id}`}>{t("teacher.setWork")}</Link>
            </Button>
          )
        }
      />

      {!formTeacher ? (
        <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm text-fg-muted">
          {t("subjectWork.notFormClass", { subjects: teaching.subjects.join(", ") })}
        </p>
      ) : null}


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {formTeacher ? (
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
        ) : null}
        <StatTile
          label={t("teacher.toMark")}
          value={ungraded}
          tone={ungraded > 0 ? "warn" : "neutral"}
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          hint={ungraded === 0 ? t("teacher.nothingWaiting") : t("teacher.handedInNotMarked")}
        />
        <Link href={filter === "concern" ? `/teacher/classes/${klass.id}` : `/teacher/classes/${klass.id}?filter=concern#roster`} className={`block rounded-[var(--radius-lg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${filter === "concern" ? "ring-2 ring-accent" : ""}`} aria-current={filter === "concern" ? "true" : undefined}>
          <StatTile
            label={t("teacher.attendanceConcern")}
            value={ofConcern.length}
            tone={ofConcern.length > 0 ? "warn" : "ok"}
            icon={<WarningCircleIcon weight="duotone" className="size-5" />}
            hint={t("teacher.belowNinety", { days: RANGE_DAYS })}
          />
        </Link>
        <Link href={filter === "noguardian" ? `/teacher/classes/${klass.id}` : `/teacher/classes/${klass.id}?filter=noguardian#roster`} className={`block rounded-[var(--radius-lg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${filter === "noguardian" ? "ring-2 ring-accent" : ""}`} aria-current={filter === "noguardian" ? "true" : undefined}>
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
        </Link>
      </div>

      {/* Report cards and the marks grid, as one row of buttons — they were
          two full-width cards that read as one control drawn twice. */}
      <div className="flex flex-wrap gap-2">
        {formTeacher ? (
          <Button asChild variant="secondary">
            <Link href={`/teacher/classes/${klass.id}/report-cards`}>{t("teacher.reportCards")}</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href={`/teacher/exams?classId=${klass.id}`}>{t("exams.enterMarks")}</Link>
        </Button>
        <Button asChild variant="secondary" icon={<BooksIcon weight="bold" />}>
          <Link href={`/teacher/classes/${klass.id}/syllabus`}>{t("syllabus.openSyllabus")}</Link>
        </Button>
        <Button asChild variant="secondary" icon={<ChartBarIcon weight="bold" />}>
          <Link href={`/teacher/classes/${klass.id}/analytics`}>{t("classAnalytics.open")}</Link>
        </Button>
      </div>

      {formTeacher ? <ClassCode joinCode={klass.joinCode} className={klass.name} /> : null}

      {/* ---------------- roster ---------------- */}
      <Card id="roster" className="scroll-mt-24">
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("teacher.whoIsInClass")}
          description={t("teacher.attendanceOver", { days: RANGE_DAYS })}
        />
        <CardBody>
          {anyFlagged && <p className="mb-2 text-xs text-fg-muted">{t("health.flagsHint")}</p>}
          {roster.length > 0 && shownRoster.length === 0 ? (
            <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
          ) : roster.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title={t("teacher.nobodyJoined")}
              description={t("teacher.shareCodeBlurb")}
            />
          ) : (
            <ul className="divide-y divide-border">
              {shownRoster.map((student) => (
                <li key={student.membershipId} className="flex items-center gap-3 py-2.5">
                  <Avatar avatarKey={student.avatarKey} name={student.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <PersonLink membershipId={student.membershipId} name={student.name} className="truncate text-sm font-medium text-fg" />
                      {(openIncidents.get(student.membershipId) ?? 0) > 0 && (
                        <Badge tone="warn" size="sm">
                          {t("incidents.openChip", { count: openIncidents.get(student.membershipId)! })}
                        </Badge>
                      )}
                      {healthFlags.get(student.membershipId)?.allergies && (
                        <Badge tone="warn" size="sm">
                          {t("health.flagAllergy")}
                        </Badge>
                      )}
                      {healthFlags.get(student.membershipId)?.conditions && (
                        <Badge tone="warn" size="sm">
                          {t("health.flagCondition")}
                        </Badge>
                      )}
                      {healthFlags.get(student.membershipId)?.medications && (
                        <Badge tone="warn" size="sm">
                          {t("health.flagMedication")}
                        </Badge>
                      )}
                    </span>
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

                  <Link
                    href={`/incidents/new?student=${student.membershipId}`}
                    aria-label={t("incidents.recordFor", { name: student.name })}
                    title={t("incidents.recordFor", { name: student.name })}
                    className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <FirstAidKitIcon weight="bold" className="size-5" aria-hidden="true" />
                  </Link>

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

      {formTeacher ? (
        <GradeWeights
          classId={classId}
          initial={weights.map((w) => ({ name: w.name, weightBps: w.weightBps }))}
          categoriesInUse={categoriesInUse}
        />
      ) : null}
    </div>
  );
}
