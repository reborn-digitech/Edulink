/**
 * TA-096 (testing analysis of 13 November 2026, Medium, Concurrency): a circular being told in the request was told
 * again by the minute job, which saw it queued and not yet delivered, and a delivery that stopped half-way began again
 * from the first family. Two tellers reaching one circular together are played here by two calls at once; the
 * half-way stop by a circular queued, not delivered, whose first family already holds its notice.
 *
 * A scratch ZZ school of this suite's own (tests/ta-communication-fixture.ts), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeSchool, type CommSchool } from "./ta-communication-fixture";
import { queueCircularDelivery } from "@/lib/circulars";

let s: CommSchool;
let second = "";

beforeAll(async () => {
  s = await makeSchool("circulars");
  // A second guardian of the 5A pupil, so the circular has two families' worth of readers to tell.
  second = (await s.person("guardian2", null)).userId;
  await s.db.guardianship.create({ data: { parentUserId: second, studentMembershipId: s.pupilA.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
}, 60_000);

afterAll(async () => {
  await s.cleanup();
}, 60_000);

const circular = (title: string, queued: boolean) =>
  s.db.post.create({
    data: { schoolId: s.schoolId, authorUserId: s.teacher.userId, authorMembershipId: s.teacher.membershipId, scope: "CLASS", classId: s.classA, title: `${title} ${s.stamp}`, body: "ZZ body.", audience: "PARENTS", requiresAck: true, status: "APPROVED", ...(queued ? { deliveryQueuedAt: new Date() } : {}) },
    select: { id: true },
  });
const told = (userId: string, postId: string) => s.db.notification.count({ where: { userId, url: `/bulletin/${postId}` } });

describe("TA-096: a circular is told once", () => {
  it("TA-096: two tellers reaching it together tell each guardian once", async () => {
    const post = await circular("ZZ TA-096 Trip slip", true);
    await Promise.all([queueCircularDelivery(post.id), queueCircularDelivery(post.id)]);
    expect(await told(s.guardian.userId, post.id)).toBe(1);
    expect(await told(second, post.id)).toBe(1);
    expect((await s.db.post.findUniqueOrThrow({ where: { id: post.id }, select: { deliveredAt: true } })).deliveredAt).not.toBeNull();
  });

  it("TA-096: a delivery taken over after a half-way stop goes on from where it stopped", async () => {
    const post = await circular("ZZ TA-096 Uniform notice", true);
    // The first family was told by a delivery that then stopped.
    await s.db.notification.create({ data: { userId: s.guardian.userId, schoolId: s.schoolId, kind: "POST", title: "ZZ told", url: `/bulletin/${post.id}`, titleKey: "bulletin.notifCircular" } });
    await queueCircularDelivery(post.id);
    expect(await told(s.guardian.userId, post.id)).toBe(1);
    expect(await told(second, post.id)).toBe(1);
  });
});
