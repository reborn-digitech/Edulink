/**
 * THE COLLEGE'S YEAR, ROLE TO ROLE (the integration builder, 4 October 2026).
 *
 * One student walked through the plan's timeline at ZZ Vidya College against
 * the ZZ fixtures, each step through the owning module's own function with a
 * primed session of the role that does it, and each hand-off read by the next
 * module without anything re-keyed:
 *
 *   the office admits from a round   → the record, the enrolment and the academic seat, one PRN
 *   the office seats a division      → the seat keeps the record's PRN (one writer)
 *   the student registers            → the scheme's core courses and this walk's course
 *   faculty marks lectures           → the attendance the exam form's eligibility reads
 *   the HOD locks internal marks     → the totals the exam cell's result run reads
 *   the student submits the form     → eligibility (academics) and no-dues (the office) read
 *   the controller imports and publishes the result
 *   placement's record reads the CGPA the exam cell published
 *   the IQAC's facts read the pass the exam cell published (2.6.3's inputs)
 *   faculty files leave, the office asks a late registration → the principal's queue and decision log
 *   the office records the graduation → the alumnus row opens
 *   the alumnus reads the global feed  → a post appears once
 *
 * WHAT IT CREATES, ALL REMOVED AFTER: one applicant (and the student, then
 * alumnus, they become), one course with its offering, lectures and
 * components, one exam session, and one global post — every row at ZZ
 * Vidya College and found again by this run's STAMP. Nothing of the fixture
 * is changed except that its own students get a DRAFT form in this run's
 * session, which goes with the session.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ACADEMICS_FIXTURE as A } from "@/lib/api-catalog/academics-fixture";
import { IQAC_FIXTURE } from "@/lib/api-catalog/iqac-fixture";
import { admitStudent } from "@/lib/college-admissions";
import { saveSeat } from "@/lib/academics";
import { saveRegistration } from "@/lib/academics-registration";
import { eligibilityForTerm, markLecture } from "@/lib/academics-attendance";
import { internalTotalsFor, lockInternal, moderateComponent, releaseComponent, saveComponent, saveInternalMarks } from "@/lib/academics-assessment";
import { noDuesFor } from "@/lib/no-dues";
import { decideForm, generateForms, setSessionStatus, submitForm } from "@/lib/exam-cell";
import { importMarks, publishRun, runResults } from "@/lib/exam-cell-marks";
import { placementRecords } from "@/lib/placement-record";
import { gatherFacts, readEntered } from "@/lib/iqac-facts";
import { leaveCollege } from "@/lib/college-records";
import { createPost } from "@/lib/bulletin";
import { listGlobalFeed, publishGlobally } from "@/lib/global-feed";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { applyForLeave } from "@/lib/leave";
import { askLateRegistration, decideLateRegistration } from "@/lib/academics-registration";
import { principalCollege } from "@/lib/college-principal";
import { listDecisions } from "@/lib/decision-log";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TAG = `ZZ Year walk ${STAMP}`;
const TODAY = todayKey("Asia/Kolkata");
const PRN = `ZZYW${SUFFIX}`;

const id: Record<string, string> = {};
const user: Record<string, string> = {};

async function as(userId: string, role: string, schoolId: string | null = id.vidya!): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}
const userOf = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;

beforeAll(async () => {
  id.vidya = (await db.school.findUniqueOrThrow({ where: { slug: "zz-vidya-college" }, select: { id: true } })).id;
  for (const [k, email] of [["admin", "zz.cadmin@zz.test"], ["principal", "zz.cprincipal@zz.test"], ["controller", "zz.examctrl@zz.test"], ["faculty", "zz.faculty01@zz.test"], ["hod", "zz.hod01@zz.test"]] as const) user[k] = await userOf(email);
  // A round of the fixture's for BSc Physics, and a number of this run's own.
  const round = await db.admissionRound.findFirstOrThrow({ where: { schoolId: id.vidya, programmeId: A.programme(1) }, select: { id: true } });
  const last = await db.collegeApplication.aggregate({ where: { roundId: round.id }, _max: { number: true } });
  id.application = (
    await db.collegeApplication.create({
      data: { schoolId: id.vidya, roundId: round.id, programmeId: A.programme(1), number: (last._max.number ?? 0) + 1000 + Number(SUFFIX.slice(-3)), applicantName: `${TAG} Student`, category: "OPEN", quota: "INSTITUTE", status: "FEE_DUE", antiRaggingStudentAt: new Date(), antiRaggingParentAt: new Date() },
      select: { id: true },
    })
  ).id;
  // This walk's own course: semester 1 and CORE, so registration takes it with the scheme's other core courses.
  id.course = (await db.course.create({ data: { schoolId: id.vidya, schemeId: A.scheme(1), code: `ZYW${SUFFIX}`, name: `${TAG} course`, semester: 1, creditsL: 2, kind: "CORE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ the walk's outcome" }]) }, select: { id: true } })).id;
  const faculty = await db.membership.findFirstOrThrow({ where: { schoolId: id.vidya, userId: user.faculty, role: "FACULTY" }, select: { id: true } });
  id.offering = (await db.courseOffering.create({ data: { schoolId: id.vidya, termId: A.term, courseId: id.course, divisionId: A.division(1), facultyMembershipId: faculty.id, lectureHours: 2 }, select: { id: true } })).id;
  // The walk's exam session for this term: forms open now, no fee head (so no demand is raised).
  id.session = (
    await db.examSession.create({
      data: { schoolId: id.vidya, name: `${TAG} session`, kind: "REGULAR", termId: A.term, formOpensAt: new Date(Date.now() - 86_400_000), formClosesAt: new Date(Date.now() + 10 * 86_400_000), feePerCoursePaise: 0, feePerBacklogPaise: 0, photocopyFeePaise: 0, revalFeePaise: 0, status: "FORMS", createdByUserId: user.controller! },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  if (id.post) await db.post.deleteMany({ where: { id: id.post } });
  if (id.leave) await db.leaveRequest.deleteMany({ where: { id: id.leave } });
  if (id.session) await db.examSession.deleteMany({ where: { id: id.session } });
  if (id.course) await db.course.deleteMany({ where: { id: id.course } });
  await db.collegeApplication.deleteMany({ where: { id: id.application } });
  if (user.student) {
    await db.session.deleteMany({ where: { userId: user.student } });
    await db.user.deleteMany({ where: { id: user.student } });
  }
  await db.session.deleteMany({ where: { userId: { in: Object.values(user) }, userAgent: null, createdAt: { gte: new Date(STAMP) } } });
  await db.$disconnect();
});

describe("a college year at ZZ Vidya College, role to role", () => {
  it("admits: the record, the enrolment and the academic seat in one transaction, with one PRN", async () => {
    const admin = await as(user.admin!, "ADMIN");
    const r = await admitStudent(admin, id.application!, { prn: PRN });
    id.student = r.studentMembershipId;
    user.student = (await db.membership.findUniqueOrThrow({ where: { id: id.student }, select: { userId: true } })).userId;
    const [record, enrolment, seat] = await Promise.all([
      db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: id.student } }),
      db.programmeEnrolment.findFirstOrThrow({ where: { studentMembershipId: id.student } }),
      db.studentProgramme.findUniqueOrThrow({ where: { studentMembershipId: id.student } }),
    ]);
    expect(record.prn).toBe(PRN);
    expect(enrolment).toMatchObject({ programmeId: A.programme(1), status: "ACTIVE" });
    expect(seat).toMatchObject({ programmeId: A.programme(1), schemeId: A.scheme(1), semester: 1, prn: PRN });
  });

  it("seats a division: the seat page names no PRN, and the seat keeps the record's", async () => {
    const admin = await as(user.admin!, "ADMIN");
    const seat = await db.studentProgramme.findUniqueOrThrow({ where: { studentMembershipId: id.student } });
    await saveSeat(admin, { studentMembershipId: id.student!, programmeId: seat.programmeId, schemeId: seat.schemeId, entryYear: seat.entryYear, yearOfStudy: 1, semester: 1, divisionId: A.division(1), rollNumber: 70 + Number(SUFFIX.slice(-1)), prn: null } as never);
    const after = await db.studentProgramme.findUniqueOrThrow({ where: { studentMembershipId: id.student } });
    expect(after.divisionId).toBe(A.division(1));
    expect(after.prn).toBe(PRN);
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: id.student } })).prn).toBe(PRN);
  });

  it("registers: the scheme's core courses and the walk's course, inside the window", async () => {
    const student = await as(user.student!, "STUDENT");
    await saveRegistration(student, { termId: A.term, offeringIds: [id.offering!] });
    const regs = await db.courseRegistration.findMany({ where: { studentMembershipId: id.student, status: "REGISTERED" }, select: { offeringId: true } });
    expect(regs.map((r) => r.offeringId)).toContain(id.offering);
    expect(regs.length).toBeGreaterThan(1);
  });

  it("marks lectures, and the exam form's eligibility reads them", async () => {
    const faculty = await as(user.faculty!, "FACULTY");
    for (let k = 0; k < 4; k += 1) {
      const lecture = await db.lecture.create({ data: { schoolId: id.vidya!, offeringId: id.offering!, dateKey: addDaysToKey(TODAY, -(k + 3)), startMinute: 600 + k, endMinute: 650 + k }, select: { id: true } });
      const r = await markLecture(faculty, lecture.id, { clientId: `zz-year-${STAMP}-${k}`, entries: [{ studentMembershipId: id.student!, status: k === 0 ? "ABSENT" : "PRESENT" }] });
      expect(r.replay).toBe(false);
    }
    const mine = (await eligibilityForTerm(A.term, { studentMembershipId: id.student })).find((e) => e.offeringId === id.offering);
    expect(mine).toMatchObject({ percent: 75, eligible: true });
  });

  it("locks internal marks: the teacher enters, a colleague countersigns, the HOD releases and locks", async () => {
    const faculty = await as(user.faculty!, "FACULTY");
    const comp = await saveComponent(faculty, id.offering!, { name: `${TAG} test`, kind: "UNIT_TEST", maxMarks: 40, weight: 40, coCodes: ["CO1"] });
    await saveInternalMarks(faculty, id.offering!, { componentId: comp.id, entries: [{ studentMembershipId: id.student!, marks: 30 }] });
    const hod = await as(user.hod!, "HOD");
    await moderateComponent(hod, comp.id);
    await releaseComponent(hod, comp.id);
    await lockInternal(hod, id.offering!);
    const totals = await internalTotalsFor(id.offering!);
    expect(totals?.totals.find((t) => t.studentMembershipId === id.student)?.total).toBe(30);
  });

  it("forms: generated from the registration, refused by nothing — eligibility and no-dues both read — and approved", async () => {
    expect((await noDuesFor(id.student!, "EXAM_FORM")).completed).toBe(true);
    const controller = await as(user.controller!, "EXAM_CONTROLLER");
    await generateForms(controller, id.session!);
    const form = await db.examForm.findFirstOrThrow({ where: { sessionId: id.session, studentMembershipId: id.student }, select: { id: true, coursesJson: true } });
    expect((JSON.parse(form.coursesJson) as { courseId: string }[]).map((c) => c.courseId)).toContain(id.course);
    const student = await as(user.student!, "STUDENT");
    await submitForm(student, form.id);
    const submitted = await db.examForm.findUniqueOrThrow({ where: { id: form.id }, select: { status: true, eligible: true, noDues: true } });
    expect(submitted).toMatchObject({ status: "SUBMITTED", eligible: true, noDues: true });
    await as(user.controller!, "EXAM_CONTROLLER").then((c) => decideForm(c, form.id, { approve: true, waiveFee: false }));
    expect((await db.examForm.findUniqueOrThrow({ where: { id: form.id }, select: { status: true } })).status).toBe("APPROVED");
  });

  it("results: the university's file imported by PRN, the run reads the locked internal marks, publication; placement and the IQAC read it", async () => {
    const vidya = id.vidya!;
    const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: IQAC_FIXTURE.cycle }, select: { windowFrom: true, windowTo: true, enteredJson: true } });
    const before = (await gatherFacts(vidya, cycle.windowFrom, cycle.windowTo, readEntered(cycle.enteredJson))).facts;

    const controller = await as(user.controller!, "EXAM_CONTROLLER");
    await setSessionStatus(controller, id.session!, "CONDUCT");
    const form = await db.examForm.findFirstOrThrow({ where: { sessionId: id.session, studentMembershipId: id.student }, select: { coursesJson: true } });
    const courseIds = (JSON.parse(form.coursesJson) as { courseId: string }[]).map((c) => c.courseId);
    const codes = await db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, code: true } });
    // The walk's course leaves INTERNAL blank: the run takes it from the HOD's lock. The others carry the file's.
    const lines = ["PRN,SEAT_NO,COURSE_CODE,INTERNAL,EXTERNAL", ...codes.map((c) => (c.id === id.course ? `${PRN},,${c.code},,45` : `${PRN},,${c.code},30,40`))];
    const imported = await importMarks(controller, id.session!, lines.join("\n"));
    expect(imported.unmatched).toEqual([]);
    expect(imported.created).toBe(codes.length);
    const run = await runResults(controller, id.session!);
    expect(run.ok).toBe(true);
    const draft = await db.resultRun.findFirstOrThrow({ where: { sessionId: id.session, status: "DRAFT" }, select: { id: true } });
    await publishRun(controller, id.session!, draft.id);

    const term = await db.termResult.findFirstOrThrow({ where: { studentMembershipId: id.student, run: { sessionId: id.session, status: "PUBLISHED" } }, select: { status: true, sgpaHundredths: true } });
    expect(term.status).toBe("PASS");
    const mine = await db.courseResult.findFirstOrThrow({ where: { studentMembershipId: id.student, courseId: id.course, run: { status: "PUBLISHED" } }, select: { internalMilli: true, status: true } });
    expect(mine).toMatchObject({ internalMilli: 30_000, status: "PASS" });

    // Placement's record reads the CGPA the exam cell published (one term: the CGPA is that term's SGPA).
    const record = (await placementRecords(vidya, [id.student!])).get(id.student!);
    expect(record?.cgpa).toBe((term.sgpaHundredths ?? 0) / 100);
    expect(record?.liveBacklogs).toBe(0);
    expect(record?.programmeId).toBe(A.programme(1));

    // The IQAC's facts (2.6.3's inputs) count the published pass.
    const after = (await gatherFacts(vidya, cycle.windowFrom, cycle.windowTo, readEntered(cycle.enteredJson))).facts;
    expect((after.appeared ?? 0) - (before.appeared ?? 0)).toBe(1);
    expect((after.passed ?? 0) - (before.passed ?? 0)).toBe(1);
  });

  it("waits for the principal: faculty leave and a late registration on the college's queue, the decision in the log", async () => {
    const faculty = await as(user.faculty!, "FACULTY");
    const leave = await applyForLeave(faculty, { fromDateKey: addDaysToKey(TODAY, 30), toDateKey: addDaysToKey(TODAY, 30), kind: "CASUAL", reason: `${TAG} a family wedding`, nominatedCoverMembershipId: null });
    expect(leave.ok).toBe(true);
    id.leave = leave.id!;
    const admin = await as(user.admin!, "ADMIN");
    const late = await askLateRegistration(admin, { studentMembershipId: id.student!, termId: A.term, reason: `${TAG} came late`, openUntil: addDaysToKey(TODAY, 3) });
    const principal = await as(user.principal!, "PRINCIPAL");
    const college = await principalCollege(principal);
    expect(college.approvals.find((a) => a.key === "leave")!.count).toBeGreaterThan(0);
    expect(college.approvals.find((a) => a.key === "lateRegistration")!.count).toBeGreaterThan(0);
    await decideLateRegistration(principal, late.id, true);
    const log = await listDecisions(principal, { kind: "lateRegistration", limit: 30 });
    const entry = log.items.find((d) => d.action === "academics.late.approve");
    expect(entry?.sentence).toContain(`${TAG} Student`);
    expect(entry?.approved).toBe(true);
  });

  it("graduates: the leaving clearance complete, the alumnus row opens, and the alumnus reads the global feed once", async () => {
    expect((await noDuesFor(id.student!, "LEAVING")).completed).toBe(true);
    const admin = await as(user.admin!, "ADMIN");
    const left = await leaveCollege(admin, id.student!, { leftOn: TODAY, reason: "GRADUATED" });
    expect(left.alumnus).toBe(true);
    const alumnusRow = await db.membership.findFirstOrThrow({ where: { userId: user.student, schoolId: id.vidya, role: "ALUMNUS", status: "ACTIVE" }, select: { id: true } });
    expect(alumnusRow.id).toBeTruthy();
    expect((await db.programmeEnrolment.findFirstOrThrow({ where: { studentMembershipId: id.student } })).status).toBe("COMPLETED");

    // The office shares a post with every school and college; the new alumnus reads it, once.
    const post = await createPost(admin, { scope: "SCHOOL", title: `${TAG} shared`, body: "ZZ a year's end", tags: [], media: [], category: "UPDATES" });
    id.post = post.postId;
    await publishGlobally(admin, post.postId);
    const alumnus = await as(user.student!, "ALUMNUS");
    const feed = await listGlobalFeed(alumnus);
    expect(feed.filter((p) => p.id === id.post)).toHaveLength(1);
    expect(new Set(feed.map((p) => p.id)).size).toBe(feed.length);
  });
});
