/**
 * THE ASSISTANT'S DIALS, in one file the tests read (docs/plans/assistant.md Phase B; the owner's rule:
 * "the thresholds are named constants in one file, read by the tests"). Nothing here touches the
 * database or the network, so a client component may import it too.
 *
 * The similarity thresholds were set on 10 October 2026 from twenty-one questions against the whole
 * corpus and the help index (Qwen3-Embedding-0.6B, cosine): in-scope English topic questions scored
 * 0.62–0.72 on the curriculum, in-scope help questions 0.63–0.76 on the help, and the off-topic ones
 * at most 0.59 on the help and up to 0.63 on the curriculum ("tell me a joke"), which is why the
 * thresholds are necessary and never sufficient: the classifier decides above them. A Hindi or
 * Marathi topic question meets English books at about 0.46, hence the lower floor for those two.
 * Phase D tunes all of them on the golden sets.
 */
import type { AssistantLanguage } from "@edulink/contracts";

/** A help passage at least this close, in the question's language, puts the question in the help scope. */
export const HELP_THRESHOLD: Record<AssistantLanguage, number> = { en: 0.6, hi: 0.55, mr: 0.55 };
/** A curriculum passage at least this close (within the board and grade band, widened once) puts it in the tutor's scope. */
export const CURRICULUM_THRESHOLD: Record<AssistantLanguage, number> = { en: 0.55, hi: 0.42, mr: 0.42 };
/** Below this, a class's own books are taken not to carry the topic and the band is widened one class either side (Phase A's GRADE_FLOOR). */
export const GRADE_WIDEN_FLOOR = 0.62;
/** Passages further than this below the best one are dropped before the prompt (keyword noise). */
export const CLOSE_TO_BEST = 0.12;
/** A curriculum hit must beat the best help hit by this much to make a question a topic question. */
export const TOPIC_MARGIN = 0.05;
/** The classifier's own probability for its one word, when the endpoint reports it; below this the label is REFUSE. */
export const CLASSIFIER_MIN_CONFIDENCE = 0.6;
/** A question this close to one of the pupil's own sittings or hand-in assignments matches it (embedding cosine, no model call). */
export const ASSESSMENT_MATCH_THRESHOLD = 0.62;
/** Two questions this close are "the same question asked again" for the second-ask rule (with exact text as the other way). */
export const SAME_QUESTION_THRESHOLD = 0.9;
/** A hint longer than this is not a hint; the gate discards it. */
export const HINT_MAX_WORDS = 90;

/** How long each model call may take before the answer is the fixed sentence (classifier) or MODEL_UNAVAILABLE (answer). */
export const CLASSIFY_TIMEOUT_MS = 8_000;
export const ANSWER_TIMEOUT_MS = 90_000;
export const EMBED_TIMEOUT_MS = 10_000;
export const MAX_ANSWER_TOKENS = 700;

/**
 * VIDURA'S LENGTH RULE (docs/plans/vidura.md, the owner's decision 6; pass 1, 17 Oct 2026): the answer's length by
 * the question's kind — a definition about 60 words, a how-to up to 250 with numbered steps, a worked explanation up
 * to 350 with its check question, a data answer as long as its rows need. The prompt asks for the words; these are
 * the model's hard caps in tokens, so no answer is uncapped: an answer that reaches its cap is cut, marked, and "Go
 * on" continues it as one more question of the person's day (GO_ON_MAX in a row at most). Devanagari takes about
 * twice the tokens of English for the same words (measured on the Phase D speaker sheets), hence the second column.
 */
export type AnswerKind = "DEFINE" | "WHERE" | "HOWTO" | "EXPLAIN" | "WHY" | "OTHER" | "DATA";
export const ANSWER_TOKENS: Record<AnswerKind, { en: number; deva: number }> = {
  DEFINE: { en: 220, deva: 420 },
  WHERE: { en: 300, deva: 560 },
  HOWTO: { en: 600, deva: 1100 },
  EXPLAIN: { en: 800, deva: 1400 },
  WHY: { en: 600, deva: 1100 },
  OTHER: { en: 450, deva: 820 },
  DATA: { en: 900, deva: 1400 },
};
export function answerTokenCap(kind: AnswerKind, language: AssistantLanguage): number {
  return language === "en" ? ANSWER_TOKENS[kind].en : ANSWER_TOKENS[kind].deva;
}
/** "Go on" continues a cut answer at most this many times in a row; the next one is the fixed sentence to ask afresh. */
export const GO_ON_MAX = 2;

/** Passages given to the model, per scope. */
export const CURRICULUM_PASSAGES = 4;
export const HELP_PASSAGES = 5;
/** A door's answer handed to the model as data is cut to this many characters. */
export const TOOL_ANSWER_MAX_CHARS = 2_500;
/** At most this many tools run for one question. */
export const MAX_TOOLS_PER_QUESTION = 2;

/* ---- the data questions (11 Oct 2026): router.ts, doors.ts, summary.ts ---- */
/**
 * A door of the role's own is read for a question ALREADY in the platform scope (a help passage above its threshold
 * and the classifier's PLATFORM) when its entry is at least this close (the help index's door entries with their
 * response fields, cosine). Set on 11 October 2026: the metrics set's data questions met their door at 0.57–0.87
 * in all three languages ("is there a circular I have to acknowledge" met the feed at 0.57); a door below
 * DOOR_SCOPE_THRESHOLD never puts a question in scope by itself, so a low reading threshold costs a read, never
 * an answer to an off-topic question (the refusal set's off-topic questions met some door at up to 0.62).
 */
export const DOOR_THRESHOLD: Record<AssistantLanguage, number> = { en: 0.55, hi: 0.58, mr: 0.58 };
/**
 * A door this close puts a question in the platform scope by itself (gate.ts `ownDoor`), with no help passage above
 * its threshold; the classifier still has to call it PLATFORM, and the answer gate is unchanged. Above the refusal
 * set's off-topic questions (at most 0.62 in Hindi and Marathi, 0.61 in English) but for one, "do my homework and
 * write an essay" (0.71), which the classifier refuses; below the metrics set's data questions whose help passages
 * fall short ("what is the overall syllabus coverage", 0.64 on the coverage door).
 */
export const DOOR_SCOPE_THRESHOLD = 0.64;
/**
 * A door whose data the page beside the drawer shows (Vidura pass 1, page awareness: data.ts `doorsShownOn`) is ranked
 * this close for a question pointing at that page: above the reading threshold and the scope threshold, so it is read
 * first; the classifier still has to call the question PLATFORM.
 */
export const PAGE_DOOR_SIMILARITY = 0.8;
/** At most this many doors are read for one question (a guardian's door taken once per child counts once). */
export const MAX_DOORS_PER_QUESTION = 3;
/**
 * All the <data> of one question together stays under this many characters (each door's share, at most
 * TOOL_ANSWER_MAX_CHARS): the chat server runs four slots of 8,192 tokens each (scripts/model-serve.sh), and the
 * passages, the rules and the answer share a slot with the data.
 */
export const DATA_MAX_CHARS = 7_500;
/** A follow-up within this long reads the conversation's last doors again from memory, without a new call. */
export const FOLLOW_UP_TTL_MS = 15 * 60_000;
/** Items of the pupil's own the assessment rule compares a question against, at most. */
export const MAX_ASSESSMENT_ITEMS = 40;
/** An unfinished practice attempt started within this many minutes is a timed sitting in progress. */
export const PRACTICE_SITTING_MINUTES = 90;
/** A hand-in assignment due within this many days past is still "open" for the hint rule. */
export const HAND_IN_GRACE_DAYS = 7;

/**
 * THE CAPS, like the SMS caps (messaging.ts): a person's questions in a school day, and the school's tokens in a
 * calendar month. The owner's rule of 12 October 2026: twenty questions a person a day is the only limit, so the
 * monthly budget is off (0) unless a deployment sets ASSISTANT_MONTHLY_TOKENS.
 */
export const DAILY_QUESTION_CAP_DEFAULT = 20;
export const MONTHLY_TOKEN_BUDGET_DEFAULT = 0;
/** A conversation's list title: the first question, shortened to this many characters. */
export const TITLE_CHARS = 80;

type Env = Record<string, string | undefined>;

function positiveInt(raw: string | undefined, fallback: number, max: number): number {
  const n = Number(raw?.trim());
  return raw && Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
}

/** ASSISTANT_DAILY_CAP overrides the person's daily questions (0 closes the day). */
export function dailyQuestionCap(env: Env = process.env): number {
  return positiveInt(env.ASSISTANT_DAILY_CAP, DAILY_QUESTION_CAP_DEFAULT, 10_000);
}

/** ASSISTANT_MONTHLY_TOKENS sets a school's monthly token budget; 0 (the default) means no budget. */
export function monthlyTokenBudget(env: Env = process.env): number {
  return positiveInt(env.ASSISTANT_MONTHLY_TOKENS, MONTHLY_TOKEN_BUDGET_DEFAULT, 10_000_000_000);
}

/** THE KILL SWITCH: ASSISTANT_ENABLED=0 (or "false", "off") closes the assistant for every school at once; nothing is sent to the model. */
export function killSwitchThrown(env: Env = process.env): boolean {
  const v = env.ASSISTANT_ENABLED?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}
