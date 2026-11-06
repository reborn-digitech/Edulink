/**
 * The fortnight agenda against the database: for one pupil the next
 * fourteen days hold an exam sitting, a due assignment, a booked guidance
 * session, the guardian's meeting, a closure and a fee due date, in date
 * order with a link each — and nothing from another child (another class's
 * work, another pupil's session, another grade's exam) and nothing outside
 * the window. The pupil's own agenda carries fee dates only while the school
 * lets pupils of their age see fees.
 *
 * Scoped to its own ZZ school, deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { assignPlans, createStructure, publishStructure, saveFeeSettings, saveHead } from "@/lib/fees";
import { familyAgenda, sortAgenda, type AgendaRow } from "@/lib/agenda";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const day = (n: number) => addDaysToKey(TODAY, n);
/** Noon in Kolkata on day +n, as an instant. */
const noon = (n: number) => new Date(`${day(n)}T06:30:00.000Z`);

let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let teacherMembershipId = "";
let parentUserId = "";
let pupilUserId = "";
let pupilId = "";
let otherPupilId = "";
let classId = "";
let otherClassId = "";
let competitionId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Agenda Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const parent = () => ctx({ userId: parentUserId, role: "PARENT" });
const pupil = () => ctx({ userId: pupilUserId, membershipId: pupilId, schoolId, role: "STUDENT" });

beforeAll(async () => {
  const school = await db.school.create({ data: { name: `ZZ Agenda School ${STAMP}`, slug: `zz-agenda-${STAMP}`, code: `ZAG${String(STAMP).slice(-5)}`, contactEmail: `zz-agenda-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = school.id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string, birthdate: Date | null = null) => db.user.create({ data: { name: `ZZ Agenda ${who}`, email: `zz-agenda-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate }, select: { id: true } });
  const [a, te, par, pu, po] = await Promise.all([mk("Admin"), mk("Teacher"), mk("Parent"), mk("Pupil", new Date(Date.UTC(new Date().getUTCFullYear() - 15, 0, 15))), mk("Other")]);
  adminUserId = a.id;
  parentUserId = par.id;
  pupilUserId = pu.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  teacherMembershipId = (await db.membership.create({ data: { userId: te.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  pupilId = (await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAP${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
  otherPupilId = (await db.membership.create({ data: { userId: po.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAO${STAMP}`, gradeLevel: "7" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilId, studentSchoolId: schoolId, status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Agenda 5A", gradeLevel: "5", joinCode: `ZA${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  otherClassId = (await db.class.create({ data: { schoolId, name: "ZZ Agenda 7A", gradeLevel: "7", joinCode: `ZB${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  const enrolledAt = new Date(Date.now() - 30 * 86_400_000);
  await db.enrollment.createMany({
    data: [
      { classId, schoolId, studentMembershipId: pupilId, status: "ACTIVE", enrolledAt },
      { classId: otherClassId, schoolId, studentMembershipId: otherPupilId, status: "ACTIVE", enrolledAt },
    ],
  });

  // An exam sitting for grade 5 on day +3 (published), one for grade 7 on day +4, and a grade 5 one on day +20 (outside).
  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ Unit Test 1", gradeLevel: "5", publishedAt: new Date() }, select: { id: true } });
  await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Mathematics", dateKey: day(3), startMinute: 600, endMinute: 660, pointsMilli: 50_000 } });
  await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Science", dateKey: day(20), pointsMilli: 50_000, position: 1 } });
  const otherSeries = await db.examSeries.create({ data: { schoolId, name: "ZZ Grade 7 Test", gradeLevel: "7", publishedAt: new Date() }, select: { id: true } });
  await db.examSlot.create({ data: { schoolId, seriesId: otherSeries.id, subject: "History", dateKey: day(4), pointsMilli: 50_000 } });

  // Work due on day +5 in the pupil's class; work in the other class; work already past; work on day +40.
  const work = (title: string, cls: string, due: Date) => db.assignment.create({ data: { schoolId, classId: cls, authorMembershipId: teacherMembershipId, title, publishedAt: new Date(Date.now() - 86_400_000), dueAt: due }, select: { id: true } });
  await work("ZZ Fractions sheet", classId, noon(5));
  await work("ZZ Other class essay", otherClassId, noon(5));
  await work("ZZ Last week", classId, noon(-3));
  await work("ZZ Far away", classId, noon(40));

  // A guidance session the pupil has a seat in on day +6; another pupil's on day +7.
  const slot = await db.gigSlot.create({ data: { providerUserId: te.id, providerKind: "TEACHER", teacherSchoolId: schoolId, kind: "ONE_TO_ONE", title: "ZZ Maths help", startsAt: noon(6), endsAt: new Date(noon(6).getTime() + 30 * 60_000), meetingUrl: "https://meet.example/zz", seats: 1, seatsTaken: 1 }, select: { id: true } });
  await db.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: pupilId, providerUserId: te.id, kind: "ONE_TO_ONE", bookedByUserId: parentUserId, purpose: "ZZ fractions", status: "CONFIRMED" } });
  const otherSlot = await db.gigSlot.create({ data: { providerUserId: te.id, providerKind: "TEACHER", teacherSchoolId: schoolId, kind: "ONE_TO_ONE", title: "ZZ Other pupil's session", startsAt: noon(7), endsAt: new Date(noon(7).getTime() + 30 * 60_000), meetingUrl: "https://meet.example/zz2", seats: 1, seatsTaken: 1 }, select: { id: true } });
  await db.gigBooking.create({ data: { schoolId, slotId: otherSlot.id, studentMembershipId: otherPupilId, providerUserId: te.id, kind: "ONE_TO_ONE", bookedByUserId: po.id, purpose: "ZZ other", status: "CONFIRMED" } });

  // The guardian's meeting with the teacher about this pupil on day +8.
  const meeting = await db.meetingSlot.create({ data: { schoolId, teacherMembershipId, startsAt: noon(8), endsAt: new Date(noon(8).getTime() + 15 * 60_000), location: "ZZ Room 4" }, select: { id: true } });
  await db.meetingBooking.create({ data: { schoolId, slotId: meeting.id, studentMembershipId: pupilId, parentUserId } });

  // A closure on days +9 to +10, an event on day +12, and a holiday last month (outside).
  await db.holiday.create({ data: { schoolId, name: "ZZ Founders' day break", startDateKey: day(9), endDateKey: day(10), kind: "HOLIDAY" } });
  await db.holiday.create({ data: { schoolId, name: "ZZ Sports day", startDateKey: day(12), endDateKey: day(12), kind: "EVENT" } });
  await db.holiday.create({ data: { schoolId, name: "ZZ Old break", startDateKey: day(-30), endDateKey: day(-28), kind: "HOLIDAY" } });

  // decision 0007: the school's competition on day +13, enrolment on for classes 5–6 — the pupil's class, so OPEN.
  const quiz = await db.competition.create({ data: { organizerSchoolId: schoolId, organizerName: "ZZ Agenda School", title: "ZZ Agenda quiz", summary: "ZZ a quiz", status: "PUBLISHED", gradeLow: "5", gradeHigh: "6", enrolmentOpen: true, internalBoard: "SCHOOL", registrationClosesAt: new Date(`${day(13)}T18:29:59.000Z`), startsAt: new Date(`${day(13)}T00:00:00.000Z`) }, select: { id: true } });
  competitionId = quiz.id;
  await db.holiday.create({ data: { schoolId, name: "ZZ Agenda quiz", startDateKey: day(13), endDateKey: day(13), kind: "COMPETITION", note: "ZZ a quiz", competitionId: quiz.id } });

  // A fee instalment due on day +11, another on day +60.
  const tuition = await saveHead(admin(), { name: "Tuition", code: "TUI", kind: "TUITION" });
  const structureId = await createStructure(admin(), {
    name: "Grade 5",
    gradeLevel: "5",
    instalments: [
      { label: "ZZ Term 2", dueDateKey: day(11), lines: [{ headId: tuition, amountPaise: 2_500_00 }] },
      { label: "ZZ Term 3", dueDateKey: day(60), lines: [{ headId: tuition, amountPaise: 2_500_00 }] },
    ],
  });
  await publishStructure(admin(), structureId);
  await assignPlans(admin(), { structureId, studentMembershipIds: [pupilId] });
});

afterAll(async () => {
  await db.gigSlot.deleteMany({ where: { teacherSchoolId: schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the guardian's fortnight", () => {
  it("holds the exam, the due work, the session, the meeting, the closure, the event and the fee date, in order, each with a link — and nothing of another child's", async () => {
    const agenda = await familyAgenda(parent(), { student: pupilId, days: 14 });
    expect(agenda.student.studentMembershipId).toBe(pupilId);
    expect([agenda.fromKey, agenda.toKey, agenda.days]).toEqual([TODAY, day(13), 14]);
    expect(agenda.rows.map((r) => [r.dateKey, r.kind, r.title])).toEqual([
      [day(3), "EXAM", "Mathematics"],
      [day(5), "WORK", "ZZ Fractions sheet"],
      [day(6), "SESSION", "ZZ Maths help"],
      [day(8), "MEETING", "ZZ Agenda Teacher"],
      [day(9), "CLOSURE", "ZZ Founders' day break"],
      [day(11), "FEE", "ZZ Term 2"],
      [day(12), "EVENT", "ZZ Sports day"],
      [day(13), "COMPETITION", "ZZ Agenda quiz"],
    ]);
    const byKind = Object.fromEntries(agenda.rows.map((r) => [r.kind, r]));
    // decision 0007: the competition row carries its competition and that this child may enrol, and opens the competition with the child.
    expect(byKind.COMPETITION!.competition).toEqual({ competitionId, enrol: "OPEN", entryId: null });
    expect(byKind.COMPETITION!.href).toBe(`/competitions/${competitionId}?child=${pupilId}`);
    expect(byKind.EXAM!.href).toBe("/exams");
    expect(byKind.EXAM!.detail).toBe("ZZ Unit Test 1");
    expect(byKind.EXAM!.at).toBe(`${day(3)}T04:30:00.000Z`);
    expect(byKind.WORK!.href).toBe(`/parent/assignments?child=${pupilId}`);
    expect(byKind.WORK!.detail).toBe("ZZ Agenda 5A");
    expect(byKind.SESSION!.href).toBe("/sessions");
    expect(byKind.MEETING!.href).toBe("/parent/meetings");
    expect(byKind.MEETING!.detail).toBe("ZZ Room 4");
    expect(byKind.CLOSURE!.endDateKey).toBe(day(10));
    expect(byKind.CLOSURE!.href).toBe("/parent/timetable");
    expect(byKind.FEE!.amountPaise).toBe(2_500_00);
    expect(byKind.FEE!.href).toBe(`/parent/fees?child=${pupilId}`);
    const titles = agenda.rows.map((r) => r.title);
    for (const absent of ["History", "Science", "ZZ Other class essay", "ZZ Last week", "ZZ Far away", "ZZ Other pupil's session", "ZZ Old break", "ZZ Term 3"]) expect(titles).not.toContain(absent);
  });

  it("a longer window reaches further; a child who is not theirs is refused; the office cannot read it", async () => {
    const month = await familyAgenda(parent(), { student: pupilId, days: 30 });
    expect(month.rows.map((r) => r.title)).toContain("Science");
    expect(month.rows.map((r) => r.title)).not.toContain("ZZ Term 3");
    await expect(familyAgenda(parent(), { student: otherPupilId })).rejects.toThrow("access.notYourChild");
    await expect(familyAgenda(admin(), {})).rejects.toThrow("access.wrongRoleForThisAction");
  });
});

describe("the pupil's own fortnight", () => {
  it("is the same list without the guardian's meeting, with the pupil's own links, and fee dates only when the school lets their age see fees", async () => {
    let agenda = await familyAgenda(pupil(), { days: 14 });
    expect(agenda.children).toEqual([]);
    expect(agenda.rows.map((r) => r.kind)).toEqual(["EXAM", "WORK", "SESSION", "CLOSURE", "EVENT", "COMPETITION"]);
    expect(agenda.rows.find((r) => r.kind === "COMPETITION")!.href).toBe(`/competitions/${competitionId}`);
    expect(agenda.rows.find((r) => r.kind === "WORK")!.href).toBe("/student/assignments");
    expect(agenda.rows.find((r) => r.kind === "CLOSURE")!.href).toBe("/timetable");
    await saveFeeSettings(admin(), { pupilFeeViewAge: 14 });
    agenda = await familyAgenda(pupil(), { days: 14 });
    expect(agenda.rows.map((r) => r.kind)).toEqual(["EXAM", "WORK", "SESSION", "CLOSURE", "FEE", "EVENT", "COMPETITION"]);
    expect(agenda.rows.find((r) => r.kind === "FEE")!.href).toBe("/student/fees");
    await saveFeeSettings(admin(), { pupilFeeViewAge: 18 });
    agenda = await familyAgenda(pupil(), { days: 14 });
    expect(agenda.rows.some((r) => r.kind === "FEE")).toBe(false);
  });

  it("orders by day, then by time with untimed rows after, then by a steady order of kinds", () => {
    const row = (over: Partial<AgendaRow>): AgendaRow => ({ id: "x", kind: "WORK", dateKey: "2026-10-05", at: null, endDateKey: null, title: "t", detail: null, amountPaise: null, href: "/", ...over });
    const sorted = sortAgenda([
      row({ id: "fee", kind: "FEE" }),
      row({ id: "late", kind: "EXAM", at: "2026-10-05T09:00:00.000Z" }),
      row({ id: "closure", kind: "CLOSURE" }),
      row({ id: "early", kind: "WORK", at: "2026-10-05T03:00:00.000Z" }),
      row({ id: "yesterday", kind: "EVENT", dateKey: "2026-10-04" }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["yesterday", "early", "late", "closure", "fee"]);
  });
});
