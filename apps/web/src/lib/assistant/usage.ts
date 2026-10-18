import "server-only";
import { db } from "../db";
import { todayKey } from "../dates";

/**
 * THE COUNTS (the owner's rule 6: calls audited by count, never by text). One AssistantUsage row per
 * person per school day; the daily cap reads the person's row, the school's monthly token budget and
 * the office's card sum the month's rows. The daily question is RESERVED before any work — the row's
 * count goes up first and the cap is read from what came back — so twenty questions sent at once
 * cannot all pass a cap of ten (the SMS caps' lesson, messaging.ts).
 */
export type UsageField = "questions" | "answered" | "hints" | "refused" | "counsellorRoutes" | "modelCalls" | "promptTokens" | "completionTokens" | "helpful" | "notHelpful" | "standardAnswers";

export function dayKeyFor(timezone: string, now: Date): string {
  return todayKey(timezone, now);
}

export async function addUsage(where: { schoolId: string; userId: string; dayKey: string }, add: Partial<Record<UsageField, number>>): Promise<void> {
  const increments = Object.fromEntries(Object.entries(add).filter(([, v]) => v)) as Partial<Record<UsageField, number>>;
  if (Object.keys(increments).length === 0) return;
  await db.assistantUsage.upsert({
    where: { schoolId_userId_dayKey: where },
    create: { ...where, ...increments },
    update: Object.fromEntries(Object.entries(increments).map(([k, v]) => [k, { increment: v }])),
  });
}

/** Take one of the person's questions for today; false (and nothing taken) when the cap is reached. */
export async function reserveQuestion(where: { schoolId: string; userId: string; dayKey: string }, cap: number): Promise<{ ok: boolean; used: number }> {
  const row = await db.assistantUsage.upsert({
    where: { schoolId_userId_dayKey: where },
    create: { ...where, questions: 1 },
    update: { questions: { increment: 1 } },
    select: { questions: true },
  });
  if (row.questions > cap) {
    await db.assistantUsage.update({ where: { schoolId_userId_dayKey: where }, data: { questions: { decrement: 1 } } });
    return { ok: false, used: row.questions - 1 };
  }
  return { ok: true, used: row.questions };
}

/** Give a reserved question back (the model did not answer: nothing is charged to the person's day). */
export async function releaseQuestion(where: { schoolId: string; userId: string; dayKey: string }): Promise<void> {
  await db.assistantUsage.updateMany({ where: { ...where, questions: { gt: 0 } }, data: { questions: { decrement: 1 } } });
}

export async function questionsToday(where: { schoolId: string; userId: string; dayKey: string }): Promise<number> {
  const row = await db.assistantUsage.findUnique({ where: { schoolId_userId_dayKey: where }, select: { questions: true } });
  return row?.questions ?? 0;
}

export async function counsellorRoutedToday(where: { schoolId: string; userId: string; dayKey: string }): Promise<boolean> {
  const row = await db.assistantUsage.findUnique({ where: { schoolId_userId_dayKey: where }, select: { counsellorRoutes: true } });
  return (row?.counsellorRoutes ?? 0) > 0;
}

/** The school's month so far (month = "YYYY-MM" in the school's zone), summed. */
export async function monthTotals(schoolId: string, month: string) {
  const [sum, people] = await Promise.all([
    db.assistantUsage.aggregate({
      where: { schoolId, dayKey: { startsWith: month } },
      _sum: { questions: true, answered: true, hints: true, refused: true, counsellorRoutes: true, modelCalls: true, promptTokens: true, completionTokens: true, helpful: true, notHelpful: true, standardAnswers: true },
    }),
    db.assistantUsage.groupBy({ by: ["userId"], where: { schoolId, dayKey: { startsWith: month }, questions: { gt: 0 } } }),
  ]);
  const s = sum._sum;
  return {
    questions: s.questions ?? 0,
    answered: s.answered ?? 0,
    hints: s.hints ?? 0,
    refused: s.refused ?? 0,
    counsellorRoutes: s.counsellorRoutes ?? 0,
    modelCalls: s.modelCalls ?? 0,
    tokens: (s.promptTokens ?? 0) + (s.completionTokens ?? 0),
    helpful: s.helpful ?? 0,
    notHelpful: s.notHelpful ?? 0,
    people: people.length,
    // Vidura pass 3: answers served from the operator's standard answers.
    standardAnswers: s.standardAnswers ?? 0,
  };
}
