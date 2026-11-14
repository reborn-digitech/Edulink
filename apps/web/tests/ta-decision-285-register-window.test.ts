/**
 * The owner's decision on TA-285 of the testing analysis of 13 November 2026: a register closes to its class teacher
 * and covers fourteen days after its date, then only the office (ADMIN) may save it, and every save's audit row names
 * the pupils it changed, from what mark to what.
 *
 *   - A class teacher or a cover may save or change a day's register for 14 days after its date, worked out on the
 *     school's clock when saving; after that the door refuses (403) with a sentence in en, hi and mr, a register never
 *     taken included, so a phone's waiting register sent later than that is refused and goes to the office.
 *   - The office may save any past day, and the guardians are still told of an absence it records on an old day.
 *   - Nothing is stamped into finalizedAt; reading a past day is unchanged.
 *   - The register's read says the day is closed (`closed`), so the web and a phone release draw it read-only.
 *
 * One ZZ school of this suite's own, made here and removed after.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { registerFor } from "@/lib/api-reads/staff";
import { REGISTER_CORRECTION_DAYS, registerClosedFor } from "@/lib/register-duty";
import { POST as postRegister, GET as getRegisterDoor } from "@/app/api/attendance/route";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-ta285-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const TODAY = todayKey(TZ);
/** The last day the class teacher may still save, and the first one closed to them. */
const EDGE = addDaysToKey(TODAY, -14);
const OLD = addDaysToKey(TODAY, -15);

type Staff = ActiveContext & { role: NonNullable<ActiveContext["role"]>; schoolId: string; membershipId: string };

async function as(who: string, role: string): Promise<Staff> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx as Staff;
}

async function user(who: string): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TA285 ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  return ids[who]!;
}

async function member(who: string, role: string, extra: Record<string, string> = {}): Promise<string> {
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role: role as never, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

async function classWith(name: string, pupils: string[]): Promise<string> {
  const id = (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ TA285 ${name}`, gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: ids.school!, classId: id, teacherMembershipId: ids.teacherM!, role: "LEAD", canTakeAttendance: true } });
  await db.enrollment.createMany({ data: pupils.map((p) => ({ schoolId: ids.school!, classId: id, studentMembershipId: ids[`${p}M`]!, status: "ACTIVE" as const })) });
  return id;
}

let clientSeq = 0;
function post(classId: string, dateKey: string, marks: { pupil: string; status: string }[]): Promise<Response> {
  return postRegister(
    new Request("http://localhost/api/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        classId,
        dateKey,
        marks: marks.map((m) => ({ studentMembershipId: ids[`${m.pupil}M`], status: m.status, clientId: `zz-ta285-${STAMP}-${++clientSeq}`, markedAt: new Date().toISOString() })),
      }),
    }),
  );
}

const sessionOf = (classId: string, dateKey: string) =>
  db.attendanceSession.findUnique({ where: { classId_dateKey: { classId, dateKey } }, select: { id: true, finalizedAt: true } });

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA285 School ${STAMP}`, slug: `zz-ta285-${STAMP}`, code: `ZTW${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await user("office");
  await member("office", "ADMIN");
  await user("teacher");
  await member("teacher", "TEACHER");
  await user("cover");
  await member("cover", "TEACHER");
  await user("mum");
  for (const p of ["pA", "pB", "pC"]) {
    await user(p);
    await member(p, "STUDENT", { studentCode: `ZW${p}${String(STAMP).slice(-6)}`, gradeLevel: "6" });
  }
  await db.guardianship.create({ data: { parentUserId: ids.mum!, studentMembershipId: ids.pAM!, studentSchoolId: ids.school!, status: "ACTIVE", relation: "PARENT" } });
  ids.kTeacher = await classWith("teacher", ["pA", "pB"]);
  ids.kCover = await classWith("cover", ["pC"]);
  // The cover teacher stands in for the second class across the whole fortnight and the day before it.
  await db.attendanceCover.create({ data: { schoolId: ids.school!, classId: ids.kCover!, coveringMembershipId: ids.coverM!, fromDateKey: OLD, toDateKey: TODAY, reason: "ZZ TA-285", createdByMembershipId: ids.officeM! } });
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-ta285-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
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

describe("TA-285: the class teacher's and the cover's fortnight", () => {
  it("TA-285: a class teacher's save of a day fifteen days back is refused 403 with the closing sentence, and nothing is stored", async () => {
    await as("teacher", "TEACHER");
    const res = await post(ids.kTeacher!, OLD, [{ pupil: "pA", status: "ABSENT" }]);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe(en.attendance.registerClosed);
    expect(await sessionOf(ids.kTeacher!, OLD)).toBeNull();
  });

  it("TA-285: the class teacher may still save and change a day fourteen days back", async () => {
    await as("teacher", "TEACHER");
    expect((await post(ids.kTeacher!, EDGE, [{ pupil: "pB", status: "PRESENT" }])).status).toBe(200);
    expect((await post(ids.kTeacher!, EDGE, [{ pupil: "pB", status: "LATE" }])).status).toBe(200);
    const row = await db.attendanceRecord.findFirstOrThrow({ where: { schoolId: ids.school!, studentMembershipId: ids.pBM!, session: { classId: ids.kTeacher!, dateKey: EDGE } }, select: { status: true } });
    expect(row.status).toBe("LATE");
  });

  it("TA-285: a cover is held to the same window, though their cover runs over the closed day", async () => {
    await as("cover", "TEACHER");
    expect((await post(ids.kCover!, OLD, [{ pupil: "pC", status: "PRESENT" }])).status).toBe(403);
    expect(await sessionOf(ids.kCover!, OLD)).toBeNull();
    expect((await post(ids.kCover!, EDGE, [{ pupil: "pC", status: "PRESENT" }])).status).toBe(200);
  });
});

describe("TA-285: after the window, the office", () => {
  it("TA-285: the office takes a never-taken register past the window, the guardian is told of the absence, and nothing is stamped closed", async () => {
    await as("office", "ADMIN");
    const before = await db.notification.count({ where: { userId: ids.mum!, kind: "ATTENDANCE" } });
    const res = await post(ids.kTeacher!, OLD, [{ pupil: "pA", status: "ABSENT" }]);
    expect(res.status).toBe(200);
    const saved = await sessionOf(ids.kTeacher!, OLD);
    expect(saved).not.toBeNull();
    expect(saved!.finalizedAt).toBeNull();
    const told = await db.notification.findMany({ where: { userId: ids.mum!, kind: "ATTENDANCE" }, select: { meta: true } });
    expect(told.length - before).toBe(1);
    expect(told.some((n) => String(n.meta).includes(OLD))).toBe(true);
  });

  it("TA-285: every save's audit row names each pupil changed, from what mark to what, and a pupil re-sent unchanged is not named", async () => {
    await as("office", "ADMIN");
    const day = addDaysToKey(TODAY, -20);
    const auditRows = async () =>
      (await db.auditLog.findMany({ where: { schoolId: ids.school!, action: "attendance.mark", targetId: (await sessionOf(ids.kTeacher!, day))?.id ?? "none" }, orderBy: { createdAt: "asc" }, select: { meta: true } })).map(
        (r) => JSON.parse(String(r.meta)) as { changes?: { studentMembershipId: string; from: string | null; to: string }[] },
      );

    expect((await post(ids.kTeacher!, day, [{ pupil: "pA", status: "PRESENT" }, { pupil: "pB", status: "PRESENT" }])).status).toBe(200);
    let rows = await auditRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.changes).toEqual(
      expect.arrayContaining([
        { studentMembershipId: ids.pAM!, from: null, to: "PRESENT" },
        { studentMembershipId: ids.pBM!, from: null, to: "PRESENT" },
      ]),
    );
    expect(rows[0]!.changes).toHaveLength(2);

    // A correction of one pupil, and the other re-sent with the mark it already had: only the change is named.
    expect((await post(ids.kTeacher!, day, [{ pupil: "pA", status: "ABSENT" }, { pupil: "pB", status: "PRESENT" }])).status).toBe(200);
    rows = await auditRows();
    expect(rows).toHaveLength(2);
    expect(rows[1]!.changes).toEqual([{ studentMembershipId: ids.pAM!, from: "PRESENT", to: "ABSENT" }]);
    // No name, no note: the row holds ids and the coded marks alone.
    expect(JSON.stringify(rows[1])).not.toContain("ZZ TA285");
  });
});

describe("TA-285: what the register's read says, and reading is unchanged", () => {
  it("TA-285: the read says a day past the window is closed to the class teacher and open to the office", async () => {
    const teacher = await as("teacher", "TEACHER");
    const closed = await registerFor(teacher, ids.kTeacher!, OLD);
    expect({ closed: closed.closed, readOnly: closed.readOnly }).toEqual({ closed: true, readOnly: false });
    expect((await registerFor(teacher, ids.kTeacher!, EDGE)).closed).toBe(false);
    const office = await as("office", "ADMIN");
    expect((await registerFor(office, ids.kTeacher!, OLD)).closed).toBe(false);
    const cover = await as("cover", "TEACHER");
    expect((await registerFor(cover, ids.kCover!, OLD)).closed).toBe(true);
  });

  it("TA-285: the class teacher still reads a day past the window", async () => {
    await as("teacher", "TEACHER");
    const read = await getRegisterDoor(new Request(`http://localhost/api/attendance?classId=${ids.kTeacher}&date=${OLD}`));
    expect(read.status).toBe(200);
    expect(JSON.stringify(await read.json())).toContain(ids.pAM!);
  });

  it("TA-285: the web's register page draws a closed day read-only for whoever the window holds", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/(app)/teacher/attendance/page.tsx"), "utf8");
    expect(page).toContain("registerClosedFor(duty");
    expect(page).toMatch(/readOnly=\{dateKey > today \|\| closed\}/);
    expect(page).toContain("attendance.registerClosed");
  });

  it("TA-285: the window is fourteen days, closed to a teacher or cover the day after and never to the office", () => {
    expect(REGISTER_CORRECTION_DAYS).toBe(14);
    expect(registerClosedFor({ reason: "CLASS_TEACHER" }, "2026-11-01", "2026-11-15")).toBe(false);
    expect(registerClosedFor({ reason: "CLASS_TEACHER" }, "2026-10-31", "2026-11-15")).toBe(true);
    expect(registerClosedFor({ reason: "COVER" }, "2026-10-31", "2026-11-15")).toBe(true);
    expect(registerClosedFor({ reason: "ADMIN" }, "2020-01-08", "2026-11-15")).toBe(false);
  });

  it("TA-285: the closing sentence is in English, Hindi (danda) and Marathi (full stop), with the number of days", () => {
    for (const s of [en.attendance.registerClosed, hi.attendance.registerClosed, mr.attendance.registerClosed]) expect(s).toContain(String(REGISTER_CORRECTION_DAYS));
    expect(hi.attendance.registerClosed.endsWith("।")).toBe(true);
    expect(mr.attendance.registerClosed.endsWith(".")).toBe(true);
  });
});
