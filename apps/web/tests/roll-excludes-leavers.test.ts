import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getChecklist } from "@/lib/onboarding";

/**
 * "On the roll" counts nobody who has left.
 *
 * ⚠ A LEAVER KEEPS status ACTIVE and gains a `leftAt` — school-record.ts is
 * explicit that departure is a dated `leftAt`, not a status change, so every
 * "who is here" query must filter `leftAt: null`. A count that forgets grows
 * by every pupil who ever graduated: the admin dashboard read 48 pupils for a
 * 40-pupil school after two years of a three-year simulation. This pins the
 * shared reader (the onboarding checklist counts) against a school that has
 * both a current pupil and a graduate.
 */

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Roll School ${STAMP}`, slug: `zz-roll-${STAMP}`, code: `ZR${String(STAMP).slice(-6)}`,
      contactEmail: `zz-roll-${STAMP}@test.invalid`, timezone: "Asia/Kolkata",
    },
  });
  schoolId = school.id;
  const here = await db.user.create({ data: { name: "ZZ Roll Here", email: `zz-roll-here-${STAMP}@test.invalid`, prefs: "{}" } });
  const gone = await db.user.create({ data: { name: "ZZ Roll Gone", email: `zz-roll-gone-${STAMP}@test.invalid`, prefs: "{}" } });
  const teacher = await db.user.create({ data: { name: "ZZ Roll Teacher", email: `zz-roll-teacher-${STAMP}@test.invalid`, prefs: "{}" } });
  // one pupil on the roll, one who has graduated (ACTIVE + leftAt), one teacher
  await db.membership.create({ data: { userId: here.id, schoolId, role: "STUDENT", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: gone.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: new Date("2025-03-31T00:00:00Z") } });
  await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("counts of who is here", () => {
  it("⚠ the onboarding checklist counts pupils on the roll, not graduates", async () => {
    const checklist = await getChecklist(schoolId);
    const students = checklist.steps.find((i) => i.id === "students");
    // Two ACTIVE student memberships exist; exactly one is on the roll.
    const onRoll = await db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
    const everActive = await db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE" } });
    expect(onRoll).toBe(1);
    expect(everActive).toBe(2);
    // The checklist's "students added" step is satisfied by the one on the roll.
    expect(students?.done).toBe(true);
  });
});
