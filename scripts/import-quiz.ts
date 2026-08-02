/**
 * Loads content/quiz/*.json into the database.
 *
 * VERIFIES FIRST, ALWAYS. The importer runs the same checks the verifier does
 * and refuses the whole run if any fail, rather than importing the good files
 * and reporting the bad ones. A half-imported bank is the worst outcome: the
 * topics that landed look fine, so nobody re-runs it, and the missing ones are
 * discovered by a child hitting an empty topic.
 *
 * IDEMPOTENT, by slug for topics and by stem for questions. Re-running after
 * editing a file updates in place rather than doubling the bank — which matters
 * because editing a solution and re-importing is the normal way this content
 * gets fixed.
 *
 * Runs as the schema OWNER. QuizTopic and QuizQuestion carry no schoolId and
 * sit in NO_SCHOOL_POLICY, so there is no tenant to bind; the app role can read
 * them freely, which is the point of a shared catalogue.
 *
 * Run: npm run quiz:import
 */
import { PrismaClient } from "@prisma/client";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";

config();

const DIR = join(process.cwd(), "content", "quiz");
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

type Question = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
};

type TopicFile = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary?: string;
  position?: number;
  source: string;
  licence: string;
  questions: Question[];
};

function verifyOrExit() {
  try {
    execFileSync(
      "npx",
      ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/verify-quiz.ts"],
      { stdio: "inherit" },
    );
  } catch {
    console.error("\nImport refused: the bank did not verify. Nothing was written.\n");
    process.exit(1);
  }
}

async function main() {
  verifyOrExit();

  const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  let topicsWritten = 0;
  let questionsWritten = 0;
  let questionsUpdated = 0;
  let questionsRemoved = 0;

  for (const file of files) {
    const topic: TopicFile = JSON.parse(readFileSync(join(DIR, file), "utf8"));

    const row = await db.quizTopic.upsert({
      where: { slug: topic.slug },
      create: {
        subject: topic.subject,
        classLevel: topic.classLevel,
        chapter: topic.chapter,
        name: topic.name,
        slug: topic.slug,
        summary: topic.summary ?? "",
        position: topic.position ?? 0,
      },
      update: {
        subject: topic.subject,
        classLevel: topic.classLevel,
        chapter: topic.chapter,
        name: topic.name,
        summary: topic.summary ?? "",
        position: topic.position ?? 0,
      },
    });
    topicsWritten++;

    const existing = await db.quizQuestion.findMany({
      where: { topicId: row.id },
      select: { id: true, stem: true },
    });
    const byStem = new Map(existing.map((q) => [q.stem.trim(), q.id]));
    const keep = new Set<string>();

    for (const question of topic.questions) {
      const stem = question.stem.trim();
      const data = {
        difficulty: question.difficulty,
        stem,
        choices: JSON.stringify(question.choices),
        answerIndex: question.answerIndex,
        solution: question.solution,
        checkExpr: question.checkExpr ?? null,
        source: topic.source,
        licence: topic.licence,
        reviewedAt: question.reviewedAt ? new Date(`${question.reviewedAt}T00:00:00.000Z`) : null,
        reviewedBy: question.reviewedBy ?? null,
      };

      const id = byStem.get(stem);
      if (id) {
        await db.quizQuestion.update({ where: { id }, data });
        keep.add(id);
        questionsUpdated++;
      } else {
        const created = await db.quizQuestion.create({
          data: { ...data, topicId: row.id },
          select: { id: true },
        });
        keep.add(created.id);
        questionsWritten++;
      }
    }

    // A question deleted from the file is deleted from the bank. Its responses
    // cascade away with it — which is the honest outcome, because a child's
    // answer to a question that no longer exists cannot be scored or shown.
    const orphans = existing.filter((q) => !keep.has(q.id)).map((q) => q.id);
    if (orphans.length) {
      await db.quizQuestion.deleteMany({ where: { id: { in: orphans } } });
      questionsRemoved += orphans.length;
    }
  }

  console.log(
    `\nImported ${topicsWritten} topics — ${questionsWritten} new, ${questionsUpdated} updated, ${questionsRemoved} removed.\n`,
  );
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
