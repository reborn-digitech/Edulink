import "server-only";
import { eResourceNameKey, isbnForms, isbn13, normaliseIsbn, type LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { audit } from "./audit";
import { parseCsvRecords } from "./csv";
import { isDateKey, todayKey } from "./dates";
import { currentAcademicYear } from "./academic-year";
import { financeTable } from "./accounts";
import { consume } from "./rate-limit";
import { campusDesk, collegeDesk, startYearOfKey, yearKeyOf } from "./college-office";
import { liveAllotmentWhere, settleExpulsions } from "./hostel";
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
 *
 * AT A SCHOOL TOO (owner-batch-item5, 27 Oct 2026): the e-resources (their list,
 * an open, a link added), a publisher's ISBN list and a boarder's room change are
 * as useful to a school with the module on, so they go through `campusDesk` and
 * their doors carry no `kinds`. What stays a college's — the borrowing terms for
 * faculty and the book bank, the criterion 4 and 5 tables, the anti-ragging
 * squad, a hostel's college rules, a route as a loop, the university's calendar —
 * still goes through `collegeDesk`, and its doors say `kinds: COLLEGE_KINDS`, so
 * the gate answers a school 404 before any of this runs (role-gate.ts).
 */

const LIBRARY_DESK: readonly Role[] = ["LIBRARIAN", "ADMIN"];
const LIBRARY_READ: readonly Role[] = ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"];
const HOSTEL_DESK: readonly Role[] = ["WARDEN", "ADMIN"];
const HOSTEL_READ: readonly Role[] = ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"];
/** Who reads the e-resources and opens one: the desk's readers and every member who studies or teaches (a school's TEACHER too, owner-batch-item5). */
const ERESOURCE_READ: readonly Role[] = [...LIBRARY_READ, "STUDENT", "TEACHER", "FACULTY", "HOD"];

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

/** The e-resources: every member of the college (or school) reads the list; the desk sees the counts too. */
export async function listEResources(ctx: ActiveContext) {
  const d = await campusDesk(ctx, ERESOURCE_READ, "LIBRARY");
  const rows = await db.libraryEResource.findMany({ where: { schoolId: d.schoolId, ...(LIBRARY_READ.includes(d.role) ? {} : { active: true }) }, orderBy: { name: "asc" } });
  return { items: rows.map(eView) };
}

/**
 * Add an e-resource, or correct one: the name is the key, compared in any capitals or spacing (qb-C, QB-12: the
 * `nameKey` column, unique per school), so "zz diksha" or "ZZ  DIKSHA" corrects "ZZ DIKSHA"'s link and kind and
 * keeps the name as it was first written. Two adds of one name at once: the unique key decides, and the loser's
 * upsert is retried once as the correction it now is.
 */
export async function saveEResource(ctx: ActiveContext, input: { name: string; url: string; kind: EKind }) {
  const d = await campusDesk(ctx, LIBRARY_DESK, "LIBRARY");
  if (!input.url.startsWith("https://")) throw new AccessError("collegeOffice.refuseUrl");
  const name = input.name.trim().replace(/\s+/g, " ");
  const where = { schoolId_nameKey: { schoolId: d.schoolId, nameKey: eResourceNameKey(name) } };
  const upsert = () => db.libraryEResource.upsert({ where, create: { schoolId: d.schoolId, name, nameKey: where.schoolId_nameKey.nameKey, url: input.url.trim(), kind: input.kind }, update: { url: input.url.trim(), kind: input.kind, active: true } });
  const row = await upsert().catch((e: unknown) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return upsert();
    throw e;
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "library.eresource", targetType: "LibraryEResource", targetId: row.id, meta: { kind: input.kind } });
  return eView(row);
}

const OPEN_COUNTED_EVERY_MS = 24 * 60 * 60 * 1000;

/**
 * Opening an e-resource through the app: its link back to follow, and one more on its count — once a person a
 * resource a day (TA-507), so a loop of opens or a link clicked from another site cannot make the library's
 * NAAC 4.2 figure whatever anyone likes. The day is a window of the shared limiter's own, keyed by the person.
 */
export async function openEResource(ctx: ActiveContext, id: string) {
  const d = await campusDesk(ctx, ERESOURCE_READ, "LIBRARY");
  const row = await db.libraryEResource.findFirst({ where: { id, schoolId: d.schoolId, active: true }, select: { id: true, url: true, clicks: true } });
  if (!row) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  if (!(await consume(`eresource-open:${d.userId}:${row.id}`, 1, OPEN_COUNTED_EVERY_MS)).allowed) return { url: row.url, clicks: row.clicks };
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
  const d = await campusDesk(ctx, LIBRARY_DESK, "LIBRARY");
  const { records } = parseCsvRecords(text.replace(/\t/g, ","));
  const invalid: string[] = [];
  const rows: { isbn: string; title: string; author: string; publisher: string; year: number | null }[] = [];
  for (const cells of records) {
    const [rawIsbn = "", title = "", author = "", publisher = "", year = ""] = cells.map((c) => c.trim());
    if (!rawIsbn) continue;
    const checked = normaliseIsbn(rawIsbn);
    if (!checked) {
      if (/\d/.test(rawIsbn)) invalid.push(rawIsbn.slice(0, 20));
      continue;
    }
    const isbn = isbn13(checked);
    const y = Number.parseInt(year, 10);
    rows.push({ isbn, title: (title || isbn).slice(0, 200), author: author.slice(0, 120), publisher: publisher.slice(0, 120), year: Number.isFinite(y) && y > 1400 && y < 2100 ? y : null });
  }
  // qb-C (QB-13): a book is one title whichever ISBN the list prints. Each line is read as its ISBN-13 and a title
  // already catalogued under either form (the desk's own add keeps an ISBN-10 as typed) is left alone; a book twice
  // in the list is added once. What is new is stored under its ISBN-13.
  const known = new Set((rows.length ? await db.libraryTitle.findMany({ where: { schoolId: d.schoolId, isbn: { in: [...new Set(rows.flatMap((r) => isbnForms(r.isbn)))] } }, select: { isbn: true } }) : []).map((t) => isbn13(t.isbn!)));
  const fresh: typeof rows = [];
  for (const r of rows) {
    if (known.has(r.isbn)) continue;
    known.add(r.isbn);
    fresh.push(r);
  }
  const created = fresh.length ? await db.libraryTitle.createMany({ data: fresh.map((r) => ({ ...r, schoolId: d.schoolId })), skipDuplicates: true }) : { count: 0 };
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "library.isbnImport", targetType: "School", targetId: d.schoolId, meta: { added: created.count, already: rows.length - created.count, invalid: invalid.length } });
  return { added: created.count, already: rows.length - created.count, invalid };
}

/**
 * What the desk says after an ISBN list (qb-C, QB-11): "1 title added" and "3 titles added" (a One and a Many key, as
 * the dictionaries do for counts), the ISBNs whose check digit failed named after it. Both forms that paste a list
 * — the school's catalogue and a college's campus page — answer with it.
 */
export function isbnImportSentence(r: { added: number; already: number; invalid: string[] }): { key: TranslationKey; vars: Record<string, string | number> } {
  const one = r.added === 1;
  const vars = { added: r.added, already: r.already };
  if (!r.invalid.length) return { key: one ? "campusForms.isbnAddedOne" : "campusForms.isbnAddedMany", vars };
  return { key: one ? "campusForms.isbnAddedOneNamed" : "campusForms.isbnAddedManyNamed", vars: { ...vars, list: r.invalid.slice(0, 20).join(", ") } };
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
 *
 * THE REFUSALS (qb-C, QB-14; QA-54's rule): a person allowed here asking for
 * what cannot be is a RuleRefusal about the `bed` box, not a 403 — a bed the
 * room does not have is 422, a bed somebody holds is 409. Two moves of one
 * place at once: the first ends the place, the second finds it ended inside
 * its own transaction (a conditional end, not a bare update) or meets the
 * pupil's key, and is told 409 that the boarder has just been moved — the
 * same as a press of an old page after the move, rather than "not found".
 */
export async function changeRoom(ctx: ActiveContext, input: { allotmentId: string; roomId: string; bed: number }): Promise<{ allotmentId: string }> {
  const d = await campusDesk(ctx, HOSTEL_DESK, "HOSTEL");
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: d.schoolId }, select: { timezone: true } });
  const today = todayKey(timezone);
  // A place whose expulsion has taken effect is no longer live (A3-S-15): it cannot move.
  const a = await db.hostelAllotment.findFirst({ where: { id: input.allotmentId, schoolId: d.schoolId, ...liveAllotmentWhere(today) }, select: { id: true, membershipId: true, roomId: true, bed: true, feeDemandId: true } });
  if (!a) {
    if (await justMoved(d.schoolId, input.allotmentId, today)) throw justMovedRefusal();
    throw new AccessError("hostel.refuseNoAllotment", "NOT_FOUND");
  }
  const room = await db.hostelRoom.findFirst({ where: { id: input.roomId, schoolId: d.schoolId }, select: { id: true, beds: true } });
  if (!room) throw new AccessError("hostel.refuseNoRoom", "NOT_FOUND");
  if (input.bed > room.beds) throw new RuleRefusal("hostel.refuseNoSuchBed", 422, { beds: room.beds }, "bed");
  if (room.id === a.roomId && input.bed === a.bed) return { allotmentId: a.id };
  const bedKey = `${room.id}:${input.bed}`;
  // A bed a live place holds is refused before the transaction; the unique key still decides two moves into one bed.
  if (await db.hostelAllotment.findFirst({ where: { schoolId: d.schoolId, activeBedKey: bedKey, ...liveAllotmentWhere(today) }, select: { id: true } })) throw new RuleRefusal("hostel.refuseBedTaken", 409, undefined, "bed");
  try {
    const id = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      // The bed asked for may still be held by a place whose expulsion has taken effect: written ended first.
      await settleExpulsions(tx, d.schoolId, today);
      // Ended only while still live: a move that got here first has ended it, and this one is told so.
      const ended = await tx.hostelAllotment.updateMany({ where: { id: a.id, schoolId: d.schoolId, status: "ACTIVE" }, data: { status: "ENDED", toDate: today, activePupilKey: null, activeBedKey: null, endedByUserId: d.userId } });
      if (ended.count !== 1) throw justMovedRefusal();
      const created = await tx.hostelAllotment.create({ data: { schoolId: d.schoolId, membershipId: a.membershipId, roomId: room.id, bed: input.bed, fromDate: today, status: "ACTIVE", activePupilKey: a.membershipId, activeBedKey: bedKey, feeDemandId: a.feeDemandId, allottedByUserId: d.userId }, select: { id: true } });
      // What stands against the place moves with the boarder (TA-050, TA-557): a proposal still asked and an
      // expulsion approved for a day ahead end the new place on that day, and leave not yet back in is read on it.
      await tx.hostelExpulsion.updateMany({ where: { schoolId: d.schoolId, allotmentId: a.id, status: "ASKED" }, data: { allotmentId: created.id, openKey: created.id } });
      await tx.hostelExpulsion.updateMany({ where: { schoolId: d.schoolId, allotmentId: a.id, status: "APPROVED", effectiveOn: { gt: today } }, data: { allotmentId: created.id } });
      await tx.hostelLeave.updateMany({ where: { schoolId: d.schoolId, allotmentId: a.id, inAt: null, status: { in: ["AWAITING_CONSENT", "PENDING", "APPROVED"] } }, data: { allotmentId: created.id } });
      return created.id;
    });
    await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "hostel.roomChange", targetType: "HostelAllotment", targetId: id, meta: { from: a.id, roomId: room.id, bed: input.bed } });
    return { allotmentId: id };
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // The pupil's key: another move of this boarder holds it now. Any other key is the bed.
      const target = JSON.stringify(error.meta?.target ?? "");
      if (target.includes("activePupilKey")) throw justMovedRefusal();
      throw new RuleRefusal("hostel.refuseBedTaken", 409, undefined, "bed");
    }
    throw error;
  }
}

const justMovedRefusal = () => new RuleRefusal("campusForms.refuseJustMoved", 409, undefined, "bed");

/** A place ended today by a room change whose boarder holds a live place now: the move a second press is about has just been made. */
async function justMoved(schoolId: string, allotmentId: string, today: string): Promise<boolean> {
  const old = await db.hostelAllotment.findFirst({ where: { id: allotmentId, schoolId, status: "ENDED", toDate: today }, select: { membershipId: true } });
  if (!old) return false;
  return (await db.hostelAllotment.count({ where: { schoolId, membershipId: old.membershipId, ...liveAllotmentWhere(today), fromDate: today } })) > 0;
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
  const today = todayKey((await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata");
  const [hostels, rooms, occupied, boarders, incidents, rounds, flagged, late] = await Promise.all([
    db.hostel.count({ where: { schoolId } }),
    db.hostelRoom.findMany({ where: { schoolId, kind: { not: "SICK_BAY" } }, select: { beds: true } }),
    db.hostelAllotment.count({ where: { schoolId, ...liveAllotmentWhere(today) } }),
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
