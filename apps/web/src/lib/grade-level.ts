import "server-only";
import { db } from "./db";

/**
 * Membership.gradeLevel: the grade of the pupil's live class, kept on the
 * membership so the fee reports, a certificate, the cohort sort and the
 * GRADE message audience can group by it without a join.
 *
 * It is a copy, so it is written here and only here, from every path that
 * changes an enrolment: joining by code or invite, intake, admission, the
 * class roll and promotion. A migration backfilled it for every pupil on a
 * roll; the data-flow audit checks it stays in step.
 */
type Client = Pick<typeof db, "enrollment" | "membership">;

export async function syncGradeLevel(tx: Client, studentMembershipIds: string[]): Promise<void> {
  const ids = [...new Set(studentMembershipIds)];
  if (ids.length === 0) return;
  // ONE READ AND ONE WRITE PER GRADE, not two statements a pupil (TA-202): a whole school's promotion syncs every
  // pupil it moved, inside its transaction. The newest live enrolment of each pupil decides, as it always did.
  const live = await tx.enrollment.findMany({
    where: { studentMembershipId: { in: ids }, status: "ACTIVE", class: { archivedAt: null } },
    orderBy: { enrolledAt: "desc" },
    select: { studentMembershipId: true, class: { select: { gradeLevel: true } } },
  });
  const gradeOf = new Map<string, string | null>();
  for (const e of live) if (!gradeOf.has(e.studentMembershipId)) gradeOf.set(e.studentMembershipId, e.class.gradeLevel);
  const byGrade = new Map<string | null, string[]>();
  for (const id of ids) {
    const grade = gradeOf.get(id) ?? null;
    byGrade.set(grade, [...(byGrade.get(grade) ?? []), id]);
  }
  for (const [gradeLevel, group] of byGrade) await tx.membership.updateMany({ where: { id: { in: group } }, data: { gradeLevel } });
}
