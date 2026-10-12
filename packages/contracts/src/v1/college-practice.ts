import { z } from "zod";
import { STREAMS, streamSchema, type StreamCode } from "./streams";

/**
 * COLLEGE-SPECIFIC PRACTICE AND COMPETITIONS (the owner's decisions of 12 October 2026).
 *
 * 1. A SCHOOL's practice page stays as it was: the board switch, the classes, the subjects, the
 *    school bank (audience SCHOOL) only.
 * 2. A COLLEGE's practice page has two sections:
 *      STREAM — its own streams' banks (audience COLLEGE), grouped by programme and subject with a year
 *               or semester filter: a topic lists when its streams include one of the college's, or
 *               when it names no stream (a college-wide bank, as the placement banks are);
 *      PREP   — "Competitive Exams Prep": the school bank's NCERT chapters, by class and subject.
 *    Nothing else from the school bank reaches a college.
 * 3. A competition carries an audience: SCHOOL (with its class range) or COLLEGE (with streams). A
 *    competition with no audience set is shown to both, as before, until somebody edits it.
 *
 * A junior college (classes 11 and 12) runs as a school does here too.
 */

/** Who a practice chapter is for. QuizTopic.audience; the school bank is SCHOOL. */
export const QUIZ_AUDIENCES = ["SCHOOL", "COLLEGE"] as const;
export type QuizAudience = (typeof QUIZ_AUDIENCES)[number];
export const quizAudienceSchema = z.enum(QUIZ_AUDIENCES);
export function asQuizAudience(value: unknown): QuizAudience | null {
  return typeof value === "string" && (QUIZ_AUDIENCES as readonly string[]).includes(value) ? (value as QuizAudience) : null;
}

/** The two sections of a college's practice page. */
export const PRACTICE_SECTIONS = ["STREAM", "PREP"] as const;
export type PracticeSection = (typeof PRACTICE_SECTIONS)[number];
export const practiceSectionSchema = z.enum(PRACTICE_SECTIONS);
/** What the page (and the phone) shows: the school's page, or the college's two sections. */
export const PRACTICE_KINDS = ["SCHOOL", "COLLEGE"] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];
export const practiceKindSchema = z.enum(PRACTICE_KINDS);
/** The board the prep section reads, and the only one: NCERT's chapters. */
export const PREP_BOARD = "NCERT" as const;

/**
 * A college topic's year or semester, coded: Y1–Y5 (a year of a programme) or S1–S10 (a semester).
 * Null when the syllabus does not say. QuizTopic.yearOrSemester.
 */
export const COLLEGE_TERMS = ["Y1", "Y2", "Y3", "Y4", "Y5", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"] as const;
export type CollegeTerm = (typeof COLLEGE_TERMS)[number];
export const collegeTermSchema = z.enum(COLLEGE_TERMS);
export function asCollegeTerm(value: unknown): CollegeTerm | null {
  return typeof value === "string" && (COLLEGE_TERMS as readonly string[]).includes(value) ? (value as CollegeTerm) : null;
}
/** The term's kind and number, for its words ("Year 2", "Semester 3"). */
export function collegeTermParts(term: CollegeTerm): { kind: "YEAR" | "SEMESTER"; n: number } {
  return { kind: term.startsWith("Y") ? "YEAR" : "SEMESTER", n: Number(term.slice(1)) };
}
/** The terms in the order a filter lists them: years, then semesters. */
export function sortCollegeTerms(terms: Iterable<string | null | undefined>): CollegeTerm[] {
  const set = new Set<string>();
  for (const t of terms) if (t) set.add(t);
  return COLLEGE_TERMS.filter((t) => set.has(t));
}

/** A topic's streams as stored (QuizTopic.streams): known codes, each once, STREAMS order. */
export function cleanTopicStreams(streams: readonly string[] | null | undefined): StreamCode[] {
  const set = new Set(streams ?? []);
  return STREAMS.filter((s) => set.has(s));
}

/** The tenant a practice list is drawn for. */
export type PracticeTenant = { college: boolean; streams: readonly StreamCode[] };

/**
 * Whether a chapter lists for a tenant, and in which section. Pure: the web's query (src/lib/practice-audience.ts)
 * says the same thing in SQL, and tests/college-practice.test.ts holds the two to each other.
 *   school  → a SCHOOL chapter, any board (the board switch decides the rest), no section;
 *   college → a COLLEGE chapter of one of its streams (or of none: college-wide) in STREAM,
 *             a SCHOOL chapter of NCERT's in PREP, anything else not at all.
 */
export function practiceSectionOf(
  topic: { audience?: string | null; streams?: readonly string[] | null; board?: string | null },
  tenant: PracticeTenant,
): PracticeSection | "SCHOOL" | null {
  const audience = asQuizAudience(topic.audience) ?? "SCHOOL";
  if (!tenant.college) return audience === "SCHOOL" ? "SCHOOL" : null;
  if (audience === "COLLEGE") {
    const streams = topic.streams ?? [];
    return streams.length === 0 || streams.some((s) => (tenant.streams as readonly string[]).includes(s)) ? "STREAM" : null;
  }
  return topic.board === PREP_BOARD ? "PREP" : null;
}

/* -------------------------------------------------------------------------- */
/* Competitions                                                                */
/* -------------------------------------------------------------------------- */

/** Who a competition is for. Competition.audience; null (not yet set) is shown to both. */
export const COMPETITION_AUDIENCES = QUIZ_AUDIENCES;
export type CompetitionAudience = QuizAudience;
export const competitionAudienceSchema = quizAudienceSchema;

/**
 * Whether a competition lists for a tenant: no audience → everyone (as before, until edited); SCHOOL →
 * a school or junior college; COLLEGE → a college, when the competition names no stream or one of the
 * college's. The class range of a SCHOOL competition is shown on it, as before, not filtered on.
 */
export function competitionFitsTenant(competition: { audience?: string | null; streams?: readonly string[] | null }, tenant: PracticeTenant): boolean {
  const audience = asQuizAudience(competition.audience);
  if (!audience) return true;
  if (audience === "SCHOOL") return !tenant.college;
  if (!tenant.college) return false;
  const streams = competition.streams ?? [];
  return streams.length === 0 || streams.some((s) => (tenant.streams as readonly string[]).includes(s));
}

/** What an edit sends for a competition's audience: SCHOOL with no streams, COLLEGE with zero or more, or null to clear. */
export const competitionAudienceEditSchema = z
  .object({
    audience: competitionAudienceSchema.nullable(),
    streams: z.array(streamSchema).max(STREAMS.length).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.audience !== "COLLEGE" && v.streams.length > 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["streams"], message: "streamsOnlyForCollege" });
    if (new Set(v.streams).size !== v.streams.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["streams"], message: "duplicate" });
  });
export type CompetitionAudienceEdit = z.infer<typeof competitionAudienceEditSchema>;

/* -------------------------------------------------------------------------- */
/* The generator's college scope                                               */
/* -------------------------------------------------------------------------- */

/**
 * The syllabus corpora the generator can draft college units from (ContentDocument source "syllabi"):
 * the affiliating university's (SPPU), AICTE's model curricula, the Pharmacy Council's and the
 * agriculture university's (MPKV). Which stream a document is for is read from its board, faculty and
 * title (apps/web/src/lib/college-syllabi.ts).
 */
export const COLLEGE_SYLLABUS_BOARDS = ["SPPU", "AICTE", "PCI", "MPKV"] as const;
export type CollegeSyllabusBoard = (typeof COLLEGE_SYLLABUS_BOARDS)[number];
export const collegeSyllabusBoardSchema = z.enum(COLLEGE_SYLLABUS_BOARDS);
/** The code from the corpus's own name for the board ("SPPU (Savitribai Phule Pune University)"). */
export function collegeSyllabusBoardOf(corpusBoard: string | null | undefined): CollegeSyllabusBoard | null {
  const head = (corpusBoard ?? "").trim().split(/\s|\(/)[0]?.toUpperCase() ?? "";
  return (COLLEGE_SYLLABUS_BOARDS as readonly string[]).includes(head) ? (head as CollegeSyllabusBoard) : null;
}

/** One syllabus document of a stream, with its units (the level-one headings), for the desk's card. */
export const collegeSyllabusDocumentSchema = z.object({
  path: z.string(),
  title: z.string(),
  board: collegeSyllabusBoardSchema,
  programme: z.string(),
  term: collegeTermSchema.nullable(),
  units: z.array(z.object({ number: z.number().int().positive(), name: z.string(), chunks: z.number().int().nonnegative() })),
});
export type CollegeSyllabusDocument = z.infer<typeof collegeSyllabusDocumentSchema>;

/** GET /api/v1/appadmin/quiz-jobs/college-syllabi — the streams with a syllabus corpus, their programmes and documents, and the streams with none. */
export const collegeSyllabiSchema = z.object({
  streams: z.array(
    z.object({
      stream: streamSchema,
      boards: z.array(collegeSyllabusBoardSchema),
      programmes: z.array(z.object({ programme: z.string(), documents: z.array(collegeSyllabusDocumentSchema) })),
    }),
  ),
  /** The streams no syllabus document in the corpus is for (the card says so). */
  without: z.array(streamSchema),
});
export type CollegeSyllabi = z.infer<typeof collegeSyllabiSchema>;

/** POST /api/v1/appadmin/competitions/{competitionId}/audience — what the competition is for now, and whether the press changed it. */
export const competitionAudienceSetSchema = z.object({ ok: z.literal(true), audience: competitionAudienceSchema.nullable(), streams: z.array(z.string()), changed: z.boolean() });
