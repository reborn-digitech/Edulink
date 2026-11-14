/**
 * TA-034 (testing analysis of 13 November 2026, Medium, Security): joining
 * accounts moved a two-step-protected account's school roles on its password
 * alone. authenticate read no totp column, so somebody holding an office
 * account's password (which signs them in nowhere without the code) could make
 * a parent account, join the office account into it and hold its ADMIN
 * membership on an account with no second step, the real holder's closed.
 * Now an account with two-step sign-in on is refused by name, before anything
 * is said about it or moved: the holder turns the second step off first, which
 * needs the code.
 *
 * Every row is one this suite makes (a stamped ZZ school, @test.invalid
 * accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/crypto";
import { mergeAccounts, previewMerge } from "@/lib/account-merge";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taauth-merge-${who}-${STAMP}@test.invalid`;
const PASSWORD = `Zz-taauth-${STAMP}-Heron`;

let schoolId = "";
let keeperId = "";
let officeId = "";
let membershipId = "";

function ctx(userId: string): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "ZZ TA Auth Keeper",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA Auth Merge ${STAMP}`, slug: `zz-taauth-merge-${STAMP}`, code: `ZZTAM${STAMP}`.slice(0, 20), contactEmail: MAIL("school") }, select: { id: true } })).id;
  const hash = await hashPassword(PASSWORD);
  keeperId = (await db.user.create({ data: { name: "ZZ TA Auth Keeper", email: MAIL("keeper"), passwordHash: hash, prefs: "{}" }, select: { id: true } })).id;
  officeId = (
    await db.user.create({
      data: { name: "ZZ TA Auth Office", email: MAIL("office"), passwordHash: hash, emailVerifiedAt: new Date(), totpEnabledAt: new Date(), totpSecretEnc: "sealed-in-test", prefs: "{}" },
      select: { id: true },
    })
  ).id;
  membershipId = (await db.membership.create({ data: { userId: officeId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
});

afterAll(async () => {
  const ids = [keeperId, officeId].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`login:${MAIL("office")}`, ...ids.map((id) => `merge:${id}`)] } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: ids } }, { schoolId }] } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.authToken.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe.sequential("TA-034: an account with two-step sign-in is not joined on its password alone", () => {
  it("TA-034: the preview refuses with the two-step sentence and names nothing of the account", async () => {
    const preview = await previewMerge(ctx(keeperId), { identifier: MAIL("office"), password: PASSWORD });
    expect(preview).toMatchObject({ ok: false, errorKey: "refusal.mergeTwoStep" });
    expect(JSON.stringify(preview)).not.toContain("ZZ TA Auth Office");
  });

  it("TA-034: the join refuses and the ADMIN membership stays with the office account, which stays open", async () => {
    const result = await mergeAccounts(ctx(keeperId), { identifier: MAIL("office"), password: PASSWORD });
    expect(result).toMatchObject({ ok: false, errorKey: "refusal.mergeTwoStep" });
    const membership = await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { userId: true } });
    expect(membership.userId).toBe(officeId);
    const office = await db.user.findUniqueOrThrow({ where: { id: officeId }, select: { disabledAt: true, mergedIntoUserId: true } });
    expect(office.disabledAt).toBeNull();
    expect(office.mergedIntoUserId).toBeNull();
  });
});

/**
 * TA-039 (Medium, Data-integrity): joining accounts moved memberships, certificates, guardianships and authorship,
 * and left every other person-keyed row on the closed account: a parent's conversations, meeting bookings, a college
 * student's placement applications, an SSO identity. Those now move; what cannot simply move (a recruiter's account,
 * session earnings, a live plan) is refused by name, as an expert profile is.
 */
describe.sequential("TA-039: joining accounts brings the person's conversations and sign-in identities along", () => {
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const hash = await hashPassword(PASSWORD);
    ids.keeper = (await db.user.create({ data: { name: "ZZ TA Auth Parent Keeper", email: MAIL("p-keeper"), passwordHash: hash, prefs: "{}" }, select: { id: true } })).id;
    ids.old = (await db.user.create({ data: { name: "ZZ TA Auth Parent Old", email: MAIL("p-old"), passwordHash: hash, emailVerifiedAt: new Date(), prefs: "{}" }, select: { id: true } })).id;
    ids.teacher = (await db.user.create({ data: { name: "ZZ TA Auth Teacher", email: MAIL("p-teacher"), prefs: "{}" }, select: { id: true } })).id;
    ids.pupil = (await db.user.create({ data: { name: "ZZ TA Auth Pupil", email: MAIL("p-pupil"), prefs: "{}", isMinor: true }, select: { id: true } })).id;
    await db.membership.create({ data: { userId: ids.teacher, schoolId, role: "TEACHER", status: "ACTIVE" } });
    ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `STU-ZTAM-${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId: ids.old, studentMembershipId: ids.pupilM, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
    ids.room = (await db.conversation.create({ data: { schoolId, createdById: ids.old, pairKey: `${schoolId}:${[ids.old, ids.teacher].sort().join(":")}` }, select: { id: true } })).id;
    await db.conversationParticipant.createMany({ data: [{ conversationId: ids.room, schoolId, userId: ids.old }, { conversationId: ids.room, schoolId, userId: ids.teacher }] });
    await db.conversationMessage.create({ data: { conversationId: ids.room, schoolId, authorUserId: ids.old, body: "ZZ TA Auth question" } });
    await db.ssoIdentity.create({ data: { userId: ids.old, provider: "google", subject: `zz-taauth-merge-${STAMP}`, email: MAIL("p-old") } });
  });

  afterAll(async () => {
    const userIds = [ids.keeper, ids.old, ids.teacher, ids.pupil].filter((x): x is string => Boolean(x));
    await db.rateLimit.deleteMany({ where: { bucket: { in: [`login:${MAIL("p-old")}`, `login:${MAIL("p-recruiter")}`, ...userIds.map((id) => `merge:${id}`)] } } });
    await db.ssoIdentity.deleteMany({ where: { userId: { in: userIds } } });
    await db.conversation.deleteMany({ where: { schoolId } });
    await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: userIds } }, { schoolId }] } });
    await db.membership.deleteMany({ where: { userId: { in: userIds } } });
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it("TA-039: an old account holding a recruiter's account or a live plan is refused by name, and nothing moves", async () => {
    const hash = await hashPassword(PASSWORD);
    const recruiterId = (await db.user.create({ data: { name: "ZZ TA Auth Recruiter Old", email: MAIL("p-recruiter"), passwordHash: hash, emailVerifiedAt: new Date(), prefs: "{}" }, select: { id: true } })).id;
    try {
      await db.recruiterProfile.create({ data: { userId: recruiterId, companyName: `ZZ TA Auth Hiring ${STAMP}` } });
      expect(await previewMerge(ctx(ids.keeper!), { identifier: MAIL("p-recruiter"), password: PASSWORD })).toMatchObject({ ok: false, errorKey: "refusal.mergeHeldByPerson" });
      await db.recruiterProfile.deleteMany({ where: { userId: recruiterId } });
      await db.entitlement.create({ data: { userId: recruiterId, feature: "EXPERT_SESSIONS", source: "GRANT", validFrom: new Date(), validTo: new Date(Date.now() + 30 * 86_400_000) } });
      expect(await mergeAccounts(ctx(ids.keeper!), { identifier: MAIL("p-recruiter"), password: PASSWORD })).toMatchObject({ ok: false, errorKey: "refusal.mergeHeldByPerson" });
      expect((await db.user.findUniqueOrThrow({ where: { id: recruiterId }, select: { disabledAt: true } })).disabledAt).toBeNull();
    } finally {
      await db.recruiterProfile.deleteMany({ where: { userId: recruiterId } });
      await db.entitlement.deleteMany({ where: { userId: recruiterId } });
      await db.auditLog.deleteMany({ where: { actorUserId: recruiterId } });
      await db.user.deleteMany({ where: { id: recruiterId } });
    }
  });

  it("TA-039: after the join the conversation, its message and the Google identity are the kept account's", async () => {
    const result = await mergeAccounts(ctx(ids.keeper!), { identifier: MAIL("p-old"), password: PASSWORD });
    expect(result).toMatchObject({ ok: true, counts: { children: 1 } });
    const participants = await db.conversationParticipant.findMany({ where: { conversationId: ids.room! }, select: { userId: true } });
    expect(participants.map((p) => p.userId).sort()).toEqual([ids.keeper!, ids.teacher!].sort());
    expect((await db.conversationMessage.findFirstOrThrow({ where: { conversationId: ids.room! }, select: { authorUserId: true } })).authorUserId).toBe(ids.keeper);
    // The room's key named the old id; it is cleared so the room is keyed again with the kept one.
    expect((await db.conversation.findUniqueOrThrow({ where: { id: ids.room! }, select: { pairKey: true } })).pairKey).toBeNull();
    expect((await db.ssoIdentity.findFirstOrThrow({ where: { subject: `zz-taauth-merge-${STAMP}` }, select: { userId: true } })).userId).toBe(ids.keeper);
  });
});
