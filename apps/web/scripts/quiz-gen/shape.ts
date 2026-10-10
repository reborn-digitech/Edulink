/**
 * The shapes the quiz bank generator reads and writes (docs/plans/assistant-and-quiz-bank.md, Phase 1,
 * with the owner's amendments of 10 October 2026).
 *
 * A generated file IS the bank's topic-file shape (content/quiz/README.md, read by scripts/verify-quiz.ts
 * and scripts/import-quiz.ts): every existing field keeps its name, type and meaning, so the verify →
 * import pipeline and the served bank read it unchanged. What the plan adds per item is ADDITIVE and
 * optional: the figure spec (`figure`, `needsFigure`, `imageAlt`; `imageKey` stays empty — the books'
 * drawings are never cropped, a separate builder renders the spec), the reviewer's material
 * (`distractorReason`, `solverAnswers`, `levelFlag`, `critique`, `sources`), the provenance (`edition`,
 * `generatedAt`, `model`) and the review `stamps` the app admins' and the operator's queue will fill.
 * Nothing here is served: a generated file lives under content/quiz/generated/ and the importer takes
 * only the items that carry a stamp.
 *
 * The JSON schemas below are what llama.cpp constrains the model's output to (`response_format:
 * json_schema`), so the shape of a draft never breaks; checks.ts judges the content.
 */
import { QUIZ_FIGURE_KINDS, type QuizFigureKind } from "@edulink/contracts";

/**
 */

/** The plan's ladder (1 recall … 6 olympiad) is the bank's own QUIZ_LEVELS 1–6, by name and number. */
export const LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = {
  1: "recall",
  2: "understand",
  3: "apply",
  4: "analyse",
  5: "competitive",
  6: "olympiad",
};

/** Levels 5 and 6 are styles, not chapters: they need the papers corpus (source "papers") and are skipped without it. */
export const STYLE_LEVELS: readonly Level[] = [5, 6];

/** A review stamp: the app admins and the operator review, never teachers (the owner, 10 October 2026); one stamp serves the item. */
export type Stamp = {
  /** The reviewer's user id, as the queue records it. */
  reviewer: string;
  role: "APP_ADMIN" | "OPERATOR";
  /** ISO date-time. */
  at: string;
};

export const STAMP_ROLES = ["APP_ADMIN", "OPERATOR"] as const;

/** The figure kinds the model may ask for: the figure builder's (packages/contracts quizFigureSpecSchema). */
export const FIGURE_KINDS = QUIZ_FIGURE_KINDS;
export type FigureKind = QuizFigureKind;

/**
 * The figure as the generator writes it: the builder's contract, `{ kind, spec, labels }`, with the
 * label texts in en from the draft and in hi and mr from the translation pass. Validated with the
 * builder's own check (scripts/quiz-gen/figures/check.ts) before an item is written.
 */
export type FigureSpec = { kind: FigureKind; spec: Record<string, unknown>; labels: Record<string, { en: string; hi?: string; mr?: string }> };

export type GeneratedTranslation = {
  stem: string;
  choices: string[];
  solution: string;
  imageAlt?: string | null;
  /** The translation critique's note, for the native speaker; `flag` when the critique failed and the redraft did not mend it. */
  critique?: string | null;
  flag?: string | null;
};

export type SourceRef = {
  /** Corpus-relative document path: "ncert/8/science/hecu104.pdf". */
  document: string;
  ordinal: number;
  pageStart: number;
  pageEnd: number;
  headingPath: string[];
};

/** One item as the generated file writes it. The bank's fields first, unchanged; the plan's after, all optional to the bank. */
export type GeneratedQuestion = {
  difficulty: Level;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
  reviewedAt: null;
  reviewedBy: null;
  translations: Partial<Record<"hi" | "mr", GeneratedTranslation>>;
  /** Always null from the generator: no drawing is cropped from a book. The figure builder may fill it from `figure`. */
  imageKey: null;
  /** The figure in words, in the item's language; set with `figure`. */
  imageAlt: string | null;
  figure: FigureSpec | null;
  /** True when the exercise needs a figure: the item waits for the figure builder before it is served. */
  needsFigure: boolean;
  /** One line per option, null at the key: the misconception that makes a pupil pick it. */
  distractorReason: (string | null)[];
  /** The blind solver's five answers (option indexes), for the reviewer. */
  solverAnswers: number[];
  /** Set when the solver's record disagrees with the level: the reviewer decides. */
  levelFlag: string | null;
  /** The critique pass's note on the item. */
  critique: string | null;
  /** The pages the item was drafted from. */
  sources: SourceRef[];
  edition: string | null;
  generatedAt: string;
  model: string;
  stamps: Stamp[];
};

export type GeneratedTopicFile = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary: string;
  position: number;
  source: string;
  licence: string;
  translations: Record<string, { name: string; summary: string }>;
  /** The plan's provenance on the file too, so a reader needs no item to know the edition. */
  board: string;
  book: string;
  edition: string | null;
  generatedAt: string;
  model: string;
  /** Whether the topic existed in the bank (the slug is its) or was made here. */
  topicIsNew: boolean;
  questions: GeneratedQuestion[];
};

export type Stage = "draft" | "critique" | "solver" | "form" | "verify" | "dedupe" | "translation";

/** A reject, with the stage that refused it and why: counted in the run log and kept beside the file. */
export type Reject = {
  stage: Stage;
  level: Level;
  stem: string;
  reason: string;
};

/* ---------------------------------------------------------------------------
   What the model is constrained to.
   --------------------------------------------------------------------------- */

export type DraftItem = {
  difficulty: number;
  stem: string;
  options: string[];
  answerIndex: number;
  solution: string;
  /** Arithmetic for a numeric answer ("7*8", "(180-90)/2"); "" when the answer is not computed. */
  checkExpr: string;
  /** A figure the exercise needs, drawn from the spec; kind "" when none. */
  figure: { kind: FigureKind | ""; spec: Record<string, unknown>; labels: Record<string, { en: string }> };
  /** The figure in words, "" without a figure. */
  figureAlt: string;
  /** Three lines, in the order of the three wrong options as they appear in `options` (the key skipped). */
  distractorReasons: string[];
};

/** The figure as the model writes it: the kind, the spec in the builder's parameters, the English label texts. */
export const FIGURE_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["", ...FIGURE_KINDS] },
    spec: { type: "object", additionalProperties: true },
    labels: {
      type: "object",
      additionalProperties: { type: "object", properties: { en: { type: "string" } }, required: ["en"], additionalProperties: false },
    },
  },
  required: ["kind", "spec", "labels"],
  additionalProperties: false,
} as const;

export type RewrittenSolution = { solution: string };

export const REWRITE_SOLUTION_SCHEMA = {
  type: "object",
  properties: { solution: { type: "string" } },
  required: ["solution"],
  additionalProperties: false,
} as const;

export type RedraftFigure = { figure: DraftItem["figure"]; figureAlt: string };

export const REDRAFT_FIGURE_SCHEMA = {
  type: "object",
  properties: { figure: FIGURE_SCHEMA, figureAlt: { type: "string" } },
  required: ["figure", "figureAlt"],
  additionalProperties: false,
} as const;

export const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          difficulty: { type: "integer", minimum: 1, maximum: 6 },
          stem: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          answerIndex: { type: "integer", minimum: 0, maximum: 3 },
          solution: { type: "string" },
          checkExpr: { type: "string" },
          figure: FIGURE_SCHEMA,
          figureAlt: { type: "string" },
          distractorReasons: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        },
        required: ["difficulty", "stem", "options", "answerIndex", "solution", "checkExpr", "figure", "figureAlt", "distractorReasons"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 14,
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export type CritiqueVerdict = {
  /** The option the critic finds correct, read from the stem alone. */
  correctIndex: number;
  /** Exactly one defensible answer among the four. */
  oneAnswer: boolean;
  /** Per wrong option in order: it is wrong, and its reason is a real misconception. */
  distractors: { index: number; isWrong: boolean; reasonIsRealMisconception: boolean }[];
  /** Whether the solution's working is right and lands on the key. */
  solutionSound: boolean;
  note: string;
};

export const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    correctIndex: { type: "integer", minimum: 0, maximum: 3 },
    oneAnswer: { type: "boolean" },
    distractors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer", minimum: 0, maximum: 3 },
          isWrong: { type: "boolean" },
          reasonIsRealMisconception: { type: "boolean" },
        },
        required: ["index", "isWrong", "reasonIsRealMisconception"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 3,
    },
    solutionSound: { type: "boolean" },
    note: { type: "string" },
  },
  required: ["correctIndex", "oneAnswer", "distractors", "solutionSound", "note"],
  additionalProperties: false,
} as const;

export type SolverAnswer = { answerIndex: number };

export const SOLVER_SCHEMA = {
  type: "object",
  properties: { answerIndex: { type: "integer", minimum: 0, maximum: 3 } },
  required: ["answerIndex"],
  additionalProperties: false,
} as const;

export type RedraftDistractor = { option: string; reason: string };

export const REDRAFT_SCHEMA = {
  type: "object",
  properties: {
    option: { type: "string" },
    reason: { type: "string" },
  },
  required: ["option", "reason"],
  additionalProperties: false,
} as const;

export type TranslationDraft = { stem: string; options: string[]; solution: string; figureAlt: string; figureLabels: string[] };

export const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    stem: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
    solution: { type: "string" },
    figureAlt: { type: "string" },
    /** The figure's label texts in the target language, in the order the prompt listed them. */
    figureLabels: { type: "array", items: { type: "string" } },
  },
  required: ["stem", "options", "solution", "figureAlt", "figureLabels"],
  additionalProperties: false,
} as const;

export type TranslationCritique = { sameMeaning: boolean; oneAnswer: boolean; distractorsStillWrong: boolean; termsAreTheBoards: boolean; note: string };

export const TRANSLATION_CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    sameMeaning: { type: "boolean" },
    oneAnswer: { type: "boolean" },
    distractorsStillWrong: { type: "boolean" },
    termsAreTheBoards: { type: "boolean" },
    note: { type: "string" },
  },
  required: ["sameMeaning", "oneAnswer", "distractorsStillWrong", "termsAreTheBoards", "note"],
  additionalProperties: false,
} as const;

export type TopicWords = { summary: string; nameHi: string; summaryHi: string; nameMr: string; summaryMr: string };

export const TOPIC_WORDS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    nameHi: { type: "string" },
    summaryHi: { type: "string" },
    nameMr: { type: "string" },
    summaryMr: { type: "string" },
  },
  required: ["summary", "nameHi", "summaryHi", "nameMr", "summaryMr"],
  additionalProperties: false,
} as const;
