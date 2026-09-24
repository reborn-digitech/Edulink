import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { issueFirstSignIn, redeemFirstSignIn, MAX_FIRST_SIGNIN_ATTEMPTS, FIRST_SIGNIN_PURPOSE } from "@/lib/first-signin";
import { verifyPassword } from "@/lib/crypto";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import type { ActiveContext } from "@/lib/session";

/**
 * A pupil's first sign-in, issued by the school. What holds: only a handle
 * pupil gets a code (an address uses Forgot password); the code is one-shot,
 * only the newest works, five wrong tries spend it, and redeeming it sets
 * the password, revokes every session and consumes every other token; every
 * failure reads the same.
 *
 * NOT COVERED HERE: the row-level fence. This suite's connection is not
 * fenced, and the live walkthrough found the membership lookup reading
 * nothing behind RLS with no session — hence the `forSchool` in the lib.
 */

const db = new PrismaClient();
function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null,
    user: { id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

const HANDLE = "zzfirst.k9q2";
let admin: ActiveContext;
let teacher: ActiveContext;
let schoolId: string;
let pupilUserId: string;
let pupilMembershipId: string;
let emailPupilMembershipId: string;

async function cleanup() {
  await db.user.deleteMany({ where: { email: { in: [`${HANDLE}@${HANDLE_DOMAIN}`, "zz.first.email@riverside.test"] } } });
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  admin = ctx({ userId: priya.id, membershipId: (await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } })).id, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: (await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } })).id, schoolId, role: "TEACHER" });
  await cleanup();
  const pupil = await db.user.create({ data: { name: "ZZ First Pupil", email: `${HANDLE}@${HANDLE_DOMAIN}`, prefs: "{}", isMinor: true } });
  pupilUserId = pupil.id;
  pupilMembershipId = (await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: "STU-ZZFIRST" } })).id;
  const withEmail = await db.user.create({ data: { name: "ZZ First Email Pupil", email: "zz.first.email@riverside.test", prefs: "{}" } });
  emailPupilMembershipId = (await db.membership.create({ data: { userId: withEmail.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: "STU-ZZFIRSTE" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("issuing a first sign-in", () => {
  it("⚠ only an admin, only for a pupil with nowhere else to send a code", async () => {
    await expect(issueFirstSignIn(teacher, pupilMembershipId)).rejects.toBeInstanceOf(AccessError);
    expect(await issueFirstSignIn(admin, emailPupilMembershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.hasAddressUseForgot" });
  });

  it("⚠ never for an account that already has a sign-in: a password, a verified address, or a life at another school", async () => {
    /**
     * Redeeming the code SETS THE PASSWORD. An admin who could issue one for
     * an account with a password, or for a pupil linked in from another
     * school, could take that account over — which is what the intake hole
     * this closes came down to. Refused by name of the rule, and nothing
     * minted.
     */
    const suffix = String(Date.now()).slice(-6);
    const other = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" }, select: { id: true } });
    const mk = (handle: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ First ${handle}`, email: `${handle}@${HANDLE_DOMAIN}`, prefs: "{}", isMinor: true, ...extra }, select: { id: true } });
    const [withPassword, verified, elsewhere, guards] = await Promise.all([
      mk(`zzfirst.pw${suffix}`, { passwordHash: "not-a-real-hash" }),
      mk(`zzfirst.ve${suffix}`, { emailVerifiedAt: new Date() }),
      mk(`zzfirst.el${suffix}`),
      mk(`zzfirst.gu${suffix}`),
    ]);
    const ids = [withPassword.id, verified.id, elsewhere.id, guards.id];
    try {
      const memberships = await Promise.all(ids.map((userId, i) => db.membership.create({ data: { userId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `STU-ZZF${i}${suffix}` }, select: { id: true } })));
      const atOther = await db.membership.create({ data: { userId: elsewhere.id, schoolId: other.id, role: "STUDENT", status: "ACTIVE", leftAt: new Date(), studentCode: `STU-ZZFX${suffix}` }, select: { id: true } });
      await db.guardianship.create({ data: { parentUserId: guards.id, studentMembershipId: atOther.id, studentSchoolId: other.id, relation: "PARENT", status: "ACTIVE" } });
      for (const m of memberships) {
        expect(await issueFirstSignIn(admin, m.id)).toMatchObject({ ok: false, errorKey: "firstSignin.notEligible" });
      }
      expect(await db.authToken.count({ where: { userId: { in: ids }, purpose: FIRST_SIGNIN_PURPOSE } })).toBe(0);
    } finally {
      await db.guardianship.deleteMany({ where: { parentUserId: { in: ids } } });
      await db.membership.deleteMany({ where: { userId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it("mints a readable code on the handle, and a new one replaces the old", async () => {
    const first = await issueFirstSignIn(admin, pupilMembershipId);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.issued.handle).toBe(HANDLE);
    expect(first.issued.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    const second = await issueFirstSignIn(admin, pupilMembershipId);
    expect(second.ok).toBe(true);
    expect(await db.authToken.count({ where: { userId: pupilUserId, purpose: FIRST_SIGNIN_PURPOSE, consumedAt: null } })).toBe(1);
    // The first code is dead.
    expect(await redeemFirstSignIn(HANDLE, first.issued.code, "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
  });
});

describe("redeeming it", () => {
  it("⚠ a weak password does not spend an attempt; the right code sets it, signs everyone out, and is gone", async () => {
    const issued = await issueFirstSignIn(admin, pupilMembershipId);
    if (!issued.ok) throw new Error("no code");
    const stale = await db.session.create({ data: { userId: pupilUserId, tokenHash: `zz-first-${Date.now()}`, expiresAt: new Date(Date.now() + 86_400_000) } });

    const weak = await redeemFirstSignIn(HANDLE, issued.issued.code, "short");
    expect(weak.ok).toBe(false);
    expect(weak).not.toMatchObject({ errorKey: "firstSignin.noMatch" });

    const done = await redeemFirstSignIn(HANDLE, issued.issued.code.toLowerCase().replace("-", " "), "Sunflower-2031");
    expect(done).toMatchObject({ ok: true, userId: pupilUserId, schoolId });
    const user = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(await verifyPassword(user.passwordHash!, "Sunflower-2031")).toBe(true);
    expect((await db.session.findUniqueOrThrow({ where: { id: stale.id } })).revokedAt).not.toBeNull();
    expect(await db.authToken.count({ where: { userId: pupilUserId, consumedAt: null } })).toBe(0);
    // One-shot.
    expect(await redeemFirstSignIn(HANDLE, issued.issued.code, "Sunflower-2032")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
  });

  it("⚠ five wrong tries spend the code, and every failure reads the same", async () => {
    // The redeem above set a password, and an account with one is no longer
    // eligible (it uses the reset). Back to a fresh account for this one.
    expect(await issueFirstSignIn(admin, pupilMembershipId)).toMatchObject({ ok: false, errorKey: "firstSignin.notEligible" });
    await db.user.update({ where: { id: pupilUserId }, data: { passwordHash: null } });
    const issued = await issueFirstSignIn(admin, pupilMembershipId);
    if (!issued.ok) throw new Error("no code");
    for (let i = 0; i < MAX_FIRST_SIGNIN_ATTEMPTS; i++) {
      expect(await redeemFirstSignIn(HANDLE, "AAAA-BBBB", "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    }
    expect(await redeemFirstSignIn(HANDLE, issued.issued.code, "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    expect(await redeemFirstSignIn("nobody.0000", "AAAA-BBBB", "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
    expect(await redeemFirstSignIn("zz.first.email@riverside.test", "AAAA-BBBB", "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
  });

  it("⚠ twenty wrong tries arriving TOGETHER spend the code after five, and the right one is then refused", async () => {
    const issued = await issueFirstSignIn(admin, pupilMembershipId);
    if (!issued.ok) throw new Error("no code");
    // The count was a JSON field read and then written, so a burst read 0
    // every time; it is one conditional UPDATE now.
    const burst = await Promise.all(Array.from({ length: 20 }, () => redeemFirstSignIn(HANDLE, "AAAA-BBBB", "Sunflower-2031")));
    expect(burst.every((r) => !r.ok)).toBe(true);
    const token = await db.authToken.findFirstOrThrow({ where: { userId: pupilUserId, purpose: FIRST_SIGNIN_PURPOSE }, orderBy: { createdAt: "desc" } });
    expect(token.attempts).toBe(MAX_FIRST_SIGNIN_ATTEMPTS);
    expect(token.consumedAt).not.toBeNull();
    expect(await redeemFirstSignIn(HANDLE, issued.issued.code, "Sunflower-2031")).toMatchObject({ ok: false, errorKey: "firstSignin.noMatch" });
  });
});
