import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { mayEditOwnBirthdate, setMemberBirthdate, setOwnBirthdate } from "@/lib/birthdate";
import type { ActiveContext } from "@/lib/session";

/**
 * Who may write a date of birth. The office for anybody in its school,
 * audited and told; the person themselves only while nobody is linked to
 * them — because the link was proved with this very date.
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

const PUPIL_EMAIL = "pupil.dob.unit@riverside.test";
const PARENT_EMAIL = "parent.dob.unit@riverside.test";
let riversideId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let pupil: ActiveContext;
let pupilUserId: string;
let pupilMembershipId: string;
let parentUserId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" } });
  const tomTeacher = await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId: riversideId, role: "TEACHER" });

  const user =
    (await db.user.findUnique({ where: { email: PUPIL_EMAIL } })) ??
    (await db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Dob Pupil", prefs: "{}" } }));
  pupilUserId = user.id;
  await db.user.update({ where: { id: user.id }, data: { birthdate: null } });
  const m = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: user.id, schoolId: riversideId, role: "STUDENT" } },
    create: { userId: user.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  pupilMembershipId = m.id;
  pupil = ctx({ userId: user.id, membershipId: m.id, schoolId: riversideId, role: "STUDENT" });

  const parent =
    (await db.user.findUnique({ where: { email: PARENT_EMAIL } })) ??
    (await db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Dob Parent", prefs: "{}" } }));
  parentUserId = parent.id;
  await db.guardianship.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
  await db.notification.deleteMany({ where: { userId: pupilUserId } });
  await db.membership.deleteMany({ where: { id: pupilMembershipId } });
  await db.user.deleteMany({ where: { email: { in: [PUPIL_EMAIL, PARENT_EMAIL] } } });
  await db.$disconnect();
});

describe("the pupil's own date", () => {
  it("may be set while nobody is linked to them, and sets the minor flag", async () => {
    expect(await mayEditOwnBirthdate(pupil)).toBe(true);
    expect(await setOwnBirthdate(pupil, "2015-05-12")).toEqual({ ok: true });
    const u = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(u.birthdate?.toISOString().slice(0, 10)).toBe("2015-05-12");
    expect(u.isMinor).toBe(true);
  });

  it("⚠ is locked the moment a guardian is linked", async () => {
    await db.guardianship.create({
      data: { parentUserId, studentMembershipId: pupilMembershipId, studentSchoolId: riversideId, status: "ACTIVE" },
    });
    expect(await mayEditOwnBirthdate(pupil)).toBe(false);
    expect(await setOwnBirthdate(pupil, "2014-01-01")).toMatchObject({
      ok: false,
      errorKey: "refusal.askTheOfficeToChangeYourBirthday",
    });
    const u = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(u.birthdate?.toISOString().slice(0, 10)).toBe("2015-05-12");
  });

  it("a teacher may always edit their own", async () => {
    expect(await mayEditOwnBirthdate(teacher)).toBe(true);
  });
});

describe("the office", () => {
  it("⚠ is the admin's alone", async () => {
    await expect(setMemberBirthdate(teacher, pupilMembershipId, "2015-05-13")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses a future date and a nonsense one", async () => {
    expect(await setMemberBirthdate(admin, pupilMembershipId, "2099-01-01")).toMatchObject({ ok: false, errorKey: "invite.dateInFuture" });
    expect(await setMemberBirthdate(admin, pupilMembershipId, "12/05/2015")).toMatchObject({ ok: false, errorKey: "invite.useRealDate" });
  });

  it("corrects the date even after a guardian is linked, audits it, and tells the pupil", async () => {
    expect(await setMemberBirthdate(admin, pupilMembershipId, "2015-05-13")).toEqual({ ok: true });
    const u = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(u.birthdate?.toISOString().slice(0, 10)).toBe("2015-05-13");

    const entry = await db.auditLog.findFirst({
      where: { action: "user.birthdate.set", targetId: pupilMembershipId },
      orderBy: { createdAt: "desc" },
    });
    expect(entry).not.toBeNull();
    expect(JSON.parse(entry!.meta as string)).toMatchObject({ from: "2015-05-12", to: "2015-05-13" });

    const told = await db.notification.findFirst({ where: { userId: pupilUserId }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toBe("Your date of birth was updated");
  });

  it("may clear it, and says so", async () => {
    expect(await setMemberBirthdate(admin, pupilMembershipId, null)).toEqual({ ok: true });
    const u = await db.user.findUniqueOrThrow({ where: { id: pupilUserId } });
    expect(u.birthdate).toBeNull();
    expect(u.isMinor).toBe(true);
  });
});
