import "server-only";
import { cache } from "react";
import { ADMIN_DUTIES, adminDutiesHeld, DUTIES, isCollegeKind, isDutyRole, parseAdminDuties, parseDuties, type AdminDutyCode, type DutyCode, type HeadDuty, type MemberDuties } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError, NotACollegeError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import type { ActiveContext } from "./session";
import { presetOf } from "./streams";
import { assertModuleOn } from "./modules";

/**
 * DUTIES ON A COLLEGE TEACHER'S ROLE (the owner's decision of 5 October
 * 2026): packages/contracts v1/duties.ts has the list and why. One writer,
 * `setDuties` (the registrar, audited `people.duties.set`); the rest read.
 *
 * WHAT A BUILDER CALLS:
 *   - nothing, for an /api/v1 door: give its catalog entry `duties: [...]`
 *     beside `access` and the session's gate (role-gate.ts) refuses a FACULTY
 *     or HOD without one of them, 403, before the handler runs;
 *   - `requireDuty(ctx, duty)` in a library function, which throws the same
 *     refusal unless the caller is a FACULTY or HOD holding it — call it for
 *     those two roles after the function has let the office and the head
 *     through on their own account;
 *   - `hasDuty(ctx, duty)` / `myDuties(ctx)` to decide what a page draws, and
 *     `duty:` on a NAV entry or a phone tab to hide it without the duty.
 */

/** The duties on one membership, DUTIES order; [] for an unknown id. Read once per request. */
export const dutiesOfMembership = cache(async (membershipId: string | null | undefined): Promise<DutyCode[]> => {
  if (!membershipId) return [];
  const row = await db.membership.findUnique({ where: { id: membershipId }, select: { role: true, dutiesJson: true } });
  return row && isDutyRole(row.role) ? parseDuties(row.dutiesJson) : [];
});

/** The session's own duties: a FACULTY's or HOD's, [] for every other role. */
export async function myDuties(ctx: Pick<ActiveContext, "role" | "membershipId">): Promise<DutyCode[]> {
  return isDutyRole(ctx.role) ? dutiesOfMembership(ctx.membershipId) : [];
}

export async function hasDuty(ctx: Pick<ActiveContext, "role" | "membershipId">, duty: DutyCode): Promise<boolean> {
  return (await myDuties(ctx)).includes(duty);
}

/** Throws a 403 (AccessError `duties.refuseNoDuty`) unless the caller is a FACULTY or HOD holding `duty`. */
export async function requireDuty(ctx: Pick<ActiveContext, "role" | "membershipId">, duty: DutyCode): Promise<void> {
  if (!(await hasDuty(ctx, duty))) throw new AccessError("duties.refuseNoDuty");
}

/** The duties this college offers its teachers: the union over its streams (STREAM_PRESETS[…].duties). */
export async function offeredDuties(schoolId: string | null | undefined): Promise<DutyCode[]> {
  return [...(await presetOf(schoolId)).duties];
}

/**
 * THE REGISTRAR SETS A TEACHER'S DUTIES: the whole list ([] clears). The
 * office's alone, at a college, on an active FACULTY or HOD of this college;
 * every duty must be one the college's streams offer. Idempotent: the same
 * list changes nothing and writes no audit row.
 */
export async function setDuties(ctx: ActiveContext, membershipId: string, duties: readonly string[]): Promise<MemberDuties> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { kind: true } });
  if (!isCollegeKind(school.kind)) throw new NotACollegeError("duties.refuseNotACollege");
  // The module check the door's gate gives it, for the registrar's panel too (its server action calls only this; A3-S-15).
  await assertModuleOn(ctx.schoolId, "ACADEMICS");
  const member = await db.membership.findFirst({ where: { id: membershipId, schoolId: ctx.schoolId, status: "ACTIVE", leftAt: null }, select: { id: true, userId: true, role: true, dutiesJson: true } });
  if (!member) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!isDutyRole(member.role)) throw new RuleRefusal("duties.refuseNotTeacher", 422, undefined, "duties");
  const offered = await offeredDuties(ctx.schoolId);
  if (duties.some((d) => !(DUTIES as readonly string[]).includes(d))) throw new RuleRefusal("duties.refuseUnknown", 422, undefined, "duties");
  const before = parseDuties(member.dutiesJson);
  // Only a duty being GIVEN must be offered (A3-S-2): one the teacher already holds that the streams no longer offer
  // is not refused but taken off, so the panel, which re-sends what it was drawn with, saves and clears it.
  const notOffered = duties.filter((d) => !offered.includes(d as DutyCode) && !before.includes(d as DutyCode));
  if (notOffered.length) throw new RuleRefusal("duties.refuseNotOffered", 422, undefined, "duties");
  const set = new Set(duties.filter((d) => offered.includes(d as DutyCode)));
  const next = DUTIES.filter((d) => set.has(d));
  const answer: MemberDuties = { membershipId: member.id, role: member.role, duties: next, offered };
  if (before.length === next.length && before.every((d, i) => d === next[i])) return answer;
  await db.membership.update({ where: { id: member.id }, data: { dutiesJson: JSON.stringify(next) } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "people.duties.set", targetType: "Membership", targetId: member.id, meta: { from: before, to: next } });
  // The teacher is told of each duty newly given, in their own language: the duty's name and a fixed
  // sentence (from A3-journeys-40). One held already, or taken away, tells nobody.
  const given = next.filter((d) => !before.includes(d));
  const home = member.role === "HOD" ? "/hod" : "/faculty";
  await Promise.all(given.map((d) => notify({ userId: member.userId, schoolId: ctx.schoolId, kind: "SYSTEM", titleKey: `duties.${d}.name`, bodyKey: "duties.notifyGivenBody", url: home })));
  return answer;
}

// owner-batch-item9 (27 Oct 2026) ─────────────────────────────────────────────────────────────────────────────────
/**
 * THE HEAD'S PAGES ON AN ADMIN (packages/contracts v1/duties.ts ADMIN_DUTIES). Leave approval, the trends, the review
 * rounds and the safety centre are the head's; an ADMIN holds them while the PRINCIPAL has given that admin the duty
 * (`setHeadDuty`, the head's staff page, audited `people.headDuty.set`), and every admin holds them while the school
 * has no active PRINCIPAL. The gate (role-gate.ts) reads them from the session; the shell hides the four entries.
 */

/** Whether the school has an active head; read once per request. */
export const schoolHasPrincipal = cache(async (schoolId: string | null | undefined): Promise<boolean> => {
  if (!schoolId) return false;
  return (await db.membership.count({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null } })) > 0;
});

/** The office's duties the session holds: an ADMIN's, with the vacancy rule; [] for every other role. */
export async function myAdminDuties(ctx: Pick<ActiveContext, "role" | "membershipId" | "schoolId">): Promise<AdminDutyCode[]> {
  if (ctx.role !== "ADMIN" || !ctx.membershipId) return [];
  const row = await db.membership.findUnique({ where: { id: ctx.membershipId }, select: { dutiesJson: true } });
  const stored = parseAdminDuties(row?.dutiesJson);
  if (stored.length === ADMIN_DUTIES.length) return stored;
  return adminDutiesHeld(row?.dutiesJson, await schoolHasPrincipal(ctx.schoolId));
}

/** Whether the session reaches the head's pages: the head always, an admin holding HEAD_PAGES (or with no head), nobody else. */
export async function holdsHeadPages(ctx: Pick<ActiveContext, "role" | "membershipId" | "schoolId">): Promise<boolean> {
  if (ctx.role === "PRINCIPAL") return true;
  return (await myAdminDuties(ctx)).includes("HEAD_PAGES");
}

/**
 * Who reaches the head's pages at a school, as user ids: every active head, and each active admin holding the duty —
 * or every admin while there is no head. Who is told of a leave request waiting, of a problem reported from the app.
 */
export async function headPageHolders(schoolId: string): Promise<string[]> {
  const rows = await db.membership.findMany({ where: { schoolId, role: { in: ["PRINCIPAL", "ADMIN"] }, status: "ACTIVE", leftAt: null }, select: { userId: true, role: true, dutiesJson: true } });
  const head = rows.some((r) => r.role === "PRINCIPAL");
  return [...new Set(rows.filter((r) => r.role === "PRINCIPAL" || adminDutiesHeld(r.dutiesJson, head).includes("HEAD_PAGES")).map((r) => r.userId))];
}

/**
 * THE HEAD GIVES AN ADMIN THE HEAD'S PAGES, or takes them back. The PRINCIPAL's alone, at their own school, on an active
 * ADMIN of it. Idempotent: the same answer changes nothing and writes no audit row. Given, the admin is told; taken
 * back, nobody is. Other words in the membership's dutiesJson are kept as they are.
 */
export async function setHeadDuty(ctx: ActiveContext, membershipId: string, held: boolean): Promise<HeadDuty> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role !== "PRINCIPAL") throw new AccessError("headDuty.refuseNotHead");
  const member = await db.membership.findFirst({ where: { id: membershipId, schoolId: ctx.schoolId, status: "ACTIVE", leftAt: null }, select: { id: true, userId: true, role: true, dutiesJson: true } });
  if (!member) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (member.role !== "ADMIN") throw new RuleRefusal("headDuty.refuseNotAdmin", 422);
  const before = parseAdminDuties(member.dutiesJson);
  const had = before.includes("HEAD_PAGES");
  if (had === held) return { membershipId: member.id, held };
  let raw: unknown = [];
  try {
    raw = JSON.parse(member.dutiesJson ?? "[]");
  } catch {
    raw = [];
  }
  const others = (Array.isArray(raw) ? raw : []).filter((d): d is string => typeof d === "string" && d !== "HEAD_PAGES");
  const next = held ? [...others, "HEAD_PAGES"] : others;
  await db.membership.update({ where: { id: member.id }, data: { dutiesJson: JSON.stringify(next) } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "people.headDuty.set", targetType: "Membership", targetId: member.id, meta: { duty: "HEAD_PAGES", held } });
  if (held) await notify({ userId: member.userId, schoolId: ctx.schoolId, kind: "SYSTEM", titleKey: "headDuty.notifyGivenTitle", bodyKey: "headDuty.notifyGivenBody", url: "/principal/leave" });
  return { membershipId: member.id, held };
}
// end owner-batch-item9
