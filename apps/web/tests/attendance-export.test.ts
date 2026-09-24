import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerExport } from "@/lib/attendance-export";
import { attendanceHistory } from "@/lib/attendance-history";
import { parseCsvRecords } from "@/lib/csv";
import type { ActiveContext } from "@/lib/session";

/**
 * The register CSV and the month grid read a past month for who was in it,
 * not for who is on today's roll. The class here has been promoted and
 * archived — every enrolment REMOVED — and one child left mid-month; both
 * still export with their days. A child enrolled after the month has no row,
 * and a register taken with no marks is a blank day, not a 0 % one.
 */

const db = new PrismaClient();
const MONTH = "2031-05";
const DAY_ONE = "2031-05-04";
const DAY_TWO = "2031-05-06";
const DAY_EMPTY = "2031-05-08";
const JOIN_CODE = "ZZZ-EXPT";
const EMAILS = {
  promoted: "zz.promoted.export@riverside.test",
  leaver: "zz.leaver.export@riverside.test",
  later: "zz.later.export@riverside.test",
};

let schoolId: string;
let classId: string;
let admin: ActiveContext;
const ids: Record<keyof typeof EMAILS, string> = { promoted: "", leaver: "", later: "" };

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } });
  admin = {
    sessionId: "test-session",
    membershipId: priyaAdmin.id,
    schoolId,
    role: "ADMIN",
    user: {
      id: priya.id,
      name: "Priya",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };

  const klass = await db.class.upsert({
    where: { joinCode: JOIN_CODE },
    create: { schoolId, name: "ZZ Export Test Class", gradeLevel: "4", joinCode: JOIN_CODE, archivedAt: new Date("2031-06-15T00:00:00Z") },
    update: { archivedAt: new Date("2031-06-15T00:00:00Z") },
  });
  classId = klass.id;

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const user = await db.user.create({ data: { email: EMAILS[key], name: `ZZ ${key} Export`, prefs: "{}" } });
    const membership = await db.membership.create({
      data: {
        userId: user.id,
        schoolId,
        role: "STUDENT",
        status: "ACTIVE",
        studentCode: `ZZX-${key.toUpperCase()}`,
        leftAt: key === "leaver" ? new Date("2031-05-15T00:00:00Z") : null,
      },
    });
    ids[key] = membership.id;
  }

  await db.enrollment.createMany({
    data: [
      // Promoted out in June: REMOVED, but live for all of May.
      { classId, schoolId, studentMembershipId: ids.promoted, status: "REMOVED", enrolledAt: new Date("2030-06-01T00:00:00Z"), removedAt: new Date("2031-06-15T00:00:00Z") },
      // Left the school on the 15th.
      { classId, schoolId, studentMembershipId: ids.leaver, status: "REMOVED", enrolledAt: new Date("2030-06-01T00:00:00Z"), removedAt: new Date("2031-05-15T00:00:00Z") },
      // Joined the class after the month: no row in May.
      { classId, schoolId, studentMembershipId: ids.later, status: "ACTIVE", enrolledAt: new Date("2031-06-02T00:00:00Z") },
    ],
  });

  const marks: Record<string, [string, string][]> = {
    [DAY_ONE]: [[ids.promoted, "PRESENT"], [ids.leaver, "ABSENT"]],
    [DAY_TWO]: [[ids.promoted, "LATE"]],
    [DAY_EMPTY]: [],
  };
  for (const [dateKey, rows] of Object.entries(marks)) {
    await db.attendanceSession.create({
      data: {
        schoolId,
        classId,
        dateKey,
        records: { create: rows.map(([studentMembershipId, status]) => ({ schoolId, studentMembershipId, status })) },
      },
    });
  }
});

afterAll(async () => {
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.auditLog.deleteMany({ where: { schoolId, targetType: "Class", targetId: classId } });
  await db.class.deleteMany({ where: { id: classId } });
  const emails = Object.values(EMAILS);
  await db.membership.deleteMany({ where: { user: { email: { in: emails } } } });
  await db.user.deleteMany({ where: { email: { in: emails } } });
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  await db.$disconnect();
});

describe("a past month of a promoted class", () => {
  it("the register CSV still lists its pupils with their days, the leaver among them", async () => {
    const file = await registerExport({ schoolId, user: { id: admin.user.id } }, classId, MONTH);
    expect(file).not.toBeNull();
    const { records } = parseCsvRecords(file!.csv);
    const [headers = [], ...body] = records;
    expect(headers).toEqual(["student_code", "name", DAY_ONE, DAY_TWO, DAY_EMPTY, "days_present", "days_marked"]);
    const rows = body.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])) as Record<string, string>);

    expect(rows.map((r) => r.student_code)).toEqual(["ZZX-LEAVER", "ZZX-PROMOTED"]);
    expect(rows[1]).toMatchObject({ [DAY_ONE]: "P", [DAY_TWO]: "L", [DAY_EMPTY]: "", days_present: "2", days_marked: "2" });
    expect(rows[0]).toMatchObject({ [DAY_ONE]: "A", [DAY_TWO]: "", days_present: "0", days_marked: "1" });
    expect(file!.rows).toBe(2);
  });

  it("the month grid lists the same roll and a blank day for the empty register", async () => {
    const history = await attendanceHistory(admin, classId, MONTH);
    expect(history.class.archived).toBe(true);
    expect(history.pupils.map((p) => p.membershipId)).toEqual([ids.leaver, ids.promoted]);
    expect(history.days.map((d) => d.dateKey)).toEqual([DAY_ONE, DAY_TWO, DAY_EMPTY]);
    expect(history.days[0]!.percent).toBe(50);
    expect(history.days[1]!.percent).toBe(100);
    expect(history.days[2]).toMatchObject({ present: 0, late: 0, absent: 0, excused: 0, percent: null });

    const leaver = history.pupils.find((p) => p.membershipId === ids.leaver)!;
    expect(leaver.marks).toEqual({ [DAY_ONE]: "ABSENT" });
    expect(leaver.percent).toBe(0);
    expect(history.percent).toBe(67);
  });

  it("the month after, with the leaver gone and the later pupil in, is a different roll", async () => {
    const history = await attendanceHistory(admin, classId, "2031-06");
    expect(history.days).toEqual([]);
    expect(history.pupils.map((p) => p.membershipId)).toEqual([ids.later, ids.promoted]);
  });
});
