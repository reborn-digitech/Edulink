import { afterAll, afterEach, beforeAll, describe, expect, it, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { acceptInvite } from "@/app/invite/[token]/actions";
import { login } from "@/app/login/actions";
import { recordDeparture } from "@/lib/school-record";
import { generateToken, hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import type { ActiveContext } from "@/lib/session";

/**
 * A transfer done the way a school actually does one: the new school invites
 * the child at the email they already use, and the old school records them as
 * having left.
 *
 * THIS IS THE PATH THAT DOES NOT FORK, and it already half-worked. `acceptInvite`
 * has always looked the email up and attached a membership to the existing
 * account rather than minting a second one — so for any pupil with a real email
 * address, the leaving certificate is already on the account they sign in with
 * and there is nothing to merge. What was missing was that the invitation never
 * SAID so, and asked them to choose a password it then threw away.
 *
 * THE FIRST TEST IN THE SECOND BLOCK IS THE REPRODUCTION of that. It is worth
 * being precise about why it is bad rather than untidy: the child types a new
 * password, is signed in immediately, and finds out weeks later — when the
 * session has gone and they try the password they chose — that it was never
 * stored. That is a lockout with a delay on it, and the person it happens to is
 * a child at a school that has just met them.
 *
 * Fixtures own their schools, for the reason written at the top of
 * account-merge.test.ts.
 */

const db = new PrismaClient();

const OLD_SCHOOL = "ZZ Invite Origin School";
const OLD_SLUG = "zz-invite-origin";
const NEW_SCHOOL = "ZZ Invite Destination School";
const NEW_SLUG = "zz-invite-destination";
const ADMIN_EMAIL = "invite.transfer.admin@zzinvite.test";
const PUPIL_EMAIL = "invite.transfer.pupil@zzinvite.test";
const FRESH_EMAIL = "invite.transfer.fresh@zzinvite.test";
const OLD_PASSWORD = "the-one-they-already-use-8812";
const TYPED_PASSWORD = "something-else-entirely-4471";

let oldSchoolId: string;
let newSchoolId: string;
let oldAdmin: ActiveContext;
let pupilUserId: string;
let pupilMembershipId: string;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

beforeAll(async () => {
  const oldSchool = await db.school.upsert({
    where: { slug: OLD_SLUG },
    create: { name: OLD_SCHOOL, slug: OLD_SLUG, code: "ZZINV-OLD", contactEmail: "a@zzinvite.test" },
    update: { name: OLD_SCHOOL },
  });
  const newSchool = await db.school.upsert({
    where: { slug: NEW_SLUG },
    create: { name: NEW_SCHOOL, slug: NEW_SLUG, code: "ZZINV-NEW", contactEmail: "b@zzinvite.test" },
    update: { name: NEW_SCHOOL },
  });
  oldSchoolId = oldSchool.id;
  newSchoolId = newSchool.id;

  const adminUser = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: "Origin Admin", prefs: "{}" },
    update: {},
  });
  const adminMembership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: adminUser.id, schoolId: oldSchoolId, role: "ADMIN" } },
    create: { userId: adminUser.id, schoolId: oldSchoolId, role: "ADMIN", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  oldAdmin = ctx({
    userId: adminUser.id,
    membershipId: adminMembership.id,
    schoolId: oldSchoolId,
    role: "ADMIN",
  });
});

/** A pupil at the old school, with an email and a password they use. */
async function makePupil(): Promise<void> {
  await wipe();
  const user = await db.user.create({
    data: {
      email: PUPIL_EMAIL,
      name: "Ravi Nair",
      preferredName: "Ravi",
      passwordHash: await hashPassword(OLD_PASSWORD),
      emailVerifiedAt: new Date(),
      prefs: "{}",
    },
  });
  pupilUserId = user.id;
  const membership = await db.membership.create({
    data: {
      userId: user.id,
      schoolId: oldSchoolId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "5",
      joinedAt: new Date("2024-04-01T00:00:00Z"),
    },
  });
  pupilMembershipId = membership.id;
}

/** An invitation from the NEW school, at the address they already use. */
async function inviteFromNewSchool(email: string): Promise<string> {
  const token = generateToken();
  await db.invite.create({
    data: {
      schoolId: newSchoolId,
      role: "STUDENT",
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });
  return token;
}

async function wipe(): Promise<void> {
  await db.invite.deleteMany({ where: { email: { in: [PUPIL_EMAIL, FRESH_EMAIL] } } });
  const users = await db.user.findMany({
    where: { email: { in: [PUPIL_EMAIL, FRESH_EMAIL] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await db.schoolRecord.deleteMany({ where: { studentUserId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

afterEach(wipe);

/**
 * `login()` is rate limited per identifier, and RateLimit rows OUTLIVE a test
 * run — so a suite that signs in twice per run exhausts its allowance after a
 * few `npm test`s and then fails in a file nobody edited. Cleared here for the
 * identifiers this file uses, by the same make-your-own-fixtures rule.
 */
beforeEach(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "login:" } } });
});

afterAll(async () => {
  await wipe();
  await db.school.deleteMany({ where: { slug: { in: [OLD_SLUG, NEW_SLUG] } } });
  await db.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("a transfer by invitation", () => {
  it("attaches the new school to the account they already have", async () => {
    await makePupil();
    const token = await inviteFromNewSchool(PUPIL_EMAIL);

    const result = await acceptInvite({ token, name: "Ravi Nair", subjects: [] });
    expect(result.ok).toBe(true);

    // ONE account, two schools — which is the whole point. A second User here
    // would strand the leaving certificate exactly as joining with a code does.
    const users = await db.user.findMany({ where: { email: PUPIL_EMAIL } });
    expect(users).toHaveLength(1);
    expect(users[0]!.id).toBe(pupilUserId);

    const memberships = await db.membership.findMany({ where: { userId: pupilUserId } });
    expect(memberships.map((m) => m.schoolId).sort()).toEqual([oldSchoolId, newSchoolId].sort());
  });

  it("carries the leaving certificate with them, with nothing to merge", async () => {
    await makePupil();

    // The old school does its half.
    const departure = await recordDeparture(oldAdmin, pupilMembershipId, {
      reason: "TRANSFERRED",
      destination: NEW_SCHOOL,
    });
    expect(departure.ok).toBe(true);

    const token = await inviteFromNewSchool(PUPIL_EMAIL);
    expect((await acceptInvite({ token, name: "Ravi Nair", subjects: [] })).ok).toBe(true);

    // The certificate was written against this user id and never moved, because
    // it never had to.
    const records = await db.schoolRecord.findMany({ where: { studentUserId: pupilUserId } });
    expect(records).toHaveLength(1);
    expect(records[0]!.schoolName).toBe(OLD_SCHOOL);

    // And the old school is closed to them while the new one is open.
    const memberships = await db.membership.findMany({ where: { userId: pupilUserId } });
    expect(memberships.find((m) => m.schoolId === oldSchoolId)!.leftAt).not.toBeNull();
    expect(memberships.find((m) => m.schoolId === newSchoolId)!.leftAt).toBeNull();
  });
});

describe("the password an existing account is asked for", () => {
  it("⚠ is not overwritten, and the one they already use still works", async () => {
    await makePupil();
    const token = await inviteFromNewSchool(PUPIL_EMAIL);

    // The form used to demand a password here and then discard it. It is now
    // refused outright rather than accepted and ignored, because "we took your
    // input and did nothing with it" is the failure that only shows up weeks
    // later, when the session has gone.
    const withPassword = await acceptInvite({
      token,
      name: "Ravi Nair",
      password: TYPED_PASSWORD,
      subjects: [],
    });
    expect(withPassword.ok).toBe(false);

    const stillPending = await db.invite.findFirstOrThrow({ where: { email: PUPIL_EMAIL } });
    expect(stillPending.status).toBe("PENDING");

    // Accepting without one works, and their real password is untouched.
    expect((await acceptInvite({ token, name: "Ravi Nair", subjects: [] })).ok).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(await verifyPassword(user.passwordHash!, OLD_PASSWORD)).toBe(true);
    expect(await verifyPassword(user.passwordHash!, TYPED_PASSWORD)).toBe(false);
  });

  it("⚠ …and the login they had before the transfer still opens the door after it", async () => {
    await makePupil();
    const token = await inviteFromNewSchool(PUPIL_EMAIL);
    expect((await acceptInvite({ token, name: "Ravi Nair", subjects: [] })).ok).toBe(true);

    // The claim as a child would meet it, through the real login action rather
    // than through a hash comparison.
    const signedIn = await login({ identifier: PUPIL_EMAIL, password: OLD_PASSWORD });
    expect(signedIn.ok).toBe(true);

    const withTheOneTheyTyped = await login({ identifier: PUPIL_EMAIL, password: TYPED_PASSWORD });
    expect(withTheOneTheyTyped.ok).toBe(false);
  });

  it("still REQUIRES a password when the account is new", async () => {
    await makePupil();
    const token = await inviteFromNewSchool(FRESH_EMAIL);

    // Nobody holds this address, so there is no existing password to keep and
    // an account with none could never be signed into again.
    const withoutOne = await acceptInvite({ token, name: "Nadia Fresh", subjects: [] });
    expect(withoutOne.ok).toBe(false);

    const withOne = await acceptInvite({
      token,
      name: "Nadia Fresh",
      password: TYPED_PASSWORD,
      subjects: [],
    });
    expect(withOne.ok).toBe(true);

    const created = await db.user.findUniqueOrThrow({ where: { email: FRESH_EMAIL } });
    expect(await verifyPassword(created.passwordHash!, TYPED_PASSWORD)).toBe(true);
  });

  it("sets a password when the account exists but has never had one", async () => {
    await wipe();
    // Parent-managed and invite-created accounts can exist with a null hash.
    const user = await db.user.create({
      data: { email: FRESH_EMAIL, name: "Passwordless", prefs: "{}" },
    });
    const token = await inviteFromNewSchool(FRESH_EMAIL);

    const withoutOne = await acceptInvite({ token, name: "Passwordless", subjects: [] });
    expect(withoutOne.ok).toBe(false);

    expect(
      (await acceptInvite({ token, name: "Passwordless", password: TYPED_PASSWORD, subjects: [] }))
        .ok,
    ).toBe(true);

    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword(after.passwordHash!, TYPED_PASSWORD)).toBe(true);
  });
});
