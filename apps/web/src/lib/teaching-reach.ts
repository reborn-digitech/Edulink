import "server-only";
import { db } from "./db";
import type { Role } from "./constants";
import { taughtClasses, type ClassTeaching } from "./tenancy";

/**
 * What a member of staff's class lists are built on (owner's item 1, 27 Oct
 * 2026): the classes they teach and how, the work of those classes that is
 * theirs to see, and the subjects a new piece of work may name in each.
 *
 * The office reaches every living class whole. A TEACHER reaches their form
 * classes whole and the classes the timetable sends them to for their own
 * subjects (tenancy.ts taughtClasses) — and, in the latter, only the work
 * they set there, the same line assertAssignmentAccess draws, so a list
 * never offers a row whose gradebook would answer "not found".
 */
export type Reach = Map<string, ClassTeaching>;

export async function classReach(ctx: { schoolId: string; membershipId: string; role: Role }): Promise<Reach> {
  if (ctx.role === "ADMIN") {
    const all = await db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true } });
    return new Map(all.map((c) => [c.id, { formTeacher: true, subjects: [] }]));
  }
  return taughtClasses(ctx.schoolId, ctx.membershipId);
}

/** The Assignment `where` for the work a reach may list: every piece in a form class, one's own in a timetable-only class. */
export function workInReach(membershipId: string, reach: Reach) {
  const whole = [...reach].filter(([, r]) => r.formTeacher).map(([id]) => id);
  const own = [...reach].filter(([, r]) => !r.formTeacher).map(([id]) => id);
  if (own.length === 0) return { classId: { in: whole } };
  return { OR: [{ classId: { in: whole } }, { classId: { in: own }, authorMembershipId: membershipId }] };
}

/**
 * The subjects a new piece of work may name in each class: a timetable-only
 * teacher's own there; a form teacher's own first, then the rest of the
 * class's timetable; every subject of the class's timetable for the office.
 * In the order the week meets them.
 */
export async function offeredSubjects(schoolId: string, reach: Reach, classIds: string[]): Promise<Map<string, string[]>> {
  const wholeIds = classIds.filter((id) => reach.get(id)?.formTeacher);
  const slots = wholeIds.length
    ? await db.timetableSlot.findMany({ where: { schoolId, classId: { in: wholeIds } }, select: { classId: true, subject: true }, orderBy: [{ weekday: "asc" }, { period: { position: "asc" } }] })
    : [];
  const out = new Map<string, string[]>();
  for (const id of classIds) {
    const r = reach.get(id);
    if (!r) continue;
    const list = [...r.subjects];
    if (r.formTeacher) {
      for (const slot of slots) {
        if (slot.classId !== id) continue;
        const s = slot.subject.trim().replace(/\s+/g, " ");
        if (s && !list.some((x) => x.toLowerCase() === s.toLowerCase())) list.push(s);
      }
    }
    out.set(id, list);
  }
  return out;
}

/**
 * Classes as a teacher reads them: by grade number, then by name with its numbers read as numbers (qb-B, QB-05 of
 * the QA pass of 31 October 2026: a sort by name put "Grade 10 · A" before "Grade 3 · A" in every picker). A class
 * with no grade comes after those with one. Returns a new array.
 */
const GRADE_ORDER = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
export function inGradeOrder<T extends { name: string; gradeLevel?: string | null }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const ga = a.gradeLevel?.trim() || null;
    const gb = b.gradeLevel?.trim() || null;
    if (ga !== gb) {
      if (ga === null) return 1;
      if (gb === null) return -1;
      const byGrade = GRADE_ORDER.compare(ga, gb);
      if (byGrade !== 0) return byGrade;
    }
    return GRADE_ORDER.compare(a.name, b.name);
  });
}
