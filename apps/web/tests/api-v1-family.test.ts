/**
 * The /api/v1/family handlers — the pupil's and the guardian's pages as JSON —
 * invoked directly with a primed session the way api-v1-routes.test.ts does:
 * the happy path of every endpoint, 401 signed out, 403 for the wrong role,
 * 404 for another school's id, 422 for a body or query that does not parse.
 *
 * Two ZZ schools: the family's, and another whose ids must be 404 rather than
 * a hint that they exist.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { todayKey, weekdayOfKey } from "@/lib/dates";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as studentOverviewGet } from "@/app/api/v1/family/student/overview/route";
import { GET as studentAssignmentsGet } from "@/app/api/v1/family/student/assignments/route";
import { POST as submissionsPost } from "@/app/api/v1/family/student/submissions/route";
import { GET as studentProfileGet, POST as studentProfilePost } from "@/app/api/v1/family/student/profile/route";
import { GET as studentPracticeGet } from "@/app/api/v1/family/student/practice/route";
import { GET as childrenGet } from "@/app/api/v1/family/children/route";
import { GET as overviewGet } from "@/app/api/v1/family/overview/route";
import { GET as attendanceGet } from "@/app/api/v1/family/attendance/route";
import { GET as assignmentsGet } from "@/app/api/v1/family/assignments/route";
import { GET as practiceGet } from "@/app/api/v1/family/practice/route";
import { GET as meetingsGet, POST as meetingsPost } from "@/app/api/v1/family/meetings/route";
import { POST as meetingsCancelPost } from "@/app/api/v1/family/meetings/cancel/route";
import { GET as settingsGet, POST as settingsPost } from "@/app/api/v1/family/settings/route";
import { GET as timetableGet } from "@/app/api/v1/family/timetable/route";
import { GET as examsGet } from "@/app/api/v1/family/exams/route";
import { GET as reportCardsGet } from "@/app/api/v1/family/report-cards/route";
import { GET as reportCardGet } from "@/app/api/v1/family/report-cards/[cardId]/route";
import { GET as reviewsGet, POST as reviewsPost } from "@/app/api/v1/family/reviews/route";
import { GET as exploreGet } from "@/app/api/v1/family/explore/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";

let schoolId = "";
let otherSchoolId = "";
let classId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let parentUserId = "";
let otherPupilUserId = "";
let otherPupilMembershipId = "";
let assignmentId = "";
let otherAssignmentId = "";
let cardId = "";
let otherCardId = "";
let roundId = "";
let otherRoundId = "";
let otherTeacherMembershipId = "";
let slotId = "";
let otherSlotId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const cardParams = (id: string) => ({ params: Promise.resolve({ cardId: id }) });

async function as(role: "STUDENT" | "TEACHER" | "PARENT" | "OTHER_STUDENT" | null) {
  __resetCookies();
  if (role === "STUDENT") await createSession(pupilUserId, { schoolId, role: "STUDENT" });
  if (role === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (role === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (role === "OTHER_STUDENT") await createSession(otherPupilUserId, { schoolId: otherSchoolId, role: "STUDENT" });
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Family School ${STAMP}`, slug: `zz-fam-${STAMP}`, code: `ZF${String(STAMP).slice(-6)}`, contactEmail: `zz-fam-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ Family Other ${STAMP}`, slug: `zz-famo-${STAMP}`, code: `ZG${String(STAMP).slice(-6)}`, contactEmail: `zz-famo-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  otherSchoolId = other.id;

  const [teacher, pupil, parent, otherPupil, otherTeacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Family Teacher", email: `zz-fam-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Family Pupil", email: `zz-fam-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Family Parent", email: `zz-fam-parent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Family Other Pupil", email: `zz-fam-opupil-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Family Other Teacher", email: `zz-fam-oteacher-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;
  otherPupilUserId = otherPupil.id;

  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacherMembershipId = tm.id;
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", gradeLevel: "4", studentCode: `ZFP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Family Class 4", gradeLevel: "4", joinCode: `ZF${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE", enrolledAt: new Date(Date.now() - 86_400_000) } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  // The other school: a pupil, a teacher, and one of everything an id can name.
  const otm = await db.membership.create({ data: { userId: otherTeacher.id, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  otherTeacherMembershipId = otm.id;
  const opm = await db.membership.create({ data: { userId: otherPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFO${STAMP}` }, select: { id: true } });
  otherPupilMembershipId = opm.id;
  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ Family Other Class", gradeLevel: "4", joinCode: `ZG${String(STAMP).slice(-6)}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: otherClass.id, schoolId: otherSchoolId, teacherMembershipId: otm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: otherClass.id, schoolId: otherSchoolId, studentMembershipId: opm.id, status: "ACTIVE" } });

  const today = todayKey(TZ);
  const soon = new Date(Date.now() + 3 * 86_400_000);
  const [assignment, otherAssignment, card, otherCard, round, otherRound, slot, otherSlot, session, period] = await Promise.all([
    db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Family Reading log", pointsMilli: 10_000, dueAt: soon, publishedAt: new Date() }, select: { id: true } }),
    db.assignment.create({ data: { schoolId: otherSchoolId, classId: otherClass.id, authorMembershipId: otm.id, title: "ZZ Family Elsewhere", dueAt: soon, publishedAt: new Date() }, select: { id: true } }),
    db.reportCard.create({ data: { schoolId, classId, studentMembershipId: pm.id, title: "ZZ Family Term 1", status: "PUBLISHED", publishedAt: new Date(), fromDateKey: "2026-06-01", toDateKey: "2026-08-31", overallPercentMilli: 72_500, createdByMembershipId: tm.id }, select: { id: true } }),
    db.reportCard.create({ data: { schoolId: otherSchoolId, classId: otherClass.id, studentMembershipId: opm.id, title: "ZZ Family Term 1", status: "PUBLISHED", publishedAt: new Date(), fromDateKey: "2026-06-01", toDateKey: "2026-08-31" }, select: { id: true } }),
    db.reviewRound.create({ data: { schoolId, audience: "BOTH", closesDateKey: "2099-12-31", status: "OPEN", teachers: { create: { schoolId, teacherMembershipId: tm.id } } }, select: { id: true } }),
    db.reviewRound.create({ data: { schoolId: otherSchoolId, audience: "BOTH", closesDateKey: "2099-12-31", status: "OPEN", teachers: { create: { schoolId: otherSchoolId, teacherMembershipId: otm.id } } }, select: { id: true } }),
    db.meetingSlot.create({ data: { schoolId, teacherMembershipId: tm.id, startsAt: new Date(Date.now() + 2 * 86_400_000), endsAt: new Date(Date.now() + 2 * 86_400_000 + 1_800_000), location: "Room 4" }, select: { id: true } }),
    db.meetingSlot.create({ data: { schoolId: otherSchoolId, teacherMembershipId: otm.id, startsAt: new Date(Date.now() + 2 * 86_400_000), endsAt: new Date(Date.now() + 2 * 86_400_000 + 1_800_000) }, select: { id: true } }),
    db.attendanceSession.create({ data: { schoolId, classId, dateKey: today, takenByMembershipId: tm.id }, select: { id: true } }),
    db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 9 * 60, endMinute: 9 * 60 + 40, position: 1 }, select: { id: true } }),
  ]);
  assignmentId = assignment.id;
  otherAssignmentId = otherAssignment.id;
  cardId = card.id;
  otherCardId = otherCard.id;
  roundId = round.id;
  otherRoundId = otherRound.id;
  slotId = slot.id;
  otherSlotId = otherSlot.id;
  await Promise.all([
    db.attendanceRecord.create({ data: { sessionId: session.id, schoolId, studentMembershipId: pm.id, status: "PRESENT" } }),
    db.timetableSlot.create({ data: { schoolId, classId, periodId: period.id, weekday: weekdayOfKey(today), subject: "Mathematics", teacherMembershipId: tm.id, room: "4B" } }),
    db.examSeries.create({ data: { schoolId, name: "ZZ Family Unit Test", gradeLevel: "4", publishedAt: new Date(), slots: { create: { schoolId, subject: "Mathematics", dateKey: "2099-01-05", pointsMilli: 50_000 } } } }),
  ]);
  __resetCookies();
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [teacherUserId, pupilUserId, parentUserId, otherPupilUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const gets = [studentOverviewGet, studentAssignmentsGet, studentProfileGet, studentPracticeGet, childrenGet, overviewGet, attendanceGet, assignmentsGet, practiceGet, meetingsGet, settingsGet, timetableGet, examsGet, reportCardsGet, reviewsGet, exploreGet];
    for (const handler of gets) {
      const res = await (handler as (r: Request) => Promise<Response>)(get("/api/v1/family/x"));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
    for (const handler of [submissionsPost, studentProfilePost, meetingsPost, meetingsCancelPost, settingsPost, reviewsPost]) {
      const res = await handler(json("/api/v1/family/x", {}));
      expect(res.status).toBe(401);
    }
    const card = await reportCardGet(get("/api/v1/family/report-cards/x"), cardParams(cardId));
    expect(card.status).toBe(401);
  });
});

describe("the pupil's pages", () => {
  beforeAll(() => as("STUDENT"));

  it("overview: today's register, the day's lessons, what is due, the exam marks", async () => {
    const res = await studentOverviewGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("ZZ Family Pupil");
    expect(body.className).toBe("ZZ Family Class 4");
    expect(body.todayStatus).toBe("PRESENT");
    expect(body.streak).toBe(1);
    expect(body.attendance.percent).toBe(100);
    expect(body.lessonsToday.map((l: { subject: string }) => l.subject)).toEqual(["Mathematics"]);
    expect(body.lessonsToday[0].periodName).toBe("ZZ P1");
    expect(body.upcoming.map((a: { id: string }) => a.id)).toEqual([assignmentId]);
    expect(body.examMarks[0].series[0].papers[0]).toMatchObject({ subject: "Mathematics", marks: null, maxMarks: 50 });
  });

  it("assignments: the reading log is to do; handing it in moves it to handed in; a second delivery replaces the body", async () => {
    const before = await studentAssignmentsGet();
    expect(before.status).toBe(200);
    expect((await before.json()).todo.map((a: { id: string }) => a.id)).toEqual([assignmentId]);

    const bad = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "   " }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { body: expect.any(String) } });

    const first = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "Read chapter one." }));
    expect(first.status).toBe(200);
    expect((await first.json()).submittedAt).toEqual(expect.any(String));
    const again = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "Read chapters one and two." }));
    expect(again.status).toBe(200);
    const rows = await db.submission.findMany({ where: { assignmentId, studentMembershipId: pupilMembershipId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.body).toBe("Read chapters one and two.");

    const after = await studentAssignmentsGet();
    const work = await after.json();
    expect(work.todo).toEqual([]);
    expect(work.handedIn.map((a: { id: string; submissionBody: string }) => [a.id, a.submissionBody])).toEqual([[assignmentId, "Read chapters one and two."]]);
  });

  it("photographs of the work: the pupil's own unspent uploads attach, a merely-seen id is refused, a photo alone is an answer, and an unlisted photo is removed", async () => {
    const mine = `zz-fam-mine-${STAMP}`;
    const mine2 = `zz-fam-mine2-${STAMP}`;
    const theirs = `zz-fam-theirs-${STAMP}`;
    await db.uploadTicket.createMany({
      data: [
        { userId: pupilUserId, fileId: mine, mime: "image/jpeg", size: 2048 },
        { userId: pupilUserId, fileId: mine2, mime: "image/jpeg", size: 4096 },
        { userId: otherPupilUserId, fileId: theirs, mime: "image/jpeg", size: 2048 },
      ],
    });
    try {
      // Nothing at all is not a hand-in.
      const empty = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "", attachments: [] }));
      expect(empty.status).toBe(422);

      // Somebody else's upload, even with a real id, is not theirs to hand in.
      const stolen = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "", attachments: [{ fileId: theirs, name: "page.jpg" }] }));
      expect(stolen.status).toBe(404);
      expect(await stolen.json()).toMatchObject({ code: "NOT_FOUND" });
      expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: theirs } })).consumedAt).toBeNull();

      // A photo with no words is a whole answer; the type and size come from the ticket, the name from the phone.
      const photo = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "", attachments: [{ fileId: mine, name: "Page 1.jpg" }, { fileId: mine2, name: "Page 2\n.jpg" }] }));
      expect(photo.status).toBe(200);
      const first = await photo.json();
      expect(first.attachments).toEqual([
        { fileId: mine, name: "Page 1.jpg", size: 2048, mime: "image/jpeg" },
        { fileId: mine2, name: "Page 2.jpg", size: 4096, mime: "image/jpeg" },
      ]);
      expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: mine } })).consumedAt).not.toBeNull();
      const listed = await (await studentAssignmentsGet()).json();
      expect(listed.handedIn[0].submissionAttachments.map((a: { fileId: string }) => a.fileId)).toEqual([mine, mine2]);

      // Listing a photo again keeps it as stored (the spent ticket is not needed, the new name is ignored), and words alone leave the photos as they were.
      const kept = await (await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "", attachments: [{ fileId: mine, name: "again.jpg" }, { fileId: mine2, name: "Page 2.jpg" }] }))).json();
      expect(kept.attachments[0]).toEqual({ fileId: mine, name: "Page 1.jpg", size: 2048, mime: "image/jpeg" });
      const wordsOnly = await (await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "See the pages." }))).json();
      expect(wordsOnly.attachments.map((a: { fileId: string }) => a.fileId)).toEqual([mine, mine2]);

      // Dropping the second page removes it from the hand-in.
      const trimmed = await (await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "See the page.", attachments: [{ fileId: mine, name: "Page 1.jpg" }] }))).json();
      expect(trimmed.attachments.map((a: { fileId: string }) => a.fileId)).toEqual([mine]);
      const row = await db.submission.findFirstOrThrow({ where: { assignmentId, studentMembershipId: pupilMembershipId } });
      expect(JSON.parse(row.attachments)).toHaveLength(1);
      expect(row.body).toBe("See the page.");
    } finally {
      await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "Read chapters one and two.", attachments: [] }));
      await db.uploadTicket.deleteMany({ where: { fileId: { in: [mine, mine2, theirs] } } });
    }
  });

  it("another school's assignment is 404, never a leak", async () => {
    const res = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId: otherAssignmentId, body: "Hello" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("profile: reads what the form shows, and saves the preferred name and avatar", async () => {
    const before = await studentProfileGet();
    expect(before.status).toBe(200);
    const profile = await before.json();
    expect(profile).toMatchObject({ name: "ZZ Family Pupil", preferredName: null, schoolName: `ZZ Family School ${STAMP}`, className: "ZZ Family Class 4", studentCode: `ZFP${STAMP}` });
    // A guardian is linked, so the birthdate is the office's to change.
    expect(profile.birthdateEditable).toBe(false);
    expect(Array.isArray(profile.badges)).toBe(true);

    const noAvatar = await studentProfilePost(json("/api/v1/family/student/profile", { preferredName: "Zed" }));
    expect(noAvatar.status).toBe(422);
    const wrongAvatar = await studentProfilePost(json("/api/v1/family/student/profile", { preferredName: "Zed", bio: "", avatarKey: "not-a-preset" }));
    expect(wrongAvatar.status).toBe(422);
    expect(await wrongAvatar.json()).toMatchObject({ code: "BAD_REQUEST", issues: { avatarKey: expect.any(String) } });
    const birthdate = await studentProfilePost(json("/api/v1/family/student/profile", { preferredName: "Zed", bio: "", avatarKey: AVATAR_PRESETS[0], birthdate: "2016-04-01" }));
    expect(birthdate.status).toBe(422);
    expect(await birthdate.json()).toMatchObject({ issues: { birthdate: expect.any(String) } });

    const saved = await studentProfilePost(json("/api/v1/family/student/profile", { preferredName: "Zed", bio: "I like maths.", avatarKey: AVATAR_PRESETS[0] }));
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ ok: true });
    const user = await db.user.findUniqueOrThrow({ where: { id: pupilUserId }, select: { preferredName: true, bio: true, avatarKey: true, birthdate: true } });
    expect(user).toEqual({ preferredName: "Zed", bio: "I like maths.", avatarKey: AVATAR_PRESETS[0], birthdate: null });
  });

  it("practice: the topic list with the cards above it", async () => {
    const res = await studentPracticeGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body).toMatchObject({ enrolledGrade: 4, weekly: 0, weeklyGoal: 50, resume: null, revision: [], assigned: [] });
  });

  it("the shared pages: timetable, exams, report cards, reviews, explore", async () => {
    const timetable = await timetableGet(get("/api/v1/family/timetable"));
    expect(timetable.status).toBe(200);
    const week = await timetable.json();
    expect(week.child).toBeNull();
    expect(week.grid.periods.map((p: { name: string }) => p.name)).toEqual(["ZZ P1"]);
    expect(week.grid.slots).toHaveLength(1);
    expect(week.isThisWeek).toBe(true);
    const badWeek = await timetableGet(get("/api/v1/family/timetable?week=soon"));
    expect(badWeek.status).toBe(422);

    const exams = await examsGet();
    expect(exams.status).toBe(200);
    const sheet = await exams.json();
    expect(sheet.upcoming.map((s: { name: string }) => s.name)).toEqual(["ZZ Family Unit Test"]);
    expect(sheet.marks).toHaveLength(1);
    expect(sheet.cards[0].rows.map((c: { id: string }) => c.id)).toEqual([cardId]);

    const cards = await reportCardsGet();
    expect(cards.status).toBe(200);
    expect((await cards.json()).groups).toEqual([{ studentMembershipId: pupilMembershipId, name: null, rows: [expect.objectContaining({ id: cardId, overallPercentMilli: 72_500 })] }]);

    const card = await reportCardGet(get(`/api/v1/family/report-cards/${cardId}`), cardParams(cardId));
    expect(card.status).toBe(200);
    expect(await card.json()).toMatchObject({ id: cardId, title: "ZZ Family Term 1", studentName: "Zed", overallPercent: 72.5, authorName: "ZZ Family Teacher" });
    const foreign = await reportCardGet(get(`/api/v1/family/report-cards/${otherCardId}`), cardParams(otherCardId));
    expect(foreign.status).toBe(404);

    const reviews = await reviewsGet();
    expect(reviews.status).toBe(200);
    expect((await reviews.json()).pending).toEqual([{ roundId, closesDateKey: "2099-12-31", teacherMembershipId, teacherName: "ZZ Family Teacher", myScores: null }]);

    const explore = await exploreGet(get("/api/v1/family/explore?q=zz"));
    expect(explore.status).toBe(200);
    expect(await explore.json()).toMatchObject({ schools: expect.any(Array), countries: expect.any(Array) });
  });

  it("reviews: half an answer is 422, a whole one lands once and can be amended, another school's round is 404", async () => {
    const half = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: { CLARITY: 4 } }));
    expect(half.status).toBe(422);
    expect(await half.json()).toMatchObject({ code: "BAD_REQUEST", issues: { scores: expect.any(String) } });
    const scores = { CLARITY: 4, SUPPORT: 5, FAIRNESS: 4, ENGAGEMENT: 3, RESPECT: 5 };
    const first = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores }));
    expect(first.status).toBe(200);
    const again = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: { ...scores, RESPECT: 4 } }));
    expect(again.status).toBe(200);
    expect(await db.reviewResponse.count({ where: { roundId, respondentUserId: pupilUserId } })).toBe(1);
    const mine = (await (await reviewsGet()).json()).pending[0].myScores;
    expect(mine).toEqual({ ...scores, RESPECT: 4 });
    const foreign = await reviewsPost(json("/api/v1/family/reviews", { roundId: otherRoundId, teacherMembershipId: otherTeacherMembershipId, scores }));
    expect(foreign.status).toBe(404);
    const outOfRange = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: { ...scores, CLARITY: 9 } }));
    expect(outOfRange.status).toBe(422);
  });

  it("a pupil is refused the guardian's pages", async () => {
    for (const handler of [childrenGet, meetingsGet, settingsGet]) {
      const res = await handler();
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    }
    for (const handler of [overviewGet, attendanceGet, assignmentsGet, practiceGet]) {
      expect((await handler(get("/api/v1/family/x"))).status).toBe(403);
    }
    expect((await settingsPost(json("/api/v1/family/settings", { channels: { push: true, email: true }, quietHours: null }))).status).toBe(403);
  });
});

describe("the guardian's pages", () => {
  beforeAll(() => as("PARENT"));

  it("children: the one child, first claimed first", async () => {
    const res = await childrenGet();
    expect(res.status).toBe(200);
    expect((await res.json()).children).toEqual([expect.objectContaining({ studentMembershipId: pupilMembershipId, name: "Zed", schoolId, leftAt: null, relation: "PARENT" })]);
  });

  it("overview: the first child by default, the named child by id, another school's pupil is 404", async () => {
    const res = await overviewGet(get("/api/v1/family/overview"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.child).toMatchObject({ studentMembershipId: pupilMembershipId, name: "Zed", gradeLevel: "4", leftAt: null });
    expect(body.left).toBe(false);
    expect(body.todayRecord).toEqual({ status: "PRESENT", note: null });
    expect(body.attendance.percent).toBe(100);
    expect(body.streak).toBe(1);
    expect(body.averagePercent).toBeNull();
    expect(body.lessonsToday.map((l: { subject: string }) => l.subject)).toEqual(["Mathematics"]);
    // Handed in above, so nothing is due any more — the same rule as the child's page.
    expect(body.upcoming).toEqual([]);
    expect(body.examMarks).toHaveLength(1);

    const named = await overviewGet(get(`/api/v1/family/overview?childId=${pupilMembershipId}`));
    expect(named.status).toBe(200);
    const foreign = await overviewGet(get(`/api/v1/family/overview?childId=${otherPupilMembershipId}`));
    expect(foreign.status).toBe(404);
    expect(await foreign.json()).toMatchObject({ code: "NOT_FOUND" });
    const malformed = await overviewGet(get("/api/v1/family/overview?childId=nope"));
    expect(malformed.status).toBe(422);
  });

  it("attendance: this month by default, a past month by request, never a future one", async () => {
    const res = await attendanceGet(get("/api/v1/family/attendance"));
    expect(res.status).toBe(200);
    const body = await res.json();
    const thisMonth = todayKey(TZ).slice(0, 7);
    expect(body.month).toBe(thisMonth);
    expect(body.nextMonth).toBeNull();
    expect(body.summary.counts.PRESENT).toBe(1);
    expect(body.days).toEqual([{ dateKey: todayKey(TZ), status: "PRESENT", note: null, teachingDay: expect.any(Boolean) }]);

    const past = await attendanceGet(get("/api/v1/family/attendance?month=2026-01"));
    expect((await past.json()).month).toBe("2026-01");
    const future = await attendanceGet(get("/api/v1/family/attendance?month=2099-01"));
    expect((await future.json()).month).toBe(thisMonth);
    expect((await attendanceGet(get("/api/v1/family/attendance?month=2026-13"))).status).toBe(422);
    expect((await attendanceGet(get(`/api/v1/family/attendance?childId=${otherPupilMembershipId}`))).status).toBe(404);
  });

  it("assignments and practice for the child; another school's pupil is 404 on both", async () => {
    const work = await assignmentsGet(get("/api/v1/family/assignments"));
    expect(work.status).toBe(200);
    const body = await work.json();
    expect(body.childName).toBe("Zed");
    expect(body.handedIn.map((a: { id: string }) => a.id)).toEqual([assignmentId]);
    // The child's text is not the parent's to read.
    expect(body.handedIn[0]).not.toHaveProperty("submissionBody");
    expect((await assignmentsGet(get(`/api/v1/family/assignments?childId=${otherPupilMembershipId}`))).status).toBe(404);

    const practice = await practiceGet(get("/api/v1/family/practice"));
    expect(practice.status).toBe(200);
    expect(await practice.json()).toMatchObject({ childName: "Zed", weeklyCount: 0, topics: [] });
    expect((await practiceGet(get(`/api/v1/family/practice?childId=${otherPupilMembershipId}`))).status).toBe(404);
  });

  it("timetable, exams, report cards and reviews through the child", async () => {
    const timetable = await timetableGet(get("/api/v1/family/timetable"));
    expect(timetable.status).toBe(200);
    const week = await timetable.json();
    expect(week.child.studentMembershipId).toBe(pupilMembershipId);
    expect(week.grid.slots).toHaveLength(1);
    expect((await timetableGet(get(`/api/v1/family/timetable?childId=${otherPupilMembershipId}`))).status).toBe(404);

    const exams = await examsGet();
    expect(exams.status).toBe(200);
    const sheet = await exams.json();
    expect(sheet.upcoming).toHaveLength(1);
    expect(sheet.cards).toEqual([{ studentMembershipId: pupilMembershipId, name: null, rows: [expect.objectContaining({ id: cardId })] }]);

    const card = await reportCardGet(get(`/api/v1/family/report-cards/${cardId}`), cardParams(cardId));
    expect(card.status).toBe(200);
    expect((await reportCardGet(get(`/api/v1/family/report-cards/${otherCardId}`), cardParams(otherCardId))).status).toBe(404);

    const reviews = await reviewsGet();
    expect((await reviews.json()).pending).toEqual([expect.objectContaining({ roundId, teacherMembershipId, myScores: null })]);
    const rated = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: { CLARITY: 5, SUPPORT: 5, FAIRNESS: 5, ENGAGEMENT: 5, RESPECT: 5 } }));
    expect(rated.status).toBe(200);
    expect(await db.reviewResponse.count({ where: { roundId } })).toBe(2);
  });

  it("meetings: the teacher's open window, booked once, refused twice, cancelled, and another school's slot is 404", async () => {
    const open = await meetingsGet();
    expect(open.status).toBe(200);
    const before = await open.json();
    expect(before.timezone).toBe(TZ);
    expect(before.open).toEqual([expect.objectContaining({ id: slotId, teacherName: "ZZ Family Teacher", location: "Room 4", forStudentMembershipIds: [pupilMembershipId] })]);
    expect(before.mine).toEqual([]);

    expect((await meetingsPost(json("/api/v1/family/meetings", {}))).status).toBe(422);
    const booked = await meetingsPost(json("/api/v1/family/meetings", { slotId, studentMembershipId: pupilMembershipId, note: "About reading" }));
    expect(booked.status).toBe(200);
    const twice = await meetingsPost(json("/api/v1/family/meetings", { slotId, studentMembershipId: pupilMembershipId }));
    expect(twice.status).toBe(403);
    const foreign = await meetingsPost(json("/api/v1/family/meetings", { slotId: otherSlotId, studentMembershipId: pupilMembershipId }));
    expect(foreign.status).toBe(404);
    const notMine = await meetingsPost(json("/api/v1/family/meetings", { slotId, studentMembershipId: otherPupilMembershipId }));
    expect(notMine.status).toBe(404);

    const after = await (await meetingsGet()).json();
    expect(after.open).toEqual([]);
    expect(after.mine).toEqual([expect.objectContaining({ teacherName: "ZZ Family Teacher", childName: "Zed", note: "About reading" })]);
    const bookingId = after.mine[0].bookingId as string;

    expect((await meetingsCancelPost(json("/api/v1/family/meetings/cancel", {}))).status).toBe(422);
    const cancelled = await meetingsCancelPost(json("/api/v1/family/meetings/cancel", { bookingId }));
    expect(cancelled.status).toBe(200);
    expect((await meetingsCancelPost(json("/api/v1/family/meetings/cancel", { bookingId }))).status).toBe(404);
    expect((await (await meetingsGet()).json()).open).toHaveLength(1);
  });

  it("settings: the defaults, a refused pair of quiet hours, a saved pair, appearance untouched", async () => {
    const res = await settingsGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ channels: { push: true, email: true, sms: true, whatsapp: true }, quietHours: null, children: [expect.objectContaining({ studentMembershipId: pupilMembershipId })] });

    expect((await settingsPost(json("/api/v1/family/settings", {}))).status).toBe(422);
    const same = await settingsPost(json("/api/v1/family/settings", { channels: { push: true, email: false }, quietHours: { start: "22:00", end: "22:00" } }));
    expect(same.status).toBe(422);
    expect(await same.json()).toMatchObject({ issues: { "quietHours.end": expect.any(String) } });

    await db.user.update({ where: { id: parentUserId }, data: { prefs: JSON.stringify({ theme: "dark" }) } });
    const saved = await settingsPost(json("/api/v1/family/settings", { channels: { push: true, email: false }, quietHours: { start: "21:00", end: "07:00" } }));
    expect(saved.status).toBe(200);
    const prefs = JSON.parse((await db.user.findUniqueOrThrow({ where: { id: parentUserId }, select: { prefs: true } })).prefs);
    expect(prefs).toMatchObject({ theme: "dark", channels: { push: true, email: false }, quietHours: { start: "21:00", end: "07:00" } });
    expect((await (await settingsGet()).json()).quietHours).toEqual({ start: "21:00", end: "07:00" });
  });

  it("a guardian is refused the pupil's pages", async () => {
    for (const handler of [studentOverviewGet, studentAssignmentsGet, studentProfileGet, studentPracticeGet]) {
      const res = await handler();
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    }
    expect((await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "x" }))).status).toBe(403);
    expect((await studentProfilePost(json("/api/v1/family/student/profile", { avatarKey: AVATAR_PRESETS[0] }))).status).toBe(403);
  });
});

describe("staff and a stranger", () => {
  it("a teacher is refused every family page, shared ones included; explore is open to any role", async () => {
    await as("TEACHER");
    for (const handler of [studentOverviewGet, childrenGet, examsGet, reportCardsGet, reviewsGet, meetingsGet, settingsGet]) {
      const res = await handler();
      expect(res.status).toBe(403);
    }
    expect((await timetableGet(get("/api/v1/family/timetable"))).status).toBe(403);
    expect((await overviewGet(get("/api/v1/family/overview"))).status).toBe(403);
    expect((await reportCardGet(get(`/api/v1/family/report-cards/${cardId}`), cardParams(cardId))).status).toBe(403);
    expect((await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: {} }))).status).toBe(403);
    expect((await exploreGet(get("/api/v1/family/explore"))).status).toBe(200);
  });

  it("a pupil at another school sees none of this family's rows", async () => {
    await as("OTHER_STUDENT");
    const card = await reportCardGet(get(`/api/v1/family/report-cards/${cardId}`), cardParams(cardId));
    expect(card.status).toBe(404);
    const foreignReview = await reviewsPost(json("/api/v1/family/reviews", { roundId, teacherMembershipId, scores: { CLARITY: 5, SUPPORT: 5, FAIRNESS: 5, ENGAGEMENT: 5, RESPECT: 5 } }));
    expect(foreignReview.status).toBe(404);
    const foreignWork = await submissionsPost(json("/api/v1/family/student/submissions", { assignmentId, body: "Mine?" }));
    expect(foreignWork.status).toBe(404);
    // Their own overview holds their own school's work, and none of this family's.
    const overview = await studentOverviewGet();
    expect(overview.status).toBe(200);
    expect((await overview.json()).upcoming.map((a: { id: string }) => a.id)).toEqual([otherAssignmentId]);
  });
});
