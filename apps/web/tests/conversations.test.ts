import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  getConversation,
  listConversations,
  mayConverse,
  openConversation,
  peopleToMessage,
  sendConversationMessage,
  unreadConversationCount,
} from "@/lib/conversations";
import type { ActiveContext } from "@/lib/session";
import type { Role } from "@/lib/constants";

/**
 * People writing to people, inside one school.
 *
 * The rule is the whole design, so the rule is what is pinned: who may open
 * a room with whom, that the room is found again rather than duplicated,
 * that an outsider gets a 404 rather than a 403, and that unread is counted
 * from the reader's side.
 */

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = "ZZ Convo";

type Made = { userId: string; membershipId: string | null; role: Role };
let schoolId: string;
let otherSchoolId: string;
let admin: Made;
let teacher: Made;
let pupil: Made;
let pupil2: Made;
let parent: Made;
let stranger: Made;

function ctx(made: Made, sid: string | null = schoolId): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: made.membershipId,
    schoolId: made.role === "PARENT" ? null : sid,
    role: made.role,
    user: {
      id: made.userId,
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

async function person(name: string, role: Role, sid: string): Promise<Made> {
  const user = await db.user.create({
    data: { name: `${PREFIX} ${name}`, email: `zz-convo-${name.toLowerCase()}-${STAMP}@test.invalid`, prefs: "{}" },
  });
  if (role === "PARENT") return { userId: user.id, membershipId: null, role };
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId: sid, role, status: "ACTIVE" },
    select: { id: true },
  });
  return { userId: user.id, membershipId: membership.id, role };
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `${PREFIX} School ${STAMP}`, slug: `zz-convo-${STAMP}`, code: `ZC${String(STAMP).slice(-6)}`, contactEmail: `zz-convo-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `${PREFIX} Other ${STAMP}`, slug: `zz-convo-o-${STAMP}`, code: `ZO${String(STAMP).slice(-6)}`, contactEmail: `zz-convo-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  otherSchoolId = other.id;

  admin = await person("Admin", "ADMIN", schoolId);
  teacher = await person("Teacher", "TEACHER", schoolId);
  pupil = await person("Pupil", "STUDENT", schoolId);
  pupil2 = await person("Pupiltwo", "STUDENT", schoolId);
  parent = await person("Parent", "PARENT", schoolId);
  stranger = await person("Stranger", "TEACHER", otherSchoolId);

  await db.guardianship.create({
    data: {
      parentUserId: parent.userId,
      studentMembershipId: pupil.membershipId!,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
  });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { name: { startsWith: `${PREFIX} ` } } });
  await db.user.deleteMany({ where: { name: { startsWith: `${PREFIX} ` } } });
  await db.$disconnect();
});

describe("the rule", () => {
  it("lets staff reach everyone, and pupils and parents reach only staff", () => {
    expect(mayConverse("PRINCIPAL", "TEACHER")).toBe(true);
    expect(mayConverse("ADMIN", "PARENT")).toBe(true);
    expect(mayConverse("TEACHER", "STUDENT")).toBe(true);
    expect(mayConverse("STUDENT", "TEACHER")).toBe(true);
    // A college's faculty and HOD converse as teachers (4 Oct 2026): an alumnus writes to former faculty, who may answer.
    expect(mayConverse("ALUMNUS", "FACULTY")).toBe(true);
    expect(mayConverse("HOD", "STUDENT")).toBe(true);
    // The four college desks converse as staff since G4-30 (risks batch, 5 Oct 2026); a module role still does not.
    expect(mayConverse("ACCOUNTS", "STUDENT")).toBe(true);
    expect(mayConverse("LIBRARIAN", "STUDENT")).toBe(false);
    expect(mayConverse("PARENT", "PRINCIPAL")).toBe(true);
    // ⚠ The safeguarding line. A child never gets an unobserved channel to
    // another child or to somebody else's parent.
    expect(mayConverse("STUDENT", "STUDENT")).toBe(false);
    expect(mayConverse("STUDENT", "PARENT")).toBe(false);
    expect(mayConverse("PARENT", "STUDENT")).toBe(false);
    expect(mayConverse("PARENT", "PARENT")).toBe(false);
  });

  it("offers a pupil only the staff, and offers staff the parents too", async () => {
    const forPupil = await peopleToMessage(ctx(pupil), schoolId);
    expect(forPupil.map((p) => p.role).sort()).toEqual(["ADMIN", "TEACHER"]);
    expect(forPupil.some((p) => p.userId === pupil2.userId)).toBe(false);

    const forAdmin = await peopleToMessage(ctx(admin), schoolId);
    const roles = new Set(forAdmin.map((p) => p.role));
    expect(roles.has("TEACHER") && roles.has("STUDENT") && roles.has("PARENT")).toBe(true);
    expect(forAdmin.find((p) => p.role === "PARENT")?.detail).toContain("Pupil");
    // Never yourself, never the other school.
    expect(forAdmin.some((p) => p.userId === admin.userId)).toBe(false);
    expect(forAdmin.some((p) => p.userId === stranger.userId)).toBe(false);
  });

  it("refuses a pupil writing to a pupil, and an outsider writing in at all", async () => {
    await expect(openConversation(ctx(pupil), schoolId, pupil2.userId)).rejects.toMatchObject({
      key: "access.cannotMessageThisPerson",
    });
    await expect(openConversation(ctx(stranger, otherSchoolId), schoolId, teacher.userId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(openConversation(ctx(teacher), schoolId, teacher.userId)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the room", () => {
  it("is one room per pair, found again rather than duplicated", async () => {
    const first = await openConversation(ctx(admin), schoolId, teacher.userId);
    const again = await openConversation(ctx(teacher), schoolId, admin.userId);
    expect(first.created).toBe(true);
    expect(again.created).toBe(false);
    expect(again.conversationId).toBe(first.conversationId);
  });

  it("carries a message, counts it unread for the reader only, and reads it on opening", async () => {
    const { conversationId } = await openConversation(ctx(parent), schoolId, teacher.userId);
    await sendConversationMessage(ctx(parent), conversationId, "Could we talk about the trip?");

    expect(await unreadConversationCount(ctx(teacher))).toBe(1);
    expect(await unreadConversationCount(ctx(parent))).toBe(0);

    const teacherView = await listConversations(ctx(teacher));
    const room = teacherView.find((c) => c.id === conversationId);
    expect(room?.unread).toBe(true);
    expect(room?.others[0]?.role).toBe("PARENT");

    const opened = await getConversation(ctx(teacher), conversationId);
    expect(opened.messages).toHaveLength(1);
    expect(opened.messages[0]?.mine).toBe(false);
  });

  it("⚠ is a 404 to somebody who is not in it", async () => {
    const { conversationId } = await openConversation(ctx(admin), schoolId, pupil.userId);
    await expect(getConversation(ctx(teacher), conversationId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(sendConversationMessage(ctx(pupil2), conversationId, "hi")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
