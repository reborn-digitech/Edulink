/**
 * The stream records' findings of the testing analysis of 13 November 2026 (batch streams-duties).
 *
 * Two ZZ colleges of this suite's own, made through the operator's createSchool and removed after: A with LAW and
 * SCIENCE (an HOD heading Physics and Chemistry, a teacher of a lab course in each and of a course with no
 * practicals, law and science seats, an NSS officer), and E with EDUCATION only (a practice-teaching coordinator, two
 * student teachers, a teacher of a course with practical hours). Proved:
 *   - TA-383: an HOD of two departments keeps the practical record of both;
 *   - TA-494: no practical row on a course with no practicals, nor at a college whose streams keep no labs;
 *   - TA-208: a practical save in flight while a signature commits is refused, never rewriting a signed row;
 *   - TA-270: the BCI figures count evaluated or credited internships of law seats only;
 *   - TA-380: an NSS activity is checked against the enrolment on its own day, the enrolment takes the day the
 *     student joined, and a re-enrolment keeps the first joining day;
 *   - TA-381: a teaching-practice posting with observed lessons keeps its student and the days that hold them;
 *   - TA-479: the NBA tile counts each department's latest SAR;
 *   - TA-271: the moot form corrects a moot by its id.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { practicalSheet, saveMootCourt, savePracticals } from "@/lib/stream-records";
import { lawInternshipSummary } from "@/lib/stream-summaries";
import { addCorpsActivity, enrolInCorps, leaveCorps } from "@/lib/corps";
import { addLessonObservation, savePracticePosting, savePracticeSchool } from "@/lib/teaching-practice";
import { homeFigures } from "@/lib/stream-home";
import { saveMootCourtAction } from "@/app/(app)/admin/stream-records/actions";
import { enrolCorpsAction } from "@/app/(app)/duties/actions";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

/** The address a runAction form action redirects to. */
async function redirected(run: Promise<unknown>): Promise<string> {
  try {
    await run;
  } catch (error) {
    const url = (error as { url?: string }).url;
    if (url) return url;
    throw error;
  }
  throw new Error("the action did not redirect");
}

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-sdrec-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const D = (n: number) => addDaysToKey(TODAY, n);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function as(who: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  return (await getSession())!;
}

async function person(schoolId: string, who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ SD SR ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function college(key: string, streams: string[]): Promise<void> {
  const made = await createSchool(operator(), { contactEmail: MAIL(`contact-${key}`), timezone: TZ, name: `ZZ SD SR ${key} College ${STAMP}`, kind: "COLLEGE", streams: streams as never });
  if (!made.ok) throw new Error(made.errorKey);
  ids[key] = made.schoolId;
  await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
}

/** An offering of a course of a programme's scheme, taught by `teacher`, with the students registered. */
async function offering(schoolId: string, key: string, programme: string, code: string, practical: { hours: number; credits: number }, teacher: string, students: string[]): Promise<void> {
  const scheme = (await db.scheme.create({ data: { schoolId, programmeId: ids[programme]!, name: `ZZ SD SR ${code} scheme`, effectiveYear: 2025 }, select: { id: true } })).id;
  const course = (await db.course.create({ data: { schoolId, schemeId: scheme, code, name: `ZZ SD SR ${code}`, semester: 1, creditsL: 3, creditsP: practical.credits }, select: { id: true } })).id;
  ids[key] = (await db.courseOffering.create({ data: { schoolId, termId: ids[`term${schoolId === ids.A ? "A" : "E"}`]!, courseId: course, facultyMembershipId: ids[`${teacher}M`]!, practicalHours: practical.hours }, select: { id: true } })).id;
  for (const s of students) await db.courseRegistration.create({ data: { schoolId, studentMembershipId: ids[`${s}M`]!, offeringId: ids[key]!, termId: ids[`term${schoolId === ids.A ? "A" : "E"}`]!, kind: "CORE" } });
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ SD SR Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  await college("A", ["LAW", "SCIENCE"]);
  await college("E", ["EDUCATION"]);
  const A = ids.A!;
  const E = ids.E!;
  for (const [who, role] of [["admin", "ADMIN"], ["hod", "HOD"], ["f1", "FACULTY"], ["officer", "FACULTY"]] as const) await person(A, who, role);
  for (let n = 1; n <= 4; n += 1) await person(A, `s${n}`, "STUDENT");
  for (const [who, role] of [["eAdmin", "ADMIN"], ["coord", "FACULTY"], ["eTeacher", "FACULTY"], ["t1", "STUDENT"], ["t2", "STUDENT"]] as const) await person(E, who, role);
  const term = (schoolId: string) => db.academicTerm.create({ data: { schoolId, name: "ZZ SD SR term", academicYear: "2026–27", startsOn: D(-40), endsOn: D(60), registrationOpensOn: D(-50), registrationClosesOn: D(-30) }, select: { id: true } });
  ids.termA = (await term(A)).id;
  ids.termE = (await term(E)).id;
  ids.phyDept = (await db.department.create({ data: { schoolId: A, code: "PHY", name: "ZZ SD SR Physics", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.cheDept = (await db.department.create({ data: { schoolId: A, code: "CHE", name: "ZZ SD SR Chemistry", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.lawDept = (await db.department.create({ data: { schoolId: A, code: "LAW", name: "ZZ SD SR Law" }, select: { id: true } })).id;
  const programme = (schoolId: string, departmentId: string, code: string, stream: string, regulator: string) => db.programme.create({ data: { schoolId, departmentId, code, name: `ZZ SD SR ${code}`, level: "UG", durationYears: 3, intake: 60, regulator, stream }, select: { id: true } });
  ids.bscp = (await programme(A, ids.phyDept!, "BSCP", "SCIENCE", "UGC")).id;
  ids.bscc = (await programme(A, ids.cheDept!, "BSCC", "SCIENCE", "UGC")).id;
  ids.llb = (await programme(A, ids.lawDept!, "LLB", "LAW", "BCI")).id;
  const lawScheme = (await db.scheme.create({ data: { schoolId: A, programmeId: ids.llb!, name: "ZZ SD SR LLB scheme", effectiveYear: 2025 }, select: { id: true } })).id;
  const sciScheme = (await db.scheme.create({ data: { schoolId: A, programmeId: ids.bscp!, name: "ZZ SD SR seats", effectiveYear: 2025 }, select: { id: true } })).id;
  for (const n of [1, 2]) await db.studentProgramme.create({ data: { schoolId: A, studentMembershipId: ids[`s${n}M`]!, programmeId: ids.llb!, schemeId: lawScheme, entryYear: 2025 } });
  for (const n of [3, 4]) await db.studentProgramme.create({ data: { schoolId: A, studentMembershipId: ids[`s${n}M`]!, programmeId: ids.bscp!, schemeId: sciScheme, entryYear: 2025 } });
  await offering(A, "oP", "bscp", "PHY101", { hours: 2, credits: 1 }, "f1", ["s3", "s4"]);
  await offering(A, "oC", "bscc", "CHE101", { hours: 2, credits: 1 }, "f1", ["s3", "s4"]);
  await offering(A, "oM", "bscp", "MAT101", { hours: 0, credits: 0 }, "f1", ["s3", "s4"]);
  ids.eDept = (await db.department.create({ data: { schoolId: E, code: "EDU", name: "ZZ SD SR Education" }, select: { id: true } })).id;
  ids.bed = (await programme(E, ids.eDept!, "BED", "EDUCATION", "NCTE")).id;
  await offering(E, "oE", "bed", "ED101", { hours: 2, credits: 1 }, "eTeacher", ["t1"]);
  await setDuties(await as("admin", "ADMIN", A), ids.officerM!, ["NSS_OFFICER"]);
  await setDuties(await as("eAdmin", "ADMIN", E), ids.coordM!, ["PRACTICE_TEACHING_COORDINATOR"]);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.A, ids.E].filter((x): x is string => Boolean(x));
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 120_000);

const experiment = (offeringId: string, over: Record<string, unknown> = {}) => ({ offeringId, experimentNo: 1, title: "ZZ SD Pendulum", performedOn: D(-1), entries: [{ studentMembershipId: ids.s3M!, marks: 8 }, { studentMembershipId: ids.s4M!, marks: 9 }], ...over });

describe("the practical record", () => {
  it("TA-383: an HOD who heads two departments keeps the practical record of both", async () => {
    const hod = await as("hod", "HOD", ids.A!);
    const sheet = await practicalSheet(hod);
    expect(sheet.offerings.map((o) => o.offeringId)).toEqual(expect.arrayContaining([ids.oP, ids.oC]));
    expect(await savePracticals(hod, experiment(ids.oP!))).toEqual({ count: 2 });
    expect(await savePracticals(hod, experiment(ids.oC!))).toEqual({ count: 2 });
    expect((await practicalSheet(hod, { offeringId: ids.oC })).canWrite).toBe(true);
  });

  it("TA-494: no practical row on a course with no practicals, nor at a college whose streams keep no labs", async () => {
    await expect(savePracticals(await as("f1", "FACULTY", ids.A!), experiment(ids.oM!))).rejects.toMatchObject({ key: "streamRecords.refuseNoPracticals", status: 422, field: "offeringId" });
    expect(await db.practicalRecord.count({ where: { offeringId: ids.oM } })).toBe(0);
    await expect(savePracticals(await as("eTeacher", "FACULTY", ids.E!), experiment(ids.oE!, { entries: [{ studentMembershipId: ids.t1M!, marks: 5 }] }))).rejects.toMatchObject({ key: "streamRecords.refuseNoLabs", status: 409 });
    expect(await db.practicalRecord.count({ where: { offeringId: ids.oE } })).toBe(0);
  });

  it("TA-208: a save in flight while the experiment's signature commits is refused, and the signed rows are not rewritten", async () => {
    const f1 = await as("f1", "FACULTY", ids.A!);
    let save: Promise<unknown> = Promise.resolve();
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`UPDATE "PracticalRecord" SET "signedAt" = now(), "signedByMembershipId" = ${ids.hodM} WHERE "offeringId" = ${ids.oP} AND "experimentNo" = 1`;
        save = savePracticals(f1, experiment(ids.oP!, { title: "ZZ SD Rewritten", entries: [{ studentMembershipId: ids.s3M!, marks: 1 }] }));
        save.catch(() => undefined);
        await sleep(800);
      },
      { timeout: 20_000 },
    );
    await expect(save).rejects.toMatchObject({ key: "streamRecords.refuseSigned", status: 409 });
    const rows = await db.practicalRecord.findMany({ where: { offeringId: ids.oP, experimentNo: 1 }, select: { title: true, marks: true, signedAt: true } });
    expect(rows.map((r) => [r.title, r.signedAt !== null])).toEqual([["ZZ SD Pendulum", true], ["ZZ SD Pendulum", true]]);
    expect(rows.map((r) => r.marks).sort()).toEqual([8, 9]);
  });
});

describe("the councils' figures", () => {
  it("TA-270: the BCI figures count evaluated or credited internships of students holding law seats only", async () => {
    const add = (who: string, kind: string, from: string, to: string, status: string) => db.internship.create({ data: { schoolId: ids.A!, studentMembershipId: ids[`${who}M`]!, companyName: `ZZ SD ${kind}`, kind, fromKey: from, toKey: to, hours: 100, windowSemester: 2, supervisorName: "ZZ SD S", status } });
    await add("s1", "COURT", "2026-07-01", "2026-07-28", "EVALUATED");
    await add("s1", "COURT", "2026-08-01", "2026-08-28", "PROPOSED");
    await add("s2", "LEGAL_AID", "2026-09-07", "2026-10-02", "APPROVED");
    await add("s2", "FIRM", "2026-10-05", "2026-10-30", "SUBMITTED");
    await add("s3", "COURT", "2026-11-02", "2026-11-29", "EVALUATED");
    const s = await lawInternshipSummary(ids.A!, 2026);
    expect(s).toMatchObject({ internships: 1, byKind: { COURT: 1, FIRM: 0, LEGAL_AID: 0 }, weeks: 4, students: 2 });
  });

  it("TA-380: an NSS activity is checked against the enrolment on its own day, not today's", async () => {
    const officer = await as("officer", "FACULTY", ids.A!);
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s1M!, ids.s2M!], unit: "ZZ SD Unit" })).toEqual({ count: 2 });
    await leaveCorps(officer, "NSS", { studentMembershipIds: [ids.s1M!], on: TODAY });
    // s1 left today, so was enrolled today: today's camp credits them.
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Camp", at: TODAY, hours: 8, camp: true, participantMembershipIds: [ids.s1M!, ids.s2M!] })).resolves.toMatchObject({ id: expect.any(String) });
    // s2 joined today: an activity of yesterday was before they were enrolled.
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Drive", at: D(-1), hours: 2, camp: false, participantMembershipIds: [ids.s2M!] })).rejects.toMatchObject({ key: "duties.corps.refuseNotEnrolledOn", status: 422 });
    expect(await db.activity.count({ where: { schoolId: ids.A, title: "ZZ SD Drive" } })).toBe(0);
  });

  it("TA-380: a volunteer entered late is enrolled from the day they joined and credited the camps after it; a re-enrolment keeps the first joining day", async () => {
    const officer = await as("officer", "FACULTY", ids.A!);
    const joinedOn = async (who: string) => (await db.corpsEnrolment.findUniqueOrThrow({ where: { corps_studentMembershipId: { corps: "NSS", studentMembershipId: ids[`${who}M`]! } }, select: { enrolledOn: true, leftOn: true } }));
    // Never enrolled at all: the old sentence.
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Never", at: D(-3), hours: 2, camp: false, participantMembershipIds: [ids.s4M!] })).rejects.toMatchObject({ key: "duties.corps.refuseNotEnrolled", status: 422 });
    // A joining day ahead, or before the programme began, is refused; nothing is written.
    await expect(enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], unit: "ZZ SD Unit", enrolledOn: D(1) })).rejects.toMatchObject({ key: "duties.corps.refuseJoinFuture", status: 422, field: "enrolledOn" });
    await expect(enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], unit: "ZZ SD Unit", enrolledOn: "2024-06-01" })).rejects.toMatchObject({ key: "duties.corps.refuseBeforeProgramme", status: 422, field: "enrolledOn" });
    expect(await db.corpsEnrolment.count({ where: { schoolId: ids.A, studentMembershipId: ids.s3M } })).toBe(0);
    // s3 joined thirty days ago and is entered today with that day: a camp of twenty days ago credits them.
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], unit: "ZZ SD Unit", enrolledOn: D(-30) })).toEqual({ count: 1 });
    expect(await joinedOn("s3")).toEqual({ enrolledOn: D(-30), leftOn: null });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Late camp", at: D(-20), hours: 8, camp: true, participantMembershipIds: [ids.s3M!] })).resolves.toMatchObject({ id: expect.any(String) });
    // s3 leaves, comes back today: the first joining day stays, so a camp of the first spell is still theirs to record.
    await leaveCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], on: D(-2) });
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s3M!], unit: "ZZ SD Unit" })).toEqual({ count: 1 });
    expect(await joinedOn("s3")).toEqual({ enrolledOn: D(-30), leftOn: null });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD First spell drive", at: D(-25), hours: 2, camp: false, participantMembershipIds: [ids.s3M!] })).resolves.toMatchObject({ id: expect.any(String) });
    // s4 was entered today with no day; an earlier day moves their joining day back, a later one does not.
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s4M!], unit: "ZZ SD Unit" })).toEqual({ count: 1 });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Before s4", at: D(-10), hours: 2, camp: false, participantMembershipIds: [ids.s4M!] })).rejects.toMatchObject({ key: "duties.corps.refuseNotEnrolledOn", status: 422 });
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s4M!], unit: "ZZ SD Unit", enrolledOn: D(-12) })).toEqual({ count: 1 });
    expect(await enrolInCorps(officer, "NSS", { studentMembershipIds: [ids.s4M!], unit: "ZZ SD Unit", enrolledOn: D(-5) })).toEqual({ count: 0 });
    expect(await joinedOn("s4")).toEqual({ enrolledOn: D(-12), leftOn: null });
    await expect(addCorpsActivity(officer, "NSS", { title: "ZZ SD Before s4", at: D(-10), hours: 2, camp: false, participantMembershipIds: [ids.s4M!] })).resolves.toMatchObject({ id: expect.any(String) });
  });

  it("TA-380: the desk's enrol form sends the joining day", async () => {
    // s1 left today; the form enrols them again with the day they first joined.
    const form = new FormData();
    form.set("corps", "NSS");
    form.append("student", ids.s1M!);
    form.set("unit", "ZZ SD Unit");
    form.set("enrolledOn", D(-15));
    await as("officer", "FACULTY", ids.A!);
    expect(await redirected(enrolCorpsAction(form))).toContain("done=duties.corps.enrolled");
    expect(await db.corpsEnrolment.findFirstOrThrow({ where: { schoolId: ids.A, corps: "NSS", studentMembershipId: ids.s1M }, select: { enrolledOn: true, leftOn: true } })).toEqual({ enrolledOn: D(-15), leftOn: null });
  });

  it("TA-381: a teaching-practice posting with an observed lesson keeps its student and the days that hold it", async () => {
    const coord = await as("coord", "FACULTY", ids.E!);
    const school = (await savePracticeSchool(coord, { name: "ZZ SD ZP School", udise: null, contact: "" })).id;
    const posting = (await savePracticePosting(coord, { studentMembershipId: ids.t1M!, practiceSchoolId: school, from: D(-20), to: D(20), lessonsPlanned: 10 })).id;
    await addLessonObservation(coord, posting, { at: D(-10), grade: "A", note: "" });
    const base = { id: posting, studentMembershipId: ids.t1M!, practiceSchoolId: school, from: D(-20), to: D(20), lessonsPlanned: 10 };
    await expect(savePracticePosting(coord, { ...base, studentMembershipId: ids.t2M! })).rejects.toMatchObject({ key: "duties.teachingPractice.refusePostingObserved", status: 409, field: "studentMembershipId" });
    await expect(savePracticePosting(coord, { ...base, from: D(-5) })).rejects.toMatchObject({ key: "duties.teachingPractice.refusePostingObserved", status: 409, field: "from" });
    expect(await db.teachingPracticePosting.findUniqueOrThrow({ where: { id: posting }, select: { studentMembershipId: true, fromKey: true } })).toEqual({ studentMembershipId: ids.t1M, fromKey: D(-20) });
    await savePracticePosting(coord, { ...base, lessonsPlanned: 12, to: D(30) });
    expect((await db.teachingPracticePosting.findUniqueOrThrow({ where: { id: posting }, select: { lessonsPlanned: true } })).lessonsPlanned).toBe(12);
  });

  it("TA-479: with two departments' SARs in the year, the NBA tile counts how many are signed off", async () => {
    const filing = (departmentId: string, status: string, generatedAt: Date, n: number) => db.collegeFiling.create({ data: { schoolId: ids.A!, kind: "NBA_SAR", year: 2026, format: "JSON", body: "{}", hash: `zz-sd-${STAMP}-${n}`, status, departmentId, generatedAt } });
    await filing(ids.cheDept!, "RETURNED", new Date(Date.now() - 86_400_000), 1);
    await filing(ids.phyDept!, "SIGNED_OFF", new Date(), 2);
    const figures = await homeFigures(ids.A!, { tiles: ["nba"], modulesOn: ["IQAC"], streams: ["LAW", "SCIENCE"] });
    expect(figures.tiles.nba).toEqual({ key: "streams.figure.nbaDepartments", values: { year: "2026–27", done: 1, count: 2 } });
  });
});

describe("the moot court form", () => {
  it("TA-271: the office's form corrects a recorded moot by its id instead of recording a second one", async () => {
    const admin = await as("admin", "ADMIN", ids.A!);
    const moot = (await saveMootCourt(admin, { name: "ZZ SD Inter moot", at: D(-3), kind: "INTER", teams: [{ name: "ZZ SD Team A", membershipIds: [ids.s3M!], outcome: "WINNER" }, { name: "ZZ SD Team B", membershipIds: [ids.s4M!], outcome: "PARTICIPATED" }], result: "", judgeNotes: "" })).id;
    const form = new FormData();
    for (const [k, v] of Object.entries({ id: moot, back: "/admin/stream-records/moot-courts", teamSlots: "4", name: "ZZ SD Inter-college moot", at: D(-3), kind: "INTER", team1Name: "ZZ SD Team A", team1Outcome: "WINNER", team2Name: "ZZ SD Team B", team2Outcome: "RUNNER_UP", result: "ZZ SD Team A won", judgeNotes: "" })) form.set(k, v);
    form.append("team1Member", ids.s1M!);
    form.append("team2Member", ids.s2M!);
    await as("admin", "ADMIN", ids.A!);
    const state = await saveMootCourtAction({ ok: false }, form);
    expect(state.ok).toBe(true);
    const rows = await db.mootCourt.findMany({ where: { schoolId: ids.A }, select: { id: true, name: true, teamsJson: true } });
    expect(rows.map((r) => [r.id, r.name])).toEqual([[moot, "ZZ SD Inter-college moot"]]);
    expect(JSON.parse(rows[0]!.teamsJson)).toEqual([{ name: "ZZ SD Team A", membershipIds: [ids.s1M], outcome: "WINNER" }, { name: "ZZ SD Team B", membershipIds: [ids.s2M], outcome: "RUNNER_UP" }]);
  });
});
