/**
 * The IQAC's filings and its cycle: three findings of the testing analysis of 13 November 2026 in
 * lib/iqac-filings.ts and lib/iqac.ts.
 *
 *   TA-272  The AICTE mandatory disclosure counted and published every programme of the college, the
 *           BBA the stream itself places under the UGC beside the AICTE MBA.
 *   TA-265  A disclosure published while the college ran management could not be taken down once the
 *           college was arts alone: the take-down answered 404 and the public page stayed.
 *   TA-307  Generating an NBA SAR and opening a cycle read the state and then wrote: two at once made
 *           two SARs for one department and year, or two OPEN cycles.
 *
 * Two scratch ZZ colleges of this suite's own (made through the owner connection, removed after): an
 * arts and management college with a UGC BBA and an AICTE MBA, and an engineering college with one
 * department.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { buildFiling, generateFilingAs, publishedDisclosure, setDisclosure } from "@/lib/iqac-filings";
import { openCycle } from "@/lib/iqac";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqd-${who}-${STAMP}@test.invalid`;
const ids = { mgmt: "", eng: "", mech: "", iqacM: "", iqacU: "", engIqacM: "", engIqacU: "" };
const SLUG = `zz-taiqd-mgmt-${STAMP}`;

function ctx(schoolId: string, userId: string, membershipId: string): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role: "IQAC" as ActiveContext["role"],
    user: { id: userId, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  ids.mgmt = (await db.school.create({ data: { name: `ZZ TA IQAC Mgmt ${STAMP}`, slug: SLUG, code: `ZTQM${TAIL}`, contactEmail: MAIL("mgmt"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true, streamsJson: JSON.stringify(["ARTS", "MANAGEMENT"]) }, select: { id: true } })).id;
  ids.eng = (await db.school.create({ data: { name: `ZZ TA IQAC Eng ${STAMP}`, slug: `zz-taiqd-eng-${STAMP}`, code: `ZTQE${TAIL}`, contactEmail: MAIL("eng"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true, streamsJson: JSON.stringify(["ENGINEERING"]) }, select: { id: true } })).id;
  for (const s of [ids.mgmt, ids.eng]) await db.schoolModule.createMany({ data: [{ schoolId: s, module: "ACADEMICS" }, { schoolId: s, module: "IQAC" }] });
  ids.iqacU = (await db.user.create({ data: { name: "ZZ TA Iqac Mgmt", email: MAIL("iqac"), prefs: "{}" }, select: { id: true } })).id;
  ids.iqacM = (await db.membership.create({ data: { userId: ids.iqacU, schoolId: ids.mgmt, role: "IQAC", status: "ACTIVE" }, select: { id: true } })).id;
  ids.engIqacU = (await db.user.create({ data: { name: "ZZ TA Iqac Eng", email: MAIL("engiqac"), prefs: "{}" }, select: { id: true } })).id;
  ids.engIqacM = (await db.membership.create({ data: { userId: ids.engIqacU, schoolId: ids.eng, role: "IQAC", status: "ACTIVE" }, select: { id: true } })).id;
  const dept = (await db.department.create({ data: { schoolId: ids.mgmt, code: "ZZMG", name: "ZZ Management" }, select: { id: true } })).id;
  await db.programme.create({ data: { schoolId: ids.mgmt, departmentId: dept, code: "ZZBBA", name: "ZZ Bachelor of Business Administration", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", stream: "MANAGEMENT" } });
  await db.programme.create({ data: { schoolId: ids.mgmt, departmentId: dept, code: "ZZMBA", name: "ZZ Master of Business Administration", level: "PG", durationYears: 2, intake: 30, regulator: "AICTE", stream: "MANAGEMENT" } });
  ids.mech = (await db.department.create({ data: { schoolId: ids.eng, code: "ZZME", name: "ZZ Mechanical" }, select: { id: true } })).id;
  await db.programme.create({ data: { schoolId: ids.eng, departmentId: ids.mech, code: "ZZBEME", name: "ZZ BE Mechanical", level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING" } });
}, 60_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [ids.mgmt, ids.eng] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-272: the AICTE disclosure is the AICTE programmes'", () => {
  it("TA-272: with a UGC BBA of 60 and an AICTE MBA of 30, the disclosure counts one programme and an intake of 30 and does not name the BBA", async () => {
    const built = await buildFiling(ids.mgmt, "AICTE_DISCLOSURE", 2026, null);
    expect(built.figures.programmes).toBe(1);
    expect(built.figures.intake).toBe(30);
    expect(built.body).not.toContain("Bachelor of Business Administration");
    expect(built.body).toContain("Master of Business Administration");
  }, 60_000);
});

describe("TA-265: taking the disclosure down after the streams change", () => {
  it("TA-265: published as arts and management, the page can be taken down once the college is arts alone", async () => {
    const c = ctx(ids.mgmt, ids.iqacU, ids.iqacM);
    await setDisclosure(c, true);
    expect(await publishedDisclosure(SLUG)).not.toBeNull();
    await db.school.update({ where: { id: ids.mgmt }, data: { streamsJson: JSON.stringify(["ARTS"]) } });
    await expect(setDisclosure(c, false)).resolves.toMatchObject({ publishedAt: null });
    expect(await publishedDisclosure(SLUG)).toBeNull();
    // Publishing again is still refused: the streams no longer bring the filing.
    await expect(setDisclosure(c, true)).rejects.toMatchObject({ key: "councilFilings.refuseNotApplicable" });
  }, 60_000);
});

describe("TA-307: one SAR, one open cycle", () => {
  it("TA-307: two generations of one department's SAR for one year at once leave one row", async () => {
    const desk = { schoolId: ids.eng, userId: ids.engIqacU, role: "IQAC" as const, membershipId: ids.engIqacM };
    await Promise.allSettled([generateFilingAs(desk, { kind: "NBA_SAR", year: 2025, cycleId: null, departmentId: ids.mech }), generateFilingAs(desk, { kind: "NBA_SAR", year: 2025, cycleId: null, departmentId: ids.mech })]);
    expect(await db.collegeFiling.count({ where: { schoolId: ids.eng, kind: "NBA_SAR", year: 2025, departmentId: ids.mech } })).toBe(1);
  }, 120_000);

  it("TA-307: two cycles opened at once leave one OPEN cycle and one refusal", async () => {
    const c = ctx(ids.eng, ids.engIqacU, ids.engIqacM);
    const both = await Promise.allSettled([openCycle(c, { windowFrom: "2021-06-01", windowTo: "2026-05-31" }), openCycle(c, { windowFrom: "2021-06-01", windowTo: "2026-05-31" })]);
    expect(await db.accreditationCycle.count({ where: { schoolId: ids.eng, status: "OPEN" } })).toBe(1);
    expect(both.filter((r) => r.status === "rejected")).toHaveLength(1);
  }, 120_000);
});
