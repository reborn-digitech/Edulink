import "server-only";
import { notFound } from "next/navigation";
import { getSession, type ActiveContext } from "./session";
import { institutionKindOf } from "./modules";
import { isCollegeKind, type InstitutionKind } from "./institution";
import { institutionKindsForFamily } from "./family-child";
import { NAV, hiddenByKind } from "./nav";

/**
 * A SCHOOL'S PAGE IS NOT A COLLEGE'S. A layout that calls notFoundAtCollege answers the app's not-found, for every page
 * under it, to a person whose menu hides the page for the institution's kind (nav.ts, kinds: SCHOOL_KINDS) and to whom
 * the address alone still opened it: the school's admissions since TA-269, and since the owner's word of 15 November
 * 2026 ("Yes, all three") the office's exam series, syllabus and substitutions and the exams page the head, a pupil and
 * a guardian read. A college has its own desks for each (the exam cell, its academics). The doors and actions these
 * pages call are left as they are. Signed out, at a school, or with no kind to read, nothing changes: the page's own
 * role gate answers.
 *
 * The kinds are the menu's own (signed-in-shell.tsx): a guardian's are the kinds of the schools the children are at (a
 * guardian's session carries no school, session.ts), so a family keeps the school's exams page while any child is at a
 * school, as its menu keeps the entry; anyone else's is the active school's kind.
 */
export async function menuKinds(session: ActiveContext | null): Promise<readonly (InstitutionKind | null)[]> {
  if (!session) return [];
  if (session.role === "PARENT") return institutionKindsForFamily(session.user.id);
  return session.schoolId ? [await institutionKindOf(session.schoolId)] : [];
}

/** The app's not-found when every kind the menu reads for this person is a college's (see menuKinds). */
export async function notFoundAtCollege(): Promise<void> {
  const kinds = await menuKinds(await getSession());
  if (kinds.length > 0 && kinds.every((kind) => isCollegeKind(kind))) notFound();
}

/** The role's menu entries hidden for the person's institution kinds, as the shell hides them (nav.ts hiddenByKind). */
export async function kindHiddenHrefs(session: ActiveContext | null): Promise<string[]> {
  if (!session?.role) return [];
  const kinds = (await menuKinds(session)).filter((kind): kind is InstitutionKind => kind !== null);
  return hiddenByKind(NAV[session.role], kinds);
}
