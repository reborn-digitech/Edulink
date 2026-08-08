/**
 * Removes the pre-refurbishment bank: every drill-* topic (the 2025 generated
 * million) and the nine 2025 hand-authored G8 topics. Cascades take their
 * questions, translations, attempts, responses, mastery and practice
 * assignments; badges earned on them are deleted first by id prefix.
 *
 * ⚠ IRREVERSIBLE, and run on explicit user instruction ("remove all the old
 * banks from all grades and keep only the new ones", 2026-08-08). Counts are
 * printed before and after so the ledger shows exactly what left.
 *
 * Run: node scripts/with-admin-db.mjs npx tsx scripts/purge-old-bank.ts
 */
import { PrismaClient } from "@prisma/client";

const LEGACY_G8 = [
  "civics-8-indian-constitution",
  "geography-8-resources",
  "history-8-freedom-movement",
  "maths-8-linear-equations",
  "maths-8-mensuration",
  "maths-8-squares-and-square-roots",
  "science-8-chemical-effects-of-current",
  "science-8-force-and-pressure",
  "science-8-light",
];

async function main() {
  const db = new PrismaClient();

  const old = await db.quizTopic.findMany({
    where: { OR: [{ slug: { startsWith: "drill-" } }, { slug: { in: LEGACY_G8 } }] },
    select: { id: true, slug: true },
  });
  const oldIds = old.map((t) => t.id);
  const before = {
    topics: old.length,
    questions: await db.quizQuestion.count({ where: { topicId: { in: oldIds } } }),
    attempts: await db.quizAttempt.count({ where: { topicId: { in: oldIds } } }),
    mastery: await db.quizMastery.count({ where: { topicId: { in: oldIds } } }),
  };
  console.log("to remove:", JSON.stringify(before));

  // Badges first — they reference topics only through the badgeId string, so
  // no cascade would reach them.
  let badges = 0;
  for (const t of old) {
    const gone = await db.earnedBadge.deleteMany({
      where: { OR: [{ badgeId: `abhyaas:${t.slug}` }, { badgeId: { startsWith: `abhyaas:${t.slug}:` } }] },
    });
    badges += gone.count;
  }
  console.log("badges deleted:", badges);

  const topics = await db.quizTopic.deleteMany({ where: { id: { in: oldIds } } });
  console.log("topics deleted:", topics.count);

  const remaining = await db.quizTopic.findMany({
    select: { slug: true },
    orderBy: [{ classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
  });
  const questionsLeft = await db.quizQuestion.count();
  console.log(`remaining topics: ${remaining.length}, questions: ${questionsLeft}`);
  for (const t of remaining) console.log("  " + t.slug);

  const strayDrill = await db.quizTopic.count({ where: { slug: { startsWith: "drill-" } } });
  const strayBadges = await db.earnedBadge.count({ where: { badgeId: { startsWith: "abhyaas:drill-" } } });
  console.log(`residue check — drill topics: ${strayDrill}, drill badges: ${strayBadges}`);

  await db.$disconnect();
  if (strayDrill || strayBadges) process.exit(1);
}

main();
