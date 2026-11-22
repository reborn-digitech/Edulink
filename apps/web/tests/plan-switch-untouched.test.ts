/**
 * No suite writes the Student or Teacher plan's switch (the coordinating session's C4c point 1, and its review of 21 November
 * 2026, D1). Those two rows are the platform's: asking for either locks every student or teacher at a school without
 * premium who holds no plan, on the development database the owner tests by hand. A suite that moved one, or "put it back"
 * after another hand moved it during the run (the features sweep's --plans=on, or the owner's own switch), would leave the
 * plan asked for, or not, against that hand's act, with no audit row. The rows' own write is proven on the Expert plan.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname);
const SRC = resolve(__dirname, "../src");
/** A write naming the Student or Teacher plan's row. */
const WRITE = /personPlan\s*\.\s*(?:update|updateMany|upsert|delete|deleteMany|create|createMany)\s*\(\s*\{[\s\S]{0,240}?code\s*:\s*"(?:STUDENT|TEACHER)"/;
/** An updateMany or a deleteMany that names no plan, which reaches every row (the coordinating session's check, point 2). */
const MANY = /personPlan\s*\.\s*(?:updateMany|deleteMany)\s*\(\s*(?:\)|\{(?![\s\S]{0,240}?code\s*:))/;
/** A raw statement on the table, whatever it names. */
const RAW = /(?:UPDATE|DELETE\s+FROM|INSERT\s+INTO)\s+"PersonPlan"/i;
const writes = (text: string) => WRITE.test(text) || MANY.test(text) || RAW.test(text);

/** Every TypeScript file under tests/ (the suites and their helpers), and every suite under src/. */
function files(dir: string, keep: (name: string) => boolean): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : files(path, keep);
    return keep(name) ? [path] : [];
  });
}
const scanned = () => [...files(ROOT, (n) => /\.tsx?$/.test(n)), ...files(SRC, (n) => /\.test\.tsx?$/.test(n))];

describe("no suite writes the Student or Teacher plan's switch (C4c point 1)", () => {
  it("no suite's text writes either row", () => {
    // This file holds such writes as text, in the case below, and is the one file left out.
    const writers = scanned().filter((path) => path !== __filename && writes(readFileSync(path, "utf8")));
    expect(writers).toEqual([]);
    expect(scanned().length).toBeGreaterThan(700);
  });

  it("the guard sees such a write where one is", () => {
    expect(writes('await db.personPlan.update({ where: { code: "STUDENT" }, data: { active: true } });')).toBe(true);
    expect(writes('await tx.personPlan.updateMany({ where: { code: "TEACHER" }, data: { active: false } });')).toBe(true);
    expect(writes('await db.personPlan.update({ where: { code: "EXPERT" }, data: { active: true } });')).toBe(false);
    // An updateMany or a deleteMany that names no plan reaches every row, the Student and Teacher ones among them.
    expect(writes("await db.personPlan.updateMany({ where: { active: true }, data: { active: false } });")).toBe(true);
    expect(writes("await db.personPlan.deleteMany();")).toBe(true);
    // A raw statement on the table, whatever it names.
    expect(writes('await db.$executeRaw`UPDATE "PersonPlan" SET "active" = false`;')).toBe(true);
    expect(writes('await db.$executeRawUnsafe(\'delete from "PersonPlan"\');')).toBe(true);
  });
});
