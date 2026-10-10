import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { isMinorOn } from "./adulthood";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { ageInYears } from "./dates";
import type { ActiveContext } from "./session";

/**
 * THE PUPIL'S OWN EYES. The health card and the incident log were written
 * for the family and the school, and "the child does not see it" was the
 * rule (decision 0002, rows 26 and 27) because a nine-year-old's screen is a
 * classroom screen. A sixteen-year-old is a different reader: the school
 * sets one age on School.selfReadAge, and from that age a pupil may read
 * — read only, never write — their own card and their own incidents, as
 * their guardian does. Null means never, which is what every school has
 * until its office decides otherwise.
 *
 * THE AGE IS THE DATE OF BIRTH ON THE ACCOUNT, as the consent age gate
 * already reads it. A pupil with no date of birth on record is refused: the
 * rule cannot be checked, and "allowed because unknown" would be the wrong
 * default for a child's medical card.
 */

export const SELF_READ_AGE_RANGE = { min: 5, max: 25 } as const;

/**
 * THE AGE A NEW COLLEGE STARTS WITH (DS-5 of the stream demos' walk, 10 Oct
 * 2026): a college's students are mostly adults, and an adult asked to "ask a
 * grown-up" for their own health card is wrong, so a college is made with the
 * dial at 18 (`createSchool` and self-registration spread this in); a school
 * still starts at never. And whatever the dial says, an adult at a college
 * reads their own (assertSelfRead below), since the dial exists for minors.
 */
export function selfReadAgeDefault(kind: string | null | undefined): number | null {
  return isCollegeKind(kind) ? 18 : null;
}

type Office = ActiveContext & { schoolId: string; role: "ADMIN" | "PRINCIPAL" };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.notAllowed");
  return ctx as Office;
}

/** The school's dial, for the office and the head. */
export async function selfReadAgeOf(ctx: ActiveContext): Promise<{ selfReadAge: number | null }> {
  const caller = office(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { selfReadAge: true } });
  return { selfReadAge: school.selfReadAge };
}

/** The office sets it; the head reads it. Audited, because it widens who may read a child's card. */
export async function setSelfReadAge(ctx: ActiveContext, selfReadAge: number | null): Promise<{ selfReadAge: number | null }> {
  const caller = office(ctx);
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  if (selfReadAge !== null && (!Number.isInteger(selfReadAge) || selfReadAge < SELF_READ_AGE_RANGE.min || selfReadAge > SELF_READ_AGE_RANGE.max)) {
    throw new AccessError("familyCare.selfReadOutOfRange", "FORBIDDEN", SELF_READ_AGE_RANGE);
  }
  const before = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { selfReadAge: true } });
  if (before.selfReadAge === selfReadAge) return { selfReadAge };
  await db.school.update({ where: { id: caller.schoolId }, data: { selfReadAge } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "school.selfReadAge", targetType: "School", targetId: caller.schoolId, meta: { from: before.selfReadAge, to: selfReadAge } });
  return { selfReadAge };
}

export type SelfReader = { schoolId: string; membershipId: string; studentName: string };

/**
 * Whether this pupil may read their own card and incidents: a STUDENT
 * session, the membership their own, the school's age set, a date of birth
 * on the account, and the pupil at least that old today. Anything else is
 * refused with the same sentence, so a refusal says nothing about why.
 */
export async function assertSelfRead(ctx: ActiveContext, studentMembershipId: string, now: Date = new Date()): Promise<SelfReader> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId || ctx.membershipId !== studentMembershipId) throw new AccessError("access.notAllowed");
  const membership = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE" },
    select: { user: { select: { name: true, preferredName: true, birthdate: true } }, school: { select: { selfReadAge: true, kind: true, timezone: true } } },
  });
  if (!membership) throw new AccessError("access.notAllowed");
  const age = membership.school.selfReadAge;
  // An adult at a college reads their own, dial or no dial (DS-5): the date of birth decides, on the college's calendar day.
  const adultAtCollege = isCollegeKind(membership.school.kind) && membership.user.birthdate !== null && !isMinorOn(membership.user.birthdate, now, membership.school.timezone);
  if (!adultAtCollege) {
    if (age === null || !membership.user.birthdate) throw new AccessError("access.notAllowed");
    if (ageInYears(membership.user.birthdate, now) < age) throw new AccessError("access.notAllowed");
  }
  return { schoolId: ctx.schoolId, membershipId: studentMembershipId, studentName: membership.user.preferredName ?? membership.user.name };
}

/** The same question as a yes or no, for a page deciding between the record and "ask a grown-up". */
export async function maySelfRead(ctx: ActiveContext, studentMembershipId: string, now: Date = new Date()): Promise<boolean> {
  try {
    await assertSelfRead(ctx, studentMembershipId, now);
    return true;
  } catch (error) {
    if (error instanceof AccessError) return false;
    throw error;
  }
}
