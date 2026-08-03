import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { getThread, listThreads, markThreadRead, replyToThread, createThread } from "@/lib/remarks";
import type { ActiveContext } from "@/lib/session";

/**
 * Remark visibility.
 *
 * A remark thread is the most privacy-sensitive object in the app: a teacher
 * writing "seemed withdrawn today, worth a chat" is doing so on the
 * understanding that exactly four kinds of person can read it — that teacher,
 * their school's admins, and the child's active guardians. Not other teachers.
 * Not the child. Not another school. Every one of those is asserted here.
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

let owningTeacher: ActiveContext;
let otherTeacher: ActiveContext;
let sameSchoolAdmin: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let guardian: ActiveContext;
let strangerParent: ActiveContext;
let studentSelf: ActiveContext;
let threadId: string;
let studentMembershipId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const parent = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });

  const priyaTeacher = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  // The thread is about the parent's own child at Riverside, taught by Priya.
  const guardianship = await db.guardianship.findFirstOrThrow({
    where: { parentUserId: parent.id, student: { schoolId: riverside.id } },
    include: { student: { include: { user: true } } },
  });
  studentMembershipId = guardianship.studentMembershipId;

  owningTeacher = ctx({
    userId: priya.id,
    membershipId: priyaTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  otherTeacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  sameSchoolAdmin = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riverside.id,
    role: "ADMIN",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfield.id,
    role: "ADMIN",
  });
  guardian = ctx({ userId: parent.id, role: "PARENT" });
  strangerParent = ctx({ userId: sam.id, role: "PARENT" });
  studentSelf = ctx({
    userId: guardianship.student.userId,
    membershipId: studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });

  await cleanup();

  const created = await createThread(owningTeacher, {
    studentMembershipId,
    subject: "TEST thread — quick update",
    body: "Just wanted to say they had a lovely week.",
  });
  threadId = created.threadId;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  const threads = await db.remarkThread.findMany({
    where: { subject: { startsWith: "TEST thread" } },
    select: { id: true },
  });
  const ids = threads.map((t) => t.id);
  if (ids.length === 0) return;
  await db.remarkMessage.deleteMany({ where: { threadId: { in: ids } } });
  await db.remarkThread.deleteMany({ where: { id: { in: ids } } });
}

async function expectDenied(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(AccessError);
  await promise.catch((error: AccessError) => {
    // NOT_FOUND, never FORBIDDEN: a distinguishable error confirms the thread
    // exists, which is itself a disclosure.
    expect(error.code).toBe("NOT_FOUND");
  });
}

describe("thread visibility", () => {
  it("lets the owning teacher read it", async () => {
    const thread = await getThread(owningTeacher, threadId);
    expect(thread.subject).toContain("quick update");
    expect(thread.messages).toHaveLength(1);
  });

  it("lets an admin of the same school read it", async () => {
    await expect(getThread(sameSchoolAdmin, threadId)).resolves.toBeTruthy();
  });

  it("lets an active guardian read it", async () => {
    await expect(getThread(guardian, threadId)).resolves.toBeTruthy();
  });

  it("refuses a DIFFERENT teacher at the same school", async () => {
    // The most tempting bug in the whole feature: scoping by school alone.
    await expectDenied(getThread(otherTeacher, threadId));
  });

  it("refuses an admin of another school", async () => {
    await expectDenied(getThread(otherSchoolAdmin, threadId));
  });

  it("refuses a parent who does not guard this student", async () => {
    await expectDenied(getThread(strangerParent, threadId));
  });

  it("refuses the student the thread is ABOUT", async () => {
    // Notes are written about a child, not to them.
    await expectDenied(getThread(studentSelf, threadId));
  });

  it("refuses a made-up thread id", async () => {
    await expectDenied(getThread(owningTeacher, "cl000000000000000000000"));
  });
});

describe("listThreads scoping", () => {
  it("shows the owning teacher their thread", async () => {
    const threads = await listThreads(owningTeacher);
    expect(threads.some((t) => t.id === threadId)).toBe(true);
  });

  it("does NOT show it to another teacher at the same school", async () => {
    const threads = await listThreads(otherTeacher);
    expect(threads.some((t) => t.id === threadId)).toBe(false);
  });

  it("shows it to a same-school admin", async () => {
    const threads = await listThreads(sameSchoolAdmin);
    expect(threads.some((t) => t.id === threadId)).toBe(true);
  });

  it("does not show it to an admin of another school", async () => {
    const threads = await listThreads(otherSchoolAdmin);
    expect(threads.some((t) => t.id === threadId)).toBe(false);
  });

  it("shows it to the guardian", async () => {
    const threads = await listThreads(guardian);
    expect(threads.some((t) => t.id === threadId)).toBe(true);
  });

  it("returns an empty list for a user who guards nobody", async () => {
    const nobody = ctx({ userId: "no-such-user", role: "PARENT" });
    await expect(listThreads(nobody)).resolves.toEqual([]);
  });
});

describe("replies", () => {
  it("lets a guardian reply", async () => {
    const before = (await getThread(guardian, threadId)).messages.length;
    await replyToThread(guardian, { threadId, body: "Thank you for letting me know." });
    const after = await getThread(guardian, threadId);
    expect(after.messages).toHaveLength(before + 1);
    expect(after.messages.at(-1)!.body).toBe("Thank you for letting me know.");
  });

  it("refuses a reply from someone who cannot see the thread", async () => {
    await expectDenied(replyToThread(otherTeacher, { threadId, body: "sneaky" }));
    await expectDenied(replyToThread(studentSelf, { threadId, body: "sneaky" }));
  });

  it("moves the thread to the top by updating lastMessageAt", async () => {
    const before = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await replyToThread(owningTeacher, { threadId, body: "No problem at all." });
    const after = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId } });
    expect(after.lastMessageAt.getTime()).toBeGreaterThan(before.lastMessageAt.getTime());
  });
});

describe("read state", () => {
  it("marks unread for the recipient and read for the author", async () => {
    await createThreadFixture("TEST thread — unread check");
    const forTeacher = (await listThreads(owningTeacher)).find((t) =>
      t.subject.includes("unread check"),
    )!;
    const forGuardian = (await listThreads(guardian)).find((t) =>
      t.subject.includes("unread check"),
    )!;

    expect(forTeacher.unread).toBe(false); // they wrote it
    expect(forGuardian.unread).toBe(true);
  });

  it("clears once the guardian opens it, without affecting the author", async () => {
    const target = (await listThreads(guardian)).find((t) => t.subject.includes("unread check"))!;
    await markThreadRead(guardian, target.id);

    const afterGuardian = (await listThreads(guardian)).find((t) => t.id === target.id)!;
    const afterTeacher = (await listThreads(owningTeacher)).find((t) => t.id === target.id)!;
    expect(afterGuardian.unread).toBe(false);
    expect(afterTeacher.unread).toBe(false);
  });

  it("refuses to mark a thread read that the caller cannot see", async () => {
    await expectDenied(markThreadRead(otherTeacher, threadId));
  });

  it("does not report your OWN message as read just because you sent it", async () => {
    // The author is written into readBy on send, so a naive `readBy.length > 0`
    // showed "Read" against your own message immediately — telling a parent the
    // teacher had seen something nobody had opened.
    const { threadId: fresh } = await createThreadFixture("TEST thread — receipt check");

    const asAuthor = await getThread(owningTeacher, fresh);
    expect(asAuthor.messages).toHaveLength(1);
    expect(asAuthor.messages[0]!.mine).toBe(true);
    expect(asAuthor.messages[0]!.readByOthers).toBe(false);

    // Only once the guardian actually opens it does the receipt turn true.
    await markThreadRead(guardian, fresh);
    const afterRead = await getThread(owningTeacher, fresh);
    expect(afterRead.messages[0]!.readByOthers).toBe(true);
  });
});

async function createThreadFixture(subject: string) {
  return createThread(owningTeacher, {
    studentMembershipId,
    subject,
    body: "Fixture message.",
  });
}
