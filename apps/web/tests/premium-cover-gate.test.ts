/**
 * Premium's cover in the plan lock (decision 0010 decisions 8, 9 and 10; the brief's rules 1 to 4, phase 4).
 *
 * `planLockFor` gains one step after "the plan is not asked for, so nothing is asked" and before the signed-out answer: a
 * school with live cover for the person's role covers them, so nothing is asked of them. Live cover is the school's switch
 * for the role on, its status neither SUSPENDED nor ENDED, the school not removed, whether or not its terms are set, read
 * on each request. Students premium covers the STUDENT plan's whole list for a school's pupils, Teachers premium the
 * TEACHER plan's for its teachers; a college's teachers are never covered (Teachers premium is hidden at a college). The
 * platform's switch stays above everything; a plan not asked for asks nothing; a person holding a plan keeps it. Cover
 * follows the session's school, and a guardian's reading of a child the child's school.
 *
 * Every feature is on (tests/setup.ts) and the plans asked for are named per case. ZZ schools and people of this suite's
 * own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES, PLATFORM_FEATURES, type FeatureCode } from "@edulink/contracts";
import { ENDPOINTS } from "@/lib/api-catalog";
import { featuresOf } from "@/lib/api-catalog/types";
import { gateRequest } from "@/lib/role-gate";
import { PlanRequiredError } from "@/lib/access-error";
import { assertChildMayUse, childLock, lockOf, mayUse, setFeaturesForTests } from "@/lib/platform-features";
import { planLockFor, setActivePlansForTests } from "@/lib/person-plans";
import { accessFor, readGateState } from "../scripts/sweep-features";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const email = (who: string) => `zz-cover-${who}-${STAMP}@test.invalid`;

type Key = "Covered" | "Plain" | "Paused" | "Ended" | "Removed" | "College" | "TeachersOnly";
const school: Record<string, string> = {};
const pupil: Record<string, string> = {};
const pupilMembership: Record<string, string> = {};
const teacher: Record<string, string> = {};

async function makeSchool(key: Key, data: Record<string, unknown>) {
  const n = Object.keys(school).length;
  school[key] = (await db.school.create({
    data: { name: `ZZ Cover ${key} ${STAMP}`, slug: `zz-cover-${key.toLowerCase()}-${STAMP}`, code: `ZCV${n}${String(STAMP).slice(-5)}`, contactEmail: email(key.toLowerCase()), timezone: "Asia/Kolkata", isTestFixture: true, subscriptionStatus: "ACTIVE", ...data },
    select: { id: true },
  })).id;
  pupil[key] = (await db.user.create({ data: { name: `ZZ Cover Pupil ${key}`, email: email(`p-${key.toLowerCase()}`), isTestFixture: true }, select: { id: true } })).id;
  teacher[key] = (await db.user.create({ data: { name: `ZZ Cover Teacher ${key}`, email: email(`t-${key.toLowerCase()}`), isTestFixture: true }, select: { id: true } })).id;
  pupilMembership[key] = (await db.membership.create({ data: { userId: pupil[key]!, schoolId: school[key]!, role: "STUDENT", status: "ACTIVE", studentCode: `ZCV${n}${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: teacher[key]!, schoolId: school[key]!, role: "TEACHER", status: "ACTIVE" } });
}

beforeAll(async () => {
  // Terms not set at any of these: cover does not wait for terms (rule 4).
  await makeSchool("Covered", { premiumStudents: true, premiumTeachers: true });
  await makeSchool("Plain", {});
  await makeSchool("Paused", { premiumStudents: true, premiumTeachers: true, subscriptionStatus: "SUSPENDED" });
  await makeSchool("Ended", { premiumStudents: true, premiumTeachers: true, subscriptionStatus: "ENDED" });
  await makeSchool("Removed", { premiumStudents: true, premiumTeachers: true, removedAt: new Date(Date.now() - DAY) });
  // A college's teachers are never covered, even with the switch written straight into the row (the writer refuses it).
  await makeSchool("College", { kind: "COLLEGE", premiumStudents: true, premiumTeachers: true });
  await makeSchool("TeachersOnly", { premiumTeachers: true, subscriptionStatus: null });
});

afterEach(() => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
});

afterAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  const people = [...Object.values(pupil), ...Object.values(teacher)];
  await db.entitlement.deleteMany({ where: { userId: { in: people } } });
  await db.school.deleteMany({ where: { id: { in: Object.values(school) } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

const asPupil = (key: Key) => ({ userId: pupil[key]!, schoolId: school[key]!, role: "STUDENT" as const });
const asTeacher = (key: Key) => ({ userId: teacher[key]!, schoolId: school[key]!, role: "TEACHER" as const });
const allOpen = async (features: readonly FeatureCode[], who: Parameters<typeof mayUse>[1]) => {
  for (const f of features) if (!(await mayUse(f, who))) return false;
  return true;
};

describe("live cover in the plan lock (rules 1 to 4)", () => {
  it("covers a school's pupils for the STUDENT plan's whole list and its teachers for the TEACHER plan's, with no row per person", async () => {
    setActivePlansForTests(["STUDENT", "TEACHER"]);
    expect(await allOpen(PLAN_FEATURES.STUDENT, asPupil("Covered"))).toBe(true);
    expect(await allOpen(PLAN_FEATURES.TEACHER, asTeacher("Covered"))).toBe(true);
    expect(await db.entitlement.count({ where: { userId: { in: [pupil.Covered!, teacher.Covered!] } } })).toBe(0);
    // Teachers premium alone covers teachers, never pupils; it waits for no status or terms.
    expect(await allOpen(PLAN_FEATURES.TEACHER, asTeacher("TeachersOnly"))).toBe(true);
    expect(await lockOf("QUESTION_BANK", asPupil("TeachersOnly"))).toBe("STUDENT");
  });

  it("asks the plan where there is no live cover: premium off, paused, ended or removed; a college's teachers", async () => {
    setActivePlansForTests(["STUDENT", "TEACHER"]);
    for (const key of ["Plain", "Paused", "Ended", "Removed"] as const) {
      expect(await lockOf("QUESTION_BANK", asPupil(key))).toBe("STUDENT");
      expect(await lockOf("JOB_BOARD", asTeacher(key))).toBe("TEACHER");
    }
    expect(await allOpen(PLAN_FEATURES.STUDENT, asPupil("College"))).toBe(true);
    expect(await lockOf("JOB_BOARD", asTeacher("College"))).toBe("TEACHER");
  });

  it("cover is read on each request: switched off, the lock is back; switched on again, gone", async () => {
    setActivePlansForTests(["STUDENT"]);
    await db.school.update({ where: { id: school.Covered! }, data: { premiumStudents: false } });
    try {
      expect(await lockOf("QUESTION_BANK", asPupil("Covered"))).toBe("STUDENT");
    } finally {
      await db.school.update({ where: { id: school.Covered! }, data: { premiumStudents: true } });
    }
    expect(await lockOf("QUESTION_BANK", asPupil("Covered"))).toBeNull();
  });

  it("the platform's switch stays above; a plan not asked for asks nothing; a plan held is kept; cover comes before the signed-out answer", async () => {
    setActivePlansForTests(["STUDENT"]);
    setFeaturesForTests(PLATFORM_FEATURES.filter((c) => c !== "QUESTION_BANK"));
    expect(await mayUse("QUESTION_BANK", asPupil("Covered"))).toBe(false);
    setFeaturesForTests([...PLATFORM_FEATURES]);
    setActivePlansForTests([]);
    expect(await mayUse("QUESTION_BANK", asPupil("Plain"))).toBe(true);
    setActivePlansForTests(["STUDENT"]);
    const held = await db.entitlement.create({ data: { userId: pupil.Plain!, feature: "QUESTION_BANK", source: "GRANT", planCode: "STUDENT", validFrom: new Date(Date.now() - DAY), validTo: new Date(Date.now() + DAY) }, select: { id: true } });
    try {
      expect(await mayUse("QUESTION_BANK", asPupil("Plain"))).toBe(true);
    } finally {
      await db.entitlement.delete({ where: { id: held.id } });
    }
    expect(await planLockFor("QUESTION_BANK", { userId: null, role: "STUDENT", schoolId: school.Covered! })).toBeNull();
    expect(await planLockFor("QUESTION_BANK", { userId: null, role: "STUDENT", schoolId: school.Plain! })).toBe("STUDENT");
  });

  it("a guardian reads a child's practice while the child's school covers it", async () => {
    setActivePlansForTests(["STUDENT"]);
    expect(await childLock("QUESTION_BANK", pupilMembership.Covered!)).toBeNull();
    await expect(assertChildMayUse("QUESTION_BANK", pupilMembership.Covered!)).resolves.toBeUndefined();
    expect(await childLock("QUESTION_BANK", pupilMembership.Paused!)).toBe("STUDENT");
    await expect(assertChildMayUse("QUESTION_BANK", pupilMembership.Plain!)).rejects.toBeInstanceOf(PlanRequiredError);
  });

  it("the gate lets a covered pupil through a planned door and answers an uncovered one 402", async () => {
    setActivePlansForTests(["STUDENT"]);
    const door = ENDPOINTS.find((e) => e.method === "GET" && featuresOf(e).includes("QUESTION_BANK") && Array.isArray(e.access) && e.access.includes("STUDENT") && !e.planFree)!;
    const route = `GET ${door.path.replace(/\{[^}]+\}/g, "zz")}`;
    expect(await gateRequest(route, { role: "STUDENT", schoolId: school.Covered!, userId: pupil.Covered! })).toBe("pass");
    await expect(gateRequest(route, { role: "STUDENT", schoolId: school.Plain!, userId: pupil.Plain! })).rejects.toMatchObject({ plan: "STUDENT", feature: "QUESTION_BANK" });
  });

  it("the sweeps' copy of the gate reads the same cover and agrees with the lock, person by person", async () => {
    setActivePlansForTests(["STUDENT", "TEACHER"]);
    const people = [...Object.values(pupil), ...Object.values(teacher)];
    const g = await readGateState(db, people);
    // The switches and plans as the suite names them (the copy reads the rows, so the suite's names stand in for them).
    const s = { ...g, on: new Set(PLATFORM_FEATURES), activePlans: new Set(["STUDENT", "TEACHER"] as const) };
    for (const key of Object.keys(school) as Key[]) {
      for (const who of [asPupil(key), asTeacher(key)]) {
        const feature = who.role === "STUDENT" ? "QUESTION_BANK" : "JOB_BOARD";
        const sweep = accessFor([feature], who, s).state === "open";
        expect(sweep, `${key} ${who.role}`).toBe(await mayUse(feature, who));
      }
    }
    expect(g.covered?.get(school.Covered!)).toEqual(new Set(["STUDENT", "TEACHER"]));
    expect(g.covered?.get(school.College!)).toEqual(new Set(["STUDENT"]));
    for (const key of ["Plain", "Paused", "Ended", "Removed"] as const) expect(g.covered?.get(school[key]!)?.size ?? 0).toBe(0);
  });
});
