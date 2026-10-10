/**
 * The style excerpts for the quiz bank's difficulty levels 5 and 6 (docs/plans/assistant-and-quiz-bank.md,
 * Phase 1 "the difficulty ladder" and §8 item 6; 10 October 2026).
 *
 *   papersStyleFor({ subject, grade, level: 5 | 6, topic, limit }, ctx)
 *
 * Level 5 ("competitive") is written in the style of the state and national entrance papers and the
 * boards' own sample papers; level 6 ("olympiad") in the olympiads'. Those papers are the corpus source
 * "papers" (scripts/corpus-papers.ts, cut by question in scripts/corpus-papers-chunk.ts): STYLE
 * documents, `styleOnly`, which the tutor's searchCurriculum never returns. This read returns their
 * questions nearest the chapter's topic by embedding similarity, each with the test, the year and the
 * sitting it comes from, so the generator's prompt can show "a JEE (Advanced) 2019 question on this
 * topic" as a model of form and difficulty — never as a question to copy (the generator's prompt says
 * so; these excerpts are the bodies' text, kept for style only and never shown to a pupil).
 *
 * Ranking: similarity to the topic first; a question from a paper whose class band holds the grade
 * ("11-12" for class 12) ahead of one from another band, by a small margin per class away; the
 * subject itself ahead of a neighbour (Astronomy for Physics, Physics for Science); at most
 * `perDocument` (2) questions from one paper, so the excerpts show several papers' styles.
 *
 * Reads as any role (the content tables are outside the tenant fence, NO_SCHOOL_POLICY): `ctx` is the
 * same RetrievalContext the assistant's searches take.
 */
import { Prisma } from "@prisma/client";
import { embedTexts, vectorLiteral } from "./assistant-model";
import type { RetrievalContext } from "./assistant-retrieval";

export type StyleLevel = 5 | 6;

/** The papers a level draws on, by the document's kind (scripts/corpus-lib.ts PaperKind). */
export const LEVEL_KINDS: Record<StyleLevel, string[]> = {
  5: ["entrance-paper", "board-sample-paper"],
  6: ["olympiad-paper"],
};

/** A subject and the neighbours whose papers can stand in, the subject itself first. */
const SUBJECT_NEIGHBOURS: Record<string, string[]> = {
  science: ["Science", "Physics", "Chemistry", "Biology"],
  physics: ["Physics", "Astronomy"],
  chemistry: ["Chemistry"],
  biology: ["Biology"],
  astronomy: ["Astronomy", "Physics"],
  mathematics: ["Mathematics"],
  maths: ["Mathematics"],
  math: ["Mathematics"],
  "social science": ["Social Science", "History", "Geography", "Political Science", "Economics"],
};

/** The subjects whose papers serve a chapter of `subject`; the subject itself first. Pure. */
export function styleSubjects(subject: string): string[] {
  const key = subject.trim().toLowerCase();
  return SUBJECT_NEIGHBOURS[key] ?? [subject.trim()];
}

/** "11-12" → [11, 12]; "10" → [10, 10]; null when the band is not classes. Pure. */
export function bandOf(band: string): [number, number] | null {
  const m = /^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/.exec(band.trim());
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = Number(m[2] ?? m[1]);
  return lo <= hi ? [lo, hi] : [hi, lo];
}

/** How many classes a grade sits outside a band (0 inside it). Pure. */
export function gradeDistance(grade: number, band: string): number {
  const b = bandOf(band);
  if (!b) return 6;
  return grade < b[0] ? b[0] - grade : grade > b[1] ? grade - b[1] : 0;
}

/** The score the excerpts are ordered by: similarity, less 0.03 a class outside the band, less 0.02 for a neighbouring subject. Pure. */
export function styleScore(similarity: number, classesAway: number, neighbour: boolean): number {
  return similarity - 0.03 * Math.min(classesAway, 6) - (neighbour ? 0.02 : 0);
}

/** The instruction the topic is embedded under (Qwen3-Embedding: instruction on the query side only). */
export const STYLE_QUERY_INSTRUCTION = "Given a school chapter's topic, retrieve examination questions that test it";

export type StyleQuery = {
  subject: string;
  grade: number;
  level: StyleLevel;
  /** The chapter's topic: its title and section names, a sentence or two. */
  topic: string;
  limit?: number;
  /** Only this test ("JEE (Advanced)", "INPhO", "NSEJS", "CBSE Class X"). */
  test?: string;
  /** At most this many questions from one paper (2). */
  perDocument?: number;
};

export type StyleExcerpt = {
  chunkId: string;
  documentId: string;
  /** "JEE (Advanced)", "INPhO", "NSEP", "CBSE Class XII". */
  test: string;
  /** "2019", or a CBSE session "2025-26". */
  year: string | null;
  /** "Paper 1", "Set E1", "Mathematics (Standard)"; null when the test has one. */
  sitting: string | null;
  /** The publishing body as the site names it. */
  body: string;
  paperKind: string;
  level: StyleLevel;
  /** The test's class band: "11-12", "9-10", "10". */
  band: string;
  inBand: boolean;
  classesAway: number;
  /** The question's subject (its section's, for a paper of several subjects). */
  subject: string;
  /** The question's number in its paper, when the chunker read one. */
  question: number | null;
  /** "question" (one numbered question with its options) or "questions" (a block whose numbering could not be read). */
  chunkKind: string;
  text: string;
  similarity: number;
  score: number;
  title: string;
  sourceUrl: string;
};

type Row = {
  id: string;
  documentId: string;
  text: string;
  kind: string;
  section: string | null;
  headingPath: string[];
  title: string;
  board: string;
  band: string;
  docSubject: string;
  paperKind: string;
  year: string | null;
  sourceUrl: string;
  extra: { test?: string; sitting?: string | null; body?: string } | null;
  effectiveSubject: string;
  similarity: number;
};

export async function papersStyleFor(q: StyleQuery, ctx: RetrievalContext): Promise<StyleExcerpt[]> {
  const limit = Math.max(1, Math.min(30, q.limit ?? 6));
  const perDocument = Math.max(1, q.perDocument ?? 2);
  const subjects = styleSubjects(q.subject);
  const kinds = LEVEL_KINDS[q.level];
  if (!kinds) throw new Error(`papersStyleFor: level is 5 or 6, not ${String(q.level)}`);
  const [v] = await embedTexts(ctx.embed, [`Instruct: ${STYLE_QUERY_INSTRUCTION}\nQuery:${q.topic}`]);
  if (!v) throw new Error("the embeddings endpoint returned no vector for the topic");
  const vector = vectorLiteral(v);
  // A paper of several subjects files each question under its section's subject; one of a single
  // subject under the paper's. Exact scan of the papers' rows (a few thousand), like every search here.
  const effective = Prisma.sql`(CASE WHEN position(',' in d."subject") > 0 THEN c."section" ELSE d."subject" END)`;
  const pool = Math.max(limit * 8, 60);
  const rows = await ctx.db.$queryRaw<Row[]>`
    WITH scoped AS MATERIALIZED (
      SELECT c."id", c."documentId", c."text", c."kind", c."section", c."headingPath", d."title", d."board",
             d."gradeOrProgramme" AS "band", d."subject" AS "docSubject", d."kind" AS "paperKind", d."year", d."sourceUrl", d."extra",
             ${effective} AS "effectiveSubject", (c."embedding" <=> ${vector}::vector) AS "distance"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"
       WHERE d."source" = 'papers' AND d."styleOnly" = true AND c."embedding" IS NOT NULL
         AND c."kind" IN ('question', 'questions')
         AND d."kind" IN (${Prisma.join(kinds)})
         AND ${effective} IN (${Prisma.join(subjects)})
         ${q.test ? Prisma.sql`AND d."extra"->>'test' = ${q.test}` : Prisma.empty}
    )
    SELECT s.*, 1 - s."distance" AS "similarity" FROM scoped s ORDER BY s."distance" LIMIT ${pool}`;
  const ranked = rows
    .map((r) => {
      const similarity = Number(r.similarity);
      const classesAway = gradeDistance(q.grade, r.band);
      const neighbour = r.effectiveSubject !== subjects[0];
      return { r, similarity, classesAway, score: styleScore(similarity, classesAway, neighbour) };
    })
    .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));
  const perDoc = new Map<string, number>();
  const out: StyleExcerpt[] = [];
  for (const { r, similarity, classesAway, score } of ranked) {
    const n = perDoc.get(r.documentId) ?? 0;
    if (n >= perDocument) continue;
    perDoc.set(r.documentId, n + 1);
    const label = r.headingPath.at(-1) ?? "";
    const question = /^Question (\d+)/.exec(label)?.[1];
    out.push({
      chunkId: r.id,
      documentId: r.documentId,
      test: r.extra?.test ?? r.title,
      year: r.year,
      sitting: r.extra?.sitting ?? null,
      body: r.extra?.body ?? r.board,
      paperKind: r.paperKind,
      level: q.level,
      band: r.band,
      inBand: classesAway === 0,
      classesAway,
      subject: r.effectiveSubject,
      question: question ? Number(question) : null,
      chunkKind: r.kind,
      text: r.text,
      similarity,
      score,
      title: r.title,
      sourceUrl: r.sourceUrl,
    });
    if (out.length >= limit) break;
  }
  return out;
}
