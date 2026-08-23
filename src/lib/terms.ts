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
};

export type TermResult = { ok: true; termId: string } | { ok: false; errorKey: TranslationKey };

function key(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function requireAdmin(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanSetTerms");
  return ctx.schoolId;
}

/** The terms of one year, in order. */
export async function termsOfYear(schoolId: string, academicYearId: string, timezone = "UTC"): Promise<TermView[]> {
  const today = todayKey(timezone);
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
  }));
}

/** The current year's terms — what the exams page and the card builder offer. */
export async function currentTerms(schoolId: string, timezone = "UTC"): Promise<TermView[]> {
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
  await audit({ schoolId, actorUserId: ctx.user.id, action: "term.delete", targetType: "Term", targetId: term.id, meta: { name: term.name } });
  return { ok: true };
}
