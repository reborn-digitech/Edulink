import "server-only";
import { normaliseIsbn, type LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { parseCsvRecords } from "./csv";
import { isDateKey, todayKey } from "./dates";
import { currentAcademicYear } from "./academic-year";
import { financeTable } from "./accounts";
import { collegeDesk, startYearOfKey, yearKeyOf } from "./college-office";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE LIBRARY, THE HOSTEL AND THE BUS AT A COLLEGE (4 October 2026). The
 * three modules carry over whole (library.ts, hostel.ts, transport.ts); a
 * college changes what each handles, not how, and every difference is a
 * setting on the module's row or a column with a default:
 *
 * LIBRARY — faculty and college students borrow on their own terms
 * (LibrarySettings faculty… / collegeStudent… columns, read by library.ts);
 * the book bank gives a scholarship holder `bookBankExtra` more books;
 * periodicals are titles of category PERIODICAL; e-resources (N-LIST,
 * DELNET, e-journals) are links whose opens through the app are counted;
 * a publisher's ISBN list is imported in bulk; `libraryTable(year)` is the
 * criterion-4 numbers for the IQAC builder.
 *
 * HOSTEL — an adult boarder's leave needs no guardian's consent (hostel.ts
 * already decides by isMinor); the curfew and whether night-outs are allowed
 * are the hostel's rules; a room change ends one bed and takes another in one
 * transaction; the mess is billed monthly to the ledger (college-fees.ts);
 * the anti-ragging squad's rounds are logged; `hostelTable(year)` is
 * occupancy and discipline for criterion 5.
 *
 * TRANSPORT — a route may be a LOOP (a campus shuttle: no roster, trips
 * without boardings, transport.ts refuses both), staff may hold seats, and a
 * route's fee per term is raised on the riders' ledgers (college-fees.ts).
 *
 * THE ACADEMIC CALENDAR the university publishes is pasted in as the
 * calendar's own entries (Holiday rows of kind HOLIDAY, EXAM or EVENT).
 */

const LIBRARY_DESK: readonly Role[] = ["LIBRARIAN", "ADMIN"];
const LIBRARY_READ: readonly Role[] = ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"];
const HOSTEL_DESK: readonly Role[] = ["WARDEN", "ADMIN"];
const HOSTEL_READ: readonly Role[] = ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"];

/** The academic year a "2026-27" key names, as a day range; the current one when none is named. */
async function yearRange(schoolId: string, key?: string): Promise<{ key: string; from: Date; to: Date }> {
  if (key) {
    const y = startYearOfKey(key);
    const row = await db.academicYear.findFirst({ where: { schoolId, startDate: { gte: new Date(Date.UTC(y, 0, 1)), lt: new Date(Date.UTC(y + 1, 0, 1)) } }, select: { startDate: true, endDate: true } });
    if (row) return { key, from: row.startDate, to: row.endDate };
    return { key, from: new Date(Date.UTC(y, 5, 1)), to: new Date(Date.UTC(y + 1, 4, 31, 23, 59, 59)) };
  }
  const cur = await currentAcademicYear(schoolId);
  if (cur) return { key: yearKeyOf(cur.startDate), from: cur.startDate, to: cur.endDate };
  const now = new Date();
  const y = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return { key: `${y}-${String((y + 1) % 100).padStart(2, "0")}`, from: new Date(Date.UTC(y, 5, 1)), to: new Date(Date.UTC(y + 1, 4, 31, 23, 59, 59)) };
}

/* -------------------------------------------------------------------------- */
/* Library                                                                     */
/* -------------------------------------------------------------------------- */

export async function collegeLibrarySettings(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, LIBRARY_READ, "LIBRARY");
  const row = await db.librarySettings.findUnique({ where: { schoolId: d.schoolId }, select: { facultyLimit: true, facultyLoanDays: true, collegeStudentLimit: true, collegeStudentLoanDays: true, bookBankExtra: true } });
  return row ?? { facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 };
}

export async function saveCollegeLibrarySettings(ctx: ActiveContext, input: { facultyLimit: number; facultyLoanDays: number; collegeStudentLimit: number; collegeStudentLoanDays: number; bookBankExtra: number }) {
  const d = await collegeDesk(ctx, ["ADMIN"], "LIBRARY");
  await db.librarySettings.upsert({ where: { schoolId: d.schoolId }, create: { schoolId: d.schoolId, ...input, updatedByUserId: d.userId }, update: { ...input, updatedByUserId: d.userId } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "library.collegeSettings", targetType: "School", targetId: d.schoolId, meta: { ...input } });
  return collegeLibrarySettings(ctx);
}

type EKind = (typeof LIBRARY_ERESOURCE_KINDS)[number];
const eView = (r: { id: string; name: string; url: string; kind: string; clicks: number; active: boolean }) => ({ id: r.id, name: r.name, url: r.url, kind: r.kind as EKind, clicks: r.clicks, active: r.active });

/** The e-resources: every member of the college reads the list; the desk sees the counts too. */
export async function listEResources(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, [...LIBRARY_READ, "STUDENT", "FACULTY", "HOD"], "LIBRARY");
  const rows = await db.libraryEResource.findMany({ where: { schoolId: d.schoolId, ...(LIBRARY_READ.includes(d.role) ? {} : { active: true }) }, orderBy: { name: "asc" } });
  return { items: rows.map(eView) };
}

export async function saveEResource(ctx: ActiveContext, input: { name: string; url: string; kind: EKind }) {
  const d = await collegeDesk(ctx, LIBRARY_DESK, "LIBRARY");
  if (!input.url.startsWith("https://")) throw new AccessError("collegeOffice.refuseUrl");
  const row = await db.libraryEResource.upsert({ where: { schoolId_name: { schoolId: d.schoolId, name: input.name.trim() } }, create: { schoolId: d.schoolId, name: input.name.trim(), url: input.url.trim(), kind: input.kind }, update: { url: input.url.trim(), kind: input.kind, active: true } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "library.eresource", targetType: "LibraryEResource", targetId: row.id, meta: { kind: input.kind } });
  return eView(row);
}

/** Opening an e-resource through the app: one more on its count, and its link back to follow. */
export async function openEResource(ctx: ActiveContext, id: string) {
  const d = await collegeDesk(ctx, [...LIBRARY_READ, "STUDENT", "FACULTY", "HOD"], "LIBRARY");
  const row = await db.libraryEResource.findFirst({ where: { id, schoolId: d.schoolId, active: true }, select: { id: true } });
  if (!row) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const updated = await db.libraryEResource.update({ where: { id: row.id }, data: { clicks: { increment: 1 } }, select: { url: true, clicks: true } });
  return updated;
}

/**
 * A publisher's ISBN list, pasted: one book a line — the ISBN first, then
 * the title, author, publisher and year, by commas or tabs. A title already
 * catalogued under the ISBN is left alone; an ISBN whose check digit fails is
 * named back. Copies are added at the desk as the books arrive.
 */
export async function importIsbnList(ctx: ActiveContext, text: string): Promise<{ added: number; already: number; invalid: string[] }> {
  const d = await collegeDesk(ctx, LIBRARY_DESK, "LIBRARY");
  const { records } = parseCsvRecords(text.replace(/\t/g, ","));
  const invalid: string[] = [];
  const rows: { isbn: string; title: string; author: string; publisher: string; year: number | null }[] = [];
  for (const cells of records) {
    const [rawIsbn = "", title = "", author = "", publisher = "", year = ""] = cells.map((c) => c.trim());
    if (!rawIsbn) continue;
    const isbn = normaliseIsbn(rawIsbn);
    if (!isbn) {
      if (/\d/.test(rawIsbn)) invalid.push(rawIsbn.slice(0, 20));
      continue;
    }
    const y = Number.parseInt(year, 10);
    rows.push({ isbn, title: (title || isbn).slice(0, 200), author: author.slice(0, 120), publisher: publisher.slice(0, 120), year: Number.isFinite(y) && y > 1400 && y < 2100 ? y : null });
  }
  const created = rows.length ? await db.libraryTitle.createMany({ data: rows.map((r) => ({ ...r, schoolId: d.schoolId })), skipDuplicates: true }) : { count: 0 };
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "library.isbnImport", targetType: "School", targetId: d.schoolId, meta: { added: created.count, already: rows.length - created.count, invalid: invalid.length } });
  return { added: created.count, already: rows.length - created.count, invalid };
}

/**
 * THE LIBRARY'S CRITERION-4 NUMBERS for a year (NAAC 4.2; the AICTE norms):
 * titles, copies, periodicals, e-resources and their opens, the year's
 * issues, members, issues per student, and the year's library spend (from the
 * accounts' finance table). For the IQAC builder; plain reads.
 */
export async function libraryTable(schoolId: string, year?: string) {
  const r = await yearRange(schoolId, year);
  const [titles, copies, periodicals, eRows, issues, members, studentIssues, students, finance] = await Promise.all([
    db.libraryTitle.count({ where: { schoolId } }),
    db.libraryCopy.count({ where: { schoolId, status: { notIn: ["WITHDRAWN", "LOST"] } } }),
    db.libraryTitle.count({ where: { schoolId, category: "PERIODICAL" } }),
    db.libraryEResource.findMany({ where: { schoolId, active: true }, select: { clicks: true } }),
    db.libraryIssue.count({ where: { schoolId, issuedAt: { gte: r.from, lte: r.to } } }),
    db.libraryMember.count({ where: { schoolId } }),
    db.libraryIssue.count({ where: { schoolId, issuedAt: { gte: r.from, lte: r.to }, member: { kind: { in: ["PUPIL", "STUDENT_COLLEGE"] } } } }),
    db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
    financeTable(schoolId, 5),
  ]);
  return {
    academicYear: r.key,
    titles,
    copies,
    periodicals,
    eResources: eRows.length,
    eResourceClicks: eRows.reduce((a, e) => a + e.clicks, 0),
    issues,
    members,
    issuesPerStudent: students > 0 ? Math.round((studentIssues / students) * 100) / 100 : 0,
    expenditurePaise: finance.years.find((y) => y.academicYear === r.key)?.libraryPaise ?? 0,
  };
}

export async function libraryTableFor(ctx: ActiveContext, year?: string) {
  const d = await collegeDesk(ctx, LIBRARY_READ, "LIBRARY");
  return libraryTable(d.schoolId, year);
}

/* -------------------------------------------------------------------------- */
/* Hostel                                                                      */
/* -------------------------------------------------------------------------- */

/** The hostel's rules at a college: the curfew, night-outs, the mess's monthly charge. */
export async function saveHostelRules(ctx: ActiveContext, hostelId: string, input: { curfewMinute: number; nightOutAllowed: boolean; messMonthlyPaise: number }) {
  const d = await collegeDesk(ctx, ["ADMIN"], "HOSTEL");
  const h = await db.hostel.findFirst({ where: { id: hostelId, schoolId: d.schoolId }, select: { id: true } });
  if (!h) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const row = await db.hostel.update({ where: { id: h.id }, data: input, select: { id: true, curfewMinute: true, nightOutAllowed: true, messMonthlyPaise: true } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "hostel.rules", targetType: "Hostel", targetId: h.id, meta: { ...input } });
  return row;
}

/**
 * A boarder moves to another bed (or another hostel): the bed held is given
 * up today and the new one taken from today, in one transaction, with the
 * hostel fee's demand carried over. The new bed must be free; the unique keys
 * decide two moves at once.
 */
export async function changeRoom(ctx: ActiveContext, input: { allotmentId: string; roomId: string; bed: number }): Promise<{ allotmentId: string }> {
  const d = await collegeDesk(ctx, HOSTEL_DESK, "HOSTEL");
  const a = await db.hostelAllotment.findFirst({ where: { id: input.allotmentId, schoolId: d.schoolId, status: "ACTIVE" }, select: { id: true, membershipId: true, roomId: true, bed: true, feeDemandId: true } });
  if (!a) throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  const room = await db.hostelRoom.findFirst({ where: { id: input.roomId, schoolId: d.schoolId }, select: { id: true, beds: true } });
  if (!room) throw new AccessError("hostel.refuseNoRoom", "NOT_FOUND");
  if (input.bed > room.beds) throw new AccessError("hostel.refuseNoSuchBed", "FORBIDDEN", { beds: room.beds });
  if (room.id === a.roomId && input.bed === a.bed) return { allotmentId: a.id };
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: d.schoolId }, select: { timezone: true } });
  const today = todayKey(timezone);
  const bedKey = `${room.id}:${input.bed}`;
  try {
    const id = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.hostelAllotment.update({ where: { id: a.id }, data: { status: "ENDED", toDate: today, activePupilKey: null, activeBedKey: null, endedByUserId: d.userId } });
      const created = await tx.hostelAllotment.create({ data: { schoolId: d.schoolId, membershipId: a.membershipId, roomId: room.id, bed: input.bed, fromDate: today, status: "ACTIVE", activePupilKey: a.membershipId, activeBedKey: bedKey, feeDemandId: a.feeDemandId, allottedByUserId: d.userId }, select: { id: true } });
      return created.id;
    });
    await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "hostel.roomChange", targetType: "HostelAllotment", targetId: id, meta: { from: a.id, roomId: room.id, bed: input.bed } });
    return { allotmentId: id };
  } catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError("hostel.refuseBedTaken");
  }
}

export async function listSquadRounds(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, HOSTEL_READ, "HOSTEL");
  const rows = await db.hostelSquadRound.findMany({ where: { schoolId: d.schoolId }, orderBy: { at: "desc" }, take: 200, include: { hostel: { select: { name: true } } } });
  return { items: rows.map((r) => ({ id: r.id, hostelId: r.hostelId, hostelName: r.hostel.name, at: r.at.toISOString(), members: r.members, note: r.note, flagged: r.flagged })) };
}

/** A round of the anti-ragging squad, logged; a round that found something tells the office. */
export async function logSquadRound(ctx: ActiveContext, input: { hostelId: string; at: string; members: string; note: string; flagged: boolean }) {
  const d = await collegeDesk(ctx, HOSTEL_DESK, "HOSTEL");
  const h = await db.hostel.findFirst({ where: { id: input.hostelId, schoolId: d.schoolId }, select: { id: true, name: true } });
  if (!h) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const at = new Date(input.at);
  if (Number.isNaN(at.getTime()) || at.getTime() > Date.now() + 3_600_000) throw new AccessError("collegeOffice.refuseDates");
  const row = await db.hostelSquadRound.create({ data: { schoolId: d.schoolId, hostelId: h.id, at, members: input.members.trim(), note: input.note.trim(), flagged: input.flagged, loggedByUserId: d.userId } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "hostel.squadRound", targetType: "HostelSquadRound", targetId: row.id, meta: { flagged: input.flagged } });
  return { id: row.id, hostelId: h.id, hostelName: h.name, at: row.at.toISOString(), members: row.members, note: row.note, flagged: row.flagged };
}

/**
 * THE HOSTEL'S CRITERION-5 NUMBERS for a year: hostels, beds, beds held now
 * and the occupancy, boarders over the year, incidents tagged to a hostel,
 * the squad's rounds and those flagged, and late returns. Plain reads.
 */
export async function hostelTable(schoolId: string, year?: string) {
  const r = await yearRange(schoolId, year);
  const fromKey = r.from.toISOString().slice(0, 10);
  const toKey = r.to.toISOString().slice(0, 10);
  const [hostels, rooms, occupied, boarders, incidents, rounds, flagged, late] = await Promise.all([
    db.hostel.count({ where: { schoolId } }),
    db.hostelRoom.findMany({ where: { schoolId, kind: { not: "SICK_BAY" } }, select: { beds: true } }),
    db.hostelAllotment.count({ where: { schoolId, status: "ACTIVE" } }),
    db.hostelAllotment.findMany({ where: { schoolId, fromDate: { lte: toKey }, OR: [{ toDate: null }, { toDate: { gte: fromKey } }] }, select: { membershipId: true }, distinct: ["membershipId"] }),
    db.incident.count({ where: { schoolId, hostelId: { not: null }, occurredAt: { gte: r.from, lte: r.to } } }),
    db.hostelSquadRound.count({ where: { schoolId, at: { gte: r.from, lte: r.to } } }),
    db.hostelSquadRound.count({ where: { schoolId, flagged: true, at: { gte: r.from, lte: r.to } } }),
    db.hostelLeave.count({ where: { schoolId, late: true, fromAt: { gte: r.from, lte: r.to } } }),
  ]);
  const beds = rooms.reduce((a, x) => a + x.beds, 0);
  return { academicYear: r.key, hostels, beds, occupied, occupancyPercent: beds > 0 ? Math.round((occupied / beds) * 1000) / 10 : 0, boarders: boarders.length, incidents, squadRounds: rounds, flaggedRounds: flagged, lateReturns: late };
}

export async function hostelTableFor(ctx: ActiveContext, year?: string) {
  const d = await collegeDesk(ctx, HOSTEL_READ, "HOSTEL");
  return hostelTable(d.schoolId, year);
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

/** A route at a college: a fixed route with a roster or a campus loop, and its fee per term. */
export async function saveRouteCollege(ctx: ActiveContext, routeId: string, input: { kind: "FIXED" | "LOOP"; feePerTermPaise: number }) {
  const d = await collegeDesk(ctx, ["ADMIN"], "TRANSPORT");
  const route = await db.transportRoute.findFirst({ where: { id: routeId, schoolId: d.schoolId }, select: { id: true } });
  if (!route) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  if (input.kind === "LOOP" && (await db.transportAllotment.count({ where: { routeId: route.id, toDateKey: null } })) > 0) throw new AccessError("collegeOffice.refuseLoopHasRiders");
  const row = await db.transportRoute.update({ where: { id: route.id }, data: { kind: input.kind, feePerTermPaise: input.kind === "LOOP" ? 0 : input.feePerTermPaise }, select: { id: true, kind: true, feePerTermPaise: true } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "transport.routeCollege", targetType: "TransportRoute", targetId: route.id, meta: { ...input } });
  return row;
}

/* -------------------------------------------------------------------------- */
/* The university's calendar                                                   */
/* -------------------------------------------------------------------------- */

const CALENDAR_KINDS = ["HOLIDAY", "EXAM", "EVENT"] as const;

/**
 * The academic calendar the university publishes, pasted: one entry a line —
 * the first day, the last day (blank for one day), the kind (HOLIDAY, EXAM or
 * EVENT) and the name. An entry already on the calendar with the same first
 * day and name is left alone, so the same sheet pasted twice adds nothing.
 */
export async function importCalendar(ctx: ActiveContext, text: string): Promise<{ added: number; already: number; refused: { line: number; reason: string }[] }> {
  const d = await collegeDesk(ctx, ["ADMIN"]);
  const year = await currentAcademicYear(d.schoolId);
  const { records, lineNumbers } = parseCsvRecords(text.replace(/\t/g, ","));
  const refused: { line: number; reason: string }[] = [];
  let added = 0;
  let already = 0;
  for (const [i, cells] of records.entries()) {
    const line = lineNumbers[i] ?? i + 1;
    const [from = "", to = "", kindRaw = "", name = ""] = cells.map((c) => c.trim());
    if (!from && !name) continue;
    if (i === 0 && !isDateKey(from)) continue; // the heading row
    const kind = kindRaw.toUpperCase();
    if (!isDateKey(from) || (to && (!isDateKey(to) || to < from))) {
      refused.push({ line, reason: "date" });
      continue;
    }
    if (!(CALENDAR_KINDS as readonly string[]).includes(kind)) {
      refused.push({ line, reason: "kind" });
      continue;
    }
    if (name.length < 2) {
      refused.push({ line, reason: "name" });
      continue;
    }
    const exists = await db.holiday.findFirst({ where: { schoolId: d.schoolId, startDateKey: from, name: name.slice(0, 120) }, select: { id: true } });
    if (exists) {
      already += 1;
      continue;
    }
    await db.holiday.create({ data: { schoolId: d.schoolId, academicYearId: year?.id ?? null, name: name.slice(0, 120), startDateKey: from, endDateKey: to || from, kind, note: null } });
    added += 1;
  }
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "calendar.import", targetType: "School", targetId: d.schoolId, meta: { added, already, refused: refused.length } });
  return { added, already, refused };
}
