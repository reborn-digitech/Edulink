/**
 * R-25 and R-51 (5 Oct 2026, risks batch): zz:fixtures takes away, at the ZZ fixture schools alone and school by
 * school, the registers with no marks and the API sweep's fixed-day register at ZZ Northgate (scripts/zz-cleanup.ts).
 * This test builds its own ZZ school; the seed schools' empty registers are only counted, never written.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NORTHGATE_SLUG, removeEmptyRegisters, removeSweepRegister, ZZ_SCHOOL_WHERE } from "../scripts/zz-cleanup";
import { SWEEP_REGISTER_DAY } from "@/lib/api-catalog/unversioned";

const db = new PrismaClient();
const STAMP = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
let schoolId = "";
let emptyId = "";
let markedId = "";
let seedIds: string[] = [];

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ P4 Cleanup ${STAMP}`, slug: `zz-p4-cleanup-${STAMP}`, code: `ZP4${STAMP.slice(-5).toUpperCase()}`, contactEmail: `zz-p4-cleanup-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en" }, select: { id: true } })).id;
  const classId = (await db.class.create({ data: { schoolId, name: "ZZ 3A", gradeLevel: "3", joinCode: `ZP4C${STAMP.slice(-5).toUpperCase()}` }, select: { id: true } })).id;
  const userId = (await db.user.create({ data: { name: "ZZ P4 Pupil", email: `zz-p4-pupil-${STAMP}@test.invalid` }, select: { id: true } })).id;
  const pupil = (await db.membership.create({ data: { userId, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  emptyId = (await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2026-10-04" }, select: { id: true } })).id;
  markedId = (await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2026-10-05", records: { create: { schoolId, studentMembershipId: pupil, status: "PRESENT" } } }, select: { id: true } })).id;
  seedIds = (await db.school.findMany({ where: { slug: { in: ["oakfield-academy", "riverside-primary-school"] } }, select: { id: true } })).map((s) => s.id);
});

afterAll(async () => {
  if (schoolId) await db.school.delete({ where: { id: schoolId } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: `zz-p4-pupil-${STAMP}@test.invalid` } });
  await db.$disconnect();
});

describe("zz:fixtures' clean-up", () => {
  it("removes a ZZ school's register with no marks, keeps its marked one, and leaves a seed school's empty ones alone even when named", async () => {
    const seedEmptyBefore = await db.attendanceSession.count({ where: { schoolId: { in: seedIds }, records: { none: {} } } });
    const out = await removeEmptyRegisters(db, { schoolIds: [schoolId, ...seedIds] });
    expect(out.schools).toBe(1);
    expect(out.removed).toBe(1);
    expect(await db.attendanceSession.findUnique({ where: { id: emptyId } })).toBeNull();
    expect(await db.attendanceSession.findUnique({ where: { id: markedId } })).not.toBeNull();
    expect(await db.attendanceSession.count({ where: { schoolId: { in: seedIds }, records: { none: {} } } })).toBe(seedEmptyBefore);
  });

  it("a ZZ fixture school is the name's prefix and the slug's both", () => {
    expect(ZZ_SCHOOL_WHERE).toEqual({ name: { startsWith: "ZZ " }, slug: { startsWith: "zz-" } });
  });

  it("removes the sweep's fixed-day register at ZZ Northgate only, by its school id and day", async () => {
    const calls: unknown[] = [];
    const fake = {
      school: { findFirst: async (q: unknown) => (calls.push(q), { id: "northgate-id" }) },
      attendanceSession: { deleteMany: async (q: unknown) => (calls.push(q), { count: 1 }) },
    } as unknown as Parameters<typeof removeSweepRegister>[0];
    expect(await removeSweepRegister(fake)).toBe(1);
    expect(calls).toEqual([
      { where: { ...ZZ_SCHOOL_WHERE, slug: NORTHGATE_SLUG }, select: { id: true } },
      { where: { schoolId: "northgate-id", dateKey: SWEEP_REGISTER_DAY } },
    ]);
    expect(SWEEP_REGISTER_DAY).toBe("2020-01-08");
  });

  it("is what zz-fixtures.ts runs before it builds anything", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "zz-fixtures.ts"), "utf8");
    const main = src.slice(src.indexOf("async function main()"));
    const build = main.indexOf("await buildNorthgate(ctx)");
    expect(main.indexOf("await removeEmptyRegisters(db)")).toBeGreaterThan(-1);
    expect(main.indexOf("await removeEmptyRegisters(db)")).toBeLessThan(build);
    expect(main.indexOf("await removeSweepRegister(db)")).toBeGreaterThan(-1);
    expect(main.indexOf("await removeSweepRegister(db)")).toBeLessThan(build);
  });
});
