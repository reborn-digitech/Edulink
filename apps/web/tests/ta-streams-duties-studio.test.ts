/**
 * The studio desk's findings of the testing analysis of 13 November 2026 (batch streams-duties).
 *
 * One ZZ college of this suite's own with ARCHITECTURE and SCIENCE, made through the operator's createSchool and
 * removed after: a coordinator holding STUDIO_COORDINATOR, a teacher, a juror, two students registered on an
 * architecture offering, a second architecture offering and a physics offering. Proved:
 *   - TA-473: a studio is kept on an architecture programme's course only; the desk offers no other;
 *   - TA-603: the convener is not told of the jury they convened;
 *   - TA-206: after a signed jury the studio's maximum, offering and a closed stage's day stay; its title changes;
 *   - TA-470: the student's read says which stage is open, each on its own;
 *   - TA-208: a juror's save in flight while the chair's signature commits is refused, never written after it;
 *   - TA-384: one upload ticket sent twice at once is spent once and attached once;
 *   - TA-471: once ARCHITECTURE is dropped, the sheet, the signature and the posting are refused and offered to nobody.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { gradeBandFor, studentStudiosSchema, studioDeskSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { facultyStudios, postJuryToInternal, saveJury, saveJuryMarks, saveStudio, saveStudioSubmission, signJury, studentStudios, studioDesk } from "@/lib/studio";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-sdstudio-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const D = (n: number) => addDaysToKey(TODAY, n);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession())!;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ SD Studio ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function offering(key: string, programme: string, code: string): Promise<void> {
  const S = ids.college!;
  const scheme = (await db.scheme.create({ data: { schoolId: S, programmeId: ids[programme]!, name: `ZZ SD ${code} scheme`, effectiveYear: 2025 }, select: { id: true } })).id;
  const course = (await db.course.create({ data: { schoolId: S, schemeId: scheme, code, name: `ZZ SD ${code}`, semester: 1, creditsL: 2, creditsP: 3 }, select: { id: true } })).id;
  ids[key] = (await db.courseOffering.create({ data: { schoolId: S, termId: ids.term!, courseId: course, facultyMembershipId: ids.teacherM!, lectureHours: 2, practicalHours: 6 }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ SD Studio Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ SD Studio College ${STAMP}`, contactEmail: MAIL("contact"), timezone: TZ, kind: "COLLEGE", streams: ["ARCHITECTURE", "SCIENCE"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  for (const [who, role] of [["admin", "ADMIN"], ["coord", "FACULTY"], ["teacher", "FACULTY"], ["juror", "FACULTY"], ["s1", "STUDENT"], ["s2", "STUDENT"]] as const) await person(who, role);
  const S = ids.college;
  ids.dept = (await db.department.create({ data: { schoolId: S, code: "ARCH", name: "ZZ SD Architecture" }, select: { id: true } })).id;
  ids.barch = (await db.programme.create({ data: { schoolId: S, departmentId: ids.dept!, code: "BARCH", name: "ZZ SD BArch", level: "UG", durationYears: 5, intake: 40, regulator: "COA", stream: "ARCHITECTURE" }, select: { id: true } })).id;
  ids.bsc = (await db.programme.create({ data: { schoolId: S, departmentId: ids.dept!, code: "BSC", name: "ZZ SD BSc", level: "UG", durationYears: 3, intake: 40, regulator: "UGC", stream: "SCIENCE" }, select: { id: true } })).id;
  ids.term = (await db.academicTerm.create({ data: { schoolId: S, name: "ZZ SD Studio term", academicYear: "2026–27", startsOn: D(-40), endsOn: D(60), registrationOpensOn: D(-50), registrationClosesOn: D(-30) }, select: { id: true } })).id;
  await offering("ar101", "barch", "AR101");
  await offering("ar102", "barch", "AR102");
  await offering("phy", "bsc", "PHY101");
  for (const n of [1, 2]) await db.courseRegistration.create({ data: { schoolId: S, studentMembershipId: ids[`s${n}M`]!, offeringId: ids.ar101!, termId: ids.term!, kind: "CORE", byUserId: ids.admin! } });
  await setDuties(await as("admin", "ADMIN"), ids.coordM!, ["STUDIO_COORDINATOR"]);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.uploadTicket.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 120_000);

const studioInput = (over: Record<string, unknown> = {}) => ({ offeringId: ids.ar101!, title: "ZZ SD Library", brief: "ZZ A library by the river.", maxMarks: 100, briefIssuedOn: D(-30), interimOn: D(-5), finalOn: D(10), juryOn: D(20), ...over });
const panel = (over: Record<string, unknown> = {}) => ({ on: D(-3), title: "ZZ SD Interim jury", jurorMembershipIds: [ids.coordM!, ids.jurorM!], chairMembershipId: ids.coordM!, externalJurors: [], ...over });

describe("the studio and its jury", () => {
  it("TA-473: a studio is kept on an architecture programme's course only, and the desk offers no other", async () => {
    const coord = await as("coord", "FACULTY");
    ids.studio = (await saveStudio(coord, studioInput())).id;
    await expect(saveStudio(coord, studioInput({ offeringId: ids.phy }))).rejects.toMatchObject({ key: "duties.studio.refuseNotArchitectureCourse", status: 422, field: "offeringId" });
    expect(await db.studio.count({ where: { schoolId: ids.college, offeringId: ids.phy } })).toBe(0);
    const desk = studioDeskSchema.parse(await studioDesk(coord));
    expect(desk.offerings.map((o) => o.id).sort()).toEqual([ids.ar101, ids.ar102].sort());
  });

  it("TA-603: the convener is not told of the jury they convened; the rest of the panel is", async () => {
    const coord = await as("coord", "FACULTY");
    ids.jury = (await saveJury(coord, ids.studio!, panel())).id;
    expect(await db.notification.count({ where: { userId: ids.juror, titleKey: "duties.studio.notifyJury" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.coord, titleKey: "duties.studio.notifyJury" } })).toBe(0);
  });

  it("TA-206: once a jury has signed, the studio's maximum, its offering and a closed stage's day stay; its title still changes", async () => {
    const coord = await as("coord", "FACULTY");
    await saveJuryMarks(await as("juror", "FACULTY"), ids.jury!, { entries: [{ studentMembershipId: ids.s1M!, marks: 40, remark: "" }, { studentMembershipId: ids.s2M!, marks: null, remark: "ZZ absent" }] });
    expect(await signJury(coord, ids.jury!)).toEqual({ signed: true, changed: true });
    await expect(saveStudio(coord, studioInput({ id: ids.studio, maxMarks: 50 }))).rejects.toMatchObject({ key: "duties.studio.refuseStudioSigned", status: 409, field: "maxMarks" });
    await expect(saveStudio(coord, studioInput({ id: ids.studio, offeringId: ids.ar102 }))).rejects.toMatchObject({ key: "duties.studio.refuseStudioSigned", status: 409, field: "offeringId" });
    // The pin-up (five days back) was closed by the signed jury of three days back; moving it after the jury would open it again.
    await expect(saveStudio(coord, studioInput({ id: ids.studio, interimOn: D(-2) }))).rejects.toMatchObject({ key: "duties.studio.refuseStudioSigned", status: 409, field: "interimOn" });
    const row = await db.studio.findUniqueOrThrow({ where: { id: ids.studio }, select: { maxMarks: true, offeringId: true, interimOn: true } });
    expect(row).toEqual({ maxMarks: 100, offeringId: ids.ar101, interimOn: D(-5) });
    await saveStudio(coord, studioInput({ id: ids.studio, title: "ZZ SD Library, revised" }));
    expect((await db.studio.findUniqueOrThrow({ where: { id: ids.studio }, select: { title: true } })).title).toBe("ZZ SD Library, revised");
    const s1 = studentStudiosSchema.parse(await studentStudios(await as("s1", "STUDENT")));
    expect(s1.studios[0]!.results[0]).toMatchObject({ marks: 40, band: gradeBandFor(40, 100) });
  });

  it("TA-470: the student's read says which submission stage is open, each on its own", async () => {
    const s1 = studentStudiosSchema.parse(await studentStudios(await as("s1", "STUDENT")));
    const mine = s1.studios.find((s) => s.id === ids.studio)!;
    expect(mine.canSubmit).toBe(true);
    expect(mine.openStages).toEqual(["FINAL_SUBMISSION"]);
    await expect(saveStudioSubmission(await as("s1", "STUDENT"), ids.studio!, { stage: "INTERIM_PINUP", note: "", fileId: null, submit: true })).rejects.toMatchObject({ key: "duties.studio.refuseClosed" });
  });

  it("TA-208: a juror's save in flight while the chair's signature commits is refused, and no mark is written after the signature", async () => {
    const coord = await as("coord", "FACULTY");
    // A studio of its own, so this case stands whatever the cases before it left.
    const studio = (await saveStudio(coord, studioInput({ title: "ZZ SD Race studio" }))).id;
    const jury = (await saveJury(coord, studio, panel({ on: D(-1), title: "ZZ SD Race jury" }))).id;
    await saveJuryMarks(await as("juror", "FACULTY"), jury, { entries: [{ studentMembershipId: ids.s1M!, marks: 60, remark: "" }, { studentMembershipId: ids.s2M!, marks: 61, remark: "" }] });
    const juror = await as("juror", "FACULTY");
    // The chair's signature, held open on the jury's row while the juror's save starts, then committed.
    let save: Promise<unknown> = Promise.resolve();
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`UPDATE "StudioJury" SET "signedAt" = now(), "signedByMembershipId" = ${ids.coordM} WHERE "id" = ${jury}`;
        save = saveJuryMarks(juror, jury, { entries: [{ studentMembershipId: ids.s1M!, marks: 95, remark: "ZZ after" }] });
        save.catch(() => undefined);
        await sleep(800);
      },
      { timeout: 20_000 },
    );
    await expect(save).rejects.toMatchObject({ key: "duties.studio.refuseSigned", status: 409 });
    const mark = await db.studioJuryMark.findFirstOrThrow({ where: { juryId: jury, studentMembershipId: ids.s1M }, select: { marksTenths: true } });
    expect(mark.marksTenths).toBe(600);
  });

  it("TA-384: one upload ticket sent with two stages at once is spent once and attached to one submission", async () => {
    const coord = await as("coord", "FACULTY");
    const open = (await saveStudio(coord, studioInput({ offeringId: ids.ar102, title: "ZZ SD Pavilion", interimOn: D(5), finalOn: D(10) }))).id;
    await db.courseRegistration.create({ data: { schoolId: ids.college!, studentMembershipId: ids.s1M!, offeringId: ids.ar102!, termId: ids.term!, kind: "CORE", byUserId: ids.admin! } });
    const fileId = `zz-sd-${STAMP}.pdf`;
    await db.uploadTicket.create({ data: { userId: ids.s1!, fileId, mime: "application/pdf", size: 1000 } });
    const s1 = await as("s1", "STUDENT");
    const results = await Promise.allSettled([
      saveStudioSubmission(s1, open, { stage: "INTERIM_PINUP", note: "", fileId, submit: false }),
      saveStudioSubmission(s1, open, { stage: "FINAL_SUBMISSION", note: "", fileId, submit: false }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason)).toEqual([expect.objectContaining({ key: "academics.refuseTicket", status: 422 })]);
    expect(await db.studioSubmission.count({ where: { studioId: open, fileId } })).toBe(1);
  });

  it("TA-471: once the college drops ARCHITECTURE, the sheet, the signature and the posting are refused and offered to nobody", async () => {
    const coord = await as("coord", "FACULTY");
    // A studio of its own with one signed jury and one unsigned, so this case stands whatever the cases before it left.
    const studio = (await saveStudio(coord, studioInput({ title: "ZZ SD Dropped studio" }))).id;
    const signed = (await saveJury(coord, studio, panel({ on: D(-1), title: "ZZ SD Signed jury" }))).id;
    await saveJuryMarks(await as("juror", "FACULTY"), signed, { entries: [{ studentMembershipId: ids.s1M!, marks: 50, remark: "" }, { studentMembershipId: ids.s2M!, marks: 51, remark: "" }] });
    await signJury(await as("coord", "FACULTY"), signed);
    const unsigned = (await saveJury(await as("coord", "FACULTY"), studio, panel({ on: D(15), title: "ZZ SD Final jury" }))).id;
    await saveJuryMarks(await as("juror", "FACULTY"), unsigned, { entries: [{ studentMembershipId: ids.s1M!, marks: 70, remark: "" }, { studentMembershipId: ids.s2M!, marks: 71, remark: "" }] });
    const component = await db.internalComponent.create({ data: { schoolId: ids.college!, offeringId: ids.ar101!, name: "ZZ SD Studio jury", kind: "PROJECT", maxMarks: 50, weight: 20 }, select: { id: true } });
    await db.school.update({ where: { id: ids.college }, data: { streamsJson: JSON.stringify(["SCIENCE"]) } });
    await expect(saveJuryMarks(await as("juror", "FACULTY"), unsigned, { entries: [{ studentMembershipId: ids.s1M!, marks: 80, remark: "" }] })).rejects.toMatchObject({ key: "duties.studio.refuseNotArchitecture", status: 409 });
    await expect(signJury(await as("coord", "FACULTY"), unsigned)).rejects.toMatchObject({ key: "duties.studio.refuseNotArchitecture", status: 409 });
    await expect(postJuryToInternal(await as("teacher", "FACULTY"), signed, component.id)).rejects.toMatchObject({ key: "duties.studio.refuseNotArchitecture", status: 409 });
    expect((await db.studioJury.findUniqueOrThrow({ where: { id: unsigned }, select: { signedAt: true } })).signedAt).toBeNull();
    expect(await db.internalMark.count({ where: { componentId: component.id } })).toBe(0);
    const read = await facultyStudios(await as("coord", "FACULTY"));
    expect(read.offered).toBe(false);
    expect(read.juries.filter((j) => j.canMark || j.canSign || j.canPost)).toEqual([]);
    const teacher = await facultyStudios(await as("teacher", "FACULTY"));
    expect(teacher.juries.filter((j) => j.canPost)).toEqual([]);
  });
});
