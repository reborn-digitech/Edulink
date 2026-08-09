import { afterAll, afterEach, beforeAll, describe, expect, it, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/crypto";
import { mergeAccounts, previewMerge } from "@/lib/account-merge";
import { recordDeparture, recordsForStudentUser } from "@/lib/school-record";
import { login } from "@/app/login/actions";
import type { ActiveContext } from "@/lib/session";

/**
 * Joining two accounts that belong to the same person.
 *
 * THE FIRST TEST IN THIS FILE IS THE REPRODUCTION, and it is the reason the
 * feature exists: a pupil leaves one school, arrives at another, and the family
 * creates a fresh account there — which is what `joinAsStudent` does every time
 * it runs, so this is the DEFAULT outcome of a transfer rather than a mistake.
 * The leaving certificate stays on the old user id and the new account can see
 * nothing. That test asserts the broken state on purpose, and the ones after it
 * show the merge fixing it.
 *
 * WHAT THIS FILE CANNOT SHOW, said up front as in school-record.test.ts: the
 * suite connects as the database OWNER, so row-level security is not in force.
 * The claim that the RECEIVING school can now READ the certificate — because
 * the child's user id has moved onto an account with a live membership there —
 * is made
 * live in `npm run rls:verify`, not here. What is left for this file is what the
 * application decides: who may merge, what refuses, what moves, and what
 * deliberately does not.
 *
 * FIXTURES ARE ENTIRELY OUR OWN — the accounts on both sides AND BOTH SCHOOLS.
 * This suite disables accounts and moves memberships between users, so pointing
 * any of it at seeded people would break other suites; the lesson from
 * `register-duty.test.ts` is that adding to shared data is as destructive as
 * deleting from it.
 *
 * IT WAS PROVED AGAIN HERE. This file first used seeded Riverside and made its
 * own ADMIN there, so the departure could be recorded by a disposable person.
 * That is a read-only-looking act that adds a row — and `membership.test.ts`
 * asserts a school cannot be left with no admin, which it checks by COUNTING
 * them. A third admin appeared, its two guard tests went green for the wrong
 * reason, and the failures landed in a file nobody had touched. Two schools of
 * our own cost four lines and cannot do that to anybody.
 */

const db = new PrismaClient();

const OLD_EMAIL = "merge.old.unit@edulink.local";
const NEW_EMAIL = "merge.new.unit@edulink.local";
const THIRD_EMAIL = "merge.third.unit@edulink.local";
const ADMIN_EMAIL = "merge.admin.unit@zzmerge.test";
const ORIGIN_NAME = "ZZ Merge Origin School";
const ORIGIN_SLUG = "zz-merge-origin";
const DESTINATION_NAME = "ZZ Merge Destination School";
const DESTINATION_SLUG = "zz-merge-destination";
const PASSWORD = "correct-horse-battery-staple-42";
const OTHER_PASSWORD = "entirely-different-passphrase-91";
const CLASS_CODE = "ZZZ-MERGE-TEST";

let originId: string;
let destinationId: string;
let classId: string;
let originAdmin: ActiveContext;

/** Rebuilt before every test, because most of them destroy one side or other. */
let oldUserId: string;
let newUserId: string;
let oldMembershipId: string;
let newMembershipId: string;

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
      isSuperuser: over.user?.isSuperuser ?? false,
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
  const origin = await db.school.upsert({
    where: { slug: ORIGIN_SLUG },
    create: {
      name: ORIGIN_NAME,
      slug: ORIGIN_SLUG,
      code: "ZZMERGE-ORIG",
      contactEmail: "office@zzmerge.test",
    },
    update: { name: ORIGIN_NAME },
  });
  const destination = await db.school.upsert({
    where: { slug: DESTINATION_SLUG },
    create: {
      name: DESTINATION_NAME,
      slug: DESTINATION_SLUG,
      code: "ZZMERGE-DEST",
      contactEmail: "office@zzmerge-dest.test",
    },
    update: { name: DESTINATION_NAME },
  });
  originId = origin.id;
  destinationId = destination.id;

  const klass = await db.class.upsert({
    where: { joinCode: CLASS_CODE },
    create: {
      schoolId: originId,
      name: "ZZ Merge Test Class",
      gradeLevel: "5",
      joinCode: CLASS_CODE,
    },
    update: {},
  });
  classId = klass.id;

  // `recordDeparture` needs an admin membership to audit against.
  const adminUser = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: "Merge Test Admin", prefs: "{}" },
    update: {},
  });
  const adminMembership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: adminUser.id, schoolId: originId, role: "ADMIN" } },
    create: { userId: adminUser.id, schoolId: originId, role: "ADMIN", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  originAdmin = ctx({
    userId: adminUser.id,
    membershipId: adminMembership.id,
    schoolId: originId,
    role: "ADMIN",
  });
});

/**
 * The state a transfer actually leaves behind.
 *
 * A pupil with a term at the origin school, recorded as having left with a
 * certificate, and a BRAND NEW account at the destination — two User rows,
 * with nothing linking them.
 */
async function makeForkedPupil(): Promise<void> {
  await wipe();

  const passwordHash = await hashPassword(PASSWORD);

  const oldUser = await db.user.create({
    data: { email: OLD_EMAIL, name: "Amara Osei", preferredName: "Amara", passwordHash, prefs: "{}" },
  });
  oldUserId = oldUser.id;

  const oldMembership = await db.membership.create({
    data: {
      userId: oldUser.id,
      schoolId: originId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "5",
      joinedAt: new Date("2024-04-01T00:00:00Z"),
    },
  });
  oldMembershipId = oldMembership.id;

  await db.enrollment.create({
    data: { classId, schoolId: originId, studentMembershipId: oldMembership.id, status: "ACTIVE" },
  });

  // One register, so the certificate carries a real figure rather than a zero
  // that could also mean "never marked".
  //
  // UPSERT, because a register belongs to the CLASS and not to the pupil — so
  // unlike everything else here it does not cascade away with the users, and
  // `create` fell over on the second test in the file.
  const session = await db.attendanceSession.upsert({
    where: { classId_dateKey: { classId, dateKey: "2026-03-02" } },
    create: { schoolId: originId, classId, dateKey: "2026-03-02", takenAt: new Date() },
    update: {},
  });
  await db.attendanceRecord.create({
    data: {
      schoolId: originId,
      sessionId: session.id,
      studentMembershipId: oldMembership.id,
      status: "PRESENT",
    },
  });

  // They leave, and the certificate is written against the OLD user id.
  const departure = await recordDeparture(originAdmin, oldMembership.id, {
    reason: "TRANSFERRED",
    destination: DESTINATION_NAME,
    leftOn: new Date("2026-03-20T00:00:00Z"),
  });
  expect(departure.ok).toBe(true);

  // And the family starts again at the new school.
  const newUser = await db.user.create({
    data: {
      email: NEW_EMAIL,
      name: "Amara Osei",
      preferredName: "Amara",
      passwordHash: await hashPassword(OTHER_PASSWORD),
      prefs: "{}",
    },
  });
  newUserId = newUser.id;

  const newMembership = await db.membership.create({
    data: {
      userId: newUser.id,
      schoolId: destinationId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "6",
    },
  });
  newMembershipId = newMembership.id;
}

async function wipe(): Promise<void> {
  const users = await db.user.findMany({
    where: { email: { in: [OLD_EMAIL, NEW_EMAIL, THIRD_EMAIL] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  // Break the self-relation before deleting, or the second delete trips over a
  // pointer from a row that is already gone.
  await db.user.updateMany({ where: { id: { in: ids } }, data: { mergedIntoUserId: null } });
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
  // The two schools go too. They cascade to the class, the admin membership and
  // the registers, and leaving them behind would put two invented schools in
  // the operator's school list and in `npm run sweep` for anybody who ever runs
  // the suite against their own database.
  await db.school.deleteMany({ where: { slug: { in: [ORIGIN_SLUG, DESTINATION_SLUG] } } });
  await db.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("the gap this feature closes", () => {
  it("a fresh account at the new school cannot see the old school's certificate", async () => {
    await makeForkedPupil();

    const asNewAccount = ctx({
      userId: newUserId,
      membershipId: newMembershipId,
      schoolId: destinationId,
      role: "STUDENT",
    });

    // The certificate exists, and belongs to somebody this account is not.
    const onOldAccount = await recordsForStudentUser(
      ctx({ userId: oldUserId }),
      oldUserId,
    );
    expect(onOldAccount).toHaveLength(1);
    expect(onOldAccount[0]!.schoolName).toBe(ORIGIN_NAME);

    const onNewAccount = await recordsForStudentUser(asNewAccount, newUserId);
    expect(onNewAccount).toHaveLength(0);
  });
});

describe("merging", () => {
  it("moves the old school, the certificate and the roll onto the account in use", async () => {
    await makeForkedPupil();
    const keeper = ctx({
      userId: newUserId,
      membershipId: newMembershipId,
      schoolId: destinationId,
      role: "STUDENT",
    });

    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(result).toEqual({
      ok: true,
      counts: { schools: 1, certificates: 1, children: 0, posts: 0 },
    });

    // The certificate now answers to the account they actually sign in with.
    const records = await recordsForStudentUser(keeper, newUserId);
    expect(records).toHaveLength(1);
    expect(records[0]!.schoolName).toBe(ORIGIN_NAME);
    expect(records[0]!.attendanceMarked).toBe(1);

    // Both schools are on one account, and the old one is still marked left.
    const memberships = await db.membership.findMany({
      where: { userId: newUserId },
      select: { schoolId: true, leftAt: true },
    });
    expect(memberships).toHaveLength(2);
    expect(memberships.find((m) => m.schoolId === originId)!.leftAt).not.toBeNull();
    expect(memberships.find((m) => m.schoolId === destinationId)!.leftAt).toBeNull();

    // The membership row is the same row — so the register, the marks and the
    // enrolment came with it rather than being copied.
    const moved = await db.membership.findUniqueOrThrow({ where: { id: oldMembershipId } });
    expect(moved.userId).toBe(newUserId);
    const enrolments = await db.enrollment.count({
      where: { studentMembershipId: oldMembershipId },
    });
    expect(enrolments).toBe(1);
  });

  it("closes the old account without deleting it, and records where the person went", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).not.toBeNull();
    expect(old.mergedIntoUserId).toBe(newUserId);
    expect(old.mergedAt).not.toBeNull();
    // Still there. Deleting it would cascade a child's posts out of existence.
    expect(old.name).toBe("Amara Osei");
  });

  it("⚠ leaves the old login unable to sign in, through the real login action", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    // It worked a moment ago, and that half matters as much as the other: a
    // test that only shows the login failing AFTER cannot tell a closed account
    // apart from a fixture whose password was never right.
    const before = await login({ identifier: OLD_EMAIL, password: PASSWORD });
    expect(before.ok).toBe(true);

    await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    // "The old login stops working" is written on the confirm screen, so it is
    // a promise rather than an implementation detail. `disabledAt` being set is
    // not the same claim — this asks the function the promise is about.
    const after = await login({ identifier: OLD_EMAIL, password: PASSWORD });
    expect(after.ok).toBe(false);
  });

  it("revokes the old account's sessions and destroys its tokens", async () => {
    await makeForkedPupil();
    await db.session.create({
      data: {
        userId: oldUserId,
        tokenHash: "merge-test-session-hash",
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    await db.authToken.create({
      data: {
        userId: oldUserId,
        purpose: "MAGIC_LINK",
        tokenHash: "merge-test-token-hash",
        expiresAt: new Date(Date.now() + 600_000),
      },
    });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    const live = await db.session.count({ where: { userId: oldUserId, revokedAt: null } });
    expect(live).toBe(0);
    // A magic link already in an inbox must not resurrect a merged account.
    const tokens = await db.authToken.count({ where: { userId: oldUserId } });
    expect(tokens).toBe(0);
  });

  it("takes a bare pupil handle, not just an email address", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    // What a child actually reads off the letter their old school sent home.
    const result = await mergeAccounts(keeper, {
      identifier: "  Merge.Old.Unit  ",
      password: PASSWORD,
    });
    expect(result.ok).toBe(true);
  });

  it("moves what the old account wrote, so their own posts stay their own", async () => {
    await makeForkedPupil();
    const post = await db.post.create({
      data: {
        schoolId: originId,
        authorUserId: oldUserId,
        authorMembershipId: oldMembershipId,
        scope: "SCHOOL",
        title: "Sports day",
        body: "We won the relay.",
        status: "APPROVED",
      },
    });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(result.ok && result.counts.posts).toBe(1);

    // `bulletin.ts` decides "is this mine?" on authorUserId. Without the move a
    // child could no longer edit or delete their own work.
    const after = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(after.authorUserId).toBe(newUserId);
  });
});

describe("what it refuses", () => {
  it("refuses a wrong password, and says nothing about whether the account exists", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    const wrongPassword = await mergeAccounts(keeper, {
      identifier: OLD_EMAIL,
      password: "not-the-password",
    });
    const noSuchAccount = await mergeAccounts(keeper, {
      identifier: "nobody.at.all@edulink.local",
      password: PASSWORD,
    });

    expect(wrongPassword.ok).toBe(false);
    expect(noSuchAccount.ok).toBe(false);
    // THE SAME SENTENCE. Anything else turns this form into a way of asking
    // which login names are real.
    expect(wrongPassword).toEqual(noSuchAccount);

    // And nothing moved.
    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).toBeNull();
  });

  it("refuses an account already merged away, in the same words", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    const again = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(again.ok).toBe(false);
  });

  it("refuses to merge an account into itself", async () => {
    await makeForkedPupil();
    const asOldAccount = ctx({ userId: oldUserId });

    const result = await mergeAccounts(asOldAccount, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errorKey).toBe("refusal.mergeSameAccount");
  });

  it("refuses when both accounts are at the same school in the same role", async () => {
    await makeForkedPupil();
    // The keeper picks up an origin-school student membership too — which is the one
    // shape `@@unique([userId, schoolId, role])` cannot hold.
    await db.membership.create({
      data: { userId: newUserId, schoolId: originId, role: "STUDENT", status: "ACTIVE" },
    });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    expect(result.ok).toBe(false);
    // The school name travels as a VAR now, beside the key.
    expect(result.ok === false && result.errorKey).toBe("refusal.mergeBothAtSchool");
    expect(result.ok === false && result.errorVars?.school).toMatch(/ZZ Merge Origin School/);
    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).toBeNull();
  });

  it("refuses a server administrator account, in either direction", async () => {
    await makeForkedPupil();
    await db.user.update({ where: { id: oldUserId }, data: { isSuperuser: true } });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    const absorbing = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(absorbing.ok).toBe(false);
    expect(absorbing.ok === false && absorbing.errorKey).toBe("refusal.mergeServerAccounts");

    await db.user.update({ where: { id: oldUserId }, data: { isSuperuser: false } });
    const asSuperuser = ctx({
      userId: newUserId,
      membershipId: newMembershipId,
      schoolId: destinationId,
      role: "STUDENT",
      user: { isSuperuser: true } as ActiveContext["user"],
    });
    const beingAbsorbed = await mergeAccounts(asSuperuser, {
      identifier: OLD_EMAIL,
      password: PASSWORD,
    });
    expect(beingAbsorbed.ok).toBe(false);
  });

  it("refuses an expert account rather than half-moving its bookings", async () => {
    await makeForkedPupil();
    await db.expertProfile.create({
      data: { userId: oldUserId, headline: "Marine biologist", bio: "Ask me about tides." },
    });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errorKey).toBe("refusal.mergeExpert");
  });

  it("refuses an account with no password rather than treating it as open", async () => {
    await makeForkedPupil();
    // Parent-managed and magic-link-only accounts have no hash. A null hash must
    // never compare equal to anything.
    await db.user.update({ where: { id: oldUserId }, data: { passwordHash: null } });

    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });
    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: "" });
    expect(result.ok).toBe(false);
    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).toBeNull();
  });
});

describe("the preview", () => {
  it("names the person and their schools, and writes nothing", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    const preview = await previewMerge(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;

    expect(preview.other.name).toBe("Amara");
    // The handle domain never routes, so it is never shown back to anybody.
    expect(preview.other.loginName).toBe("merge.old.unit");
    expect(preview.other.certificates).toBe(1);
    expect(preview.other.schools).toHaveLength(1);
    expect(preview.other.schools[0]!.schoolName).toBe(ORIGIN_NAME);
    expect(preview.other.schools[0]!.leftAt).not.toBeNull();

    // Nothing happened. This is the screen that catches a parent typing the
    // wrong child's login name, so it has to be safe to reach by accident.
    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).toBeNull();
    const stillThere = await db.membership.findUniqueOrThrow({ where: { id: oldMembershipId } });
    expect(stillThere.userId).toBe(oldUserId);
  });

  it("⚠ a successful preview does not license a merge without the password", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    const preview = await previewMerge(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(preview.ok).toBe(true);

    /**
     * THE PASSWORD ON THE ACCOUNT IS STILL RIGHT — only the one submitted is
     * wrong, and that is the whole point of this test.
     *
     * The sibling test below changes the stored hash instead, which fails for
     * ANY submitted value and so cannot tell "re-verified the submission" apart
     * from "reused what the preview was granted". Mutation testing found that:
     * a version of `mergeAccounts` that replayed the preview's password passed
     * the whole suite. This is the case that kills it.
     */
    const result = await mergeAccounts(keeper, {
      identifier: OLD_EMAIL,
      password: "not-the-password-at-all",
    });
    expect(result.ok).toBe(false);

    const old = await db.user.findUniqueOrThrow({ where: { id: oldUserId } });
    expect(old.disabledAt).toBeNull();
    expect(old.mergedIntoUserId).toBeNull();
  });

  it("re-checks the password at the merge rather than trusting the preview", async () => {
    await makeForkedPupil();
    const keeper = ctx({ userId: newUserId, membershipId: newMembershipId, schoolId: destinationId, role: "STUDENT" });

    const preview = await previewMerge(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(preview.ok).toBe(true);

    // Somebody changes the old account's password between the two screens.
    await db.user.update({
      where: { id: oldUserId },
      data: { passwordHash: await hashPassword("a-completely-new-password-77") },
    });

    const result = await mergeAccounts(keeper, { identifier: OLD_EMAIL, password: PASSWORD });
    expect(result.ok).toBe(false);
  });
});

describe("a parent with two accounts", () => {
  it("brings the children across, and drops a link they already held", async () => {
    await makeForkedPupil();

    // The pupil at the new school, with two parent accounts pointing at them.
    const oldParent = await db.user.create({
      data: {
        email: THIRD_EMAIL,
        name: "Ade Osei",
        passwordHash: await hashPassword(PASSWORD),
        prefs: "{}",
      },
    });
    await db.guardianship.create({
      data: {
        parentUserId: oldParent.id,
        studentMembershipId: newMembershipId,
        studentSchoolId: destinationId,
        relation: "PARENT",
        status: "ACTIVE",
      },
    });
    // …and the SAME child already linked to the account that will survive.
    const keeperParentId = oldUserId;
    await db.guardianship.create({
      data: {
        parentUserId: keeperParentId,
        studentMembershipId: newMembershipId,
        studentSchoolId: destinationId,
        relation: "PARENT",
        status: "ACTIVE",
      },
    });

    const keeper = ctx({ userId: keeperParentId, role: "PARENT" });
    const result = await mergeAccounts(keeper, { identifier: THIRD_EMAIL, password: PASSWORD });
    expect(result.ok).toBe(true);

    // One link, not two, and not a unique-constraint crash.
    const links = await db.guardianship.findMany({
      where: { studentMembershipId: newMembershipId },
    });
    expect(links).toHaveLength(1);
    expect(links[0]!.parentUserId).toBe(keeperParentId);
  });
});
