import "server-only";
import type { Prisma } from "@prisma/client";
import { COMPETITION_INTERNAL_BOARDS, type CompetitionEventBody, type CompetitionInternalBoard } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { addDaysToKey, dateKeyInZone, isDateKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";

/**
 * A COMPETITION IS A CALENDAR EVENT (decision 0007, 6 November 2026; docs/decisions/0007-competitions-on-the-calendar.md).
 *
 * The office adds a competition to the school calendar the way it adds a sports day: a title, a summary, the
 * day or the span, when enrolment closes, the classes it is for, whether pupils may enrol, and the internal
 * board. That one act writes TWO rows in ONE tenant transaction — the `Competition` (the school's own,
 * PUBLISHED at once, where the entries, results and boards live) and the `Holiday` row of kind COMPETITION that
 * puts it on the calendar and on every pupil's and guardian's agenda — joined by `Holiday.competitionId`.
 * Editing the event edits both; removing it removes the calendar row and DELETES the competition only while
 * nobody has entered, otherwise ARCHIVES it (the entries, the consents and the results stay, off the agenda).
 *
 * WHY THE COMPETITION STAYS THE HOME. Entries, consents, results, the cross-school standings and the internal
 * board all hang off `Competition`, and every rule about them (competitions.ts) is unchanged; the calendar row
 * is the event's place in the year and nothing else. A school's competition posted the older way (a draft from
 * the phone's door, published later) gets its calendar row the moment it is published with a start date, and
 * loses it when withdrawn (`syncCalendarRow`), so the agenda shows the same thing whichever door made it.
 *
 * THE PLAIN HOLIDAY WRITES REFUSE THE KIND (holidays.ts): a COMPETITION row without its competition would be an
 * event nobody can enrol in, and a competition edited without its row would drift off the calendar.
 */

export type CompetitionEventInput = CompetitionEventBody;

export type CompetitionEvent = {
  holidayId: string;
  competitionId: string;
  title: string;
  summary: string;
  startDateKey: string;
  endDateKey: string;
  registrationClosesDateKey: string;
  gradeLow: string | null;
  gradeHigh: string | null;
  enrolmentOpen: boolean;
  internalBoard: CompetitionInternalBoard;
  requiresParentConsent: boolean;
  status: string;
  note: string | null;
  body: string;
  /** Entries at the school, asked or consented. */
  entered: number;
};

type Tx = Prisma.TransactionClient;

/** The organising school's office, and only it: the calendar is the office's to set. */
function requireOffice(session: ActiveContext): string {
  if (session.role !== "ADMIN" || !session.schoolId) throw new AccessError("access.onlyASchoolAdminCanEditThe");
  return session.schoolId;
}

const MAX_SPAN_DAYS = 366;

function spanDays(startKey: string, endKey: string): number {
  return Math.round((Date.parse(`${endKey}T00:00:00Z`) - Date.parse(`${startKey}T00:00:00Z`)) / 86_400_000) + 1;
}

/** The last instant of a day in the school's zone: the start of the next day, less a millisecond. */
function endOfDay(dateKey: string, timeZone: string): Date {
  return new Date(zonedStartOfDay(addDaysToKey(dateKey, 1), timeZone).getTime() - 1);
}

type Clean = {
  title: string;
  summary: string;
  startDateKey: string;
  endDateKey: string;
  registrationClosesDateKey: string;
  gradeLow: string | null;
  gradeHigh: string | null;
  enrolmentOpen: boolean;
  internalBoard: CompetitionInternalBoard;
  requiresParentConsent: boolean;
  body: string;
  note: string | null;
};

/**
 * The event's rules, in one place for the web form and the phone's door: a title and a one-line summary, real
 * days with the end not before the start and the span under a year, enrolment closing no later than the event's
 * last day (and on that day when the office leaves it out), classes as the competition keeps them, and a board
 * setting from the coded list.
 */
export function normaliseEvent(input: CompetitionEventInput): Clean {
  const title = input.title.trim();
  if (title.length < 3) throw new AccessError("competitions.giveTitle");
  if (title.length > 140) throw new AccessError("access.thatNameIsTooLong");
  const summary = input.summary.trim();
  if (summary.length < 3) throw new AccessError("competitions.oneLinePlease");
  if (!isDateKey(input.startDateKey)) throw new AccessError("access.startDateIsNotARealDate");
  const endDateKey = input.endDateKey || input.startDateKey;
  if (!isDateKey(endDateKey)) throw new AccessError("access.endDateIsNotARealDate");
  if (endDateKey < input.startDateKey) throw new AccessError("access.theEndDateCannotBeBeforeThe");
  const length = spanDays(input.startDateKey, endDateKey);
  if (length > MAX_SPAN_DAYS) throw new AccessError("access.rangeTooLong", "FORBIDDEN", { days: length });
  const registrationClosesDateKey = input.registrationClosesDateKey || endDateKey;
  if (!isDateKey(registrationClosesDateKey)) throw new AccessError("competitions.notADate");
  if (registrationClosesDateKey > endDateKey) throw new AccessError("competitions.closesAfterEnd");
  if (!(COMPETITION_INTERNAL_BOARDS as readonly string[]).includes(input.internalBoard)) throw new AccessError("competitions.pickABoard");
  const grade = (g: string | undefined) => (g && g.trim().length > 0 ? g.trim().slice(0, 10) : null);
  return {
    title,
    summary: summary.slice(0, 200),
    startDateKey: input.startDateKey,
    endDateKey,
    registrationClosesDateKey,
    gradeLow: grade(input.gradeLow),
    gradeHigh: grade(input.gradeHigh),
    enrolmentOpen: input.enrolmentOpen,
    internalBoard: input.internalBoard,
    requiresParentConsent: input.requiresParentConsent ?? true,
    body: input.body?.trim() ?? "",
    note: input.note?.trim() || null,
  };
}

/** The competition's columns for a clean event, in the school's zone. */
function competitionData(clean: Clean, timeZone: string) {
  return {
    title: clean.title,
    summary: clean.summary,
    body: clean.body,
    gradeLow: clean.gradeLow,
    gradeHigh: clean.gradeHigh,
    startsAt: zonedStartOfDay(clean.startDateKey, timeZone),
    endsAt: endOfDay(clean.endDateKey, timeZone),
    registrationClosesAt: endOfDay(clean.registrationClosesDateKey, timeZone),
    enrolmentOpen: clean.enrolmentOpen,
    internalBoard: clean.internalBoard,
    requiresParentConsent: clean.requiresParentConsent,
  };
}

/**
 * The office adds a competition to the calendar: the Competition and its calendar row, together, published.
 * `organizerSchoolId` and the organiser's name come from the SESSION's school, never from the form.
 */
export async function createCompetitionEvent(session: ActiveContext, input: CompetitionEventInput): Promise<{ holidayId: string; competitionId: string }> {
  const schoolId = requireOffice(session);
  const clean = normaliseEvent(input);
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, timezone: true } });
  const year = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true } });

  const made = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const competition = await tx.competition.create({
      data: {
        ...competitionData(clean, school.timezone),
        organizerName: school.name,
        organizerSchoolId: schoolId,
        registrationOpensAt: null,
        status: "PUBLISHED",
        audience: "SCHOOL",
      },
      select: { id: true },
    });
    const holiday = await tx.holiday.create({
      data: {
        schoolId,
        academicYearId: year?.id ?? null,
        name: clean.title,
        startDateKey: clean.startDateKey,
        endDateKey: clean.endDateKey,
        kind: "COMPETITION",
        note: clean.note,
        competitionId: competition.id,
      },
      select: { id: true },
    });
    return { holidayId: holiday.id, competitionId: competition.id };
  });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "competition.event.create",
    targetType: "Holiday",
    targetId: made.holidayId,
    meta: { competitionId: made.competitionId, title: clean.title, from: clean.startDateKey, to: clean.endDateKey, enrolmentOpen: clean.enrolmentOpen, internalBoard: clean.internalBoard },
  });
  return made;
}

/** The competition event one calendar row is, scoped to the office's school; NOT_FOUND for any other row. */
async function eventRow(schoolId: string, holidayId: string) {
  const row = await db.holiday.findFirst({ where: { id: holidayId, schoolId, kind: "COMPETITION", competitionId: { not: null } }, select: { id: true, competitionId: true, name: true, startDateKey: true } });
  if (!row?.competitionId) throw new AccessError("access.calendarEntryNotFound", "NOT_FOUND");
  return { ...row, competitionId: row.competitionId };
}

/** The office edits the event: both rows, in step, in one tenant transaction. The status is not touched here. */
export async function updateCompetitionEvent(session: ActiveContext, holidayId: string, input: CompetitionEventInput): Promise<void> {
  const schoolId = requireOffice(session);
  const clean = normaliseEvent(input);
  const row = await eventRow(schoolId, holidayId);
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });

  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const changed = await tx.competition.updateMany({ where: { id: row.competitionId, organizerSchoolId: schoolId }, data: competitionData(clean, school.timezone) });
    if (changed.count === 0) throw new AccessError("access.competitionNotFound", "NOT_FOUND");
    await tx.holiday.update({ where: { id: row.id }, data: { name: clean.title, startDateKey: clean.startDateKey, endDateKey: clean.endDateKey, note: clean.note } });
  });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "competition.event.update",
    targetType: "Holiday",
    targetId: row.id,
    meta: { competitionId: row.competitionId, title: clean.title, from: clean.startDateKey, to: clean.endDateKey, enrolmentOpen: clean.enrolmentOpen, internalBoard: clean.internalBoard },
  });
}

/**
 * The office takes the event off the calendar. With entries the competition is ARCHIVED, never deleted: children
 * entered and guardians said yes, and the results recorded stay theirs to read; without any, the competition goes
 * with the row. One tenant transaction either way.
 */
export async function removeCompetitionEvent(session: ActiveContext, holidayId: string): Promise<"DELETED" | "ARCHIVED"> {
  const schoolId = requireOffice(session);
  const row = await eventRow(schoolId, holidayId);
  const outcome = await removeEventRows(schoolId, row.id, row.competitionId);
  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: outcome === "ARCHIVED" ? "competition.event.archive" : "competition.event.delete",
    targetType: "Holiday",
    targetId: row.id,
    meta: { competitionId: row.competitionId, title: row.name, from: row.startDateKey },
  });
  return outcome;
}

/** The rows' half of a removal, shared with holidays.ts deleteHoliday so the plain calendar door keeps the two in step. */
export async function removeEventRows(schoolId: string, holidayId: string, competitionId: string): Promise<"DELETED" | "ARCHIVED"> {
  return db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const entries = await tx.competitionEntry.count({ where: { competitionId } });
    await tx.holiday.deleteMany({ where: { id: holidayId, schoolId } });
    if (entries > 0) {
      await tx.competition.updateMany({ where: { id: competitionId, organizerSchoolId: schoolId }, data: { status: "ARCHIVED" } });
      return "ARCHIVED";
    }
    await tx.competition.deleteMany({ where: { id: competitionId, organizerSchoolId: schoolId } });
    return "DELETED";
  });
}

/**
 * The calendar row of a school's competition, kept true to its status (competitions.ts setCompetitionStatus): a
 * PUBLISHED one with a start date has a row (made here when it was posted the older way, without one), a DRAFT or
 * ARCHIVED one has none. The row's days are the competition's instants read in the school's zone.
 */
export async function syncCalendarRow(competitionId: string): Promise<void> {
  const c = await db.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, organizerSchoolId: true, status: true, title: true, summary: true, startsAt: true, endsAt: true, calendarEntry: { select: { id: true } }, organizerSchool: { select: { timezone: true } } },
  });
  if (!c?.organizerSchoolId || !c.organizerSchool) return;
  const wantsRow = c.status === "PUBLISHED" && c.startsAt !== null;
  if (!wantsRow) {
    if (c.calendarEntry) await db.holiday.deleteMany({ where: { id: c.calendarEntry.id, schoolId: c.organizerSchoolId } });
    return;
  }
  if (c.calendarEntry) return;
  const tz = c.organizerSchool.timezone;
  const startDateKey = dateKeyInZone(c.startsAt!, tz);
  const endDateKey = c.endsAt ? dateKeyInZone(c.endsAt, tz) : startDateKey;
  const year = await db.academicYear.findFirst({ where: { schoolId: c.organizerSchoolId, isCurrent: true }, select: { id: true } });
  await db.holiday.create({
    data: {
      schoolId: c.organizerSchoolId,
      academicYearId: year?.id ?? null,
      name: c.title,
      startDateKey,
      endDateKey: endDateKey < startDateKey ? startDateKey : endDateKey,
      kind: "COMPETITION",
      note: c.summary || null,
      competitionId: c.id,
    },
  });
}

/**
 * The school's competition events for the office's calendar page: each calendar row of kind COMPETITION with the
 * competition's own switches and how many have entered, so the list can show and edit them in place.
 */
export async function listCompetitionEvents(session: ActiveContext): Promise<CompetitionEvent[]> {
  if (!session.schoolId || (session.role !== "ADMIN" && session.role !== "PRINCIPAL")) return [];
  const schoolId = session.schoolId;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  const rows = await db.holiday.findMany({
    where: { schoolId, kind: "COMPETITION", competitionId: { not: null } },
    select: { id: true, note: true, startDateKey: true, endDateKey: true, competition: { select: { id: true, title: true, summary: true, body: true, gradeLow: true, gradeHigh: true, enrolmentOpen: true, internalBoard: true, requiresParentConsent: true, status: true, registrationClosesAt: true, _count: { select: { entries: true } } } } },
    orderBy: { startDateKey: "asc" },
  });
  return rows.flatMap((r) => {
    const c = r.competition;
    if (!c) return [];
    return [
      {
        holidayId: r.id,
        competitionId: c.id,
        title: c.title,
        summary: c.summary,
        startDateKey: r.startDateKey,
        endDateKey: r.endDateKey,
        registrationClosesDateKey: c.registrationClosesAt ? dateKeyInZone(c.registrationClosesAt, school.timezone) : r.endDateKey,
        gradeLow: c.gradeLow,
        gradeHigh: c.gradeHigh,
        enrolmentOpen: c.enrolmentOpen,
        internalBoard: (COMPETITION_INTERNAL_BOARDS as readonly string[]).includes(c.internalBoard) ? (c.internalBoard as CompetitionInternalBoard) : "OFF",
        requiresParentConsent: c.requiresParentConsent,
        status: c.status,
        note: r.note,
        body: c.body,
        entered: c._count.entries,
      },
    ];
  });
}
