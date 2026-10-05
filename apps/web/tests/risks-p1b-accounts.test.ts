/**
 * The risks batch's package 1B, the outside accounts (5 Oct 2026; docs/audit-2026-10-05/08-remaining-risks.md):
 *   - G4-28: a recruiter or an expert the operator closed is told — by a sentence at sign-in, and by email when it
 *     happens — and refused at login; an expert can now be closed at all (ExpertProfile.disabledAt), and a closed
 *     one is found by no school; a person who also teaches somewhere still signs in;
 *   - G4-5: the placement directory is a recruiter's read (and the placement cell's) — a student, a parent, an
 *     expert and a signed-in stranger read nothing through it;
 *   - G4-6: a recruiter whose address is not yet confirmed reads no drive and no college.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { hashPassword } from "@/lib/crypto";
import { signInWithPassword } from "@/lib/auth-login";
import { closedOutsideAccount, resolveContext } from "@/lib/resolve-context";
import { setExpertAccess, setRecruiterStanding } from "@/lib/operator-college";
import { listMarketplace } from "@/lib/experts";
import { recruiterColleges, recruiterDrive, recruiterDrives } from "@/lib/placement-recruiter";
import { translator } from "@/lib/i18n/dictionary";
import { POST as expertAccessPost } from "@/app/api/v1/operator/experts/[profileId]/access/route";
import { GET as collegesGet } from "@/app/api/v1/recruiter/colleges/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-p1b-acct-${who.toLowerCase()}-${STAMP}@test.invalid`;
const PASSWORD = `Zz-${STAMP}-Kestrel-Orchard`;
const ids: Record<string, string> = {};
const users: string[] = [];
const en = translator("en");

async function user(who: string, extra: Record<string, unknown> = {}): Promise<string> {
  const id = (await db.user.create({ data: { name: `ZZ P1B ${who}`, email: MAIL(who), isMinor: false, isTestFixture: true, ...extra }, select: { id: true } })).id;
  users.push(id);
  ids[who] = id;
  return id;
}

async function as(userId: string, opts: { schoolId?: string | null; role?: string | null }): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: opts.schoolId ?? null, role: (opts.role ?? null) as never });
  return (await getSession())!;
}

beforeAll(async () => {
  const hash = await hashPassword(PASSWORD);
  ids.school = (await db.school.create({ data: { name: `ZZ P1B Acct School ${STAMP}`, slug: `zz-p1b-acct-${STAMP}`, code: `ZA${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  await user("operator", { isSuperuser: true });
  await user("recruiter", { passwordHash: hash, emailVerifiedAt: new Date() });
  await db.recruiterProfile.create({ data: { userId: ids.recruiter!, companyName: "ZZ P1B Hiring" } });
  await user("unverified", { passwordHash: hash });
  await db.recruiterProfile.create({ data: { userId: ids.unverified!, companyName: "ZZ P1B Unverified" } });
  await user("expert", { passwordHash: hash });
  ids.profile = (await db.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ P1B mentor", publishedAt: new Date() }, select: { id: true } })).id;
  await user("teacherExpert", { passwordHash: hash });
  ids.teacherProfile = (await db.expertProfile.create({ data: { userId: ids.teacherExpert!, headline: "ZZ P1B teaching mentor", publishedAt: new Date() }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.teacherExpert!, schoolId: ids.school!, role: "TEACHER", status: "ACTIVE" } });
  await user("admin");
  await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" } });
  await user("student");
  await db.membership.create({ data: { userId: ids.student!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" } });
  await user("stranger");
});

afterAll(async () => {
  __resetCookies();
  const emails = ["recruiter", "unverified", "expert", "teacherExpert"].map((w) => MAIL(w));
  await db.outboundEmail.deleteMany({ where: { to: { in: emails } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("operator") } }) as unknown as ActiveContext;

describe("G4-28: a closed recruiter or expert is told and refused", () => {
  it("tells a closed recruiter at sign-in and by email, and lets them in again once opened", async () => {
    expect(await signInWithPassword(MAIL("recruiter"), PASSWORD, { caller: null })).toMatchObject({ ok: true });
    expect(await setRecruiterStanding(operator(), ids.recruiter!, { disabled: true, reason: "ZZ complaints" })).toMatchObject({ ok: true });
    expect(await signInWithPassword(MAIL("recruiter"), PASSWORD, { caller: null })).toEqual({ ok: false, reason: "closed", kind: "RECRUITER" });
    expect(await db.auditLog.count({ where: { actorUserId: ids.recruiter, action: "auth.login.closed" } })).toBe(1);
    const mail = await db.outboundEmail.findFirstOrThrow({ where: { to: MAIL("recruiter"), purpose: "ACCOUNT_STANDING" }, orderBy: { createdAt: "desc" } });
    expect(mail.subject).toBe(en("riskDecisions.closedSubjectRecruiter"));
    expect(mail.text).toContain(en("riskDecisions.closedReason", { reason: "ZZ complaints" }));
    // A wrong password still says nothing about the account.
    expect(await signInWithPassword(MAIL("recruiter"), `${PASSWORD}x`, { caller: null })).toEqual({ ok: false, reason: "noMatch" });
    await setRecruiterStanding(operator(), ids.recruiter!, { disabled: false });
    expect(await signInWithPassword(MAIL("recruiter"), PASSWORD, { caller: null })).toMatchObject({ ok: true });
    expect((await db.outboundEmail.findFirstOrThrow({ where: { to: MAIL("recruiter"), purpose: "ACCOUNT_STANDING" }, orderBy: { createdAt: "desc" } })).subject).toBe(en("riskDecisions.reopenedSubject"));
  });

  it("closes an expert: refused at sign-in with the sentence, sessions ended, no way in, found by no school; opened again, as before", async () => {
    const schoolAdmin = await as(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
    expect((await listMarketplace(schoolAdmin)).some((e) => e.id === ids.profile)).toBe(true);
    await as(ids.expert!, { role: "EXPERT" });
    const closed = await setExpertAccess(operator(), ids.profile!, { disabled: true, reason: "ZZ no-shows" });
    expect(closed).toMatchObject({ ok: true });
    expect(closed.ok && closed.sessionsEnded).toBeGreaterThanOrEqual(1);
    expect(await db.session.count({ where: { userId: ids.expert, revokedAt: null } })).toBe(0);
    expect(await signInWithPassword(MAIL("expert"), PASSWORD, { caller: null })).toEqual({ ok: false, reason: "closed", kind: "EXPERT" });
    expect((await resolveContext(ids.expert!)).role).not.toBe("EXPERT");
    expect((await listMarketplace(await as(ids.admin!, { schoolId: ids.school!, role: "ADMIN" }))).some((e) => e.id === ids.profile)).toBe(false);
    const mail = await db.outboundEmail.findFirstOrThrow({ where: { to: MAIL("expert"), purpose: "ACCOUNT_STANDING" }, orderBy: { createdAt: "desc" } });
    expect(mail.subject).toBe(en("riskDecisions.closedSubjectExpert"));
    expect(await db.auditLog.count({ where: { action: "superuser.expert.disable", targetId: ids.profile } })).toBe(1);
    // The same again is a no-op; a profile that is not there is refused.
    expect(await setExpertAccess(operator(), ids.profile!, { disabled: true })).toEqual({ ok: true, sessionsEnded: 0 });
    expect(await setExpertAccess(operator(), "zz-no-such-profile", { disabled: true })).toEqual({ ok: false, errorKey: "riskDecisions.refuseNoExpert" });
    await setExpertAccess(operator(), ids.profile!, { disabled: false });
    expect(await signInWithPassword(MAIL("expert"), PASSWORD, { caller: null })).toMatchObject({ ok: true });
    expect((await resolveContext(ids.expert!)).role).toBe("EXPERT");
  });

  it("lets a closed expert who also teaches sign in to their school, and keeps the door to the operator", async () => {
    await setExpertAccess(operator(), ids.teacherProfile!, { disabled: true });
    expect(await closedOutsideAccount(ids.teacherExpert!)).toBeNull();
    expect(await signInWithPassword(MAIL("teacherExpert"), PASSWORD, { caller: null })).toMatchObject({ ok: true });
    expect((await resolveContext(ids.teacherExpert!)).role).toBe("TEACHER");
    await as(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
    const res = await expertAccessPost(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ disabled: false }) }), { params: Promise.resolve({ profileId: ids.teacherProfile! }) });
    expect(res.status).toBe(403);
  });
});

describe("G4-5: the placement directory is the recruiter's", () => {
  it("is refused to a student, a parent, an expert and a signed-in stranger, at the library and the door", async () => {
    const readers: [string, ActiveContext][] = [
      ["student", await as(ids.student!, { schoolId: ids.school!, role: "STUDENT" })],
      ["parent", await as(ids.stranger!, { role: "PARENT" })],
      ["expert", await as(ids.expert!, { role: "EXPERT" })],
      ["stranger", await as(ids.stranger!, { role: null })],
    ];
    for (const [who, ctx] of readers) await expect(recruiterColleges(ctx), who).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await as(ids.student!, { schoolId: ids.school!, role: "STUDENT" });
    expect((await collegesGet()).status).toBe(403);
    // The recruiter, confirmed, reads it.
    const recruiter = await as(ids.recruiter!, { role: "RECRUITER" });
    expect(Array.isArray((await recruiterColleges(recruiter)).colleges)).toBe(true);
  });
});

describe("G4-6: a recruiter reads no drive before the address is confirmed", () => {
  it("refuses the drives, a drive and the directory until confirmed, and reads them after", async () => {
    const ctx = await as(ids.unverified!, { role: "RECRUITER" });
    await expect(recruiterDrives(ctx)).rejects.toMatchObject({ key: "recruiter.refuseUnverified" });
    await expect(recruiterDrive(ctx, "zz-any-drive")).rejects.toMatchObject({ key: "recruiter.refuseUnverified" });
    await expect(recruiterColleges(ctx)).rejects.toMatchObject({ key: "recruiter.refuseUnverified" });
    await db.user.update({ where: { id: ids.unverified! }, data: { emailVerifiedAt: new Date() } });
    expect((await recruiterDrives(ctx)).drives).toEqual([]);
  });
});
