import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { setTeacherSubjects } from "@/lib/reviews";
import type { ActiveContext } from "@/lib/session";

/**
 * Who keeps the list of what a member of staff teaches. The office, for a
 * teacher and for the head; nobody for themselves; nobody for a pupil or for
 * another school's staff.
 */

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
const ids: Record<string, { userId: string; membershipId: string }> = {};

function ctx(who: string, role: ActiveContext["role"], school = schoolId): ActiveContext {
  return {
    sessionId: "zz-subjects",
    membershipId: ids[who]!.membershipId,
    schoolId: school,
    role,
    user: {
      id: ids[who]!.userId, name: who, preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

beforeAll(async () => {
  const make = (n: string) => db.school.create({ data: { name: `ZZ Subjects ${n} ${STAMP}`, slug: `zz-subjects-${n}-${STAMP}`, code: `ZS${n}${String(STAMP).slice(-6)}`, contactEmail: `zz-subjects-${n}-${STAMP}@test.invalid` }, select: { id: true } });
  schoolId = (await make("a")).id;
  otherSchoolId = (await make("b")).id;
  for (const [who, role, school] of [["admin", "ADMIN", schoolId], ["head", "PRINCIPAL", schoolId], ["teacher", "TEACHER", schoolId], ["pupil", "STUDENT", schoolId], ["elsewhere", "ADMIN", otherSchoolId]] as const) {
    const user = await db.user.create({ data: { name: `ZZ Subjects ${who}`, email: `zz-subjects-${who}-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } });
    const membership = await db.membership.create({ data: { userId: user.id, schoolId: school, role, status: "ACTIVE" }, select: { id: true } });
    ids[who] = { userId: user.id, membershipId: membership.id };
  }
});

afterAll(async () => {
  const userIds = Object.values(ids).map((row) => row.userId);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.membership.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.$disconnect();
});

const subjectsOf = async (who: string) => (await db.membership.findUniqueOrThrow({ where: { id: ids[who]!.membershipId } })).subjects;

describe("what a member of staff teaches", () => {
  it("the office sets a teacher's, tidied: trimmed, one of each whatever the capitals, twenty at most", async () => {
    expect(await setTeacherSubjects(ctx("admin", "ADMIN"), ids.teacher!.membershipId, ["  Mathematics ", "mathematics", "Science   and  Technology", ""])).toEqual({ ok: true });
    expect(JSON.parse((await subjectsOf("teacher"))!)).toEqual(["mathematics", "Science and Technology"]);
  });

  it("⚠ the office sets the head's, who is told and sent to a page a head has", async () => {
    expect(await setTeacherSubjects(ctx("admin", "ADMIN"), ids.head!.membershipId, ["Mathematics", "Physics"])).toEqual({ ok: true });
    expect(JSON.parse((await subjectsOf("head"))!)).toEqual(["Mathematics", "Physics"]);
    const told = await db.notification.findFirst({ where: { userId: ids.head!.userId }, orderBy: { createdAt: "desc" } });
    expect(told).toMatchObject({ body: "Mathematics, Physics", url: "/account" });
    expect((await db.notification.findFirst({ where: { userId: ids.teacher!.userId } }))?.url).toBe("/teacher/profile");
    const logged = await db.auditLog.findFirst({ where: { schoolId, action: "teacher.subjects.set", targetId: ids.head!.membershipId } });
    expect(logged?.actorUserId).toBe(ids.admin!.userId);

    // An empty list clears them.
    expect(await setTeacherSubjects(ctx("admin", "ADMIN"), ids.head!.membershipId, [])).toEqual({ ok: true });
    expect(await subjectsOf("head")).toBeNull();
  });

  it("⚠ the head does not set their own, nor a teacher's; a teacher sets nobody's", async () => {
    const refused = { key: "access.onlyTheOfficeSetsSubjects" };
    await expect(setTeacherSubjects(ctx("head", "PRINCIPAL"), ids.head!.membershipId, ["History"])).rejects.toMatchObject(refused);
    await expect(setTeacherSubjects(ctx("head", "PRINCIPAL"), ids.teacher!.membershipId, ["History"])).rejects.toMatchObject(refused);
    await expect(setTeacherSubjects(ctx("teacher", "TEACHER"), ids.teacher!.membershipId, ["History"])).rejects.toMatchObject(refused);
    expect(await subjectsOf("head")).toBeNull();
    expect(JSON.parse((await subjectsOf("teacher"))!)).not.toContain("History");
  });

  it("⚠ a pupil has no subjects to set, and another school's office finds nobody", async () => {
    expect(await setTeacherSubjects(ctx("admin", "ADMIN"), ids.pupil!.membershipId, ["History"])).toEqual({ ok: false, errorKey: "reviews.noSuchTeacher" });
    expect(await setTeacherSubjects(ctx("elsewhere", "ADMIN", otherSchoolId), ids.head!.membershipId, ["History"])).toEqual({ ok: false, errorKey: "reviews.noSuchTeacher" });
    expect(await subjectsOf("pupil")).toBeNull();
    expect(await subjectsOf("head")).toBeNull();
  });
});
