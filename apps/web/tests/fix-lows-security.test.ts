/**
 * The Low security findings of the QA campaign of 24 October 2026, builder A
 * (docs/qa/campaign-2026-10-24/REPORT.md). Each block failed before its fix:
 *
 * QA-21  Accepting a school invitation with the account's password minted a
 *        session without the second step, for an account with two-step
 *        sign-in on. Now the invitation is accepted and the code is asked at
 *        /login/code, which lands the person in the school they joined; a
 *        reclaimed (never-verified) account loses the squatter's second step.
 * QA-24  A password-reset request wrote the code and awaited the mail before
 *        answering, only when the account existed. Now the account's half
 *        runs after the answer.
 * QA-25  The school's and the recruiter's sign-ups refused a taken address on
 *        the spot. Now a form in order is answered the same either way, with no
 *        session; a free address gets its account after the answer, and the
 *        holder of a taken one is told by email.
 *
 * Every row is a ZZ row made here (@test.invalid addresses, "ZZ FixLowsA"
 * schools) and deleted by id afterwards; audit rows are left, as the log is
 * append-only.
 */
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { generateToken, hashPassword, hashToken } from "@/lib/crypto";
import { seal } from "@/lib/secret-box";
import { generateSecret, totpCode } from "@/lib/totp";
import { TWO_FACTOR_COOKIE } from "@/lib/two-factor";
import { SESSION_COOKIE } from "@/lib/constants";
import { createSession } from "@/lib/session";
import { requestPasswordReset } from "@/lib/passwords";
import { completeRecruiterRegistration, registerRecruiter } from "@/lib/recruiters";
import { acceptInvite } from "@/app/invite/[token]/actions";
import { completeTwoFactor } from "@/app/login/code/actions";
import * as registerActions from "@/app/register/actions";
import { POST as recruiterRegisterPost } from "@/app/api/v1/auth/recruiter/register/route";
import { __resetCookies, __setHeaders, cookies } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const PASSWORD = `Zz-fixlowsa-${STAMP}-Heron`;
const mail = (tag: string) => `zz-fixlowsa-${tag}-${STAMP}@test.invalid`;

const schoolIds: string[] = [];
const userIds: string[] = [];

let schoolCount = 0;
async function makeSchool(tag: string): Promise<string> {
  schoolCount += 1;
  const school = await db.school.create({
    data: { name: `ZZ FixLowsA ${tag} ${STAMP}`, slug: `zz-fixlowsa-${tag}-${STAMP}`, code: `ZFL${schoolCount}${String(STAMP).slice(-5)}`, contactEmail: mail(`${tag}-office`), timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolIds.push(school.id);
  return school.id;
}

async function makeUser(tag: string, opts: { verified?: boolean; password?: boolean; totpSecret?: string } = {}): Promise<{ id: string; email: string }> {
  const email = mail(tag);
  const user = await db.user.create({
    data: {
      email,
      name: `ZZ FixLowsA ${tag}`,
      passwordHash: opts.password === false ? null : await hashPassword(PASSWORD),
      emailVerifiedAt: opts.verified === false ? null : new Date(),
    },
    select: { id: true },
  });
  userIds.push(user.id);
  if (opts.totpSecret) {
    await db.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: seal(opts.totpSecret, `${user.id}:totp`), totpEnabledAt: new Date(), totpRecoveryHashes: [], totpLastStep: null },
    });
  }
  return { id: user.id, email };
}

async function inviteTo(schoolId: string, email: string, role = "TEACHER"): Promise<string> {
  const token = generateToken();
  await db.invite.create({ data: { schoolId, role, email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86_400_000) } });
  return token;
}

/** The deferred half runs detached in a test (no request for `after`); wait for what it writes. */
async function until<T>(read: () => Promise<T | null | undefined>, ms = 15_000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (value) return value;
    if (Date.now() > end) throw new Error("the deferred work never landed");
    await new Promise((r) => setTimeout(r, 100));
  }
}

beforeAll(() => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const made = await db.user.findMany({ where: { email: { startsWith: "zz-fixlowsa-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const ids = [...new Set([...userIds, ...made.map((u) => u.id)])];
  const madeSchools = await db.school.findMany({ where: { name: { startsWith: "ZZ FixLowsA ", endsWith: String(STAMP) } }, select: { id: true } });
  const sids = [...new Set([...schoolIds, ...madeSchools.map((s) => s.id)])];
  await db.recruiterProfile.deleteMany({ where: { userId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.twoFactorChallenge.deleteMany({ where: { userId: { in: ids } } });
  await db.authToken.deleteMany({ where: { userId: { in: ids } } });
  await db.invite.deleteMany({ where: { schoolId: { in: sids } } });
  await db.membership.deleteMany({ where: { schoolId: { in: sids } } });
  await db.schoolModule.deleteMany({ where: { schoolId: { in: sids } } }).catch(() => undefined);
  await db.school.deleteMany({ where: { id: { in: sids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-fixlowsa-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: `zz-fixlowsa-` } }, ...ids.map((id) => ({ bucket: { endsWith: id } }))] } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("QA-21: a school invitation accepted by an account with two-step sign-in on", () => {
  it("⚠ accepts the invitation but mints no session: the code is asked next, and passing it lands in the school joined", async () => {
    __resetCookies();
    const home = await makeSchool("home");
    const joining = await makeSchool("join");
    const secret = generateSecret();
    const holder = await makeUser("totp-holder", { totpSecret: secret });
    await db.membership.create({ data: { userId: holder.id, schoolId: home, role: "ADMIN", status: "ACTIVE" } });
    const token = await inviteTo(joining, holder.email);
    const sessionsBefore = await db.session.count({ where: { userId: holder.id } });

    const accepted = await acceptInvite({ token, name: "ZZ FixLowsA totp-holder", password: PASSWORD, subjects: [] });

    expect(accepted).toMatchObject({ ok: true, twoFactor: true, redirectTo: "/login/code" });
    const jar = await cookies();
    expect(jar.get(SESSION_COOKIE), "no session on the password alone").toBeUndefined();
    expect(jar.get(TWO_FACTOR_COOKIE)?.value).toBeTruthy();
    expect(await db.session.count({ where: { userId: holder.id } })).toBe(sessionsBefore);
    // The invitation is the owner's to accept, and the password proved the owner.
    expect(await db.membership.count({ where: { userId: holder.id, schoolId: joining, role: "TEACHER", status: "ACTIVE" } })).toBe(1);
    expect(await db.invite.findFirstOrThrow({ where: { schoolId: joining }, select: { status: true } })).toEqual({ status: "ACCEPTED" });
    expect(await db.twoFactorChallenge.findFirstOrThrow({ where: { userId: holder.id, usedAt: null }, select: { via: true } })).toEqual({ via: "invite" });

    const second = await completeTwoFactor({ code: totpCode(secret) });
    expect(second).toMatchObject({ ok: true, redirectTo: "/teacher" });
    const session = await db.session.findFirstOrThrow({ where: { userId: holder.id }, orderBy: { createdAt: "desc" }, select: { activeSchoolId: true, activeRole: true } });
    expect(session).toEqual({ activeSchoolId: joining, activeRole: "TEACHER" });
    __resetCookies();
  });

  it("a person who arrived signed in as the holder passed the step for that session and is not asked again", async () => {
    __resetCookies();
    const joining = await makeSchool("join2");
    const holder = await makeUser("totp-signedin", { totpSecret: generateSecret() });
    const token = await inviteTo(joining, holder.email);
    await createSession(holder.id);
    const accepted = await acceptInvite({ token, name: "ZZ FixLowsA totp-signedin", subjects: [] });
    expect(accepted).toMatchObject({ ok: true, redirectTo: "/teacher" });
    expect(accepted.twoFactor).toBeUndefined();
    __resetCookies();
  });

  it("⚠ a reclaimed, never-verified account keeps nothing of the squatter's second step: the reader of the mail is signed straight in", async () => {
    __resetCookies();
    const joining = await makeSchool("join3");
    const squatted = await makeUser("totp-squatted", { verified: false, totpSecret: generateSecret() });
    const token = await inviteTo(joining, squatted.email);
    const accepted = await acceptInvite({ token, name: "ZZ FixLowsA real owner", password: `${PASSWORD}-owner`, subjects: [] });
    expect(accepted).toMatchObject({ ok: true, redirectTo: "/teacher" });
    expect(accepted.twoFactor).toBeUndefined();
    const row = await db.user.findUniqueOrThrow({ where: { id: squatted.id }, select: { totpSecretEnc: true, totpEnabledAt: true, emailVerifiedAt: true } });
    expect(row).toMatchObject({ totpSecretEnc: null, totpEnabledAt: null });
    expect(row.emailVerifiedAt).not.toBeNull();
    expect((await cookies()).get(SESSION_COOKIE)?.value).toBeTruthy();
    __resetCookies();
  });
});

/* -------------------------------------------------------------------------- */

describe("QA-24: a password-reset request answers before anything depends on the account", () => {
  it("⚠ answers a registered and an unknown address alike, before a code exists; the deferred half writes and sends it", async () => {
    const known = await makeUser("reset-known");
    const tasks: (() => Promise<void>)[] = [];
    const defer = (task: () => Promise<void>) => void tasks.push(task);

    const forKnown = await requestPasswordReset(known.email, { defer });
    const forNobody = await requestPasswordReset(mail("reset-nobody"), { defer });
    expect(forKnown).toEqual(forNobody);
    expect(forKnown).toEqual({ ok: true, hint: "", channel: "EMAIL" });
    expect(tasks).toHaveLength(2);
    expect(await db.authToken.count({ where: { userId: known.id, purpose: "PASSWORD_RESET" } }), "nothing written before the answer").toBe(0);
    expect(await db.outboundEmail.count({ where: { to: known.email } })).toBe(0);

    for (const task of tasks) await task();
    expect(await db.authToken.count({ where: { userId: known.id, purpose: "PASSWORD_RESET", consumedAt: null } })).toBe(1);
    expect(await db.outboundEmail.count({ where: { to: known.email, purpose: "PASSWORD_RESET" } })).toBe(1);
    expect(await db.outboundEmail.count({ where: { to: mail("reset-nobody") } })).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */

const schoolForm = (email: string, name: string) => ({
  school: { name, contactEmail: mail("contact"), timezone: "Asia/Kolkata" },
  kind: "SCHOOL",
  streams: [],
  admin: { name: "ZZ FixLowsA Founder", email, password: `${PASSWORD}-Founder` },
  acceptedTerms: true,
});

describe("QA-25: the sign-ups answer the same whether or not the address has an account", () => {
  it("⚠ the school's registration: one answer and no session either way; a free address gets its school, a taken one's holder is told", async () => {
    const holder = await makeUser("school-holder");
    const freeEmail = mail("school-free");
    const takenName = `ZZ FixLowsA Taken ${STAMP}`;
    const freeName = `ZZ FixLowsA Free ${STAMP}`;

    __resetCookies();
    const taken = await registerActions.registerSchool(schoolForm(holder.email, takenName));
    expect((await cookies()).get(SESSION_COOKIE)).toBeUndefined();
    __resetCookies();
    const free = await registerActions.registerSchool(schoolForm(freeEmail, freeName));
    expect((await cookies()).get(SESSION_COOKIE)).toBeUndefined();

    // The same answer, word for word but the address the caller typed.
    expect(taken.ok).toBe(true);
    expect(Object.keys(taken).sort()).toEqual(Object.keys(free).sort());
    expect(taken.sent!.replace(holder.email, "<email>")).toBe(free.sent!.replace(freeEmail, "<email>"));
    expect(taken).not.toHaveProperty("schoolCode");

    // After the answer: the holder is told, nothing is made under their address; the free address has its school.
    const notice = await until(() => db.outboundEmail.findFirst({ where: { to: holder.email, purpose: "SIGNUP_EXISTING" }, select: { subject: true, text: true } }));
    expect(notice.subject).toBe("Someone tried to make an account with your email");
    expect(notice.text).toContain("register a new school");
    const made = await until(() => db.school.findFirst({ where: { name: freeName }, select: { id: true } }));
    schoolIds.push(made.id);
    const founder = await until(() => db.user.findUnique({ where: { email: freeEmail }, select: { id: true, emailVerifiedAt: true } }));
    userIds.push(founder.id);
    expect(founder.emailVerifiedAt).toBeNull();
    expect(await db.membership.count({ where: { userId: founder.id, schoolId: made.id, role: "ADMIN" } })).toBe(1);
    await until(() => db.outboundEmail.findFirst({ where: { to: freeEmail, purpose: "EMAIL_VERIFY" }, select: { id: true } }));
    // Give a stray deferred write the time it would need, then look for a school under the holder's address.
    await new Promise((r) => setTimeout(r, 500));
    expect(await db.school.count({ where: { name: takenName } })).toBe(0);
    expect(await db.membership.count({ where: { userId: holder.id } })).toBe(0);
  });

  it("⚠ the wizard's live 'is this address free?' is gone", () => {
    expect(Object.keys(registerActions)).not.toContain("checkEmailAvailable");
  });

  it("the recruiter's lib: the same {ok: true} for both, and the deferred half makes one account or tells the holder", async () => {
    const holder = await makeUser("rec-holder");
    const freeEmail = mail("rec-free");
    const tasks: (() => Promise<void>)[] = [];
    const defer = (task: () => Promise<void>) => void tasks.push(task);
    const form = (email: string) => ({ name: "ZZ FixLowsA Recruiter", email, password: `${PASSWORD}-Recruit`, companyName: "ZZ FixLowsA Co" });

    expect(await registerRecruiter(form(holder.email), "en", { defer })).toEqual({ ok: true });
    expect(await registerRecruiter(form(freeEmail), "en", { defer })).toEqual({ ok: true });
    expect(await db.user.count({ where: { email: freeEmail } }), "nothing before the answer").toBe(0);
    for (const task of tasks) await task();
    expect(await db.recruiterProfile.count({ where: { userId: holder.id } })).toBe(0);
    expect(await db.outboundEmail.count({ where: { to: holder.email, purpose: "SIGNUP_EXISTING" } })).toBe(1);
    const created = await db.user.findUniqueOrThrow({ where: { email: freeEmail }, select: { id: true, recruiterProfile: { select: { companyName: true } } } });
    userIds.push(created.id);
    expect(created.recruiterProfile?.companyName).toBe("ZZ FixLowsA Co");

    // A second try for the same address finds it taken; the holder is told, at most three times a day.
    for (let i = 0; i < 4; i++) expect(await completeRecruiterRegistration(form(freeEmail), "en")).toEqual({ outcome: "taken" });
    expect(await db.outboundEmail.count({ where: { to: freeEmail, purpose: "SIGNUP_EXISTING" } })).toBe(3);
  });

  it("⚠ the recruiter's door: 202 {sent: true} and no session for a taken and a free address alike; a form out of order is still 422", async () => {
    const holder = await makeUser("door-holder");
    const freeEmail = mail("door-free");
    const post = (email: string, password = `${PASSWORD}-Door`) =>
      recruiterRegisterPost(new Request("http://localhost/api/v1/auth/recruiter/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "ZZ FixLowsA Door", email, password, companyName: "ZZ FixLowsA Door Co" }) }));

    const taken = await post(holder.email);
    const free = await post(freeEmail);
    expect([taken.status, free.status]).toEqual([202, 202]);
    expect(await taken.json()).toEqual({ sent: true });
    expect(await free.json()).toEqual({ sent: true });
    const made = await until(() => db.user.findUnique({ where: { email: freeEmail }, select: { id: true } }));
    userIds.push(made.id);
    await until(() => db.outboundEmail.findFirst({ where: { to: holder.email, purpose: "SIGNUP_EXISTING" }, select: { id: true } }));
    expect(await db.session.count({ where: { userId: { in: [made.id, holder.id] } } })).toBe(0);

    const weak = await post(mail("door-weak"), "short");
    expect(weak.status).toBe(422);
  });
});
