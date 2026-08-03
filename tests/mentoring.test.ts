import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  createMentorship,
  consentToMentorship,
  closeMentorship,
  getMentorship,
  listMentorships,
  pairingOptions,
  postMentorMessage,
} from "@/lib/mentoring";
import type { ActiveContext } from "@/lib/session";

/**
 * Mentoring — the rules that make it safe to put an outside adult in touch
 * with a child.
 *
 * WHAT THESE TESTS CAN AND CANNOT SHOW. The suite connects as the database
 * OWNER, so row-level security is not in force here: nothing below proves the
 * tenant boundary. What it proves is the APPLICATION-LAYER half — who
 * `mentoring.ts` will let read, write, consent and close — which is the half a
 * refactor is most likely to break silently, because breaking it produces a
 * page that works rather than an error.
 *
 * The other half, that a PENDING mentorship grants an expert no tenant access
 * at all, lives in the route sweep and in `npm run rls:verify`, because it is a
 * fact about Postgres rather than about this file.
 */

const db = new PrismaClient();

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

const EXPERT_EMAIL = "mentor.unit@expert.test";
const OTHER_EXPERT_EMAIL = "other.mentor.unit@expert.test";

let admin: ActiveContext;
let teacher: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let guardian: ActiveContext;
let strangerParent: ActiveContext;
let child: ActiveContext;
let classmate: ActiveContext;
let expert: ActiveContext;
let otherExpert: ActiveContext;

let expertProfileId: string;
let otherExpertProfileId: string;
let unpublishedProfileId: string;
let studentMembershipId: string;
let riversideId: string;
let createdThreadIds: string[] = [];

async function makeExpert(email: string, published: boolean) {
  const user =
    (await db.user.findUnique({ where: { email } })) ??
    (await db.user.create({ data: { email, name: `Mentor ${email}`, prefs: "{}" } }));
  const profile =
    (await db.expertProfile.findUnique({ where: { userId: user.id } })) ??
    (await db.expertProfile.create({
      data: {
        userId: user.id,
        headline: "Mentoring for tests",
        publishedAt: published ? new Date() : null,
      },
    }));
  return { userId: user.id, profileId: profile.id };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const parent = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });

  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  const guardianship = await db.guardianship.findFirstOrThrow({
    where: { parentUserId: parent.id, student: { schoolId: riverside.id }, status: "ACTIVE" },
    include: { student: { include: { user: true } } },
  });
  studentMembershipId = guardianship.studentMembershipId;

  const other = await db.membership.findFirstOrThrow({
    where: { schoolId: riverside.id, role: "STUDENT", id: { not: studentMembershipId } },
    include: { user: true },
  });

  const one = await makeExpert(EXPERT_EMAIL, true);
  const two = await makeExpert(OTHER_EXPERT_EMAIL, true);
  const three = await makeExpert("unpublished.unit@expert.test", false);
  expertProfileId = one.profileId;
  otherExpertProfileId = two.profileId;
  unpublishedProfileId = three.profileId;

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riverside.id, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId: riverside.id, role: "TEACHER" });
  otherSchoolAdmin = ctx({ userId: sam.id, membershipId: samAdmin.id, schoolId: oakfield.id, role: "ADMIN" });
  guardian = ctx({ userId: parent.id, role: "PARENT" });
  strangerParent = ctx({ userId: sam.id, role: "PARENT" });
  child = ctx({
    userId: guardianship.student.user.id,
    membershipId: studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  classmate = ctx({
    userId: other.user.id,
    membershipId: other.id,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  expert = ctx({ userId: one.userId, role: "EXPERT" });
  otherExpert = ctx({ userId: two.userId, role: "EXPERT" });
});

afterEach(async () => {
  if (createdThreadIds.length) {
    await db.mentorThread.deleteMany({ where: { id: { in: createdThreadIds } } });
    createdThreadIds = [];
  }
});

afterAll(async () => {
  await db.mentorThread.deleteMany({ where: { expertProfileId: { in: [expertProfileId, otherExpertProfileId] } } });
  await db.expertProfile.deleteMany({
    where: { id: { in: [expertProfileId, otherExpertProfileId, unpublishedProfileId] } },
  });
  await db.user.deleteMany({
    where: { email: { in: [EXPERT_EMAIL, OTHER_EXPERT_EMAIL, "unpublished.unit@expert.test"] } },
  });
  await db.$disconnect();
});

async function pair(by: ActiveContext = admin, profileId = expertProfileId) {
  const { threadId } = await createMentorship(by, {
    expertProfileId: profileId,
    studentMembershipId,
    purpose: "Careers conversation about engineering",
  });
  createdThreadIds.push(threadId);
  return threadId;
}

/* -------------------------------------------------------------------------- */

describe("who may pair a child with a mentor", () => {
  it("lets a school admin do it", async () => {
    const id = await pair(admin);
    expect(id).toBeTruthy();
  });

  it("lets a teacher do it", async () => {
    const id = await pair(teacher);
    expect(id).toBeTruthy();
  });

  it("⚠ refuses the child — a child cannot consent to a stranger", async () => {
    await expect(pair(child)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a guardian — they consent, they do not choose", async () => {
    await expect(pair(guardian)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses the expert — nobody picks their own mentee", async () => {
    await expect(pair(expert)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses an unpublished expert, who nobody has checked", async () => {
    await expect(pair(admin, unpublishedProfileId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a pupil from another school", async () => {
    await expect(
      createMentorship(otherSchoolAdmin, {
        expertProfileId,
        studentMembershipId,
        purpose: "Should not resolve",
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses an empty purpose — the guardian is asked to judge on it", async () => {
    await expect(
      createMentorship(admin, { expertProfileId, studentMembershipId, purpose: "  " }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("is idempotent for the same pair rather than creating a second thread", async () => {
    const first = await pair(admin);
    const { threadId: second } = await createMentorship(admin, {
      expertProfileId,
      studentMembershipId,
      purpose: "A different reason",
    });
    expect(second).toBe(first);
  });

  it("starts life awaiting consent, never active", async () => {
    const id = await pair(admin);
    const row = await db.mentorThread.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("PENDING_CONSENT");
    expect(row.parentConsentAt).toBeNull();
  });
});

describe("⚠ the thread is never private", () => {
  it("is readable by the child's guardian", async () => {
    const id = await pair();
    await expect(getMentorship(guardian, id)).resolves.toBeTruthy();
  });

  it("is readable by the school's admin", async () => {
    const id = await pair();
    await expect(getMentorship(admin, id)).resolves.toBeTruthy();
  });

  it("is readable by the child and by the mentor", async () => {
    const id = await pair();
    await expect(getMentorship(child, id)).resolves.toBeTruthy();
    await expect(getMentorship(expert, id)).resolves.toBeTruthy();
  });

  it("⚠ is NOT readable by a classmate", async () => {
    const id = await pair();
    await expect(getMentorship(classmate, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ is NOT readable by a parent who is not this child's guardian", async () => {
    const id = await pair();
    await expect(getMentorship(strangerParent, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ is NOT readable by another school's admin", async () => {
    const id = await pair();
    await expect(getMentorship(otherSchoolAdmin, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ is NOT readable by a different expert", async () => {
    const id = await pair();
    await expect(getMentorship(otherExpert, id)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("⚠ consent gates every message", () => {
  it("refuses the mentor before a guardian has agreed", async () => {
    const id = await pair();
    await expect(postMentorMessage(expert, id, "Hello")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses the child before a guardian has agreed", async () => {
    const id = await pair();
    await expect(postMentorMessage(child, id, "Hello")).rejects.toBeInstanceOf(AccessError);
  });

  it("allows both once a guardian has agreed", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(postMentorMessage(expert, id, "Hello there")).resolves.toBeUndefined();
    await expect(postMentorMessage(child, id, "Hi")).resolves.toBeUndefined();
    const thread = await getMentorship(admin, id);
    expect(thread.messages).toHaveLength(2);
  });

  it("⚠ writes NOTHING when it refuses — the throw is not the only guarantee", async () => {
    // The two tests above assert that posting throws. Neither would notice a
    // gate that threw AFTER writing the row, or one removed while some other
    // guard kept throwing for an unrelated reason. What actually matters is that
    // no message about a child exists before a guardian agreed, so that is what
    // is asserted: the count, at the database.
    const id = await pair();
    await expect(postMentorMessage(expert, id, "Hello")).rejects.toBeInstanceOf(AccessError);
    await expect(postMentorMessage(child, id, "Hi")).rejects.toBeInstanceOf(AccessError);

    expect(await db.mentorMessage.count({ where: { threadId: id } })).toBe(0);
  });

  it("⚠ a refused message does not quietly advance the thread's status", async () => {
    const id = await pair();
    await expect(postMentorMessage(expert, id, "Hello")).rejects.toBeInstanceOf(AccessError);

    const row = await db.mentorThread.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("PENDING_CONSENT");
    expect(row.parentConsentAt).toBeNull();
    expect(row.parentConsentUserId).toBeNull();
  });

  it("⚠ tells both parties they cannot post yet, rather than only failing on submit", async () => {
    // `canPost` is what the page uses to decide whether to render a composer, and
    // it is a different branch from the throw in postMentorMessage. A gate
    // enforced in only one of the two either shows a box that always errors, or
    // hides a box while the action still accepts writes.
    const id = await pair();
    expect((await getMentorship(expert, id)).canPost).toBe(false);
    expect((await getMentorship(child, id)).canPost).toBe(false);
    expect((await getMentorship(expert, id)).awaitingConsent).toBe(true);

    await consentToMentorship(guardian, id);

    expect((await getMentorship(expert, id)).canPost).toBe(true);
    expect((await getMentorship(child, id)).canPost).toBe(true);
    expect((await getMentorship(guardian, id)).awaitingConsent).toBe(false);
  });

  it("⚠ the first message can only exist after consent", async () => {
    const id = await pair();
    expect(await db.mentorMessage.count({ where: { threadId: id } })).toBe(0);

    await expect(postMentorMessage(expert, id, "Before")).rejects.toBeInstanceOf(AccessError);
    expect(await db.mentorMessage.count({ where: { threadId: id } })).toBe(0);

    await consentToMentorship(guardian, id);
    await postMentorMessage(expert, id, "After");

    const messages = await db.mentorMessage.findMany({ where: { threadId: id } });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.body).toBe("After");
  });

  it("⚠ a guardian consenting for a DIFFERENT child does not open this thread", async () => {
    // The gate must key on the guardianship for THIS pupil, not on the caller
    // merely being some guardian somewhere.
    const id = await pair();
    await expect(consentToMentorship(strangerParent, id)).rejects.toBeInstanceOf(AccessError);
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id } })).status).toBe(
      "PENDING_CONSENT",
    );
    await expect(postMentorMessage(expert, id, "Still blocked")).rejects.toBeInstanceOf(AccessError);
    expect(await db.mentorMessage.count({ where: { threadId: id } })).toBe(0);
  });

  it("⚠ only a guardian of THIS child can consent", async () => {
    const id = await pair();
    await expect(consentToMentorship(strangerParent, id)).rejects.toBeInstanceOf(AccessError);
    await expect(consentToMentorship(admin, id)).rejects.toBeInstanceOf(AccessError);
    await expect(consentToMentorship(expert, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("records who consented and when", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    const row = await db.mentorThread.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("ACTIVE");
    expect(row.parentConsentAt).not.toBeNull();
    expect(row.parentConsentUserId).toBe(guardian.user.id);
  });

  it("consenting twice is harmless rather than an error", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(consentToMentorship(guardian, id)).resolves.toBeUndefined();
  });
});

describe("⚠ who may write, once it is active", () => {
  it("refuses a guardian — they read and may end it, they do not join in", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(postMentorMessage(guardian, id, "Let me help")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses the school's admin for the same reason", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(postMentorMessage(admin, id, "Checking in")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses an empty message", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(postMentorMessage(expert, id, "   ")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses a message longer than the limit rather than truncating it", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await expect(postMentorMessage(expert, id, "x".repeat(5001))).rejects.toBeInstanceOf(AccessError);
  });
});

describe("ending a mentorship", () => {
  it("can be done by the school", async () => {
    const id = await pair();
    await closeMentorship(admin, id);
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id } })).status).toBe("CLOSED");
  });

  it("⚠ can be done by the guardian, who is never trapped in it", async () => {
    const id = await pair();
    await closeMentorship(guardian, id);
    expect((await db.mentorThread.findUniqueOrThrow({ where: { id } })).status).toBe("CLOSED");
  });

  it("⚠ cannot be done by the expert or the child", async () => {
    const id = await pair();
    await expect(closeMentorship(expert, id)).rejects.toBeInstanceOf(AccessError);
    await expect(closeMentorship(child, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ silences a closed thread for everybody", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await closeMentorship(admin, id);
    await expect(postMentorMessage(expert, id, "One more thing")).rejects.toBeInstanceOf(AccessError);
    await expect(postMentorMessage(child, id, "Wait")).rejects.toBeInstanceOf(AccessError);
  });

  it("leaves it readable after closing, so the record survives", async () => {
    const id = await pair();
    await consentToMentorship(guardian, id);
    await postMentorMessage(expert, id, "Recorded for good");
    await closeMentorship(admin, id);
    const thread = await getMentorship(guardian, id);
    expect(thread.messages.map((m) => m.body)).toContain("Recorded for good");
  });
});

describe("listing, per role", () => {
  it("shows the guardian their own child's mentorships and nobody else's", async () => {
    const id = await pair();
    const mine = await listMentorships(guardian);
    expect(mine.map((t) => t.id)).toContain(id);

    const theirs = await listMentorships(strangerParent);
    expect(theirs.map((t) => t.id)).not.toContain(id);
  });

  it("⚠ shows a classmate nothing", async () => {
    const id = await pair();
    expect((await listMentorships(classmate)).map((t) => t.id)).not.toContain(id);
  });

  it("⚠ shows another school's admin nothing", async () => {
    const id = await pair();
    expect((await listMentorships(otherSchoolAdmin)).map((t) => t.id)).not.toContain(id);
  });

  it("shows the mentor their own and not another mentor's", async () => {
    const id = await pair();
    expect((await listMentorships(expert)).map((t) => t.id)).toContain(id);
    expect((await listMentorships(otherExpert)).map((t) => t.id)).not.toContain(id);
  });

  it("flags one still awaiting consent, so a guardian can be prompted", async () => {
    const id = await pair();
    const found = (await listMentorships(guardian)).find((t) => t.id === id);
    expect(found?.awaitingConsent).toBe(true);
  });
});

describe("what the pairing form is offered", () => {
  it("offers a teacher only pupils they teach, not the school", async () => {
    const forTeacher = await pairingOptions(teacher);
    const forAdmin = await pairingOptions(admin);
    expect(forTeacher.pupils.length).toBeGreaterThan(0);
    expect(forTeacher.pupils.length).toBeLessThan(forAdmin.pupils.length);
  });

  it("⚠ never offers an unpublished expert", async () => {
    const options = await pairingOptions(admin);
    expect(options.experts.map((e) => e.id)).not.toContain(unpublishedProfileId);
    expect(options.experts.map((e) => e.id)).toContain(expertProfileId);
  });

  it("offers nothing at all to a pupil or a guardian", async () => {
    expect(await pairingOptions(child)).toEqual({ experts: [], pupils: [] });
    expect(await pairingOptions(guardian)).toEqual({ experts: [], pupils: [] });
  });
});
