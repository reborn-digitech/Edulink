import "server-only";
import { db } from "@/lib/db";
import type { ActiveContext } from "@/lib/session";
import { todayKey } from "@/lib/dates";
import { feeSettings, getStructure, listHeads, listStructures, pupilLedger, officeOrHead } from "@/lib/fees";
import { familyFees, listClaims, receiptFor, confirmClaim } from "@/lib/fees-payments";
import { AccessError } from "@/lib/tenancy";
import { FEE_CLAIM_STALE_DAYS } from "@/lib/constants";
import { currentAcademicYear } from "@/lib/academic-year";
import type { AccessError as AE } from "@/lib/tenancy";

/**
 * The reads behind /api/v1/fees, in the contract's shape: dates as ISO
 * strings, plus the few extras a screen wants beside the lib's answer (the
 * classes a structure can be assigned to, the heads and structures the
 * pupil page's forms need, the webhook URL the settings page shows).
 */

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export async function feesSettingsRead(ctx: ActiveContext) {
  const caller = officeOrHead(ctx);
  const s = await feeSettings(caller.schoolId);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return { ...s, gateway: s.gateway ? { ...s.gateway, updatedAt: iso(s.gateway.updatedAt) } : null, webhookUrl: `${base}/api/webhooks/razorpay/${caller.schoolId}` };
}

export async function feesHeadsRead(ctx: ActiveContext) {
  const caller = officeOrHead(ctx);
  const heads = await listHeads(caller.schoolId, { includeRetired: true });
  return { heads: heads.map((h) => ({ ...h, retiredAt: isoOrNull(h.retiredAt) })) };
}

export async function feesStructuresRead(ctx: ActiveContext, query: { academicYearId?: string; includeArchived?: boolean }) {
  const caller = officeOrHead(ctx);
  const [structures, year, heads] = await Promise.all([listStructures(ctx, query), currentAcademicYear(caller.schoolId), db.feeHead.count({ where: { schoolId: caller.schoolId, retiredAt: null } })]);
  return { structures: structures.map((s) => ({ ...s, publishedAt: isoOrNull(s.publishedAt), archivedAt: isoOrNull(s.archivedAt) })), year: year ? { id: year.id, name: year.name } : null, heads };
}

export async function feesStructureRead(ctx: ActiveContext, structureId: string) {
  const caller = officeOrHead(ctx);
  const [s, classes] = await Promise.all([getStructure(ctx, structureId), db.class.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } })]);
  return { ...s, publishedAt: isoOrNull(s.publishedAt), archivedAt: isoOrNull(s.archivedAt), classes };
}

export async function feesPupilRead(ctx: ActiveContext, studentMembershipId: string, query: { academicYearId?: string }) {
  const caller = officeOrHead(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const [ledger, heads, structures] = await Promise.all([
    pupilLedger(caller.schoolId, studentMembershipId, { academicYearId: query.academicYearId, todayKey: today }),
    listHeads(caller.schoolId),
    listStructures(ctx, {}),
  ]);
  return {
    ...ledger,
    pupil: { ...ledger.pupil, leftAt: isoOrNull(ledger.pupil.leftAt) },
    concessions: ledger.concessions.map((c) => ({ ...c, createdAt: iso(c.createdAt), revokedAt: isoOrNull(c.revokedAt) })),
    payments: ledger.payments.map((p) => ({ ...p, paidAt: isoOrNull(p.paidAt), claimedAt: isoOrNull(p.claimedAt), createdAt: iso(p.createdAt) })),
    heads: heads.map((h) => ({ id: h.id, name: h.name })),
    structures: structures.filter((s) => s.publishedAt && !s.archivedAt).map((s) => ({ id: s.id, name: s.name, gradeLevel: s.gradeLevel })),
    todayKey: today,
  };
}

export async function feesClaimsRead(ctx: ActiveContext) {
  const caller = officeOrHead(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const { claims, waitingForUtr } = await listClaims(ctx, todayKey(school.timezone));
  return { claims: claims.map((c) => ({ ...c, claimedAt: isoOrNull(c.claimedAt), createdAt: iso(c.createdAt) })), waitingForUtr, staleAfterDays: FEE_CLAIM_STALE_DAYS };
}

/** Confirms the named claims one by one; a refusal on one does not stop the rest, and each is reported. */
export async function feesApplyMatches(ctx: ActiveContext, paymentIds: string[], describe: (e: AE) => string) {
  let confirmed = 0;
  const failed: { paymentId: string; error: string }[] = [];
  for (const paymentId of [...new Set(paymentIds)]) {
    try {
      await confirmClaim(ctx, paymentId);
      confirmed += 1;
    } catch (error) {
      failed.push({ paymentId, error: error instanceof AccessError ? describe(error) : "error" });
    }
  }
  return { confirmed, failed };
}

export async function feesReceiptRead(ctx: ActiveContext, receiptId: string) {
  const r = await receiptFor(ctx, receiptId);
  if (!r) throw new AccessError("fees.notFound", "NOT_FOUND");
  return { id: r.id, serial: r.serial, issuedAt: iso(r.issuedAt), reversed: r.reversed, reversalReason: r.reversalReason, refundedPaise: r.refundedPaise, snapshot: r.snapshot };
}

export async function feesFamilyRead(ctx: ActiveContext, childId?: string) {
  const f = await familyFees(ctx, childId);
  return { ...f, child: f.child ? { ...f.child, payments: f.child.payments.map((p) => ({ ...p, paidAt: isoOrNull(p.paidAt), createdAt: iso(p.createdAt) })) } : null };
}

export function feesOverviewShape<T extends { recent: { when: Date }[] }>(o: T) {
  return { ...o, recent: o.recent.map((r) => ({ ...r, when: iso(r.when) })) };
}
