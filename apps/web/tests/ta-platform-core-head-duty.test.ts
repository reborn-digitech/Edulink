/**
 * The head's pages (owner-batch-item9) against two ways round them, from the testing analysis of 13 November 2026.
 *
 *   TA-192: an admin the head had not given the head's pages paused the school's only head; with no active head every
 *           admin holds the pages, so the pause handed them over. The last active head is now refused, as the last
 *           admin is; a head is paused while another stays active.
 *   TA-210: the teacher-review table (a head's page, /admin/reviews) was still built for such an admin by the head's
 *           dashboard and its door GET /api/v1/staff/principal/overview. schoolReviewDashboard now builds it only for
 *           a session holding the head's pages.
 *
 * A ZZ school of this file's own, removed after by id with everything under it.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { suspendMembership } from "@/lib/membership";
import { myAdminDuties } from "@/lib/duties";
import { schoolReviewDashboard } from "@/lib/reviews";
import { createSession } from "@/lib/session";
import type { ActiveContext } from "@/lib/session";
import { GET as overviewGet } from "@/app/api/v1/staff/principal/overview/route";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const user: Record<string, string> = {};
const member: Record<string, string> = {};
let schoolId = "";

const ctx = (key: string, role: ActiveContext["role"]): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key]!, schoolId, role, user: { id: user[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-pchd-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ PCHD ${STAMP}`, slug: `zz-pchd-${STAMP}`, code: `ZPH${SUFFIX}`, contactEmail: `zz-pchd-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "SCHOOL", isTestFixture: true }, select: { id: true } })).id;
  for (const [key, role] of [["head", "PRINCIPAL"], ["head2", "PRINCIPAL"], ["admin", "ADMIN"], ["admin2", "ADMIN"], ["teacher", "TEACHER"], ["pupil", "STUDENT"]] as const) {
    user[key] = (await db.user.create({ data: { name: `ZZ PCHD ${key} ${STAMP}`, email: `zz-pchd-${key.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, isMinor: role === "STUDENT" }, select: { id: true } })).id;
    // The second head joins later, in the case that needs two.
    member[key] = (await db.membership.create({ data: { userId: user[key]!, schoolId, role, status: key === "head2" ? "INVITED" : "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZPH${key}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  // One answered round about the teacher, so the table has a row with numbers in it.
  const round = await db.reviewRound.create({ data: { schoolId, audience: "STUDENTS", closesDateKey: "2099-12-31" }, select: { id: true } });
  await db.reviewResponse.create({ data: { schoolId, roundId: round.id, teacherMembershipId: member.teacher!, respondentUserId: user.pupil!, scores: JSON.stringify({ CLARITY: 4, SUPPORT: 4, FAIRNESS: 5, ENGAGEMENT: 3, RESPECT: 5 }) } });
});

afterEach(() => {
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  await db.session.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.auditLog.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.notification.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.user.deleteMany({ where: { id: { in: Object.values(user) } } });
  await db.$disconnect();
});

describe("TA-192: an admin pausing the head", () => {
  it("TA-192: the school's only active head is refused, the head stays active and the admin holds no head's pages", async () => {
    expect(await myAdminDuties(ctx("admin", "ADMIN"))).toEqual([]);
    const answer = await suspendMembership(ctx("admin", "ADMIN"), member.head!, "ZZ a pause");
    expect(answer).toEqual({ ok: false, errorKey: "refusal.onlyHeadLeft" });
    expect((await db.membership.findUniqueOrThrow({ where: { id: member.head! }, select: { status: true } })).status).toBe("ACTIVE");
    expect(await myAdminDuties(ctx("admin", "ADMIN"))).toEqual([]);
    expect(await db.auditLog.count({ where: { schoolId, action: "membership.suspend", targetId: member.head! } })).toBe(0);
  });

  it("TA-192: with a second head active, one head is paused, and the admin still holds no head's pages", async () => {
    await db.membership.update({ where: { id: member.head2! }, data: { status: "ACTIVE" } });
    try {
      expect(await suspendMembership(ctx("admin", "ADMIN"), member.head!, "ZZ a pause")).toEqual({ ok: true });
      expect((await db.membership.findUniqueOrThrow({ where: { id: member.head! }, select: { status: true } })).status).toBe("SUSPENDED");
      expect(await myAdminDuties(ctx("admin", "ADMIN"))).toEqual([]);
      // …and the other head is now the last one.
      expect(await suspendMembership(ctx("admin2", "ADMIN"), member.head2!, "ZZ a pause")).toEqual({ ok: false, errorKey: "refusal.onlyHeadLeft" });
    } finally {
      await db.membership.updateMany({ where: { id: { in: [member.head!, member.head2!] } }, data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null } });
      await db.membership.update({ where: { id: member.head2! }, data: { status: "INVITED" } });
    }
  });
});

describe("TA-210: the teacher-review table on the head's dashboard", () => {
  it("TA-210: an admin without the head's pages gets no rows from the library; the head gets the rated teacher", async () => {
    expect(await schoolReviewDashboard(ctx("admin", "ADMIN"))).toEqual([]);
    const rows = await schoolReviewDashboard(ctx("head", "PRINCIPAL"));
    expect(rows.find((r) => r.membershipId === member.teacher)?.allTime.responseCount).toBe(1);
  });

  it("TA-210: the overview door answers such an admin 200 with no reviews, and the head with the row", async () => {
    __setHeaders({ "x-edulink-route": "GET /api/v1/staff/principal/overview" });
    await createSession(user.admin!, { schoolId, role: "ADMIN" });
    const asAdmin = await overviewGet(new Request("http://localhost/api/v1/staff/principal/overview?days=30"));
    expect(asAdmin.status).toBe(200);
    expect(((await asAdmin.json()) as { reviews: unknown[] }).reviews).toEqual([]);

    __resetCookies();
    __setHeaders({ "x-edulink-route": "GET /api/v1/staff/principal/overview" });
    await createSession(user.head!, { schoolId, role: "PRINCIPAL" });
    const asHead = await overviewGet(new Request("http://localhost/api/v1/staff/principal/overview?days=30"));
    expect(asHead.status).toBe(200);
    const reviews = ((await asHead.json()) as { reviews: { membershipId: string }[] }).reviews;
    expect(reviews.map((r) => r.membershipId)).toContain(member.teacher);
  });

  it("TA-210: an admin the head gave the duty reads the rows", async () => {
    await db.membership.update({ where: { id: member.admin2! }, data: { dutiesJson: JSON.stringify(["HEAD_PAGES"]) } });
    const rows = await schoolReviewDashboard(ctx("admin2", "ADMIN"));
    expect(rows.find((r) => r.membershipId === member.teacher)?.allTime.responseCount).toBe(1);
  });
});
