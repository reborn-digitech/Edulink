/**
 * The office resets a pupil's forgotten password with a code (testing analysis of 13 November 2026, TA-037; the
 * owner's decision of 14 November 2026, option 1).
 *
 * TA-037 (Medium, Functional): a pupil with a login name and a password they had forgotten could not be given a new
 * one by anybody. The reset sent nothing to a handle, the forgot page told the pupil to ask the school, and the
 * office's first sign-in code was refused for an account that already had a password. Now the office (ADMIN, and
 * nobody else) issues a one-time reset code to its own pupil whose account has a login name, no email, no confirmed
 * mobile and no place at another school; the pupil types it with the handle at /first-signin and chooses a new
 * password, and every device is signed out; the code lasts 24 hours; the issue is audited in its own transaction and
 * the pupil's guardians are told, or the head where the school itself stands in as guardian.
 *
 * Every row is one this suite makes (a stamped ZZ school, its ZZ people with @test.invalid addresses and stamped
 * @edulink.local handles) and removes.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as firstSignin from "@/lib/first-signin";
import { FIRST_SIGNIN_TTL_DAYS, issueFirstSignIn, redeemFirstSignIn } from "@/lib/first-signin";
import { OFFICE_RESET_TTL_HOURS } from "@/lib/first-signin-constants";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";
import { verifyPassword } from "@/lib/crypto";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SHORT = String(STAMP).slice(-6);
const OFFICE_RESET_PURPOSE = "OFFICE_RESET";
// Read through the module object so the suite loads (and each case fails for its reason) before the export exists.
type Issue = (ctx: ActiveContext, studentMembershipId: string) => Promise<firstSignin.IssueResult>;
const issueOfficeReset: Issue = (ctx, id) => {
  const fn = (firstSignin as unknown as { issueOfficeReset?: Issue }).issueOfficeReset;
  if (!fn) throw new Error("issueOfficeReset is not built");
  return fn(ctx, id);
};

function ctx(userId: string, membershipId: string, role: ActiveContext["role"], schoolId: string): ActiveContext {
  return {
    sessionId: "test", membershipId, schoolId, role,
    user: { id: userId, name: "ZZ Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

let schoolId = "";
let otherSchoolId = "";
const userIds: string[] = [];
let admin: ActiveContext;
let head: ActiveContext;
let teacher: ActiveContext;
let guardian: ActiveContext;

async function person(tag: string, data: { email?: string; passwordHash?: string; phone?: string; phoneVerifiedAt?: Date; emailVerifiedAt?: Date } = {}): Promise<string> {
  const id = (await db.user.create({ data: { name: `ZZ D037 ${tag}`, email: data.email ?? `zz-d037-${tag}-${STAMP}@test.invalid`, prefs: "{}", ...data }, select: { id: true } })).id;
  userIds.push(id);
  return id;
}

async function member(userId: string, role: string, school = schoolId, extra: { leftAt?: Date } = {}): Promise<string> {
  return (await db.membership.create({ data: { userId, schoolId: school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `STU-D037-${SHORT}-${userIds.indexOf(userId)}-${school.slice(-4)}` } : {}), ...extra }, select: { id: true } })).id;
}

const handleOf = (tag: string) => `zzd037${tag}.${SHORT}`;

/** A pupil on a login name who chose a password long ago (a class-code join) and has forgotten it. */
async function forgetfulPupil(tag: string, data: { phone?: string; phoneVerifiedAt?: Date; emailVerifiedAt?: Date; email?: string } = {}): Promise<{ userId: string; membershipId: string; handle: string }> {
  const handle = handleOf(tag);
  const userId = await person(tag, { email: `${handle}@edulink.local`, passwordHash: "zz-forgotten-hash", ...data });
  await db.user.update({ where: { id: userId }, data: { isMinor: true } });
  return { userId, membershipId: await member(userId, "STUDENT"), handle };
}

beforeAll(async () => {
  const mkSchool = async (tag: string) =>
    (
      await db.school.create({
        data: { name: `ZZ D037 ${tag} ${STAMP}`, slug: `zz-d037-${tag}-${STAMP}`, code: `ZD37${tag[0]}${SHORT}`, contactEmail: `zz-d037-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
        select: { id: true },
      })
    ).id;
  schoolId = await mkSchool("home");
  otherSchoolId = await mkSchool("other");
  const adminId = await person("admin");
  admin = ctx(adminId, await member(adminId, "ADMIN"), "ADMIN", schoolId);
  const headId = await person("head");
  head = ctx(headId, await member(headId, "PRINCIPAL"), "PRINCIPAL", schoolId);
  const teacherId = await person("teacher");
  teacher = ctx(teacherId, await member(teacherId, "TEACHER"), "TEACHER", schoolId);
  const guardianId = await person("guardian");
  guardian = ctx(guardianId, await member(guardianId, "PARENT"), "PARENT", schoolId);
}, 60_000);

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: [schoolId, otherSchoolId] } }, { actorUserId: { in: userIds } }] } });
  await db.guardianship.deleteMany({ where: { OR: [{ parentUserId: { in: userIds } }, { studentSchoolId: { in: [schoolId, otherSchoolId] } }] } });
  await db.membership.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.$disconnect();
});

describe.sequential("TA-037: the office resets a forgotten password with a code", () => {
  it("TA-037: the office gives its handle pupil a reset code; it works for 24 hours, sets the new password and signs out every device", async () => {
    const pupil = await forgetfulPupil("main");
    const stale = await db.session.create({ data: { userId: pupil.userId, tokenHash: `zz-d037-${STAMP}`, expiresAt: new Date(Date.now() + 86_400_000) } });
    // The first sign-in code stays what it was: refused for an account that already has a password.
    expect(await issueFirstSignIn(admin, pupil.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.notEligible" });

    const issued = await issueOfficeReset(admin, pupil.membershipId);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.issued.handle).toBe(pupil.handle);
    expect(issued.issued.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    const hours = (issued.issued.expiresAt.getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThanOrEqual(24);
    const token = await db.authToken.findFirstOrThrow({ where: { userId: pupil.userId, consumedAt: null } });
    expect(token.purpose).toBe(OFFICE_RESET_PURPOSE);
    // Not the first sign-in code's fortnight.
    expect(token.expiresAt.getTime()).toBeLessThan(Date.now() + FIRST_SIGNIN_TTL_DAYS * 86_400_000 - 86_400_000);
    // The pupil's old sessions are untouched until the code is used.
    expect((await db.session.findUniqueOrThrow({ where: { id: stale.id } })).revokedAt).toBeNull();

    const done = await redeemFirstSignIn(pupil.handle, issued.issued.code, `Zz-Kingfisher-${STAMP}`);
    expect(done).toMatchObject({ ok: true, userId: pupil.userId, schoolId, role: "STUDENT" });
    const user = await db.user.findUniqueOrThrow({ where: { id: pupil.userId } });
    expect(await verifyPassword(user.passwordHash!, `Zz-Kingfisher-${STAMP}`)).toBe(true);
    expect((await db.session.findUniqueOrThrow({ where: { id: stale.id } })).revokedAt).not.toBeNull();
    expect(await db.authToken.count({ where: { userId: pupil.userId, consumedAt: null } })).toBe(0);
    // One-shot.
    expect(await redeemFirstSignIn(pupil.handle, issued.issued.code, `Zz-Kingfisher-${STAMP}-2`)).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    const audits = await db.auditLog.findMany({ where: { schoolId, targetId: pupil.membershipId }, select: { action: true, actorUserId: true } });
    expect(audits).toContainEqual({ action: "auth.officeReset.issue", actorUserId: admin.user.id });
    expect(await db.auditLog.count({ where: { schoolId, actorUserId: pupil.userId, action: "auth.officeReset.completed" } })).toBe(1);
  });

  it("TA-037: a new reset code replaces the old one, and a code past its 24 hours opens nothing", async () => {
    const pupil = await forgetfulPupil("again");
    const first = await issueOfficeReset(admin, pupil.membershipId);
    const second = await issueOfficeReset(admin, pupil.membershipId);
    if (!first.ok || !second.ok) throw new Error("no code");
    expect(await db.authToken.count({ where: { userId: pupil.userId, consumedAt: null } })).toBe(1);
    expect(await redeemFirstSignIn(pupil.handle, first.issued.code, `Zz-Kingfisher-${STAMP}`)).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    await db.authToken.updateMany({ where: { userId: pupil.userId, consumedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await redeemFirstSignIn(pupil.handle, second.issued.code, `Zz-Kingfisher-${STAMP}`)).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    expect((await db.user.findUniqueOrThrow({ where: { id: pupil.userId } })).passwordHash).toBe("zz-forgotten-hash");
  });

  it("TA-037: only the office issues it — not a guardian, a class teacher or the head", async () => {
    const pupil = await forgetfulPupil("who");
    await db.guardianship.create({ data: { parentUserId: guardian.user.id, studentMembershipId: pupil.membershipId, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
    for (const caller of [guardian, teacher, head]) {
      await expect(issueOfficeReset(caller, pupil.membershipId)).rejects.toBeInstanceOf(AccessError);
    }
    expect(await db.authToken.count({ where: { userId: pupil.userId } })).toBe(0);
  });

  it("TA-037: refused for an email, a confirmed mobile, a place at another school, no password yet, or another school's pupil", async () => {
    const withEmailId = await person("addr", { passwordHash: "zz-forgotten-hash" });
    const withEmail = await member(withEmailId, "STUDENT");
    const mobile = await forgetfulPupil("mob", { phone: `+9199${SHORT}1`.slice(0, 13), phoneVerifiedAt: new Date() });
    const verified = await forgetfulPupil("ver", { emailVerifiedAt: new Date() });
    const moved = await forgetfulPupil("moved");
    await member(moved.userId, "STUDENT", otherSchoolId, { leftAt: new Date() });
    const guards = await forgetfulPupil("guards");
    const sibling = await forgetfulPupil("sib");
    await db.guardianship.create({ data: { parentUserId: guards.userId, studentMembershipId: sibling.membershipId, studentSchoolId: schoolId, relation: "GUARDIAN", status: "ACTIVE" } });
    const staffToo = await forgetfulPupil("staff");
    await member(staffToo.userId, "TEACHER");
    const neverSignedInId = await person("never", { email: `${handleOf("never")}@edulink.local` });
    const neverSignedIn = await member(neverSignedInId, "STUDENT");
    const theirsId = await person("theirs", { email: `${handleOf("theirs")}@edulink.local`, passwordHash: "zz-forgotten-hash" });
    const theirs = await member(theirsId, "STUDENT", otherSchoolId);
    const left = await forgetfulPupil("left");
    await db.membership.update({ where: { id: left.membershipId }, data: { leftAt: new Date() } });

    expect(await issueOfficeReset(admin, withEmail)).toMatchObject({ ok: false, errorKey: "firstSignin.hasAddressUseForgot" });
    expect(await issueOfficeReset(admin, mobile.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.resetHasMobile" });
    expect(await issueOfficeReset(admin, verified.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.resetOperatorOnly" });
    expect(await issueOfficeReset(admin, moved.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.resetOperatorOnly" });
    expect(await issueOfficeReset(admin, guards.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.resetOperatorOnly" });
    expect(await issueOfficeReset(admin, staffToo.membershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.resetOperatorOnly" });
    expect(await issueOfficeReset(admin, neverSignedIn)).toMatchObject({ ok: false, errorKey: "firstSignin.resetNoPassword" });
    expect(await issueOfficeReset(admin, theirs)).toMatchObject({ ok: false, errorKey: "refusal.notPupilsHere" });
    expect(await issueOfficeReset(admin, left.membershipId)).toMatchObject({ ok: false, errorKey: "refusal.notPupilsHere" });
    const refusedUsers = [withEmailId, mobile.userId, verified.userId, moved.userId, guards.userId, staffToo.userId, neverSignedInId, theirsId, left.userId];
    expect(await db.authToken.count({ where: { userId: { in: refusedUsers } } })).toBe(0);
  });

  it("TA-037: a code issued before the pupil took a place at another school no longer opens the account", async () => {
    const pupil = await forgetfulPupil("later");
    const issued = await issueOfficeReset(admin, pupil.membershipId);
    if (!issued.ok) throw new Error("no code");
    await member(pupil.userId, "STUDENT", otherSchoolId);
    expect(await redeemFirstSignIn(pupil.handle, issued.issued.code, `Zz-Kingfisher-${STAMP}`)).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    expect((await db.user.findUniqueOrThrow({ where: { id: pupil.userId } })).passwordHash).toBe("zz-forgotten-hash");
  });

  it("TA-037: the pupil's guardians are told, and the school's stand-in is not", async () => {
    const pupil = await forgetfulPupil("told");
    await db.guardianship.create({ data: { parentUserId: guardian.user.id, studentMembershipId: pupil.membershipId, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
    const before = await db.notification.count({ where: { userId: { in: [guardian.user.id, head.user.id, teacher.user.id] } } });
    expect((await issueOfficeReset(admin, pupil.membershipId)).ok).toBe(true);
    const told = await db.notification.findMany({ where: { userId: { in: [guardian.user.id, head.user.id, teacher.user.id] } }, orderBy: { createdAt: "desc" }, select: { userId: true, titleKey: true } });
    expect(told.length - before).toBe(1);
    expect(told[0]).toEqual({ userId: guardian.user.id, titleKey: "firstSignin.notifResetTitle" });
  });

  it("TA-037: where the school itself stands in as guardian, the head is told and not the stand-in", async () => {
    const pupil = await forgetfulPupil("standin");
    await db.guardianship.create({ data: { parentUserId: teacher.user.id, studentMembershipId: pupil.membershipId, studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" } });
    const count = (userId: string) => db.notification.count({ where: { userId, titleKey: "firstSignin.notifResetTitle" } });
    const [headBefore, teacherBefore, guardianBefore] = await Promise.all([count(head.user.id), count(teacher.user.id), count(guardian.user.id)]);
    expect((await issueOfficeReset(admin, pupil.membershipId)).ok).toBe(true);
    expect((await count(head.user.id)) - headBefore).toBe(1);
    expect((await count(teacher.user.id)) - teacherBefore).toBe(0);
    expect((await count(guardian.user.id)) - guardianBefore).toBe(0);
    const row = await db.notification.findFirstOrThrow({ where: { userId: head.user.id, titleKey: "firstSignin.notifResetTitle" }, orderBy: { createdAt: "desc" }, select: { bodyKey: true } });
    expect(row.bodyKey).toBe("firstSignin.notifResetHeadBody");
  });

  it("TA-037: every sentence that names the reset code's life says the 24 hours the code is given", () => {
    expect(OFFICE_RESET_TTL_HOURS).toBe(24);
    const words: [Record<string, Record<string, string>>, string][] = [
      [en as unknown as Record<string, Record<string, string>>, `${OFFICE_RESET_TTL_HOURS} hours`],
      [hi as unknown as Record<string, Record<string, string>>, `${OFFICE_RESET_TTL_HOURS} घंटे`],
      [mr as unknown as Record<string, Record<string, string>>, `${OFFICE_RESET_TTL_HOURS} तास`],
    ];
    for (const [dict, life] of words) {
      for (const key of ["resetPanelBody", "notifResetBody", "notifResetHeadBody"]) expect(dict.firstSignin![key], key).toContain(life);
    }
  });

  it("TA-037: the web offers it from the pupil's row to the office alone, and the phone issues no codes", () => {
    const actions = readFileSync("src/app/(app)/admin/people/actions.ts", "utf8");
    const issueAction = actions.slice(actions.indexOf("export async function issueOfficeResetAction"));
    expect(issueAction.length).toBeGreaterThan(0);
    expect(actions).toContain("export async function issueOfficeResetAction");
    expect(issueAction.slice(0, 600)).toContain('requireApiRole("ADMIN")');
    expect(issueAction.slice(0, 600)).toContain("issueOfficeReset(ctx");
    const menu = readFileSync("src/app/(app)/admin/people/directory-menu.tsx", "utf8");
    expect(menu).toContain("OfficeResetPanel");
    expect(readFileSync("src/app/(app)/admin/people/page.tsx", "utf8")).toMatch(/hasPassword=\{/);
  });
});
