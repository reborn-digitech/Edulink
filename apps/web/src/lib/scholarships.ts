import "server-only";
import {
  SCHOLARSHIP_SCHEME_TABLE,
  SCHOLARSHIP_SCHEMES,
  SCHOLARSHIP_SOURCE,
  type CollegeCategory,
  type ScholarshipClaimView,
  type ScholarshipScheme,
  type ScholarshipStatus,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { readJson, writeJson } from "./json";
import { toCsv } from "./csv";
import { isDateKey } from "./dates";
import { assertCollege, assertModuleOn } from "./modules";
import { forSchool } from "./tenant-context";
import { currentAcademicYear } from "./academic-year";
import { recordCounterPayment } from "./fees-payments";
import { dateToDay } from "./fees";
import { assertGuardianAccess } from "./tenancy";
import { parentMaySee } from "./student-consent";
import { claimReceivable, eligibleGrossPaise, expectedShare } from "./college-fees";
import { collegeDesk, collegeStudent, MONEY_READ, MONEY_WRITE, nameOf, rupeesCell, standingOf, yearKeyOf } from "./college-office";
import type { ActiveContext } from "./session";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * SCHOLARSHIPS (module SCHOLARSHIPS; role ACCOUNTS with the office; the
 * owner's college plan of 4 October 2026).
 *
 * ONE CLAIM PER STUDENT, SCHEME AND YEAR: the state portal's application id
 * (MahaDBT for the state's schemes, the National Scholarship Portal for the
 * central ones), what the office expects the scheme to bring (the scheme's
 * share of the eligible heads, SCHOLARSHIP_SCHEME_TABLE, until the
 * sanction replaces it), what was sanctioned and when, what the state put in
 * the college's bank, when, and its reference. APPLIED → SANCTIONED →
 * DISBURSED, or LAPSED / REJECTED.
 *
 * ON THE LEDGER. While APPLIED or SANCTIONED the amount is a receivable the
 * family's ledger is shown net of (college-fees.ts `ledgerFor`). A
 * disbursement is the bank credit it is: recorded as a payment on the
 * student's ledger by the accounts desk, with the state's reference, so the
 * receipt and the reconciliation sheet agree and the money is never the
 * platform's (decision 0003). A LAPSE or a REJECTION takes the receivable
 * away — the demand is the family's to pay again — and the student (and a
 * guardian who may see money) is told.
 *
 * WHO MAY CLAIM. A scheme open to some categories refuses a student admitted
 * under another; a family income on the record above the scheme's ceiling is
 * refused; an unknown income is not, because the portal checks the
 * certificate.
 *
 * ALUMNI-FUNDED SCHOLARSHIPS are claims of scheme OTHER that name the
 * placement module's AlumniGift (kind SCHOLARSHIP) by id.
 */

const desk = (ctx: ActiveContext, roles = MONEY_WRITE) => collegeDesk(ctx, roles, "SCHOLARSHIPS");

type ClaimRow = Awaited<ReturnType<typeof db.scholarshipClaim.findFirstOrThrow>> & { student?: { user: { name: string; preferredName: string | null } } };

function ageDays(c: { status: string; appliedAt: Date | null; sanctionedAt: Date | null; createdAt: Date }, now: Date): number | null {
  if (c.status !== "APPLIED" && c.status !== "SANCTIONED") return null;
  const from = c.status === "SANCTIONED" ? (c.sanctionedAt ?? c.createdAt) : (c.appliedAt ?? c.createdAt);
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86_400_000));
}

export function claimView(c: ClaimRow, studentName: string, now: Date = new Date()): ScholarshipClaimView {
  return {
    id: c.id,
    studentMembershipId: c.studentMembershipId,
    studentName,
    scheme: c.scheme as ScholarshipScheme,
    academicYear: c.academicYear,
    portalApplicationId: c.portalApplicationId,
    appliedAt: c.appliedAt?.toISOString() ?? null,
    expectedPaise: c.expectedPaise,
    sanctionedPaise: c.sanctionedPaise,
    sanctionedAt: c.sanctionedAt?.toISOString() ?? null,
    disbursedPaise: c.disbursedPaise,
    disbursedAt: c.disbursedAt?.toISOString() ?? null,
    disbursementRef: c.disbursementRef,
    status: c.status as ScholarshipStatus,
    documents: readJson<ScholarshipClaimView["documents"]>(c.documentsJson, []),
    alumniGiftId: c.alumniGiftId,
    ageDays: ageDays(c, now),
  };
}

const WITH_STUDENT = { student: { select: { user: { select: { name: true, preferredName: true } } } } } as const;

export async function listClaims(ctx: ActiveContext, q: { status?: ScholarshipStatus; academicYear?: string; scheme?: ScholarshipScheme }): Promise<{ items: ScholarshipClaimView[] }> {
  const d = await desk(ctx, MONEY_READ);
  const rows = await db.scholarshipClaim.findMany({ where: { schoolId: d.schoolId, ...(q.status ? { status: q.status } : {}), ...(q.academicYear ? { academicYear: q.academicYear } : {}), ...(q.scheme ? { scheme: q.scheme } : {}) }, include: WITH_STUDENT, orderBy: [{ academicYear: "desc" }, { createdAt: "asc" }], take: 3000 });
  return { items: rows.map((r) => claimView(r, nameOf(r.student.user))) };
}

/** Whether a scheme is open to this category and income (null income: not refused — the portal checks the certificate). */
export function schemeOpenTo(scheme: ScholarshipScheme, category: string | null, incomeRupees: number | null): boolean {
  const rule = SCHOLARSHIP_SCHEME_TABLE[scheme];
  if (rule.categories && (!category || !(rule.categories as readonly string[]).includes(category))) return false;
  if (rule.incomeCeilingRupees !== null && incomeRupees !== null && incomeRupees > rule.incomeCeilingRupees) return false;
  return true;
}

/** A claim filed on the portal, recorded. The same student, scheme and year again is the same claim. */
export async function createClaim(ctx: ActiveContext, input: { studentMembershipId: string; scheme: ScholarshipScheme; academicYear?: string; portalApplicationId?: string; appliedOn?: string; expectedPaise?: number; alumniGiftId?: string }): Promise<ScholarshipClaimView> {
  const d = await desk(ctx);
  const student = await collegeStudent(d.schoolId, input.studentMembershipId);
  const year = await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const academicYear = input.academicYear ?? yearKeyOf(year.startDate);
  const existing = await db.scholarshipClaim.findUnique({ where: { studentMembershipId_scheme_academicYear: { studentMembershipId: student.id, scheme: input.scheme, academicYear } }, include: WITH_STUDENT });
  if (existing) return claimView(existing, nameOf(existing.student.user));
  const standing = await standingOf(student.id, year.startDate.getUTCFullYear());
  const record = await db.pupilRecord.findUnique({ where: { studentMembershipId: student.id }, select: { annualIncome: true } });
  if (!schemeOpenTo(input.scheme, standing.category, record?.annualIncome ?? null)) throw new AccessError("collegeOffice.refuseSchemeNotOpen");
  if (input.appliedOn && !isDateKey(input.appliedOn)) throw new AccessError("collegeOffice.refuseDates");
  const expectedPaise = input.expectedPaise ?? (await expectedShare(d.schoolId, student.id, year.id, input.scheme));
  const row = await db.scholarshipClaim.create({
    data: { schoolId: d.schoolId, studentMembershipId: student.id, scheme: input.scheme, academicYear, portalApplicationId: input.portalApplicationId ?? null, appliedAt: input.appliedOn ? new Date(`${input.appliedOn}T00:00:00Z`) : new Date(), expectedPaise, alumniGiftId: input.alumniGiftId ?? null, createdByUserId: d.userId },
    include: WITH_STUDENT,
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "scholarship.claim", targetType: "ScholarshipClaim", targetId: row.id, meta: { scheme: input.scheme, academicYear, expectedPaise } });
  return claimView(row, nameOf(row.student.user));
}

type Update =
  | { action: "SANCTION"; amountPaise: number; on: string }
  | { action: "DISBURSE"; amountPaise: number; on: string; reference: string }
  | { action: "LAPSE"; reason: string }
  | { action: "REJECT"; reason: string }
  | { action: "PORTAL_ID"; portalApplicationId: string };

/** Tell the student — and a guardian who may see money — that the state's share is now theirs to pay. */
async function tellReverted(schoolId: string, studentMembershipId: string, userId: string, scheme: string, paise: number, lapsed: boolean): Promise<void> {
  const vars = { scheme, amount: rupeesCell(paise) };
  const titleKey = lapsed ? "collegeOffice.notifScholarshipLapsed" : "collegeOffice.notifScholarshipRejected";
  await notify({ userId, schoolId, kind: "SYSTEM", titleKey, titleVars: vars, bodyKey: "collegeOffice.notifScholarshipRevertBody", bodyVars: vars, url: "/student/fees", urgent: true }).catch(() => undefined);
  if (await parentMaySee(studentMembershipId, "MONEY")) {
    await notifyGuardians(studentMembershipId, (name) => ({ schoolId, kind: "SYSTEM", titleKey, titleVars: vars, bodyKey: "collegeOffice.notifScholarshipRevertChild", bodyVars: { ...vars, name }, url: "/parent/fees" }), "MONEY").catch(() => undefined);
  }
}

/**
 * THE MOST A SANCTION MAY BE (A3-journeys-9, audit of 5 October 2026): the fees the claim covers — the student's
 * tuition, development and exam fees for the claim's year, net of concessions (`eligibleGrossPaise`, the base
 * `expectedShare` takes its percentage of) — or the claim's own expected figure when the office recorded a larger
 * one. A ₹99,999 sanction on a ₹15,750 claim was accepted and lifted "Owed by the state" above the college's whole
 * outstanding; a fee scholarship cannot pay more than the fees, and the disbursement inherits the bound.
 */
export async function sanctionCeiling(schoolId: string, c: { studentMembershipId: string; academicYear: string; expectedPaise: number }): Promise<number> {
  const years = await db.academicYear.findMany({ where: { schoolId }, select: { id: true, startDate: true } });
  const year = years.find((y) => yearKeyOf(y.startDate) === c.academicYear);
  const fees = year ? await eligibleGrossPaise(schoolId, c.studentMembershipId, year.id) : 0;
  return Math.max(c.expectedPaise, fees);
}

export async function updateClaim(ctx: ActiveContext, claimId: string, u: Update): Promise<ScholarshipClaimView> {
  const d = await desk(ctx);
  const c = await db.scholarshipClaim.findFirst({ where: { id: claimId, schoolId: d.schoolId }, include: { student: { select: { userId: true, user: { select: { name: true, preferredName: true } } } } } });
  if (!c) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const name = nameOf(c.student.user);
  const day = (key: string) => {
    if (!isDateKey(key)) throw new AccessError("collegeOffice.refuseDates");
    return new Date(`${key}T00:00:00Z`);
  };
  let data: Record<string, unknown> = {};
  switch (u.action) {
    case "PORTAL_ID":
      data = { portalApplicationId: u.portalApplicationId.trim() };
      break;
    case "SANCTION":
      if (c.status === "SANCTIONED" && c.sanctionedPaise === u.amountPaise) return claimView(c, name);
      if (c.status !== "APPLIED" && c.status !== "SANCTIONED") throw new AccessError("collegeOffice.refuseClaimStep");
      if (u.amountPaise > (await sanctionCeiling(d.schoolId, c))) throw new AccessError("collegeOffice.refuseSanctionTooMuch");
      data = { status: "SANCTIONED", sanctionedPaise: u.amountPaise, sanctionedAt: day(u.on) };
      break;
    case "DISBURSE": {
      if (c.status === "DISBURSED") return claimView(c, name);
      if (c.status !== "SANCTIONED") throw new AccessError("collegeOffice.refuseClaimStep");
      if (u.amountPaise > (c.sanctionedPaise ?? 0) || u.amountPaise < 100) throw new AccessError("collegeOffice.refuseDisbursedAmount");
      // The state's credit in the college's bank, on the ledger as the bank payment it is (one per claim: the claim's id is the form's id).
      await recordCounterPayment(ctx, { studentMembershipId: c.studentMembershipId, amountPaise: u.amountPaise, method: "BANK", reference: u.reference.trim(), note: `${c.scheme} ${c.academicYear}`, clientId: `scholarship-${c.id}`, paidAtKey: u.on });
      data = { status: "DISBURSED", disbursedPaise: u.amountPaise, disbursedAt: day(u.on), disbursementRef: u.reference.trim() };
      break;
    }
    case "LAPSE":
    case "REJECT": {
      const target = u.action === "LAPSE" ? "LAPSED" : "REJECTED";
      if (c.status === target) return claimView(c, name);
      if (c.status !== "APPLIED" && c.status !== "SANCTIONED") throw new AccessError("collegeOffice.refuseClaimStep");
      data = { status: target, note: u.reason.trim().slice(0, 300), ...(u.action === "LAPSE" ? { lapsedAt: new Date() } : {}) };
      break;
    }
  }
  const before = claimReceivable(c);
  const row = await db.scholarshipClaim.update({ where: { id: c.id }, data, include: WITH_STUDENT });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: `scholarship.${u.action.toLowerCase()}`, targetType: "ScholarshipClaim", targetId: c.id, meta: { scheme: c.scheme, ...("amountPaise" in u ? { amountPaise: u.amountPaise } : {}) } });
  if ((u.action === "LAPSE" || u.action === "REJECT") && before > 0) await tellReverted(d.schoolId, c.studentMembershipId, c.student.userId, c.scheme, before, u.action === "LAPSE");
  return claimView(row, nameOf(row.student.user));
}

/**
 * THE RECONCILIATION SHEET for one scheme and year, as the state portal's
 * reconciliation asks the college for it: every claim with the portal's
 * application id, what was expected, sanctioned and disbursed with the
 * dates and the bank reference, and the difference still to come.
 */
export async function reconciliationSheet(ctx: ActiveContext, scheme: ScholarshipScheme, academicYear: string, t: Translate): Promise<{ filename: string; csv: string }> {
  const d = await desk(ctx, MONEY_READ);
  // Ordered by creation and then id (QA-39), so two claims made in one millisecond keep their serials on every download.
  const rows = await db.scholarshipClaim.findMany({ where: { schoolId: d.schoolId, scheme, academicYear }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { student: { select: { user: { select: { name: true, preferredName: true } }, pupilRecord: { select: { prn: true, admissionCategory: true } } } } } });
  const H = (k: string) => t(`collegeOffice.recon${k}` as TranslationKey);
  const headers = [H("Serial"), H("Name"), H("Prn"), H("Category"), H("PortalId"), H("Applied"), H("Expected"), H("Sanctioned"), H("SanctionedOn"), H("Disbursed"), H("DisbursedOn"), H("Reference"), H("Status"), H("Difference")];
  const out = rows.map((r, i) => ({
    [headers[0]!]: i + 1,
    [headers[1]!]: nameOf(r.student.user),
    [headers[2]!]: r.student.pupilRecord?.prn ?? "",
    [headers[3]!]: r.student.pupilRecord?.admissionCategory ?? "",
    [headers[4]!]: r.portalApplicationId ?? "",
    [headers[5]!]: r.appliedAt ? dateToDay(r.appliedAt) : "",
    [headers[6]!]: rupeesCell(r.expectedPaise),
    [headers[7]!]: r.sanctionedPaise === null ? "" : rupeesCell(r.sanctionedPaise),
    [headers[8]!]: r.sanctionedAt ? dateToDay(r.sanctionedAt) : "",
    [headers[9]!]: r.disbursedPaise === null ? "" : rupeesCell(r.disbursedPaise),
    [headers[10]!]: r.disbursedAt ? dateToDay(r.disbursedAt) : "",
    [headers[11]!]: r.disbursementRef ?? "",
    [headers[12]!]: r.status,
    [headers[13]!]: rupeesCell(Math.max(0, (r.sanctionedPaise ?? 0) - (r.disbursedPaise ?? 0))),
  }));
  return { filename: `scholarship-${scheme.toLowerCase()}-${academicYear}.csv`, csv: toCsv(out, headers) };
}

function schemeRows(category: string | null, incomeRupees: number | null, forStudent: boolean) {
  return SCHOLARSHIP_SCHEMES.map((scheme) => {
    const r = SCHOLARSHIP_SCHEME_TABLE[scheme];
    return { scheme, categories: r.categories ? [...r.categories] as CollegeCategory[] : null, incomeCeilingRupees: r.incomeCeilingRupees, coversPercent: r.coversPercent, portal: r.portal, eligible: forStudent ? schemeOpenTo(scheme, category, incomeRupees) : null };
  });
}

export async function schemesView(ctx: ActiveContext) {
  await assertCollege(ctx.schoolId);
  return { schemes: schemeRows(null, null, false), source: { ...SCHOLARSHIP_SOURCE } };
}

/** Whose claims a student or a guardian reads: the student's own; a guardian's child's while money may be seen. */
async function readerStudent(ctx: ActiveContext, childId?: string): Promise<{ studentMembershipId: string; schoolId: string; userId: string }> {
  if (ctx.role === "STUDENT" && ctx.membershipId && ctx.schoolId) return { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId, userId: ctx.user.id };
  if (ctx.role === "PARENT") {
    const link = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", ...(childId ? { studentMembershipId: childId } : {}) }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true, studentSchoolId: true, student: { select: { userId: true } } } });
    if (!link) throw new AccessError("access.notYourChild", "NOT_FOUND");
    await assertGuardianAccess(ctx.user.id, link.studentMembershipId, "MONEY");
    return { studentMembershipId: link.studentMembershipId, schoolId: link.studentSchoolId, userId: link.student.userId };
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

/** The student's own scholarships: their claims and the schemes they qualify for by category and income band. */
export async function myScholarships(ctx: ActiveContext, childId?: string) {
  const who = await readerStudent(ctx, childId);
  // A guardian's session carries no school: the child's college's rows are read under its binding.
  if (ctx.role === "PARENT") return forSchool(who.schoolId, () => scholarshipsOf(who));
  return scholarshipsOf(who);
}

async function scholarshipsOf(who: { studentMembershipId: string; schoolId: string }) {
  await assertCollege(who.schoolId);
  await assertModuleOn(who.schoolId, "SCHOLARSHIPS");
  const year = await currentAcademicYear(who.schoolId);
  const [standing, record, claims, m] = await Promise.all([
    standingOf(who.studentMembershipId, year ? year.startDate.getUTCFullYear() : null),
    db.pupilRecord.findUnique({ where: { studentMembershipId: who.studentMembershipId }, select: { annualIncome: true } }),
    db.scholarshipClaim.findMany({ where: { studentMembershipId: who.studentMembershipId }, orderBy: [{ academicYear: "desc" }, { createdAt: "asc" }] }),
    db.membership.findUniqueOrThrow({ where: { id: who.studentMembershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
  ]);
  return { claims: claims.map((c) => claimView(c, nameOf(m.user))), schemes: schemeRows(standing.category, record?.annualIncome ?? null, true), category: standing.category };
}

/**
 * A document the portal asks for, added to the student's own claim: the
 * student's upload (its ticket is theirs and is spent here), named by what it
 * is. The same file twice is listed once.
 */
export async function addClaimDocument(ctx: ActiveContext, claimId: string, input: { key: string; fileId: string; name: string }, opts: { storedHere?: boolean } = {}): Promise<ScholarshipClaimView> {
  if (ctx.role !== "STUDENT" || !ctx.membershipId || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "SCHOLARSHIPS");
  const c = await db.scholarshipClaim.findFirst({ where: { id: claimId, studentMembershipId: ctx.membershipId }, include: WITH_STUDENT });
  if (!c) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const docs = readJson<ScholarshipClaimView["documents"]>(c.documentsJson, []);
  if (docs.some((x) => x.fileId === input.fileId)) return claimView(c, nameOf(c.student.user));
  if (c.status !== "APPLIED" && c.status !== "SANCTIONED") throw new AccessError("collegeOffice.refuseClaimStep");
  // The phone's upload is a ticket the student holds and spends here; the web form stored the file itself a moment ago (`storedHere`).
  if (!opts.storedHere) {
    const spent = await db.uploadTicket.updateMany({ where: { fileId: input.fileId, userId: ctx.user.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (spent.count !== 1) throw new AccessError("collegeOffice.refuseFile");
  }
  docs.push({ key: input.key, fileId: input.fileId, name: input.name.trim().slice(0, 120), uploadedAt: new Date().toISOString() });
  const row = await db.scholarshipClaim.update({ where: { id: c.id }, data: { documentsJson: writeJson(docs.slice(-12)) }, include: WITH_STUDENT });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "scholarship.document", targetType: "ScholarshipClaim", targetId: c.id, meta: { key: input.key } });
  return claimView(row, nameOf(row.student.user));
}

/** Ageing of what the state still owes, by bucket, for the accounts home. */
export function ageingBucket(days: number): "0_30" | "31_90" | "91_180" | "OVER_180" {
  if (days <= 30) return "0_30";
  if (days <= 90) return "31_90";
  if (days <= 180) return "91_180";
  return "OVER_180";
}

