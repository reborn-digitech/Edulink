/**
 * Retrieval for the assistant (docs/plans/assistant.md §2, Phase A): the curriculum corpus and the
 * platform help, each a hybrid of vector search (pgvector, cosine, the HNSW index) and keyword
 * search (Postgres full text, the GIN index), merged by reciprocal rank.
 *
 *   searchCurriculum({ query, language, board?, grade?, subject?, limit }, ctx)
 *   searchHelp({ query, language, role, limit }, ctx)
 *
 * `ctx` carries the database client and the embedding endpoint, so a script (owner), the service
 * (app role, Phase B) and the tests each pass their own. The content tables are outside the
 * tenant fence (NO_SCHOOL_POLICY): the app role reads them with no school set.
 *
 * The reranker is a stub that keeps the merged order; Qwen3-Reranker on top is Phase B's
 * (`rerank` below is where it goes). Everything a hit carries is DATA for the prompt, never an
 * instruction to the model: the corpus is public text and the help is the platform's own, but a
 * PDF can carry anything, and Phase B's prompt treats retrieved text as quoted material.
 */
import { Prisma, type PrismaClient } from "@prisma/client";
import type { AssistantEndpoint } from "./assistant-env";
import { asQuery, embedTexts, vectorLiteral } from "./assistant-model";
import { readableQuotes } from "./assistant/readable-quotes";

export type RetrievalContext = {
  db: Pick<PrismaClient, "$queryRaw">;
  embed: AssistantEndpoint;
};

export type Language = "en" | "hi" | "mr";

/**
 * What a passage of a share-alike source carries in every citation (Vidura pass 4, 18 Oct 2026): for a Wikipedia
 * article its title, the revision read, when it was saved, its permanent address and the licence. Null for the books.
 */
export type PassageAttribution = { kind: "WIKIPEDIA"; title: string; revision: number; revisedAt: string; url: string; licence: string; licenceUrl: string };

/** How the assistant cites a passage: the board, the book, the chapter and section, the page. */
export type Citation = {
  board: string;
  book: string;
  chapter: string | null;
  section: string | null;
  page: number;
  documentId: string;
  chunkId: string;
  attribution: PassageAttribution | null;
};

/** The stored attribution read back, or null for anything that is not one (pure, for the tests). */
export function attributionOf(raw: unknown): PassageAttribution | null {
  const a = raw as Partial<PassageAttribution> | null;
  if (!a || typeof a !== "object" || a.kind !== "WIKIPEDIA") return null;
  if (typeof a.title !== "string" || typeof a.revision !== "number" || typeof a.revisedAt !== "string" || typeof a.url !== "string" || typeof a.licence !== "string" || typeof a.licenceUrl !== "string") return null;
  return { kind: "WIKIPEDIA", title: a.title, revision: a.revision, revisedAt: a.revisedAt, url: a.url, licence: a.licence, licenceUrl: a.licenceUrl };
}

export type CurriculumHit = {
  chunkId: string;
  documentId: string;
  board: string;
  grade: string;
  subject: string;
  book: string;
  edition: string | null;
  chapter: string | null;
  section: string | null;
  headingPath: string[];
  pageStart: number;
  pageEnd: number;
  text: string;
  language: string;
  figureKeys: string[];
  sourceUrl: string;
  /** The corpus source ("ncert", "nios", "wikipedia"…) and, for a share-alike one, the attribution (Vidura pass 4). */
  source: string;
  attribution: PassageAttribution | null;
  /** Cosine similarity to the question (null only for a chunk not embedded yet). */
  similarity: number | null;
  vectorRank: number | null;
  keywordRank: number | null;
  /** Reciprocal-rank fusion score. */
  score: number;
  citation: Citation;
};

export type HelpHit = {
  entryId: string;
  kind: string;
  title: string;
  text: string;
  pagePath: string | null;
  door: string | null;
  module: string | null;
  roles: string[];
  language: string;
  sourceFile: string;
  commit: string;
  similarity: number | null;
  vectorRank: number | null;
  keywordRank: number | null;
  score: number;
};

/** The k of reciprocal-rank fusion: 60, the value of the original paper; small changes barely matter. */
export const RRF_K = 60;

/**
 * Merges ranked lists by reciprocal rank: score = Σ 1 / (k + rank), rank from 1. An item found by
 * both halves rises above one found by either alone. Pure, for the tests.
 */
export function reciprocalRankFusion<T extends { id: string }>(lists: T[][], k = RRF_K): { item: T; score: number; ranks: (number | null)[] }[] {
  const merged = new Map<string, { item: T; score: number; ranks: (number | null)[] }>();
  lists.forEach((list, which) => {
    list.forEach((item, i) => {
      const got = merged.get(item.id) ?? { item, score: 0, ranks: lists.map(() => null) };
      got.score += 1 / (k + i + 1);
      got.ranks[which] = i + 1;
      merged.set(item.id, got);
    });
  });
  return [...merged.values()].sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}

/** Phase B puts Qwen3-Reranker here; until then the fused order stands. */
export async function rerank<T>(_query: string, hits: T[]): Promise<T[]> {
  return hits;
}

const QUESTION_WORDS = new Set(["explain", "describe", "define", "definition", "tell", "meaning", "please", "kindly", "give", "show", "question", "answer", "about", "me", "i", "my", "do", "does", "where", "how", "what", "why", "which", "who", "can", "should"]);

/**
 * The keyword half's query: the question's words OR-ed (a passage need not contain "explain"),
 * letters and digits only so nothing reaches to_tsquery's own syntax. Null when nothing is left.
 */
export function keywordQuery(question: string): string | null {
  const words = (question.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).filter((w) => w.length > 1 && !QUESTION_WORDS.has(w));
  const unique = [...new Set(words)].slice(0, 16);
  return unique.length ? unique.join(" | ") : null;
}

/** These repeat the GIN indexes' expressions in migration 20261008152105_assistant_content exactly. */
const CHUNK_TSV = Prisma.sql`(CASE WHEN c."language" = 'en' THEN to_tsvector('english'::regconfig, c."text") ELSE to_tsvector('simple'::regconfig, c."text") END)`;
const HELP_TSV = Prisma.sql`(CASE WHEN h."language" = 'en' THEN to_tsvector('english'::regconfig, h."title" || ' ' || h."text") ELSE to_tsvector('simple'::regconfig, h."title" || ' ' || h."text") END)`;

async function queryVector(ctx: RetrievalContext, kind: "curriculum" | "help", query: string): Promise<string> {
  const [v] = await embedTexts(ctx.embed, [asQuery(kind, query)]);
  if (!v) throw new Error("the embeddings endpoint returned no vector for the question");
  return vectorLiteral(v);
}

/**
 * EVERY vector search is EXACT: the rows in scope are taken first (a materialised CTE the HNSW index
 * cannot reach) and ordered by distance. A scoped search (one board, one class, one role) must be,
 * because an index scan filtered afterwards returns only the few of its ef_search candidates that
 * pass the filter. An unscoped one (a teacher, a college, the topic check for the other roles) used
 * the HNSW index until Phase D measured it (10 October 2026): at pgvector's default ef_search of 40
 * an instruction-prefixed question vector found "Newton's third law" at 0.43 (a home-science book)
 * where the exact nearest is 0.78 (NCERT class 9); ef_search 100 found it, and the exact scan of all
 * 119,365 chunks takes about 0.2–0.7 s, under the answer's own time. (Raising ef_search needs SET
 * LOCAL inside a transaction, and the app's extended client must not open a bare one:
 * tenancy-shape.test.ts.) The index stays for a later hosted corpus too big to scan.
 */
function nearest(scoped: Prisma.Sql | null, from: Prisma.Sql, columns: Prisma.Sql, embedding: Prisma.Sql, vector: string, pool: number): Prisma.Sql {
  return Prisma.sql`WITH scoped AS MATERIALIZED (SELECT ${columns}, (${embedding} <=> ${vector}::vector) AS "distance" ${from} WHERE ${embedding} IS NOT NULL ${scoped ?? Prisma.empty})
                    SELECT s.*, 1 - s."distance" AS "similarity" FROM scoped s ORDER BY s."distance" LIMIT ${pool}`;
}

export type CurriculumQuery = {
  query: string;
  language: Language;
  /** A board name or its start: "NCERT", "Balbharati". */
  board?: string;
  /** The class, 1 to 12; with `gradeWindow` the classes either side too. */
  grade?: number | string;
  gradeWindow?: number;
  subject?: string;
  limit?: number;
  /**
   * VIDURA PASS 4 (18 Oct 2026): the sources only a college's tutor reads (ContentDocument.audience "COLLEGE": the
   * Wikipedia subset for the professional streams). Absent or "EXCLUDE": left out, so every search before pass 4 is
   * exactly what it was; "INCLUDE": with the books; "ONLY": those alone, of `streams` when given.
   */
  collegeSources?: "EXCLUDE" | "INCLUDE" | "ONLY";
  /** With collegeSources: documents chosen for any of these streams (ContentDocument.streams). */
  streams?: string[];
};

type ChunkRow = {
  id: string;
  documentId: string;
  board: string;
  grade: string;
  subject: string;
  book: string;
  edition: string | null;
  chapter: string | null;
  section: string | null;
  headingPath: string[];
  pageStart: number;
  pageEnd: number;
  text: string;
  language: string;
  figureKeys: string[];
  sourceUrl: string;
  source: string;
  attribution: unknown;
  similarity: number | null;
};

const CHUNK_COLUMNS = Prisma.sql`c."id", c."documentId", d."board", d."gradeOrProgramme" AS "grade", d."subject", d."title" AS "book",
  c."edition", c."chapter", c."section", c."headingPath", c."pageStart", c."pageEnd", c."text", c."language", c."figureKeys", d."sourceUrl", d."source", d."attribution"`;

/**
 * The past entrance, olympiad and board sample papers (source "papers", 10 Oct 2026) are a STYLE corpus
 * for the quiz generator (src/lib/quiz-style.ts): the tutor never retrieves, quotes or cites them. Every
 * curriculum search carries this clause, scoped or not (tests/papers-corpus.test.ts holds it).
 */
export const STYLE_CORPUS_EXCLUDED = Prisma.sql`AND d."styleOnly" = false AND d."source" <> 'papers'`;

/** The WHERE clauses of a curriculum search (exported for the tests: pass 4's audience rule is read off it). */
export function curriculumFilter(q: CurriculumQuery): Prisma.Sql {
  const parts: Prisma.Sql[] = [STYLE_CORPUS_EXCLUDED];
  // Vidura pass 4: a college-only source is searched only when the search asks for it. Written as an expression, not
  // `"audience" IS NULL`: before the table's statistics knew the new column the planner read IS NULL as 0.5 % of the
  // books, chose a nested loop that ran to_tsvector over every chunk, and the keyword half took 43 s (18 Oct 2026); an
  // expression's default reading keeps the full-text index's plan (22 ms) whatever the statistics say.
  if (q.collegeSources === "ONLY") parts.push(Prisma.sql`AND d."audience" = 'COLLEGE'`);
  else if (q.collegeSources !== "INCLUDE") parts.push(Prisma.sql`AND COALESCE(d."audience", '') <> 'COLLEGE'`);
  if (q.collegeSources && q.collegeSources !== "EXCLUDE" && q.streams?.length) parts.push(Prisma.sql`AND (COALESCE(d."audience", '') <> 'COLLEGE' OR d."streams" && ${q.streams}::text[])`);
  if (q.board) parts.push(Prisma.sql`AND d."board" ILIKE ${q.board.replace(/[%_]/g, "") + "%"}`);
  if (q.subject) parts.push(Prisma.sql`AND d."subject" ILIKE ${q.subject.replace(/[%_]/g, "")}`);
  if (q.grade !== undefined && q.grade !== null && `${q.grade}` !== "") {
    const n = Number(q.grade);
    const w = Math.max(0, Math.min(3, q.gradeWindow ?? 0));
    const grades = Number.isInteger(n) ? Array.from({ length: 2 * w + 1 }, (_, i) => String(n - w + i)).filter((g) => Number(g) >= 1 && Number(g) <= 12) : [String(q.grade)];
    parts.push(Prisma.sql`AND d."gradeOrProgramme" IN (${Prisma.join(grades)})`);
  }
  return Prisma.join(parts, " ");
}

export async function searchCurriculum(q: CurriculumQuery, ctx: RetrievalContext): Promise<CurriculumHit[]> {
  const limit = Math.max(1, Math.min(50, q.limit ?? 8));
  const pool = Math.max(limit * 5, 40);
  const filter = curriculumFilter(q);
  const vector = await queryVector(ctx, "curriculum", q.query);
  const vectorRows = await ctx.db.$queryRaw<ChunkRow[]>(
    nearest(filter === Prisma.empty ? null : filter, Prisma.sql`FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"`, CHUNK_COLUMNS, Prisma.sql`c."embedding"`, vector, pool),
  );
  const words = keywordQuery(q.query);
  let keywordRows: ChunkRow[] = [];
  if (words) {
    keywordRows = await ctx.db.$queryRaw<ChunkRow[]>`
      SELECT ${CHUNK_COLUMNS}, 1 - (c."embedding" <=> ${vector}::vector) AS "similarity"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId",
             to_tsquery('english'::regconfig, ${words}) qe, to_tsquery('simple'::regconfig, ${words}) qs
       WHERE (${CHUNK_TSV} @@ qe OR ${CHUNK_TSV} @@ qs) ${filter}
       ORDER BY greatest(ts_rank_cd(${CHUNK_TSV}, qe), ts_rank_cd(${CHUNK_TSV}, qs)) DESC, c."id"
       LIMIT ${pool}`;
  }
  const fused = reciprocalRankFusion([vectorRows, keywordRows]);
  // Every hit carries its cosine similarity, a keyword-only one too, so a caller can drop the weak.
  const similarity = new Map([...keywordRows, ...vectorRows].map((r) => [r.id, r.similarity === null ? null : Number(r.similarity)]));
  const hits: CurriculumHit[] = fused.slice(0, pool).map(({ item: r, score, ranks }) => ({
    chunkId: r.id,
    documentId: r.documentId,
    board: r.board,
    grade: r.grade,
    subject: r.subject,
    book: r.book,
    edition: r.edition,
    chapter: r.chapter,
    section: r.section,
    headingPath: r.headingPath,
    pageStart: r.pageStart,
    pageEnd: r.pageEnd,
    text: r.text,
    language: r.language,
    figureKeys: r.figureKeys,
    sourceUrl: r.sourceUrl,
    source: r.source,
    attribution: attributionOf(r.attribution),
    similarity: similarity.get(r.id) ?? null,
    vectorRank: ranks[0] ?? null,
    keywordRank: ranks[1] ?? null,
    score,
    citation: { board: r.board, book: r.book, chapter: r.chapter, section: r.section, page: r.pageStart, documentId: r.documentId, chunkId: r.id, attribution: attributionOf(r.attribution) },
  }));
  return (await rerank(q.query, hits)).slice(0, limit);
}

export type HelpQuery = {
  query: string;
  language: Language;
  /** A RoleCode ("ADMIN", "TEACHER"…), or "OPERATOR" / "APP_ADMIN"; entries for every role always match. */
  role: string;
  limit?: number;
  /**
   * THE DATA QUESTIONS' ROUTER (11 Oct 2026, src/lib/assistant/router.ts): only entries of these kinds ("door" for
   * the catalog's doors), so the router ranks the role's own doors by their summaries alone. Absent: every kind.
   */
  kinds?: string[];
};

type HelpRow = {
  id: string;
  kind: string;
  title: string;
  text: string;
  pagePath: string | null;
  door: string | null;
  module: string | null;
  roles: string[];
  language: string;
  sourceFile: string;
  commit: string;
  similarity: number | null;
};

/**
 * VIDURA PASS 2 (17 Oct 2026): a Hindi or Marathi guide entry made from a HelpRendering (scripts/help-index.ts) is read
 * through its rendering: one the reviewer rejected is left out at once, and one they edited is read in its new words
 * (its vector follows at the next rebuild). Every other entry has no rendering and reads as written.
 */
const HELP_COLUMNS = Prisma.sql`h."id", h."kind", h."title", COALESCE(r."text", h."text") AS "text", h."pagePath", h."door", h."module", h."roles", h."language", h."sourceFile", h."commit"`;
const HELP_FROM = Prisma.sql`FROM "HelpEntry" h LEFT JOIN "HelpRendering" r ON r."id" = h."renderingId"`;
const NOT_REJECTED = Prisma.sql`AND (r."id" IS NULL OR r."status" <> 'REJECTED')`;

export async function searchHelp(q: HelpQuery, ctx: RetrievalContext): Promise<HelpHit[]> {
  const limit = Math.max(1, Math.min(50, q.limit ?? 8));
  const pool = Math.max(limit * 5, 40);
  // The person's role (or every role's entries), in the person's language or English, the
  // language every doc and door is written in.
  // The data questions' router (11 Oct 2026): `kinds` narrows the entries to the catalog's doors.
  const kinds = q.kinds?.length ? Prisma.sql`AND h."kind" IN (${Prisma.join(q.kinds)})` : Prisma.empty;
  const filter = Prisma.sql`AND (cardinality(h."roles") = 0 OR ${q.role} = ANY(h."roles")) AND h."language" IN (${Prisma.join([...new Set([q.language, "en"])])}) ${kinds} ${NOT_REJECTED}`;
  const vector = await queryVector(ctx, "help", q.query);
  const vectorRows = await ctx.db.$queryRaw<HelpRow[]>(nearest(filter, HELP_FROM, HELP_COLUMNS, Prisma.sql`h."embedding"`, vector, pool));
  const words = keywordQuery(q.query);
  let keywordRows: HelpRow[] = [];
  if (words) {
    keywordRows = await ctx.db.$queryRaw<HelpRow[]>`
      SELECT ${HELP_COLUMNS}, 1 - (h."embedding" <=> ${vector}::vector) AS "similarity"
        ${HELP_FROM}, to_tsquery('english'::regconfig, ${words}) qe, to_tsquery('simple'::regconfig, ${words}) qs
       WHERE (${HELP_TSV} @@ qe OR ${HELP_TSV} @@ qs) ${filter}
       ORDER BY greatest(ts_rank_cd(${HELP_TSV}, qe), ts_rank_cd(${HELP_TSV}, qs)) DESC, h."id"
       LIMIT ${pool}`;
  }
  const fused = reciprocalRankFusion([vectorRows, keywordRows]);
  // Every hit carries its cosine similarity, a keyword-only one too, so a caller can drop the weak.
  const similarity = new Map([...keywordRows, ...vectorRows].map((r) => [r.id, r.similarity === null ? null : Number(r.similarity)]));
  const hits: HelpHit[] = fused.slice(0, pool).map(({ item: r, score, ranks }) => ({
    entryId: r.id,
    kind: r.kind,
    title: r.title,
    // A guide paragraph's quoted screen sentences without their placeholders (QA-64).
    text: r.kind === "doc" && r.sourceFile.startsWith("docs/guide/") ? readableQuotes(r.text) : r.text,
    pagePath: r.pagePath,
    door: r.door,
    module: r.module,
    roles: r.roles,
    language: r.language,
    sourceFile: r.sourceFile,
    commit: r.commit,
    similarity: similarity.get(r.id) ?? null,
    vectorRank: ranks[0] ?? null,
    keywordRank: ranks[1] ?? null,
    score,
  }));
  return (await rerank(q.query, hits)).slice(0, limit);
}

/**
 * F-14 (18 Oct 2026): A GUIDE PASSAGE'S WHOLE SECTION. The index keeps each numbered step of a guide as its own entry
 * (scripts/help-index.ts, "one step, one entry") under the section's title; this reads the section's entries back in
 * the order they were written (the ids are made in file order), rejected renderings left out and edited ones read in
 * their new words, as searchHelp reads them. Null for anything but a guide entry, or a section of one entry.
 */
export async function guideSection(hit: Pick<HelpHit, "kind" | "title" | "sourceFile" | "language">, ctx: Pick<RetrievalContext, "db">): Promise<{ key: string; text: string } | null> {
  if (hit.kind !== "doc") return null;
  const rows = await ctx.db.$queryRaw<{ text: string }[]>`
    SELECT COALESCE(r."text", h."text") AS "text" ${HELP_FROM}
     WHERE h."kind" = 'doc' AND h."sourceFile" = ${hit.sourceFile} AND h."title" = ${hit.title} AND h."language" = ${hit.language} ${NOT_REJECTED}
     ORDER BY h."id"
     LIMIT 40`;
  if (rows.length < 2) return null;
  const words = hit.sourceFile.startsWith("docs/guide/") ? readableQuotes : (text: string) => text;
  return { key: `${hit.sourceFile}|${hit.language}|${hit.title}`, text: words(rows.map((r) => r.text.trim()).join("\n")) };
}

/**
 * THE HELP INDEX'S ENTRIES FOR ONE PAGE, no search (Vidura pass 1, 17 Oct 2026: page awareness and the suggested
 * questions): the entries naming `page` — its page cards first — for the role (or every role) in the language asked,
 * English beside it. Each carries a similarity of null: it was found by its page, not by closeness.
 */
export async function helpForPage(q: { page: string; language: Language; role: string; kinds?: string[]; limit?: number }, ctx: Pick<RetrievalContext, "db">): Promise<HelpHit[]> {
  const limit = Math.max(1, Math.min(10, q.limit ?? 2));
  const kinds = q.kinds?.length ? Prisma.sql`AND h."kind" IN (${Prisma.join(q.kinds)})` : Prisma.empty;
  const rows = await ctx.db.$queryRaw<(HelpRow & { similarity: null })[]>`
    SELECT ${HELP_COLUMNS}, NULL::float AS "similarity"
      ${HELP_FROM}
     WHERE h."pagePath" = ${q.page} ${NOT_REJECTED}
       AND (cardinality(h."roles") = 0 OR ${q.role} = ANY(h."roles"))
       AND h."language" IN (${Prisma.join([...new Set([q.language, "en"])])}) ${kinds}
     ORDER BY (h."language" = ${q.language}) DESC, (h."kind" = 'nav') DESC, h."id"
     LIMIT ${limit}`;
  return rows.map((r) => ({
    entryId: r.id,
    kind: r.kind,
    title: r.title,
    // A guide paragraph's quoted screen sentences without their placeholders (QA-64).
    text: r.kind === "doc" && r.sourceFile.startsWith("docs/guide/") ? readableQuotes(r.text) : r.text,
    pagePath: r.pagePath,
    door: r.door,
    module: r.module,
    roles: r.roles,
    language: r.language,
    sourceFile: r.sourceFile,
    commit: r.commit,
    similarity: null,
    vectorRank: null,
    keywordRank: null,
    score: 0,
  }));
}
