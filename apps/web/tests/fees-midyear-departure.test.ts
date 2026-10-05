/**
 * A PUPIL WHO ARRIVES OR LEAVES PART-WAY THROUGH THE YEAR (audit of 5 October 2026).
 *
 * A3-journeys-16: a child admitted on 5 October onto a structure whose first
 * term fell due in July was "Overdue ₹15,000" on day one, the family's home
 * listed September's papers as "awaiting marks", and the teacher's to-do
 * counted the child among those still to mark. Now an instalment due before
 * the admission date falls due on it, and a paper sat before it is not the
 * child's.
 *
 * A3-journeys-15: a pupil who left on a day with a later term unpaid stayed
 * "Due" on the office's list and dropped out of the family's fee chooser. Now
 * the later, untouched instalment is CANCELLED (the row kept) and the child
 * stays in the chooser with the day they left.
 *
 * At a ZZ school of this suite's own in Asia/Kolkata, through the fee doors
 * as the office and the guardian, and the exam and leaving libraries.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { POST as plansPost } from "@/app/api/v1/fees/plans/route";
import { GET as familyFeesGet } from "@/app/api/v1/fees/family/route";
import { GET as duesGet } from "@/app/api/v1/fees/dues/route";
import { examMarksFor, marksTodoFor } from "@/lib/exams";
import { recordOrScheduleLeaving } from "@/lib/leaving";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids = { school: "", admin: "", parent: "", year: "", klass: "", structure: "", newcomer: "", old: "", leaver: "", newcomerUser: "", oldUser: "", leaverUser: "", t1: "", t2: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function as(userId: string, schoolId: string | null, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}
const day = (key: string) => new Date(`${key}T00:00:00.000Z`);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ MidYear ${STAMP}`, slug: `zz-midyear-${STAMP}`, code: `ZM${SUFFIX}`, contactEmail: `zz-midyear-${STAMP}@test.invalid`, timezone: TZ, locale: "en" }, select: { id: true } })).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ MidYear ${who}`, email: `zz-midyear-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate: who.startsWith("Pupil") ? new Date("2019-01-01T00:00:00Z") : null }, select: { id: true } });
  const [admin, parent, newcomer, old, leaver] = await Promise.all([user("Admin"), user("Parent"), user("PupilNew"), user("PupilOld"), user("PupilLeaver")]);
  Object.assign(ids, { admin: admin.id, parent: parent.id, newcomerUser: newcomer.id, oldUser: old.id, leaverUser: leaver.id });
  await db.membership.create({ data: { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  // The old pupil and the leaver joined a year ago; the newcomer today.
  const longAgo = new Date(Date.now() - 400 * 86_400_000);
  ids.old = (await db.membership.create({ data: { userId: old.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZMO${STAMP}`, joinedAt: longAgo, gradeLevel: "3" }, select: { id: true } })).id;
  ids.leaver = (await db.membership.create({ data: { userId: leaver.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZML${STAMP}`, joinedAt: longAgo, gradeLevel: "3" }, select: { id: true } })).id;
  ids.newcomer = (await db.membership.create({ data: { userId: newcomer.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZMN${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  await db.pupilRecord.create({ data: { schoolId: ids.school, studentMembershipId: ids.newcomer, admissionDate: day(TODAY), admittedToGrade: "3" } });
  await db.guardianship.createMany({ data: [ids.newcomer, ids.leaver].map((studentMembershipId) => ({ parentUserId: parent.id, studentMembershipId, studentSchoolId: ids.school, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() })) });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2026–27", startDate: day(addDaysToKey(TODAY, -120)), endDate: day(addDaysToKey(TODAY, 240)), isCurrent: true }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ MidYear 3A", gradeLevel: "3", joinCode: `ZM3${SUFFIX}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [ids.old, ids.leaver, ids.newcomer].map((studentMembershipId) => ({ classId: ids.klass, schoolId: ids.school, studentMembershipId, status: "ACTIVE" })) });
  const head = await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } });
  ids.structure = (await db.feeStructure.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Grade 3 fees", gradeLevel: "3", publishedAt: new Date() }, select: { id: true } })).id;
  ids.t1 = (await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label: "ZZ Term 1", sortOrder: 0, dueDate: day(addDaysToKey(TODAY, -80)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: 15_000_00 }] } }, select: { id: true } })).id;
  ids.t2 = (await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label: "ZZ Term 2", sortOrder: 1, dueDate: day(addDaysToKey(TODAY, 70)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: 12_500_00 }] } }, select: { id: true } })).id;
  // A paper sat three weeks ago and one sat today, for grade 3; the old pupil has a mark on the first.
  const series = await db.examSeries.create({ data: { schoolId: ids.school, name: "ZZ Mid-term", gradeLevel: "3", kind: "MID_TERM", publishedAt: new Date() }, select: { id: true } });
  const before = await db.examSlot.create({ data: { schoolId: ids.school, seriesId: series.id, subject: "ZZ Maths", dateKey: addDaysToKey(TODAY, -21), pointsMilli: 50_000 }, select: { id: true } });
  await db.examSlot.create({ data: { schoolId: ids.school, seriesId: series.id, subject: "ZZ English", dateKey: TODAY, pointsMilli: 50_000, position: 1 } });
  const adminMembership = await db.membership.findFirstOrThrow({ where: { userId: admin.id, schoolId: ids.school }, select: { id: true } });
  const sitting = await db.assignment.create({ data: { schoolId: ids.school, classId: ids.klass, authorMembershipId: adminMembership.id, title: "ZZ Mid-term · ZZ Maths", category: "Exam", pointsMilli: 50_000, examSlotId: before.id, publishedAt: new Date() }, select: { id: true } });
  await db.grade.create({ data: { schoolId: ids.school, assignmentId: sitting.id, studentMembershipId: ids.old, scoreMilli: 41_000, gradedByMembershipId: adminMembership.id } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a mid-year admission (A3-journeys-16)", () => {
  it("an instalment due before the admission date falls due on it: not overdue on day one; the later one keeps its day; a pupil admitted before keeps the structure's days", async () => {
    await as(ids.admin, ids.school, "ADMIN");
    const res = await plansPost(json("/api/v1/fees/plans", { structureId: ids.structure, studentMembershipIds: [ids.newcomer, ids.leaver] }));
    expect(res.status).toBe(200);
    const newcomer = await db.feeDemand.findMany({ where: { studentMembershipId: ids.newcomer }, orderBy: { dueDate: "asc" }, select: { label: true, dueDate: true, netPaise: true } });
    expect(newcomer.map((d) => [d.label, d.dueDate.toISOString().slice(0, 10), d.netPaise])).toEqual([["ZZ Term 1", TODAY, 15_000_00], ["ZZ Term 2", addDaysToKey(TODAY, 70), 12_500_00]]);
    const leaver = await db.feeDemand.findMany({ where: { studentMembershipId: ids.leaver }, orderBy: { dueDate: "asc" }, select: { dueDate: true } });
    expect(leaver.map((d) => d.dueDate.toISOString().slice(0, 10))).toEqual([addDaysToKey(TODAY, -80), addDaysToKey(TODAY, 70)]);

    await as(ids.parent, null, "PARENT");
    const fees = await (await familyFeesGet(get(`/api/v1/fees/family?childId=${ids.newcomer}`))).json();
    expect(fees.child.totals).toMatchObject({ outstandingPaise: 27_500_00, overduePaise: 0 });
  }, 30_000);

  it("a paper sat before the child joined, unmarked, is not 'awaiting marks' for them, nor counted in the to-do; one sat since is", async () => {
    const parent = await as(ids.parent, null, "PARENT");
    const marks = await examMarksFor(parent);
    const mine = marks.find((m) => m.studentMembershipId === ids.newcomer)!;
    expect(mine.series.flatMap((s) => s.papers.map((p) => p.subject))).toEqual(["ZZ English"]);
    const leaver = marks.find((m) => m.studentMembershipId === ids.leaver)!;
    expect(leaver.series.flatMap((s) => s.papers.map((p) => p.subject))).toEqual(["ZZ Maths", "ZZ English"]);

    const admin = await as(ids.admin, ids.school, "ADMIN");
    const todo = await marksTodoFor(admin, TODAY);
    const maths = todo.find((x) => x.subject === "ZZ Maths")!;
    // Three on the roll today; the newcomer was not there three weeks ago: one of two marked.
    expect([maths.marked, maths.classSize]).toEqual([1, 2]);
    expect(todo.find((x) => x.subject === "ZZ English")).toMatchObject({ marked: 0, classSize: 3 });
  }, 30_000);
});

describe("a departure with a later term unpaid (A3-journeys-15)", () => {
  it("the term after the last day is cancelled and kept; the term before it stays owed; the office's dues list stops chasing the later one; the child stays in the family's chooser, labelled", async () => {
    const admin = await as(ids.admin, ids.school, "ADMIN");
    const out = await recordOrScheduleLeaving(admin, ids.leaver, { reason: "LEFT", leftOn: TODAY });
    expect(out.ok).toBe(true);
    const demands = await db.feeDemand.findMany({ where: { studentMembershipId: ids.leaver }, orderBy: { dueDate: "asc" }, select: { label: true, status: true } });
    expect(demands.map((d) => [d.label, d.status])).toEqual([["ZZ Term 1", "OPEN"], ["ZZ Term 2", "CANCELLED"]]);
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "student.leave", targetId: ids.leaver } });
    expect(JSON.parse(audit!.meta)).toMatchObject({ cancelledDemands: 1 });

    const dues = await (await duesGet(get("/api/v1/fees/dues"))).json();
    const row = dues.rows.find((r: { studentMembershipId: string }) => r.studentMembershipId === ids.leaver);
    expect(row?.outstandingPaise ?? 0).toBe(15_000_00);

    await as(ids.parent, null, "PARENT");
    const fees = await (await familyFeesGet(get("/api/v1/fees/family"))).json();
    expect(fees.children.map((c: { studentMembershipId: string; leftAt: string | null }) => [c.studentMembershipId, c.leftAt === null])).toEqual([[ids.newcomer, true], [ids.leaver, false]]);
    // The first shown is the child still at school; the one who left opens by name, with what is still owed.
    expect(fees.child.studentMembershipId).toBe(ids.newcomer);
    const left = await (await familyFeesGet(get(`/api/v1/fees/family?childId=${ids.leaver}`))).json();
    expect(left.child.totals.outstandingPaise).toBe(15_000_00);
  }, 30_000);
});
