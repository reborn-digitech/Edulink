/**
 * TA-512's tightened default (a permitted role's GET at a fixed address with nothing declared must answer 200) made the
 * seal's picture depend on the run before it: GET /api/v1/office/signatures/image?of=seal answers 404 while the school
 * has no seal, and every API sweep's own POST /api/v1/office/signatures/seal/remove takes ZZ Northgate's away, so a
 * second run without zz:fixtures in between (the warm-up, then the count) would have failed it for the admin, the head
 * and a teacher. The sweep now puts the seal back before it walks, as it puts back every row whose door is a removal
 * (scripts/sweep-doors.ts restoreSweepSeal, called by restoreSweepThrowaways).
 *
 * One scratch ZZ school of the suite's own, removed afterwards by id.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA512 Seal ${STAMP}`, slug: `zz-ta512-seal-${STAMP}`, code: `Z512S${String(STAMP).slice(-6)}`, contactEmail: `zz-ta512-seal-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en", isTestFixture: true },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  if (schoolId) {
    await db.signatureImage.deleteMany({ where: { schoolId } });
    await db.school.deleteMany({ where: { id: schoolId } });
  }
  await db.$disconnect();
});

describe("TA-512: the seal the sweep removes is put back before the next walk", () => {
  it("TA-512: a missing seal is put back once, made in the past so the run's clean-up leaves it, and a seal there already is left alone", async () => {
    const m = await import("../scripts/sweep-doors");
    expect(typeof (m as Record<string, unknown>).restoreSweepSeal, "scripts/sweep-doors.ts: restoreSweepSeal").toBe("function");
    const seals = () => db.signatureImage.findMany({ where: { schoolId, kind: "SEAL" }, select: { id: true, createdAt: true, png: true } });
    expect(await seals()).toHaveLength(0);
    expect(await m.restoreSweepSeal(db, schoolId)).toBe(true);
    const [first, ...more] = await seals();
    expect(more).toHaveLength(0);
    expect(first!.png.length).toBeGreaterThan(0);
    expect(first!.createdAt.getTime()).toBeLessThan(Date.now() - 86_400_000);
    // Again: the seal stands and nothing is added.
    expect(await m.restoreSweepSeal(db, schoolId)).toBe(false);
    expect((await seals()).map((s) => s.id)).toEqual([first!.id]);
    // The sweep's seal/remove takes it away (src/lib/signatures.ts: a deleteMany by school and kind); the next walk puts one back.
    await db.signatureImage.deleteMany({ where: { schoolId, kind: "SEAL" } });
    expect(await m.restoreSweepSeal(db, schoolId)).toBe(true);
    expect(await seals()).toHaveLength(1);
  });

  it("TA-512: restoreSweepThrowaways, which the sweep calls before it walks and zz:fixtures after it builds, restores the seal", () => {
    const text = readFileSync(join(process.cwd(), "scripts/sweep-doors.ts"), "utf8");
    const start = text.indexOf("export async function restoreSweepThrowaways");
    expect(start).toBeGreaterThan(-1);
    const body = text.slice(start, text.indexOf("\n}\n", start));
    expect(body).toMatch(/await restoreSweepSeal\(db, schoolId\)/);
  });
});
