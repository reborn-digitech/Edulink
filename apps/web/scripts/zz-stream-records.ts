/**
 * THE STREAM RECORDS' ZZ FIXTURE (5 October 2026), run by `npm run zz:fixtures`
 * after the colleges, their academics, exams, placement, IQAC and streams.
 *
 *   ZZ Vidya College (arts, science, commerce):
 *     - its division "ZZ FY BSc Physics A" as one lab batch A (zz.cstudent01–03);
 *     - PHY101's experiment 1 recorded for the three, the first signed by zz.faculty01;
 *     - the NSS unit: zz.cstudent01–03 enrolled, one activity this year (zz.cstudent01 and 02, six hours);
 *     - a beaker kept in "ZZ Physics Lab" (a purchase of twenty, through a movement, so the stock and its
 *       movements agree for data:audit), for the lab in-charge's desk;
 *     - a flying-squad visit by zz.faculty01 to this session's PHY101 paper's hall;
 *     - zz.faculty01's duties widened to LAB_INCHARGE, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD,
 *       RESEARCH_DEAN and EXAM_SQUAD (every duty Vidya's streams offer), so the sweep's FACULTY opens every
 *       desk and its HOD (zz.hod01, none) is refused each.
 *   ZZ Shastri Autonomous College (engineering): a department, a BTech programme with stream ENGINEERING,
 *     a scheme, two semester-1 courses with practicals offered in the Shastri term by zz.faculty.s1 (the
 *     lab in-charge), a LAB room, the division "ZZ FY BTech ME A" with zz.cstudent.s1 and two new students
 *     zz.cstudent.s2 and .s3 (no password: sign in with a minted session), two lab batches A (2) and B (1),
 *     and experiment 1 of ME101 recorded for each of the three (the first signed).
 *
 * Every id is fixed (src/lib/api-catalog/stream-records-fixture.ts). Re-run safe: rows are written by their
 * id or unique key and nothing outside these rows is changed, but zz.faculty01's duties.
 */
import type { PrismaClient } from "@prisma/client";
import { DUTIES } from "@edulink/contracts";
import { ACADEMICS_FIXTURE as A } from "../src/lib/api-catalog/academics-fixture";
import { EXAMS_FIXTURE as E } from "../src/lib/api-catalog/exams-fixture";
import { STREAM_RECORDS_FIXTURE as F } from "../src/lib/api-catalog/stream-records-fixture";
import { classCode } from "../src/lib/codes";

const DAY = 86_400_000;
/** A day in India, `offsetDays` from today. */
function ist(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}
const DOMAIN = "zz.test";

export async function buildStreamRecords(db: PrismaClient): Promise<{ vidyaRecords: number; shastriBatches: number; shastriRecords: number; nssEnrolled: number } | null> {
  const [vidya, shastri] = await Promise.all([
    db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } }),
    db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } }),
  ]);
  if (!vidya || !shastri) return null;
  const v = vidya.id;
  const at = async (schoolId: string, email: string, role: string) => db.membership.findFirst({ where: { schoolId, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true } });

  /* ------------------------------------------------------------- Vidya */
  const [f1, admin, ...students] = await Promise.all([
    at(v, `zz.faculty01@${DOMAIN}`, "FACULTY"),
    at(v, `zz.cadmin@${DOMAIN}`, "ADMIN"),
    at(v, `zz.cstudent01@${DOMAIN}`, "STUDENT"),
    at(v, `zz.cstudent02@${DOMAIN}`, "STUDENT"),
    at(v, `zz.cstudent03@${DOMAIN}`, "STUDENT"),
  ]);
  const division = await db.division.findUnique({ where: { id: A.division(1) }, select: { id: true } });
  if (!f1 || !admin || students.some((s) => !s) || !division) return null;
  const st = students as { id: string; userId: string }[];

  await db.membership.update({ where: { id: f1.id }, data: { dutiesJson: JSON.stringify(DUTIES.filter((d) => ["LAB_INCHARGE", "NSS_OFFICER", "NCC_OFFICER", "ANTI_RAGGING_SQUAD", "RESEARCH_DEAN", "EXAM_SQUAD"].includes(d))) } });

  await db.labBatch.upsert({ where: { id: F.vidyaBatch(1) }, create: { id: F.vidyaBatch(1), schoolId: v, divisionId: division.id, name: "A", capacity: 20 }, update: { name: "A", capacity: 20 } });
  // The fixture's batch holds from the start (fromKey ""); a dated row the office's re-split left is the fixture's to clear.
  await db.labBatchMember.deleteMany({ where: { divisionId: division.id, studentMembershipId: { in: st.map((s) => s.id) }, fromKey: { not: "" } } });
  for (const s of st) await db.labBatchMember.upsert({ where: { divisionId_studentMembershipId_fromKey: { divisionId: division.id, studentMembershipId: s.id, fromKey: "" } }, create: { schoolId: v, batchId: F.vidyaBatch(1), divisionId: division.id, studentMembershipId: s.id }, update: { batchId: F.vidyaBatch(1), untilKey: null } });

  const marks = [8, 7, 9];
  for (const [i, s] of st.entries()) {
    const signed = i === 0 ? { signedByMembershipId: f1.id, signedAt: new Date(Date.now() - 5 * DAY) } : { signedByMembershipId: null, signedAt: null };
    await db.practicalRecord.upsert({ where: { id: F.vidyaPractical(i + 1) }, create: { id: F.vidyaPractical(i + 1), schoolId: v, offeringId: A.offering(1), studentMembershipId: s.id, experimentNo: 1, title: "ZZ Vernier callipers and the screw gauge", performedOn: ist(-20), marks: marks[i]!, createdByUserId: f1.userId, ...signed }, update: { performedOn: ist(-20), marks: marks[i]!, ...signed } });
  }

  for (const s of st) await db.corpsEnrolment.upsert({ where: { corps_studentMembershipId: { corps: "NSS", studentMembershipId: s.id } }, create: { schoolId: v, corps: "NSS", studentMembershipId: s.id, unit: "ZZ Unit 1", enrolledOn: ist(-60), createdByUserId: f1.userId }, update: { leftOn: null } });
  await db.activity.upsert({ where: { id: F.nssActivity(1) }, create: { id: F.nssActivity(1), schoolId: v, kind: "NSS", title: "ZZ Tree plantation drive", at: ist(-10), participants: 2, participantIdsJson: JSON.stringify([st[0]!.id, st[1]!.id]), hours: 6, camp: false, createdByUserId: f1.userId }, update: { at: ist(-10), participants: 2, participantIdsJson: JSON.stringify([st[0]!.id, st[1]!.id]), hours: 6 } });

  // A beaker in the physics lab: the stock and its one movement written together, as inventory.ts's one writer would.
  if (await db.schoolModule.findFirst({ where: { schoolId: v, module: "INVENTORY" }, select: { id: true } })) {
    const lab = await db.room.findUnique({ where: { id: A.room(2) }, select: { name: true } });
    if (lab) {
      const item = await db.inventoryItem.upsert({ where: { schoolId_code: { schoolId: v, code: "ZZ-BEAKER-250" } }, create: { schoolId: v, code: "ZZ-BEAKER-250", name: "ZZ Beaker 250 ml", unit: "piece", kind: "CONSUMABLE" }, update: {}, select: { id: true } });
      const moved = await db.stockMovement.count({ where: { itemId: item.id } });
      if (moved === 0) {
        await db.stockMovement.create({ data: { schoolId: v, itemId: item.id, kind: "PURCHASE", delta: 20, location: lab.name, note: "ZZ fixture", byUserId: admin.userId } });
        await db.inventoryStock.upsert({ where: { itemId_location: { itemId: item.id, location: lab.name } }, create: { schoolId: v, itemId: item.id, location: lab.name, quantity: 20 }, update: { quantity: 20 } });
      }
    }
  }

  const paper = await db.examSchedule.findUnique({ where: { id: E.schedule(3) }, select: { id: true } });
  if (paper) await db.examSquadVisit.upsert({ where: { id: F.squadVisit(1) }, create: { id: F.squadVisit(1), schoolId: v, scheduleId: paper.id, examRoomId: E.room(3), at: new Date(Date.now() - 2 * DAY), byMembershipId: f1.id, members: "ZZ Dr Neha Kulkarni, ZZ Prof. Amit Joshi", flagged: false, note: "ZZ All candidates seated; no material found." }, update: {} });

  /* ----------------------------------------------------------- Shastri */
  const t = shastri.id;
  const X = F.shastri;
  const [sFaculty, sAdmin, s1] = await Promise.all([at(t, `zz.faculty.s1@${DOMAIN}`, "FACULTY"), at(t, `zz.cadmin.s@${DOMAIN}`, "ADMIN"), at(t, `zz.cstudent.s1@${DOMAIN}`, "STUDENT")]);
  const vidyaScheme = await db.scheme.findUnique({ where: { id: A.scheme(1) }, select: { gradingTable: true, passingRules: true } });
  const term = await db.academicTerm.findUnique({ where: { id: E.shastriTerm }, select: { id: true } });
  if (!sFaculty || !sAdmin || !s1 || !vidyaScheme || !term) return { vidyaRecords: st.length, shastriBatches: 0, shastriRecords: 0, nssEnrolled: st.length };
  // Two more students, with no password (they sign in through a minted session).
  const more: { id: string }[] = [];
  for (const [n, name] of [[2, "ZZ Omkar Pawar"], [3, "ZZ Sneha Kadam"]] as const) {
    const user = await db.user.upsert({ where: { email: `zz.cstudent.s${n}@${DOMAIN}` }, create: { email: `zz.cstudent.s${n}@${DOMAIN}`, name, isTestFixture: true, emailVerifiedAt: new Date(), isMinor: false, birthdate: new Date(`2007-0${n}-1${n}T00:00:00Z`) }, update: { isTestFixture: true }, select: { id: true } });
    const m = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: user.id, schoolId: t, role: "STUDENT" } }, select: { id: true } });
    more.push(m ?? (await db.membership.create({ data: { userId: user.id, schoolId: t, role: "STUDENT", status: "ACTIVE", gradeLevel: "12" }, select: { id: true } })));
  }
  const people = [s1, ...more];

  await db.department.upsert({ where: { id: X.department }, create: { id: X.department, schoolId: t, code: "MECH", name: "ZZ Mechanical Engineering" }, update: {} });
  await db.programme.upsert({ where: { id: X.programme }, create: { id: X.programme, schoolId: t, departmentId: X.department, code: "BTECHME", name: "ZZ BTech Mechanical", level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING", attendanceThreshold: 75 }, update: { stream: "ENGINEERING", regulator: "AICTE" } });
  await db.scheme.upsert({ where: { id: X.scheme }, create: { id: X.scheme, schoolId: t, programmeId: X.programme, name: "ZZ Shastri BTech 2025", effectiveYear: 2025, gradingTable: vidyaScheme.gradingTable, passingRules: vidyaScheme.passingRules }, update: {} });
  const courses: [number, string, string, number, number, number][] = [
    [1, "ME101", "ZZ Engineering Mechanics", 3, 1, 1],
    [2, "ME103", "ZZ Workshop Practice", 0, 0, 2],
  ];
  for (const [n, code, name, l, tt, p] of courses) await db.course.upsert({ where: { id: X.course(n) }, create: { id: X.course(n), schoolId: t, schemeId: X.scheme, code, name, semester: 1, creditsL: l, creditsT: tt, creditsP: p, kind: "CORE" }, update: { creditsP: p } });
  await db.room.upsert({ where: { id: X.room }, create: { id: X.room, schoolId: t, name: "ZZ Workshop Lab", capacity: 30, kind: "LAB" }, update: { kind: "LAB" } });

  let sDivision = await db.division.findUnique({ where: { id: X.division }, select: { classId: true } });
  if (!sDivision) {
    const klass = await db.class.create({ data: { schoolId: t, name: "ZZ FY BTech ME A", gradeLevel: "1", subject: "BTECHME", joinCode: classCode() }, select: { id: true } });
    await db.division.create({ data: { id: X.division, schoolId: t, classId: klass.id, programmeId: X.programme, yearOfStudy: 1, academicYear: "2026–27" } });
    sDivision = { classId: klass.id };
  }
  for (const [i, p] of people.entries()) {
    const seat = { programmeId: X.programme, schemeId: X.scheme, entryYear: 2026, yearOfStudy: 1, semester: 1, divisionId: X.division, prn: `ZZS2026${String(i + 1).padStart(3, "0")}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: p.id }, create: { schoolId: t, studentMembershipId: p.id, ...seat }, update: seat });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: sDivision.classId, studentMembershipId: p.id } }, create: { schoolId: t, classId: sDivision.classId, studentMembershipId: p.id, rollNumber: i + 1 }, update: { status: "ACTIVE", removedAt: null, rollNumber: i + 1 } });
  }
  for (const [n] of courses) {
    const data = { termId: term.id, courseId: X.course(n), divisionId: X.division, facultyMembershipId: sFaculty.id, lectureHours: n === 1 ? 3 : 0, tutorialHours: n === 1 ? 1 : 0, practicalHours: n === 1 ? 2 : 4, roomId: n === 2 ? X.room : null };
    await db.courseOffering.upsert({ where: { id: X.offering(n) }, create: { id: X.offering(n), schoolId: t, ...data }, update: data });
    for (const p of people) await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: X.offering(n), studentMembershipId: p.id } }, create: { schoolId: t, studentMembershipId: p.id, offeringId: X.offering(n), termId: term.id, kind: "CORE", byUserId: sAdmin.userId }, update: { status: "REGISTERED" } });
  }
  // Batches A (the first two by roll) and B (the third): the office's even split at a size of two.
  for (const [n, name, of] of [[1, "A", people.slice(0, 2)], [2, "B", people.slice(2)]] as const) {
    await db.labBatch.upsert({ where: { id: X.batch(n) }, create: { id: X.batch(n), schoolId: t, divisionId: X.division, name, capacity: 2 }, update: { name, capacity: 2 } });
    await db.labBatchMember.deleteMany({ where: { divisionId: X.division, studentMembershipId: { in: of.map((p) => p.id) }, fromKey: { not: "" } } });
    for (const p of of) await db.labBatchMember.upsert({ where: { divisionId_studentMembershipId_fromKey: { divisionId: X.division, studentMembershipId: p.id, fromKey: "" } }, create: { schoolId: t, batchId: X.batch(n), divisionId: X.division, studentMembershipId: p.id }, update: { batchId: X.batch(n), untilKey: null } });
  }
  const sMarks = [9, 8, 7];
  for (const [i, p] of people.entries()) {
    const signed = i === 0 ? { signedByMembershipId: sFaculty.id, signedAt: new Date(Date.now() - 3 * DAY) } : { signedByMembershipId: null, signedAt: null };
    await db.practicalRecord.upsert({ where: { id: X.practical(i + 1) }, create: { id: X.practical(i + 1), schoolId: t, offeringId: X.offering(1), studentMembershipId: p.id, experimentNo: 1, title: "ZZ Verification of Lami's theorem", performedOn: ist(-12), marks: sMarks[i]!, createdByUserId: sFaculty.userId, ...signed }, update: { performedOn: ist(-12), marks: sMarks[i]!, ...signed } });
  }
  return { vidyaRecords: st.length, shastriBatches: 2, shastriRecords: people.length, nssEnrolled: st.length };
}
