/**
 * THE CLINICAL DESK'S ZZ FIXTURE (R-56, the clinical half; 10 October 2026),
 * run by `npm run zz:fixtures` after the stream records. Neither ZZ Vidya
 * (arts, science, commerce) nor ZZ Shastri (engineering) offers the duty, and
 * switching a stream on either would change what every other builder's
 * fixture is offered, so the desk has a college of its own:
 *
 *   ZZ Dhanvantari Nursing College (zz-dhanvantari-college), kind COLLEGE,
 *   stream HEALTH_SCIENCES, ALUMNI + ACADEMICS on (and PLACEMENT, as the
 *   preset switches it): an office (zz.cadmin.d), a head (zz.cprincipal.d),
 *   zz.faculty.d1 (FACULTY, the CLINICAL_COORDINATOR), zz.faculty.d2 (FACULTY,
 *   supervises rotation 1, holds no duty), zz.hod.d1 (HOD, no duty); the
 *   nursing department, a B.Sc. Nursing programme (INC, stream
 *   HEALTH_SCIENCES) with a scheme; the division "ZZ SY BSc Nursing A" with
 *   three adult students zz.cstudent.d1–d3 (no password: a minted session);
 *   the site ZZ Civil Hospital, Pune (HOSPITAL, agreement this year, contact
 *   the medical superintendent) with a Medical ward (40 beds) and a Surgical
 *   ward (30); rotation 1 to the Medical ward running today under
 *   zz.faculty.d2, rotation 2 to the Surgical ward ahead under zz.faculty.d1;
 *   zz.cstudent.d1's SIGNED and RETURNED entries, d2's SUBMITTED, d3's DRAFT.
 *
 * Every id is fixed (src/lib/api-catalog/clinical-fixture.ts). Re-run safe:
 * rows are written by their id or unique key; the duties and the entries'
 * states are the fixture's, set on every run.
 */
import type { PrismaClient } from "@prisma/client";
import { CLINICAL_FIXTURE as F } from "../src/lib/api-catalog/clinical-fixture";
import { classCode, schoolCode } from "../src/lib/codes";

const DAY = 86_400_000;
/** A day in India, `offsetDays` from today. */
function ist(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}
const DOMAIN = "zz.test";
export const CLINICAL_COLLEGE_SLUG = "zz-dhanvantari-college";

type Person = { email: string; name: string; birthdate: string; title?: string };

export async function buildClinical(db: PrismaClient, passwordHash: string): Promise<{ students: number; postings: number; entries: number } | null> {
  const name = "ZZ Dhanvantari Nursing College";
  const existing = await db.school.findUnique({ where: { slug: CLINICAL_COLLEGE_SLUG }, select: { id: true } });
  const college =
    existing ??
    (await db.school.create({
      data: {
        id: F.college,
        name,
        slug: CLINICAL_COLLEGE_SLUG,
        kind: "COLLEGE",
        isTestFixture: true,
        code: schoolCode("Dhanvantari Nursing College"),
        city: "Pune",
        country: "India",
        region: "Maharashtra",
        contactEmail: `office.${CLINICAL_COLLEGE_SLUG}@${DOMAIN}`,
        timezone: "Asia/Kolkata",
        brandPrimary: "#be123c",
        verifiedAt: new Date(),
        affiliatingUniversity: "Maharashtra University of Health Sciences, Nashik",
        aisheCode: "C-99003",
        naacGrade: "B++",
        nirfCategory: "COLLEGE",
        streamsJson: JSON.stringify(["HEALTH_SCIENCES"]),
      },
      select: { id: true },
    }));
  const s = college.id;
  await db.school.update({ where: { id: s }, data: { kind: "COLLEGE", isTestFixture: true, streamsJson: JSON.stringify(["HEALTH_SCIENCES"]) } });
  await db.schoolModule.createMany({ data: ["ALUMNI", "ACADEMICS", "PLACEMENT"].map((module) => ({ schoolId: s, module })), skipDuplicates: true });

  const person = async (p: Person, role: string, extra: Record<string, unknown> = {}) => {
    const user = await db.user.upsert({
      where: { email: p.email },
      update: { isTestFixture: true },
      create: { email: p.email, name: p.name, isTestFixture: true, passwordHash, emailVerifiedAt: new Date(), isMinor: false, birthdate: new Date(`${p.birthdate}T00:00:00Z`), prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }) },
      select: { id: true },
    });
    const m = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: user.id, schoolId: s, role } }, select: { id: true } });
    const membership = m ?? (await db.membership.create({ data: { userId: user.id, schoolId: s, role, status: "ACTIVE", ...extra }, select: { id: true } }));
    return { id: membership.id, userId: user.id };
  };
  await person({ email: `zz.cadmin.d@${DOMAIN}`, name: "ZZ Rajani Bhosale", birthdate: "1978-05-12" }, "ADMIN", { title: "Registrar" });
  await person({ email: `zz.cprincipal.d@${DOMAIN}`, name: "ZZ Dr Varsha Nikam", birthdate: "1970-01-30" }, "PRINCIPAL", { title: "Principal" });
  const coordinator = await person({ email: `zz.faculty.d1@${DOMAIN}`, name: "ZZ Prof Sujata Pawar", birthdate: "1984-08-19" }, "FACULTY", { title: "Associate professor, Medical-surgical nursing" });
  const supervisor = await person({ email: `zz.faculty.d2@${DOMAIN}`, name: "ZZ Prof Nilesh Shinde", birthdate: "1988-11-02" }, "FACULTY", { title: "Assistant professor, Nursing foundations" });
  const hod = await person({ email: `zz.hod.d1@${DOMAIN}`, name: "ZZ Dr Kavita More", birthdate: "1975-03-08" }, "HOD", { title: "Head, Department of Nursing" });
  // The duties are the fixture's, set on every run: the coordinator holds the desk; the supervisor and the head hold none.
  await db.membership.update({ where: { id: coordinator.id }, data: { dutiesJson: JSON.stringify(["CLINICAL_COORDINATOR"]) } });
  await db.membership.updateMany({ where: { schoolId: s, id: { not: coordinator.id }, dutiesJson: { not: "[]" } }, data: { dutiesJson: "[]" } });

  const students: { id: string; userId: string }[] = [];
  for (const [n, nm, birth] of [[1, "ZZ Pooja Raut", "2005-04-14"], [2, "ZZ Sakshi Jagtap", "2005-09-23"], [3, "ZZ Aniket Dhole", "2004-12-05"]] as const) {
    students.push(await person({ email: `zz.cstudent.d${n}@${DOMAIN}`, name: nm, birthdate: birth }, "STUDENT", { gradeLevel: "SY" }));
  }

  // The nursing department, the programme and its scheme, the division and the seats.
  await db.department.upsert({ where: { id: F.department }, create: { id: F.department, schoolId: s, code: "NUR", name: "ZZ Nursing", hodMembershipId: hod.id }, update: { hodMembershipId: hod.id } });
  await db.programme.upsert({ where: { id: F.programme }, create: { id: F.programme, schoolId: s, departmentId: F.department, code: "BSCN", name: "ZZ B.Sc. Nursing", level: "UG", durationYears: 4, intake: 60, regulator: "INC", stream: "HEALTH_SCIENCES", attendanceThreshold: 80 }, update: { stream: "HEALTH_SCIENCES", regulator: "INC" } });
  // Its pass rules saved (TA-070, the owner's choice): a scheme without them locks no internals and runs no results.
  const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 160, internalMax: 40, externalMax: 60, minTermCredits: 16, maxTermCredits: 26 };
  await db.scheme.upsert({ where: { id: F.scheme }, create: { id: F.scheme, schoolId: s, programmeId: F.programme, name: "ZZ B.Sc. Nursing 2024", effectiveYear: 2024, passingRules: JSON.stringify(RULES) }, update: { passingRules: JSON.stringify(RULES) } });
  let division = await db.division.findUnique({ where: { id: F.division }, select: { classId: true } });
  if (!division) {
    const klass = await db.class.create({ data: { schoolId: s, name: "ZZ SY BSc Nursing A", gradeLevel: "2", subject: "BSCN", joinCode: classCode() }, select: { id: true } });
    await db.division.create({ data: { id: F.division, schoolId: s, classId: klass.id, programmeId: F.programme, yearOfStudy: 2, academicYear: "2026–27" } });
    division = { classId: klass.id };
  }
  for (const [i, st] of students.entries()) {
    const seat = { programmeId: F.programme, schemeId: F.scheme, entryYear: 2025, yearOfStudy: 2, semester: 3, divisionId: F.division, prn: `ZZD2025${String(i + 1).padStart(3, "0")}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...seat }, update: seat });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: division.classId, studentMembershipId: st.id } }, create: { schoolId: s, classId: division.classId, studentMembershipId: st.id, rollNumber: i + 1 }, update: { status: "ACTIVE", removedAt: null, rollNumber: i + 1 } });
  }

  // The hospital with its two wards, and the rotation of two postings.
  const agreement = { agreementFromKey: ist(-120), agreementToKey: ist(245) };
  await db.clinicalSite.upsert({ where: { id: F.site(1) }, create: { id: F.site(1), schoolId: s, name: "ZZ Civil Hospital, Pune", kind: "HOSPITAL", address: "ZZ Station Road, Pune", contactRole: "MEDICAL_SUPERINTENDENT", ...agreement }, update: { archivedAt: null, ...agreement } });
  for (const [n, wname, beds] of [[1, "ZZ Medical ward", 40], [2, "ZZ Surgical ward", 30]] as const) {
    await db.clinicalDepartment.upsert({ where: { id: F.ward(n) }, create: { id: F.ward(n), schoolId: s, siteId: F.site(1), name: wname, beds }, update: { beds } });
  }
  const postings: [number, number, string, string, string][] = [
    [1, 1, ist(-20), ist(8), supervisor.id],
    [2, 2, ist(9), ist(37), coordinator.id],
  ];
  for (const [n, ward, from, to, by] of postings) {
    const data = { siteId: F.site(1), departmentId: F.ward(ward), divisionId: F.division, labBatchId: null, supervisorMembershipId: by, fromKey: from, toKey: to, rotationOrder: n };
    await db.clinicalPosting.upsert({ where: { id: F.posting(n) }, create: { id: F.posting(n), schoolId: s, createdByUserId: coordinator.userId, ...data }, update: data });
  }

  // One entry in each state, all of rotation 1: d1 SIGNED by the supervisor and RETURNED, d2 SUBMITTED, d3 DRAFT.
  const signedAt = new Date(Date.now() - 3 * DAY);
  const entries: [number, number, string, string, number, string, string, Record<string, unknown>][] = [
    [1, 0, ist(-12), "CASE", 2, "ZZ Two admissions with fever; vitals charted four-hourly.", "SIGNED", { submittedAt: new Date(Date.now() - 4 * DAY), signedAt, signedByMembershipId: supervisor.id, remark: "ZZ Good charting." }],
    [2, 0, ist(-6), "PROCEDURE", 1, "ZZ Assisted an intravenous cannulation.", "RETURNED", { submittedAt: new Date(Date.now() - 2 * DAY), signedAt: null, signedByMembershipId: supervisor.id, remark: "ZZ Say which site and what you checked first." }],
    [3, 1, ist(-5), "SKILL", 3, "ZZ Three bed baths given under supervision.", "SUBMITTED", { submittedAt: new Date(Date.now() - 1 * DAY), signedAt: null, signedByMembershipId: null, remark: "" }],
    [4, 2, ist(-1), "CASE", 1, "ZZ Observed a ward round on the male medical side.", "DRAFT", { submittedAt: null, signedAt: null, signedByMembershipId: null, remark: "" }],
  ];
  for (const [n, who, on, kind, count, note, state, rest] of entries) {
    const st = students[who]!;
    const data = { postingId: F.posting(1), onKey: on, kind, count, note, state, ...rest };
    await db.logbookEntry.upsert({ where: { id: F.entry(n) }, create: { id: F.entry(n), schoolId: s, studentMembershipId: st.id, clientId: `zz-fixture-entry-${n}`, ...data }, update: data });
  }
  return { students: students.length, postings: postings.length, entries: entries.length };
}
