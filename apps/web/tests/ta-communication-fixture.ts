/**
 * The scratch school the 'communication' batch of the testing analysis of 13 November 2026 tests against
 * (tests/ta-communication-*.test.ts). Not a suite: each suite makes its own school through the owner connection,
 * stamped, and removes it afterwards, touching nothing it did not make.
 *
 * One SCHOOL with: the office (ADMIN), the head (PRINCIPAL), two teachers, two classes (5A taught by `teacher`, 5B by
 * `teacher2`), a pupil in each (both minors) and one guardian of the 5A pupil, the shape the ZZ fixtures give
 * zz.parent01 and zz.student01.
 */
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";

export type Person = { userId: string; membershipId: string };

export type CommSchool = {
  db: PrismaClient;
  stamp: number;
  schoolId: string;
  classA: string;
  classB: string;
  admin: Person;
  principal: Person;
  teacher: Person;
  teacher2: Person;
  pupilA: Person;
  pupilB: Person;
  guardian: { userId: string };
  /** The ActiveContext a door would hand the library, without a session row. A PARENT carries no school. */
  ctx(who: { userId: string; membershipId?: string }, role: string): ActiveContext;
  /** One more person of this suite's own (cleaned up with the rest), with a membership when a role is given. */
  person(who: string, role: string | null, extra?: { phone?: string; prefs?: string; isMinor?: boolean }): Promise<Person>;
  cleanup(): Promise<void>;
};

export async function makeSchool(tag: string): Promise<CommSchool> {
  const db = new PrismaClient();
  const stamp = Date.now();
  const tail = String(stamp).slice(-6);
  const prefix = `zz-tacomm-${tag}-`;
  const mail = (who: string) => `${prefix}${who}-${stamp}@test.invalid`;
  const school = await db.school.create({
    data: { name: `ZZ TA Comm ${tag} ${stamp}`, slug: `zz-tacomm-${tag}-${stamp}`, code: `ZTM${tag.slice(0, 3).toUpperCase()}${tail}`, contactEmail: mail("office"), timezone: "Asia/Kolkata", teachingDays: "0,1,2,3,4,5,6", isTestFixture: true },
    select: { id: true },
  });
  const person = async (who: string, role: string | null, extra: { phone?: string; prefs?: string; isMinor?: boolean } = {}): Promise<Person> => {
    const user = await db.user.create({ data: { name: `ZZ TA Comm ${who}`, email: mail(who), prefs: extra.prefs ?? "{}", ...(extra.phone ? { phone: extra.phone } : {}), ...(extra.isMinor !== undefined ? { isMinor: extra.isMinor } : {}) }, select: { id: true } });
    if (!role) return { userId: user.id, membershipId: "" };
    const m = await db.membership.create({ data: { userId: user.id, schoolId: school.id, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTM-${who.toUpperCase()}-${tail}`, gradeLevel: "5" } : {}) }, select: { id: true } });
    return { userId: user.id, membershipId: m.id };
  };
  const admin = await person("admin", "ADMIN");
  const principal = await person("principal", "PRINCIPAL");
  const teacher = await person("teacher", "TEACHER");
  const teacher2 = await person("teacher2", "TEACHER");
  const pupilA = await person("pupila", "STUDENT", { isMinor: true });
  const pupilB = await person("pupilb", "STUDENT", { isMinor: true });
  const guardian = { userId: (await person("guardian", null)).userId };
  const classA = (await db.class.create({ data: { schoolId: school.id, name: `ZZ TA Comm 5A ${tail}`, gradeLevel: "5", section: "A", joinCode: `ZTMA${tail}` }, select: { id: true } })).id;
  const classB = (await db.class.create({ data: { schoolId: school.id, name: `ZZ TA Comm 5B ${tail}`, gradeLevel: "5", section: "B", joinCode: `ZTMB${tail}` }, select: { id: true } })).id;
  await db.classTeacher.createMany({ data: [{ schoolId: school.id, classId: classA, teacherMembershipId: teacher.membershipId }, { schoolId: school.id, classId: classB, teacherMembershipId: teacher2.membershipId }] });
  await db.enrollment.createMany({
    data: [
      { schoolId: school.id, classId: classA, studentMembershipId: pupilA.membershipId, status: "ACTIVE" },
      { schoolId: school.id, classId: classB, studentMembershipId: pupilB.membershipId, status: "ACTIVE" },
    ],
  });
  await db.guardianship.create({ data: { parentUserId: guardian.userId, studentMembershipId: pupilA.membershipId, studentSchoolId: school.id, relation: "PARENT", status: "ACTIVE" } });

  const ctx = (who: { userId: string; membershipId?: string }, role: string): ActiveContext =>
    ({
      sessionId: "test",
      membershipId: role === "PARENT" ? null : (who.membershipId ?? null),
      schoolId: role === "PARENT" ? null : school.id,
      role,
      user: {
        id: who.userId,
        name: "ZZ TA Comm",
        preferredName: null,
        email: null,
        avatarKey: null,
        isMinor: false,
        isSuperuser: false,
        isAppAdmin: false,
        prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
      },
    }) as unknown as ActiveContext;

  return {
    db,
    stamp,
    schoolId: school.id,
    classA,
    classB,
    admin,
    principal,
    teacher,
    teacher2,
    pupilA,
    pupilB,
    guardian,
    ctx,
    person,
    async cleanup() {
      const users = await db.user.findMany({ where: { email: { startsWith: prefix, endsWith: `-${stamp}@test.invalid` } }, select: { id: true } });
      const userIds = users.map((u) => u.id);
      await db.session.deleteMany({ where: { userId: { in: userIds } } });
      await db.notification.deleteMany({ where: { userId: { in: userIds } } });
      await db.report.deleteMany({ where: { reporterUserId: { in: userIds } } });
      await db.auditLog.deleteMany({ where: { schoolId: school.id } }).catch(() => {});
      await db.school.deleteMany({ where: { id: school.id } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.$disconnect();
    },
  };
}
