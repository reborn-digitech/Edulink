import "server-only";
import type { CertificateKind, CertificateRequestSave, CertificateRequestStatus, CertificateRequestView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * Certificate requests: the family asks, the office answers.
 *
 * A pupil asks for a bonafide for a bus pass; a guardian asks for a study
 * certificate for a scholarship. The ask is the kind and what it is for —
 * the two things the office would otherwise learn at the counter. It sits
 * in a queue on the office's issue page, pre-fills the issue form, and
 * when the paper is issued the request points at it and the family is
 * told. The office may decline with a reason instead, and the family may
 * take a pending ask back.
 *
 * ONE ASK AT A TIME. A second request for the same kind while one is
 * pending is the same request; a family sending the form twice does not
 * make two entries in the queue. What may be asked for is what the school
 * has an active template for — a kind with no template cannot be issued,
 * so it is not offered.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];

function office(ctx: ActiveContext): ActiveContext & { schoolId: string } {
  if (!ctx.schoolId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as ActiveContext & { schoolId: string };
}

/** Whose pupil this is to ask for: the pupil themselves, or an active guardian of the child. Anyone else: 404. */
async function asker(ctx: ActiveContext, childId?: string): Promise<{ studentMembershipId: string; schoolId: string }> {
  if (ctx.role === "STUDENT" && ctx.membershipId && ctx.schoolId) return { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId };
  if (ctx.role === "PARENT") {
    // The child named, or — as the record form does — the first child when none is.
    const guardianship = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", ...(childId ? { studentMembershipId: childId } : {}) }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true, studentSchoolId: true } });
    if (!guardianship) throw new AccessError("access.notYourChild", "NOT_FOUND");
    return { studentMembershipId: guardianship.studentMembershipId, schoolId: guardianship.studentSchoolId };
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

const INCLUDE = {
  student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
  certificate: { select: { serial: true } },
} as const;

type Row = { id: string; studentMembershipId: string; kind: string; purpose: string; status: string; requestedByUserId: string; certificateId: string | null; declineReason: string | null; decidedAt: Date | null; createdAt: Date; student: { user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] }; certificate: { serial: string } | null };

async function view(rows: Row[]): Promise<CertificateRequestView[]> {
  const byIds = [...new Set(rows.map((r) => r.requestedByUserId))];
  const users = byIds.length ? await db.user.findMany({ where: { id: { in: byIds } }, select: { id: true, name: true, preferredName: true } }) : [];
  const names = new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
  return rows.map((r) => ({
    id: r.id,
    studentMembershipId: r.studentMembershipId,
    studentName: r.student.user.preferredName ?? r.student.user.name,
    className: r.student.enrollments[0]?.class.name ?? null,
    kind: r.kind as CertificateKind,
    purpose: r.purpose,
    status: r.status as CertificateRequestStatus,
    requestedByName: names.get(r.requestedByUserId) ?? "",
    certificateId: r.certificateId,
    serial: r.certificate?.serial ?? null,
    declineReason: r.declineReason,
    decidedAt: r.decidedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** The kinds the school can issue: those with an active template. */
async function offeredKinds(schoolId: string): Promise<CertificateKind[]> {
  const rows = await db.certificateTemplate.findMany({ where: { schoolId, active: true }, select: { kind: true }, distinct: ["kind"] });
  return rows.map((r) => r.kind as CertificateKind);
}

/** Where a new ask is announced: the school's admins and the head. */
async function officeUserIds(schoolId: string): Promise<string[]> {
  const rows = await db.membership.findMany({ where: { schoolId, status: "ACTIVE", leftAt: null, role: { in: ["ADMIN", "PRINCIPAL"] } }, select: { userId: true } });
  return rows.map((r) => r.userId);
}

/** A pupil or a guardian asks. The same kind while one is pending is the same ask. */
export async function requestCertificate(ctx: ActiveContext, input: CertificateRequestSave, childId?: string): Promise<CertificateRequestView> {
  const who = await asker(ctx, childId);
  if (!(await offeredKinds(who.schoolId)).includes(input.kind)) throw new AccessError("certificateRequests.refuseKind");
  const open = await db.certificateRequest.findFirst({ where: { studentMembershipId: who.studentMembershipId, kind: input.kind, status: "PENDING" }, include: INCLUDE });
  if (open) return (await view([open]))[0]!;
  const created = await db.certificateRequest.create({ data: { schoolId: who.schoolId, studentMembershipId: who.studentMembershipId, requestedByUserId: ctx.user.id, kind: input.kind, purpose: input.purpose.trim() }, include: INCLUDE });
  await audit({ schoolId: who.schoolId, actorUserId: ctx.user.id, action: "certificate.request", targetType: "CertificateRequest", targetId: created.id, meta: { kind: input.kind, membershipId: who.studentMembershipId, byGuardian: ctx.role === "PARENT" } });
  const name = created.student.user.preferredName ?? created.student.user.name;
  await Promise.all((await officeUserIds(who.schoolId)).map((userId) => notify({ userId, schoolId: who.schoolId, kind: "SYSTEM", titleKey: "certificateRequests.notifNew", titleVars: { name, kind: input.kind }, body: input.purpose.trim(), url: `/admin/certificates/issue?membershipId=${who.studentMembershipId}&requestId=${created.id}` })));
  return (await view([created]))[0]!;
}

/** The pupil's own asks, or a guardian's for a child, newest first, with the kinds on offer. */
export async function familyRequests(ctx: ActiveContext, childId?: string): Promise<{ items: CertificateRequestView[]; kinds: CertificateKind[] }> {
  const who = await asker(ctx, childId);
  const [rows, kinds] = await Promise.all([
    db.certificateRequest.findMany({ where: { studentMembershipId: who.studentMembershipId }, orderBy: { createdAt: "desc" }, include: INCLUDE, take: 100 }),
    offeredKinds(who.schoolId),
  ]);
  return { items: await view(rows), kinds };
}

/** The family takes a pending ask back. Anything else is answered as it stands. */
export async function cancelRequest(ctx: ActiveContext, requestId: string): Promise<CertificateRequestView> {
  const row = await db.certificateRequest.findFirst({ where: { id: requestId }, include: INCLUDE });
  if (!row) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  await asker(ctx, ctx.role === "PARENT" ? row.studentMembershipId : undefined);
  if (ctx.role === "STUDENT" && row.studentMembershipId !== ctx.membershipId) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view([row]))[0]!;
  const updated = await db.certificateRequest.update({ where: { id: requestId }, data: { status: "CANCELLED", decidedAt: new Date(), decidedByUserId: ctx.user.id }, include: INCLUDE });
  await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "certificate.requestCancel", targetType: "CertificateRequest", targetId: requestId, meta: { kind: row.kind } });
  return (await view([updated]))[0]!;
}

/** The office's queue: pending first, newest first within a status. */
export async function officeRequests(ctx: ActiveContext, status?: CertificateRequestStatus): Promise<{ items: CertificateRequestView[]; pending: number }> {
  const caller = office(ctx);
  const [rows, pending] = await Promise.all([
    db.certificateRequest.findMany({ where: { schoolId: caller.schoolId, ...(status ? { status } : {}) }, orderBy: [{ createdAt: "desc" }], include: INCLUDE, take: 500 }),
    db.certificateRequest.count({ where: { schoolId: caller.schoolId, status: "PENDING" } }),
  ]);
  const order: Record<string, number> = { PENDING: 0, ISSUED: 1, DECLINED: 2, CANCELLED: 3 };
  rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || b.createdAt.getTime() - a.createdAt.getTime());
  return { items: await view(rows), pending };
}

/** One request, for the office's issue page to pre-fill from. */
export async function officeRequest(ctx: ActiveContext, requestId: string): Promise<CertificateRequestView | null> {
  const caller = office(ctx);
  const row = await db.certificateRequest.findFirst({ where: { id: requestId, schoolId: caller.schoolId }, include: INCLUDE });
  return row ? (await view([row]))[0]! : null;
}

/** The office declines with a reason; the family is told. Twice is answered as it stands. */
export async function declineRequest(ctx: ActiveContext, requestId: string, reason: string): Promise<CertificateRequestView> {
  const caller = office(ctx);
  const row = await db.certificateRequest.findFirst({ where: { id: requestId, schoolId: caller.schoolId }, include: INCLUDE });
  if (!row) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view([row]))[0]!;
  const updated = await db.certificateRequest.update({ where: { id: requestId }, data: { status: "DECLINED", declineReason: reason.trim(), decidedAt: new Date(), decidedByUserId: ctx.user.id }, include: INCLUDE });
  await audit({ schoolId: caller.schoolId, actorUserId: ctx.user.id, action: "certificate.requestDecline", targetType: "CertificateRequest", targetId: requestId, meta: { kind: row.kind } });
  await tellFamily(row.schoolId, row.studentMembershipId, row.requestedByUserId, { titleKey: "certificateRequests.notifDeclined", titleVars: { kind: row.kind }, body: reason.trim(), url: "/student/certificates" });
  return (await view([updated]))[0]!;
}

/** Called by issueCertificate: the ask is answered by the paper. A request already settled is left as it stands. */
export async function markRequestIssued(schoolId: string, requestId: string, certificateId: string): Promise<void> {
  const row = await db.certificateRequest.findFirst({ where: { id: requestId, schoolId }, select: { id: true, status: true } });
  if (!row || row.status !== "PENDING") return;
  await db.certificateRequest.update({ where: { id: requestId }, data: { status: "ISSUED", certificateId, decidedAt: new Date() } });
}

/** The purpose a request carries, for an issue that names the request but not the purpose. */
export async function requestPurpose(schoolId: string, requestId: string): Promise<string | null> {
  const row = await db.certificateRequest.findFirst({ where: { id: requestId, schoolId, status: "PENDING" }, select: { purpose: true } });
  return row?.purpose ?? null;
}

/** The pupil and their guardians, and the asker if they are neither, in their own languages. */
async function tellFamily(schoolId: string, studentMembershipId: string, askerUserId: string, message: { titleKey: "certificateRequests.notifDeclined"; titleVars: Record<string, string>; body: string; url: string }) {
  const pupil = await db.membership.findUnique({ where: { id: studentMembershipId }, select: { userId: true } });
  const told = new Set<string>();
  if (pupil) {
    told.add(pupil.userId);
    await notify({ userId: pupil.userId, schoolId, kind: "SYSTEM", ...message, url: "/student/certificates" });
  }
  await notifyGuardians(studentMembershipId, () => ({ schoolId, kind: "SYSTEM", ...message, url: "/parent/certificates" }));
  const guardians = await db.guardianship.findMany({ where: { studentMembershipId, status: "ACTIVE" }, select: { parentUserId: true } });
  for (const g of guardians) told.add(g.parentUserId);
  if (!told.has(askerUserId)) await notify({ userId: askerUserId, schoolId, kind: "SYSTEM", ...message });
}
