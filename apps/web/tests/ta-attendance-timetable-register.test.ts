/**
 * The class register, five findings of the testing analysis of 13 November 2026 (attendance-timetable batch):
 *
 *   TA-029  The device's clock decided which mark stood: a mark stamped a day ahead could not be corrected by
 *           anybody, and the correction was answered 200 with skipped 1.
 *   TA-028  A pupil's own absence note silenced the absence notice to their guardians.
 *   TA-545  An absence note could be replaced after the register had marked the pupil, by a different filer.
 *   TA-032  A register only an attendance device had started was shown to its teacher as taken.
 *   TA-031  A principal named as register cover was refused by the register's door (403) while registerDuty said yes.
 *
 * One ZZ school of this suite's own, made here and removed after: a class teacher, a principal, a pupil with two
 * guardians, and classmates for each case, so no case reads a row another made.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { saveAttendanceBatch } from "@/lib/attendance";
import { fileAbsenceNote } from "@/lib/absence-notes";
import { attendanceClasses, staffClasses, staffToday } from "@/lib/api-reads/staff";
import { registerDuty } from "@/lib/register-duty";
import { POST as postRegister, GET as getRegisterDoor } from "@/app/api/attendance/route";
import { todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-taatt-reg-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const TODAY = todayKey(TZ);

type Staff = ActiveContext & { role: NonNullable<ActiveContext["role"]>; schoolId: string; membershipId: string };

async function as(who: string, role: string, schoolId: string | null = ids.school!): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function user(who: string): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TAATT ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  return ids[who]!;
}

async function member(who: string, role: string, extra: Record<string, string> = {}): Promise<string> {
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role: role as never, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

/** A class of its own, with its teacher as the LEAD who may take the register, and these pupils enrolled. */
async function classWith(name: string, pupils: string[]): Promise<string> {
  const id = (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ TAATT ${name}`, gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: ids.school!, classId: id, teacherMembershipId: ids.teacherM!, role: "LEAD", canTakeAttendance: true } });
  await db.enrollment.createMany({ data: pupils.map((p) => ({ schoolId: ids.school!, classId: id, studentMembershipId: ids[`${p}M`]!, status: "ACTIVE" as const })) });
  return id;
}

async function pupil(who: string): Promise<string> {
  await user(who);
  return member(who, "STUDENT", { studentCode: `ZT${who}${String(STAMP).slice(-6)}`, gradeLevel: "6" });
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAATT Register School ${STAMP}`, slug: `zz-taatt-reg-${STAMP}`, code: `ZTR${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await user("teacher");
  await member("teacher", "TEACHER");
  await user("head");
  await member("head", "PRINCIPAL");
  await user("mum");
  await user("dad");
  for (const p of ["p029", "p028", "p545", "p032", "p031"]) await pupil(p);
  for (const p of ["p028", "p545"]) {
    await db.guardianship.createMany({
      data: [
        { parentUserId: ids.mum!, studentMembershipId: ids[`${p}M`]!, studentSchoolId: ids.school!, status: "ACTIVE", relation: "PARENT" },
        { parentUserId: ids.dad!, studentMembershipId: ids[`${p}M`]!, studentSchoolId: ids.school!, status: "ACTIVE", relation: "PARENT" },
      ],
    });
  }
  ids.k029 = await classWith("029", ["p029"]);
  ids.k028 = await classWith("028", ["p028"]);
  ids.k545 = await classWith("545", ["p545"]);
  ids.k032 = await classWith("032", ["p032"]);
  // TA-031's class has a teacher of its own on the register; the head is named as cover for today.
  ids.k031 = await classWith("031", ["p031"]);
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-taatt-reg-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
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

const statusOf = async (classId: string, pupilKey: string) =>
  (await db.attendanceRecord.findFirst({ where: { schoolId: ids.school!, studentMembershipId: ids[`${pupilKey}M`]!, session: { classId, dateKey: TODAY } }, select: { status: true } }))?.status ?? null;

describe("TA-029: the device's clock and the mark that stands", () => {
  it("TA-029: a mark stamped a day ahead is corrected by a later save stamped now", async () => {
    const ahead = new Date(Date.now() + 86_400_000).toISOString();
    const first = await saveAttendanceBatch({
      schoolId: ids.school!, classId: ids.k029!, dateKey: TODAY, takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!, notify: false,
      marks: [{ studentMembershipId: ids.p029M!, status: "ABSENT", clientId: `zz-taatt-029-a-${STAMP}`, markedAt: ahead }],
    });
    expect(first.applied).toBe(1);
    const correction = await saveAttendanceBatch({
      schoolId: ids.school!, classId: ids.k029!, dateKey: TODAY, takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!, notify: false,
      marks: [{ studentMembershipId: ids.p029M!, status: "LATE", clientId: `zz-taatt-029-b-${STAMP}`, markedAt: new Date().toISOString() }],
    });
    expect({ applied: correction.applied, skipped: correction.skipped }).toEqual({ applied: 1, skipped: 0 });
    expect(await statusOf(ids.k029!, "p029")).toBe("LATE");
  });
});

describe("TA-028: a pupil's own note and the guardians' notice", () => {
  it("TA-028: the pupil files a note for today, the register marks them absent, and each guardian is still told", async () => {
    const pupilCtx = await as("p028", "STUDENT");
    await fileAbsenceNote(pupilCtx, ids.p028M!, { dateKey: TODAY, reason: "ILLNESS", text: "" });
    const before = await db.notification.count({ where: { userId: { in: [ids.mum!, ids.dad!] }, kind: "ATTENDANCE" } });
    const saved = await saveAttendanceBatch({
      schoolId: ids.school!, classId: ids.k028!, dateKey: TODAY, takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!,
      marks: [{ studentMembershipId: ids.p028M!, status: "ABSENT", clientId: `zz-taatt-028-${STAMP}` }],
    });
    expect(saved.applied).toBe(1);
    const told = await db.notification.findMany({ where: { userId: { in: [ids.mum!, ids.dad!] }, kind: "ATTENDANCE" }, select: { userId: true } });
    expect(told.length - before).toBe(2);
    expect(new Set(told.map((n) => n.userId))).toEqual(new Set([ids.mum!, ids.dad!]));
  });
});

describe("TA-545: a guardian's note once the register has marked the pupil", () => {
  it("TA-545: the pupil cannot replace the guardian's note after the marking, and the guardian's reason stands", async () => {
    const mum = await as("mum", "PARENT", null);
    await fileAbsenceNote(mum, ids.p545M!, { dateKey: TODAY, reason: "ILLNESS", text: "" });
    await saveAttendanceBatch({
      schoolId: ids.school!, classId: ids.k545!, dateKey: TODAY, takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!, notify: false,
      marks: [{ studentMembershipId: ids.p545M!, status: "ABSENT", clientId: `zz-taatt-545-${STAMP}` }],
    });
    const pupilCtx = await as("p545", "STUDENT");
    let refused = "";
    try {
      await fileAbsenceNote(pupilCtx, ids.p545M!, { dateKey: TODAY, reason: "OTHER", text: "" });
    } catch (error) {
      refused = (error as { key?: string }).key ?? String(error);
    }
    expect(refused).not.toBe("");
    const note = await db.absenceNote.findFirstOrThrow({ where: { schoolId: ids.school!, studentMembershipId: ids.p545M!, dateKey: TODAY }, select: { reason: true, authorRole: true, authorUserId: true } });
    expect(note).toEqual({ reason: "ILLNESS", authorRole: "PARENT", authorUserId: ids.mum! });
    // Nor its own author, once the day is marked: the note is part of what happened.
    const mumAgain = await as("mum", "PARENT", null);
    await expect(fileAbsenceNote(mumAgain, ids.p545M!, { dateKey: TODAY, reason: "FAMILY", text: "" })).rejects.toMatchObject({ key: "familyCare.absenceAlreadyMarked" });
  });

  it("TA-545: a second guardian does not take over the first guardian's note", async () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const day = todayKey(TZ, tomorrow);
    const mum = await as("mum", "PARENT", null);
    await fileAbsenceNote(mum, ids.p545M!, { dateKey: day, reason: "FAMILY", text: "" });
    const dad = await as("dad", "PARENT", null);
    await expect(fileAbsenceNote(dad, ids.p545M!, { dateKey: day, reason: "OTHER", text: "" })).rejects.toMatchObject({ key: "familyCare.absenceNoteSomeoneElse" });
    const note = await db.absenceNote.findFirstOrThrow({ where: { schoolId: ids.school!, studentMembershipId: ids.p545M!, dateKey: day }, select: { reason: true, authorUserId: true } });
    expect(note).toEqual({ reason: "FAMILY", authorUserId: ids.mum! });
    // Its own author may still change it.
    const mumAgain = await as("mum", "PARENT", null);
    await fileAbsenceNote(mumAgain, ids.p545M!, { dateKey: day, reason: "RELIGIOUS", text: "" });
    expect((await db.absenceNote.findFirstOrThrow({ where: { schoolId: ids.school!, studentMembershipId: ids.p545M!, dateKey: day }, select: { reason: true } })).reason).toBe("RELIGIOUS");
  });
});

describe("TA-032: a register an attendance device started", () => {
  it("TA-032: after a pupil's punch the class teacher's readers say the register is still to take", async () => {
    // What a punch does (attendance-devices.ts): the day's session with no taker and one PRESENT mark.
    await saveAttendanceBatch({
      schoolId: ids.school!, classId: ids.k032!, dateKey: TODAY, takenByMembershipId: null, actorUserId: null, notify: false,
      marks: [{ studentMembershipId: ids.p032M!, status: "PRESENT", clientId: `zz-taatt-032-${STAMP}`, markedAt: new Date().toISOString() }],
    });
    const teacher = (await as("teacher", "TEACHER")) as Staff;
    const classes = await attendanceClasses(teacher, TODAY);
    expect(classes.classes.find((k) => k.id === ids.k032)?.taken).toBe(false);
    const list = await staffClasses(teacher);
    expect(list.classes.find((k) => k.id === ids.k032)?.registerTaken).toBe(false);
    const today = await staffToday(teacher);
    expect(today.formClasses?.classes.find((k) => k.id === ids.k032)?.registerTaken).toBe(false);
  }, 60_000);
});

describe("TA-031: a principal named as register cover", () => {
  it("TA-031: the register's door lets the covering principal read and mark the register, as registerDuty says", async () => {
    await db.attendanceCover.create({ data: { schoolId: ids.school!, classId: ids.k031!, coveringMembershipId: ids.headM!, fromDateKey: TODAY, toDateKey: TODAY, reason: "ZZ TA-031", createdByMembershipId: ids.headM! } });
    const head = await as("head", "PRINCIPAL");
    expect(await registerDuty(head, ids.k031!, TODAY)).toMatchObject({ may: true, reason: "COVER" });

    const read = await getRegisterDoor(new Request(`http://localhost/api/attendance?classId=${ids.k031}&date=${TODAY}`));
    expect(read.status).toBe(200);
    const res = await postRegister(
      new Request("http://localhost/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classId: ids.k031, dateKey: TODAY, marks: [{ studentMembershipId: ids.p031M, status: "PRESENT", clientId: `zz-taatt-031-${STAMP}`, markedAt: new Date().toISOString() }] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await statusOf(ids.k031!, "p031")).toBe("PRESENT");
  });

  it("TA-031: a principal with no cover is still refused the register", async () => {
    await as("head", "PRINCIPAL");
    const res = await postRegister(
      new Request("http://localhost/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classId: ids.k032, dateKey: TODAY, marks: [{ studentMembershipId: ids.p032M, status: "ABSENT", clientId: `zz-taatt-031-no-${STAMP}`, markedAt: new Date().toISOString() }] }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
