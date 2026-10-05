/**
 * Stream records and the duties' desks (the owner's decision of 5 October
 * 2026; S2's commits 3 and 4).
 *
 * Two ZZ colleges of this suite's own, made through the operator's
 * createSchool and removed after: a law-and-engineering college (A) and an
 * education-and-management college (B), each with an office, teachers,
 * students and the desks' people. What is proved, each against a hand
 * computation:
 *   - lab batches: an even split by roll number, a re-split that keeps the
 *     names, a move; refused at a college whose streams keep no labs;
 *   - a LAB hour for one batch: two batches of one division in two labs at
 *     one hour do not clash, the day's lecture carries the batch, its roster
 *     is the batch's and a mark for another student is refused;
 *   - the practical record: the teacher writes, another teacher is refused,
 *     a lab in-charge signs, a signed row is not rewritten; the summary;
 *   - moot courts and law internships (BCI's 20 and 12 weeks), the kinds a
 *     college's streams offer, a law internship after semester 8;
 *   - a management student's SUMMER internship's credits reach the exam
 *     cell's credit push through internshipCreditsForTerm;
 *   - teaching practice (NCTE's 20 weeks), NSS hours, the research dean's
 *     read, the flying squad's visit and its notice, a lab breakage written
 *     off the stock;
 *   - every desk's door opens to a FACULTY or HOD only with its duty — at the
 *     gate, in `permits` and in the handler — and each write is audited with
 *     a label.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { academicYearOf, bciMinimumWeeks, labDeskSchema, NCTE_MIN_PRACTICE_WEEKS, practicalSheetSchema, weeksBetween } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { endpointFor, gateRequest, modulePagePermitted } from "@/lib/role-gate";
import { permits } from "@/lib/api-catalog/types";
import { ENDPOINTS } from "@/lib/api-catalog";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { enabledModules } from "@/lib/modules";
import { actionKey } from "@/lib/safety-labels";
import { todayKey, addDaysToKey, weekdayOfKey } from "@/lib/dates";
import { closedOn } from "@/lib/holidays";
import { classCode } from "@/lib/codes";
import { ensureLecturesForDay, saveTimetableSlot } from "@/lib/academics";
import { lectureSheet, markLecture } from "@/lib/academics-attendance";
import { evenSplit, labBatches, moveToLabBatch, mootCourts, practicalSheet, saveMootCourt, savePracticals, signPracticals, splitLabBatches, streamRecordsSummary } from "@/lib/stream-records";
import { lawInternshipSummary, nssSummary, practicalRecordSummary, teachingPracticeSummary } from "@/lib/stream-summaries";
import { examSquadDesk, labDesk, recordLabBreakage, recordSquadVisit, researchDesk } from "@/lib/duty-desks";
import { addLessonObservation, savePracticePosting, savePracticeSchool, teachingPracticeDesk } from "@/lib/teaching-practice";
import { addCorpsActivity, corpsDesk, enrolInCorps, leaveCorps } from "@/lib/corps";
import { evaluateInternship, internshipCreditsForTerm, proposeInternship } from "@/lib/placement-internships";
import { recordMovement } from "@/lib/inventory";
import { publishRun } from "@/lib/exam-cell-marks";
import { GET as labGet } from "@/app/api/v1/duties/lab/route";
import { GET as nssGet } from "@/app/api/v1/duties/nss/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-srec-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const BASE = { contactEmail: MAIL("contact"), timezone: TZ };

async function as(who: string, role: string, schoolId: string, route: string | null = null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(ids[who]!, { schoolId, role: role as never });
  // A session the gate refuses (a desk's door without its duty) is no session here; the handler answers it itself.
  return (await getSession().catch(() => null)) as ActiveContext;
}

async function person(schoolId: string, who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ SR ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

/** The most recent day, today or before, on which college A teaches and is open. */
async function teachingDay(schoolId: string): Promise<string> {
  for (let back = 0; back < 14; back += 1) {
    const d = addDaysToKey(TODAY, -back);
    const c = await closedOn(schoolId, d);
    if (c.teachingDay && !c.closed) return d;
  }
  throw new Error("no teaching day in a fortnight");
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ SR Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  for (const [key, name, streams] of [["A", "Law", ["LAW", "ENGINEERING"]], ["B", "Education", ["EDUCATION", "MANAGEMENT"]]] as const) {
    const made = await createSchool(operator(), { ...BASE, name: `ZZ SR ${name} College ${STAMP}`, kind: "COLLEGE", streams: [...streams] });
    if (!made.ok) throw new Error(made.errorKey);
    ids[key] = made.schoolId;
    await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  }
  const A = ids.A!;
  const B = ids.B!;
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["teacher", "FACULTY"], ["lab", "FACULTY"], ["hod", "HOD"], ["tpo", "TPO"], ["ctrl", "EXAM_CONTROLLER"], ["plain", "FACULTY"]] as const) await person(A, who, role);
  for (let n = 1; n <= 7; n += 1) await person(A, `s${n}`, "STUDENT");
  for (const [who, role] of [["bAdmin", "ADMIN"], ["coord", "FACULTY"], ["bTpo", "TPO"], ["bCtrl", "EXAM_CONTROLLER"]] as const) await person(B, who, role);
  for (let n = 1; n <= 3; n += 1) await person(B, `t${n}`, "STUDENT");

  // College A's academics: a BTech division of five on two courses with practicals, two LLBs, a term around today, a bell, two labs.
  ids.dept = (await db.department.create({ data: { schoolId: A, code: "MECH", name: "ZZ SR Mechanical", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  const programme = (code: string, stream: string, years: number, regulator: string) => db.programme.create({ data: { schoolId: A, departmentId: ids.dept!, code, name: `ZZ SR ${code}`, level: "UG", durationYears: years, intake: 60, regulator, stream }, select: { id: true } });
  ids.btech = (await programme("BTECH", "ENGINEERING", 4, "AICTE")).id;
  ids.llb5 = (await programme("BALLB", "LAW", 5, "BCI")).id;
  ids.llb3 = (await programme("LLB", "LAW", 3, "BCI")).id;
  const scheme = (programmeId: string) => db.scheme.create({ data: { schoolId: A, programmeId, name: "ZZ SR scheme", effectiveYear: 2025 }, select: { id: true } });
  ids.scheme = (await scheme(ids.btech!)).id;
  ids.lawScheme = (await scheme(ids.llb5!)).id;
  ids.lawScheme3 = (await scheme(ids.llb3!)).id;
  ids.c1 = (await db.course.create({ data: { schoolId: A, schemeId: ids.scheme!, code: "ME101", name: "ZZ Mechanics", semester: 1, creditsL: 3, creditsP: 1 }, select: { id: true } })).id;
  ids.c2 = (await db.course.create({ data: { schoolId: A, schemeId: ids.scheme!, code: "ME103", name: "ZZ Workshop", semester: 1, creditsP: 2 }, select: { id: true } })).id;
  ids.term = (await db.academicTerm.create({ data: { schoolId: A, name: "ZZ SR term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -50), registrationClosesOn: addDaysToKey(TODAY, -30) }, select: { id: true } })).id;
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: A, name: "ZZ SR bell 1", startMinute: 540, endMinute: 600, kind: "LESSON", position: 1 }, select: { id: true } })).id;
  ids.lab1 = (await db.room.create({ data: { schoolId: A, name: "ZZ SR Lab 1", capacity: 30, kind: "LAB" }, select: { id: true } })).id;
  ids.lab2 = (await db.room.create({ data: { schoolId: A, name: "ZZ SR Lab 2", capacity: 30, kind: "LAB" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: A, name: "ZZ SR FY BTech A", gradeLevel: "1", subject: "BTECH", joinCode: classCode() }, select: { id: true } });
  ids.division = (await db.division.create({ data: { schoolId: A, classId: klass.id, programmeId: ids.btech!, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } })).id;
  for (let n = 1; n <= 5; n += 1) {
    await db.studentProgramme.create({ data: { schoolId: A, studentMembershipId: ids[`s${n}M`]!, programmeId: ids.btech!, schemeId: ids.scheme!, entryYear: 2026, divisionId: ids.division! } });
    await db.enrollment.create({ data: { schoolId: A, classId: klass.id, studentMembershipId: ids[`s${n}M`]!, rollNumber: n } });
  }
  await db.studentProgramme.create({ data: { schoolId: A, studentMembershipId: ids.s6M!, programmeId: ids.llb5!, schemeId: ids.lawScheme!, entryYear: 2024 } });
  await db.studentProgramme.create({ data: { schoolId: A, studentMembershipId: ids.s7M!, programmeId: ids.llb3!, schemeId: ids.lawScheme3!, entryYear: 2025 } });
  ids.o1 = (await db.courseOffering.create({ data: { schoolId: A, termId: ids.term!, courseId: ids.c1!, divisionId: ids.division!, facultyMembershipId: ids.teacherM!, practicalHours: 2 }, select: { id: true } })).id;
  ids.o2 = (await db.courseOffering.create({ data: { schoolId: A, termId: ids.term!, courseId: ids.c2!, divisionId: ids.division!, facultyMembershipId: ids.hodM!, practicalHours: 4 }, select: { id: true } })).id;
  for (const o of [ids.o1!, ids.o2!]) for (let n = 1; n <= 5; n += 1) await db.courseRegistration.create({ data: { schoolId: A, studentMembershipId: ids[`s${n}M`]!, offeringId: o, termId: ids.term!, kind: "CORE" } });

  // College B: a B.Ed. programme for the student teachers and an MBA term for the summer internship.
  ids.bDept = (await db.department.create({ data: { schoolId: B, code: "EDU", name: "ZZ SR Education" }, select: { id: true } })).id;
  ids.bed = (await db.programme.create({ data: { schoolId: B, departmentId: ids.bDept!, code: "BED", name: "ZZ SR BEd", level: "UG", durationYears: 2, intake: 50, regulator: "NCTE", stream: "EDUCATION" }, select: { id: true } })).id;
  ids.bScheme = (await db.scheme.create({ data: { schoolId: B, programmeId: ids.bed!, name: "ZZ SR BEd scheme", effectiveYear: 2025 }, select: { id: true } })).id;
  for (let n = 1; n <= 3; n += 1) await db.studentProgramme.create({ data: { schoolId: B, studentMembershipId: ids[`t${n}M`]!, programmeId: ids.bed!, schemeId: ids.bScheme!, entryYear: 2026 } });
  ids.bTerm = (await db.academicTerm.create({ data: { schoolId: B, name: "ZZ SR B term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -50), registrationClosesOn: addDaysToKey(TODAY, -30) }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.A, ids.B].filter((x): x is string => Boolean(x));
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the duties are given", () => {
  it("within what each college's streams offer", async () => {
    const admin = await as("admin", "ADMIN", ids.A!);
    await setDuties(admin, ids.labM!, ["LAB_INCHARGE", "NSS_OFFICER", "RESEARCH_DEAN", "EXAM_SQUAD"]);
    await expect(setDuties(admin, ids.plainM!, ["PRACTICE_TEACHING_COORDINATOR"])).rejects.toMatchObject({ key: "duties.refuseNotOffered" });
    const bAdmin = await as("bAdmin", "ADMIN", ids.B!);
    await setDuties(bAdmin, ids.coordM!, ["PRACTICE_TEACHING_COORDINATOR"]);
    expect(await enabledModules(ids.A)).toEqual(expect.arrayContaining(["ACADEMICS", "INVENTORY", "IQAC", "EXAMS", "PLACEMENT"]));
  });
});

describe("lab batches", () => {
  it("split a division evenly by roll number, re-split keeping the names, and move a student", async () => {
    expect(evenSplit(5, 2)).toEqual([2, 2, 1]);
    expect(evenSplit(41, 20)).toEqual([14, 14, 13]);
    expect(evenSplit(0, 20)).toEqual([]);
    const admin = await as("admin", "ADMIN", ids.A!);
    const one = await splitLabBatches(admin, { divisionId: ids.division!, size: 5 });
    expect(one.divisions[0]!.batches.map((b) => [b.name, b.members.map((m) => m.rollNumber)])).toEqual([["A", [1, 2, 3, 4, 5]]]);
    // Re-split at three (the library takes any size; the door's schema holds it to 5–60): A keeps its id, B is made.
    const two = await splitLabBatches(admin, { divisionId: ids.division!, size: 3 });
    expect(two.divisions[0]!.batches.map((b) => [b.name, b.capacity, b.members.map((m) => m.rollNumber)])).toEqual([["A", 3, [1, 2, 3]], ["B", 3, [4, 5]]]);
    expect(two.divisions[0]!.batches[0]!.id).toBe(one.divisions[0]!.batches[0]!.id);
    expect(two.divisions[0]!.unbatched).toEqual([]);
    ids.batchA = two.divisions[0]!.batches[0]!.id;
    ids.batchB = two.divisions[0]!.batches[1]!.id;
    const moved = await moveToLabBatch(admin, ids.batchB!, [ids.s3M!]);
    expect(moved.divisions[0]!.batches.map((b) => [b.name, b.members.length])).toEqual([["A", 2], ["B", 3]]);
    await moveToLabBatch(admin, ids.batchA!, [ids.s3M!]);
    expect(await db.auditLog.count({ where: { schoolId: ids.A, action: "streamRecords.labBatches.split" } })).toBe(2);
    expect(await db.auditLog.count({ where: { schoolId: ids.A, action: "streamRecords.labBatches.move" } })).toBe(2);
    await expect(moveToLabBatch(admin, ids.batchB!, [ids.s6M!])).rejects.toMatchObject({ key: "streamRecords.refuseNotInDivision" });
    // The wrong role first, then a college whose streams keep no labs.
    await expect(splitLabBatches(await as("teacher", "FACULTY", ids.A!), { divisionId: ids.division! })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await expect(splitLabBatches(await as("bAdmin", "ADMIN", ids.B!), { divisionId: ids.division! })).rejects.toMatchObject({ key: "streamRecords.refuseNoLabs", status: 409 });
    expect((await labBatches(await as("bAdmin", "ADMIN", ids.B!))).offered).toBe(false);
  });

  it("let a LAB hour be one batch's: no division clash across batches, the lecture's roster and marks are the batch's", async () => {
    const admin = await as("admin", "ADMIN", ids.A!);
    const day = await teachingDay(ids.A!);
    const weekday = weekdayOfKey(day);
    await expect(saveTimetableSlot(admin, { offeringId: ids.o1!, weekday, periodId: ids.period!, kind: "LECTURE", roomId: ids.lab1!, labBatchId: ids.batchA! })).rejects.toMatchObject({ key: "streamRecords.refuseBatch" });
    const a = await saveTimetableSlot(admin, { offeringId: ids.o1!, weekday, periodId: ids.period!, kind: "LAB", roomId: ids.lab1!, labBatchId: ids.batchA! });
    // Batch B in the other lab at the same hour on the other course: a different batch of the same division, no clash.
    await saveTimetableSlot(admin, { offeringId: ids.o2!, weekday, periodId: ids.period!, kind: "LAB", roomId: ids.lab2!, labBatchId: ids.batchB! });
    expect(await db.offeringSlot.findUniqueOrThrow({ where: { id: a.id }, select: { labBatchId: true } })).toEqual({ labBatchId: ids.batchA });
    await ensureLecturesForDay(ids.A!, day);
    const lecture = await db.lecture.findFirstOrThrow({ where: { offeringId: ids.o1!, dateKey: day }, select: { id: true, labBatchId: true } });
    expect(lecture.labBatchId).toBe(ids.batchA);
    const teacher = await as("teacher", "FACULTY", ids.A!);
    const sheet = await lectureSheet(teacher, lecture.id);
    expect(sheet.entries.map((e) => e.rollNumber)).toEqual([1, 2, 3]);
    expect(sheet.lecture.labBatchName).toBe("A");
    expect(sheet.lecture.registered).toBe(3);
    await expect(markLecture(teacher, lecture.id, { clientId: `zz-sr-${STAMP}-1`, entries: [{ studentMembershipId: ids.s4M!, status: "PRESENT" }] })).rejects.toMatchObject({ key: "streamRecords.refuseNotInBatch" });
    const marked = await markLecture(teacher, lecture.id, { clientId: `zz-sr-${STAMP}-2`, entries: [ids.s1M!, ids.s2M!, ids.s3M!].map((s) => ({ studentMembershipId: s, status: "PRESENT" as const })) });
    expect(marked).toMatchObject({ present: 3, absent: 0 });
  });
});

describe("the practical record", () => {
  it("is written by the course's teacher, signed by a lab in-charge, and a signed row stays as signed", async () => {
    const teacher = await as("teacher", "FACULTY", ids.A!);
    const sheet = practicalSheetSchema.parse(await practicalSheet(teacher));
    expect(sheet.offerings.map((o) => [o.offeringId, o.mine])).toEqual(expect.arrayContaining([[ids.o1, true]]));
    expect(sheet.offeringId).toBe(ids.o1);
    expect(sheet.students.map((s) => s.batchName)).toEqual(["A", "A", "A", "B", "B"]);
    expect(sheet.canWrite).toBe(true);
    const day = addDaysToKey(TODAY, -3);
    const entries = [1, 2, 3, 4].map((n) => ({ studentMembershipId: ids[`s${n}M`]!, marks: n === 4 ? null : 6 + n }));
    expect(await savePracticals(teacher, { offeringId: ids.o1!, experimentNo: 1, title: "ZZ Lami's theorem", performedOn: day, entries })).toEqual({ count: 4 });
    await expect(savePracticals(teacher, { offeringId: ids.o1!, experimentNo: 2, title: "ZZ Tomorrow", performedOn: addDaysToKey(TODAY, 1), entries })).rejects.toMatchObject({ key: "streamRecords.refuseFutureDay" });
    await expect(savePracticals(teacher, { offeringId: ids.o1!, experimentNo: 2, title: "ZZ Stranger", performedOn: day, entries: [{ studentMembershipId: ids.s6M!, marks: 5 }] })).rejects.toMatchObject({ key: "streamRecords.refuseNotRegistered" });
    // Another teacher with no duty: neither writes nor signs it.
    const plain = await as("plain", "FACULTY", ids.A!);
    await expect(savePracticals(plain, { offeringId: ids.o1!, experimentNo: 2, title: "ZZ Not mine", performedOn: day, entries })).rejects.toMatchObject({ key: "streamRecords.refuseNotYourOffering" });
    await expect(practicalSheet(plain, { offeringId: ids.o1! })).rejects.toMatchObject({ key: "streamRecords.refuseNotYourOffering" });
    const rows = await db.practicalRecord.findMany({ where: { offeringId: ids.o1! }, select: { id: true, studentMembershipId: true }, orderBy: { studentMembershipId: "asc" } });
    await expect(signPracticals(plain, [rows[0]!.id])).rejects.toMatchObject({ key: "streamRecords.refuseNotYourOffering" });
    // The lab in-charge signs two; a second signature changes nothing.
    const lab = await as("lab", "FACULTY", ids.A!);
    expect((await practicalSheet(lab, { offeringId: ids.o1! })).canSign).toBe(true);
    const s1Row = rows.find((r) => r.studentMembershipId === ids.s1M)!;
    const s2Row = rows.find((r) => r.studentMembershipId === ids.s2M)!;
    expect(await signPracticals(lab, [s1Row.id, s2Row.id])).toEqual({ count: 2 });
    expect(await signPracticals(lab, [s1Row.id])).toEqual({ count: 0 });
    expect((await db.practicalRecord.findUniqueOrThrow({ where: { id: s1Row.id } })).signedByMembershipId).toBe(ids.labM);
    await expect(savePracticals(teacher, { offeringId: ids.o1!, experimentNo: 1, title: "ZZ Rewritten", performedOn: day, entries })).rejects.toMatchObject({ key: "streamRecords.refuseSigned", status: 409 });
    // The year's summary: 4 rows, 2 signed, 4 students, 1 offering, 2 batches of 5.
    const s = await practicalRecordSummary(ids.A!, academicYearOf(day));
    expect(s).toMatchObject({ records: 4, signed: 2, unsigned: 2, students: 4, offerings: 1, batches: 2, batchMembers: 5 });
    expect(s.byCourse).toEqual([{ courseCode: "ME101", courseName: "ZZ Mechanics", records: 4, signed: 2, students: 4 }]);
    expect(await practicalRecordSummary(ids.A!, 1999)).toMatchObject({ records: 0, batches: 0 });
    for (const a of ["streamRecords.practical.save", "streamRecords.practical.sign", "streamRecords.labBatches.split", "streamRecords.labBatches.move"]) expect(actionKey(a)).toMatch(/^audit\./);
  });
});

describe("a law college's records", () => {
  it("keeps moot courts with student teams, and refuses them where there is no law", async () => {
    const admin = await as("admin", "ADMIN", ids.A!);
    const teams = [{ name: "ZZ Team Themis", membershipIds: [ids.s6M!, ids.s7M!], outcome: "WINNER" as const }, { name: "ZZ Team Nyaya", membershipIds: [ids.s1M!], outcome: "RUNNER_UP" as const }];
    const moot = await saveMootCourt(admin, { name: "ZZ Intra moot", at: addDaysToKey(TODAY, -5), kind: "INTRA", teams, result: "ZZ Themis won 2-1", judgeNotes: "ZZ Strong memorials." });
    await expect(saveMootCourt(admin, { name: "ZZ Bad", at: TODAY, kind: "INTER", teams: [{ name: "ZZ T", membershipIds: [ids.teacherM!], outcome: "PARTICIPATED" }], result: "", judgeNotes: "" })).rejects.toMatchObject({ key: "streamRecords.refuseTeamMember" });
    await expect(saveMootCourt(await as("bAdmin", "ADMIN", ids.B!), { name: "ZZ Nope", at: TODAY, kind: "INTRA", teams: [], result: "", judgeNotes: "" })).rejects.toMatchObject({ key: "streamRecords.refuseNotLaw", status: 409 });
    const read = await mootCourts(await as("principal", "PRINCIPAL", ids.A!));
    expect(read).toMatchObject({ offered: true, canEdit: false });
    expect(read.items[0]).toMatchObject({ id: moot.id, kind: "INTRA", teams: [{ name: "ZZ Team Themis", outcome: "WINNER", members: [expect.objectContaining({ membershipId: ids.s6M }), expect.objectContaining({ membershipId: ids.s7M })] }, expect.anything()] });
    expect((await mootCourts(await as("bAdmin", "ADMIN", ids.B!))).offered).toBe(false);
  });

  it("offers court, firm and legal-aid internships (after semester 8 too) and counts the BCI's weeks per student", async () => {
    // A law student proposes a court internship after semester 8; an AICTE kind there is refused; an education college offers no court kind.
    const s6 = await as("s6", "STUDENT", ids.A!);
    const court = await proposeInternship(s6, { companyName: "ZZ District Court", kind: "COURT", from: "2026-06-01", to: "2026-07-26", hours: 300, windowSemester: 8, supervisorName: "ZZ Adv. Rao" });
    expect(court.kind).toBe("COURT");
    await expect(proposeInternship(s6, { companyName: "ZZ Firm", kind: "INDUSTRY", from: "2026-06-01", to: "2026-06-30", hours: 100, windowSemester: 8, supervisorName: "ZZ X" })).rejects.toMatchObject({ key: "placement.refuseInternshipWindow" });
    await expect(proposeInternship(await as("t1", "STUDENT", ids.B!), { companyName: "ZZ Court", kind: "COURT", from: "2026-06-01", to: "2026-06-30", hours: 100, windowSemester: 2, supervisorName: "ZZ X" })).rejects.toMatchObject({ key: "streamRecords.refuseInternshipKind" });
    // Completed ones, by hand: s6 (five years, needs 20) 8 weeks + 12 weeks evaluated; s7 (three years, needs 12) 4 weeks credited + one refused.
    await db.internship.update({ where: { id: court.id }, data: { status: "EVALUATED" } });
    const add = (who: string, kind: string, from: string, to: string, status: string) => db.internship.create({ data: { schoolId: ids.A!, studentMembershipId: ids[`${who}M`]!, companyName: `ZZ ${kind}`, kind, fromKey: from, toKey: to, hours: 100, windowSemester: 2, supervisorName: "ZZ S", status } });
    await add("s6", "FIRM", "2025-12-01", "2026-02-22", "CREDITED");
    await add("s7", "LEGAL_AID", "2026-07-01", "2026-07-28", "CREDITED");
    await add("s7", "COURT", "2026-08-01", "2026-12-31", "REFUSED");
    expect(weeksBetween("2026-06-01", "2026-07-26")).toBe(8);
    expect(weeksBetween("2025-12-01", "2026-02-22")).toBe(12);
    expect([bciMinimumWeeks(5), bciMinimumWeeks(3)]).toEqual([20, 12]);
    const s = await lawInternshipSummary(ids.A!, 2026);
    // The year 2026–27: the court one (8 weeks) and the legal-aid one (4 weeks) start in it; the firm one (2025) does not; the refused one is left out.
    expect(s).toMatchObject({ internships: 2, byKind: { COURT: 1, FIRM: 0, LEGAL_AID: 1 }, weeks: 12, students: 2, meetingMinimum: 1 });
    expect(s.perStudent.map((p) => [p.programmeCode, p.weeks, p.minimumWeeks, p.meets])).toEqual(expect.arrayContaining([["BALLB", 20, 20, true], ["LLB", 4, 12, false]]));
    expect(s.mootCourts).toMatchObject({ total: 1, INTRA: 1, participants: 3 });
  });
});

describe("a management student's summer internship", () => {
  it("is credited by the cell and its credits reach the exam cell's credit push for the term", async () => {
    // College B teaches management: SUMMER is offered there and refused at college A.
    await expect(proposeInternship(await as("s1", "STUDENT", ids.A!), { companyName: "ZZ Co", kind: "SUMMER", from: "2026-05-01", to: "2026-06-15", hours: 240, windowSemester: 2, supervisorName: "ZZ M" })).rejects.toMatchObject({ key: "streamRecords.refuseInternshipKind" });
    const t2 = await as("t2", "STUDENT", ids.B!);
    const summer = await proposeInternship(t2, { companyName: "ZZ Summer Analytics", kind: "SUMMER", from: "2026-05-01", to: "2026-06-15", hours: 240, windowSemester: 2, supervisorName: "ZZ Mentor" });
    await db.internship.update({ where: { id: summer.id }, data: { status: "SUBMITTED", reportFileId: `zz-report-${STAMP}`, industryGrade: "A", vivaMarks: 40 } });
    const tpo = await as("bTpo", "TPO", ids.B!);
    expect((await evaluateInternship(tpo, summer.id, { credits: 4 })).status).toBe("CREDITED");
    expect(await internshipCreditsForTerm(ids.t2M!, ids.bTerm!)).toBe(4);
    // A result run of that term, published: the push carries the course credits and the internship's.
    const session = await db.examSession.create({ data: { schoolId: ids.B!, name: "ZZ SR B session", termId: ids.bTerm!, status: "ASSESSMENT" }, select: { id: true } });
    const run = await db.resultRun.create({ data: { schoolId: ids.B!, sessionId: session.id, number: 1, computedByUserId: ids.bCtrl! }, select: { id: true } });
    for (const who of ["t1", "t2"]) await db.termResult.create({ data: { schoolId: ids.B!, runId: run.id, termId: ids.bTerm!, studentMembershipId: ids[`${who}M`]!, creditsAttemptedTenths: 200, creditsEarnedTenths: 200, status: "PASS" } });
    expect(await publishRun(await as("bCtrl", "EXAM_CONTROLLER", ids.B!), session.id, run.id)).toMatchObject({ ok: true });
    const pushes = await db.creditPush.findMany({ where: { schoolId: ids.B!, termId: ids.bTerm! }, select: { studentMembershipId: true, creditsTenths: true } });
    expect(Object.fromEntries(pushes.map((p) => [p.studentMembershipId, p.creditsTenths]))).toEqual({ [ids.t1M!]: 200, [ids.t2M!]: 240 });
  });
});

describe("teaching practice", () => {
  it("keeps practice schools and postings, lets the coordinator watch lessons, and counts the NCTE's weeks", async () => {
    const coord = await as("coord", "FACULTY", ids.B!);
    const school = await savePracticeSchool(coord, { name: "ZZ Zilla Parishad School", udise: "27250100101", contact: "ZZ Head 98200 00000" });
    await expect(savePracticeSchool(coord, { name: "ZZ Zilla Parishad School", udise: null, contact: "" })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseDuplicateSchool", status: 409 });
    const p1 = await savePracticePosting(coord, { studentMembershipId: ids.t1M!, practiceSchoolId: school.id, from: "2026-07-06", to: "2026-11-22", lessonsPlanned: 40 });
    await expect(savePracticePosting(coord, { studentMembershipId: ids.t1M!, practiceSchoolId: school.id, from: "2026-11-01", to: "2026-11-30", lessonsPlanned: 4 })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseOverlap" });
    await expect(savePracticePosting(coord, { studentMembershipId: ids.t2M!, practiceSchoolId: school.id, from: "2026-08-10", to: "2026-08-01", lessonsPlanned: 4 })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseDates" });
    await savePracticePosting(coord, { studentMembershipId: ids.t2M!, practiceSchoolId: school.id, from: "2026-08-03", to: "2026-08-30", lessonsPlanned: 10 });
    const day = "2026-07-15" <= TODAY ? "2026-07-15" : TODAY;
    await addLessonObservation(coord, p1.id, { at: day, grade: "B", note: "ZZ Good use of the blackboard." });
    await expect(addLessonObservation(coord, p1.id, { at: "2026-06-01", grade: "A", note: "" })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseObservationDay" });
    // The office manages but does not observe; a law college offers none of it.
    const bAdmin = await as("bAdmin", "ADMIN", ids.B!);
    await expect(addLessonObservation(bAdmin, p1.id, { at: day, grade: "A", note: "" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    expect((await teachingPracticeDesk(await as("admin", "ADMIN", ids.A!))).offered).toBe(false);
    await expect(savePracticeSchool(await as("admin", "ADMIN", ids.A!), { name: "ZZ X", udise: null, contact: "" })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseNotEducation" });
    const desk = await teachingPracticeDesk(bAdmin);
    expect(desk).toMatchObject({ offered: true, canManage: true, canObserve: false });
    expect(desk.postings.find((p) => p.id === p1.id)!.observations).toHaveLength(1);
    // 6 July – 22 November is 140 days, 20 weeks: t1 meets the NCTE's 20; t2's 28 days are 4 weeks.
    const s = await teachingPracticeSummary(ids.B!, 2026);
    expect(s).toMatchObject({ practiceSchools: 1, postings: 2, students: 2, lessonsPlanned: 50, lessonsObserved: 1, weeks: 24, minimumWeeks: NCTE_MIN_PRACTICE_WEEKS, meetingMinimum: 1 });
    expect(s.bySchool).toEqual([{ practiceSchoolId: school.id, name: "ZZ Zilla Parishad School", udise: "27250100101", postings: 2, students: 2 }]);
  });
});

describe("NSS and NCC", () => {
  it("enrol students, record activities of enrolled students only, and count each one's hours", async () => {
    const officer = await as("lab", "FACULTY", ids.A!);
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s1M!, ids.s2M!, ids.s3M!], unit: "ZZ Unit 1" })).toEqual({ count: 3 });
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s1M!], unit: "ZZ Unit 1" })).toEqual({ count: 0 });
    await expect(enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.teacherM!], unit: "" })).rejects.toMatchObject({ key: "duties.corps.refuseStudent" });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ Camp", at: TODAY, hours: 8, camp: true, participantMembershipIds: [ids.s4M!] })).rejects.toMatchObject({ key: "duties.corps.refuseNotEnrolled" });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ Later", at: addDaysToKey(TODAY, 2), hours: 8, camp: false, participantMembershipIds: [] })).rejects.toMatchObject({ key: "duties.corps.refuseFutureDay" });
    await addCorpsActivity(officer, "NSS", { title: "ZZ Village camp", at: TODAY, hours: 8, camp: true, participantMembershipIds: [ids.s1M!, ids.s2M!] });
    await addCorpsActivity(officer, "NSS", { title: "ZZ Blood donation", at: TODAY, hours: 2.5, camp: false, participantMembershipIds: [ids.s1M!] });
    await leaveCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], on: TODAY });
    // NCC is another duty: the NSS officer is refused its writes.
    await expect(enrolInCorps(officer, "NCC", { studentMembershipIds: [ids.s4M!], unit: "" })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    const s = await nssSummary(ids.A!, academicYearOf(TODAY));
    // 8 × 2 + 2.5 × 1 = 18.5 hours; s1 10.5 at a camp, s2 8 at a camp; three enrolled in the year (s3 left today).
    expect(s.nss).toMatchObject({ enrolled: 3, activities: 2, camps: 1, participations: 3, students: 2, hours: 18.5 });
    expect(s.nss.perStudent.map((p) => [p.studentMembershipId, p.hours, p.activities, p.camp])).toEqual(expect.arrayContaining([[ids.s1M, 10.5, 2, true], [ids.s2M, 8, 1, true]]));
    expect(s.ncc).toMatchObject({ enrolled: 0, activities: 0, hours: 0 });
    const desk = await corpsDesk(officer, "NSS");
    expect(desk.enrolled.map((e) => e.studentMembershipId).sort()).toEqual([ids.s1M, ids.s2M].sort());
    // The activity is the IQAC register's row too.
    expect(await db.activity.count({ where: { schoolId: ids.A!, kind: "NSS" } })).toBe(2);
  });
});

describe("the research dean, the flying squad and the lab's breakages", () => {
  it("reads the research register with each teacher's API-score inputs", async () => {
    await db.researchItem.createMany({ data: [
      { schoolId: ids.A!, kind: "PUBLICATION", title: "ZZ Paper", indexing: "SCOPUS", year: 2026, facultyMembershipId: ids.teacherM! },
      { schoolId: ids.A!, kind: "PROJECT", title: "ZZ Grant", year: 2025, amountLakhs: 4.5, facultyMembershipId: ids.teacherM! },
    ] });
    await db.facultyRecord.create({ data: { schoolId: ids.A!, membershipId: ids.teacherM!, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", apiScoreJson: JSON.stringify({ teaching: 60, research: 45.5, service: 10 }) } });
    const d = await researchDesk(await as("lab", "FACULTY", ids.A!));
    expect(d.perFaculty[0]).toMatchObject({ membershipId: ids.teacherM, publications: 1, projects: 1, amountLakhs: 4.5, apiScore: 115.5, apiScoreInputs: { teaching: 60, research: 45.5, service: 10 } });
    expect(d.byYear).toEqual([{ year: 2026, publications: 1, projects: 0, amountLakhs: 0 }, { year: 2025, publications: 0, projects: 1, amountLakhs: 4.5 }]);
    await expect(researchDesk(await as("plain", "FACULTY", ids.A!))).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
  });

  it("logs the squad's visit and tells the exam controller when something was found", async () => {
    const session = await db.examSession.create({ data: { schoolId: ids.A!, name: "ZZ SR A session", termId: ids.term!, status: "CONDUCT" }, select: { id: true } });
    const paper = await db.examSchedule.create({ data: { schoolId: ids.A!, sessionId: session.id, courseId: ids.c1!, courseCode: "ME101", courseName: "ZZ Mechanics", at: new Date() }, select: { id: true } });
    const hall = await db.examRoom.create({ data: { schoolId: ids.A!, sessionId: session.id, scheduleId: paper.id, name: "ZZ Hall 1", capacity: 40 }, select: { id: true } });
    const squad = await as("lab", "FACULTY", ids.A!);
    await expect(recordSquadVisit(squad, { scheduleId: paper.id, examRoomId: hall.id, members: "ZZ Two", flagged: true, note: "" })).rejects.toMatchObject({ key: "duties.examSquad.refuseNeedNote" });
    await expect(recordSquadVisit(squad, { scheduleId: paper.id, examRoomId: ids.lab1!, members: "", flagged: false, note: "" })).rejects.toMatchObject({ key: "duties.examSquad.refuseUnknownHall" });
    await recordSquadVisit(squad, { scheduleId: paper.id, examRoomId: hall.id, members: "ZZ Two", flagged: true, note: "ZZ Chits found under a desk." });
    expect(await db.notification.count({ where: { userId: ids.ctrl!, titleKey: "duties.examSquad.notifyFlagged" } })).toBe(1);
    // The office reads the desk; it does not log visits.
    await expect(recordSquadVisit(await as("admin", "ADMIN", ids.A!), { scheduleId: paper.id, examRoomId: null, members: "", flagged: false, note: "" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const desk = await examSquadDesk(await as("ctrl", "EXAM_CONTROLLER", ids.A!));
    expect(desk.papers.find((p) => p.scheduleId === paper.id)).toMatchObject({ halls: [{ id: hall.id, name: "ZZ Hall 1" }], visits: 1 });
    expect(desk.visits[0]).toMatchObject({ hallName: "ZZ Hall 1", flagged: true });
  });

  it("writes a breakage off the lab's stock through the inventory's one writer, never below nothing", async () => {
    const admin = await as("admin", "ADMIN", ids.A!);
    await db.inventoryItem.create({ data: { schoolId: ids.A!, code: "ZZ-FLASK", name: "ZZ Flask", unit: "piece" } });
    await recordMovement(admin, { kind: "ADJUST", itemCode: "ZZ-FLASK", quantity: 10, location: "ZZ SR Lab 1", toMembershipId: null, toRoom: "", toDepartment: "", reference: "", note: "ZZ" });
    const lab = await as("lab", "FACULTY", ids.A!);
    const moved = await recordLabBreakage(lab, { roomId: ids.lab1!, itemCode: "ZZ-FLASK", quantity: 3, note: "ZZ Dropped in practical" });
    expect(moved).toMatchObject({ kind: "WRITE_OFF", delta: -3, location: "ZZ SR Lab 1", reference: "BREAKAGE" });
    expect((await db.inventoryStock.findFirstOrThrow({ where: { schoolId: ids.A!, location: "ZZ SR Lab 1" } })).quantity).toBe(7);
    await expect(recordLabBreakage(lab, { roomId: ids.lab1!, itemCode: "ZZ-FLASK", quantity: 8, note: "ZZ Too many" })).rejects.toMatchObject({ key: "inventory.refuseNegativeStock" });
    await expect(recordLabBreakage(lab, { roomId: ids.period!, itemCode: "ZZ-FLASK", quantity: 1, note: "ZZ Not a lab" })).rejects.toMatchObject({ key: "duties.lab.refuseNotLab" });
    const desk = labDeskSchema.parse(await labDesk(lab));
    expect(desk.labs.find((l) => l.roomId === ids.lab1)!.stock).toEqual([{ itemCode: "ZZ-FLASK", itemName: "ZZ Flask", unit: "piece", quantity: 7 }]);
    expect(desk.breakages[0]).toMatchObject({ itemCode: "ZZ-FLASK", quantity: 3 });
    expect(desk.toSign.length).toBe(2);
    expect(desk.divisions[0]!.batches.map((b) => b.name)).toEqual(["A", "B"]);
  });
});

describe("the desks' doors", () => {
  const DESKS: [string, string][] = [
    ["GET", "/api/v1/duties/lab"],
    ["GET", "/api/v1/duties/teaching-practice"],
    ["GET", "/api/v1/duties/nss"],
    ["GET", "/api/v1/duties/ncc"],
    ["GET", "/api/v1/duties/research"],
    ["GET", "/api/v1/duties/exam-squad"],
    ["POST", "/api/v1/duties/exam-squad/visits"],
    ["POST", "/api/v1/duties/lab/breakage"],
  ];
  it("open to a FACULTY or HOD only holding the duty — at the gate, in permits, on the page and in the handler", async () => {
    for (const [method, path] of DESKS) {
      const door = endpointFor(method, path)!;
      expect({ path, duties: door.duties?.length ?? 0 }).toEqual({ path, duties: 1 });
      const duty = door.duties![0]!;
      expect(permits(door, "FACULTY")).toBe(false);
      expect(permits(door, "HOD", [duty])).toBe(true);
      expect(permits(door, "STUDENT", [duty])).toBe(false);
      await expect(gateRequest(`${method} ${path}`, { role: "FACULTY", schoolId: ids.A!, duties: [] })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
      await expect(gateRequest(`${method} ${path}`, { role: "FACULTY", schoolId: ids.A!, duties: [duty] })).resolves.toBe("pass");
    }
    // Every stream-records and duty door is in the catalog with a response schema.
    const mine = ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/stream-records/") || (e.path.startsWith("/api/v1/duties/") && !e.path.includes("anti-ragging")));
    expect(mine.length).toBe(27);
    const on = await enabledModules(ids.A);
    expect(modulePagePermitted("FACULTY", "/duties/lab", on, ["LAB_INCHARGE"])).toBe(true);
    expect(modulePagePermitted("FACULTY", "/duties/lab", on, [])).toBe(false);
    expect(modulePagePermitted("HOD", "/duties/nss", on, ["NSS_OFFICER"])).toBe(true);
    expect(modulePagePermitted("FACULTY", "/faculty/practicals", on, [])).toBe(true);
    // Through the handlers, with the session's gate stamped.
    await as("lab", "FACULTY", ids.A!, "GET /api/v1/duties/lab");
    expect((await labGet()).status).toBe(200);
    await as("plain", "FACULTY", ids.A!, "GET /api/v1/duties/lab");
    expect((await labGet()).status).toBe(403);
    await as("hod", "HOD", ids.A!, "GET /api/v1/duties/nss");
    expect((await nssGet()).status).toBe(403);
    await as("principal", "PRINCIPAL", ids.A!, "GET /api/v1/duties/nss");
    expect((await nssGet()).status).toBe(200);
    await as("s1", "STUDENT", ids.A!, "GET /api/v1/duties/nss");
    expect((await nssGet()).status).toBe(403);
  });

  it("are summed up for the office, and every write is labelled in the safety log", async () => {
    const s = await streamRecordsSummary(await as("admin", "ADMIN", ids.A!));
    expect(s).toMatchObject({ labs: true, law: true, education: false });
    expect(s.lawInternships.mootCourts.total).toBe(1);
    await expect(streamRecordsSummary(await as("teacher", "FACULTY", ids.A!))).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    for (const action of ["streamRecords.moot.save", "duties.lab.breakage", "duties.examSquad.visit", "duties.teachingPractice.school", "duties.teachingPractice.posting", "duties.teachingPractice.observe", "duties.corps.enrol", "duties.corps.leave", "duties.corps.activity"]) {
      expect({ action, label: actionKey(action) }).toEqual({ action, label: expect.stringMatching(/^audit\./) });
    }
    const logged = await db.auditLog.groupBy({ by: ["action"], where: { schoolId: { in: [ids.A!, ids.B!] }, action: { startsWith: "duties." } }, _count: { _all: true } });
    expect(logged.map((l) => l.action).sort()).toEqual(["duties.corps.activity", "duties.corps.enrol", "duties.corps.leave", "duties.examSquad.visit", "duties.lab.breakage", "duties.teachingPractice.observe", "duties.teachingPractice.posting", "duties.teachingPractice.school"]);
  });
});
