import "server-only";
import { formatPaise } from "@edulink/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool } from "./tenant-context";
import { clampLevel, parseChoices } from "./quiz";
import { consume } from "./rate-limit";
import { translateQuestion, translationConfigured, type QuestionText } from "./translate";
import { dateKeyInZone, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import { TEACHER_CONTRIBUTION_SOURCE } from "./bank-source";

/**
 * Gigs, the first of them: a teacher writes questions for the shared practice
 * bank, in English, Hindi and Marathi, and is paid for the ones the content
 * team adds to it (decision 0004).
 *
 * THE RULE, as the owner set it on 2026-09-30. A question earns only when it
 * is ADDED TO THE BANK, and only the content team or the operator adds one.
 * A teacher's first questions added (twenty) earn nothing; after that each
 * earns the rate (ten rupees), for at most a number a month (two hundred),
 * inside a monthly budget the operator holds for all teachers together. All
 * four numbers are the operator's dials (GigSettings).
 *
 * NOTHING IS ADDED UNPAID BY SURPRISE. When the teacher's month or the budget
 * is used up, adding is refused to the reviewer and the question waits for
 * next month; the only unpaid additions are the first twenty, which the
 * teacher is told of before writing one.
 *
 * THE PLATFORM PAYS NOBODY. The operator pays from the company's bank by UPI,
 * outside the app, and records the transfer's reference here; an earning is
 * then marked paid. Decision 0003's line is not crossed: no money is received,
 * held or sent by the platform.
 *
 * THE PERSON IS THE FENCE. These tables carry no school (see the note above
 * them in schema.prisma), so every function below is bound to the signed-in
 * user, to the content team's flag or to the operator's.
 */
export const CONTRIBUTION_STATUSES = ["SUBMITTED", "RETURNED", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];
export type ContributionDecision = "ACCEPT" | "RETURN" | "REJECT";

export type ContributionInput = {
  topicId: string;
  difficulty: number;
  answerIndex: number;
  en: QuestionText;
  hi: QuestionText;
  mr: QuestionText;
  /** "This is my own work and the platform may use it", said on every submission. */
  terms: boolean;
};

export type GigResult<T = unknown> = ({ ok: true } & T) | { ok: false; errorKey: TranslationKey; vars?: Record<string, string | number> };

const SETTINGS_ID = "gigs";
/** The month a cap and a budget count is the company's calendar month. */
const ZONE = process.env.TZ || "Asia/Kolkata";
const UPI_ID = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$/;
const UTR = /^[A-Za-z0-9]{12,22}$/;
const DEVANAGARI = /[ऀ-ॿ]/;
const LATIN_WORD = /[A-Za-z]{3,}/;

export const monthKey = (at: Date = new Date()): string => dateKeyInZone(at, ZONE).slice(0, 7);
const previousMonth = (month: string): string => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

function teacher(ctx: ActiveContext): { userId: string; schoolId: string } {
  if (ctx.role !== "TEACHER" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  return { userId: ctx.user.id, schoolId: ctx.schoolId };
}
function contentTeam(ctx: ActiveContext): void {
  if (!ctx.user.isAppAdmin && !ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
}
function operator(ctx: ActiveContext): void {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
}

/* -------------------------------------------------------------------------- */
/* The dials                                                                   */
/* -------------------------------------------------------------------------- */

export type GigSettingsView = {
  questionRatePaise: number; questionFreeCount: number; questionMonthlyCap: number; questionMonthlyBudgetPaise: number; questionDailyLimit: number; questionPendingLimit: number;
  /** Sessions (src/lib/gig-sessions.ts): a pupil's free allowance in a school year, what a provider owes free, and the cancelling window. */
  pupilFreeOneToOnes: number; pupilFreeWorkshops: number; expertStartOneToOnes: number; expertStartWorkshops: number; expertMonthlyOneToOnes: number; expertQuarterlyWorkshops: number; teacherMonthlyGuidance: number; freeCancelHours: number; workshopMaxSeats: number;
};

const SETTINGS_SELECT = {
  questionRatePaise: true, questionFreeCount: true, questionMonthlyCap: true, questionMonthlyBudgetPaise: true, questionDailyLimit: true, questionPendingLimit: true,
  pupilFreeOneToOnes: true, pupilFreeWorkshops: true, expertStartOneToOnes: true, expertStartWorkshops: true, expertMonthlyOneToOnes: true, expertQuarterlyWorkshops: true, teacherMonthlyGuidance: true, freeCancelHours: true, workshopMaxSeats: true,
} as const;

/** The one row, made with the schema's defaults the first time anybody asks. */
export async function gigSettings(): Promise<GigSettingsView> {
  return db.gigSettings.upsert({ where: { id: SETTINGS_ID }, create: { id: SETTINGS_ID }, update: {}, select: SETTINGS_SELECT });
}

const SETTING_BOUNDS: Record<keyof GigSettingsView, [number, number]> = {
  questionRatePaise: [0, 100_000],
  questionFreeCount: [0, 1_000],
  questionMonthlyCap: [0, 10_000],
  questionMonthlyBudgetPaise: [0, 1_000_000_000],
  questionDailyLimit: [1, 200],
  questionPendingLimit: [1, 500],
  pupilFreeOneToOnes: [0, 50],
  pupilFreeWorkshops: [0, 50],
  expertStartOneToOnes: [0, 200],
  expertStartWorkshops: [0, 50],
  expertMonthlyOneToOnes: [0, 100],
  expertQuarterlyWorkshops: [0, 50],
  teacherMonthlyGuidance: [0, 100],
  freeCancelHours: [0, 168],
  workshopMaxSeats: [2, 500],
};

export async function saveGigSettings(ctx: ActiveContext, input: GigSettingsView): Promise<GigResult<{ settings: GigSettingsView }>> {
  operator(ctx);
  for (const key of Object.keys(SETTING_BOUNDS) as (keyof GigSettingsView)[]) {
    const [low, high] = SETTING_BOUNDS[key];
    if (!Number.isInteger(input[key]) || input[key] < low || input[key] > high) return { ok: false, errorKey: "gigs.refuseSetting" };
  }
  const before = await gigSettings();
  const data = Object.fromEntries((Object.keys(SETTING_BOUNDS) as (keyof GigSettingsView)[]).map((k) => [k, input[k]])) as GigSettingsView;
  const settings = await db.gigSettings.update({ where: { id: SETTINGS_ID }, data: { ...data, updatedByUserId: ctx.user.id }, select: SETTINGS_SELECT });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "gig.settings", targetType: "GigSettings", targetId: SETTINGS_ID, meta: { before, after: settings } });
  return { ok: true, settings };
}

/* -------------------------------------------------------------------------- */
/* What a contribution must be                                                 */
/* -------------------------------------------------------------------------- */

const clean = (text: QuestionText): QuestionText => ({ stem: text.stem.trim(), choices: text.choices.map((c) => c.trim()), solution: text.solution.trim() });
const complete = (text: QuestionText, options: number): boolean => text.stem.length >= 5 && text.solution.length >= 5 && text.choices.length === options && text.choices.every((c) => c.length > 0);

/** The English by the bank's own rules; Hindi and Marathi complete, option for option, and written in Devanagari. */
function checkInput(input: ContributionInput): TranslationKey | null {
  const en = clean(input.en);
  if (en.stem.length < 5) return "appadmin.stemTooShort";
  if (en.choices.length < 2 || en.choices.length > 6 || en.choices.some((c) => c.length === 0)) return "appadmin.needTwoChoices";
  if (!Number.isInteger(input.answerIndex) || input.answerIndex < 0 || input.answerIndex >= en.choices.length) return "appadmin.pickTheAnswer";
  if (en.solution.length < 5) return "appadmin.solutionTooShort";
  const wordy = LATIN_WORD.test(en.stem);
  for (const [text, incomplete, script] of [[clean(input.hi), "gigs.hindiIncomplete", "gigs.hindiNotDevanagari"], [clean(input.mr), "gigs.marathiIncomplete", "gigs.marathiNotDevanagari"]] as const) {
    if (!complete(text, en.choices.length)) return incomplete;
    // A sum is the same in every script; a sentence is not.
    if (wordy && !(DEVANAGARI.test(text.stem) && DEVANAGARI.test(text.solution))) return script;
  }
  if (input.terms !== true) return "gigs.needTerms";
  return null;
}

const columns = (input: ContributionInput) => {
  const [en, hi, mr] = [clean(input.en), clean(input.hi), clean(input.mr)];
  return {
    difficulty: clampLevel(input.difficulty),
    answerIndex: input.answerIndex,
    stem: en.stem, choices: JSON.stringify(en.choices), solution: en.solution,
    stemHi: hi.stem, choicesHi: JSON.stringify(hi.choices), solutionHi: hi.solution,
    stemMr: mr.stem, choicesMr: JSON.stringify(mr.choices), solutionMr: mr.solution,
  };
};

/* -------------------------------------------------------------------------- */
/* The teacher's side                                                          */
/* -------------------------------------------------------------------------- */

export type Standing = {
  /** How many of theirs are in the bank. */
  accepted: number;
  /** How many more will earn nothing. */
  freeLeft: number;
  paidThisMonth: number;
  paidLeftThisMonth: number;
  /** Earned and not yet paid. */
  duePaise: number;
  /** Paid so far, all time. */
  paidPaise: number;
  sentToday: number;
  waiting: number;
};

async function standingOf(userId: string, settings: GigSettingsView, now: Date = new Date()): Promise<Standing> {
  const month = monthKey(now);
  const dayStart = zonedStartOfDay(dateKeyInZone(now, ZONE), ZONE);
  const [accepted, waiting, paidThisMonth, due, paid, sentToday] = await Promise.all([
    db.questionContribution.count({ where: { authorUserId: userId, status: "ACCEPTED" } }),
    db.questionContribution.count({ where: { authorUserId: userId, status: "SUBMITTED" } }),
    db.gigEarning.count({ where: { userId, month, basis: "PAID" } }),
    db.gigEarning.aggregate({ where: { userId, paymentId: null, amountPaise: { gt: 0 } }, _sum: { amountPaise: true } }),
    db.gigEarning.aggregate({ where: { userId, paymentId: { not: null } }, _sum: { amountPaise: true } }),
    db.questionContribution.count({ where: { authorUserId: userId, createdAt: { gte: dayStart } } }),
  ]);
  return {
    accepted,
    freeLeft: Math.max(0, settings.questionFreeCount - accepted),
    paidThisMonth,
    paidLeftThisMonth: Math.max(0, settings.questionMonthlyCap - paidThisMonth),
    duePaise: due._sum.amountPaise ?? 0,
    paidPaise: paid._sum.amountPaise ?? 0,
    sentToday,
    waiting,
  };
}

const ROW_SELECT = {
  id: true, authorUserId: true, authorSchoolId: true, authorSchoolName: true, topicId: true, difficulty: true, answerIndex: true,
  stem: true, choices: true, solution: true, stemHi: true, choicesHi: true, solutionHi: true, stemMr: true, choicesMr: true, solutionMr: true,
  status: true, reviewNote: true, reviewedAt: true, questionId: true, submittedAt: true,
  topic: { select: { id: true, name: true, subject: true, classLevel: true, chapter: true } },
  earning: { select: { amountPaise: true, basis: true, month: true, paymentId: true } },
} as const;

type Row = Awaited<ReturnType<typeof db.questionContribution.findFirstOrThrow<{ select: typeof ROW_SELECT }>>>;

export type ContributionView = {
  id: string;
  topic: { id: string; name: string; subject: string; classLevel: number; chapter: string };
  difficulty: number;
  answerIndex: number;
  en: QuestionText;
  hi: QuestionText;
  mr: QuestionText;
  status: ContributionStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  /** In the bank: the question's id there. */
  questionId: string | null;
  earning: { amountPaise: number; basis: "PAID" | "FREE_BLOCK"; month: string; paid: boolean } | null;
  /** The author may still change or take it back. */
  open: boolean;
};

function view(row: Row): ContributionView {
  return {
    id: row.id,
    topic: { ...row.topic, classLevel: Number(row.topic.classLevel) },
    difficulty: row.difficulty,
    answerIndex: row.answerIndex,
    en: { stem: row.stem, choices: parseChoices(row.choices), solution: row.solution },
    hi: { stem: row.stemHi, choices: parseChoices(row.choicesHi), solution: row.solutionHi },
    mr: { stem: row.stemMr, choices: parseChoices(row.choicesMr), solution: row.solutionMr },
    status: row.status as ContributionStatus,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt.toISOString(),
    questionId: row.questionId,
    earning: row.earning ? { amountPaise: row.earning.amountPaise, basis: row.earning.basis as "PAID" | "FREE_BLOCK", month: row.earning.month, paid: row.earning.paymentId !== null } : null,
    open: row.status === "SUBMITTED" || row.status === "RETURNED",
  };
}

export type MyContributions = {
  settings: GigSettingsView;
  standing: Standing;
  payee: { upiId: string; payeeName: string } | null;
  /** Whether a machine draft of the Hindi and Marathi can be asked for on this server. */
  draftOn: boolean;
  contributions: ContributionView[];
};

/** A teacher's own questions, what they stand to earn and where they are paid. */
export async function myContributions(ctx: ActiveContext): Promise<MyContributions> {
  const me = teacher(ctx);
  const settings = await gigSettings();
  const [standing, payee, rows] = await Promise.all([
    standingOf(me.userId, settings),
    db.gigPayee.findUnique({ where: { userId: me.userId }, select: { upiId: true, payeeName: true } }),
    db.questionContribution.findMany({ where: { authorUserId: me.userId }, orderBy: { submittedAt: "desc" }, take: 300, select: ROW_SELECT }),
  ]);
  return { settings, standing, payee, draftOn: translationConfigured(), contributions: rows.map(view) };
}

/** One of the teacher's own. Somebody else's is not found. */
export async function getMyContribution(ctx: ActiveContext, contributionId: string): Promise<ContributionView> {
  const me = teacher(ctx);
  const row = await db.questionContribution.findFirst({ where: { id: contributionId, authorUserId: me.userId }, select: ROW_SELECT });
  if (!row) throw new AccessError("gigs.noSuchContribution", "NOT_FOUND");
  return view(row);
}

export type TopicChoice = { id: string; name: string; subject: string; classLevel: number; chapter: string };

/** The chapters a question can be written for. */
export async function contributionTopics(ctx: ActiveContext): Promise<TopicChoice[]> {
  teacher(ctx);
  const topics = await db.quizTopic.findMany({ where: { retiredAt: null }, orderBy: [{ subject: "asc" }, { classLevel: "asc" }, { position: "asc" }], select: { id: true, name: true, subject: true, classLevel: true, chapter: true } });
  return topics.map((t) => ({ ...t, classLevel: Number(t.classLevel) }));
}

/** The same words already in the bank's chapter, or already sent by this teacher and still open. */
async function duplicateOf(userId: string, topicId: string, stem: string, exceptId?: string): Promise<TranslationKey | null> {
  if (await db.quizQuestion.findFirst({ where: { topicId, stem }, select: { id: true } })) return "gigs.refuseInBank";
  const mine = await db.questionContribution.findFirst({ where: { authorUserId: userId, topicId, stem, status: { in: ["SUBMITTED", "RETURNED"] }, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  return mine ? "gigs.refuseDuplicate" : null;
}

/** A teacher sends a question in three languages. */
export async function submitContribution(ctx: ActiveContext, input: ContributionInput): Promise<GigResult<{ contribution: ContributionView }>> {
  const me = teacher(ctx);
  const settings = await gigSettings();
  const standing = await standingOf(me.userId, settings);
  if (standing.sentToday >= settings.questionDailyLimit) return { ok: false, errorKey: "gigs.refuseDailyLimit", vars: { count: settings.questionDailyLimit } };
  if (standing.waiting >= settings.questionPendingLimit) return { ok: false, errorKey: "gigs.refusePendingLimit", vars: { count: settings.questionPendingLimit } };
  const topic = await db.quizTopic.findFirst({ where: { id: input.topicId, retiredAt: null }, select: { id: true, slug: true } });
  if (!topic) return { ok: false, errorKey: "appadmin.noSuchTopic" };
  const problem = checkInput(input);
  if (problem) return { ok: false, errorKey: problem };
  const data = columns(input);
  const duplicate = await duplicateOf(me.userId, topic.id, data.stem);
  if (duplicate) return { ok: false, errorKey: duplicate };
  const school = await db.school.findUnique({ where: { id: me.schoolId }, select: { name: true } });
  const row = await db.questionContribution.create({
    data: { ...data, authorUserId: me.userId, authorSchoolId: me.schoolId, authorSchoolName: school?.name ?? "", topicId: topic.id, termsAcceptedAt: new Date() },
    select: ROW_SELECT,
  });
  await audit({ schoolId: null, actorUserId: me.userId, action: "gig.question.submit", targetType: "QuestionContribution", targetId: row.id, meta: { topicSlug: topic.slug } });
  return { ok: true, contribution: view(row) };
}

/** The author changes one that still waits or was returned; it goes back to the content team. */
export async function reviseContribution(ctx: ActiveContext, contributionId: string, input: ContributionInput): Promise<GigResult<{ contribution: ContributionView }>> {
  const me = teacher(ctx);
  const row = await db.questionContribution.findFirst({ where: { id: contributionId, authorUserId: me.userId }, select: { id: true, status: true } });
  if (!row) throw new AccessError("gigs.noSuchContribution", "NOT_FOUND");
  if (row.status !== "SUBMITTED" && row.status !== "RETURNED") return { ok: false, errorKey: "gigs.refuseSettled" };
  const topic = await db.quizTopic.findFirst({ where: { id: input.topicId, retiredAt: null }, select: { id: true } });
  if (!topic) return { ok: false, errorKey: "appadmin.noSuchTopic" };
  const problem = checkInput(input);
  if (problem) return { ok: false, errorKey: problem };
  const data = columns(input);
  const duplicate = await duplicateOf(me.userId, topic.id, data.stem, row.id);
  if (duplicate) return { ok: false, errorKey: duplicate };
  // Only a row that is still open is changed: a decision made in the same moment wins.
  const changed = await db.questionContribution.updateMany({ where: { id: row.id, authorUserId: me.userId, status: { in: ["SUBMITTED", "RETURNED"] } }, data: { ...data, topicId: topic.id, status: "SUBMITTED", submittedAt: new Date(), termsAcceptedAt: new Date() } });
  if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseSettled" };
  await audit({ schoolId: null, actorUserId: me.userId, action: "gig.question.revise", targetType: "QuestionContribution", targetId: row.id });
  return { ok: true, contribution: await getMyContribution(ctx, row.id) };
}

/** The author takes back one that is not settled. Taken back twice is taken back. */
export async function withdrawContribution(ctx: ActiveContext, contributionId: string): Promise<GigResult<{ contribution: ContributionView }>> {
  const me = teacher(ctx);
  const row = await db.questionContribution.findFirst({ where: { id: contributionId, authorUserId: me.userId }, select: { id: true, status: true } });
  if (!row) throw new AccessError("gigs.noSuchContribution", "NOT_FOUND");
  if (row.status !== "WITHDRAWN") {
    const changed = await db.questionContribution.updateMany({ where: { id: row.id, authorUserId: me.userId, status: { in: ["SUBMITTED", "RETURNED"] } }, data: { status: "WITHDRAWN" } });
    if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseSettled" };
    await audit({ schoolId: null, actorUserId: me.userId, action: "gig.question.withdraw", targetType: "QuestionContribution", targetId: row.id });
  }
  return { ok: true, contribution: await getMyContribution(ctx, row.id) };
}

/** A draft of the Hindi and the Marathi from the English, for the teacher to correct; never saved by itself. */
export async function draftTranslations(ctx: ActiveContext, english: QuestionText): Promise<GigResult<{ hi: QuestionText; mr: QuestionText }>> {
  const me = teacher(ctx);
  if (!translationConfigured()) return { ok: false, errorKey: "gigs.draftOff" };
  const text = clean(english);
  if (text.stem.length < 5 || text.choices.length < 2 || text.choices.some((c) => c.length === 0) || text.solution.length < 5) return { ok: false, errorKey: "gigs.draftNeedsEnglish" };
  // A draft costs a call to the translator: no more in a day than three for every question a teacher may send.
  const limit = (await gigSettings()).questionDailyLimit * 3;
  const allowed = await consume(`gig-draft:${me.userId}`, limit, 24 * 60 * 60_000);
  if (!allowed.allowed) return { ok: false, errorKey: "gigs.draftLimit" };
  const drafted = await translateQuestion(text);
  if (!drafted) return { ok: false, errorKey: "gigs.draftFailed" };
  return { ok: true, hi: drafted.hi, mr: drafted.mr };
}

/** Where the teacher is paid: their own UPI id. */
export async function savePayee(ctx: ActiveContext, input: { upiId: string; payeeName: string }): Promise<GigResult<{ payee: { upiId: string; payeeName: string } }>> {
  const me = teacher(ctx);
  const upiId = input.upiId.trim();
  const payeeName = input.payeeName.trim();
  if (!UPI_ID.test(upiId)) return { ok: false, errorKey: "fees.refuseUpiId" };
  if (payeeName.length < 2 || payeeName.length > 80) return { ok: false, errorKey: "gigs.refusePayeeName" };
  const payee = await db.gigPayee.upsert({ where: { userId: me.userId }, create: { userId: me.userId, upiId, payeeName }, update: { upiId, payeeName }, select: { upiId: true, payeeName: true } });
  // The id itself is not written to the log: the log is read by more people than the payer.
  await audit({ schoolId: null, actorUserId: me.userId, action: "gig.payee.save", targetType: "GigPayee", targetId: me.userId });
  return { ok: true, payee };
}

/* -------------------------------------------------------------------------- */
/* The content team's side                                                     */
/* -------------------------------------------------------------------------- */

export type QueueRow = { id: string; status: ContributionStatus; stem: string; topicName: string; subject: string; classLevel: number; authorName: string; authorSchoolName: string; submittedAt: string };

/** What waits to be read, or what was decided, newest decisions first and the oldest waiting first. */
export async function listContributionQueue(ctx: ActiveContext, status: ContributionStatus = "SUBMITTED"): Promise<{ status: ContributionStatus; counts: Record<ContributionStatus, number>; rows: QueueRow[] }> {
  contentTeam(ctx);
  const [rows, grouped] = await Promise.all([
    db.questionContribution.findMany({
      where: { status },
      orderBy: status === "SUBMITTED" ? { submittedAt: "asc" } : { updatedAt: "desc" },
      take: 200,
      select: { id: true, status: true, stem: true, authorSchoolName: true, submittedAt: true, author: { select: { name: true } }, topic: { select: { name: true, subject: true, classLevel: true } } },
    }),
    db.questionContribution.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(CONTRIBUTION_STATUSES.map((s) => [s, grouped.find((g) => g.status === s)?._count._all ?? 0])) as Record<ContributionStatus, number>;
  return { status, counts, rows: rows.map((r) => ({ id: r.id, status: r.status as ContributionStatus, stem: r.stem, topicName: r.topic.name, subject: r.topic.subject, classLevel: Number(r.topic.classLevel), authorName: r.author.name, authorSchoolName: r.authorSchoolName, submittedAt: r.submittedAt.toISOString() })) };
}

/** What adding it today would earn its author, or why it cannot be added today. */
export type Outcome = { basis: "FREE_BLOCK" | "PAID"; amountPaise: number } | { refuse: "gigs.refuseMonthlyCap" | "gigs.refuseBudget" };

type Counts = { accepted: number; paidThisMonth: number; spentThisMonth: number };
function outcomeOf(settings: GigSettingsView, counts: Counts): Outcome {
  if (counts.accepted < settings.questionFreeCount) return { basis: "FREE_BLOCK", amountPaise: 0 };
  if (counts.paidThisMonth >= settings.questionMonthlyCap) return { refuse: "gigs.refuseMonthlyCap" };
  if (counts.spentThisMonth + settings.questionRatePaise > settings.questionMonthlyBudgetPaise) return { refuse: "gigs.refuseBudget" };
  return { basis: "PAID", amountPaise: settings.questionRatePaise };
}

type Reader = Pick<typeof db, "questionContribution" | "gigEarning">;
async function countsFor(client: Reader, userId: string, month: string): Promise<Counts> {
  const [accepted, paidThisMonth, spent] = await Promise.all([
    client.questionContribution.count({ where: { authorUserId: userId, status: "ACCEPTED" } }),
    client.gigEarning.count({ where: { userId, month, basis: "PAID" } }),
    client.gigEarning.aggregate({ where: { month }, _sum: { amountPaise: true } }),
  ]);
  return { accepted, paidThisMonth, spentThisMonth: spent._sum.amountPaise ?? 0 };
}

export type ReviewView = ContributionView & { authorName: string; authorSchoolName: string; authorAccepted: number; authorPaidThisMonth: number; outcome: Outcome; spentThisMonthPaise: number; budgetPaise: number; /** How many of a teacher's first questions earn nothing. */ freeCount: number };

export async function getContributionForReview(ctx: ActiveContext, contributionId: string): Promise<ReviewView> {
  contentTeam(ctx);
  const row = await db.questionContribution.findUnique({ where: { id: contributionId }, select: { ...ROW_SELECT, author: { select: { name: true } } } });
  if (!row) throw new AccessError("gigs.noSuchContribution", "NOT_FOUND");
  const settings = await gigSettings();
  const counts = await countsFor(db, row.authorUserId, monthKey());
  return { ...view(row), authorName: row.author.name, authorSchoolName: row.authorSchoolName, authorAccepted: counts.accepted, authorPaidThisMonth: counts.paidThisMonth, outcome: outcomeOf(settings, counts), spentThisMonthPaise: counts.spentThisMonth, budgetPaise: settings.questionMonthlyBudgetPaise, freeCount: settings.questionFreeCount };
}

class Refusal extends Error {
  constructor(readonly errorKey: TranslationKey) {
    super(errorKey);
  }
}

/**
 * The content team adds a question to the bank, returns it with a note, or
 * rejects it with a reason. Adding may carry the reviewer's own corrections
 * (`edit`): a slip mended is still the teacher's question and still earns.
 *
 * ADDING IS ONE TRANSACTION under a lock on the settings row, so that two
 * reviewers adding at the same moment count the same teacher's month and the
 * same budget one after the other: the bank's row, its two translations, the
 * contribution's new status and the earning are written together or not at all.
 */
export async function decideContribution(ctx: ActiveContext, contributionId: string, input: { decision: ContributionDecision; note?: string; edit?: ContributionInput }): Promise<GigResult<{ contribution: ReviewView }>> {
  contentTeam(ctx);
  const row = await db.questionContribution.findUnique({ where: { id: contributionId }, select: { id: true, status: true, authorUserId: true, authorSchoolId: true, topicId: true } });
  if (!row) throw new AccessError("gigs.noSuchContribution", "NOT_FOUND");
  const settled = { ACCEPT: "ACCEPTED", RETURN: "RETURNED", REJECT: "REJECTED" }[input.decision];
  // Decided the same way already: answered as it stands, so a second press changes nothing.
  if (row.status === settled) return { ok: true, contribution: await getContributionForReview(ctx, row.id) };
  if (row.status !== "SUBMITTED") return { ok: false, errorKey: "gigs.refuseSettled" };
  const note = (input.note ?? "").trim().slice(0, 1000);
  const now = new Date();
  let earned: { amountPaise: number; basis: string } | null = null;

  if (input.decision !== "ACCEPT") {
    if (note.length < 5) return { ok: false, errorKey: "gigs.needNote" };
    const changed = await db.questionContribution.updateMany({ where: { id: row.id, status: "SUBMITTED" }, data: { status: settled, reviewNote: note, reviewedByUserId: ctx.user.id, reviewedAt: now } });
    if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseSettled" };
  } else {
    if (input.edit) {
      const problem = checkInput({ ...input.edit, terms: true });
      if (problem) return { ok: false, errorKey: problem };
    }
    await gigSettings();
    try {
      earned = await db.$tenantTransaction(async (raw) => {
        const tx = raw as typeof db;
        await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
        const settings = await tx.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: SETTINGS_SELECT });
        const current = await tx.questionContribution.findUniqueOrThrow({ where: { id: row.id }, select: ROW_SELECT });
        if (current.status !== "SUBMITTED") throw new Refusal("gigs.refuseSettled");
        const outcome = outcomeOf(settings, await countsFor(tx, current.authorUserId, monthKey(now)));
        if ("refuse" in outcome) throw new Refusal(outcome.refuse);
        const text = input.edit ? columns({ ...input.edit, terms: true }) : null;
        const final = text ?? current;
        if (await tx.quizQuestion.findFirst({ where: { topicId: current.topicId, stem: final.stem }, select: { id: true } })) throw new Refusal("gigs.refuseInBank");
        const question = await tx.quizQuestion.create({
          // `source` is a provenance tag, read by the importer and by nobody on a screen: see AUTHORED_IN_THE_APP in scripts/import-quiz.ts.
          data: { topicId: current.topicId, difficulty: final.difficulty, stem: final.stem, choices: final.choices, answerIndex: final.answerIndex, solution: final.solution, source: TEACHER_CONTRIBUTION_SOURCE, licence: "proprietary", reviewedAt: now, reviewedBy: ctx.user.id },
          select: { id: true },
        });
        await tx.quizQuestionTranslation.createMany({
          data: [
            { questionId: question.id, language: "hi", stem: final.stemHi, choices: final.choicesHi, solution: final.solutionHi },
            { questionId: question.id, language: "mr", stem: final.stemMr, choices: final.choicesMr, solution: final.solutionMr },
          ],
        });
        await tx.questionContribution.update({ where: { id: row.id }, data: { ...(text ?? {}), status: "ACCEPTED", reviewNote: note || null, reviewedByUserId: ctx.user.id, reviewedAt: now, questionId: question.id } });
        await tx.gigEarning.create({ data: { userId: current.authorUserId, kind: "QUESTION", contributionId: row.id, amountPaise: outcome.amountPaise, basis: outcome.basis, month: monthKey(now) } });
        return { amountPaise: outcome.amountPaise, basis: outcome.basis };
      });
    } catch (error) {
      if (error instanceof Refusal) return { ok: false, errorKey: error.errorKey };
      throw error;
    }
  }

  await audit({ schoolId: null, actorUserId: ctx.user.id, action: `gig.question.${input.decision.toLowerCase()}`, targetType: "QuestionContribution", targetId: row.id, meta: earned ? { ...earned, edited: Boolean(input.edit) } : undefined });
  const titleKey = ({ ACCEPT: earned && earned.amountPaise > 0 ? "gigs.notifAddedPaid" : "gigs.notifAdded", RETURN: "gigs.notifReturned", REJECT: "gigs.notifRejected" } as const)[input.decision];
  // The notice is the author's own, written under the school they wrote from; a school since removed loses the notice and not the decision.
  await forSchool(row.authorSchoolId, () =>
    notify({ userId: row.authorUserId, schoolId: row.authorSchoolId, kind: "SYSTEM", titleKey, titleVars: earned ? { amount: formatPaise(earned.amountPaise) } : undefined, body: input.decision === "ACCEPT" ? undefined : note, url: `/teacher/contributions/${row.id}` }),
  ).catch((error) => console.error("[decideContribution] notice failed", error));
  return { ok: true, contribution: await getContributionForReview(ctx, row.id) };
}

/* -------------------------------------------------------------------------- */
/* The operator's side                                                         */
/* -------------------------------------------------------------------------- */

export type DueRow = { userId: string; name: string; email: string | null; schoolName: string; upiId: string | null; payeeName: string | null; questions: number; amountPaise: number; throughMonth: string };
export type PaymentRow = { id: string; userId: string; name: string; amountPaise: number; upiId: string; utr: string; note: string | null; paidAt: string; questions: number };
export type GigOverview = {
  settings: GigSettingsView;
  month: string;
  /** This month so far: what adding questions has committed, and how many were added. */
  spentThisMonthPaise: number;
  addedThisMonth: number;
  waiting: number;
  /** Earned in months that have ended and not yet paid: what the operator pays now. */
  due: DueRow[];
  /** Earned this month, to be paid after it ends. */
  accruingPaise: number;
  payments: PaymentRow[];
};

export async function gigOverview(ctx: ActiveContext, now: Date = new Date()): Promise<GigOverview> {
  operator(ctx);
  const settings = await gigSettings();
  const month = monthKey(now);
  const [spent, addedThisMonth, waiting, unpaid, payments] = await Promise.all([
    db.gigEarning.aggregate({ where: { month }, _sum: { amountPaise: true } }),
    db.gigEarning.count({ where: { month } }),
    db.questionContribution.count({ where: { status: "SUBMITTED" } }),
    db.gigEarning.findMany({ where: { paymentId: null, amountPaise: { gt: 0 } }, select: { userId: true, amountPaise: true, month: true, contribution: { select: { authorSchoolName: true } }, user: { select: { name: true, email: true, gigPayee: { select: { upiId: true, payeeName: true } } } } } }),
    db.gigPayment.findMany({ orderBy: { paidAt: "desc" }, take: 50, select: { id: true, userId: true, amountPaise: true, upiId: true, utr: true, note: true, paidAt: true, user: { select: { name: true } }, _count: { select: { earnings: true } } } }),
  ]);
  const due = new Map<string, DueRow>();
  let accruingPaise = 0;
  for (const e of unpaid) {
    if (e.month >= month) {
      accruingPaise += e.amountPaise;
      continue;
    }
    const row = due.get(e.userId) ?? { userId: e.userId, name: e.user.name, email: e.user.email, schoolName: e.contribution.authorSchoolName, upiId: e.user.gigPayee?.upiId ?? null, payeeName: e.user.gigPayee?.payeeName ?? null, questions: 0, amountPaise: 0, throughMonth: e.month };
    row.questions += 1;
    row.amountPaise += e.amountPaise;
    if (e.month > row.throughMonth) row.throughMonth = e.month;
    due.set(e.userId, row);
  }
  return {
    settings,
    month,
    spentThisMonthPaise: spent._sum.amountPaise ?? 0,
    addedThisMonth,
    waiting,
    due: [...due.values()].sort((a, b) => b.amountPaise - a.amountPaise || a.name.localeCompare(b.name)),
    accruingPaise,
    payments: payments.map((p) => ({ id: p.id, userId: p.userId, name: p.user.name, amountPaise: p.amountPaise, upiId: p.upiId, utr: p.utr, note: p.note, paidAt: p.paidAt.toISOString(), questions: p._count.earnings })),
  };
}

/**
 * The operator has paid a contributor from the company's bank and records the
 * transfer's reference. What it settles is every earning of theirs from the
 * months that have ended and not yet paid; the amount is the server's sum of
 * those, never a typed one. The earnings are locked while they are summed, so
 * the same earning cannot be settled by two records.
 */
export async function recordGigPayment(ctx: ActiveContext, input: { userId: string; utr: string; note?: string }, now: Date = new Date()): Promise<GigResult<{ payment: { id: string; amountPaise: number; questions: number } }>> {
  operator(ctx);
  const utr = input.utr.trim().toUpperCase();
  if (!UTR.test(utr)) return { ok: false, errorKey: "gigs.refuseUtr" };
  const payee = await db.gigPayee.findUnique({ where: { userId: input.userId }, select: { upiId: true } });
  if (!payee) return { ok: false, errorKey: "gigs.refuseNoUpi" };
  if (await db.gigPayment.findUnique({ where: { utr }, select: { id: true } })) return { ok: false, errorKey: "gigs.refuseUtrUsed" };
  const through = previousMonth(monthKey(now));
  let payment: { id: string; amountPaise: number; questions: number };
  try {
    payment = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const rows = await tx.$queryRaw<{ id: string; amountPaise: number }[]>`SELECT "id", "amountPaise" FROM "GigEarning" WHERE "userId" = ${input.userId} AND "paymentId" IS NULL AND "amountPaise" > 0 AND "month" <= ${through} ORDER BY "id" FOR UPDATE`;
      if (rows.length === 0) throw new Refusal("gigs.refuseNothingDue");
      const amountPaise = rows.reduce((sum, r) => sum + r.amountPaise, 0);
      const made = await tx.gigPayment.create({ data: { userId: input.userId, amountPaise, upiId: payee.upiId, utr, note: (input.note ?? "").trim().slice(0, 300) || null, paidByUserId: ctx.user.id, paidAt: now }, select: { id: true } });
      await tx.gigEarning.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { paymentId: made.id } });
      return { id: made.id, amountPaise, questions: rows.length };
    });
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, errorKey: error.errorKey };
    // Two records with one reference at the same moment: the second meets the unique index.
    if ((error as { code?: string }).code === "P2002") return { ok: false, errorKey: "gigs.refuseUtrUsed" };
    throw error;
  }
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "gig.payment.record", targetType: "GigPayment", targetId: payment.id, meta: { payeeUserId: input.userId, amountPaise: payment.amountPaise, questions: payment.questions } });
  const last = await db.questionContribution.findFirst({ where: { authorUserId: input.userId }, orderBy: { submittedAt: "desc" }, select: { authorSchoolId: true } });
  if (last) {
    await forSchool(last.authorSchoolId, () =>
      notify({ userId: input.userId, schoolId: last.authorSchoolId, kind: "SYSTEM", titleKey: "gigs.notifPaid", titleVars: { amount: formatPaise(payment.amountPaise), count: payment.questions }, url: "/teacher/contributions" }),
    ).catch((error) => console.error("[recordGigPayment] notice failed", error));
  }
  return { ok: true, payment };
}
