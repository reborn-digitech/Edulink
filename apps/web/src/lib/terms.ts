import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { isDateKey, todayKey } from "./dates";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Terms: the unit a school reports in.
 *
 * WHAT WAS MISSING. Exams had kinds — unit, mid-term, final — and the report
 * card builder's title box said "Term 1" by default, but nothing in the
 * schema WAS a term: no dates, no order, nothing for a card or a fee to hang
 * on, and every teacher typed "Term 1" a little differently. A term is a
 * named stretch of an academic year; a date falls in at most one of them;
 * an exam series reports into one; a report card is built FROM one, which
 * fixes its title and its attendance window and pre-selects its papers.
 *
 * RULES THE LIBRARY KEEPS. Inside the year; no overlap with a sibling;
 * ordered by start. A school that reports once a year has no terms and
 * nothing here asks it to — every caller treats "no term" as before.
 */

export type TermView = {
  id: string;
  academicYearId: string;
  name: string;
  startDateKey: string;
  endDateKey: string;
  position: number;
  /** Today falls inside it. */
  current: boolean;
  /** The office marked it done — a milestone, not a lock. */
  finishedAt: Date | null;
};

export type TermResult = { ok: true; termId: string } | { ok: false; errorKey: TranslationKey };

function key(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function requireAdmin(ctx: ActiveContext): string {
  // The principal shares the year's milestones: starting a year, marking a
  // term finished, closing a year. In most Indian schools those are the
  // head's calls as much as the office's.
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSetTerms");
  }
  return ctx.schoolId;
}

/**
 * The terms of one year, in order. "Today" is the school's (TA-422): with no zone given it is read from the school,
 * not taken as UTC — the report-card builder passed none and marked the ended term current for the first 5½ hours
 * of a term in Kolkata.
 */
export async function termsOfYear(schoolId: string, academicYearId: string, timezone?: string): Promise<TermView[]> {
  const today = todayKey(timezone ?? (await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } })).timezone);
  const rows = await db.term.findMany({
    where: { schoolId, academicYearId },
    orderBy: [{ startDate: "asc" }],
  });
  return rows.map((t, i) => ({
    id: t.id,
    academicYearId: t.academicYearId,
    name: t.name,
    startDateKey: key(t.startDate),
    endDateKey: key(t.endDate),
    position: i + 1,
    current: key(t.startDate) <= today && today <= key(t.endDate),
    finishedAt: t.finishedAt,
  }));
}

/**
 * What removing each term would unhook (TA-234): its exam rounds and its draft report cards, which keep their marks
 * and lose the term for good (SetNull; adding the term again makes a new one nothing points to). The office's X
 * names both counts in its confirm before deleteTerm runs.
 */
export async function termAttachments(schoolId: string, termIds: string[]): Promise<Map<string, { rounds: number; cards: number }>> {
  const out = new Map(termIds.map((id) => [id, { rounds: 0, cards: 0 }]));
  if (termIds.length === 0) return out;
  const [rounds, cards] = await Promise.all([
    db.examSeries.groupBy({ by: ["termId"], where: { schoolId, termId: { in: termIds } }, _count: { _all: true } }),
    db.reportCard.groupBy({ by: ["termId"], where: { schoolId, termId: { in: termIds }, status: { not: "PUBLISHED" } }, _count: { _all: true } }),
  ]);
  for (const r of rounds) if (r.termId) out.get(r.termId)!.rounds = r._count._all;
  for (const c of cards) if (c.termId) out.get(c.termId)!.cards = c._count._all;
  return out;
}

/**
 * Marks a term done, or takes the mark back.
 *
 * A MILESTONE, NOT A LOCK. Finishing a term is the office saying "we are done
 * reporting this stretch" — the dashboards show it, nothing is frozen by it.
 * The freeze belongs to finishing the YEAR, where it is enforced in the marks
 * paths themselves. Reversible here because a term marked done by accident
 * should not need anyone beyond the same page that marked it.
 */
/**
 * Marking a term finished, and taking that mark back.
 *
 * ⚠ THESE THROW ON A REFUSAL, they do not soft-return one. Every neighbouring
 * guard — assignTeacher, promoteSchool, the marks freeze, reopenAcademicYear —
 * answers a wrong role or an id from another school by THROWING an AccessError,
 * and these two answered the same forged id with a quiet { ok: false } instead.
 * The soft return was safe (the term was refused and untouched — the two-school
 * adversarial pass proved it), but a caller reasoning about the guards
 * uniformly could not, and a not-found that is a soft value one place and an
 * exception everywhere else is exactly the inconsistency that hides the next
 * bug. So they now refuse by name like the rest: `requireAdmin` already threw
 * for the wrong role, and a term that is not this school's throws NOT_FOUND.
 * A success returns the term id.
 */
export async function finishTerm(ctx: ActiveContext, termId: string): Promise<{ termId: string }> {
  const schoolId = requireAdmin(ctx);
  const term = await db.term.findFirst({ where: { id: termId, schoolId }, select: { id: true, name: true } });
  if (!term) throw new AccessError("access.termNotFound", "NOT_FOUND");
  await db.term.update({ where: { id: term.id }, data: { finishedAt: new Date() } });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "term.finish", targetType: "Term", targetId: term.id, meta: { name: term.name } });
  return { termId: term.id };
}

export async function reopenTerm(ctx: ActiveContext, termId: string): Promise<{ termId: string }> {
  const schoolId = requireAdmin(ctx);
  const term = await db.term.findFirst({ where: { id: termId, schoolId }, select: { id: true, name: true } });
  if (!term) throw new AccessError("access.termNotFound", "NOT_FOUND");
  await db.term.update({ where: { id: term.id }, data: { finishedAt: null } });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "term.reopen", targetType: "Term", targetId: term.id, meta: { name: term.name } });
  return { termId: term.id };
}

/** The current year's terms — what the exams page and the card builder offer. */
export async function currentTerms(schoolId: string, timezone?: string): Promise<TermView[]> {
  const year = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true } });
  if (!year) return [];
  return termsOfYear(schoolId, year.id, timezone);
}

/** The term a date falls in, if the school has one there. */
export async function termForDate(schoolId: string, dateKey: string): Promise<{ id: string; name: string } | null> {
  const at = new Date(`${dateKey}T00:00:00.000Z`);
  const term = await db.term.findFirst({
    where: { schoolId, startDate: { lte: at }, endDate: { gte: at } },
    select: { id: true, name: true },
  });
  return term;
}

/**
 * A SERIES' TERM FOLLOWS THE TERMS TOO (TA-142, 13 Nov 2026). A series reports into the term its earliest paper
 * falls in (syncSeriesTerm in exams.ts), and that was derived again only when a paper changed: a unit test dated
 * in June, with the terms made in August, kept no term and was off every term and annual card, and so was every
 * series of a term deleted and made again. Making or removing a term now derives the term of each of the school's
 * series that has a paper again, by the same rule; a series with no paper yet keeps the term it was made under.
 */
async function resyncSeriesTerms(schoolId: string): Promise<void> {
  const [series, terms] = await Promise.all([
    db.examSeries.findMany({
      where: { schoolId },
      select: { id: true, termId: true, slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }], take: 1, select: { dateKey: true } } },
    }),
    db.term.findMany({ where: { schoolId }, select: { id: true, startDate: true, endDate: true } }),
  ]);
  for (const s of series) {
    const earliest = s.slots[0]?.dateKey;
    if (earliest === undefined) continue;
    const termId = terms.find((t) => key(t.startDate) <= earliest && earliest <= key(t.endDate))?.id ?? null;
    if (termId !== s.termId) await db.examSeries.update({ where: { id: s.id }, data: { termId } });
  }
}

export async function createTerm(
  ctx: ActiveContext,
  academicYearId: string,
  input: { name: string; startDateKey: string; endDateKey: string },
): Promise<TermResult> {
  const schoolId = requireAdmin(ctx);
  const name = input.name.trim().slice(0, 60);
  if (name.length < 1) return { ok: false, errorKey: "terms.giveName" };
  if (!isDateKey(input.startDateKey) || !isDateKey(input.endDateKey)) return { ok: false, errorKey: "terms.badDates" };
  if (input.endDateKey < input.startDateKey) return { ok: false, errorKey: "terms.endsBeforeStart" };

  const year = await db.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
  if (!year) return { ok: false, errorKey: "access.academicYearNotFound" };
  if (input.startDateKey < key(year.startDate) || input.endDateKey > key(year.endDate)) {
    return { ok: false, errorKey: "terms.outsideYear" };
  }

  const siblings = await db.term.findMany({ where: { academicYearId }, select: { name: true, startDate: true, endDate: true } });
  if (siblings.some((s) => s.name.toLowerCase() === name.toLowerCase())) return { ok: false, errorKey: "terms.nameTaken" };
  const overlaps = siblings.find((s) => input.startDateKey <= key(s.endDate) && input.endDateKey >= key(s.startDate));
  if (overlaps) return { ok: false, errorKey: "terms.overlaps" };

  const term = await db.term.create({
    data: {
      schoolId,
      academicYearId,
      name,
      startDate: new Date(`${input.startDateKey}T00:00:00.000Z`),
      endDate: new Date(`${input.endDateKey}T00:00:00.000Z`),
      position: siblings.length + 1,
    },
    select: { id: true },
  });
  await resyncSeriesTerms(schoolId);

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "term.create",
    targetType: "Term",
    targetId: term.id,
    meta: { name, year: year.name, from: input.startDateKey, to: input.endDateKey },
  });
  return { ok: true, termId: term.id };
}

/**
 * Removing a term unhooks, never deletes: the series and cards that named it
 * keep their marks and lose only the label (SetNull), which is what the
 * relation says. Refused while any PUBLISHED card reports into it — a family
 * was told "Term 1"; the office cannot quietly make that nothing.
 */
export async function deleteTerm(ctx: ActiveContext, termId: string): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  const schoolId = requireAdmin(ctx);
  const term = await db.term.findFirst({ where: { id: termId, schoolId }, select: { id: true, name: true } });
  if (!term) return { ok: false, errorKey: "terms.notFound" };
  const published = await db.reportCard.count({ where: { termId, status: "PUBLISHED" } });
  if (published > 0) return { ok: false, errorKey: "terms.hasPublishedCards" };
  await db.term.delete({ where: { id: term.id } });
  await resyncSeriesTerms(schoolId);
  await audit({ schoolId, actorUserId: ctx.user.id, action: "term.delete", targetType: "Term", targetId: term.id, meta: { name: term.name } });
  return { ok: true };
}
