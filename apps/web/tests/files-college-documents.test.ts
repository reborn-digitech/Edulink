/**
 * WHO MAY READ A COLLEGE'S DOCUMENTS (QA campaign of 24 October 2026, unit layer; src/lib/files.ts).
 *
 * `authorizeFileRead` is the one rule between a file id and its bytes. tests/files.test.ts and its neighbours hold
 * the school's branches; the college's — a scholarship claim's papers, an offer letter, an internship's report and
 * the parent's declaration, the IQAC's documents with a grievance's attachment kept from the IQAC desk itself —
 * were at 0 hits in the campaign's coverage run (files.ts at 68.6 % of lines). Each is held here for the people it
 * names and refused to a near miss: the same role at another college, a classmate, a guardian of an adult who has
 * not granted the area, a recruiter of another company, a recruiter after the drive has closed.
 *
 * The rows are made directly (as the owner, tests/setup.ts) with file ids no upload ever minted; nothing is stored.
 * Two ZZ colleges of this file's own, removed after with everything under them.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authorizeFileRead } from "@/lib/files";
import type { ActiveContext } from "@/lib/session";
// A grant is one guardian's since TA-555 (14 November 2026): "the student grants X" is to each family guardian linked to them.
import { grantToGuardians, revokeFromGuardians } from "./consent-grants";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};
const member: Record<string, string> = {};
const memberSchool: Record<string, string> = {};
const school: Record<string, string> = {};
const file = (name: string) => `zz-cfiles-${name}-${STAMP}.pdf`;

const as = (key: string, role: string | null, opts: { superuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[`${key}:${role}`] ?? null, schoolId: memberSchool[`${key}:${role}`] ?? null, role, user: { id: ids[key]!, name: key, preferredName: null, email: `zz-cfiles-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(opts.superuser), isAppAdmin: false } }) as unknown as ActiveContext;
const allowed = async (fileId: string, who: ActiveContext | null) => (await authorizeFileRead(fileId, who)).allowed;

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ CFiles ${tag} ${STAMP}`, slug: `zz-cfiles-${tag.toLowerCase()}-${STAMP}`, code: `ZF${tag[0]}${SUFFIX}`, contactEmail: `zz-cfiles-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } });
  school.a = (await mk("Alpha")).id;
  school.b = (await mk("Beta")).id;
  const person = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await db.user.create({ data: { name: `ZZ CFiles ${key} ${STAMP}`, email: `zz-cfiles-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  const join = async (key: string, schoolKey: string, role: string, extra: Record<string, unknown> = {}) => {
    const m = await db.membership.create({ data: { userId: ids[key]!, schoolId: school[schoolKey]!, role, status: "ACTIVE", ...extra }, select: { id: true } });
    member[`${key}:${role}`] = m.id;
    memberSchool[`${key}:${role}`] = school[schoolKey]!;
    return m.id;
  };
  for (const [key, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["accounts", "ACCOUNTS"], ["iqac", "IQAC"], ["tpo", "TPO"], ["hod", "HOD"], ["faculty", "FACULTY"], ["faculty2", "FACULTY"], ["librarian", "LIBRARIAN"]] as const) {
    await person(key);
    await join(key, "a", role);
  }
  await person("otherAdmin");
  await join("otherAdmin", "b", "ADMIN");
  await person("otherAccounts");
  await join("otherAccounts", "b", "ACCOUNTS");
  await person("student", { birthdate: new Date("2004-01-01T00:00:00Z"), isMinor: false });
  await person("classmate", { birthdate: new Date("2004-02-01T00:00:00Z"), isMinor: false });
  await person("minorStudent", { birthdate: new Date("2010-02-01T00:00:00Z"), isMinor: true });
  await join("student", "a", "STUDENT", { studentCode: `ZFS${STAMP}` });
  await join("classmate", "a", "STUDENT", { studentCode: `ZFC${STAMP}` });
  await join("minorStudent", "a", "STUDENT", { studentCode: `ZFM${STAMP}` });
  await person("guardian");
  await person("minorGuardian");
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: member["student:STUDENT"]!, studentSchoolId: school.a!, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.minorGuardian!, studentMembershipId: member["minorStudent:STUDENT"]!, studentSchoolId: school.a!, status: "ACTIVE" } });
  await person("recruiter");
  await person("otherRecruiter");
  await person("stranger");
  await person("operator", { isSuperuser: true });

  // A scholarship claim's paper.
  await db.scholarshipClaim.create({ data: { schoolId: school.a!, studentMembershipId: member["student:STUDENT"]!, scheme: "EBC", academicYear: "2026-27", documentsJson: JSON.stringify([{ key: "INCOME", fileId: file("income"), name: "Income", uploadedAt: new Date().toISOString() }]) } });
  // A placement drive with an offer letter, at a company with one recruiter; another company with another.
  const company = await db.company.create({ data: { name: `ZZ CFiles Co ${STAMP}`, identifier: `zz-cfiles-co-${STAMP}`, pointOfContact: "zz" }, select: { id: true } });
  const otherCompany = await db.company.create({ data: { name: `ZZ CFiles Other ${STAMP}`, identifier: `zz-cfiles-other-${STAMP}`, pointOfContact: "zz" }, select: { id: true } });
  ids.company = company.id;
  ids.otherCompany = otherCompany.id;
  await db.companyRecruiter.create({ data: { companyId: company.id, userId: ids.recruiter! } });
  await db.companyRecruiter.create({ data: { companyId: otherCompany.id, userId: ids.otherRecruiter! } });
  ids.drive = (await db.drive.create({ data: { schoolId: school.a!, companyId: company.id, kind: "ON_CAMPUS", title: "ZZ Drive", packageMinRupees: 1, packageMaxRupees: 2, status: "OFFERS", createdByUserId: ids.tpo! }, select: { id: true } })).id;
  await db.offer.create({ data: { schoolId: school.a!, driveId: ids.drive, studentMembershipId: member["student:STUDENT"]!, packageRupees: 500_000, letterFileId: file("offer"), byUserId: ids.tpo! } });
  // An internship with a supervising faculty member, its report and the parent's declaration; one of a minor's.
  await db.internship.create({ data: { schoolId: school.a!, studentMembershipId: member["student:STUDENT"]!, companyName: "ZZ Co", kind: "SUMMER", fromKey: "2026-05-01", toKey: "2026-06-30", hours: 240, windowSemester: 4, supervisorName: "ZZ Mentor", facultyMembershipId: member["faculty:FACULTY"]!, reportFileId: file("report"), parentDeclarationFileId: file("declaration") } });
  await db.internship.create({ data: { schoolId: school.a!, studentMembershipId: member["minorStudent:STUDENT"]!, companyName: "ZZ Co", kind: "SUMMER", fromKey: "2026-05-01", toKey: "2026-06-30", hours: 240, windowSemester: 2, supervisorName: "ZZ Mentor", reportFileId: file("minor-report") } });
  // The IQAC's files: evidence, a research paper and a grievance's attachment, each uploaded by somebody.
  for (const [name, purpose, by] of [["evidence", "EVIDENCE", "iqac"], ["research", "RESEARCH", "faculty"], ["grievance", "GRIEVANCE", "classmate"]] as const) {
    await db.iqacFile.create({ data: { schoolId: school.a!, fileId: file(name), title: `ZZ ${name}`, purpose, uploadedByUserId: ids[by]! } });
  }
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { parentUserId: { in: [ids.guardian!, ids.minorGuardian!] } } });
  await db.drive.deleteMany({ where: { id: ids.drive } });
  await db.school.deleteMany({ where: { id: { in: Object.values(school) } } });
  await db.companyRecruiter.deleteMany({ where: { companyId: { in: [ids.company!, ids.otherCompany!] } } });
  await db.company.deleteMany({ where: { id: { in: [ids.company!, ids.otherCompany!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the default", () => {
  it("an id nothing references is not found to anybody, the operator included; signed out, nothing is even looked up", async () => {
    expect(await authorizeFileRead(file("orphan"), as("admin", "ADMIN"))).toEqual({ allowed: false, reason: "not-found" });
    expect(await authorizeFileRead(file("orphan"), as("operator", null, { superuser: true }))).toEqual({ allowed: false, reason: "not-found" });
    expect(await authorizeFileRead(file("income"), null)).toEqual({ allowed: false, reason: "unauthenticated" });
  });
});

describe("a scholarship claim's papers", () => {
  it("the student who added them, and the college's office, accounts desk and principal", async () => {
    expect(await authorizeFileRead(file("income"), as("student", "STUDENT"))).toEqual({ allowed: true, kind: "scholarship", public: false });
    for (const [key, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["accounts", "ACCOUNTS"]]) expect(await allowed(file("income"), as(key!, role!)), `${role}`).toBe(true);
  });

  it("⚠ never a classmate, another desk of the college, the same desks at another college, or the student's guardian", async () => {
    expect(await allowed(file("income"), as("classmate", "STUDENT"))).toBe(false);
    expect(await allowed(file("income"), as("tpo", "TPO"))).toBe(false);
    expect(await allowed(file("income"), as("librarian", "LIBRARIAN"))).toBe(false);
    expect(await allowed(file("income"), as("otherAdmin", "ADMIN"))).toBe(false);
    expect(await allowed(file("income"), as("otherAccounts", "ACCOUNTS"))).toBe(false);
    expect(await allowed(file("income"), as("guardian", "PARENT"))).toBe(false);
  });
});

describe("an offer letter", () => {
  it("the student, the college's cell (TPO, office, principal) and a recruiter of the drive's company while the drive is live", async () => {
    expect(await allowed(file("offer"), as("student", "STUDENT"))).toBe(true);
    for (const [key, role] of [["tpo", "TPO"], ["admin", "ADMIN"], ["principal", "PRINCIPAL"]]) expect(await allowed(file("offer"), as(key!, role!)), `${role}`).toBe(true);
    expect(await allowed(file("offer"), as("recruiter", "RECRUITER"))).toBe(true);
  });

  it("⚠ not a recruiter of another company, not the drive's recruiter once it closes or after being removed, not a classmate or a HOD", async () => {
    expect(await allowed(file("offer"), as("otherRecruiter", "RECRUITER"))).toBe(false);
    expect(await allowed(file("offer"), as("classmate", "STUDENT"))).toBe(false);
    expect(await allowed(file("offer"), as("hod", "HOD"))).toBe(false);
    expect(await allowed(file("offer"), as("otherAdmin", "ADMIN"))).toBe(false);
    await db.drive.update({ where: { id: ids.drive }, data: { status: "CLOSED" } });
    expect(await allowed(file("offer"), as("recruiter", "RECRUITER"))).toBe(false);
    await db.drive.update({ where: { id: ids.drive }, data: { status: "OFFERS" } });
    await db.companyRecruiter.updateMany({ where: { companyId: ids.company, userId: ids.recruiter }, data: { removedAt: new Date() } });
    expect(await allowed(file("offer"), as("recruiter", "RECRUITER"))).toBe(false);
    await db.companyRecruiter.updateMany({ where: { companyId: ids.company, userId: ids.recruiter }, data: { removedAt: null } });
  });

  it("an adult student's guardian only while PLACEMENT is granted", async () => {
    expect(await allowed(file("offer"), as("guardian", "PARENT"))).toBe(false);
    await grantToGuardians(db, school.a!, member["student:STUDENT"]!, "PLACEMENT");
    expect(await allowed(file("offer"), as("guardian", "PARENT"))).toBe(true);
    // A grant of another area opens nothing here.
    await revokeFromGuardians(db, member["student:STUDENT"]!, "PLACEMENT");
    await grantToGuardians(db, school.a!, member["student:STUDENT"]!, "MONEY");
    expect(await allowed(file("offer"), as("guardian", "PARENT"))).toBe(false);
  });
});

describe("an internship's papers", () => {
  it("the student, the supervising faculty member, and the college's TPO, HOD, office and principal; both papers alike", async () => {
    for (const name of ["report", "declaration"]) {
      expect(await allowed(file(name), as("student", "STUDENT")), name).toBe(true);
      expect(await allowed(file(name), as("faculty", "FACULTY")), name).toBe(true);
      for (const [key, role] of [["tpo", "TPO"], ["hod", "HOD"], ["admin", "ADMIN"], ["principal", "PRINCIPAL"]]) expect(await allowed(file(name), as(key!, role!)), `${name} ${role}`).toBe(true);
    }
  });

  it("⚠ not another faculty member, not the IQAC or accounts desk, not a classmate, not another college", async () => {
    expect(await allowed(file("report"), as("faculty2", "FACULTY"))).toBe(false);
    expect(await allowed(file("report"), as("iqac", "IQAC"))).toBe(false);
    expect(await allowed(file("report"), as("accounts", "ACCOUNTS"))).toBe(false);
    expect(await allowed(file("report"), as("classmate", "STUDENT"))).toBe(false);
    expect(await allowed(file("report"), as("otherAdmin", "ADMIN"))).toBe(false);
  });

  it("a minor's report to their guardian with no grant; another family's guardian never", async () => {
    expect(await allowed(file("minor-report"), as("minorGuardian", "PARENT"))).toBe(true);
    expect(await allowed(file("minor-report"), as("guardian", "PARENT"))).toBe(false);
  });
});

describe("the IQAC's documents", () => {
  it("evidence: the IQAC desk, the office, the principal, and its uploader; never a HOD or a student", async () => {
    for (const [key, role] of [["iqac", "IQAC"], ["admin", "ADMIN"], ["principal", "PRINCIPAL"]]) expect(await allowed(file("evidence"), as(key!, role!)), `${role}`).toBe(true);
    expect(await allowed(file("evidence"), as("hod", "HOD"))).toBe(false);
    expect(await allowed(file("evidence"), as("student", "STUDENT"))).toBe(false);
    expect(await allowed(file("evidence"), as("otherAdmin", "ADMIN"))).toBe(false);
  });

  it("a research paper is the department's record too: its HOD reads it, and the faculty member who uploaded it", async () => {
    expect(await allowed(file("research"), as("hod", "HOD"))).toBe(true);
    expect(await allowed(file("research"), as("faculty", "FACULTY"))).toBe(true);
    expect(await allowed(file("research"), as("faculty2", "FACULTY"))).toBe(false);
  });

  it("⚠ a grievance's attachment is the office's, the head's and its author's alone — not the IQAC desk's, not a HOD's", async () => {
    expect(await allowed(file("grievance"), as("classmate", "STUDENT"))).toBe(true);
    expect(await allowed(file("grievance"), as("admin", "ADMIN"))).toBe(true);
    expect(await allowed(file("grievance"), as("principal", "PRINCIPAL"))).toBe(true);
    expect(await allowed(file("grievance"), as("iqac", "IQAC"))).toBe(false);
    expect(await allowed(file("grievance"), as("hod", "HOD"))).toBe(false);
    expect(await allowed(file("grievance"), as("student", "STUDENT"))).toBe(false);
  });
});
