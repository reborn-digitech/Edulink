import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";

/**
 * The UDISE+-shaped enrolment summary: a row per grade with class and pupil
 * counts, plus how many pupils have a guardian linked and how many teachers
 * serve the grade — the aggregate numbers an annual return asks for, with no
 * child named in the file at all.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");

    const classes = await db.class.findMany({
      where: { schoolId: ctx.schoolId, archivedAt: null },
      select: {
        gradeLevel: true,
        teachers: { select: { teacherMembershipId: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            student: {
              select: { guardianships: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 } },
            },
          },
        },
      },
    });

    type Row = { classes: number; pupils: number; withGuardian: number; teachers: Set<string> };
    const byGrade = new Map<string, Row>();
    for (const klass of classes) {
      const grade = klass.gradeLevel ?? "ungraded";
      const row = byGrade.get(grade) ?? { classes: 0, pupils: 0, withGuardian: 0, teachers: new Set() };
      row.classes += 1;
      row.pupils += klass.enrollments.length;
      row.withGuardian += klass.enrollments.filter((e) => e.student.guardianships.length > 0).length;
      for (const t of klass.teachers) row.teachers.add(t.teacherMembershipId);
      byGrade.set(grade, row);
    }

    const rows = [...byGrade.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]))
      .map(([grade, row]) => ({
        grade_level: grade,
        classes: row.classes,
        pupils_enrolled: row.pupils,
        pupils_with_guardian_linked: row.withGuardian,
        teachers_assigned: row.teachers.size,
      }));

    const csv = toCsv(rows, [
      "grade_level",
      "classes",
      "pupils_enrolled",
      "pupils_with_guardian_linked",
      "teachers_assigned",
    ]);

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "compliance.export",
      meta: { kind: "enrolment", rows: rows.length },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="edulink-enrolment-${stamp}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[enrolment export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
