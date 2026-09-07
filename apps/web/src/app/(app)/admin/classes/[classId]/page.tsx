import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CertificateIcon,
  ChalkboardTeacherIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listCovers } from "@/lib/register-duty";
import { todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Staffing } from "./staffing";
import { CohortPanel } from "./cohort-panel";
import { listCohort } from "@/lib/cohort";
import { getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classStaffing") };
}

/**
 * Staffing one class.
 *
 * A SEPARATE PAGE FROM THE CLASS LIST, because it answers a different question.
 * The list is "what classes does this school have"; this is "who is responsible
 * for this one". Bolting register duty onto a row in a list would put a
 * safeguarding-shaped decision behind a hover menu.
 */
export default async function ClassStaffingPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const { classId } = await params;

  const klass = await db.class.findFirst({
    // schoolId first and always: a class id typed into the URL from another
    // school is a 404, never somebody else's staffing.
    where: { id: classId, schoolId: ctx.schoolId },
    select: {
      id: true,
      name: true,
      section: true,
      gradeLevel: true,
      subject: true,
      archivedAt: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!klass) notFound();

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });
  const today = todayKey(school.timezone);

  const [assigned, covers, staff, cohort] = await Promise.all([
    db.classTeacher.findMany({
      where: { schoolId: ctx.schoolId, classId },
      select: {
        id: true,
        role: true,
        canTakeAttendance: true,
        teacherMembershipId: true,
        teacher: { select: { user: { select: { name: true, preferredName: true } } } },
      },
      orderBy: { role: "asc" },
    }),
    // Only cover that has not already finished — a list of last term's absences
    // is history, and this page is about what happens next.
    listCovers(ctx, { classId, fromDateKey: today }),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "ADMIN", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
      },
      select: {
        id: true,
        role: true,
        user: { select: { name: true, preferredName: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    listCohort(ctx, classId),
  ]);

  const title = [klass.name, klass.section && !nameCarriesSection(klass.name, klass.section) ? t("classes.section", { section: klass.section }) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("classes.allClasses")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          {klass.gradeLevel ? <span>{t("classes.grade", { grade: klass.gradeLevel })}</span> : null}
          {klass.subject ? <span>· {klass.subject}</span> : null}
          <span>
            ·{" "}
            {klass._count.enrollments === 1
              ? t("classes.studentsOne")
              : t("classes.studentsMany", { count: klass._count.enrollments })}
          </span>
          {klass.archivedAt && (
            <Badge tone="neutral" size="sm">
              {t("classes.archived")}
            </Badge>
          )}
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
          title={t("classes.whoMarks")}
          description={t("classes.whoMarksBody")}
        />
        <CardBody>
          <Staffing
            classId={klass.id}
            today={today}
            teachers={assigned.map((row) => ({
              id: row.id,
              membershipId: row.teacherMembershipId,
              name: row.teacher.user.preferredName ?? row.teacher.user.name,
              role: row.role,
              canTakeAttendance: row.canTakeAttendance,
            }))}
            covers={covers.map((cover) => ({
              id: cover.id,
              name: cover.covering.user.preferredName ?? cover.covering.user.name,
              fromDateKey: cover.fromDateKey,
              toDateKey: cover.toDateKey,
              reason: cover.reason,
              fromLeave: cover.leaveRequestId !== null,
            }))}
            staff={staff.map((person) => ({
              membershipId: person.id,
              name: person.user.preferredName ?? person.user.name,
              role: person.role,
            }))}
          />
        </CardBody>
      </Card>

      {/* Two doors into the teacher's side — report cards and marks — as one
          row of buttons. They were two full-width cards with the same icon
          and the same layout, which read as one control drawn twice and
          pushed the roll below the fold. */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" icon={<CertificateIcon weight="bold" />}>
          <Link href={`/teacher/classes/${klass.id}/report-cards`}>{t("classes.reportCards")}</Link>
        </Button>
        <Button asChild variant="secondary" icon={<CertificateIcon weight="bold" />}>
          <Link href={`/teacher/exams?classId=${klass.id}`}>{t("exams.enterMarks")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("classes.whoIsIn")}
          description={t("classes.onTheRoll", { count: cohort.length })}
        />
        <CardBody>
          <CohortPanel
            classId={klass.id}
            gradeLevel={klass.gradeLevel}
            members={[...cohort]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((member) => ({
              membershipId: member.membershipId,
              name: member.name,
              gradeLevel: member.gradeLevel,
              studentCode: member.studentCode,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
