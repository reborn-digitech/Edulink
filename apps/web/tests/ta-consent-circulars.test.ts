/**
 * TA-094 (testing analysis of 13 November 2026, Medium, Functional): a college circular for one
 * programme, department, division or batch was told to every student and guardian of the college, and
 * its reach report counted them all. The post keeps its target (Post.audienceTarget) and the feed filters
 * on it, but circulars.ts never read it, so a student of another programme was told of a notice they
 * could not open, and the guardians of an adult who had not granted MESSAGES were texted it too.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with two programmes: the adult
 * reads programme A, the minor programme B, both seated in one division class. The office publishes a
 * circular asking for an acknowledgement, for programme A.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { circularReach, queueCircularDelivery } from "@/lib/circulars";

let c: College;
const programme = { a: "", b: "" };

beforeAll(async () => {
  c = await makeCollege("circular");
  const dept = await c.db.department.create({ data: { schoolId: c.schoolId, code: "ZZSCI", name: "ZZ Science" }, select: { id: true } });
  for (const key of ["a", "b"] as const) {
    programme[key] = (await c.db.programme.create({ data: { schoolId: c.schoolId, departmentId: dept.id, code: `ZZB${key.toUpperCase()}`, name: `ZZ B.Sc. ${key.toUpperCase()}`, level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  }
  await c.db.programmeEnrolment.createMany({
    data: [
      { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, programmeId: programme.a, yearOfEntry: 2025, category: "GENERAL", quota: "GENERAL" },
      { schoolId: c.schoolId, studentMembershipId: c.minor.membershipId, programmeId: programme.b, yearOfEntry: 2025, category: "GENERAL", quota: "GENERAL" },
    ],
  });
  const klass = await c.db.class.create({ data: { schoolId: c.schoolId, name: "ZZ TA Consent FY-Div1", gradeLevel: "FY", joinCode: `ZTCC${c.stamp}` }, select: { id: true } });
  await c.db.enrollment.createMany({ data: [c.adult.membershipId, c.minor.membershipId].map((studentMembershipId) => ({ classId: klass.id, schoolId: c.schoolId, studentMembershipId, status: "ACTIVE" })) });
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-094: a college circular for one programme", () => {
  it("TA-094: is told to that programme's students alone (and an adult's guardians only under MESSAGES), and its reach counts them alone", async () => {
    const post = await c.db.post.create({
      data: { schoolId: c.schoolId, authorUserId: c.admin.userId, authorMembershipId: c.admin.membershipId, scope: "SCHOOL", title: `ZZ TA-094 Lab safety for A ${c.stamp}`, audience: "ALL", requiresAck: true, status: "APPROVED", audienceTarget: `PROGRAMME:${programme.a}` },
      select: { id: true },
    });
    await queueCircularDelivery(post.id);
    const told = (userId: string) => c.db.notification.count({ where: { userId, url: `/bulletin/${post.id}` } });
    expect(await told(c.adult.userId)).toBe(1);
    expect(await told(c.minor.userId)).toBe(0);
    expect(await told(c.guardian.userId)).toBe(0);
    expect(await told(c.guardianOfAdult.userId)).toBe(0);
    const reach = await circularReach(c.ctx(c.admin, "ADMIN"), post.id);
    expect(reach.totals.total).toBe(1);
    expect(reach.groups.flatMap((g) => g.outstanding.map((f) => f.studentMembershipId))).toEqual([c.adult.membershipId]);
  });

  it("TA-094: the reach report does not call an adult whose guardians are withheld 'no guardian linked'; one with none linked still is", async () => {
    // A second adult of programme A, in the same division, with no guardian at all.
    const alone = await c.addStudent("alone", true);
    await c.db.guardianship.deleteMany({ where: { studentMembershipId: alone.membershipId } });
    await c.db.programmeEnrolment.create({ data: { schoolId: c.schoolId, studentMembershipId: alone.membershipId, programmeId: programme.a, yearOfEntry: 2025, category: "GENERAL", quota: "GENERAL" } });
    const klass = await c.db.enrollment.findFirstOrThrow({ where: { studentMembershipId: c.adult.membershipId }, select: { classId: true } });
    await c.db.enrollment.create({ data: { classId: klass.classId, schoolId: c.schoolId, studentMembershipId: alone.membershipId, status: "ACTIVE" } });
    const publish = async (audience: string, title: string) => {
      const post = await c.db.post.create({
        data: { schoolId: c.schoolId, authorUserId: c.admin.userId, authorMembershipId: c.admin.membershipId, scope: "SCHOOL", title: `ZZ TA-094 ${title} ${c.stamp}`, audience, requiresAck: true, status: "APPROVED", audienceTarget: `PROGRAMME:${programme.a}` },
        select: { id: true },
      });
      await queueCircularDelivery(post.id);
      return circularReach(c.ctx(c.admin, "ADMIN"), post.id);
    };
    const flagged = (reach: Awaited<ReturnType<typeof circularReach>>) => Object.fromEntries(reach.groups.flatMap((g) => g.outstanding.map((f) => [f.studentMembershipId, f.noGuardian])));
    const all = await publish("ALL", "Exam rules");
    expect(flagged(all)).toEqual({ [c.adult.membershipId]: false, [alone.membershipId]: true });
    expect([all.totals.total, all.totals.noGuardian]).toEqual([2, 1]);
    // To parents: the withheld family is no gap a reminder or an invitation can close, so it is neither counted nor listed.
    const parents = await publish("PARENTS", "Parents' meeting");
    expect(flagged(parents)).toEqual({ [alone.membershipId]: true });
    expect([parents.totals.total, parents.totals.noGuardian]).toEqual([0, 1]);
    await c.db.enrollment.deleteMany({ where: { studentMembershipId: alone.membershipId } });
  });

  it("TA-094: with MESSAGES granted the adult's guardians are told too", async () => {
    await c.grant(c.adult.membershipId, "MESSAGES");
    const post = await c.db.post.create({
      data: { schoolId: c.schoolId, authorUserId: c.admin.userId, authorMembershipId: c.admin.membershipId, scope: "SCHOOL", title: `ZZ TA-094 Fees for A ${c.stamp}`, audience: "ALL", requiresAck: true, status: "APPROVED", audienceTarget: `PROGRAMME:${programme.a}` },
      select: { id: true },
    });
    await queueCircularDelivery(post.id);
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, url: `/bulletin/${post.id}` } })).toBe(1);
    expect(await c.db.notification.count({ where: { userId: c.minor.userId, url: `/bulletin/${post.id}` } })).toBe(0);
  });
});
