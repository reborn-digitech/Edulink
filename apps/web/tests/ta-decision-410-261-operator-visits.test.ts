/**
 * The owner's decision on TA-410 of the testing analysis of 13 November 2026 (taken 14 November 2026, "Yes, say
 * so"): the operator's access to a school stays always on, and every word about it is made true. This file holds
 * the part a database proves: what a visit row says of itself.
 *
 * Before, a visit was written with the fixed English words "Operator access" and every reader printed them as the
 * operator's reason, in Hindi and Marathi schools too; opening the list of colleges wrote the same row as looking
 * inside one; and four of the operator's read codes had no words in the school's trail.
 *
 * One stamped ZZ college of this suite's own, with an operator and an admin; all of it is deleted in afterAll and
 * nothing outside it is read or written.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { adminSafetySchema, operatorSchoolDetailSchema, operatorVisitKindSchema } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { accessHistory, withSchoolAccess } from "@/lib/superuser";
import { listColleges } from "@/lib/operator-college";
import { schoolOverview } from "@/lib/operator-oversight";
import { adminSafety } from "@/lib/api-reads/admin";
import { operatorSchoolDetail } from "@/lib/api-reads/operator-school";
import { actionKey } from "@/lib/safety-labels";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", operator: "", admin: "", adminM: "" };

const PREFS = { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never;

function operator(): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: { id: ids.operator, name: "ZZ D410 Operator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: true, isAppAdmin: false, prefs: PREFS },
  };
}
function admin(): ActiveContext & { schoolId: string; membershipId: string } {
  return {
    sessionId: "test-session",
    membershipId: ids.adminM,
    schoolId: ids.school,
    role: "ADMIN" as never,
    user: { id: ids.admin, name: "ZZ D410 Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: PREFS },
  };
}

/** The visit rows of this suite's college, oldest first, as the database holds them. */
const rows = () => db.operatorAccess.findMany({ where: { schoolId: ids.school }, orderBy: { startedAt: "asc" }, select: { reason: true } });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ D410 College ${STAMP}`, slug: `zz-d410-${STAMP}`, code: `ZD4${String(STAMP).slice(-5)}`, contactEmail: `zz-d410-${STAMP}@test.invalid`, kind: "COLLEGE", isTestFixture: true, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  ids.operator = (await db.user.create({ data: { name: "ZZ D410 Operator", email: `zz-d410-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ D410 Admin", email: `zz-d410-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
});

beforeEach(async () => {
  await db.operatorAccess.deleteMany({ where: { schoolId: ids.school } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorUserId: ids.operator } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("what a visit row says of itself", () => {
  it("TA-410: a look inside a school is a visit, a coded kind the reader words in its own language, not an English reason", async () => {
    await schoolOverview(operator(), ids.school);
    const history = await accessHistory(ids.school, 10);
    expect(history).toHaveLength(1);
    expect(operatorVisitKindSchema.parse(history[0]!.kind)).toBe("VISIT");
    expect(history[0]!.live).toBe(true);
  });

  it("TA-410: a visit made only by opening the list of colleges is recorded and read as that", async () => {
    await listColleges(operator(), { schoolIds: [ids.school] });
    const history = await accessHistory(ids.school, 10);
    expect(history.map((h) => h.kind)).toEqual(["COLLEGES_LIST"]);
    // Opening the list again within the hour writes no second line.
    await listColleges(operator(), { schoolIds: [ids.school] });
    expect(await rows()).toHaveLength(1);
  });

  it("TA-410: a look inside after the list is its own line, so the college never reads a look inside as a list", async () => {
    await listColleges(operator(), { schoolIds: [ids.school] });
    await schoolOverview(operator(), ids.school);
    const history = await accessHistory(ids.school, 10);
    expect(history.map((h) => h.kind).sort()).toEqual(["COLLEGES_LIST", "VISIT"]);
    // A second look, and the list once more, within the hour add nothing.
    await withSchoolAccess(operator(), ids.school, async () => undefined);
    await listColleges(operator(), { schoolIds: [ids.school] });
    expect(await rows()).toHaveLength(2);
  });

  it("TA-410: the list opened while a look inside is on record writes no line of its own", async () => {
    await schoolOverview(operator(), ids.school);
    await listColleges(operator(), { schoolIds: [ids.school] });
    expect((await accessHistory(ids.school, 10)).map((h) => h.kind)).toEqual(["VISIT"]);
  });

  it("TA-410: a row from before 9 August 2026 keeps the reason typed then", async () => {
    await db.operatorAccess.create({
      data: { schoolId: ids.school, userId: ids.operator, reason: "ZZ a report about a bulletin post", startedAt: new Date("2026-07-01T06:00:00Z"), expiresAt: new Date("2026-07-01T07:00:00Z") },
    });
    const [row] = await accessHistory(ids.school, 10);
    expect(row!.kind).toBe("REASON");
    expect(row!.reason).toBe("ZZ a report about a bulletin post");
    expect(row!.live).toBe(false);
  });
});

describe("the doors that hand the visits to a screen", () => {
  it("TA-410: the Safety Centre's door and the operator's school door carry each visit's kind, inside their contracts", async () => {
    await listColleges(operator(), { schoolIds: [ids.school] });
    await schoolOverview(operator(), ids.school);
    const safety = adminSafetySchema.parse(await adminSafety(admin(), { tab: "open" }));
    expect(safety.visits.map((v) => v.kind).sort()).toEqual(["COLLEGES_LIST", "VISIT"]);
    const detail = operatorSchoolDetailSchema.parse(await operatorSchoolDetail(operator(), ids.school));
    expect(detail.access.map((a) => a.kind).sort()).toEqual(["COLLEGES_LIST", "VISIT"]);
  });

  it("TA-410: an answer without a kind (an older server) still parses, and reads as a typed reason", () => {
    const visit = { id: "v1", reason: "ZZ support ticket", startedAt: "2026-07-01T06:00:00.000Z", expiresAt: "2026-07-01T07:00:00.000Z", endedAt: null, operatorName: "ZZ Operator", live: false };
    const parsed = adminSafetySchema.parse({ openCount: 0, visits: [visit], reports: [], audit: [] });
    expect(parsed.visits[0]!.kind).toBe("REASON");
  });
});

describe("the words", () => {
  const flat = (dict: unknown, key: string): string | undefined => {
    const [section, leaf] = key.split(".") as [string, string];
    return (dict as Record<string, Record<string, string> | undefined>)[section]?.[leaf];
  };

  it("TA-410: a visit and a list of colleges each have a sentence in English, Hindi and Marathi", () => {
    for (const key of ["safety.visitVisited", "safety.visitCollegesList"]) {
      expect(flat(en, key), key).toBeTruthy();
      expect(flat(hi, key), key).toMatch(/[ऀ-ॿ]/);
      expect(flat(mr, key), key).toMatch(/[ऀ-ॿ]/);
    }
    expect(flat(en, "safety.visitVisited")).not.toMatch(/Operator access/);
  });

  it("TA-410: the four screens word a visit by its kind and no longer print the stored words as a reason", () => {
    const web = resolve(__dirname, "../src/app");
    const phone = resolve(__dirname, "../../mobile/src/screens");
    for (const file of [resolve(web, "(app)/admin/safety/page.tsx"), resolve(web, "root/[schoolId]/inside/page.tsx"), resolve(phone, "staff/safety.tsx"), resolve(phone, "operator/school.tsx")]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("safety.visitVisited");
      expect(source, file).toContain("safety.visitCollegesList");
    }
  });

  it("TA-410: the Safety Centre says the team can open the school at any time and that every visit is shown, not that a reason is given", () => {
    expect(en.safety.operatorBody).not.toMatch(/without saying why|cannot see inside/i);
    expect(en.safety.operatorBody).toMatch(/at any time/i);
    expect(en.safety.operatorBody).toMatch(/every visit/i);
    expect(hi.safety.operatorBody).not.toMatch(/बिना कारण बताए खोल नहीं सकते/);
    expect(mr.safety.operatorBody).not.toMatch(/कारण दिल्याशिवाय उघडू शकत नाहीत/);
  });

  it("TA-410: each of the operator's read codes has words in the school's trail, in the three languages", () => {
    for (const action of ["operator.read.overview", "operator.read.posts", "operator.read.people", "operator.read.people.search", "operator.read.college"]) {
      const key = actionKey(action);
      expect(key, action).not.toBeNull();
      expect(flat(en, key!), action).toBeTruthy();
      expect(flat(hi, key!), action).toMatch(/[ऀ-ॿ]/);
      expect(flat(mr, key!), action).toMatch(/[ऀ-ॿ]/);
    }
  });
});
