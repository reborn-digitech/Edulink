/**
 * The owner's decision on TA-469 and TA-495 of the testing analysis of 13 November 2026 (option 1, 14 November 2026):
 * the engineering internship rule (after semesters 2, 4 and 6, at most 20 credits) holds only for a programme whose
 * stored regulator is AICTE; under any other regulator an internship may follow any semester of the programme and
 * the only ceiling is the programme's total credits; the request format takes the other semesters; the staff and the
 * student read the rule that applies.
 *
 *   TA-469  an ICAR programme's (agriculture) internships were held to AICTE's windows and its 20 credits
 *   TA-495  a B.Voc (UGC) student's likewise, and window 3 was refused by the request format itself
 *
 * A scratch ZZ college of this suite's own with three programmes (AICTE B.Tech, ICAR B.Sc. Agriculture, UGC B.Voc)
 * and a student with no seat; removed after. The doors run with primed sessions, as tests/placement.test.ts's do.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { internshipRuleFor } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as proposePost } from "@/app/api/v1/student/internships/route";
import { POST as evaluatePost } from "@/app/api/v1/placement/internships/[internshipId]/evaluate/route";
import { GET as listGet } from "@/app/api/v1/placement/internships/route";
import { GET as myPlacementGet } from "@/app/api/v1/student/placement/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta469-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

const json = (body: unknown) => new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = (internshipId: string) => ({ params: Promise.resolve({ internshipId }) });
type Who = "TPO" | "AICTE" | "ICAR" | "VOC" | "NOSEAT";
async function as(who: Who) {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[`${who}User`]!, { schoolId: ids.school!, role: (who === "TPO" ? "TPO" : "STUDENT") as never });
}
const propose = (windowSemester: number) => proposePost(json({ companyName: "ZZ TA469 Co", kind: "INDUSTRY", from: "2026-05-01", to: "2026-06-30", hours: 300, windowSemester, supervisorName: "ZZ Sup" }));
const rules = (totalCredits: number) => JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits, internalMax: 40, externalMax: 60, minTermCredits: 16, maxTermCredits: 26 });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA469 College ${STAMP}`, slug: `zz-ta469-${STAMP}`, code: `ZT${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["PLACEMENT", "ACADEMICS"].map((module) => ({ schoolId: ids.school!, module })) });
  const dept = await db.department.create({ data: { schoolId: ids.school!, code: `ZTD${SUFFIX}`, name: "ZZ TA469 dept" }, select: { id: true } });
  const programme = async (key: string, regulator: string, stream: string, years: number, totalCredits: number) => {
    const p = await db.programme.create({ data: { schoolId: ids.school!, departmentId: dept.id, code: `ZT${key}${SUFFIX}`, name: `ZZ TA469 ${key}`, level: "UG", durationYears: years, regulator, stream }, select: { id: true } });
    const s = await db.scheme.create({ data: { schoolId: ids.school!, programmeId: p.id, name: `ZZ TA469 ${key} scheme`, effectiveYear: 2023, passingRules: rules(totalCredits) }, select: { id: true } });
    return { programmeId: p.id, schemeId: s.id };
  };
  const seat = { AICTE: await programme("BT", "AICTE", "ENGINEERING", 4, 160), ICAR: await programme("AG", "ICAR", "AGRICULTURE", 4, 160), VOC: await programme("BV", "UGC", "VOCATIONAL", 3, 180) };
  for (const who of ["TPO", "AICTE", "ICAR", "VOC", "NOSEAT"] as const) {
    const u = await db.user.create({ data: { name: `ZZ TA469 ${who}`, email: MAIL(who) }, select: { id: true } });
    ids[`${who}User`] = u.id;
    ids[who] = (await db.membership.create({ data: { userId: u.id, schoolId: ids.school!, role: who === "TPO" ? "TPO" : "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
    if (who === "AICTE" || who === "ICAR" || who === "VOC") await db.studentProgramme.create({ data: { schoolId: ids.school!, studentMembershipId: ids[who]!, ...seat[who], entryYear: 2023 } });
  }
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: ids.school! } });
  await db.school.deleteMany({ where: { id: ids.school! } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/** An internship ready to be credited (report in, graded, ended), and its earlier credited ones, written by hand. */
async function readyToCredit(who: Who, creditedBefore: number[]): Promise<string> {
  for (const credits of creditedBefore) await db.internship.create({ data: { schoolId: ids.school!, studentMembershipId: ids[who]!, companyName: "ZZ TA469 Old", kind: "INDUSTRY", fromKey: "2025-05-01", toKey: "2025-06-30", hours: 300, windowSemester: 2, supervisorName: "ZZ", status: "CREDITED", credits, creditedAt: new Date("2025-07-01T00:00:00Z") } });
  return (await db.internship.create({ data: { schoolId: ids.school!, studentMembershipId: ids[who]!, companyName: "ZZ TA469 Now", kind: "INDUSTRY", fromKey: "2026-01-01", toKey: "2026-01-31", hours: 300, windowSemester: 3, supervisorName: "ZZ", status: "EVALUATED", reportFileId: `zz-ta469-report-${who}-${STAMP}.pdf`, industryGrade: "A", vivaMarks: 40 }, select: { id: true } })).id;
}

describe("TA-469: an ICAR programme is not held to AICTE's windows", () => {
  it("TA-469: an ICAR student proposes after semester 8 (the final year) and is refused only past the programme's last semester; an AICTE programme and a student with no seat keep 2, 4 and 6", async () => {
    await as("ICAR");
    const final = await propose(8);
    expect(final.status).toBe(200);
    expect(await final.json()).toMatchObject({ windowSemester: 8, rule: "SCHEME", creditsMax: 160 });
    const past = await propose(9);
    expect(past.status).toBe(422);
    expect(((await past.json()) as { error: string }).error).toBe("An internship follows a semester of your programme: 1 to 8.");
    await as("AICTE");
    const aicte = await propose(8);
    expect(aicte.status).toBe(422);
    expect(((await aicte.json()) as { error: string }).error).toBe("Internships are in the windows after semesters 2, 4 and 6.");
    expect((await propose(4)).status).toBe(200);
    await as("NOSEAT");
    expect((await propose(8)).status).toBe(422);
  });
});

describe("TA-495: a B.Voc (UGC) programme is not held to AICTE's windows", () => {
  it("TA-495: the request format takes semester 3 and the B.Voc student's proposal stands; past semester 6 of a three-year programme is refused", async () => {
    await as("VOC");
    const third = await propose(3);
    expect(third.status).toBe(200);
    expect(await third.json()).toMatchObject({ windowSemester: 3, rule: "SCHEME", creditsMax: 180 });
    expect((await propose(7)).status).toBe(422);
  });
});

describe("TA-469 and TA-495: the credits stop at the programme's total, AICTE's at 20", () => {
  it("TA-469: an ICAR student's credits pass 20 and stop at the scheme's 160; an AICTE student's stop at 20", async () => {
    const icar = await readyToCredit("ICAR", [18]);
    await as("TPO");
    const passed = await evaluatePost(json({ credits: 6 }), params(icar));
    expect(passed.status).toBe(200);
    expect(await passed.json()).toMatchObject({ status: "CREDITED", credits: 6 });
    const more = await readyToCredit("ICAR", [134]);
    await as("TPO");
    const over = await evaluatePost(json({ credits: 4 }), params(more));
    expect(over.status).toBe(409);
    expect(((await over.json()) as { error: string }).error).toBe("That would pass the programme's 160 credits in all; 158 are credited already.");
    expect((await evaluatePost(json({ credits: 2 }), params(more))).status).toBe(200);
    const aicte = await readyToCredit("AICTE", [18]);
    await as("TPO");
    const aicteOver = await evaluatePost(json({ credits: 4 }), params(aicte));
    expect(aicteOver.status).toBe(409);
    expect(((await aicteOver.json()) as { error: string }).error).toBe("That would pass the policy's 20 credits; 18 are credited already.");
  });

  it("TA-495: one internship of a B.Voc student may carry more than 20 credits (a semester's on-the-job training)", async () => {
    const voc = await readyToCredit("VOC", []);
    await as("TPO");
    const res = await evaluatePost(json({ credits: 24 }), params(voc));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "CREDITED", credits: 24 });
  });
});

describe("TA-469 and TA-495: the staff and the student read the rule that applies", () => {
  it("TA-469: the staff list names both rules at a college with AICTE and other programmes, and each internship's own rule and ceiling", async () => {
    await as("TPO");
    const list = (await (await listGet()).json()) as { ruleKinds: string[]; internships: { studentMembershipId: string; rule: string; creditsMax: number }[] };
    expect(list.ruleKinds).toEqual(["AICTE", "SCHEME"]);
    const of = (who: Who) => list.internships.find((i) => i.studentMembershipId === ids[who]);
    expect(of("ICAR")).toMatchObject({ rule: "SCHEME", creditsMax: 160 });
    expect(of("VOC")).toMatchObject({ rule: "SCHEME", creditsMax: 180 });
    expect(of("AICTE")).toMatchObject({ rule: "AICTE", creditsMax: 20 });
  });

  it("TA-495: the student's own page carries their programme's rule (the windows the form offers), and a student with no seat AICTE's", async () => {
    await as("VOC");
    expect(((await (await myPlacementGet()).json()) as { internshipRule: unknown }).internshipRule).toEqual({ kind: "SCHEME", windows: [1, 2, 3, 4, 5, 6], creditsMax: 180 });
    await as("NOSEAT");
    expect(((await (await myPlacementGet()).json()) as { internshipRule: unknown }).internshipRule).toEqual({ kind: "AICTE", windows: [2, 4, 6], creditsMax: 20 });
    expect(internshipRuleFor({ regulator: "BCI", durationYears: 5, totalCredits: 200 })).toEqual({ kind: "SCHEME", windows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], creditsMax: 200 });
  });
});
