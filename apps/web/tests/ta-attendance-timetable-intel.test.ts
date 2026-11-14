/**
 * TA-505 (testing analysis of 13 November 2026, attendance-timetable batch): the admin's attendance page and the
 * principal's phone tab read every mark of the whole school for up to ninety days into the web process, an object
 * per mark, and the eight weeks again for the trend, on every view. The days are now folded in the database, which
 * answers one row per pupil for the flags and one per day for the trend; the answers are the same.
 *
 * One ZZ school of this suite's own (made here, removed after): three pupils over the last twelve days, one of them
 * on two registers the same day (absent on one, present on the other: absent, the worse mark) with an EXCUSED day
 * inside an absence run (skipped, not a break), so the fold and the run are both tried.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { db as appDb } from "@/lib/db";
import { absenceFlags, attendanceTrend } from "@/lib/attendance-intel";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const MAIL = (who: string) => `zz-taatt-intel-${who}-${STAMP}@test.invalid`;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

/** Marks a pupil on a class's register for a day back from today, the session made once. */
async function mark(classKey: string, back: number, pupil: string, status: string): Promise<void> {
  const dateKey = addDaysToKey(TODAY, -back);
  const session = await db.attendanceSession.upsert({
    where: { classId_dateKey: { classId: ids[classKey]!, dateKey } },
    create: { schoolId: ids.school!, classId: ids[classKey]!, dateKey, takenByMembershipId: ids.adminM! },
    update: {},
    select: { id: true },
  });
  await db.attendanceRecord.create({ data: { schoolId: ids.school!, sessionId: session.id, studentMembershipId: ids[`${pupil}M`]!, status, clientId: `zz-taatt-intel-${STAMP}-${classKey}-${back}-${pupil}` } });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAATT Intel School ${STAMP}`, slug: `zz-taatt-intel-${STAMP}`, code: `ZTI${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true }, select: { id: true } })).id;
  for (const [who, role] of [["admin", "ADMIN"], ["p1", "STUDENT"], ["p2", "STUDENT"], ["p3", "STUDENT"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAATT ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  ids.A = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ TAATT Intel A", gradeLevel: "7", joinCode: classCode() }, select: { id: true } })).id;
  ids.B = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ TAATT Intel B", gradeLevel: "7", joinCode: classCode() }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: ["p1", "p2", "p3"].map((p) => ({ schoolId: ids.school!, classId: ids.A!, studentMembershipId: ids[`${p}M`]!, status: "ACTIVE" as const })) });
  // p1: ten days, six present then four absent: 60 %, a run of four.
  for (let back = 10; back >= 1; back--) await mark("A", back, "p1", back > 4 ? "PRESENT" : "ABSENT");
  // p2: nine days, eight present and an excused last day: 89 %, no run.
  for (let back = 9; back >= 1; back--) await mark("A", back, "p2", back > 1 ? "PRESENT" : "EXCUSED");
  // p3: present, then absent on A and present on B the same day (absent), excused, absent, absent: a run of three.
  await mark("A", 5, "p3", "PRESENT");
  await mark("A", 4, "p3", "ABSENT");
  await mark("B", 4, "p3", "PRESENT");
  await mark("A", 3, "p3", "EXCUSED");
  await mark("A", 2, "p3", "ABSENT");
  await mark("A", 1, "p3", "ABSENT");
});

afterAll(async () => {
  vi.restoreAllMocks();
  __resetCookies();
  __setHeaders({});
  const users = Object.entries(ids).filter(([k]) => ["admin", "p1", "p2", "p3"].includes(k)).map(([, v]) => v);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("TA-505: the attendance flags and trend, folded in the database", () => {
  it("TA-505: the flags and the trend read no mark into the process, and say what they said before", async () => {
    const admin = await as("admin", "ADMIN");
    // A read of the marks one object per mark is what the finding is about: it is refused here, loudly.
    const perMark = vi.spyOn(appDb.attendanceRecord, "findMany").mockImplementation((() => {
      throw new Error("TA-505: every mark of the window read into the process");
    }) as never);

    const flags = await absenceFlags(admin, { days: 30 });
    const trend = await attendanceTrend(admin);

    expect(perMark).not.toHaveBeenCalled();
    const by = new Map(flags.map((f) => [f.studentMembershipId, f]));
    expect(by.get(ids.p1M!)).toMatchObject({ percent: 60, marks: 10, currentRun: 4, chronic: true, consecutive: true });
    expect(by.has(ids.p2M!)).toBe(false);
    expect(by.get(ids.p3M!)).toMatchObject({ percent: 20, marks: 5, currentRun: 3, chronic: false, consecutive: true });
    // Pupil-days: 10 + 9 + 5, the double-register day once; attended 6 + 8 + 1.
    expect(trend.reduce((n, p) => n + p.marks, 0)).toBe(24);
    const attended = trend.reduce((n, p) => n + (p.percent === null ? 0 : Math.round((p.percent * p.marks) / 100)), 0);
    expect(attended).toBe(15);
  });
});
