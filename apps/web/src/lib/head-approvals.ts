import "server-only";
import type { z } from "zod";
import type { hostelExpulsionSchema, hostelExpulsionsSchema, refundExceptionsSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { assertCollege, assertModuleOn } from "./modules";
import { isDateKey, todayKey } from "./dates";
import { paidOnSeat } from "./college-admissions";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE PRINCIPAL'S LAST TWO APPROVALS (5 October 2026; integration decision 10,
 * docs/college.md "Not built"): a refund outside the slab and a hostel
 * expulsion — the two decisions the college plan reserves for the head that
 * nobody had built. Both follow the head-approval pattern the concession and
 * the grace marks set: the desk that knows the case asks, with its reason;
 * only the principal decides; the decision is an audit row the head's
 * decision log reads back (decision-log.ts, kinds `refundException` and
 * `expulsion`); a second press of the same answer is the same.
 *
 * A REFUND OUTSIDE THE SLAB. A cancelled seat's refund is the slab's
 * (REFUND_SLABS, the UGC's 2018 notification; college-admissions.ts). The
 * office may ask for a different amount — a medical case, a death in the
 * family — with the reason. Until the principal answers, the bank reference
 * cannot be recorded (recordRefund refuses). An approval makes the asked
 * amount the refund and keeps the slab's figure beside it; a refusal leaves
 * the slab's. The money still moves only through the college's own account
 * (decision 0003): this records what the college will pay.
 *
 * A HOSTEL EXPULSION. The warden or the office proposes ending a boarder's
 * place, with the reason, the incident it rests on and the day it would take
 * effect; one open proposal a place. An approval ends the allotment on that
 * day, as the office's own "end the allotment" would, and tells the student
 * and — under the HOSTEL_TRANSPORT grant for an adult — the guardians; a
 * refusal or the proposer's withdrawal leaves the boarder where they are.
 */

type RefundExceptions = z.infer<typeof refundExceptionsSchema>;
type Expulsion = z.infer<typeof hostelExpulsionSchema>;
type Expulsions = z.infer<typeof hostelExpulsionsSchema>;

const OFFICE: readonly Role[] = ["ADMIN"];
const HEAD: readonly Role[] = ["PRINCIPAL"];
const REFUND_READ: readonly Role[] = ["ADMIN", "PRINCIPAL", "ACCOUNTS"];
const HOSTEL_PROPOSE: readonly Role[] = ["WARDEN", "ADMIN"];
const HOSTEL_READ: readonly Role[] = ["WARDEN", "ADMIN", "PRINCIPAL"];

type Caller = { schoolId: string; userId: string; role: Role; membershipId: string };

function caller(ctx: ActiveContext, roles: readonly Role[]): Caller {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId };
}

/** Every principal of the school, told that something waits for their word. */
async function tellHeads(schoolId: string, titleKey: "collegeDesks.notifRefundAsk" | "collegeDesks.notifExpulsionAsk", name: string, url: string): Promise<void> {
  const heads = await db.membership.findMany({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  for (const h of heads) await notify({ userId: h.userId, schoolId, kind: "SYSTEM", titleKey, titleVars: { name }, url }).catch((error) => console.error("[head-approvals] notice failed", error));
}

/* -------------------------------------------------------------------------- */
/* A refund outside the slab                                                   */
/* -------------------------------------------------------------------------- */

/** The office asks the principal for a refund the slab does not give, on a cancelled seat whose refund is not yet paid. */
export async function askRefundException(ctx: ActiveContext, applicationId: string, input: { refundPaise: number; reason: string }, now: Date = new Date()): Promise<void> {
  const me = caller(ctx, OFFICE);
  await assertCollege(me.schoolId);
  await assertModuleOn(me.schoolId, "ADMISSIONS");
  const a = await db.collegeApplication.findFirst({ where: { id: applicationId, schoolId: me.schoolId }, select: { id: true, status: true, applicantName: true, refundPaise: true, refundAskStatus: true, admittedMembershipId: true, admissionFeePaidAt: true, admissionFeePaise: true } });
  if (!a) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  if (a.status !== "CANCELLED") throw new AccessError("collegeDesks.refuseRefundNotCancelled");
  // Never more than was paid on the seat (A3-S-15): the slab's refund is bounded by it, and so is the exception.
  if (input.refundPaise > (await paidOnSeat(me.schoolId, a)).paidPaise) throw new AccessError("collegeDesks.refuseRefundTooMuch");
  if (a.refundAskStatus === "ASKED") throw new AccessError("collegeDesks.refuseRefundAlreadyAsked");
  if (a.refundAskStatus === "APPROVED") throw new AccessError("collegeDesks.refuseRefundDecided");
  if (input.refundPaise === (a.refundPaise ?? 0)) throw new AccessError("collegeDesks.refuseRefundSameAsSlab");
  const moved = await db.collegeApplication.updateMany({
    where: { id: a.id, status: "CANCELLED", OR: [{ refundAskStatus: null }, { refundAskStatus: "REFUSED" }] },
    data: { refundAskPaise: input.refundPaise, refundAskReason: input.reason.trim(), refundAskStatus: "ASKED", refundAskedByUserId: me.userId, refundAskedAt: now, refundDecidedByUserId: null, refundDecidedAt: null, refundDecisionNote: null },
  });
  if (moved.count === 0) throw new AccessError("collegeDesks.refuseRefundAlreadyAsked");
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "college.admissions.refundException.ask", targetType: "CollegeApplication", targetId: a.id, meta: { slabPaise: a.refundPaise ?? 0, askedPaise: input.refundPaise } });
  await tellHeads(me.schoolId, "collegeDesks.notifRefundAsk", a.applicantName, "/principal/approvals");
}

/** The principal's word on an asked refund. Deciding it the same way again is the same; the other way, refused. */
export async function decideRefundException(ctx: ActiveContext, applicationId: string, input: { approve: boolean; note: string }, now: Date = new Date()): Promise<void> {
  const me = caller(ctx, HEAD);
  await assertCollege(me.schoolId);
  // The door's module, on the web action's path too (A3-S-15): the catalog's gate answers the API, this answers both.
  await assertModuleOn(me.schoolId, "ADMISSIONS");
  const a = await db.collegeApplication.findFirst({ where: { id: applicationId, schoolId: me.schoolId }, select: { id: true, status: true, applicantName: true, refundPaise: true, refundAskPaise: true, refundAskStatus: true, refundAskedByUserId: true } });
  if (!a || !a.refundAskStatus) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  // FOUR EYES (A3-S-4, 5 Oct 2026): one person holding ADMIN and PRINCIPAL asked as the office and approved as the head.
  if (a.refundAskedByUserId === me.userId) throw new AccessError("collegeDesks.refuseOwnAsk");
  const target = input.approve ? "APPROVED" : "REFUSED";
  if (a.refundAskStatus === target) return;
  if (a.refundAskStatus !== "ASKED") throw new AccessError("collegeDesks.refuseRefundDecided");
  const data = input.approve
    ? { refundAskStatus: "APPROVED", refundSlabPaise: a.refundPaise ?? 0, refundPaise: a.refundAskPaise ?? 0, refundDecidedByUserId: me.userId, refundDecidedAt: now, refundDecisionNote: input.note.trim() || null }
    : { refundAskStatus: "REFUSED", refundDecidedByUserId: me.userId, refundDecidedAt: now, refundDecisionNote: input.note.trim() || null };
  const moved = await db.collegeApplication.updateMany({ where: { id: a.id, refundAskStatus: "ASKED", status: "CANCELLED" }, data });
  if (moved.count === 0) throw new AccessError("collegeDesks.refuseRefundDecided");
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: input.approve ? "college.admissions.refundException.approve" : "college.admissions.refundException.refuse", targetType: "CollegeApplication", targetId: a.id, meta: { slabPaise: a.refundPaise ?? 0, askedPaise: a.refundAskPaise ?? 0 } });
  if (a.refundAskedByUserId) {
    await notify({ userId: a.refundAskedByUserId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: input.approve ? "collegeDesks.notifRefundApproved" : "collegeDesks.notifRefundRefused", titleVars: { name: a.applicantName }, url: `/admin/college-admissions/${a.id}` }).catch((error) => console.error("[head-approvals] notice failed", error));
  }
}

/** The refunds asked outside the slab: those waiting first, then the decided, newest first. */
export async function refundExceptions(ctx: ActiveContext): Promise<RefundExceptions> {
  const me = caller(ctx, REFUND_READ);
  await assertCollege(me.schoolId);
  const rows = await db.collegeApplication.findMany({
    where: { schoolId: me.schoolId, refundAskStatus: { not: null } },
    orderBy: [{ refundAskedAt: "desc" }, { id: "asc" }],
    take: 200,
    select: { id: true, applicantName: true, refundPaise: true, refundSlabPaise: true, refundAskPaise: true, refundAskReason: true, refundAskStatus: true, refundAskedByUserId: true, refundAskedAt: true, refundDecidedAt: true, refundDecisionNote: true },
  });
  const names = new Map((await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.refundAskedByUserId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const items = rows.map((r) => ({
    applicationId: r.id,
    applicantName: r.applicantName,
    status: r.refundAskStatus as "ASKED" | "APPROVED" | "REFUSED",
    // Before an approval the slab's figure is still the refund; after, it is kept beside the asked amount.
    slabPaise: r.refundAskStatus === "APPROVED" ? (r.refundSlabPaise ?? 0) : (r.refundPaise ?? 0),
    askedPaise: r.refundAskPaise ?? 0,
    reason: r.refundAskReason ?? "",
    askedByName: names.get(r.refundAskedByUserId ?? "") ?? "",
    askedAt: (r.refundAskedAt ?? new Date(0)).toISOString(),
    decidedAt: r.refundDecidedAt?.toISOString() ?? null,
    note: r.refundDecisionNote,
  }));
  items.sort((x, y) => Number(y.status === "ASKED") - Number(x.status === "ASKED"));
  return { items, canDecide: me.role === "PRINCIPAL" };
}

/* -------------------------------------------------------------------------- */
/* A hostel expulsion                                                          */
/* -------------------------------------------------------------------------- */

const EXPULSION_SELECT = {
  id: true,
  allotmentId: true,
  membershipId: true,
  reason: true,
  incidentId: true,
  effectiveOn: true,
  status: true,
  proposedByUserId: true,
  proposedAt: true,
  decidedAt: true,
  decisionNote: true,
  allotment: { select: { room: { select: { number: true, hostel: { select: { name: true } } } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } },
} as const;

async function expulsionRows(schoolId: string, where: { id?: string } = {}): Promise<Expulsion[]> {
  const rows = await db.hostelExpulsion.findMany({ where: { schoolId, ...where }, orderBy: [{ proposedAt: "desc" }, { id: "asc" }], take: 200, select: EXPULSION_SELECT });
  const names = new Map((await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.proposedByUserId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const items = rows.map((r) => ({
    id: r.id,
    allotmentId: r.allotmentId,
    membershipId: r.membershipId,
    name: r.allotment.student.user.preferredName ?? r.allotment.student.user.name,
    hostelName: r.allotment.room.hostel.name,
    roomNumber: r.allotment.room.number,
    reason: r.reason,
    incidentId: r.incidentId,
    effectiveOn: r.effectiveOn,
    status: r.status as Expulsion["status"],
    proposedByName: names.get(r.proposedByUserId) ?? "",
    proposedAt: r.proposedAt.toISOString(),
    decidedAt: r.decidedAt?.toISOString() ?? null,
    decisionNote: r.decisionNote,
  }));
  items.sort((x, y) => Number(y.status === "ASKED") - Number(x.status === "ASKED"));
  return items;
}

/** The warden or the office proposes ending a boarder's place; one open proposal a place. */
export async function proposeExpulsion(ctx: ActiveContext, input: { allotmentId: string; reason: string; incidentId: string | null; effectiveOn: string }, now: Date = new Date()): Promise<Expulsion> {
  const me = caller(ctx, HOSTEL_PROPOSE);
  await assertModuleOn(me.schoolId, "HOSTEL");
  const a = await db.hostelAllotment.findFirst({ where: { id: input.allotmentId, schoolId: me.schoolId }, select: { id: true, status: true, membershipId: true, fromDate: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  if (a.status !== "ACTIVE") throw new AccessError("collegeDesks.refuseExpulsionNotActive");
  const tz = (await db.school.findUniqueOrThrow({ where: { id: me.schoolId }, select: { timezone: true } })).timezone;
  if (!isDateKey(input.effectiveOn) || input.effectiveOn < todayKey(tz, now) || input.effectiveOn < a.fromDate) throw new AccessError("collegeDesks.refuseExpulsionDate");
  if (input.incidentId) {
    const incident = await db.incident.findFirst({ where: { id: input.incidentId, schoolId: me.schoolId, studentMembershipId: a.membershipId }, select: { id: true } });
    if (!incident) throw new AccessError("collegeDesks.refuseExpulsionIncident");
  }
  let id: string;
  try {
    id = (await db.hostelExpulsion.create({ data: { schoolId: me.schoolId, allotmentId: a.id, membershipId: a.membershipId, reason: input.reason.trim(), incidentId: input.incidentId, effectiveOn: input.effectiveOn, proposedByUserId: me.userId, proposedAt: now, openKey: a.id }, select: { id: true } })).id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new AccessError("collegeDesks.refuseExpulsionOpen");
    throw error;
  }
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "hostel.expulsion.propose", targetType: "HostelExpulsion", targetId: id, meta: { allotmentId: a.id, effectiveOn: input.effectiveOn } });
  await tellHeads(me.schoolId, "collegeDesks.notifExpulsionAsk", a.student.user.preferredName ?? a.student.user.name, "/hostel/expulsions");
  return (await expulsionRows(me.schoolId, { id }))[0]!;
}

/** The principal's word. An approval ends the place on the proposal's day and tells the student and their family. */
export async function decideExpulsion(ctx: ActiveContext, expulsionId: string, input: { approve: boolean; note: string }, now: Date = new Date()): Promise<Expulsion> {
  const me = caller(ctx, HEAD);
  await assertModuleOn(me.schoolId, "HOSTEL");
  const x = await db.hostelExpulsion.findFirst({ where: { id: expulsionId, schoolId: me.schoolId }, select: { id: true, status: true, allotmentId: true, membershipId: true, effectiveOn: true, proposedByUserId: true } });
  if (!x) throw new AccessError("collegeDesks.refuseExpulsionMissing", "NOT_FOUND");
  // FOUR EYES (A3-S-4): the head does not decide an expulsion they proposed themselves (as the office or the warden).
  if (x.proposedByUserId === me.userId) throw new AccessError("collegeDesks.refuseOwnAsk");
  const target = input.approve ? "APPROVED" : "REFUSED";
  if (x.status === target) return (await expulsionRows(me.schoolId, { id: x.id }))[0]!;
  if (x.status !== "ASKED") throw new AccessError("collegeDesks.refuseExpulsionDecided");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const moved = await tx.hostelExpulsion.updateMany({ where: { id: x.id, status: "ASKED" }, data: { status: target, decidedByUserId: me.userId, decidedAt: now, decisionNote: input.note.trim() || null, openKey: null } });
    if (moved.count === 0) throw new AccessError("collegeDesks.refuseExpulsionDecided");
    // The place ends on the proposal's day, as the office's own "end the allotment" writes it.
    if (input.approve) await tx.hostelAllotment.updateMany({ where: { id: x.allotmentId, status: "ACTIVE" }, data: { status: "ENDED", toDate: x.effectiveOn, activePupilKey: null, activeBedKey: null, endedByUserId: me.userId } });
  });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: input.approve ? "hostel.expulsion.approve" : "hostel.expulsion.refuse", targetType: "HostelExpulsion", targetId: x.id, meta: { allotmentId: x.allotmentId, effectiveOn: x.effectiveOn } });
  if (input.approve) {
    const student = await db.membership.findUnique({ where: { id: x.membershipId }, select: { userId: true } });
    if (student) await notify({ userId: student.userId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: "collegeDesks.notifExpelled", titleVars: { date: x.effectiveOn }, url: "/student/hostel" }).catch((error) => console.error("[head-approvals] notice failed", error));
    await notifyGuardians(x.membershipId, (name) => ({ schoolId: me.schoolId, kind: "SYSTEM", titleKey: "collegeDesks.notifExpelledChild", titleVars: { name, date: x.effectiveOn }, url: `/parent/hostel?child=${x.membershipId}` }), "HOSTEL_TRANSPORT").catch((error) => console.error("[head-approvals] notice failed", error));
  }
  return (await expulsionRows(me.schoolId, { id: x.id }))[0]!;
}

/** The proposer (or the office) takes back a proposal still waiting. */
export async function withdrawExpulsion(ctx: ActiveContext, expulsionId: string, now: Date = new Date()): Promise<Expulsion> {
  const me = caller(ctx, HOSTEL_PROPOSE);
  await assertModuleOn(me.schoolId, "HOSTEL");
  const x = await db.hostelExpulsion.findFirst({ where: { id: expulsionId, schoolId: me.schoolId }, select: { id: true, status: true, proposedByUserId: true } });
  if (!x) throw new AccessError("collegeDesks.refuseExpulsionMissing", "NOT_FOUND");
  if (x.status === "WITHDRAWN") return (await expulsionRows(me.schoolId, { id: x.id }))[0]!;
  if (x.status !== "ASKED") throw new AccessError("collegeDesks.refuseExpulsionDecided");
  if (me.role !== "ADMIN" && x.proposedByUserId !== me.userId) throw new AccessError("access.wrongRoleForThisAction");
  await db.hostelExpulsion.updateMany({ where: { id: x.id, status: "ASKED" }, data: { status: "WITHDRAWN", decidedByUserId: me.userId, decidedAt: now, openKey: null } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "hostel.expulsion.withdraw", targetType: "HostelExpulsion", targetId: x.id, meta: {} });
  return (await expulsionRows(me.schoolId, { id: x.id }))[0]!;
}

/** Every proposal, those waiting first; who may propose and who may decide. */
export async function listExpulsions(ctx: ActiveContext): Promise<Expulsions> {
  const me = caller(ctx, HOSTEL_READ);
  await assertModuleOn(me.schoolId, "HOSTEL");
  return { items: await expulsionRows(me.schoolId), canPropose: HOSTEL_PROPOSE.includes(me.role), canDecide: me.role === "PRINCIPAL" };
}

/** For the principal's college page: how many of each wait for the head's word. */
export async function headApprovalCounts(schoolId: string): Promise<{ refundException: number; expulsion: number }> {
  const [refundException, expulsion] = await Promise.all([db.collegeApplication.count({ where: { schoolId, refundAskStatus: "ASKED" } }), db.hostelExpulsion.count({ where: { schoolId, status: "ASKED" } })]);
  return { refundException, expulsion };
}
