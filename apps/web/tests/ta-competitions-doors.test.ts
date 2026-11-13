/**
 * Competitions, the doors (testing analysis of 13 November 2026, the 'competitions' batch).
 *
 *   TA-322  A pupil without the STUDENT plan at a platform competition: the detail door turned the plan's refusal
 *           into a 404 (asNotFound) and the enrol door into a 422 (underRules), so the phone, which draws its
 *           plan card from a 402 PLAN_REQUIRED, showed an error. Decision 0007 says both answer 402.
 *   TA-426  A body that is not JSON to the enrol door threw out of JSON.parse into apiFailure: a 500 SERVER
 *           posted to the error tracker, where every other door answers 422.
 *
 * The handlers are invoked directly with a primed session, as tests/api-v1-shared.test.ts does. A ZZ school of its
 * own and one platform competition, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { GET as competitionGet } from "@/app/api/v1/shared/competitions/[competitionId]/route";
import { POST as enterPost } from "@/app/api/v1/shared/competitions/[competitionId]/enter/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ALL = [...PLATFORM_FEATURES];
const ids = { school: "", pupilU: "", pupil: "", parentU: "", platform: "", own: "" };

const post = (path: string, body: string) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body });
const get = (path: string) => new Request(`http://localhost${path}`);
const p = (competitionId: string) => ({ params: Promise.resolve({ competitionId }) });
async function as(userId: string, opts: { schoolId?: string | null; role: "STUDENT" | "PARENT" }) {
  __resetCookies();
  await createSession(userId, opts);
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Comp Doors ${STAMP}`, slug: `zz-ta-comp-doors-${STAMP}`, code: `ZD${String(STAMP).slice(-6)}`, contactEmail: `zz-ta-comp-doors-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ TA Doors ${who}`, email: `zz-ta-comp-doors-${who}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
  ids.pupilU = (await mk("pupil")).id;
  ids.parentU = (await mk("parent")).id;
  ids.pupil = (await db.membership.create({ data: { userId: ids.pupilU, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZD${STAMP}`, gradeLevel: "7" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.parentU, schoolId: ids.school, role: "PARENT", status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.parentU, studentMembershipId: ids.pupil, studentSchoolId: ids.school, status: "ACTIVE" } });
  ids.platform = (await db.competition.create({ data: { organizerSchoolId: null, organizerName: "ZZ Olympiad Trust", title: `ZZ TA Doors platform ${STAMP}`, summary: "ZZ", status: "PUBLISHED", requiresParentConsent: false, enrolmentOpen: true }, select: { id: true } })).id;
  ids.own = (await db.competition.create({ data: { organizerSchoolId: ids.school, organizerName: "ZZ TA Doors", title: `ZZ TA Doors own ${STAMP}`, summary: "ZZ", status: "PUBLISHED", requiresParentConsent: true, enrolmentOpen: true }, select: { id: true } })).id;
}, 60_000);

afterEach(() => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
});

afterAll(async () => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
  await db.competitionEntry.deleteMany({ where: { competitionId: ids.platform, schoolId: ids.school } });
  await db.competition.deleteMany({ where: { id: ids.platform, organizerSchoolId: null } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: [ids.pupilU, ids.parentU] } } });
  await db.$disconnect();
}, 60_000);

describe("TA-322: the plan's refusal at the two competition doors", () => {
  it("TA-322: a pupil without the STUDENT plan is answered 402 PLAN_REQUIRED by the detail door and the enrol door", async () => {
    setFeaturesForTests(ALL);
    setActivePlansForTests(["STUDENT"]);
    await as(ids.pupilU, { schoolId: ids.school, role: "STUDENT" });
    const detail = await competitionGet(get(`/api/v1/shared/competitions/${ids.platform}`), p(ids.platform));
    expect(detail.status).toBe(402);
    expect(await detail.json()).toMatchObject({ code: "PLAN_REQUIRED", plan: "STUDENT", feature: "COMPETITIONS" });
    const enter = await enterPost(post(`/api/v1/shared/competitions/${ids.platform}/enter`, ""), p(ids.platform));
    expect(enter.status).toBe(402);
    expect(await enter.json()).toMatchObject({ code: "PLAN_REQUIRED", plan: "STUDENT", feature: "COMPETITIONS" });
  });

  it("TA-322: a guardian enrolling a child without the plan is answered 402 too; the school's own competition is never behind it", async () => {
    setFeaturesForTests(ALL);
    setActivePlansForTests(["STUDENT"]);
    await as(ids.parentU, { role: "PARENT" });
    const enter = await enterPost(post(`/api/v1/shared/competitions/${ids.platform}/enter`, JSON.stringify({ studentMembershipId: ids.pupil })), p(ids.platform));
    expect(enter.status).toBe(402);
    expect(await enter.json()).toMatchObject({ code: "PLAN_REQUIRED", plan: "STUDENT" });
    await as(ids.pupilU, { schoolId: ids.school, role: "STUDENT" });
    expect((await competitionGet(get(`/api/v1/shared/competitions/${ids.own}`), p(ids.own))).status).toBe(200);
    // An id that names nothing is still a 404.
    expect((await competitionGet(get(`/api/v1/shared/competitions/cmzzmissing00000000000000`), p("cmzzmissing00000000000000"))).status).toBe(404);
  });
});

describe("TA-426: a body that is not JSON at the enrol door", () => {
  it("TA-426: '{' is a 422 BAD_REQUEST, not a 500, and enrols nobody", async () => {
    await as(ids.pupilU, { schoolId: ids.school, role: "STUDENT" });
    const res = await enterPost(post(`/api/v1/shared/competitions/${ids.own}/enter`, "{"), p(ids.own));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("BAD_REQUEST");
    expect(await db.competitionEntry.count({ where: { competitionId: ids.own } })).toBe(0);
    // A good empty body still enrols.
    expect((await enterPost(post(`/api/v1/shared/competitions/${ids.own}/enter`, ""), p(ids.own))).status).toBe(200);
  });
});
