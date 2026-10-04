import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { schoolCode } from "@/lib/codes";
import { SCHOOL_CODE_JOINS } from "@/lib/rate-limit";

/**
 * Joining with a code ON THE ACCOUNT YOU ALREADY HAVE. The sign-up wizard
 * mints a user; this must not. What holds: the signed-in user ASKS, and once
 * the office has let them in gains a pupil membership (and the class) on
 * their own id; asking and being let in twice makes no second membership; a
 * parent's account and a staff account at that school are refused with a
 * sentence.
 */

const db = new PrismaClient();

let current: ActiveContext | null = null;
vi.mock("@/lib/session", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/session")>();
  return {
    ...real,
    getSession: async () => current,
    createSession: async () => "test-session",
  };
});
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/rate-limit")>();
  return { ...real, consumeByCaller: async () => ({ allowed: true, retryAfterSeconds: 0 }) };
});

function ctx(over: Partial<ActiveContext> & { userId: string; name: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId, name: over.name, preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

const PUPIL_EMAIL = "pupil.jx.unit@riverside.test";
const PARENT_EMAIL = "parent.jx.unit@riverside.test";
let riversideId: string;
let classId: string;
let classCode: string;
let pupilUserId: string;
let parentUserId: string;
let tomUserId: string;
let office: ActiveContext;

/** Asks with the code, as the pupil, and has the office let them in. */
async function joinAndBeLetIn(): Promise<void> {
  const { joinWithMyAccount } = await import("@/app/join/actions");
  const { decideJoin } = await import("@/lib/join-requests");
  current = ctx({ userId: pupilUserId, name: "ZZ Join Pupil" });
  expect(await joinWithMyAccount(classCode)).toMatchObject({ ok: true, redirectTo: "/join/waiting" });
  const request = await db.joinRequest.findFirstOrThrow({ where: { userId: pupilUserId, status: "PENDING" } });
  await decideJoin(office, request.id, "APPROVE");
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-JOIN" },
    create: { schoolId: riversideId, name: "ZZ Join Test Class", gradeLevel: "5", joinCode: "ZZZ-JOIN" },
    update: { archivedAt: null },
  });
  classId = klass.id;
  classCode = klass.joinCode;

  const pupil =
    (await db.user.findUnique({ where: { email: PUPIL_EMAIL } })) ??
    (await db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Join Pupil", prefs: "{}", birthdate: new Date("2014-02-02T00:00:00Z") } }));
  pupilUserId = pupil.id;
  await db.membership.deleteMany({ where: { userId: pupil.id } });

  const parent =
    (await db.user.findUnique({ where: { email: PARENT_EMAIL } })) ??
    (await db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Join Parent", prefs: "{}" } }));
  parentUserId = parent.id;
  // The parent guards some real pupil at Riverside.
  const anyPupil = await db.membership.findFirstOrThrow({ where: { schoolId: riversideId, role: "STUDENT", status: "ACTIVE" } });
  await db.guardianship.upsert({
    where: { parentUserId_studentMembershipId: { parentUserId: parent.id, studentMembershipId: anyPupil.id } },
    create: { parentUserId: parent.id, studentMembershipId: anyPupil.id, studentSchoolId: riversideId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  tomUserId = (await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } })).id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" } });
  office = ctx({ userId: priya.id, name: "Priya", membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  await db.joinRequest.deleteMany({ where: { userId: { in: [pupil.id, parent.id] } } });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { OR: [{ userId: pupilUserId }, { titleKey: { startsWith: "joinRequests." }, titleVars: { contains: "ZZ Join" } }] } });
  await db.joinRequest.deleteMany({ where: { userId: { in: [pupilUserId, parentUserId, tomUserId] } } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.membership.deleteMany({ where: { userId: pupilUserId } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.user.deleteMany({ where: { email: { in: [PUPIL_EMAIL, PARENT_EMAIL] } } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

describe("joining with a code on an existing account", () => {
  it("⚠ asking makes a request and nothing else: no membership, no enrolment, no stand-in guardian", async () => {
    const { joinWithMyAccount } = await import("@/app/join/actions");
    current = ctx({ userId: pupilUserId, name: "ZZ Join Pupil" });
    expect(await joinWithMyAccount(classCode)).toMatchObject({ ok: true, redirectTo: "/join/waiting" });
    expect(await db.joinRequest.count({ where: { userId: pupilUserId, classId, status: "PENDING" } })).toBe(1);
    expect(await db.membership.count({ where: { userId: pupilUserId } })).toBe(0);
    expect(await db.enrollment.count({ where: { classId } })).toBe(0);
    await db.joinRequest.deleteMany({ where: { userId: pupilUserId } });
  });

  it("let in, it adds a pupil membership and the class to THIS user — no new account", async () => {
    const before = await db.user.count();
    await joinAndBeLetIn();
    expect(await db.user.count()).toBe(before);

    const m = await db.membership.findFirstOrThrow({ where: { userId: pupilUserId, schoolId: riversideId, role: "STUDENT" } });
    expect(m.status).toBe("ACTIVE");
    expect(m.studentCode).toMatch(/^STU-/);
    expect(await db.enrollment.count({ where: { classId, studentMembershipId: m.id, status: "ACTIVE" } })).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUserId } })).isMinor).toBe(true);
  });

  it("asking and being let in again enrols again without a second membership", async () => {
    await joinAndBeLetIn();
    expect(await db.membership.count({ where: { userId: pupilUserId, schoolId: riversideId, role: "STUDENT" } })).toBe(1);
  });

  it("⚠ coming back after leaving withdraws the old certificate, so a later departure can be recorded", async () => {
    const { recordDeparture } = await import("@/lib/school-record");
    const admin = office;
    const m = await db.membership.findFirstOrThrow({ where: { userId: pupilUserId, schoolId: riversideId, role: "STUDENT" } });

    expect((await recordDeparture(admin, m.id, { reason: "LEFT" })).ok).toBe(true);
    expect(await db.schoolRecord.count({ where: { studentMembershipId: m.id } })).toBe(1);

    await joinAndBeLetIn();
    expect((await db.membership.findUniqueOrThrow({ where: { id: m.id } })).leftAt).toBeNull();
    expect(await db.schoolRecord.count({ where: { studentMembershipId: m.id } })).toBe(0);
    // Withdrawn by closing, not deleting: its serial stays on the TC register (LIFECYCLE-7).
    expect(await db.schoolRecord.count({ where: { formerMembershipId: m.id, supersededReason: "READMITTED" } })).toBe(1);

    // And leaving again writes one fresh certificate, not a unique-index error.
    expect((await recordDeparture(admin, m.id, { reason: "TRANSFERRED" })).ok).toBe(true);
    expect(await db.schoolRecord.count({ where: { studentMembershipId: m.id } })).toBe(1);
    await db.schoolRecord.deleteMany({ where: { OR: [{ studentMembershipId: m.id }, { formerMembershipId: m.id }] } });
    await db.membership.update({ where: { id: m.id }, data: { leftAt: null } });
  });

  it("⚠ coming back after a suspension clears the stamp and the reason with the status", async () => {
    const m = await db.membership.findFirstOrThrow({ where: { userId: pupilUserId, schoolId: riversideId, role: "STUDENT" } });
    await db.membership.update({ where: { id: m.id }, data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "test" } });

    await joinAndBeLetIn();
    const after = await db.membership.findUniqueOrThrow({ where: { id: m.id } });
    expect(after.status).toBe("ACTIVE");
    expect(after.suspendedAt).toBeNull();
    expect(after.suspendedReason).toBeNull();
  });

  it("⚠ refuses a parent's account", async () => {
    const { joinWithMyAccount } = await import("@/app/join/actions");
    current = ctx({ userId: parentUserId, name: "ZZ Join Parent" });
    const result = await joinWithMyAccount(classCode);
    expect(result.ok).toBe(false);
    expect(result.errors._form).toMatch(/parent/i);
    expect(await db.membership.count({ where: { userId: parentUserId } })).toBe(0);
  });

  it("⚠ refuses a member of staff at that school", async () => {
    const { joinWithMyAccount } = await import("@/app/join/actions");
    // Tom guards a seeded pupil too, so the parent rule fires first for him;
    // the staff rule is tested on a user who only holds a post here.
    current = ctx({ userId: tomUserId, name: "Tom" });
    expect((await joinWithMyAccount(classCode)).ok).toBe(false);

    const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
    const priyaGuards = await db.guardianship.count({ where: { parentUserId: priya.id, status: "ACTIVE" } });
    current = ctx({ userId: priya.id, name: "Priya" });
    const result = await joinWithMyAccount(classCode);
    expect(result.ok).toBe(false);
    expect(result.errors._form).toMatch(priyaGuards > 0 ? /parent/i : /staff post/i);
    expect(await db.membership.count({ where: { userId: priya.id, schoolId: riversideId, role: "STUDENT" } })).toBe(0);
  });

  it("⚠ refuses when nobody is signed in", async () => {
    const { joinWithMyAccount } = await import("@/app/join/actions");
    current = null;
    expect((await joinWithMyAccount(classCode)).ok).toBe(false);
  });
});

describe("⚠ the sign-up wizard, for a child with no account", () => {
  it("makes the account and a request — and no membership, no enrolment, nothing of the school", async () => {
    const { joinAsStudent } = await import("@/app/join/actions");
    current = null;
    const result = await joinAsStudent({ schoolCode: classCode, name: "ZZ Wizard Pupil", avatarKey: "fox", birthdate: "2015-06-01", password: "Plum-Kettle-Orbit-42" });
    expect(result.ok, JSON.stringify(result.errors)).toBe(true);
    expect(result.redirectTo).toMatch(/^\/join\/waiting\?handle=zzwizardpupi\./);

    const made = await db.user.findFirstOrThrow({ where: { name: "ZZ Wizard Pupil" }, orderBy: { createdAt: "desc" } });
    try {
      expect(made.isMinor).toBe(true);
      expect(await db.membership.count({ where: { userId: made.id } })).toBe(0);
      expect(await db.joinRequest.findFirst({ where: { userId: made.id }, select: { status: true, via: true, classId: true, schoolId: true } })).toEqual({
        status: "PENDING",
        via: "CLASS",
        classId,
        schoolId: riversideId,
      });
    } finally {
      await db.notification.deleteMany({ where: { titleVars: { contains: "ZZ Wizard" } } });
      await db.auditLog.deleteMany({ where: { actorUserId: made.id } });
      await db.user.deleteMany({ where: { id: made.id } });
    }
  });
});

describe("⚠ a school code", () => {
  it("is minted with eight random characters after the name's prefix; class and pupil codes are unchanged", () => {
    const code = schoolCode("Riverside Primary");
    expect(code).toMatch(/^RIVER-[CDFGHJKMNPQRTVWXY3467]{4}-[CDFGHJKMNPQRTVWXY3467]{4}$/);
    expect(new Set(Array.from({ length: 20 }, () => schoolCode("Riverside Primary"))).size).toBe(20);
  });

  it("is limited per ACCOUNT, not only per address: the fifth join in a day is the last", async () => {
    const { joinWithMyAccount } = await import("@/app/join/actions");
    const riverside = await db.school.findFirstOrThrow({ where: { id: riversideId }, select: { code: true } });
    const bucket = `join-school:${pupilUserId}`;
    await db.rateLimit.deleteMany({ where: { bucket } });
    // Not on the roll: a pupil already there is told so, and asks for nothing.
    await db.enrollment.deleteMany({ where: { classId } });
    await db.guardianship.deleteMany({ where: { studentMembershipId: { in: (await db.membership.findMany({ where: { userId: pupilUserId }, select: { id: true } })).map((m) => m.id) } } });
    await db.membership.deleteMany({ where: { userId: pupilUserId } });
    current = ctx({ userId: pupilUserId, name: "ZZ Join Pupil" });
    try {
      for (let i = 0; i < SCHOOL_CODE_JOINS.limit; i += 1) {
        expect(await joinWithMyAccount(riverside.code)).toMatchObject({ ok: true });
      }
      const refused = await joinWithMyAccount(riverside.code);
      expect(refused.ok).toBe(false);
      expect(refused.errors.code).toMatch(/too many/i);
    } finally {
      await db.rateLimit.deleteMany({ where: { bucket } });
    }
  });
});
