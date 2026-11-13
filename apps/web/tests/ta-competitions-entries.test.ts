/**
 * Competitions, the entries and the boards (testing analysis of 13 November 2026, the 'competitions' batch).
 *
 *   TA-100  A competition that asks for no consent still read every pupil's entry as waiting on a guardian: the
 *           page and the phone hid the hand-in, the guardian was asked for a yes, staff saw "waiting".
 *   TA-103  A college student was refused by a crawled college competition's band (13 to 13), because their
 *           year of study (2) was compared with 13.
 *   TA-319  The competition's page printed the start of a calendar event a day early: the school's midnight in
 *           India is 18:30 UTC the evening before, and the page formatted it in UTC.
 *   TA-321  The whole-school board gave a pupil and a guardian the top five pupils' scores; the decision gives
 *           them first name, class and place, and their own score.
 *   TA-416  A hand-in racing a result put a ranked entry back to SUBMITTED; two guardians saying yes together told
 *           the child twice; the school's standing was recomputed outside any transaction.
 *
 * Runs as the database owner with a ZZ school and a ZZ college of its own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { addDaysToKey, formatDate, todayKey } from "@/lib/dates";
import { createCompetitionEvent } from "@/lib/competition-events";
import { enterCompetition, getCompetition, giveConsent, internalBoard, listEntriesForResults, pendingConsents, recordResult, submitEntry } from "@/lib/competitions";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { PLATFORM_FEATURES } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ALL = [...PLATFORM_FEATURES];
const users: string[] = [];
const ids = { school: "", college: "", admin: "", adminM: "", teacher: "", teacherM: "", parent: "", parent2: "", a: "", aU: "", b: "", bU: "", c: "", cU: "", nine: "", nineU: "", collegeStudent: "", collegeStudentU: "", junior: "", juniorU: "", classId: "" };
const platformIds: string[] = [];

function ctx(userId: string, role: string, schoolId: string | null = null, membershipId: string | null = null): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role: role as ActiveContext["role"],
    user: { id: userId, name: "ZZ TA Competitions", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const office = () => ctx(ids.admin, "ADMIN", ids.school, ids.adminM);
const teacher = () => ctx(ids.teacher, "TEACHER", ids.school, ids.teacherM);
const pupil = (who: "a" | "b" | "c" | "nine") => ctx(ids[`${who}U` as const], "STUDENT", ids.school, ids[who]);
const parent = () => ctx(ids.parent, "PARENT");
const parent2 = () => ctx(ids.parent2, "PARENT");
const collegeStudent = () => ctx(ids.collegeStudentU, "STUDENT", ids.college, ids.collegeStudent);
const juniorCollege = () => ctx(ids.juniorU, "STUDENT", ids.college, ids.junior);

async function own(data: { organizerSchoolId?: string | null; requiresParentConsent: boolean; internalBoard?: string; title: string; gradeLow?: string | null; gradeHigh?: string | null; audience?: string | null }) {
  const row = await db.competition.create({
    data: { organizerSchoolId: data.organizerSchoolId === undefined ? ids.school : data.organizerSchoolId, organizerName: "ZZ TA Competitions", title: `ZZ TA ${data.title} ${STAMP}`, summary: "ZZ", status: "PUBLISHED", enrolmentOpen: true, requiresParentConsent: data.requiresParentConsent, internalBoard: data.internalBoard ?? "OFF", gradeLow: data.gradeLow ?? null, gradeHigh: data.gradeHigh ?? null, audience: data.audience ?? null },
    select: { id: true },
  });
  if (data.organizerSchoolId === null) platformIds.push(row.id);
  return row.id;
}

beforeAll(async () => {
  const mkSchool = async (tag: string, kind: string) => (await db.school.create({ data: { name: `ZZ TA Comp ${tag} ${STAMP}`, slug: `zz-ta-comp-${tag.toLowerCase()}-${STAMP}`, code: `ZK${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-ta-comp-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, kind, isTestFixture: true }, select: { id: true } })).id;
  ids.school = await mkSchool("School", "SCHOOL");
  ids.college = await mkSchool("College", "COLLEGE");
  const mk = async (who: string) => {
    const u = await db.user.create({ data: { name: `ZZ TA Comp ${who}`, email: `zz-ta-comp-${who.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
    users.push(u.id);
    return u.id;
  };
  const member = async (userId: string, schoolId: string, role: string, extra: Record<string, unknown> = {}) => (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  ids.admin = await mk("Admin");
  ids.adminM = await member(ids.admin, ids.school, "ADMIN");
  ids.teacher = await mk("Teacher");
  ids.teacherM = await member(ids.teacher, ids.school, "TEACHER");
  ids.parent = await mk("Parent");
  ids.parent2 = await mk("Parent Two");
  ids.aU = await mk("Asha Rao");
  ids.a = await member(ids.aU, ids.school, "STUDENT", { studentCode: `ZKA${STAMP}`, gradeLevel: "5" });
  ids.bU = await mk("Bela Rao");
  ids.b = await member(ids.bU, ids.school, "STUDENT", { studentCode: `ZKB${STAMP}`, gradeLevel: "5" });
  ids.cU = await mk("Chitra Rao");
  ids.c = await member(ids.cU, ids.school, "STUDENT", { studentCode: `ZKC${STAMP}`, gradeLevel: "5" });
  ids.nineU = await mk("Nina Rao");
  ids.nine = await member(ids.nineU, ids.school, "STUDENT", { studentCode: `ZKN${STAMP}`, gradeLevel: "9" });
  ids.collegeStudentU = await mk("Kiran Rao");
  ids.collegeStudent = await member(ids.collegeStudentU, ids.college, "STUDENT", { studentCode: `ZKK${STAMP}`, gradeLevel: "2" });
  ids.juniorU = await mk("Jaya Rao");
  ids.junior = await member(ids.juniorU, ids.college, "STUDENT", { studentCode: `ZKJ${STAMP}`, gradeLevel: "11" });
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.parent, studentMembershipId: ids.a, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.parent, studentMembershipId: ids.c, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.parent2, studentMembershipId: ids.c, studentSchoolId: ids.school, status: "ACTIVE" },
    ],
  });
  ids.classId = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZK${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [ids.a, ids.b, ids.c].map((studentMembershipId) => ({ classId: ids.classId, schoolId: ids.school, studentMembershipId, status: "ACTIVE", enrolledAt: new Date() })) });
}, 60_000);

afterEach(() => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
});

afterAll(async () => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
  if (platformIds.length) {
    await db.competitionStanding.deleteMany({ where: { competitionId: { in: platformIds } } });
    await db.competitionEntry.deleteMany({ where: { competitionId: { in: platformIds }, schoolId: { in: [ids.school, ids.college] } } });
    await db.competition.deleteMany({ where: { id: { in: platformIds }, organizerSchoolId: null } });
  }
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.college] } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 60_000);

describe("TA-100: a competition that asks for no consent", () => {
  it("TA-100: the pupil's own entry is not waiting on anyone: not on the page, not on the guardian's list, not on the staff's entries", async () => {
    const free = await own({ requiresParentConsent: false, title: "TA-100 free" });
    const entered = await enterCompetition(pupil("a"), free);
    expect(entered.awaitingConsent).toBe(false);
    expect((await getCompetition(pupil("a"), free)).entry?.awaitingConsent).toBe(false);
    expect((await getCompetition(parent(), free)).entry?.awaitingConsent).toBe(false);
    expect((await pendingConsents(parent())).filter((w) => w.competitionId === free)).toEqual([]);
    expect((await listEntriesForResults(teacher(), free)).map((e) => e.awaitingConsent)).toEqual([false]);
    // Pressing Enrol again answers the same.
    expect((await enterCompetition(pupil("a"), free)).awaitingConsent).toBe(false);
    // The hand-in the page now offers is taken.
    await expect(submitEntry(pupil("a"), free, "https://example.invalid/zz-ta100")).resolves.toBeUndefined();
  });

  it("TA-100: where the office asked for consent the pupil's entry still waits for a guardian", async () => {
    const asked = await own({ requiresParentConsent: true, title: "TA-100 asked" });
    expect((await enterCompetition(pupil("a"), asked)).awaitingConsent).toBe(true);
    expect((await getCompetition(pupil("a"), asked)).entry?.awaitingConsent).toBe(true);
    expect((await pendingConsents(parent())).filter((w) => w.competitionId === asked)).toHaveLength(1);
    expect((await listEntriesForResults(teacher(), asked)).map((e) => e.awaitingConsent)).toEqual([true]);
  });
});

describe("TA-321: the whole-school board", () => {
  it("TA-321: a pupil and a guardian read the places by first name and class, with a score only on their own row; staff read every score", async () => {
    const quiz = await own({ requiresParentConsent: false, internalBoard: "SCHOOL", title: "TA-321 board" });
    const ea = await enterCompetition(pupil("a"), quiz);
    const eb = await enterCompetition(pupil("b"), quiz);
    await recordResult(teacher(), eb.entryId, { scoreMilli: 9000, rank: 1 });
    await recordResult(teacher(), ea.entryId, { scoreMilli: 8000, rank: 2 });

    const mine = await internalBoard(pupil("a"), quiz);
    expect(mine.rows.map((r) => [r.place, r.name, r.className, r.mine, r.scoreMilli, r.rank])).toEqual([
      [1, "ZZ", "ZZ 5A", false, null, 1],
      [2, "ZZ", "ZZ 5A", true, 8000, 2],
    ]);
    const home = await internalBoard(parent(), quiz, { studentMembershipId: ids.a });
    expect(home.rows.map((r) => r.scoreMilli)).toEqual([null, 8000]);
    const staff = await internalBoard(teacher(), quiz);
    expect(staff.rows.map((r) => r.scoreMilli)).toEqual([9000, 8000]);
  });
});

describe("TA-319: the calendar event's start, as the page prints it", () => {
  it("TA-319: the competition carries the organising school's zone, in which its start is the calendar's day", async () => {
    const startKey = addDaysToKey(TODAY, 20);
    const made = await createCompetitionEvent(office(), { title: "ZZ TA-319 Quiz", summary: "ZZ one line", startDateKey: startKey, endDateKey: startKey, enrolmentOpen: true, internalBoard: "OFF" });
    const c = await getCompetition(pupil("a"), made.competitionId);
    const zone = c.timeZone;
    expect(zone).toBe(TZ);
    expect(formatDate(c.startsAt!, zone)).toBe(formatDate(new Date(`${startKey}T12:00:00Z`)));
    expect(formatDate(c.endsAt!, zone)).toBe(formatDate(new Date(`${startKey}T12:00:00Z`)));
  });
});

describe("TA-103: a college student and a college competition's band", () => {
  it("TA-103: a student in their second year enters a platform competition banded for college (13 to 13); a class 9 pupil is still refused", async () => {
    setFeaturesForTests(ALL);
    const hack = await own({ organizerSchoolId: null, requiresParentConsent: false, title: "TA-103 hackathon", gradeLow: "13", gradeHigh: "13", audience: "COLLEGE" });
    const entered = await enterCompetition(collegeStudent(), hack);
    expect(entered.awaitingConsent).toBe(false);
    await expect(enterCompetition(pupil("nine"), hack)).rejects.toMatchObject({ key: "access.notForYourGrade" });
    // A band of 9 to 13 lets the college student in too, and still holds a class 5 pupil out.
    const wide = await own({ organizerSchoolId: null, requiresParentConsent: false, title: "TA-103 wide", gradeLow: "9", gradeHigh: "13", audience: null });
    await expect(enterCompetition(collegeStudent(), wide)).resolves.toMatchObject({ awaitingConsent: false });
    await expect(enterCompetition(pupil("b"), wide)).rejects.toMatchObject({ key: "access.notForYourGrade" });
  });

  it("TA-103: a junior college's class 11 student at a college still enters a platform competition banded 11 to 12, and not one banded for college", async () => {
    setFeaturesForTests(ALL);
    const senior = await own({ organizerSchoolId: null, requiresParentConsent: false, title: "TA-103 classes 11-12", gradeLow: "11", gradeHigh: "12", audience: null });
    await expect(enterCompetition(juniorCollege(), senior)).resolves.toMatchObject({ awaitingConsent: false });
    await expect(enterCompetition(collegeStudent(), senior)).rejects.toMatchObject({ key: "access.notForYourGrade" });
    const degree = await own({ organizerSchoolId: null, requiresParentConsent: false, title: "TA-103 degree only", gradeLow: "13", gradeHigh: "13", audience: "COLLEGE" });
    await expect(enterCompetition(juniorCollege(), degree)).rejects.toMatchObject({ key: "access.notForYourGrade" });
  });

  it("TA-103: a college's own competition still reads its band as the college keeps its years", async () => {
    const ownYears = await own({ organizerSchoolId: ids.college, requiresParentConsent: false, title: "TA-103 college own", gradeLow: "3", gradeHigh: "4" });
    await expect(enterCompetition(collegeStudent(), ownYears)).rejects.toMatchObject({ key: "access.notForYourGrade" });
  });
});

describe("TA-416: entries under two presses at once", () => {
  it("TA-416: a hand-in that read the entry before a result was recorded does not put the ranked entry back to SUBMITTED", async () => {
    const comp = await own({ requiresParentConsent: false, title: "TA-416 hand-in" });
    const { entryId } = await enterCompetition(pupil("a"), comp);
    let handIn: Promise<unknown> | null = null;
    await db.$transaction(
      async (tx) => {
        await tx.competitionEntry.update({ where: { id: entryId }, data: { rank: 1, scoreMilli: 7000, status: "RESULTS" } });
        // The hand-in reads the entry (no result yet: the result is not committed) and waits on the row.
        handIn = submitEntry(pupil("a"), comp, "https://example.invalid/zz-ta416").then(
          () => "SAVED",
          (error: { key?: string }) => error.key ?? "ERROR",
        );
        await new Promise((resolve) => setTimeout(resolve, 1_500));
      },
      { timeout: 20_000 },
    );
    expect(await handIn).toBe("access.resultAlreadyRecorded");
    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId }, select: { status: true, rank: true, submissionUrl: true } });
    expect(row).toEqual({ status: "RESULTS", rank: 1, submissionUrl: null });
  });

  it("TA-416: two guardians saying yes together stamp the entry once and tell the child once", async () => {
    const comp = await own({ requiresParentConsent: true, title: "TA-416 consent" });
    const { entryId } = await enterCompetition(pupil("c"), comp);
    await Promise.all([giveConsent(parent(), entryId), giveConsent(parent2(), entryId)]);
    const told = await db.notification.count({ where: { userId: ids.cU, titleKey: "notifTitle.youAreEntered", url: `/competitions/${comp}` } });
    expect(told).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "competition.consent", meta: { contains: entryId } } })).toBe(1);
  });

  it("TA-416: two results recorded together for one school leave its standing counting both entrants", async () => {
    const comp = await own({ requiresParentConsent: false, title: "TA-416 standing" });
    const ea = await enterCompetition(pupil("a"), comp);
    const eb = await enterCompetition(pupil("b"), comp);
    const wrong: number[] = [];
    for (let round = 0; round < 15; round++) {
      await Promise.all([recordResult(teacher(), ea.entryId, { scoreMilli: 1000 + round, rank: null }), recordResult(teacher(), eb.entryId, { scoreMilli: 2000 + round, rank: null })]);
      const standing = await db.competitionStanding.findUnique({ where: { competitionId_schoolId: { competitionId: comp, schoolId: ids.school } }, select: { entrants: true, bestScoreMilli: true } });
      if (standing?.entrants !== 2 || standing.bestScoreMilli !== 2000 + round) wrong.push(round);
      await recordResult(teacher(), ea.entryId, { scoreMilli: null, rank: null });
      await recordResult(teacher(), eb.entryId, { scoreMilli: null, rank: null });
    }
    expect(wrong).toEqual([]);
  }, 120_000);
});
