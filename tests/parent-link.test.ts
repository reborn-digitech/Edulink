import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { inviteParent, pendingParentInvites } from "@/lib/parent-link";
import type { ActiveContext } from "@/lib/session";

/**
 * The office links a parent: an invitation, never a guardianship outright.
 * What must hold: admin only; the pupil must be one of the school's; an
 * address already linked is told so; one pending link per address per child;
 * and the invitation carries the child and the relation for the accept path.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

const PUPIL_EMAIL = "pupil.plink.unit@riverside.test";
const PARENT_EMAIL = "parent.plink.unit@riverside.test";
let riversideId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let pupilId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" } });
  const tomTeacher = await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId: riversideId, role: "TEACHER" });

  const pupil =
    (await db.user.findUnique({ where: { email: PUPIL_EMAIL } })) ??
    (await db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Plink Pupil", prefs: "{}" } }));
  const m = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: pupil.id, schoolId: riversideId, role: "STUDENT" } },
    create: { userId: pupil.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  pupilId = m.id;
});

afterAll(async () => {
  await db.invite.deleteMany({ where: { studentMembershipId: pupilId } });
  await db.guardianship.deleteMany({ where: { studentMembershipId: pupilId } });
  await db.membership.deleteMany({ where: { id: pupilId } });
  await db.user.deleteMany({ where: { email: { in: [PUPIL_EMAIL, PARENT_EMAIL] } } });
  await db.$disconnect();
});

describe("linking a parent from the office", () => {
  it("⚠ is the admin's alone", async () => {
    await expect(inviteParent(teacher, pupilId, { email: PARENT_EMAIL, relation: "PARENT" })).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses a non-address and the child's own address", async () => {
    expect(await inviteParent(admin, pupilId, { email: "nope", relation: "PARENT" })).toMatchObject({ ok: false });
    expect(await inviteParent(admin, pupilId, { email: PUPIL_EMAIL, relation: "PARENT" })).toMatchObject({
      ok: false,
      errorKey: "refusal.thatIsTheChildsOwnAddress",
    });
  });

  it("sends one invitation carrying the child and the relation, and shows it pending", async () => {
    const result = await inviteParent(admin, pupilId, { email: PARENT_EMAIL, name: "Plink Parent", relation: "GUARDIAN" });
    expect(result).toMatchObject({ ok: true });
    const row = await db.invite.findFirstOrThrow({ where: { studentMembershipId: pupilId, email: PARENT_EMAIL } });
    expect(row).toMatchObject({ role: "PARENT", relation: "GUARDIAN", status: "PENDING", schoolId: riversideId });
    // Nothing is linked until they accept.
    expect(await db.guardianship.count({ where: { studentMembershipId: pupilId } })).toBe(0);

    const pending = await pendingParentInvites(admin);
    expect(pending.get(pupilId)).toEqual([{ email: PARENT_EMAIL, name: "Plink Parent" }]);
  });

  it("⚠ does not send a second link while one is pending", async () => {
    expect(await inviteParent(admin, pupilId, { email: PARENT_EMAIL, relation: "PARENT" })).toMatchObject({
      ok: false,
      errorKey: "invites.alreadyInvited",
    });
  });

  it("⚠ refuses an address already linked to the child", async () => {
    const parent = await db.user.create({ data: { email: PARENT_EMAIL, name: "Plink Parent", prefs: "{}" } });
    await db.guardianship.create({
      data: { parentUserId: parent.id, studentMembershipId: pupilId, studentSchoolId: riversideId, status: "ACTIVE" },
    });
    await db.invite.updateMany({ where: { studentMembershipId: pupilId }, data: { status: "ACCEPTED" } });
    expect(await inviteParent(admin, pupilId, { email: PARENT_EMAIL, relation: "PARENT" })).toMatchObject({
      ok: false,
      errorKey: "refusal.alreadyLinkedToThisChild",
    });
  });
});
