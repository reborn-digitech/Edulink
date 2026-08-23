import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { nextClassName, nextGrade, promoteSchool, promotionPlan } from "@/lib/promotion";
import type { ActiveContext } from "@/lib/session";

/**
 * The year-end move. Three classes of this suite's own in Riverside: a 4
 * that goes up into an existing 5, a 5 that goes up into a class made on the
 * spot, and a 10 at the school's top grade that leaves. One pupil is held
 * back. Everything is checked on the rows afterwards: old enrolments closed
 * and dated, new ones active, the emptied classes archived, the graduate
 * recorded as having left with a certificate, the repeater untouched.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

const EMAILS = ["p1.promo.unit@riverside.test", "p2.promo.unit@riverside.test", "p3.promo.unit@riverside.test", "p4.promo.unit@riverside.test"];
const CODES = ["ZZZ-PRM4", "ZZZ-PRM5", "ZZZ-PRMX"];

let riversideId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let four: string;
let fiveExisting: string;
let ten: string;
let pupils: string[] = [];
let previousGradeHigh: string | null = null;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;
  previousGradeHigh = riverside.gradeHigh;
  await db.school.update({ where: { id: riversideId }, data: { gradeHigh: "10" } });

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" } });
  const tomTeacher = await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId: riversideId, role: "TEACHER" });

  const mk = async (code: string, name: string, grade: string) =>
    (await db.class.upsert({
      where: { joinCode: code },
      create: { schoolId: riversideId, name, gradeLevel: grade, section: "A", joinCode: code },
      update: { archivedAt: null },
    })).id;
  four = await mk(CODES[0]!, "ZZ Promo 4", "4");
  fiveExisting = await mk(CODES[1]!, "ZZ Promo 5", "5");
  ten = await mk(CODES[2]!, "ZZ Promo 10", "10");

  pupils = [];
  for (const email of EMAILS) {
    const user =
      (await db.user.findUnique({ where: { email } })) ??
      (await db.user.create({ data: { email, name: `ZZ ${email.split(".")[0]}`, prefs: "{}" } }));
    const m = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId: riversideId, role: "STUDENT" } },
      create: { userId: user.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
      update: { status: "ACTIVE", leftAt: null },
    });
    pupils.push(m.id);
  }
  // p1, p2 in 4; p3 in the existing 5 (already there, stays by its own move); p4 in 10.
  const enrol = (classId: string, studentMembershipId: string) =>
    db.enrollment.upsert({
      where: { classId_studentMembershipId: { classId, studentMembershipId } },
      create: { classId, schoolId: riversideId, studentMembershipId, status: "ACTIVE" },
      update: { status: "ACTIVE", removedAt: null },
    });
  await enrol(four, pupils[0]!);
  await enrol(four, pupils[1]!);
  await enrol(fiveExisting, pupils[2]!);
  await enrol(ten, pupils[3]!);
});

afterAll(async () => {
  await db.school.update({ where: { id: riversideId }, data: { gradeHigh: previousGradeHigh } });
  const made = await db.class.findMany({ where: { schoolId: riversideId, name: { startsWith: "ZZ Promo" } }, select: { id: true } });
  const ids = made.map((c) => c.id);
  await db.enrollment.deleteMany({ where: { classId: { in: ids } } });
  await db.classTeacher.deleteMany({ where: { classId: { in: ids } } });
  await db.notification.deleteMany({ where: { user: { email: { in: EMAILS } } } });
  await db.schoolRecord.deleteMany({ where: { studentMembershipId: { in: pupils } } });
  await db.membership.deleteMany({ where: { user: { email: { in: EMAILS } } } });
  await db.user.deleteMany({ where: { email: { in: EMAILS } } });
  await db.class.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

describe("the arithmetic of a grade", () => {
  it("counts numbers and leaves words alone", () => {
    expect(nextGrade("5")).toBe("6");
    expect(nextGrade("10")).toBe("11");
    expect(nextGrade("K")).toBeNull();
    expect(nextGrade(null)).toBeNull();
  });
  it("renames the first grade number in a class name", () => {
    expect(nextClassName("Class 5", "5", "6")).toBe("Class 6");
    expect(nextClassName("ZZ Grade 5 · A", "5", "6")).toBe("ZZ Grade 6 · A");
    expect(nextClassName("Sunflower", "5", "6")).toBe("Sunflower");
    // "15" is not "5": only a whole number is the grade.
    expect(nextClassName("Room 15, Grade 5", "5", "6")).toBe("Room 15, Grade 6");
  });
});

describe("the plan", () => {
  it("suggests the existing class up, a new class, and leaving from the top grade", async () => {
    const plan = await promotionPlan(admin);
    const rowFour = plan.find((p) => p.id === four)!;
    const rowFive = plan.find((p) => p.id === fiveExisting)!;
    const rowTen = plan.find((p) => p.id === ten)!;
    expect(rowFour.suggested).toEqual({ kind: "CLASS", classId: fiveExisting });
    // Riverside's seed may or may not already hold a grade 6; either way the
    // suggestion follows from it.
    if (rowFive.candidates.length > 0) {
      expect(rowFive.suggested).toMatchObject({ kind: "CLASS" });
    } else {
      expect(rowFive.suggested).toMatchObject({ kind: "NEW", name: "ZZ Promo 6", gradeLevel: "6" });
    }
    expect(rowTen.suggested).toEqual({ kind: "LEAVE" });
    expect(rowFour.pupils).toHaveLength(2);
  });

  it("⚠ is the admin's alone", async () => {
    await expect(promotionPlan(teacher)).rejects.toBeInstanceOf(AccessError);
    await expect(promoteSchool(teacher, [{ fromClassId: four, to: { kind: "LEAVE" }, holdBack: [] }])).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the move", () => {
  it("moves, creates, holds back, graduates and archives — and nothing is deleted", async () => {
    const result = await promoteSchool(
      admin,
      [
        { fromClassId: four, to: { kind: "CLASS", classId: fiveExisting }, holdBack: [pupils[1]!] },
        { fromClassId: fiveExisting, to: { kind: "NEW", name: "ZZ Promo 6", gradeLevel: "6" }, holdBack: [] },
        { fromClassId: ten, to: { kind: "LEAVE" }, holdBack: [] },
      ],
      { lastDayKey: "2027-04-30" },
    );
    expect(result).toMatchObject({ ok: true, moved: 2, left: 1, heldBack: 1, created: 1, archived: 1 });

    // p1 went 4 → 5: old row closed and dated, new row active.
    const p1 = await db.enrollment.findMany({ where: { studentMembershipId: pupils[0] }, select: { classId: true, status: true, removedAt: true } });
    expect(p1.find((e) => e.classId === four)).toMatchObject({ status: "REMOVED" });
    expect(p1.find((e) => e.classId === four)?.removedAt).not.toBeNull();
    expect(p1.find((e) => e.classId === fiveExisting)).toMatchObject({ status: "ACTIVE" });

    // p2 was held back: still active in 4, nowhere else.
    const p2 = await db.enrollment.findMany({ where: { studentMembershipId: pupils[1] } });
    expect(p2).toHaveLength(1);
    expect(p2[0]).toMatchObject({ classId: four, status: "ACTIVE" });

    // p3 went 5 → the new 6, which carried the section.
    const six = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 6" } });
    expect(six).toMatchObject({ gradeLevel: "6", section: "A", archivedAt: null });
    const p3 = await db.enrollment.findFirst({ where: { studentMembershipId: pupils[2], classId: six.id } });
    expect(p3).toMatchObject({ status: "ACTIVE" });

    // p4 graduated: recorded as left, on the given day.
    const p4 = await db.membership.findUniqueOrThrow({ where: { id: pupils[3] } });
    expect(p4.leftAt).not.toBeNull();
    expect(p4.leftAt?.toISOString().slice(0, 10)).toBe("2027-04-30");

    // 4 kept its repeater, so it stays; 10 emptied, so it is archived; the
    // existing 5 sent its old roll on to 6 but RECEIVED p1, so it is next
    // year's class and must not be archived.
    const classes = await db.class.findMany({ where: { id: { in: [four, fiveExisting, ten] } }, select: { id: true, archivedAt: true } });
    expect(classes.find((c) => c.id === four)?.archivedAt).toBeNull();
    expect(classes.find((c) => c.id === ten)?.archivedAt).not.toBeNull();
    expect(classes.find((c) => c.id === fiveExisting)?.archivedAt).toBeNull();
  });

  it("⚠ refuses a class moving into itself and an empty plan", async () => {
    await expect(promoteSchool(admin, [])).rejects.toBeInstanceOf(AccessError);
    await expect(
      promoteSchool(admin, [{ fromClassId: four, to: { kind: "CLASS", classId: four }, holdBack: [] }]),
    ).rejects.toBeInstanceOf(AccessError);
  });
});
