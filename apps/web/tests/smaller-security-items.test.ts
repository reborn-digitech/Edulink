/**
 * THE SMALLER SECURITY ITEMS still open after the audit's fix wave (A3-S-15,
 * R-9 and R-63, the risks batch of 5 October 2026), at a ZZ college of this
 * suite's own:
 *
 *   - the registrar's duties panel (the web's server action calls the same
 *     library as the door) takes the ACADEMICS module check the door's gate
 *     gave it, so a college with the module off is refused on both paths;
 *   - the duty desks' write doors are budgeted per person, and a squad
 *     visit (which tells every exam controller) on the fan-out budget;
 *   - an NSS or NCC record's day is bounded: a leaving day has come, and no
 *     day is before a named student's programme began, nor, naming nobody
 *     with a seat, before last academic year;
 *   - an approved expulsion ends the place on its day, read at the time: the
 *     boarder stays on the roster until then and is off it from then, and the
 *     row is written ended (by the one writer) when the bed is given again;
 *   - no identity card and no hall ticket is printed for a student who has
 *     left, and the gate's look-up reads a leaver as not on the roll with the
 *     name alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { academicYearOf } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { ModuleOffError } from "@/lib/access-error";
import { setDuties } from "@/lib/duties";
import { addCorpsActivity, enrolInCorps, leaveCorps } from "@/lib/corps";
import { decideExpulsion, proposeExpulsion } from "@/lib/head-approvals";
import { allotBed, listBoarders, pupilsWithoutBed } from "@/lib/hostel";
import { cardToken, checkIdCode, idCardFor } from "@/lib/id-card";
import { issueHallTickets } from "@/lib/exam-cell";
import { hallTicketForPdf } from "@/lib/exam-cell-after";
import { NOTICE_WRITE_BUDGET, FANOUT_BUDGET } from "@/lib/api-v1";
import { POST as nssActivityPost } from "@/app/api/v1/duties/nss/activities/route";
import { POST as squadVisitPost } from "@/app/api/v1/duties/exam-squad/visits/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const RECORDS_YEAR = academicYearOf(TODAY);
const id: Record<string, string> = {};
const users: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(users[who]!, { schoolId: id.college!, role: role as never });
  return (await getSession())!;
}
const json = (body: unknown) => new Request("http://localhost/api/v1/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const exhaust = (bucket: string, limit: number) =>
  db.rateLimit.upsert({ where: { bucket }, create: { bucket, hits: limit, windowEndsAt: new Date(Date.now() + 600_000) }, update: { hits: limit, windowEndsAt: new Date(Date.now() + 600_000) } });

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Small Items ${STAMP}`, slug: `zz-smallitems-${STAMP}`, code: `ZSI${SUFFIX}`, contactEmail: `zz-smallitems-${STAMP}@test.invalid`, timezone: TZ, kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  // ACADEMICS is deliberately off here: the duties panel must refuse.
  await db.schoolModule.createMany({ data: ["HOSTEL", "IQAC", "EXAMS"].map((module) => ({ schoolId: c, module })) });
  for (const [who, role] of [["Admin", "ADMIN"], ["Principal", "PRINCIPAL"], ["Warden", "WARDEN"], ["Controller", "EXAM_CONTROLLER"], ["Faculty", "FACULTY"], ["S1", "STUDENT"], ["S2", "STUDENT"], ["Leaver", "STUDENT"]] as const) {
    users[who] = (await db.user.create({ data: { name: `ZZ Small ${who}`, email: `zz-smallitems-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } })).id;
    id[who] = (await db.membership.create({ data: { userId: users[who]!, schoolId: c, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZSI${who}${SUFFIX}` } : {}), ...(who === "Leaver" ? { leftAt: new Date() } : {}) }, select: { id: true } })).id;
  }
  const dept = await db.department.create({ data: { schoolId: c, code: `ZSD${SUFFIX}`, name: "ZZ Small Dept" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: c, departmentId: dept.id, code: "ZSIP", name: "ZZ BA Small", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: c, programmeId: prog.id, name: "ZZ Small scheme", effectiveYear: RECORDS_YEAR, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 1, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  // S1 entered this academic year: their programme began in June of it.
  await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: id.S1!, programmeId: prog.id, schemeId: scheme.id, entryYear: RECORDS_YEAR } });
  const hostel = await db.hostel.create({ data: { schoolId: c, name: `ZZ Small House ${SUFFIX}`, kind: "MIXED" }, select: { id: true } });
  id.room = (await db.hostelRoom.create({ data: { schoolId: c, hostelId: hostel.id, number: "S1", beds: 2 }, select: { id: true } })).id;
  id.allotment = (await db.hostelAllotment.create({ data: { schoolId: c, membershipId: id.S1!, roomId: id.room, bed: 1, fromDate: addDaysToKey(TODAY, -30), status: "ACTIVE", activePupilKey: id.S1!, activeBedKey: `${id.room}:1`, allottedByUserId: users.Admin! }, select: { id: true } })).id;
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ Small term ${STAMP}`, academicYear: `${RECORDS_YEAR}–${String(RECORDS_YEAR + 1).slice(2)}`, startsOn: `${RECORDS_YEAR}-06-15`, endsOn: `${RECORDS_YEAR}-11-30`, registrationOpensOn: `${RECORDS_YEAR}-06-01`, registrationClosesOn: `${RECORDS_YEAR}-06-20` }, select: { id: true } })).id;
  id.session = (await db.examSession.create({ data: { schoolId: c, name: `ZZ Small session ${STAMP}`, termId: id.term, status: "FORMS" }, select: { id: true } })).id;
  for (const who of ["S1", "Leaver"]) {
    id[`form${who}`] = (await db.examForm.create({ data: { schoolId: c, sessionId: id.session, studentMembershipId: id[who]!, status: "APPROVED", eligible: true, noDues: true }, select: { id: true } })).id;
  }
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`duty-write:${users.Faculty}`, `duty-fanout:${users.Faculty}`] } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the duties panel takes the module check the door has (A3-S-15)", () => {
  it("refuses the registrar at a college with ACADEMICS off, as MODULE_OFF", async () => {
    const admin = await as("Admin", "ADMIN");
    await expect(setDuties(admin, id.Faculty!, ["NSS_OFFICER"])).rejects.toBeInstanceOf(ModuleOffError);
  });
});

describe("the duty desks' write doors are budgeted (A3-S-15)", () => {
  it("answers 429 at the end of the person's budget, before the body is read", async () => {
    await as("Faculty", "FACULTY");
    await exhaust(`duty-write:${users.Faculty}`, NOTICE_WRITE_BUDGET.limit);
    expect((await nssActivityPost(json({}))).status).toBe(429);
    await exhaust(`duty-fanout:${users.Faculty}`, FANOUT_BUDGET.limit);
    expect((await squadVisitPost(json({}))).status).toBe(429);
  });
});

describe("an NSS record's days are bounded (A3-S-15)", () => {
  it("refuses a leaving day ahead, a day before a named student's programme, and a nameless day before last year", async () => {
    const admin = await as("Admin", "ADMIN");
    await enrolInCorps(admin, "NSS", { studentMembershipIds: [id.S1!], unit: "ZZ Unit" });
    await expect(leaveCorps(admin, "NSS", { studentMembershipIds: [id.S1!], on: addDaysToKey(TODAY, 30) })).rejects.toMatchObject({ key: "duties.corps.refuseLeaveFuture" });
    await expect(addCorpsActivity(admin, "NSS", { title: "ZZ Before", at: addDaysToKey(`${RECORDS_YEAR}-06-01`, -1), hours: 2, camp: false, participantMembershipIds: [id.S1!] })).rejects.toMatchObject({ key: "duties.corps.refuseBeforeProgramme" });
    await expect(addCorpsActivity(admin, "NSS", { title: "ZZ Long ago", at: "1990-01-01", hours: 2, camp: false, participantMembershipIds: [] })).rejects.toMatchObject({ key: "duties.corps.refuseTooEarly" });
    // Today, with the student named, is recorded; and they may leave today.
    await expect(addCorpsActivity(admin, "NSS", { title: "ZZ Today", at: TODAY, hours: 2, camp: false, participantMembershipIds: [id.S1!] })).resolves.toMatchObject({ id: expect.any(String) });
    await expect(leaveCorps(admin, "NSS", { studentMembershipIds: [id.S1!], on: TODAY })).resolves.toEqual({ count: 1 });
  });
});

describe("an approved expulsion ends the place on its day, read at the time (A3-S-15)", () => {
  it("keeps the boarder until the day, takes them off from it, and writes the end when the bed is given again", async () => {
    const day = addDaysToKey(TODAY, 5);
    const x = await proposeExpulsion(await as("Warden", "WARDEN"), { allotmentId: id.allotment!, reason: "ZZ a serious breach", incidentId: null, effectiveOn: day });
    await decideExpulsion(await as("Principal", "PRINCIPAL"), x.id, { approve: true, note: "ZZ read" });
    // Approved for a day ahead: still the boarder's place, still on the roster.
    expect(await db.hostelAllotment.findUniqueOrThrow({ where: { id: id.allotment! }, select: { status: true, toDate: true } })).toEqual({ status: "ACTIVE", toDate: null });
    const warden = await as("Warden", "WARDEN");
    expect((await listBoarders(warden)).items.map((b) => b.membershipId)).toContain(id.S1);
    // The day comes (moved here, as the clock would): off the roster, without anything written.
    const yesterday = addDaysToKey(TODAY, -1);
    await db.hostelExpulsion.update({ where: { id: x.id }, data: { effectiveOn: yesterday } });
    expect((await listBoarders(warden)).items.map((b) => b.membershipId)).not.toContain(id.S1);
    expect((await pupilsWithoutBed(warden)).map((p) => p.membershipId)).toContain(id.S1);
    expect((await db.hostelAllotment.findUniqueOrThrow({ where: { id: id.allotment! }, select: { status: true } })).status).toBe("ACTIVE");
    // The bed given to another: the one writer ends the old place on its day, by its decider.
    await allotBed(warden, { membershipId: id.S2!, roomId: id.room!, bed: 1, fromDate: TODAY, feeDemandId: null });
    expect(await db.hostelAllotment.findUniqueOrThrow({ where: { id: id.allotment! }, select: { status: true, toDate: true, endedByUserId: true, activeBedKey: true } })).toEqual({ status: "ENDED", toDate: yesterday, endedByUserId: users.Principal, activeBedKey: null });
  });
});

describe("no card and no hall ticket for a student who has left (A3-S-15)", () => {
  it("refuses the card whoever asks, and the gate reads the leaver as not on the roll with the name alone", async () => {
    const admin = await as("Admin", "ADMIN");
    await expect(idCardFor(admin, id.Leaver!)).rejects.toMatchObject({ key: "collegeDesks.idCardRefuseLeft" });
    await expect(idCardFor(admin, id.S1!)).resolves.toMatchObject({ name: "ZZ Small S1" });
    const token = cardToken(id.college!, id.Leaver!)!;
    expect(await checkIdCode(admin, token)).toMatchObject({ found: true, onRoll: false, name: "ZZ Small Leaver", group: null });
  });

  it("issues no hall ticket to a leaver's approved form, and prints none for one made before they left", async () => {
    const controller = await as("Controller", "EXAM_CONTROLLER");
    await issueHallTickets(controller, id.session!);
    const tickets = await db.hallTicket.findMany({ where: { sessionId: id.session! }, select: { studentMembershipId: true } });
    expect(tickets.map((t) => t.studentMembershipId)).toEqual([id.S1]);
    const old = await db.hallTicket.create({ data: { schoolId: id.college!, sessionId: id.session!, formId: id.formLeaver!, studentMembershipId: id.Leaver!, number: "HT9999", code: `ZZSL${SUFFIX}`, issuedByUserId: users.Controller! }, select: { id: true } });
    await expect(hallTicketForPdf(controller, old.id)).rejects.toMatchObject({ key: "examCell.refuseTicketLeft" });
  });
});
