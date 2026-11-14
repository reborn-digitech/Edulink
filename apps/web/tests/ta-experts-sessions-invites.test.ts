/**
 * TA-563 (testing analysis of 13 November 2026, Medium): a school's admin or any teacher could make the platform mail
 * an expert invitation to any address with no cap. inviteExpert wrote an ExpertInvite and called sendExpertInvite on
 * every call, and neither the door nor the action counted anything, where the school's own invitations stop at
 * INVITE_EMAILS_DAILY.
 *
 * Two scratch ZZ schools of this suite's own (the stamp in every name), removed afterwards; the mail is stood in for,
 * so nothing leaves the machine. EXPECTED ONCE FIXED: the school's day of expert invitations is capped as its own
 * invitations are, and one member of staff is held to a few an hour; a refused call writes no row and sends no mail.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const mailed = vi.hoisted(() => [] as string[]);
vi.mock("@/lib/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email")>()),
  sendExpertInvite: async (to: string) => {
    mailed.push(to);
  },
}));

import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { inviteExpert } from "@/lib/experts";
import { EXPERT_INVITES_PER_PERSON, INVITE_EMAILS_DAILY } from "@/lib/rate-limit";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const school: Record<string, string> = {};
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const ctx = (key: string, schoolKey: string): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school[schoolKey]!, role: "TEACHER", user: { id: id[key]!, name: `ZZ TA esi ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const address = (k: string | number) => `zz-taesi-${k}-${STAMP}@test.invalid`;
async function said(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "sent";
  } catch (error) {
    if (error instanceof AccessError) return error.key;
    throw error;
  }
}

beforeAll(async () => {
  for (const k of ["full", "fresh"]) {
    school[k] = (await db.school.create({ data: { name: `ZZ TA esi ${k} ${STAMP}`, slug: `zz-taesi-${k}-${STAMP}`, code: `ZZESI${k === "full" ? "A" : "B"}${String(STAMP).slice(-6)}`, contactEmail: address(`school-${k}`), isTestFixture: true }, select: { id: true } })).id;
  }
  for (const [key, s] of [["t1", "full"], ["t2", "fresh"]] as const) {
    id[key] = (await db.user.create({ data: { name: `ZZ TA esi ${key} ${STAMP}`, email: address(key), isTestFixture: true }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId: school[s]!, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  }
  // The full school has already sent a day's worth of expert invitations.
  await db.expertInvite.createMany({ data: Array.from({ length: INVITE_EMAILS_DAILY.limit }, (_, i) => ({ schoolId: school.full!, tokenHash: `zz-taesi-${STAMP}-${i}`, email: address(`old-${i}`), expiresAt: new Date(Date.now() + 86_400_000) })) });
}, 120_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: Object.values(school) } } });
  await db.user.deleteMany({ where: { id: { in: Object.values(id) } } });
  await db.$disconnect();
}, 120_000);

describe("expert invitations are counted", () => {
  it("TA-563: a school whose day of invitations is spent sends no more expert invitations, and the refused call writes no row and sends no mail", async () => {
    mailed.length = 0;
    expect(await said(inviteExpert(ctx("t1", "full"), { email: address("past-the-cap") }))).toBe("invites.dailyCapToday");
    expect(await db.expertInvite.count({ where: { schoolId: school.full! } })).toBe(INVITE_EMAILS_DAILY.limit);
    expect(mailed).toEqual([]);
  });

  it("TA-563: one member of staff is held to a few expert invitations an hour", async () => {
    mailed.length = 0;
    for (let i = 0; i < EXPERT_INVITES_PER_PERSON.limit; i += 1) expect(await said(inviteExpert(ctx("t2", "fresh"), { email: address(`new-${i}`) }))).toBe("sent");
    expect(await said(inviteExpert(ctx("t2", "fresh"), { email: address("one-too-many") }))).toBe("expertInviteClaim.tooManyInvites");
    expect(await db.expertInvite.count({ where: { schoolId: school.fresh! } })).toBe(EXPERT_INVITES_PER_PERSON.limit);
    expect(mailed).toHaveLength(EXPERT_INVITES_PER_PERSON.limit);
  });
});
