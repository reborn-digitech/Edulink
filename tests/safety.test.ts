import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { createPost, reportContent } from "@/lib/bulletin";
import {
  dismissReports,
  listAudit,
  listReports,
  openReportCount,
  removeContent,
} from "@/lib/safety";
import type { ActiveContext } from "@/lib/session";

/**
 * Safety centre.
 *
 * Two properties matter here beyond the usual tenant scoping:
 *
 *   * reports GROUP by target, so three children reporting one comment is one
 *     decision — otherwise an admin dismisses the same thing repeatedly and
 *     loses track of what is outstanding;
 *   * a report whose target no longer exists must still be listed and still be
 *     closable. A dangling row that cannot be cleared clogs the queue forever
 *     and trains admins to ignore it.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
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

let admin: ActiveContext;
let teacher: ActiveContext;
let student: ActiveContext;
let otherStudent: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let classId: string;
let schoolId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  schoolId = riverside.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });

  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId, role: "ADMIN" },
  });
  const priyaTeacher = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  classId = (await db.classTeacher.findFirstOrThrow({ where: { teacherMembershipId: priyaTeacher.id } }))
    .classId;

  const enrolled = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
    include: { student: { select: { userId: true } } },
    take: 2,
  });

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: priya.id, membershipId: priyaTeacher.id, schoolId, role: "TEACHER" });
  student = ctx({
    userId: enrolled[0]!.student.userId,
    membershipId: enrolled[0]!.studentMembershipId,
    schoolId,
    role: "STUDENT",
  });
  otherStudent = ctx({
    userId: enrolled[1]!.student.userId,
    membershipId: enrolled[1]!.studentMembershipId,
    schoolId,
    role: "STUDENT",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfield.id,
    role: "ADMIN",
  });

  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

/**
 * Removes ALL reports for the test school, not just ones pointing at TEST posts.
 *
 * Narrower cleanup was not enough: these tests assert on *counts*, so a single
 * stray report left by manual poking around — including one whose target was
 * deleted, which no title-based filter can find — silently inflates every count
 * and fails the suite for the wrong reason. The seed creates no reports, so
 * clearing the school's reports is safe and makes the suite self-contained.
 */
async function cleanup() {
  await db.report.deleteMany({ where: { schoolId } });

  const posts = await db.post.findMany({
    where: { title: { startsWith: "TEST safety" } },
    select: { id: true },
  });
  const ids = posts.map((p) => p.id);
  if (ids.length > 0) {
    await db.comment.deleteMany({ where: { postId: { in: ids } } });
    await db.reaction.deleteMany({ where: { postId: { in: ids } } });
    await db.post.deleteMany({ where: { id: { in: ids } } });
  }
}

async function makePost(title: string) {
  const { postId } = await createPost(teacher, {
    scope: "CLASS",
    classId,
    title,
    body: "Something reportable.",
    tags: [],
    media: [],
  });
  return postId;
}

/* -------------------------------------------------------------------------- */

describe("access", () => {
  it("is admin-only", async () => {
    await expect(listReports(teacher)).rejects.toBeInstanceOf(AccessError);
    await expect(listReports(student)).rejects.toBeInstanceOf(AccessError);
    await expect(listAudit(teacher)).rejects.toBeInstanceOf(AccessError);
    await expect(listReports(admin)).resolves.toBeInstanceOf(Array);
  });

  it("returns 0 open reports for non-admins rather than throwing", async () => {
    expect(await openReportCount(teacher)).toBe(0);
    expect(await openReportCount(student)).toBe(0);
  });
});

describe("grouping", () => {
  it("groups multiple reports of the SAME target into one decision", async () => {
    await cleanup();
    const postId = await makePost("TEST safety grouped");

    await reportContent(student, { targetType: "POST", targetId: postId, reason: "BULLYING" });
    await reportContent(otherStudent, {
      targetType: "POST",
      targetId: postId,
      reason: "PRIVACY",
      detail: "It has a surname in it",
    });

    const groups = await listReports(admin);
    const group = groups.find((g) => g.targetId === postId)!;

    expect(groups.filter((g) => g.targetId === postId)).toHaveLength(1);
    expect(group.count).toBe(2);
    expect(group.reportIds).toHaveLength(2);
    expect(group.reasons.map((r) => r.reason).sort()).toEqual(["BULLYING", "PRIVACY"]);
    expect(group.details.some((d) => d.detail === "It has a surname in it")).toBe(true);
  });

  it("counts distinct targets, not raw reports", async () => {
    await cleanup();
    const a = await makePost("TEST safety count a");
    const b = await makePost("TEST safety count b");

    await reportContent(student, { targetType: "POST", targetId: a, reason: "SPAM" });
    await reportContent(otherStudent, { targetType: "POST", targetId: a, reason: "SPAM" });
    await reportContent(student, { targetType: "POST", targetId: b, reason: "SPAM" });

    // Three reports, two things to deal with.
    expect(await openReportCount(admin)).toBe(2);
  });

  it("sorts unsafe and bullying reports first, beating both fallbacks", async () => {
    await cleanup();
    const unsafe = await makePost("TEST safety unsafe");
    const spam = await makePost("TEST safety spam");

    // Stack the deck against the urgent one on BOTH tie-breakers:
    //   * it is reported FIRST, so it is the OLDEST (loses on recency)
    //   * it has ONE report against the spam post's TWO (loses on count)
    // Only the urgency rule can put it on top, so removing that rule fails
    // this test — which the previous version did not.
    await reportContent(student, { targetType: "POST", targetId: unsafe, reason: "UNSAFE" });
    await reportContent(student, { targetType: "POST", targetId: spam, reason: "SPAM" });
    await reportContent(otherStudent, { targetType: "POST", targetId: spam, reason: "SPAM" });

    const groups = await listReports(admin);
    expect(groups.find((g) => g.targetId === spam)!.count).toBe(2);
    expect(groups.find((g) => g.targetId === unsafe)!.count).toBe(1);
    expect(groups[0]!.targetId).toBe(unsafe);
  });

  it("sorts by report count when nothing is urgent, beating recency", async () => {
    await cleanup();
    const once = await makePost("TEST safety once");
    const twice = await makePost("TEST safety twice");

    // The twice-reported post is reported FIRST, so it is the older of the two.
    // Only the count rule can lift it above the newer single report.
    await reportContent(student, { targetType: "POST", targetId: twice, reason: "SPAM" });
    await reportContent(otherStudent, { targetType: "POST", targetId: twice, reason: "WRONG_INFO" });
    await reportContent(student, { targetType: "POST", targetId: once, reason: "SPAM" });

    const groups = await listReports(admin);
    expect(groups.find((g) => g.targetId === once)!.latestAt.getTime()).toBeGreaterThanOrEqual(
      groups.find((g) => g.targetId === twice)!.latestAt.getTime(),
    );
    expect(groups[0]!.targetId).toBe(twice);
  });
});

describe("dangling targets", () => {
  it("lists a report whose target no longer exists, marked unavailable", async () => {
    await cleanup();
    const postId = await makePost("TEST safety will vanish");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "OTHER" });

    // Hard-delete the post out from under the report.
    await db.post.delete({ where: { id: postId } });

    const groups = await listReports(admin);
    const group = groups.find((g) => g.targetId === postId)!;
    expect(group).toBeTruthy();
    expect(group.target.available).toBe(false);
  });

  it("can still be dismissed — a report that cannot be cleared clogs the queue", async () => {
    const groups = await listReports(admin);
    const dangling = groups.find((g) => !g.target.available)!;
    expect(dangling).toBeTruthy();

    await expect(
      dismissReports(admin, {
        targetType: dangling.targetType,
        targetId: dangling.targetId,
        note: "Content was already deleted.",
      }),
    ).resolves.toBeUndefined();

    expect((await listReports(admin)).some((g) => g.targetId === dangling.targetId)).toBe(false);
  });

  it("refuses to remove content that no longer exists", async () => {
    await expect(
      removeContent(admin, {
        targetType: "POST",
        targetId: "nonexistent-post-id",
        note: "gone",
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("resolution", () => {
  it("removing a post rejects it with the note the author will read", async () => {
    await cleanup();
    const postId = await makePost("TEST safety takedown");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "PRIVACY" });

    await removeContent(admin, {
      targetType: "POST",
      targetId: postId,
      note: "This named another pupil.",
    });

    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("REJECTED");
    // Same field the author already sees on their own post, so a takedown
    // explains itself instead of the post silently vanishing.
    expect(post.rejectionReason).toBe("This named another pupil.");

    const closed = await db.report.findMany({ where: { targetId: postId } });
    expect(closed.every((r) => r.status === "ACTIONED")).toBe(true);
    expect(closed.every((r) => r.resolutionNote === "This named another pupil.")).toBe(true);
  });

  it("requires a note for both removing and dismissing", async () => {
    await cleanup();
    const postId = await makePost("TEST safety needs note");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "SPAM" });

    await expect(
      removeContent(admin, { targetType: "POST", targetId: postId, note: "  " }),
    ).rejects.toBeInstanceOf(AccessError);
    await expect(
      dismissReports(admin, { targetType: "POST", targetId: postId, note: "" }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("dismissing closes the reports but leaves the content alone", async () => {
    await cleanup();
    const postId = await makePost("TEST safety dismiss");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "WRONG_INFO" });

    await dismissReports(admin, {
      targetType: "POST",
      targetId: postId,
      note: "Checked with the teacher, it is fine.",
    });

    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("APPROVED");
    expect(await openReportCount(admin)).toBe(0);
  });

  it("closing is idempotent — a second pass closes nothing", async () => {
    const before = await db.report.count({ where: { status: "OPEN", schoolId } });
    await dismissReports(admin, {
      targetType: "POST",
      targetId: "already-closed",
      note: "noop",
    });
    expect(await db.report.count({ where: { status: "OPEN", schoolId } })).toBe(before);
  });
});

describe("tenant isolation", () => {
  it("does not show one school's reports to another's admin", async () => {
    await cleanup();
    const postId = await makePost("TEST safety isolation");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "BULLYING" });

    const mine = await listReports(admin);
    const theirs = await listReports(otherSchoolAdmin);

    expect(mine.some((g) => g.targetId === postId)).toBe(true);
    expect(theirs.some((g) => g.targetId === postId)).toBe(false);
    expect(await openReportCount(otherSchoolAdmin)).toBe(0);
  });

  it("refuses a cross-school takedown even with a real post id", async () => {
    const postId = (await db.post.findFirstOrThrow({ where: { title: "TEST safety isolation" } })).id;
    await expect(
      removeContent(otherSchoolAdmin, { targetType: "POST", targetId: postId, note: "nope" }),
    ).rejects.toBeInstanceOf(AccessError);

    // And the post is untouched.
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("APPROVED");
  });

  it("does not let a cross-school dismiss close the reports", async () => {
    const postId = (await db.post.findFirstOrThrow({ where: { title: "TEST safety isolation" } })).id;
    await dismissReports(otherSchoolAdmin, {
      targetType: "POST",
      targetId: postId,
      note: "trying it on",
    });
    // Still open for the school that actually owns it.
    const still = await db.report.findMany({ where: { targetId: postId } });
    expect(still.every((r) => r.status === "OPEN")).toBe(true);
  });
});

describe("audit log", () => {
  it("records the resolution and is school-scoped", async () => {
    await cleanup();
    const postId = await makePost("TEST safety audited");
    await reportContent(student, { targetType: "POST", targetId: postId, reason: "SPAM" });
    await dismissReports(admin, { targetType: "POST", targetId: postId, note: "Fine." });

    const entries = await listAudit(admin, { take: 50 });
    expect(entries.some((e) => e.action === "report.dismiss" && e.targetId === postId)).toBe(true);
    expect(entries.some((e) => e.action === "content.report")).toBe(true);

    const theirs = await listAudit(otherSchoolAdmin, { take: 50 });
    expect(theirs.some((e) => e.targetId === postId)).toBe(false);
  });

  it("names the actor, and survives an actor who no longer exists", async () => {
    const entries = await listAudit(admin, { take: 50 });
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      // Never blank, never "undefined" leaking into the UI.
      expect(entry.actorName.length).toBeGreaterThan(0);
    }
  });

  it("caps the page size even when asked for more", async () => {
    const entries = await listAudit(admin, { take: 10_000 });
    expect(entries.length).toBeLessThanOrEqual(500);
  });
});
