/**
 * TA-464 (testing analysis of 13 November 2026, the 'test-infra' batch): the load check never failed, and left the
 * register it loaded changed. It printed "targets NOT met" and exited 0; and every request marked every pupil
 * PRESENT through the upserting writer, so a pupil the fixture had marked ABSENT today stayed PRESENT and the
 * sessions the run created were kept, while the clean-up deleted only records whose id was new.
 *
 * One ZZ school of this suite's own, made here and removed after: a teacher, two pupils, two classes. The "run" is
 * the real writer (saveAttendanceBatch) marking everyone PRESENT, as the load check's POSTs do.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { saveAttendanceBatch } from "@/lib/attendance";
import { todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";
import { restoreRegisters, snapshotRegisters, targetsMet } from "../scripts/load-check-registers";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-tainfra-load-${who}-${STAMP}@test.invalid`;
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const EARLIER = new Date(Date.now() - 3 * 3_600_000);

async function person(who: string, role: string, extra: Record<string, string> = {}): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TAINFRA ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role: role as never, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

async function classWith(name: string, pupils: string[]): Promise<string> {
  const id = (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ TAINFRA ${name}`, gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: ids.school!, classId: id, teacherMembershipId: ids.teacherM!, role: "LEAD", canTakeAttendance: true } });
  await db.enrollment.createMany({ data: pupils.map((p) => ({ schoolId: ids.school!, classId: id, studentMembershipId: ids[`${p}M`]!, status: "ACTIVE" as const })) });
  return id;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAINFRA Load School ${STAMP}`, slug: `zz-tainfra-load-${STAMP}`, code: `ZTL${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await person("teacher", "TEACHER");
  await person("head", "PRINCIPAL");
  for (const p of ["p1", "p2", "p3"]) await person(p, "STUDENT", { studentCode: `ZL${p}${String(STAMP).slice(-6)}`, gradeLevel: "6" });
  ids.kA = await classWith("A", ["p1", "p2"]);
  ids.kB = await classWith("B", ["p3"]);
  // The fixture's register for class A today: taken by the head three hours ago, p1 ABSENT with a note; p2 not yet marked.
  ids.sessionA = (await db.attendanceSession.create({ data: { schoolId: ids.school!, classId: ids.kA!, dateKey: TODAY, takenByMembershipId: ids.headM!, takenAt: EARLIER }, select: { id: true } })).id;
  ids.recordP1 = (
    await db.attendanceRecord.create({ data: { sessionId: ids.sessionA!, schoolId: ids.school!, studentMembershipId: ids.p1M!, status: "ABSENT", note: "ZZ fever", clientId: "zz-tainfra-before", markedAt: EARLIER }, select: { id: true } })
  ).id;
}, 120_000);

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tainfra-load-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-464: the load check fails when it misses a target, and leaves the registers as it found them", () => {
  it("TA-464: the verdict is false on any missed target or any error, and the script sets a failing exit code on it", () => {
    expect(targetsMet({ p95: 120, errors: 0 }, { p95: 400, errors: 0 })).toBe(true);
    expect(targetsMet({ p95: 300, errors: 0 }, { p95: 400, errors: 0 })).toBe(false);
    expect(targetsMet({ p95: 120, errors: 0 }, { p95: 800, errors: 0 })).toBe(false);
    expect(targetsMet({ p95: 120, errors: 1 }, { p95: 400, errors: 0 })).toBe(false);
    const script = readFileSync(join(__dirname, "..", "scripts", "load-check.ts"), "utf8");
    expect(script).toMatch(/if \(!met\) process\.exitCode = 1;/);
    expect(script).toMatch(/restoreRegisters\(db, days, before\)/);
    // The old clean-up, which deleted only new record ids, is gone.
    expect(script).not.toMatch(/id: \{ notIn: \[\.\.\.before\] \}/);
  });

  it("TA-464: the fix leaves the script's client line as it was (no unrelated reformatting)", () => {
    const script = readFileSync(join(__dirname, "..", "scripts", "load-check.ts"), "utf8");
    expect(script).toContain("const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });");
  });

  it("TA-464: after a run that marked everyone PRESENT, the ABSENT mark, its note and its time are back, the run's records and sessions are gone", async () => {
    const days = [{ schoolId: ids.school!, dateKey: TODAY }];
    const before = await snapshotRegisters(db, days);
    // The run: every pupil of each register PRESENT, by the teacher, as the load check's POST does.
    for (const [classId, pupils] of [[ids.kA!, ["p1", "p2"]], [ids.kB!, ["p3"]]] as const) {
      await saveAttendanceBatch({ schoolId: ids.school!, classId, dateKey: TODAY, marks: pupils.map((p) => ({ studentMembershipId: ids[`${p}M`]!, status: "PRESENT" as const, clientId: randomUUID() })), takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!, notify: false });
    }
    expect((await db.attendanceRecord.findUniqueOrThrow({ where: { id: ids.recordP1! } })).status).toBe("PRESENT");
    expect(await db.attendanceSession.count({ where: { schoolId: ids.school!, dateKey: TODAY } })).toBe(2);

    const done = await restoreRegisters(db, days, before);
    expect(done).toEqual({ sessionsDeleted: 1, recordsDeleted: 1, recordsRestored: 1, sessionsRestored: 1 });
    const p1 = await db.attendanceRecord.findUniqueOrThrow({ where: { id: ids.recordP1! } });
    expect({ status: p1.status, note: p1.note, clientId: p1.clientId, markedAt: p1.markedAt.toISOString() }).toEqual({ status: "ABSENT", note: "ZZ fever", clientId: "zz-tainfra-before", markedAt: EARLIER.toISOString() });
    const sessions = await db.attendanceSession.findMany({ where: { schoolId: ids.school!, dateKey: TODAY }, select: { id: true, takenByMembershipId: true, takenAt: true, _count: { select: { records: true } } } });
    expect(sessions).toEqual([{ id: ids.sessionA!, takenByMembershipId: ids.headM!, takenAt: EARLIER, _count: { records: 1 } }]);
  });
});
