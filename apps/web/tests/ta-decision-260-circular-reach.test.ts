/**
 * TA-260 (testing analysis of 13 November 2026, Medium, Performance), decided 14 November 2026: the office's circular
 * list worked out the reach of up to fifty circulars one after another, each rebuilding its school's roster and
 * searching the notices by school and link. Now the list, the detail page and the reminder count through one shared
 * routine that builds the rosters once per page (each circular still on its own roster: delivery date, class, grade,
 * college target and audience) and asks who was told, saw, acknowledged or got a text once for the whole page. And,
 * added to the decision by the owner the same day, 'Opened' counts only a real opening of the circular (PostRead): a
 * notice merely marked read no longer counts.
 *
 * A scratch ZZ school of this suite's own (tests/ta-communication-fixture.ts), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { makeSchool, type CommSchool, type Person } from "./ta-communication-fixture";
import { isInTenantTransaction } from "@/lib/tenant-context";
import { circularReach, officeCirculars } from "@/lib/circulars";

// Every query through the app's client asks once whether it is inside a tenant transaction (src/lib/db.ts), so the
// calls of that question are the queries the client ran.
vi.mock("@/lib/tenant-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tenant-context")>();
  return { ...actual, isInTenantTransaction: vi.fn(actual.isInTenantTransaction) };
});

let s: CommSchool;
let leaver: Person;
let joiner: Person;
let sixth: Person;
let sixthGuardian = "";
let classC = "";
let toldAt = new Date();

beforeAll(async () => {
  s = await makeSchool("d260");
  const tail = String(s.stamp).slice(-6);
  // A pupil who left 5A after the circulars went out, one who joined it after, and a grade-6 class with its own family.
  leaver = await s.person("leaver", "STUDENT", { isMinor: true });
  joiner = await s.person("joiner", "STUDENT", { isMinor: true });
  sixth = await s.person("sixth", "STUDENT", { isMinor: true });
  sixthGuardian = (await s.person("sixthguardian", null)).userId;
  classC = (await s.db.class.create({ data: { schoolId: s.schoolId, name: `ZZ TA Comm 6C ${tail}`, gradeLevel: "6", section: "C", joinCode: `ZTMC${tail}` }, select: { id: true } })).id;
  await s.db.guardianship.create({ data: { parentUserId: sixthGuardian, studentMembershipId: sixth.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
  toldAt = new Date(Date.now() + 1_000);
  const later = new Date(toldAt.getTime() + 60_000);
  const before = new Date(toldAt.getTime() - 60_000);
  await s.db.enrollment.createMany({
    data: [
      { schoolId: s.schoolId, classId: s.classA, studentMembershipId: leaver.membershipId, status: "REMOVED", enrolledAt: before, removedAt: later },
      { schoolId: s.schoolId, classId: s.classA, studentMembershipId: joiner.membershipId, status: "ACTIVE", enrolledAt: later },
      { schoolId: s.schoolId, classId: classC, studentMembershipId: sixth.membershipId, status: "ACTIVE", enrolledAt: before },
    ],
  });
  // The fixture's own two enrolments began at its making; the delivery date must come after them.
  await s.db.enrollment.updateMany({ where: { schoolId: s.schoolId, studentMembershipId: { in: [s.pupilA.membershipId, s.pupilB.membershipId] } }, data: { enrolledAt: before } });
}, 60_000);

afterAll(async () => {
  await s.cleanup();
}, 60_000);

type Shape = { title: string; scope?: "SCHOOL" | "CLASS"; classId?: string; audience: "PARENTS" | "STUDENTS" | "ALL" | "TEACHERS"; grade?: string; target?: string; delivered: boolean };
const circular = (x: Shape) =>
  s.db.post.create({
    data: {
      schoolId: s.schoolId,
      authorUserId: s.admin.userId,
      authorMembershipId: s.admin.membershipId,
      scope: x.scope ?? "SCHOOL",
      classId: x.classId ?? null,
      title: `ZZ TA-260 ${x.title} ${s.stamp}`,
      body: "ZZ body.",
      audience: x.audience,
      audienceGrade: x.grade ?? null,
      audienceTarget: x.target ?? null,
      requiresAck: true,
      status: "APPROVED",
      ...(x.delivered ? { deliveredAt: toldAt, deliveryQueuedAt: toldAt } : {}),
    },
    select: { id: true },
  });
const toldNotice = (userId: string, postId: string, readAt: Date | null = null) =>
  s.db.notification.create({ data: { userId, schoolId: s.schoolId, kind: "POST", title: "ZZ told", url: `/bulletin/${postId}`, titleKey: "bulletin.notifCircular", readAt } });

/** One of each kind the shared routine branches on: to staff, to a class's parents told earlier, to a grade today, to a college target. */
const oneOfEachKind = async (tag: string) => [
  await circular({ title: `${tag} staff meeting`, audience: "TEACHERS", delivered: true }),
  await circular({ title: `${tag} 5A trip`, scope: "CLASS", classId: s.classA, audience: "PARENTS", delivered: true }),
  await circular({ title: `${tag} grade 5 sports`, audience: "ALL", grade: "5", delivered: false }),
  await circular({ title: `${tag} programme notice`, audience: "ALL", target: "PROGRAMME:zz-none", delivered: true }),
];

/** How many queries `run` made through the app's client. */
async function readsDuring(run: () => Promise<unknown>): Promise<number> {
  const asked = vi.mocked(isInTenantTransaction);
  const from = asked.mock.calls.length;
  await run();
  return asked.mock.calls.length - from;
}

describe("TA-260: the office's circular list asks each question once", () => {
  it("TA-260: the list's reads do not grow with the number of circulars on it", async () => {
    const office = s.ctx(s.admin, "ADMIN");
    await oneOfEachKind("first");
    const few = await readsDuring(() => officeCirculars(office));
    expect(few).toBeGreaterThan(0);
    await oneOfEachKind("second");
    await oneOfEachKind("third");
    const rows = (await officeCirculars(office)).rows.filter((r) => r.title.startsWith("ZZ TA-260"));
    expect(rows.length).toBeGreaterThanOrEqual(12);
    const many = await readsDuring(() => officeCirculars(office));
    expect(many).toBe(few);
  });

  it("TA-260: each row of the list equals its circular's detail page, each circular on its own roster", async () => {
    const office = s.ctx(s.admin, "ADMIN");
    const classTrip = await circular({ title: "detail 5A told", scope: "CLASS", classId: s.classA, audience: "PARENTS", delivered: true });
    const gradeToday = await circular({ title: "detail grade 5 today", audience: "ALL", grade: "5", delivered: false });
    const toEveryone = await circular({ title: "detail everyone told", audience: "ALL", delivered: true });
    const toSixth = await circular({ title: "detail grade 6 pupils", audience: "STUDENTS", grade: "6", delivered: true });
    const toStaff = await circular({ title: "detail staff", audience: "TEACHERS", delivered: true });
    // Told, opened, acknowledged and texted, spread over the circulars.
    await toldNotice(s.guardian.userId, classTrip.id);
    await toldNotice(sixthGuardian, toEveryone.id);
    await s.db.postRead.create({ data: { postId: toEveryone.id, schoolId: s.schoolId, userId: sixthGuardian } });
    await s.db.postAck.create({ data: { postId: gradeToday.id, schoolId: s.schoolId, userId: s.pupilA.userId } });
    await s.db.postAck.create({ data: { postId: toStaff.id, schoolId: s.schoolId, userId: s.teacher.userId } });
    await s.db.outboundMessage.create({ data: { schoolId: s.schoolId, userId: s.guardian.userId, to: "+910000000000", channel: "SMS", templateKey: "circular", body: "ZZ", status: "SENT", purpose: `circular:${toEveryone.id}` } });
    await toldNotice(sixth.userId, toSixth.id);

    const rows = new Map((await officeCirculars(office)).rows.map((r) => [r.postId, r]));
    for (const p of [classTrip, gradeToday, toEveryone, toSixth, toStaff]) {
      const detail = await circularReach(office, p.id);
      const row = rows.get(p.id)!;
      expect({ total: row.total, told: row.told, seen: row.seen, acked: row.acked, noGuardian: row.noGuardian }).toEqual(detail.totals);
    }
    const pupils = async (postId: string) => (await circularReach(office, postId)).groups.flatMap((g) => g.outstanding.map((f) => f.studentMembershipId)).sort();
    // Told before the leaver left and the joiner came: the roster it was told to.
    expect(await pupils(classTrip.id)).toEqual([leaver.membershipId, s.pupilA.membershipId].sort());
    expect(rows.get(classTrip.id)).toMatchObject({ total: 1, told: 1, noGuardian: 1 });
    // Not yet told: today's grade-5 roster, the joiner in and the leaver out.
    expect(await pupils(gradeToday.id)).toEqual([joiner.membershipId, s.pupilB.membershipId].sort());
    expect(rows.get(gradeToday.id)).toMatchObject({ total: 3, acked: 1 });
    expect(rows.get(toEveryone.id)).toMatchObject({ total: 4, told: 2, seen: 1, acked: 0 });
    expect(rows.get(toSixth.id)).toMatchObject({ total: 1, told: 1, seen: 0 });
    expect(rows.get(toStaff.id)).toMatchObject({ total: 4, acked: 1 });
  });
});

describe("TA-260: 'Opened' is a real opening of the circular", () => {
  it("TA-260: a notice marked read without opening the circular is told, not opened; an opening is opened", async () => {
    const office = s.ctx(s.admin, "ADMIN");
    const p = await circular({ title: "opened 6C", scope: "CLASS", classId: classC, audience: "PARENTS", delivered: true });
    // Marked read by hand, by 'mark all read' or by the nightly clean-up: all the same row.
    await toldNotice(sixthGuardian, p.id, new Date());
    const before = await circularReach(office, p.id);
    expect(before.totals).toMatchObject({ total: 1, told: 1, seen: 0 });
    expect(before.groups.flatMap((g) => g.outstanding.flatMap((f) => f.guardians.map((x) => x.state)))).toEqual(["TOLD"]);
    expect((await officeCirculars(office)).rows.find((r) => r.postId === p.id)).toMatchObject({ told: 1, seen: 0 });
    await s.db.postRead.create({ data: { postId: p.id, schoolId: s.schoolId, userId: sixthGuardian } });
    expect((await circularReach(office, p.id)).totals).toMatchObject({ told: 1, seen: 1 });
    expect((await officeCirculars(office)).rows.find((r) => r.postId === p.id)).toMatchObject({ told: 1, seen: 1 });
  });
});
