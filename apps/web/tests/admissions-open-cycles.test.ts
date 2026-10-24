/**
 * QA-17 (QA campaign of 24 October 2026, E2E-A6): with the seeded OPEN
 * "Admissions 2027–28" at Sunrise and a second cycle opened mid-year, the
 * family's page showed only the newest, and applying to the seeded one,
 * OPEN on the office's list, answered 403 "That cycle is not open."
 * (`openCycleOf` returned one cycle and `apply` compared against it).
 *
 * Now every cycle that is OPEN and within its dates is offered, the earliest
 * academic year first, and takes applications; a cycle closed by its status
 * or past its closing date still refuses.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { apply, schoolAdmissions } from "@/lib/admissions";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", thisYear: "", nextYear: "", seeded: "", midYear: "", closed: "", lapsed: "", family: "" };

const parent = (): ActiveContext => ({
  sessionId: "test-session",
  membershipId: null,
  schoolId: null,
  role: "PARENT",
  user: { id: ids.family, name: "ZZ Cycles Family", preferredName: null, email: `zz-cycles-family-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
}) as unknown as ActiveContext;

const form = (cycleId: string, childName: string, gradeApplied: string) => ({ schoolId: ids.school, cycleId, childName, childBirthdate: gradeApplied === "1" ? "2020-03-03" : "2016-02-02", gradeApplied, relation: "PARENT" as const });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Cycles ${STAMP}`, slug: `zz-cycles-${STAMP}`, code: `ZCY${SUFFIX}`, contactEmail: `zz-cycles-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date(), profilePublishedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ADMISSIONS" } }).catch(() => undefined);
  ids.family = (await db.user.create({ data: { name: "ZZ Cycles Family", email: `zz-cycles-family-${STAMP}@test.invalid` }, select: { id: true } })).id;
  ids.thisYear = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.nextYear = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2027–28", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;
  const cycle = (name: string, academicYearId: string, extra: Record<string, unknown> = {}) =>
    db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId, name, gradesJson: JSON.stringify([{ grade: "1", seats: 40 }, { grade: "5", seats: 2 }]), status: "OPEN", ...extra }, select: { id: true } });
  // The seeded next-year cycle first, then the office's mid-year cycle (the newer row), as at Sunrise.
  ids.seeded = (await cycle("ZZ Admissions 2027–28", ids.nextYear)).id;
  ids.midYear = (await cycle("ZZ Mid-year transfers", ids.thisYear)).id;
  ids.closed = (await cycle("ZZ Closed round", ids.thisYear, { status: "CLOSED" })).id;
  ids.lapsed = (await cycle("ZZ Lapsed round", ids.thisYear, { closesAt: new Date("2026-01-31T00:00:00Z") })).id;
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { user: { email: { contains: `-${STAMP}@test.invalid` } } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-17: every open admission cycle is offered and takes applications", () => {
  it("the school's page lists both open cycles, this year's first, and neither the closed nor the lapsed one", async () => {
    const view = await schoolAdmissions(parent(), ids.school);
    expect(view.cycles.map((c) => c.cycleId)).toEqual([ids.midYear, ids.seeded]);
    expect(view.open?.cycleId).toBe(ids.midYear);
  });

  it("applying to the older, seeded cycle is taken, not refused as closed", async () => {
    const app = await apply(parent(), form(ids.seeded, "ZZ Next Year Child", "1"));
    expect(app.status).toBe("SUBMITTED");
    expect(await db.application.count({ where: { cycleId: ids.seeded } })).toBe(1);
  });

  it("applying to the mid-year cycle is taken too", async () => {
    await apply(parent(), form(ids.midYear, "ZZ Transfer Child", "5"));
    expect(await db.application.count({ where: { cycleId: ids.midYear } })).toBe(1);
  });

  it("a cycle closed by its status or past its closing date still refuses", async () => {
    await expect(apply(parent(), form(ids.closed, "ZZ Closed Child", "5"))).rejects.toThrow(/admissions\.refuseClosed/);
    await expect(apply(parent(), form(ids.lapsed, "ZZ Lapsed Child", "5"))).rejects.toThrow(/admissions\.refuseClosed/);
  });
});
