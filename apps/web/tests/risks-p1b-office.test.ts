/**
 * The risks batch's package 1B, the office's decisions applied by code (5 Oct 2026; docs/audit-2026-10-05/
 * 08-remaining-risks.md). One ZZ law-and-engineering college of this suite's own, removed after:
 *   - R-7: four eyes on a concession above the limit, for one person holding ADMIN and PRINCIPAL (the refund
 *     exception and the expulsion are pinned in tests/head-approvals.test.ts);
 *   - R-11: the office corrects a taken hostel roll call with a reason, the warden is still refused, and one audit
 *     row names the person and every mark before and after;
 *   - R-60: the seats awaiting their refund, for ADMIN and ACCOUNTS only;
 *   - R-52: after the office rotates a student's claim code, the old code claims nothing;
 *   - R-53 and R-59: a moot of a year whose BCI return is generated is frozen, and each moot says who may correct it;
 *   - R-24: the lab batches name the day a change takes effect.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { academicYearOf } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { decideConcession } from "@/lib/college-fees";
import { correctRollCall, rollCallSheet, takeRollCall } from "@/lib/hostel";
import { refundsAwaiting } from "@/lib/college-admissions";
import { rotateClaimCode } from "@/lib/id-card";
import { claimChildFor } from "@/lib/claim-child";
import { translator } from "@/lib/i18n/dictionary";
import { dayAfterMarked, labBatches, mootCourts, saveMootCourt, splitLabBatches } from "@/lib/stream-records";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { labDesk } from "@/lib/duty-desks";
import { classCode } from "@/lib/codes";
import { POST as correctPost } from "@/app/api/v1/hostel/rollcall/[rollCallId]/correct/route";
import { GET as awaitingGet } from "@/app/api/v1/college/admissions/refunds-awaiting/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-p1b-office-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const users: string[] = [];
const t = translator("en");

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession())!;
}

async function person(who: string, roles: string[], extra: { birthdate?: Date } = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ P1B ${who}`, email: MAIL(who), isMinor: false, ...(extra.birthdate ? { birthdate: extra.birthdate } : {}) }, select: { id: true } })).id;
  users.push(ids[who]!);
  for (const role of roles) ids[`${who}:${role}`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

const json = (body: unknown) => new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ P1B Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  users.push(ids.operator);
  const operator = { user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } } as unknown as ActiveContext;
  const made = await createSchool(operator, { name: `ZZ P1B Office College ${STAMP}`, contactEmail: MAIL("contact"), timezone: TZ, kind: "COLLEGE", streams: ["LAW", "ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  await db.schoolModule.createMany({ data: ["ACADEMICS", "ADMISSIONS", "HOSTEL"].map((module) => ({ schoolId: ids.college!, module })), skipDuplicates: true });
  await person("both", ["ADMIN", "PRINCIPAL"]);
  await person("admin", ["ADMIN"]);
  await person("principal", ["PRINCIPAL"]);
  await person("warden", ["WARDEN"]);
  await person("accounts", ["ACCOUNTS"]);
  await person("author", ["FACULTY"]);
  await person("other", ["FACULTY"]);
  await person("boarder", ["STUDENT"], { birthdate: new Date("2005-03-04T00:00:00Z") });
  await person("boarder2", ["STUDENT"]);
  await person("guardian", []);
});

afterAll(async () => {
  __resetCookies();
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.guardianship.deleteMany({ where: { parentUserId: ids.guardian } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("R-7: four eyes on a concession above the limit", () => {
  it("refuses the one who granted it, though they hold PRINCIPAL too; another principal decides", async () => {
    const year = await db.academicYear.create({ data: { schoolId: ids.college!, name: "2026-27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
    const c = await db.feeConcession.create({ data: { schoolId: ids.college!, studentMembershipId: ids["boarder:STUDENT"]!, academicYearId: year.id, kind: "AMOUNT", value: 900_000, reason: "ZZ above the limit", grantedByUserId: ids.both!, authority: "ZZ", approvalStatus: "PENDING" }, select: { id: true } });
    await expect(decideConcession(await as("both", "PRINCIPAL"), c.id, { approve: true })).rejects.toMatchObject({ key: "collegeDesks.refuseOwnAsk" });
    expect((await db.feeConcession.findUniqueOrThrow({ where: { id: c.id }, select: { approvalStatus: true } })).approvalStatus).toBe("PENDING");
    expect((await decideConcession(await as("principal", "PRINCIPAL"), c.id, { approve: false, note: "ZZ another head" })).approvalStatus).toBe("REFUSED");
  });
});

describe("R-11: the office corrects a taken roll call", () => {
  it("corrects with a reason, keeps the warden locked out, and audits every mark before and after", async () => {
    const hostel = await db.hostel.create({ data: { schoolId: ids.college!, name: `ZZ P1B House ${STAMP}`, kind: "MIXED" }, select: { id: true } });
    const room = await db.hostelRoom.create({ data: { schoolId: ids.college!, hostelId: hostel.id, number: "R1", beds: 2 }, select: { id: true } });
    const a1 = await db.hostelAllotment.create({ data: { schoolId: ids.college!, membershipId: ids["boarder:STUDENT"]!, roomId: room.id, bed: 1, fromDate: "2026-06-01", status: "ACTIVE", allottedByUserId: ids.admin! }, select: { id: true } });
    const a2 = await db.hostelAllotment.create({ data: { schoolId: ids.college!, membershipId: ids["boarder2:STUDENT"]!, roomId: room.id, bed: 2, fromDate: "2026-06-01", status: "ACTIVE", allottedByUserId: ids.admin! }, select: { id: true } });
    const warden = await as("warden", "WARDEN");
    const taken = await takeRollCall(warden, { hostelId: hostel.id, dateKey: TODAY, slot: "NIGHT", clientId: `zz-p1b-${STAMP}`, entries: [{ allotmentId: a1.id, status: "ABSENT" }, { allotmentId: a2.id, status: "PRESENT" }] });
    // The lock stays: a second sheet for the slot is refused to the warden, and the correction door too.
    await expect(takeRollCall(warden, { hostelId: hostel.id, dateKey: TODAY, slot: "NIGHT", clientId: `zz-p1b-other-${STAMP}`, entries: [{ allotmentId: a1.id, status: "PRESENT" }] })).rejects.toMatchObject({ key: "hostel.refuseRollCallTaken" });
    await expect(correctRollCall(warden, taken.rollCallId, { entries: [{ allotmentId: a1.id, status: "PRESENT" }], reason: "ZZ in the common room" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    // The door refuses the warden before the body (403).
    await as("warden", "WARDEN");
    expect((await correctPost(json({}), { params: Promise.resolve({ rollCallId: taken.rollCallId }) })).status).toBe(403);

    const admin = await as("admin", "ADMIN");
    const sheet = await rollCallSheet(admin, hostel.id, "NIGHT", TODAY);
    expect([sheet.rollCallId, sheet.canCorrect]).toEqual([taken.rollCallId, true]);
    expect((await rollCallSheet(warden, hostel.id, "NIGHT", TODAY)).canCorrect).toBe(false);
    await expect(correctRollCall(admin, taken.rollCallId, { entries: [{ allotmentId: a1.id, status: "PRESENT" }], reason: "  " })).rejects.toMatchObject({ key: "riskDecisions.refuseCorrectionReason", status: 422 });
    const done = await correctRollCall(admin, taken.rollCallId, { entries: [{ allotmentId: a1.id, status: "PRESENT" }, { allotmentId: a2.id, status: "PRESENT" }], reason: "ZZ in the common room" });
    expect(done).toEqual({ rollCallId: taken.rollCallId, changed: 1, present: 2, onLeave: 0, absent: 0 });
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.college!, action: "hostel.rollcall.correct", targetId: taken.rollCallId } });
    expect(row.actorUserId).toBe(ids.admin);
    expect(JSON.parse(row.meta ?? "{}")).toMatchObject({ reason: "ZZ in the common room", changes: [{ allotmentId: a1.id, membershipId: ids["boarder:STUDENT"], before: "ABSENT", after: "PRESENT" }] });
    // The same again changes nothing and writes no second row.
    expect((await correctRollCall(admin, taken.rollCallId, { entries: [{ allotmentId: a1.id, status: "PRESENT" }], reason: "ZZ again" })).changed).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.college!, action: "hostel.rollcall.correct" } })).toBe(1);
  });
});

describe("R-60: the seats awaiting their refund", () => {
  it("lists a cancelled seat with its fee paid and no reference, not a refunded one, for ADMIN and ACCOUNTS only", async () => {
    const dept = await db.department.create({ data: { schoolId: ids.college!, code: `ZP${String(STAMP).slice(-4)}`, name: "ZZ P1B Dept" }, select: { id: true } });
    const programme = await db.programme.create({ data: { schoolId: ids.college!, departmentId: dept.id, code: "ZZP1BBA", name: "ZZ P1B BA", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
    const round = await db.admissionRound.create({ data: { schoolId: ids.college!, programmeId: programme.id, intakeYear: 2026, kind: "CAP", name: "ZZ Round", opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2026-08-31T00:00:00Z") }, select: { id: true } });
    const app = (n: number, data: Record<string, unknown>) => db.collegeApplication.create({ data: { schoolId: ids.college!, roundId: round.id, programmeId: programme.id, number: n, applicantName: `ZZ Applicant ${n}`, category: "OPEN", quota: "CAP", status: "CANCELLED", cancelledAt: new Date(), cancelReason: "ZZ", admissionFeePaise: 2_000_000, admissionFeePaidAt: new Date(), refundPaise: 1_000_000, refundSlab: "WITHIN_15_AFTER", refundRecordedAt: new Date(), ...data }, select: { id: true } });
    const waiting = await app(1, {});
    await app(2, { status: "REFUNDED", refundReference: "ZZ-BANK-1" });
    await app(3, { admissionFeePaidAt: null, admissionFeePaise: null });
    const list = await refundsAwaiting(await as("accounts", "ACCOUNTS"));
    expect(list.items.map((i) => [i.applicationId, i.programmeName, i.refundPaise])).toEqual([[waiting.id, "ZZ P1B BA", 1_000_000]]);
    expect((await refundsAwaiting(await as("admin", "ADMIN"))).items).toHaveLength(1);
    await expect(refundsAwaiting(await as("principal", "PRINCIPAL"))).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await as("principal", "PRINCIPAL");
    expect((await awaitingGet()).status).toBe(403);
  });
});

describe("R-52: a rotated claim code", () => {
  it("claims nothing with the old code once the office gives a new one; the new one still needs the birthdate", async () => {
    const before = "STU-ZZP1-" + String(STAMP).slice(-4);
    await db.membership.update({ where: { id: ids["boarder:STUDENT"]! }, data: { studentCode: before } });
    await expect(rotateClaimCode(await as("principal", "PRINCIPAL"), ids["boarder:STUDENT"]!)).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const rotated = await rotateClaimCode(await as("admin", "ADMIN"), ids["boarder:STUDENT"]!);
    expect(rotated.studentCode).not.toBe(before);
    expect(rotated.studentCode).toMatch(/^STU-/);
    expect(await db.auditLog.count({ where: { schoolId: ids.college!, action: "idcard.claimCode.rotate", targetId: ids["boarder:STUDENT"] } })).toBe(1);
    __resetCookies();
    __setHeaders({ "x-forwarded-for": `10.9.${STAMP % 250}.7` });
    await createSession(ids.guardian!, { schoolId: null, role: null });
    const guardian = (await getSession())!;
    const old = await claimChildFor(guardian, { studentCode: before, birthdate: "2005-03-04", relation: "PARENT" }, t);
    expect(old.ok).toBe(false);
    expect(await db.guardianship.count({ where: { parentUserId: ids.guardian } })).toBe(0);
    const wrongDay = await claimChildFor(guardian, { studentCode: rotated.studentCode, birthdate: "2005-03-05", relation: "PARENT" }, t);
    expect(wrongDay.ok).toBe(false);
    // The new code with the birthdate claims the student: the code moved, the rule did not.
    const fresh = await claimChildFor(guardian, { studentCode: rotated.studentCode, birthdate: "2005-03-04", relation: "PARENT" }, t);
    expect(fresh, JSON.stringify(old)).toMatchObject({ ok: true });
  });
});

describe("R-53 and R-59: moots of a filed year are frozen, and each says who may correct it", () => {
  it("refuses a moot of a year whose BCI return is generated, and reads canEdit per moot", async () => {
    const author = await as("author", "FACULTY");
    const lastYear = academicYearOf(TODAY) - 1;
    const open = await saveMootCourt(author, { name: "ZZ P1B Moot now", at: TODAY, kind: "INTRA", teams: [], result: "", judgeNotes: "" });
    const old = await saveMootCourt(author, { name: "ZZ P1B Moot last year", at: `${lastYear}-12-10`, kind: "INTRA", teams: [], result: "", judgeNotes: "" });
    await db.collegeFiling.create({ data: { schoolId: ids.college!, kind: "BCI_RETURN", year: lastYear, format: "PDF", body: "{}", hash: "zz" } });
    await expect(saveMootCourt(author, { id: old.id, name: "ZZ P1B Moot corrected", at: `${lastYear}-12-10`, kind: "INTRA", teams: [], result: "", judgeNotes: "" })).rejects.toMatchObject({ key: "riskDecisions.refuseMootFiled", status: 409 });
    await expect(saveMootCourt(await as("admin", "ADMIN"), { name: "ZZ P1B Moot added late", at: `${lastYear}-11-02`, kind: "INTER", teams: [], result: "", judgeNotes: "" })).rejects.toMatchObject({ key: "riskDecisions.refuseMootFiled" });
    // Moving an open moot into the filed year is refused too.
    await expect(saveMootCourt(author, { id: open.id, name: "ZZ P1B Moot now", at: `${lastYear}-12-11`, kind: "INTRA", teams: [], result: "", judgeNotes: "" })).rejects.toMatchObject({ key: "riskDecisions.refuseMootFiled" });
    expect((await saveMootCourt(author, { id: open.id, name: "ZZ P1B Moot renamed", at: TODAY, kind: "INTRA", teams: [], result: "", judgeNotes: "" })).id).toBe(open.id);
    const byAuthor = new Map((await mootCourts(author)).items.map((m) => [m.id, [m.canEdit, m.frozen]]));
    expect(byAuthor.get(open.id)).toEqual([true, false]);
    expect(byAuthor.get(old.id)).toEqual([false, true]);
    const byOther = new Map((await mootCourts(await as("other", "FACULTY"))).items.map((m) => [m.id, m.canEdit]));
    expect(byOther.get(open.id)).toBe(false);
    const byOffice = new Map((await mootCourts(await as("admin", "ADMIN"))).items.map((m) => [m.id, m.canEdit]));
    expect(byOffice.get(open.id)).toBe(true);
    expect((await mootCourts(await as("principal", "PRINCIPAL"))).items.every((m) => m.canEdit === false)).toBe(true);
  });
});

describe("R-24: the day a lab batch change takes effect", () => {
  it("is from the start with nothing marked; after a marked batch lab, today or the day after the last marked one", async () => {
    expect(dayAfterMarked(null, "2026-10-05")).toBe("");
    expect(dayAfterMarked("2026-10-01", "2026-10-05")).toBe("2026-10-05");
    expect(dayAfterMarked("2026-10-05", "2026-10-05")).toBe("2026-10-06");

    const klass = await db.class.create({ data: { schoolId: ids.college!, name: "ZZ P1B FY BTech", gradeLevel: "1", subject: "BTECH", joinCode: classCode() }, select: { id: true } });
    const dept = await db.department.create({ data: { schoolId: ids.college!, code: `ZQ${String(STAMP).slice(-4)}`, name: "ZZ P1B Mech" }, select: { id: true } });
    const btech = await db.programme.create({ data: { schoolId: ids.college!, departmentId: dept.id, code: "ZZP1BBT", name: "ZZ P1B BTech", level: "UG", durationYears: 4, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: ids.college!, programmeId: btech.id, name: "ZZ scheme", effectiveYear: 2025 }, select: { id: true } });
    const division = await db.division.create({ data: { schoolId: ids.college!, classId: klass.id, programmeId: btech.id, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } });
    for (const who of ["boarder", "boarder2"]) {
      await db.studentProgramme.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}:STUDENT`]!, programmeId: btech.id, schemeId: scheme.id, entryYear: 2026, divisionId: division.id } });
    }
    const admin = await as("admin", "ADMIN");
    const fresh = await splitLabBatches(admin, { divisionId: division.id, size: 1 });
    expect(fresh.effectiveFrom).toBeNull();
    expect(fresh.divisions.find((d) => d.divisionId === division.id)?.changesFrom).toBeNull();

    // A batch lab of the division marked today: a change now applies from tomorrow.
    const course = await db.course.create({ data: { schoolId: ids.college!, schemeId: scheme.id, code: "ZZP1B101", name: "ZZ Workshop", semester: 1, creditsP: 2 }, select: { id: true } });
    const term = await db.academicTerm.create({ data: { schoolId: ids.college!, name: "ZZ P1B term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -30), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -40), registrationClosesOn: addDaysToKey(TODAY, -35) }, select: { id: true } });
    const offering = await db.courseOffering.create({ data: { schoolId: ids.college!, termId: term.id, courseId: course.id, divisionId: division.id }, select: { id: true } });
    const batch = await db.labBatch.findFirstOrThrow({ where: { divisionId: division.id, name: "A" }, select: { id: true } });
    const lecture = await db.lecture.create({ data: { schoolId: ids.college!, offeringId: offering.id, dateKey: TODAY, startMinute: 540, endMinute: 600, kind: "LAB", labBatchId: batch.id }, select: { id: true } });
    await db.lectureAttendance.create({ data: { schoolId: ids.college!, lectureId: lecture.id, studentMembershipId: ids["boarder:STUDENT"]!, status: "PRESENT", markedByMembershipId: ids["author:FACULTY"]! } });
    const tomorrow = addDaysToKey(TODAY, 1);
    expect((await labBatches(admin, { divisionId: division.id })).divisions[0]?.changesFrom).toBe(tomorrow);
    // The lab in-charge's desk (GET /api/v1/duties/lab, the phone's lab screen) carries the same day.
    expect((await labDesk(admin)).divisions.find((d) => d.divisionId === division.id)?.changesFrom).toBe(tomorrow);
    expect((await splitLabBatches(admin, { divisionId: division.id, size: 2 })).effectiveFrom).toBe(tomorrow);
  });
});
