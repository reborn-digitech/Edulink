/**
 * THE STUDIO COORDINATOR'S DESK (R-56, the studio half; 10 October 2026).
 *
 * One ZZ architecture college of this suite's own, made through the
 * operator's createSchool and removed after, with an office, a coordinator
 * (FACULTY holding STUDIO_COORDINATOR), a teacher of the course, two more
 * teachers (one on no panel), an HOD heading the department and three
 * students registered on one offering of this term. What is proved:
 *   - the studio: a holder keeps one (the coordinator defaults to themself),
 *     the office must name a coordinator who holds the duty, the stage days
 *     must run in order, a teacher without the duty is refused; the desk
 *     reads the four stages with their state and what each waits for;
 *   - submissions: a stage with no day is refused, a draft stays a draft,
 *     work sent by the day is SUBMITTED and after it LATE, a sent one keeps
 *     its state, and a stage is closed once a jury on or after it is signed;
 *   - the jury: the coordinator convenes it (the office is not a holder),
 *     the chair must sit on the panel, every juror must be a teacher of the
 *     college, at most two external jurors by role and institution;
 *   - the sheet: a teacher off the panel is refused, marks above the maximum
 *     and a student not registered are refused, a juror writes and rewrites,
 *     the student sees nothing until the chair signs, the chair alone signs,
 *     not before every student has an entry, a signed sheet changes no more,
 *     signing twice is a no-op, and the signed marks reach the student with
 *     the band read from the marks;
 *   - internal marks: the signed sheet is posted into one of the offering's
 *     components through saveInternalMarks, scaled; an unsigned one is not;
 *   - the doors: the desk's doors open to a FACULTY or HOD only holding the
 *     duty at the gate and in permits; the faculty's and student's doors
 *     carry no duty; every write is labelled in the safety log.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { gradeBandFor, studioDeskSchema, facultyStudiosSchema, studentStudiosSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { endpointFor, gateRequest } from "@/lib/role-gate";
import { permits } from "@/lib/api-catalog/types";
import { ENDPOINTS } from "@/lib/api-catalog";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { actionKey } from "@/lib/safety-labels";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { facultyStudios, postJuryToInternal, saveJury, saveJuryMarks, saveStudio, saveStudioSubmission, signJury, stagesInOrder, studentStudios, studioDesk } from "@/lib/studio";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-studio-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const D = (n: number) => addDaysToKey(TODAY, n);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession())!;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ Studio ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ Studio Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ Studio College ${STAMP}`, contactEmail: MAIL("contact"), timezone: TZ, kind: "COLLEGE", streams: ["ARCHITECTURE"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  for (const [who, role] of [["admin", "ADMIN"], ["head", "PRINCIPAL"], ["coord", "FACULTY"], ["teacher", "FACULTY"], ["juror", "FACULTY"], ["other", "FACULTY"], ["hod", "HOD"], ["s1", "STUDENT"], ["s2", "STUDENT"], ["s3", "STUDENT"], ["s4", "STUDENT"]] as const) await person(who, role);
  const S = ids.college;
  ids.dept = (await db.department.create({ data: { schoolId: S, code: "ARCH", name: "ZZ Studio Architecture", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.prog = (await db.programme.create({ data: { schoolId: S, departmentId: ids.dept!, code: "BARCH", name: "ZZ Studio BArch", level: "UG", durationYears: 5, intake: 40, regulator: "COA", stream: "ARCHITECTURE" }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: S, programmeId: ids.prog!, name: "ZZ Studio scheme", effectiveYear: 2025 }, select: { id: true } })).id;
  ids.course = (await db.course.create({ data: { schoolId: S, schemeId: ids.scheme!, code: "AR101", name: "ZZ Design I", semester: 1, creditsL: 2, creditsP: 3 }, select: { id: true } })).id;
  ids.term = (await db.academicTerm.create({ data: { schoolId: S, name: "ZZ Studio term", academicYear: "2026–27", startsOn: D(-40), endsOn: D(60), registrationOpensOn: D(-50), registrationClosesOn: D(-30) }, select: { id: true } })).id;
  ids.offering = (await db.courseOffering.create({ data: { schoolId: S, termId: ids.term!, courseId: ids.course!, facultyMembershipId: ids.teacherM!, lectureHours: 2, practicalHours: 6 }, select: { id: true } })).id;
  for (const n of [1, 2, 3]) await db.courseRegistration.create({ data: { schoolId: S, studentMembershipId: ids[`s${n}M`]!, offeringId: ids.offering!, termId: ids.term!, kind: "CORE", byUserId: ids.admin! } });
  await setDuties(await as("admin", "ADMIN"), ids.coordM!, ["STUDIO_COORDINATOR"]);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const studioInput = (over: Record<string, unknown> = {}) => ({ offeringId: ids.offering!, title: "ZZ Reading room", brief: "ZZ A reading room on the north lawn.", maxMarks: 100, briefIssuedOn: D(-30), interimOn: D(-2), finalOn: D(20), juryOn: D(25), ...over });

describe("the studio and its stages", () => {
  it("keeps the stage days in order", () => {
    expect(stagesInOrder({ briefIssuedOn: "2026-08-01", interimOn: null, finalOn: "2026-09-01", juryOn: "2026-09-01" })).toBe(true);
    expect(stagesInOrder({ briefIssuedOn: "2026-08-01", interimOn: "2026-07-31", finalOn: null, juryOn: null })).toBe(false);
    expect(stagesInOrder({ briefIssuedOn: "2026-08-01", interimOn: "2026-08-10", finalOn: "2026-09-01", juryOn: "2026-08-20" })).toBe(false);
  });

  it("is kept by a holder of the duty or the office with a coordinator who holds it, never by a teacher without it", async () => {
    await expect(saveStudio(await as("teacher", "FACULTY"), studioInput())).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    const admin = await as("admin", "ADMIN");
    await expect(saveStudio(admin, studioInput())).rejects.toMatchObject({ key: "duties.studio.refuseNoCoordinator", status: 422 });
    await expect(saveStudio(admin, studioInput({ coordinatorMembershipId: ids.teacherM }))).rejects.toMatchObject({ key: "duties.studio.refuseCoordinatorNoDuty" });
    await expect(saveStudio(admin, studioInput({ coordinatorMembershipId: ids.coordM, juryOn: D(-5) }))).rejects.toMatchObject({ key: "duties.studio.refuseStageOrder" });
    await expect(saveStudio(admin, studioInput({ coordinatorMembershipId: ids.coordM, offeringId: "c" + "x".repeat(24) }))).rejects.toMatchObject({ key: "duties.studio.refuseUnknownOffering" });
    const coord = await as("coord", "FACULTY");
    ids.studio = (await saveStudio(coord, studioInput())).id;
    const row = await db.studio.findUniqueOrThrow({ where: { id: ids.studio } });
    expect(row).toMatchObject({ coordinatorMembershipId: ids.coordM, termId: ids.term, maxMarks: 100 });
    // Corrected by its id, by the office this time, and read back on the desk with the four stages.
    await saveStudio(admin, studioInput({ id: ids.studio, coordinatorMembershipId: ids.coordM, title: "ZZ Reading room, revised" }));
    const desk = studioDeskSchema.parse(await studioDesk(await as("head", "PRINCIPAL")));
    expect(desk).toMatchObject({ offered: true, canManage: false, canConvene: false });
    const s = desk.studios.find((x) => x.id === ids.studio)!;
    expect(s.title).toBe("ZZ Reading room, revised");
    expect(s.stages.map((x) => [x.stage, x.state, x.waiting])).toEqual([
      ["BRIEF_ISSUED", "DONE", 0],
      ["INTERIM_PINUP", "DONE", 3],
      ["FINAL_SUBMISSION", "AHEAD", 3],
      ["JURY", "AHEAD", 0],
    ]);
    expect(s.students.map((x) => x.studentMembershipId).sort()).toEqual([ids.s1M, ids.s2M, ids.s3M].sort());
    expect(desk.coordinators.map((c) => c.membershipId)).toEqual([ids.coordM]);
    expect(desk.offerings.map((o) => o.id)).toContain(ids.offering);
    const mine = studioDeskSchema.parse(await studioDesk(coord));
    expect(mine).toMatchObject({ canManage: true, canConvene: true });
  });
});

describe("a student's submission", () => {
  it("is refused for a stage with no day, kept as a draft, SUBMITTED by the day and LATE after it, and keeps its state once sent", async () => {
    const s1 = await as("s1", "STUDENT");
    // The jury has no submission; the final's day is set, the pin-up's day was two days ago.
    await expect(saveStudioSubmission(s1, ids.studio!, { stage: "INTERIM_PINUP", note: "", fileId: null, submit: false })).resolves.toMatchObject({ state: "DRAFT" });
    await expect(saveStudioSubmission(s1, ids.studio!, { stage: "INTERIM_PINUP", note: "ZZ pinned up", fileId: null, submit: true })).resolves.toMatchObject({ state: "LATE" });
    await expect(saveStudioSubmission(s1, ids.studio!, { stage: "INTERIM_PINUP", note: "ZZ pinned up, again", fileId: null, submit: false })).resolves.toMatchObject({ state: "LATE" });
    await expect(saveStudioSubmission(s1, ids.studio!, { stage: "FINAL_SUBMISSION", note: "ZZ final", fileId: null, submit: true })).resolves.toMatchObject({ state: "SUBMITTED" });
    // A ticket that is not the caller's is refused; a student not registered is a page that is not here.
    await expect(saveStudioSubmission(s1, ids.studio!, { stage: "FINAL_SUBMISSION", note: "", fileId: "nope.png", submit: false })).rejects.toMatchObject({ key: "academics.refuseTicket" });
    await expect(saveStudioSubmission(await as("s4", "STUDENT"), ids.studio!, { stage: "FINAL_SUBMISSION", note: "", fileId: null, submit: false })).rejects.toMatchObject({ key: "access.entryNotFound" });
    // The coordinator takes the final's day away: the stage is refused until it is set again.
    const coord = await as("coord", "FACULTY");
    await saveStudio(coord, studioInput({ id: ids.studio, finalOn: null, juryOn: null }));
    await expect(saveStudioSubmission(await as("s2", "STUDENT"), ids.studio!, { stage: "FINAL_SUBMISSION", note: "", fileId: null, submit: true })).rejects.toMatchObject({ key: "duties.studio.refuseStageUnset" });
    await saveStudio(coord, studioInput({ id: ids.studio }));
    const read = studentStudiosSchema.parse(await studentStudios(s1));
    const mine = read.studios.find((x) => x.id === ids.studio)!;
    expect(mine.submissions.map((x) => [x.stage, x.state, x.note])).toEqual([
      ["INTERIM_PINUP", "LATE", "ZZ pinned up, again"],
      ["FINAL_SUBMISSION", "SUBMITTED", "ZZ final"],
    ]);
    expect(mine.results).toEqual([]);
    expect(mine.canSubmit).toBe(true);
    // The desk now waits for two pin-ups and two finals.
    const desk = await studioDesk(coord);
    expect(desk.studios.find((x) => x.id === ids.studio)!.stages.map((x) => x.waiting)).toEqual([0, 2, 2, 0]);
  });
});

describe("the jury, the sheet and the chair's signature", () => {
  const jury = (over: Record<string, unknown> = {}) => ({ on: D(-1), title: "ZZ Interim jury", jurorMembershipIds: [ids.coordM!, ids.jurorM!], chairMembershipId: ids.coordM!, externalJurors: [{ role: "PRACTISING_ARCHITECT" as const, institution: "ZZ Vastu LLP" }], ...over });

  it("is convened by the coordinator with a panel of the college's teachers and a chair among them", async () => {
    await expect(saveJury(await as("admin", "ADMIN"), ids.studio!, jury())).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await expect(saveJury(await as("teacher", "FACULTY"), ids.studio!, jury())).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    const coord = await as("coord", "FACULTY");
    await expect(saveJury(coord, ids.studio!, jury({ chairMembershipId: ids.teacherM }))).rejects.toMatchObject({ key: "duties.studio.refuseChairNotOnPanel" });
    await expect(saveJury(coord, ids.studio!, jury({ jurorMembershipIds: [ids.coordM, ids.s1M], chairMembershipId: ids.coordM }))).rejects.toMatchObject({ key: "duties.studio.refuseUnknownJuror" });
    ids.jury = (await saveJury(coord, ids.studio!, jury())).id;
    // The panel is told; the chair convened it and is not.
    expect(await db.notification.count({ where: { userId: ids.juror, titleKey: "duties.studio.notifyJury" } })).toBe(1);
    const desk = await studioDesk(coord);
    const j = desk.studios.find((x) => x.id === ids.studio)!.juries.find((x) => x.id === ids.jury)!;
    expect(j).toMatchObject({ past: true, marked: 0, students: 3, signedAt: null });
    expect(j.panel.map((p) => [p.membershipId, p.chair])).toEqual([
      [ids.coordM, true],
      [ids.jurorM, false],
    ]);
    expect(j.externalJurors).toEqual([{ role: "PRACTISING_ARCHITECT", institution: "ZZ Vastu LLP" }]);
    // Corrected while unsigned: the panel grows, the newcomer is told.
    await saveJury(coord, ids.studio!, jury({ id: ids.jury, jurorMembershipIds: [ids.coordM, ids.jurorM, ids.hodM] }));
    expect(await db.notification.count({ where: { userId: ids.hod, titleKey: "duties.studio.notifyJury" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.juror, titleKey: "duties.studio.notifyJury" } })).toBe(1);
  });

  it("is marked by a juror on the panel, within the maximum, for registered students, and reaches no student until signed", async () => {
    const juror = await as("juror", "FACULTY");
    await expect(saveJuryMarks(await as("other", "FACULTY"), ids.jury!, { entries: [{ studentMembershipId: ids.s1M!, marks: 50, remark: "" }] })).rejects.toMatchObject({ key: "duties.studio.refuseNotOnPanel" });
    await expect(saveJuryMarks(juror, ids.jury!, { entries: [{ studentMembershipId: ids.s1M!, marks: 101, remark: "" }] })).rejects.toMatchObject({ key: "duties.studio.refuseOverMax", vars: { max: 100 } });
    await expect(saveJuryMarks(juror, ids.jury!, { entries: [{ studentMembershipId: ids.s4M!, marks: 50, remark: "" }] })).rejects.toMatchObject({ key: "duties.studio.refuseNotRegistered" });
    expect(await saveJuryMarks(juror, ids.jury!, { entries: [{ studentMembershipId: ids.s1M!, marks: 72, remark: "ZZ clear parti" }, { studentMembershipId: ids.s2M!, marks: 40.5, remark: "" }] })).toEqual({ saved: 2 });
    // Rewritten by the chair: the one writer upserts.
    const coord = await as("coord", "FACULTY");
    expect(await saveJuryMarks(coord, ids.jury!, { entries: [{ studentMembershipId: ids.s2M!, marks: 65.5, remark: "ZZ revised" }] })).toEqual({ saved: 1 });
    const mine = facultyStudiosSchema.parse(await facultyStudios(juror));
    const sheet = mine.juries.find((j) => j.id === ids.jury)!;
    expect(sheet).toMatchObject({ canMark: true, canSign: false, canPost: false, marked: 2, students: 3 });
    expect(sheet.sheet.map((r) => [r.studentMembershipId, r.marks, r.band, r.entered])).toEqual(expect.arrayContaining([[ids.s1M, 72, "A", true], [ids.s2M, 65.5, "B_PLUS", true], [ids.s3M, null, null, false]]));
    expect(mine.studios.find((s) => s.id === ids.studio)!.mine).toEqual({ teaches: false, coordinates: false, juror: true, heads: false });
    // The HOD heads the department: the studio is theirs to read, and they sit on the panel too.
    const hod = facultyStudiosSchema.parse(await facultyStudios(await as("hod", "HOD")));
    expect(hod.studios.find((s) => s.id === ids.studio)!.mine).toMatchObject({ heads: true, juror: true });
    // Nothing reaches the student yet; the office's desk lists the sheet as waiting for the chair.
    const s1 = studentStudiosSchema.parse(await studentStudios(await as("s1", "STUDENT")));
    expect(s1.studios.find((x) => x.id === ids.studio)!.results).toEqual([]);
    const desk = await studioDesk(await as("admin", "ADMIN"));
    expect(desk.toSign.map((x) => [x.juryId, x.marked, x.students])).toEqual([[ids.jury, 2, 3]]);
  });

  it("is signed by the chair alone, once every student has an entry, and then changes no more and reaches the students", async () => {
    await expect(signJury(await as("juror", "FACULTY"), ids.jury!)).rejects.toMatchObject({ key: "duties.studio.refuseNotChair" });
    const coord = await as("coord", "FACULTY");
    await expect(signJury(coord, ids.jury!)).rejects.toMatchObject({ key: "duties.studio.refuseIncomplete", vars: { count: 1 } });
    // An absent student has an entry with no marks.
    await saveJuryMarks(coord, ids.jury!, { entries: [{ studentMembershipId: ids.s3M!, marks: null, remark: "ZZ absent" }] });
    expect(await signJury(coord, ids.jury!)).toEqual({ signed: true, changed: true });
    expect(await signJury(coord, ids.jury!)).toEqual({ signed: true, changed: false });
    await expect(saveJuryMarks(await as("juror", "FACULTY"), ids.jury!, { entries: [{ studentMembershipId: ids.s1M!, marks: 90, remark: "" }] })).rejects.toMatchObject({ key: "duties.studio.refuseSigned", status: 409 });
    await expect(saveJury(coord, ids.studio!, { id: ids.jury, on: D(-1), title: "ZZ", jurorMembershipIds: [ids.coordM!], chairMembershipId: ids.coordM!, externalJurors: [] })).rejects.toMatchObject({ key: "duties.studio.refuseSigned" });
    for (const n of [1, 2, 3]) expect(await db.notification.count({ where: { userId: ids[`s${n}`], titleKey: "duties.studio.notifyResult" } })).toBe(1);
    const s1 = studentStudiosSchema.parse(await studentStudios(await as("s1", "STUDENT")));
    const mine = s1.studios.find((x) => x.id === ids.studio)!;
    expect(mine.results).toEqual([{ juryId: ids.jury, on: D(-1), title: "ZZ Interim jury", marks: 72, band: "A", remark: "ZZ clear parti" }]);
    const s3 = studentStudiosSchema.parse(await studentStudios(await as("s3", "STUDENT")));
    expect(s3.studios.find((x) => x.id === ids.studio)!.results[0]).toMatchObject({ marks: null, band: null, remark: "ZZ absent" });
    // The pin-up (two days back) is closed by the signed jury of yesterday; the final (ahead) is still open.
    await expect(saveStudioSubmission(await as("s2", "STUDENT"), ids.studio!, { stage: "INTERIM_PINUP", note: "", fileId: null, submit: true })).rejects.toMatchObject({ key: "duties.studio.refuseClosed" });
    await expect(saveStudioSubmission(await as("s2", "STUDENT"), ids.studio!, { stage: "FINAL_SUBMISSION", note: "ZZ final", fileId: null, submit: false })).resolves.toMatchObject({ state: "DRAFT" });
    expect(mine.canSubmit).toBe(true);
    // The desk no longer waits for the sheet; the band is read from the marks, never stored.
    const desk = await studioDesk(coord);
    expect(desk.toSign).toEqual([]);
    expect(gradeBandFor(72, 100)).toBe("A");
    expect(gradeBandFor(89.9, 100)).toBe("A_PLUS");
    expect(gradeBandFor(90, 100)).toBe("O");
    expect(gradeBandFor(39, 100)).toBe("F");
    expect(gradeBandFor(null, 100)).toBeNull();
    expect(await db.studioJuryMark.findFirst({ where: { juryId: ids.jury, studentMembershipId: ids.s1M }, select: { marksTenths: true } })).toEqual({ marksTenths: 720 });
  });

  it("posts the signed sheet into an internal component of the offering, scaled, through the internal marks' one writer", async () => {
    const component = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.offering!, name: "ZZ Studio jury", kind: "PROJECT", maxMarks: 50, weight: 20 }, select: { id: true } });
    const teacher = await as("teacher", "FACULTY");
    const jury2 = (await saveJury(await as("coord", "FACULTY"), ids.studio!, { on: D(25), title: "ZZ Final jury", jurorMembershipIds: [ids.coordM!, ids.teacherM!], chairMembershipId: ids.teacherM!, externalJurors: [] })).id;
    await expect(postJuryToInternal(teacher, jury2, component.id)).rejects.toMatchObject({ key: "duties.studio.refuseUnsigned", status: 409 });
    await expect(postJuryToInternal(await as("other", "FACULTY"), ids.jury!, component.id)).rejects.toMatchObject({ key: "academics.refuseNotYours" });
    expect(await postJuryToInternal(teacher, ids.jury!, component.id)).toEqual({ posted: 3, componentId: component.id });
    const marks = await db.internalMark.findMany({ where: { componentId: component.id }, select: { studentMembershipId: true, marksTenths: true } });
    expect(marks.find((m) => m.studentMembershipId === ids.s1M)!.marksTenths).toBe(360);
    expect(marks.find((m) => m.studentMembershipId === ids.s2M)!.marksTenths).toBe(328);
    expect(marks.find((m) => m.studentMembershipId === ids.s3M)!.marksTenths).toBeNull();
    const mine = facultyStudiosSchema.parse(await facultyStudios(teacher));
    expect(mine.juries.find((j) => j.id === ids.jury)).toMatchObject({ canMark: false, canSign: false, canPost: true });
    expect(mine.juries.find((j) => j.id === jury2)).toMatchObject({ canMark: true, canSign: true, canPost: false });
  });
});

describe("the studio desk's doors", () => {
  it("open the desk to a FACULTY or HOD only holding the duty, the faculty's and student's doors without one, and label every write", async () => {
    for (const [method, path] of [["GET", "/api/v1/duties/studio"], ["POST", "/api/v1/duties/studio/studios"], ["POST", "/api/v1/duties/studio/studios/{studioId}/juries"]] as const) {
      const door = endpointFor(method, path)!;
      expect({ path, duties: door.duties }).toEqual({ path, duties: ["STUDIO_COORDINATOR"] });
      expect(permits(door, "FACULTY")).toBe(false);
      expect(permits(door, "HOD", ["STUDIO_COORDINATOR"])).toBe(true);
      expect(permits(door, "STUDENT", ["STUDIO_COORDINATOR"])).toBe(false);
      await expect(gateRequest(`${method} ${path}`, { role: "FACULTY", schoolId: ids.college!, duties: [] })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
      await expect(gateRequest(`${method} ${path}`, { role: "FACULTY", schoolId: ids.college!, duties: ["STUDIO_COORDINATOR"] })).resolves.toBe("pass");
    }
    for (const [method, path] of [["GET", "/api/v1/faculty/studios"], ["POST", "/api/v1/faculty/studios/juries/{juryId}/marks"], ["POST", "/api/v1/faculty/studios/juries/{juryId}/sign"], ["POST", "/api/v1/faculty/studios/juries/{juryId}/internal"]] as const) {
      const door = endpointFor(method, path)!;
      expect({ path, duties: door.duties, module: door.module }).toEqual({ path, duties: undefined, module: "ACADEMICS" });
      expect(permits(door, "FACULTY")).toBe(true);
      expect(permits(door, "STUDENT")).toBe(false);
    }
    for (const [method, path] of [["GET", "/api/v1/family/studios"], ["POST", "/api/v1/family/studios/{studioId}/submissions"]] as const) {
      const door = endpointFor(method, path)!;
      expect(permits(door, "STUDENT")).toBe(true);
      expect(permits(door, "FACULTY")).toBe(false);
      expect(permits(door, "PARENT")).toBe(false);
    }
    expect(ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/duties/studio") || e.path.startsWith("/api/v1/faculty/studios") || e.path.startsWith("/api/v1/family/studios")).length).toBe(9);
    for (const action of ["studio.save", "studio.jury", "studio.marks", "studio.sign", "studio.postInternal", "studio.submit"]) {
      expect({ action, label: actionKey(action) }).toEqual({ action, label: expect.stringMatching(/^audit\./) });
    }
    const logged = await db.auditLog.groupBy({ by: ["action"], where: { schoolId: ids.college!, action: { startsWith: "studio." } }, _count: { _all: true } });
    expect(logged.map((l) => l.action).sort()).toEqual(["studio.jury", "studio.marks", "studio.postInternal", "studio.save", "studio.sign", "studio.submit"]);
  });
});
