/**
 * THE ONE-TIME REPAIR OF THE BANK'S OUT-OF-DATE MARKS (the owner's follow-up to TA-199 of the testing analysis of 13
 * November 2026, decided 14 November 2026).
 *
 *   node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json scripts/quiz-stale-repair.ts            the review: counts only
 *   node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json scripts/quiz-stale-repair.ts --apply    writes them
 *
 * THE FAULT. Until 927623e6 the bank desk's Edit (src/lib/quiz-review.ts editItem) stamped a generated item's
 * editedAfterSolvingAt on ANY change to the English, a level or a check expression alone included; since 927623e6 a
 * Hindi or Marathi row last written before that mark is withheld from pupils (quiz-served.ts servedTranslation), so an
 * item whose level alone was changed lost its translations though no word of it had changed.
 *
 * WHAT THIS DOES. For every question carrying the mark it reads the desk's edit history, oldest first: each EDIT (or the
 * review queue's EDIT_ACCEPT) stamp keeps the English as it stood before it (`before`), so the English after each edit
 * is the next stamp's `before`, and after the last the English as it stands. An edit is a real word change when the
 * stem, the options, the key or the working differ across it, the rule editItem keeps now. The mark is set to the time
 * of the LAST real word change, never simply cleared: an item with a word edit followed by a level-only edit is really
 * out of date, against the word edit. With no real word change in its history the mark is cleared. An item is left as
 * it is, and counted as such, when its mark is not the time of one of its edits (the desk's edit is the mark's only
 * writer, so another writer cannot be reasoned about) or when an edit's earlier words cannot be read. The write is
 * conditional on the mark still being what was read, so a desk edit made while this runs wins, and each change writes
 * its audit row ("operator.quizBank.markRepair", no actor and no school, the script named in meta.via, the mark before
 * and after) in the same transaction. Idempotent: a second run finds every mark already at its last word change.
 *
 * It prints the database it touches and counts only, never a question's words.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

type EnglishWords = { stem: string; choices: string[]; answerIndex: number; solution: string };
type Edit = { at: Date; before: string | null };

/** The English words a stamp's `before` kept, or null when they cannot be read. Pure. */
export function wordsOfBefore(raw: string | null): EnglishWords | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const w = parsed as Record<string, unknown>;
  if (typeof w.stem !== "string" || typeof w.solution !== "string" || typeof w.answerIndex !== "number") return null;
  if (!Array.isArray(w.choices) || !w.choices.every((c) => typeof c === "string")) return null;
  return { stem: w.stem, choices: w.choices as string[], answerIndex: w.answerIndex, solution: w.solution };
}

const sameWords = (a: EnglishWords, b: EnglishWords) =>
  a.stem === b.stem && a.solution === b.solution && a.answerIndex === b.answerIndex && JSON.stringify(a.choices) === JSON.stringify(b.choices);

/**
 * What the mark should be, from the item's edits (any order) and its English as it stands. "keep": already at its last
 * word change; "move": to that time, or null when no edit changed a word; "unknown": left as it is. Pure.
 */
export function markVerdict(mark: Date, edits: Edit[], current: EnglishWords): { verdict: "keep" } | { verdict: "unknown" } | { verdict: "move"; to: Date | null } {
  const ordered = [...edits].sort((a, b) => a.at.getTime() - b.at.getTime());
  if (!ordered.some((e) => e.at.getTime() === mark.getTime())) return { verdict: "unknown" };
  const states: EnglishWords[] = [];
  for (const e of ordered) {
    const words = wordsOfBefore(e.before);
    if (!words) return { verdict: "unknown" };
    states.push(words);
  }
  states.push(current);
  let last: Date | null = null;
  for (let k = 0; k < ordered.length; k++) {
    if (!sameWords(states[k]!, states[k + 1]!)) last = ordered[k]!.at;
  }
  if (last && last.getTime() > mark.getTime()) return { verdict: "unknown" };
  if (last && last.getTime() === mark.getTime()) return { verdict: "keep" };
  return { verdict: "move", to: last };
}

export type RepairCounts = { marked: number; kept: number; moved: number; cleared: number; unknown: number; written: number };

/**
 * The repair over every marked question, or over `questionIds` alone (the suite's own scratch items). A dry run unless
 * `apply`; counts only.
 */
export async function repairStaleMarks(db: PrismaClient, options: { apply: boolean; questionIds?: string[] }): Promise<RepairCounts> {
  const counts: RepairCounts = { marked: 0, kept: 0, moved: 0, cleared: 0, unknown: 0, written: 0 };
  const rows = await db.quizQuestion.findMany({
    where: { editedAfterSolvingAt: { not: null }, ...(options.questionIds ? { id: { in: options.questionIds } } : {}) },
    select: {
      id: true,
      stem: true,
      choices: true,
      answerIndex: true,
      solution: true,
      editedAfterSolvingAt: true,
      reviewStamps: { where: { action: { in: ["EDIT", "EDIT_ACCEPT"] } }, select: { at: true, before: true } },
    },
    orderBy: { id: "asc" },
  });
  for (const row of rows) {
    const mark = row.editedAfterSolvingAt!;
    counts.marked += 1;
    let choices: string[] = [];
    try {
      const parsed: unknown = JSON.parse(row.choices);
      choices = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      choices = [];
    }
    const verdict = markVerdict(mark, row.reviewStamps, { stem: row.stem, choices, answerIndex: row.answerIndex, solution: row.solution });
    if (verdict.verdict === "keep") counts.kept += 1;
    else if (verdict.verdict === "unknown") counts.unknown += 1;
    else {
      if (verdict.to) counts.moved += 1;
      else counts.cleared += 1;
      if (options.apply) {
        const to = verdict.to;
        const wrote = await db.$transaction(async (tx) => {
          const { count } = await tx.quizQuestion.updateMany({ where: { id: row.id, editedAfterSolvingAt: mark }, data: { editedAfterSolvingAt: to } });
          if (count === 0) return false;
          const meta = JSON.stringify({ via: "scripts/quiz-stale-repair.ts", from: mark.toISOString(), to: to?.toISOString() ?? null });
          await tx.$executeRaw`
            INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
            VALUES (${randomUUID()}, NULL, NULL, ${"operator.quizBank.markRepair"}, ${"QuizQuestion"}, ${row.id}, ${meta}, NULL, ${new Date().toISOString()}::timestamp)`;
          return true;
        });
        if (wrote) counts.written += 1;
      }
    }
  }
  return counts;
}

async function main() {
  config();
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  try {
    const named = await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
    const name = named[0]?.name ?? "?";
    console.log(`database: ${name}${apply ? "" : " (a review: nothing is written; --apply writes)"}`);
    const c = await repairStaleMarks(db, { apply });
    console.log(`marked questions: ${c.marked}`);
    console.log(`  already at their last word change: ${c.kept}`);
    console.log(`  moved back to their last word change: ${c.moved}`);
    console.log(`  cleared (no word ever changed): ${c.cleared}`);
    console.log(`  left as they are (mark not an edit's, or history unreadable): ${c.unknown}`);
    console.log(apply ? `written: ${c.written}` : `would write: ${c.moved + c.cleared}`);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && /quiz-stale-repair\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
