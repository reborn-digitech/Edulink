/**
 * SATURATED AND FAILING CHAPTERS ARE SET ASIDE, NOT RETRIED EVERY PASS (owner-batch-item6, 30 October 2026). Pure; the
 * generation job's runner (scripts/quiz-gen/job.ts) keeps one streak per chapter for the run and asks here what a
 * chapter's outcome means.
 *
 * THE FAULT. A target run makes passes over the plan until every chapter holds the target. On 30 October the run's
 * failure list held 101 lines over 65 chapters: 66 "has no questions" (the batch landed nothing because every item it
 * drafted was dropped as one the chapter already holds; the run then wrote an empty file to generated/held), 21 a slug
 * another chapter already uses (a garbled corpus title), 12 a duplicate of another chapter's question and two with no
 * title in the corpus. Every pass drafted them all again, at a few minutes a chapter of the model's time.
 *
 * NOW. A batch that lands nothing new is NOTHING NEW, not a failure: no held file, the chapter's earlier batch file put
 * back. A chapter with nothing new on SATURATED_AFTER passes in a row is SATURATED; one whose landing fails (or which
 * cannot be generated) FAILING_AFTER tries in a row is FAILING. Either way it is set aside for the rest of the run: left
 * out of every later pass and out of the count of chapters still below target, so a run whose only chapters left are set
 * aside ends instead of going round again. A chapter that lands something new starts its streaks again.
 */

/** Passes in a row with nothing new before a chapter is set aside as saturated. */
export const SATURATED_AFTER = 2;
/** Tries in a row whose landing failed before a chapter is set aside as failing. */
export const FAILING_AFTER = 2;

/** What one pass over a chapter came to. */
export type ChapterOutcome = { kind: "LANDED" } | { kind: "NOTHING_NEW" } | { kind: "FAILED"; reason: string };

export type ChapterStreak = { nothingNew: number; failed: number; reason: string | null };

export const freshStreak = (): ChapterStreak => ({ nothingNew: 0, failed: 0, reason: null });

/** The chapter's streak after an outcome, and whether that sets it aside (with the kind, the tries and the reason). Pure. */
export function afterOutcome(
  streak: ChapterStreak,
  outcome: ChapterOutcome,
): { streak: ChapterStreak; setAside: { kind: "SATURATED" | "FAILING"; tries: number; reason: string } | null } {
  if (outcome.kind === "LANDED") return { streak: freshStreak(), setAside: null };
  if (outcome.kind === "NOTHING_NEW") {
    const next = { nothingNew: streak.nothingNew + 1, failed: 0, reason: null };
    return {
      streak: next,
      setAside: next.nothingNew >= SATURATED_AFTER ? { kind: "SATURATED", tries: next.nothingNew, reason: `nothing new on ${next.nothingNew} passes in a row: every item drafted was one the chapter already holds` } : null,
    };
  }
  const next = { nothingNew: 0, failed: streak.failed + 1, reason: outcome.reason };
  return { streak: next, setAside: next.failed >= FAILING_AFTER ? { kind: "FAILING", tries: next.failed, reason: outcome.reason } : null };
}

/** Whether a target run goes round again: only with a target, something still below it and not set aside, and a pass that kept something. */
export function passContinues(target: number | null, pending: number, kept: number): boolean {
  return Boolean(target) && pending > 0 && kept > 0;
}

/**
 * The item indexes of THIS batch a verify report refuses. Its own errors name it ("generated/<file>[7]: …"); a duplicate
 * across files is reported against the later file in the bank's order ("generated/<other>[3]: duplicate of a question
 * already in generated/<file>"), and the item of this batch with that stem is the one to drop (`stemOf` reads the other
 * file's item). Another file's other errors are not this chapter's to drop. Pure, given `stemOf`.
 */
export function refusedItems(report: string, fileName: string, questions: readonly { stem: string }[], stemOf: (file: string, index: number) => string | null = () => null): number[] {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const out = new Set<number>();
  for (const m of report.matchAll(new RegExp(`generated/${esc(fileName)}\\[(\\d+)\\]`, "g"))) out.add(Number(m[1]));
  const across = new RegExp(`generated/([^\\s\\[]+\\.json)\\[(\\d+)\\]: duplicate of a question already in generated/${esc(fileName)}(?![\\w.-])`, "g");
  for (const m of report.matchAll(across)) {
    if (m[1] === fileName) continue;
    const stem = stemOf(m[1]!, Number(m[2]))?.trim().toLowerCase();
    if (!stem) continue;
    questions.forEach((q, i) => {
      if (q.stem.trim().toLowerCase() === stem) out.add(i);
    });
  }
  return [...out].sort((a, b) => a - b);
}
