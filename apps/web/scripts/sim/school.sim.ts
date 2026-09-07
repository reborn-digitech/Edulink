import { describe, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import type { ActiveContext } from "@/lib/session";
import { saveAttendanceBatch } from "@/lib/attendance";
import { createAssignment, saveGrades } from "@/lib/grading";
import { createSeries, addSlot, publishSeries, saveMarks, listSeries } from "@/lib/exams";
import { generateCards, publishCards } from "@/lib/report-cards";
import { openReviewRound, submitReview, closeReviewRound } from "@/lib/reviews";
import { applyForLeave, decideLeave } from "@/lib/leave";
import { createAcademicYear, closeAcademicYear, currentAcademicYear } from "@/lib/academic-year";
import { createHoliday, closedOn } from "@/lib/holidays";
import { enrolStudents, assignTeacher } from "@/lib/cohort";
import { applySuggestedDay, setSlot, listPeriods } from "@/lib/timetable";
import { createThread } from "@/lib/remarks";
import { publishSlots, bookSlot, openSlotsFor } from "@/lib/meetings";
import { createPost } from "@/lib/bulletin";
import { promoteSchool, promotionPlan } from "@/lib/promotion";
import { classCode, studentCode } from "@/lib/codes";
import { isTeachingDay, addDaysToKey } from "@/lib/dates";

/**
 * THREE ACADEMIC YEARS OF TWO SCHOOLS, driven through the application's own
 * library under real role contexts — the same functions the pages call —
 * so every rule, audit row, notification and policy fires as it would for
 * a person. Nothing is inserted raw except the people themselves (users,
 * memberships, guardianships), which the UI walkthrough creates by hand for
 * a handful and which no library function creates in bulk.
 *
 * Fixture rule: every name starts with "ZZ Sim", every email ends in
 * @zz.test, every class code starts ZZS, so it can all be found again.
 */

const db = new PrismaClient();
const LOG: Record<string, { n: number; ms: number; max: number }> = {};
const FINDINGS: string[] = [];

function note(s: string) {
  FINDINGS.push(s);
  console.log("FINDING:", s);
}

async function timed<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    const ms = performance.now() - t0;
    const e = (LOG[key] ??= { n: 0, ms: 0, max: 0 });
    e.n += 1;
    e.ms += ms;
    e.max = Math.max(e.max, ms);
  }
}

let seed = 42;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

const FIRST = ["Aarav", "Vivaan", "Aditya", "Sai", "Arjun", "Reyansh", "Ishaan", "Kabir", "Rohan", "Dev", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Myra", "Riya", "Kiara", "Meera", "Ira", "Zara", "Nisha", "Tara", "Anika", "Veer", "Yash", "Omkar", "Tanvi", "Neha", "Priya"];
const LAST = ["Patil", "Deshmukh", "Joshi", "Kulkarni", "Shinde", "Pawar", "Jadhav", "More", "Chavan", "Bhosale", "Gaikwad", "Sawant", "Kale", "Shaikh", "Khan", "Mehta", "Shah", "Rao", "Nair", "Iyer"];
const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "Hindi"];

function ctx(o: { userId: string; membershipId: string | null; schoolId: string | null; role: ActiveContext["role"]; name: string }): ActiveContext {
  return {
    sessionId: "sim",
    membershipId: o.membershipId,
    schoolId: o.schoolId,
    role: o.role,
    user: {
      id: o.userId, name: o.name, preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

type Teacher = { ctx: ActiveContext; membershipId: string; subject: string; name: string };
type Pupil = { membershipId: string; userId: string; name: string };
type Klass = { id: string; name: string; grade: string; pupils: Pupil[]; lead: Teacher };

type School = {
  id: string;
  name: string;
  admin: ActiveContext;
  adminMembershipId: string;
  principal: ActiveContext;
  teachers: Teacher[];
  classes: Klass[];
  grades: string[];
  counter: number;
};

const SIM_EPOCH = new Date("2023-05-15T00:00:00Z");
async function makePerson(school: School, role: "TEACHER" | "PRINCIPAL" | "STUDENT", name: string, extra: { birthdate?: Date; subject?: string; joinedAt?: Date } = {}) {
  school.counter += 1;
  const email = `zz.sim.${school.name.includes("North") ? "n" : "s"}.${role.toLowerCase()}${school.counter}@zz.test`;
  const user = await db.user.create({
    data: {
      email,
      name,
      prefs: "{}",
      passwordHash: "$argon2id$unknowable$" + randomBytes(18).toString("base64url"),
      emailVerifiedAt: new Date(),
      birthdate: extra.birthdate ?? null,
      isMinor: role === "STUDENT",
    },
  });
  const m = await db.membership.create({
    data: {
      userId: user.id,
      schoolId: school.id,
      role,
      status: "ACTIVE",
      studentCode: role === "STUDENT" ? studentCode() : null,
      subjects: extra.subject ? JSON.stringify([extra.subject]) : null,
      joinedAt: extra.joinedAt ?? SIM_EPOCH,
    },
  });
  return { user, membership: m };
}

async function wipeSim(schoolId: string, tag: string) {
  // A rerun starts clean: everything the engine made carries the ZZ Sim mark.
  const members = await db.membership.findMany({ where: { schoolId, role: { not: "ADMIN" }, user: { email: { startsWith: "zz.sim." } } }, select: { userId: true, id: true } });
  const parents = await db.user.findMany({ where: { email: { startsWith: `zz.sim.parent.${tag}.` } }, select: { id: true } });
  const orphans = await db.user.findMany({ where: { email: { startsWith: `zz.sim.${tag}.` }, memberships: { none: {} } }, select: { id: true } });
  const ids = [...new Set([...members.map((m) => m.userId), ...parents.map((u) => u.id), ...orphans.map((u) => u.id)])];
  await db.guardianship.deleteMany({ where: { parentUserId: { in: ids } } });
  await db.notification.deleteMany({ where: { userId: { in: ids } } });
  const classes = await db.class.findMany({ where: { schoolId }, select: { id: true } });
  const classIds = classes.map((c) => c.id);
  await db.attendanceRecord.deleteMany({ where: { session: { classId: { in: classIds } } } });
  await db.attendanceSession.deleteMany({ where: { classId: { in: classIds } } });
  await db.grade.deleteMany({ where: { assignment: { classId: { in: classIds } } } });
  await db.submission.deleteMany({ where: { assignment: { classId: { in: classIds } } } }).catch(() => {});
  await db.reportCard.deleteMany({ where: { schoolId } });
  await db.assignment.deleteMany({ where: { classId: { in: classIds } } });
  await db.examSeries.deleteMany({ where: { schoolId } });
  await db.timetableSlot.deleteMany({ where: { classId: { in: classIds } } });
  await db.timetablePeriod.deleteMany({ where: { schoolId } });
  await db.reviewRound.deleteMany({ where: { schoolId } });
  await db.leaveRequest.deleteMany({ where: { schoolId } });
  await db.attendanceCover.deleteMany({ where: { schoolId } });
  await db.meetingSlot.deleteMany({ where: { schoolId } }).catch(() => {});
  await db.remarkThread.deleteMany({ where: { schoolId } });
  await db.post.deleteMany({ where: { schoolId } });
  await db.holiday.deleteMany({ where: { schoolId } });
  await db.earnedBadge.deleteMany({ where: { schoolId } });
  await db.academicYear.deleteMany({ where: { schoolId } });
  await db.schoolRecord.deleteMany({ where: { schoolId } });
  await db.enrollment.deleteMany({ where: { classId: { in: classIds } } });
  await db.classTeacher.deleteMany({ where: { classId: { in: classIds } } });
  await db.class.deleteMany({ where: { id: { in: classIds } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.auditLog.deleteMany({ where: { schoolId } });
}

async function setupSchool(name: string, adminEmail: string, grades: string[], perClass: number): Promise<School> {
  const school = await db.school.findFirstOrThrow({ where: { name } });
  const tag = name.includes("North") ? "n" : "s";
  await wipeSim(school.id, tag);
  const adminUser = await db.user.findUniqueOrThrow({ where: { email: adminEmail } });
  const adminM = await db.membership.findFirstOrThrow({ where: { userId: adminUser.id, schoolId: school.id, role: "ADMIN" } });
  const S: School = {
    id: school.id, name, grades,
    admin: ctx({ userId: adminUser.id, membershipId: adminM.id, schoolId: school.id, role: "ADMIN", name: adminUser.name }),
    adminMembershipId: adminM.id,
    principal: null as unknown as ActiveContext,
    teachers: [], classes: [], counter: 0,
  };

  const pr = await makePerson(S, "PRINCIPAL", `ZZ Sim Principal ${name.includes("North") ? "North" : "South"}`);
  S.principal = ctx({ userId: pr.user.id, membershipId: pr.membership.id, schoolId: S.id, role: "PRINCIPAL", name: pr.user.name });

  // One class teacher per grade plus two floating subject teachers.
  for (let i = 0; i < grades.length + 2; i++) {
    const subject = SUBJECTS[i % SUBJECTS.length]!;
    const tname = `ZZ Sim ${pick(FIRST)} ${pick(LAST)}`;
    const t = await makePerson(S, "TEACHER", tname, { subject, birthdate: new Date(Date.UTC(1975 + (i % 20), i % 12, 1 + (i % 27))) });
    S.teachers.push({ ctx: ctx({ userId: t.user.id, membershipId: t.membership.id, schoolId: S.id, role: "TEACHER", name: tname }), membershipId: t.membership.id, subject, name: tname });
  }

  for (const [gi, grade] of grades.entries()) {
    const klass = await db.class.create({
      data: { schoolId: S.id, name: `ZZ Sim Class ${grade}`, gradeLevel: grade, section: "A", subject: "Form group", joinCode: "ZZS-" + classCode().slice(-4), room: `R${gi + 1}` },
    });
    const lead = S.teachers[gi]!;
    await assignTeacher(S.admin, klass.id, lead.membershipId, { role: "LEAD" });
    const pupils: Pupil[] = [];
    const ids: string[] = [];
    const gradeNum = /^\d+$/.test(grade) ? Number(grade) : 0;
    for (let i = 0; i < perClass; i++) {
      const pname = `ZZ Sim ${pick(FIRST)} ${pick(LAST)}`;
      const p = await makePerson(S, "STUDENT", pname, { birthdate: new Date(Date.UTC(2023 - 6 - gradeNum, Math.floor(rand() * 12), 1 + Math.floor(rand() * 28))) });
      pupils.push({ membershipId: p.membership.id, userId: p.user.id, name: pname });
      ids.push(p.membership.id);
      // A parent for most, linked as a claim would link them.
      if (rand() < 0.85) {
        S.counter += 1;
        const parent = await db.user.create({ data: { email: `zz.sim.parent.${S.name.includes("North") ? "n" : "s"}.${S.counter}@zz.test`, name: `ZZ Sim ${pick(LAST)} (parent)`, prefs: "{}", passwordHash: "$argon2id$unknowable$" + randomBytes(18).toString("base64url"), emailVerifiedAt: new Date() } });
        await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: p.membership.id, studentSchoolId: S.id, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
      }
    }
    const enrol = await timed("enrolStudents", () => enrolStudents(S.admin, klass.id, ids));
    if (!enrol.ok || enrol.added !== ids.length) note(`${name}: enrolStudents added ${enrol.added}/${ids.length} into ${klass.name}`);
    S.classes.push({ id: klass.id, name: klass.name, grade, pupils, lead });
  }

  // The school day, then a lesson a day per class from the lead and a subject teacher.
  const day = await applySuggestedDay(S.admin);
  if (!day.ok) note(`${name}: applySuggestedDay failed ${JSON.stringify(day)}`);
  const periods = (await listPeriods(S.id)).filter((p) => p.kind !== "BREAK");
  for (const [gi, klass] of S.classes.entries()) {
    for (let wd = 1; wd <= 5; wd++) {
      const p1 = periods[0]!;
      const r1 = await setSlot(S.admin, { classId: klass.id, periodId: p1.id, weekday: wd, subject: klass.lead.subject, teacherMembershipId: klass.lead.membershipId });
      if (!r1.ok) note(`${name}: setSlot lead failed ${JSON.stringify(r1)} for ${klass.name} wd${wd}`);
      // Two floating subject teachers, each in a different period per class,
      // so one teacher is never asked to be in two rooms at once — the clash
      // check is real and refuses exactly that. Only as many classes as there
      // are free periods get one.
      const free = periods.length - 1;
      if (gi < free * 2) {
        const floater = S.teachers[S.teachers.length - 1 - Math.floor(gi / free)]!;
        const p2 = periods[1 + (gi % free)]!;
        const r2 = await setSlot(S.admin, { classId: klass.id, periodId: p2.id, weekday: wd, subject: floater.subject, teacherMembershipId: floater.membershipId });
        if (!r2.ok && wd === 1) note(`${name}: setSlot floater refused ${JSON.stringify(r2)} (${klass.name})`);
      }
    }
  }
  return S;
}

function statusFor(): "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" {
  const r = rand();
  if (r < 0.91) return "PRESENT";
  if (r < 0.94) return "LATE";
  if (r < 0.985) return "ABSENT";
  return "EXCUSED";
}

async function runYear(S: School, yearIndex: number, startKey: string, endKey: string) {
  const yearName = `${startKey.slice(0, 4)}–${endKey.slice(2, 4)}`;
  const current = await currentAcademicYear(S.id);
  if (!current || current.name !== yearName) {
    const id = await createAcademicYear(S.admin, { name: yearName, startDate: new Date(`${startKey}T00:00:00Z`), endDate: new Date(`${endKey}T00:00:00Z`) });
    if (!current) {
      /* first year becomes current on creation */
    } else {
      note(`${S.name}: year ${yearName} created while ${current.name} still current — closing handled at year end`);
    }
    void id;
  }

  // Calendar: Diwali (5 days in Nov), winter (Dec 24 – Jan 1), summer ends the year.
  const y = Number(startKey.slice(0, 4));
  await createHoliday(S.admin, { name: "Diwali break", startDateKey: `${y}-11-10`, endDateKey: `${y}-11-14`, kind: "HOLIDAY" });
  await createHoliday(S.admin, { name: "Winter break", startDateKey: `${y}-12-24`, endDateKey: `${y + 1}-01-01`, kind: "HOLIDAY" });
  await createHoliday(S.admin, { name: "Sports day", startDateKey: `${y + 1}-01-26`, endDateKey: `${y + 1}-01-26`, kind: "EVENT" });

  // Exams: unit test (Sep), mid-term (Dec), final (Apr), per grade.
  const examPlan: { name: string; kind: string; month: string; days: number }[] = [
    { name: `Unit Test 1 ${yearName}`, kind: "UNIT_TEST", month: `${y}-09`, days: 15 },
    { name: `Mid-term ${yearName}`, kind: "MID_TERM", month: `${y}-12`, days: 8 },
    { name: `Final ${yearName}`, kind: "FINAL", month: `${y + 1}-04`, days: 6 },
  ];
  const examDates = new Map<string, { seriesId: string; slots: { id: string; subject: string; dateKey: string; max: number }[] }>();
  for (const klass of S.classes) {
    for (const ex of examPlan) {
      const seriesId = await timed("createSeries", () => createSeries(S.admin, { name: ex.name, gradeLevel: klass.grade, kind: ex.kind }));
      const slots: { id: string; subject: string; dateKey: string; max: number }[] = [];
      for (const [si, subject] of SUBJECTS.slice(0, 4).entries()) {
        const dateKey = `${ex.month}-${String(ex.days + si).padStart(2, "0")}`;
        await timed("addSlot", () => addSlot(S.admin, seriesId, { subject, dateKey, maxMarks: ex.kind === "UNIT_TEST" ? 50 : 100, startMinute: 9 * 60, endMinute: 11 * 60 }));
      }
      await publishSeries(S.admin, seriesId);
      const series = (await listSeries(S.admin)).find((s) => s.id === seriesId);
      for (const slot of series?.slots ?? []) slots.push({ id: slot.id, subject: slot.subject, dateKey: slot.dateKey, max: Math.round(slot.pointsMilli / 1000) });
      examDates.set(`${klass.id}:${ex.kind}`, { seriesId, slots });
    }
  }

  // Review round opens in February, one per year.
  let roundId: string | null = null;

  // Leave: three requests a year, approved by the principal.
  const leaveDays = [`${y}-08-18`, `${y}-10-06`, `${y + 1}-02-09`];

  // The days of the year.
  let assignmentsThisMonth = new Map<string, number>();
  let lastMonth = "";
  let dayCount = 0;
  for (let key = startKey; key <= endKey; key = addDaysToKey(key, 1)) {
    const month = key.slice(0, 7);
    if (month !== lastMonth) {
      lastMonth = month;
      assignmentsThisMonth = new Map();
      // A post a month from the office.
      await timed("createPost", () =>
        createPost(S.admin, { scope: "SCHOOL", title: `Notes for ${month}`, body: `What is happening at ${S.name} in ${month}.`, tags: [], media: [], category: "UPDATES" }),
      ).catch((e) => note(`${S.name}: createPost failed ${String(e)}`));
    }

    if (!isTeachingDay(key)) continue;
    const closed = await closedOn(S.id, key);
    if (closed.closed) continue;
    dayCount += 1;

    for (const klass of S.classes) {
      // Register, by the class teacher, one batch per class-day.
      const marks = klass.pupils.map((p) => ({ studentMembershipId: p.membershipId, status: statusFor(), clientId: `${klass.id}:${key}:${p.membershipId}` }));
      const res = await timed("saveAttendanceBatch", () =>
        saveAttendanceBatch({ schoolId: S.id, classId: klass.id, dateKey: key, marks, takenByMembershipId: klass.lead.membershipId, actorUserId: klass.lead.ctx.user.id, notify: false }),
      );
      if (res.rejected.length > 0 && dayCount === 1) note(`${S.name}: register rejected ${res.rejected.length} marks on ${key} for ${klass.name}: ${JSON.stringify(res.rejected[0])}`);

      // Homework: two a month per class, marked a week later.
      const n = assignmentsThisMonth.get(klass.id) ?? 0;
      if (n < 2 && Number(key.slice(8)) % 12 === 3 + n * 6) {
        assignmentsThisMonth.set(klass.id, n + 1);
        const tctx = { schoolId: S.id, membershipId: klass.lead.membershipId, role: "TEACHER" as const, userId: klass.lead.ctx.user.id };
        const a = await timed("createAssignment", () =>
          createAssignment(tctx, { classId: klass.id, title: `${klass.lead.subject} homework ${month} #${n + 1}`, body: "Questions from the chapter.", category: "Homework", points: 20, dueAt: `${addDaysToKey(key, 4)}T10:00:00Z`, publish: true }),
        );
        const grades = klass.pupils.filter(() => rand() < 0.9).map((p) => ({ studentMembershipId: p.membershipId, score: Math.round(8 + rand() * 12) }));
        const g = await timed("saveGrades", () => saveGrades(tctx, a.assignmentId, grades, { notifyStudents: false }));
        if (g.rejected.length > 0) note(`${S.name}: saveGrades rejected ${g.rejected.length} for ${klass.name}`);
      }

      // Exam marks on the day after each paper.
      for (const ex of examPlan) {
        const plan = examDates.get(`${klass.id}:${ex.kind}`)!;
        for (const slot of plan.slots) {
          if (addDaysToKey(slot.dateKey, 1) === key) {
            const entries = klass.pupils.map((p) => ({ membershipId: p.membershipId, marks: rand() < 0.97 ? Math.round(slot.max * (0.35 + rand() * 0.6)) : null }));
            const r = await timed("saveMarks", () => saveMarks(klass.lead.ctx, slot.id, klass.id, entries));
            if (r.saved === 0) note(`${S.name}: saveMarks saved 0 for ${klass.name} ${slot.subject}`);
          }
        }
        // Cards after the last paper of the mid-term and final.
        if (ex.kind !== "UNIT_TEST") {
          const last = plan.slots.map((s) => s.dateKey).sort().at(-1)!;
          if (addDaysToKey(last, 3) === key) {
            const sittings = await db.assignment.findMany({ where: { classId: klass.id, examSlotId: { in: plan.slots.map((s) => s.id) } }, select: { id: true } });
            const gen = await timed("generateCards", () => generateCards(klass.lead.ctx, klass.id, { title: ex.name, assignmentIds: sittings.map((s) => s.id) }));
            if (!gen.ok) note(`${S.name}: generateCards failed ${gen.errorKey} for ${klass.name} ${ex.name}`);
            else {
              const pub = await timed("publishCards", () => publishCards(klass.lead.ctx, klass.id, ex.name));
              if (!pub.ok) note(`${S.name}: publishCards failed ${pub.errorKey} for ${klass.name}`);
            }
          }
        }
      }
    }

    // Leave.
    if (leaveDays.includes(key)) {
      const t = S.teachers[(leaveDays.indexOf(key) + yearIndex) % S.teachers.length]!;
      const applied = await timed("applyForLeave", () => applyForLeave(t.ctx, { fromDateKey: addDaysToKey(key, 2), toDateKey: addDaysToKey(key, 3), kind: "SICK", reason: "Unwell" }));
      if (!applied.ok) note(`${S.name}: applyForLeave failed ${applied.errorKey} for ${t.name}`);
      else {
        const cover = S.teachers[(S.teachers.indexOf(t) + 1) % S.teachers.length]!;
        const decided = await timed("decideLeave", () => decideLeave(S.principal, applied.id!, "APPROVED", { coverMembershipId: cover.membershipId }));
        if (!decided.ok) note(`${S.name}: decideLeave failed ${decided.errorKey}`);
      }
    }

    // A message home once a month from a class teacher, and a meeting slot booked.
    if (Number(key.slice(8)) === 10) {
      const klass = S.classes[dayCount % S.classes.length]!;
      const pupil = klass.pupils[0]!;
      await timed("createThread", () => createThread(klass.lead.ctx, { studentMembershipId: pupil.membershipId, subject: "A quick update", body: `${pupil.name} worked well this week.` })).catch((e) => note(`${S.name}: createThread failed ${String(e)}`));
      const slots = await timed("publishSlots", () => publishSlots(klass.lead.ctx, { startsAt: new Date(`${addDaysToKey(key, 5)}T09:30:00Z`), durationMinutes: 15, count: 3, location: "R1" })).catch(() => ({ created: 0 }));
      if (slots.created > 0) {
        const guardian = await db.guardianship.findFirst({ where: { studentMembershipId: pupil.membershipId, status: "ACTIVE" } });
        if (guardian) {
          const open = await openSlotsFor(guardian.parentUserId).catch(() => []);
          const mine = (open as { id: string }[])[0];
          if (mine) await timed("bookSlot", () => bookSlot(guardian.parentUserId, mine.id, pupil.membershipId)).catch((e) => note(`${S.name}: bookSlot failed ${String(e)}`));
        }
      }
    }

    // Reviews: open in February, answered by half the pupils, closed in March.
    if (key === `${y + 1}-02-02`) {
      const r = await openReviewRound(S.admin, { teacherMembershipIds: S.teachers.map((t) => t.membershipId), audience: "STUDENTS", closesDateKey: `${y + 1}-03-01` });
      if (!r.ok) note(`${S.name}: openReviewRound failed ${r.errorKey}`);
      roundId = r.roundId ?? null;
      if (roundId) {
        let answered = 0;
        for (const klass of S.classes) {
          for (const p of klass.pupils) {
            if (rand() < 0.5) {
              const pctx = ctx({ userId: p.userId, membershipId: p.membershipId, schoolId: S.id, role: "STUDENT", name: p.name });
              const scores = Object.fromEntries(["CLARITY", "SUPPORT", "FAIRNESS", "ENGAGEMENT", "RESPECT"].map((q) => [q, 2 + Math.round(rand() * 3)]));
              const s = await timed("submitReview", () => submitReview(pctx, { roundId: roundId!, teacherMembershipId: klass.lead.membershipId, scores }));
              if (s.ok) answered += 1;
              else if (answered === 0) note(`${S.name}: submitReview refused ${s.errorKey}`);
            }
          }
        }
      }
    }
    if (key === `${y + 1}-03-02` && roundId) await closeReviewRound(S.admin, roundId);
  }
  console.log(`${S.name} ${yearName}: ${dayCount} teaching days`);
}

async function yearEnd(S: School, nextStart: string, nextEnd: string, intakePerClass: number) {
  const nextName = `${nextStart.slice(0, 4)}–${nextEnd.slice(2, 4)}`;
  const current = await currentAcademicYear(S.id);
  const nextId = await createAcademicYear(S.admin, { name: nextName, startDate: new Date(`${nextStart}T00:00:00Z`), endDate: new Date(`${nextEnd}T00:00:00Z`) });
  if (current) {
    const closed = await timed("closeAcademicYear", () => closeAcademicYear(S.admin, current.id, nextId));
    console.log(`${S.name}: closed ${current.name} — ${closed.studentsArchived} pupils, ${closed.badgesArchived} badges`);
  }

  // Promotion from the plan's own suggestions, with one repeater per class.
  const plan = await promotionPlan(S.admin);
  const moves = plan.map((row) => ({
    fromClassId: row.id,
    to: row.suggested,
    holdBack: row.pupils.length > 3 ? [row.pupils[0]!.membershipId] : [],
  }));
  const before = plan.map((r) => `${r.name}→${r.suggested.kind}${r.suggested.kind === "NEW" ? ":" + r.suggested.name : ""}`).join(", ");
  const result = await timed("promoteSchool", () => promoteSchool(S.admin, moves, { lastDayKey: nextStart.slice(0, 4) + "-04-30" }));
  console.log(`${S.name}: promoted — ${JSON.stringify(result)} [${before}]`);
  if (plan.some((r) => r.suggested.kind === "STAY" && r.pupils.length > 0)) {
    note(`${S.name}: plan suggested STAY for a class with pupils: ${plan.filter((r) => r.suggested.kind === "STAY" && r.pupils.length > 0).map((r) => `${r.name} (grade ${r.gradeLevel})`).join(", ")}`);
  }

  // Re-read the classes: new ones exist, old ones archived, pupils moved.
  const fresh = await db.class.findMany({ where: { schoolId: S.id, archivedAt: null }, include: { enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: true } } } }, teachers: true } });
  S.classes = [];
  for (const c of fresh) {
    // New classes have no teacher: the office staffs them — here the lead is
    // the teacher whose number matches, which is what a real office does too.
    let lead = S.teachers.find((t) => c.teachers.some((ct) => ct.teacherMembershipId === t.membershipId));
    if (!lead) {
      lead = S.teachers[S.classes.length % (S.teachers.length - 2)]!;
      await assignTeacher(S.admin, c.id, lead.membershipId, { role: "LEAD" });
    }
    const pupils: Pupil[] = c.enrollments.map((e) => ({ membershipId: e.studentMembershipId, userId: e.student.userId, name: e.student.user.name }));
    S.classes.push({ id: c.id, name: c.name, grade: c.gradeLevel ?? "", pupils, lead });
  }
  // New intake into the lowest grade.
  const lowest = S.classes.find((c) => c.grade === S.grades[0]);
  if (lowest) {
    const ids: string[] = [];
    for (let i = 0; i < intakePerClass; i++) {
      const pname = `ZZ Sim ${pick(FIRST)} ${pick(LAST)}`;
      const p = await makePerson(S, "STUDENT", pname, { birthdate: new Date(Date.UTC(Number(nextStart.slice(0, 4)) - 6, 5, 1 + i)), joinedAt: new Date(`${nextStart}T00:00:00Z`) });
      lowest.pupils.push({ membershipId: p.membership.id, userId: p.user.id, name: pname });
      ids.push(p.membership.id);
    }
    await enrolStudents(S.admin, lowest.id, ids);
  } else {
    note(`${S.name}: no class at the lowest grade ${S.grades[0]} after promotion — intake had nowhere to go`);
  }
  // Timetable for the new classes: the old slots died with the archived classes.
  const periods = (await listPeriods(S.id)).filter((p) => p.kind !== "BREAK");
  for (const klass of S.classes) {
    const has = await db.timetableSlot.count({ where: { classId: klass.id } });
    if (has > 0) continue;
    for (let wd = 1; wd <= 5; wd++) {
      await setSlot(S.admin, { classId: klass.id, periodId: periods[0]!.id, weekday: wd, subject: klass.lead.subject, teacherMembershipId: klass.lead.membershipId });
    }
  }
}

describe("three academic years of two schools", () => {
  it("runs", async () => {
    const north = await setupSchool("ZZ Sim North School", "zz.sim.admin.n@zz.test", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], 25);
    const south = await setupSchool("ZZ Sim South School", "zz.sim.admin.s@zz.test", ["K", "1", "2", "3", "4", "5", "6", "7", "8"], 20);
    console.log(`setup: north ${north.classes.length} classes, south ${south.classes.length} classes`);

    const years: [string, string][] = [["2023-06-01", "2024-04-30"], ["2024-06-01", "2025-04-30"], ["2025-06-01", "2026-04-30"]];
    for (const [i, [start, end]] of years.entries()) {
      for (const S of [north, south]) {
        await runYear(S, i, start, end);
        const next = years[i + 1] ?? ["2026-06-01", "2027-04-30"];
        await yearEnd(S, next[0], next[1], S === north ? 25 : 20);
      }
    }

    const summary = Object.entries(LOG).map(([k, v]) => `${k}: n=${v.n} avg=${(v.ms / v.n).toFixed(1)}ms max=${v.max.toFixed(0)}ms total=${(v.ms / 1000).toFixed(1)}s`).join("\n");
    console.log("\n" + summary);
    writeFileSync("scripts/sim/last-run.log", summary + "\n\nFINDINGS\n" + FINDINGS.join("\n") + "\n");
  });
});
