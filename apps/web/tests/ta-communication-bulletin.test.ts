/**
 * The school feed and its circulars (testing analysis of 13 November 2026, communication).
 *
 * TA-093 (Medium): a guardian's report of a post, a comment or a person was written with no school (a parent's
 * session carries none), so no Safety Centre listed it and no admin was told. TA-547 (Medium): "Pin to top" sorted a
 * pinned post below every unpinned one (PostgreSQL puts NULL first on DESC). TA-318 (Low): two reviewers deciding one
 * pending post both succeeded and the author was told both outcomes. TA-316 (Low): the phone's "still waiting" card
 * of a class circular listed every class the reader could see. TA-317 (Low): the head could not open a class's
 * circular from the circulars list. TA-554 (Low): a Devanagari school name lost its vowel signs in the global
 * feed's hashtag.
 *
 * A scratch ZZ school of this suite's own (tests/ta-communication-fixture.ts), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeSchool, type CommSchool } from "./ta-communication-fixture";
import { ackReport, getPost, listFeed, moderatePost, reportContent, schoolHashtag, setPinned } from "@/lib/bulletin";
import { listGlobalFeed } from "@/lib/global-feed";

let s: CommSchool;

beforeAll(async () => {
  s = await makeSchool("bulletin");
}, 60_000);

afterAll(async () => {
  await s.cleanup();
}, 60_000);

const post = (data: { title: string; scope?: string; classId?: string; audience?: string; status?: string; requiresAck?: boolean; author?: { userId: string; membershipId: string }; createdAt?: Date }) =>
  s.db.post.create({
    data: {
      schoolId: s.schoolId,
      authorUserId: (data.author ?? s.admin).userId,
      authorMembershipId: (data.author ?? s.admin).membershipId,
      scope: data.scope ?? "SCHOOL",
      classId: data.classId ?? null,
      title: `${data.title} ${s.stamp}`,
      body: "ZZ body.",
      audience: data.audience ?? "ALL",
      status: data.status ?? "APPROVED",
      requiresAck: data.requiresAck ?? false,
      ...(data.createdAt ? { createdAt: data.createdAt } : {}),
    },
    select: { id: true },
  });

describe("TA-093: a guardian's report", () => {
  it("TA-093: is filed under the post's school and its admins are told", async () => {
    const p = await post({ title: "ZZ TA-093 Notice" });
    await reportContent(s.ctx(s.guardian, "PARENT"), { targetType: "POST", targetId: p.id, reason: "BULLYING" });
    const filed = await s.db.report.findMany({ where: { reporterUserId: s.guardian.userId, targetId: p.id }, select: { schoolId: true } });
    expect(filed).toEqual([{ schoolId: s.schoolId }]);
    expect(await s.db.notification.count({ where: { userId: s.admin.userId, titleKey: "bulletin.notifReported" } })).toBe(1);
  });

  it("TA-093: a report of a comment and of a person reaches the family's school too", async () => {
    const p = await post({ title: "ZZ TA-093 Comment host" });
    const comment = await s.db.comment.create({ data: { postId: p.id, schoolId: s.schoolId, authorUserId: s.pupilA.userId, body: "ZZ a comment", status: "APPROVED" }, select: { id: true } });
    await reportContent(s.ctx(s.guardian, "PARENT"), { targetType: "COMMENT", targetId: comment.id, reason: "SPAM" });
    await reportContent(s.ctx(s.guardian, "PARENT"), { targetType: "USER", targetId: s.pupilB.userId, reason: "BULLYING" });
    const filed = await s.db.report.findMany({ where: { reporterUserId: s.guardian.userId, targetId: { in: [comment.id, s.pupilB.userId] } }, select: { schoolId: true } });
    expect(filed.map((r) => r.schoolId)).toEqual([s.schoolId, s.schoolId]);
  });
});

describe("TA-547: a pinned post", () => {
  it("TA-547: comes first in the school's feed and on the global feed", async () => {
    const older = await post({ title: "ZZ TA-547 Older", scope: "GLOBAL", createdAt: new Date(Date.now() - 86_400_000) });
    const newer = await post({ title: "ZZ TA-547 Newer", scope: "GLOBAL" });
    await setPinned(s.ctx(s.admin, "ADMIN"), older.id, true);
    const feed = (await listFeed(s.ctx(s.guardian, "PARENT"))).map((p) => p.id);
    expect(feed[0]).toBe(older.id);
    expect(feed.indexOf(newer.id)).toBeGreaterThan(0);
    const global = (await listGlobalFeed(s.ctx(s.admin, "ADMIN"))).map((p) => p.id);
    expect(global).toContain(older.id);
    expect(global.indexOf(older.id)).toBeLessThan(global.indexOf(newer.id));
  });
});

describe("TA-318: two reviewers deciding one pending post", () => {
  it("TA-318: one decides, the other is told it was already reviewed, and the author hears once", async () => {
    const p = await post({ title: "ZZ TA-318 Pupil post", scope: "CLASS", classId: s.classA, status: "PENDING", author: s.pupilA });
    // The two decisions read the post while another writer holds its row, so both read PENDING and both reach the
    // write, as two reviewers a moment apart do; the row is let go once both are waiting on it.
    const held: { decisions?: Promise<PromiseSettledResult<void>[]> } = {};
    await s.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Post" WHERE "id" = ${p.id} FOR UPDATE`;
      held.decisions = Promise.allSettled([
        moderatePost(s.ctx(s.teacher, "TEACHER"), p.id, "APPROVE"),
        moderatePost(s.ctx(s.admin, "ADMIN"), p.id, "REJECT", "ZZ please change the photo"),
      ]);
      await new Promise((r) => setTimeout(r, 1_500));
    });
    const results = await held.decisions!;
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const refused = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    expect(String(refused?.reason)).toContain("access.thatPostHasAlreadyBeenReviewed");
    expect(await s.db.notification.count({ where: { userId: s.pupilA.userId, titleKey: { in: ["bulletin.notifPostLive", "bulletin.notifPostChange"] } } })).toBe(1);
    expect(await s.db.auditLog.count({ where: { schoolId: s.schoolId, targetId: p.id, action: { in: ["post.approve", "post.reject"] } } })).toBe(1);
  });
});

describe("TA-316: the waiting card of a class circular", () => {
  it("TA-316: lists the circular's own class alone, for the office and for a teacher of two classes", async () => {
    // The class teacher of 5A also takes 5B here, as the finding's teacher of two classes does.
    await s.db.classTeacher.create({ data: { schoolId: s.schoolId, classId: s.classB, teacherMembershipId: s.teacher.membershipId } });
    const p = await post({ title: "ZZ TA-316 Class trip slip", scope: "CLASS", classId: s.classA, audience: "PARENTS", requiresAck: true, author: s.teacher });
    for (const reader of [s.ctx(s.admin, "ADMIN"), s.ctx(s.teacher, "TEACHER")]) {
      const groups = await ackReport(reader, p.id);
      expect(groups.map((g) => g.classId)).toEqual([s.classA]);
      expect(groups[0]!.total).toBe(1);
    }
    await s.db.classTeacher.deleteMany({ where: { schoolId: s.schoolId, classId: s.classB, teacherMembershipId: s.teacher.membershipId } });
  });
});

describe("TA-317: the head opens a class's circular", () => {
  it("TA-317: getPost answers the principal for a teacher's class circular", async () => {
    const p = await post({ title: "ZZ TA-317 Class circular", scope: "CLASS", classId: s.classA, audience: "PARENTS", requiresAck: true, author: s.teacher });
    const opened = await getPost(s.ctx(s.principal, "PRINCIPAL"), p.id);
    expect(opened.id).toBe(p.id);
  });
});

describe("TA-554: the school's hashtag", () => {
  it("TA-554: keeps a Devanagari name's vowel signs and virama", () => {
    expect(schoolHashtag("सरस्वती विद्यालय")).toBe("#सरस्वतीविद्यालय");
    expect(schoolHashtag("ZZ Northgate School")).toBe("#ZZNorthgateSchool");
    expect(schoolHashtag("ज्ञानदीप शाळा, पुणे")).toBe("#ज्ञानदीपशाळापुणे");
  });
});
