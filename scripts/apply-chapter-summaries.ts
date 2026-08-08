/**
 * Write the authored chapter one-liners onto the live QuizTopic rows.
 *
 * Additive and idempotent: it UPDATES the summary column of existing drill
 * topics (and the summary of their existing hi/mr translation rows) and
 * touches nothing else — no topic, question or translation row is created or
 * deleted. Safe to run twice; the second run is a no-op.
 *
 * Needs the admin connection (the app role's RLS hides these shared rows):
 *   node scripts/with-admin-db.mjs npx tsx scripts/apply-chapter-summaries.ts
 */
import { PrismaClient } from "@prisma/client";
import { chapterSummary } from "./chapter-summaries";

async function main() {
  const db = new PrismaClient();

  const topics = await db.quizTopic.findMany({
    where: { slug: { startsWith: "drill-g" } },
    select: { id: true, slug: true, summary: true },
  });

  let updated = 0;
  let already = 0;
  const unknown: string[] = [];
  const missingTranslations: string[] = [];

  for (const topic of topics) {
    const line = chapterSummary(topic.slug);
    if (!line) {
      unknown.push(topic.slug);
      continue;
    }
    if (topic.summary === line.en) {
      already++;
    } else {
      await db.quizTopic.update({ where: { id: topic.id }, data: { summary: line.en } });
      updated++;
    }
    for (const [language, summary] of [
      ["hi", line.hi],
      ["mr", line.mr],
    ] as const) {
      // Update-only on purpose: a missing translation row has no translated
      // NAME to give it, so creating one here would half-translate the topic.
      // Report it instead.
      const result = await db.quizTopicTranslation.updateMany({
        where: { topicId: topic.id, language },
        data: { summary },
      });
      if (result.count === 0) missingTranslations.push(`${topic.slug} (${language})`);
    }
  }

  console.log(`drill topics found:      ${topics.length}`);
  console.log(`summaries written:       ${updated}`);
  console.log(`already up to date:      ${already}`);
  console.log(`slugs not in the table:  ${unknown.length}${unknown.length ? " — " + unknown.join(", ") : ""}`);
  console.log(
    `translation rows missing: ${missingTranslations.length}${missingTranslations.length ? " — " + missingTranslations.join(", ") : ""}`,
  );

  await db.$disconnect();
  if (unknown.length > 0) process.exit(1);
}

main();
