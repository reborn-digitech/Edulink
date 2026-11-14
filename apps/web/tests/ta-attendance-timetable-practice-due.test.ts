/**
 * TA-533 (testing analysis of 13 November 2026, attendance-timetable batch): the practice door built the due time as
 * `new Date(\`${dueDate}T23:59:59\`)`, read in the server process's zone, so on a host without TZ=Asia/Kolkata a set
 * due 20 November ended at 05:29 the next morning in India. Now the due instant is the last millisecond of that day
 * on the school's clock whatever the process's zone.
 *
 * The door is called as the phone calls it, with a teacher's session at a ZZ school of this suite's own (made here,
 * removed after); the library's write is stood in for, so the instant the door hands it is what is read, and the
 * process's zone is set to UTC for the call and put back after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { classCode } from "@/lib/codes";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

const created: { dueAt: Date | null }[] = [];
vi.mock("@/lib/practice-insights", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/practice-insights")>();
  return {
    ...real,
    createPracticeAssignment: async (_ctx: unknown, input: { dueAt: Date | null }) => {
      created.push({ dueAt: input.dueAt });
      return { id: "czzpractice00000000000001" };
    },
  };
});

const db = new PrismaClient();
const STAMP = Date.now();
const ids: Record<string, string> = {};
const TZ_BEFORE = process.env.TZ;

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAATT Practice School ${STAMP}`, slug: `zz-taatt-prac-${STAMP}`, code: `ZTP${String(STAMP).slice(-6)}`, contactEmail: `zz-taatt-prac-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.user = (await db.user.create({ data: { name: "ZZ TAATT Practice Teacher", email: `zz-taatt-prac-teacher-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.user, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" } });
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ TAATT Practice 6A", gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
});

afterAll(async () => {
  if (TZ_BEFORE === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_BEFORE;
  __resetCookies();
  __setHeaders({});
  if (ids.user) await db.session.deleteMany({ where: { userId: ids.user } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  if (ids.user) await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe("TA-533: the practice due time", () => {
  it("TA-533: a set due 2026-11-20 ends at the last moment of that day in the school's zone, on a host whose clock is UTC", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.user!, { schoolId: ids.school!, role: "TEACHER" });
    const { POST } = await import("@/app/api/v1/staff/practice/route");
    process.env.TZ = "UTC";
    const res = await POST(new Request("http://localhost/api/v1/staff/practice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId: ids.klass, topicSlug: "zz-topic", targetLevel: 2, dueDate: "2026-11-20" }) }));
    expect(res.status).toBe(200);
    expect(created.at(-1)?.dueAt?.toISOString()).toBe("2026-11-20T18:29:59.999Z");
  });
});
