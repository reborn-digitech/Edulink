import { z } from "zod";

/**
 * THE ASSISTANT (docs/plans/assistant.md, Phase B; decision 0005). One chat with two jobs: platform
 * help for every role, and the tutor over the curriculum for STUDENT, TEACHER, FACULTY and HOD. A
 * conversation is the unit: nothing is remembered across conversations, and each is deleted thirty
 * days after its last message (RETENTION_ASSISTANT_DAYS).
 *
 * Every answer carries a VERDICT, a coded reason the surfaces name in the reader's language
 * (`assistantService.verdict.<CODE>` in the dictionaries): ANSWERED and HINT are the model's words
 * after both gates; every other verdict is one fixed sentence the server wrote, never the model's.
 */
const iso = z.string().datetime();
const cuidish = z.string().min(1).max(64);

export const ASSISTANT_LANGUAGES = ["en", "hi", "mr"] as const;
export const assistantLanguageSchema = z.enum(ASSISTANT_LANGUAGES);
export type AssistantLanguage = z.infer<typeof assistantLanguageSchema>;

/**
 * The refusal categories for minors (the owner's rule 2), one fixed sentence each. SELF_HARM is never
 * a bare refusal: it is the counsellor route (the school's counsellor, else the principal, is told
 * that a pupil needs a caring adult — never the words — and the pupil is given the helpline).
 */
export const ASSISTANT_REFUSAL_CATEGORIES = [
  "SELF_HARM",
  /**
   * A child telling of abuse at home, at school or online (decided by the coordinator under the owner's
   * rule for minors, Phase D, 10 Oct 2026): the counsellor route as for SELF_HARM, and the sentence names
   * Childline (1098) beside the school's helpline.
   */
  "ABUSE_DISCLOSURE",
  "VIOLENCE",
  "SEXUAL",
  "DRUGS_ALCOHOL",
  "HATE_BULLYING",
  "PERSONAL_DATA",
  "CONTACT",
  "LINKS_APPS",
  "MONEY_GIFTS",
  "POLITICS_RELIGION",
  "MEDICAL_LEGAL",
  "PERSONAL_LIFE",
] as const;
export type AssistantRefusalCategory = (typeof ASSISTANT_REFUSAL_CATEGORIES)[number];

export const ASSISTANT_VERDICTS = [
  /** The model's answer, past the gate before it and the gate after it. */
  "ANSWERED",
  /** The model's answer in hint mode: the question matched one of the pupil's own hand-in assignments. */
  "HINT",
  /** Nothing in either scope was close enough (or the classifier said REFUSE): the sentence saying what the assistant is for. Nothing was sent to the answering model. */
  "OUT_OF_SCOPE",
  /** A topic question from a role the tutor is not for (a parent, the office…). */
  "TUTOR_NOT_FOR_ROLE",
  /** A contest, a timed sitting or an exam session of the pupil's is open on this topic. */
  "ASSESSMENT_OPEN",
  ...ASSISTANT_REFUSAL_CATEGORIES,
  /** The question tried to give the assistant instructions. */
  "INJECTION",
  /** The model's answer left the scope, named a link, a person, a phone number or an address, or cited what was not retrieved: discarded. */
  "ANSWER_DISCARDED",
  /** The model endpoint did not answer in time. Nothing is charged to the person's day. */
  "MODEL_UNAVAILABLE",
] as const;
export const assistantVerdictSchema = z.enum(ASSISTANT_VERDICTS);
export type AssistantVerdict = z.infer<typeof assistantVerdictSchema>;

/** Which job answered: platform help or the tutor; null on a fixed sentence. */
export const assistantModeSchema = z.enum(["HELP", "TUTOR"]);
export type AssistantMode = z.infer<typeof assistantModeSchema>;

/**
 * A citation points at a passage the search actually returned (the answer gate refuses any other).
 * CURRICULUM: the board's book, chapter, section and page, with the publisher's own PDF (`sourceUrl`,
 * open with `#page=<page>`). HELP: the platform page the help entry names. LINK: one of the person's own
 * rows (a post, a circular, a thread) a data answer cites, with its page on the platform.
 */
export const assistantCitationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("CURRICULUM"),
    n: z.number().int().positive(),
    board: z.string(),
    book: z.string(),
    grade: z.string(),
    chapter: z.string().nullable(),
    section: z.string().nullable(),
    page: z.number().int(),
    sourceUrl: z.string().nullable(),
    chunkId: z.string(),
  }),
  z.object({
    kind: z.literal("HELP"),
    n: z.number().int().positive(),
    title: z.string(),
    /** A path on this platform ("/admin/people"), or null for a door or a docs paragraph. */
    pagePath: z.string().nullable(),
    entryId: z.string(),
  }),
  /**
   * THE DATA QUESTIONS (11 Oct 2026): one of the person's own rows a data answer cites — a post, a circular, a
   * thread of their own, or the page to write to a member of staff the messaging rule lets them write to. Built
   * by the server from the row (src/lib/assistant/links.ts), never written by the model: `title` is the role
   * word and the day, never a name; `pagePath` a page on this platform the person's role opens; `rowId` the
   * row's id (null for the compose page). The surfaces render it as they render a HELP citation.
   */
  z.object({
    kind: z.literal("LINK"),
    n: z.number().int().positive(),
    title: z.string(),
    pagePath: z.string(),
    rowId: z.string().nullable(),
  }),
]);
export type AssistantCitation = z.infer<typeof assistantCitationSchema>;

export const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["USER", "ASSISTANT"]),
  /** The person's own words (kept as typed, for them to re-read), or the answer as shown. */
  text: z.string(),
  createdAt: iso,
  citations: z.array(assistantCitationSchema),
  /** Null on the person's own message. */
  verdict: assistantVerdictSchema.nullable(),
  mode: assistantModeSchema.nullable(),
  /** True when the answer is a hint (the assessment rule); asking the same question again in this conversation gives the worked answer unless the teacher has turned that off. */
  hint: z.boolean(),
  /** The person's "was this helpful", or null when not said. */
  helpful: z.boolean().nullable(),
});
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

export const assistantConversationSchema = z.object({
  id: z.string(),
  language: assistantLanguageSchema,
  createdAt: iso,
  lastAt: iso,
  /** The first question, shortened, as the person typed it; null before the first question. */
  title: z.string().nullable(),
  messageCount: z.number().int().nonnegative(),
  /** When it will be deleted (lastAt + the retention days). */
  expiresAt: iso,
});
export type AssistantConversation = z.infer<typeof assistantConversationSchema>;

/** Why the assistant cannot be used just now, as a code the surfaces name (`assistantService.unavailable.<CODE>`). */
export const ASSISTANT_UNAVAILABLE = ["KILL_SWITCH", "MODULE_OFF", "OPTED_OUT", "DAILY_CAP", "SCHOOL_BUDGET", "NO_SCHOOL"] as const;
export const assistantUnavailableSchema = z.enum(ASSISTANT_UNAVAILABLE);
export type AssistantUnavailable = z.infer<typeof assistantUnavailableSchema>;

/** GET /api/v1/assistant — whether this person may use it now, and what it is for them. The first screen reads this. */
export const assistantStatusSchema = z.object({
  available: z.boolean(),
  reason: assistantUnavailableSchema.nullable(),
  /** Platform help: every role. */
  help: z.boolean(),
  /** The tutor: STUDENT, TEACHER, FACULTY, HOD. */
  tutor: z.boolean(),
  language: assistantLanguageSchema,
  /** Questions a person may ask in a day, and how many they have asked today. */
  dailyCap: z.number().int().nonnegative(),
  usedToday: z.number().int().nonnegative(),
  /** Days a conversation is kept after its last message. */
  retentionDays: z.number().int().positive(),
  /** A guardian's only: where the opt-out per child is (a path on this platform). */
  optOutPath: z.string().nullable(),
});
export type AssistantStatus = z.infer<typeof assistantStatusSchema>;

/** POST /api/v1/assistant/conversations — opens one. `childId` is a guardian's: the child's school the conversation is filed under (the first child when omitted). */
export const assistantOpenSchema = z.object({
  language: assistantLanguageSchema,
  childId: cuidish.optional(),
});
export type AssistantOpen = z.infer<typeof assistantOpenSchema>;

/** GET /api/v1/assistant/conversations — the person's own, newest first, the last thirty days. */
export const assistantConversationListSchema = z.object({ conversations: z.array(assistantConversationSchema), retentionDays: z.number().int().positive() });

/** GET /api/v1/assistant/conversations/{conversationId} */
export const assistantConversationDetailSchema = z.object({ conversation: assistantConversationSchema, messages: z.array(assistantMessageSchema) });
export type AssistantConversationDetail = z.infer<typeof assistantConversationDetailSchema>;

/** The longest question a person may type (a pasted homework text included). */
export const ASSISTANT_QUESTION_MAX = 1200;

/**
 * POST /api/v1/assistant/conversations/{conversationId}/messages — the question. The answer is
 * streamed over GET /api/v1/events as `assistant.stage`, `assistant.delta` and `assistant.done` on the
 * person's own channel AFTER the answer gate has passed it (nothing unchecked is ever streamed), and
 * comes back whole in this response too, so a client without the stream loses nothing.
 */
export const assistantAskSchema = z.object({
  text: z.string().trim().min(1).max(ASSISTANT_QUESTION_MAX),
  /** The language to answer in; omitted, the language the question is typed in, else the conversation's. */
  language: assistantLanguageSchema.optional(),
});
export type AssistantAsk = z.infer<typeof assistantAskSchema>;

export const assistantAnswerSchema = z.object({
  conversationId: z.string(),
  question: assistantMessageSchema,
  answer: assistantMessageSchema,
});
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;

/** POST /api/v1/assistant/conversations/{conversationId}/feedback — "was this helpful", once per answer, changeable. */
export const assistantFeedbackSchema = z.object({ messageId: cuidish, helpful: z.boolean() });
export const assistantFeedbackSavedSchema = z.object({ messageId: z.string(), helpful: z.boolean() });

/** DELETE /api/v1/assistant/conversations/{conversationId} */
export const assistantDeletedSchema = z.object({ conversationId: z.string(), deleted: z.literal(true) });

/**
 * The events on the person's own channel (GET /api/v1/events), in order: one `assistant.stage` per
 * stage, then the checked answer as `assistant.delta` pieces (seq from 0), then `assistant.done`.
 * A refusal is streamed the same way (one delta). Screen readers are told once, on `done`.
 */
export const assistantStageSchema = z.enum(["SEARCHING", "WRITING", "CHECKING"]);
export const assistantEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assistant.stage"), conversationId: z.string(), stage: assistantStageSchema }),
  z.object({ type: z.literal("assistant.delta"), conversationId: z.string(), messageId: z.string(), seq: z.number().int().nonnegative(), text: z.string() }),
  z.object({ type: z.literal("assistant.done"), conversationId: z.string(), messageId: z.string(), verdict: assistantVerdictSchema }),
]);
export type AssistantEvent = z.infer<typeof assistantEventSchema>;

/** The helpline sentence the office may set (School.helplineText); blank names the national helpline. */
export const ASSISTANT_HELPLINE_MAX = 300;

/** GET /api/v1/admin/assistant/usage — the school's month in counts (never a word anyone typed), its budget and the switch. */
export const assistantUsageSchema = z.object({
  /** The ASSISTANT module, which the office switches. */
  on: z.boolean(),
  /** False while the platform's kill switch (ASSISTANT_ENABLED=0) is thrown. */
  platformOn: z.boolean(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  questions: z.number().int().nonnegative(),
  answered: z.number().int().nonnegative(),
  hints: z.number().int().nonnegative(),
  refused: z.number().int().nonnegative(),
  counsellorRoutes: z.number().int().nonnegative(),
  helpful: z.number().int().nonnegative(),
  notHelpful: z.number().int().nonnegative(),
  /** People who asked at least once this month. */
  people: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  tokenBudget: z.number().int().nonnegative(),
  dailyCapPerPerson: z.number().int().nonnegative(),
  helplineText: z.string().nullable(),
  /** The sentence shown when helplineText is blank. */
  helplineDefault: z.string(),
  retentionDays: z.number().int().positive(),
});
export type AssistantUsage = z.infer<typeof assistantUsageSchema>;

/** POST /api/v1/admin/assistant/settings — the switch and the helpline; either may be left out. Answers the usage view. */
export const assistantSettingsSchema = z.object({
  on: z.boolean().optional(),
  helplineText: z.string().trim().max(ASSISTANT_HELPLINE_MAX).nullable().optional(),
});
export type AssistantSettings = z.infer<typeof assistantSettingsSchema>;

/** GET /api/v1/family/assistant — each child, whether their school has the assistant on, and whether the guardian turned it off for them. */
export const familyAssistantSchema = z.object({
  children: z.array(
    z.object({
      childId: z.string(),
      name: z.string(),
      schoolOn: z.boolean(),
      optedOut: z.boolean(),
      changedAt: iso.nullable(),
    }),
  ),
});
export type FamilyAssistant = z.infer<typeof familyAssistantSchema>;

/** POST /api/v1/family/assistant/opt-out — turn it off (true) or back on (false) for one child. */
export const familyAssistantOptOutSchema = z.object({ childId: cuidish, optedOut: z.boolean() });
export const familyAssistantOptOutSavedSchema = z.object({ childId: z.string(), optedOut: z.boolean(), changedAt: iso });

/** GET and POST /api/v1/teacher/assignments/{assignmentId}/assistant — whether a second ask of a matching question gets the worked answer (true, the default) or stays a hint. */
export const assignmentAssistantSchema = z.object({ assignmentId: z.string(), workedAnswerOnSecondAsk: z.boolean() });
export const assignmentAssistantSaveSchema = z.object({ workedAnswerOnSecondAsk: z.boolean() });
