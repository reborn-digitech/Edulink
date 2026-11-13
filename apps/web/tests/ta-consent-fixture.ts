/**
 * The scratch college the 'consent' batch of the testing analysis of 13 November 2026 tests against
 * (tests/ta-consent-*.test.ts). Not a suite: each suite makes its own college through the owner
 * connection, stamped, and removes it afterwards, touching nothing it did not make.
 *
 * One COLLEGE with: the office (ADMIN), a teacher, an ADULT student (born 2000, so twenty-six on the
 * college's day) who has granted nothing, a MINOR student (born 2011) and one guardian of both — the
 * shape scripts/zz-college.ts gives zz.cparent01 with zz.cstudent01 and zz.cstudent02. A second
 * guardian guards the adult alone.
 */
import { PrismaClient } from "@prisma/client";
import type { StudentConsentGrant } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";

export type College = {
  db: PrismaClient;
  stamp: number;
  schoolId: string;
  admin: { userId: string; membershipId: string };
  teacher: { userId: string; membershipId: string };
  adult: { userId: string; membershipId: string };
  minor: { userId: string; membershipId: string };
  guardian: { userId: string };
  guardianOfAdult: { userId: string };
  /** The ActiveContext a door would hand the library, without a session row. */
  ctx(who: { userId: string; membershipId?: string }, role: string, schoolId?: string | null): ActiveContext;
  /** One more student of the college, guarded by `guardian`: an adult (born 2001) or a minor (born 2012). */
  addStudent(who: string, adult: boolean): Promise<{ userId: string; membershipId: string }>;
  grant(studentMembershipId: string, grant: StudentConsentGrant): Promise<void>;
  revokeAll(studentMembershipId: string): Promise<void>;
  cleanup(): Promise<void>;
};

export async function makeCollege(tag: string, opts: { kind?: string } = {}): Promise<College> {
  const db = new PrismaClient();
  const stamp = Date.now();
  const tail = String(stamp).slice(-6);
  const mail = (who: string) => `zz-tacons-${tag}-${who}-${stamp}@test.invalid`;
  const school = await db.school.create({
    data: { name: `ZZ TA Consent ${tag} ${stamp}`, slug: `zz-tacons-${tag}-${stamp}`, code: `ZTC${tag.slice(0, 3).toUpperCase()}${tail}`, contactEmail: mail("office"), timezone: "Asia/Kolkata", kind: opts.kind ?? "COLLEGE", teachingDays: "0,1,2,3,4,5,6", isTestFixture: true },
    select: { id: true },
  });
  const person = async (who: string, role: string | null, extra: { birthdate?: Date; isMinor?: boolean } = {}) => {
    const user = await db.user.create({ data: { name: `ZZ TA Consent ${who}`, email: mail(who), prefs: "{}", ...extra }, select: { id: true } });
    if (!role) return { userId: user.id, membershipId: "" };
    const m = await db.membership.create({ data: { userId: user.id, schoolId: school.id, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTC-${who.toUpperCase()}-${tail}` } : {}) }, select: { id: true } });
    return { userId: user.id, membershipId: m.id };
  };
  const admin = await person("admin", "ADMIN");
  const teacher = await person("teacher", "TEACHER");
  const adult = await person("adult", "STUDENT", { birthdate: new Date("2000-01-15T00:00:00.000Z"), isMinor: false });
  const minor = await person("minor", "STUDENT", { birthdate: new Date("2011-06-01T00:00:00.000Z"), isMinor: true });
  const guardian = { userId: (await person("guardian", null)).userId };
  const guardianOfAdult = { userId: (await person("guardian2", null)).userId };
  await db.guardianship.createMany({
    data: [
      { parentUserId: guardian.userId, studentMembershipId: adult.membershipId, studentSchoolId: school.id, relation: "PARENT", status: "ACTIVE" },
      { parentUserId: guardian.userId, studentMembershipId: minor.membershipId, studentSchoolId: school.id, relation: "PARENT", status: "ACTIVE" },
      { parentUserId: guardianOfAdult.userId, studentMembershipId: adult.membershipId, studentSchoolId: school.id, relation: "GUARDIAN", status: "ACTIVE" },
    ],
  });
  const ctx = (who: { userId: string; membershipId?: string }, role: string, schoolId: string | null = school.id): ActiveContext => ({
    sessionId: "test",
    membershipId: role === "PARENT" ? null : (who.membershipId ?? null),
    schoolId: role === "PARENT" ? null : schoolId,
    role: role as ActiveContext["role"],
    user: {
      id: who.userId,
      name: "ZZ TA Consent",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  }) as ActiveContext;
  return {
    db,
    stamp,
    schoolId: school.id,
    admin,
    teacher,
    adult,
    minor,
    guardian,
    guardianOfAdult,
    ctx,
    async addStudent(who, isAdult) {
      const s = await person(who, "STUDENT", isAdult ? { birthdate: new Date("2001-03-10T00:00:00.000Z"), isMinor: false } : { birthdate: new Date("2012-03-10T00:00:00.000Z"), isMinor: true });
      await db.guardianship.create({ data: { parentUserId: guardian.userId, studentMembershipId: s.membershipId, studentSchoolId: school.id, relation: "PARENT", status: "ACTIVE" } });
      return s;
    },
    async grant(studentMembershipId, grant) {
      await db.studentConsent.upsert({
        where: { studentMembershipId_grant: { studentMembershipId, grant } },
        create: { schoolId: school.id, studentMembershipId, grant },
        update: { revokedAt: null },
      });
    },
    async revokeAll(studentMembershipId) {
      await db.studentConsent.updateMany({ where: { studentMembershipId, revokedAt: null }, data: { revokedAt: new Date() } });
    },
    async cleanup() {
      const users = await db.user.findMany({ where: { email: { startsWith: `zz-tacons-${tag}-`, endsWith: `-${stamp}@test.invalid` } }, select: { id: true } });
      const userIds = users.map((u) => u.id);
      await db.session.deleteMany({ where: { userId: { in: userIds } } });
      await db.notification.deleteMany({ where: { userId: { in: userIds } } });
      await db.school.deleteMany({ where: { id: school.id } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.$disconnect();
    },
  };
}
