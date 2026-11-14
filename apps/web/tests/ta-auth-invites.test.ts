/**
 * Invitations (testing analysis of 13 November 2026, auth batch).
 *
 * TA-242 (Medium, Privacy): a pupil who joined by invitation was stored as an adult. The accept wrote the date of
 * birth on its three branches (a new account, a never-verified one taken back, an existing one) and never the minor
 * flag, so the column's default (false) stood: a teacher's message was pushed with its text to the child's lock
 * screen and the consent rules read the child as an adult. Now the flag is written as every other writer writes it:
 * from the date, and with none a pupil keeps the cautious default.
 *
 * TA-552 (Low, Functional): the office's Resend sent a parent's invitation in the staff invitation's words, with no
 * child's name. Now a PARENT invitation is resent in its own words.
 *
 * Every row is one this suite makes (a stamped ZZ school, @test.invalid accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { generateToken, hashPassword, hashToken } from "@/lib/crypto";
import { acceptInvite } from "@/app/invite/[token]/actions";
import { resendInviteFor } from "@/lib/invites";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taauth-inv-${who}-${STAMP}@test.invalid`;
const PASSWORD = `Zz-taauth-${STAMP}-Kingfisher`;
// A documentation-range address (2001:db8::/32) under the prefix tests/setup.ts leaves alone, so a second vitest
// process's set-up cannot wipe this suite's per-address bucket while it is counting.
const CALLER = `2001:db8:7a:78:${Math.floor(STAMP / 65536).toString(16).slice(-4)}:${(STAMP % 65536).toString(16)}::1`;
const ids: Record<string, string> = {};
let admin: ActiveContext & { schoolId: string };

function yearsAgo(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().slice(0, 10);
}

async function invite(who: string, role = "STUDENT", extra: { studentMembershipId?: string; relation?: string } = {}): Promise<{ id: string; token: string }> {
  const token = generateToken();
  const row = await db.invite.create({
    data: { schoolId: ids.school!, role, email: MAIL(who), tokenHash: hashToken(token), status: "PENDING", expiresAt: new Date(Date.now() + 14 * 86_400_000), ...extra },
    select: { id: true },
  });
  return { id: row.id, token };
}

async function minor(who: string): Promise<boolean> {
  return (await db.user.findUniqueOrThrow({ where: { email: MAIL(who) }, select: { isMinor: true } })).isMinor;
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Auth Invites ${STAMP}`, slug: `zz-taauth-inv-${STAMP}`, code: `ZTAI${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TA Auth Invites Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" } });
  ids.pupil = (await db.user.create({ data: { name: "ZZ TA Auth Amara", email: MAIL("pupil"), prefs: "{}", isMinor: true }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", studentCode: `STU-ZTAI-${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  __resetCookies();
  __setHeaders({ "x-forwarded-for": CALLER });
  await createSession(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
  admin = (await getSession()) as ActiveContext & { schoolId: string };
  __resetCookies();
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const members = await db.membership.findMany({ where: { schoolId: ids.school! }, select: { userId: true } });
  const made = await db.user.findMany({ where: { email: { startsWith: "zz-taauth-inv-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = [...new Set([...members.map((m) => m.userId), ...made.map((u) => u.id)])];
  const invites = await db.invite.findMany({ where: { schoolId: ids.school! }, select: { id: true } });
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: CALLER } }, { bucket: { contains: "zz-taauth-inv-" } }, ...invites.map((i) => ({ bucket: `invite-resend:${i.id}` }))] } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school! } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school! }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: ids.school! } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-taauth-inv-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe.sequential("TA-242: a pupil who joins by invitation is a minor unless a date says otherwise", () => {
  it("TA-242: a new account with no date of birth is stored as a minor", async () => {
    const { token } = await invite("new-undated");
    expect(await acceptInvite({ token, name: "ZZ TA Auth Newcomer", password: PASSWORD })).toMatchObject({ ok: true });
    expect(await minor("new-undated")).toBe(true);
  });

  it("TA-242: a new account dated thirteen years back is a minor, and nineteen years back is not", async () => {
    __resetCookies();
    const young = await invite("new-young");
    expect(await acceptInvite({ token: young.token, name: "ZZ TA Auth Young", password: PASSWORD, birthdate: yearsAgo(13) })).toMatchObject({ ok: true });
    expect(await minor("new-young")).toBe(true);
    __resetCookies();
    const grown = await invite("new-grown");
    expect(await acceptInvite({ token: grown.token, name: "ZZ TA Auth Grown", password: PASSWORD, birthdate: yearsAgo(19) })).toMatchObject({ ok: true });
    expect(await minor("new-grown")).toBe(false);
  });

  it("TA-242: a never-verified account taken back with no date is stored as a minor", async () => {
    __resetCookies();
    await db.user.create({ data: { name: "ZZ TA Auth Stranger", email: MAIL("reclaim"), passwordHash: await hashPassword(`${PASSWORD}-other`), prefs: "{}" } });
    const { token } = await invite("reclaim");
    expect(await acceptInvite({ token, name: "ZZ TA Auth Reclaimer", password: PASSWORD })).toMatchObject({ ok: true });
    expect(await minor("reclaim")).toBe(true);
  });

  it("TA-242: an existing account with no date anywhere is stored as a minor, and a date given there sets the flag from it", async () => {
    __resetCookies();
    await db.user.create({ data: { name: "ZZ TA Auth Holder", email: MAIL("holder"), passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: new Date(), prefs: "{}" } });
    const first = await invite("holder");
    expect(await acceptInvite({ token: first.token, name: "ZZ TA Auth Holder", password: PASSWORD })).toMatchObject({ ok: true });
    expect(await minor("holder")).toBe(true);

    __resetCookies();
    await db.user.create({ data: { name: "ZZ TA Auth Adult Holder", email: MAIL("holder-dated"), passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: new Date(), prefs: "{}" } });
    const second = await invite("holder-dated");
    expect(await acceptInvite({ token: second.token, name: "ZZ TA Auth Adult Holder", password: PASSWORD, birthdate: yearsAgo(19) })).toMatchObject({ ok: true });
    expect(await minor("holder-dated")).toBe(false);
  });

  it("TA-242: a teacher invited with no date keeps the adult default", async () => {
    __resetCookies();
    const { token } = await invite("teacher", "TEACHER");
    expect(await acceptInvite({ token, name: "ZZ TA Auth Teacher", password: PASSWORD })).toMatchObject({ ok: true });
    expect(await minor("teacher")).toBe(false);
  });
});

describe.sequential("TA-552: a parent's invitation is resent in its own words", () => {
  it("TA-552: the resent mail names the child, as the first mail did", async () => {
    const { id } = await invite("guardian", "PARENT", { studentMembershipId: ids.pupilM!, relation: "PARENT" });
    expect(await resendInviteFor(admin, id)).toEqual({ ok: true });
    const mail = await db.outboundEmail.findFirst({ where: { to: MAIL("guardian") }, orderBy: { createdAt: "desc" }, select: { subject: true, text: true } });
    expect(mail?.subject).toContain("ZZ TA Auth Amara");
    expect(mail?.text).toContain("ZZ TA Auth Amara");
  });

  it("TA-552: a staff invitation is still resent as a staff invitation", async () => {
    const { id } = await invite("staff", "TEACHER");
    expect(await resendInviteFor(admin, id)).toEqual({ ok: true });
    const mail = await db.outboundEmail.findFirst({ where: { to: MAIL("staff") }, orderBy: { createdAt: "desc" }, select: { subject: true } });
    expect(mail?.subject).toBeTruthy();
    expect(mail?.subject).not.toContain("ZZ TA Auth Amara");
  });
});
