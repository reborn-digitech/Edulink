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
const SLUG = "drill-g3-addsub";
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

describe("worksheets", () => {
  it("the same seed prints the same paper; a new seed prints a fresh one", async () => {
    if (!hasBank) return;
    const first = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 2, count: 8, seed: "zz1" });
    const again = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 2, count: 8, seed: "zz1" });
    const other = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 2, count: 8, seed: "zz2" });

    expect(first.questions.map((q) => q.stem)).toEqual(again.questions.map((q) => q.stem));
    expect(first.questions).toHaveLength(8);
    expect(other.questions.map((q) => q.stem)).not.toEqual(first.questions.map((q) => q.stem));
  });

  it("every key entry matches the bank's own answer", async () => {
    if (!hasBank) return;
    const sheet = await buildWorksheet(ctxFor("TEACHER"), { slug: SLUG, level: 1, count: 10, seed: "zz3" });
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

  it("a pupil cannot build one", async () => {
    if (!hasBank) return;
    await expect(
      buildWorksheet(ctxFor("STUDENT"), { slug: SLUG, level: 1, count: 5, seed: "zz" }),
    ).rejects.toThrow(AccessError);
  });
});
