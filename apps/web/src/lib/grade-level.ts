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
  for (const id of new Set(studentMembershipIds)) {
    const live = await tx.enrollment.findFirst({
      where: { studentMembershipId: id, status: "ACTIVE", class: { archivedAt: null } },
      orderBy: { enrolledAt: "desc" },
      select: { class: { select: { gradeLevel: true } } },
    });
    await tx.membership.update({ where: { id }, data: { gradeLevel: live?.class.gradeLevel ?? null } });
  }
}
