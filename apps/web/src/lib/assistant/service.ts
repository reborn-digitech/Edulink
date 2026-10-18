import "server-only";
import type {
  AssistantAbout,
  AssistantAnswer,
  AssistantAskPerson,
  AssistantChip,
  AssistantCitation,
  AssistantConversation,
  AssistantConversationDetail,
  AssistantLanguage,
  AssistantMessage,
  AssistantStatus,
  AssistantSuggestions,
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
import { helpForPage, searchCurriculum, searchHelp, type CurriculumHit, type CurriculumQuery, type HelpHit, type HelpQuery } from "../assistant-retrieval";
import { translator, type TranslationKey } from "../i18n/dictionary";
import { normaliseLocale } from "../i18n/locales";
import { isModuleOn } from "../modules";
import { AccessError, assertAssignmentAccess, assertGuardianAccess } from "../tenancy";
import { isCollegeKind, restrictAnswerMarkdown } from "@edulink/contracts";
import { ROLES, type Role } from "../constants";
import type { ActiveContext } from "../session";
import {
  ANSWER_TIMEOUT_MS,
  CLOSE_TO_BEST,
  CURRICULUM_THRESHOLD,
  DOOR_THRESHOLD,
  HELP_THRESHOLD,
  CURRICULUM_PASSAGES,
  DOOR_SCOPE_THRESHOLD,
  EMBED_TIMEOUT_MS,
  GO_ON_MAX,
  PAGE_DOOR_SIMILARITY,
  answerTokenCap,
  GRADE_WIDEN_FLOOR,
  HELP_PASSAGES,
  MAX_ANSWER_TOKENS,
  SAME_QUESTION_THRESHOLD,
  TITLE_CHARS,
  TOOL_ANSWER_MAX_CHARS,
  dailyQuestionCap,
  killSwitchThrown,
  monthlyTokenBudget,
} from "./config";
import { corpusBoardFor, gradeBandOf, policyFor } from "./policy";
import { citedNumbers, gateAnswer, gateQuestion, tableVerdict } from "./gate";
import { stripIdentifiers, restoreSelf, type NameEntry } from "./strip";
import { withoutInjectedLines } from "./refusals";
import { NCERT_NOTE, answerKindFor, onPageNote, pageNameNote, helpKind, helpMessages, questionShape, tutorMessages, asksExamScope } from "./prompt";
import { detectLanguage } from "./language";
import { nameLexicon } from "./lexicon";
import { foreignPaths, pageIsRoles, ownPathsWithoutHost } from "./pages";
// Vidura pass 1 (17 Oct 2026): the modes, page awareness, "go on" and "Ask a person".
import { asksAboutThisPage, asksToGoOn, chipOf, helpChip, jobOf, modesFor, offersAskPerson, preferFor } from "./vidura";
import { askPersonFor } from "./ask-person";
// Vidura pass 2 (17 Oct 2026): retrieval in the question's language.
import { mergeRendered, renderForSearch, type Rendered } from "./render";
import { aboutCall, aboutName, aboutRow } from "./explain";
import { summariseDoor } from "./summary";
import { featuresOf } from "../api-catalog/types";
import { formatDateKey } from "../dates";
import { suggestionsFor } from "./suggestions";
import { asksAboutExams, type ToolRun } from "./tools";
import { COLLEGE_EXAMS_DOOR, EXAMS_SUMMARY_NAME, FAMILY_EXAMS_DOOR, examSummary } from "./exams";
// The data questions (11 Oct 2026): the person's own doors, routed over the catalog and summed up by code.
import { chooseDoors, followUpCache, isFollowUp, runDoors as runDoorsReal, searchDoors, type DataRun, type RunInput } from "./router";
import { doorTitle, hintsOf, readableDoor, type DataContext, type DoorPath } from "./doors";
import { dataContextFor, doorsShownOn, pageForDoor } from "./data";
import { asksAnotherPersonsRecord, ownChildrenAsWords } from "./data-privacy";
import { linkCitations } from "./links";
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
 *   router.ts      the person's own GET doors, chosen over the catalog and called as the person (doors.ts,
 *                  summary.ts, links.ts, data.ts: the data questions of 11 Oct 2026)
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
  /** The data questions' runner (router.ts): the chosen doors read as the person, summed up and stripped. */
  runDoors: (input: RunInput) => Promise<DataRun[]>;
  publish: (userId: string, event: RealtimeEvent) => void;
  now: () => Date;
  /** The help index's cards for one page (Vidura pass 1, page awareness); absent, a question is read as asked from nowhere. */
  pageCards?: (q: { page: string; language: AssistantLanguage; role: Role }) => Promise<HelpHit[]>;
  /**
   * The English rendering of a Hindi or Marathi question, for retrieval only (Vidura pass 2, render.ts); absent or
   * null, the question is searched as it is typed.
   */
  render?: (stripped: string, language: AssistantLanguage) => Promise<Rendered | null>;
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
    runDoors: runDoorsReal,
    publish: (userId, event) => publish([channel.user(userId)], event),
    now: () => new Date(),
    pageCards: (q) => helpForPage({ ...q, kinds: ["nav"], limit: 2 }, { db }),
    render: (stripped, language) => renderForSearch(stripped, language, { chat: (messages, opts) => chatComplete(need().chat, messages, opts) }),
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
  const budget = monthlyTokenBudget();
  if (budget > 0 && totals.tokens >= budget) return { reason: "SCHOOL_BUDGET", usedToday: 0 };
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
  const base = { help: policy.help, tutor: policy.tutor, language, dailyCap: dailyQuestionCap(), retentionDays: retentionDays(), optOutPath: role === "PARENT" ? "/parent/settings" : null, modes: modesFor(policy) };
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

/**
 * GET /api/v1/assistant/suggestions (Vidura pass 1): three questions for an empty drawer, per role and page, in the
 * person's language, from the help index (suggestions.ts). A page that is not the person's is read as none.
 */
export async function assistantSuggestions(ctx: ActiveContext, page: string | null): Promise<AssistantSuggestions> {
  const role = isRole(ctx.role) ? ctx.role : null;
  if (!role || !policyFor(role).help) return { suggestions: [] };
  const safe = page && /^\/(?!\/)[^\s?#]{0,199}$/.test(page) ? page : null;
  return { suggestions: await suggestionsFor({ role, language: localeOf(ctx), page: safe }) };
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

/**
 * What an answer row keeps beside its citations (Vidura pass 1): the citations column holds the plain list, or — for
 * an answer that stopped at its length cap — `{ citations, cut, depth, rootId }`: cut for "Go on", how many times the
 * answer has been continued already (GO_ON_MAX at most), and the question it answers. No migration: the column is
 * text, and a row from before reads as a list.
 */
type Stored = { citations: AssistantCitation[]; cut: boolean; depth: number; rootId: string | null };
export function readStored(json: string): Stored {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) return { citations: parsed as AssistantCitation[], cut: false, depth: 0, rootId: null };
    const o = (parsed ?? {}) as Partial<Stored>;
    return { citations: Array.isArray(o.citations) ? o.citations : [], cut: o.cut === true, depth: typeof o.depth === "number" ? o.depth : 0, rootId: typeof o.rootId === "string" ? o.rootId : null };
  } catch {
    return { citations: [], cut: false, depth: 0, rootId: null };
  }
}
function writeStored(citations: AssistantCitation[], extra: { cut: boolean; depth: number; rootId: string | null }): string {
  return extra.cut || extra.depth > 0 ? JSON.stringify({ citations, ...extra }) : JSON.stringify(citations);
}

function messageView(m: { id: string; role: string; text: string; createdAt: Date; citationsJson: string; verdict: string | null; mode: string | null; hint: boolean; helpful: boolean | null }, askPerson: AssistantAskPerson | null = null): AssistantMessage {
  const stored = readStored(m.citationsJson);
  const verdict = (m.verdict as AssistantVerdict | null) ?? null;
  const assistant = m.role !== "USER";
  return {
    id: m.id,
    role: m.role === "USER" ? "USER" : "ASSISTANT",
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    citations: stored.citations,
    verdict,
    mode: jobOf(m.mode),
    hint: m.hint,
    helpful: m.helpful,
    chip: assistant ? chipOf(m.mode) : null,
    cut: assistant && stored.cut,
    askPerson: assistant && askPerson && offersAskPerson(verdict, m.text) ? askPerson : null,
  };
}

/** Who "Ask a person" reaches for this conversation's asker (ask-person.ts), read once per answer or conversation. */
async function askPersonOf(conv: { role: string; userId: string; membershipId: string | null; schoolId: string }): Promise<AssistantAskPerson | null> {
  if (!isRole(conv.role)) return null;
  const school = await db.school.findUnique({ where: { id: conv.schoolId }, select: { kind: true } });
  return askPersonFor({ role: conv.role, userId: conv.userId, membershipId: conv.membershipId, schoolId: conv.schoolId, college: isCollegeKind(school?.kind) }).catch(() => null);
}

export async function getConversation(ctx: ActiveContext, conversationId: string): Promise<AssistantConversationDetail> {
  const row = await ownConversation(ctx, conversationId);
  const messages = await db.assistantMessage.findMany({ where: { conversationId: row.id }, orderBy: { createdAt: "asc" } });
  const person = messages.some((m) => m.role === "ASSISTANT" && offersAskPerson((m.verdict as AssistantVerdict | null) ?? null, m.text)) ? await askPersonOf(row) : null;
  return { conversation: conversationView({ ...row, _count: { messages: messages.length } }, retentionDays()), messages: messages.map((m) => messageView(m, person)) };
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
  /** The chip (Vidura pass 1): what the answer was made from; null on a fixed sentence. */
  chip: AssistantChip | null;
  /** The answer stopped at its token cap. */
  cut: boolean;
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
export async function ask(
  ctx: ActiveContext,
  conversationId: string,
  input: { text: string; language?: AssistantLanguage; mode?: AssistantChip; page?: string; goOn?: boolean; about?: AssistantAbout },
  deps: AssistantDeps = realDeps(),
): Promise<AssistantAnswer> {
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
  const lexicon = await nameLexicon({ userId: asker.userId, schoolId: asker.schoolId });
  const stripped = stripIdentifiers(original, lexicon);
  // The conversation's last two turns, for the second-ask rule (§9.4).
  const previous = await db.assistantMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" }, take: 2, select: { id: true, role: true, textForModel: true, text: true, hint: true, matchedAssignmentId: true, citationsJson: true, mode: true, verdict: true } });
  // "GO ON" (Vidura pass 1): the last answer stopped at its cap and the person pressed "Go on", or typed it. The question
  // answered again is the one the cut answer answers, with the parts written so far for the model to continue; a third
  // continuation in a row is not offered (GO_ON_MAX), and anything else typed is a question of its own.
  const last = previous[0]?.role === "ASSISTANT" ? previous[0] : null;
  const lastStored = last ? readStored(last.citationsJson) : null;
  const goOn = !!last && !!lastStored?.cut && lastStored.depth < GO_ON_MAX && (input.goOn === true || asksToGoOn(original)) ? await continuationOf(conv.id, last, lastStored) : null;
  const askedText = goOn ? goOn.root.text : original;
  const language: AssistantLanguage = input.language ?? detectLanguage(askedText) ?? ((["en", "hi", "mr"].includes(conv.language) ? conv.language : asker.locale) as AssistantLanguage);
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
    outcome = await answerQuestion({
      asker,
      policy,
      school,
      language,
      original: askedText,
      stripped: goOn ? (goOn.root.textForModel ?? stripIdentifiers(goOn.root.text, lexicon).text) : stripped.text,
      lexicon,
      previous,
      deps,
      emit,
      conversationId: conv.id,
      prefer: goOn ? goOn.chip : (input.mode ?? null),
      page: goOn ? null : (input.page ?? null),
      continuation: goOn?.sofar ?? null,
      about: goOn ? null : (input.about ?? null),
    });
  } catch (error) {
    if (!(error instanceof ModelUnavailable) && !isModelFailure(error)) {
      await releaseQuestion(day);
      throw error;
    }
    // The endpoint is down or too slow: the sentence, and the question is given back to the person's day.
    await releaseQuestion(day);
    outcome = { verdict: "MODEL_UNAVAILABLE", text: fixedSentence("MODEL_UNAVAILABLE", language, null), mode: null, chip: null, cut: false, hint: false, citations: [], matchedAssignmentId: null, promptTokens: 0, completionTokens: 0, modelCalls: 0 };
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
      citationsJson: writeStored(outcome.citations, {
        cut: outcome.cut && (goOn ? goOn.depth + 1 : 0) < GO_ON_MAX,
        depth: goOn ? goOn.depth + 1 : 0,
        rootId: goOn ? goOn.root.id : outcome.cut ? question.id : null,
      }),
      verdict: outcome.verdict,
      // The chip since Vidura pass 1 (USING, RECORDS, LEARNING); a fixed sentence keeps none.
      mode: outcome.chip,
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
  // "Ask a person" (Vidura pass 1): on a fixed sentence, or an answer saying it is not sure.
  const person = offersAskPerson(outcome.verdict, outcome.text) ? await askPersonOf(conv) : null;
  return { conversationId: conv.id, question: messageView(question), answer: messageView(answer, person) };
}

/**
 * The cut answer a "go on" continues: the question it answers (the first part's question) and every part written so
 * far, in order, for the model to continue; with the mode it was answered in and how many parts it has had.
 */
async function continuationOf(conversationId: string, last: { id: string; text: string; mode: string | null }, stored: Stored): Promise<{ root: { id: string; text: string; textForModel: string | null }; sofar: string; chip: AssistantChip | null; depth: number } | null> {
  if (!stored.rootId) return null;
  const root = await db.assistantMessage.findFirst({ where: { id: stored.rootId, conversationId, role: "USER" }, select: { id: true, text: true, textForModel: true, createdAt: true } });
  if (!root) return null;
  const parts = await db.assistantMessage.findMany({ where: { conversationId, role: "ASSISTANT", createdAt: { gt: root.createdAt } }, orderBy: { createdAt: "asc" }, select: { id: true, text: true }, take: GO_ON_MAX + 1 });
  const sofar = parts.map((p) => p.text).join("\n");
  return { root, sofar: sofar || last.text, chip: chipOf(last.mode), depth: stored.depth };
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
  /** The preview's person (no membership, no children), in place of the context read from the database. */
  dataContext?: DataContext & { childNames: string[] };
  /** The harness's door answers (previewAnswer), in place of reading the chosen doors. */
  toolRuns?: ToolRun[];
  /** The person's pick of mode for this question (Vidura pass 1): re-routes between the scopes the gate allows. */
  prefer?: AssistantChip | null;
  /** The page the drawer is beside (Vidura pass 1): read only for a question that points at it. */
  page?: string | null;
  /** "Go on" (Vidura pass 1): the answer so far, which the model continues. */
  continuation?: string | null;
  /** "Explain this to me" (Vidura pass 2): the row the person pressed the link beside, read again through their own door. */
  about?: AssistantAbout | null;
};

/** A door answer the harness handed in, as the runner's run. */
function harnessRun(r: ToolRun): DataRun {
  return { door: r.name as DoorPath, url: r.name, ok: r.ok, status: r.status, data: r.data, raw: r.raw, child: null, links: r.links ?? [], fromCache: false };
}

async function answerQuestion(a: AnswerInput): Promise<Outcome> {
  const { asker, policy, school, language, deps } = a;
  /** What the rendering for retrieval cost (pass 2), counted into every outcome after it. */
  const pre = { tokens: 0, calls: 0 };
  const fixed = (verdict: AssistantVerdict, extra: Partial<Outcome> = {}): Outcome => ({ verdict, text: fixedSentence(verdict, language, school.helplineText), mode: null, chip: null, cut: false, hint: false, citations: [], matchedAssignmentId: null, completionTokens: 0, ...extra, promptTokens: (extra.promptTokens ?? 0) + pre.tokens, modelCalls: (extra.modelCalls ?? 0) + pre.calls });

  // 1. The tables, on the person's own words: nothing searched, nothing sent anywhere.
  const table = tableVerdict(a.original, asker.role);
  if (table) return fixed(table);

  // 1b. The person's own data (the data questions, 11 Oct 2026): their context, and another person's record asked
  // for by name refused before anything is searched (the owner's decision 3: privacy unchanged).
  const now = deps.now();
  const dataCtx = policy.data ? (a.dataContext ?? (await dataContextFor({ role: asker.role, userId: asker.userId, membershipId: asker.membershipId, schoolId: asker.schoolId, question: a.original, now, timezone: school.timezone }))) : null;
  if (asksAnotherPersonsRecord(a.original, a.lexicon, dataCtx?.childNames ?? [])) return fixed("PERSONAL_DATA");
  if (dataCtx?.childNames.length) a.stripped = stripIdentifiers(ownChildrenAsWords(a.original, dataCtx.childNames), a.lexicon).text;
  // "Explain this" (pass 2) names the child whose row it is: every door of the question reads that child.
  if (dataCtx && a.about?.childId && dataCtx.children.some((c) => c.id === a.about!.childId)) dataCtx.childId = a.about.childId;
  // The window of days asked about (pass 2, when.ts), in the school's own calendar.
  const hints = hintsOf(a.original, now, dataCtx?.calendar);

  // 1e. "EXPLAIN THIS TO ME" (Vidura pass 2, explain.ts): the row the link names, read again through the person's own
  // door, as the person, and only that row kept; nothing found (another child's, gone, a door the role does not pass)
  // is no row, and the question is answered as asked.
  let aboutData: { name: string; json: string } | null = null;
  if (a.about && dataCtx && !a.toolRuns) {
    const call = aboutCall(a.about, asker.role, dataCtx.children);
    const entry = call ? readableDoor(call.door, asker.role, dataCtx.duties) : null;
    if (call && entry && (!entry.module || !dataCtx.modules || dataCtx.modules.has(entry.module))) {
      const [run] = await deps.runDoors({ chosen: [{ door: call.door, similarity: 1, calls: [call], module: entry.module ?? null, fromCache: false, features: entry.featureInHandler ? [] : featuresOf(entry) }], ctx: dataCtx, schoolId: asker.schoolId, userId: asker.userId, question: a.original, hints, lexicon: a.lexicon, firstNumber: 900, conversationId: null, now });
      const row = run?.ok ? aboutRow(a.about, run.raw) : null;
      if (row) {
        const summed = summariseDoor(row, { door: call.door, hints, question: a.original, firstNumber: 900, maxChars: TOOL_ANSWER_MAX_CHARS });
        aboutData = { name: aboutName(a.about), json: withoutInjectedLines(stripIdentifiers(summed.text, a.lexicon).text) };
      }
    }
  }

  // 1c. PAGE AWARENESS (Vidura pass 1): a question that points at the page the drawer is beside ("how do I do this?")
  // is read against that page's own help card, given first, and the person's own data shown on it; any other question
  // is answered as if asked from nowhere. The card is found by its page, not by closeness, so it adds nothing to the
  // retrieval's scores: the gate's thresholds and the classifier decide as before.
  const pageHere = a.page && policy.help && deps.pageCards && pageIsRoles(a.page, asker.role) && asksAboutThisPage(a.original) ? a.page : null;
  const cards = pageHere ? (await deps.pageCards!({ page: pageHere, language, role: asker.role })).filter((h) => h.pagePath && pageIsRoles(h.pagePath, asker.role)) : [];
  const helpQuery = cards.length ? `${a.stripped}\n${cards[0]!.title} — ${pageHere}` : a.stripped;

  // 1d. RETRIEVAL IN THE QUESTION'S LANGUAGE (Vidura pass 2, render.ts): a Hindi or Marathi question is rendered into
  // English by the local model, from its stripped words, and the help index, the doors and the books are searched
  // with the rendering beside the question; the classifier, the prompt and the answer read the person's own words.
  // A failed rendering is null and the question is searched as before.
  const rendered = language !== "en" && deps.render ? await deps.render(a.stripped, language) : null;
  if (rendered && !rendered.cached) {
    pre.tokens += rendered.tokens;
    pre.calls += 1;
  }
  const renderedQuery = rendered ? (cards.length ? `${rendered.text}\n${cards[0]!.title} — ${pageHere}` : rendered.text) : null;
  /** The English rendering's hits put on the question's language's scale (render.ts mergeRendered). */
  const helpShift = HELP_THRESHOLD.en - HELP_THRESHOLD[language];
  const doorShift = DOOR_THRESHOLD.en - DOOR_THRESHOLD[language];
  /** The books are English: with a rendering they are searched with it alone, and their scores read on English's scale. */
  const curriculumQuery = rendered?.text ?? a.stripped;
  const curriculumScale: AssistantLanguage = rendered ? "en" : language;

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
  const searchedHelp = policy.help
    ? keepClose(
        mergeRendered(
          await deps.searchHelp({ query: helpQuery, language, role: asker.role, limit: HELP_PASSAGES * 3 }),
          renderedQuery ? await deps.searchHelp({ query: renderedQuery, language: "en", role: asker.role, limit: HELP_PASSAGES * 3 }) : [],
          helpShift,
        ).filter((h) => !h.pagePath || pageIsRoles(h.pagePath, asker.role)),
      )
    : [];
  const helpScope = [...cards, ...searchedHelp.filter((h) => !cards.some((c) => c.entryId === h.entryId))];
  const help = helpScope.filter((h) => h.pagePath || !h.door).slice(0, HELP_PASSAGES);
  // The books, searched with the English rendering where there is one (on English's scale), and — when that falls short
  // of English's threshold — with the question as typed too (on its own language's scale), the better of the two kept
  // (pass 2: a rendering is a help, never a loss: "पानाची रचना स्पष्ट करा" met its book better as typed).
  const searchBooks = async (query: string, scale: AssistantLanguage) => {
    let found: CurriculumHit[] = [];
    let note: string | null = null;
    let later: string | null = null;
    if (policy.tutor) {
      const scoped = policy.gradeScoped && grade !== null && !college;
      found = await deps.searchCurriculum({ query, language, board, grade: scoped && grade !== null ? grade : undefined, limit: CURRICULUM_PASSAGES });
      // Nothing close in the class's own books: the classes either side (Phase A's widening).
      if (scoped && best(found) < GRADE_WIDEN_FLOOR) {
        const wider = await deps.searchCurriculum({ query, language, board, grade: grade!, gradeWindow: 2, limit: CURRICULUM_PASSAGES });
        if (best(wider) > best(found)) found = wider;
      }
      // A state board's pupil whose own books carry nothing close is answered from NCERT, and told so (§8.7).
      if (board && board !== "NCERT" && best(found) < GRADE_WIDEN_FLOOR) {
        const ncert = await deps.searchCurriculum({ query, language, board: "NCERT", grade: policy.gradeScoped && grade !== null ? grade : undefined, gradeWindow: policy.gradeScoped ? 2 : 0, limit: CURRICULUM_PASSAGES });
        if (best(ncert) > best(found)) {
          found = ncert;
          note = NCERT_NOTE;
        }
      }
      // Still nothing close in the classes either side: the board's (then NCERT's) book of whichever class
      // carries the topic, the answer saying in which class it is taught (Phase D, 10 Oct 2026).
      if (scoped && best(found) < CURRICULUM_THRESHOLD[scale]) {
        for (const b of [...new Set([board ?? "NCERT", "NCERT"])]) {
          const any = await deps.searchCurriculum({ query, language, board: b, limit: CURRICULUM_PASSAGES });
          const top = [...any].sort((x, y) => (y.similarity ?? 0) - (x.similarity ?? 0))[0];
          if (top && best(any) >= CURRICULUM_THRESHOLD[scale] && best(any) > best(found)) {
            found = any;
            const g = gradeNumber(top.grade);
            later = g !== null && g !== grade ? String(g) : null;
            note = b !== board ? NCERT_NOTE : note;
            break;
          }
        }
      }
    } else {
      // Only to tell a topic question from a platform one; never answered for this role.
      found = await deps.searchCurriculum({ query, language, limit: 1 });
    }
    // The best on the question's language's scale, for the gate.
    return { found, note, later, top: best(found) - (CURRICULUM_THRESHOLD[scale] - CURRICULUM_THRESHOLD[language]) };
  };
  let books = await searchBooks(curriculumQuery, curriculumScale);
  // (The rendering's top on the question's scale is below that scale's threshold exactly when it is below English's own.)
  if (rendered && books.top < CURRICULUM_THRESHOLD[language]) {
    const asTyped = await searchBooks(a.stripped, language);
    if (asTyped.top > books.top) books = asTyped;
  }
  let curriculum: CurriculumHit[] = books.found;
  const boardNote: string | null = books.note;
  const laterClass: string | null = books.later;
  const curriculumTop = books.top;
  curriculum = keepClose(curriculum);

  // 2b. The person's own doors: ranked over the catalog by their summaries (router.ts); a follow-up reads the
  // conversation's last doors again first.
  // The doors whose data the page shows come first for a question pointing at the page (page awareness).
  const pageDoors = pageHere ? doorsShownOn(pageHere, asker.role).map((d) => ({ door: `GET ${d}`, similarity: PAGE_DOOR_SIMILARITY })) : [];
  const doorHits = dataCtx
    ? [
        ...pageDoors,
        ...mergeRendered(
          await searchDoors(deps.searchHelp, { query: helpQuery, language, role: asker.role }),
          renderedQuery ? await searchDoors(deps.searchHelp, { query: renderedQuery, language: "en", role: asker.role }) : [],
          doorShift,
        ),
      ]
    : [];
  const previousDoors = dataCtx && isFollowUp(a.original) ? (followUpCache.get(a.conversationId)?.doors ?? []) : [];
  // A follow-up is read beside the question before it ("and how many of those are paid" alone is about nothing):
  // the classifier and the help prompt see both, the person's earlier words as stripped as these.
  const before = a.previous.find((m) => m.role === "USER");
  const previousQuestion = previousDoors.length && before ? (before.textForModel ?? stripIdentifiers(before.text, a.lexicon).text) : null;
  const chosen = dataCtx ? chooseDoors({ hits: doorHits, language, ctx: dataCtx, hints, previous: previousDoors }) : [];

  // 3. The gate before the model.
  const onPage = pageHere && cards.length ? onPageNote(cards[0]!.title, pageHere) : "";
  // Pass 2: a short where-is or how-to question that names one of the person's own pages by its menu label ("सोशल
  // मीडिया कहाँ मिलेगा?", "अभ्यासक्रम कुठे पाहायचे?") is told so to the classifier, which otherwise reads "social media"
  // or "syllabus" as off-topic or as a subject (the help set of 17 Oct 2026: the right page card was found at 0.77 to
  // 0.83 and the question refused). Only the classifier reads the note; the tables, thresholds and gates are unchanged.
  const named = onPage ? null : namedPage({ question: a.original, rendered: rendered?.text ?? null, hits: helpScope, role: asker.role, language });
  const named_ = named ? pageNameNote(named.title, named.path) : "";
  const gate = await gateQuestion(
    {
      original: a.original,
      stripped: `${previousQuestion ? `${previousQuestion}\n` : ""}${a.stripped}${onPage}${named_}`,
      language,
      policy,
      helpTop: best(helpScope),
      // On the question's language's scale: a rendered search's best is English's (pass 2).
      curriculumTop,
      ownDoor: chosen.some((c) => c.similarity >= DOOR_SCOPE_THRESHOLD) || (a.toolRuns?.length ?? 0) > 0 || aboutData !== null,
      role: asker.role,
      // The person's pick of mode (Vidura pass 1): only between the scopes the gate already allows.
      // A row named by "Explain this" is the person's own record: the platform scope (pass 2).
      prefer: aboutData ? "PLATFORM" : preferFor(a.prefer),
    },
    { chat: deps.chat },
  );
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
  let exams: string | null = null;
  /** The numbered rows of the person's own doors a help answer may cite (LINK citations). */
  let rowLinks: DataRun["links"] = [];
  /** The <data> blocks' own numbers: citable, never shown as a source. */
  let blockNumbers: number[] = [];
  /** The chip (Vidura pass 1): LEARNING for the tutor; for help, RECORDS when the person's own data was read, else USING. */
  let chip: AssistantChip = gate.mode === "TUTOR" ? "LEARNING" : "USING";
  /** Pass 2: the page where the person sees the figures (the composite answer's "where to see it"), added by code. */
  let seePage: string | null = null;
  /** Pass 2: the question names days that none of the doors read could be narrowed to. */
  let windowUnserved = false;
  if (gate.mode === "TUTOR") {
    const passages = curriculum.slice(0, CURRICULUM_PASSAGES).map((h, i) => ({ n: i + 1, heading: `${h.board}, "${h.book}" (class ${h.grade}), ${h.headingPath.join(" › ") || h.chapter || ""}, page ${h.pageStart}`, text: withoutInjectedLines(stripIdentifiers(h.text.slice(0, 1800), a.lexicon).text) }));
    citationsByNumber = curriculum.slice(0, CURRICULUM_PASSAGES).map((h, i) => ({ kind: "CURRICULUM", n: i + 1, board: h.board, book: h.book, grade: h.grade, chapter: h.chapter, section: h.section, page: h.pageStart, sourceUrl: h.sourceUrl || null, chunkId: h.chunkId }));
    allowedText = passages.map((p) => `${p.heading}\n${p.text}`).join("\n");
    const band = gradeBandOf(grade, { college, teacher: !policy.assessed });
    // The exam-scope reader (10 Oct 2026): a pupil asking when an exam is or whether a subject is in it gets
    // their own exams door read, as the person, and its lines beside the passages. Nothing else in tutor mode reads a door.
    if (policy.assessed && dataCtx && (asksExamScope(a.original) || asksAboutExams(a.original))) {
      const examDoors = chooseDoors({ hits: [FAMILY_EXAMS_DOOR, COLLEGE_EXAMS_DOOR].map((d) => ({ door: `GET ${d}`, similarity: 1 })), language, ctx: dataCtx, hints });
      const runs = a.toolRuns ? a.toolRuns.map(harnessRun) : await deps.runDoors({ chosen: examDoors, ctx: dataCtx, schoolId: asker.schoolId, userId: asker.userId, question: a.original, hints, lexicon: a.lexicon, firstNumber: 1000, conversationId: null, now });
      const summary = examSummary(runs);
      exams = summary ? withoutInjectedLines(stripIdentifiers(summary, a.lexicon).text) : null;
      if (exams) allowedText += `\n${exams}`;
    }
    messages = tutorMessages({ question: a.stripped, language, band, shape: questionShape(a.original), passages, hint, boardNote, laterClass, exams, continuation: a.continuation });
  } else {
    const passages = help.slice(0, HELP_PASSAGES).map((h, i) => ({ n: i + 1, heading: `${h.title}${h.pagePath ? ` — page ${h.pagePath}` : ""}`, text: withoutInjectedLines(stripIdentifiers(h.text.slice(0, 1200), a.lexicon).text) }));
    citationsByNumber = help.slice(0, HELP_PASSAGES).map((h, i) => ({ kind: "HELP", n: i + 1, title: h.title, pagePath: h.pagePath, entryId: h.entryId }));
    allowedText = passages.map((p) => `${p.heading}\n${p.text}`).join("\n");
    // The person's own doors, read as the person (router.ts); their rows numbered after the passages.
    // "Using Shalaghar" picked by the person (Vidura pass 1): the guides only, the person's own data not read.
    // "Explain this" (pass 2): the row the link names is the answer's data, and no other door is read beside it.
    const runs = a.toolRuns
      ? a.toolRuns.map(harnessRun)
      : chosen.length && dataCtx && a.prefer !== "USING" && !aboutData
        ? await deps.runDoors({ chosen, ctx: dataCtx, schoolId: asker.schoolId, userId: asker.userId, question: a.original, hints, lexicon: a.lexicon, firstNumber: passages.length + 1, conversationId: a.conversationId, now })
        : [];
    const childLabel = (r: DataRun) => (r.child ? `child ${r.child.n}${r.child.className ? ` (${r.child.className})` : ""}` : null);
    const data: { name: string; json: string; page: string | null; child?: string | null; n?: number }[] = runs.filter((r) => r.ok && r.data).map((r) => ({ name: doorTitle(r.door), json: withoutInjectedLines(r.data!), page: pageForDoor(r.door, asker.role), child: childLabel(r) }));
    // The exam-scope reader's lines first, so "when is my next exam" is answered from the sittings ahead, not guessed from the marks.
    const summary = examSummary(runs);
    if (summary) data.unshift({ name: EXAMS_SUMMARY_NAME, json: withoutInjectedLines(stripIdentifiers(summary, a.lexicon).text), page: pageForDoor(runs.find((r) => r.ok && r.raw !== undefined && (r.door === FAMILY_EXAMS_DOOR || r.door === COLLEGE_EXAMS_DOOR))?.door ?? FAMILY_EXAMS_DOOR, asker.role) });
    if (aboutData) data.unshift({ name: aboutData.name, json: aboutData.json, page: null });
    // Pass 2: a window of days no door read could be narrowed to ("next week" of a record kept by no date).
    const read = runs.filter((r) => r.ok && r.data);
    windowUnserved = !aboutData && read.length > 0 && read.every((r) => r.window === "UNSERVED");
    allowedText += `\n${data.map((d) => d.json).join("\n")}`;
    rowLinks = runs.flatMap((r) => r.links);
    // Each <data> block is numbered too, after the rows: the model cites what it read, and a block's number is a
    // real thing retrieved (the gate's rule), shown as no source of its own (the mark is taken out of the text).
    let free = Math.max(passages.length, ...rowLinks.map((l) => l.n)) + 1;
    for (const d of data) d.n = free++;
    blockNumbers = data.map((d) => d.n!);
    // Nothing a person can act on and none of their own data: the sentence, and no answer is written.
    if (!passages.length && !data.length) return fixed("OUT_OF_SCOPE", { promptTokens: tokens.prompt, modelCalls });
    // "My records" when the answer is the person's own figures: data was read and the question is not a how-to or a
    // where-is that a guide passage answers (the live walk of 17 Oct 2026: "how do I issue a book" wore My records
    // because a door had been read beside the guide). A pick of "My records" keeps it whenever data was read.
    chip = aboutData ? "RECORDS" : helpChip({ data: data.length, passages: passages.length, prefer: a.prefer ?? null, question: a.original });
    // THE COMPOSITE ANSWER (pass 2): a data answer, then "where to see it" — the page the person's figures are shown on
    // (the door's own page, else the closest guide or page card of the person's role), added by code after the check.
    // Not beside "Explain this" or a question about the page the person is on: they are already there.
    if (chip === "RECORDS" && !aboutData && !pageHere) seePage = read.map((r) => pageForDoor(r.door, asker.role)).find((p): p is string => !!p) ?? help.find((h) => h.pagePath && pageIsRoles(h.pagePath, asker.role))?.pagePath ?? null;
    messages = helpMessages({
      question: a.stripped,
      language,
      role: asker.role,
      passages,
      data,
      numberedRows: rowLinks.length > 0,
      previousQuestion,
      chip,
      pageHere: pageHere && cards.length ? { path: pageHere, title: cards[0]!.title } : null,
      continuation: a.continuation,
      whereToSee: seePage,
      about: aboutData !== null,
    });
  }

  // 6. The model.
  a.emit({ type: "assistant.stage", conversationId: a.conversationId, stage: "WRITING" });
  // The length rule (Vidura's decision 6): the cap by the question's kind and language; a hint keeps Phase B's cap.
  const maxTokens = hint ? MAX_ANSWER_TOKENS : answerTokenCap(answerKindFor(chip, a.original), language);
  const result = await deps.chat(messages, { maxTokens, temperature: 0.3, timeoutMs: ANSWER_TIMEOUT_MS });
  modelCalls += 1;
  tokens = { prompt: tokens.prompt + (result.usage?.promptTokens ?? 0), completion: tokens.completion + (result.usage?.completionTokens ?? 0) };

  // 7. The gate after the model.
  a.emit({ type: "assistant.stage", conversationId: a.conversationId, stage: "CHECKING" });
  // With no passage numbered there is nothing a "[1]" could point at, and the model writes one anyway in Hindi and
  // Marathi whatever the prompt says (Phase D's pilot, 10 Oct 2026: a guardian's fees answers discarded 24 of 24 as
  // an invented citation; in Hindi and Marathi it then wrote a literal "[data]"). The bare marks are removed before the check; the answer itself is still checked in full.
  let content = (citationsByNumber.length || rowLinks.length || blockNumbers.length ? result.content : result.content.replace(/\s?\[\d{1,2}\]/g, "")).replace(/\s?\[data(?::[^\]]*)?\]/gi, "");
  // A page of the person's own under an invented host becomes the bare path (pages.ts); any other link is still discarded.
  if (gate.mode === "HELP") content = ownPathsWithoutHost(content, asker.role);
  // Restricted Markdown (Vidura's decision 6): narrowed to headings, lists, bold and tables BEFORE the check, so the
  // gate reads exactly what is shown (a Markdown link to a host keeps its words; the host goes, as any link would).
  content = restrictAnswerMarkdown(content);
  // Every number a passage or a numbered row of the person's own data carries may be cited, and nothing else.
  const citable = new Set([...citationsByNumber.map((c) => c.n), ...rowLinks.map((l) => l.n), ...blockNumbers]);
  const checked = await gateAnswer({ answer: content, label: gate.label, passageCount: Math.max(0, ...citable), allowedText, lexicon: a.lexicon, hint, alsoLabel: exams ? "PLATFORM" : undefined, role: asker.role }, { chat: deps.chat });
  if (checked.tokens) modelCalls += 1;
  tokens.prompt += checked.tokens;
  // The reason codes only, never a word of the question or the answer (Phase D: discards were otherwise invisible to the operator).
  if (!checked.pass) {
    discardLog(gate.mode, checked.reasons);
    return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
  }
  // "Should I study this for the exam" (the exam-scope reader, 10 Oct 2026): the platform owns the sentence that the
  // teacher knows what the paper covers; an answer that still opens with yes or no is discarded, in any of the three languages.
  const examScope = gate.mode === "TUTOR" && !hint && !a.continuation && asksExamScope(a.original);
  let body = content;
  if (examScope && /^\s*(?:yes|no|nope|हाँ|हां|नहीं|हो|होय|नाही)\b/i.test(body)) {
    // The opening yes-or-no sentence goes (the model wrote one in spite of the rule); the explanation after it stays, already checked.
    body = body.replace(/^\s*[^.!?।\n]*[.!?।]?\s*/, "");
    if (!body.trim()) {
      discardLog(gate.mode, ["EXAM_YES_NO"]);
      return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
    }
  }
  const cited = new Set(citedNumbers(body));
  // A number between the passages' and the rows' that names nothing (a row cut as an instruction) is an invented citation.
  if ([...cited].some((n) => !citable.has(n))) {
    discardLog(gate.mode, ["CITATION"]);
    return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
  }
  // A help answer names only pages the person's role opens, never a program's /api/ door (the prompt asks; this holds it).
  if (gate.mode === "HELP" && foreignPaths(body, asker.role).length) {
    discardLog(gate.mode, ["FOREIGN_PAGE"]);
    return fixed("ANSWER_DISCARDED", { mode: gate.mode, promptTokens: tokens.prompt, completionTokens: tokens.completion, modelCalls });
  }
  // A <data> block cited by its number has no source to show: its mark goes, the rows' and the passages' stay.
  if (blockNumbers.length) body = body.replace(/\s?\[(\d{1,3})\]/g, (mark, n: string) => (blockNumbers.includes(Number(n)) ? "" : mark));
  return {
    verdict: hint ? "HINT" : "ANSWERED",
    // The platform's sentence as a paragraph of its own, so the answer's first heading still starts a line; pass 2 adds
    // the window no record could be narrowed to before, and "where to see it" after, both by code.
    text: composeAnswer({
      body: restoreSelf(body.trim(), stripIdentifiers(a.original, a.lexicon).replacements, ""),
      language,
      examScope,
      window: windowUnserved && !a.continuation ? (hints.window ?? null) : null,
      seePage: a.continuation ? null : seePage,
    }),
    mode: gate.mode,
    chip,
    // Stopped at its cap: "Go on" continues it (the length rule's no-uncapped-answers half).
    cut: result.finishReason === "length",
    hint,
    citations: [...citationsByNumber.filter((c) => cited.has(c.n)), ...(gate.mode === "HELP" ? linkCitations(rowLinks, cited, asker.role, language) : [])],
    matchedAssignmentId,
    promptTokens: tokens.prompt + pre.tokens,
    completionTokens: tokens.completion,
    modelCalls: modelCalls + pre.calls,
  };
}

/**
 * The person's own page a short where-is or how-to question names by its menu label (pass 2): the closest page card of
 * the role, above the help threshold, whose label is in the question as typed or in its English rendering. Pure.
 */
export function namedPage(input: { question: string; rendered: string | null; hits: Pick<HelpHit, "kind" | "title" | "pagePath" | "similarity">[]; role: Role; language: AssistantLanguage }): { title: string; path: string } | null {
  if (helpKind(input.question) === "OTHER" || input.question.trim().split(/\s+/).length > 10) return null;
  const said = `${input.question} ${input.rendered ?? ""}`.toLowerCase();
  const card = [...input.hits]
    .filter((h) => h.kind === "nav" && h.pagePath && pageIsRoles(h.pagePath, input.role) && (h.similarity ?? 0) >= HELP_THRESHOLD[input.language])
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .find((h) => h.title.trim().length >= 2 && said.includes(h.title.trim().toLowerCase()));
  return card ? { title: card.title.trim(), path: card.pagePath! } : null;
}

/**
 * The answer as the person reads it (pass 2): the platform's own sentences around the model's checked words — the
 * exam-scope sentence and the window no record could be narrowed to before them, "where to see it" after them (only
 * when the answer does not already name that page). Pure.
 */
export function composeAnswer(input: { body: string; language: AssistantLanguage; examScope: boolean; window: { from: string; to: string } | null; seePage: string | null }): string {
  const t = translator(input.language);
  const day = (key: string) => formatDateKey(key, { day: "numeric", month: "long", year: "numeric" }, input.language);
  const before = [
    ...(input.examScope ? [t("assistantService.examScopeTeacher")] : []),
    ...(input.window ? [input.window.from === input.window.to ? t("assistantService.windowNotServedDay", { day: day(input.window.from) }) : t("assistantService.windowNotServedSpan", { from: day(input.window.from), to: day(input.window.to) })] : []),
  ];
  const after = input.seePage && !input.body.includes(input.seePage) ? [`${t("viduraUi.whereToSee")} ${input.seePage}`] : [];
  return [...before, input.body, ...after].join("\n\n");
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
    const now = deps.now();
    const dataContext = { role: input.role, membershipId: null, children: [], childId: null, duties: [], now, childNames: [] };
    const outcome = await answerQuestion({ asker, policy: policyFor(input.role), school, language, original, stripped: stripIdentifiers(original, input.lexicon ?? []).text, lexicon: input.lexicon ?? [], previous: input.assessment?.previous ?? [], deps: { ...deps, runDoors: async () => [] }, emit: () => {}, conversationId: "preview", gradeOverride: input.grade ?? null, assessmentItems: input.assessment?.items, dataContext, toolRuns: input.toolRuns });
    return { ...outcome, language };
  } catch (error) {
    if (!(error instanceof ModelUnavailable) && !isModelFailure(error)) throw error;
    return { verdict: "MODEL_UNAVAILABLE", text: fixedSentence("MODEL_UNAVAILABLE", language, null), mode: null, chip: null, cut: false, hint: false, citations: [], matchedAssignmentId: null, promptTokens: 0, completionTokens: 0, modelCalls: 0, language };
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

/**
 * The office's helpline sentence. ADMIN only, audited, idempotent. The ASSISTANT module is no longer the office's to
 * switch (16 Oct 2026: the platform's operator switches it on for a school, under the student and teacher plans):
 * `on` naming the state the school already has is accepted and changes nothing, so an older client's form still
 * saves its helpline; `on` asking for a change is refused with modules.refuseAssistant.
 */
export async function saveAssistantSettings(ctx: ActiveContext, input: { on?: boolean; helplineText?: string | null }, now = new Date()): Promise<AssistantUsage> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (input.on !== undefined && input.on !== (await isModuleOn(ctx.schoolId, "ASSISTANT"))) throw new AccessError("modules.refuseAssistant");
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
