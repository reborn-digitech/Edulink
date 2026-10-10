import "server-only";
import { db } from "../db";
import type { NameEntry } from "./strip";

/** The most people of a school whose names are held for one question; a school larger than this is stripped by its first ones and the shapes. */
const MAX_PEOPLE = 4000;

/**
 * The names stripping looks for (strip.ts): the person's own (→ [YOU]), the school's (→ [SCHOOL]),
 * and the people of the school the conversation is filed under (→ [PERSON_n]) — every member, so a
 * classmate, a teacher or a guardian's other child is caught; a guardian's own children are members of
 * the school too. Read under the request's own tenant: nothing beyond the school the person may read.
 */
export async function nameLexicon(input: { userId: string; schoolId: string }): Promise<NameEntry[]> {
  const [self, school, members] = await Promise.all([
    db.user.findUnique({ where: { id: input.userId }, select: { name: true, preferredName: true } }),
    db.school.findUnique({ where: { id: input.schoolId }, select: { name: true } }),
    db.membership.findMany({ where: { schoolId: input.schoolId, status: { in: ["ACTIVE", "SUSPENDED", "PENDING"] } }, select: { userId: true, user: { select: { name: true, preferredName: true } } }, take: MAX_PEOPLE }),
  ]);
  const out: NameEntry[] = [];
  if (school?.name) out.push({ name: school.name, kind: "SCHOOL" });
  for (const m of members) {
    if (m.userId === input.userId) continue;
    if (m.user.name) out.push({ name: m.user.name, kind: "PERSON" });
    if (m.user.preferredName) out.push({ name: m.user.preferredName, kind: "PERSON" });
  }
  if (self?.name) out.push({ name: self.name, kind: "SELF" });
  if (self?.preferredName) out.push({ name: self.preferredName, kind: "SELF" });
  return out;
}
