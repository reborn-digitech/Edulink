/**
 * COMPETITIONS ON THE CALENDAR (decision 0007, 6 November 2026; src/lib/competition-events.ts, the calendar half
 * of src/lib/competitions.ts, src/lib/agenda.ts).
 *
 * What is proved: the office's one act makes the Competition and its calendar row together, and a rule the
 * event breaks makes neither; editing moves both; removing deletes the competition while nobody has entered and
 * archives it (entries kept) once somebody has; the plain holiday writes refuse the kind and the plain delete
 * keeps the two in step; a pupil's own enrolment waits for a guardian and a guardian's enrolment is the consent;
 * the office's enrolment switch closes enrolment whatever the dates say; the three board settings show each
 * reader exactly what the decision says (staff full names, a pupil and a guardian first names and their own
 * place, nobody across schools, nothing under OFF); the marketplace's switch hides the platform's competitions
 * and the STUDENT plan locks them for a pupil while the school's own stay free; and the agenda row says what the
 * viewer may do.
 *
 * Runs as the database owner, so the tenant fence is asserted at the query level; `npm run rls:verify` holds the
 * policies. Two ZZ schools of its own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { createHoliday, deleteHoliday, updateHoliday } from "@/lib/holidays";
import { createCompetitionEvent, listCompetitionEvents, normaliseEvent, removeCompetitionEvent, syncCalendarRow, updateCompetitionEvent } from "@/lib/competition-events";
import { enrolStateFor, enterCompetition, getCompetition, internalBoard, listCompetitions, recordResult, setCompetitionStatus } from "@/lib/competitions";
import { familyAgenda } from "@/lib/agenda";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { PLATFORM_FEATURES } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const day = (n: number) => addDaysToKey(TODAY, n);
const ALL = [...PLATFORM_FEATURES];

const ids = { school: "", other: "", adminUser: "", adminMembership: "", headMembership: "", headUser: "", teacherUser: "", teacherMembership: "", parentUser: "", otherParentUser: "", pupilUser: "", pupil: "", pupil2User: "", pupil2: "", pupil3: "", pupil3User: "", otherAdminUser: "", otherAdminMembership: "", otherPupilUser: "", otherPupil: "", classId: "" };

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Event Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const office = () => ctx({ userId: ids.adminUser, membershipId: ids.adminMembership, schoolId: ids.school, role: "ADMIN" });
const head = () => ctx({ userId: ids.headUser, membershipId: ids.headMembership, schoolId: ids.school, role: "PRINCIPAL" });
const teacher = () => ctx({ userId: ids.teacherUser, membershipId: ids.teacherMembership, schoolId: ids.school, role: "TEACHER" });
const parent = () => ctx({ userId: ids.parentUser, role: "PARENT" });
const otherParent = () => ctx({ userId: ids.otherParentUser, role: "PARENT" });
const pupil = () => ctx({ userId: ids.pupilUser, membershipId: ids.pupil, schoolId: ids.school, role: "STUDENT" });
const pupil3 = () => ctx({ userId: ids.pupil3User, membershipId: ids.pupil3, schoolId: ids.school, role: "STUDENT" });
const otherOffice = () => ctx({ userId: ids.otherAdminUser, membershipId: ids.otherAdminMembership, schoolId: ids.other, role: "ADMIN" });
const otherPupil = () => ctx({ userId: ids.otherPupilUser, membershipId: ids.otherPupil, schoolId: ids.other, role: "STUDENT" });

const EVENT = { title: "ZZ Inter-house quiz", summary: "ZZ two rounds in the hall", startDateKey: day(10), endDateKey: day(11), registrationClosesDateKey: day(9), gradeLow: "5", gradeHigh: "6", enrolmentOpen: true, internalBoard: "SCHOOL" as const };

beforeAll(async () => {
  const mkSchool = async (tag: string) => (await db.school.create({ data: { name: `ZZ Event ${tag} ${STAMP}`, slug: `zz-event-${tag.toLowerCase()}-${STAMP}`, code: `ZE${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-event-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, isTestFixture: true }, select: { id: true } })).id;
  ids.school = await mkSchool("Alpha");
  ids.other = await mkSchool("Beta");
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Event ${who}`, email: `zz-event-${who.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } });
  const [a, h, te, par, opar, pu, pu2, pu3, oa, opu] = await Promise.all([mk("Admin"), mk("Head"), mk("Teacher"), mk("Parent"), mk("Other Parent"), mk("Asha Rao"), mk("Bela Rao"), mk("Chitra Rao"), mk("Beta Admin"), mk("Beta Pupil")]);
  ids.adminUser = a.id;
  ids.headUser = h.id;
  ids.teacherUser = te.id;
  ids.parentUser = par.id;
  ids.otherParentUser = opar.id;
  ids.pupilUser = pu.id;
  ids.pupil2User = pu2.id;
  ids.pupil3User = pu3.id;
  ids.otherAdminUser = oa.id;
  ids.otherPupilUser = opu.id;
  const member = async (userId: string, schoolId: string, role: string, extra: Record<string, unknown> = {}) => (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  ids.adminMembership = await member(a.id, ids.school, "ADMIN");
  ids.headMembership = await member(h.id, ids.school, "PRINCIPAL");
  ids.teacherMembership = await member(te.id, ids.school, "TEACHER");
  ids.pupil = await member(pu.id, ids.school, "STUDENT", { studentCode: `ZEA${STAMP}`, gradeLevel: "5" });
  ids.pupil2 = await member(pu2.id, ids.school, "STUDENT", { studentCode: `ZEB${STAMP}`, gradeLevel: "5" });
  ids.pupil3 = await member(pu3.id, ids.school, "STUDENT", { studentCode: `ZEC${STAMP}`, gradeLevel: "9" });
  ids.otherAdminMembership = await member(oa.id, ids.other, "ADMIN");
  ids.otherPupil = await member(opu.id, ids.other, "STUDENT", { studentCode: `ZED${STAMP}`, gradeLevel: "5" });
  await db.guardianship.createMany({
    data: [
      { parentUserId: par.id, studentMembershipId: ids.pupil, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: par.id, studentMembershipId: ids.pupil2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: opar.id, studentMembershipId: ids.pupil3, studentSchoolId: ids.school, status: "ACTIVE" },
    ],
  });
  ids.classId = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZE${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [ids.pupil, ids.pupil2].map((studentMembershipId) => ({ classId: ids.classId, schoolId: ids.school, studentMembershipId, status: "ACTIVE", enrolledAt: new Date() })) });
});

afterEach(() => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
});

afterAll(async () => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
  await db.competition.deleteMany({ where: { organizerSchoolId: null, title: { startsWith: `ZZ Event platform ${STAMP}` } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.other] } } });
  await db.user.deleteMany({ where: { id: { in: [ids.adminUser, ids.headUser, ids.teacherUser, ids.parentUser, ids.otherParentUser, ids.pupilUser, ids.pupil2User, ids.pupil3User, ids.otherAdminUser, ids.otherPupilUser] } } });
  await db.$disconnect();
});

describe("the event's rules", () => {
  it("normalises: the end is the start when left out, enrolment closes on the last day when left out, and the span and the board are checked", () => {
    const clean = normaliseEvent({ title: " ZZ Quiz ", summary: "ZZ one line", startDateKey: "2026-12-11", enrolmentOpen: true, internalBoard: "OFF" });
    expect([clean.title, clean.endDateKey, clean.registrationClosesDateKey, clean.requiresParentConsent, clean.gradeLow]).toEqual(["ZZ Quiz", "2026-12-11", "2026-12-11", true, null]);
    expect(() => normaliseEvent({ ...EVENT, endDateKey: day(9) })).toThrow("access.theEndDateCannotBeBeforeThe");
    expect(() => normaliseEvent({ ...EVENT, registrationClosesDateKey: day(12) })).toThrow("competitions.closesAfterEnd");
    expect(() => normaliseEvent({ ...EVENT, title: "ZZ" })).toThrow("competitions.giveTitle");
    expect(() => normaliseEvent({ ...EVENT, internalBoard: "EVERYONE" as never })).toThrow("competitions.pickABoard");
    expect(() => normaliseEvent({ ...EVENT, endDateKey: addDaysToKey(EVENT.startDateKey, 400) })).toThrow("access.rangeTooLong");
  });
});

describe("one act, two rows", () => {
  let holidayId = "";
  let competitionId = "";

  it("⚠ the office makes the competition and its calendar row together, published, the school's own", async () => {
    const made = await createCompetitionEvent(office(), EVENT);
    holidayId = made.holidayId;
    competitionId = made.competitionId;
    const row = await db.holiday.findUniqueOrThrow({ where: { id: holidayId } });
    expect([row.kind, row.competitionId, row.startDateKey, row.endDateKey, row.name, row.schoolId]).toEqual(["COMPETITION", competitionId, day(10), day(11), EVENT.title, ids.school]);
    const c = await db.competition.findUniqueOrThrow({ where: { id: competitionId } });
    expect([c.status, c.organizerSchoolId, c.internalBoard, c.enrolmentOpen, c.gradeLow, c.gradeHigh, c.requiresParentConsent]).toEqual(["PUBLISHED", ids.school, "SCHOOL", true, "5", "6", true]);
    // The days' edges in the school's zone: midnight in Kolkata is 18:30 UTC the evening before.
    expect(c.startsAt?.toISOString()).toBe(new Date(`${addDaysToKey(day(10), -1)}T18:30:00.000Z`).toISOString());
    expect(c.registrationClosesAt?.toISOString()).toBe(new Date(`${day(9)}T18:29:59.999Z`).toISOString());
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "competition.event.create", targetId: holidayId } })).toBe(1);
  });

  it("⚠ a rule broken makes neither row; everyone but the office is refused; the row is the school's own", async () => {
    const before = await db.competition.count({ where: { organizerSchoolId: ids.school } });
    await expect(createCompetitionEvent(office(), { ...EVENT, registrationClosesDateKey: day(12) })).rejects.toThrow("competitions.closesAfterEnd");
    expect(await db.competition.count({ where: { organizerSchoolId: ids.school } })).toBe(before);
    expect(await db.holiday.count({ where: { schoolId: ids.school, kind: "COMPETITION" } })).toBe(1);
    for (const who of [head(), teacher(), pupil(), parent()]) await expect(createCompetitionEvent(who, EVENT)).rejects.toBeInstanceOf(AccessError);
    await expect(updateCompetitionEvent(otherOffice(), holidayId, EVENT)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(removeCompetitionEvent(otherOffice(), holidayId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("the office's calendar list carries the competition half", async () => {
    const events = await listCompetitionEvents(office());
    expect(events.map((e) => [e.holidayId, e.competitionId, e.internalBoard, e.enrolmentOpen, e.registrationClosesDateKey, e.entered])).toEqual([[holidayId, competitionId, "SCHOOL", true, day(9), 0]]);
    expect(await listCompetitionEvents(pupil())).toEqual([]);
  });

  it("⚠ editing moves both rows in step; the plain holiday writes refuse the kind and the row", async () => {
    await updateCompetitionEvent(office(), holidayId, { ...EVENT, title: "ZZ Inter-house quiz (final)", startDateKey: day(12), endDateKey: day(12), registrationClosesDateKey: day(11), enrolmentOpen: false, internalBoard: "STAFF" });
    const row = await db.holiday.findUniqueOrThrow({ where: { id: holidayId } });
    const c = await db.competition.findUniqueOrThrow({ where: { id: competitionId } });
    expect([row.name, row.startDateKey, row.endDateKey]).toEqual(["ZZ Inter-house quiz (final)", day(12), day(12)]);
    expect([c.title, c.enrolmentOpen, c.internalBoard, c.registrationClosesAt?.toISOString()]).toEqual(["ZZ Inter-house quiz (final)", false, "STAFF", new Date(`${day(11)}T18:29:59.999Z`).toISOString()]);
    await expect(updateHoliday(office(), holidayId, { name: "ZZ moved", startDateKey: day(13), endDateKey: day(13), kind: "EVENT" })).rejects.toThrow("access.competitionEventHasItsOwnForm");
    await expect(createHoliday(office(), { name: "ZZ bare", startDateKey: day(13), endDateKey: day(13), kind: "COMPETITION" })).rejects.toThrow("access.competitionEventHasItsOwnForm");
    await updateCompetitionEvent(office(), holidayId, EVENT);
  });

  it("⚠ removing with nobody entered deletes the competition; with an entry it archives it and keeps the entry — through the competition door and through the plain calendar delete alike", async () => {
    expect(await removeCompetitionEvent(office(), holidayId)).toBe("DELETED");
    expect(await db.competition.count({ where: { id: competitionId } })).toBe(0);
    expect(await db.holiday.count({ where: { id: holidayId } })).toBe(0);

    const made = await createCompetitionEvent(office(), EVENT);
    await enterCompetition(parent(), made.competitionId, { studentMembershipId: ids.pupil });
    expect(await deleteHoliday(office(), made.holidayId)).toBeUndefined();
    const c = await db.competition.findUniqueOrThrow({ where: { id: made.competitionId } });
    expect(c.status).toBe("ARCHIVED");
    expect(await db.competitionEntry.count({ where: { competitionId: made.competitionId } })).toBe(1);
    expect(await db.holiday.count({ where: { id: made.holidayId } })).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "competition.event.archive", targetId: made.holidayId } })).toBe(1);
    await db.competition.delete({ where: { id: made.competitionId } });
  });

  it("a school competition posted the older way gets its calendar row when published with a start date, and loses it when withdrawn", async () => {
    const c = await db.competition.create({ data: { organizerSchoolId: ids.school, organizerName: "ZZ", title: "ZZ Old-style bee", summary: "ZZ", status: "DRAFT", startsAt: new Date(`${day(20)}T05:00:00.000Z`), endsAt: new Date(`${day(21)}T05:00:00.000Z`) }, select: { id: true } });
    await syncCalendarRow(c.id);
    expect(await db.holiday.count({ where: { competitionId: c.id } })).toBe(0);
    await setCompetitionStatus(office(), c.id, "PUBLISHED");
    const row = await db.holiday.findFirstOrThrow({ where: { competitionId: c.id } });
    expect([row.kind, row.startDateKey, row.endDateKey, row.name]).toEqual(["COMPETITION", day(20), day(21), "ZZ Old-style bee"]);
    await setCompetitionStatus(office(), c.id, "ARCHIVED");
    expect(await db.holiday.count({ where: { competitionId: c.id } })).toBe(0);
    await db.competition.delete({ where: { id: c.id } });
  });
});

describe("enrolling from the agenda", () => {
  let competitionId = "";
  let holidayId = "";

  beforeAll(async () => {
    const made = await createCompetitionEvent(office(), EVENT);
    competitionId = made.competitionId;
    holidayId = made.holidayId;
  });

  it("the agenda row says OPEN to a pupil of the band and to their guardian, CLOSED to a pupil outside it, and carries the competition", async () => {
    const mine = await familyAgenda(pupil(), { days: 14 });
    const row = mine.rows.find((r) => r.kind === "COMPETITION")!;
    expect([row.dateKey, row.endDateKey, row.title, row.href]).toEqual([day(10), day(11), EVENT.title, `/competitions/${competitionId}`]);
    expect(row.competition).toEqual({ competitionId, enrol: "OPEN", entryId: null });
    const theirs = await familyAgenda(parent(), { student: ids.pupil, days: 14 });
    expect(theirs.rows.find((r) => r.kind === "COMPETITION")!.competition?.enrol).toBe("OPEN");
    expect(theirs.rows.find((r) => r.kind === "COMPETITION")!.href).toBe(`/competitions/${competitionId}?child=${ids.pupil}`);
    const outside = await familyAgenda(pupil3(), { days: 14 });
    expect(outside.rows.find((r) => r.kind === "COMPETITION")!.competition?.enrol).toBe("CLOSED");
  });

  it("⚠ a pupil's own enrolment waits for a guardian; the guardian's enrolment is the consent; CLOSED once enrolment is off or past", async () => {
    const asked = await enterCompetition(pupil(), competitionId);
    expect(asked.awaitingConsent).toBe(true);
    expect((await familyAgenda(pupil(), { days: 14 })).rows.find((r) => r.kind === "COMPETITION")!.competition).toEqual({ competitionId, enrol: "CONSENT_WAITING", entryId: asked.entryId });
    const yes = await enterCompetition(parent(), competitionId, { studentMembershipId: ids.pupil });
    expect([yes.entryId, yes.awaitingConsent]).toEqual([asked.entryId, false]);
    expect((await db.competitionEntry.findUniqueOrThrow({ where: { id: asked.entryId } })).parentConsentBy).toBe(ids.parentUser);
    expect((await familyAgenda(parent(), { student: ids.pupil, days: 14 })).rows.find((r) => r.kind === "COMPETITION")!.competition?.enrol).toBe("ENROLLED");
    // The guardian enrols the second child outright; the other family's guardian cannot reach either.
    const second = await enterCompetition(parent(), competitionId, { studentMembershipId: ids.pupil2 });
    expect(second.awaitingConsent).toBe(false);
    await expect(enterCompetition(otherParent(), competitionId, { studentMembershipId: ids.pupil2 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    // The office's switch stands above the dates.
    await updateCompetitionEvent(office(), holidayId, { ...EVENT, enrolmentOpen: false });
    await expect(enterCompetition(pupil3(), competitionId)).rejects.toThrow("access.entriesForThisCompetitionHaveClosed");
    expect(enrolStateFor({ ...EVENT, status: "PUBLISHED", requiresParentConsent: true, registrationOpensAt: null, registrationClosesAt: new Date(Date.now() + 86_400_000), enrolmentOpen: false }, null, "5")).toBe("CLOSED");
    expect(enrolStateFor({ ...EVENT, status: "PUBLISHED", requiresParentConsent: true, registrationOpensAt: null, registrationClosesAt: new Date(Date.now() - 1), enrolmentOpen: true }, null, "5")).toBe("CLOSED");
    await updateCompetitionEvent(office(), holidayId, EVENT);
  });

  it("⚠ another school's pupil and office see nothing of it", async () => {
    await expect(getCompetition(otherPupil(), competitionId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(enterCompetition(otherPupil(), competitionId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listCompetitions(otherOffice())).school).toEqual([]);
  });

  describe("the internal board", () => {
    beforeAll(async () => {
      const entries = await db.competitionEntry.findMany({ where: { competitionId }, select: { id: true, studentMembershipId: true } });
      const of = (m: string) => entries.find((e) => e.studentMembershipId === m)!.id;
      await recordResult(teacher(), of(ids.pupil), { scoreMilli: 80_000, rank: 2 });
      await recordResult(teacher(), of(ids.pupil2), { scoreMilli: 95_000, rank: 1 });
    });

    it("SCHOOL: staff read every entry by full name and class; a pupil and a guardian the top places by first name with their own place marked", async () => {
      for (const who of [office(), head(), teacher()]) {
        const board = await internalBoard(who, competitionId);
        expect([board.setting, board.full, board.mine]).toEqual(["SCHOOL", true, null]);
        expect(board.rows.map((r) => [r.place, r.name, r.className, r.rank, r.scoreMilli, r.mine])).toEqual([
          [1, "ZZ Event Bela Rao", "ZZ 5A", 1, 95_000, false],
          [2, "ZZ Event Asha Rao", "ZZ 5A", 2, 80_000, false],
        ]);
      }
      const own = await internalBoard(pupil(), competitionId);
      expect([own.setting, own.full]).toEqual(["SCHOOL", false]);
      expect(own.rows.map((r) => [r.place, r.name, r.className, r.mine])).toEqual([
        [1, "ZZ", "ZZ 5A", false],
        [2, "ZZ", "ZZ 5A", true],
      ]);
      const theirs = await internalBoard(parent(), competitionId, { studentMembershipId: ids.pupil2 });
      expect(theirs.rows.map((r) => [r.place, r.mine])).toEqual([
        [1, true],
        [2, false],
      ]);
      // A pupil with no result reads the board and is on no row.
      const spectator = await internalBoard(pupil3(), competitionId);
      expect([spectator.rows.length, spectator.mine, spectator.rows.some((r) => r.mine)]).toEqual([2, null, false]);
    });

    it("⚠ nobody across schools, and the other family's guardian is nobody's own", async () => {
      for (const who of [otherOffice(), otherPupil()]) expect((await internalBoard(who, competitionId)).rows).toEqual([]);
      const stranger = await internalBoard(otherParent(), competitionId, { studentMembershipId: ids.pupil });
      // Their own child is pupil 3 (no result): the board is readable, nothing is theirs.
      expect(stranger.rows.some((r) => r.mine)).toBe(false);
    });

    it("STAFF: staff the full board, a pupil and a guardian nothing; OFF: nobody", async () => {
      await updateCompetitionEvent(office(), holidayId, { ...EVENT, internalBoard: "STAFF" });
      expect((await internalBoard(teacher(), competitionId)).rows.length).toBe(2);
      expect((await internalBoard(pupil(), competitionId)).rows).toEqual([]);
      expect((await internalBoard(parent(), competitionId)).rows).toEqual([]);
      await updateCompetitionEvent(office(), holidayId, { ...EVENT, internalBoard: "OFF" });
      for (const who of [office(), teacher(), pupil(), parent()]) {
        const board = await internalBoard(who, competitionId);
        expect([board.setting, board.rows, board.mine]).toEqual(["OFF", [], null]);
      }
      await updateCompetitionEvent(office(), holidayId, EVENT);
    });

    it("a result on an entry whose guardian never said yes is not on the board", async () => {
      const ask = await enterCompetition(pupil3(), competitionId).catch(() => null);
      expect(ask).toBeNull(); // pupil 3 is outside the band: the test's third entry comes from the row itself
      const entry = await db.competitionEntry.create({ data: { competitionId, studentMembershipId: ids.pupil3, schoolId: ids.school, status: "RESULTS", scoreMilli: 99_000, rank: 1 }, select: { id: true } });
      expect((await internalBoard(teacher(), competitionId)).rows.map((r) => r.name)).not.toContain("ZZ Event Chitra Rao");
      await db.competitionEntry.delete({ where: { id: entry.id } });
    });
  });
});

describe("the marketplace behind the switch and in the pupil's plan", () => {
  let platformId = "";
  let schoolId = "";

  beforeAll(async () => {
    platformId = (await db.competition.create({ data: { organizerSchoolId: null, organizerName: "ZZ Olympiad Trust", title: `ZZ Event platform ${STAMP}`, summary: "ZZ", status: "PUBLISHED", requiresParentConsent: false, audience: "SCHOOL" }, select: { id: true } })).id;
    schoolId = (await createCompetitionEvent(office(), { ...EVENT, title: "ZZ Free school quiz" })).competitionId;
  });

  it("⚠ while COMPETITIONS is off the platform's competitions are not listed, not found and not enterable; the school's own are untouched", async () => {
    setFeaturesForTests(ALL.filter((c) => c !== "COMPETITIONS"));
    const list = await listCompetitions(pupil());
    expect(list.platform).toEqual([]);
    expect(list.platformLock).toBeNull();
    expect(list.school.map((c) => c.id)).toContain(schoolId);
    await expect(getCompetition(pupil(), platformId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(enterCompetition(pupil(), platformId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(enterCompetition(parent(), platformId, { studentMembershipId: ids.pupil })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getCompetition(pupil(), schoolId)).id).toBe(schoolId);
  });

  it("⚠ with the switch on and the STUDENT plan active, a pupil without it meets the plan where the platform's would be; a teacher reads them; the school's own stay free", async () => {
    setFeaturesForTests(ALL);
    setActivePlansForTests(["STUDENT"]);
    const list = await listCompetitions(pupil());
    expect(list.platform).toEqual([]);
    expect(list.platformLock).toBe("STUDENT");
    expect(list.school.map((c) => c.id)).toContain(schoolId);
    await expect(getCompetition(pupil(), platformId)).rejects.toMatchObject({ name: "PlanRequiredError", plan: "STUDENT" });
    await expect(enterCompetition(pupil(), platformId)).rejects.toMatchObject({ name: "PlanRequiredError" });
    // The guardian needs no plan, but the child must hold it to be enrolled.
    await expect(enterCompetition(parent(), platformId, { studentMembershipId: ids.pupil })).rejects.toMatchObject({ name: "PlanRequiredError" });
    expect((await listCompetitions(teacher())).platform.map((c) => c.id)).toContain(platformId);
    expect((await listCompetitions(teacher())).platformLock).toBeNull();
    expect((await getCompetition(pupil(), schoolId)).id).toBe(schoolId);
    // Entitled, the pupil is through.
    await db.entitlement.create({ data: { userId: ids.pupilUser, feature: "COMPETITIONS", source: "GRANT", planCode: "STUDENT", validFrom: new Date(Date.now() - 1000), validTo: new Date(Date.now() + 86_400_000) } });
    expect((await listCompetitions(pupil())).platform.map((c) => c.id)).toContain(platformId);
    expect((await enterCompetition(pupil(), platformId)).awaitingConsent).toBe(false);
    await db.entitlement.deleteMany({ where: { userId: ids.pupilUser } });
  });
});
