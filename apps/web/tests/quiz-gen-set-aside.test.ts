import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { batchFiles, landChapter } from "../scripts/quiz-gen/job";
import { afterOutcome, FAILING_AFTER, freshStreak, passContinues, refusedItems, SATURATED_AFTER, type ChapterOutcome, type ChapterStreak } from "../scripts/quiz-gen/set-aside";
import type { GeneratedTopicFile } from "../scripts/quiz-gen/shape";

/**
 * Saturated and failing chapters are set aside, not retried every pass (owner-batch-item6, 30 October 2026).
 *
 * Proved here, with pure functions and a temporary folder (no model, no database): the set-aside rule (two passes in a
 * row with nothing new, or two failed landings in a row, and a landing that brings something new starts again); that a
 * target run ends when only set-aside chapters are left below target; that a batch with nothing new writes no held
 * file and puts the chapter's earlier batch file back; that a duplicate the bank check reports against ANOTHER batch
 * drops this batch's item of that stem; and that a batch the check still refuses is held as before.
 */

const NOTHING: ChapterOutcome = { kind: "NOTHING_NEW" };
const LANDED: ChapterOutcome = { kind: "LANDED" };
const failed = (reason: string): ChapterOutcome => ({ kind: "FAILED", reason });

/** The rule over a run of outcomes, as the runner keeps it: the pass each chapter is set aside on. */
function setAsideOn(outcomes: ChapterOutcome[]): { pass: number; kind: string; reason: string } | null {
  let streak: ChapterStreak = freshStreak();
  for (const [i, o] of outcomes.entries()) {
    const r = afterOutcome(streak, o);
    streak = r.streak;
    if (r.setAside) return { pass: i + 1, kind: r.setAside.kind, reason: r.setAside.reason };
  }
  return null;
}

describe("the set-aside rule", () => {
  it("sets a chapter aside after two passes in a row with nothing new, and not after one", () => {
    expect(SATURATED_AFTER).toBe(2);
    expect(setAsideOn([NOTHING])).toBeNull();
    expect(setAsideOn([NOTHING, NOTHING])).toMatchObject({ pass: 2, kind: "SATURATED" });
    expect(setAsideOn([LANDED, NOTHING, LANDED, NOTHING, NOTHING])).toMatchObject({ pass: 5, kind: "SATURATED" });
  });
  it("starts again when a pass lands something new", () => {
    expect(setAsideOn([NOTHING, LANDED, NOTHING, LANDED])).toBeNull();
  });
  it("sets a chapter aside after two failed landings in a row, with the reason kept; a failure between two nothing-new passes breaks both streaks", () => {
    expect(FAILING_AFTER).toBe(2);
    const slug = 'set aside in generated/held (1 error: ✗ generated/ncert-11-biology-5.json: slug "biology-11-nit" is already used by another topic)';
    expect(setAsideOn([failed(slug)])).toBeNull();
    expect(setAsideOn([failed("a"), failed(slug)])).toEqual({ pass: 2, kind: "FAILING", reason: slug });
    expect(setAsideOn([NOTHING, failed("x"), NOTHING])).toBeNull();
    expect(setAsideOn([failed("x"), LANDED, failed("y")])).toBeNull();
  });
});

describe("whether a target run goes round again", () => {
  it("only with something below target that is not set aside, and a pass that kept something", () => {
    expect(passContinues(100, 3, 12)).toBe(true);
    expect(passContinues(100, 0, 12)).toBe(false);
    expect(passContinues(100, 3, 0)).toBe(false);
    expect(passContinues(null, 3, 12)).toBe(false);
  });
  it("ends a run whose only chapters below target are saturated: a three-chapter run, one filling up, two saturating", () => {
    // The runner's pass loop in miniature: `pending` counts the chapters below target it took, less those set aside this pass.
    const outcomes: Record<string, ChapterOutcome[]> = {
      a: [LANDED, LANDED, LANDED, LANDED],
      b: [NOTHING, NOTHING, NOTHING, NOTHING],
      c: [LANDED, NOTHING, NOTHING, NOTHING],
    };
    const atTarget = (name: string, pass: number) => name === "a" && pass > 2;
    const streaks = new Map<string, ChapterStreak>();
    const aside = new Set<string>();
    const passes: { pass: number; taken: string[]; pending: number }[] = [];
    for (let pass = 1; pass <= 20; pass++) {
      let pending = 0;
      let kept = 0;
      const taken: string[] = [];
      for (const name of ["a", "b", "c"]) {
        if (aside.has(name) || atTarget(name, pass)) continue;
        pending++;
        taken.push(name);
        const o = outcomes[name]![pass - 1]!;
        if (o.kind === "LANDED") kept += 5;
        const r = afterOutcome(streaks.get(name) ?? freshStreak(), o);
        streaks.set(name, r.streak);
        if (r.setAside) {
          aside.add(name);
          pending--;
        }
      }
      passes.push({ pass, taken, pending });
      if (!passContinues(100, pending, kept)) break;
    }
    expect(passes).toEqual([
      { pass: 1, taken: ["a", "b", "c"], pending: 3 },
      { pass: 2, taken: ["a", "b", "c"], pending: 2 },
      { pass: 3, taken: ["c"], pending: 0 },
    ]);
    expect([...aside].sort()).toEqual(["b", "c"]);
  });
});

describe("the item indexes of this batch a bank check refuses", () => {
  const qs = [{ stem: "What is 2+2?" }, { stem: "Name the gas plants give out." }, { stem: "What is 3+3?" }];
  it("its own, by index; another batch's duplicate of one of its stems, by the stem; never another file's other errors", () => {
    expect(refusedItems("✗ generated/ncert-6-maths-5.json[2]: x ✗ generated/ncert-6-maths-15.json[1]: z", "ncert-6-maths-5.json", qs)).toEqual([2]);
    const stems: Record<string, string[]> = { "ncert-9-science-8.json": ["q0", "  name the gas plants give OUT. "] };
    const stemOf = (file: string, i: number) => stems[file]?.[i] ?? null;
    expect(refusedItems("1 error:   ✗ generated/ncert-9-science-8.json[1]: duplicate of a question already in generated/balbharati-8-science-5.json", "balbharati-8-science-5.json", qs, stemOf)).toEqual([1]);
    // The same report read for a batch whose name only starts the same is not this batch's.
    expect(refusedItems("✗ generated/ncert-9-science-8.json[1]: duplicate of a question already in generated/balbharati-8-science-50.json", "balbharati-8-science-5.json", qs, stemOf)).toEqual([]);
    expect(refusedItems("✗ generated/x.json: has no questions", "balbharati-8-science-5.json", qs, stemOf)).toEqual([]);
  });
});

describe("a chapter's landing in a temporary folder", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = "";
  });
  const batch = (stems: string[]): GeneratedTopicFile => ({ slug: "zz-sa", name: "ZZ", chapter: "Chapter 1 — ZZ", questions: stems.map((stem) => ({ stem })) }) as unknown as GeneratedTopicFile;
  const ownerDb = {} as never;

  it("a batch with no items is nothing new: no verify, no held file, and the chapter's earlier batch file is put back", async () => {
    dir = mkdtempSync(join(tmpdir(), "zz-set-aside-"));
    const earlier = JSON.stringify(batch(["earlier"]));
    writeFileSync(join(dir, "zz.json"), JSON.stringify(batch([]))); // what this pass wrote
    let verified = 0;
    const r = await landChapter(ownerDb, "zz.json", batch([]), () => (verified++, "✗ generated/zz.json: has no questions"), batchFiles(dir), earlier);
    expect(r).toMatchObject({ nothingNew: true, held: false, problem: null, loaded: 0 });
    expect(verified).toBe(0);
    expect(existsSync(join(dir, "held"))).toBe(false);
    expect(readFileSync(join(dir, "zz.json"), "utf8")).toBe(earlier);
  });

  it("a batch every item of which the check refuses as a duplicate is nothing new too; with no earlier file, its file is removed", async () => {
    dir = mkdtempSync(join(tmpdir(), "zz-set-aside-"));
    writeFileSync(join(dir, "other.json"), JSON.stringify(batch(["seen once", "Seen twice"])));
    writeFileSync(join(dir, "zz.json"), JSON.stringify(batch(["seen once", "seen twice"])));
    const report = "2 errors: ✗ generated/zz.json[0]: duplicate of a question already in generated/other.json ✗ generated/other.json[1]: duplicate of a question already in generated/zz.json";
    const r = await landChapter(ownerDb, "zz.json", batch(["seen once", "seen twice"]), () => report, batchFiles(dir), null);
    expect(r).toMatchObject({ nothingNew: true, held: false, problem: null, dropped: 2 });
    expect(existsSync(join(dir, "held"))).toBe(false);
    expect(existsSync(join(dir, "zz.json"))).toBe(false);
  });

  it("a batch the check still refuses for another reason is held, as before, and counts as a failed landing", async () => {
    dir = mkdtempSync(join(tmpdir(), "zz-set-aside-"));
    writeFileSync(join(dir, "zz.json"), JSON.stringify(batch(["a"])));
    const r = await landChapter(ownerDb, "zz.json", batch(["a"]), () => '✗ generated/zz.json: slug "zz-sa" is already used by another topic', batchFiles(dir), null);
    expect(r).toMatchObject({ nothingNew: false, held: true });
    expect(r.problem).toMatch(/set aside in generated\/held/);
    expect(existsSync(join(dir, "held", "zz.json"))).toBe(true);
    expect(afterOutcome(afterOutcome(freshStreak(), failed(r.problem!)).streak, failed(r.problem!)).setAside).toMatchObject({ kind: "FAILING" });
  });

  it("a batch the loader refuses is held with the loader's reason, so a later bank load cannot trip on it", async () => {
    dir = mkdtempSync(join(tmpdir(), "zz-set-aside-"));
    writeFileSync(join(dir, "zz.json"), JSON.stringify(batch(["a"])));
    // A database that refuses every read stands for the loader's own refusal (a board clash, a fragment name).
    const refusing = new Proxy({}, { get: () => new Proxy({}, { get: () => () => Promise.reject(new Error("zz.json: the chapter's name \"NIT\" is a label, not a title")) }) }) as never;
    const r = await landChapter(refusing, "zz.json", { ...batch(["a"]), board: "NCERT" }, () => null, batchFiles(dir), null);
    expect(r).toMatchObject({ held: true, nothingNew: false });
    expect(r.problem).toMatch(/the loader refused it: .*not a title/);
    expect(existsSync(join(dir, "held", "zz.json"))).toBe(true);
  });
});
