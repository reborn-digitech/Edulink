import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { createPost, pendingByAuthor, moderateAuthorPending } from "@/lib/bulletin";
import { inviteExpert, acceptExpertInvite } from "@/lib/experts";
import { admitPupils } from "@/lib/intake";
import type { ActiveContext } from "@/lib/session";

/**
 * The fixes the three-school simulation forced, pinned:
 *
 *   - an expert invitation accepted ATOMICALLY (user + profile + consumed
 *     invite in one transaction), and its emailed link actually emailed;
 *   - a ceiling on posting, so one child cannot bury a review queue;
 *   - a bulk decision over one author's queue that is exactly many single
 *     decisions;
 *   - intake naming a malformed birthdate as what it is, and warning when a
 *     class's cohort has already been promoted away.
 */

const db = new PrismaClient();
const TAG = "ZZ SimFix";

function ctx(over: { userId: string; membershipId?: string | null; schoolId?: string | null; role?: ActiveContext["role"]; isMinor?: boolean }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null,
    user: { id: over.userId, name: `${TAG} actor`, preferredName: null, email: null, avatarKey: null, isMinor: over.isMinor ?? false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

let schoolId: string;
let admin: ActiveContext;
let pupil: ActiveContext;
let pupilUserId: string;

async function cleanup() {
  const users = await db.user.findMany({ where: { OR: [{ name: { startsWith: TAG } }, { email: { endsWith: "@simfix.test" } }] }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.post.deleteMany({ where: { title: { startsWith: TAG } } });
  await db.rateLimit.deleteMany({ where: { bucket: { contains: "post:" } } });
  await db.expertInvite.deleteMany({ where: { email: { endsWith: "@simfix.test" } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: ids } } });
  await db.outboundEmail.deleteMany({ where: { to: { endsWith: "@simfix.test" } } });
  await db.enrollment.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.class.deleteMany({ where: { name: { startsWith: TAG } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId, role: "ADMIN" });

  await cleanup();

  const child = await db.user.create({ data: { name: `${TAG} Pupil`, isMinor: true, prefs: "{}" } });
  const childM = await db.membership.create({ data: { userId: child.id, schoolId, role: "STUDENT", status: "ACTIVE" } });
  pupil = ctx({ userId: child.id, membershipId: childM.id, schoolId, role: "STUDENT", isMinor: true });
  pupilUserId = child.id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("⚠ a ceiling on enthusiasm, and a broom for the queue", () => {
  it("lets a pupil post five times and names the sixth for what it is", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await createPost(pupil, { scope: "SCHOOL", title: `${TAG} flood ${i}`, body: "spam", tags: [], media: [], category: "CAMPUS" });
      expect(r.status).toBe("PENDING");
    }
    await expect(
      createPost(pupil, { scope: "SCHOOL", title: `${TAG} flood 6`, body: "spam", tags: [], media: [], category: "CAMPUS" }),
    ).rejects.toMatchObject({ key: "access.youArePostingALot" });
  });

  it("shows the admin the flood as ONE row, and one decision clears it", async () => {
    const authors = await pendingByAuthor(admin);
    const row = authors.find((a) => a.authorUserId === pupilUserId);
    expect(row?.count).toBe(5);

    const { decided } = await moderateAuthorPending(admin, pupilUserId, "REJECT", "One thought per post, please.");
    expect(decided).toBe(5);
    const still = await db.post.count({ where: { authorUserId: pupilUserId, status: "PENDING" } });
    expect(still).toBe(0);
    // The ordinary reviewer wrote every status — same path, not a second one.
    const rejected = await db.post.findFirst({ where: { authorUserId: pupilUserId, status: "REJECTED" }, select: { rejectionReason: true } });
    expect(rejected?.rejectionReason).toContain("One thought");
  });

  it("keeps the broom out of a teacher's hands", async () => {
    const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
    const tomM = await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } });
    await expect(
      moderateAuthorPending(ctx({ userId: tom.id, membershipId: tomM.id, schoolId, role: "TEACHER" }), pupilUserId, "APPROVE"),
    ).rejects.toThrow(AccessError);
  });
});

describe("⚠ an expert invitation that finishes what it starts", () => {
  it("emails the link when an address was given", async () => {
    await inviteExpert(admin, { email: "kedar@simfix.test", name: `${TAG} Expert` });
    const mail = await db.outboundEmail.findFirst({ where: { to: "kedar@simfix.test" }, orderBy: { createdAt: "desc" } });
    expect(mail?.subject).toContain("expert");
    expect(mail?.text).toMatch(/\/expert\/invite\//);
  });

  it("accepts atomically: user, profile and consumed invite in one call — and only once", async () => {
    const invited = await inviteExpert(admin, { email: "asha@simfix.test", name: `${TAG} Second` });
    const token = (invited as { token: string }).token;

    const accepted = await acceptExpertInvite(token, {
      create: { email: "asha@simfix.test", name: `${TAG} Second`, passwordHash: "x", prefs: "{}" },
    }, { headline: "Astronomy nights for schools" });

    const user = await db.user.findUnique({ where: { email: "asha@simfix.test" } });
    const profile = await db.expertProfile.findUnique({ where: { userId: accepted.userId } });
    expect(user?.id).toBe(accepted.userId);
    expect(profile?.headline).toContain("Astronomy");
    const invite = await db.expertInvite.findFirst({ where: { email: "asha@simfix.test" }, orderBy: { createdAt: "desc" } });
    expect(invite?.acceptedUserId).toBe(accepted.userId);

    // The same link a second time buys nothing.
    await expect(
      acceptExpertInvite(token, { userId: accepted.userId }, { headline: "again" }),
    ).rejects.toThrow(AccessError);
  });
});

describe("⚠ intake says what it means", () => {
  it("names a malformed birthdate instead of blaming the transfer code", async () => {
    const res = await admitPupils(admin, [
      { line: 2, name: `${TAG} Malformed`, birthdateKey: "31/02/2015", className: null, guardianEmail: null, guardianName: null, relation: null, pupilEmail: null, studentCode: "STU-ZZZZ-0000" },
    ] as never);
    expect(res.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.badBirthdate" });
  });

  it("warns when the target class's cohort has already moved up", async () => {
    const ghost = await db.class.create({ data: { schoolId, name: `${TAG} Ghost 4A`, gradeLevel: "4", joinCode: "ZZSF-GH4A", promotedAt: new Date() } });
    const res = await admitPupils(admin, [
      { line: 2, name: `${TAG} Newcomer`, birthdateKey: "2015-03-14", className: ghost.name, guardianEmail: null, guardianName: null, relation: null, pupilEmail: null, studentCode: null },
    ] as never);
    expect(res.outcomes[0]).toMatchObject({ status: "admitted", warnKey: "intake.classWasPromoted" });
  });
});
