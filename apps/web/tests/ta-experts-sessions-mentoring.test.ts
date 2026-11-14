/**
 * Mentoring (src/lib/mentoring.ts) and the push a minor is sent (src/lib/notify.ts): the findings of the
 * experts-sessions batch of the testing analysis of 13 November 2026 in that module, each held by a case that fails
 * while the defect stands.
 *
 *   TA-119  The school's stand-in guardian who paired the pupil was accepted as the consenting guardian: one adult's
 *           word made the mentorship ACTIVE where the module's rule is two.
 *   TA-125  The claim of a mentee place and the move to PENDING_CONSENT were separate, unconditional writes: two
 *           approvals at once raised the expert's count twice, and an approval crossing a decline left a place held.
 *   TA-249  An outside mentor's words went onto a minor's lock screen: notify passed a literal body to the push for
 *           every recipient, and only the conversations caller blanked it for a child.
 *   TA-582  Pairing a pupil with a mentor they had already asked for answered with the ask's id and left it waiting,
 *           with no place claimed and no guardian asked.
 *
 * As the database's owner (the rules, not the policies). One scratch ZZ school of this suite's own, its people and
 * experts (the stamp in every name), removed afterwards. The phone push is stood in for; nothing leaves the machine.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const pushed = vi.hoisted(() => [] as { userId: string; body: string }[]);
vi.mock("@/lib/expo-push", () => ({
  sendExpoPush: async (userId: string, message: { body?: string }) => {
    pushed.push({ userId, body: message.body ?? "" });
    return { sent: 0, failed: 0, retired: 0 };
  },
}));

import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { consentToMentorship, createMentorship, decideMentorRequest, postMentorMessage, requestMentor } from "@/lib/mentoring";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const profile: Record<string, string> = {};
let schoolId = "";
const PUSH_ON = JSON.stringify({ locale: "en", channels: { push: true, email: false, sms: false, whatsapp: false }, quietHours: null });

const ctx = (key: string, role: ActiveContext["role"], school: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: role === "PARENT" || role === "EXPERT" ? null : (member[key] ?? null), schoolId: school, role, user: { id: id[key]!, name: `ZZ TA esm ${key} ${STAMP}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const admin = () => ctx("admin", "ADMIN", schoolId);
const principal = () => ctx("principal", "PRINCIPAL", schoolId);
const WHY = "ZZ I would like some help choosing what to study next year.";
const placesOf = async (key: string) => (await db.expertProfile.findUniqueOrThrow({ where: { id: profile[key]! }, select: { activeMentorships: true } })).activeMentorships;
const holding = (key: string) => db.mentorThread.count({ where: { expertProfileId: profile[key]!, status: { in: ["PENDING_CONSENT", "ACTIVE"] } } });
async function asks(pupilKey: string, expertKey: string): Promise<string> {
  const r = await requestMentor(ctx(pupilKey, "STUDENT", schoolId), { expertProfileId: profile[expertKey]!, purpose: WHY });
  if (!r.ok) throw new Error(`the ask was refused: ${r.errorKey}`);
  return r.threadId;
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA esm School ${STAMP}`, slug: `zz-taesm-${STAMP}`, code: `ZZTAESM${String(STAMP).slice(-5)}`, contactEmail: `zz-taesm-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ TA esm ${key} ${STAMP}`, email: `zz-taesm-${key}-${STAMP}@test.invalid`, isTestFixture: true, prefs: PUSH_ON, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("admin", "ADMIN");
  await person("principal", "PRINCIPAL");
  for (const k of ["p1", "p2", "p3", "p4", "orphan"]) await person(k, "STUDENT", { isMinor: true });
  await person("guardian", null);
  for (const k of ["p1", "p2", "p3", "p4"]) await db.guardianship.create({ data: { parentUserId: id.guardian!, studentMembershipId: member[k]!, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
  // The pupil with no family on the app: the admin holds the school's stand-in guardianship (standin-guardian.ts).
  await db.guardianship.create({ data: { parentUserId: id.admin!, studentMembershipId: member.orphan!, studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" } });
  for (const k of ["e1", "e2", "e3"]) {
    await person(k, null);
    profile[k] = (await db.expertProfile.create({ data: { userId: id[k]!, headline: `ZZ TA esm mentor ${k}`, offering: "BOTH", mentorCapacity: 5, activeMentorships: 1, publishedAt: new Date() }, select: { id: true } })).id;
  }
}, 120_000);

afterAll(async () => {
  const users = Object.values(id);
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.expertProfile.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 120_000);

describe("mentoring: the experts-sessions batch", () => {
  it("TA-119: the stand-in guardian who paired the pupil cannot also be the guardian who agrees", async () => {
    const { threadId } = await createMentorship(admin(), { expertProfileId: profile.e1!, studentMembershipId: member.orphan!, purpose: WHY });
    let said = "agreed";
    try {
      await consentToMentorship(ctx("admin", "PARENT", null), threadId);
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
      said = error.key;
    }
    expect(said).toBe("mentoring.refuseSameAdult");
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id: threadId }, select: { status: true } })).status).toBe("PENDING_CONSENT");
  });

  it("TA-125: two approvals pressed together claim one place; the second is told the ask no longer waits", async () => {
    const threadId = await asks("p1", "e2");
    const before = await placesOf("e2");
    const both = await Promise.all([decideMentorRequest(admin(), threadId, { approve: true }), decideMentorRequest(principal(), threadId, { approve: true })]);
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    expect(both.find((r) => !r.ok)).toMatchObject({ ok: false, errorKey: "mentoring.noLongerWaiting" });
    expect(await placesOf("e2")).toBe(before + 1);
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id: threadId }, select: { status: true } })).status).toBe("PENDING_CONSENT");
  });

  it("TA-125: an approval and a decline pressed together end in one state, and the expert's count says the same", async () => {
    const threadId = await asks("p2", "e3");
    const before = await placesOf("e3");
    const heldBefore = await holding("e3");
    await Promise.all([decideMentorRequest(admin(), threadId, { approve: true }), decideMentorRequest(principal(), threadId, { approve: false, reason: "ZZ" })]);
    const status = (await db.mentorThread.findUniqueOrThrow({ where: { id: threadId }, select: { status: true } })).status;
    expect(["PENDING_CONSENT", "CLOSED"]).toContain(status);
    expect(await placesOf("e3")).toBe(before + (status === "PENDING_CONSENT" ? 1 : 0));
    expect((await holding("e3")) - heldBefore).toBe(status === "PENDING_CONSENT" ? 1 : 0);
  });

  it("TA-582: pairing a pupil with a mentor they have already asked for is refused while the ask waits on the office", async () => {
    const threadId = await asks("p3", "e1");
    const before = await placesOf("e1");
    let said = "paired";
    try {
      await createMentorship(admin(), { expertProfileId: profile.e1!, studentMembershipId: member.p3!, purpose: WHY });
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
      said = error.key;
    }
    expect(said).toBe("mentoring.askWaitingOffice");
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id: threadId }, select: { status: true } })).status).toBe("REQUESTED");
    expect(await placesOf("e1")).toBe(before);
    // The office's own approval is still the way through.
    expect(await decideMentorRequest(admin(), threadId, { approve: true })).toEqual({ ok: true });
  });

  it("TA-249: a mentor's message reaches a minor's phone with the title alone, while the in-app notice keeps the words; an adult's push keeps the preview", async () => {
    const thread = await db.mentorThread.create({ data: { schoolId, expertProfileId: profile.e1!, expertUserId: id.e1!, studentMembershipId: member.p4!, createdByMembershipId: member.admin!, purpose: WHY, status: "ACTIVE", parentConsentAt: new Date(), parentConsentUserId: id.guardian! }, select: { id: true } });
    const words = `ZZ meet me after school ${STAMP}`;
    pushed.length = 0;
    await postMentorMessage(ctx("e1", "EXPERT", null), thread.id, words);
    const toPupil = pushed.filter((p) => p.userId === id.p4);
    expect(toPupil).toHaveLength(1);
    expect(toPupil[0]!.body).toBe("");
    expect((await db.notification.findFirstOrThrow({ where: { userId: id.p4!, titleKey: "notifTitle.personSentYouMessage" }, select: { body: true } })).body).toContain(words);
    // The pupil's reply reaches the mentor, an adult, with its preview.
    pushed.length = 0;
    await postMentorMessage(ctx("p4", "STUDENT", schoolId), thread.id, `ZZ thank you ${STAMP}`);
    expect(pushed.find((p) => p.userId === id.e1)?.body).toContain(`ZZ thank you ${STAMP}`);
  });
});
