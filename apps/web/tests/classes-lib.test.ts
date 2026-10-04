/**
 * LIFECYCLE-11 (campaign of 4 October 2026): a class can be made by a library
 * function, not only by the office's server action, so a script or a door
 * makes one under the same rules: a grade the school teaches, no two live
 * classes of one name, a join code of its own, an audit row.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createClassIn } from "@/lib/classes";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let userId = "";

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ Classes Lib ${STAMP}`, slug: `zz-classes-lib-${STAMP}`, code: `ZCL${String(STAMP).slice(-6)}`, contactEmail: `zz-classes-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", gradeLow: "5", gradeHigh: "10" }, select: { id: true } })).id;
  userId = (await db.user.create({ data: { name: "ZZ Classes Admin", email: `zz-classes-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("createClassIn", () => {
  it("makes a class with a join code and an audit row, and refuses a second live class of the name and a grade the school does not teach", async () => {
    const made = await createClassIn(schoolId, userId, { name: "ZZ 5 A", gradeLevel: "5", section: "A" });
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    expect(made.joinCode).toMatch(/\S+/);
    expect(await db.class.findUniqueOrThrow({ where: { id: made.classId }, select: { schoolId: true, gradeLevel: true } })).toEqual({ schoolId, gradeLevel: "5" });
    expect(await db.auditLog.count({ where: { schoolId, action: "class.create", targetId: made.classId } })).toBe(1);
    expect(await createClassIn(schoolId, userId, { name: "ZZ 5 A", gradeLevel: "5" })).toMatchObject({ ok: false, field: "name", errorKey: "classes.duplicateName" });
    expect(await createClassIn(schoolId, userId, { name: "ZZ 12 A", gradeLevel: "12" })).toMatchObject({ ok: false, field: "gradeLevel", errorKey: "classes.gradeOutOfRange" });
  });
});
