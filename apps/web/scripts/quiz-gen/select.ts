/**
 * Chapter selection for the generator: the chapter's chunks in order from ContentChunk and
 * ContentDocument (the assistant's corpus, Phase A), with the edition and the figures the chunks
 * reference, captions read from the ingest's `<base>.captions.json` beside the PNGs.
 *
 * NCERT is one document per chapter (extra.chapter); Balbharati one document per book, cut by the
 * chapter name at the head of each chunk's headingPath ("3. Force and Pressure"). Two NCERT books
 * may cover one class and subject (the 2024 "Science" and the 2026 "Curiosity"): `--book=<code>`
 * picks one, else the most recently modified book is taken and the choice printed.
 *
 * Reads as the app role: the content tables are outside the tenant fence.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { PrismaClient } from "@prisma/client";
import type { AssistantEndpoint } from "../../src/lib/assistant-env";
import { asQuery, embedTexts, vectorLiteral } from "../../src/lib/assistant-model";
import { CORPUS_ROOT } from "../corpus-lib";
import { chapterNameOf, chapterNumberOf } from "./checks";

export type SelectedChunk = {
  id: string;
  ordinal: number;
  headingPath: string[];
  pageStart: number;
  pageEnd: number;
  text: string;
  tokens: number;
  figureKeys: string[];
};

export type Figure = { key: string; caption: string | null; page: number; exists: boolean };

export type SelectedChapter = {
  board: string;
  /** college-content (12 Oct 2026): "syllabi" for a college unit (scripts/quiz-gen/college.ts). */
  source: "ncert" | "balbharati" | "syllabi";
  book: string;
  bookCode: string | null;
  documentPath: string;
  classLevel: number;
  subject: string;
  /** The bank's subject code: SCIENCE, MATHS… */
  subjectCode: string;
  chapterNumber: number;
  chapterName: string;
  /** "Chapter 4 — Electricity: Magnetic and Heating Effects", as the bank writes it. */
  chapterLabel: string;
  edition: string | null;
  sourceUrl: string;
  chunks: SelectedChunk[];
  figures: Map<string, Figure>;
  headings: string[];
  /**
   * college-content (12 Oct 2026): a line the drafting prompt carries for a college unit (the passage is a
   * university syllabus, not a textbook: ask about what it lists, never about the syllabus itself).
   */
  draftNote?: string;
};

export type Board = "NCERT" | "Balbharati";

export function boardSource(board: string): { source: "ncert" | "balbharati"; board: Board } {
  const b = board.trim().toLowerCase();
  if (b === "ncert") return { source: "ncert", board: "NCERT" };
  if (b === "balbharati" || b === "msbshse") return { source: "balbharati", board: "Balbharati" };
  throw new Error(`--board is NCERT or Balbharati, not "${board}"`);
}

/** The bank's subject codes (scripts/verify-quiz.ts SUBJECTS) from the corpus's subject names. */
export function subjectCodeOf(subject: string): string {
  const s = subject.trim().toLowerCase();
  const table: [RegExp, string][] = [
    [/^math/, "MATHS"],
    [/^science|^general science/, "SCIENCE"],
    [/^physics/, "PHYSICS"],
    [/^chemistry/, "CHEMISTRY"],
    [/^biology/, "BIOLOGY"],
    [/^evs|environmental/, "EVS"],
    [/^history/, "HISTORY"],
    [/^geograph/, "GEOGRAPHY"],
    [/^civics|^political|^social and political/, "CIVICS"],
    [/^economics/, "ECONOMICS"],
  ];
  for (const [re, code] of table) if (re.test(s)) return code;
  throw new Error(`the bank has no subject code for "${subject}" (scripts/verify-quiz.ts SUBJECTS)`);
}

function editionOf(doc: { edition: string | null; year: string | null; extra: unknown }): string | null {
  if (doc.edition) return doc.edition;
  if (doc.year) return `${doc.year} edition`;
  const lm = (doc.extra as { lastModified?: string } | null)?.lastModified;
  const year = lm ? /\b(20\d\d)\b/.exec(lm)?.[1] : null;
  return year ? `${year} edition (the site's Last-Modified)` : null;
}

function readFigures(documentPath: string, keys: string[]): Map<string, Figure> {
  const out = new Map<string, Figure>();
  if (!keys.length) return out;
  const dir = dirname(join(CORPUS_ROOT, documentPath));
  const base = basename(documentPath).replace(/\.pdf$/i, "");
  let captions: Record<string, { page: number; caption: string | null }> = {};
  const captionFile = join(dir, "figures", `${base}.captions.json`);
  if (existsSync(captionFile)) {
    try {
      captions = JSON.parse(readFileSync(captionFile, "utf8"));
    } catch {
      captions = {};
    }
  }
  for (const key of keys) {
    const name = basename(key);
    const c = captions[name];
    const page = c?.page ?? Number(/-p(\d+)-\d+\.png$/.exec(name)?.[1] ?? 0);
    out.set(key, { key, caption: c?.caption ?? null, page, exists: existsSync(join(CORPUS_ROOT, key)) });
  }
  return out;
}

type DocRow = { id: string; path: string; board: string; subject: string; title: string; edition: string | null; year: string | null; sourceUrl: string; extra: unknown; gradeOrProgramme: string };

async function books(db: PrismaClient, source: "ncert" | "balbharati", grade: number, subject: string): Promise<DocRow[]> {
  return db.contentDocument.findMany({
    where: { source, kind: "textbook", gradeOrProgramme: String(grade), subject: { equals: subject, mode: "insensitive" } },
    select: { id: true, path: true, board: true, subject: true, title: true, edition: true, year: true, sourceUrl: true, extra: true, gradeOrProgramme: true },
    orderBy: { path: "asc" },
  });
}

/** The chapter's label from the first chunk that carries one: a title page's chunk may carry none. */
function firstLabel(rows: { chapter: string | null; headingPath: string[] }[]): string {
  for (const r of rows) {
    const label = (r.chapter ?? r.headingPath[0] ?? "").trim();
    if (label) return label;
  }
  return "";
}

function bookCodeOf(doc: DocRow): string | null {
  const extra = doc.extra as { bookCode?: string; bookId?: string } | null;
  return extra?.bookCode ?? extra?.bookId ?? null;
}

function lastModifiedOf(doc: DocRow): number {
  const lm = (doc.extra as { lastModified?: string } | null)?.lastModified;
  const t = lm ? Date.parse(lm) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/**
 * The chapters a board's book offers for a class and subject: number and name, for `--all-chapters` and for the usage
 * message. A chapter whose heading carries no title has the name "" and is reported through `log` (chapter-titles,
 * 19 Oct 2026: npm run corpus:titles mends most; the rest are listed in its decisions file).
 */
export async function listChapters(
  db: PrismaClient,
  args: { board: string; grade: number; subject: string; book?: string },
  log: (line: string) => void = () => {},
): Promise<{ number: number; name: string; bookCode: string | null; book: string }[]> {
  const { source } = boardSource(args.board);
  const docs = await books(db, source, args.grade, args.subject);
  const out: { number: number; name: string; bookCode: string | null; book: string }[] = [];
  if (source === "ncert") {
    for (const d of docs) {
      const code = bookCodeOf(d);
      if (args.book && code !== args.book) continue;
      const n = (d.extra as { chapter?: number } | null)?.chapter;
      if (!n) continue;
      const heads = await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { chapter: true, headingPath: true } });
      const name = chapterNameOf(firstLabel(heads));
      if (!name) log(`  ${args.board} class ${args.grade} ${args.subject}, chapter ${n} ("${d.title}", ${d.path}) has no title in the corpus`);
      out.push({ number: n, name, bookCode: code, book: d.title });
    }
  } else {
    for (const d of docs) {
      const code = bookCodeOf(d);
      if (args.book && code !== args.book) continue;
      const heads = await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { headingPath: true, chapter: true } });
      const seen = new Set<number>();
      for (const h of heads) {
        const label = h.chapter ?? h.headingPath[0] ?? "";
        const n = chapterNumberOf(label);
        if (n === null || seen.has(n)) continue;
        seen.add(n);
        const name = chapterNameOf(label);
        if (!name) log(`  ${args.board} class ${args.grade} ${args.subject}, chapter ${n} ("${d.title}", ${d.path}) has no title in the corpus`);
        out.push({ number: n, name, bookCode: code, book: d.title });
      }
    }
  }
  return out.sort((a, b) => a.number - b.number);
}

export async function selectChapter(db: PrismaClient, args: { board: string; grade: number; subject: string; chapter: number; book?: string }, log: (line: string) => void = () => {}): Promise<SelectedChapter> {
  const { source, board } = boardSource(args.board);
  let docs = await books(db, source, args.grade, args.subject);
  if (!docs.length) throw new Error(`no ${board} textbook for class ${args.grade} ${args.subject} in the corpus (ContentDocument)`);
  if (args.book) {
    docs = docs.filter((d) => bookCodeOf(d) === args.book);
    if (!docs.length) throw new Error(`no ${board} book with code "${args.book}" for class ${args.grade} ${args.subject}`);
  }

  let doc: DocRow;
  let chunks: SelectedChunk[];
  let chapterLabel: string;
  if (source === "ncert") {
    const candidates = docs.filter((d) => (d.extra as { chapter?: number } | null)?.chapter === args.chapter);
    if (!candidates.length) throw new Error(`NCERT class ${args.grade} ${args.subject} has no chapter ${args.chapter} in the corpus`);
    const byBook = new Map<string | null, DocRow>();
    for (const c of candidates) byBook.set(bookCodeOf(c), c);
    if (byBook.size > 1) {
      const newest = [...byBook.values()].sort((a, b) => lastModifiedOf(b) - lastModifiedOf(a))[0]!;
      log(`  ${byBook.size} books carry chapter ${args.chapter}: ${[...byBook.values()].map((d) => `${bookCodeOf(d)} "${d.title}"${d.edition ? ` (${d.edition})` : ""}`).join("; ")} — taking the newest, ${bookCodeOf(newest)}; --book=<code> picks another`);
      doc = newest;
    } else doc = candidates[0]!;
    const rows = await db.contentChunk.findMany({ where: { documentId: doc.id }, orderBy: { ordinal: "asc" }, select: { id: true, ordinal: true, headingPath: true, pageStart: true, pageEnd: true, text: true, tokens: true, figureKeys: true, chapter: true } });
    chunks = rows.map((r) => ({ id: r.id, ordinal: r.ordinal, headingPath: r.headingPath, pageStart: r.pageStart, pageEnd: r.pageEnd, text: r.text, tokens: r.tokens, figureKeys: r.figureKeys }));
    chapterLabel = firstLabel(rows) || `Chapter ${args.chapter}`;
  } else {
    if (docs.length > 1) log(`  ${docs.length} Balbharati books for class ${args.grade} ${args.subject}; taking the first (${docs[0]!.path}); --book=<id> picks another`);
    doc = docs[0]!;
    const rows = await db.contentChunk.findMany({ where: { documentId: doc.id }, orderBy: { ordinal: "asc" }, select: { id: true, ordinal: true, headingPath: true, pageStart: true, pageEnd: true, text: true, tokens: true, figureKeys: true, chapter: true } });
    const mine = rows.filter((r) => chapterNumberOf(r.chapter ?? r.headingPath[0] ?? "") === args.chapter);
    if (!mine.length) throw new Error(`Balbharati "${doc.title}" has no chapter ${args.chapter} in its heading paths`);
    chunks = mine.map((r) => ({ id: r.id, ordinal: r.ordinal, headingPath: r.headingPath, pageStart: r.pageStart, pageEnd: r.pageEnd, text: r.text, tokens: r.tokens, figureKeys: r.figureKeys }));
    chapterLabel = mine[0]!.chapter ?? mine[0]!.headingPath[0]!;
  }
  if (!chunks.length) throw new Error(`${doc.path} has no chunks; run the corpus ingest first`);

  // A heading that carries no title even after npm run corpus:titles (20 Oct 2026, the owner's rule: a chapter is never
  // shown as "Chapter N"): the bank's own title for that chapter is used when the bank already has one — the authored
  // bank names every NCERT chapter it covers — and otherwise the chapter is not drafted at all, with the reason.
  let chapterName = chapterNameOf(chapterLabel);
  if (!chapterName) {
    const known = await db.quizTopic.findFirst({
      where: { audience: "SCHOOL", retiredAt: null, board, classLevel: args.grade, subject: subjectCodeOf(args.subject), chapter: { startsWith: `Chapter ${args.chapter} ` }, NOT: { name: "" } },
      orderBy: { position: "asc" },
      select: { name: true, slug: true },
    });
    if (known && !/^chapter\s*\d+$/i.test(known.name)) {
      chapterName = known.name;
      log(`  ${doc.path} has no chapter title in the corpus: the bank's own title for chapter ${args.chapter} is used ("${known.name}", ${known.slug})`);
    } else {
      throw new Error(`${doc.path} has no chapter title in the corpus and the bank has none for chapter ${args.chapter}: not drafted (npm run corpus:titles, or set the heading by hand)`);
    }
  }
  const keys = [...new Set(chunks.flatMap((c) => c.figureKeys))];
  const figures = readFigures(doc.path, keys);
  const headings = [...new Set(chunks.flatMap((c) => c.headingPath.slice(1)))];
  return {
    board,
    source,
    book: doc.title,
    bookCode: bookCodeOf(doc),
    documentPath: doc.path,
    classLevel: args.grade,
    subject: doc.subject,
    subjectCode: subjectCodeOf(doc.subject),
    chapterNumber: args.chapter,
    chapterName,
    chapterLabel: `Chapter ${args.chapter} — ${chapterName}`,
    edition: editionOf(doc),
    sourceUrl: doc.sourceUrl,
    chunks,
    figures,
    headings,
  };
}

/** The glossary chunks for a subject, when the corpus has a glossary for it (NCERT's trilingual dictionaries: economics, geography, sociology only). */
export async function glossaryFor(db: PrismaClient, subject: string): Promise<{ id: string; text: string }[]> {
  const docs = await db.contentDocument.findMany({ where: { kind: "glossary", subject: { equals: subject, mode: "insensitive" } }, select: { id: true } });
  if (!docs.length) return [];
  return db.contentChunk.findMany({ where: { documentId: { in: docs.map((d) => d.id) } }, select: { id: true, text: true }, orderBy: { ordinal: "asc" } });
}

/**
 * The glossary lines for one item: the entries whose head word appears in the stem or an option,
 * at most `max` lines, each trimmed to one line. A keyword match, not a vector one: a glossary entry
 * is "word — शब्द", and the word is in the item or it is not.
 */
export function glossaryLinesFor(glossary: { text: string }[], item: { stem: string; choices: string[] }, max = 12): string[] {
  const hay = `${item.stem} ${item.choices.join(" ")}`.toLowerCase();
  const out: string[] = [];
  for (const g of glossary) {
    for (const line of g.text.split("\n")) {
      const head = /^([A-Za-z][A-Za-z -]{2,40}?)\s*[:—–-]/.exec(line.trim())?.[1]?.trim().toLowerCase();
      if (!head || head.length < 4) continue;
      if (new RegExp(`\\b${head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay)) {
        out.push(line.trim().slice(0, 160));
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

/** The served bank's questions for a subject and class, for the near-duplicate check. */
export async function bankStems(db: PrismaClient, subjectCode: string, classLevel: number): Promise<{ id: string; stem: string; topicSlug: string }[]> {
  const rows = await db.quizQuestion.findMany({
    where: { topic: { subject: subjectCode, classLevel } },
    select: { id: true, stem: true, topic: { select: { slug: true } } },
  });
  return rows.map((r) => ({ id: r.id, stem: r.stem, topicSlug: r.topic.slug }));
}

export async function bankTopics(db: PrismaClient, subjectCode: string, classLevel: number): Promise<{ slug: string; chapter: string; name: string; position: number; retired: boolean }[]> {
  const rows = await db.quizTopic.findMany({ where: { subject: subjectCode, classLevel }, select: { slug: true, chapter: true, name: true, position: true, retiredAt: true } });
  return rows.map((r) => ({ slug: r.slug, chapter: r.chapter, name: r.name, position: r.position, retired: r.retiredAt !== null }));
}

/* ---------------------------------------------------------------------------
   The style corpus for levels 5 and 6 (the owner, 10 October 2026): the public past entrance and
   olympiad papers, ContentDocument source "papers", fetched by another builder. Absent, the two
   levels are skipped and the run log says so.
   --------------------------------------------------------------------------- */

export type StyleBlock = { present: boolean; excerpts: string[]; note: string };

export async function styleExcerpts(
  db: PrismaClient,
  embed: AssistantEndpoint,
  args: { subject: string; classLevel: number; chapterName: string; max?: number },
): Promise<StyleBlock> {
  const papers = await db.contentDocument.count({ where: { source: "papers" } });
  if (!papers) return { present: false, excerpts: [], note: 'no past papers in the corpus (ContentDocument source "papers"): levels 5 and 6 skipped' };
  const [v] = await embedTexts(embed, [asQuery("curriculum", `${args.subject} class ${args.classLevel}: ${args.chapterName}`)]);
  if (!v) throw new Error("the embeddings endpoint returned no vector for the style query");
  const vector = vectorLiteral(v);
  const max = Math.max(1, Math.min(6, args.max ?? 4));
  const rows = await db.$queryRaw<{ text: string; title: string; subject: string }[]>`
    WITH scoped AS MATERIALIZED (
      SELECT c."text", d."title", d."subject", (c."embedding" <=> ${vector}::vector) AS "distance"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"
       WHERE c."embedding" IS NOT NULL AND d."source" = 'papers' AND d."subject" ILIKE ${args.subject.replace(/[%_]/g, "")}
    )
    SELECT "text", "title", "subject" FROM scoped ORDER BY "distance" LIMIT ${max}`;
  const excerpts = rows.map((r) => `[${r.title}]\n${r.text.slice(0, 700)}`);
  return {
    present: excerpts.length > 0,
    excerpts,
    note: excerpts.length ? `${excerpts.length} excerpts from ${papers} paper documents` : `the papers corpus has nothing for ${args.subject}: levels 5 and 6 skipped`,
  };
}
