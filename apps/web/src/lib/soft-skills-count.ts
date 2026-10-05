import "server-only";
import { softSkillsCompleted } from "@edulink/contracts";
import { db } from "./db";

/**
 * WHO HAS COMPLETED WHICH SOFT-SKILLS TRAINING (R-2, 5 Oct 2026), read from
 * the marks each time and stored nowhere: the cell's student list, the
 * student's placement profile and the trainings' own pages all count through
 * here and `softSkillsCompleted` (packages/contracts v1/placement-events.ts).
 * Kept apart from soft-skills.ts so placement.ts can read it without a cycle.
 */
export type Completion = { trainingId: string; title: string; skill: string };

export async function softSkillsCompletions(schoolId: string, studentIds: readonly string[]): Promise<Map<string, Completion[]>> {
  const out = new Map<string, Completion[]>();
  if (studentIds.length === 0) return out;
  const trainings = await db.softSkillsTraining.findMany({
    where: { schoolId },
    select: { id: true, title: true, skill: true, minAttendancePercent: true, _count: { select: { sessions: { where: { cancelledAt: null } } } } },
  });
  if (trainings.length === 0) return out;
  const marks = await db.softSkillsAttendance.findMany({
    where: { schoolId, present: true, studentMembershipId: { in: [...studentIds] }, session: { cancelledAt: null } },
    select: { studentMembershipId: true, session: { select: { trainingId: true } } },
  });
  const attended = new Map<string, number>();
  for (const m of marks) {
    const key = `${m.studentMembershipId}|${m.session.trainingId}`;
    attended.set(key, (attended.get(key) ?? 0) + 1);
  }
  for (const id of studentIds) {
    for (const t of trainings) {
      if (!softSkillsCompleted(attended.get(`${id}|${t.id}`) ?? 0, t._count.sessions, t.minAttendancePercent)) continue;
      (out.get(id) ?? out.set(id, []).get(id)!).push({ trainingId: t.id, title: t.title, skill: t.skill });
    }
  }
  return out;
}
