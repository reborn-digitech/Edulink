/**
 * THE TRANSFER GAPS OF THE ADMIT STEP (the transfer walk of 6 October 2026,
 * R-67 and R-68; fixed 10 October 2026), through the admit handler as the
 * office of a ZZ school of this suite's own, removed afterwards.
 *
 * R-67: when the PEN names a pupil the platform knows, the applicant who
 * already holds an ACTIVE guardianship on that child at another school is
 * linked at the new school on admission (consents stamped as a claim's
 * approval stamps them, the audit row saying so); a stranger still claims.
 * R-68: an optional admission date, not before the cycle's year began and
 * not after today, dates the membership, the pupil record and the fee
 * instalments already due; absent, today.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "./stubs/next-headers";
import { POST as admitPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/admit/route";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
/** The cycle's year began 120 days ago: two instalments fell due before today, one is ahead. */
const YEAR_START = addDaysToKey(TODAY, -120);
const ids = { oldSchool: "", school: "", year: "", klass: "", cycle: "", structure: "", admin: "", father: "", stranger: "", child: "", child2: "", oldMembership: "" };
let serial = 0;
const PEN = (n: number) => `${String(STAMP).slice(-9)}${String(n).padStart(2, "0")}`;

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const day = (key: string) => new Date(`${key}T00:00:00Z`);
async function asAdmin() {
  __resetCookies();
  await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
}
/** An ACCEPTED application, as the office's admit step finds one. */
async function accepted(input: { childName: string; childBirthdate: string | null; applicantUserId?: string | null; penNumber?: string | null; cycleId?: string }): Promise<string> {
  serial += 1;
  return (
    await db.application.create({
      data: { schoolId: ids.school, cycleId: input.cycleId ?? ids.cycle, number: serial, serial: `ZZT-${SUFFIX}-${serial}`, applicantUserId: input.applicantUserId ?? null, applicantName: "ZZ Transfer Family", childName: input.childName, childBirthdate: input.childBirthdate ? day(input.childBirthdate) : null, gradeApplied: "6", penNumber: input.penNumber ?? null, status: "ACCEPTED", relation: "PARENT" },
      select: { id: true },
    })
  ).id;
}
async function admit(applicationId: string, body: Record<string, unknown>) {
  await asAdmin();
  const res = await admitPost(json(`/api/v1/office/admissions/applications/${applicationId}/admit`, body), params({ applicationId }));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Transfer ${tag} ${STAMP}`, slug: `zz-transfer-${tag.toLowerCase()}-${STAMP}`, code: `ZT${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-transfer-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, locale: "en", profilePublishedAt: new Date(), verifiedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } });
  ids.oldSchool = (await mk("Old")).id;
  ids.school = (await mk("New")).id;
  const user = (who: string, data: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Transfer ${who}`, email: `zz-transfer-${who.toLowerCase()}-${STAMP}@test.invalid`, ...data }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  ids.father = (await user("Father")).id;
  ids.stranger = (await user("Stranger")).id;
  ids.child = (await user("Child", { birthdate: day("2015-03-03"), isMinor: true, penNumber: PEN(1) })).id;
  ids.child2 = (await user("Child2", { birthdate: day("2015-04-04"), isMinor: true, penNumber: PEN(2) })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  // Both children left the old school; the father guards the first there, nobody the second.
  ids.oldMembership = (await db.membership.create({ data: { userId: ids.child, schoolId: ids.oldSchool, role: "STUDENT", status: "ACTIVE", leftAt: day(addDaysToKey(TODAY, -100)) }, select: { id: true } })).id;
  const old2 = await db.membership.create({ data: { userId: ids.child2, schoolId: ids.oldSchool, role: "STUDENT", status: "ACTIVE", leftAt: day(addDaysToKey(TODAY, -100)) }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId: ids.father, studentMembershipId: ids.oldMembership, studentSchoolId: ids.oldSchool, relation: "PARENT", status: "ACTIVE" } });
  void old2;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ Transfer year", startDate: day(YEAR_START), endDate: day(addDaysToKey(YEAR_START, 330)), isCurrent: true }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 6A", gradeLevel: "6", joinCode: `ZT6${SUFFIX}` }, select: { id: true } })).id;
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Transfer cycle", gradesJson: JSON.stringify([{ grade: "6", seats: 10 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
  const head = await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } });
  ids.structure = (await db.feeStructure.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Grade 6 fees", gradeLevel: "6", publishedAt: new Date() }, select: { id: true } })).id;
  // Two instalments already due before today and one ahead.
  for (const [i, offset] of [[0, 5], [1, 60], [2, 400]] as const) {
    await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label: `ZZ Term ${i + 1}`, sortOrder: i, dueDate: day(addDaysToKey(YEAR_START, offset)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: 10_000_00 }] } } });
  }
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: ids.admin } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: [ids.oldSchool, ids.school] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.oldSchool, ids.school] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("R-67 and R-68: a known pupil's own guardian, and the admission date", () => {
  it("links the applicant who already guards the child elsewhere, dated on the day the office says, and re-dates the instalments already due to that day", async () => {
    // Ninety days in: both instalments already due move to this day; the one ahead keeps its own.
    const joined = addDaysToKey(YEAR_START, 90);
    const app = await accepted({ childName: "ZZ Transfer Child", childBirthdate: "2015-03-03", applicantUserId: ids.father, penNumber: PEN(1) });
    const { status, body } = await admit(app, { classId: ids.klass, feeStructureId: ids.structure, admittedOn: joined });
    expect(status).toBe(200);
    expect(body.guardianLinked).toBe(true);
    expect(body.feePlan).toBe(true);
    expect(body.noteKey).toBeUndefined();
    const membershipId = body.studentMembershipId as string;
    // The seat went to the known account, and the father guards it here now, consents stamped as a claim's approval stamps them.
    const m = await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { userId: true, joinedAt: true } });
    expect(m.userId).toBe(ids.child);
    expect(m.joinedAt.toISOString()).toBe(`${joined}T00:00:00.000Z`);
    const link = await db.guardianship.findUnique({ where: { parentUserId_studentMembershipId: { parentUserId: ids.father, studentMembershipId: membershipId } }, select: { status: true, studentSchoolId: true, consentSharingAt: true, consentNotificationsAt: true } });
    expect(link).toMatchObject({ status: "ACTIVE", studentSchoolId: ids.school });
    expect(link?.consentSharingAt).not.toBeNull();
    expect(link?.consentNotificationsAt).not.toBeNull();
    // No stand-in was assigned, since a real guardian was linked.
    expect(await db.guardianship.count({ where: { studentMembershipId: membershipId, relation: "SCHOOL" } })).toBe(0);
    const record = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: membershipId }, select: { admissionDate: true } });
    expect(record.admissionDate?.toISOString()).toBe(`${joined}T00:00:00.000Z`);
    // The two instalments due before the admission day are due on it; the one ahead keeps its day.
    const demands = await db.feeDemand.findMany({ where: { studentMembershipId: membershipId, instalmentId: { not: null } }, orderBy: { label: "asc" }, select: { label: true, dueDate: true } });
    expect(demands.map((d) => [d.label, d.dueDate.toISOString().slice(0, 10)])).toEqual([
      ["ZZ Term 1", joined],
      ["ZZ Term 2", joined],
      ["ZZ Term 3", addDaysToKey(YEAR_START, 400)],
    ]);
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "admissions.admit", targetId: app }, select: { meta: true } });
    expect(JSON.parse(audit!.meta ?? "{}")).toMatchObject({ guardianLinked: true, guardianCarried: true, linkedByPen: true, admittedOn: joined });
  });

  it("a stranger applicant for a known pupil is not linked and still claims; without a date the admission is today", async () => {
    const app = await accepted({ childName: "ZZ Transfer Child2", childBirthdate: "2015-04-04", applicantUserId: ids.stranger, penNumber: PEN(2) });
    const { status, body } = await admit(app, { classId: ids.klass });
    expect(status).toBe(200);
    expect(body.guardianLinked).toBe(false);
    expect(body.noteKey).toBe("admissions.guardianNotLinked");
    const membershipId = body.studentMembershipId as string;
    expect(await db.guardianship.count({ where: { parentUserId: ids.stranger, studentMembershipId: membershipId } })).toBe(0);
    const m = await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { userId: true, joinedAt: true } });
    expect(m.userId).toBe(ids.child2);
    expect(m.joinedAt.toISOString().slice(0, 10)).toBe(TODAY);
    const record = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: membershipId }, select: { admissionDate: true } });
    expect(record.admissionDate?.toISOString().slice(0, 10)).toBe(TODAY);
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "admissions.admit", targetId: app }, select: { meta: true } });
    expect(JSON.parse(audit!.meta ?? "{}")).toMatchObject({ guardianLinked: false, guardianCarried: false, guardianNotLinked: true, admittedOn: TODAY });
  });

  it("refuses a day before the cycle's year began and a day after today, with a sentence, and admits nobody", async () => {
    const app = await accepted({ childName: "ZZ Transfer Walkin", childBirthdate: "2015-05-05" });
    for (const admittedOn of [addDaysToKey(YEAR_START, -1), addDaysToKey(TODAY, 1), "not-a-day"]) {
      const { status, body } = await admit(app, { classId: ids.klass, admittedOn });
      expect([403, 422]).toContain(status);
      if (status === 403) expect(body.error).toBe("The admission date must be between the start of the academic year and today.");
    }
    expect((await db.application.findUniqueOrThrow({ where: { id: app }, select: { status: true } })).status).toBe("ACCEPTED");
    // The year's first day itself, and today, are days the office may say.
    const ok = await admit(app, { classId: ids.klass, admittedOn: YEAR_START });
    expect(ok.status).toBe(200);
    expect((await db.membership.findUniqueOrThrow({ where: { id: ok.body.studentMembershipId as string }, select: { joinedAt: true } })).joinedAt.toISOString().slice(0, 10)).toBe(YEAR_START);
  });
});

describe("QA-43: a seat in next year's cycle, given before the year begins", () => {
  it("admits ahead, dated the year's first day, with no class yet; any other date or a class now is refused with a sentence", async () => {
    const nextStart = addDaysToKey(TODAY, 60);
    const nextYear = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ Transfer next year", startDate: day(nextStart), endDate: day(addDaysToKey(nextStart, 330)), isCurrent: false }, select: { id: true } })).id;
    const nextCycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: nextYear, name: "ZZ Transfer next cycle", gradesJson: JSON.stringify([{ grade: "6", seats: 2 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
    const app = await accepted({ childName: "ZZ Transfer Ahead", childBirthdate: "2015-06-06", cycleId: nextCycle });
    // Before the fix: 403 "The admission date must be between the start of the academic year and today.", with or without the year's first day.
    const today = await admit(app, { admittedOn: TODAY });
    expect(today.status).toBe(403);
    expect(today.body.error).toContain(nextStart);
    const withClass = await admit(app, { classId: ids.klass });
    expect(withClass.status).toBe(403);
    expect((await db.application.findUniqueOrThrow({ where: { id: app }, select: { status: true } })).status).toBe("ACCEPTED");
    const ok = await admit(app, {});
    expect(ok.status).toBe(200);
    expect(ok.body.className).toBeNull();
    const m = await db.membership.findUniqueOrThrow({ where: { id: ok.body.studentMembershipId as string }, select: { joinedAt: true, enrollments: { select: { id: true } } } });
    expect(m.joinedAt.toISOString().slice(0, 10)).toBe(nextStart);
    expect(m.enrollments).toHaveLength(0);
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: ok.body.studentMembershipId as string }, select: { admissionDate: true } })).admissionDate?.toISOString().slice(0, 10)).toBe(nextStart);
    // The year's first day named outright is the same admission.
    const app2 = await accepted({ childName: "ZZ Transfer Ahead Two", childBirthdate: "2015-07-07", cycleId: nextCycle });
    expect((await admit(app2, { admittedOn: nextStart })).status).toBe(200);
  });
});
