/**
 * The head's trends (analytics-longitudinal.ts, GET /api/v1/principal/trends),
 * two findings of the testing analysis of 13 November 2026.
 *
 * TA-214: every register mark of up to three years was read into the web
 * process as an object on each open (attendanceRecord.findMany over the span),
 * and the door had no budget. Now the marks are counted in the database
 * (grouped by session and status) and the door takes the heavy-read budget.
 *
 * TA-387: the years were the newest by start date, so once the office entered
 * next year in advance (as closing a year needs) the page called next year
 * "this year", compared it with the year in progress and dropped the year
 * before. Now a year that has not begun is left out unless it is the current
 * one.
 *
 * One ZZ school of this suite's own, made through the owner connection and
 * removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Every call the library makes on the register's rows, by operation: the app's
// client wrapped so a findMany over AttendanceRecord is seen (TA-214).
const seen = vi.hoisted(() => ({ attendanceRecord: [] as string[] }));
vi.mock("@/lib/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/db")>();
  const watched = new Proxy(real.db, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (prop !== "attendanceRecord") return value;
      return new Proxy(value as object, {
        get(model, op) {
          const fn = Reflect.get(model, op);
          if (typeof fn !== "function") return fn;
          return (...args: unknown[]) => {
            seen.attendanceRecord.push(String(op));
            return (fn as (...a: unknown[]) => unknown).apply(model, args);
          };
        },
      });
    },
  });
  return { ...real, db: watched };
});

import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as trendsGet } from "@/app/api/v1/principal/trends/route";
import { HEAVY_READ_BUDGET } from "@/lib/api-v1";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const ids = { school: "", principal: "", admin: "", teacher: "", pupil1: "", pupil2: "" };

const d = (key: string) => new Date(`${key}T00:00:00.000Z`);
// The academic year that holds today (April to March), and its neighbours.
const now = new Date();
const startYear = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
const yearName = (y: number) => `ZZ ${y}–${String((y + 1) % 100).padStart(2, "0")}`;
const CURRENT = yearName(startYear);
const LAST = yearName(startYear - 1);
const NEXT = yearName(startYear + 1);
// A day of this year already gone, and one of last year.
const thisYearDay = `${startYear}-04-10`;
const lastYearDay = `${startYear - 1}-11-02`;

const read = (query = "") => trendsGet(new Request(`http://localhost/api/v1/principal/trends${query}`));
async function as(userId: string, role: "PRINCIPAL" | "ADMIN") {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.school, role });
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Trends ${STAMP}`, slug: `zz-ta-trends-${STAMP}`, code: `ZTT${SUFFIX}`, contactEmail: `zz-ta-trends-${STAMP}@test.invalid`, timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ TA Trends ${who}`, email: `zz-ta-trends-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [principal, admin, teacher, p1, p2] = await Promise.all([mk("Head"), mk("Office"), mk("Teacher"), mk("Pupil1"), mk("Pupil2")]);
  ids.principal = principal.id;
  ids.admin = admin.id;
  await db.membership.createMany({ data: [{ userId: principal.id, schoolId: S, role: "PRINCIPAL", status: "ACTIVE" }, { userId: admin.id, schoolId: S, role: "ADMIN", status: "ACTIVE" }] });
  ids.teacher = (await db.membership.create({ data: { userId: teacher.id, schoolId: S, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupil1 = (await db.membership.create({ data: { userId: p1.id, schoolId: S, role: "STUDENT", status: "ACTIVE", studentCode: `ZTT1${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  ids.pupil2 = (await db.membership.create({ data: { userId: p2.id, schoolId: S, role: "STUDENT", status: "ACTIVE", studentCode: `ZTT2${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: S, name: "ZZ TA 6A", gradeLevel: "6", joinCode: `ZTT${SUFFIX}` }, select: { id: true } });

  await db.academicYear.create({ data: { schoolId: S, name: LAST, startDate: d(`${startYear - 1}-04-01`), endDate: d(`${startYear}-03-31`), isCurrent: false } });
  await db.academicYear.create({ data: { schoolId: S, name: CURRENT, startDate: d(`${startYear}-04-01`), endDate: d(`${startYear + 1}-03-31`), isCurrent: true } });
  // Next year entered in advance by the office, not current, not begun.
  await db.academicYear.create({ data: { schoolId: S, name: NEXT, startDate: d(`${startYear + 1}-04-01`), endDate: d(`${startYear + 2}-03-31`), isCurrent: false } });

  // Registers: this year two days, pupil 2 absent once and late once (3 of 4 here); last year one day, pupil 1 absent (1 of 2).
  const register = async (dateKey: string, statuses: [string, string][]) => {
    const session = await db.attendanceSession.create({ data: { schoolId: S, classId: klass.id, dateKey }, select: { id: true } });
    await db.attendanceRecord.createMany({ data: statuses.map(([studentMembershipId, status]) => ({ schoolId: S, sessionId: session.id, studentMembershipId, status })) });
  };
  await register(thisYearDay, [[ids.pupil1, "PRESENT"], [ids.pupil2, "ABSENT"]]);
  await register(`${startYear}-04-11`, [[ids.pupil1, "PRESENT"], [ids.pupil2, "LATE"]]);
  await register(lastYearDay, [[ids.pupil1, "ABSENT"], [ids.pupil2, "PRESENT"]]);

  // A paper in each of the two years, grade 6, so the cohort table has a row.
  const paper = async (name: string, dateKey: string, marks: [string, number][]) => {
    const series = await db.examSeries.create({ data: { schoolId: S, name, gradeLevel: "6", kind: "UNIT_TEST" }, select: { id: true } });
    const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject: "Mathematics", dateKey, pointsMilli: 100_000 }, select: { id: true } });
    const sitting = await db.assignment.create({ data: { schoolId: S, classId: klass.id, authorMembershipId: ids.teacher, title: name, examSlotId: slot.id, publishedAt: new Date() }, select: { id: true } });
    await db.grade.createMany({ data: marks.map(([studentMembershipId, m]) => ({ schoolId: S, assignmentId: sitting.id, studentMembershipId, scoreMilli: m * 1000 })) });
  };
  await paper("ZZ TA this year", thisYearDay, [[ids.pupil1, 80], [ids.pupil2, 60]]);
  await paper("ZZ TA last year", lastYearDay, [[ids.pupil1, 50], [ids.pupil2, 50]]);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = [ids.principal, ids.admin].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: { in: users.map((u) => `heavy:${u}`) } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: "zz-ta-trends-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-387: a year entered in advance is not this year", () => {
  it("TA-387: with next year entered, the two years are the current one and the one before", async () => {
    await as(ids.principal, "PRINCIPAL");
    const res = await read("?years=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.years.map((y: { name: string }) => y.name)).toEqual([CURRENT, LAST]);
    const six = body.cohorts.find((c: { gradeLevel: string }) => c.gradeLevel === "6");
    expect(six?.thisYear.yearName).toBe(CURRENT);
    expect(six?.lastYear?.yearName).toBe(LAST);
    expect(six?.thisYear.examAveragePercent).toBe(70);
    expect(six?.lastYear?.examAveragePercent).toBe(50);
  });

  it("TA-387: years=1 is the current year's own point, not next year's empty one", async () => {
    await as(ids.principal, "PRINCIPAL");
    const body = await (await read("?years=1")).json();
    expect(body.years.map((y: { name: string }) => y.name)).toEqual([CURRENT]);
    expect(body.terms.map((t: { yearName: string }) => t.yearName)).toEqual([CURRENT]);
    expect(body.terms[0].attendancePercent).toBe(75);
  });
});

describe("TA-214: the register is counted in the database, and the door is budgeted", () => {
  it("TA-214: the trends read takes no register mark one by one, and the attendance figures stand", async () => {
    await as(ids.admin, "ADMIN");
    seen.attendanceRecord.length = 0;
    const res = await read("?years=3");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(seen.attendanceRecord).not.toContain("findMany");
    const byYear = new Map(body.terms.map((t: { yearName: string; attendancePercent: number | null }) => [t.yearName, t.attendancePercent]));
    expect(byYear.get(CURRENT)).toBe(75);
    expect(byYear.get(LAST)).toBe(50);
    const six = body.cohorts.find((c: { gradeLevel: string }) => c.gradeLevel === "6");
    expect(six?.thisYear.attendancePercent).toBe(75);
    expect(six?.lastYear?.attendancePercent).toBe(50);
  });

  it("TA-214: a reader past the heavy-read budget is answered 429 and nothing is computed", async () => {
    await db.rateLimit.upsert({
      where: { bucket: `heavy:${ids.principal}` },
      create: { bucket: `heavy:${ids.principal}`, hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
      update: { hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
    });
    await as(ids.principal, "PRINCIPAL");
    const res = await read("?years=3");
    expect(res.status).toBe(429);
    await db.rateLimit.deleteMany({ where: { bucket: `heavy:${ids.principal}` } });
  });
});
