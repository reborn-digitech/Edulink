import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  MAX_OPEN_REQUESTS,
  closeMentorship,
  decideMentorRequest,
  getMentorship,
  listMentorRequests,
  listMentorships,
  postMentorMessage,
  requestMentor,
} from "@/lib/mentoring";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * A pupil asking for a mentor.
 *
 * THE RULE THIS CHANGES, AND THE ONE IT DOES NOT. `mentoring.ts` has always said
 * only school staff may pair a child with an outside adult — not the expert, who
 * would otherwise choose their own mentee, and not the child, who cannot
 * meaningfully consent to a stranger. That still holds. What a pupil can now do
 * is ASK, and an ask grants nothing: the thread is REQUESTED, the expert cannot
 * see it, nobody can write in it, and it does not occupy one of the expert's
 * mentee places. A school approves, and only then is a guardian asked. Two
 * adults still decide.
 *
 * THE SHARPEST TEST IN THIS FILE is that the expert cannot see a request. An
 * outside adult learning that a named eleven-year-old asked for them — before
 * anybody vetted it, and whether or not it is ever approved — is a disclosure
 * about a child to a stranger, made by the child. That is precisely what the
 * approval step exists to prevent, and it would be trivially easy to build
 * without noticing.
 */

const db = new PrismaClient();

const SUFFIX = "@zzmentorreq.test";
const SLUG = "zz-mentor-req";

let schoolId: string;
let expertProfileId: string;
let sessionsOnlyProfileId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let pupil: ActiveContext;
let otherPupil: ActiveContext;
let guardian: ActiveContext;
let expert: ActiveContext;
let pupilMembershipId: string;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: over.user?.name ?? "Test",
      preferredName: over.user?.preferredName ?? null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
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

async function makeExpert(email: string, name: string, over: { offering?: string; capacity?: number | null } = {}) {
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, prefs: "{}" },
    update: {},
  });
  const profile = await db.expertProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      headline: "Marine biologist",
      offering: over.offering ?? "BOTH",
      mentorCapacity: over.capacity === undefined ? 2 : over.capacity,
      publishedAt: new Date(),
      activeMentorships: 0,
    },
    update: {
      offering: over.offering ?? "BOTH",
      mentorCapacity: over.capacity === undefined ? 2 : over.capacity,
      publishedAt: new Date(),
      activeMentorships: 0,
    },
  });
  return { userId: user.id, profileId: profile.id };
}

beforeAll(async () => {
  const school = await db.school.upsert({
    where: { slug: SLUG },
    create: { name: "ZZ Mentor Req School", slug: SLUG, code: "ZZMREQ", contactEmail: `o${SUFFIX}` },
    update: {},
  });
  schoolId = school.id;

  const mk = async (email: string, name: string, role: string) => {
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, preferredName: name.split(" ")[0], prefs: "{}" },
      update: {},
    });
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId, role } },
      create: { userId: user.id, schoolId, role, status: "ACTIVE" },
      update: { status: "ACTIVE", leftAt: null },
    });
    return { userId: user.id, membershipId: membership.id, name };
  };

  const a = await mk(`admin${SUFFIX}`, "Ada Admin", "ADMIN");
  const t = await mk(`teacher${SUFFIX}`, "Tom Teacher", "TEACHER");
  const p = await mk(`pupil${SUFFIX}`, "Asha Pupil", "STUDENT");
  const p2 = await mk(`pupil2${SUFFIX}`, "Ben Pupil", "STUDENT");
  pupilMembershipId = p.membershipId;

  const guardianUser = await db.user.upsert({
    where: { email: `guardian${SUFFIX}` },
    create: { email: `guardian${SUFFIX}`, name: "Ravi Guardian", prefs: "{}" },
    update: {},
  });
  await db.guardianship.upsert({
    where: {
      parentUserId_studentMembershipId: {
        parentUserId: guardianUser.id,
        studentMembershipId: p.membershipId,
      },
    },
    create: {
      parentUserId: guardianUser.id,
      studentMembershipId: p.membershipId,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  const e = await makeExpert(`expert${SUFFIX}`, "Nadia Expert");
  const s = await makeExpert(`sessions${SUFFIX}`, "Only Workshops", { offering: "SESSIONS" });
  expertProfileId = e.profileId;
  sessionsOnlyProfileId = s.profileId;

  admin = ctx({ userId: a.userId, membershipId: a.membershipId, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: t.userId, membershipId: t.membershipId, schoolId, role: "TEACHER" });
  pupil = ctx({
    userId: p.userId,
    membershipId: p.membershipId,
    schoolId,
    role: "STUDENT",
    user: { preferredName: "Asha" } as ActiveContext["user"],
  });
  otherPupil = ctx({ userId: p2.userId, membershipId: p2.membershipId, schoolId, role: "STUDENT" });
  guardian = ctx({ userId: guardianUser.id, role: "PARENT" });
  expert = ctx({ userId: e.userId, role: "EXPERT" });
});

afterEach(async () => {
  await db.mentorThread.deleteMany({ where: { schoolId } });
  await db.notification.deleteMany({ where: { schoolId } });
  await db.expertProfile.updateMany({
    where: { user: { email: { endsWith: SUFFIX } } },
    data: { activeMentorships: 0, mentorCapacity: 2 },
  });
});

afterAll(async () => {
  await db.mentorThread.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

const WHY = "I would like some help deciding what to study after school.";

/* -------------------------------------------------------------------------- */

describe("a pupil asks", () => {
  it("creates a REQUESTED thread that grants nothing", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    expect(result.ok).toBe(true);

    const thread = await db.mentorThread.findFirstOrThrow({ where: { schoolId } });
    expect(thread.status).toBe("REQUESTED");
    // A request does not occupy a place. Three children with pending requests
    // must not be able to close an expert to a school that approved nobody.
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(0);
  });

  it("⚠ records the pupil as the one who asked", async () => {
    await requestMentor(pupil, { expertProfileId, purpose: WHY });
    const thread = await db.mentorThread.findFirstOrThrow({ where: { schoolId } });
    expect(thread.createdByMembershipId).toBe(pupilMembershipId);
  });

  it("⚠ tells the school and NOT the guardians", async () => {
    await requestMentor(pupil, { expertProfileId, purpose: WHY });

    const notified = await db.notification.findMany({
      where: { schoolId },
      select: { userId: true },
    });
    // A request the school may decline should not become a conversation at home
    // about a stranger the child will never be paired with.
    expect(notified.map((n) => n.userId)).toEqual([admin.user.id]);
    expect(notified.map((n) => n.userId)).not.toContain(guardian.user.id);
  });

  it("refuses a mentor who only gives workshops", async () => {
    const result = await requestMentor(pupil, {
      expertProfileId: sessionsOnlyProfileId,
      purpose: WHY,
    });
    expect(result.ok).toBe(false);
    expect(await db.mentorThread.count({ where: { schoolId } })).toBe(0);
  });

  it("refuses an unpublished mentor, in the same words as one that does not exist", async () => {
    await db.expertProfile.update({
      where: { id: expertProfileId },
      data: { publishedAt: null },
    });
    try {
      const unpublished = await requestMentor(pupil, { expertProfileId, purpose: WHY });
      const invented = await requestMentor(pupil, {
        expertProfileId: "cl000000000000000000000",
        purpose: WHY,
      });
      expect(unpublished).toEqual(invented);
    } finally {
      await db.expertProfile.update({
        where: { id: expertProfileId },
        data: { publishedAt: new Date() },
      });
    }
  });

  it("refuses one who is already full", async () => {
    await db.expertProfile.update({
      where: { id: expertProfileId },
      data: { mentorCapacity: 1, activeMentorships: 1 },
    });
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    expect(result.ok).toBe(false);
  });

  it("wants a sentence, not a word", async () => {
    expect((await requestMentor(pupil, { expertProfileId, purpose: "help" })).ok).toBe(false);
    expect(await db.mentorThread.count({ where: { schoolId } })).toBe(0);
  });

  it("⚠ caps how many can be waiting at once", async () => {
    for (let i = 0; i < MAX_OPEN_REQUESTS; i += 1) {
      const e = await makeExpert(`bulk${i}${SUFFIX}`, `Bulk Expert ${i}`);
      expect((await requestMentor(pupil, { expertProfileId: e.profileId, purpose: WHY })).ok).toBe(
        true,
      );
    }
    const overflow = await makeExpert(`overflow${SUFFIX}`, "One Too Many");
    const result = await requestMentor(pupil, {
      expertProfileId: overflow.profileId,
      purpose: WHY,
    });
    expect(result.ok).toBe(false);
    // The lib mints a KEY now; the action boundary owns the words.
    expect(result.ok === false && result.errorKey).toBe("mentoring.openRequests");
  });

  it("refuses asking the same mentor twice", async () => {
    await requestMentor(pupil, { expertProfileId, purpose: WHY });
    const again = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    expect(again.ok).toBe(false);
    expect(await db.mentorThread.count({ where: { schoolId } })).toBe(1);
  });

  it("⚠ refuses anybody who is not a pupil", async () => {
    await expect(requestMentor(admin, { expertProfileId, purpose: WHY })).rejects.toBeInstanceOf(
      AccessError,
    );
    await expect(requestMentor(guardian, { expertProfileId, purpose: WHY })).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("⚠ the expert cannot see a request", () => {
  it("⚠ it is absent from their list", async () => {
    await requestMentor(pupil, { expertProfileId, purpose: WHY });

    /**
     * THE SHARPEST CLAIM IN THIS FILE. An outside adult learning that a named
     * child asked for them — before anybody vetted it — is a disclosure about a
     * child to a stranger, made by the child.
     */
    expect(await listMentorships(expert)).toEqual([]);
  });

  it("⚠ nor can they open it with the id", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await expect(getMentorship(expert, result.threadId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ nobody can write in it, including the pupil who asked", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await expect(postMentorMessage(pupil, result.threadId, "hello")).rejects.toBeInstanceOf(
      AccessError,
    );
    await expect(postMentorMessage(expert, result.threadId, "hello")).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("the pupil, their guardian and the school CAN see it", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    expect((await listMentorships(pupil)).map((t) => t.status)).toEqual(["REQUESTED"]);
    expect((await listMentorships(guardian)).map((t) => t.status)).toEqual(["REQUESTED"]);
    expect((await listMentorships(admin)).map((t) => t.status)).toEqual(["REQUESTED"]);
  });
});

describe("the school decides", () => {
  it("⚠ approving claims the place and asks the guardians", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");
    await db.notification.deleteMany({ where: { schoolId } });

    expect(await decideMentorRequest(admin, result.threadId, { approve: true })).toEqual({
      ok: true,
    });

    const thread = await db.mentorThread.findUniqueOrThrow({ where: { id: result.threadId } });
    expect(thread.status).toBe("PENDING_CONSENT");
    expect(thread.decidedByMembershipId).toBe(admin.membershipId);

    // The place is claimed at APPROVAL, not when the pupil asked.
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(1);

    // NOW the guardians hear about it, for the first time.
    const notified = await db.notification.findMany({ where: { schoolId }, select: { userId: true } });
    expect(notified.map((n) => n.userId)).toContain(guardian.user.id);
  });

  it("⚠ the expert sees it once it is approved", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");
    expect(await listMentorships(expert)).toEqual([]);

    await decideMentorRequest(admin, result.threadId, { approve: true });
    expect((await listMentorships(expert)).map((t) => t.status)).toEqual(["PENDING_CONSENT"]);
  });

  it("⚠ declining closes it, tells the pupil, and frees nothing", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");
    await db.notification.deleteMany({ where: { schoolId } });

    await decideMentorRequest(admin, result.threadId, {
      approve: false,
      reason: "Let us try somebody at the school first.",
    });

    const thread = await db.mentorThread.findUniqueOrThrow({ where: { id: result.threadId } });
    expect(thread.status).toBe("CLOSED");
    expect(thread.declineReason).toContain("somebody at the school");

    // A request that simply never becomes anything is the worst version of this.
    const notified = await db.notification.findMany({ where: { schoolId }, select: { userId: true } });
    expect(notified.map((n) => n.userId)).toEqual([pupil.user.id]);

    // It never held a place, so declining must not hand one over.
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(0);
  });

  it("⚠ refuses to approve when the mentor filled up while it waited", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await db.expertProfile.update({
      where: { id: expertProfileId },
      data: { mentorCapacity: 1, activeMentorships: 1 },
    });

    const decision = await decideMentorRequest(admin, result.threadId, { approve: true });
    expect(decision.ok).toBe(false);
    expect(decision.ok === false && decision.errorKey).toBe("mentoring.filledUp");

    // Still waiting, not silently approved over the cap.
    const thread = await db.mentorThread.findUniqueOrThrow({ where: { id: result.threadId } });
    expect(thread.status).toBe("REQUESTED");
  });

  it("⚠ a teacher cannot decide, and neither can the pupil", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await expect(
      decideMentorRequest(teacher, result.threadId, { approve: true }),
    ).rejects.toBeInstanceOf(AccessError);
    await expect(
      decideMentorRequest(pupil, result.threadId, { approve: true }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ lists what is waiting, for the school only", async () => {
    await requestMentor(pupil, { expertProfileId, purpose: WHY });

    const waiting = await listMentorRequests(admin);
    expect(waiting).toHaveLength(1);
    expect(waiting[0]!.studentName).toBe("Asha");
    expect(waiting[0]!.purpose).toBe(WHY);

    await expect(listMentorRequests(teacher)).rejects.toBeInstanceOf(AccessError);
    await expect(listMentorRequests(pupil)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ cannot decide another school's request", async () => {
    /**
     * `decideMentorRequest` re-queries the thread WITH the session's schoolId
     * rather than trusting the id — assert, don't accept. Without a second
     * school in the fixture, "scoped to my school" and "any request anywhere"
     * are the same test.
     */
    const other = await db.school.upsert({
      where: { slug: `${SLUG}-2` },
      create: {
        name: "ZZ Mentor Req Other",
        slug: `${SLUG}-2`,
        code: "ZZMREQ2",
        contactEmail: `o2${SUFFIX}`,
      },
      update: {},
    });
    const strangerUser = await db.user.upsert({
      where: { email: `stranger${SUFFIX}` },
      create: { email: `stranger${SUFFIX}`, name: "Elsewhere Pupil", prefs: "{}" },
      update: {},
    });
    const strangerMembership = await db.membership.upsert({
      where: {
        userId_schoolId_role: { userId: strangerUser.id, schoolId: other.id, role: "STUDENT" },
      },
      create: { userId: strangerUser.id, schoolId: other.id, role: "STUDENT", status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
    const strangerPupil = ctx({
      userId: strangerUser.id,
      membershipId: strangerMembership.id,
      schoolId: other.id,
      role: "STUDENT",
    });

    try {
      const theirs = await requestMentor(strangerPupil, { expertProfileId, purpose: WHY });
      if (!theirs.ok) throw new Error("setup failed");

      // Our admin, their request.
      const decision = await decideMentorRequest(admin, theirs.threadId, { approve: true });
      expect(decision.ok).toBe(false);

      const thread = await db.mentorThread.findUniqueOrThrow({ where: { id: theirs.threadId } });
      expect(thread.status).toBe("REQUESTED");
    } finally {
      await db.mentorThread.deleteMany({ where: { schoolId: other.id } });
      await db.school.deleteMany({ where: { slug: `${SLUG}-2` } });
    }
  });

  it("cannot decide the same request twice", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await decideMentorRequest(admin, result.threadId, { approve: true });
    const again = await decideMentorRequest(admin, result.threadId, { approve: true });
    expect(again.ok).toBe(false);

    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(1);
  });
});

describe("⚠ closing a request does not hand back a place", () => {
  it("⚠ because it never held one — and somebody else's place stays taken", async () => {
    /**
     * TWO THREADS, AND THE APPROVED ONE IS THE TEST.
     *
     * Written first with only the request, which passed with the guard deleted
     * — mutation testing said so. At a count of zero the `gt: 0` floor on the
     * decrement hides everything: 0 stays 0 whatever the code does.
     *
     * With a real mentorship already running, releasing a place the request
     * never took shows up as 1 → 0, and the expert is then handed a child over
     * the cap they agreed to.
     */
    const otherRequest = await requestMentor(otherPupil, { expertProfileId, purpose: WHY });
    if (!otherRequest.ok) throw new Error("setup failed");
    await decideMentorRequest(admin, otherRequest.threadId, { approve: true });

    const request = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!request.ok) throw new Error("setup failed");

    await closeMentorship(admin, request.threadId);

    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(1);
  });

  it("but closing an APPROVED one does", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");
    await decideMentorRequest(admin, result.threadId, { approve: true });

    await closeMentorship(admin, result.threadId);
    const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: expertProfileId } });
    expect(profile.activeMentorships).toBe(0);
  });

  it("⚠ and another pupil's request is not this pupil's to close", async () => {
    const result = await requestMentor(pupil, { expertProfileId, purpose: WHY });
    if (!result.ok) throw new Error("setup failed");

    await expect(closeMentorship(otherPupil, result.threadId)).rejects.toBeInstanceOf(AccessError);
  });
});
