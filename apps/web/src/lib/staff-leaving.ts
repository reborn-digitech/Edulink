import "server-only";
import { STAFF_LEAVING_REASONS, type StaffLeavingReason } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { dateKeyInZone, isDateKey, todayKey } from "./dates";
import { SCHOOL_STAFF_ROLES } from "./staff-records";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * A MEMBER OF STAFF'S LEAVING — TA-046, the owner's decision of 14 November 2026 (option 1).
 *
 * The office records a member of staff's last working day with a coded reason (STAFF_LEAVING_REASONS). That writes
 * `Membership.leftAt`, which every query resolving who somebody is reads, so access ends; payroll's roll for a month
 * takes everyone whose leaving day falls in it and pays them up to that day (payroll.ts `rollFor`, `lossOfPay`).
 *
 * ACCESS ENDS AFTER THAT DAY. A last day already past is recorded at once. Today or a later day is kept in the same
 * row a pupil's later last day is kept in (ScheduledDeparture), with the staff code as its reason: they keep access
 * through it, and the night job (`runDueDepartures`) records it the morning after through `writeStaffLeaving`.
 * Payroll reads a kept day as the leaving day, so a run drawn before that morning already pays up to it.
 *
 * Staff get no leaving certificate (school-record.ts refuses one for anyone but a pupil); the office's own leaving
 * is recorded by another admin, and the last admin is refused, as a pause is.
 */
export type StaffLeavingInput = { lastDay: string; reason: string };
export type StaffLeavingOutcome = { ok: true; leftOn: string | null; scheduledFor: string | null } | { ok: false; errorKey: TranslationKey };

type Tx = typeof db;

/**
 * Whom the step is offered to and taken for: a member of staff (SCHOOL_STAFF_ROLES), never a pupil, a guardian, an
 * alumnus or a row with no role. The directory's row menu reads it, so the step is not offered where it is refused.
 */
export function offersStaffLeaving(role: string | null | undefined): boolean {
  return typeof role === "string" && (SCHOOL_STAFF_ROLES as readonly string[]).includes(role);
}

/** The leaving day as an instant: noon UTC of the day, which reads as that day in every zone a school keeps. */
export const leavingInstant = (dayKey: string) => new Date(`${dayKey}T12:00:00.000Z`);

class Refused extends Error {
  constructor(public readonly key: TranslationKey) {
    super(key);
  }
}

/**
 * The one writer of a member of staff's leftAt: in one transaction, under the school's row lock (the lock pauses
 * take, so two admins cannot end each other's access at once), the membership's leftAt, any kept day cleared, and
 * the audit row. Refused (nothing written) for somebody not on the staff, already left, or the school's last admin.
 */
export async function writeStaffLeaving(input: { schoolId: string; membershipId: string; lastDay: string; reason: StaffLeavingReason; actorUserId: string; via?: string }): Promise<StaffLeavingOutcome> {
  try {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await tx.$queryRaw`SELECT id FROM "School" WHERE id = ${input.schoolId} FOR UPDATE`;
      const target = await tx.membership.findFirst({ where: { id: input.membershipId, schoolId: input.schoolId }, select: { id: true, role: true, status: true, leftAt: true } });
      if (!target) throw new Refused("refusal.personNotHere");
      if (!offersStaffLeaving(target.role)) throw new Refused("refusal.onlyStaffLeaves");
      if (target.leftAt) throw new Refused("refusal.alreadyLeft");
      if (target.role === "ADMIN") {
        const others = await tx.membership.count({ where: { schoolId: input.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null, id: { not: target.id } } });
        if (others === 0) throw new Refused("refusal.onlyAdminLeft");
      }
      // Conditional on nobody having written it meanwhile.
      const written = await tx.membership.updateMany({ where: { id: target.id, leftAt: null }, data: { leftAt: leavingInstant(input.lastDay) } });
      if (written.count !== 1) throw new Refused("refusal.alreadyLeft");
      await tx.scheduledDeparture.deleteMany({ where: { membershipId: target.id, schoolId: input.schoolId } });
      await audit({ schoolId: input.schoolId, actorUserId: input.actorUserId, action: "staff.leave", targetType: "Membership", targetId: target.id, meta: { lastDay: input.lastDay, reason: input.reason, role: target.role, wasPaused: target.status === "SUSPENDED", ...(input.via ? { via: input.via } : {}) } }, tx);
    });
  } catch (error) {
    if (error instanceof Refused) return { ok: false, errorKey: error.key };
    throw error;
  }
  return { ok: true, leftOn: input.lastDay, scheduledFor: null };
}

/** The office records a member of staff's last working day: at once when it is past, kept until the morning after it otherwise. */
export async function recordStaffLeaving(ctx: ActiveContext, membershipId: string, input: StaffLeavingInput): Promise<StaffLeavingOutcome> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanRecordStaffLeaving");
  const schoolId = ctx.schoolId;
  if (!(STAFF_LEAVING_REASONS as readonly string[]).includes(input.reason)) return { ok: false, errorKey: "refusal.sayStaffLeavingReason" };
  if (!isDateKey(input.lastDay)) return { ok: false, errorKey: "refusal.leaveDateInvalid" };
  // One's own leaving is another admin's to record, as one's own pause is refused.
  if (membershipId === ctx.membershipId) return { ok: false, errorKey: "refusal.staffLeaveSelf" };
  const reason = input.reason as StaffLeavingReason;

  const [school, member] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
    db.membership.findFirst({ where: { id: membershipId, schoolId }, select: { id: true, role: true, status: true, leftAt: true, joinedAt: true, staffRecord: { select: { joinedOn: true } } } }),
  ]);
  if (!member) return { ok: false, errorKey: "refusal.personNotHere" };
  if (!offersStaffLeaving(member.role)) return { ok: false, errorKey: "refusal.onlyStaffLeaves" };
  if (member.leftAt) return { ok: false, errorKey: "refusal.alreadyLeft" };
  if (member.status !== "ACTIVE" && member.status !== "SUSPENDED") return { ok: false, errorKey: "refusal.inviteNotAccepted" };
  // Not before they joined: the earlier of the account's joining here and the staff record's joining day.
  const joinedKeys = [dateKeyInZone(member.joinedAt, school.timezone), ...(member.staffRecord?.joinedOn ? [member.staffRecord.joinedOn.toISOString().slice(0, 10)] : [])].sort();
  if (input.lastDay < joinedKeys[0]!) return { ok: false, errorKey: "refusal.leaveBeforeJoin" };

  if (input.lastDay < todayKey(school.timezone)) {
    return writeStaffLeaving({ schoolId, membershipId: member.id, lastDay: input.lastDay, reason, actorUserId: ctx.user.id });
  }
  // Today or later: kept, access lasting through the day. The last admin is refused now rather than on the morning.
  if (member.role === "ADMIN") {
    const others = await db.membership.count({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null, id: { not: member.id } } });
    if (others === 0) return { ok: false, errorKey: "refusal.onlyAdminLeft" };
  }
  const data = { leaveOnKey: input.lastDay, reason, destination: null, note: null, conduct: null, scheduledByMembershipId: ctx.membershipId };
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.scheduledDeparture.upsert({ where: { membershipId: member.id }, create: { schoolId, membershipId: member.id, ...data }, update: data });
    await audit({ schoolId, actorUserId: ctx.user.id, action: "staff.leave.schedule", targetType: "Membership", targetId: member.id, meta: { lastDay: input.lastDay, reason, role: member.role } }, tx);
  });
  return { ok: true, leftOn: null, scheduledFor: input.lastDay };
}
