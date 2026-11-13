/**
 * A teacher's questions for the bank: two Low findings of the testing analysis of 13 November 2026, each held by a
 * case that fails while the defect stands.
 *
 *   TA-367  A content-team member who is also a teacher could add their own question to the bank and earn for it.
 *   TA-596  A question rate of 0 was accepted and wrote PAID earnings of 0, which the data audit fails and which use
 *           up the teacher's monthly cap.
 *
 * As the database's owner (tests/setup.ts). The dials are the one shared row: saved, set and put back. The school,
 * the people and the questions added to the bank are this suite's own (the stamp in each) and are removed.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { decideContribution, gigSettings, saveGigSettings, submitContribution, type ContributionInput } from "@/lib/gig-questions";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const STAMP = Date.now();
const savedKey = process.env.ANTHROPIC_API_KEY;
let saved: Awaited<ReturnType<typeof gigSettings>> | null = null;
let schoolId = "";
let topicId = "";
const ids = { curatorTeacher: "", reviewer: "", operator: "", teacher: "" };
const members = { curatorTeacher: "", teacher: "" };

const ctx = (userId: string, role: "TEACHER" | null, membershipId: string | null, flags: { isSuperuser?: boolean; isAppAdmin?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId, schoolId: role ? schoolId : null, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: Boolean(flags.isAppAdmin) } }) as ActiveContext;

let n = 0;
const question = (): ContributionInput => {
  n += 1;
  return {
    topicId,
    difficulty: 2,
    answerIndex: 1,
    en: { stem: `ZZ TA gig ${STAMP}-${n}: which of these numbers is even?`, choices: ["3", "4", "5", "7"], solution: "Four divides by two with nothing left over." },
    hi: { stem: `ZZ TA gig ${STAMP}-${n}: इनमें से कौन सी संख्या सम है?`, choices: ["3", "4", "5", "7"], solution: "चार को दो से भाग देने पर कुछ शेष नहीं रहता।" },
    mr: { stem: `ZZ TA gig ${STAMP}-${n}: यापैकी कोणती संख्या सम आहे?`, choices: ["3", "4", "5", "7"], solution: "चारला दोनने भागल्यावर काही उरत नाही." },
    terms: true,
  };
};
async function send(who: ActiveContext): Promise<string> {
  const result = await submitContribution(who, question());
  if (!result.ok) throw new Error(`submit refused: ${result.errorKey}`);
  return result.contribution.id;
}

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  saved = await gigSettings();
  schoolId = (await db.school.create({ data: { name: `ZZ TA Gig School ${STAMP}`, slug: `zz-tagig-${STAMP}`, code: `ZZTAG${String(STAMP).slice(-6)}`, contactEmail: `zz-tagig-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const person = async (key: keyof typeof ids, role: "TEACHER" | null, flags: { isSuperuser?: boolean; isAppAdmin?: boolean } = {}) => {
    ids[key] = (await db.user.create({ data: { name: `ZZ TA ${key} ${STAMP}`, email: `zz-tagig-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    if (role) members[key as keyof typeof members] = (await db.membership.create({ data: { userId: ids[key], schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  // A teacher who is also on the content team: the flag travels with the person whatever role is active.
  await person("curatorTeacher", "TEACHER", { isAppAdmin: true });
  await person("reviewer", null, { isAppAdmin: true });
  await person("operator", null, { isSuperuser: true });
  await person("teacher", "TEACHER");
  topicId = (await db.quizTopic.findFirstOrThrow({ where: { retiredAt: null }, orderBy: { slug: "asc" }, select: { id: true } })).id;
  // Nothing free, ten rupees a question, plenty of cap and budget.
  await db.gigSettings.update({ where: { id: "gigs" }, data: { questionRatePaise: 1000, questionFreeCount: 0, questionMonthlyCap: 50, questionMonthlyBudgetPaise: 100_000_000, questionDailyLimit: 200, questionPendingLimit: 200 } });
});

afterAll(async () => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  const users = Object.values(ids).filter(Boolean);
  const bank = await db.questionContribution.findMany({ where: { authorUserId: { in: users }, questionId: { not: null } }, select: { questionId: true } });
  await db.quizQuestion.deleteMany({ where: { id: { in: bank.map((b) => b.questionId!) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("deciding a question for the bank", () => {
  it("TA-367: a content-team member who is also a teacher cannot add their own question; another reviewer adds it", async () => {
    const id = await send(ctx(ids.curatorTeacher, "TEACHER", members.curatorTeacher, { isAppAdmin: true }));
    const self = ctx(ids.curatorTeacher, null, null, { isAppAdmin: true });
    expect(await decideContribution(self, id, { decision: "ACCEPT" })).toMatchObject({ ok: false, errorKey: "gigs.refuseOwnContribution" });
    expect(await db.gigEarning.count({ where: { contributionId: id } })).toBe(0);
    expect(await decideContribution(ctx(ids.reviewer, null, null, { isAppAdmin: true }), id, { decision: "ACCEPT" })).toMatchObject({ ok: true });
    expect(await db.gigEarning.findFirst({ where: { contributionId: id }, select: { basis: true, amountPaise: true } })).toEqual({ basis: "PAID", amountPaise: 1000 });
  });

  it("TA-596: a question rate of 0 is refused, and a 0 already stored never writes a PAID earning of nothing", async () => {
    const operator = ctx(ids.operator, null, null, { isSuperuser: true });
    expect(await saveGigSettings(operator, { ...(await gigSettings()), questionRatePaise: 0 })).toMatchObject({ ok: false, errorKey: "gigs.refuseSetting" });
    expect((await gigSettings()).questionRatePaise).toBe(1000);
    // A 0 saved before the rule: the earning is not PAID, so neither the data audit nor the monthly cap counts it.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { questionRatePaise: 0 } });
    try {
      const id = await send(ctx(ids.teacher, "TEACHER", members.teacher));
      expect(await decideContribution(ctx(ids.reviewer, null, null, { isAppAdmin: true }), id, { decision: "ACCEPT" })).toMatchObject({ ok: true });
      const earning = await db.gigEarning.findFirstOrThrow({ where: { contributionId: id }, select: { basis: true, amountPaise: true } });
      expect(earning.basis === "PAID" && earning.amountPaise <= 0).toBe(false);
    } finally {
      await db.gigSettings.update({ where: { id: "gigs" }, data: { questionRatePaise: 1000 } });
    }
  });
});
