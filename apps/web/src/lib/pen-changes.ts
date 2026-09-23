import "server-only";
import type { PenChangeRequestView, PenChangeStatus } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { assignPen, normalisePen } from "./pen";
import type { ActiveContext } from "./session";

/**
 * Correcting a PEN once it is on the account.
 *
 * The first entry is the admin's alone. After that the number is the child's
 * identity on every transfer certificate, so a change is a decision three
 * people make: the admin proposes the new number with a reason, the head
 * approves or rejects, a guardian approves or rejects, and only when both
 * have approved does the number change — the record mirrors it, the audit
 * log carries the action and never the numbers, and everyone is told. Either
 * refusal settles it. One pending proposal per pupil; the same proposal
 * again is the same ask. A pupil with no active guardian has the head's word
 * alone, and the request says so.
 */

const INCLUDE = { student: { select: { userId: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } } } as const;
type Row = { id: string; schoolId: string; studentMembershipId: string; fromPen: string | null; toPen: string | null; reason: string; status: string; requestedByUserId: string; principalDecidedAt: Date | null; principalUserId: string | null; principalApproved: boolean | null; guardianDecidedAt: Date | null; guardianUserId: string | null; guardianApproved: boolean | null; guardianWaived: boolean; decisionReason: string | null; createdAt: Date; appliedAt: Date | null; student: { userId: string; user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] } };

async function names(ids: (string | null)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (wanted.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: wanted } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

async function isGuardianOf(userId: string, studentMembershipId: string): Promise<boolean> {
  return Boolean(await db.guardianship.findFirst({ where: { parentUserId: userId, studentMembershipId, status: "ACTIVE" }, select: { id: true } }));
}

async function view(ctx: ActiveContext, rows: Row[]): Promise<PenChangeRequestView[]> {
  const who = await names(rows.flatMap((r) => [r.requestedByUserId, r.principalUserId, r.guardianUserId]));
  const out: PenChangeRequestView[] = [];
  for (const r of rows) {
    const pending = r.status === "PENDING";
    const head = ctx.role === "PRINCIPAL" && ctx.schoolId === r.schoolId;
    const guardian = ctx.role === "PARENT" && (await isGuardianOf(ctx.user.id, r.studentMembershipId));
    const admin = ctx.role === "ADMIN" && ctx.schoolId === r.schoolId;
    out.push({
      id: r.id,
      studentMembershipId: r.studentMembershipId,
      studentName: r.student.user.preferredName ?? r.student.user.name,
      className: r.student.enrollments[0]?.class.name ?? null,
      fromPen: r.fromPen,
      toPen: r.toPen,
      reason: r.reason,
      status: r.status as PenChangeStatus,
      requestedByName: who.get(r.requestedByUserId) ?? "",
      principal: { decided: r.principalDecidedAt !== null, approved: r.principalApproved, by: r.principalUserId ? (who.get(r.principalUserId) ?? null) : null },
      guardian: { decided: r.guardianDecidedAt !== null, approved: r.guardianApproved, by: r.guardianUserId ? (who.get(r.guardianUserId) ?? null) : null, waived: r.guardianWaived },
      decisionReason: r.decisionReason,
      can: { decide: pending && ((head && r.principalDecidedAt === null) || (guardian && !r.guardianWaived && r.guardianDecidedAt === null)), withdraw: pending && admin },
      createdAt: r.createdAt.toISOString(),
      appliedAt: r.appliedAt?.toISOString() ?? null,
    });
  }
  return out;
}

/** The pending proposal on a pupil, for the record view. */
export async function pendingPenChange(ctx: ActiveContext, studentMembershipId: string): Promise<PenChangeRequestView | null> {
  const row = await db.penChangeRequest.findFirst({ where: { studentMembershipId, status: "PENDING" }, include: INCLUDE });
  return row ? (await view(ctx, [row]))[0]! : null;
}

/** The admin proposes. The same number proposed while one is pending is the same ask; a different one replaces it. */
export async function proposePenChange(ctx: ActiveContext, studentMembershipId: string, input: { toPen: string | null; reason: string }): Promise<PenChangeRequestView> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("pupilRecord.penOnlyAdmin");
  const pupil = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true, userId: true, user: { select: { penNumber: true } } } });
  if (!pupil) throw new AccessError("access.notYourPupil", "NOT_FOUND");
  const toPen = normalisePen(input.toPen);
  if (!pupil.user.penNumber) throw new AccessError("pupilRecord.penChangeNotNeeded");
  if (toPen === pupil.user.penNumber) throw new AccessError("pupilRecord.penChangeSame");
  if (toPen) {
    const other = await db.user.findUnique({ where: { penNumber: toPen }, select: { id: true } });
    if (other && other.id !== pupil.userId) throw new AccessError("pupilRecord.penTaken");
  }
  const open = await db.penChangeRequest.findFirst({ where: { studentMembershipId, status: "PENDING" }, include: INCLUDE });
  if (open && open.toPen === toPen) return (await view(ctx, [open]))[0]!;
  if (open) await db.penChangeRequest.update({ where: { id: open.id }, data: { status: "WITHDRAWN", decisionReason: null } });
  const hasGuardian = Boolean(await db.guardianship.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, select: { id: true } }));
  const created = await db.penChangeRequest.create({ data: { schoolId: ctx.schoolId, studentMembershipId, fromPen: pupil.user.penNumber, toPen, reason: input.reason.trim(), requestedByUserId: ctx.user.id, guardianWaived: !hasGuardian }, include: INCLUDE });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "pen.propose", targetType: "Membership", targetId: studentMembershipId, meta: { requestId: created.id, removes: toPen === null, guardianWaived: !hasGuardian, replaced: open?.id ?? null } });
  const heads = await db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  const name = created.student.user.preferredName ?? created.student.user.name;
  await Promise.all(heads.map((h) => notify({ userId: h.userId, schoolId: ctx.schoolId!, kind: "SYSTEM", titleKey: "pupilRecord.notifPenProposed", titleVars: { name }, body: input.reason.trim(), url: `/admin/records/${studentMembershipId}` })));
  if (hasGuardian) await notifyGuardians(studentMembershipId, () => ({ schoolId: ctx.schoolId, kind: "SYSTEM", titleKey: "pupilRecord.notifPenProposed", titleVars: { name }, body: input.reason.trim(), url: `/parent/record?child=${studentMembershipId}` }));
  return (await view(ctx, [created]))[0]!;
}

/** The head or a guardian decides. Both approvals apply the change; either refusal settles it. The same decision again changes nothing. */
export async function decidePenChange(ctx: ActiveContext, requestId: string, input: { approve: boolean; reason?: string }): Promise<PenChangeRequestView> {
  const row = await db.penChangeRequest.findFirst({ where: { id: requestId }, include: INCLUDE });
  if (!row) throw new AccessError("pupilRecord.penChangeNotFound", "NOT_FOUND");
  const head = ctx.role === "PRINCIPAL" && ctx.schoolId === row.schoolId;
  const guardian = ctx.role === "PARENT" && (await isGuardianOf(ctx.user.id, row.studentMembershipId));
  if (!head && !guardian) throw new AccessError("pupilRecord.penChangeNotFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view(ctx, [row]))[0]!;
  const already = head ? row.principalDecidedAt : row.guardianDecidedAt;
  if (already) return (await view(ctx, [row]))[0]!;
  const now = new Date();
  const data = head
    ? { principalDecidedAt: now, principalUserId: ctx.user.id, principalApproved: input.approve }
    : { guardianDecidedAt: now, guardianUserId: ctx.user.id, guardianApproved: input.approve };
  let updated = await db.penChangeRequest.update({ where: { id: requestId }, data: { ...data, ...(input.approve ? {} : { status: "REJECTED", decisionReason: input.reason?.trim() || null }) }, include: INCLUDE });
  await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "pen.decide", targetType: "PenChangeRequest", targetId: requestId, meta: { as: head ? "principal" : "guardian", approved: input.approve } });
  const name = row.student.user.preferredName ?? row.student.user.name;
  const settled = updated.status === "REJECTED";
  const bothApproved = updated.principalApproved === true && (updated.guardianWaived || updated.guardianApproved === true);
  if (!settled && bothApproved) {
    await assignPen(row.student.userId, updated.toPen);
    await db.pupilRecord.updateMany({ where: { studentMembershipId: row.studentMembershipId }, data: { penNumber: updated.toPen } });
    updated = await db.penChangeRequest.update({ where: { id: requestId }, data: { status: "APPLIED", appliedAt: new Date() }, include: INCLUDE });
    await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "pen.apply", targetType: "Membership", targetId: row.studentMembershipId, meta: { requestId, removes: updated.toPen === null } });
  }
  if (settled || bothApproved) {
    const titleKey = settled ? "pupilRecord.notifPenRejected" : "pupilRecord.notifPenApplied";
    await notify({ userId: row.requestedByUserId, schoolId: row.schoolId, kind: "SYSTEM", titleKey, titleVars: { name }, body: input.reason?.trim() || row.reason, url: `/admin/records/${row.studentMembershipId}` });
    await notifyGuardians(row.studentMembershipId, () => ({ schoolId: row.schoolId, kind: "SYSTEM", titleKey, titleVars: { name }, url: `/parent/record?child=${row.studentMembershipId}` }));
  }
  return (await view(ctx, [updated]))[0]!;
}

/** The admin takes a pending proposal back. A settled one is answered as it stands. */
export async function withdrawPenChange(ctx: ActiveContext, requestId: string): Promise<PenChangeRequestView> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("pupilRecord.penOnlyAdmin");
  const row = await db.penChangeRequest.findFirst({ where: { id: requestId, schoolId: ctx.schoolId }, include: INCLUDE });
  if (!row) throw new AccessError("pupilRecord.penChangeNotFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view(ctx, [row]))[0]!;
  const updated = await db.penChangeRequest.update({ where: { id: requestId }, data: { status: "WITHDRAWN" }, include: INCLUDE });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "pen.withdraw", targetType: "PenChangeRequest", targetId: requestId });
  return (await view(ctx, [updated]))[0]!;
}

/** The office's list, pending first. */
export async function officePenChanges(ctx: ActiveContext, status?: PenChangeStatus): Promise<{ items: PenChangeRequestView[]; pending: number }> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.notAllowed");
  const [rows, pending] = await Promise.all([
    db.penChangeRequest.findMany({ where: { schoolId: ctx.schoolId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, include: INCLUDE, take: 200 }),
    db.penChangeRequest.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }),
  ]);
  rows.sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.createdAt.getTime() - a.createdAt.getTime());
  return { items: await view(ctx, rows), pending };
}

/** A guardian's: the proposals on their children, the ones awaiting their word first. */
export async function familyPenChanges(ctx: ActiveContext): Promise<{ items: PenChangeRequestView[]; pending: number }> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const children = (await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentMembershipId: true } })).map((g) => g.studentMembershipId);
  if (children.length === 0) return { items: [], pending: 0 };
  const rows = await db.penChangeRequest.findMany({ where: { studentMembershipId: { in: children } }, orderBy: { createdAt: "desc" }, include: INCLUDE, take: 100 });
  rows.sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.createdAt.getTime() - a.createdAt.getTime());
  return { items: await view(ctx, rows), pending: rows.filter((r) => r.status === "PENDING" && r.guardianDecidedAt === null && !r.guardianWaived).length };
}
