import "server-only";
import { isCollegeKind, STUDENT_CONSENT_GRANTS, type InstitutionKind, type StudentConsentGrant } from "@edulink/contracts";
import { db } from "./db";
import { listContexts } from "./session";
import { isMinorToday } from "./student-consent";
import { AccessError } from "./access-error";
import { assertGuardianAccess } from "./tenancy";

/**
 * WHICH CHILD A FAMILY PAGE OPENS ON, AND WHAT IT MAY SAY (DS-1 of the stream
 * demos' walk, fixed 10 October 2026).
 *
 * Every family page used to open on `children[0]` and call the guardianship
 * check with no grant. At a college that check refuses an adult child whatever
 * they have granted (default-deny, student-consent.ts), and a refusal that
 * reaches a page's render is the app's 404 — so a guardian whose first-claimed
 * child is an adult at a college got "not found" on /parent and nine more
 * pages, while `?child=<the minor twin>` answered 200 on every one.
 *
 * Now a family page asks here for the children WITH what each one lets the
 * guardian see, opens on the requested child or else the first one the
 * guardian may read at all (a minor, a pupil at a school, or an adult with any
 * grant on), and asks `childAccess` for the page's own grant: a refusal comes
 * back as a value, and the page draws "Not shared with you" (not-shared.tsx)
 * instead of vanishing. The guardianship check itself is unchanged and is
 * still the fence; this only decides what to draw when it says no.
 *
 * WHICH GRANT COVERS WHICH PAGE, where the row left it to decide:
 *   /parent/timetable   ATTENDANCE (the week is what the register is taken
 *                       against, and the lecture attendance already opens on it)
 *   /parent/practice    RESULTS (quiz progress is learning results)
 *   /parent/library     MONEY (what a guardian needs from it is the dues)
 *   /parent/transport, /parent/hostel  HOSTEL_TRANSPORT (their libraries' own)
 *   /parent/health, /parent/incidents, /parent/certificates  no grant: an
 *                       adult's card, incident log and papers are their own
 *                       (campaign S-2 decided it for the papers; the adult
 *                       reads the card and the log on /student/health and
 *                       /student/incidents, DS-5). A grant for them is the
 *                       owner's call; until then the page says so.
 */

export type FamilyChildRow = Awaited<ReturnType<typeof listContexts>>["children"][number];

export type FamilyChild = FamilyChildRow & {
  /** The child's institution is a college (COLLEGE or AUTONOMOUS_COLLEGE). */
  college: boolean;
  /** Not a minor today on the institution's calendar. */
  adult: boolean;
  /** The grants ask: an adult at a college. Elsewhere the guardian sees everything. */
  guarded: boolean;
  /** What the guardian may see: every grant where none is asked, else the ones on. */
  grants: StudentConsentGrant[];
  /** Whether any family page can show this child to the guardian at all. */
  readable: boolean;
};

export const FAMILY_PAGE_GRANT = {
  timetable: "ATTENDANCE",
  practice: "RESULTS",
  library: "MONEY",
  transport: "HOSTEL_TRANSPORT",
  hostel: "HOSTEL_TRANSPORT",
} as const satisfies Record<string, StudentConsentGrant>;

/** The children of a guardian, each with what it lets the guardian see. The order is listContexts' (first claimed first). */
export async function familyChildren(parentUserId: string): Promise<FamilyChild[]> {
  const { children } = await listContexts(parentUserId);
  if (children.length === 0) return [];
  const rows = await db.membership.findMany({
    where: { id: { in: children.map((c) => c.studentMembershipId) } },
    select: { id: true, user: { select: { birthdate: true, isMinor: true } }, school: { select: { kind: true, timezone: true } } },
  });
  const facts = new Map(rows.map((m) => [m.id, { college: isCollegeKind(m.school.kind), adult: !isMinorToday(m.user, m.school.timezone) }]));
  const guardedIds = children.map((c) => c.studentMembershipId).filter((id) => {
    const f = facts.get(id);
    return Boolean(f && f.college && f.adult);
  });
  // What each adult child has granted THIS guardian's own link (TA-555): another guardian's grants are not theirs.
  const consents =
    guardedIds.length > 0
      ? await db.studentConsent.findMany({ where: { studentMembershipId: { in: guardedIds }, revokedAt: null, guardianship: { parentUserId, status: "ACTIVE" } }, select: { studentMembershipId: true, grant: true } })
      : [];
  const on = new Map<string, StudentConsentGrant[]>();
  for (const row of consents) {
    const list = on.get(row.studentMembershipId) ?? [];
    if ((STUDENT_CONSENT_GRANTS as readonly string[]).includes(row.grant)) list.push(row.grant as StudentConsentGrant);
    on.set(row.studentMembershipId, list);
  }
  return children.map((c) => {
    const f = facts.get(c.studentMembershipId) ?? { college: false, adult: false };
    const guarded = f.college && f.adult;
    const grants = guarded ? STUDENT_CONSENT_GRANTS.filter((g) => (on.get(c.studentMembershipId) ?? []).includes(g)) : [...STUDENT_CONSENT_GRANTS];
    return { ...c, college: f.college, adult: f.adult, guarded, grants, readable: !guarded || grants.length > 0 };
  });
}

/**
 * The child a page is about: the one asked for when it is this guardian's
 * (whatever it lets them see — the page then says "not shared"), else the
 * first the guardian may read who is still enrolled, else the first the
 * guardian may read, else the first there is. Null with no child.
 *
 * Still enrolled first (QA-52, QA campaign of 24 October 2026): a pupil who
 * moved schools is two guardianships, the first claimed at the school they
 * left, so every sign-in opened on "… left Sunrise Public School" while the
 * child's current school was a chip away. The departed one stays in the
 * switcher; fees-family.ts and agenda.ts already chose this way.
 */
export function pickChild<T extends { studentMembershipId: string; readable: boolean; leftAt?: Date | string | null }>(children: readonly T[], requestedId?: string | null): T | null {
  if (requestedId) {
    const asked = children.find((c) => c.studentMembershipId === requestedId);
    if (asked) return asked;
  }
  return children.find((c) => c.readable && !c.leftAt) ?? children.find((c) => c.readable) ?? children[0] ?? null;
}

export type ChildLink = Awaited<ReturnType<typeof assertGuardianAccess>>;

/**
 * The page's guardianship check as a value: the link when the guardian may
 * read what `grant` guards (or everything, where no grant is asked), or the
 * refusal when an adult at a college has not granted it. Not this guardian's
 * child at all is still thrown, as before: that is a 404, not a state.
 */
export async function childAccess(parentUserId: string, studentMembershipId: string, grant?: StudentConsentGrant): Promise<{ link: ChildLink; refused: null } | { link: null; refused: AccessError }> {
  try {
    return { link: await assertGuardianAccess(parentUserId, studentMembershipId, grant), refused: null };
  } catch (error) {
    if (error instanceof AccessError && error.key === "consent.refuseNotGranted") return { link: null, refused: error };
    throw error;
  }
}

/**
 * The kinds of the institutions a guardian's children are at (DS-4): a
 * family's menu hides a school-only entry only when no child is at a school.
 * Guardianship rows carry the school and no policy, so this reads before any
 * tenant is set, as listContexts does.
 */
export async function institutionKindsForFamily(parentUserId: string): Promise<InstitutionKind[]> {
  const links = await db.guardianship.findMany({ where: { parentUserId, status: "ACTIVE" }, select: { studentSchoolId: true } });
  const ids = [...new Set(links.map((l) => l.studentSchoolId))];
  if (ids.length === 0) return [];
  const schools = await db.school.findMany({ where: { id: { in: ids } }, select: { kind: true } });
  return [...new Set(schools.map((s) => s.kind as InstitutionKind))];
}
