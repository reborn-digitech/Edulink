/**
 * A NAAC cycle's window, and every day the IQAC contract takes: TA-071 of the testing analysis of
 * 13 November 2026.
 *
 *   TA-071  The contract took any YYYY-MM-DD, so "2031-13-01" passed; Date.parse gave NaN, NaN is not
 *           above the five-year cap, and the cycle was stored OPEN with a window the predictor then
 *           gathered facts over, year by year, on every read. The same pattern let a faculty record's
 *           joining date be a day that does not exist.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after) with
 * the IQAC on and an IQAC coordinator; the door is called with a primed session, the library with a
 * context of its own.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { activitySaveSchema, committeeMeetingSaveSchema, facultyRecordSaveSchema, iqacCycleCreateSchema, surveySaveSchema } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { openCycle } from "@/lib/iqac";
import { gatherFacts } from "@/lib/iqac-facts";
import { POST as cyclesPost } from "@/app/api/v1/iqac/cycles/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqw-${who}-${STAMP}@test.invalid`;
const ids = { school: "", iqac: "", iqacM: "" };

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function ctx(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: ids.iqacM,
    schoolId: ids.school,
    role: "IQAC" as ActiveContext["role"],
    user: { id: ids.iqac, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA IQAC Window ${STAMP}`, slug: `zz-taiqw-${STAMP}`, code: `ZTQW${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.iqac = (await db.user.create({ data: { name: "ZZ TA Iqac Window", email: MAIL("iqac"), prefs: "{}" }, select: { id: true } })).id;
  ids.iqacM = (await db.membership.create({ data: { userId: ids.iqac, schoolId: ids.school, role: "IQAC", status: "ACTIVE" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: ids.iqac } });
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-071: a day that does not exist", () => {
  it("TA-071: the contract refuses 2026-02-31 and 2026-13-01 for the cycle window, a survey's dates, an activity, a meeting and a joining date", () => {
    for (const bad of ["2026-02-31", "2026-13-01"]) {
      expect(iqacCycleCreateSchema.safeParse({ windowFrom: "2026-06-01", windowTo: bad }).success, bad).toBe(false);
      expect(surveySaveSchema.safeParse({ kind: "SSS", title: "ZZ survey", opensOn: "2026-06-01", closesOn: bad }).success, bad).toBe(false);
      expect(activitySaveSchema.safeParse({ kind: "FDP", title: "ZZ activity", at: bad }).success, bad).toBe(false);
      expect(committeeMeetingSaveSchema.safeParse({ at: bad }).success, bad).toBe(false);
      expect(facultyRecordSaveSchema.safeParse({ membershipId: "m1", designation: "PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", joinedOn: bad }).success, bad).toBe(false);
    }
    // A real leap day still passes.
    expect(iqacCycleCreateSchema.safeParse({ windowFrom: "2026-06-01", windowTo: "2028-02-29" }).success).toBe(true);
  });

  it("TA-071: POST /api/v1/iqac/cycles with windowTo 2031-13-01 answers 422 on windowTo and stores no cycle", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.iqac, { schoolId: ids.school, role: "IQAC" as never });
    const res = await cyclesPost(json("/api/v1/iqac/cycles", { windowFrom: "2026-06-01", windowTo: "2031-13-01" }));
    expect(res.status).toBe(422);
    expect(JSON.stringify(await res.json())).toContain("windowTo");
    expect(await db.accreditationCycle.count({ where: { schoolId: ids.school } })).toBe(0);
  }, 60_000);

  it("TA-071: the library refuses a window whose day count is not a number, whatever the caller checked", async () => {
    await expect(openCycle(ctx(), { windowFrom: "2026-06-01", windowTo: "2031-13-01" })).rejects.toMatchObject({ key: "iqac.refuseWindow" });
    expect(await db.accreditationCycle.count({ where: { schoolId: ids.school } })).toBe(0);
  }, 60_000);

  it("TA-071: gathering facts over a stored window of twenty years reads at most six academic years", async () => {
    const g = await gatherFacts(ids.school, "2001-06-01", "2021-05-31", {});
    expect(g.facts.windowYears).toBeLessThanOrEqual(6);
  }, 120_000);
});
