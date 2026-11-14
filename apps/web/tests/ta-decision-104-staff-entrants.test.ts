/**
 * Staff add entrants (testing analysis of 13 November 2026, TA-104; decision 0007 as the owner amended it on
 * 14 November 2026).
 *
 *   TA-104  With enrolment off nobody could be an entrant, so staff could record no result: enterCompetition was
 *           the only creator of a CompetitionEntry and it refuses everyone while the office's switch is off, though
 *           the owner's answer of 7 November says enrolment off means the office picks the entrants. The owner's
 *           decision: on the entries page the office or a teacher adds a pupil of the school as an entrant,
 *           audited; where the competition asks for a guardian's consent the entry waits for a guardian's yes like
 *           any other, and for a pupil with no family on the app the school's stand-in guardian answers; results
 *           are recorded once the entry stands.
 *
 * Runs as the database owner with a ZZ school and a ZZ college of its own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import * as competitions from "@/lib/competitions";
import { enterCompetition, getCompetition, giveConsent, internalBoard, listEntriesForResults, pendingConsents, recordResult } from "@/lib/competitions";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { PLATFORM_FEATURES } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const users: string[] = [];
const ids = { school: "", other: "", college: "", admin: "", adminM: "", teacher: "", teacherM: "", collegeAdmin: "", collegeAdminM: "", parent: "", a: "", aU: "", b: "", bU: "", c: "", cU: "", nine: "", nineU: "", left: "", leftU: "", stranger: "", strangerU: "", adult: "", adultU: "", classId: "" };
const platformIds: string[] = [];
const ALL = [...PLATFORM_FEATURES];

function ctx(userId: string, role: string, schoolId: string | null = null, membershipId: string | null = null): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role: role as ActiveContext["role"],
    user: { id: userId, name: "ZZ TA Decision 104", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const office = () => ctx(ids.admin, "ADMIN", ids.school, ids.adminM);
const teacher = () => ctx(ids.teacher, "TEACHER", ids.school, ids.teacherM);
/** The teacher in their guardian's view: the school's stand-in for a pupil with no family on the app. */
const standIn = () => ctx(ids.teacher, "PARENT");
const pupil = (who: "a" | "b" | "c" | "nine") => ctx(ids[`${who}U` as const], "STUDENT", ids.school, ids[who]);
const parent = () => ctx(ids.parent, "PARENT");
const collegeOffice = () => ctx(ids.collegeAdmin, "ADMIN", ids.college, ids.collegeAdminM);
const adultStudent = () => ctx(ids.adultU, "STUDENT", ids.college, ids.adult);

type AddEntrant = (session: ActiveContext, competitionId: string, studentMembershipId: string) => Promise<{ entryId: string; awaitingConsent: boolean; created: boolean }>;
type Candidates = (session: ActiveContext, competitionId: string) => Promise<{ studentMembershipId: string; name: string; className: string | null }[]>;
/** Read off the module so the suite runs (and fails for the finding's reason) before the functions exist. */
function addEntrant(...args: Parameters<AddEntrant>) {
  const fn = (competitions as unknown as { addEntrant?: AddEntrant }).addEntrant;
  if (!fn) throw new Error("TA-104: there is no way for staff to add an entrant");
  return fn(...args);
}
function entrantCandidates(...args: Parameters<Candidates>) {
  const fn = (competitions as unknown as { entrantCandidates?: Candidates }).entrantCandidates;
  if (!fn) throw new Error("TA-104: there is no list of pupils staff may add");
  return fn(...args);
}

async function own(data: { schoolId?: string | null; requiresParentConsent: boolean; internalBoard?: string; title: string; gradeLow?: string | null; gradeHigh?: string | null; enrolmentOpen?: boolean }) {
  const row = await db.competition.create({
    data: { organizerSchoolId: data.schoolId === undefined ? ids.school : data.schoolId, organizerName: "ZZ TA Decision 104", title: `ZZ TA104 ${data.title} ${STAMP}`, summary: "ZZ", status: "PUBLISHED", enrolmentOpen: data.enrolmentOpen ?? false, requiresParentConsent: data.requiresParentConsent, internalBoard: data.internalBoard ?? "OFF", gradeLow: data.gradeLow ?? null, gradeHigh: data.gradeHigh ?? null, registrationClosesAt: new Date(Date.now() + 30 * 86_400_000) },
    select: { id: true },
  });
  if (data.schoolId === null) platformIds.push(row.id);
  return row.id;
}

beforeAll(async () => {
  const mkSchool = async (tag: string, kind: string) => (await db.school.create({ data: { name: `ZZ TA104 ${tag} ${STAMP}`, slug: `zz-ta104-${tag.toLowerCase()}-${STAMP}`, code: `ZQ${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-ta104-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, kind, isTestFixture: true }, select: { id: true } })).id;
  ids.school = await mkSchool("School", "SCHOOL");
  ids.other = await mkSchool("Other", "SCHOOL");
  ids.college = await mkSchool("College", "COLLEGE");
  const mk = async (who: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ TA104 ${who}`, email: `zz-ta104-${who.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } });
    users.push(u.id);
    return u.id;
  };
  const member = async (userId: string, schoolId: string, role: string, extra: Record<string, unknown> = {}) => (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  ids.admin = await mk("Admin");
  ids.adminM = await member(ids.admin, ids.school, "ADMIN");
  ids.teacher = await mk("Teacher");
  ids.teacherM = await member(ids.teacher, ids.school, "TEACHER");
  ids.collegeAdmin = await mk("College Admin");
  ids.collegeAdminM = await member(ids.collegeAdmin, ids.college, "ADMIN");
  ids.parent = await mk("Parent");
  ids.aU = await mk("Asha Rao", { isMinor: true });
  ids.a = await member(ids.aU, ids.school, "STUDENT", { studentCode: `ZQA${STAMP}`, gradeLevel: "5" });
  ids.bU = await mk("Bela Rao", { isMinor: true });
  ids.b = await member(ids.bU, ids.school, "STUDENT", { studentCode: `ZQB${STAMP}`, gradeLevel: "5" });
  ids.cU = await mk("Chitra Rao", { isMinor: true });
  ids.c = await member(ids.cU, ids.school, "STUDENT", { studentCode: `ZQC${STAMP}`, gradeLevel: "5" });
  ids.nineU = await mk("Nina Rao", { isMinor: true });
  ids.nine = await member(ids.nineU, ids.school, "STUDENT", { studentCode: `ZQN${STAMP}`, gradeLevel: "9" });
  ids.leftU = await mk("Lata Rao", { isMinor: true });
  ids.left = await member(ids.leftU, ids.school, "STUDENT", { studentCode: `ZQL${STAMP}`, gradeLevel: "5", leftAt: new Date() });
  ids.strangerU = await mk("Sona Rao", { isMinor: true });
  ids.stranger = await member(ids.strangerU, ids.other, "STUDENT", { studentCode: `ZQS${STAMP}`, gradeLevel: "5" });
  ids.adultU = await mk("Kiran Rao", { isMinor: false, birthdate: new Date("2000-01-01T00:00:00Z") });
  ids.adult = await member(ids.adultU, ids.college, "STUDENT", { studentCode: `ZQK${STAMP}`, gradeLevel: "2" });
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.parent, studentMembershipId: ids.a, studentSchoolId: ids.school, status: "ACTIVE" },
      // Bela's family is not on the app: the class teacher stands in, as standin-guardian.ts makes the row.
      { parentUserId: ids.teacher, studentMembershipId: ids.b, studentSchoolId: ids.school, status: "ACTIVE", relation: "SCHOOL" },
    ],
  });
  ids.classId = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZQ${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [ids.a, ids.b, ids.c].map((studentMembershipId) => ({ classId: ids.classId, schoolId: ids.school, studentMembershipId, status: "ACTIVE", enrolledAt: new Date() })) });
}, 60_000);

afterEach(() => {
  setFeaturesForTests(null);
  setActivePlansForTests(null);
});

afterAll(async () => {
  setFeaturesForTests(null);
  setActivePlansForTests(null);
  if (platformIds.length) {
    await db.competitionEntry.deleteMany({ where: { competitionId: { in: platformIds }, schoolId: { in: [ids.school, ids.other, ids.college] } } });
    await db.competition.deleteMany({ where: { id: { in: platformIds }, organizerSchoolId: null } });
  }
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.other, ids.college] } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 60_000);

describe("TA-104: staff add entrants to a competition with enrolment off", () => {
  it("TA-104: the office adds a pupil; the entry waits for the guardian's yes; once it stands the result is recorded and the pupil is on the STAFF board", async () => {
    const team = await own({ requiresParentConsent: true, internalBoard: "STAFF", title: "selected team" });
    // The family's own paths stay shut while enrolment is off.
    await expect(enterCompetition(pupil("a"), team)).rejects.toThrow("access.entriesForThisCompetitionHaveClosed");
    await expect(enterCompetition(parent(), team, { studentMembershipId: ids.a })).rejects.toThrow("access.entriesForThisCompetitionHaveClosed");

    const added = await addEntrant(office(), team, ids.a);
    expect(added).toMatchObject({ created: true, awaitingConsent: true });
    // Audited in the same write, with ids and no names.
    const row = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "competition.entrant.add", actorUserId: ids.admin }, orderBy: { createdAt: "desc" } });
    expect(row).not.toBeNull();
    expect(row!.meta).toContain(added.entryId);
    expect(row!.meta).not.toContain("Asha");
    // Waiting, like any entry the pupil asked for: on the staff's list, on the guardian's list, told to the guardian.
    expect((await listEntriesForResults(teacher(), team)).map((e) => [e.entryId, e.awaitingConsent])).toEqual([[added.entryId, true]]);
    expect((await pendingConsents(parent())).filter((w) => w.competitionId === team).map((w) => w.entryId)).toEqual([added.entryId]);
    expect(await db.notification.count({ where: { userId: ids.parent, kind: "COMPETITION", url: `/competitions/${team}` } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.aU, kind: "COMPETITION", url: `/competitions/${team}` } })).toBe(1);
    // A result before the yes is not on the board, as for any entry.
    expect((await getCompetition(office(), team)).enteredCount).toBe(0);

    await giveConsent(parent(), added.entryId);
    expect((await getCompetition(office(), team)).enteredCount).toBe(1);
    await recordResult(teacher(), added.entryId, { scoreMilli: 9_000, rank: 1 });
    const board = await internalBoard(office(), team);
    expect(board.rows.map((r) => [r.name, r.rank])).toEqual([["ZZ TA104 Asha Rao", 1]]);
    // The pupil's own Enrol still answers closed for anybody the office did not pick.
    await expect(enterCompetition(pupil("c"), team)).rejects.toThrow("access.entriesForThisCompetitionHaveClosed");
  }, 30_000);

  it("TA-104: a teacher adds a pupil with no family on the app, and the school's stand-in guardian answers", async () => {
    const team = await own({ requiresParentConsent: true, internalBoard: "STAFF", title: "stand-in" });
    const added = await addEntrant(teacher(), team, ids.b);
    expect(added).toMatchObject({ created: true, awaitingConsent: true });
    expect(await db.notification.count({ where: { userId: ids.teacher, kind: "COMPETITION", url: `/competitions/${team}` } })).toBe(1);
    expect((await pendingConsents(standIn())).filter((w) => w.competitionId === team).map((w) => w.entryId)).toEqual([added.entryId]);
    await giveConsent(standIn(), added.entryId);
    const entry = await db.competitionEntry.findUniqueOrThrow({ where: { id: added.entryId } });
    expect(entry.parentConsentBy).toBe(ids.teacher);
    expect((await listEntriesForResults(office(), team)).map((e) => e.awaitingConsent)).toEqual([false]);
    await recordResult(office(), added.entryId, { scoreMilli: 7_000, rank: 2 });
    expect((await internalBoard(teacher(), team)).rows.map((r) => r.rank)).toEqual([2]);
  }, 30_000);

  it("TA-104: where the competition asks no consent the staff's entrant stands at once", async () => {
    const free = await own({ requiresParentConsent: false, internalBoard: "STAFF", title: "free" });
    const added = await addEntrant(office(), free, ids.c);
    expect(added).toMatchObject({ created: true, awaitingConsent: false });
    expect((await getCompetition(office(), free)).enteredCount).toBe(1);
    expect((await getCompetition(pupil("c"), free)).entry).toMatchObject({ id: added.entryId, awaitingConsent: false });
    await recordResult(teacher(), added.entryId, { scoreMilli: 5_000, rank: null });
    expect((await internalBoard(office(), free)).rows).toHaveLength(1);
  }, 30_000);

  it("TA-104: only the office or a teacher, only the school's own pupils on its roll and in the band, only the school's own competition; adding twice answers the same entry", async () => {
    const team = await own({ requiresParentConsent: true, title: "rules", gradeLow: "5", gradeHigh: "5" });
    await expect(addEntrant(pupil("a"), team, ids.a)).rejects.toThrow("competitions.refuseAddEntrantRole");
    await expect(addEntrant(parent(), team, ids.a)).rejects.toThrow("competitions.refuseAddEntrantRole");
    await expect(addEntrant(office(), team, ids.stranger)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addEntrant(office(), team, ids.left)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addEntrant(office(), team, ids.teacherM)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addEntrant(office(), team, ids.nine)).rejects.toThrow("competitions.refuseEntrantNotInBand");
    // Another school's competition is not found; a platform competition is not the school's to pick for.
    const elsewhere = await own({ schoolId: ids.other, requiresParentConsent: true, title: "elsewhere" });
    await expect(addEntrant(office(), elsewhere, ids.a)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const platform = await own({ schoolId: null, requiresParentConsent: true, title: "platform", enrolmentOpen: true });
    setFeaturesForTests(ALL);
    setActivePlansForTests([]);
    await expect(addEntrant(office(), platform, ids.a)).rejects.toThrow("competitions.refuseAddEntrantNotOwn");
    expect(await db.competitionEntry.count({ where: { competitionId: { in: [team, elsewhere, platform] } } })).toBe(0);

    // The pupils the page offers: the roll in the band, nobody already entered, nobody who has left.
    expect((await entrantCandidates(office(), team)).map((p) => p.studentMembershipId).sort()).toEqual([ids.a, ids.b, ids.c].sort());
    expect((await entrantCandidates(teacher(), team)).find((p) => p.studentMembershipId === ids.a)).toMatchObject({ name: "ZZ TA104 Asha Rao", className: "ZZ 5A" });
    expect(await entrantCandidates(pupil("a"), team)).toEqual([]);
    expect(await entrantCandidates(office(), platform)).toEqual([]);

    const first = await addEntrant(office(), team, ids.a);
    const again = await addEntrant(teacher(), team, ids.a);
    expect(again).toEqual({ entryId: first.entryId, awaitingConsent: true, created: false });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "competition.entrant.add", meta: { contains: team } } })).toBe(1);
    expect((await entrantCandidates(office(), team)).map((p) => p.studentMembershipId)).not.toContain(ids.a);
  }, 30_000);

  it("TA-104: an adult college student the college adds waits for their own word, which their Enrol gives though enrolment is off", async () => {
    const team = await own({ schoolId: ids.college, requiresParentConsent: true, internalBoard: "STAFF", title: "college team" });
    const added = await addEntrant(collegeOffice(), team, ids.adult);
    expect(added).toMatchObject({ created: true, awaitingConsent: true });
    const before = await getCompetition(adultStudent(), team);
    expect(before.entry).toMatchObject({ id: added.entryId, awaitingConsent: true });
    expect(before.confirmOwnEntry).toBe(true);
    const yes = await enterCompetition(adultStudent(), team);
    expect(yes).toEqual({ entryId: added.entryId, awaitingConsent: false });
    const entry = await db.competitionEntry.findUniqueOrThrow({ where: { id: added.entryId } });
    expect(entry.parentConsentBy).toBe(ids.adultU);
    expect((await getCompetition(adultStudent(), team)).confirmOwnEntry).toBe(false);
  }, 30_000);
});

describe("TA-104: a platform competition while the marketplace is off", () => {
  it("TA-104: with COMPETITIONS off addEntrant and its door answer a platform competition not found, as the entries door does, and say it is not the school's only while it is on", async () => {
    const { POST } = await import("@/app/api/v1/contest/competitions/[competitionId]/entrants/route");
    const { GET } = await import("@/app/api/v1/contest/competitions/[competitionId]/entries/route");
    const platform = await own({ schoolId: null, requiresParentConsent: false, title: "platform off", enrolmentOpen: true });
    const p = () => ({ params: Promise.resolve({ competitionId: platform }) });
    setActivePlansForTests([]);
    setFeaturesForTests(ALL.filter((code) => code !== "COMPETITIONS"));
    await expect(addEntrant(office(), platform, ids.a)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addEntrant(teacher(), platform, ids.a)).rejects.toMatchObject({ code: "NOT_FOUND" });
    __resetCookies();
    await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
    expect((await GET(new Request(`http://localhost/api/v1/contest/competitions/${platform}/entries`), p())).status).toBe(404);
    const res = await POST(new Request(`http://localhost/api/v1/contest/competitions/${platform}/entrants`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentMembershipId: ids.a }) }), p());
    expect(res.status).toBe(404);
    setFeaturesForTests(ALL);
    await expect(addEntrant(office(), platform, ids.a)).rejects.toThrow("competitions.refuseAddEntrantNotOwn");
    expect(await db.competitionEntry.count({ where: { competitionId: platform } })).toBe(0);
  }, 30_000);
});

describe("TA-104: the staff's door", () => {
  it("TA-104: POST /api/v1/contest/competitions/{competitionId}/entrants adds a pupil for the office, refuses a bad body 422 and a pupil 403; the entries door lists who may be added", async () => {
    const { POST } = await import("@/app/api/v1/contest/competitions/[competitionId]/entrants/route");
    const { GET } = await import("@/app/api/v1/contest/competitions/[competitionId]/entries/route");
    const team = await own({ requiresParentConsent: false, title: "door" });
    const p = { params: Promise.resolve({ competitionId: team }) };
    const post = (body: string) => new Request(`http://localhost/api/v1/contest/competitions/${team}/entrants`, { method: "POST", headers: { "content-type": "application/json" }, body });

    __resetCookies();
    await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
    const listed = await GET(new Request(`http://localhost/api/v1/contest/competitions/${team}/entries`), { params: Promise.resolve({ competitionId: team }) });
    expect(listed.status).toBe(200);
    const listedBody = (await listed.json()) as { candidates?: { studentMembershipId: string }[] };
    expect((listedBody.candidates ?? []).map((c) => c.studentMembershipId)).toContain(ids.c);
    expect((await POST(post(""), { params: Promise.resolve({ competitionId: team }) })).status).toBe(422);
    const res = await POST(post(JSON.stringify({ studentMembershipId: ids.c })), p);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, awaitingConsent: false, created: true });

    __resetCookies();
    await createSession(ids.aU, { schoolId: ids.school, role: "STUDENT" });
    expect((await POST(post(JSON.stringify({ studentMembershipId: ids.a })), { params: Promise.resolve({ competitionId: team }) })).status).toBe(403);
  }, 30_000);
});
