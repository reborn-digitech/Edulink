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

const EMAILS = ["p1.promo.unit@riverside.test", "p2.promo.unit@riverside.test", "p3.promo.unit@riverside.test", "p4.promo.unit@riverside.test", "p5.promo.unit@riverside.test", "p6.promo.unit@riverside.test", "p7.promo.unit@riverside.test"];
const CODES = ["ZZZ-PRM4", "ZZZ-PRM5", "ZZZ-PRMX", "ZZZ-PRM8A", "ZZZ-PRM8B"];

let riversideId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let four: string;
let fiveExisting: string;
let ten: string;
let eightA: string;
let eightB: string;
let pupils: string[] = [];
let previousGradeHigh: string | null = null;
let madeYearId: string | null = null;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;
  previousGradeHigh = riverside.gradeHigh;
  await db.school.update({ where: { id: riversideId }, data: { gradeHigh: "10" } });
  // The certificate's serial names the academic year that covers the leaving
  // day. The seed gives Riverside no year (a laptop's Riverside has one from
  // using the app; CI's fresh database does not), so the year this suite
  // leaves pupils in is made here when it is missing — not current, so no
  // other suite's idea of Riverside's year moves — and removed afterwards.
  const covering = await db.academicYear.findFirst({
    where: { schoolId: riversideId, startDate: { lte: new Date("2027-04-30T00:00:00Z") }, endDate: { gte: new Date("2027-04-30T00:00:00Z") } },
    select: { id: true },
  });
  if (!covering) {
    madeYearId = (await db.academicYear.create({
      data: { schoolId: riversideId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: false },
      select: { id: true },
    })).id;
  }

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
  eightA = await mk(CODES[3]!, "ZZ Promo 8A", "8");
  eightB = await mk(CODES[4]!, "ZZ Promo 8B", "8");

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
  await enrol(eightA, pupils[4]!);
  await enrol(eightA, pupils[5]!);
  await enrol(eightB, pupils[6]!);
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
  if (madeYearId) await db.academicYear.delete({ where: { id: madeYearId } });
  await db.$disconnect();
});

describe("the arithmetic of a grade", () => {
  it("counts numbers and leaves words alone", () => {
    expect(nextGrade("5")).toBe("6");
    expect(nextGrade("10")).toBe("11");
    expect(nextGrade(null)).toBeNull();
    // A word grade climbs the school's own ladder, never arithmetic.
    expect(nextGrade("K")).toBeNull();
    expect(nextGrade("K", ["K", "1", "2"])).toBe("1");
    expect(nextGrade("LKG", ["Nursery", "LKG", "UKG", "1"])).toBe("UKG");
    expect(nextGrade("UKG", ["LKG", "UKG", "1"])).toBe("1");
    expect(nextGrade("Playgroup", ["Playgroup"])).toBeNull();
    expect(nextGrade("5", ["K", "1", "5", "7"])).toBe("6");
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
    // The existing 5 already holds a pupil, so 4 is offered it but NOT
    // suggested it — a full class is last year's cohort, not next year's room.
    expect(rowFour.candidates).toContainEqual({ id: fiveExisting, name: "ZZ Promo 5", section: "A", pupils: 1 });
    if (rowFour.candidates.some((c) => c.pupils === 0)) {
      expect(rowFour.suggested).toMatchObject({ kind: "CLASS" });
      expect(rowFour.suggested).not.toEqual({ kind: "CLASS", classId: fiveExisting });
    } else {
      // "ZZ Promo 5" is taken by the full class, so the fresh one wears the year.
      expect(rowFour.suggested).toMatchObject({ kind: "NEW", gradeLevel: "5" });
      expect((rowFour.suggested as { name: string }).name).toMatch(/^ZZ Promo 5 \(/);
    }
    // Riverside's seed may or may not already hold a grade 6; either way the
    // suggestion follows from it.
    if (rowFive.candidates.some((c) => c.pupils === 0)) {
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
    // Moved up: not a repeater in the class they arrived in.
    expect((await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupils[0], classId: fiveExisting } })).repeating).toBe(false);

    // p2 was held back: still active in 4, nowhere else.
    const p2 = await db.enrollment.findMany({ where: { studentMembershipId: pupils[1] } });
    expect(p2).toHaveLength(1);
    // …and marked as repeating it, which is what the filing reads for "class studied last year".
    expect(p2[0]).toMatchObject({ classId: four, status: "ACTIVE", repeating: true });

    // p3 went 5 → the new 6, which carried the section.
    const six = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 6" } });
    expect(six).toMatchObject({ gradeLevel: "6", section: "A", archivedAt: null });
    const p3 = await db.enrollment.findFirst({ where: { studentMembershipId: pupils[2], classId: six.id } });
    expect(p3).toMatchObject({ status: "ACTIVE" });

    // p4 graduated: recorded as left, on the given day — and the certificate
    // names the class they graduated FROM, although that enrolment was closed
    // a moment before the certificate was written.
    const p4 = await db.membership.findUniqueOrThrow({ where: { id: pupils[3] } });
    expect(p4.leftAt).not.toBeNull();
    expect(p4.leftAt?.toISOString().slice(0, 10)).toBe("2027-04-30");
    const tc = await db.schoolRecord.findUniqueOrThrow({ where: { studentMembershipId: pupils[3]! } });
    expect(tc.className).toBe("ZZ Promo 10 A");
    // The serial carries the academic year that covers the leaving day, as every other paper does (school-record.ts nextSerial).
    expect(tc.serial).toMatch(/^TC\/2026–27\//);

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

describe("sections and streams", () => {
  it("⚠ splits one class into two new sections and merges another into one of them, by key", async () => {
    // 8A's two pupils: one to the new 9A, one reassigned to the new 9B.
    // 8B's pupil goes to 9B too — the SAME key, so one class is made, not two.
    const result = await promoteSchool(admin, [
      {
        fromClassId: eightA,
        to: { kind: "NEW", key: "9A", name: "ZZ Promo 9A", gradeLevel: "9", section: "A" },
        holdBack: [],
        reassign: [{ membershipId: pupils[5]!, to: { kind: "NEW", key: "9B", name: "ZZ Promo 9B", gradeLevel: "9", section: "B" } }],
      },
      {
        fromClassId: eightB,
        to: { kind: "NEW", key: "9B", name: "ignored — first naming wins", gradeLevel: "9", section: "B" },
        holdBack: [],
      },
    ]);
    expect(result).toMatchObject({ ok: true, moved: 3, created: 2, archived: 2, heldBack: 0 });

    const nineA = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 9A", archivedAt: null } });
    const nineB = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 9B", archivedAt: null } });
    expect(nineA).toMatchObject({ gradeLevel: "9", section: "A" });
    expect(nineB).toMatchObject({ gradeLevel: "9", section: "B" });
    expect(await db.class.count({ where: { schoolId: riversideId, name: { startsWith: "ZZ Promo 9" }, archivedAt: null } })).toBe(2);

    const where = (id: string) => db.enrollment.findFirstOrThrow({ where: { studentMembershipId: id, status: "ACTIVE" }, select: { classId: true } });
    expect((await where(pupils[4]!)).classId).toBe(nineA.id);
    expect((await where(pupils[5]!)).classId).toBe(nineB.id); // the split
    expect((await where(pupils[6]!)).classId).toBe(nineB.id); // the merge
  });

  it("⚠ a new class nobody lands in is never created — a STAY class can still send one pupil on", async () => {
    // 9A (from the split above) stays; its one pupil is sent to a NEW 10 stream.
    const nineA = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 9A", archivedAt: null } });
    const nineB = await db.class.findFirstOrThrow({ where: { schoolId: riversideId, name: "ZZ Promo 9B", archivedAt: null } });
    const before = await db.class.count({ where: { schoolId: riversideId, name: { startsWith: "ZZ Promo 10" }, archivedAt: null } });
    const result = await promoteSchool(admin, [
      {
        fromClassId: nineA.id,
        to: { kind: "STAY" },
        holdBack: [],
        reassign: [{ membershipId: pupils[4]!, to: { kind: "NEW", key: "sci", name: "ZZ Promo 10 Science", gradeLevel: "10", section: "Sci" } }],
      },
      {
        // 9B says NEW, but its only pupil is reassigned into the same stream — so "ZZ Promo 10 B" must NOT be made.
        fromClassId: nineB.id,
        to: { kind: "NEW", key: "10B", name: "ZZ Promo 10 B", gradeLevel: "10", section: "B" },
        holdBack: [],
        reassign: [{ membershipId: pupils[5]!, to: { kind: "NEW", key: "sci", name: "ignored", gradeLevel: "10" } }, { membershipId: pupils[6]!, to: { kind: "NEW", key: "sci", name: "ignored", gradeLevel: "10" } }],
      },
    ]);
    expect(result).toMatchObject({ ok: true, moved: 3, created: 1 });
    expect(await db.class.count({ where: { schoolId: riversideId, name: { startsWith: "ZZ Promo 10" }, archivedAt: null } })).toBe(before + 1);
    expect(await db.class.count({ where: { schoolId: riversideId, name: "ZZ Promo 10 B" } })).toBe(0);
    // 9A stayed (STAY, empty now but not archived); 9B emptied and went.
    expect((await db.class.findUniqueOrThrow({ where: { id: nineA.id } })).archivedAt).toBeNull();
    expect((await db.class.findUniqueOrThrow({ where: { id: nineB.id } })).archivedAt).not.toBeNull();
  });

  it("⚠ a pupil cannot be both held back and reassigned", async () => {
    await expect(
      promoteSchool(admin, [
        {
          fromClassId: four,
          to: { kind: "LEAVE" },
          holdBack: [pupils[1]!],
          reassign: [{ membershipId: pupils[1]!, to: { kind: "LEAVE" } }],
        },
      ]),
    ).rejects.toMatchObject({ key: "access.aPupilHeldBackCannotAlsoMove" });
  });
});

describe("the summary the admin reads afterwards", () => {
  it("⚠ names every count in every language — a battery once found it overwritten by another page's sentence", async () => {
    const { DICTIONARIES } = await import("@/lib/i18n/dictionary");
    for (const [locale, dict] of Object.entries(DICTIONARIES)) {
      const body = (dict as { promotion: { doneBody: string } }).promotion.doneBody;
      for (const v of ["{moved}", "{left}", "{held}", "{created}", "{archived}"]) {
        expect(body, `${locale} promotion.doneBody`).toContain(v);
      }
    }
  });
});
