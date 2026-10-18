import { z } from "zod";
import { roleSchema } from "./auth";
import { assistantCitationSchema, assistantLanguageSchema, assistantVerdictSchema, ASSISTANT_CHIPS, ASSISTANT_QUESTION_MAX, ASSISTANT_REFERENCE_KINDS } from "./assistant";
import { modelServerNameSchema, modelServerSchema, QUIZ_GEN_JOB_STATES } from "./quiz-jobs";

/**
 * VIDURA PASS 3 (18 Oct 2026; docs/plans/vidura.md, "speed and operations"): the operator's three desks.
 *
 *   /root/vidura-answers     standard answers for the common how-to questions: the operator asks as a role, marks the
 *                            checked answer as the standard one, revokes it; each counts its hits.
 *   /root/vidura-unanswered  refusals and discards by mode, role and school over thirty days, counts only, with the
 *                            stems of questions that found nothing; exportable as CSV.
 *   /root/vidura-evals       the evaluation harness's nine sets started and stopped like a generation run, the live line,
 *                            the scores kept per run.
 */
const iso = z.string().datetime();
const count = z.number().int().nonnegative();
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/* ---- standard answers ------------------------------------------------------------------------------------------ */

/** DRAFT: an answer the operator's trial got, not yet checked; STANDARD: served; REVOKED: never served again. */
export const VIDURA_ANSWER_STATES = ["DRAFT", "STANDARD", "REVOKED"] as const;
export const viduraAnswerStateSchema = z.enum(VIDURA_ANSWER_STATES);
export type ViduraAnswerState = z.infer<typeof viduraAnswerStateSchema>;

export const viduraAnswerSchema = z.object({
  id: z.string(),
  role: roleSchema,
  language: assistantLanguageSchema,
  question: z.string(),
  /** The question's normal form: a person's question must normalise to it to be served this answer. */
  questionKey: z.string(),
  text: z.string(),
  citations: z.array(assistantCitationSchema),
  verdict: assistantVerdictSchema,
  chip: z.enum(ASSISTANT_CHIPS).nullable(),
  state: viduraAnswerStateSchema,
  /** A DRAFT that may be marked as the standard answer: answered, "Using Shalaghar", reading nobody's records. */
  markable: z.boolean(),
  hits: count,
  lastHitAt: iso.nullable(),
  createdAt: iso,
  checkedAt: iso.nullable(),
  checkedBy: z.string().nullable(),
  revokedAt: iso.nullable(),
  revokedBy: z.string().nullable(),
});
export type ViduraAnswer = z.infer<typeof viduraAnswerSchema>;

/** A stem of the questions people asked, with how many asked it (never a whole question; at least two people). */
export const viduraStemSchema = z.object({ stem: z.string(), language: assistantLanguageSchema, role: roleSchema, questions: count, people: count });
export type ViduraStem = z.infer<typeof viduraStemSchema>;

/** GET /api/v1/operator/vidura/answers */
export const viduraAnswersSchema = z.object({
  drafts: z.array(viduraAnswerSchema),
  standard: z.array(viduraAnswerSchema),
  revoked: z.array(viduraAnswerSchema),
  /** Every hit of every standard answer, across every school (each school's card counts its own month). */
  servedTotal: count,
});
export type ViduraAnswers = z.infer<typeof viduraAnswersSchema>;

/** The roles Vidura answers (every school role but the expert and the recruiter). */
export const VIDURA_ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const;

/** POST /api/v1/operator/vidura/answers — ask Vidura as a role; the answer is kept as a DRAFT. */
export const viduraAnswerTrySchema = z.object({
  role: z.enum(VIDURA_ROLES),
  question: z.string().trim().min(2).max(ASSISTANT_QUESTION_MAX),
  /** Absent: the question's own language. */
  language: assistantLanguageSchema.optional(),
});
export type ViduraAnswerTry = z.infer<typeof viduraAnswerTrySchema>;

/** POST /api/v1/operator/vidura/answers/{answerId} — CHECK a draft (it becomes the standard answer), REVOKE a standard one, DISCARD a draft. */
export const viduraAnswerActSchema = z.object({ action: z.enum(["CHECK", "REVOKE", "DISCARD"]) });
export type ViduraAnswerAct = z.infer<typeof viduraAnswerActSchema>;
export const viduraAnswerReadSchema = z.object({ answer: viduraAnswerSchema.nullable() });

/* ---- the unanswered report ------------------------------------------------------------------------------------- */

export const VIDURA_SCOPES = [...ASSISTANT_CHIPS, "NONE"] as const;
const tallySchema = z.object({ questions: count, refused: count, discarded: count });

/** GET /api/v1/operator/vidura/unanswered — the last thirty days, counts only; CSV at …/unanswered/export. */
export const viduraUnansweredSchema = z.object({
  from: dayKey,
  to: dayKey,
  /** When vidura:gaps last counted; null before its first run. */
  computedAt: iso.nullable(),
  totals: tallySchema,
  byScope: z.array(tallySchema.extend({ scope: z.enum(VIDURA_SCOPES) })),
  byRole: z.array(tallySchema.extend({ role: z.string() })),
  bySchool: z.array(tallySchema.extend({ schoolId: z.string(), schoolName: z.string() })),
  byVerdict: z.array(z.object({ verdict: assistantVerdictSchema, count })),
  byReason: z.array(z.object({ reason: z.string(), count })),
  /** Stems of the questions that found no page or passage, asked by at least `minPeople` people. */
  stems: z.array(viduraStemSchema),
  minPeople: count,
});
export type ViduraUnanswered = z.infer<typeof viduraUnansweredSchema>;

/* ---- evaluation runs ------------------------------------------------------------------------------------------- */

/** The harness's sets (scripts/assistant-eval.ts), in its own order: the nine of Phase D and pass 4's college knowledge set. */
export const VIDURA_EVAL_SETS = ["refusal", "counsellor", "redteam", "role", "injection", "language", "help", "tutor", "hint", "college"] as const;
export const viduraEvalSetSchema = z.enum(VIDURA_EVAL_SETS);
export type ViduraEvalSet = z.infer<typeof viduraEvalSetSchema>;

/** POST /api/v1/operator/vidura/evals — the sets to run (at least one: an empty body starts nothing), and at most how many cases a set. */
export const viduraEvalRequestSchema = z.object({
  sets: z.array(viduraEvalSetSchema).min(1).max(VIDURA_EVAL_SETS.length),
  limit: z.number().int().min(1).max(1000).optional(),
});
export type ViduraEvalRequest = z.infer<typeof viduraEvalRequestSchema>;

export const VIDURA_EVAL_PHASES = ["STARTING_MODEL", "RUNNING", "DONE"] as const;

/** The live line, rewritten by the runner after every case. */
export const viduraEvalProgressSchema = z.object({
  phase: z.enum(VIDURA_EVAL_PHASES),
  /** The set running now. */
  set: viduraEvalSetSchema.nullable(),
  setIndex: count,
  setsTotal: count,
  /** Cases done in this set, and how many it has when the harness knows. */
  done: count,
  total: count.nullable(),
  passed: count,
  /** Across the run. */
  casesDone: count,
  seconds: count,
  /** A generation run or a crawl shared the model during this run: its scores may read low. */
  contended: z.boolean(),
});
export type ViduraEvalProgress = z.infer<typeof viduraEvalProgressSchema>;

/** One set's score as the harness summed it up; `lines` are its own printed lines (English), kept for the record. */
export const viduraEvalScoreSchema = z.object({
  set: viduraEvalSetSchema,
  cases: count,
  pass: count,
  /** The refusal set only: 100 percent or not. */
  gate: z.boolean().optional(),
  lines: z.array(z.string()),
});
export type ViduraEvalScore = z.infer<typeof viduraEvalScoreSchema>;

export const viduraEvalJobSchema = z.object({
  id: z.string(),
  state: z.enum(QUIZ_GEN_JOB_STATES),
  request: viduraEvalRequestSchema,
  progress: viduraEvalProgressSchema.nullable(),
  scores: z.array(viduraEvalScoreSchema).nullable(),
  gate: z.boolean().nullable(),
  startedBy: z.string(),
  startedServers: z.array(modelServerNameSchema),
  error: z.string().nullable(),
  createdAt: iso,
  startedAt: iso.nullable(),
  finishedAt: iso.nullable(),
  heartbeatAt: iso.nullable(),
});
export type ViduraEvalJob = z.infer<typeof viduraEvalJobSchema>;

/** GET /api/v1/operator/vidura/evals — the run in hand (or the last), the latest runs, the model servers, and whether a generation run or a crawl holds the model now. */
export const viduraEvalsSchema = z.object({
  current: viduraEvalJobSchema.nullable(),
  recent: z.array(viduraEvalJobSchema),
  servers: z.array(modelServerSchema),
  modelBusy: z.boolean(),
});
export type ViduraEvals = z.infer<typeof viduraEvalsSchema>;
export const viduraEvalReadSchema = z.object({ job: viduraEvalJobSchema });

/* ---- the reference allow-list (pass 4, 18 Oct 2026) ------------------------------------------------------------ */

/**
 * VIDURA PASS 4 (docs/plans/vidura.md, the owner's decision 8): the public education sources Vidura may link to beside a
 * Learning answer, kept by the operator on /root/vidura-references. A link is built by the server from the source's
 * template and the cited passage's heading; it is shown to the roles named, a STUDENT only when an adult at a college,
 * and never to a pupil while decision 0002 stands.
 */
export const VIDURA_REFERENCE_KINDS = ASSISTANT_REFERENCE_KINDS;
/** The roles a source's links may be shown to: the tutor's roles (a Learning answer is theirs alone). */
export const VIDURA_REFERENCE_ROLES = ["TEACHER", "FACULTY", "HOD", "STUDENT"] as const;
export const viduraReferenceRoleSchema = z.enum(VIDURA_REFERENCE_ROLES);

export const viduraReferenceSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  host: z.string(),
  kind: z.enum(VIDURA_REFERENCE_KINDS),
  licence: z.string(),
  licenceUrl: z.string().nullable(),
  linkTemplate: z.string(),
  shownTo: z.array(viduraReferenceRoleSchema),
  enabled: z.boolean(),
  createdAt: iso,
  updatedAt: iso,
  /** Who last changed it; null for the seeded rows. */
  updatedBy: z.string().nullable(),
});
export type ViduraReferenceSource = z.infer<typeof viduraReferenceSourceSchema>;

/** GET /api/v1/operator/vidura/references */
export const viduraReferenceSourcesSchema = z.object({ sources: z.array(viduraReferenceSourceSchema) });
export type ViduraReferenceSources = z.infer<typeof viduraReferenceSourcesSchema>;

const referenceFields = {
  name: z.string().trim().min(2).max(80),
  /** The host alone, lower case: "nptel.ac.in". */
  host: z.string().trim().toLowerCase().min(3).max(120),
  kind: z.enum(VIDURA_REFERENCE_KINDS),
  licence: z.string().trim().min(2).max(800),
  licenceUrl: z.string().trim().max(400).nullable().optional(),
  /** https on the host, with "{topic}" where the passage's heading goes. */
  linkTemplate: z.string().trim().min(10).max(400),
  shownTo: z.array(viduraReferenceRoleSchema).min(1).max(VIDURA_REFERENCE_ROLES.length),
};

/** POST /api/v1/operator/vidura/references — add a source (201). Audited. */
export const viduraReferenceAddSchema = z.object(referenceFields);
export type ViduraReferenceAdd = z.infer<typeof viduraReferenceAddSchema>;

/** POST /api/v1/operator/vidura/references/{sourceId} — ENABLE, DISABLE or EDIT (any of the fields). Audited; the same act again changes nothing. */
export const viduraReferenceActSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ENABLE") }),
  z.object({ action: z.literal("DISABLE") }),
  z.object({
    action: z.literal("EDIT"),
    name: referenceFields.name.optional(),
    host: referenceFields.host.optional(),
    kind: referenceFields.kind.optional(),
    licence: referenceFields.licence.optional(),
    licenceUrl: referenceFields.licenceUrl,
    linkTemplate: referenceFields.linkTemplate.optional(),
    shownTo: referenceFields.shownTo.optional(),
  }),
]);
export type ViduraReferenceAct = z.infer<typeof viduraReferenceActSchema>;
export const viduraReferenceReadSchema = z.object({ source: viduraReferenceSourceSchema });
