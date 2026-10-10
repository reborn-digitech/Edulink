/**
 * THE STUDIO DESK'S ZZ FIXTURE (R-56, the studio half, 10 October 2026), run by
 * `npm run zz:fixtures` after the stream records' builder (which sets
 * zz.faculty01's duties; this widens them).
 *
 *   ZZ Vidya College gains the ARCHITECTURE stream beside arts, science and
 *   commerce (so the duty is offered and the sweep's FACULTY, zz.faculty01,
 *   opens the desk), a department "ZZ Architecture" with the programme ZZ BArch
 *   (stream ARCHITECTURE, regulator COA), its scheme and the course AR101
 *   "ZZ Architectural Design I", offered in this term by zz.faculty01 as a
 *   shared offering (no division) with zz.cstudent01–03 registered; then
 *     - one studio on it with its four stage days (the brief 40 days back, the
 *       pin-up 20 back, the final 10 ahead, the jury 14 ahead), coordinator
 *       zz.faculty01 (duty STUDIO_COORDINATOR added);
 *     - the interim jury 18 days back, chaired by zz.faculty01 with zz.faculty02
 *       and zz.hod01 on the panel and one external juror by role and
 *       institution, SIGNED, with marks for the three (72, 65.5 and 81 of 100);
 *     - the final jury 14 days ahead, chaired by zz.faculty02, unsigned;
 *     - zz.cstudent01's pin-up SUBMITTED, 02's LATE, 03's final as a DRAFT.
 *
 * Every id is fixed (src/lib/api-catalog/studio-fixture.ts). Re-run safe: rows
 * are written by their id or unique key and nothing outside them is changed
 * but Vidya's streams (widened, never narrowed) and zz.faculty01's duties.
 */
import type { PrismaClient } from "@prisma/client";
import { DUTIES } from "@edulink/contracts";
import { ACADEMICS_FIXTURE as A } from "../src/lib/api-catalog/academics-fixture";
import { STUDIO_FIXTURE as F } from "../src/lib/api-catalog/studio-fixture";

const DAY = 86_400_000;
/** A day in India, `offsetDays` from today. */
function ist(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}
const DOMAIN = "zz.test";

export async function buildStudioFixtures(db: PrismaClient): Promise<{ studios: number; juries: number; signed: number; submissions: number } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, streamsJson: true } });
  if (!vidya) return null;
  const v = vidya.id;
  const at = async (email: string, role: string) => db.membership.findFirst({ where: { schoolId: v, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true, dutiesJson: true } });
  const [f1, f2, hod, admin, ...students] = await Promise.all([at(`zz.faculty01@${DOMAIN}`, "FACULTY"), at(`zz.faculty02@${DOMAIN}`, "FACULTY"), at(`zz.hod01@${DOMAIN}`, "HOD"), at(`zz.cadmin@${DOMAIN}`, "ADMIN"), at(`zz.cstudent01@${DOMAIN}`, "STUDENT"), at(`zz.cstudent02@${DOMAIN}`, "STUDENT"), at(`zz.cstudent03@${DOMAIN}`, "STUDENT")]);
  const [term, vidyaScheme] = await Promise.all([db.academicTerm.findUnique({ where: { id: A.term }, select: { id: true } }), db.scheme.findUnique({ where: { id: A.scheme(1) }, select: { gradingTable: true, passingRules: true } })]);
  if (!f1 || !f2 || !hod || !admin || students.some((s) => !s) || !term || !vidyaScheme) return null;
  const st = students as { id: string; userId: string }[];

  // The stream, widened: ARCHITECTURE beside what zz-college.ts set.
  let streams: string[] = [];
  try {
    streams = JSON.parse(vidya.streamsJson ?? "[]") as string[];
  } catch {
    streams = [];
  }
  if (!streams.includes("ARCHITECTURE")) await db.school.update({ where: { id: v }, data: { streamsJson: JSON.stringify([...streams, "ARCHITECTURE"]) } });
  // The duty, added to the ones the stream records' builder set.
  const held = new Set<string>(JSON.parse(f1.dutiesJson || "[]") as string[]);
  held.add("STUDIO_COORDINATOR");
  await db.membership.update({ where: { id: f1.id }, data: { dutiesJson: JSON.stringify(DUTIES.filter((d) => held.has(d))) } });

  await db.department.upsert({ where: { id: F.department }, create: { id: F.department, schoolId: v, code: "ARCH", name: "ZZ Architecture" }, update: {} });
  await db.programme.upsert({ where: { id: F.programme }, create: { id: F.programme, schoolId: v, departmentId: F.department, code: "BARCH", name: "ZZ BArch", level: "UG", durationYears: 5, intake: 40, regulator: "COA", stream: "ARCHITECTURE", attendanceThreshold: 75 }, update: { stream: "ARCHITECTURE", regulator: "COA" } });
  await db.scheme.upsert({ where: { id: F.scheme }, create: { id: F.scheme, schoolId: v, programmeId: F.programme, name: "ZZ BArch 2025", effectiveYear: 2025, gradingTable: vidyaScheme.gradingTable, passingRules: vidyaScheme.passingRules }, update: {} });
  await db.course.upsert({ where: { id: F.course }, create: { id: F.course, schoolId: v, schemeId: F.scheme, code: "AR101", name: "ZZ Architectural Design I", semester: 1, creditsL: 2, creditsT: 0, creditsP: 3, kind: "CORE" }, update: {} });
  const offering = { termId: term.id, courseId: F.course, divisionId: null, facultyMembershipId: f1.id, lectureHours: 2, tutorialHours: 0, practicalHours: 6 };
  await db.courseOffering.upsert({ where: { id: F.offering }, create: { id: F.offering, schoolId: v, ...offering }, update: offering });
  for (const s of st) await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: F.offering, studentMembershipId: s.id } }, create: { schoolId: v, studentMembershipId: s.id, offeringId: F.offering, termId: term.id, kind: "CORE", byUserId: admin.userId }, update: { status: "REGISTERED" } });

  const studio = { offeringId: F.offering, termId: term.id, title: "ZZ Design Studio I: a reading room for the campus", brief: "ZZ A reading room of 120 seats on the north lawn: site study, two schemes at the interim pin-up, one developed scheme with sections and a model at the final.", maxMarks: 100, coordinatorMembershipId: f1.id, briefIssuedOn: ist(-40), interimOn: ist(-20), finalOn: ist(10), juryOn: ist(14) };
  await db.studio.upsert({ where: { id: F.studio(1) }, create: { id: F.studio(1), schoolId: v, createdByUserId: f1.userId, ...studio }, update: studio });

  const jury1 = { on: ist(-18), title: "ZZ Interim jury", panelJson: JSON.stringify([f1.id, f2.id, hod.id]), chairMembershipId: f1.id, externalJson: JSON.stringify([{ role: "PRACTISING_ARCHITECT", institution: "ZZ Vastu Studio LLP" }]), signedByMembershipId: f1.id, signedAt: new Date(Date.now() - 17 * DAY) };
  await db.studioJury.upsert({ where: { id: F.jury(1) }, create: { id: F.jury(1), schoolId: v, studioId: F.studio(1), createdByUserId: f1.userId, ...jury1 }, update: jury1 });
  const marks = [720, 655, 810];
  const remarks = ["ZZ Clear site reading; the section needs daylight studies.", "ZZ Two schemes, both under-resolved at the entrance.", "ZZ A strong parti; carry the model's scale into the drawings."];
  for (const [i, s] of st.entries()) {
    const mark = { marksTenths: marks[i]!, remark: remarks[i]!, markedByMembershipId: f2.id, markedAt: new Date(Date.now() - 18 * DAY) };
    await db.studioJuryMark.upsert({ where: { id: F.mark(i + 1) }, create: { id: F.mark(i + 1), schoolId: v, juryId: F.jury(1), studentMembershipId: s.id, ...mark }, update: mark });
  }
  const jury2 = { on: ist(14), title: "ZZ Final jury", panelJson: JSON.stringify([f1.id, f2.id]), chairMembershipId: f2.id, externalJson: JSON.stringify([{ role: "ACADEMIC", institution: "ZZ School of Planning" }]), signedByMembershipId: null, signedAt: null };
  await db.studioJury.upsert({ where: { id: F.jury(2) }, create: { id: F.jury(2), schoolId: v, studioId: F.studio(1), createdByUserId: f1.userId, ...jury2 }, update: jury2 });
  // A re-run leaves the final jury unsigned and unmarked, as the fixture says.
  await db.studioJuryMark.deleteMany({ where: { juryId: F.jury(2) } });

  const subs: [number, string, string, string, Date | null][] = [
    [1, "INTERIM_PINUP", "SUBMITTED", "ZZ Site study and two schemes, pinned up.", new Date(Date.now() - 21 * DAY)],
    [2, "INTERIM_PINUP", "LATE", "ZZ Two schemes; the sections follow.", new Date(Date.now() - 19 * DAY)],
    [3, "FINAL_SUBMISSION", "DRAFT", "ZZ Developed scheme in progress.", null],
  ];
  for (const [n, stage, state, note, submittedAt] of subs) {
    const row = { stage, state, note, submittedAt };
    await db.studioSubmission.upsert({ where: { id: F.submission(n) }, create: { id: F.submission(n), schoolId: v, studioId: F.studio(1), studentMembershipId: st[n - 1]!.id, ...row }, update: row });
  }
  return { studios: 1, juries: 2, signed: 1, submissions: subs.length };
}
