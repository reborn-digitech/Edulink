import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";
import { claimChild } from "@/app/join/actions";
import { decideClaim, waitingClaimsForGuardian, waitingClaimsForOffice } from "@/lib/guardian-claims";
import type { ActiveContext } from "@/lib/session";
import { CLAIM_ATTEMPTS, CLAIM_PER_CODE } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/constants";
import { __setCookie, __resetCookies } from "../tests/stubs/next-headers";

/**
 * ⚠ THE MOST SERIOUS LIMIT IN THIS APP, and the first test `claimChild` has
 * ever had.
 *
 * The form takes a student code and the child's date of birth. Its own comment
 * claimed it "cannot be used to brute-force a birthdate against a known-good
 * code" — true of DISTINGUISHABILITY, since every failure returns the same
 * message and does the same work, and false of RATE. A schoolchild's birthday
 * has a few thousand plausible values and there was no limit at all, so a
 * known-good code plus a loop bought somebody a GUARDIANSHIP over another
 * family's child: their attendance, marks, messages and record.
 *
 * It had no tests because it needs a live session and the `next/headers` stub
 * could not supply one. The stub's cookie jar is primeable now, which is what
 * lets the action be called the way a request calls it.
 */

const db = new PrismaClient();

const SUFFIX = "@zzclaim.test";
const made: string[] = [];
let schoolId: string;
let parentUserId: string;
let existingGuardianUserId: string;
let officeUserId: string;
let childMembershipId: string;
let studentCode: string;

/** The context a session of this person's would resolve to. */
async function who(userId: string, role: ActiveContext["role"]): Promise<ActiveContext> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const membership = role && role !== "PARENT" ? await db.membership.findFirst({ where: { userId, schoolId, role } }) : null;
  return {
    sessionId: "zz-claim",
    membershipId: membership?.id ?? null,
    schoolId: membership ? schoolId : null,
    role,
    user: {
      id: user.id, name: user.name, preferredName: null, email: user.email, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

/** A real session row, and the cookie that names it. */
async function signIn(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  __setCookie(SESSION_COOKIE, token);
}

beforeEach(async () => {
  const school = await db.school.create({
    data: {
      name: "ZZ Claim School",
      slug: `zz-claim-${randomBytes(4).toString("hex")}`,
      code: `ZZC${randomBytes(3).toString("hex").toUpperCase()}`,
      contactEmail: `office${SUFFIX}`,
    },
  });
  schoolId = school.id;

  const child = await db.user.create({
    data: {
      email: `child.${randomBytes(3).toString("hex")}${SUFFIX}`,
      name: "Asha",
      prefs: "{}",
      birthdate: new Date(Date.UTC(2015, 3, 5)),
    },
  });
  made.push(child.id);
  studentCode = `STU-ZZ${randomBytes(3).toString("hex").toUpperCase()}`;
  childMembershipId = (await db.membership.create({
    data: { userId: child.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode },
    select: { id: true },
  })).id;

  // The child's guardian already on the app, and the school's office: the
  // two who would know a claim was wrong, and are told of every one.
  const existing = await db.user.create({
    data: { email: `existing.${randomBytes(3).toString("hex")}${SUFFIX}`, name: "First Guardian", prefs: "{}" },
  });
  made.push(existing.id);
  existingGuardianUserId = existing.id;
  await db.guardianship.create({
    data: { parentUserId: existing.id, studentMembershipId: childMembershipId, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" },
  });
  const office = await db.user.create({
    data: { email: `office.${randomBytes(3).toString("hex")}${SUFFIX}`, name: "The Office", prefs: "{}" },
  });
  made.push(office.id);
  officeUserId = office.id;
  await db.membership.create({ data: { userId: office.id, schoolId, role: "ADMIN", status: "ACTIVE" } });

  const parent = await db.user.create({
    data: { email: `parent.${randomBytes(3).toString("hex")}${SUFFIX}`, name: "Guardian", prefs: "{}" },
  });
  made.push(parent.id);
  parentUserId = parent.id;
  await signIn(parent.id);
});

afterEach(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "claim:" } } });
  await db.notification.deleteMany({ where: { userId: { in: made } } });
  await db.auditLog.deleteMany({ where: { schoolId } });
  await db.guardianClaim.deleteMany({ where: { schoolId } });
  await db.guardianship.deleteMany({ where: { parentUserId: { in: made } } });
  await db.session.deleteMany({ where: { userId: { in: made } } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  made.length = 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("claiming a child", () => {
  it("works with the right code and the right birthday", async () => {
    // The happy path first — otherwise every refusal below could be a fixture
    // that never worked, and a test that refuses for the wrong reason proves
    // nothing.
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-05",
      relation: "PARENT",
    });
    expect(result.ok, JSON.stringify(result.errors)).toBe(true);
    expect(result.pending).toEqual({ schoolName: "ZZ Claim School", alreadyWaiting: false });
  });

  it("⚠ …and the right pair FILES A CLAIM: no guardianship, and the answer does not name the child", async () => {
    const result = await claimChild({ studentCode, birthdate: "2015-04-05", relation: "GUARDIAN" });
    expect(JSON.stringify(result)).not.toContain("Asha");
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
    expect(await db.guardianClaim.findFirst({ where: { claimantUserId: parentUserId }, select: { status: true, relation: true, studentMembershipId: true } })).toEqual({
      status: "PENDING",
      relation: "GUARDIAN",
      studentMembershipId: childMembershipId,
    });
    // Claiming again while it waits is the same claim, and rings nobody twice.
    const again = await claimChild({ studentCode, birthdate: "2015-04-05", relation: "GUARDIAN" });
    expect(again.pending?.alreadyWaiting).toBe(true);
    expect(await db.guardianClaim.count({ where: { claimantUserId: parentUserId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: officeUserId } })).toBe(1);
  });

  it("⚠ the office approves it, and only then is there a guardianship", async () => {
    await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    const office = await who(officeUserId, "ADMIN");
    const [claim] = await waitingClaimsForOffice(office);
    expect(claim).toMatchObject({ claimantName: "Guardian", childName: "Asha", relation: "PARENT", schoolName: "ZZ Claim School" });
    await decideClaim(office, claim!.id, "APPROVE");
    expect(await db.guardianship.findFirst({ where: { parentUserId, studentMembershipId: childMembershipId }, select: { status: true, relation: true } })).toEqual({ status: "ACTIVE", relation: "PARENT" });
    expect((await db.notification.findFirst({ where: { userId: parentUserId } }))?.title).toContain("Asha");
    const approved = await db.auditLog.findFirst({ where: { schoolId, action: "parent.claim" } });
    expect(approved?.actorUserId).toBe(parentUserId);
    expect(approved?.meta).toContain(officeUserId);
    await expect(decideClaim(office, claim!.id, "DECLINE")).rejects.toThrow();
  });

  it("⚠ a guardian the child already has may decide it; the claimant, a stranger and a teacher may not", async () => {
    await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    const claim = await db.guardianClaim.findFirstOrThrow({ where: { claimantUserId: parentUserId } });

    await expect(decideClaim(await who(parentUserId, null), claim.id, "APPROVE")).rejects.toMatchObject({ key: "access.claimNotFound" });
    const stranger = await db.user.create({ data: { email: `stranger.${randomBytes(3).toString("hex")}${SUFFIX}`, name: "Stranger", prefs: "{}" } });
    made.push(stranger.id);
    await expect(decideClaim(await who(stranger.id, "PARENT"), claim.id, "APPROVE")).rejects.toMatchObject({ key: "access.claimNotFound" });
    await db.membership.create({ data: { userId: stranger.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
    await expect(decideClaim(await who(stranger.id, "TEACHER"), claim.id, "APPROVE")).rejects.toMatchObject({ key: "access.claimNotFound" });
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);

    expect((await waitingClaimsForGuardian(existingGuardianUserId)).map((row) => row.id)).toEqual([claim.id]);
    expect(await waitingClaimsForGuardian(stranger.id)).toEqual([]);
    await decideClaim(await who(existingGuardianUserId, "PARENT"), claim.id, "DECLINE", "We do not know you.");
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
    expect(await db.guardianClaim.findUniqueOrThrow({ where: { id: claim.id }, select: { status: true, declineReason: true } })).toEqual({ status: "DECLINED", declineReason: "We do not know you." });
    expect((await db.auditLog.findFirst({ where: { schoolId, action: "parent.claim.decline" } }))?.meta).not.toContain("do not know");

    // Seven days after a no: the right pair again is refused in its own words, and files nothing.
    const soon = await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    expect(soon.ok).toBe(false);
    expect(soon.errors._form).toMatch(/cannot be made again for 7 days/);
    expect(await db.guardianClaim.count({ where: { claimantUserId: parentUserId, status: "PENDING" } })).toBe(0);
    await db.guardianClaim.update({ where: { id: claim.id }, data: { decidedAt: new Date(Date.now() - 8 * 86_400_000) } });
    await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "claim:" } } });
    expect((await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" })).pending?.alreadyWaiting).toBe(false);
    // Told that it was not accepted, and at which school; not whose child it was.
    const told = await db.notification.findFirst({ where: { userId: parentUserId, titleKey: "claim.notifDeclined" } });
    expect(told?.title).toContain("ZZ Claim School");
    expect(told?.body).toBe("The school said: We do not know you.");
    expect(`${told?.title} ${told?.body}`).not.toContain("Asha");
  });

  it("⚠ a claim nobody decided in thirty days is in nobody's queue and cannot be approved", async () => {
    await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    const claim = await db.guardianClaim.findFirstOrThrow({ where: { claimantUserId: parentUserId } });
    await db.guardianClaim.update({ where: { id: claim.id }, data: { createdAt: new Date(Date.now() - 31 * 86_400_000) } });
    const office = await who(officeUserId, "ADMIN");
    expect(await waitingClaimsForOffice(office)).toEqual([]);
    expect(await waitingClaimsForGuardian(existingGuardianUserId)).toEqual([]);
    await expect(decideClaim(office, claim.id, "APPROVE")).rejects.toMatchObject({ key: "access.thatRequestHasExpired" });
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);

    const { expireRequests } = await import("@/lib/request-expiry");
    expect(await expireRequests(new Date(), { schoolIds: [schoolId] })).toMatchObject({ joins: 0, claims: 1, perSchool: { [schoolId]: { claimsExpired: 1 } } });
    const told = await db.notification.findFirst({ where: { userId: parentUserId, titleKey: "claim.notifExpired" } });
    expect(told?.title).toContain("ZZ Claim School");
    expect(`${told?.title} ${told?.body}`).not.toContain("Asha");
  });

  it("⚠ a pupil who left while the claim waited cannot be approved", async () => {
    await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    const claim = await db.guardianClaim.findFirstOrThrow({ where: { claimantUserId: parentUserId } });
    await db.membership.update({ where: { id: childMembershipId }, data: { leftAt: new Date() } });
    await expect(decideClaim(await who(officeUserId, "ADMIN"), claim.id, "APPROVE")).rejects.toMatchObject({ key: "access.thatPupilHasLeft" });
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ …and the child's existing guardian and the school's office are told who is asking", async () => {
    // A wrong claim — a code off a photographed letter and a guessed or
    // known birthday — is now seen the same minute by the people who would
    // know it was wrong, rather than at the next parents' evening.
    const result = await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    expect(result.ok, JSON.stringify(result.errors)).toBe(true);
    for (const userId of [existingGuardianUserId, officeUserId]) {
      const told = await db.notification.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      expect(told?.title, userId).toContain("Guardian");
      expect(told?.title).toContain("Asha");
    }
    // The claimant is not told about themselves.
    expect(await db.notification.count({ where: { userId: parentUserId } })).toBe(0);
  });

  it("⚠ a pupil who has left cannot be claimed, and the certificate's code confirms nothing", async () => {
    await db.membership.update({ where: { id: childMembershipId }, data: { leftAt: new Date("2026-04-30T00:00:00Z") } });
    const result = await claimChild({ studentCode, birthdate: "2015-04-05", relation: "PARENT" });
    expect(result.ok).toBe(false);
    // The same sentence as a wrong code or a wrong birthday.
    const wrong = await claimChild({ studentCode, birthdate: "2015-04-06", relation: "PARENT" });
    expect(result.errors._form).toBe(wrong.errors._form);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
    expect(await db.notification.count({ where: { userId: existingGuardianUserId } })).toBe(0);
  });

  it("refuses the right code with the wrong birthday", async () => {
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-06",
      relation: "PARENT",
    });
    expect(result.ok).toBe(false);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ stops a birthday search dead, per caller", async () => {
    /**
     * THE BUG. Without this, a loop over a few thousand plausible birthdays
     * against a known-good code makes somebody the guardian of a child they
     * have never met. The allowance is what turns that into weeks of audited
     * attempts.
     */
    let refusal: string | undefined;
    for (let i = 0; i < CLAIM_ATTEMPTS.limit + 1; i++) {
      // A different wrong birthday each time, as a search would use.
      const day = String(6 + (i % 20)).padStart(2, "0");
      const result = await claimChild({
        studentCode,
        birthdate: `2015-04-${day}`,
        relation: "PARENT",
      });
      const message = result.errors._form ?? "";
      if (/too many/i.test(message)) {
        refusal = message;
        break;
      }
    }
    expect(refusal, "the search must stop").toBeDefined();
    expect(refusal).toMatch(/try again/i);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ …and the RIGHT birthday is refused too once the allowance is gone", async () => {
    // A limit that lets a correct guess through after the wrong ones is not a
    // limit — it is exactly the last step of the search.
    for (let i = 0; i < CLAIM_ATTEMPTS.limit + 1; i++) {
      await claimChild({ studentCode, birthdate: "2015-04-06", relation: "PARENT" });
    }
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-05",
      relation: "PARENT",
    });
    expect(result.ok).toBe(false);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ a second account cannot pick the search up where the first left off", async () => {
    /**
     * WHY THERE ARE TWO BUCKETS. The per-caller limit makes grinding cost an
     * account; without a per-CODE limit, an attacker just makes more accounts
     * and the child is no better protected.
     */
    for (let i = 0; i < CLAIM_ATTEMPTS.limit; i++) {
      await claimChild({ studentCode, birthdate: "2015-04-06", relation: "PARENT" });
    }

    // A fresh account, a fresh caller allowance — and the code's own allowance
    // has been running down the whole time.
    let refusal: string | undefined;
    for (let account = 0; account < 5 && !refusal; account++) {
      const next = await db.user.create({
        data: { email: `more.${randomBytes(4).toString("hex")}${SUFFIX}`, name: "Another", prefs: "{}" },
      });
      made.push(next.id);
      await signIn(next.id);

      for (let i = 0; i < CLAIM_ATTEMPTS.limit; i++) {
        const result = await claimChild({
          studentCode,
          birthdate: "2015-04-07",
          relation: "PARENT",
        });
        const message = result.errors._form ?? "";
        if (/too many attempts for that code/i.test(message)) {
          refusal = message;
          break;
        }
      }
    }

    expect(
      refusal,
      `the code's own allowance (${CLAIM_PER_CODE.limit}) must run out however many accounts try`,
    ).toBeDefined();
  });
});
