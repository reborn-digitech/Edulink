import "server-only";
import { db } from "./db";
import { forSchool } from "./tenant-context";
import { isCollegeKind } from "./institution";
import { ROLE_HOME, type Role } from "./constants";

/**
 * WHERE A PERSON LANDS: the role's home (ROLE_HOME), but a college's head lands on the college's own dashboard.
 *
 * QA-57 (QA campaign of 24 October 2026): /principal is the school's dashboard, and it sends a college's head on to
 * /principal/college — inside the section's loading boundary, so the browser drew the skeleton and then navigated a
 * second time, about nine seconds on the dev server at every sign-in. The places that send a person home after they
 * sign in or switch ask here, so the head goes to the college's dashboard at once; /principal keeps its redirect for a
 * link that still names it. ROLE_HOME stays the gate's idea of a role's home (role-gate.ts), and /principal/college
 * is under it.
 */
export async function homeFor(role: Role, schoolId: string | null | undefined): Promise<string> {
  if (role !== "PRINCIPAL" || !schoolId) return ROLE_HOME[role];
  const school = await forSchool(schoolId, () => db.school.findUnique({ where: { id: schoolId }, select: { kind: true } }));
  return isCollegeKind(school?.kind) ? "/principal/college" : ROLE_HOME[role];
}
