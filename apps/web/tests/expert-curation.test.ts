import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listExpertsForCuration, setExpertStanding } from "@/lib/superuser";
import { createMentorship, closeMentorship } from "@/lib/mentoring";
import { bookSlot } from "@/lib/experts";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Curating the expert marketplace, and the cap an expert agreed to.
 *
 * TWO CLAIMS, AND THE FIRST ONE IS THAT THE DOOR HAS A HANDLE. `publishedAt`
 * has always been the curation gate and has always worked — an unpublished
 * expert is invisible, unbookable and unpairable. Nothing in the application
 * ever SET it. Only the seed did, so on a real installation the marketplace was
 * a finished feature nobody could ever put anybody into. The same shape as the
 * empty VAPID keys and the unused AUTH_SECRET.
 *
 * THE SECOND IS THE CAP, and it is a promise to children rather than a display
 * preference. An expert who said "three" meant three CHILDREN, not three per
 * school — but `MentorThread` is school-scoped, so counting it from inside one
 * school would wave them past their limit at every school after the first. The
 * count therefore lives on the profile, which belongs to no school, and is
 * claimed with a conditional update so two schools cannot both take the last
 * place. `⚠ across schools` below is the test that would have caught the
 * obvious implementation.
 */

const db = new PrismaClient();

const OPERATOR_EMAIL = "curation.operator@zzcuration.test";
const EXPERT_EMAIL = "curation.expert@zzcuration.test";
const SCHOOL_A_SLUG = "zz-curation-a";
const SCHOOL_B_SLUG = "zz-curation-b";

let operator: ActiveContext;
let adminA: ActiveContext;
let adminB: ActiveContext;
let schoolAId: string;
let schoolBId: string;
let profileId: string;
let pupilAId: string;
let pupilA2Id: string;
let pupilBId: string;

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
  const a = await db.school.upsert({
    where: { slug: SCHOOL_A_SLUG },
    create: { name: "ZZ Curation A", slug: SCHOOL_A_SLUG, code: "ZZCUR-A", contactEmail: "a@zzcuration.test" },
    update: {},
  });
  const b = await db.school.upsert({
    where: { slug: SCHOOL_B_SLUG },
    create: { name: "ZZ Curation B", slug: SCHOOL_B_SLUG, code: "ZZCUR-B", contactEmail: "b@zzcuration.test" },
    update: {},
  });
  schoolAId = a.id;
  schoolBId = b.id;

  const op = await db.user.upsert({
    where: { email: OPERATOR_EMAIL },
    create: { email: OPERATOR_EMAIL, name: "Operator", isSuperuser: true, prefs: "{}" },
    update: { isSuperuser: true },
  });
  operator = ctx({ userId: op.id, user: { isSuperuser: true } as ActiveContext["user"] });

  const mkAdmin = async (schoolId: string, email: string) => {
    const user = await db.user.upsert({
      where: { email },
      create: { email, name: "Curation Admin", prefs: "{}" },
      update: {},
    });
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId, role: "ADMIN" } },
      create: { userId: user.id, schoolId, role: "ADMIN", status: "ACTIVE" },
      update: { status: "ACTIVE", leftAt: null },
    });
    return ctx({ userId: user.id, membershipId: membership.id, schoolId, role: "ADMIN" });
  };
  adminA = await mkAdmin(schoolAId, "curation.admin.a@zzcuration.test");
  adminB = await mkAdmin(schoolBId, "curation.admin.b@zzcuration.test");

  const mkPupil = async (schoolId: string, email: string) => {
    const user = await db.user.upsert({
      where: { email },
      create: { email, name: "Curation Pupil", prefs: "{}" },
      update: {},
    });
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId, role: "STUDENT" } },
      create: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE" },
      update: { status: "ACTIVE", leftAt: null },
    });
    return membership.id;
  };
  pupilAId = await mkPupil(schoolAId, "curation.pupil.a@zzcuration.test");
  pupilA2Id = await mkPupil(schoolAId, "curation.pupil.a2@zzcuration.test");
  pupilBId = await mkPupil(schoolBId, "curation.pupil.b@zzcuration.test");
});

/** A fresh, UNPUBLISHED expert before every test. */
async function makeExpert(over: {
  offering?: string;
  mentorCapacity?: number | null;
  headline?: string;
} = {}): Promise<void> {
  await db.mentorThread.deleteMany({ where: { expert: { user: { email: EXPERT_EMAIL } } } });
  await db.expertProfile.deleteMany({ where: { user: { email: EXPERT_EMAIL } } });
  const user = await db.user.upsert({
    where: { email: EXPERT_EMAIL },
    create: { email: EXPERT_EMAIL, name: "Nadia Expert", prefs: "{}" },
    update: {},
  });
  const profile = await db.expertProfile.create({
    data: {
      userId: user.id,
      headline: over.headline ?? "Marine biologist",
      offering: over.offering ?? "BOTH",
      mentorCapacity: over.mentorCapacity === undefined ? null : over.mentorCapacity,
      publishedAt: null,
    },
  });
  profileId = profile.id;
}

afterEach(async () => {
  await db.mentorThread.deleteMany({ where: { expert: { user: { email: EXPERT_EMAIL } } } });
});

afterAll(async () => {
  await db.mentorThread.deleteMany({ where: { expert: { user: { email: EXPERT_EMAIL } } } });
  await db.expertProfile.deleteMany({ where: { user: { email: EXPERT_EMAIL } } });
  await db.school.deleteMany({ where: { slug: { in: [SCHOOL_A_SLUG, SCHOOL_B_SLUG] } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@zzcuration.test" } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("the operator curates the marketplace", () => {
  it("⚠ publishes an expert, which nothing in the app could do before", async () => {
    await makeExpert();

    const before = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(before.publishedAt).toBeNull();

    expect(await setExpertStanding(operator, profileId, { published: true, verified: true })).toEqual({
      ok: true,
    });

    const after = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(after.publishedAt).not.toBeNull();
    expect(after.verifiedAt).not.toBeNull();
    expect(after.verifiedBy).toBe(operator.user.id);
  });

  it("⚠ published and verified are separate claims", async () => {
    await makeExpert();
    await setExpertStanding(operator, profileId, { published: true, verified: false });

    // A marketplace that made listing imply checking would be telling schools
    // something nobody had done.
    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt).not.toBeNull();
    expect(row.verifiedAt).toBeNull();
  });

  it("keeps the original listing date when re-saving a published expert", async () => {
    await makeExpert();
    await setExpertStanding(operator, profileId, { published: true, verified: false });
    const first = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });

    await setExpertStanding(operator, profileId, { published: true, verified: true });
    const second = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(second.publishedAt).toEqual(first.publishedAt);
  });

  it("⚠ refuses to publish a profile with no headline", async () => {
    // Accepting an invitation creates a profile with whatever the invitation
    // carried, which can be nothing. Publishing that puts a blank card in a
    // marketplace and tells a school it has been curated.
    await makeExpert({ headline: "" });

    const result = await setExpertStanding(operator, profileId, { published: true, verified: false });
    expect(result.ok).toBe(false);

    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt).toBeNull();
  });

  it("⚠ refuses anybody who does not run the server", async () => {
    await makeExpert();

    await expect(setExpertStanding(adminA, profileId, { published: true, verified: true })).rejects
      .toBeInstanceOf(AccessError);
    await expect(listExpertsForCuration(adminA)).rejects.toBeInstanceOf(AccessError);

    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt).toBeNull();
  });

  it("⚠ unpublishing does not end anything already agreed", async () => {
    await makeExpert({ mentorCapacity: 2 });
    await setExpertStanding(operator, profileId, { published: true, verified: false });
    const { threadId } = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Marine biology mentoring",
    });

    await setExpertStanding(operator, profileId, { published: false, verified: false });

    // A child who has a mentor must not lose them because an adult was taken
    // off a list. It stops them being FOUND, not being anybody's mentor.
    const thread = await db.mentorThread.findUniqueOrThrow({ where: { id: threadId } });
    expect(thread.status).not.toBe("CLOSED");
  });

  it("lists unpublished experts first, because that is the queue", async () => {
    await makeExpert();
    const entries = await listExpertsForCuration(operator);
    const ours = entries.findIndex((e) => e.profileId === profileId);
    expect(ours).toBeGreaterThanOrEqual(0);
    expect(entries[ours]!.publishedAt).toBeNull();
    expect(entries[ours]!.name).toBe("Nadia Expert");
  });
});

describe("⚠ what an expert agreed to offer", () => {
  it("refuses to pair a child with somebody who only gives sessions", async () => {
    await makeExpert({ offering: "SESSIONS" });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    // An hour's workshop for a hall and a term with one eleven-year-old are
    // different commitments. The child would be told they have a mentor.
    await expect(
      createMentorship(adminA, {
        expertProfileId: profileId,
        studentMembershipId: pupilAId,
        purpose: "Ongoing support with science",
      }),
    ).rejects.toBeInstanceOf(AccessError);

    expect(await db.mentorThread.count({ where: { expertProfileId: profileId } })).toBe(0);
  });

  it("⚠ refuses to BOOK somebody who only mentors", async () => {
    await makeExpert({ offering: "MENTORING" });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    // A mentoring-only expert may still offer times — mentors and mentees
    // arrange them — and those are not a school's to take for a workshop.
    const slot = await db.expertSlot.create({
      data: {
        expertProfileId: profileId,
        startsAt: new Date(Date.now() + 7 * 86_400_000),
        endsAt: new Date(Date.now() + 7 * 86_400_000 + 3_600_000),
      },
      select: { id: true },
    });

    await expect(bookSlot(adminA, slot.id, "A talk about the sea")).rejects.toBeInstanceOf(
      AccessError,
    );

    // And the slot was not consumed on the way to being refused — a refusal
    // that still claims the time is worse than the booking it prevented.
    const after = await db.expertSlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(after.bookedAt).toBeNull();
  });

  it("allows a booking for SESSIONS and for BOTH", async () => {
    for (const offering of ["SESSIONS", "BOTH"]) {
      await makeExpert({ offering });
      await setExpertStanding(operator, profileId, { published: true, verified: true });
      const slot = await db.expertSlot.create({
        data: {
          expertProfileId: profileId,
          startsAt: new Date(Date.now() + 7 * 86_400_000),
          endsAt: new Date(Date.now() + 7 * 86_400_000 + 3_600_000),
        },
        select: { id: true },
      });
      const booking = await bookSlot(adminA, slot.id, "A talk about the sea");
      expect(booking.bookingId).toBeTruthy();
    }
  });

  it("allows it for MENTORING and for BOTH", async () => {
    for (const offering of ["MENTORING", "BOTH"]) {
      await makeExpert({ offering });
      await setExpertStanding(operator, profileId, { published: true, verified: true });
      const result = await createMentorship(adminA, {
        expertProfileId: profileId,
        studentMembershipId: pupilAId,
        purpose: "Ongoing support with science",
      });
      expect(result.threadId).toBeTruthy();
    }
  });
});

describe("⚠ the cap on how many children at once", () => {
  it("refuses the child past the cap", async () => {
    await makeExpert({ mentorCapacity: 1 });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });

    await expect(
      createMentorship(adminA, {
        expertProfileId: profileId,
        studentMembershipId: pupilA2Id,
        purpose: "Ongoing support with maths",
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ counts ACROSS SCHOOLS — three children means three, not three each", async () => {
    await makeExpert({ mentorCapacity: 1 });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });

    /**
     * THE TEST THAT WOULD HAVE CAUGHT THE OBVIOUS IMPLEMENTATION.
     *
     * Counting `MentorThread` is the natural way to write this and it is wrong:
     * that table is school-scoped by policy, so school B's admin sees zero and
     * sails past a cap school A has already filled. The count lives on
     * ExpertProfile, which belongs to no school, precisely so this fails.
     */
    await expect(
      createMentorship(adminB, {
        expertProfileId: profileId,
        studentMembershipId: pupilBId,
        purpose: "Ongoing support with science",
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ gives the place back when a mentorship ends", async () => {
    await makeExpert({ mentorCapacity: 1 });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    const { threadId } = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });
    await closeMentorship(adminA, threadId);

    // A cap that only counts up silently retires an expert the moment their
    // third pupil moves on, and nothing tells them why schools stopped asking.
    const next = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilA2Id,
      purpose: "Ongoing support with maths",
    });
    expect(next.threadId).toBeTruthy();
  });

  it("⚠ closing twice does not release somebody ELSE's place", async () => {
    /**
     * TWO MENTORSHIPS, AND THE SECOND ONE IS THE TEST.
     *
     * Written first with one, which passed with the early-return guard deleted
     * — mutation testing said so. With a single mentorship the `gt: 0` floor on
     * the decrement masks the bug entirely: 1 → 0, then 0 stays 0.
     *
     * With two it shows: closing thread A twice takes the count 2 → 1 → 0 while
     * thread B is still running, and the expert is then handed a child over the
     * cap they agreed to. The school and the guardian both pressing "end this"
     * on the same afternoon is the ordinary way that happens.
     */
    await makeExpert({ mentorCapacity: 2 });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    const first = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });
    await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilA2Id,
      purpose: "Ongoing support with maths",
    });

    await closeMentorship(adminA, first.threadId);
    await closeMentorship(adminA, first.threadId);

    // One still running, so one place still taken.
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.activeMentorships).toBe(1);
  });

  it("re-asking for the same pairing does not consume a second place", async () => {
    await makeExpert({ mentorCapacity: 1 });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    const first = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });
    const again = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "Ongoing support with science",
    });

    expect(again.threadId).toBe(first.threadId);
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.activeMentorships).toBe(1);
  });

  it("no cap set means no ceiling", async () => {
    await makeExpert({ mentorCapacity: null });
    await setExpertStanding(operator, profileId, { published: true, verified: true });

    await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilAId,
      purpose: "The first pupil",
    });
    const second = await createMentorship(adminA, {
      expertProfileId: profileId,
      studentMembershipId: pupilA2Id,
      purpose: "The second pupil",
    });
    expect(second.threadId).toBeTruthy();
  });
});
