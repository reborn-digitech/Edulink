import type { PrismaClient } from "@prisma/client";
import { COLLEGE_MODULES, SCHOOL_VERSION_MODULES } from "@edulink/contracts";
import { openAlumnus } from "../src/lib/alumni-membership";
import { schoolCode } from "../src/lib/codes";

/**
 * THE TWO ZZ COLLEGES (the college foundation, 4 October 2026), for the
 * college builders' tests, the sweeps and a walk by hand.
 *
 *   ZZ Vidya College (zz-vidya-college), kind COLLEGE, every module on (the
 *   school version's six and the college's six): an office (zz.cadmin) and a
 *   principal (zz.cprincipal); one person in each college staff role —
 *   zz.faculty01, zz.faculty02, zz.hod01, zz.examctrl, zz.iqac, zz.tpo,
 *   zz.accounts; three students — zz.cstudent01 a minor of 17, zz.cstudent02
 *   an adult of 20, zz.cstudent03 an adult of 19; zz.cparent01, guardian of
 *   cstudent01 (sees everything) and of cstudent02 (sees only what she
 *   grants: nothing, until she does); and zz.calumni01, an adult who left in
 *   2025 and holds an ALUMNUS row there.
 *
 *   Streams (5 Oct 2026): Vidya ARTS, SCIENCE and COMMERCE; Shastri
 *   ENGINEERING. Duties: zz.faculty01 LAB_INCHARGE and ANTI_RAGGING_SQUAD,
 *   zz.faculty.s1 LAB_INCHARGE; nobody else holds one.
 *
 *   ZZ Shastri Autonomous College (zz-shastri-college), kind
 *   AUTONOMOUS_COLLEGE, ACADEMICS and EXAMS on (and ALUMNI, as every tenant
 *   starts): an office (zz.cadmin.s), one faculty member (zz.faculty.s1) and
 *   one student (zz.cstudent.s1) — the autonomous switch, and the college
 *   where PLACEMENT, IQAC, ADMISSIONS and SCHOLARSHIPS are off for a
 *   MODULE_OFF test.
 *
 *   zz.recruiter01, a RECRUITER account (Zeta Analytics) with no membership
 *   anywhere: a college reaches them only through a drive.
 *
 * No consent row is written: cstudent02 starts having granted nothing, which
 * is the default the plan names. Re-run safe: every row is found by its key.
 */
const DOMAIN = "zz.test";

type Person = { email: string; name: string; birthdate?: Date; isMinor?: boolean };

async function person(db: PrismaClient, passwordHash: string, p: Person) {
  return db.user.upsert({
    where: { email: p.email },
    update: { isTestFixture: true, ...(p.isMinor !== undefined ? { isMinor: p.isMinor } : {}), ...(p.birthdate ? { birthdate: p.birthdate } : {}) },
    create: {
      email: p.email,
      name: p.name,
      isTestFixture: true,
      passwordHash,
      emailVerifiedAt: new Date(),
      isMinor: p.isMinor ?? false,
      ...(p.birthdate ? { birthdate: p.birthdate } : {}),
      prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }),
    },
    select: { id: true },
  });
}

async function member(db: PrismaClient, userId: string, schoolId: string, role: string, extra: { title?: string; gradeLevel?: string; joinedAt?: Date; leftAt?: Date } = {}) {
  const existing = await db.membership.findUnique({ where: { userId_schoolId_role: { userId, schoolId, role } }, select: { id: true } });
  if (existing) return existing;
  return db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } });
}

async function college(db: PrismaClient, spec: { name: string; slug: string; kind: string; city: string; modules: readonly string[]; streams: readonly string[] }) {
  const existing = await db.school.findUnique({ where: { slug: spec.slug }, select: { id: true, name: true, code: true } });
  const school =
    existing ??
    (await db.school.create({
      data: {
        name: spec.name,
        slug: spec.slug,
        kind: spec.kind,
        isTestFixture: true,
        code: schoolCode(spec.name.replace(/^ZZ /, "")),
        city: spec.city,
        country: "India",
        region: "Maharashtra",
        contactEmail: `office.${spec.slug}@${DOMAIN}`,
        timezone: "Asia/Kolkata",
        brandPrimary: "#0369a1",
        verifiedAt: new Date(),
        affiliatingUniversity: "Savitribai Phule Pune University",
        aisheCode: spec.kind === "AUTONOMOUS_COLLEGE" ? "C-99002" : "C-99001",
        naacGrade: spec.kind === "AUTONOMOUS_COLLEGE" ? "A+" : "B++",
        naacValidUntil: new Date("2029-03-31T00:00:00Z"),
        nirfCategory: "COLLEGE",
        streamsJson: JSON.stringify(spec.streams),
      },
      select: { id: true, name: true, code: true },
    }));
  // The streams (5 Oct 2026) are the fixture's: set on every run, as the kind is.
  if (existing) await db.school.update({ where: { id: existing.id }, data: { kind: spec.kind, isTestFixture: true, streamsJson: JSON.stringify(spec.streams) } });
  await db.schoolModule.createMany({ data: spec.modules.map((module) => ({ schoolId: school.id, module })), skipDuplicates: true });
  return school;
}

export type CollegeFixtures = {
  vidya: { id: string; name: string; code: string };
  shastri: { id: string; name: string; code: string };
  roles: Record<string, string>;
  students: { minor: string; adult: string; adult2: string };
  parentUserId: string;
  alumnusMembershipId: string;
  recruiterUserId: string;
};

export async function buildColleges(db: PrismaClient, passwordHash: string): Promise<CollegeFixtures> {
  // The streams (5 Oct 2026): Vidya teaches arts, science and commerce; Shastri is an engineering college.
  const vidya = await college(db, { name: "ZZ Vidya College", slug: "zz-vidya-college", kind: "COLLEGE", city: "Pune", modules: [...SCHOOL_VERSION_MODULES, ...COLLEGE_MODULES], streams: ["ARTS", "SCIENCE", "COMMERCE"] });
  const shastri = await college(db, { name: "ZZ Shastri Autonomous College", slug: "zz-shastri-college", kind: "AUTONOMOUS_COLLEGE", city: "Nashik", modules: ["ALUMNI", "ACADEMICS", "EXAMS"], streams: ["ENGINEERING"] });

  const roles: Record<string, string> = {};
  const staff: [string, string, string, string][] = [
    ["ADMIN", `zz.cadmin@${DOMAIN}`, "ZZ Vaishali Gokhale", "Registrar"],
    ["PRINCIPAL", `zz.cprincipal@${DOMAIN}`, "ZZ Dr Arvind Kelkar", "Principal"],
    ["FACULTY", `zz.faculty01@${DOMAIN}`, "ZZ Dr Neha Apte", "Assistant professor, Physics"],
    ["FACULTY", `zz.faculty02@${DOMAIN}`, "ZZ Prof Samir Kadam", "Assistant professor, Chemistry"],
    ["HOD", `zz.hod01@${DOMAIN}`, "ZZ Dr Medha Ranade", "Head, Department of Physics"],
    ["EXAM_CONTROLLER", `zz.examctrl@${DOMAIN}`, "ZZ Prakash Bhide", "Controller of examinations"],
    ["IQAC", `zz.iqac@${DOMAIN}`, "ZZ Dr Swati Natu", "IQAC coordinator"],
    ["TPO", `zz.tpo@${DOMAIN}`, "ZZ Ajay Sathe", "Training and placement officer"],
    ["ACCOUNTS", `zz.accounts@${DOMAIN}`, "ZZ Rekha Datar", "Accounts officer"],
  ];
  for (const [role, email, name, title] of staff) {
    const u = await person(db, passwordHash, { email, name });
    const m = await member(db, u.id, vidya.id, role, { title });
    roles[email] = m.id;
  }

  // Ages fixed against 4 October 2026: 17, 20 and 19. isMinor is what the consent rule reads (refreshMinority keeps it to the birthday).
  const minor = await person(db, passwordHash, { email: `zz.cstudent01@${DOMAIN}`, name: "ZZ Ishaan Pathak", birthdate: new Date("2009-02-14T00:00:00Z"), isMinor: true });
  const adult = await person(db, passwordHash, { email: `zz.cstudent02@${DOMAIN}`, name: "ZZ Ananya Pathak", birthdate: new Date("2006-01-20T00:00:00Z"), isMinor: false });
  const adult2 = await person(db, passwordHash, { email: `zz.cstudent03@${DOMAIN}`, name: "ZZ Omkar Jadhav", birthdate: new Date("2007-07-02T00:00:00Z"), isMinor: false });
  const sMinor = await member(db, minor.id, vidya.id, "STUDENT", { gradeLevel: "11" });
  const sAdult = await member(db, adult.id, vidya.id, "STUDENT", { gradeLevel: "12" });
  const sAdult2 = await member(db, adult2.id, vidya.id, "STUDENT", { gradeLevel: "12" });
  for (const [id, code] of [[sMinor.id, "ZZV-001"], [sAdult.id, "ZZV-002"], [sAdult2.id, "ZZV-003"]] as const) {
    await db.membership.updateMany({ where: { id, studentCode: null }, data: { studentCode: code } });
  }

  const parent = await person(db, passwordHash, { email: `zz.cparent01@${DOMAIN}`, name: "ZZ Sunil Pathak" });
  for (const studentMembershipId of [sMinor.id, sAdult.id]) {
    const existing = await db.guardianship.findUnique({ where: { parentUserId_studentMembershipId: { parentUserId: parent.id, studentMembershipId } }, select: { id: true } });
    if (!existing) {
      const now = new Date();
      await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId, studentSchoolId: vidya.id, relation: "PARENT", status: "ACTIVE", consentSharingAt: now, consentNotificationsAt: now } });
    }
  }

  // An adult who graduated in 2025: the closed STUDENT row and the open ALUMNUS row, as a departure leaves them.
  const graduate = await person(db, passwordHash, { email: `zz.calumni01@${DOMAIN}`, name: "ZZ Pooja Wagh", birthdate: new Date("2003-11-05T00:00:00Z"), isMinor: false });
  const leftAt = new Date("2025-05-31T06:30:00Z");
  await member(db, graduate.id, vidya.id, "STUDENT", { gradeLevel: "TY", joinedAt: new Date("2022-07-01T04:00:00Z"), leftAt });
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], graduate.id, vidya.id, leftAt);
  const alumnus = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: graduate.id, schoolId: vidya.id, role: "ALUMNUS" } }, select: { id: true } });

  // The autonomous college: its office, one faculty member, one student.
  const sAdmin = await person(db, passwordHash, { email: `zz.cadmin.s@${DOMAIN}`, name: "ZZ Kiran Deshpande" });
  await member(db, sAdmin.id, shastri.id, "ADMIN", { title: "Registrar" });
  const sFaculty = await person(db, passwordHash, { email: `zz.faculty.s1@${DOMAIN}`, name: "ZZ Dr Rohit Mahajan" });
  roles[`zz.faculty.s1@${DOMAIN}`] = (await member(db, sFaculty.id, shastri.id, "FACULTY", { title: "Associate professor, Commerce" })).id;
  // DUTIES (5 Oct 2026), the fixture's, set on every run: zz.faculty01 on Vidya's anti-ragging squad and in charge of a lab
  // (science offers it); zz.faculty02 and zz.hod01 hold none, so the sweep's HOD is refused a duty's door; Shastri's
  // faculty member is a lab in-charge (engineering offers it).
  await db.membership.update({ where: { id: roles[`zz.faculty01@${DOMAIN}`]! }, data: { dutiesJson: JSON.stringify(["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"]) } });
  await db.membership.update({ where: { id: roles[`zz.faculty.s1@${DOMAIN}`]! }, data: { dutiesJson: JSON.stringify(["LAB_INCHARGE"]) } });
  await db.membership.updateMany({ where: { schoolId: { in: [vidya.id, shastri.id] }, id: { notIn: [roles[`zz.faculty01@${DOMAIN}`]!, roles[`zz.faculty.s1@${DOMAIN}`]!] }, dutiesJson: { not: "[]" } }, data: { dutiesJson: "[]" } });
  const sStudent = await person(db, passwordHash, { email: `zz.cstudent.s1@${DOMAIN}`, name: "ZZ Tanvi Kale", birthdate: new Date("2006-09-09T00:00:00Z"), isMinor: false });
  await member(db, sStudent.id, shastri.id, "STUDENT", { gradeLevel: "12" });

  // The recruiter: an account and its profile, no membership.
  const recruiter = await person(db, passwordHash, { email: `zz.recruiter01@${DOMAIN}`, name: "ZZ Nikhil Rao" });
  await db.recruiterProfile.upsert({ where: { userId: recruiter.id }, create: { userId: recruiter.id, companyName: "ZZ Zeta Analytics" }, update: { disabledAt: null } });

  return {
    vidya,
    shastri,
    roles,
    students: { minor: sMinor.id, adult: sAdult.id, adult2: sAdult2.id },
    parentUserId: parent.id,
    alumnusMembershipId: alumnus.id,
    recruiterUserId: recruiter.id,
  };
}
