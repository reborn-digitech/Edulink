/**
 * Who still stands at a school, for the feed and for messages (testing analysis of 13 November 2026, communication).
 *
 * TA-092 (Medium, Security): a departure leaves the family's guardianship standing on purpose (it keeps the child's
 * record reachable), but the feed, comments and messaging read that link alone, so the family of a pupil who had left
 * kept the school's feed, commented on it unreviewed and could write to any member of staff.
 *
 * TA-098 (Medium, Security): a room was checked against the rule only when it was opened, so a teacher who left but
 * is a parent at the school wrote on to a pupil from the PARENT context, and a message to somebody who had left was
 * accepted and its first words put in their notifications.
 *
 * A scratch ZZ school of this suite's own (tests/ta-communication-fixture.ts); every person and row is stamped and
 * removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeSchool, type CommSchool } from "./ta-communication-fixture";
import { addComment, getPost, listFeed, parentBulletinSchools } from "@/lib/bulletin";
import { conversationSchools, openConversation, peopleToMessage, sendConversationMessage, standingAt } from "@/lib/conversations";

let s: CommSchool;

beforeAll(async () => {
  s = await makeSchool("standing");
}, 60_000);

afterAll(async () => {
  await s.cleanup();
}, 60_000);

describe("TA-092: the family of a pupil who has left", () => {
  it("TA-092: loses the school's feed, comments and staff messages, while a family with a child on the roll keeps them", async () => {
    // A pupil of the school with a guardian of their own, who then leaves (the membership's leftAt, as recordDeparture writes it).
    const leaver = await s.person("leaver", "STUDENT", { isMinor: true });
    const family = await s.person("family", null);
    await s.db.guardianship.create({ data: { parentUserId: family.userId, studentMembershipId: leaver.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
    const post = await s.db.post.create({
      data: { schoolId: s.schoolId, authorUserId: s.admin.userId, authorMembershipId: s.admin.membershipId, scope: "SCHOOL", title: `ZZ TA-092 Sports day ${s.stamp}`, body: "For everyone.", audience: "ALL", status: "APPROVED" },
      select: { id: true },
    });
    const parent = s.ctx(family, "PARENT");

    // While the child is on the roll, the family reads, comments and may write to staff.
    expect((await listFeed(parent)).map((p) => p.id)).toContain(post.id);
    expect(await standingAt(parent, s.schoolId)).toBe("PARENT");

    await s.db.membership.update({ where: { id: leaver.membershipId }, data: { leftAt: new Date() } });

    expect(await listFeed(parent)).toEqual([]);
    expect(await parentBulletinSchools(parent)).toEqual([]);
    await expect(getPost(parent, post.id)).rejects.toThrow();
    await expect(addComment(parent, post.id, "ZZ still here")).rejects.toThrow();
    expect(await s.db.comment.count({ where: { postId: post.id } })).toBe(0);
    expect(await standingAt(parent, s.schoolId)).toBeNull();
    expect(await conversationSchools(parent)).toEqual([]);
    await expect(peopleToMessage(parent, s.schoolId)).rejects.toThrow("access.notAtThisSchool");
    await expect(openConversation(parent, s.schoolId, s.teacher.userId)).rejects.toThrow("access.notAtThisSchool");

    // The guardian of a pupil still on the roll is untouched.
    const onRoll = s.ctx(s.guardian, "PARENT");
    expect((await listFeed(onRoll)).map((p) => p.id)).toContain(post.id);
    expect(await standingAt(onRoll, s.schoolId)).toBe("PARENT");
    // The link itself stays, as the record needs it.
    expect(await s.db.guardianship.count({ where: { parentUserId: family.userId, status: "ACTIVE" } })).toBe(1);
  });
});

describe("TA-098: a room is asked again on every message", () => {
  it("TA-098: a teacher who left but is a parent at the school cannot write on to a pupil from the PARENT context", async () => {
    const former = await s.person("former", "TEACHER");
    const room = await openConversation(s.ctx(former, "TEACHER"), s.schoolId, s.pupilA.userId);
    await sendConversationMessage(s.ctx(former, "TEACHER"), room.conversationId, "ZZ homework reminder");
    // The office ends the teaching; the same account is a guardian of a pupil at the school.
    await s.db.membership.update({ where: { id: former.membershipId }, data: { leftAt: new Date() } });
    await s.db.guardianship.create({ data: { parentUserId: former.userId, studentMembershipId: s.pupilB.membershipId, studentSchoolId: s.schoolId, relation: "PARENT", status: "ACTIVE" } });
    const asParent = s.ctx(former, "PARENT");
    expect(await standingAt(asParent, s.schoolId)).toBe("PARENT");
    await expect(sendConversationMessage(asParent, room.conversationId, "ZZ a parent writing to a pupil")).rejects.toThrow("access.cannotMessageThisPerson");
    expect(await s.db.conversationMessage.count({ where: { conversationId: room.conversationId } })).toBe(1);
  });

  it("TA-098: a message to somebody who has left is refused in words, and they are told nothing", async () => {
    const leaving = await s.person("leaving", "TEACHER");
    const room = await openConversation(s.ctx(s.pupilB, "STUDENT"), s.schoolId, leaving.userId);
    await s.db.membership.update({ where: { id: leaving.membershipId }, data: { leftAt: new Date() } });
    await expect(sendConversationMessage(s.ctx(s.pupilB, "STUDENT"), room.conversationId, "ZZ are you there sir")).rejects.toThrow("access.personNotAtSchool");
    expect(await s.db.conversationMessage.count({ where: { conversationId: room.conversationId } })).toBe(0);
    expect(await s.db.notification.count({ where: { userId: leaving.userId } })).toBe(0);
  });

  it("TA-098: a room whose people all still stand goes on as before", async () => {
    const room = await openConversation(s.ctx(s.teacher, "TEACHER"), s.schoolId, s.guardian.userId);
    await sendConversationMessage(s.ctx(s.teacher, "TEACHER"), room.conversationId, "ZZ a word about 5A");
    await sendConversationMessage(s.ctx(s.guardian, "PARENT"), room.conversationId, "ZZ thank you");
    expect(await s.db.conversationMessage.count({ where: { conversationId: room.conversationId } })).toBe(2);
    expect(await s.db.notification.count({ where: { userId: s.guardian.userId, url: `/remarks/c/${room.conversationId}` } })).toBe(1);
  });
});
