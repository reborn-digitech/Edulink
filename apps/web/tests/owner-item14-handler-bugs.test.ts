/**
 * The nine handler bugs item 13's reach audit found (owner's batch of 27
 * October 2026, item 14), each with a case that failed on the code before the
 * fix and an allowance beside it, so the fix is the refusal and nothing more.
 *
 *   1. remarks: a guardian of an adult college student starts a thread only
 *      with the student's MESSAGES grant, the rule the thread's own read keeps.
 *   2. co-scholastic: the {classId} in the path scopes the card, on the door
 *      and in the library the web page calls; another school's class is 404.
 *   3. file links: a timetable-only teacher reads their own handout and the
 *      pupils' attachments on the work they set, and nothing else of the class.
 *   4. leave: a FACULTY or HOD named as a register's cover writes no cover row,
 *      so the class is not counted covered and falls to the fallback cover.
 *   5. library: cancelling a reservation asks the MONEY grant that placing and
 *      viewing it ask.
 *   6. college substitutions: an HOD who heads no department reads no board.
 *   7. alumni meets: a meet already held takes no registration (409).
 *   8. research: the department is one of the college's, and a teacher's own.
 *   9. voice: course feedback is a currently REGISTERED student's alone.
 *  10. signatures: a settled line is answered only to the office, the head and
 *      the person whose line it is (the coordinator's addition from item 13's
 *      counted variant sweep).
 *
 * At ZZ tenants of this suite's own (people at @test.invalid), deleted by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { todayKey } from "@/lib/dates";
import { createThread } from "@/lib/remarks";
import { setCoScholastic, setRemark } from "@/lib/report-cards";
import { authorizeFileRead } from "@/lib/files";
import { decideLeave } from "@/lib/leave";
import { cancelReservation } from "@/lib/library";
import { lectureSubstitutions } from "@/lib/academics";
import { registerForMeet } from "@/lib/placement-alumni";
import { POST as coScholasticPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/co-scholastic/route";
import { POST as researchPost } from "@/app/api/v1/iqac/research/route";
import { GET as voiceGet } from "@/app/api/v1/voice/route";
import { POST as answerPost } from "@/app/api/v1/voice/surveys/[surveyId]/route";
import { POST as meetPost } from "@/app/api/v1/alumni/college/meets/[meetId]/route";
import { POST as signatureDecidePost } from "@/app/api/v1/office/signatures/[signatureId]/decide/route";
import { cardSetId } from "@/lib/signatures";
// A grant is one guardian's since TA-555 (14 November 2026): "the student grants X" is to each family guardian linked to them.
import { grantToGuardians } from "./consent-grants";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const EMAIL = (who: string) => `zz-item14-${who.toLowerCase()}-${STAMP}@test.invalid`;
const TODAY = todayKey(TZ);
const YESTERDAY = new Date(Date.parse(`${TODAY}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

type Person = { userId: string; membershipId: string; schoolId: string };
const ids = {
  school: "", school2: "", college: "", college2: "",
  klassA: "", klassB: "", klassL: "", klassX: "", cClass: "", period: "",
  cardA: "", cardB: "",
  d1: "", d2: "", otherD: "", o1: "", term: "",
  survey: "", meetHeld: "", meetToday: "", reservation: "", settledLine: "",
};
const P: Record<string, Person> = {};
const H1 = `zz-item14-h1-${STAMP}.pdf`; // the subject teacher's own handout
const P1 = `zz-item14-p1-${STAMP}.pdf`; // a pupil's attachment on that work
const H2 = `zz-item14-h2-${STAMP}.pdf`; // the form teacher's handout in the same class
const P2 = `zz-item14-p2-${STAMP}.pdf`; // a pupil's attachment on the form teacher's work

const prefs = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as never;
function ctxOf(p: Person | { userId: string }, role: string, schoolId?: string | null): ActiveContext {
  const membershipId = "membershipId" in p ? p.membershipId : null;
  const school = schoolId === undefined ? ("schoolId" in p ? p.schoolId : null) : schoolId;
  return { sessionId: "test-session", membershipId, schoolId: school, role: role as never, user: { id: p.userId, name: "ZZ Item14", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs } };
}
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
async function as(p: Person, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(p.userId, { schoolId: p.schoolId, role: role as never });
}

beforeAll(async () => {
  const school = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ Item14 ${tag} ${STAMP}`, slug: `zz-item14-${tag.toLowerCase()}-${STAMP}`, code: `ZI4${tag[0]}${SUFFIX}`, contactEmail: EMAIL(`${tag}-office`), timezone: TZ, locale: "en", kind, verifiedAt: new Date(), teachingDays: "0,1,2,3,4,5,6" }, select: { id: true } });
  ids.school = (await school("School", "SCHOOL")).id;
  ids.school2 = (await school("Other", "SCHOOL")).id;
  ids.college = (await school("College", "COLLEGE")).id;
  ids.college2 = (await school("Faraway", "COLLEGE")).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "IQAC", "LIBRARY", "ALUMNI"].map((module) => ({ schoolId: ids.college, module })) });
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college2, module: "ACADEMICS" }] });

  const person = async (key: string, schoolId: string, role: string, extra: { birthdate?: Date; joinedAt?: Date } = {}) => {
    const userId = (await db.user.create({ data: { name: `ZZ Item14 ${key}`, email: EMAIL(key), isMinor: false, ...(extra.birthdate ? { birthdate: extra.birthdate } : {}) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZI4${key.slice(0, 6)}${SUFFIX}` } : {}), ...(extra.joinedAt ? { joinedAt: extra.joinedAt } : {}) }, select: { id: true } })).id;
    P[key] = { userId, membershipId, schoolId };
    return P[key]!;
  };
  const guardian = async (key: string) => {
    const userId = (await db.user.create({ data: { name: `ZZ Item14 ${key}`, email: EMAIL(key) }, select: { id: true } })).id;
    P[key] = { userId, membershipId: "", schoolId: "" };
    return P[key]!;
  };

  /* ---- the school: classes A and B led by one form teacher, a subject teacher on A's timetable, a leaver. */
  await person("Admin", ids.school, "ADMIN");
  await person("Form", ids.school, "TEACHER");
  await person("Subject", ids.school, "TEACHER");
  await person("OtherTeacher", ids.school, "TEACHER");
  await person("Leaver", ids.school, "TEACHER");
  await person("Cover", ids.school, "TEACHER");
  await person("SchoolFaculty", ids.school, "FACULTY");
  await person("SchoolHod", ids.school, "HOD");
  await person("Pupil", ids.school, "STUDENT");
  await person("PupilB", ids.school, "STUDENT");
  await person("OtherAdmin", ids.school2, "ADMIN");
  const klass = (schoolId: string, name: string, code: string) => db.class.create({ data: { schoolId, name, gradeLevel: "6", joinCode: `${code}${SUFFIX}` }, select: { id: true } });
  ids.klassA = (await klass(ids.school, "ZZ Item14 6 · A", "ZIA")).id;
  ids.klassB = (await klass(ids.school, "ZZ Item14 6 · B", "ZIB")).id;
  ids.klassL = (await klass(ids.school, "ZZ Item14 7 · L", "ZIL")).id;
  ids.klassX = (await klass(ids.school2, "ZZ Item14 Other 6 · A", "ZIX")).id;
  await db.classTeacher.createMany({
    data: [
      { classId: ids.klassA, schoolId: ids.school, teacherMembershipId: P.Form!.membershipId, role: "LEAD" },
      { classId: ids.klassB, schoolId: ids.school, teacherMembershipId: P.Form!.membershipId, role: "LEAD" },
      { classId: ids.klassL, schoolId: ids.school, teacherMembershipId: P.Leaver!.membershipId, role: "LEAD", canTakeAttendance: true },
    ],
  });
  await db.enrollment.createMany({
    data: [
      { classId: ids.klassA, schoolId: ids.school, studentMembershipId: P.Pupil!.membershipId, status: "ACTIVE" },
      { classId: ids.klassB, schoolId: ids.school, studentMembershipId: P.PupilB!.membershipId, status: "ACTIVE" },
    ],
  });
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 1", startMinute: 480, endMinute: 525, position: 1 }, select: { id: true } })).id;
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.klassA, periodId: ids.period, weekday: 1, subject: "English", teacherMembershipId: P.Subject!.membershipId } });
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.klassB, periodId: ids.period, weekday: 2, subject: "English", teacherMembershipId: P.OtherTeacher!.membershipId } });

  const card = (classId: string, student: Person) => db.reportCard.create({ data: { schoolId: ids.school, classId, studentMembershipId: student.membershipId, title: "ZZ Item14 Term 1", fromDateKey: "2026-06-01", toDateKey: "2026-09-30" }, select: { id: true } });
  ids.cardA = (await card(ids.klassA, P.Pupil!)).id;
  ids.cardB = (await card(ids.klassB, P.PupilB!)).id;

  const attach = (fileId: string) => JSON.stringify([{ fileId, name: "work.pdf", size: 1234, mime: "application/pdf" }]);
  const ownWork = await db.assignment.create({ data: { schoolId: ids.school, classId: ids.klassA, authorMembershipId: P.Subject!.membershipId, subject: "English", title: "ZZ Item14 poem", publishedAt: new Date(), attachments: attach(H1) }, select: { id: true } });
  const formWork = await db.assignment.create({ data: { schoolId: ids.school, classId: ids.klassA, authorMembershipId: P.Form!.membershipId, title: "ZZ Item14 fractions", publishedAt: new Date(), attachments: attach(H2) }, select: { id: true } });
  await db.submission.create({ data: { schoolId: ids.school, assignmentId: ownWork.id, studentMembershipId: P.Pupil!.membershipId, status: "SUBMITTED", submittedAt: new Date(), attachments: attach(P1) } });
  await db.submission.create({ data: { schoolId: ids.school, assignmentId: formWork.id, studentMembershipId: P.Pupil!.membershipId, status: "SUBMITTED", submittedAt: new Date(), attachments: attach(P2) } });

  // A teacher's line on class A's set of cards, already signed by its form teacher.
  ids.settledLine = (await db.paperSignature.create({ data: { schoolId: ids.school, paperKind: "REPORT_CARD_SET", paperId: cardSetId(ids.klassA, "ZZ Item14 Term 1"), slot: "LEFT", role: "TEACHER", status: "SIGNED", signerUserId: P.Form!.userId, signerName: "ZZ Item14 Form", decidedAt: new Date() }, select: { id: true } })).id;

  /* ---- the college: two departments, an HOD with one and an HOD with none, faculty, an adult student and their guardian. */
  await person("CAdmin", ids.college, "ADMIN");
  await person("CIqac", ids.college, "IQAC");
  await person("HodHead", ids.college, "HOD");
  await person("HodNone", ids.college, "HOD");
  await person("F1", ids.college, "FACULTY");
  await person("F2", ids.college, "FACULTY");
  await person("Adult", ids.college, "STUDENT", { birthdate: new Date("2005-01-15T00:00:00Z") });
  await person("SReg", ids.college, "STUDENT", { birthdate: new Date("2005-02-15T00:00:00Z") });
  await person("SDrop", ids.college, "STUDENT", { birthdate: new Date("2005-03-15T00:00:00Z") });
  await person("Alumnus", ids.college, "ALUMNUS", { joinedAt: new Date("2020-06-01T00:00:00Z") });
  await person("FarFaculty", ids.college2, "FACULTY");
  await guardian("Guardian");
  await db.guardianship.create({ data: { parentUserId: P.Guardian!.userId, studentMembershipId: P.Adult!.membershipId, studentSchoolId: ids.college, relation: "PARENT", status: "ACTIVE" } });

  ids.cClass = (await klass(ids.college, "ZZ Item14 FY · A", "ZIC")).id;
  await db.classTeacher.create({ data: { classId: ids.cClass, schoolId: ids.college, teacherMembershipId: P.F1!.membershipId, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: ids.cClass, schoolId: ids.college, studentMembershipId: P.Adult!.membershipId, status: "ACTIVE" } });

  ids.d1 = (await db.department.create({ data: { schoolId: ids.college, code: `ZD1${SUFFIX}`, name: "ZZ Item14 Chemistry", hodMembershipId: P.HodHead!.membershipId }, select: { id: true } })).id;
  ids.d2 = (await db.department.create({ data: { schoolId: ids.college, code: `ZD2${SUFFIX}`, name: "ZZ Item14 Physics" }, select: { id: true } })).id;
  ids.otherD = (await db.department.create({ data: { schoolId: ids.college2, code: `ZD3${SUFFIX}`, name: "ZZ Item14 Faraway Chemistry" }, select: { id: true } })).id;
  await db.departmentFaculty.createMany({ data: [{ schoolId: ids.college, departmentId: ids.d1, membershipId: P.F1!.membershipId }, { schoolId: ids.college, departmentId: ids.d2, membershipId: P.F2!.membershipId }] });
  const programme = await db.programme.create({ data: { schoolId: ids.college, departmentId: ids.d1, code: `ZP${SUFFIX}`, name: "ZZ Item14 BSc Chemistry", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: ids.college, programmeId: programme.id, name: "ZZ 2026", effectiveYear: 2026 }, select: { id: true } });
  const course = await db.course.create({ data: { schoolId: ids.college, schemeId: scheme.id, code: `ZCH${SUFFIX}`, name: "ZZ Item14 Organic", semester: 1 }, select: { id: true } });
  ids.term = (await db.academicTerm.create({ data: { schoolId: ids.college, name: "ZZ Item14 term", academicYear: "2026-27", startsOn: "2026-01-01", endsOn: "2099-12-31", registrationOpensOn: "2026-01-01", registrationClosesOn: "2099-12-31" }, select: { id: true } })).id;
  ids.o1 = (await db.courseOffering.create({ data: { schoolId: ids.college, termId: ids.term, courseId: course.id, facultyMembershipId: P.F1!.membershipId }, select: { id: true } })).id;
  await db.courseRegistration.createMany({
    data: [
      { schoolId: ids.college, studentMembershipId: P.SReg!.membershipId, offeringId: ids.o1, termId: ids.term, kind: "REGULAR", status: "REGISTERED" },
      { schoolId: ids.college, studentMembershipId: P.SDrop!.membershipId, offeringId: ids.o1, termId: ids.term, kind: "REGULAR", status: "DROPPED" },
    ],
  });
  // F1 is away today and their lecture stands on the board.
  await db.staffAttendance.create({ data: { schoolId: ids.college, membershipId: P.F1!.membershipId, dateKey: TODAY, status: "ABSENT" } });
  await db.lecture.create({ data: { schoolId: ids.college, offeringId: ids.o1, dateKey: TODAY, startMinute: 600, endMinute: 660 } });
  ids.survey = (await db.survey.create({ data: { schoolId: ids.college, kind: "COURSE_FEEDBACK", title: "ZZ Item14 Organic feedback", offeringId: ids.o1, termId: ids.term, opensOn: "2026-01-01", closesOn: "2099-12-31", questionsJson: "[]" }, select: { id: true } })).id;

  ids.meetHeld = (await db.alumniMeet.create({ data: { schoolId: ids.college, title: "ZZ Item14 reunion held", onKey: YESTERDAY, createdByUserId: P.CAdmin!.userId }, select: { id: true } })).id;
  ids.meetToday = (await db.alumniMeet.create({ data: { schoolId: ids.college, title: "ZZ Item14 reunion today", onKey: TODAY, createdByUserId: P.CAdmin!.userId }, select: { id: true } })).id;

  const title = await db.libraryTitle.create({ data: { schoolId: ids.college, title: "ZZ Item14 Organic Chemistry" }, select: { id: true } });
  const member = await db.libraryMember.create({ data: { schoolId: ids.college, membershipId: P.Adult!.membershipId, kind: "STUDENT", cardNumber: `ZL${SUFFIX}` }, select: { id: true } });
  ids.reservation = (await db.libraryReservation.create({ data: { schoolId: ids.college, titleId: title.id, memberId: member.id, placedByUserId: P.Guardian!.userId }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.school, ids.school2, ids.college, ids.college2].filter(Boolean);
  const users = Object.values(P).map((p) => p.userId);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { userId: { in: users } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  expect(await db.school.count({ where: { id: { in: schools } } })).toBe(0);
  await db.$disconnect();
});

describe("1. a guardian starting a remark thread about an adult college student", () => {
  const input = () => ({ studentMembershipId: P.Adult!.membershipId, teacherMembershipId: P.F1!.membershipId, subject: "ZZ Item14 a word", body: "ZZ Item14 How is the term going?" });

  it("is refused without the MESSAGES grant, two presses at once both refused and no thread written", async () => {
    const guardianCtx = ctxOf(P.Guardian!, "PARENT", null);
    const both = await Promise.allSettled([createThread(guardianCtx, input()), createThread(guardianCtx, input())]);
    for (const r of both) {
      expect(r.status).toBe("rejected");
      expect((r as PromiseRejectedResult).reason).toMatchObject({ key: "consent.refuseNotGranted" });
    }
    expect(await db.remarkThread.count({ where: { studentMembershipId: P.Adult!.membershipId } })).toBe(0);
    expect(await db.notification.count({ where: { userId: { in: [P.Adult!.userId, P.F1!.userId] }, schoolId: ids.college } })).toBe(0);
  });

  it("is let through once the student grants MESSAGES", async () => {
    await grantToGuardians(db, ids.college, P.Adult!.membershipId, "MESSAGES");
    const made = await createThread(ctxOf(P.Guardian!, "PARENT", null), input());
    expect(await db.remarkThread.count({ where: { id: made.threadId, studentMembershipId: P.Adult!.membershipId } })).toBe(1);
    await db.studentConsent.deleteMany({ where: { studentMembershipId: P.Adult!.membershipId, grant: "MESSAGES" } });
  });
});

describe("2. the co-scholastic door scopes the card to the class in its path", () => {
  const post = async (classId: string, cardId: string) => coScholasticPost(json(`/api/v1/teaching/classes/${classId}/report-cards/co-scholastic`, { cardId, grades: [] }), params({ classId }));

  it("refuses another class's card through this class's URL, for the lead and for the office (404)", async () => {
    await as(P.Form!, "TEACHER");
    expect((await post(ids.klassA, ids.cardB)).status).toBe(404);
    await as(P.Admin!, "ADMIN");
    expect((await post(ids.klassA, ids.cardB)).status).toBe(404);
  });

  it("refuses another school's class in the path (404)", async () => {
    await as(P.Admin!, "ADMIN");
    expect((await post(ids.klassX, ids.cardA)).status).toBe(404);
  });

  it("writes a card through its own class's URL", async () => {
    await as(P.Form!, "TEACHER");
    expect((await post(ids.klassA, ids.cardA)).status).toBe(200);
    await as(P.Admin!, "ADMIN");
    expect((await post(ids.klassB, ids.cardB)).status).toBe(200);
  });

  it("holds the web page's actions to the page's class too (setCoScholastic and setRemark with the class)", async () => {
    const lead = ctxOf(P.Form!, "TEACHER");
    expect(await setCoScholastic(lead, ids.cardB, [], { classId: ids.klassA })).toEqual({ ok: false, errorKey: "reportCards.notInSchool" });
    expect(await setRemark(lead, ids.cardB, "ZZ Item14 wrong page", { classId: ids.klassA })).toEqual({ ok: false, errorKey: "reportCards.notInSchool" });
    expect(await db.reportCard.findUniqueOrThrow({ where: { id: ids.cardB }, select: { remark: true } })).toEqual({ remark: null });
    expect(await setCoScholastic(lead, ids.cardA, [], { classId: ids.klassA })).toEqual({ ok: true });
    expect(await setRemark(lead, ids.cardA, "ZZ Item14 a good term", { classId: ids.klassA })).toEqual({ ok: true });
  });
});

describe("3. file links for a teacher the timetable sends to the class", () => {
  it("opens their own handout and a pupil's attachment on that work", async () => {
    const subject = ctxOf(P.Subject!, "TEACHER");
    expect((await authorizeFileRead(H1, subject)).allowed).toBe(true);
    expect((await authorizeFileRead(P1, subject)).allowed).toBe(true);
  });

  it("keeps the form teacher's work and its submissions from them, and the class from a teacher of another class", async () => {
    const subject = ctxOf(P.Subject!, "TEACHER");
    expect((await authorizeFileRead(H2, subject)).allowed).toBe(false);
    expect((await authorizeFileRead(P2, subject)).allowed).toBe(false);
    const other = ctxOf(P.OtherTeacher!, "TEACHER");
    for (const f of [H1, P1, H2, P2]) expect((await authorizeFileRead(f, other)).allowed, f).toBe(false);
  });

  it("still opens everything of the class to its form teacher", async () => {
    const form = ctxOf(P.Form!, "TEACHER");
    for (const f of [H1, P1, H2, P2]) expect((await authorizeFileRead(f, form)).allowed, f).toBe(true);
  });
});

describe("4. a leave decision whose cover is a FACULTY or HOD member", () => {
  const leave = () => db.leaveRequest.create({ data: { schoolId: ids.school, teacherMembershipId: P.Leaver!.membershipId, fromDateKey: TODAY, toDateKey: TODAY, reason: "ZZ Item14 away" }, select: { id: true } });

  it("does not count the class covered: the register falls to the fallback cover, which is written", async () => {
    const req = await leave();
    const result = await decideLeave(ctxOf(P.Admin!, "ADMIN"), req.id, "APPROVED", {
      coverAssignments: [{ classId: ids.klassL, subject: "English", coverMembershipId: P.SchoolFaculty!.membershipId }],
      coverMembershipId: P.Cover!.membershipId,
    });
    expect(result.ok).toBe(true);
    const rows = await db.attendanceCover.findMany({ where: { leaveRequestId: req.id }, select: { classId: true, coveringMembershipId: true } });
    expect(rows).toEqual([{ classId: ids.klassL, coveringMembershipId: P.Cover!.membershipId }]);
    expect(result.coversCreated).toBe(1);
  });

  it("says none when an HOD is the only cover named and no fallback is", async () => {
    const req = await leave();
    const result = await decideLeave(ctxOf(P.Admin!, "ADMIN"), req.id, "APPROVED", {
      coverAssignments: [{ classId: ids.klassL, subject: "English", coverMembershipId: P.SchoolHod!.membershipId }],
    });
    expect(result.ok).toBe(true);
    expect(result.coversCreated).toBe(0);
    expect(await db.attendanceCover.count({ where: { leaveRequestId: req.id } })).toBe(0);
  });
});

describe("5. cancelling a library reservation for an adult college student", () => {
  it("is refused without MONEY, as placing and viewing it are", async () => {
    await expect(cancelReservation(ctxOf(P.Guardian!, "PARENT", null), ids.reservation)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    expect((await db.libraryReservation.findUniqueOrThrow({ where: { id: ids.reservation }, select: { cancelledAt: true } })).cancelledAt).toBeNull();
  });

  it("is the guardian's once MONEY is granted", async () => {
    await grantToGuardians(db, ids.college, P.Adult!.membershipId, "MONEY");
    const row = await cancelReservation(ctxOf(P.Guardian!, "PARENT", null), ids.reservation);
    expect(row.id).toBe(ids.reservation);
    expect((await db.libraryReservation.findUniqueOrThrow({ where: { id: ids.reservation }, select: { cancelledAt: true } })).cancelledAt).not.toBeNull();
  });
});

describe("6. the college's substitution board for an HOD", () => {
  it("shows an HOD who heads no department no lecture and no candidate", async () => {
    const board = await lectureSubstitutions(ctxOf(P.HodNone!, "HOD"), TODAY);
    expect(board.lectures).toEqual([]);
    expect(board.candidates).toEqual([]);
  });

  it("shows the heading HOD their department's away lecture, and the office the whole college's", async () => {
    const mine = await lectureSubstitutions(ctxOf(P.HodHead!, "HOD"), TODAY);
    expect(mine.lectures.map((l) => l.courseName)).toEqual(["ZZ Item14 Organic"]);
    const office = await lectureSubstitutions(ctxOf(P.CAdmin!, "ADMIN"), TODAY);
    expect(office.lectures.map((l) => l.courseName)).toEqual(["ZZ Item14 Organic"]);
  });
});

describe("7. an alumnus registering for a meet", () => {
  it("is refused 409 with a sentence once the meet has been held, and nothing is written", async () => {
    await as(P.Alumnus!, "ALUMNUS");
    const res = await meetPost(json(`/api/v1/alumni/college/meets/${ids.meetHeld}`, { going: true }), params({ meetId: ids.meetHeld }));
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toBe("That meet has already been held.");
    await expect(registerForMeet(ctxOf(P.Alumnus!, "ALUMNUS"), ids.meetHeld, true)).rejects.toMatchObject({ key: "placement.refuseMeetHeld", status: 409 });
    expect(await db.alumniMeetRegistration.count({ where: { meetId: ids.meetHeld } })).toBe(0);
  });

  it("registers for a meet held today", async () => {
    const view = await registerForMeet(ctxOf(P.Alumnus!, "ALUMNUS"), ids.meetToday, true);
    expect(view).toMatchObject({ id: ids.meetToday, mine: true, registered: 1 });
  });
});

describe("8. a research item's department", () => {
  const item = (departmentId: string | null) => ({ kind: "BOOK", title: `ZZ Item14 book ${departmentId ?? "none"}`, year: 2026, departmentId });

  it("is refused 422 when it is no department of this college, or another department than the teacher's own", async () => {
    await as(P.F1!, "FACULTY");
    for (const d of ["zz-item14-no-such-department", ids.otherD, ids.d2]) {
      const res = await researchPost(json("/api/v1/iqac/research", item(d)));
      expect(res.status, d).toBe(422);
      expect(((await res.json()) as { issues?: Record<string, string> }).issues?.departmentId, d).toBeTruthy();
    }
    expect(await db.researchItem.count({ where: { schoolId: ids.college, departmentId: { in: ["zz-item14-no-such-department", ids.otherD, ids.d2] } } })).toBe(0);
  });

  it("is stored for the teacher's own department or none, and the desk may name any department of the college", async () => {
    await as(P.F1!, "FACULTY");
    expect((await researchPost(json("/api/v1/iqac/research", item(ids.d1)))).status).toBe(200);
    expect((await researchPost(json("/api/v1/iqac/research", item(null)))).status).toBe(200);
    await as(P.HodHead!, "HOD");
    expect((await researchPost(json("/api/v1/iqac/research", item(ids.d1)))).status).toBe(200);
    await as(P.CIqac!, "IQAC");
    expect((await researchPost(json("/api/v1/iqac/research", { ...item(ids.d2), facultyMembershipId: P.F2!.membershipId }))).status).toBe(200);
    await as(P.CIqac!, "IQAC");
    expect((await researchPost(json("/api/v1/iqac/research", item(ids.otherD)))).status).toBe(422);
  });
});

describe("9. course feedback for a student who dropped the course", () => {
  it("is neither listed nor answerable", async () => {
    await as(P.SDrop!, "STUDENT");
    const res = await voiceGet();
    expect(res.status).toBe(200);
    expect(((await res.json()) as { surveys: { id: string }[] }).surveys.map((s) => s.id)).not.toContain(ids.survey);
    await as(P.SDrop!, "STUDENT");
    expect((await answerPost(json(`/api/v1/voice/surveys/${ids.survey}`, { answers: {} }), params({ surveyId: ids.survey }))).status).toBe(404);
    expect(await db.surveyResponse.count({ where: { surveyId: ids.survey } })).toBe(0);
  });

  it("is listed for a student still registered on it", async () => {
    await as(P.SReg!, "STUDENT");
    const res = await voiceGet();
    expect(((await res.json()) as { surveys: { id: string }[] }).surveys.map((s) => s.id)).toContain(ids.survey);
  });
});

describe("10. deciding a signature line that is already settled", () => {
  const decide = async (p: Person, role: string) => {
    await as(p, role);
    return signatureDecidePost(json(`/api/v1/office/signatures/${ids.settledLine}/decide`, { approve: false }), params({ signatureId: ids.settledLine }));
  };

  it("refuses a teacher the timetable sends to the class and a teacher of another class, telling them nothing of the paper", async () => {
    for (const [key, p] of [["subject", P.Subject!], ["other class", P.OtherTeacher!]] as const) {
      const res = await decide(p, "TEACHER");
      expect(res.status, key).toBe(403);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.paperId, key).toBeUndefined();
      expect(body.status, key).toBeUndefined();
    }
    expect(await db.paperSignature.findUniqueOrThrow({ where: { id: ids.settledLine }, select: { status: true } })).toEqual({ status: "SIGNED" });
  });

  it("answers the settled line as it stands to its own teacher and to the office", async () => {
    for (const [p, role] of [[P.Form!, "TEACHER"], [P.Admin!, "ADMIN"]] as const) {
      const res = await decide(p, role);
      expect(res.status, role).toBe(200);
      expect(await res.json()).toMatchObject({ paperKind: "REPORT_CARD_SET", status: "SIGNED" });
    }
  });
});
