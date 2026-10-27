import "server-only";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertCollege, assertModuleOn, institutionKindOf } from "./modules";
import { isCollegeKind } from "./institution";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import type { SchoolModuleCode } from "@edulink/contracts";

/**
 * THE COLLEGE OFFICE'S COMMON GROUND (4 October 2026): who may use its desks,
 * the "is this a college" check every door makes, and the small sums several
 * files share. The desks themselves are college-admissions.ts (module
 * ADMISSIONS), scholarships.ts (module SCHOLARSHIPS), college-fees.ts and
 * accounts.ts (the ACCOUNTS role, no module), no-dues.ts, college-campus.ts
 * (the library, hostel and transport at a college) and college-records.ts
 * (leaving, the college's certificate fields).
 *
 * A COLLEGE DESK AT A SCHOOL ANSWERS NOTHING. Every caller here is checked
 * for an institution of kind COLLEGE or AUTONOMOUS_COLLEGE first, so an
 * ACCOUNTS membership somebody made at a school by hand reaches no college
 * row (tests/college-office.test.ts holds this).
 */

export type Desk = { schoolId: string; userId: string; role: Role; membershipId: string; ctx: ActiveContext };

/** The roles that keep a college's money: the office and the accounts desk. The principal reads. */
export const MONEY_WRITE: readonly Role[] = ["ADMIN", "ACCOUNTS"];
export const MONEY_READ: readonly Role[] = ["ADMIN", "ACCOUNTS", "PRINCIPAL"];

export async function kindOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } }))?.kind ?? "SCHOOL";
}

/**
 * The caller at their college, in one of `roles`, with `module` on when the
 * desk hangs on one. The role is checked before anything is read, so the
 * wrong role is refused whatever it sends; a school (any kind but a college)
 * is refused next, then a module that is off.
 */
export async function collegeDesk(ctx: ActiveContext, roles: readonly Role[], module?: SchoolModuleCode): Promise<Desk> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  if (module) await assertModuleOn(ctx.schoolId, module);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, ctx };
}

/**
 * owner-batch-item5 (27 Oct 2026): A DESK EITHER KIND OF INSTITUTION KEEPS — a month's mess bill, a term's route fees,
 * the library's e-resources and ISBN list, a boarder's room change. At a college it is `collegeDesk` exactly as before
 * (`roles`, then `module`). At a school (or a junior college) the caller must also be one of `schoolRoles` — the school
 * version has no ACCOUNTS desk, so money is the office's alone there — with `module` on. The role is checked before
 * anything is read; the person is bound as the college desk binds them. `college` says which it was, for the audit row.
 */
export async function campusDesk(ctx: ActiveContext, roles: readonly Role[], module: SchoolModuleCode, schoolRoles: readonly Role[] = roles): Promise<Desk & { college: boolean }> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  if (isCollegeKind((await institutionKindOf(ctx.schoolId)) ?? "SCHOOL")) return { ...(await collegeDesk(ctx, roles, module)), college: true };
  if (!schoolRoles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, module);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, ctx, college: false };
}

/** The school version's money writers (owner-batch-item5): the office alone, since ACCOUNTS is offered only to a college (invitableRolesFor). */
export const SCHOOL_MONEY_WRITE: readonly Role[] = ["ADMIN"];

/** "2026-27" for the academic year that starts in 2026 — the form MahaDBT and the university write. */
export function yearKeyOf(startDate: Date): string {
  const y = startDate.getUTCFullYear();
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

/** The start year of a "2026-27" key. */
export function startYearOfKey(key: string): number {
  return Number(key.slice(0, 4));
}

/** A student's name as the office prints it. */
export function nameOf(u: { name: string; preferredName?: string | null }): string {
  return u.preferredName ?? u.name;
}

/** A college student of this school, or a 404. */
export async function collegeStudent(schoolId: string, studentMembershipId: string) {
  const m = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT" },
    select: { id: true, userId: true, studentCode: true, leftAt: true, status: true, user: { select: { name: true, preferredName: true, isMinor: true } } },
  });
  if (!m) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  return m;
}

/**
 * Where a student stands for the fee structures and the schemes: the
 * programme, the category they were admitted under and the year of study —
 * the academic seat's (StudentProgramme) when there is one, else counted from
 * the year of entry against the academic year's start.
 */
export async function standingOf(studentMembershipId: string, academicStartYear: number | null): Promise<{ programmeId: string | null; category: string | null; quota: string | null; yearOfEntry: number | null; yearOfStudy: number | null }> {
  const [enrolment, seat] = await Promise.all([
    db.programmeEnrolment.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { programmeId: true, category: true, quota: true, yearOfEntry: true } }),
    db.studentProgramme.findUnique({ where: { studentMembershipId }, select: { programmeId: true, yearOfStudy: true, entryYear: true } }),
  ]);
  const programmeId = enrolment?.programmeId ?? seat?.programmeId ?? null;
  const yearOfEntry = enrolment?.yearOfEntry ?? seat?.entryYear ?? null;
  const yearOfStudy = seat?.yearOfStudy ?? (yearOfEntry !== null && academicStartYear !== null ? Math.max(1, academicStartYear - yearOfEntry + 1) : null);
  return { programmeId, category: enrolment?.category ?? null, quota: enrolment?.quota ?? null, yearOfEntry, yearOfStudy };
}

/** The users of the school's office (and, optionally, its accounts desk): who hears of an ask. */
export async function officeUserIds(schoolId: string, roles: readonly Role[] = ["ADMIN"]): Promise<string[]> {
  const rows = await db.membership.findMany({ where: { schoolId, status: "ACTIVE", leftAt: null, role: { in: [...roles] } }, select: { userId: true } });
  return [...new Set(rows.map((r) => r.userId))];
}

/** Paise as the office reads it in a sheet: "1250.50". */
export function rupeesCell(paise: number): string {
  return (paise / 100).toFixed(2);
}
