import "server-only";
import type {
  AssistantAnswer,
  AssistantCitation,
  AssistantConversation,
  AssistantConversationDetail,
  AssistantLanguage,
  AssistantMessage,
  AssistantStatus,
  AssistantUnavailable,
  AssistantUsage,
  AssistantVerdict,
  FamilyAssistant,
} from "@edulink/contracts";
import { db } from "../db";
import { audit } from "../audit";
import { notifyGuardians } from "../notify";
import { channel, publish, type RealtimeEvent } from "../realtime";
import { readRetentionConfig } from "../env";
import { readAssistantConfig } from "../assistant-env";
import { chatComplete, embedTexts, type ChatMessage, type ChatOptions, type ChatResult } from "../assistant-model";
import { searchCurriculum, searchHelp, type CurriculumHit, type CurriculumQuery, type HelpHit, type HelpQuery } from "../assistant-retrieval";
import { translator, type TranslationKey } from "../i18n/dictionary";
import { normaliseLocale } from "../i18n/locales";
import { isModuleOn, switchModuleFor } from "../modules";
import { AccessError, assertAssignmentAccess, assertGuardianAccess } from "../tenancy";
import { isCollegeKind } from "@edulink/contracts";
import { ROLES, type Role } from "../constants";
import type { ActiveContext } from "../session";
import {
  ANSWER_TIMEOUT_MS,
  CLOSE_TO_BEST,
  CURRICULUM_THRESHOLD,
  CURRICULUM_PASSAGES,
  EMBED_TIMEOUT_MS,
  GRADE_WIDEN_FLOOR,
  HELP_PASSAGES,
  MAX_ANSWER_TOKENS,
  SAME_QUESTION_THRESHOLD,
  TITLE_CHARS,
  dailyQuestionCap,
  killSwitchThrown,
  monthlyTokenBudget,
} from "./config";
import { corpusBoardFor, gradeBandOf, policyFor } from "./policy";
import { citedNumbers, gateAnswer, gateQuestion, tableVerdict } from "./gate";
import { stripIdentifiers, restoreSelf, type NameEntry } from "./strip";
import { withoutInjectedLines } from "./refusals";
import { NCERT_NOTE, helpMessages, questionShape, tutorMessages } from "./prompt";
import { detectLanguage } from "./language";
import { nameLexicon } from "./lexicon";
import { foreignPaths, pageIsRoles } from "./pages";
import { runTools as runToolsReal, type ToolRun } from "./tools";
import { pupilAssessmentItems } from "./assessment";
import { cosine, decideAssessment, type AssessmentDecision, type AssessmentItem } from "./assessment-rule";
import { routeToCounsellor } from "./counsellor";
import { addUsage, counsellorRoutedToday, dayKeyFor, monthTotals, questionsToday, releaseQuestion, reserveQuestion } from "./usage";

/**
 * THE ASSISTANT SERVICE (docs/plans/assistant.md Phase B), a library behind the catalogued doors under
 * /api/v1/assistant (no separate process yet; the model is behind ASSISTANT_MODEL_URL, so moving it to a
 * host is two variables). Every rule of the owner's is code here or in the files it calls:
 *
 *   policy.ts      who gets the help and the tutor, and which of their own doors may be read
 *   refusals.ts    the refusal table for minors and the injection patterns, in en, hi and mr
 *   gate.ts        the gate before the model (tables, thresholds, the one-word classifier) and after it
 *   strip.ts       names, ids, codes, e-mails, phone numbers and links out of everything the model reads
 *   assessment*.ts the open-sitting and hand-in rule, matched against the pupil's own items only
 *   tools.ts       the person's own GET doors, called as the person
 *   prompt.ts      the system prompt, the one instruction channel
 *   counsellor.ts  the self-harm route
 *   usage.ts       the counts, the caps
 *
 * The model, the embeddings, the searches and the bus are a port (`AssistantDeps`), so the tests run
 * the whole pipeline against fakes that record every call.
 */

export type AssistantDeps = {
  embed: (texts: string[]) => Promise<number[][]>;
  chat: (messages: ChatMessage[], opts: ChatOptions) => Promise<ChatResult>;
  searchHelp: (q: HelpQuery) => Promise<HelpHit[]>;
  searchCurriculum: (q: CurriculumQuery) => Promise<CurriculumHit[]>;
  runTools: (input: Parameters<typeof runToolsReal>[0]) => Promise<ToolRun[]>;
  publish: (userId: string, event: RealtimeEvent) => void;
  now: () => Date;
};

/** The model is not configured or not reachable: the answer is MODEL_UNAVAILABLE and nothing is charged. */
class ModelUnavailable extends Error {}

export function realDeps(): AssistantDeps {
  const read = readAssistantConfig();
  const config = read.ok ? read.config : null;
  const need = () => {
    if (!config) throw new ModelUnavailable("the assistant's model endpoints are not configured");
    return config;
  };
  return {
    embed: (texts) => embedTexts(need().embed, texts, { timeoutMs: EMBED_TIMEOUT_MS }),
    chat: (messages, opts) => chatComplete(need().chat, messages, opts),
    searchHelp: (q) => searchHelp(q, { db, embed: need().embed }),
    searchCurriculum: (q) => searchCurriculum(q, { db, embed: need().embed }),
    runTools: runToolsReal,
    publish: (userId, event) => publish([channel.user(userId)], event),
    now: () => new Date(),
  };
}

/** Refused before any work: the route answers 403 (MODULE_OFF for the module) or 429 (the caps) with the reason's sentence. */
export class AssistantUnavailableError extends Error {
  constructor(
    readonly reason: AssistantUnavailable,
    readonly vars: Record<string, string | number> = {},
  ) {
    super(reason);
    this.name = "AssistantUnavailableError";
  }
  get status(): number {
    return this.reason === "DAILY_CAP" || this.reason === "SCHOOL_BUDGET" ? 429 : 403;
  }
}

/* -------------------------------------------------------------------------- */
/* Who is asking, at which school                                              */
/* -------------------------------------------------------------------------- */

type Asker = { userId: string; role: Role; membershipId: string | null; schoolId: string; locale: AssistantLanguage };

function localeOf(ctx: ActiveContext): AssistantLanguage {
  const l = normaliseLocale(ctx.user.prefs?.locale);
  return l === "hi" || l === "mr" ? l : "en";
}

function isRole(r: string | null): r is Role {
  return r !== null && (ROLES as readonly string[]).includes(r);
}

/**
 * The school a person's assistant is filed under: their session's, or for a guardian (who has none)
 * the chosen child's (assertGuardianAccess), else the first active child whose school has it on.
 */
async function askerFor(ctx: ActiveContext, childId?: string | null): Promise<Asker> {
  if (!isRole(ctx.role)) throw new AssistantUnavailableError("NO_SCHOOL");
  if (ctx.role === "EXPERT" || ctx.role === "RECRUITER" || !policyFor(ctx.role).help) throw new AssistantUnavailableError("NO_SCHOOL");
  const base = { userId: ctx.user.id, role: ctx.role, locale: localeOf(ctx) };
  if (ctx.role !== "PARENT") {
    if (!ctx.schoolId) throw new AssistantUnavailableError("NO_SCHOOL");
    return { ...base, membershipId: ctx.membershipId, schoolId: ctx.schoolId };
  }
  if (childId) {
    const link = await assertGuardianAccess(ctx.user.id, childId);
    return { ...base, membershipId: null, schoolId: link.student.school.id };
  }
  const links = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentSchoolId: true }, orderBy: { createdAt: "asc" } });
  for (const l of links) if (await isModuleOn(l.studentSchoolId, "ASSISTANT")) return { ...base, membershipId: null, schoolId: l.studentSchoolId };
  if (links[0]) return { ...base, membershipId: null, schoolId: links[0].studentSchoolId };
  throw new AssistantUnavailableError("NO_SCHOOL");
}

async function schoolOf(schoolId: string) {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, timezone: true, board: true, kind: true, helplineText: true } });
  if (!school) throw new AssistantUnavailableError("NO_SCHOOL");
  return school;
}

/** The switches and the caps, in the order the person is told: the platform, the school, the guardian, the school's month, the person's day. */
async function unavailableReason(asker: Asker, now: Date, opts: { countToday: boolean }): Promise<{ reason: AssistantUnavailable | null; usedToday: number }> {
  if (killSwitchThrown()) return { reason: "KILL_SWITCH", usedToday: 0 };
  if (!(await isModuleOn(asker.schoolId, "ASSISTANT"))) return { reason: "MODULE_OFF", usedToday: 0 };
  if (asker.role === "STUDENT" && asker.membershipId) {
    const setting = await db.assistantChildSetting.findUnique({ where: { studentMembershipId: asker.membershipId }, select: { optedOut: true } });
    if (setting?.optedOut) return { reason: "OPTED_OUT", usedToday: 0 };
  }
  const school = await schoolOf(asker.schoolId);
  const dayKey = dayKeyFor(school.timezone, now);
  const totals = await monthTotals(asker.schoolId, dayKey.slice(0, 7));
  if (totals.tokens >= monthlyTokenBudget()) return { reason: "SCHOOL_BUDGET", usedToday: 0 };
  const usedToday = opts.countToday ? await questionsToday({ schoolId: asker.schoolId, userId: asker.userId, dayKey }) : 0;
  if (opts.countToday && usedToday >= dailyQuestionCap()) return { reason: "DAILY_CAP", usedToday };
  return { reason: null, usedToday };
}

function retentionDays(): number {
  return readRetentionConfig().config.assistantDays;
}

/* -------------------------------------------------------------------------- */
/* The doors' reads and writes                                                 */
/* -------------------------------------------------------------------------- */

export async function assistantStatus(ctx: ActiveContext, now = new Date()): Promise<AssistantStatus> {
  const role = isRole(ctx.role) ? ctx.role : null;
  const policy = policyFor(role);
  const language = localeOf(ctx);
  const base = { help: policy.help, tutor: policy.tutor, language, dailyCap: dailyQuestionCap(), retentionDays: retentionDays(), optOutPath: role === "PARENT" ? "/parent/settings" : null };
  let asker: Asker;
  try {
    asker = await askerFor(ctx);
  } catch (error) {
    if (error instanceof AssistantUnavailableError) return { ...base, available: false, reason: error.reason, usedToday: 0 };
    throw error;
  }
  const { reason, usedToday } = await unavailableReason(asker, now, { countToday: true });
  return { ...base, available: reason === null, reason, usedToday };
}

function conversationView(row: { id: string; language: string; createdAt: Date; lastAt: Date; title: string | null; _count?: { messages: number } }, days: number): AssistantConversation {
  return {
    id: row.id,
    language: (["en", "hi", "mr"].includes(row.language) ? row.language : "en") as AssistantLanguage,
    createdAt: row.createdAt.toISOString(),
    lastAt: row.lastAt.toISOString(),
    title: row.title,
    messageCount: row._count?.messages ?? 0,
    expiresAt: new Date(row.lastAt.getTime() + days * 86_400_000).toISOString(),
  };
}

/** Opens a conversation. A pupil's first one tells their guardians once (the one-time notice). */
export async function openConversation(ctx: ActiveContext, input: { language: AssistantLanguage; childId?: string }, now = new Date()): Promise<AssistantConversation> {
  const asker = await askerFor(ctx, input.childId);
  const { reason } = await unavailableReason(asker, now, { countToday: true });
  if (reason) throw new AssistantUnavailableError(reason, { cap: dailyQuestionCap() });
  const row = await db.assistantConversation.create({
    data: { schoolId: asker.schoolId, membershipId: asker.membershipId, userId: asker.userId, role: asker.role, language: input.language, createdAt: now, lastAt: now },
  });
  if (asker.role === "STUDENT" && asker.membershipId) await noticeGuardiansOnce(asker.schoolId, asker.membershipId, now);
  return conversationView({ ...row, _count: { messages: 0 } }, retentionDays());
}

/** The one-time notice (the owner's rule 6): the first time a pupil opens the assistant, each active guardian is told, once, and where the opt-out is. */
export async function noticeGuardiansOnce(schoolId: string, studentMembershipId: string, now = new Date()): Promise<boolean> {
  const existing = await db.assistantChildSetting.findUnique({ where: { studentMembershipId }, select: { noticeSentAt: true } });
  if (existing?.noticeSentAt) return false;
  // Claim the notice first, so two first conversations at once tell the guardians once.
  const claimed = existing
    ? (await db.assistantChildSetting.updateMany({ where: { studentMembershipId, noticeSentAt: null }, data: { noticeSentAt: now } })).count === 1
    : await db.assistantChildSetting
        .create({ data: { schoolId, studentMembershipId, noticeSentAt: now } })
        .then(() => true)
        .catch(() => false);
  if (!claimed) return false;
  await notifyGuardians(studentMembershipId, (child) => ({ schoolId, kind: "SYSTEM", titleKey: "assistantService.noticeTitle", titleVars: { child }, bodyKey: "assistantService.noticeBody", bodyVars: { child }, url: "/parent/settings" }));
  await audit({ schoolId, actorUserId: null, action: "assistant.notice", targetType: "Membership", targetId: studentMembershipId });
  return true;
}

export async function listConversations(ctx: ActiveContext, now = new Date()): Promise<{ conversations: AssistantConversation[]; retentionDays: number }> {
  const days = retentionDays();
  const rows = await db.assistantConversation.findMany({
    where: { userId: ctx.user.id, lastAt: { gte: new Date(now.getTime() - days * 86_400_000) }, ...(ctx.role === "PARENT" ? { role: "PARENT" } : { schoolId: ctx.schoolId ?? "—", role: ctx.role ?? "—" }) },
    orderBy: { lastAt: "desc" },
    take: 100,
    include: { _count: { select: { messages: true } } },
  });
  return { conversations: rows.map((r) => conversationView(r, days)), retentionDays: days };
}

/** One of the person's own conversations, opened in the role they are in now; anyone else's is not there. */
async function ownConversation(ctx: ActiveContext, conversationId: string) {
  const row = await db.assistantConversation.findFirst({
    where: { id: conversationId, userId: ctx.user.id, role: ctx.role ?? "—", ...(ctx.role === "PARENT" ? {} : { schoolId: ctx.schoolId ?? "—" }) },
  });
  if (!row) throw new AccessError("assistantService.conversationNotFound", "NOT_FOUND");
  return row;
}

function messageView(m: { id: string; role: string; text: string; createdAt: Date; citationsJson: string; verdict: string | null; mode: string | null; hint: boolean; helpful: boolean | null }): AssistantMessage {
  let citations: AssistantCitation[] = [];
  try {
    citations = JSON.parse(m.citationsJson) as AssistantCitation[];
  } catch {
    citations = [];
  }
  return {
    id: m.id,
    role: m.role === "USER" ? "USER" : "ASSISTANT",
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    citations,
    verdict: (m.verdict as AssistantVerdict | null) ?? null,
    mode: m.mode === "HELP" || m.mode === "TUTOR" ? m.mode : null,
    hint: m.hint,
    helpful: m.helpful,
  };
}

export async function getConversation(ctx: ActiveContext, conversationId: string): Promise<AssistantConversationDetail> {
  const row = await ownConversation(ctx, conversationId);
  const messages = await db.assistantMessage.findMany({ where: { conversationId: row.id }, orderBy: { createdAt: "asc" } });
  return { conversation: conversationView({ ...row, _count: { messages: messages.length } }, retentionDays()), messages: messages.map(messageView) };
}

export async function deleteConversation(ctx: ActiveContext, conversationId: string): Promise<{ conversationId: string; deleted: true }> {
  const row = await ownConversation(ctx, conversationId);
  await db.assistantConversation.deleteMany({ where: { id: row.id, userId: ctx.user.id } });
  return { conversationId: row.id, deleted: true };
}

export async function saveFeedback(ctx: ActiveContext, conversationId: string, input: { messageId: string; helpful: boolean }, now = new Date()): Promise<{ messageId: string; helpful: boolean }> {
  const row = await ownConversation(ctx, conversationId);
  const message = await db.assistantMessage.findFirst({ where: { id: input.messageId, conversationId: row.id, role: "ASSISTANT" }, select: { id: true, helpful: true } });
  if (!message) throw new AccessError("assistantService.messageNotFound", "NOT_FOUND");
  if (message.helpful !== input.helpful) {
    await db.assistantMessage.update({ where: { id: message.id }, data: { helpful: input.helpful } });
    const school = await schoolOf(row.schoolId);
    const where = { schoolId: row.schoolId, userId: ctx.user.id, dayKey: dayKeyFor(school.timezone, now) };
    // A changed mind moves the count; the first say adds one.
    await addUsage(where, input.helpful ? { helpful: 1 } : { notHelpful: 1 });
    if (message.helpful !== null) await db.assistantUsage.updateMany({ where: { ...where, [message.helpful ? "helpful" : "notHelpful"]: { gt: 0 } }, data: { [message.helpful ? "helpful" : "notHelpful"]: { decrement: 1 } } });
  }
  return { messageId: message.id, helpful: input.helpful };
}

/* -------------------------------------------------------------------------- */
/* Asking                                                                      */
/* -------------------------------------------------------------------------- */

const best = (hits: { similarity: number | null }[]) => Math.max(0, ...hits.map((h) => h.similarity ?? 0));
const keepClose = <T extends { similarity: number | null }>(hits: T[]): T[] => {
  const top = best(hits);
  return hits.filter((h) => (h.similarity ?? 0) >= top - CLOSE_TO_BEST);
};

function gradeNumber(raw: string | null | undefined): number | null {
  const n = Number(String(raw ?? "").replace(/\D+/g, ""));
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/** The fixed sentence for a verdict, in the answer's language. */
export function fixedSentence(verdict: AssistantVerdict, language: AssistantLanguage, helplineText: string | null): string {
  const t = translator(language);
  if (verdict === "SELF_HARM" || verdict === "ABUSE_DISCLOSURE") return t(`assistantService.verdict.${verdict}`, { helpline: helplineText?.trim() || t("assistantService.helplineDefault") });
  return t(`assistantService.verdict.${verdict}` as TranslationKey);
}

/** The checked answer, in sentence-sized pieces for the stream. */
export function streamPieces(text: string): string[] {
  const pieces = text.match(/[^.!?।\n]+[.!?।]?\s*|\n+/g) ?? [text];
  return pieces.filter((p) => p.length > 0);
}

/** A cache of the pupil's items' vectors (the text is the key: a changed title is a new vector). */
const itemVectors = new Map<string, number[]>();
const ITEM_CACHE_MAX = 5000;

async function vectorsFor(deps: AssistantDeps, texts: string[]): Promise<number[][]> {
  const missing = [...new Set(texts.filter((t) => !itemVectors.has(t)))];
  if (missing.length) {
    const got = await deps.embed(missing);
    missing.forEach((t, i) => {
      if (itemVectors.size >= ITEM_CACHE_MAX) itemVectors.clear();
      itemVectors.set(t, got[i]!);
    });
  }
  return texts.map((t) => itemVectors.get(t)!);
}

type Outcome = {
  verdict: AssistantVerdict;
  text: string;
  mode: "HELP" | "TUTOR" | null;
  hint: boolean;
  citations: AssistantCitation[];
  matchedAssignmentId: string | null;
  promptTokens: number;
  completionTokens: number;
  modelCalls: number;
};

/**
 * The question, through both gates. Returns the saved question and answer; streams the stages and
 * the checked answer over the person's own channel as it goes.
 */
export async function ask(ctx: ActiveContext, conversationId: string, input: { text: string; language?: AssistantLanguage }, deps: AssistantDeps = realDeps()): Promise<AssistantAnswer> {
  const now = deps.now();
  const conv = await ownConversation(ctx, conversationId);
  const asker: Asker = { userId: ctx.user.id, role: conv.role as Role, membershipId: conv.membershipId, schoolId: conv.schoolId, locale: localeOf(ctx) };
  const policy = policyFor(asker.role);
  const { reason } = await unavailableReason(asker, now, { countToday: false });
  if (reason) throw new AssistantUnavailableError(reason, { cap: dailyQuestionCap() });
  const school = await schoolOf(asker.schoolId);
  const day = { schoolId: asker.schoolId, userId: asker.userId, dayKey: dayKeyFor(school.timezone, now) };
  const reserved = await reserveQuestion(day, dailyQuestionCap());
  if (!reserved.ok) throw new AssistantUnavailableError("DAILY_CAP", { cap: dailyQuestionCap() });

  const original = input.text.trim();
  const language: AssistantLanguage = input.language ?? detectLanguage(original) ?? ((["en", "hi", "mr"].includes(conv.language) ? conv.language : asker.locale) as AssistantLanguage);
  const lexicon = await nameLexicon({ userId: asker.userId, schoolId: asker.schoolId });
  const stripped = stripIdentifiers(original, lexicon);
  // The conversation's last two turns, for the second-ask rule (§9.4).
  const previous = await db.assistantMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" }, take: 2, select: { role: true, textForModel: true, text: true, hint: true, matchedAssignmentId: true } });
  const question = await db.assistantMessage.create({ data: { conversationId: conv.id, schoolId: conv.schoolId, role: "USER", text: original, textForModel: stripped.text, createdAt: now } });
  const emit = (event: RealtimeEvent) => {
    try {
      deps.publish(asker.userId, event);
    } catch {
      // The stream is a convenience; the response carries the answer whatever happens to it.
    }
  };
  emit({ type: "assistant.stage", conversationId: conv.id, stage: "SEARCHING" });

  let outcome: Outcome;
  try {
    outcome = await answerQuestion({ asker, policy, school, language, original, stripped: stripped.text, lexicon, previous, deps, emit, conversationId: conv.id });
  } catch (error) {
    if (!(error instanceof ModelUnavailable) && !isModelFailure(error)) {
      await releaseQuestion(day);
      throw error;
    }
    // The endpoint is down or too slow: the sentence, and the question is given back to the person's day.
    await releaseQuestion(day);
    outcome = { verdict: "MODEL_UNAVAILABLE", text: fixedSentence("MODEL_UNAVAILABLE", language, null), mode: null, hint: false, citations: [], matchedAssignmentId: null, promptTokens: 0, completionTokens: 0, modelCalls: 0 };
  }

  // The counsellor route: a pupil's self-harm question tells a caring adult, once a school day.
  let routed = false;
  // The same route for a child telling of abuse (ABUSE_DISCLOSURE, Phase D): the adult is told, never the words.
  if ((outcome.verdict === "SELF_HARM" || outcome.verdict === "ABUSE_DISCLOSURE") && asker.role === "STUDENT" && asker.membershipId && !(await counsellorRoutedToday(day))) {
    await routeToCounsellor({ schoolId: asker.schoolId, pupilMembershipId: asker.membershipId, pupilUserId: asker.userId });
    routed = true;
  }

  const answer = await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      schoolId: conv.schoolId,
      role: "ASSISTANT",
      text: outcome.text,
      citationsJson: JSON.stringify(outcome.citations),
      verdict: outcome.verdict,
      mode: outcome.mode,
      hint: outcome.hint,
      matchedAssignmentId: outcome.matchedAssignmentId,
      promptTokens: outcome.promptTokens,
      completionTokens: outcome.completionTokens,
      createdAt: new Date(now.getTime() + 1),
    },
  });
  await db.assistantConversation.update({
    where: { id: conv.id },
    data: { lastAt: now, tokens: { increment: outcome.promptTokens + outcome.completionTokens }, ...(conv.title ? {} : { title: original.slice(0, TITLE_CHARS) }) },
  });
  const answered = outcome.verdict === "ANSWERED" || outcome.verdict === "HINT";
  await addUsage(day, {
    answered: outcome.verdict === "ANSWERED" ? 1 : 0,
    hints: outcome.verdict === "HINT" ? 1 : 0,
    refused: answered || outcome.verdict === "MODEL_UNAVAILABLE" ? 0 : 1,
    counsellorRoutes: routed ? 1 : 0,
    modelCalls: outcome.modelCalls,
    promptTokens: outcome.promptTokens,
    completionTokens: outcome.completionTokens,
  });
  streamPieces(outcome.text).forEach((text, seq) => emit({ type: "assistant.delta", conversationId: conv.id, messageId: answer.id, seq, text }));
  emit({ type: "assistant.done", conversationId: conv.id, messageId: answer.id, verdict: outcome.verdict });
  return { conversationId: conv.id, question: messageView(question), answer: messageView(answer) };
}

function isModelFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError" || /fetch failed|ECONNREFUSED|endpoint answered|EmbeddingBroken|returned no vector/i.test(`${error.name} ${error.message}`);
}

type AnswerInput = {
  asker: Asker;
  policy: ReturnType<typeof policyFor>;
  school: Awaited<ReturnType<typeof schoolOf>>;
  language: AssistantLanguage;
  original: string;
  stripped: string;
  lexicon: NameEntry[];
  previous: { role: string; textForModel: string | null; text: string; hint: boolean; matchedAssignmentId: string | null }[];
  deps: AssistantDeps;
  emit: (event: RealtimeEvent) => void;
  conversationId: string;
  /** The smoke script's class, for a pupil with no membership. */
  gradeOverride?: number | null;
  /** The evaluation harness's hand-in items and sittings (Phase D), in place of the pupil's own read from the database. */
  assessmentItems?: AssessmentItem[];
};

async function answerQuestion(a: AnswerInput): Promise<Outcome> {
  const { asker, policy, school, language, deps } = a;
  const fixed = (verdict: AssistantVerdict, extra: Partial<Outcome> = {}): Outcome => ({ verdict, text: fixedSentence(verdict, language, school.helplineText), mode: null, hint: false, citations: [], matchedAssignmentId: null, promptTokens: 0, completionTokens: 0, modelCalls: 0, ...extra });

  // 1. The tables, on the person's own words: nothing searched, nothing sent anywhere.
  const table = tableVerdict(a.original);
  if (table) return fixed(table);

  // 2. Retrieval in the scopes the role may use.
  const college = isCollegeKind(school.kind);
  let grade: number | null = a.gradeOverride ?? null;
  if (grade === null && asker.role === "STUDENT" && asker.membershipId) {
    const m = await db.membership.findUnique({ where: { id: asker.membershipId }, select: { gradeLevel: true } });
    grade = gradeNumber(m?.gradeLevel);
  }
  const board = college ? undefined : corpusBoardFor(school.board);
  // Never another role's page (Phase D's pilot, 10 Oct 2026: a guardian was sent to an office page). A
  // program's door summary with no page still tells a platform question from the rest (the scope), but is
  // never a passage the model reads: in the pilot those were the closest passages to most help questions,
  // and the answers sent a pupil to /api/v1/family/student/assignments and a driver to /admin/people.
  // Three times the passages are fetched so that enough page passages remain.
  const helpScope = policy.help ? keepClose((await deps.searchHelp({ query: a.stripped, language, role: asker.role, limit: HELP_PASSAGES * 3 })).filter((h) => !h.pagePath || pageIsRoles(h.pagePath, asker.role))) : [];
  const help = helpScope.filter((h) => h.pagePath || !h.door).slice(0, HELP_PASSAGES);
  let curriculum: CurriculumHit[] = [];
  let boardNote: string | null = null;
  let laterClass: string | null = null;
  if (policy.tutor) {
    const scoped = policy.gradeScoped && grade !== null && !college;
    curriculum = await deps.searchCurriculum({ query: a.stripped, language, board, grade: scoped && grade !== null ? grade : undefined, limit: CURRICULUM_PASSAGES });
    // Nothing close in the class's own books: the classes either side (Phase A's widening).
    if (scoped && best(curriculum) < GRADE_WIDEN_FLOOR) {
      const wider = await deps.searchCurriculum({ query: a.stripped, language, board, grade: grade!, gradeWindow: 2, limit: CURRICULUM_PASSAGES });
      if (best(wider) > best(curriculum)) curriculum = wider;
    }
    // A state board's pupil whose own books carry nothing close is answered from NCERT, and told so (§8.7).
    if (board && board !== "NCERT" && best(curriculum) < GRADE_WIDEN_FLOOR) {
      const ncert = await deps.searchCurriculum({ query: a.stripped, language, board: "NCERT", grade: policy.gradeScoped && grade !== null ? grade : undefined, gradeWindow: policy.gradeScoped ? 2 : 0, limit: CURRICULUM_PASSAGES });
      if (best(ncert) > best(curriculum)) {
        curriculum = ncert;
        boardNote = NCERT_NOTE;
      }
    }
    // Still nothing close in the classes either side: the board's (then NCERT's) book of whichever class
    // carries the topic, the answer saying in which class it is taught (Phase D, 10 Oct 2026).
    if (scoped && best(curriculum) < CURRICULUM_THRESHOLD[language]) {
      for (const b of [...new Set([board ?? "NCERT", "NCERT"])]) {
        const any = await deps.searchCurriculum({ query: a.stripped, language, board: b, limit: CURRICULUM_PASSAGES });
        const top = [...any].sort((x, y) => (y.similarity ?? 0) - (x.similarity ?? 0))[0];
        if (top && best(any) >= CURRICULUM_THRESHOLD[language] && best(any) > best(curriculum)) {
          curriculum = any;
          const g = gradeNumber(top.grade);
          laterClass = g !== null && g !== grade ? String(g) : null;
          boardNote = b !== board ? NCERT_NOTE : boardNote;
          break;
        }
      }
    }
  } else {
    // Only to tell a topic question from a platform one; never answered for this role.
    curriculum = await deps.searchCurriculum({ query: a.stripped, language, limit: 1 });
  }
  curriculum = keepClose(curriculum);

  // 3. The gate before the model.
  const gate = await gateQuestion({ original: a.original, stripped: a.stripped, language, policy, helpTop: best(helpScope), curriculumTop: best(curriculum) }, { chat: deps.chat });
  if (!gate.pass) return fixed(gate.verdict, { promptTokens: gate.tokens, modelCalls: gate.modelCalled ? 1 : 0 });
  let tokens = { prompt: gate.tokens, completion: 0 };
  let modelCalls = 1;

  // 4. The assessment rule, for a pupil's topic question.
  let decision: AssessmentDecision = { kind: "FREE" };
  if (gate.mode === "TUTOR" && policy.assessed && (a.assessmentItems || asker.membershipId)) {
    const items = a.assessmentItems ?? (await pupilAssessmentItems({ schoolId: asker.schoolId, membershipId: asker.membershipId!, timezone: school.timezone, now: deps.now() }));
    if (items.length) decision = await assess(a, items);
    if (decision.kind === "CLOSED") return fixed("ASSESSMENT_OPEN", { mode: "TUTOR", promptTokens: tokens.prompt, modelCalls });
  }
  const hint = decision.kind === "HINT";
  const matchedAssignmentId = decision.kind === "HINT" || decision.kind === "WORKED" ? (decision.item.assignmentId ?? null) : null;

  // 5. The prompt, from the passages and (for help) the person's own doors.
  let messages: ChatMessage[];
  let citationsByNumber: AssistantCitation[];
  let allowedText: string;
  if (gate.mode === "TUTOR") {
    const passages = curriculum.slice(0, CURRICULUM_PASSAGES).map((h, i) => ({ n: i + 1, heading: `${h.board}, "${h.book}" (class ${h.grade}), ${h.headingPath.join(" › ") || h.chapter || ""}, page ${h.pageStart}`, text: withoutInjectedLines(stripIdentifiers(h.text.slice(0, 1800), a.lexicon).text) }));
    citationsByNumber = curriculum.slice(0, CURRICULUM_PASSAGES).map((h, i) => ({ kind: "CURRICULUM", n: i + 1, board: h.board, book: h.book, grade: h.grade, chapter: h.chapter, section: h.section, page: h.pageStart, sourceUrl: h.sourceUrl || null, chunkId: h.chunkId }));
    allowedText = passages.map((p) => `${p.heading}\n${p.text}`).join("\n");
    const band = gradeBandOf(grade, { college, teacher: !policy.assessed });
    messages = tutorMessages({ question: a.stripped, language, band, shape: questionShape(a.original), passages, hint, boardNote, laterClass });
  } else {
    const passages = help.slice(0, HELP_PASSAGES).map((h, i) => ({ n: i + 1, heading: `${h.title}${h.pagePath ? ` — page ${h.pagePath}` : ""}`, text: withoutInjectedLines(stripIdentifiers(h.text.slice(0, 1200), a.lexicon).text) }));
    citationsByNumber = help.slice(0, HELP_PASSAGES).map((h, i) => ({ kind: "HELP", n: i + 1, title: h.title, pagePath: h.pagePath, entryId: h.entryId }));
    allowedText = passages.map((p) => `${p.heading}\n${p.text}`).join("\n");
    const runs = await deps.runTools({ role: asker.role, schoolId: asker.schoolId, userId: asker.userId, question: a.original, lexicon: a.lexicon });
    const data = runs.filter((r) => r.ok && r.data).map((r) => ({ name: r.name, json: r.data! }));
    allowedText += `\n${data.map((d) => d.json).join("\n")}`;
    // Nothing a person can act on and none of their own data: the sentence, and no answer is written.
    if (!passages.length && !data.length) return fixed("OUT_OF_SCOPE", { promptTokens: tokens.prompt, modelCalls });
    messages = helpMessages({ question: a.stripped, language, role: asker.role, passages, data });
  }

  // 6. The model.
  a.emit({ type: "assistant.stage", conversationId: a.conversationId, stage: "WRITING" });
  const result = await deps.chat(messages, { maxTokens: MAX_ANSWER_TOKENS, temperature: 0.3, timeoutMs: ANSWER_TIMEOUT_MS });
  modelCalls += 1;
  tokens = { prompt: tokens.prompt + (result.usage?.promptTokens ?? 0), completion: tokens.completion + (result.usage?.completionTokens ?? 0) };

  // 7. The gate after the model.
  a.emit({ type: "assistant.stage", conversationId: a.conversationId, stage: "CHECKING" });
  const checked = await gateAnswer({ answer: result.content, label: gate.label, passageCount: citationsByNumber.length, allowedText, lexicon: a.lexicon, hint }, { chat: deps.chat });
  if (checked.tokens) modelCalls += 1;
  tokens.prompt += checked.tokens;
  // The reason codes only, never a word of the question or the answer (Phase D: discards were otherwise invisible to the operator).
  if (!checked.pass) {
    discardLog(gate.mode, checked.reasons);
    return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
  }
  const cited = new Set(citedNumbers(result.content));
  // A help answer names only pages the person's role opens, never a program's /api/ door (the prompt asks; this holds it).
  if (gate.mode === "HELP" && foreignPaths(result.content, asker.role).length) {
    discardLog(gate.mode, ["FOREIGN_PAGE"]);
    return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
  }
  return {
    verdict: hint ? "HINT" : "ANSWERED",
    text: restoreSelf(result.content.trim(), stripIdentifiers(a.original, a.lexicon).replacements, ""),
    mode: gate.mode,
    hint,
    citations: citationsByNumber.filter((c) => cited.has(c.n)),
    matchedAssignmentId,
    promptTokens: tokens.prompt,
    completionTokens: tokens.completion,
    modelCalls,
  };
}

/** One line per discarded answer on the server's log: the mode and the gate's reason codes, nothing the person typed or the model wrote. */
function discardLog(mode: string, reasons: readonly string[]): void {
  console.warn(`[assistant] ANSWER_DISCARDED ${mode} ${reasons.join(",")}`);
}

/**
 * THE ONE PATH, FOR THE SMOKE SCRIPT AND THE EVALUATION HARNESS (scripts/assistant-ask.ts, Phase D): the
 * same gates, retrieval, prompt and model as `ask`, for a role, a class and a board given by hand, with
 * no conversation saved and no counts; tools and assessment items only as the harness hands them in. Not reachable from any door.
 */
export async function previewAnswer(
  input: {
    role: Role;
    question: string;
    language?: AssistantLanguage;
    grade?: number | null;
    board?: string | null;
    college?: boolean;
    /**
     * PHASE D's HARNESS (scripts/assistant-eval.ts): a pupil's hand-in items and the conversation's last two
     * turns (newest first, as `ask` reads them), so the hint, the second ask and the teacher's switch run
     * through the same rule; and door answers as the tools would hand them over (already stripped), so an
     * injection inside a door's answer reaches the same prompt. Absent, the preview has neither.
     */
    assessment?: { items: AssessmentItem[]; previous?: AnswerInput["previous"] };
    toolRuns?: ToolRun[];
    /** A school's names, as `ask` strips them (nameLexicon); none by default. */
    lexicon?: NameEntry[];
  },
  deps: AssistantDeps = realDeps(),
): Promise<Outcome & { language: AssistantLanguage }> {
  const original = input.question.trim();
  const language = input.language ?? detectLanguage(original) ?? "en";
  const school = { id: "preview", timezone: "Asia/Kolkata", board: input.board ?? "CBSE", kind: input.college ? "COLLEGE" : "SCHOOL", helplineText: null };
  const asker: Asker = { userId: "preview", role: input.role, membershipId: null, schoolId: "preview", locale: language };
  try {
    const outcome = await answerQuestion({ asker, policy: policyFor(input.role), school, language, original, stripped: stripIdentifiers(original, input.lexicon ?? []).text, lexicon: input.lexicon ?? [], previous: input.assessment?.previous ?? [], deps: { ...deps, runTools: async () => input.toolRuns ?? [] }, emit: () => {}, conversationId: "preview", gradeOverride: input.grade ?? null, assessmentItems: input.assessment?.items });
    return { ...outcome, language };
  } catch (error) {
    if (!(error instanceof ModelUnavailable) && !isModelFailure(error)) throw error;
    return { verdict: "MODEL_UNAVAILABLE", text: fixedSentence("MODEL_UNAVAILABLE", language, null), mode: null, hint: false, citations: [], matchedAssignmentId: null, promptTokens: 0, completionTokens: 0, modelCalls: 0, language };
  }
}

/** The pupil's items against the question, and the conversation's last two turns, through the rule. One embedding call. */
async function assess(a: AnswerInput, items: AssessmentItem[]): Promise<AssessmentDecision> {
  const [prevAnswer, prevQuestion] = a.previous;
  const hadHint = prevAnswer?.role === "ASSISTANT" && prevAnswer.hint ? prevAnswer.matchedAssignmentId : null;
  const prevText = prevQuestion?.role === "USER" ? (prevQuestion.textForModel ?? prevQuestion.text) : null;
  const texts = [a.stripped, ...(prevText ? [prevText] : []), ...items.map((i) => i.text)];
  const vectors = await vectorsFor(a.deps, texts);
  const q = vectors[0]!;
  const offset = prevText ? 2 : 1;
  const sameQuestion = prevText !== null && (prevText.trim().toLowerCase() === a.stripped.trim().toLowerCase() || cosine(q, vectors[1]!) >= SAME_QUESTION_THRESHOLD);
  const matches = items.map((item, i) => ({ item, similarity: cosine(q, vectors[offset + i]!) }));
  return decideAssessment({ matches, previous: prevText ? { sameQuestion, hintForAssignmentId: hadHint } : null });
}

/* -------------------------------------------------------------------------- */
/* The office, the family, the teacher                                         */
/* -------------------------------------------------------------------------- */

export async function assistantUsage(ctx: ActiveContext, now = new Date()): Promise<AssistantUsage> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
  const school = await schoolOf(ctx.schoolId);
  const month = dayKeyFor(school.timezone, now).slice(0, 7);
  const [totals, on] = await Promise.all([monthTotals(ctx.schoolId, month), isModuleOn(ctx.schoolId, "ASSISTANT")]);
  const t = translator(localeOf(ctx));
  return {
    on,
    platformOn: !killSwitchThrown(),
    month,
    questions: totals.questions,
    answered: totals.answered,
    hints: totals.hints,
    refused: totals.refused,
    counsellorRoutes: totals.counsellorRoutes,
    helpful: totals.helpful,
    notHelpful: totals.notHelpful,
    people: totals.people,
    tokens: totals.tokens,
    tokenBudget: monthlyTokenBudget(),
    dailyCapPerPerson: dailyQuestionCap(),
    helplineText: school.helplineText,
    helplineDefault: t("assistantService.helplineDefault"),
    retentionDays: retentionDays(),
  };
}

/** The office's switch (the ASSISTANT module, one switch) and the helpline sentence. ADMIN only, audited, idempotent. */
export async function saveAssistantSettings(ctx: ActiveContext, input: { on?: boolean; helplineText?: string | null }, now = new Date()): Promise<AssistantUsage> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (input.on !== undefined) await switchModuleFor(ctx.schoolId, ctx.user.id, "ASSISTANT", input.on);
  if (input.helplineText !== undefined) {
    const next = input.helplineText?.trim() || null;
    const school = await schoolOf(ctx.schoolId);
    if (school.helplineText !== next) {
      await db.school.update({ where: { id: ctx.schoolId }, data: { helplineText: next } });
      await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "assistant.settings", targetType: "School", targetId: ctx.schoolId, meta: { helpline: next ? "set" : "default" } });
    }
  }
  return assistantUsage(ctx, now);
}

export async function familyAssistant(ctx: ActiveContext): Promise<FamilyAssistant> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const links = await db.guardianship.findMany({
    where: { parentUserId: ctx.user.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
    select: { studentMembershipId: true, studentSchoolId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const settings = await db.assistantChildSetting.findMany({ where: { studentMembershipId: { in: links.map((l) => l.studentMembershipId) } }, select: { studentMembershipId: true, optedOut: true, changedAt: true } });
  const byChild = new Map(settings.map((s) => [s.studentMembershipId, s]));
  const children = [];
  for (const l of links) {
    const s = byChild.get(l.studentMembershipId);
    children.push({ childId: l.studentMembershipId, name: l.student.user.preferredName ?? l.student.user.name, schoolOn: await isModuleOn(l.studentSchoolId, "ASSISTANT"), optedOut: s?.optedOut ?? false, changedAt: s?.changedAt?.toISOString() ?? null });
  }
  return { children };
}

/** A guardian turns the assistant off (or back on) for one child; any one active guardian may. Audited; idempotent. */
export async function setOptOut(ctx: ActiveContext, input: { childId: string; optedOut: boolean }, now = new Date()): Promise<{ childId: string; optedOut: boolean; changedAt: string }> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const link = await assertGuardianAccess(ctx.user.id, input.childId);
  const schoolId = link.student.school.id;
  const existing = await db.assistantChildSetting.findUnique({ where: { studentMembershipId: input.childId }, select: { optedOut: true, changedAt: true } });
  if (existing && existing.optedOut === input.optedOut && existing.changedAt) return { childId: input.childId, optedOut: input.optedOut, changedAt: existing.changedAt.toISOString() };
  await db.assistantChildSetting.upsert({
    where: { studentMembershipId: input.childId },
    create: { schoolId, studentMembershipId: input.childId, optedOut: input.optedOut, changedByUserId: ctx.user.id, changedAt: now },
    update: { optedOut: input.optedOut, changedByUserId: ctx.user.id, changedAt: now },
  });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "assistant.optOut", targetType: "Membership", targetId: input.childId, meta: { optedOut: input.optedOut } });
  return { childId: input.childId, optedOut: input.optedOut, changedAt: now.toISOString() };
}

const TEACHING: readonly string[] = ["TEACHER", "FACULTY", "HOD"];

async function teachersAssignment(ctx: ActiveContext, assignmentId: string) {
  if (!ctx.schoolId || !ctx.membershipId || !isRole(ctx.role) || !TEACHING.includes(ctx.role)) throw new AccessError("assistantService.refuseNotTeacher");
  return assertAssignmentAccess({ schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role }, assignmentId);
}

export async function assignmentSwitch(ctx: ActiveContext, assignmentId: string): Promise<{ assignmentId: string; workedAnswerOnSecondAsk: boolean }> {
  const a = await teachersAssignment(ctx, assignmentId);
  return { assignmentId: a.id, workedAnswerOnSecondAsk: a.assistantAnswers };
}

export async function setAssignmentSwitch(ctx: ActiveContext, assignmentId: string, worked: boolean): Promise<{ assignmentId: string; workedAnswerOnSecondAsk: boolean }> {
  const a = await teachersAssignment(ctx, assignmentId);
  if (a.assistantAnswers !== worked) {
    await db.assignment.update({ where: { id: a.id }, data: { assistantAnswers: worked } });
    await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "assistant.assignmentSwitch", targetType: "Assignment", targetId: a.id, meta: { workedAnswerOnSecondAsk: worked } });
  }
  return { assignmentId: a.id, workedAnswerOnSecondAsk: worked };
}

/** For the route handlers: the sentence of a refusal before any work, in the reader's language. */
export function unavailableSentence(ctx: ActiveContext | null, error: AssistantUnavailableError): string {
  const t = translator(ctx ? localeOf(ctx) : "en");
  return t(`assistantService.unavailable.${error.reason}` as TranslationKey, { cap: dailyQuestionCap(), ...error.vars });
}
