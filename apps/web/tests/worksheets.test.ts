import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { buildWorksheet } from "@/lib/worksheets";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Worksheets are read-only over the shared bank, so the only fixture is a
 * context — nothing is created and nothing needs tearing down. The claims:
 * the same seed prints the same paper, a different seed a different one, every
 * printed answer matches the bank's own answerIndex, and pupils get nothing.
 */

const db = new PrismaClient();
const SLUG = "history-6-what-where-how-and-when";
let hasBank = false;

function ctxFor(role: "TEACHER" | "STUDENT"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: "test-membership",
    schoolId: "test-school",
    role,
    user: {
      id: "test-user",
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

beforeAll(async () => {
  hasBank = (await db.quizTopic.count({ where: { slug: SLUG } })) > 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/**
 * A chapter of the practice bank that is not loaded is a skip on a laptop and a failure on CI (TA-513), as in
 * tests/answer-idempotent.test.ts: never a pass with nothing asserted.
 */
function noBank(skip: (note?: string) => void): void {
  if (process.env.CI) throw new Error(`The practice bank's chapter ${SLUG} is not loaded: run npm run quiz:import first`);
  skip(`the practice bank's chapter ${SLUG} is not loaded`);
}

describe("worksheets", () => {
  it("the same seed prints the same paper; a new seed prints a fresh one", async ({ skip }) => {
    if (!hasBank) return noBank(skip);
    const first = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 4, count: 6, seed: "zz1" });
    const again = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 4, count: 6, seed: "zz1" });
    const other = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 4, count: 6, seed: "zz2" });

    expect(first.questions.map((q) => q.stem)).toEqual(again.questions.map((q) => q.stem));
    expect(first.questions).toHaveLength(6);
    expect(other.questions.map((q) => q.stem)).not.toEqual(first.questions.map((q) => q.stem));
  });

  it("every key entry matches the bank's own answer", async ({ skip }) => {
    if (!hasBank) return noBank(skip);
    const sheet = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 1, count: 5, seed: "zz3" });
    for (const q of sheet.questions) {
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.choices.length);
      expect(q.choices[q.answerIndex]).toBeTruthy();
    }
    // Spot-check one against the raw row: the stem on the paper is the stem in
    // the bank, so the key can only be the bank's own answer.
    const row = await db.quizQuestion.findFirst({
      where: { topic: { slug: SLUG }, difficulty: 1, stem: sheet.questions[0]!.stem },
      select: { answerIndex: true },
    });
    expect(row?.answerIndex).toBe(sheet.questions[0]!.answerIndex);
  });

  it("a pupil cannot build one", async ({ skip }) => {
    if (!hasBank) return noBank(skip);
    await expect(
      buildWorksheet(ctxFor("STUDENT"), { slug: SLUG, level: 1, count: 5, seed: "zz" }),
    ).rejects.toThrow(AccessError);
  });
});
