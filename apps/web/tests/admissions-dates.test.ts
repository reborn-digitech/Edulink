/**
 * THE DATES AND FIGURES AN ADMISSION TAKES (audit of 5 October 2026).
 *
 * A3-journeys-3: an offer whose answer-by day had passed was accepted and the
 * family told. A3-journeys-4: the answer-by day was stored at 23:59:59.999
 * UTC, so a Kolkata reader saw the next day and the offer stayed open until
 * 05:29 the morning after. A3-journeys-5: a date of birth in 2030 for grade 3
 * went onto the roll and a certificate; a college applicant's likewise.
 * A3-journeys-40: admit() put the child into a class of any grade.
 * A3-journeys-24: the entrance-test score took "-40" and "abc; excellent!!",
 * and a result was recorded a fortnight before its sitting.
 *
 * Through the /api/v1 handlers as the office and a guardian, at a ZZ school of
 * this suite's own in Asia/Kolkata.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "./stubs/next-headers";
import { POST as walkInPost } from "@/app/api/v1/office/admissions/applications/route";
import { POST as testPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/test/route";
import { POST as offerPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/offer/route";
import { POST as admitPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/admit/route";
import { POST as applyPost } from "@/app/api/v1/family/applications/route";
import { parseTestScore } from "@/lib/admissions";
import { gradeAgeBand, schoolBirthdateProblem, collegeBirthdateProblem } from "@/lib/birthdate-rules";
import { addDaysToKey, formatDate, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
let schoolId = "";
let cycleId = "";
let class3 = "";
let class5 = "";
let adminUserId = "";
let parentUserId = "";

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "PARENT") {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  else await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}
/** A walk-in application by the office, for grade 3 unless told otherwise. */
async function walkIn(name: string, childBirthdate: string | null, gradeApplied = "3"): Promise<Response> {
  await as("ADMIN");
  return walkInPost(json("/api/v1/office/admissions/applications", { cycleId, childName: `ZZ AdmDates ${STAMP} ${name}`, childBirthdate, gradeApplied, applicantName: `ZZ AdmDates Family ${name}` }));
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ AdmDates ${STAMP}`, slug: `zz-admdates-${STAMP}`, code: `ZD${SUFFIX}`, contactEmail: `zz-admdates-${STAMP}@test.invalid`, timezone: TZ, locale: "en", profilePublishedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  adminUserId = (await db.user.create({ data: { name: "ZZ AdmDates Admin", email: `zz-admdates-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  parentUserId = (await db.user.create({ data: { name: "ZZ AdmDates Parent", email: `zz-admdates-parent-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  class3 = (await db.class.create({ data: { schoolId, name: "ZZ 3A", gradeLevel: "3", joinCode: `ZD3${SUFFIX}` }, select: { id: true } })).id;
  class5 = (await db.class.create({ data: { schoolId, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZD5${SUFFIX}` }, select: { id: true } })).id;
  cycleId = (await db.admissionCycle.create({ data: { schoolId, academicYearId: yearId, name: "ZZ Admissions 2026–27", gradesJson: JSON.stringify([{ grade: "3", seats: 5 }, { grade: "5", seats: 5 }]), testRequired: true, status: "OPEN" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { name: { startsWith: `ZZ AdmDates ${STAMP}` } } });
  await db.$disconnect();
});

describe("the answer-by day (A3-journeys-3 and -4)", () => {
  it("a day already gone is refused with a sentence and tells nobody; today and later are taken and close at the end of that day in the school's zone, printed as the day typed", async () => {
    const id = (await (await walkIn("Offer", "2018-03-03")).json()).id as string;
    await as("ADMIN");
    const yesterday = addDaysToKey(TODAY, -1);
    let res = await offerPost(json(`/api/v1/office/admissions/applications/${id}/offer`, { expiresOn: yesterday }), params({ applicationId: id }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("The answer-by date has passed. Choose today or a later day.");
    expect((await db.application.findUniqueOrThrow({ where: { id }, select: { status: true } })).status).toBe("SUBMITTED");

    const day = addDaysToKey(TODAY, 15);
    res = await offerPost(json(`/api/v1/office/admissions/applications/${id}/offer`, { expiresOn: day }), params({ applicationId: id }));
    expect(res.status).toBe(200);
    const stored = (await db.application.findUniqueOrThrow({ where: { id }, select: { offerExpiresAt: true } })).offerExpiresAt!;
    // The last millisecond before midnight IST: 18:29:59.999 UTC on the day itself.
    expect(stored.toISOString()).toBe(`${day}T18:29:59.999Z`);
    const [y, m, d] = day.split("-");
    expect(formatDate(stored, TZ)).toBe(`${d}/${m}/${y}`);
    expect(formatDate(new Date(stored.getTime() + 1), TZ)).not.toBe(`${d}/${m}/${y}`);

    // Today itself is a day the family still has.
    const id2 = (await (await walkIn("Today", "2018-03-03")).json()).id as string;
    await as("ADMIN");
    expect((await offerPost(json(`/api/v1/office/admissions/applications/${id2}/offer`, { expiresOn: TODAY }), params({ applicationId: id2 }))).status).toBe(200);
  }, 30_000);
});

describe("the date of birth (A3-journeys-5) and the class's grade (A3-journeys-40)", () => {
  it("a date in the future is refused from the family and the office; one outside the grade's ages is refused with the ages; one inside is taken", async () => {
    let res = await walkIn("Future", "2030-12-12");
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("The date of birth is in the future.");
    await as("PARENT");
    res = await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ AdmDates ${STAMP} Fam`, childBirthdate: "2030-12-12", gradeApplied: "3" }));
    expect(res.status).toBe(403);
    // Grade 3 takes 6 to 11 at 1 June 2026: a child born in 2010 is 16, one born in 2024 is 2.
    res = await walkIn("Old", "2010-01-01");
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("That date of birth does not fit grade 3: a child in it is 6 to 11 years old at the start of the year. Check the date or the grade.");
    expect((await walkIn("Young", "2024-01-01")).status).toBe(403);
    expect((await walkIn("Fits", "2019-04-12")).status).toBe(201);
    expect((await walkIn("NoDate", null)).status).toBe(201);
  }, 30_000);

  it("admit refuses a class of another grade, and a future date of birth already on a row, and takes the right class", async () => {
    const id = (await (await walkIn("Admit", "2019-05-05")).json()).id as string;
    await db.application.update({ where: { id }, data: { status: "ACCEPTED" } });
    await as("ADMIN");
    let res = await admitPost(json(`/api/v1/office/admissions/applications/${id}/admit`, { classId: class5 }), params({ applicationId: id }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("That class is not in grade 3, the grade applied for. Choose a class of that grade.");
    expect((await db.application.findUniqueOrThrow({ where: { id }, select: { status: true } })).status).toBe("ACCEPTED");

    // A date written before the rule is not carried onto the roll.
    await db.application.update({ where: { id }, data: { childBirthdate: new Date("2030-12-12T00:00:00Z") } });
    res = await admitPost(json(`/api/v1/office/admissions/applications/${id}/admit`, { classId: class3 }), params({ applicationId: id }));
    expect(res.status).toBe(403);
    await db.application.update({ where: { id }, data: { childBirthdate: new Date("2019-05-05T00:00:00Z") } });
    res = await admitPost(json(`/api/v1/office/admissions/applications/${id}/admit`, { classId: class3 }), params({ applicationId: id }));
    expect(res.status).toBe(200);
    expect((await res.json()).className).toBe("ZZ 3A");
  }, 30_000);

  it("the rules by hand: grade bands on the ladder, a college's floor of fourteen", () => {
    expect(gradeAgeBand("1")).toEqual({ min: 4, max: 9 });
    expect(gradeAgeBand("10")).toEqual({ min: 13, max: 18 });
    expect(gradeAgeBand("UKG")).toEqual({ min: 3, max: 8 });
    expect(gradeAgeBand("Nursery")).toEqual({ min: 1, max: 6 });
    expect(gradeAgeBand("Rainbow room")).toBeNull();
    const june = new Date("2026-06-01T00:00:00Z");
    const now = new Date("2026-10-05T06:00:00Z");
    expect(schoolBirthdateProblem(new Date("2026-10-06T00:00:00Z"), "Rainbow room", june, now)).toEqual({ kind: "future" });
    expect(schoolBirthdateProblem(new Date("2026-10-05T00:00:00Z"), "Rainbow room", june, now)).toBeNull();
    expect(collegeBirthdateProblem(new Date("2013-01-01T00:00:00Z"), now)).toEqual({ kind: "tooYoung", min: 14 });
    expect(collegeBirthdateProblem(new Date("1980-01-01T00:00:00Z"), now)).toBeNull();
  }, 30_000);
});

describe("the entrance-test result (A3-journeys-24)", () => {
  it("the score is a number from 0 to 100 or marks out of a total; words are refused and belong in the note", () => {
    for (const bad of ["-40", "abc; excellent!!", "101", "51/50", "3/0", "78; excellent", "1e2"]) expect(parseTestScore(bad)).toEqual({ ok: false });
    expect(parseTestScore("78")).toEqual({ ok: true, score: "78" });
    expect(parseTestScore("78.5")).toEqual({ ok: true, score: "78.5" });
    expect(parseTestScore(" 38 / 50 ")).toEqual({ ok: true, score: "38/50" });
    expect(parseTestScore("")).toEqual({ ok: true, score: null });
    expect(parseTestScore(null)).toEqual({ ok: true, score: null });
  }, 30_000);

  it("through the door: bad scores refused, a result before its sitting refused with the sitting's day, after it taken with its note", async () => {
    const id = (await (await walkIn("Test", "2019-06-06")).json()).id as string;
    await as("ADMIN");
    for (const score of ["-40", "abc; excellent!!"]) {
      const res = await testPost(json(`/api/v1/office/admissions/applications/${id}/test`, { score }), params({ applicationId: id }));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Write the score as a number from 0 to 100, or as marks out of a total such as 38/50; put any words in the note.");
    }
    const sittingDay = addDaysToKey(TODAY, 14);
    const ahead = await db.entranceSlot.create({ data: { schoolId, cycleId, startsAt: new Date(`${sittingDay}T04:30:00Z`), endsAt: new Date(`${sittingDay}T05:30:00Z`), capacity: 5 }, select: { id: true } });
    await db.application.update({ where: { id }, data: { testSlotId: ahead.id } });
    let res = await testPost(json(`/api/v1/office/admissions/applications/${id}/test`, { score: "78/100" }), params({ applicationId: id }));
    expect(res.status).toBe(403);
    const [y, m, d] = sittingDay.split("-");
    expect((await res.json()).error).toBe(`The sitting is on ${d}/${m}/${y}; record the result on or after that day.`);
    expect((await db.application.findUniqueOrThrow({ where: { id }, select: { testedAt: true } })).testedAt).toBeNull();

    const past = await db.entranceSlot.create({ data: { schoolId, cycleId, startsAt: new Date(Date.now() - 3 * 86_400_000), endsAt: new Date(Date.now() - 3 * 86_400_000 + 3_600_000), capacity: 5 }, select: { id: true } });
    await db.application.update({ where: { id }, data: { testSlotId: past.id } });
    res = await testPost(json(`/api/v1/office/admissions/applications/${id}/test`, { score: "78/100", note: "Excellent!!" }), params({ applicationId: id }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ testScore: "78/100", testNote: "Excellent!!" });
  }, 30_000);
});
