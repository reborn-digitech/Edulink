import "server-only";
import {
  ADMISSION_QUOTAS,
  COLLEGE_CATEGORIES,
  DOCUMENTS_BY_CATEGORY,
  REFUND_PROCESSING,
  REFUND_SLABS,
  SCRUTINY_DOCUMENTS,
  type AdmissionQuota,
  type AdmissionRoundKind,
  type AdmissionRoundView,
  type CollegeApplicationStatus,
  type CollegeApplicationView,
  type CollegeCategory,
  type RefundSlabCode,
  type ScrutinyDocument,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { readJson, writeJson } from "./json";
import { ageInYears, isDateKey, todayKey } from "./dates";
import { parseCsvRecords, toCsv } from "./csv";
import { studentCode } from "./codes";
import { HANDLE_DOMAIN } from "./login-name";
import { regenerateDemands, dateToDay } from "./fees";
import { recordCounterPayment } from "./fees-payments";
import { issueFirstSignIn } from "./first-signin";
import { syncGradeLevel } from "./grade-level";
import { collegeDesk, type Desk } from "./college-office";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * COLLEGE ADMISSIONS (module ADMISSIONS; the owner's college plan of
 * 4 October 2026). The school's admissions (admissions.ts — a cycle, a
 * family's form, an entrance test) are untouched and ungated; this is the
 * college's road, which starts from somebody else's list.
 *
 * THE ROUND. Maharashtra's State CET Cell allots seats in three CAP rounds;
 * the college then fills what is left in an institute-level round, and a
 * non-professional programme admits on its own merit list. The office opens
 * a round with the seat matrix by category and imports the CET Cell's
 * allotment list for it as pasted from the portal, in the Cell's column
 * order (CAP_SHEET_COLUMNS). The CET application id is unique per round, so
 * importing the same list twice adds nothing.
 *
 * THE APPLICATION moves APPLIED → SCRUTINY → OFFERED → FEE_DUE → ADMITTED:
 * every document the category requires (DOCUMENTS_BY_CATEGORY, with the gap
 * and migration certificates for a candidate who must show them) verified
 * against an uploaded file; the anti-ragging undertaking recorded from the
 * student AND a parent (the UGC's 2009 regulations; the antiragging.in
 * portal stays the legal record, as the screen says); the offer, which reads
 * the admission fee off the category's fee structure for the first year; the
 * fee received at the college's own counter or bank and recorded; the seat.
 *
 * THE SEAT IS ONE TRANSACTION: the student's account and STUDENT
 * membership, the pupil record with the college's fields (PRN, APAAR id, ABC
 * id, category, quota, round, year of entry — never Aadhaar), the
 * ProgrammeEnrolment (the admission's record), the academic seat
 * (StudentProgramme, the academics module's, when the programme has a
 * scheme), the fee plan by category with its demands. Anything refused
 * inside it — an APAAR id already on another student — undoes all of it.
 * The admission fee is then written on the ledger as the counter payment it
 * was, against the first term's demand, so the receipt and the ledger agree.
 *
 * CANCELLATION AND REFUND. A cancelled seat's refund follows the slab
 * (REFUND_SLABS, the UGC's 2018 notification) measured from the formally
 * notified last date of admission; the caution deposit comes back whole.
 * The refund is RECORDED — the slab, the amount, later the bank's reference
 * — and paid by the college from its own account (decision 0003).
 */

const OFFICE_WRITE: readonly Role[] = ["ADMIN"];
const OFFICE_READ: readonly Role[] = ["ADMIN", "PRINCIPAL"];
const MONEY_DESK: readonly Role[] = ["ADMIN", "ACCOUNTS"];

const desk = (ctx: ActiveContext, roles: readonly Role[] = OFFICE_WRITE) => collegeDesk(ctx, roles, "ADMISSIONS");

type Doc = { required: boolean; fileId: string | null; status: "PENDING" | "VERIFIED" | "REJECTED"; note: string | null };
type Docs = Partial<Record<ScrutinyDocument, Doc>>;

/* -------------------------------------------------------------------------- */
/* Pure rules                                                                  */
/* -------------------------------------------------------------------------- */

/** The documents an applicant of this category must show, with the extras the office named. */
export function requiredDocuments(category: CollegeCategory, extra: readonly ScrutinyDocument[] = []): ScrutinyDocument[] {
  return [...new Set([...DOCUMENTS_BY_CATEGORY[category], ...extra])];
}

/** Scrutiny is complete when every required document is VERIFIED against a file. */
export function scrutinyComplete(docs: Docs): boolean {
  const required = Object.entries(docs).filter(([, d]) => d?.required);
  return required.length > 0 && required.every(([, d]) => d!.status === "VERIFIED" && Boolean(d!.fileId));
}

/**
 * The refund the slab allows for fees paid, on a cancellation dated
 * `cancelKey` against the last date of admission `lastKey`. The caution
 * deposit is outside the slab and comes back whole.
 */
export function refundFor(input: { paidPaise: number; cautionPaise: number; cancelKey: string; lastKey: string }): { slab: RefundSlabCode; percent: number; processingPaise: number; refundPaise: number } {
  const fee = Math.max(0, input.paidPaise - input.cautionPaise);
  const daysBefore = Math.round((Date.parse(`${input.lastKey}T00:00:00Z`) - Date.parse(`${input.cancelKey}T00:00:00Z`)) / 86_400_000);
  let slab: (typeof REFUND_SLABS)[number];
  if (daysBefore >= 15) slab = REFUND_SLABS[0];
  else if (daysBefore >= 0) slab = REFUND_SLABS[1];
  else if (-daysBefore <= 15) slab = REFUND_SLABS[2];
  else if (-daysBefore <= 30) slab = REFUND_SLABS[3];
  else slab = REFUND_SLABS[4];
  const gross = Math.round((fee * slab.percent) / 100);
  const processingPaise = slab.processing ? Math.min(REFUND_PROCESSING.capPaise, Math.round((fee * REFUND_PROCESSING.percent) / 100)) : 0;
  return { slab: slab.code, percent: slab.percent, processingPaise, refundPaise: Math.max(0, gross - processingPaise) + Math.max(0, input.cautionPaise) };
}

/** The CET Cell's category column as the college's fee category; null for what is not one. */
export function cetCategory(raw: string): CollegeCategory | null {
  const v = raw.trim().toUpperCase().replace(/[\s.-]+/g, "");
  if ((COLLEGE_CATEGORIES as readonly string[]).includes(v)) return v as CollegeCategory;
  if (["GENERAL", "GEN", "GOPEN", "LOPEN"].includes(v)) return "OPEN";
  if (["VJ", "NT1", "NT2", "NT3", "NTB", "NTC", "NTD", "VJA", "DTA", "VJDT"].includes(v)) return "VJNT";
  if (v === "SEBC") return "OBC";
  return null;
}

/** The quota a round fills, read with the seat type when the CET Cell names a scheme in it (TFWS). */
export function quotaFor(kind: AdmissionRoundKind, seatType: string): AdmissionQuota {
  if (/TFWS/i.test(seatType)) return "TFWS";
  if (kind.startsWith("CAP")) return "CAP";
  if (/MANAG/i.test(seatType)) return "MANAGEMENT";
  if (/NRI/i.test(seatType)) return "NRI";
  return "INSTITUTE";
}

/* -------------------------------------------------------------------------- */
/* Rounds                                                                      */
/* -------------------------------------------------------------------------- */

const seatsOf = (raw: string): Record<string, number> => readJson<Record<string, number>>(raw, {});

export async function listRounds(ctx: ActiveContext): Promise<{ rounds: AdmissionRoundView[] }> {
  const d = await desk(ctx, OFFICE_READ);
  const rows = await db.admissionRound.findMany({
    where: { schoolId: d.schoolId },
    orderBy: [{ intakeYear: "desc" }, { opensAt: "asc" }],
    include: { _count: { select: { allotments: true, applications: true } } },
  });
  const admitted = await db.collegeApplication.groupBy({ by: ["roundId"], where: { schoolId: d.schoolId, status: "ADMITTED" }, _count: { _all: true } });
  const byRound = new Map(admitted.map((a) => [a.roundId, a._count._all]));
  return {
    rounds: rows.map((r) => ({
      id: r.id,
      programmeId: r.programmeId,
      intakeYear: r.intakeYear,
      kind: r.kind as AdmissionRoundKind,
      name: r.name,
      opensAt: r.opensAt.toISOString(),
      closesAt: r.closesAt.toISOString(),
      seats: seatsOf(r.seatsJson),
      status: r.status as "OPEN" | "CLOSED",
      allotments: r._count.allotments,
      applications: r._count.applications,
      admitted: byRound.get(r.id) ?? 0,
    })),
  };
}

async function programmeOf(schoolId: string, programmeId: string) {
  const p = await db.programme.findFirst({ where: { id: programmeId, schoolId }, select: { id: true, code: true, name: true } });
  if (!p) throw new AccessError("collegeOffice.refuseProgramme");
  return p;
}

export async function saveRound(ctx: ActiveContext, input: { programmeId?: string | null; intakeYear: number; kind: AdmissionRoundKind; name: string; opensOn: string; closesOn: string; seats: Partial<Record<CollegeCategory, number>> }): Promise<{ id: string }> {
  const d = await desk(ctx);
  if (input.programmeId) await programmeOf(d.schoolId, input.programmeId);
  if (!isDateKey(input.opensOn) || !isDateKey(input.closesOn) || input.closesOn < input.opensOn) throw new AccessError("collegeOffice.refuseDates");
  const seats = Object.fromEntries(Object.entries(input.seats).filter(([k, v]) => (COLLEGE_CATEGORIES as readonly string[]).includes(k) && Number.isInteger(v) && (v as number) >= 0));
  const existing = await db.admissionRound.findFirst({ where: { schoolId: d.schoolId, intakeYear: input.intakeYear, kind: input.kind, name: input.name.trim() }, select: { id: true } });
  const data = { programmeId: input.programmeId ?? null, opensAt: new Date(`${input.opensOn}T00:00:00Z`), closesAt: new Date(`${input.closesOn}T23:59:59Z`), seatsJson: writeJson(seats) };
  const row = existing
    ? await db.admissionRound.update({ where: { id: existing.id }, data, select: { id: true } })
    : await db.admissionRound.create({ data: { schoolId: d.schoolId, intakeYear: input.intakeYear, kind: input.kind, name: input.name.trim(), createdByUserId: d.userId, ...data }, select: { id: true } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.round", targetType: "AdmissionRound", targetId: row.id, meta: { kind: input.kind, intakeYear: input.intakeYear, updated: Boolean(existing) } });
  return row;
}

async function roundOf(d: Desk, roundId: string) {
  const r = await db.admissionRound.findFirst({ where: { id: roundId, schoolId: d.schoolId } });
  if (!r) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  return r;
}

/**
 * The CET Cell's allotment list for a round, pasted: one row per allotted
 * candidate in CAP_SHEET_COLUMNS order, a heading row skipped. A row with no
 * application id, no name or a category the Cell does not use is refused by
 * its line; a choice code no programme of the college carries is kept and
 * counted, for the office to see. A second import of the same list adds
 * nothing (the application id is unique per round).
 */
export async function importAllotments(ctx: ActiveContext, roundId: string, text: string): Promise<{ added: number; already: number; refused: { line: number; reason: string }[]; unmatchedProgramme: number }> {
  const d = await desk(ctx);
  const round = await roundOf(d, roundId);
  const programmes = await db.programme.findMany({ where: { schoolId: d.schoolId }, select: { id: true, code: true } });
  const matchProgramme = (choice: string): string | null => {
    const c = choice.trim().toUpperCase();
    if (!c) return round.programmeId;
    const exact = programmes.find((p) => p.code.toUpperCase() === c);
    if (exact) return exact.id;
    const tail = programmes.find((p) => p.code.length >= 3 && c.endsWith(p.code.toUpperCase()));
    return tail?.id ?? round.programmeId ?? null;
  };
  const { records, lineNumbers } = parseCsvRecords(text.includes("\t") ? text.replace(/\t/g, ",") : text);
  const refused: { line: number; reason: string }[] = [];
  const rows: { cetApplicationId: string; applicantName: string; programmeCode: string; programmeId: string | null; category: string; quota: string; meritNumber: number | null }[] = [];
  const seen = new Set<string>();
  records.forEach((cells, i) => {
    const line = lineNumbers[i] ?? i + 1;
    if (cells.every((c) => !c.trim())) return;
    if (i === 0 && !/\d/.test(cells[1] ?? "")) return; // the heading row
    const [, applicationId = "", name = "", , category = "", seatType = "", choiceCode = "", meritNo = ""] = cells.map((c) => c.trim());
    if (!/^[A-Z0-9-]{4,30}$/i.test(applicationId)) return void refused.push({ line, reason: "applicationId" });
    if (name.length < 2) return void refused.push({ line, reason: "name" });
    const cat = cetCategory(/EWS/i.test(seatType) ? "EWS" : category);
    if (!cat) return void refused.push({ line, reason: "category" });
    if (seen.has(applicationId.toUpperCase())) return void refused.push({ line, reason: "duplicate" });
    seen.add(applicationId.toUpperCase());
    const merit = Number.parseInt(meritNo, 10);
    rows.push({ cetApplicationId: applicationId.toUpperCase(), applicantName: name.slice(0, 120), programmeCode: choiceCode.slice(0, 40), programmeId: matchProgramme(choiceCode), category: cat, quota: quotaFor(round.kind as AdmissionRoundKind, seatType), meritNumber: Number.isFinite(merit) && merit > 0 ? merit : null });
  });
  const created = rows.length ? await db.capAllotment.createMany({ data: rows.map((r) => ({ ...r, schoolId: d.schoolId, roundId: round.id, importedByUserId: d.userId })), skipDuplicates: true }) : { count: 0 };
  const result = { added: created.count, already: rows.length - created.count, refused, unmatchedProgramme: rows.filter((r) => !r.programmeId).length };
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.import", targetType: "AdmissionRound", targetId: round.id, meta: { added: result.added, already: result.already, refused: refused.length } });
  return result;
}

/**
 * Seats against admissions, by category, for the round's intake (and its
 * programme when it has one): every round of the year counts, so the report
 * after CAP round 2 shows what rounds 1 and 2 left between them.
 */
export async function vacancyReport(ctx: ActiveContext, roundId: string) {
  const d = await desk(ctx, OFFICE_READ);
  const round = await roundOf(d, roundId);
  const seats = seatsOf(round.seatsJson);
  const admitted = await db.collegeApplication.groupBy({
    by: ["category"],
    where: { schoolId: d.schoolId, status: "ADMITTED", round: { intakeYear: round.intakeYear }, ...(round.programmeId ? { programmeId: round.programmeId } : {}) },
    _count: { _all: true },
  });
  const byCat = new Map(admitted.map((a) => [a.category, a._count._all]));
  const rows = COLLEGE_CATEGORIES.filter((c) => (seats[c] ?? 0) > 0 || byCat.has(c)).map((category) => {
    const s = seats[category] ?? 0;
    const a = byCat.get(category) ?? 0;
    return { category, seats: s, admitted: a, vacant: Math.max(0, s - a) };
  });
  const totals = rows.reduce((t, r) => ({ seats: t.seats + r.seats, admitted: t.admitted + r.admitted, vacant: t.vacant + r.vacant }), { seats: 0, admitted: 0, vacant: 0 });
  return { roundId: round.id, programmeId: round.programmeId, rows, totals };
}

/* -------------------------------------------------------------------------- */
/* Seats: the limits an offer and an admission respect (LIFECYCLE-4)           */
/* -------------------------------------------------------------------------- */

type SeatCheckClient = Pick<typeof db, "collegeApplication" | "admissionRound" | "programme">;

/**
 * THE SEATS ARE LIMITS. The campaign of 4 October admitted seven to a BCom
 * whose round had six seats and whose intake was six; vacancyReport only
 * reported it. An offer and an admission are now refused 409, with the
 * limit named, when either is reached:
 *   - the round's seat matrix, by the applicant's category, counted as
 *     vacancyReport counts it (every round of the intake year, and of the
 *     round's programme when it names one) — only when the round has a
 *     matrix at all, so a round typed without seats limits nothing;
 *   - the programme's sanctioned intake for the year, when one is set.
 * A seat beyond them is the principal's to give: `approveSupernumerary`
 * records who, when and why on the application (a decision in the head's
 * log), and a supernumerary seat counts against neither limit. Counted
 * inside the admission's transaction under one lock per college, so two
 * admissions at once cannot both take the last seat.
 */
async function assertSeatFree(client: SeatCheckClient, schoolId: string, a: { id: string; roundId: string; programmeId: string; category: string; supernumeraryAt: Date | null }): Promise<void> {
  if (a.supernumeraryAt) return;
  const round = await client.admissionRound.findFirst({ where: { id: a.roundId, schoolId }, select: { name: true, intakeYear: true, programmeId: true, seatsJson: true } });
  if (!round) return;
  const taken = { schoolId, status: "ADMITTED", supernumeraryAt: null, id: { not: a.id }, round: { intakeYear: round.intakeYear } } as const;
  const seats = seatsOf(round.seatsJson);
  if (Object.values(seats).some((n) => n > 0)) {
    const limit = seats[a.category] ?? 0;
    const admitted = await client.collegeApplication.count({ where: { ...taken, category: a.category, ...(round.programmeId ? { programmeId: round.programmeId } : {}) } });
    if (admitted >= limit) throw new RuleRefusal("collegeOffice.refuseSeatsFull", 409, { round: round.name, category: a.category, seats: limit });
  }
  const programme = await client.programme.findFirst({ where: { id: a.programmeId, schoolId }, select: { name: true, intake: true } });
  if (programme && programme.intake > 0) {
    const admitted = await client.collegeApplication.count({ where: { ...taken, programmeId: a.programmeId } });
    if (admitted >= programme.intake) throw new RuleRefusal("collegeOffice.refuseIntakeFull", 409, { programme: programme.name, intake: programme.intake, year: round.intakeYear });
  }
}

/**
 * The principal gives a seat beyond the limits (see assertSeatFree), with
 * the reason the register will carry: a supernumerary seat the regulations
 * allow (a foreign national, a ward of a serviceman, an orphan, a
 * TFWS seat). Idempotent; audited as a decision.
 */
export async function approveSupernumerary(ctx: ActiveContext, id: string, input: { reason: string }): Promise<CollegeApplicationView> {
  const d = await desk(ctx, ["PRINCIPAL"]);
  const a = await officeApp(d, id);
  if (a.supernumeraryAt) return applicationView(a);
  if (!["APPLIED", "SCRUTINY", "OFFERED", "FEE_DUE"].includes(a.status)) throw new AccessError("collegeOffice.refuseStep");
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { supernumeraryAt: new Date(), supernumeraryByUserId: d.userId, supernumeraryReason: input.reason.trim().slice(0, 300) }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.supernumerary", targetType: "CollegeApplication", targetId: a.id, meta: { category: a.category, programmeId: a.programmeId } });
  return applicationView(updated);
}

/* -------------------------------------------------------------------------- */
/* Applications                                                                */
/* -------------------------------------------------------------------------- */

const APP_INCLUDE = { round: { select: { name: true, intakeYear: true, kind: true } }, capAllotment: { select: { cetApplicationId: true } } } as const;
type AppRow = NonNullable<Awaited<ReturnType<typeof loadApp>>>;
const loadApp = (schoolId: string, id: string) => db.collegeApplication.findFirst({ where: { id, schoolId }, include: APP_INCLUDE });

function docsOf(raw: string): Docs {
  return readJson<Docs>(raw, {});
}

export function applicationView(a: AppRow): CollegeApplicationView {
  const docs = docsOf(a.documentsJson);
  return {
    id: a.id,
    roundId: a.roundId,
    roundName: a.round.name,
    programmeId: a.programmeId,
    number: a.number,
    applicantName: a.applicantName,
    birthdateKey: a.birthdate ? dateToDay(a.birthdate) : null,
    category: a.category as CollegeCategory,
    quota: a.quota as AdmissionQuota,
    gender: a.gender,
    phone: a.phone,
    email: a.email,
    cetApplicationId: a.capAllotment?.cetApplicationId ?? null,
    meritRank: a.meritRank,
    documents: SCRUTINY_DOCUMENTS.filter((k) => docs[k]).map((doc) => ({ doc, required: docs[doc]!.required, fileId: docs[doc]!.fileId, status: docs[doc]!.status, note: docs[doc]!.note })),
    scrutinyComplete: scrutinyComplete(docs),
    antiRaggingStudentAt: a.antiRaggingStudentAt?.toISOString() ?? null,
    antiRaggingParentAt: a.antiRaggingParentAt?.toISOString() ?? null,
    status: a.status as CollegeApplicationStatus,
    admissionFeePaise: a.admissionFeePaise,
    admissionFeePaidAt: a.admissionFeePaidAt?.toISOString() ?? null,
    admittedMembershipId: a.admittedMembershipId,
    admittedAt: a.admittedAt?.toISOString() ?? null,
    cancelledAt: a.cancelledAt?.toISOString() ?? null,
    cancelReason: a.cancelReason,
    refundPaise: a.refundPaise,
    refundSlab: a.refundSlab,
    refundRecordedAt: a.refundRecordedAt?.toISOString() ?? null,
    supernumeraryAt: a.supernumeraryAt?.toISOString() ?? null,
    supernumeraryReason: a.supernumeraryReason,
    // A refund outside the slab (5 Oct 2026, lib/head-approvals.ts): the office's ask and the principal's word.
    refundAsk:
      a.refundAskStatus && a.refundAskPaise !== null && a.refundAskedAt
        ? { paise: a.refundAskPaise, reason: a.refundAskReason ?? "", status: a.refundAskStatus as "ASKED" | "APPROVED" | "REFUSED", askedAt: a.refundAskedAt.toISOString(), decidedAt: a.refundDecidedAt?.toISOString() ?? null, note: a.refundDecisionNote, slabPaise: a.refundSlabPaise }
        : null,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listApplications(ctx: ActiveContext, q: { roundId?: string; status?: CollegeApplicationStatus }): Promise<{ items: CollegeApplicationView[] }> {
  const d = await desk(ctx, OFFICE_READ);
  const rows = await db.collegeApplication.findMany({ where: { schoolId: d.schoolId, ...(q.roundId ? { roundId: q.roundId } : {}), ...(q.status ? { status: q.status } : {}) }, include: APP_INCLUDE, orderBy: [{ roundId: "asc" }, { number: "asc" }], take: 2000 });
  return { items: rows.map(applicationView) };
}

export async function getApplication(ctx: ActiveContext, id: string): Promise<CollegeApplicationView> {
  const d = await desk(ctx, [...OFFICE_READ, "ACCOUNTS"]);
  const a = await loadApp(d.schoolId, id);
  if (!a) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  return applicationView(a);
}

async function officeApp(d: Desk, id: string): Promise<AppRow> {
  const a = await loadApp(d.schoolId, id);
  if (!a) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  return a;
}

/**
 * An application: from an imported allotment row (its name, category, quota
 * and programme come with it; the same row twice is the same application)
 * or, in a merit round, typed by the office with its merit rank.
 */
export async function createApplication(
  ctx: ActiveContext,
  input: { roundId: string; capAllotmentId?: string; programmeId?: string; applicantName?: string; birthdateKey?: string; category?: CollegeCategory; quota?: AdmissionQuota; gender?: "M" | "F" | "T"; phone?: string; email?: string; meritRank?: number; extraDocuments?: ("gap" | "migration")[] },
): Promise<CollegeApplicationView> {
  const d = await desk(ctx);
  const round = await roundOf(d, input.roundId);
  if (round.status !== "OPEN") throw new AccessError("collegeOffice.refuseRoundClosed");
  let base: { applicantName: string; category: CollegeCategory; quota: AdmissionQuota; programmeId: string; capAllotmentId: string | null; meritRank: number | null };
  if (input.capAllotmentId) {
    const row = await db.capAllotment.findFirst({ where: { id: input.capAllotmentId, roundId: round.id, schoolId: d.schoolId } });
    if (!row) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
    const again = await db.collegeApplication.findFirst({ where: { roundId: round.id, capAllotmentId: row.id }, include: APP_INCLUDE });
    if (again) return applicationView(again);
    const programmeId = row.programmeId ?? input.programmeId;
    if (!programmeId) throw new AccessError("collegeOffice.refuseProgramme");
    base = { applicantName: row.applicantName, category: row.category as CollegeCategory, quota: row.quota as AdmissionQuota, programmeId, capAllotmentId: row.id, meritRank: row.meritNumber };
  } else {
    if (!input.applicantName || !input.category || !input.quota || !input.programmeId) throw new AccessError("collegeOffice.refuseIncomplete");
    if (round.kind !== "MERIT" && round.kind !== "INSTITUTE") throw new AccessError("collegeOffice.refuseCapNeedsAllotment");
    base = { applicantName: input.applicantName.trim(), category: input.category, quota: input.quota, programmeId: input.programmeId, capAllotmentId: null, meritRank: input.meritRank ?? null };
  }
  await programmeOf(d.schoolId, base.programmeId);
  if (!(ADMISSION_QUOTAS as readonly string[]).includes(base.quota)) throw new AccessError("collegeOffice.refuseIncomplete");
  if (input.birthdateKey && !isDateKey(input.birthdateKey)) throw new AccessError("collegeOffice.refuseDates");
  const docs: Docs = {};
  for (const doc of requiredDocuments(base.category, input.extraDocuments ?? [])) docs[doc] = { required: true, fileId: null, status: "PENDING", note: null };
  const created = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const last = await tx.collegeApplication.findFirst({ where: { roundId: round.id }, orderBy: { number: "desc" }, select: { number: true } });
    return tx.collegeApplication.create({
      data: {
        schoolId: d.schoolId,
        roundId: round.id,
        programmeId: base.programmeId,
        number: (last?.number ?? 0) + 1,
        applicantName: base.applicantName,
        birthdate: input.birthdateKey ? new Date(`${input.birthdateKey}T00:00:00Z`) : null,
        category: base.category,
        quota: base.quota,
        gender: input.gender ?? null,
        phone: input.phone ?? null,
        email: input.email?.toLowerCase() ?? null,
        capAllotmentId: base.capAllotmentId,
        meritRank: base.meritRank,
        documentsJson: writeJson(docs),
        createdByUserId: d.userId,
      },
      include: APP_INCLUDE,
    });
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.apply", targetType: "CollegeApplication", targetId: created.id, meta: { roundId: round.id, fromAllotment: Boolean(base.capAllotmentId), category: base.category } });
  return applicationView(created);
}

const OPEN_STEPS: readonly string[] = ["APPLIED", "SCRUTINY", "OFFERED"];

/** A document's file and its scrutiny. VERIFIED needs a file; the first touch moves the application into scrutiny. */
export async function setDocument(ctx: ActiveContext, id: string, input: { doc: ScrutinyDocument; fileId?: string | null; status?: "PENDING" | "VERIFIED" | "REJECTED"; note?: string }, stored: { fileId?: string | null } = {}): Promise<CollegeApplicationView> {
  const d = await desk(ctx);
  const a = await officeApp(d, id);
  if (!OPEN_STEPS.includes(a.status)) throw new AccessError("collegeOffice.refuseStep");
  const docs = docsOf(a.documentsJson);
  const current: Doc = docs[input.doc] ?? { required: input.doc === "gap" || input.doc === "migration", fileId: null, status: "PENDING", note: null };
  if (!docs[input.doc] && input.doc !== "gap" && input.doc !== "migration") throw new AccessError("collegeOffice.refuseDocument");
  // A scan named by id must be one this desk member just uploaded (an unspent ticket of theirs), or
  // one the web form stored in this call: files.ts lets this college's office read whatever id sits on
  // an application, so a planted id was a read of somebody else's file (campaign S-12).
  let fileId = input.fileId === undefined ? current.fileId : input.fileId;
  if (stored.fileId) fileId = stored.fileId;
  else if (input.fileId && input.fileId !== current.fileId) {
    const spent = await db.uploadTicket.updateMany({ where: { fileId: input.fileId, userId: d.userId, consumedAt: null }, data: { consumedAt: new Date() } });
    if (spent.count === 0) throw new AccessError("collegeOffice.refuseFile");
  }
  const next: Doc = { ...current, fileId, status: input.status ?? current.status, note: input.note?.trim() || current.note };
  if (next.status === "VERIFIED" && !next.fileId) throw new AccessError("collegeOffice.refuseVerifyWithoutFile");
  docs[input.doc] = next;
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { documentsJson: writeJson(docs), status: a.status === "APPLIED" ? "SCRUTINY" : a.status }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.scrutiny", targetType: "CollegeApplication", targetId: a.id, meta: { doc: input.doc, status: next.status } });
  return applicationView(updated);
}

/** The anti-ragging undertaking, recorded as given by the student or by a parent. Repeating it changes nothing. */
export async function recordUndertaking(ctx: ActiveContext, id: string, by: "STUDENT" | "PARENT"): Promise<CollegeApplicationView> {
  const d = await desk(ctx);
  const a = await officeApp(d, id);
  if (a.status === "CANCELLED" || a.status === "REFUNDED") throw new AccessError("collegeOffice.refuseStep");
  const field = by === "STUDENT" ? "antiRaggingStudentAt" : "antiRaggingParentAt";
  if (a[field]) return applicationView(a);
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { [field]: new Date() }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.undertaking", targetType: "CollegeApplication", targetId: a.id, meta: { by } });
  return applicationView(updated);
}

/** The first-year structure for this programme and category in the intake's academic year (or the one named). */
async function structureFor(schoolId: string, programmeId: string, category: string, feeStructureId?: string) {
  return db.feeStructure.findFirst({
    where: { schoolId, ...(feeStructureId ? { id: feeStructureId } : { programmeId, category, yearOfStudy: 1 }), publishedAt: { not: null }, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { instalments: { orderBy: { sortOrder: "asc" }, include: { lines: true } } },
  });
}

/**
 * The offer: scrutiny complete and both undertakings recorded. The
 * admission fee is the first term of the category's first-year structure;
 * with one, the application waits for it (FEE_DUE); without, it stands
 * OFFERED until the accounts desk publishes the structure and the office
 * offers again.
 */
export async function offerSeat(ctx: ActiveContext, id: string, input: { feeStructureId?: string } = {}): Promise<CollegeApplicationView> {
  const d = await desk(ctx);
  const a = await officeApp(d, id);
  if (a.status === "FEE_DUE" || a.status === "ADMITTED") return applicationView(a);
  if (!OPEN_STEPS.includes(a.status)) throw new AccessError("collegeOffice.refuseStep");
  if (!scrutinyComplete(docsOf(a.documentsJson))) throw new AccessError("collegeOffice.refuseScrutiny");
  if (!a.antiRaggingStudentAt || !a.antiRaggingParentAt) throw new AccessError("collegeOffice.refuseUndertaking");
  await assertSeatFree(db, d.schoolId, a);
  const structure = await structureFor(d.schoolId, a.programmeId, a.category, input.feeStructureId);
  if (input.feeStructureId && !structure) throw new AccessError("collegeOffice.refuseStructure");
  const first = structure?.instalments[0];
  const fee = first ? first.lines.reduce((s, l) => s + l.amountPaise, 0) : null;
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { status: structure ? "FEE_DUE" : "OFFERED", feeStructureId: structure?.id ?? null, admissionFeePaise: fee }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.offer", targetType: "CollegeApplication", targetId: a.id, meta: { feeStructureId: structure?.id ?? null, admissionFeePaise: fee } });
  return applicationView(updated);
}

/** The admission fee, as the college's counter or bank received it. Not less than the offer asked; the same reference again changes nothing. */
export async function recordAdmissionFee(ctx: ActiveContext, id: string, input: { amountPaise: number; method: "CASH" | "CHEQUE" | "BANK" | "UPI"; reference: string }): Promise<CollegeApplicationView> {
  const d = await desk(ctx, MONEY_DESK);
  const a = await officeApp(d, id);
  if (a.admissionFeePaidAt) return applicationView(a);
  if (a.status !== "FEE_DUE") throw new AccessError("collegeOffice.refuseStep");
  if (a.admissionFeePaise !== null && input.amountPaise < a.admissionFeePaise) throw new AccessError("collegeOffice.refuseFeeShort");
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { admissionFeePaise: input.amountPaise, admissionFeeMethod: input.method, admissionFeeRef: input.reference.trim().slice(0, 80), admissionFeePaidAt: new Date() }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.fee", targetType: "CollegeApplication", targetId: a.id, meta: { amountPaise: input.amountPaise, method: input.method } });
  return applicationView(updated);
}

function handleFor(name: string, code: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
  return `${base}.${code.slice(-4).toLowerCase()}`;
}

/**
 * The seat (see the file's docblock): one transaction from the account to the
 * fee plan; then the admission fee on the ledger as a counter payment
 * against the first term, and the first sign-in slip. Already admitted:
 * answered as it stands.
 */
export async function admitStudent(ctx: ActiveContext, id: string, input: { prn?: string; apaarId?: string; abcId?: string } = {}): Promise<{ studentMembershipId: string; studentCode: string; enrolmentId: string; demands: number; receiptSerial: string | null }> {
  const d = await desk(ctx);
  const a = await officeApp(d, id);
  if (a.status === "ADMITTED" && a.admittedMembershipId) {
    const e = await db.programmeEnrolment.findFirst({ where: { studentMembershipId: a.admittedMembershipId, programmeId: a.programmeId }, select: { id: true } });
    const m = await db.membership.findUniqueOrThrow({ where: { id: a.admittedMembershipId }, select: { studentCode: true } });
    return { studentMembershipId: a.admittedMembershipId, studentCode: m.studentCode ?? "", enrolmentId: e?.id ?? "", demands: 0, receiptSerial: null };
  }
  if (a.status !== "FEE_DUE") throw new AccessError("collegeOffice.refuseStep");
  if ((a.admissionFeePaise ?? 0) > 0 && !a.admissionFeePaidAt) throw new AccessError("collegeOffice.refuseFeeUnpaid");
  const structure = a.feeStructureId ? await db.feeStructure.findFirst({ where: { id: a.feeStructureId, schoolId: d.schoolId }, select: { id: true, academicYearId: true } }) : null;
  const scheme = await db.scheme.findFirst({ where: { programmeId: a.programmeId, schoolId: d.schoolId, effectiveYear: { lte: a.round.intakeYear } }, orderBy: { effectiveYear: "desc" }, select: { id: true } });
  const { locale, timezone } = await db.school.findUniqueOrThrow({ where: { id: d.schoolId }, select: { locale: true, timezone: true } });
  const code = studentCode();
  const handle = handleFor(a.applicantName, code);
  const age = a.birthdate ? ageInYears(a.birthdate) : null;
  const apaarId = input.apaarId?.trim() || null;
  const abcId = input.abcId?.trim() || null;
  const prn = input.prn?.trim() || null;

  const minted = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // The last seat is taken by one admission at a time (LIFECYCLE-4).
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`college-seats:${d.schoolId}`}))`;
    await assertSeatFree(tx, d.schoolId, a);
    const user = await tx.user.create({ data: { name: a.applicantName, email: `${handle}@${HANDLE_DOMAIN}`, passwordHash: null, birthdate: a.birthdate, isMinor: age === null ? false : age < 18, prefs: writeJson({ theme: "system", locale }) }, select: { id: true } });
    const membership = await tx.membership.create({ data: { userId: user.id, schoolId: d.schoolId, role: "STUDENT", status: "ACTIVE", studentCode: code }, select: { id: true } });
    // One APAAR id and one ABC id per person: a number already on another student of the college undoes the whole admission.
    if (apaarId && (await tx.pupilRecord.findFirst({ where: { schoolId: d.schoolId, apaarId, studentMembershipId: { not: membership.id } }, select: { id: true } }))) throw new AccessError("collegeOffice.refuseApaarTaken");
    if (abcId && (await tx.pupilRecord.findFirst({ where: { schoolId: d.schoolId, abcId, studentMembershipId: { not: membership.id } }, select: { id: true } }))) throw new AccessError("collegeOffice.refuseAbcTaken");
    await tx.pupilRecord.create({
      data: {
        schoolId: d.schoolId,
        studentMembershipId: membership.id,
        admissionNumber: `${a.round.intakeYear}/${String(a.number).padStart(4, "0")}`,
        admissionDate: new Date(`${todayKey(timezone)}T00:00:00Z`),
        gender: a.gender,
        guardianPhone: a.phone,
        prn,
        apaarId,
        abcId,
        admissionCategory: a.category,
        admissionQuota: a.quota,
        admissionRoundId: a.roundId,
        yearOfEntry: a.round.intakeYear,
        updatedByUserId: d.userId,
      },
    });
    const enrolment = await tx.programmeEnrolment.create({ data: { schoolId: d.schoolId, studentMembershipId: membership.id, programmeId: a.programmeId, yearOfEntry: a.round.intakeYear, category: a.category, quota: a.quota, roundId: a.roundId }, select: { id: true } });
    if (scheme) await tx.studentProgramme.create({ data: { schoolId: d.schoolId, studentMembershipId: membership.id, programmeId: a.programmeId, schemeId: scheme.id, entryYear: a.round.intakeYear, yearOfStudy: 1, semester: 1, prn } });
    let demands = 0;
    if (structure) {
      await tx.studentFeePlan.create({ data: { schoolId: d.schoolId, studentMembershipId: membership.id, structureId: structure.id, academicYearId: structure.academicYearId } });
      demands = (await regenerateDemands(tx, d.schoolId, membership.id, structure.academicYearId)).written;
    }
    await syncGradeLevel(tx, [membership.id]);
    await tx.collegeApplication.update({ where: { id: a.id }, data: { status: "ADMITTED", admittedMembershipId: membership.id, admittedAt: new Date() } });
    return { membershipId: membership.id, enrolmentId: enrolment.id, demands, academicYearId: structure?.academicYearId ?? null };
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.admit", targetType: "CollegeApplication", targetId: a.id, meta: { membershipId: minted.membershipId, programmeId: a.programmeId, category: a.category, quota: a.quota, demands: minted.demands } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "student.admit", targetType: "Membership", targetId: minted.membershipId, meta: { fromCollegeAdmission: true, hasBirthdate: a.birthdate !== null } });

  // The admission fee the college already holds, on the ledger against the first term — the same receipt a counter payment writes.
  let receiptSerial: string | null = null;
  if (a.admissionFeePaidAt && (a.admissionFeePaise ?? 0) >= 100 && minted.academicYearId) {
    const first = await db.feeDemand.findFirst({ where: { studentMembershipId: minted.membershipId, academicYearId: minted.academicYearId }, orderBy: { dueDate: "asc" }, select: { id: true } });
    const paid = await recordCounterPayment(ctx, { studentMembershipId: minted.membershipId, amountPaise: a.admissionFeePaise!, method: (a.admissionFeeMethod as "CASH" | "CHEQUE" | "BANK" | "UPI") ?? "BANK", reference: a.admissionFeeRef, note: null, demandIds: first ? [first.id] : [], clientId: `college-admission-${a.id}` }).catch((error) => {
      console.error("[college-admissions] admission fee not written to the ledger", error);
      return null;
    });
    receiptSerial = paid?.serial ?? null;
  }
  if (ctx.role === "ADMIN") await issueFirstSignIn(ctx, minted.membershipId).catch((error) => console.error("[college-admissions] first sign-in not issued", error));
  return { studentMembershipId: minted.membershipId, studentCode: code, enrolmentId: minted.enrolmentId, demands: minted.demands, receiptSerial };
}

/**
 * A seat given up. Before admission nothing was paid on the ledger and the
 * refund is the admission fee by the slab; after, it is what the student
 * paid this year by the slab, with the caution deposit whole. The seat's
 * enrolment is cancelled and the membership closed; nobody who never
 * studied becomes an alumnus.
 */
export async function cancelAdmission(ctx: ActiveContext, id: string, input: { reason: string; lastDateKey: string }, now: Date = new Date()): Promise<CollegeApplicationView> {
  const d = await desk(ctx);
  const a = await officeApp(d, id);
  if (a.status === "CANCELLED" || a.status === "REFUNDED") return applicationView(a);
  if (!isDateKey(input.lastDateKey)) throw new AccessError("collegeOffice.refuseDates");
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: d.schoolId }, select: { timezone: true } });
  const cancelKey = todayKey(timezone, now);
  let paidPaise = a.admissionFeePaidAt ? (a.admissionFeePaise ?? 0) : 0;
  let cautionPaise = 0;
  if (a.status === "ADMITTED" && a.admittedMembershipId) {
    const demands = await db.feeDemand.findMany({ where: { studentMembershipId: a.admittedMembershipId, schoolId: d.schoolId, status: { not: "CANCELLED" } }, select: { paidPaise: true, netPaise: true, linesJson: true } });
    paidPaise = demands.reduce((s, x) => s + x.paidPaise, 0);
    cautionPaise = await cautionPaidOn(d.schoolId, demands);
  }
  const refund = refundFor({ paidPaise, cautionPaise, cancelKey, lastKey: input.lastDateKey });
  const updated = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    if (a.admittedMembershipId) {
      await tx.programmeEnrolment.updateMany({ where: { studentMembershipId: a.admittedMembershipId, programmeId: a.programmeId }, data: { status: "CANCELLED" } });
      await tx.membership.update({ where: { id: a.admittedMembershipId }, data: { leftAt: now } });
    }
    return tx.collegeApplication.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledAt: now, cancelReason: input.reason.trim().slice(0, 300), refundPaise: refund.refundPaise, refundSlab: refund.slab, refundRecordedAt: now }, include: APP_INCLUDE });
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.cancel", targetType: "CollegeApplication", targetId: a.id, meta: { slab: refund.slab, refundPaise: refund.refundPaise, paidPaise, cautionPaise } });
  return applicationView(updated);
}

/** The caution deposit inside what was paid: each demand's CAUTION_DEPOSIT lines, in proportion to what the demand has received. */
export async function cautionPaidOn(schoolId: string, demands: { paidPaise: number; netPaise: number; linesJson: string }[]): Promise<number> {
  const cautionHeads = new Set((await db.feeHead.findMany({ where: { schoolId, kind: "CAUTION_DEPOSIT" }, select: { id: true } })).map((h) => h.id));
  if (!cautionHeads.size) return 0;
  let total = 0;
  for (const dm of demands) {
    const lines = readJson<{ headId: string; grossPaise: number; concessionPaise: number }[]>(dm.linesJson, []);
    const caution = lines.filter((l) => cautionHeads.has(l.headId)).reduce((s, l) => s + l.grossPaise - l.concessionPaise, 0);
    if (caution > 0 && dm.netPaise > 0) total += Math.min(caution, Math.round((caution * Math.min(dm.paidPaise, dm.netPaise)) / dm.netPaise));
  }
  return total;
}

/** The college's bank paid the refund back: its reference closes the case. */
export async function recordRefund(ctx: ActiveContext, id: string, reference: string): Promise<CollegeApplicationView> {
  const d = await desk(ctx, MONEY_DESK);
  const a = await officeApp(d, id);
  if (a.status === "REFUNDED") return applicationView(a);
  if (a.status !== "CANCELLED") throw new AccessError("collegeOffice.refuseStep");
  // A refund outside the slab waits for the principal before the bank pays anything (5 Oct 2026).
  if (a.refundAskStatus === "ASKED") throw new AccessError("collegeDesks.refuseRefundWaiting");
  const updated = await db.collegeApplication.update({ where: { id: a.id }, data: { status: "REFUNDED", refundReference: reference.trim().slice(0, 80) }, include: APP_INCLUDE });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.admissions.refund", targetType: "CollegeApplication", targetId: a.id, meta: { refundPaise: a.refundPaise } });
  return applicationView(updated);
}

/**
 * THE ADMISSION REGISTER as the university's inspection asks for it: one row
 * per admitted student of the intake, in admission order, with the
 * register number, the university's PRN, the category, quota and round, and
 * the APAAR and ABC ids. Column headings are in the college's own language.
 */
export async function admissionRegister(ctx: ActiveContext, intakeYear: number, t: Translate): Promise<{ filename: string; csv: string }> {
  const d = await desk(ctx, OFFICE_READ);
  const rows = await db.collegeApplication.findMany({
    where: { schoolId: d.schoolId, status: { in: ["ADMITTED", "CANCELLED", "REFUNDED"] }, admittedMembershipId: { not: null }, round: { intakeYear } },
    orderBy: [{ admittedAt: "asc" }],
    include: { round: { select: { name: true } }, capAllotment: { select: { cetApplicationId: true } }, admitted: { select: { studentCode: true, pupilRecord: { select: { admissionNumber: true, prn: true, apaarId: true, abcId: true } } } } },
  });
  const programmes = new Map((await db.programme.findMany({ where: { schoolId: d.schoolId }, select: { id: true, code: true, name: true } })).map((p) => [p.id, `${p.code} ${p.name}`]));
  const H = (k: string) => t(`collegeOffice.register${k}` as TranslationKey);
  const headers = [H("Serial"), H("Number"), H("Prn"), H("Name"), H("Gender"), H("Dob"), H("Category"), H("Quota"), H("Round"), H("CetId"), H("Programme"), H("Date"), H("Status"), H("Apaar"), H("Abc")];
  const out = rows.map((r, i) => ({
    [headers[0]!]: i + 1,
    [headers[1]!]: r.admitted?.pupilRecord?.admissionNumber ?? "",
    [headers[2]!]: r.admitted?.pupilRecord?.prn ?? "",
    [headers[3]!]: r.applicantName,
    [headers[4]!]: r.gender ?? "",
    [headers[5]!]: r.birthdate ? dateToDay(r.birthdate) : "",
    [headers[6]!]: r.category,
    [headers[7]!]: r.quota,
    [headers[8]!]: r.round.name,
    [headers[9]!]: r.capAllotment?.cetApplicationId ?? "",
    [headers[10]!]: programmes.get(r.programmeId) ?? "",
    [headers[11]!]: r.admittedAt ? dateToDay(r.admittedAt) : "",
    [headers[12]!]: r.status,
    [headers[13]!]: r.admitted?.pupilRecord?.apaarId ?? "",
    [headers[14]!]: r.admitted?.pupilRecord?.abcId ?? "",
  }));
  return { filename: `admission-register-${intakeYear}.csv`, csv: toCsv(out, headers) };
}
