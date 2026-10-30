/**
 * The Balbharati books re-cut at their chapter starts (owner-batch-item11, 31 October 2026).
 *
 *   npm run corpus:reextract -- --plan     the books: every planned Balbharati textbook of classes 3 to 12 (the subjects the
 *                                          generator plans), one of each edition, the Commerce books and class 8 science
 *                                          left out; writes <staging>/paths.txt for the ingest
 *   npm run corpus:ingest -- --to-staging=<staging> --paths-file=<staging>/paths.txt [--shard=k/n]
 *                                          the ingest's own extract path, each book written to <staging>/books/ as JSON,
 *                                          nothing live replaced and nothing embedded
 *   npm run corpus:reextract -- --check    the report per book: chunks before and after, chapters, chunks crossing a
 *                                          chapter start before and after, the labels against item 7's, tokens per chunk,
 *                                          the figures, and what refers to the live chunks; <staging>/check.json
 *   npm run corpus:reextract -- --apply --dry-run
 *                                          the apply's plan per book (live rows deleted, staged rows created, or why the
 *                                          book is refused) and the embedding it would ask for; touches nothing
 *   npm run corpus:reextract -- --apply [--no-embed] [--only=path,path]
 *                                          each book that passes: its live chunks replaced by the staged ones in ONE
 *                                          transaction (the ContentDocument row and its id kept, the chunks new), then the
 *                                          new chunks embedded through the ingest's own embed pass (corpus:ingest
 *                                          --embed-only --paths-file, the embeddings server of ASSISTANT_EMBED_URL), and a
 *                                          decisions file storage/corpus/reextract-<date>.json (never overwritten)
 *   [--staging=storage/corpus/reextract-2026-10-31]
 *
 * THE APPLY REFUSES a book (and goes on with the others) whose staged file is missing, whose chapters were not split, that
 * check.json does not pass or checked before the staging, whose live document is not the one the staging read (id or
 * checksum) or whose live chunks changed in number since the check (corpus-reextract-lib.ts applyRefusal). A figure or
 * captions file the staging wrote to <staging>/files/ is copied into the corpus first (a figure only where none is).
 *
 * WHY. Item 7 (30 Oct 2026) relabelled the chunks of 84 Balbharati books by the page each starts on, but did not re-cut
 * them: at 514 of 1,067 chapter boundaries a chunk runs onto the next chapter's opening page, so retrieval and drafting
 * take one chapter's words for another's. The ingest now cuts at each chapter's start (corpus-contents.ts
 * withChapterHeadings), so a re-extract mends it. Class 8 science is left out: its generated questions cite chunk
 * ordinals, and its own headings already split it.
 *
 * --plan, --check and --apply --dry-run read only: the database as the owner (with-admin-db.mjs), the staging folder, the
 * decisions files of item 7 (storage/corpus/balbharati-chapters-2026-10-30*.json) and the generated batches, and write
 * only into the staging folder. --apply writes the ContentChunk rows of the books it replaces, and their vectors.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { config } from "dotenv";
import { QUIZ_GEN_SUBJECTS } from "@edulink/contracts";
import { CORPUS_ROOT } from "./corpus-lib";
import { chooseBooks, chapterLabel, type BookChapter } from "./corpus-contents";
import { applyRefusal, bookTransaction, boundariesCrossed, chapterLabelsOf, chunksCrossing, labelProblems, tokenStats, type BookTransaction, type ChapterSpan, type CheckedForApply, type TokenStats } from "./corpus-reextract-lib";
import { subjectCodeOf } from "./quiz-gen/select";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

export const DEFAULT_STAGING = join(CORPUS_ROOT, "reextract-2026-10-31");
const STAGING = arg("staging") ?? DEFAULT_STAGING;
/** Left out on purpose: its generated questions cite chunk ordinals (the brief), and its own headings already split it. */
const LEFT_OUT = [/^balbharati\/8\/science\//];

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/** A staged book as `corpus:ingest --to-staging` writes it. */
export type StagedBook = {
  at: string;
  path: string;
  documentId: string | null;
  sha256: string;
  pages: number;
  ocrPages: number;
  document: Record<string, unknown>;
  split: { method: string | null; contentsPage: number | null; refusal: string | null; notes: string[]; chapters: BookChapter[] } | null;
  chunks: { ordinal: number; chapter: string | null; section: string | null; headingPath: string[]; pageStart: number; pageEnd: number; text: string; language: string; tokens: number; figureKeys: string[]; edition: string | null; kind: string | null }[];
  figures: { total: number; missingLive: string[] };
};

export const stagedFileName = (path: string) => `${path.replace(/\//g, "__")}.json`;

type Doc = { id: string; path: string; title: string; subject: string; gradeOrProgramme: string; extra: Prisma.JsonValue };

async function plannedBooks(): Promise<{ books: Doc[]; left: { path: string; why: string }[] }> {
  const all: Doc[] = await db.contentDocument.findMany({
    where: { source: "balbharati", kind: "textbook" },
    select: { id: true, path: true, title: true, subject: true, gradeOrProgramme: true, extra: true },
    orderBy: { path: "asc" },
  });
  const planned = (d: Doc) => {
    try {
      return (QUIZ_GEN_SUBJECTS as readonly string[]).includes(subjectCodeOf(d.subject));
    } catch {
      return false;
    }
  };
  const left: { path: string; why: string }[] = [];
  const combos = new Map<string, Doc[]>();
  for (const d of all) {
    const g = Number(d.gradeOrProgramme);
    if (!(Number.isInteger(g) && g >= 3 && g <= 12)) {
      left.push({ path: d.path, why: `class ${d.gradeOrProgramme}` });
      continue;
    }
    if (!planned(d)) {
      left.push({ path: d.path, why: `subject "${d.subject}" is not one the generator plans` });
      continue;
    }
    const key = `${d.gradeOrProgramme}|${d.subject.toLowerCase()}`;
    combos.set(key, [...(combos.get(key) ?? []), d]);
  }
  const books: Doc[] = [];
  for (const group of combos.values()) {
    const choice = chooseBooks(group);
    for (const e of choice.editions) left.push({ path: e.doc.path, why: `edition of ${e.of.path}` });
    for (const m of choice.misfiled) left.push({ path: m.doc.path, why: `misfiled: ${m.reason}` });
    for (const m of choice.otherStream) left.push({ path: m.doc.path, why: "the Commerce stream's book" });
    for (const b of choice.books) {
      if (LEFT_OUT.some((re) => re.test(b.path))) left.push({ path: b.path, why: "class 8 science: its generated questions cite chunk ordinals" });
      else books.push(b);
    }
  }
  books.sort((a, b) => Number(a.gradeOrProgramme) - Number(b.gradeOrProgramme) || a.path.localeCompare(b.path));
  return { books, left };
}

/** Item 7's chapters per book, from its decisions files (the applied run, then the class 3 EVS part 2 apply, the review for the rest). */
function item7Chapters(): Map<string, ChapterSpan[]> {
  const out = new Map<string, ChapterSpan[]>();
  for (const name of ["balbharati-chapters-2026-10-30-review.json", "balbharati-chapters-2026-10-30.json", "balbharati-chapters-2026-10-30-2.json"]) {
    const file = join(CORPUS_ROOT, name);
    if (!existsSync(file)) continue;
    const d = JSON.parse(readFileSync(file, "utf8")) as { books: { path: string; outcome: string; chapters: { label: string; pages: string }[] }[] };
    for (const b of d.books) {
      if (b.outcome !== "split" || !b.chapters.length) continue;
      out.set(
        b.path,
        b.chapters.map((c) => {
          const [s, e] = c.pages.split("–").map(Number) as [number, number];
          return { label: c.label, startPage: s, endPage: e };
        }),
      );
    }
  }
  return out;
}

/** Questions in the generated and held batches whose sources cite a chunk of each document (by its ordinal). */
function batchCitations(): Map<string, { files: Set<string>; questions: number }> {
  const out = new Map<string, { files: Set<string>; questions: number }>();
  const root = join(process.cwd(), "content", "quiz", "generated");
  for (const dir of [root, join(root, "held")]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      let d: { questions?: { sources?: { document?: string }[] }[] };
      try {
        d = JSON.parse(readFileSync(join(dir, f), "utf8"));
      } catch {
        continue;
      }
      for (const q of d.questions ?? []) {
        const docs = new Set((q.sources ?? []).map((s) => s.document).filter((x): x is string => !!x));
        for (const p of docs) {
          const hit = out.get(p) ?? { files: new Set<string>(), questions: 0 };
          hit.files.add(f);
          hit.questions++;
          out.set(p, hit);
        }
      }
    }
  }
  return out;
}

/** Assistant citations (CachedAnswer, AssistantMessage) that carry a chunk id, by chunk id. */
async function citedChunkIds(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const rows = [
    ...(await db.$queryRaw<{ c: string }[]>`SELECT "citationsJson" AS c FROM "CachedAnswer" WHERE "citationsJson" LIKE '%chunkId%'`),
    ...(await db.$queryRaw<{ c: string }[]>`SELECT "citationsJson" AS c FROM "AssistantMessage" WHERE "citationsJson" LIKE '%chunkId%'`),
  ];
  for (const r of rows) {
    try {
      for (const c of JSON.parse(r.c) as { chunkId?: string }[]) if (c.chunkId) out.set(c.chunkId, (out.get(c.chunkId) ?? 0) + 1);
    } catch {
      /* a row that does not parse cites nothing we can read */
    }
  }
  return out;
}

type BookCheck = {
  path: string;
  grade: string;
  subject: string;
  title: string;
  outcome: "staged" | "not staged" | "refused" | "problems";
  problems: string[];
  chunksBefore: number;
  chunksAfter: number;
  chapters: number;
  method: string | null;
  labelsEqualItem7: boolean | null;
  pagesEqualItem7: boolean | null;
  labelDiff: string[];
  crossingBefore: { chunks: number; boundaries: number; crossedBoundaries: number };
  crossingAfter: { chunks: number; crossedBoundaries: number };
  labelProblems: string[];
  tokensBefore: TokenStats;
  tokensAfter: TokenStats | null;
  figures: { total: number; missingLive: number } | null;
  references: { batchFiles: number; batchQuestions: number; generationRows: number; assistantCitations: number };
  documentChanges: string[];
};

async function check() {
  const pathsFile = join(STAGING, "paths.txt");
  if (!existsSync(pathsFile)) throw new Error(`${pathsFile} is missing: run --plan first`);
  const paths = readFileSync(pathsFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  const item7 = item7Chapters();
  const batches = batchCitations();
  const cited = await citedChunkIds();
  const checks: BookCheck[] = [];
  for (const path of paths) {
    const doc = await db.contentDocument.findUnique({ where: { path }, select: { id: true, title: true, subject: true, gradeOrProgramme: true, edition: true, pageCount: true, sha256: true, extra: true, board: true, language: true, sourceUrl: true } });
    const live = doc ? await db.contentChunk.findMany({ where: { documentId: doc.id }, orderBy: { ordinal: "asc" }, select: { id: true, chapter: true, headingPath: true, pageStart: true, pageEnd: true, tokens: true, text: true } }) : [];
    const generationRows = (await db.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM "QuizQuestion" WHERE "generation" LIKE ${"%" + path + "%"}`)[0]?.n ?? 0n;
    const liveIds = new Set(live.map((r) => r.id));
    const assistantCitations = [...cited].filter(([id]) => liveIds.has(id)).reduce((n, [, k]) => n + k, 0);
    const b = batches.get(path);
    const base: BookCheck = {
      path,
      grade: doc?.gradeOrProgramme ?? "?",
      subject: doc?.subject ?? "?",
      title: doc?.title ?? "?",
      outcome: "not staged",
      problems: [],
      chunksBefore: live.length,
      chunksAfter: 0,
      chapters: 0,
      method: null,
      labelsEqualItem7: null,
      pagesEqualItem7: null,
      labelDiff: [],
      crossingBefore: { chunks: 0, boundaries: 0, crossedBoundaries: 0 },
      crossingAfter: { chunks: 0, crossedBoundaries: 0 },
      labelProblems: [],
      tokensBefore: tokenStats(live),
      tokensAfter: null,
      figures: null,
      references: { batchFiles: b?.files.size ?? 0, batchQuestions: b?.questions ?? 0, generationRows: Number(generationRows), assistantCitations },
      documentChanges: [],
    };
    const mine = item7.get(path) ?? [];
    if (mine.length) {
      const before = boundariesCrossed(live, mine);
      base.crossingBefore = { chunks: chunksCrossing(live, mine).length, boundaries: before.boundaries, crossedBoundaries: before.crossed.length };
    }
    const file = join(STAGING, "books", stagedFileName(path));
    if (!existsSync(file)) {
      base.problems.push("no staged file (the ingest failed or did not reach it)");
      checks.push(base);
      continue;
    }
    const staged = JSON.parse(readFileSync(file, "utf8")) as StagedBook;
    base.chunksAfter = staged.chunks.length;
    base.figures = { total: staged.figures.total, missingLive: staged.figures.missingLive.length };
    if (!staged.split || staged.split.refusal) {
      base.outcome = "refused";
      base.problems.push(`chapters not split: ${staged.split?.refusal ?? "no split"}`);
      checks.push(base);
      continue;
    }
    const chapters: ChapterSpan[] = staged.split.chapters.map((c) => ({ label: chapterLabel(c), startPage: c.startPage, endPage: c.endPage }));
    base.chapters = chapters.length;
    base.method = staged.split.method;
    const after = boundariesCrossed(staged.chunks, chapters);
    base.crossingAfter = { chunks: chunksCrossing(staged.chunks, chapters).length, crossedBoundaries: after.crossed.length };
    base.labelProblems = labelProblems(staged.chunks, chapters);
    base.tokensAfter = tokenStats(staged.chunks);
    // A book item 7's decisions list as "kept" (class 10 geography, history and mathematics part 1, written by its first,
    // stopped apply) is measured before against the staged chapters, whose labels the check below compares with the live ones.
    if (!mine.length) {
      const before = boundariesCrossed(live, chapters);
      base.crossingBefore = { chunks: chunksCrossing(live, chapters).length, boundaries: before.boundaries, crossedBoundaries: before.crossed.length };
    }
    // Item 7's labels: its decisions file's chapters, and the labels the live chunks carry.
    const liveLabels = chapterLabelsOf(live);
    const stagedLabels = chapterLabelsOf(staged.chunks);
    const want = mine.length ? mine.map((c) => c.label) : liveLabels;
    base.labelsEqualItem7 = want.length === chapters.length && want.every((l, i) => l === chapters[i]!.label) && stagedLabels.length === chapters.length;
    base.pagesEqualItem7 = mine.length ? mine.length === chapters.length && mine.every((c, i) => c.startPage === chapters[i]!.startPage && c.endPage === chapters[i]!.endPage) : null;
    if (!base.labelsEqualItem7) {
      for (const l of want) if (!chapters.some((c) => c.label === l)) base.labelDiff.push(`item 7 "${l}", not staged`);
      for (const c of chapters) if (!want.includes(c.label)) base.labelDiff.push(`staged "${c.label}", not item 7's`);
      for (const c of chapters) if (!stagedLabels.includes(c.label)) base.labelDiff.push(`staged chapter "${c.label}" holds no chunk`);
    }
    if (base.pagesEqualItem7 === false) {
      for (let i = 0; i < Math.max(mine.length, chapters.length); i++) {
        const a = mine[i];
        const c = chapters[i];
        if (!a || !c || a.startPage !== c.startPage || a.endPage !== c.endPage) base.labelDiff.push(`pages: item 7 ${a ? `${a.label} ${a.startPage}–${a.endPage}` : "—"}, staged ${c ? `${c.label} ${c.startPage}–${c.endPage}` : "—"}`);
      }
    }
    if (liveLabels.join("\n") !== want.join("\n")) base.problems.push(`the live chunks' labels are not item 7's decisions (${liveLabels.length} live, ${want.length} decided)`);
    // What the document row would become.
    if (doc) {
      const d = staged.document as Record<string, unknown>;
      for (const k of ["title", "subject", "gradeOrProgramme", "edition", "pageCount", "sha256", "board", "language", "sourceUrl"] as const) {
        const now = (doc as Record<string, unknown>)[k];
        if (d[k] !== undefined && String(d[k] ?? "") !== String(now ?? "")) base.documentChanges.push(`${k}: "${String(now ?? "")}" → "${String(d[k] ?? "")}"`);
      }
    } else base.documentChanges.push("no live document: the apply would create it");
    if (base.crossingAfter.chunks) base.problems.push(`${base.crossingAfter.chunks} staged chunk(s) cross a chapter start`);
    if (base.labelProblems.length) base.problems.push(`${base.labelProblems.length} label problem(s)`);
    if (!base.labelsEqualItem7) base.problems.push("chapter labels differ from item 7's");
    if (base.pagesEqualItem7 === false) base.problems.push("chapter pages differ from item 7's");
    if (base.tokensAfter.overMax) base.problems.push(`${base.tokensAfter.overMax} chunk(s) over the chunker's bound`);
    base.outcome = base.problems.length ? "problems" : "staged";
    checks.push(base);
  }

  const sum = (f: (c: BookCheck) => number) => checks.reduce((n, c) => n + f(c), 0);
  console.log(`${checks.length} books; staged clean ${checks.filter((c) => c.outcome === "staged").length}, with problems ${checks.filter((c) => c.outcome === "problems").length}, refused ${checks.filter((c) => c.outcome === "refused").length}, not staged ${checks.filter((c) => c.outcome === "not staged").length}`);
  console.log(`chunks: ${sum((c) => c.chunksBefore)} live → ${sum((c) => c.chunksAfter)} staged; chapters ${sum((c) => c.chapters)}`);
  console.log(`crossing a chapter start: before ${sum((c) => c.crossingBefore.chunks)} chunks, ${sum((c) => c.crossingBefore.crossedBoundaries)} of ${sum((c) => c.crossingBefore.boundaries)} boundaries; after ${sum((c) => c.crossingAfter.chunks)} chunks, ${sum((c) => c.crossingAfter.crossedBoundaries)} boundaries`);
  console.log(`labels equal to item 7's: ${checks.filter((c) => c.labelsEqualItem7).length} of ${checks.length}; pages equal: ${checks.filter((c) => c.pagesEqualItem7).length}`);
  console.log(`references to the live chunks: ${sum((c) => c.references.batchQuestions)} batch questions in ${sum((c) => c.references.batchFiles)} files, ${sum((c) => c.references.generationRows)} QuizQuestion rows naming the path, ${sum((c) => c.references.assistantCitations)} assistant citations by chunk id`);
  console.log("");
  console.log("class subject path | chunks before → after | chapters | crossing before → after (chunks; boundaries) | labels=7 | tokens min/median/max (over, short) | figures missing | refs q/gen/cit | outcome");
  for (const c of checks) {
    const t = c.tokensAfter;
    console.log(
      `${c.grade.padStart(2)} ${c.subject.padEnd(22)} ${c.path.padEnd(52)} | ${String(c.chunksBefore).padStart(3)} → ${String(c.chunksAfter).padStart(3)} | ${String(c.chapters).padStart(2)} | ${c.crossingBefore.chunks} → ${c.crossingAfter.chunks}; ${c.crossingBefore.crossedBoundaries}/${c.crossingBefore.boundaries} → ${c.crossingAfter.crossedBoundaries} | ${c.labelsEqualItem7 === null ? "—" : c.labelsEqualItem7 ? "yes" : "NO"}${c.pagesEqualItem7 === false ? " (pages differ)" : ""} | ${t ? `${t.min}/${t.median}/${t.max} (${t.overMax}, ${t.short})` : "—"} | ${c.figures?.missingLive ?? "—"} | ${c.references.batchQuestions}/${c.references.generationRows}/${c.references.assistantCitations} | ${c.outcome}`,
    );
    for (const p of c.problems) console.log(`      ! ${p}`);
    for (const d of c.labelDiff.slice(0, 8)) console.log(`      · ${d}`);
    for (const d of c.labelProblems.slice(0, 5)) console.log(`      · ${d}`);
    for (const d of c.documentChanges) console.log(`      ~ ${d}`);
  }
  const out = join(STAGING, "check.json");
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), via: "scripts/corpus-reextract.ts --check", staging: STAGING, books: checks }, null, 2) + "\n");
  console.log(`\nreport: ${out}`);
}

async function plan() {
  const { books, left } = await plannedBooks();
  mkdirSync(STAGING, { recursive: true });
  writeFileSync(join(STAGING, "paths.txt"), books.map((b) => b.path).join("\n") + "\n");
  writeFileSync(join(STAGING, "plan.json"), JSON.stringify({ at: new Date().toISOString(), via: "scripts/corpus-reextract.ts --plan", books: books.map((b) => ({ path: b.path, grade: b.gradeOrProgramme, subject: b.subject, title: b.title })), leftOut: left }, null, 2) + "\n");
  console.log(`${books.length} books to re-extract:`);
  for (const b of books) console.log(`  ${b.gradeOrProgramme.padStart(2)} ${b.subject.padEnd(24)} ${b.path}  "${b.title}"`);
  const why = new Map<string, number>();
  for (const l of left) {
    const k = l.why.startsWith("edition of") ? "a district edition" : l.why.startsWith("subject") ? "a subject the generator does not plan" : l.why;
    why.set(k, (why.get(k) ?? 0) + 1);
  }
  console.log(`${left.length} left out:`);
  for (const [k, n] of why) console.log(`  ${n} × ${k}`);
  for (const l of left.filter((x) => !x.why.startsWith("edition of") && !x.why.startsWith("subject"))) console.log(`    ${l.path}: ${l.why}`);
  console.log(`paths: ${join(STAGING, "paths.txt")}`);
}

type ApplyLine = { path: string; documentId: string | null; refusal: string | null; tx: BookTransaction | null; replaced?: number; created?: number; embedded?: number; error?: string };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Every file under a folder, corpus-relative to it. */
function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const full = join(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(root, full).split("\\").join("/"));
    }
  };
  walk(root);
  return out;
}

async function apply() {
  const dryRun = arg("dry-run") === "true";
  const noEmbed = arg("no-embed") === "true";
  const only = arg("only") ? new Set(arg("only")!.split(",").map((x) => x.trim()).filter(Boolean)) : null;
  const pathsFile = join(STAGING, "paths.txt");
  if (!existsSync(pathsFile)) throw new Error(`${pathsFile} is missing: run --plan, the staging and --check first`);
  const paths = readFileSync(pathsFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean).filter((p) => !only || only.has(p));
  const checkFile = join(STAGING, "check.json");
  const checked = existsSync(checkFile) ? (JSON.parse(readFileSync(checkFile, "utf8")) as { at: string; books: CheckedForApply[] }) : null;
  console.log(`${dryRun ? "DRY RUN (nothing is written): " : ""}${paths.length} books from ${pathsFile}; check.json ${checked ? `of ${checked.at}` : "missing"}`);

  const lines: ApplyLine[] = [];
  for (const path of paths) {
    const file = join(STAGING, "books", stagedFileName(path));
    const staged = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as StagedBook) : null;
    const doc = await db.contentDocument.findUnique({ where: { path }, select: { id: true, sha256: true, _count: { select: { chunks: true } } } });
    const live = doc ? { documentId: doc.id, sha256: doc.sha256, chunks: doc._count.chunks } : null;
    const refusal = applyRefusal({ staged, check: checked?.books.find((b) => b.path === path) ?? null, checkAt: checked?.at ?? null, live });
    const tx = !refusal && staged && live ? bookTransaction({ ...staged, documentId: live.documentId }, live.chunks) : null;
    lines.push({ path, documentId: live?.documentId ?? null, refusal, tx });
  }
  const ok = lines.filter((l) => l.tx);
  const refused = lines.filter((l) => l.refusal);
  for (const l of lines) console.log(`  ${l.path.padEnd(52)} ${l.tx ? `document ${l.documentId}: delete ${String(l.tx.deletes).padStart(3)} live, create ${String(l.tx.creates.length).padStart(3)} staged` : `REFUSED: ${l.refusal}`}`);
  const toCopy = filesUnder(join(STAGING, "files"));
  console.log(`\n${ok.length} books to replace (${ok.reduce((n, l) => n + l.tx!.deletes, 0)} live chunks deleted, ${ok.reduce((n, l) => n + l.tx!.creates.length, 0)} staged chunks created), ${refused.length} refused; ${toCopy.length} figure or captions file(s) to copy into the corpus`);
  console.log(noEmbed ? "Embedding: not asked (--no-embed); the new chunks stay without a vector until corpus:ingest --embed-only runs" : `Embedding: the ${ok.reduce((n, l) => n + l.tx!.creates.length, 0)} new chunks of those books, through corpus:ingest --embed-only --paths-file (ASSISTANT_EMBED_URL)`);
  if (dryRun) return;

  for (const f of toCopy) {
    const to = join(CORPUS_ROOT, f);
    if (f.endsWith(".png") && existsSync(to)) continue;
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(STAGING, "files", f), to);
  }
  const started = new Date().toISOString();
  for (const l of ok) {
    const tx = l.tx!;
    try {
      await db.$transaction(
        async (t) => {
          const gone = await t.contentChunk.deleteMany({ where: { documentId: tx.documentId } });
          if (gone.count !== tx.deletes) throw new Error(`deleted ${gone.count} live chunks, ${tx.deletes} expected: somebody wrote them since the plan`);
          for (let i = 0; i < tx.creates.length; i += 500) await t.contentChunk.createMany({ data: tx.creates.slice(i, i + 500) });
          const now = await t.contentChunk.count({ where: { documentId: tx.documentId } });
          if (now !== tx.creates.length) throw new Error(`${now} chunks after the write, ${tx.creates.length} expected`);
        },
        { timeout: 120_000 },
      );
      l.replaced = tx.deletes;
      l.created = tx.creates.length;
      console.log(`  replaced ${l.path}: ${tx.deletes} live chunks → ${tx.creates.length}`);
    } catch (err) {
      l.error = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED ${l.path} (rolled back, its live chunks stand): ${l.error}`);
    }
  }
  await db.$executeRawUnsafe(`ANALYZE "ContentChunk"`);
  const applied = ok.filter((l) => l.created !== undefined);
  let out = join(CORPUS_ROOT, `reextract-${today()}.json`);
  for (let i = 2; existsSync(out); i++) out = join(CORPUS_ROOT, `reextract-${today()}-${i}.json`);
  const record = (embed: string) =>
    writeFileSync(
      out,
      JSON.stringify(
        {
          at: new Date().toISOString(),
          started,
          applied: true,
          via: "scripts/corpus-reextract.ts --apply",
          why: "owner-batch-item11: the Balbharati books re-cut at their chapter starts (item 7 relabelled without re-cutting; chunks ran onto the next chapter's opening page). Class 8 science left out.",
          staging: STAGING,
          checkAt: checked?.at ?? null,
          embedding: embed,
          books: lines.map((l) => ({ path: l.path, documentId: l.documentId, refusal: l.refusal, error: l.error ?? null, replaced: l.replaced ?? null, created: l.created ?? null, embedded: l.embedded ?? null })),
          copied: toCopy,
        },
        null,
        2,
      ) + "\n",
    );
  record(noEmbed ? "not asked (--no-embed)" : "pending");
  console.log(`decisions: ${out}`);

  if (!noEmbed && applied.length) {
    const list = join(STAGING, `embed-${Date.now()}.txt`);
    writeFileSync(list, applied.map((l) => l.path).join("\n") + "\n");
    console.log(`\nEmbedding ${applied.length} books through the ingest's own embed pass…`);
    const r = spawnSync("npm", ["run", "-s", "corpus:ingest", "--", "--embed-only", `--paths-file=${list}`], { stdio: "inherit", cwd: process.cwd(), env: process.env });
    if (r.status !== 0) console.error(`the embed pass exited ${r.status}: run npm run corpus:ingest -- --embed-only --paths-file=${list} again (it takes up where it stopped)`);
  }
  for (const l of applied) l.embedded = await db.contentChunk.count({ where: { documentId: l.documentId!, embeddedAt: { not: null } } });
  record(noEmbed ? "not asked (--no-embed)" : "done");
  console.log("\nper book: rows replaced → created, embedded");
  for (const l of lines) console.log(`  ${l.path.padEnd(52)} ${l.refusal ? `refused: ${l.refusal}` : l.error ? `failed: ${l.error}` : `${l.replaced} → ${l.created}, ${l.embedded} embedded`}`);
  const sum = (f: (l: ApplyLine) => number | undefined) => lines.reduce((n, l) => n + (f(l) ?? 0), 0);
  console.log(`\n${applied.length} books replaced: ${sum((l) => l.replaced)} live chunks → ${sum((l) => l.created)}, ${sum((l) => l.embedded)} embedded; ${refused.length} refused; ${lines.filter((l) => l.error).length} failed`);
  console.log(`decisions: ${out}`);
}

async function main() {
  await refuseUnlessLocalDatabase(db, "corpus:reextract");
  if (arg("plan") === "true") await plan();
  else if (arg("check") === "true") await check();
  else if (arg("apply") === "true") await apply();
  else throw new Error("say --plan, --check or --apply [--dry-run]");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
