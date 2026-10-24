/**
 * QA-01 of the QA campaign of 24 October 2026 (SEC-1, High): a staff expert-invite link took over any
 * unverified account.
 *
 * The chain it closes: a teacher at any school called POST /api/v1/staff/experts/invite with somebody else's
 * address and was answered the invitation's live link; opening it and typing that address and a password ran
 * the invite page's "reclaim an unproved address" branch, which set the inviter's password on the victim's
 * account, marked the address proved, revoked the victim's sessions and signed the inviter in, the victim's
 * memberships intact. Two fences now, either of which breaks the chain:
 *
 *   1. the door answers the invitation's id and whether the mail went, never the token or the link — the
 *      mailbox is the only place the link exists;
 *   2. the acceptance never sets a password on an account that already exists unless that account is the one
 *      the operator's approval of an application made FOR THIS INVITATION (no password, never proved, created by
 *      the same flow that mailed the link). Anybody else's existing account is attached only by its signed-in
 *      owner; an owner who cannot sign in resets the password from the login page first.
 *
 * Runs on its own ZZ school and @test.invalid people, removed by id at the end.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { expertInvitedSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { decideExpertApplication } from "@/lib/expert-applications";
import { readExpertInvite } from "@/lib/experts";
import { acceptInvite } from "@/app/expert/invite/[token]/actions";
import { POST as invitePost } from "@/app/api/v1/staff/experts/invite/route";
import type { ActiveContext } from "@/lib/session";
import { __resetCookies } from "./stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const mail = (who: string) => `zz-fixa-${who}-${STAMP}@test.invalid`;
const OLD_PASSWORD = "lantern-quartz-27-river";
const NEW_PASSWORD = "harbour-cobalt-58-thistle";

let schoolId = "";
const id: Record<string, string> = {};

const json = (body: unknown) => new Request("http://localhost/api/v1/staff/experts/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const operator = (): ActiveContext =>
  ({ sessionId: "t", membershipId: null, schoolId: null, role: null, user: { id: id.operator!, name: "ZZ FixA Operator", preferredName: null, email: mail("operator"), avatarKey: null, isMinor: false, isSuperuser: true, isAppAdmin: false } }) as ActiveContext;

/** The token as the mailbox holds it: the newest invitation mailed to that address. */
async function tokenFromMailbox(to: string): Promise<string> {
  const sent = await db.outboundEmail.findFirstOrThrow({ where: { to, purpose: "INVITE" }, orderBy: { createdAt: "desc" } });
  const token = /\/expert\/invite\/([A-Za-z0-9_-]+)/.exec(sent.text)?.[1];
  if (!token) throw new Error("no link in the mail");
  return token;
}

/** The invite page's action, signed out unless a session is in the jar; a redirect is its success. */
async function accept(token: string, email: string) {
  try {
    return await acceptInvite(token, { name: "ZZ FixA Holder", email, password: NEW_PASSWORD, headline: "ZZ robotics coach" });
  } catch (error) {
    const digest = String((error as { digest?: string }).digest ?? "");
    if (digest.startsWith("NEXT_REDIRECT")) return { ok: true, redirected: digest.split(";")[2] ?? digest };
    throw error;
  }
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ FixA Invite ${STAMP}`, slug: `zz-fixa-inv-${STAMP}`, code: `ZFA${String(STAMP).slice(-6)}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const person = async (key: string, data: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ FixA ${key}`, email: mail(key), isTestFixture: true, ...data }, select: { id: true } })).id;
  };
  await person("teacher", { emailVerifiedAt: new Date(), passwordHash: await hashPassword(OLD_PASSWORD) });
  // The victim: a pupil who signed up and never opened the verification mail.
  await person("victim", { passwordHash: await hashPassword(OLD_PASSWORD), emailVerifiedAt: null });
  await person("owner", { passwordHash: await hashPassword(OLD_PASSWORD), emailVerifiedAt: null });
  await person("operator", { isSuperuser: true, emailVerifiedAt: new Date() });
  id.teacherM = (await db.membership.create({ data: { userId: id.teacher!, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  id.victimM = (await db.membership.create({ data: { userId: id.victim!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFAV${STAMP}` }, select: { id: true } })).id;
  id.ownerM = (await db.membership.create({ data: { userId: id.owner!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFAO${STAMP}` }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = (await db.user.findMany({ where: { email: { startsWith: "zz-fixa-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((u) => u.id);
  const invites = (await db.expertInvite.findMany({ where: { email: { startsWith: "zz-fixa-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((i) => i.id);
  await db.expertApplication.deleteMany({ where: { email: { startsWith: "zz-fixa-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.expertInvite.deleteMany({ where: { id: { in: invites } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-fixa-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }, { targetId: { in: [...users, ...invites] } }] } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("QA-01 · the staff expert-invite door", () => {
  it("answers the invitation's id and that the mail went, never the token or the link; the mailbox alone holds it", async () => {
    __resetCookies();
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect((await invitePost(json({ name: "ZZ FixA name only" }))).status).toBe(422);
    const res = await invitePost(json({ email: mail("victim"), name: "ZZ FixA Victim" }));
    expect(res.status).toBe(201);
    const raw = await res.text();
    const body = expertInvitedSchema.parse(JSON.parse(raw));
    expect(body).toMatchObject({ sent: true });
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(["expiresAt", "inviteId", "sent"]);
    const token = await tokenFromMailbox(mail("victim"));
    expect(raw).not.toContain(token);
    expect(raw).not.toMatch(/\/expert\/invite\//);
    expect(await readExpertInvite(token)).toMatchObject({ ok: true, inviteId: body.inviteId, email: mail("victim") });
  });
});

describe("QA-01 · the invite page's acceptance", () => {
  it("never sets a password on somebody's existing unproved account, even holding a good link to that address", async () => {
    // The attacker is staff somewhere and invites the victim's address (the old door handed back the link).
    __resetCookies();
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect((await invitePost(json({ email: mail("victim") }))).status).toBe(201);
    const token = await tokenFromMailbox(mail("victim"));
    // The victim is signed in somewhere; whatever happens to the link, that session must survive.
    __resetCookies();
    await createSession(id.victim!, { schoolId, role: "STUDENT" });
    const victimSessions = await db.session.count({ where: { userId: id.victim!, revokedAt: null } });
    __resetCookies(); // the holder of the link is signed out (or signed in as themselves, which is not the victim)
    const result = await accept(token, mail("victim"));
    expect(result).toEqual({ ok: false, errorKey: "expertInviteClaim.accountExists" });
    const victim = await db.user.findUniqueOrThrow({ where: { id: id.victim! }, select: { passwordHash: true, emailVerifiedAt: true, expertProfile: { select: { id: true } } } });
    expect(await verifyPassword(victim.passwordHash!, OLD_PASSWORD)).toBe(true);
    expect(victim.emailVerifiedAt).toBeNull();
    expect(victim.expertProfile).toBeNull();
    expect(await db.session.count({ where: { userId: id.victim!, revokedAt: null } })).toBe(victimSessions);
    expect((await readExpertInvite(token)).ok).toBe(true); // not spent: its rightful holder may still sign in and use it
    // The same refusal while signed in as somebody else.
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect(await accept(token, mail("victim"))).toEqual({ ok: false, errorKey: "expertInviteClaim.accountExists" });
    __resetCookies();
  });

  it("the signed-in owner of an existing account attaches the profile, and nothing about the account changes", async () => {
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect((await invitePost(json({ email: mail("owner") }))).status).toBe(201);
    const token = await tokenFromMailbox(mail("owner"));
    __resetCookies();
    await createSession(id.owner!, { schoolId, role: "STUDENT" });
    expect(await accept(token, mail("owner"))).toMatchObject({ ok: true });
    const owner = await db.user.findUniqueOrThrow({ where: { id: id.owner! }, select: { passwordHash: true, expertProfile: { select: { id: true } } } });
    expect(owner.expertProfile).not.toBeNull();
    expect(await verifyPassword(owner.passwordHash!, OLD_PASSWORD)).toBe(true);
    __resetCookies();
  });

  it("the account the operator's approval made for this invitation is finished by its link: the password set, the address proved", async () => {
    const app = await db.expertApplication.create({ data: { name: "ZZ FixA Applicant", email: mail("applicant"), phone: "+919876500091", city: "Pune", headline: "ZZ astronomy nights", yearsExperience: 3, bio: "ZZ fixture applicant for the takeover test.", offering: "SESSIONS", declarationAt: new Date() }, select: { id: true } });
    const decided = await decideExpertApplication(operator(), app.id, { decision: "APPROVE" });
    expect(decided).toMatchObject({ ok: true, status: "APPROVED" });
    const made = await db.user.findUniqueOrThrow({ where: { email: mail("applicant") }, select: { id: true, passwordHash: true, emailVerifiedAt: true } });
    expect(made).toMatchObject({ passwordHash: null, emailVerifiedAt: null });
    __resetCookies();
    expect(await accept(await tokenFromMailbox(mail("applicant")), mail("applicant"))).toMatchObject({ ok: true });
    const after = await db.user.findUniqueOrThrow({ where: { id: made.id }, select: { passwordHash: true, emailVerifiedAt: true } });
    expect(after.emailVerifiedAt).not.toBeNull();
    expect(await verifyPassword(after.passwordHash!, NEW_PASSWORD)).toBe(true);
    __resetCookies();
  });

  it("an approval for an address that already had an unproved account does not let the link set its password", async () => {
    await db.user.create({ data: { name: "ZZ FixA Prior", email: mail("prior"), passwordHash: await hashPassword(OLD_PASSWORD), emailVerifiedAt: null, isTestFixture: true } });
    const app = await db.expertApplication.create({ data: { name: "ZZ FixA Prior", email: mail("prior"), phone: "+919876500092", city: "Pune", headline: "ZZ prior account", yearsExperience: 2, bio: "ZZ fixture applicant with an account already.", offering: "SESSIONS", declarationAt: new Date() }, select: { id: true } });
    expect(await decideExpertApplication(operator(), app.id, { decision: "APPROVE" })).toMatchObject({ ok: true, userId: null });
    __resetCookies();
    expect(await accept(await tokenFromMailbox(mail("prior")), mail("prior"))).toEqual({ ok: false, errorKey: "expertInviteClaim.accountExists" });
    const prior = await db.user.findUniqueOrThrow({ where: { email: mail("prior") }, select: { passwordHash: true, emailVerifiedAt: true } });
    expect(await verifyPassword(prior.passwordHash!, OLD_PASSWORD)).toBe(true);
    expect(prior.emailVerifiedAt).toBeNull();
  });
});
