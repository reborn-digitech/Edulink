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
    // A handle pupil leaves with a first sign-in code; one with an address does not.
    expect(meera.firstSignInCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(devOutcome.firstSignInCode).toBeUndefined();
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

describe("⚠ a transfer row links; it never mints", () => {
  /**
   * The fork this exists to prevent: a child arrives from another school
   * holding a leaving certificate, the office types them into intake, and a
   * SECOND account appears beside the first — so the certificate, which
   * follows the person, is unreadable to the very school holding the paper.
   * The code printed on that paper is the link; the birthdate is the check.
   */
  const CODE = "STU-ZZTR-0001";
  let oldUserId: string;
  let otherSchoolId: string;

  beforeAll(async () => {
    const other = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" }, select: { id: true } });
    otherSchoolId = other.id;
    const user = await db.user.create({
      data: { name: `${TAG} Transfer Child`, email: `transfer.child@intake.test`, prefs: "{}", birthdate: new Date("2013-03-13T00:00:00Z") },
    });
    oldUserId = user.id;
    const oldMembership = await db.membership.create({
      data: { userId: user.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: CODE, leftAt: new Date("2026-04-30") },
    });
    await db.schoolRecord.create({
      data: {
        schoolId: otherSchoolId, studentUserId: user.id, studentMembershipId: oldMembership.id,
        schoolName: "Oakfield Academy", joinedAt: new Date("2020-06-01"), leftAt: new Date("2026-04-30"),
        reason: "TRANSFERRED", attendanceMarked: 100, attendancePresent: 92, reportCardCount: 3, studentCode: CODE, birthdate: new Date("2013-03-13T00:00:00Z"),
      },
    });
  });

  const transferRow = (over: Record<string, unknown> = {}) => [{
    line: 1, name: `${TAG} Transfer Child`, birthdateKey: "2013-03-13", className: "zz intake class",
    pupilEmail: null, guardianEmail: null, guardianName: null, relation: "PARENT", studentCode: CODE, ...over,
  }];

  it("⚠ attaches the membership to the existing account — one person, two schools, one login", async () => {
    const before = await db.user.count();
    const result = await admitPupils(admin, transferRow() as never, { locale: "en" });
    expect(result.admitted).toBe(1);
    expect(result.outcomes[0]).toMatchObject({ status: "admitted", linked: true });
    // No new person was minted.
    expect(await db.user.count()).toBe(before);
    const membership = await db.membership.findFirstOrThrow({
      where: { schoolId, userId: oldUserId, role: "STUDENT", leftAt: null }, select: { studentCode: true },
    });
    // A fresh per-school code; the old one still opens the old record.
    expect(membership.studentCode).not.toBe(CODE);
    // No new first sign-in: the child keeps the login they already know.
    expect(result.outcomes[0]!.firstSignInCode).toBeUndefined();
    // And the certificate now follows: the record is reachable through the person.
    expect(await db.schoolRecord.count({ where: { studentUserId: oldUserId } })).toBe(1);
  });

  it("a second upload is already on the roll, not a second membership", async () => {
    const result = await admitPupils(admin, transferRow() as never, { locale: "en" });
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.alreadyOnRoll" });
  });

  it("⚠ possession of the code alone is not enough: no birthdate, wrong birthdate, unknown code", async () => {
    const noDob = await admitPupils(admin, transferRow({ birthdateKey: null, name: `${TAG} NoDob` }) as never, { locale: "en" });
    expect(noDob.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.codeNeedsBirthdate" });

    const wrongDob = await admitPupils(admin, transferRow({ birthdateKey: "2013-03-14", name: `${TAG} WrongDob` }) as never, { locale: "en" });
    expect(wrongDob.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.codeMismatch" });

    const unknown = await admitPupils(admin, transferRow({ studentCode: "STU-NONE-0000", name: `${TAG} Unknown` }) as never, { locale: "en" });
    expect(unknown.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.codeNotFound" });

    // None of the refused rows minted anything.
    expect(await db.membership.count({ where: { schoolId, user: { name: { in: [`${TAG} NoDob`, `${TAG} WrongDob`, `${TAG} Unknown`] } } } })).toBe(0);
  });

  it("the CSV parser recognises the column and uppercases the code", () => {
    const parsed = parseIntakeCsv("name,dob,student code\nA Child,13/03/2013,stu-zztr-0001\n", "2026-08-24");
    expect(parsed.valid[0]).toMatchObject({ studentCode: "STU-ZZTR-0001" });
  });
});
