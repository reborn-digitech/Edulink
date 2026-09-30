import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { contributionTopics, decideContribution, draftTranslations, getContributionForReview, getMyContribution, gigOverview, gigSettings, listContributionQueue, monthKey, myContributions, recordGigPayment, reviseContribution, saveGigSettings, savePayee, submitContribution, withdrawContribution, type ContributionInput } from "@/lib/gig-questions";
import type { ActiveContext } from "@/lib/session";

/**
 * Gigs: a teacher's questions for the shared bank (decision 0004). A question
 * is sent in three languages or not at all; only the content team or the
 * operator adds one to the bank, and only adding earns; the first ones added
 * earn nothing, then the rate, for so many a month and inside a budget, past
 * which adding is refused and nothing is added unpaid; one teacher cannot
 * read or change another's; the operator's record of a transfer settles the
 * months that have ended, once.
 *
 * The dials are the one shared row, so this suite saves them, sets its own and
 * puts them back; its teachers, their school and the questions it adds to
 * the bank are its own and are removed.
 */
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const STAMP = Date.now();
const savedKey = process.env.ANTHROPIC_API_KEY;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let schoolId = "";
let topicId = "";
const ids = { teacherA: "", teacherB: "", admin: "", appAdmin: "", operator: "" };
const members = { teacherA: "", teacherB: "", admin: "" };

const ctx = (userId: string, role: "TEACHER" | "ADMIN" | null, membershipId: string | null, flags: { isSuperuser?: boolean; isAppAdmin?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId, schoolId: role ? schoolId : null, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: Boolean(flags.isAppAdmin) } }) as ActiveContext;
const teacherA = () => ctx(ids.teacherA, "TEACHER", members.teacherA);
const teacherB = () => ctx(ids.teacherB, "TEACHER", members.teacherB);
const admin = () => ctx(ids.admin, "ADMIN", members.admin);
const appAdmin = () => ctx(ids.appAdmin, null, null, { isAppAdmin: true });
const operator = () => ctx(ids.operator, null, null, { isSuperuser: true });

let n = 0;
const question = (over: Partial<ContributionInput> = {}): ContributionInput => {
  n += 1;
  return {
    topicId,
    difficulty: 2,
    answerIndex: 1,
    en: { stem: `ZZ gig ${STAMP}-${n}: which of these numbers is even?`, choices: ["3", "4", "5", "7"], solution: "Four divides by two with nothing left over." },
    hi: { stem: `ZZ gig ${STAMP}-${n}: इनमें से कौन सी संख्या सम है?`, choices: ["3", "4", "5", "7"], solution: "चार को दो से भाग देने पर कुछ शेष नहीं रहता।" },
    mr: { stem: `ZZ gig ${STAMP}-${n}: यापैकी कोणती संख्या सम आहे?`, choices: ["3", "4", "5", "7"], solution: "चारला दोनने भागल्यावर काही उरत नाही." },
    terms: true,
    ...over,
  };
};
const send = async (who: ActiveContext, over: Partial<ContributionInput> = {}) => {
  const result = await submitContribution(who, question(over));
  if (!result.ok) throw new Error(`submit refused: ${result.errorKey}`);
  return result.contribution;
};

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  saved = await gigSettings();
  const school = await db.school.create({ data: { name: `ZZ Gig School ${STAMP}`, slug: `zz-gig-${STAMP}`, code: `ZZG${String(STAMP).slice(-6)}`, contactEmail: `zz-gig-${STAMP}@test.invalid` }, select: { id: true } });
  schoolId = school.id;
  const person = async (key: keyof typeof ids, name: string, role: "TEACHER" | "ADMIN" | null, flags: { isSuperuser?: boolean; isAppAdmin?: boolean } = {}) => {
    const user = await db.user.create({ data: { name, email: `zz-gig-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    ids[key] = user.id;
    if (role) members[key as keyof typeof members] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("teacherA", "ZZ Gig Teacher A", "TEACHER");
  await person("teacherB", "ZZ Gig Teacher B", "TEACHER");
  await person("admin", "ZZ Gig Admin", "ADMIN");
  await person("appAdmin", "ZZ Gig Curator", null, { isAppAdmin: true });
  await person("operator", "ZZ Gig Operator", null, { isSuperuser: true });
  const topic = await db.quizTopic.findFirstOrThrow({ where: { retiredAt: null }, orderBy: { slug: "asc" }, select: { id: true } });
  topicId = topic.id;
  // Two unpaid, then ten rupees, two a month, inside thirty rupees: small enough to reach every edge.
  await db.gigSettings.update({ where: { id: "gigs" }, data: { questionRatePaise: 1000, questionFreeCount: 2, questionMonthlyCap: 2, questionMonthlyBudgetPaise: 100_000_000, questionDailyLimit: 200, questionPendingLimit: 200 } });
});

afterAll(async () => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  const users = Object.values(ids).filter(Boolean);
  const bank = await db.questionContribution.findMany({ where: { authorUserId: { in: users }, questionId: { not: null } }, select: { questionId: true } });
  await db.quizQuestion.deleteMany({ where: { id: { in: bank.map((b) => b.questionId!) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: users.map((u) => `gig-draft:${u}`) } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("a teacher's questions for the bank", () => {
  it("is a teacher's to send: an admin, the content team and the operator are refused the teacher's side", async () => {
    for (const who of [admin(), appAdmin(), operator()]) {
      await expect(myContributions(who)).rejects.toBeInstanceOf(AccessError);
      await expect(submitContribution(who, question())).rejects.toBeInstanceOf(AccessError);
      await expect(contributionTopics(who)).rejects.toBeInstanceOf(AccessError);
      await expect(savePayee(who, { upiId: "zz@bank", payeeName: "ZZ" })).rejects.toBeInstanceOf(AccessError);
    }
    expect((await contributionTopics(teacherA())).length).toBeGreaterThan(0);
  });

  it("is sent in three languages or not at all", async () => {
    const refused = async (over: Partial<ContributionInput>) => {
      const result = await submitContribution(teacherA(), question(over));
      return result.ok ? "sent" : result.errorKey;
    };
    const base = question();
    expect(await refused({ en: { ...base.en, stem: "hi" } })).toBe("appadmin.stemTooShort");
    expect(await refused({ en: { ...base.en, choices: ["only"] } })).toBe("appadmin.needTwoChoices");
    expect(await refused({ answerIndex: 9 })).toBe("appadmin.pickTheAnswer");
    expect(await refused({ hi: { ...base.hi, solution: "" } })).toBe("gigs.hindiIncomplete");
    expect(await refused({ mr: { ...base.mr, choices: ["3", "4", "5"] } })).toBe("gigs.marathiIncomplete");
    // English pasted into the Hindi box is not Hindi.
    expect(await refused({ hi: { ...base.en } })).toBe("gigs.hindiNotDevanagari");
    expect(await refused({ mr: { ...base.mr, solution: "Four divides by two." } })).toBe("gigs.marathiNotDevanagari");
    expect(await refused({ terms: false })).toBe("gigs.needTerms");
    expect(await refused({ topicId: "no-such-topic" })).toBe("appadmin.noSuchTopic");
    // A sum is the same in every script.
    const sum = { stem: `${STAMP} + 12 = ?`, choices: ["1", "2"], solution: "12345" };
    const sent = await submitContribution(teacherA(), question({ en: sum, hi: sum, mr: sum }));
    expect(sent.ok).toBe(true);
    if (sent.ok) await withdrawContribution(teacherA(), sent.contribution.id);
    expect(await db.questionContribution.count({ where: { authorUserId: ids.teacherA, status: "SUBMITTED" } })).toBe(0);
  });

  it("is its author's alone: another teacher neither reads, changes nor takes it back, and the same words are not sent twice", async () => {
    const mine = await send(teacherA());
    expect(mine.status).toBe("SUBMITTED");
    expect(mine.open).toBe(true);
    await expect(getMyContribution(teacherB(), mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reviseContribution(teacherB(), mine.id, question())).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(withdrawContribution(teacherB(), mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await myContributions(teacherB())).contributions).toHaveLength(0);
    expect(await submitContribution(teacherA(), question({ en: mine.en }))).toMatchObject({ ok: false, errorKey: "gigs.refuseDuplicate" });
    // Changed by its author, it is still theirs and still waiting.
    const changed = await reviseContribution(teacherA(), mine.id, question({ difficulty: 4 }));
    expect(changed.ok && changed.contribution.difficulty).toBe(4);
    const back = await withdrawContribution(teacherA(), mine.id);
    expect(back.ok && back.contribution.status).toBe("WITHDRAWN");
    expect((await withdrawContribution(teacherA(), mine.id)).ok).toBe(true);
    expect(await reviseContribution(teacherA(), mine.id, question())).toMatchObject({ ok: false, errorKey: "gigs.refuseSettled" });
  });

  it("holds a teacher to the day's and the waiting limits", async () => {
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionPendingLimit: 1 } });
    const one = await send(teacherB());
    expect(await submitContribution(teacherB(), question())).toMatchObject({ ok: false, errorKey: "gigs.refusePendingLimit", vars: { count: 1 } });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionPendingLimit: 200, questionDailyLimit: 1 } });
    expect(await submitContribution(teacherB(), question())).toMatchObject({ ok: false, errorKey: "gigs.refuseDailyLimit", vars: { count: 1 } });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionDailyLimit: 200 } });
    await withdrawContribution(teacherB(), one.id);
  });

  it("is decided by the content team or the operator and by nobody else; returning and rejecting need a note", async () => {
    const q = await send(teacherA());
    for (const who of [teacherA(), teacherB(), admin()]) {
      await expect(decideContribution(who, q.id, { decision: "ACCEPT" })).rejects.toBeInstanceOf(AccessError);
      await expect(listContributionQueue(who)).rejects.toBeInstanceOf(AccessError);
      await expect(getContributionForReview(who, q.id)).rejects.toBeInstanceOf(AccessError);
    }
    expect(await decideContribution(appAdmin(), q.id, { decision: "RETURN" })).toMatchObject({ ok: false, errorKey: "gigs.needNote" });
    expect(await decideContribution(appAdmin(), q.id, { decision: "REJECT", note: "no" })).toMatchObject({ ok: false, errorKey: "gigs.needNote" });
    const queue = await listContributionQueue(appAdmin());
    expect(queue.rows.some((r) => r.id === q.id && r.authorName === "ZZ Gig Teacher A" && r.authorSchoolName === `ZZ Gig School ${STAMP}`)).toBe(true);

    const returned = await decideContribution(appAdmin(), q.id, { decision: "RETURN", note: "Say which class this is for." });
    expect(returned.ok && returned.contribution.status).toBe("RETURNED");
    expect((await getMyContribution(teacherA(), q.id)).reviewNote).toBe("Say which class this is for.");
    expect(await db.quizQuestion.count({ where: { stem: q.en.stem } })).toBe(0);
    expect(await db.gigEarning.count({ where: { contributionId: q.id } })).toBe(0);
    expect(await db.notification.count({ where: { userId: ids.teacherA, url: `/teacher/contributions/${q.id}` } })).toBe(1);
    // Sent again by its author, then rejected by the operator: still nothing in the bank and nothing earned.
    expect((await reviseContribution(teacherA(), q.id, question({ en: q.en, hi: q.hi, mr: q.mr }))).ok).toBe(true);
    const rejected = await decideContribution(operator(), q.id, { decision: "REJECT", note: "Already covered by the chapter's own questions." });
    expect(rejected.ok && rejected.contribution.status).toBe("REJECTED");
    expect(await decideContribution(appAdmin(), q.id, { decision: "ACCEPT" })).toMatchObject({ ok: false, errorKey: "gigs.refuseSettled" });
    expect(await db.quizQuestion.count({ where: { stem: q.en.stem } })).toBe(0);
    expect(await db.gigEarning.count({ where: { userId: ids.teacherA } })).toBe(0);
  });

  it("earns only when added to the bank: the first two nothing, then ten rupees, two a month and no more, and never past the budget", async () => {
    const added: string[] = [];
    const add = async (who = appAdmin()) => {
      const q = await send(teacherA());
      const result = await decideContribution(who, q.id, { decision: "ACCEPT" });
      if (result.ok) added.push(q.id);
      return { q, result };
    };
    // The first two added: in the bank in three languages, and unpaid.
    const first = await add();
    expect(first.result.ok && first.result.contribution.earning).toEqual({ amountPaise: 0, basis: "FREE_BLOCK", month: monthKey(), paid: false });
    const inBank = await db.quizQuestion.findFirstOrThrow({ where: { stem: first.q.en.stem }, select: { id: true, source: true, licence: true, reviewedBy: true, answerIndex: true, translations: { select: { language: true, stem: true }, orderBy: { language: "asc" } } } });
    expect(inBank).toMatchObject({ source: "teacher contribution", licence: "proprietary", reviewedBy: ids.appAdmin, answerIndex: 1 });
    expect(inBank.translations.map((t) => t.language)).toEqual(["hi", "mr"]);
    expect(inBank.translations[0]!.stem).toBe(first.q.hi.stem);
    expect(first.result.ok && first.result.contribution.questionId).toBe(inBank.id);
    // Added twice is added once.
    expect((await decideContribution(appAdmin(), first.q.id, { decision: "ACCEPT" })).ok).toBe(true);
    expect(await db.gigEarning.count({ where: { contributionId: first.q.id } })).toBe(1);
    const second = await add(operator());
    expect(second.result.ok && second.result.contribution.earning?.basis).toBe("FREE_BLOCK");

    // The third and the fourth earn the rate; what the reviewer is told beforehand is what happens.
    const third = await send(teacherA());
    expect((await getContributionForReview(appAdmin(), third.id)).outcome).toEqual({ basis: "PAID", amountPaise: 1000 });
    // Added with the reviewer's corrections: the corrected words are what the bank holds, and the teacher still earns.
    const corrected = question({ answerIndex: 0 });
    const paid = await decideContribution(appAdmin(), third.id, { decision: "ACCEPT", edit: corrected });
    expect(paid.ok && paid.contribution.earning).toMatchObject({ amountPaise: 1000, basis: "PAID", paid: false });
    expect(await db.quizQuestion.count({ where: { stem: corrected.en.stem, answerIndex: 0 } })).toBe(1);
    expect(await db.quizQuestion.count({ where: { stem: third.en.stem } })).toBe(0);
    added.push(third.id);
    const fourth = await add();
    expect(fourth.result.ok && fourth.result.contribution.earning?.amountPaise).toBe(1000);

    // The month's two are used: the fifth is refused to the reviewer, stays waiting, and is in no bank.
    const fifth = await add();
    expect(fifth.result).toMatchObject({ ok: false, errorKey: "gigs.refuseMonthlyCap" });
    expect((await getMyContribution(teacherA(), fifth.q.id)).status).toBe("SUBMITTED");
    expect(await db.quizQuestion.count({ where: { stem: fifth.q.en.stem } })).toBe(0);
    expect((await getContributionForReview(appAdmin(), fifth.q.id)).outcome).toEqual({ refuse: "gigs.refuseMonthlyCap" });

    // A raised limit, but a budget with nine rupees left in it: refused for the budget.
    const spent = (await db.gigEarning.aggregate({ where: { month: monthKey() }, _sum: { amountPaise: true } }))._sum.amountPaise ?? 0;
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionMonthlyCap: 10, questionMonthlyBudgetPaise: spent + 900 } });
    expect(await decideContribution(appAdmin(), fifth.q.id, { decision: "ACCEPT" })).toMatchObject({ ok: false, errorKey: "gigs.refuseBudget" });
    // Ten rupees of room: added and paid.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionMonthlyBudgetPaise: spent + 1000 } });
    const now = await decideContribution(appAdmin(), fifth.q.id, { decision: "ACCEPT" });
    expect(now.ok && now.contribution.earning?.amountPaise).toBe(1000);
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionMonthlyCap: 2, questionMonthlyBudgetPaise: 100_000_000 } });

    const mine = await myContributions(teacherA());
    expect(mine.standing).toMatchObject({ accepted: 5, freeLeft: 0, paidThisMonth: 3, duePaise: 3000, paidPaise: 0 });
    // The same words cannot be added to the bank's chapter twice, whoever sends them.
    expect(await submitContribution(teacherB(), question({ en: first.q.en }))).toMatchObject({ ok: false, errorKey: "gigs.refuseInBank" });
    // Every addition told its author once.
    expect(await db.notification.count({ where: { userId: ids.teacherA, url: { in: added.concat(fifth.q.id).map((id) => `/teacher/contributions/${id}`) } } })).toBe(5);
  });

  it("two reviewers adding at once count the same month one after the other", async () => {
    // Teacher B has nothing in the bank; with no unpaid ones and one paid a month, two at once must leave exactly one added.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionFreeCount: 0, questionMonthlyCap: 1 } });
    const [a, b] = [await send(teacherB()), await send(teacherB())];
    const results = await Promise.all([decideContribution(appAdmin(), a.id, { decision: "ACCEPT" }), decideContribution(operator(), b.id, { decision: "ACCEPT" })]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toMatchObject({ errorKey: "gigs.refuseMonthlyCap" });
    expect(await db.gigEarning.count({ where: { userId: ids.teacherB, basis: "PAID" } })).toBe(1);
    expect(await db.questionContribution.count({ where: { authorUserId: ids.teacherB, status: "ACCEPTED" } })).toBe(1);
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionFreeCount: 2, questionMonthlyCap: 2 } });
  });

  it("is paid by the operator's record of a transfer: only months that have ended, only with a UPI id, once for a reference", async () => {
    for (const who of [teacherA(), admin(), appAdmin()]) {
      await expect(gigOverview(who)).rejects.toBeInstanceOf(AccessError);
      await expect(recordGigPayment(who, { userId: ids.teacherA, utr: "ZZUTR00000000001" })).rejects.toBeInstanceOf(AccessError);
      await expect(saveGigSettings(who, await gigSettings())).rejects.toBeInstanceOf(AccessError);
    }
    // This month's earnings are not yet due.
    const thisMonth = await gigOverview(operator());
    expect(thisMonth.due.some((d) => d.userId === ids.teacherA)).toBe(false);
    expect(thisMonth.accruingPaise).toBeGreaterThanOrEqual(3000);
    expect(await recordGigPayment(operator(), { userId: ids.teacherA, utr: "ZZUTR00000000001" })).toMatchObject({ ok: false, errorKey: "gigs.refuseNoUpi" });
    expect(await savePayee(teacherA(), { upiId: "not a upi", payeeName: "ZZ Gig Teacher A" })).toMatchObject({ ok: false, errorKey: "fees.refuseUpiId" });
    expect((await savePayee(teacherA(), { upiId: "zz.gig.a@zzbank", payeeName: "ZZ Gig Teacher A" })).ok).toBe(true);
    expect(await recordGigPayment(operator(), { userId: ids.teacherA, utr: "ZZUTR00000000001" })).toMatchObject({ ok: false, errorKey: "gigs.refuseNothingDue" });
    expect(await recordGigPayment(operator(), { userId: ids.teacherA, utr: "short" })).toMatchObject({ ok: false, errorKey: "gigs.refuseUtr" });

    // The month ends: seen from the month after, the three are due, with where to send them.
    const next = new Date(Date.now() + 32 * 86_400_000);
    const due = (await gigOverview(operator(), next)).due.find((d) => d.userId === ids.teacherA);
    expect(due).toMatchObject({ questions: 3, amountPaise: 3000, upiId: "zz.gig.a@zzbank", schoolName: `ZZ Gig School ${STAMP}` });
    const utr = `ZZUTR${String(STAMP).slice(-11)}`;
    const paid = await recordGigPayment(operator(), { userId: ids.teacherA, utr, note: "September" }, next);
    expect(paid).toMatchObject({ ok: true, payment: { amountPaise: 3000, questions: 3 } });
    // The same reference again, and the same person again: nothing more is settled.
    expect(await recordGigPayment(operator(), { userId: ids.teacherA, utr }, next)).toMatchObject({ ok: false, errorKey: "gigs.refuseUtrUsed" });
    expect(await recordGigPayment(operator(), { userId: ids.teacherA, utr: `${utr}X` }, next)).toMatchObject({ ok: false, errorKey: "gigs.refuseNothingDue" });
    expect((await myContributions(teacherA())).standing).toMatchObject({ duePaise: 0, paidPaise: 3000 });
    const row = await db.gigPayment.findUniqueOrThrow({ where: { utr }, select: { amountPaise: true, upiId: true, paidByUserId: true, earnings: { select: { amountPaise: true } } } });
    expect(row).toMatchObject({ amountPaise: 3000, upiId: "zz.gig.a@zzbank", paidByUserId: ids.operator });
    expect(row.earnings.reduce((sum, e) => sum + e.amountPaise, 0)).toBe(row.amountPaise);
    expect((await gigOverview(operator(), next)).payments.some((p) => p.utr === utr && p.questions === 3)).toBe(true);
    // The log holds the payment and not where it was sent.
    const logged = await db.auditLog.findFirstOrThrow({ where: { action: "gig.payment.record", actorUserId: ids.operator }, select: { meta: true } });
    expect(JSON.stringify(logged.meta)).not.toContain("zzbank");
  });

  it("the operator's dials are whole numbers in range, and a draft is refused politely where no translator is set up", async () => {
    const now = await gigSettings();
    expect(await saveGigSettings(operator(), { ...now, questionRatePaise: -1 })).toMatchObject({ ok: false, errorKey: "gigs.refuseSetting" });
    expect(await saveGigSettings(operator(), { ...now, questionDailyLimit: 0 })).toMatchObject({ ok: false, errorKey: "gigs.refuseSetting" });
    const savedNow = await saveGigSettings(operator(), { ...now, questionRatePaise: 1500 });
    expect(savedNow.ok && savedNow.settings.questionRatePaise).toBe(1500);
    await saveGigSettings(operator(), now);
    expect(await draftTranslations(teacherA(), question().en)).toMatchObject({ ok: false, errorKey: "gigs.draftOff" });
    await expect(draftTranslations(appAdmin(), question().en)).rejects.toBeInstanceOf(AccessError);
  });
});
