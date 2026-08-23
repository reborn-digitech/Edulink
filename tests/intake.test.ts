import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { admitPupils } from "@/lib/intake";
import { parseIntakeCsv } from "@/lib/csv";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import type { ActiveContext } from "@/lib/session";

/**
 * Admissions intake. What must hold: a row becomes a pupil on the roll with
 * the date of birth, the student code and the class the office wrote down;
 * the guardian gets an invitation and NOT a guardianship; a second upload of
 * the same list admits nobody twice; a class the school does not have, and
 * an address that already has an account, are reported and not invented.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
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

const TAG = "ZZ Intake";
let admin: ActiveContext;
let teacher: ActiveContext;
let schoolId: string;
let classId: string;

async function cleanup() {
  const users = await db.user.findMany({ where: { name: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.invite.deleteMany({ where: { schoolId, role: "PARENT", email: { endsWith: "@intake.test" } } });
  await db.guardianship.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.enrollment.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@intake.test" } } });
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } });
  const tomTeacher = await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId, role: "TEACHER" });
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-INTK" },
    create: { schoolId, name: "ZZ Intake Class", gradeLevel: "1", joinCode: "ZZZ-INTK" },
    update: { archivedAt: null },
  });
  classId = klass.id;
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

const LIST =
  "name,date of birth,class,guardian email,guardian name,relation,pupil email\n" +
  `${TAG} Aarav,14/06/2019,zz intake class,aarav.parent@intake.test,Rekha,parent,\n` +
  `${TAG} Meera,02/11/2019,ZZ Intake Class,,,,\n` +
  `${TAG} Dev,,,dev.parent@intake.test,,guardian,dev@intake.test\n`;

describe("admitting pupils from a list", () => {
  it("⚠ a row becomes a pupil on the roll: DOB, code, class, and an INVITED (not linked) guardian", async () => {
    const { valid, problems } = parseIntakeCsv(LIST, "2026-08-22");
    expect(problems).toEqual([]);
    const result = await admitPupils(admin, valid, { locale: "hi" });
    expect(result.admitted).toBe(3);
    expect(result.guardiansInvited).toBe(2);

    const aarav = await db.membership.findFirstOrThrow({
      where: { schoolId, role: "STUDENT", user: { name: `${TAG} Aarav` } },
      include: { user: true, enrollments: { where: { status: "ACTIVE" } }, guardianships: true },
    });
    expect(aarav.status).toBe("ACTIVE");
    expect(aarav.studentCode).toMatch(/^STU-/);
    expect(aarav.user.birthdate?.toISOString()).toBe("2019-06-14T00:00:00.000Z");
    expect(aarav.user.isMinor).toBe(true);
    expect(aarav.user.passwordHash).toBeNull();
    expect(aarav.user.email).toMatch(new RegExp(`@${HANDLE_DOMAIN}$`));
    expect(aarav.user.prefs).toContain('"locale":"hi"');
    expect(aarav.enrollments.map((e) => e.classId)).toEqual([classId]); // case-blind class match
    // The guardian is INVITED; the only guardianship is the stand-in teacher's.
    expect(aarav.guardianships.every((g) => g.relation === "SCHOOL")).toBe(true);
    const invite = await db.invite.findFirst({ where: { schoolId, role: "PARENT", email: "aarav.parent@intake.test", status: "PENDING" } });
    expect(invite).toMatchObject({ studentMembershipId: aarav.id, relation: "PARENT", name: "Rekha" });

    const dev = await db.user.findUniqueOrThrow({ where: { email: "dev@intake.test" } });
    expect(dev.birthdate).toBeNull();
    const devOutcome = result.outcomes.find((o) => o.name === `${TAG} Dev`)!;
    expect(devOutcome.handle).toBeUndefined(); // has an address of their own
    expect(devOutcome.guardian).toBe("invited");
    const devInvite = await db.invite.findFirstOrThrow({ where: { schoolId, role: "PARENT", email: "dev.parent@intake.test" } });
    expect(devInvite.relation).toBe("GUARDIAN");

    const meera = result.outcomes.find((o) => o.name === `${TAG} Meera`)!;
    expect(meera).toMatchObject({ status: "admitted", guardian: "none", className: "ZZ Intake Class" });
    expect(meera.handle).toMatch(/^zzintakemeer\.[a-z0-9]{4}$/);
  });

  it("⚠ uploading the same list again admits nobody twice", async () => {
    const { valid } = parseIntakeCsv(LIST, "2026-08-22");
    const before = await db.membership.count({ where: { schoolId, role: "STUDENT", user: { name: { startsWith: TAG } } } });
    const result = await admitPupils(admin, valid, { locale: "en" });
    expect(result.admitted).toBe(0);
    expect(result.outcomes.map((o) => o.reasonKey)).toEqual(["intake.alreadyOnRoll", "intake.alreadyOnRoll", "intake.alreadyOnRoll"]);
    expect(await db.membership.count({ where: { schoolId, role: "STUDENT", user: { name: { startsWith: TAG } } } })).toBe(before);
  });

  it("⚠ a class the school does not have is reported, not invented", async () => {
    const { valid } = parseIntakeCsv(`name,class\n${TAG} Nobody,Class 99\n`, "2026-08-22");
    const result = await admitPupils(admin, valid, { locale: "en" });
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.unknownClass" });
    expect(await db.class.count({ where: { schoolId, name: "Class 99" } })).toBe(0);
    expect(await db.user.count({ where: { name: `${TAG} Nobody` } })).toBe(0);
  });

  it("⚠ an address that already belongs to somebody is not claimed", async () => {
    const { valid } = parseIntakeCsv(`name,pupil email\n${TAG} Tom,tom@riverside.school\n`, "2026-08-22");
    const result = await admitPupils(admin, valid, { locale: "en" });
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.emailHasAccount" });
    expect((await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } })).name).not.toContain(TAG);
  });

  it("⚠ refuses everyone who is not an admin", async () => {
    const { valid } = parseIntakeCsv(`name\n${TAG} Never\n`, "2026-08-22");
    await expect(admitPupils(teacher, valid, { locale: "en" })).rejects.toBeInstanceOf(AccessError);
    expect(await db.user.count({ where: { name: `${TAG} Never` } })).toBe(0);
  });
});
