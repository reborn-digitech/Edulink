import "server-only";
import type { Prisma } from "@prisma/client";
import { FIXTURE_TOPIC_SLUG_PREFIX } from "@edulink/contracts";
import { db } from "./db";
import { readerIsFixture } from "./fixtures";

/**
 * THE FIXTURES' PRACTICE CHAPTERS, kept out of what real schools read (integration, 11 Oct 2026).
 *
 * The ZZ placement banks (`zz-placement-*`, class 13) and a suite's own chapters carry no board, and the board
 * switch lists a board-less chapter under every board, so every real school's practice page showed "ZZ …"
 * chapters and a "Class 13". A chapter whose slug starts "zz-" lists only for a reader at a fixture school
 * (School.isTestFixture, src/lib/fixtures.ts) — the tests and the sweep still see it — and in the review queue
 * only for a reviewer who is a fixture (User.isTestFixture). tests/quiz-fixture-topics.test.ts holds it.
 */
export function fixtureTopicsWhere(seesFixtures: boolean): Prisma.QuizTopicWhereInput {
  return seesFixtures ? {} : { NOT: { slug: { startsWith: FIXTURE_TOPIC_SLUG_PREFIX } } };
}

/** Whether a reader at this school sees the fixtures' chapters. */
export async function schoolSeesFixtureTopics(schoolId: string | null | undefined): Promise<boolean> {
  return readerIsFixture(schoolId);
}

/** Whether a reviewer (the content team or the operator, who belong to no school) sees the fixtures' items. */
export async function reviewerSeesFixtureTopics(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { isTestFixture: true } });
  return Boolean(user?.isTestFixture);
}
