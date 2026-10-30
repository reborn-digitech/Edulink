/**
 * The bank's NCERT chapters and batch files put under the plan's numbers and books (owner-batch-item8, 31 October 2026).
 *
 *   npm run quiz:book-lines                          the review: every chapter line and batch file that changes, and why
 *   npm run quiz:book-lines -- --apply               writes them (owner connection: with-admin-db.mjs wraps it)
 *   [--grades=11,12]                                 only these classes
 *
 * THE FAULT. An NCERT class and subject with two books under one chapter number drafted only the newest book's chapter
 * (select.ts took the most recently modified document for a number), so class 12 political science's Contemporary World
 * Politics, class 11's Political Theory or Indian Constitution at Work, one of each economics and geography book of 11
 * and 12, Physics, Mathematics and Chemistry Part I or Part II, and Themes in Indian History II and III were never
 * drafted; where a Part II chapter was drafted, it landed under its file's number ("Chapter 1 — Optical Instruments",
 * ncert-12-physics-1.json) where the book prints and the authored bank numbers it 9.
 *
 * THE PLAN NOW (scripts/quiz-gen/select.ts planNcert). Parts of one book are numbered on; two different books under one
 * number are both planned, each chapter naming its book: the bank's line "Chapter 5 (Politics in India Since
 * Independence) — Challenges to and Restoration of the Congress System", the batch file ncert-12-civics-leps2-5.json, the
 * run's served count read by that line. A book another replaced (class 8's 2024 books) is left out.
 *
 * WHAT THIS WRITES, so the bank already drafted reads under the plan:
 *   - a live SCHOOL NCERT chapter (QuizTopic) whose line the plan numbers or names otherwise gets the plan's line. Which
 *     book and chapter it is comes from its generated batch files (their `book` and file number, the name agreeing);
 *     a chapter with no batch, in a class whose plan names its books, by the one book chapter of its number whose title
 *     agrees with its name. Name and slug unchanged; an audit row "operator.quizTopic.rename" (meta.via this file, the
 *     old and new line, rule "book" or "serial"). An authored chapter whose line already has the plan's number is left.
 *   - each batch file (content/quiz/generated and its held/) is renamed to the plan's name and its `chapter` set to its
 *     chapter's line; a batch of a replaced book takes the book's code ("ncert-8-maths-hemh1-9.json") so the current
 *     book's chapter can be drafted under the plain name.
 * Idempotent. Every decision of an applied run is recorded in storage/corpus/book-lines-<date>.json (-2, -3… after it);
 * a review run writes book-lines-<date>-review.json. While a generation run that started before this change is active,
 * apply only to classes it will not reach before it is restarted (--grades): it would draft the old way under the old
 * names, and the bank check refuses two batches on one slug.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { CORPUS_ROOT } from "./corpus-lib";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";
import { chapterBookOf, chapterLineFor, chapterNameOf, chapterNumberOf } from "./quiz-gen/checks";
import { chapterTitleOf, planNcert, subjectCodeOf, type NcertChapter, type NcertPlan } from "./quiz-gen/select";
import { fileNameFor, OUT_DIR, readFileName } from "./quiz-gen/cli";
import { titlesAgree } from "./topic-titles";

config();

type Doc = { id: string; path: string; title: string; subject: string; gradeOrProgramme: string; extra: unknown };
type Batch = { dir: string; file: string; slug: string; book: string | null; chapter: string; name: string; json: Record<string, unknown> };
type Move = { dir: string; from: string; to: string; chapter: string; why: string };
type LineChange = { id: string; slug: string; from: string; to: string; rule: "book" | "serial"; why: string };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

/** The planned chapter a batch is of: by its book and its file's number (an older plan's name) or the plan's name itself, the name agreeing. Pure. */
export function plannedChapterOfBatch<D extends { title: string }>(
  plan: NcertPlan<D>,
  batch: { file: string; book: string | null; name: string },
): { chapter: NcertChapter<D>; already: boolean } | { superseded: { code: string; title: string }; number: number } | null {
  const info = readFileName(batch.file);
  if (!info || !batch.book) return null;
  const agrees = (c: NcertChapter<D>) => {
    const title = chapterTitleOf(c.label, c.number);
    return !batch.name || !title || titlesAgree(title, batch.name);
  };
  const mine = plan.chapters.filter((c) => c.doc.title === batch.book && agrees(c));
  const already = mine.find((c) => c.planNumber === info.chapterNumber && (c.book?.code ?? null) === info.bookCode);
  if (already) return { chapter: already, already: true };
  if (info.bookCode === null) {
    const older = mine.find((c) => c.fileNumber === info.chapterNumber);
    if (older) return { chapter: older, already: false };
  }
  const gone = plan.superseded.find((s) => s.title === batch.book);
  if (gone) return { superseded: { code: gone.code, title: gone.title }, number: info.chapterNumber };
  return null;
}

function readBatches(dir: string, prefix: string): Batch[] {
  if (!existsSync(dir)) return [];
  const out: Batch[] = [];
  for (const file of readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).sort()) {
    try {
      const json = JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, unknown>;
      out.push({ dir, file, slug: String(json.slug ?? ""), book: typeof json.book === "string" ? json.book : null, chapter: String(json.chapter ?? ""), name: String(json.name ?? ""), json });
    } catch {
      continue;
    }
  }
  return out;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const grades = (arg("grades") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  await refuseUnlessLocalDatabase(db, "quiz:book-lines");
  const record: { grade: number; subject: string; plan: string[]; lines: LineChange[]; moves: Move[]; left: string[] }[] = [];
  try {
    const docs: Doc[] = await db.contentDocument.findMany({ where: { source: "ncert", kind: "textbook" }, select: { id: true, path: true, title: true, subject: true, gradeOrProgramme: true, extra: true }, orderBy: { path: "asc" } });
    const firsts = await db.$queryRaw<{ documentId: string; label: string | null }[]>`
      SELECT DISTINCT ON (c."documentId") c."documentId", COALESCE(c."chapter", c."headingPath"[1]) AS "label"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"
       WHERE d."source" = 'ncert' AND d."kind" = 'textbook' AND COALESCE(c."chapter", c."headingPath"[1], '') <> ''
       ORDER BY c."documentId", c."ordinal"`;
    const labelOf = new Map(firsts.map((f) => [f.documentId, f.label ?? ""]));
    const groups = new Map<string, Doc[]>();
    for (const d of docs) {
      const grade = Number(d.gradeOrProgramme);
      if (!Number.isInteger(grade) || (grades.length && !grades.includes(grade))) continue;
      try {
        subjectCodeOf(d.subject);
      } catch {
        continue;
      }
      groups.set(`${grade}|${d.subject}`, [...(groups.get(`${grade}|${d.subject}`) ?? []), d]);
    }
    for (const group of groups.values()) {
      const grade = Number(group[0]!.gradeOrProgramme);
      const subject = group[0]!.subject;
      const code = subjectCodeOf(subject);
      const plan = planNcert(group, (d) => labelOf.get(d.id) ?? "");
      const changes = plan.named || plan.superseded.length > 0 || plan.chapters.some((c) => c.planNumber !== c.fileNumber);
      if (!changes) continue;
      const entry = { grade, subject, plan: plan.chapters.map((c) => `${c.planNumber}${c.book ? ` (${c.book.title})` : ""}: ${c.doc.path}`), lines: [] as LineChange[], moves: [] as Move[], left: [] as string[] };
      const prefix = `ncert-${grade}-${code.toLowerCase()}-`;
      const batches = [...readBatches(OUT_DIR, prefix), ...readBatches(join(OUT_DIR, "held"), prefix)].filter((b) => readFileName(b.file)?.classLevel === grade);
      const topics = await db.quizTopic.findMany({ where: { audience: "SCHOOL", board: "NCERT", classLevel: grade, subject: code, retiredAt: null }, select: { id: true, slug: true, chapter: true, name: true } });

      // 1. Each batch's chapter in the plan.
      const ofBatch = new Map<Batch, ReturnType<typeof plannedChapterOfBatch<Doc>>>();
      for (const b of batches) ofBatch.set(b, plannedChapterOfBatch(plan, b));

      // 2. The chapters' lines.
      const lineOf = new Map<string, string>();
      for (const t of topics) {
        lineOf.set(t.slug, t.chapter);
        const mine = [...new Set(batches.filter((b) => b.slug === t.slug).map((b) => ofBatch.get(b)).filter((x): x is { chapter: NcertChapter<Doc>; already: boolean } => !!x && "chapter" in x).map((x) => x.chapter))];
        let c: NcertChapter<Doc> | null = null;
        let why = "";
        if (mine.length === 1) {
          c = mine[0]!;
          why = `its batch is "${c.doc.title}" chapter ${c.fileNumber} (${c.doc.path})`;
        } else if (mine.length > 1) {
          entry.left.push(`${t.slug} (${t.chapter}): its batches are of ${mine.length} chapters (${mine.map((m) => m.doc.path).join(", ")}): left`);
          continue;
        } else if (plan.named && chapterBookOf(t.chapter) === null) {
          const n = chapterNumberOf(t.chapter);
          const agree = plan.chapters.filter((p) => p.planNumber === n && titlesAgree(chapterTitleOf(p.label, p.number), t.name));
          if (agree.length === 1) {
            c = agree[0]!;
            why = `no batch; the only chapter ${n} whose title agrees with its name is "${c.doc.title}"'s (${c.doc.path})`;
          } else {
            entry.left.push(`${t.slug} (${t.chapter}): no batch, and ${agree.length} books' chapter ${n} agree with its name: left`);
            continue;
          }
        } else continue;
        const want = chapterLineFor(c.planNumber, chapterNameOf(t.chapter) || t.name, c.book?.title ?? null);
        if (chapterNumberOf(t.chapter) === c.planNumber && chapterBookOf(t.chapter) === (c.book?.title ?? null)) continue;
        entry.lines.push({ id: t.id, slug: t.slug, from: t.chapter, to: want, rule: c.book ? "book" : "serial", why });
        lineOf.set(t.slug, want);
      }

      // 3. The batch files' names and lines.
      for (const b of batches) {
        const at = ofBatch.get(b);
        if (!at) {
          entry.left.push(`${b.dir === OUT_DIR ? "" : "held/"}${b.file} ("${b.book}", ${b.name}): no chapter of the plan is it: left`);
          continue;
        }
        let to: string;
        let chapter: string;
        let why: string;
        if ("superseded" in at) {
          to = `${fileNameFor({ board: "NCERT", classLevel: grade, subjectCode: code, chapterNumber: at.number, planBook: { code: at.superseded.code } })}.json`;
          chapter = b.chapter;
          why = `a batch of "${at.superseded.title}", which the plan leaves out: named by its book so the current book's chapter ${at.number} can be drafted under the plain name`;
        } else {
          to = `${fileNameFor({ board: "NCERT", classLevel: grade, subjectCode: code, chapterNumber: at.chapter.planNumber, planBook: at.chapter.book })}.json`;
          chapter = lineOf.get(b.slug) ?? chapterLineFor(at.chapter.planNumber, b.name, at.chapter.book?.title ?? null);
          why = `"${at.chapter.doc.title}" chapter ${at.chapter.fileNumber} is the plan's ${at.chapter.planNumber}${at.chapter.book ? ` of ${at.chapter.book.code}` : ""}`;
        }
        if (to === b.file && chapter === b.chapter) continue;
        entry.moves.push({ dir: b.dir, from: b.file, to, chapter, why });
      }
      // Two batches to one name, or onto a file that stays: neither moves.
      const targets = new Map<string, number>();
      for (const m of entry.moves) targets.set(join(m.dir, m.to), (targets.get(join(m.dir, m.to)) ?? 0) + 1);
      const sources = new Set(entry.moves.map((m) => join(m.dir, m.from)));
      entry.moves = entry.moves.filter((m) => {
        const target = join(m.dir, m.to);
        const clash = (targets.get(target) ?? 0) > 1 ? "two batches would take that name" : m.to !== m.from && existsSync(target) && !sources.has(target) ? "a batch that stays has that name" : null;
        if (clash) entry.left.push(`${m.from} → ${m.to}: ${clash}: left`);
        return !clash;
      });
      record.push(entry);
    }

    // The review.
    let lines = 0;
    let moves = 0;
    for (const e of record) {
      if (!e.lines.length && !e.moves.length && !e.left.length) continue;
      console.log(`\nNCERT class ${e.grade} ${e.subject}`);
      for (const l of e.lines) console.log(`  line  ${l.slug}: "${l.from}" → "${l.to}"  (${l.why})`);
      for (const m of e.moves) console.log(`  file  ${m.dir === OUT_DIR ? "" : "held/"}${m.from} → ${m.to}${m.from === m.to ? " (its line only)" : ""}  (${m.why})`);
      for (const x of e.left) console.log(`  left  ${x}`);
      lines += e.lines.length;
      moves += e.moves.length;
    }
    console.log(`\n${lines} chapter line(s) and ${moves} batch file(s) ${apply ? "to write" : "would change"}${grades.length ? ` (classes ${grades.join(", ")})` : ""}.`);

    if (apply) {
      for (const e of record) {
        for (const l of e.lines) {
          await db.quizTopic.update({ where: { id: l.id }, data: { chapter: l.to } });
          // The audit row: no actor and no school; the script named in meta.via (as corpus-titles.ts writes it).
          const meta = JSON.stringify({ via: "scripts/quiz-book-lines.ts", slug: l.slug, from: { chapter: l.from }, to: { chapter: l.to }, rule: l.rule, why: l.why });
          await db.$executeRaw`
            INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
            VALUES (${randomUUID()}, NULL, NULL, ${"operator.quizTopic.rename"}, ${"QuizTopic"}, ${l.id}, ${meta}, NULL, ${new Date().toISOString()}::timestamp)`;
        }
        // Two steps, so a batch can take a name another batch is leaving.
        const staged = e.moves.map((m) => {
          const json = JSON.parse(readFileSync(join(m.dir, m.from), "utf8")) as Record<string, unknown>;
          const tmp = join(m.dir, `${m.from}.book-lines-tmp`);
          renameSync(join(m.dir, m.from), tmp);
          return { m, json, tmp };
        });
        for (const { m, json, tmp } of staged) {
          writeFileSync(join(m.dir, m.to), JSON.stringify({ ...json, chapter: m.chapter }, null, 2) + "\n");
          rmSync(tmp);
        }
      }
      console.log("Written.");
    } else {
      console.log("Nothing written: --apply writes them.");
    }
  } finally {
    await db.$disconnect();
  }
  mkdirSync(CORPUS_ROOT, { recursive: true });
  let out = join(CORPUS_ROOT, `book-lines-${today()}${apply ? "" : "-review"}.json`);
  for (let i = 2; apply && existsSync(out); i++) out = join(CORPUS_ROOT, `book-lines-${today()}-${i}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), applied: apply, grades: grades.length ? grades : "all", record }, null, 2) + "\n");
  console.log(`Decisions: ${out}`);
}

if (process.argv[1] && /quiz-book-lines\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
