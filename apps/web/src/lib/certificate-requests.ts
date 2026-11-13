import "server-only";
import type { CertificateKind, CertificateRequestSave, CertificateRequestStatus, CertificateRequestView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { consentApplies } from "./student-consent";
import { RuleRefusal } from "./rule-refusal";
import { todayKey } from "./dates";
import { isStaffKind } from "./certificate-rules";
import { translator } from "./i18n/dictionary";
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

/** Whose pupil this is to ask for: the pupil themselves, a former pupil (as an alumnus), or an active guardian of the child. Anyone else: 404. */
async function asker(ctx: ActiveContext, childId?: string): Promise<{ studentMembershipId: string; schoolId: string }> {
  if (ctx.role === "STUDENT" && ctx.membershipId && ctx.schoolId) return { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId };
  // G-6 (4 Oct 2026): a former student asks for a paper again — a TC copy, a
  // bonafide or a no-objection for higher studies, a transcript named in the
  // purpose — through the pupil membership the school's record is kept on.
  if (ctx.role === "ALUMNUS" && ctx.schoolId) {
    const pupil = await db.membership.findFirst({ where: { userId: ctx.user.id, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true } });
    if (!pupil) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
    return { studentMembershipId: pupil.id, schoolId: ctx.schoolId };
  }
  if (ctx.role === "PARENT") {
    // The child named, or — as the record form does — the first child when none is. An adult
    // at a college asks for their own papers: their guardian is refused, as the certificate
    // itself is refused them (assertGuardianAccess with no grant is default-deny; campaign S-2).
    if (childId) {
      const link = await assertGuardianAccess(ctx.user.id, childId);
      return { studentMembershipId: link.studentMembershipId, schoolId: link.student.schoolId };
    }
    const guardianships = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true, studentSchoolId: true } });
    if (guardianships.length === 0) throw new AccessError("access.notYourChild", "NOT_FOUND");
    for (const g of guardianships) if (!(await consentApplies(g.studentMembershipId))) return { studentMembershipId: g.studentMembershipId, schoolId: g.studentSchoolId };
    throw new AccessError("consent.refuseNotGranted");
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

const INCLUDE = {
  student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
  certificate: { select: { serial: true, revokedAt: true } },
} as const;

type Row = { id: string; studentMembershipId: string; kind: string; purpose: string; status: string; requestedByUserId: string; certificateId: string | null; declineReason: string | null; decidedAt: Date | null; createdAt: Date; feePaise: number | null; feeDemandId: string | null; student: { user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] }; certificate: { serial: string; revokedAt: Date | null } | null };

async function view(rows: Row[]): Promise<CertificateRequestView[]> {
  const byIds = [...new Set(rows.map((r) => r.requestedByUserId))];
  const users = byIds.length ? await db.user.findMany({ where: { id: { in: byIds } }, select: { id: true, name: true, preferredName: true } }) : [];
  const names = new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
  const feeIds = rows.map((r) => r.feeDemandId).filter((x): x is string => Boolean(x));
  const paid = new Set(feeIds.length ? (await db.feeDemand.findMany({ where: { id: { in: feeIds }, status: { in: ["PAID", "WAIVED"] } }, select: { id: true } })).map((d) => d.id) : []);
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
    revokedAt: r.certificate?.revokedAt?.toISOString() ?? null,
    feePaise: r.feePaise,
    feePaid: r.feeDemandId ? paid.has(r.feeDemandId) : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** The kinds the school can issue: those with an active template. */
async function offeredKinds(schoolId: string): Promise<CertificateKind[]> {
  const rows = await db.certificateTemplate.findMany({ where: { schoolId, active: true }, select: { kind: true }, distinct: ["kind"] });
  // A staff paper (an appointment letter, risks batch 5A) is never a family's to ask for.
  return rows.map((r) => r.kind as CertificateKind).filter((k) => !isStaffKind(k));
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
  const who = await asker(ctx, ctx.role === "PARENT" ? row.studentMembershipId : undefined);
  if (ctx.role !== "PARENT" && row.studentMembershipId !== who.studentMembershipId) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view([row]))[0]!;
  const closed = await closeRequest(row.schoolId, requestId, { status: "CANCELLED", decidedAt: new Date(), decidedByUserId: ctx.user.id });
  if (closed.closed) await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "certificate.requestCancel", targetType: "CertificateRequest", targetId: requestId, meta: { kind: row.kind, ...closed.fee } });
  return (await view([await db.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, include: INCLUDE })]))[0]!;
}

/**
 * ⚠ A CLOSED ASK TAKES ITS FEE WITH IT (QA-11, QA campaign of 24 October 2026). The office may set a fee on an ask
 * (setRequestFee: a demand on the pupil's ledger); a decline or the family taking the ask back used to leave that
 * demand OPEN, owed on the pupil's ledger and the guardian's fees page for a paper nobody would issue. Now the ask
 * is closed and its fee cancelled in one transaction: the ask's row is locked and moved from PENDING only (a second
 * press, or an Issue at the same moment, finds it moved), then the fee's demand is locked and CANCELLED while nothing
 * is paid on it. A fee with money on it is left as it stands, as setRequestFee leaves a paid fee: the money is real,
 * and giving it back is the office's refund or reversal on the pupil's fees page; the audit row says how much.
 */
async function closeRequest(schoolId: string, requestId: string, data: { status: "CANCELLED" | "DECLINED"; decidedAt: Date; decidedByUserId: string; declineReason?: string }): Promise<{ closed: boolean; fee: { feeCancelled?: true; feeKeptPaidPaise?: number } }> {
  return db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.$queryRaw`SELECT "id" FROM "CertificateRequest" WHERE "id" = ${requestId} AND "schoolId" = ${schoolId} FOR UPDATE`;
    const moved = await tx.certificateRequest.updateMany({ where: { id: requestId, schoolId, status: "PENDING" }, data });
    if (moved.count === 0) return { closed: false, fee: {} };
    const row = await tx.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, select: { feeDemandId: true } });
    if (!row.feeDemandId) return { closed: true, fee: {} };
    // The demand's own lock: a payment posted at this moment (which locks the pupil's open demands) goes first or waits.
    await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${row.feeDemandId} AND "schoolId" = ${schoolId} FOR UPDATE`;
    const cancelled = await tx.feeDemand.updateMany({ where: { id: row.feeDemandId, schoolId, status: "OPEN", paidPaise: 0 }, data: { status: "CANCELLED" } });
    if (cancelled.count === 1) return { closed: true, fee: { feeCancelled: true } };
    const kept = await tx.feeDemand.findUnique({ where: { id: row.feeDemandId }, select: { paidPaise: true } });
    return { closed: true, fee: kept && kept.paidPaise > 0 ? { feeKeptPaidPaise: kept.paidPaise } : {} };
  });
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
  const closed = await closeRequest(caller.schoolId, requestId, { status: "DECLINED", declineReason: reason.trim(), decidedAt: new Date(), decidedByUserId: ctx.user.id });
  if (closed.closed) {
    await audit({ schoolId: caller.schoolId, actorUserId: ctx.user.id, action: "certificate.requestDecline", targetType: "CertificateRequest", targetId: requestId, meta: { kind: row.kind, ...closed.fee } });
    await tellFamily(row.schoolId, row.studentMembershipId, row.requestedByUserId, { titleKey: "certificateRequests.notifDeclined", titleVars: { kind: row.kind }, body: reason.trim(), url: "/student/certificates" });
  }
  return (await view([await db.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, include: INCLUDE })]))[0]!;
}

/**
 * G-6 (4 Oct 2026): the office sets the fee a paper costs — a copy asked for
 * by a former student, usually. It is a demand on the ledger of the pupil
 * membership, under the school's first head of the kind OTHER, due today,
 * paid at the office or the bank and never through the platform (decision
 * 0003); the asker reads the amount and whether it is paid on the request.
 * The same amount again changes nothing; another amount replaces it while
 * nothing is paid on it; a fee partly or wholly paid is not changed.
 */
export async function setRequestFee(ctx: ActiveContext, requestId: string, amountPaise: number): Promise<CertificateRequestView> {
  const caller = office(ctx);
  if (caller.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const row = await db.certificateRequest.findFirst({ where: { id: requestId, schoolId: caller.schoolId }, include: INCLUDE });
  if (!row) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  if (row.feePaise === amountPaise && row.feeDemandId) return (await view([row]))[0]!;
  if (row.status === "DECLINED" || row.status === "CANCELLED") throw new RuleRefusal("certificateRequests.refuseFeeSettled", 409);
  const existing = row.feeDemandId ? await db.feeDemand.findFirst({ where: { id: row.feeDemandId, schoolId: caller.schoolId }, select: { id: true, paidPaise: true, status: true } }) : null;
  if (existing && (existing.paidPaise > 0 || existing.status !== "OPEN")) throw new RuleRefusal("certificateRequests.refuseFeePaid", 409);
  const [head, year, school] = await Promise.all([
    db.feeHead.findFirst({ where: { schoolId: caller.schoolId, kind: "OTHER", retiredAt: null }, orderBy: { sortOrder: "asc" }, select: { id: true, code: true, name: true } }),
    db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { id: true } }),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } }),
  ]);
  if (!head) throw new RuleRefusal("certificateRequests.refuseNoFeeHead", 409);
  if (!year) throw new RuleRefusal("fees.refuseNoYear", 409);
  const t = translator("en");
  const label = t("certificateRequests.feeLabel", { kind: row.kind });
  const lines = JSON.stringify([{ headId: head.id, code: head.code, name: head.name, grossPaise: amountPaise, concessionPaise: 0 }]);
  const updated = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // A decline or a cancel at this moment closes the ask under the same lock (QA-11): a fee is never set on a closed one.
    await tx.$queryRaw`SELECT "id" FROM "CertificateRequest" WHERE "id" = ${row.id} AND "schoolId" = ${caller.schoolId} FOR UPDATE`;
    const now = await tx.certificateRequest.findUniqueOrThrow({ where: { id: row.id }, select: { status: true, feeDemandId: true } });
    if (now.status === "DECLINED" || now.status === "CANCELLED") throw new RuleRefusal("certificateRequests.refuseFeeSettled", 409);
    if (now.feeDemandId !== row.feeDemandId) throw new RuleRefusal("certificateRequests.refuseFeePaid", 409);
    // Only while nothing is paid on it (TA-276): the check above was read outside this transaction, and a payment that
    // held the demand's lock and committed PAID since would otherwise have its net rewritten under it. The condition is
    // read again on the row as it is once the lock is ours.
    if (existing) {
      const unpaid = await tx.feeDemand.updateMany({ where: { id: existing.id, schoolId: caller.schoolId, status: "OPEN", paidPaise: 0 }, data: { grossPaise: amountPaise, netPaise: amountPaise, linesJson: lines } });
      if (unpaid.count === 0) throw new RuleRefusal("certificateRequests.refuseFeePaid", 409);
    }
    const demand = existing
      ? { id: existing.id }
      : await tx.feeDemand.create({ data: { schoolId: caller.schoolId, studentMembershipId: row.studentMembershipId, academicYearId: year.id, instalmentId: null, label, dueDate: new Date(`${todayKey(school.timezone)}T00:00:00.000Z`), grossPaise: amountPaise, concessionPaise: 0, netPaise: amountPaise, linesJson: lines, status: "OPEN" }, select: { id: true } });
    return tx.certificateRequest.update({ where: { id: row.id }, data: { feePaise: amountPaise, feeDemandId: demand.id }, include: INCLUDE });
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.requestFee", targetType: "CertificateRequest", targetId: row.id, meta: { kind: row.kind, amountPaise } });
  return (await view([updated]))[0]!;
}

/**
 * ⚠ ONE ASK, ONE PAPER (QA-12, QA campaign of 24 October 2026). The office and the head pressing Issue on the same
 * ask at once made two numbered papers, both real at the public check, the ask pointing at the second and the first
 * orphaned: the ask was marked answered after the paper existed, by a read and a write of their own. Now
 * issueCertificate claims the ask inside the paper's own transaction, before a number is taken: the ask's row is
 * locked and read again, a PENDING ask goes on, an ask already ISSUED answers the press with that paper and makes
 * none, an ask declined or taken back is refused, and an ask of another pupil is not found. `answerRequest` then
 * points the ask at the paper in the same transaction, so the two never part.
 */
export async function claimRequestForIssue(tx: typeof db, schoolId: string, requestId: string, studentMembershipId: string): Promise<{ issuedCertificateId: string | null }> {
  await tx.$queryRaw`SELECT "id" FROM "CertificateRequest" WHERE "id" = ${requestId} AND "schoolId" = ${schoolId} FOR UPDATE`;
  const row = await tx.certificateRequest.findFirst({ where: { id: requestId, schoolId }, select: { status: true, certificateId: true, studentMembershipId: true } });
  if (!row || row.studentMembershipId !== studentMembershipId) throw new AccessError("certificateRequests.notFound", "NOT_FOUND");
  if (row.status === "ISSUED" && row.certificateId) return { issuedCertificateId: row.certificateId };
  if (row.status !== "PENDING") throw new RuleRefusal("certificateRequests.refuseClosed", 409);
  return { issuedCertificateId: null };
}

/** The ask answered by the paper, in the issue's transaction, after claimRequestForIssue. */
export async function answerRequest(tx: typeof db, schoolId: string, requestId: string, certificateId: string): Promise<void> {
  await tx.certificateRequest.updateMany({ where: { id: requestId, schoolId, status: "PENDING" }, data: { status: "ISSUED", certificateId, decidedAt: new Date() } });
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
  // An adult at a college: their guardians are not told about their papers (campaign S-2).
  if (!(await consentApplies(studentMembershipId))) {
    await notifyGuardians(studentMembershipId, () => ({ schoolId, kind: "SYSTEM", ...message, url: "/parent/certificates" }));
    const guardians = await db.guardianship.findMany({ where: { studentMembershipId, status: "ACTIVE" }, select: { parentUserId: true } });
    for (const g of guardians) told.add(g.parentUserId);
  }
  if (!told.has(askerUserId)) await notify({ userId: askerUserId, schoolId, kind: "SYSTEM", ...message });
}
