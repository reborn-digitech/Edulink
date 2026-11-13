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
 * VIDURA'S THREE MODES (docs/plans/vidura.md, the owner's decision 3; pass 1, 17 Oct 2026): the chip an answer wears
 * and the one a person may pick for the next question. USING ("Using Shalaghar") is platform help from the guides and
 * the page cards; RECORDS ("My records") is the person's own data read through their own doors; LEARNING ("Learning")
 * is the tutor over the books. The gate picks it (the classifier's PLATFORM becomes USING or RECORDS by whether the
 * person's own data was read, CURRICULUM becomes LEARNING); a person's pick re-routes the next question only between
 * the scopes the gate already allows, never past a refusal.
 */
export const ASSISTANT_CHIPS = ["USING", "RECORDS", "LEARNING"] as const;
export const assistantChipSchema = z.enum(ASSISTANT_CHIPS);
export type AssistantChip = z.infer<typeof assistantChipSchema>;

/**
 * "ASK A PERSON" (pass 1): when Vidura cannot answer — a fixed sentence, or an answer saying it is not sure — the one
 * person at the conversation's school the asker may write to under the messaging rule (src/lib/conversations.ts
 * `mayConverse`): a pupil's or a guardian's class teacher, else the office (at a college, the registrar's office),
 * and for the office the head. The surfaces open (or find) the room with them through the existing doors; nothing of
 * the question is carried.
 */
export const ASSISTANT_ASK_PERSON = ["CLASS_TEACHER", "OFFICE", "REGISTRAR", "HEAD"] as const;
export const assistantAskPersonSchema = z.object({
  who: z.enum(ASSISTANT_ASK_PERSON),
  schoolId: z.string(),
  userId: z.string(),
});
export type AssistantAskPerson = z.infer<typeof assistantAskPersonSchema>;

/**
 * A citation points at a passage the search actually returned (the answer gate refuses any other).
 * CURRICULUM: the board's book, chapter, section and page, with the publisher's own PDF (`sourceUrl`,
 * open with `#page=<page>`). HELP: the platform page the help entry names. LINK: one of the person's own
 * rows (a post, a circular, a thread) a data answer cites, with its page on the platform.
 */
/**
 * VIDURA PASS 4 (18 Oct 2026): what a passage of a share-alike source carries in its citation, drawn under the source
 * on the web and the phone (`viduraUi.attributionWikipedia`): the article's title, the revision read and when it was
 * saved, its permanent address and the licence (CC BY-SA 4.0 asks for all four). Null for the books.
 */
export const assistantAttributionSchema = z.object({
  kind: z.literal("WIKIPEDIA"),
  title: z.string(),
  revision: z.number().int(),
  revisedAt: z.string(),
  url: z.string(),
  licence: z.string(),
  licenceUrl: z.string(),
});
export type AssistantAttribution = z.infer<typeof assistantAttributionSchema>;

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
    /** Pass 4: the share-alike source's attribution line (a Wikipedia article's); null for a book. */
    attribution: assistantAttributionSchema.nullable().default(null),
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

/** One reference link (pass 4): the source's name and kind, the topic searched and the address (https, on the source's host). */
export const ASSISTANT_REFERENCE_KINDS = ["VIDEO", "COURSE", "LAW", "PRACTICE", "REFERENCE"] as const;
export const assistantReferenceSchema = z.object({
  source: z.string(),
  kind: z.enum(ASSISTANT_REFERENCE_KINDS),
  topic: z.string(),
  url: z.string(),
});
export type AssistantReference = z.infer<typeof assistantReferenceSchema>;

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
  /** The mode chip the answer wears (pass 1); null on the person's own message and on a fixed sentence. */
  chip: assistantChipSchema.nullable().default(null),
  /** The answer stopped at its length cap (pass 1): "Go on" continues it, as one more question of the day. */
  cut: z.boolean().default(false),
  /** Who to ask instead, on a fixed sentence or an answer that says it is not sure (pass 1); null otherwise. */
  askPerson: assistantAskPersonSchema.nullable().default(null),
  /** The answer is the platform's standard answer to this question, checked by the operator (pass 3). */
  standard: z.boolean().default(false),
  /**
   * Pass 4: links to the operator's allow-listed public sources beside a Learning answer ("Further reading"), built by
   * the server from the cited passage's heading; only for staff and adult college students, never a pupil (decision
   * 0002); empty otherwise.
   */
  references: z.array(assistantReferenceSchema).default([]),
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
  /** The modes this person may pick for a question (pass 1): USING for everyone, RECORDS for every role with their own data, LEARNING for the tutor's roles. */
  modes: z.array(assistantChipSchema).default([]),
});
export type AssistantStatus = z.infer<typeof assistantStatusSchema>;

/** POST /api/v1/assistant/conversations — opens one. `childId` is a guardian's: the child's school the conversation is filed under (the first child when omitted). */
export const assistantOpenSchema = z.object({
  language: assistantLanguageSchema,
  childId: cuidish.optional(),
  /** TA-019: the first question, when the conversation is opened to ask it (at most ASSISTANT_QUESTION_MAX, 1200, declared below). Read only by the refusal table, never stored: a message it reads as self-harm or a child telling of abuse opens past the person's day and the school's month. */
  text: z.string().max(1200).optional(),
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
/**
 * VIDURA PASS 2 (17 Oct 2026): what an "Explain this to me" link carries. `kind` names the row's door: FEE_DEMAND (a
 * guardian's child's fee demand, `id` the demand's), REPORT_LINE (a report card's line, `id` "<cardId>:<n>" for its
 * n-th assessment line or "<cardId>:s<n>" for its n-th subject row, from 0), ATTENDANCE (a child's month of the register, or the person's own month at work,
 * `id` the month "YYYY-MM"). `childId` is a guardian's child. Nothing else of the page is sent.
 */
export const ASSISTANT_ABOUT_KINDS = ["FEE_DEMAND", "REPORT_LINE", "ATTENDANCE"] as const;
export type AssistantAboutKind = (typeof ASSISTANT_ABOUT_KINDS)[number];
export const assistantAboutSchema = z.object({
  kind: z.enum(ASSISTANT_ABOUT_KINDS),
  id: z.string().min(1).max(80).regex(/^[A-Za-z0-9_:-]+$/),
  childId: cuidish.optional(),
});
export type AssistantAbout = z.infer<typeof assistantAboutSchema>;

export const assistantAskSchema = z.object({
  text: z.string().trim().min(1).max(ASSISTANT_QUESTION_MAX),
  /** The language to answer in; omitted, the language the question is typed in, else the conversation's. */
  language: assistantLanguageSchema.optional(),
  /** The person's pick of mode for this question (pass 1); omitted, the gate picks. Never past a refusal. */
  mode: assistantChipSchema.optional(),
  /**
   * The page the drawer is beside (pass 1, page awareness): a path on this platform. "How do I do this?" is read
   * against that page's help card and the person's own data shown there; a page that is not the person's is ignored.
   */
  page: z.string().max(200).regex(/^\/(?!\/)[^\s?#]*$/).optional(),
  /** "Go on" (pass 1): continue the conversation's last answer, which stopped at its length cap. */
  goOn: z.boolean().optional(),
  /**
   * "EXPLAIN THIS TO ME" (pass 2): the row the person pressed the link beside — a fee demand, a report card's line, an
   * attendance figure — read again by the service through the person's own door, only as they may read it.
   */
  about: assistantAboutSchema.optional(),
});
export type AssistantAsk = z.infer<typeof assistantAskSchema>;



export const assistantAnswerSchema = z.object({
  conversationId: z.string(),
  question: assistantMessageSchema,
  answer: assistantMessageSchema,
});
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;

/**
 * GET /api/v1/assistant/suggestions?page=/student/assignments — three questions for an empty drawer (pass 1), per
 * role and page, in the person's language, from the help index: the guides' own questions for the page and the role,
 * and the page cards' labels. `page` is the page the drawer is beside; a page that is not the person's is ignored.
 */
export const assistantSuggestionSchema = z.object({ text: z.string(), mode: assistantChipSchema.nullable() });
export const assistantSuggestionsSchema = z.object({ suggestions: z.array(assistantSuggestionSchema).max(3) });
export type AssistantSuggestions = z.infer<typeof assistantSuggestionsSchema>;

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
  /** Answers served this month from a standard answer the operator checked (Vidura pass 3), within `answered`. */
  standardAnswers: z.number().int().nonnegative().default(0),
});
export type AssistantUsage = z.infer<typeof assistantUsageSchema>;

/** POST /api/v1/admin/assistant/settings — the helpline; may be left out. Answers the usage view. */
export const assistantSettingsSchema = z.object({
  /** Kept for older clients: the operator switches the assistant (16 Oct 2026), so only the current state is accepted. */
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

/* -------------------------------------------------------------------------- */
/* The guide in Hindi and Marathi: the speaker's review (Vidura pass 2)        */
/* -------------------------------------------------------------------------- */

/**
 * VIDURA PASS 2 (17 Oct 2026): a Hindi or Marathi rendering of one heading or paragraph of the user guide, made by the
 * local model and used at once for retrieval and suggestions; a speaker approves, edits or rejects it on the
 * operator's panel (/root/vidura-review), the content team reads the same queue (/appadmin/vidura-review).
 */
export const VIDURA_RENDERING_STATUSES = ["UNREVIEWED", "APPROVED", "REJECTED"] as const;
export const viduraRenderingStatusSchema = z.enum(VIDURA_RENDERING_STATUSES);
export type ViduraRenderingStatus = z.infer<typeof viduraRenderingStatusSchema>;
export const viduraRenderingSchema = z.object({
  id: z.string(),
  kind: z.enum(["HEADING", "PARAGRAPH"]),
  language: z.enum(["hi", "mr"]),
  sourceText: z.string(),
  sourceFile: z.string(),
  text: z.string(),
  modelText: z.string(),
  status: viduraRenderingStatusSchema,
  edited: z.boolean(),
  reviewedAt: iso.nullable(),
  reviewedBy: z.string().nullable(),
  updatedAt: iso,
});
export type ViduraRendering = z.infer<typeof viduraRenderingSchema>;
const renderingCounts = z.object({ unreviewed: z.number().int(), approved: z.number().int(), rejected: z.number().int() });
/** GET /api/v1/appadmin/vidura/renderings?language=hi&status=UNREVIEWED&kind=&page= */
export const viduraRenderingsQuerySchema = z.object({
  language: z.enum(["hi", "mr"]).default("hi"),
  status: viduraRenderingStatusSchema.default("UNREVIEWED"),
  kind: z.enum(["HEADING", "PARAGRAPH"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type ViduraRenderingsQuery = z.input<typeof viduraRenderingsQuerySchema>;
export const viduraRenderingsSchema = z.object({
  items: z.array(viduraRenderingSchema),
  counts: z.object({ hi: renderingCounts, mr: renderingCounts }),
  page: z.number().int(),
  pages: z.number().int(),
  pageSize: z.number().int(),
  /** Whether this reader may approve, edit and reject (the operator), or only read (the content team). */
  mayReview: z.boolean(),
});
export type ViduraRenderings = z.infer<typeof viduraRenderingsSchema>;
/** POST /api/v1/operator/vidura/renderings/{renderingId} — the operator's word on one rendering; `text` with EDIT only. */
export const viduraRenderingReviewSchema = z.object({
  action: z.enum(["APPROVE", "EDIT", "REJECT"]),
  text: z.string().trim().min(1).max(6000).optional(),
});
export type ViduraRenderingReview = z.infer<typeof viduraRenderingReviewSchema>;
