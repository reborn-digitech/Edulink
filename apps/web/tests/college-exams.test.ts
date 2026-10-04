/**
 * The college exam cell (module EXAMS, role EXAM_CONTROLLER; 4 October 2026),
 * through its /api/v1 doors with primed sessions, at three ZZ colleges of
 * this suite's own: Aff (affiliated, EXAMS on), Auto (autonomous, EXAMS on)
 * and Off (EXAMS off). Each has the academics module's rows the cell reads:
 * a department, programme, scheme (30 internal, 70 external, 40 % to pass,
 * one course carried as ATKT), two courses of 3 and 4 credits, a term, the
 * offerings, the registrations, the HOD's locked internal marks, and four
 * lectures of the first course with one student short of attendance.
 *
 * What is proved: MODULE_OFF where the college has EXAMS off; the wrong role
 * is 403 before the body; a form is refused without attendance eligibility
 * and without no-dues, and a submitted one raises its fee as a demand; two
 * people's entries must agree (a mismatch, then a match); grace changes
 * nothing until the principal approves it, and only the principal may; the
 * run's SGPA equals a hand computation; a change after publication is a new
 * mark row and a new run, the published one kept as superseded; a
 * revaluation changes the result only through a new run; a backlog past the
 * seven-year limit is refused; the doors of conduct answer 403 at an
 * affiliated college and 200 at an autonomous one; the sealed paper opens
 * only into the response, logged and audited; and the stored SGPA is the
 * one the course rows give.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { sgpaCourses } from "@/lib/exam-cell-marks";
import { checkExamDocument } from "@/lib/exam-cell-after";
import { alternateSeats, courseOutcome, gradingTableOf, lateFeeOn, rulesOf, sgpaHundredths, toMilli } from "@/lib/exam-cell-rules";
import { GET as homeGet } from "@/app/api/v1/exam-cell/route";
import { POST as sessionsPost } from "@/app/api/v1/exam-cell/sessions/route";
import { GET as sessionGet } from "@/app/api/v1/exam-cell/sessions/[sessionId]/route";
import { POST as statusPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/status/route";
import { POST as formsPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/forms/route";
import { POST as submitPost } from "@/app/api/v1/exam-cell/forms/[formId]/submit/route";
import { POST as decidePost } from "@/app/api/v1/exam-cell/forms/[formId]/decide/route";
import { POST as schedulePost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/schedule/route";
import { POST as roomsPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/rooms/route";
import { POST as seatingPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/seating/route";
import { POST as ticketsPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/hall-tickets/route";
import { GET as ticketPdf } from "@/app/api/v1/exam-cell/hall-tickets/[ticketId]/pdf/route";
import { GET as marksGet, POST as marksPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/marks/route";
import { POST as correctPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/marks/correct/route";
import { POST as importPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/marks/import/route";
import { POST as gracePost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/grace/route";
import { POST as graceDecidePost } from "@/app/api/v1/exam-cell/grace/[graceId]/decide/route";
import { POST as runPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/results/run/route";
import { POST as publishPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/results/publish/route";
import { GET as resultsGet } from "@/app/api/v1/exam-cell/sessions/[sessionId]/results/route";
import { POST as revalAskPost } from "@/app/api/v1/exam-cell/mine/revaluations/route";
import { POST as revalDecidePost } from "@/app/api/v1/exam-cell/revaluations/[revaluationId]/decide/route";
import { POST as backlogPost } from "@/app/api/v1/exam-cell/mine/backlogs/route";
import { GET as mineGet } from "@/app/api/v1/exam-cell/mine/route";
import { GET as conductGet } from "@/app/api/v1/exam-cell/sessions/[sessionId]/conduct/route";
import { POST as papersPost } from "@/app/api/v1/exam-cell/sessions/[sessionId]/papers/route";
import { POST as paperSubmitPost } from "@/app/api/v1/exam-cell/papers/[paperId]/submit/route";
import { GET as paperOpenGet } from "@/app/api/v1/exam-cell/papers/[paperId]/open/route";
import { POST as documentsPost } from "@/app/api/v1/exam-cell/documents/route";
import { POST as creditsPushPost } from "@/app/api/v1/exam-cell/credits/push/route";

const dues = vi.hoisted(() => ({ blocked: new Set<string>() }));
vi.mock("@/lib/no-dues", () => ({
  NO_DUES_EVENTS: ["EXAM_FORM", "HOSTEL_EXIT", "LEAVING"],
  noDuesFor: vi.fn(async (studentMembershipId: string, event: string) => ({
    studentMembershipId,
    event,
    lines: dues.blocked.has(studentMembershipId) ? [{ desk: "LIBRARY", owedPaise: 5000, itemsOut: 1, cleared: false, clearedByUserId: null, clearedAt: null }] : [],
    completed: !dues.blocked.has(studentMembershipId),
    completedAt: null,
  })),
}));

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};
const users: Record<string, string> = {};

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const get = (path: string) => new Request(`http://localhost${path}`);
const p = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(user: string, schoolId: string | null, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(users[user]!, { schoolId, role: role as never });
}

async function academics(schoolId: string, tag: string, studentIds: string[], facultyId: string) {
  const dept = await db.department.create({ data: { schoolId, code: `ZX${tag}`, name: `ZZ Exams Physics ${tag}` } });
  const prog = await db.programme.create({ data: { schoolId, departmentId: dept.id, code: `ZXP${tag}`, name: `ZZ BSc ${tag}`, level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 } });
  const scheme = await db.scheme.create({
    data: {
      schoolId,
      programmeId: prog.id,
      name: `ZZ Scheme ${tag}`,
      effectiveYear: 2024,
      gradingTable: JSON.stringify([
        { grade: "O", points: 10, minPercent: 90 },
        { grade: "A+", points: 9, minPercent: 80 },
        { grade: "A", points: 8, minPercent: 70 },
        { grade: "B+", points: 7, minPercent: 60 },
        { grade: "B", points: 6, minPercent: 55 },
        { grade: "C", points: 5, minPercent: 50 },
        { grade: "P", points: 4, minPercent: 40 },
        { grade: "F", points: 0, minPercent: 0 },
      ]),
      passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 1, totalCredits: 120, internalMax: 30, externalMax: 70, minTermCredits: 0, maxTermCredits: 30 }),
    },
  });
  const c1 = await db.course.create({ data: { schoolId, schemeId: scheme.id, code: `ZXA${tag}`, name: "ZZ Mechanics", semester: 1, creditsL: 3 } });
  const c2 = await db.course.create({ data: { schoolId, schemeId: scheme.id, code: `ZXB${tag}`, name: "ZZ Optics", semester: 1, creditsL: 3, creditsP: 1 } });
  const term = await db.academicTerm.create({ data: { schoolId, name: `ZZ Odd ${tag} ${STAMP}`, academicYear: "2026-27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-07-15" } });
  const o1 = await db.courseOffering.create({ data: { schoolId, termId: term.id, courseId: c1.id, facultyMembershipId: facultyId, lectureHours: 3 } });
  const o2 = await db.courseOffering.create({ data: { schoolId, termId: term.id, courseId: c2.id, facultyMembershipId: facultyId, lectureHours: 3 } });
  for (const s of studentIds) {
    await db.courseRegistration.createMany({ data: [o1, o2].map((o) => ({ schoolId, studentMembershipId: s, offeringId: o.id, termId: term.id, kind: "CORE" })) });
    await db.studentProgramme.create({ data: { schoolId, studentMembershipId: s, programmeId: prog.id, schemeId: scheme.id, entryYear: 2026, prn: `ZX${tag}${s.slice(-6)}`.toUpperCase().replace(/[^A-Z0-9]/g, "") } });
  }
  return { dept, prog, scheme, c1, c2, term, o1, o2 };
}

beforeAll(async () => {
  const mkSchool = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Exams ${tag} ${STAMP}`, slug: `zz-exams-${tag.toLowerCase()}-${STAMP}`, code: `ZX${{ Aff: "F", Auto: "T", Off: "O" }[tag] ?? tag[0]}${SUFFIX}`, contactEmail: `zz-exams-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind, affiliatingUniversity: "ZZ University" }, select: { id: true } });
  ids.aff = (await mkSchool("Aff", "COLLEGE")).id;
  ids.auto = (await mkSchool("Auto", "AUTONOMOUS_COLLEGE")).id;
  ids.off = (await mkSchool("Off", "COLLEGE")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.aff!, module: "EXAMS" }, { schoolId: ids.aff!, module: "ACADEMICS" }, { schoolId: ids.auto!, module: "EXAMS" }, { schoolId: ids.auto!, module: "ACADEMICS" }, { schoolId: ids.off!, module: "ACADEMICS" }] });
  const mk = async (who: string, minor = false) => {
    users[who] = (await db.user.create({ data: { name: `ZZ Ex ${who}`, email: `zz-exams-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: minor }, select: { id: true } })).id;
  };
  for (const w of ["Controller", "Admin", "Principal", "Faculty", "S1", "S2", "S3", "Parent", "AutoController", "AutoFaculty", "OffController"]) await mk(w, w === "S1");
  const member = async (who: string, schoolId: string, role: string, code?: string) => (await db.membership.create({ data: { userId: users[who]!, schoolId, role, status: "ACTIVE", ...(code ? { studentCode: code } : {}) }, select: { id: true } })).id;
  ids.controller = await member("Controller", ids.aff!, "EXAM_CONTROLLER");
  ids.admin = await member("Admin", ids.aff!, "ADMIN");
  ids.principal = await member("Principal", ids.aff!, "PRINCIPAL");
  ids.faculty = await member("Faculty", ids.aff!, "FACULTY");
  ids.s1 = await member("S1", ids.aff!, "STUDENT", `ZXS1${SUFFIX}`);
  ids.s2 = await member("S2", ids.aff!, "STUDENT", `ZXS2${SUFFIX}`);
  ids.s3 = await member("S3", ids.aff!, "STUDENT", `ZXS3${SUFFIX}`);
  ids.autoController = await member("AutoController", ids.auto!, "EXAM_CONTROLLER");
  ids.autoFaculty = await member("AutoFaculty", ids.auto!, "FACULTY");
  ids.offController = await member("OffController", ids.off!, "EXAM_CONTROLLER");
  for (const s of [ids.s1!, ids.s2!]) await db.guardianship.create({ data: { parentUserId: users.Parent!, studentMembershipId: s, studentSchoolId: ids.aff!, status: "ACTIVE" } });

  const a = await academics(ids.aff!, `A${SUFFIX}`, [ids.s1!, ids.s2!, ids.s3!], ids.faculty!);
  Object.assign(ids, { term: a.term.id, c1: a.c1.id, c2: a.c2.id, o1: a.o1.id, o2: a.o2.id });
  // The HOD's lock: internal totals in hundredths of a mark out of 30.
  const lock = (offeringId: string, totals: [string, number][]) => db.internalLock.create({ data: { schoolId: ids.aff!, offeringId, termId: a.term.id, outOf: 30, totalsJson: JSON.stringify(totals.map(([studentMembershipId, totalHundredths]) => ({ studentMembershipId, totalHundredths }))), lockedByUserId: users.Faculty! } });
  await lock(a.o1.id, [[ids.s1!, 2400], [ids.s2!, 1500], [ids.s3!, 2100]]);
  await lock(a.o2.id, [[ids.s1!, 2000], [ids.s2!, 1800], [ids.s3!, 2100]]);
  // Four lectures of the first course: S1 and S2 at every one, S3 at one (25 %).
  for (let i = 0; i < 4; i++) {
    const lecture = await db.lecture.create({ data: { schoolId: ids.aff!, offeringId: a.o1.id, dateKey: `2026-08-0${i + 3}`, startMinute: 600, endMinute: 660 } });
    await db.lectureAttendance.createMany({ data: [ids.s1!, ids.s2!, ids.s3!].map((s) => ({ schoolId: ids.aff!, lectureId: lecture.id, studentMembershipId: s, status: s === ids.s3 && i > 0 ? "ABSENT" : "PRESENT", markedByMembershipId: ids.faculty! })) });
  }
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.aff!, name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.head = (await db.feeHead.create({ data: { schoolId: ids.aff!, name: "ZZ Exam fees", code: "EXM", kind: "EXAM" }, select: { id: true } })).id;

  const b = await academics(ids.auto!, `B${SUFFIX}`, [], ids.autoFaculty!);
  Object.assign(ids, { autoTerm: b.term.id, autoCourse: b.c1.id });
  const c = await academics(ids.off!, `C${SUFFIX}`, [], ids.offController!);
  ids.offTerm = c.term.id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  const made = [ids.aff, ids.auto, ids.off].filter((x): x is string => Boolean(x));
  await db.notification.deleteMany({ where: { schoolId: { in: made } } });
  await db.school.deleteMany({ where: { id: { in: made } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the exam cell's arithmetic", () => {
  it("grades a course, carries ATKT, sums the SGPA, and takes the late fee's last slab", () => {
    const rules = rulesOf(JSON.stringify({ minPercentPerCourse: 40, atktLimit: 1, internalMax: 30, externalMax: 70 }));
    const table = gradingTableOf(null);
    expect(courseOutcome({ internalMilli: 24000, externalMilli: 50000, absent: false, graceMilli: 0 }, rules, table)).toMatchObject({ totalMilli: 74000, grade: "A", pointsTenths: 80, passed: true });
    // 27.9 of 70 is short of the external 40 % (28), whatever the total.
    expect(courseOutcome({ internalMilli: 30000, externalMilli: 27900, absent: false, graceMilli: 0 }, rules, table).passed).toBe(false);
    expect(courseOutcome({ internalMilli: 20000, externalMilli: null, absent: true, graceMilli: 0 }, rules, table)).toMatchObject({ grade: "AB", absent: true });
    expect(sgpaHundredths([{ creditsTenths: 30, pointsTenths: 80 }, { creditsTenths: 40, pointsTenths: 90 }])).toBe(857);
    expect(lateFeeOn([{ fromDateKey: "2026-09-10", paise: 5000 }, { fromDateKey: "2026-09-01", paise: 2000 }], "2026-09-05")).toBe(2000);
    expect(alternateSeats(["a", "b", "c"], 4, 0)).toEqual({ seated: [{ seatNo: 1, who: "a" }, { seatNo: 3, who: "b" }], left: ["c"] });
    expect(alternateSeats(["d"], 4, 1).seated[0]!.seatNo).toBe(2);
    expect(toMilli(45.5, 70)).toBe(45500);
    expect(toMilli(71, 70)).toBeNull();
  });
});

describe("the exam cell (module EXAMS)", () => {
  it("answers MODULE_OFF where the college has EXAMS off, and 403 to the wrong role before the body", async () => {
    await expect(gateRequest("GET /api/v1/exam-cell", { role: "EXAM_CONTROLLER", schoolId: ids.off! })).rejects.toBeInstanceOf(ModuleOffError);
    await as("OffController", ids.off!, "EXAM_CONTROLLER");
    const off = await homeGet();
    expect(off.status).toBe(403);
    expect((await body(off)).code).toBe("MODULE_OFF");
    await as("S1", ids.aff!, "STUDENT");
    expect((await sessionsPost(json("/api/v1/exam-cell/sessions", {}))).status).toBe(403);
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    expect((await sessionsPost(json("/api/v1/exam-cell/sessions", {}))).status).toBe(422);
  });

  it("opens a session and generates a form for every registered student", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const now = Date.now();
    const made = await sessionsPost(json("/api/v1/exam-cell/sessions", { name: `ZZ Winter ${STAMP}`, kind: "REGULAR", termId: ids.term, formOpensAt: new Date(now - 3_600_000).toISOString(), formClosesAt: new Date(now + 7 * 86_400_000).toISOString(), feePerCoursePaise: 10000, feePerBacklogPaise: 15000, photocopyFeePaise: 5000, revalFeePaise: 30000, lateFeeSlabs: [], feeHeadId: ids.head }));
    expect(made.status).toBe(200);
    ids.session = (await body<{ id: string }>(made)).id;
    expect((await statusPost(json("/x", { status: "FORMS" }), p("sessionId", ids.session!))).status).toBe(200);
    const gen = await body<{ count: number }>(await formsPost(json("/x", {}), p("sessionId", ids.session!)));
    expect(gen.count).toBe(3);
    // Again: nothing new, nobody gets two.
    expect((await body<{ count: number }>(await formsPost(json("/x", {}), p("sessionId", ids.session!)))).count).toBe(0);
    for (const k of ["s1", "s2", "s3"]) ids[`form_${k}`] = (await db.examForm.findUniqueOrThrow({ where: { sessionId_studentMembershipId: { sessionId: ids.session!, studentMembershipId: ids[k]! } } })).id;
  });

  it("refuses a form without attendance eligibility, and one without no-dues; a submitted form raises its fee as a demand", async () => {
    await as("S3", ids.aff!, "STUDENT");
    const short = await submitPost(json("/x", {}), p("formId", ids.form_s3!));
    expect(short.status).toBe(409);
    const form3 = await db.examForm.findUniqueOrThrow({ where: { id: ids.form_s3! } });
    expect(form3.status).toBe("DRAFT");
    expect(form3.eligible).toBe(false);

    dues.blocked.add(ids.s2!);
    await as("S2", ids.aff!, "STUDENT");
    const owing = await submitPost(json("/x", {}), p("formId", ids.form_s2!));
    expect(owing.status).toBe(409);
    // The refusal names the desk that still holds a line (LIFECYCLE-3).
    expect((await body<{ error: string }>(owing)).error).toContain("Library");
    expect((await db.examForm.findUniqueOrThrow({ where: { id: ids.form_s2! } })).noDues).toBe(false);
    dues.blocked.delete(ids.s2!);
    expect((await submitPost(json("/x", {}), p("formId", ids.form_s2!))).status).toBe(200);

    await as("S1", ids.aff!, "STUDENT");
    // Another student's form is not theirs to submit.
    expect((await submitPost(json("/x", {}), p("formId", ids.form_s3!))).status).toBe(404);
    expect((await submitPost(json("/x", {}), p("formId", ids.form_s1!))).status).toBe(200);
    const f1 = await db.examForm.findUniqueOrThrow({ where: { id: ids.form_s1! } });
    expect(f1.status).toBe("SUBMITTED");
    expect(f1.feePaise).toBe(20000);
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: f1.feeDemandId! } });
    expect(demand.netPaise).toBe(20000);
    expect(demand.studentMembershipId).toBe(ids.s1);
  });

  it("approves forms (a waived fee with its reason), locks them for the sittings and seats them on alternate seats", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    expect((await decidePost(json("/x", { approve: true, waiveFee: true }), p("formId", ids.form_s2!))).status).toBe(422);
    expect((await decidePost(json("/x", { approve: true, waiveFee: true, reason: "ZZ fee waived by the committee" }), p("formId", ids.form_s2!))).status).toBe(200);
    expect((await decidePost(json("/x", { approve: true }), p("formId", ids.form_s1!))).status).toBe(200);
    const f2 = await db.examForm.findUniqueOrThrow({ where: { id: ids.form_s2! } });
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: f2.feeDemandId! } })).status).toBe("WAIVED");
    expect((await statusPost(json("/x", { status: "CONDUCT" }), p("sessionId", ids.session!))).status).toBe(200);
    expect((await db.examForm.findUniqueOrThrow({ where: { id: ids.form_s1! } })).lockedAt).not.toBeNull();
    for (const [course, at] of [[ids.c1!, "2026-11-02T04:30:00.000Z"], [ids.c2!, "2026-11-04T04:30:00.000Z"]] as const) {
      expect((await schedulePost(json("/x", { courseId: course, at, durationMin: 180 }), p("sessionId", ids.session!))).status).toBe(200);
    }
    const schedules = await db.examSchedule.findMany({ where: { sessionId: ids.session! } });
    for (const s of schedules) expect((await roomsPost(json("/x", { scheduleId: s.id, name: "ZZ Hall A", capacity: 10 }), p("sessionId", ids.session!))).status).toBe(200);
    expect((await body<{ count: number }>(await seatingPost(json("/x", {}), p("sessionId", ids.session!)))).count).toBe(0);
    const seats = await db.seating.findMany({ where: { scheduleId: schedules[0]!.id }, orderBy: { seatNo: "asc" } });
    expect(seats.map((s) => s.seatNo)).toEqual([1, 3]);
    expect((await body<{ count: number }>(await ticketsPost(json("/x", {}), p("sessionId", ids.session!)))).count).toBe(2);
    ids.ticket1 = (await db.hallTicket.findUniqueOrThrow({ where: { formId: ids.form_s1! } })).id;
    await as("S1", ids.aff!, "STUDENT");
    const pdf = await ticketPdf(get("/x"), p("ticketId", ids.ticket1!));
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    await as("S3", ids.aff!, "STUDENT");
    expect((await ticketPdf(get("/x"), p("ticketId", ids.ticket1!))).status).toBe(404);
  });

  it("takes external marks only when two people agree: a mismatch is listed, then matched", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const enter = (who: "Controller" | "Admin", course: string, entries: [string, number][]) => marksPost(json("/x", { courseId: course, entries: entries.map(([studentMembershipId, marks]) => ({ studentMembershipId, marks, absent: false })) }), p("sessionId", ids.session!));
    expect((await body<{ pending: number }>(await enter("Controller", ids.c1!, [[ids.s1!, 50], [ids.s2!, 24]]))).pending).toBe(2);
    // The double entry is blind (campaign S-23): the controller reads their own figure, the second entrant only that one exists.
    type Sheet = { rows: { studentMembershipId: string; entry1: { milli: number | null; by: string } | null }[] };
    const entry1Of = async () => (await body<Sheet>(await marksGet(get(`/x?courseId=${ids.c1}`), p("sessionId", ids.session!)))).rows.find((r) => r.studentMembershipId === ids.s1)!.entry1;
    expect((await entry1Of())?.milli).toBe(50_000);
    await as("Admin", ids.aff!, "ADMIN");
    expect(await entry1Of()).toMatchObject({ milli: null, by: "ZZ Ex Controller" });
    const second = await body<{ matched: number; mismatched: number }>(await enter("Admin", ids.c1!, [[ids.s1!, 45], [ids.s2!, 24]]));
    // Both entered: both figures shown, which settling the mismatch needs.
    expect((await entry1Of())?.milli).toBe(50_000);
    expect(second).toMatchObject({ matched: 1, mismatched: 1 });
    expect((await body<{ mismatches: number }>(await marksGet(get(`/x?courseId=${ids.c1}`), p("sessionId", ids.session!)))).mismatches).toBe(1);
    expect((await body<{ matched: number; mismatched: number }>(await enter("Admin", ids.c1!, [[ids.s1!, 50]]))).matched).toBe(2);
    // The principal enters no marks.
    await as("Principal", ids.aff!, "PRINCIPAL");
    expect((await enter("Controller", ids.c1!, [[ids.s1!, 50]])).status).toBe(403);
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    await enter("Controller", ids.c2!, [[ids.s1!, 60], [ids.s2!, 30]]);
    await as("Admin", ids.aff!, "ADMIN");
    expect((await body<{ matched: number }>(await enter("Admin", ids.c2!, [[ids.s1!, 60], [ids.s2!, 30]]))).matched).toBe(2);
  });

  it("changes nothing with grace until the principal approves it, and only the principal may", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    // Too much grace for the scheme's cap (5 a course).
    expect((await gracePost(json("/x", { courseId: ids.c1, studentMembershipId: ids.s2, marks: 6, rule: "TO_PASS", reason: "ZZ ordinance grace" }), p("sessionId", ids.session!))).status).toBe(422);
    const proposed = await gracePost(json("/x", { courseId: ids.c1, studentMembershipId: ids.s2, marks: 4, rule: "TO_PASS", reason: "ZZ ordinance grace" }), p("sessionId", ids.session!));
    expect(proposed.status).toBe(200);
    ids.grace = (await body<{ id: string }>(proposed)).id;
    expect((await runPost(json("/x", {}), p("sessionId", ids.session!))).status).toBe(200);
    const before = await body<{ rows: { studentMembershipId: string; status: string; courses: { courseId: string; status: string }[] }[] }>(await resultsGet(get("/x"), p("sessionId", ids.session!)));
    const s2 = before.rows.find((r) => r.studentMembershipId === ids.s2)!;
    expect(s2.status).toBe("ATKT");
    expect(s2.courses.find((c) => c.courseId === ids.c1)!.status).toBe("ATKT");
    // The controller cannot decide their own proposal.
    expect((await graceDecidePost(json("/x", { approve: true }), p("graceId", ids.grace!))).status).toBe(403);
    await as("Principal", ids.aff!, "PRINCIPAL");
    expect((await graceDecidePost(json("/x", { approve: true }), p("graceId", ids.grace!))).status).toBe(200);
    const versions = await db.examMark.findMany({ where: { sessionId: ids.session!, courseId: ids.c1!, studentMembershipId: ids.s2! }, orderBy: { version: "asc" } });
    expect(versions.map((v) => [v.version, v.source, v.graceMilli])).toEqual([
      [1, "DOUBLE_ENTRY", 0],
      [2, "GRACE", 4000],
    ]);
  });

  it("computes the SGPA as a hand computation does, and publishes", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const run = await runPost(json("/x", {}), p("sessionId", ids.session!));
    ids.run1 = (await body<{ id: string }>(run)).id;
    const r = await body<{ rows: { studentMembershipId: string; sgpa: number; status: string; cls: string | null; creditsEarned: number }[] }>(await resultsGet(get("/x"), p("sessionId", ids.session!)));
    // S1: Mechanics 24 + 50 = 74 % → A (8) on 3 credits; Optics 20 + 60 = 80 % → A+ (9) on 4. (3×8 + 4×9) ÷ 7 = 8.571…
    expect(r.rows.find((x) => x.studentMembershipId === ids.s1)).toMatchObject({ sgpa: 8.57, status: "PASS", cls: "DISTINCTION", creditsEarned: 7 });
    // S2 with the grace: 15 + 24 + 4 = 43 % → P (4); 18 + 30 = 48 % → P (4). 28 ÷ 7 = 4.
    expect(r.rows.find((x) => x.studentMembershipId === ids.s2)).toMatchObject({ sgpa: 4, status: "PASS", cls: "PASS" });
    expect((await publishPost(json("/x", { runId: ids.run1 }), p("sessionId", ids.session!))).status).toBe(200);
    expect((await db.creditPush.findUniqueOrThrow({ where: { studentMembershipId_termId: { studentMembershipId: ids.s1!, termId: ids.term! } } })).creditsTenths).toBe(70);
    // The push reads what was sent before whether the bank is connected (W-12): another college's term is 404, a bad id 422.
    const stub = process.env.ABC_STUB_SEND;
    delete process.env.ABC_STUB_SEND;
    try {
      expect((await creditsPushPost(json("/x", { termId: "cnotaterm0000000000000000" }))).status).toBe(404);
      expect((await creditsPushPost(json("/x", { termId: "x" }))).status).toBe(422);
      expect((await creditsPushPost(json("/x", { termId: ids.term }))).status).toBe(409);
      process.env.ABC_STUB_SEND = "1";
      expect((await creditsPushPost(json("/x", { termId: ids.term }))).status).toBe(200);
    } finally {
      if (stub === undefined) delete process.env.ABC_STUB_SEND;
      else process.env.ABC_STUB_SEND = stub;
    }
  });

  it("makes a change after publication a new mark row and a new run, keeping the published one as superseded", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    // Double entry is closed now: the change is a correction with a reason.
    expect((await marksPost(json("/x", { courseId: ids.c2, entries: [{ studentMembershipId: ids.s1, marks: 70, absent: false }] }), p("sessionId", ids.session!))).status).toBe(409);
    expect((await correctPost(json("/x", { courseId: ids.c2, studentMembershipId: ids.s1, marks: 70, absent: false, reason: "ZZ totalling error found" }), p("sessionId", ids.session!))).status).toBe(200);
    const rows = await db.examMark.findMany({ where: { sessionId: ids.session!, courseId: ids.c2!, studentMembershipId: ids.s1! }, orderBy: { version: "asc" } });
    expect(rows.map((x) => [x.version, x.externalMilli, x.source])).toEqual([
      [1, 60000, "DOUBLE_ENTRY"],
      [2, 70000, "CORRECTION"],
    ]);
    expect((await runPost(json("/x", {}), p("sessionId", ids.session!))).status).toBe(422);
    const run2 = await body<{ id: string }>(await runPost(json("/x", { reason: "ZZ correction to Optics" }), p("sessionId", ids.session!)));
    // A run that changes a published result is the principal's to publish, never the controller's alone (campaign S-10).
    const alone = await publishPost(json("/x", { runId: run2.id }), p("sessionId", ids.session!));
    expect(alone.status).toBe(403);
    expect((await db.resultRun.findUniqueOrThrow({ where: { id: run2.id } })).status).toBe("DRAFT");
    expect(await db.notification.count({ where: { userId: users.Principal, schoolId: ids.aff!, url: { contains: "/results" } } })).toBeGreaterThan(0);
    await as("Principal", ids.aff!, "PRINCIPAL");
    expect((await publishPost(json("/x", { runId: run2.id }), p("sessionId", ids.session!))).status).toBe(200);
    expect((await db.resultRun.findUniqueOrThrow({ where: { id: run2.id } })).publishedByUserId).toBe(users.Principal);
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const runs = await db.resultRun.findMany({ where: { sessionId: ids.session! }, orderBy: { number: "asc" } });
    expect(runs.map((x) => x.status)).toEqual(["SUPERSEDED", "PUBLISHED"]);
    // S1's Optics is now 20 + 70 = 90 % → O (10): (24 + 40) ÷ 7 = 9.14.
    expect((await db.termResult.findUniqueOrThrow({ where: { runId_studentMembershipId: { runId: run2.id, studentMembershipId: ids.s1! } } })).sgpaHundredths).toBe(914);
    expect((await db.termResult.findUniqueOrThrow({ where: { runId_studentMembershipId: { runId: ids.run1!, studentMembershipId: ids.s1! } } })).sgpaHundredths).toBe(857);
  });

  it("changes a result on revaluation only through a new run", async () => {
    await as("S2", ids.aff!, "STUDENT");
    const asked = await revalAskPost(json("/api/v1/exam-cell/mine/revaluations", { sessionId: ids.session, courseId: ids.c2, kind: "REVAL" }));
    expect(asked.status).toBe(200);
    ids.reval = (await body<{ id: string }>(asked)).id;
    expect((await revalAskPost(json("/api/v1/exam-cell/mine/revaluations", { sessionId: ids.session, courseId: ids.c2, kind: "REVAL" }))).status).toBe(409);
    const r = await db.revaluation.findUniqueOrThrow({ where: { id: ids.reval! } });
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: r.feeDemandId! } })).netPaise).toBe(30000);
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    expect((await revalDecidePost(json("/x", { outcome: "CHANGED", marks: 40 }), p("revaluationId", ids.reval!))).status).toBe(200);
    const published = await db.resultRun.findFirstOrThrow({ where: { sessionId: ids.session!, status: "PUBLISHED" } });
    const optics = () => db.courseResult.findFirstOrThrow({ where: { runId: published.id, studentMembershipId: ids.s2!, courseId: ids.c2! } });
    expect((await optics()).externalMilli).toBe(30000);
    const run3 = await body<{ id: string }>(await runPost(json("/x", { reason: "ZZ revaluation of Optics" }), p("sessionId", ids.session!)));
    await as("Principal", ids.aff!, "PRINCIPAL");
    expect((await publishPost(json("/x", { runId: run3.id }), p("sessionId", ids.session!))).status).toBe(200);
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    // 18 + 40 = 58 % → B (6): (3×4 + 4×6) ÷ 7 = 5.14; the run before keeps its 4.
    expect((await db.termResult.findUniqueOrThrow({ where: { runId_studentMembershipId: { runId: run3.id, studentMembershipId: ids.s2! } } })).sgpaHundredths).toBe(514);
    expect((await optics()).externalMilli).toBe(30000);
  });

  it("refuses a backlog past the seven-year limit and takes one within it", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const next = await body<{ id: string }>(await sessionsPost(json("/api/v1/exam-cell/sessions", { name: `ZZ Supplementary ${STAMP}`, kind: "SUPPLEMENTARY", termId: ids.term, feePerCoursePaise: 0, feePerBacklogPaise: 0, photocopyFeePaise: 0, revalFeePaise: 0, lateFeeSlabs: [] })));
    await statusPost(json("/x", { status: "FORMS" }), p("sessionId", next.id));
    const eightYears = new Date(Date.now() - 8 * 366 * 86_400_000);
    await db.backlog.create({ data: { schoolId: ids.aff!, studentMembershipId: ids.s3!, courseId: ids.c1!, firstFailedSessionId: ids.session!, firstFailedAt: eightYears } });
    await db.backlog.create({ data: { schoolId: ids.aff!, studentMembershipId: ids.s3!, courseId: ids.c2!, firstFailedSessionId: ids.session!, firstFailedAt: new Date(Date.now() - 366 * 86_400_000) } });
    await as("S3", ids.aff!, "STUDENT");
    const old = await backlogPost(json("/api/v1/exam-cell/mine/backlogs", { sessionId: next.id, courseId: ids.c1 }));
    expect(old.status).toBe(409);
    expect((await backlogPost(json("/api/v1/exam-cell/mine/backlogs", { sessionId: next.id, courseId: ids.c2 }))).status).toBe(200);
    const mine = await body<{ backlogs: { courseId: string; status: string }[] }>(await mineGet(get("/api/v1/exam-cell/mine")));
    expect(mine.backlogs.find((b) => b.courseId === ids.c1)!.status).toBe("LAPSED");
  });

  it("lets a guardian read a minor's results, and an adult's only under the RESULTS grant", async () => {
    await as("Parent", null, "PARENT");
    expect((await mineGet(get(`/api/v1/exam-cell/mine?childId=${ids.s1}`))).status).toBe(200);
    expect((await mineGet(get(`/api/v1/exam-cell/mine?childId=${ids.s2}`))).status).toBe(403);
    await db.studentConsent.create({ data: { schoolId: ids.aff!, studentMembershipId: ids.s2!, grant: "RESULTS" } });
    const granted = await mineGet(get(`/api/v1/exam-cell/mine?childId=${ids.s2}`));
    expect(granted.status).toBe(200);
    expect((await body<{ canAct: boolean; results: unknown[] }>(granted)).canAct).toBe(false);
  });

  it("issues a grade card the public check confirms, from its college's fence only", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    const issued = await body<{ id: string }>(await documentsPost(json("/api/v1/exam-cell/documents", { kind: "GRADE_CARD", studentMembershipId: ids.s1 })));
    const doc = await db.examDocument.findUniqueOrThrow({ where: { id: issued.id } });
    expect(doc.serial).toMatch(/^GC\/2026–27\/0001$/);
    expect(await checkExamDocument(ids.aff!, doc.code)).toMatchObject({ valid: true, kind: "GRADE_CARD", serial: doc.serial });
    expect((await checkExamDocument(ids.auto!, doc.code)).valid).toBe(false);
    // A degree is an autonomous college's alone.
    expect((await documentsPost(json("/api/v1/exam-cell/documents", { kind: "DEGREE", studentMembershipId: ids.s1 }))).status).toBe(403);
  });

  it("answers the doors of conduct 403 at an affiliated college and 200 at an autonomous one", async () => {
    await as("Controller", ids.aff!, "EXAM_CONTROLLER");
    expect((await conductGet(get("/x"), p("sessionId", ids.session!))).status).toBe(403);
    await as("AutoController", ids.auto!, "EXAM_CONTROLLER");
    const made = await body<{ id: string }>(await sessionsPost(json("/api/v1/exam-cell/sessions", { name: `ZZ Autonomous ${STAMP}`, kind: "REGULAR", termId: ids.autoTerm, feePerCoursePaise: 0, feePerBacklogPaise: 0, photocopyFeePaise: 0, revalFeePaise: 0, lateFeeSlabs: [] })));
    ids.autoSession = made.id;
    expect((await conductGet(get("/x"), p("sessionId", made.id))).status).toBe(200);
    // An autonomous college pastes no "university file": its marks are entered twice (campaign S-10).
    const imported = await importPost(json("/x", { text: "PRN,Course,External\nX,Y,50" }), p("sessionId", made.id));
    expect(imported.status).toBe(403);
  });

  it("keeps a question paper sealed, opened only into the response, every opening logged and audited", async () => {
    await as("AutoController", ids.auto!, "EXAM_CONTROLLER");
    const sch = await schedulePost(json("/x", { courseId: ids.autoCourse, at: "2026-11-10T04:30:00.000Z", durationMin: 180 }), p("sessionId", ids.autoSession!));
    const scheduleId = (await body<{ id: string }>(sch)).id;
    const assigned = await body<{ id: string }>(await papersPost(json("/x", { scheduleId, setterMembershipId: ids.autoFaculty }), p("sessionId", ids.autoSession!)));
    const pdf = Buffer.from("%PDF-1.4\n% ZZ question paper: Q1 explain inertia\n%%EOF\n", "latin1");
    await as("AutoFaculty", ids.auto!, "FACULTY");
    expect((await paperSubmitPost(json("/x", { fileName: "zz-paper.pdf", mime: "application/pdf", dataBase64: pdf.toString("base64"), coMap: [{ question: "Q1", co: "CO1", marks: 10 }] }), p("paperId", assigned.id))).status).toBe(200);
    const stored = await db.questionPaper.findUniqueOrThrow({ where: { id: assigned.id } });
    expect(stored.sealedBody).toBeTruthy();
    expect(stored.sealedBody!.includes(pdf.toString("base64"))).toBe(false);
    expect(stored.sealedBody!.includes("inertia")).toBe(false);
    // The setter cannot open it; the controller can.
    expect((await paperOpenGet(get("/x"), p("paperId", assigned.id))).status).toBe(403);
    await as("AutoController", ids.auto!, "EXAM_CONTROLLER");
    const opened = await paperOpenGet(get("/x"), p("paperId", assigned.id));
    expect(opened.status).toBe(200);
    expect(Buffer.from(await opened.arrayBuffer()).equals(pdf)).toBe(true);
    expect(JSON.parse((await db.questionPaper.findUniqueOrThrow({ where: { id: assigned.id } })).accessLogJson)).toHaveLength(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.auto!, action: "exam.paper.open", targetId: assigned.id } })).toBe(1);
  });

  it("stores each term's SGPA as its course rows give it (the data:audit check's rule)", async () => {
    const terms = await db.termResult.findMany({ where: { schoolId: ids.aff! } });
    expect(terms.length).toBeGreaterThan(0);
    for (const term of terms) {
      const rows = await db.courseResult.findMany({ where: { runId: term.runId, studentMembershipId: term.studentMembershipId } });
      expect(term.sgpaHundredths).toBe(sgpaHundredths(sgpaCourses(rows)));
    }
  });

  it("reads the session for the office, and refuses another college's controller", async () => {
    await as("Admin", ids.aff!, "ADMIN");
    const view = await body<{ runs: unknown[]; forms: unknown[] }>(await sessionGet(get("/x"), p("sessionId", ids.session!)));
    expect(view.runs).toHaveLength(3);
    expect(view.forms).toHaveLength(3);
    await as("AutoController", ids.auto!, "EXAM_CONTROLLER");
    expect((await sessionGet(get("/x"), p("sessionId", ids.session!))).status).toBe(404);
  });
});
