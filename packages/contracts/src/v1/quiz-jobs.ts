import { z } from "zod";
import { quizBoardSchema } from "./quiz-board";
import { collegeSyllabusBoardSchema } from "./college-practice"; // college-content (12 Oct 2026)
import { streamSchema } from "./streams"; // college-content (12 Oct 2026)

/**
 * GENERATION STARTED AND STOPPED FROM THE BANK DESK (the owner, 11 October 2026). The operator and the
 * content team start the quiz bank generator from /root/quiz-review or /appadmin/quiz-review: a run is a
 * background job on the machine the model runs on (QuizGenJob, src/lib/quiz-jobs.ts), one at a time,
 * whose runner writes a live line after every item and loads each finished chapter into the bank as it
 * goes. Start brings the two local model servers up when they are down (scripts/model-serve.sh) and Stop
 * takes down only what that Start brought up. Every door is app-admin; none names a school.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/** A run's life: QUEUED (the model starting, or about to) → RUNNING → STOPPING → STOPPED, or FINISHED, or FAILED. */
export const QUIZ_GEN_JOB_STATES = ["QUEUED", "RUNNING", "STOPPING", "STOPPED", "FINISHED", "FAILED"] as const;
export type QuizGenJobState = (typeof QUIZ_GEN_JOB_STATES)[number];
/** The states in which a run holds the one slot: a second Start is refused while one of these stands. */
export const QUIZ_GEN_ACTIVE_STATES = ["QUEUED", "RUNNING", "STOPPING"] as const satisfies readonly QuizGenJobState[];

/**
 * The subjects the generator can draft for: the bank's subject codes (scripts/verify-quiz.ts SUBJECTS)
 * that a textbook in the corpus maps to (scripts/quiz-gen/select.ts subjectCodeOf).
 */
export const QUIZ_GEN_SUBJECTS = ["MATHS", "SCIENCE", "PHYSICS", "CHEMISTRY", "BIOLOGY", "EVS", "HISTORY", "GEOGRAPHY", "CIVICS", "ECONOMICS"] as const;
export type QuizGenSubject = (typeof QUIZ_GEN_SUBJECTS)[number];

/**
 * What to generate: one board's class, subject and chapter range, or everything not yet generated in the plan's order,
 * or (college-content, 12 Oct 2026) COLLEGE: a stream's programme from the syllabus corpus, one syllabus document or
 * every one of the programme, and a unit range; its items land as COLLEGE topics tagged with the stream, the
 * programme and the year or semester (scripts/quiz-gen/college.ts).
 */
export const QUIZ_GEN_SCOPES = ["CHAPTERS", "EVERYTHING", "COLLEGE"] as const;

export const quizGenRequestSchema = z
  .object({
    scope: z.enum(QUIZ_GEN_SCOPES),
    board: quizBoardSchema.optional(),
    grade: z.number().int().min(1).max(12).optional(),
    subject: z.enum(QUIZ_GEN_SUBJECTS).optional(),
    chapterFrom: z.number().int().min(1).max(40).optional(),
    chapterTo: z.number().int().min(1).max(40).optional(),
    /** Items asked for per chapter (the generator's --limit); absent is its own default, four a level. */
    limit: z.number().int().min(1).max(60).optional(),
    // ---- quiz-topup (19 Oct 2026): the EVERYTHING scope filling every chapter to a number ----
    /** Served questions each chapter should reach: the run repeats passes, skipping chapters already there, until every
     *  chapter has this many or a pass keeps nothing; absent, one pass that leaves out chapters with a batch file. */
    target: z.number().int().min(1).max(500).optional(),
    /** The classes the EVERYTHING scope takes; absent, every class the corpus holds. */
    gradeFrom: z.number().int().min(1).max(12).optional(),
    gradeTo: z.number().int().min(1).max(12).optional(),
    // ---- end quiz-topup ----
    // ---- college-content (12 Oct 2026): the COLLEGE scope ----
    stream: streamSchema.optional(),
    /** The programme as the desk's card lists it from the corpus ("LL.M."). */
    programme: z.string().trim().min(1).max(120).optional(),
    /** One syllabus document (ContentDocument.path); absent: every document of the programme. */
    document: z.string().trim().min(1).max(400).optional(),
    unitFrom: z.number().int().min(1).max(200).optional(),
    unitTo: z.number().int().min(1).max(200).optional(),
    // ---- end college-content ----
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.gradeFrom && r.gradeTo && r.gradeFrom > r.gradeTo) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gradeTo"], message: "gradeTo" });
    if (r.scope === "CHAPTERS") {
      if (!r.board) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["board"], message: "board" });
      if (!r.grade) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["grade"], message: "grade" });
      if (!r.subject) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subject"], message: "subject" });
    }
    if (r.chapterFrom && r.chapterTo && r.chapterFrom > r.chapterTo) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["chapterTo"], message: "range" });
    // college-content (12 Oct 2026)
    if (r.scope === "COLLEGE") {
      if (!r.stream) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stream"], message: "stream" });
      if (!r.programme) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["programme"], message: "programme" });
    }
    if (r.unitFrom && r.unitTo && r.unitFrom > r.unitTo) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["unitTo"], message: "range" });
  });
export type QuizGenRequest = z.infer<typeof quizGenRequestSchema>;

/** The generator's stages, as its run log counts them (scripts/quiz-gen/shape.ts Stage). */
export const QUIZ_GEN_STAGES = ["draft", "critique", "solver", "form", "verify", "dedupe", "translation"] as const;
export type QuizGenStage = (typeof QUIZ_GEN_STAGES)[number];

/** What the runner is doing now. */
export const QUIZ_GEN_PHASES = ["STARTING_MODEL", "PLANNING", "GENERATING", "LOADING", "HALTING", "DONE"] as const;
export type QuizGenPhase = (typeof QUIZ_GEN_PHASES)[number];

const rejectsSchema = z.record(z.enum(QUIZ_GEN_STAGES), count);

const chapterRefSchema = z.object({
  // college-content (12 Oct 2026): a college unit's board is the syllabus's (SPPU, AICTE, PCI, MPKV).
  board: z.union([quizBoardSchema, collegeSyllabusBoardSchema]),
  grade: z.number().int(),
  subject: z.string(),
  number: z.number().int(),
  name: z.string(),
  // college-content (12 Oct 2026): a college unit's stream and programme (the card's line names them).
  stream: streamSchema.optional(),
  programme: z.string().optional(),
});

/** One chapter's numbers: drafted, kept, rejects per stage, seconds, and how many items reached the bank. */
const chapterNumbersSchema = chapterRefSchema.extend({
  drafted: count,
  kept: count,
  rejects: rejectsSchema,
  seconds: count,
  loaded: count,
  keepRate: z.number().min(0).max(1).nullable(),
  secondsPerKept: z.number().nonnegative().nullable(),
});

/** The live line, rewritten by the runner after every item. */
export const quizGenProgressSchema = z.object({
  /** quiz-topup (19 Oct 2026): which pass over the chapters a target run is on; absent on a one-pass run. */
  pass: z.number().int().min(1).optional(),
  phase: z.enum(QUIZ_GEN_PHASES),
  /** The chapter running now, and its numbers so far. */
  chapter: chapterNumbersSchema.nullable(),
  /** Chapters finished and loaded this run, chapters left out because a batch already exists, chapters that could not be generated. */
  chaptersDone: count,
  chaptersSkipped: count,
  chaptersFailed: z.array(z.object({ label: z.string(), reason: z.string() })),
  /**
   * owner-batch-item6 (30 Oct 2026): a chapter's batch that landed nothing new, every item it drafted dropped as one the
   * chapter already holds (the bank saturated there). Not a failure: no held file is written. One line per time it happened.
   */
  chaptersSaturated: z.array(z.object({ label: z.string(), pass: z.number().int().min(1), drafted: count, dropped: count })).default([]),
  /**
   * owner-batch-item6: chapters the run stopped taking — SATURATED after two passes in a row with nothing new, FAILING after
   * two tries whose landing failed (a duplicate slug, a malformed file, no title) — with the reason and the pass it happened on.
   * Left out of every later pass and out of the count that keeps a target run going.
   */
  chaptersSetAside: z.array(z.object({ label: z.string(), kind: z.enum(["SATURATED", "FAILING"]), pass: z.number().int().min(1), tries: count, reason: z.string() })).default([]),
  /** Across the run. */
  drafted: count,
  kept: count,
  loaded: count,
  keepRate: z.number().min(0).max(1).nullable(),
  secondsPerKept: z.number().nonnegative().nullable(),
  /** The last chapter finished. */
  last: chapterNumbersSchema.nullable(),
});
export type QuizGenProgress = z.infer<typeof quizGenProgressSchema>;

/**
 * The local model servers (docs/runbooks/assistant-local.md): the chat model, the embedding model, and since Vidura pass
 * 3 (18 Oct 2026) the small model the gate's classifier asks (scripts/model-serve.sh start-small). Since 19 Oct 2026
 * (gen-throughput) "chat2", a second copy of the chat model on :8183 that only the quiz generator reads (Vidura never
 * does): a generation run brings it up when memory allows and spreads its calls over both (scripts/quiz-gen/model.ts).
 */
export const MODEL_SERVERS = ["chat", "chat2", "embed", "small"] as const;
export type ModelServer = (typeof MODEL_SERVERS)[number];
export const modelServerNameSchema = z.enum(MODEL_SERVERS);

/** RUNNING (the health endpoint answers ok), STARTING (started, still loading), STOPPED (nothing answers). */
export const MODEL_SERVER_STATES = ["RUNNING", "STARTING", "STOPPED"] as const;
export type ModelServerState = (typeof MODEL_SERVER_STATES)[number];

export const modelServerSchema = z.object({
  server: modelServerNameSchema,
  state: z.enum(MODEL_SERVER_STATES),
  /** The name the server answers to (llama-server's --alias). */
  model: z.string(),
  port: z.number().int().nullable(),
  checkedAt: iso,
});
export type ModelServerStatus = z.infer<typeof modelServerSchema>;

export const quizGenJobSchema = z.object({
  id,
  state: z.enum(QUIZ_GEN_JOB_STATES),
  request: quizGenRequestSchema,
  progress: quizGenProgressSchema.nullable(),
  startedBy: z.string(),
  startedByRole: z.enum(["APP_ADMIN", "OPERATOR"]),
  /** The model servers this run brought up, and so takes down when it ends. */
  startedServers: z.array(modelServerNameSchema),
  error: z.string().nullable(),
  createdAt: iso,
  startedAt: iso.nullable(),
  finishedAt: iso.nullable(),
  heartbeatAt: iso.nullable(),
});
export type QuizGenJob = z.infer<typeof quizGenJobSchema>;

/** GET /api/v1/appadmin/quiz-jobs — the run in hand (or the last one), the latest runs and the model servers. */
export const quizJobsStateSchema = z.object({
  current: quizGenJobSchema.nullable(),
  recent: z.array(quizGenJobSchema),
  servers: z.array(modelServerSchema),
});
export type QuizJobsState = z.infer<typeof quizJobsStateSchema>;

/** GET /api/v1/appadmin/quiz-jobs/{jobId} */
export const quizGenJobReadSchema = z.object({ job: quizGenJobSchema });

/** GET /api/v1/appadmin/quiz-jobs/servers, and what a server's start or stop answers. */
export const modelServersSchema = z.object({ servers: z.array(modelServerSchema) });
export type ModelServers = z.infer<typeof modelServersSchema>;
