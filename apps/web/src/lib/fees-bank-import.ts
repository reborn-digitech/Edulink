import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { parseCsv } from "./csv";
import { todayKey } from "./dates";
import { requireFeesOffice } from "./fees";
import { confirmClaim, recordCounterPayment } from "./fees-payments";
import type { FeeMethod } from "./constants";
import type { ActiveContext } from "./session";

/**
 * A bank statement, pasted, matched to pupils, recorded.
 *
 * WHAT THE OFFICE HAS is the school's own statement — a line a day for every
 * cheque that cleared and every NEFT, IMPS or UPI credit a family sent on
 * its own. Until now each went through the counter form one at a time. Here
 * the statement is pasted whole and every credit is matched to a pupil by
 * what the line itself carries:
 *
 *   1. its reference is the UTR a family CLAIMED a UPI payment with — the
 *      claim is confirmed, as the claims page would; or its narration
 *      carries the EL reference of a UPI intent the family never claimed —
 *      that intent is confirmed the same way, the line's reference as its
 *      UTR, when the amounts agree;
 *   2. its reference is already on a payment in the ledger (the office
 *      keyed the cheque at the counter; the statement was imported once
 *      before) — nothing is written, the line says "already";
 *   3. its narration carries a pupil's student code — a payment is
 *      recorded for that pupil through the counter's one writer (a line
 *      naming the EL reference of an intent CLAIMED under another UTR is
 *      left for the office instead: the family's word against the bank's);
 *   4. none of those — the line is listed for the office to key by hand.
 *
 * THE PLATFORM RECORDS THAT MONEY MOVED; IT MOVES NOTHING (decision 0003).
 * Every write below goes through recordCounterPayment or confirmClaim, the
 * same two doors the counter and the claims page use, so the receipt, the
 * allocation and the family's notice are theirs. Idempotent by reference:
 * a second import of the same statement finds every reference on a
 * payment and records nothing twice, and the counter's clientId holds the
 * line against a retry that raced the first.
 */

export type BankImportOutcome = "new" | "claim" | "already" | "unmatched";
export type BankImportLine = {
  line: number;
  dateKey: string | null;
  description: string;
  reference: string;
  amountPaise: number | null;
  method: FeeMethod | null;
  outcome: BankImportOutcome;
  studentMembershipId: string | null;
  pupilName: string | null;
  paymentId: string | null;
  problemKey: string | null;
};
export type BankImportPreview = { lines: BankImportLine[]; counts: Record<BankImportOutcome, number> };

const MAX_LINES = 2000;
const CODE_MIN = 6;

function pickColumn(headers: string[], ...patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return null;
}

/** "1,250.00", "₹1250", "1250.5" → paise; anything else null. */
export function parseStatementAmount(raw: string): number | null {
  const text = raw.replace(/[₹,\s]/g, "").replace(/^(cr|dr)\.?/i, "").replace(/(cr|dr)\.?$/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const paise = Math.round(Number(text) * 100);
  return paise > 0 ? paise : null;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

/** dd/mm/yyyy, dd-mm-yy, yyyy-mm-dd, "02 Sep 2026" → a date key; null when it is none of those. */
export function parseStatementDate(raw: string): string | null {
  const text = raw.trim();
  let y = 0;
  let m = 0;
  let d = 0;
  let hit: RegExpExecArray | null;
  if ((hit = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text))) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(text))) {
    d = Number(hit[1]);
    m = Number(hit[2]);
    y = Number(hit[3]);
    if (y < 100) y += 2000;
  } else if ((hit = /^(\d{1,2})[ -]([A-Za-z]{3,4})[ -](\d{2,4})/.exec(text))) {
    d = Number(hit[1]);
    m = MONTHS[hit[2]!.toLowerCase()] ?? 0;
    y = Number(hit[3]);
    if (y < 100) y += 2000;
  } else return null;
  if (!m || !d || y < 2000 || y > 2100 || m > 12 || d > 31) return null;
  // 31 February rolls over in Date; the month's own length is the test.
  if (d > new Date(Date.UTC(y, m, 0)).getUTCDate()) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** The statement's own words for how the money came, read off the narration and the reference. */
export function methodFromNarration(description: string, reference: string): FeeMethod {
  const text = `${description} ${reference}`.toUpperCase();
  if (/\b(CHQ|CHEQUE|CLG|CLEARING|INWARD CLG|MICR)\b/.test(text)) return "CHEQUE";
  if (/\bUPI\b/.test(text)) return "UPI";
  return "BANK";
}

const squash = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * The reference a line is matched and recorded by: the reference column,
 * else the first UTR-shaped or cheque-shaped token in the narration.
 */
export function referenceFromLine(reference: string, description: string): string {
  const own = squash(reference);
  if (own) return own.slice(0, 60);
  // A UPI intent's EL reference is the family's note to the school, not the
  // bank's reference for the credit; the UTR is the next token along.
  for (const token of description.replace(/[^A-Za-z0-9 ]/g, " ").match(/\b[A-Z0-9]{12,22}\b/gi) ?? []) {
    const upper = token.toUpperCase();
    if (/\d/.test(upper) && !/^EL[0-9A-F]{12}$/.test(upper)) return upper;
  }
  const chq = /(?:CHQ|CHEQUE|CLG)\D{0,12}(\d{6})\b/i.exec(description);
  return chq ? chq[1]! : "";
}

/**
 * Reads the statement and says what each credit would do. Writes nothing.
 */
export async function previewBankImport(ctx: ActiveContext, csv: string): Promise<BankImportPreview> {
  const caller = requireFeesOffice(ctx);
  const parsed = parseCsv(csv.slice(0, 500_000));
  const headers = parsed.headers;
  const dateCol = pickColumn(headers, /^(txn |value |transaction |posting )?date$/, /date/);
  const descCol = pickColumn(headers, /^(description|narration|particulars|details|remarks)$/, /descr|narrat|particular|detail|remark/);
  const refCol = pickColumn(headers, /^(ref(erence)?( no\.?)?|utr|cheque( no\.?)?|chq( no\.?)?|instrument( no\.?)?)$/, /ref|utr|cheque|chq|instrument|txn id|transaction id/);
  const creditCol = pickColumn(headers, /^(credit|deposit|cr)( amount)?$/, /credit|deposit|\bcr\b/, /^amount$/, /amount|amt/);
  const debitCol = pickColumn(headers, /^(debit|withdrawal|dr)( amount)?$/, /debit|withdraw|\bdr\b/);
  if (!descCol && !refCol) throw new AccessError("officeBulk.bankNeedColumns");
  if (!creditCol) throw new AccessError("officeBulk.bankNeedAmount");

  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const [payments, pupils] = await Promise.all([
    db.feePayment.findMany({
      where: { schoolId: caller.schoolId, OR: [{ reference: { not: null } }, { method: "UPI", status: { in: ["INITIATED", "CLAIMED"] } }] },
      select: { id: true, reference: true, note: true, method: true, status: true, amountPaise: true, studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
    }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: "STUDENT", status: { in: ["ACTIVE", "PENDING"] }, studentCode: { not: null } }, select: { id: true, studentCode: true, user: { select: { name: true, preferredName: true } } }, take: 10_000 }),
  ]);
  const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;
  const byReference = new Map<string, (typeof payments)[number]>();
  for (const p of payments) if (p.reference) byReference.set(squash(p.reference), p);
  /** An EL reference the family's UPI intent carried, for the payment still waiting on it. */
  const byIntent = new Map<string, (typeof payments)[number]>();
  for (const p of payments) if (p.method === "UPI" && (p.status === "INITIATED" || p.status === "CLAIMED") && p.note && /^EL[0-9A-F]{12}$/.test(p.note)) byIntent.set(p.note, p);
  const codes = pupils.map((p) => ({ code: squash(p.studentCode!), id: p.id, name: nameOf(p.user) })).filter((p) => p.code.length >= CODE_MIN);

  const seen = new Set<string>();
  const lines: BankImportLine[] = parsed.rows.slice(0, MAX_LINES).map((cells, index) => {
    const line = parsed.lineNumbers[index] ?? index + 2;
    const description = (descCol ? cells[descCol] : "") ?? "";
    const rawRef = (refCol ? cells[refCol] : "") ?? "";
    // A student code read off the narration is not a reference, however UTR-shaped it is.
    const found = referenceFromLine(rawRef, description);
    const reference = codes.some((c) => c.code === found) ? "" : found;
    const dateKey = dateCol ? parseStatementDate(cells[dateCol] ?? "") : null;
    const amountPaise = parseStatementAmount(cells[creditCol] ?? "");
    const method = methodFromNarration(description, rawRef);
    const base = { line, dateKey, description: description.slice(0, 200), reference, amountPaise, method, studentMembershipId: null as string | null, pupilName: null as string | null, paymentId: null as string | null };
    const unmatched = (problemKey: string): BankImportLine => ({ ...base, outcome: "unmatched", problemKey });

    if (debitCol && amountPaise === null && parseStatementAmount(cells[debitCol] ?? "") !== null) return unmatched("officeBulk.bankDebit");
    if (amountPaise === null) return unmatched("officeBulk.bankNoAmount");
    if (dateKey && dateKey > today) return unmatched("fees.refuseDate");
    if (reference && seen.has(reference)) return unmatched("officeBulk.bankSameReference");
    if (reference) seen.add(reference);

    const known = reference ? byReference.get(reference) : undefined;
    if (known) {
      if (known.method === "UPI" && known.status === "CLAIMED") {
        if (known.amountPaise !== amountPaise) return { ...base, outcome: "unmatched", paymentId: known.id, studentMembershipId: known.studentMembershipId, pupilName: nameOf(known.student.user), problemKey: "fees.matchAmountDiffers" };
        return { ...base, outcome: "claim", paymentId: known.id, studentMembershipId: known.studentMembershipId, pupilName: nameOf(known.student.user), problemKey: null };
      }
      if (known.status === "PAID" || known.status === "REVERSED" || known.status === "REFUNDED" || known.status === "UNALLOCATED") return { ...base, outcome: "already", paymentId: known.id, studentMembershipId: known.studentMembershipId, pupilName: nameOf(known.student.user), problemKey: null };
    }

    const narration = squash(`${description} ${rawRef}`);
    const intent = /EL[0-9A-F]{12}/.exec(narration);
    const waiting = intent ? byIntent.get(intent[0]) : undefined;
    if (waiting?.status === "INITIATED") {
      // The family's UPI intent, never claimed: the statement is the proof,
      // and the intent itself is confirmed with the line's reference as its
      // UTR — a counter payment beside it would count the same money twice.
      const who = { paymentId: waiting.id, studentMembershipId: waiting.studentMembershipId, pupilName: nameOf(waiting.student.user) };
      if (!reference || reference === intent![0]) return { ...base, ...who, outcome: "unmatched", problemKey: "fees.refuseReference" };
      if (waiting.amountPaise !== amountPaise) return { ...base, ...who, outcome: "unmatched", problemKey: "fees.matchAmountDiffers" };
      return { ...base, ...who, outcome: "claim", problemKey: null };
    }
    if (waiting?.status === "CLAIMED") {
      // The family claimed this intent with a UTR this line does not carry
      // (a line that carries it confirmed above). Which is right is for the
      // office to look at: overwriting the family's UTR would lose their
      // word, and a counter payment beside the claim would count it twice.
      return { ...base, outcome: "unmatched", paymentId: waiting.id, studentMembershipId: waiting.studentMembershipId, pupilName: nameOf(waiting.student.user), problemKey: "fees.matchClaimedOtherReference" };
    }
    const pupil = codes.find((c) => narration.includes(c.code)) ?? null;
    if (!pupil) return unmatched("officeBulk.bankNoPupil");
    if (!reference) return { ...base, outcome: "unmatched", studentMembershipId: pupil.id, pupilName: pupil.name, problemKey: "fees.refuseReference" };
    return { ...base, outcome: "new", studentMembershipId: pupil.id, pupilName: pupil.name, problemKey: null };
  });
  const counts: Record<BankImportOutcome, number> = { new: 0, claim: 0, already: 0, unmatched: 0 };
  for (const l of lines) counts[l.outcome] += 1;
  return { lines, counts };
}

export type BankImportResult = { recorded: number; confirmed: number; already: number; unmatched: number; failed: { line: number; error: string }[] };

/**
 * Records the matched lines: a `new` line through the counter's writer
 * (the statement's reference as the receipt's, the statement's date as
 * the day paid, the line held against a retry by clientId), a `claim`
 * line by confirming the claim. One refusal does not stop the rest; each
 * is reported against its line.
 */
export async function commitBankImport(ctx: ActiveContext, csv: string, describe: (e: AccessError) => string): Promise<BankImportResult> {
  const caller = requireFeesOffice(ctx);
  const preview = await previewBankImport(ctx, csv);
  const result: BankImportResult = { recorded: 0, confirmed: 0, already: preview.counts.already, unmatched: preview.counts.unmatched, failed: [] };
  for (const l of preview.lines) {
    try {
      if (l.outcome === "claim" && l.paymentId) {
        await confirmClaim(ctx, l.paymentId, { utr: l.reference });
        result.confirmed += 1;
      } else if (l.outcome === "new" && l.studentMembershipId && l.amountPaise !== null && l.method) {
        await recordCounterPayment(ctx, {
          studentMembershipId: l.studentMembershipId,
          amountPaise: l.amountPaise,
          method: l.method,
          reference: l.reference,
          note: l.description.slice(0, 300) || null,
          clientId: `bank:${l.reference}`.slice(0, 80),
          paidAtKey: l.dateKey,
        });
        result.recorded += 1;
      }
    } catch (error) {
      result.failed.push({ line: l.line, error: error instanceof AccessError ? describe(error) : "error" });
    }
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.bankImport", targetType: "School", targetId: caller.schoolId, meta: { lines: preview.lines.length, recorded: result.recorded, confirmed: result.confirmed, already: result.already, unmatched: result.unmatched, failed: result.failed.length } });
  return result;
}
