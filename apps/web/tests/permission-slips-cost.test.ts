/**
 * A PERMISSION SLIP ASKS ABOUT THE READER'S OWN CHILDREN, NOT THE WHOLE
 * AUDIENCE, AND ITS ANSWER DOOR IS COUNTED (the rest of A3-S-9, audit of 5
 * October 2026).
 *
 * Answering a slip aimed at a college notice's target loaded every student of
 * the school (up to 5,000) and asked each one's audience tokens, twice per
 * answer (once to check the child, once to draw the reply), and the consent
 * POST had no budget. Now one student's own tokens are asked, for the
 * reader's own children only, and the POST takes the notice-write budget.
 * studentTokensOf is wrapped here to count whose tokens are asked.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const asked = vi.hoisted(() => ({ ids: [] as string[], target: "" }));
vi.mock("@/lib/college-audience", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/college-audience")>();
  return {
    ...real,
    studentTokensOf: async (id: string) => {
      asked.ids.push(id);
      return id === asked.target ? ["PROG:zz-slip-target"] : real.studentTokensOf(id);
    },
  };
});

import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { NOTICE_WRITE_BUDGET } from "@/lib/api-v1";
import { answerSlip, slipReport } from "@/lib/permission-slips";
import { POST as consentPost } from "@/app/api/v1/shared/bulletin/[postId]/consent/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", users: [] as string[], admin: "", parent: "", mine: "", others: [] as string[], slip: "" };

async function as(userId: string, role: string, schoolId: string | null = ids.school) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ SlipCost ${STAMP}`, slug: `zz-slipcost-${STAMP}`, code: `ZSC${SUFFIX}`, contactEmail: `zz-slipcost-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const user = async (who: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ SlipCost ${who}`, email: `zz-slipcost-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  const member = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } }).then((m) => m.id);
  ids.admin = await user("Admin");
  const adminM = await member(ids.admin, "ADMIN");
  ids.mine = await member(await user("Mine", { isMinor: true }), "STUDENT");
  for (let n = 1; n <= 4; n += 1) ids.others.push(await member(await user(`Other${n}`, { isMinor: true }), "STUDENT"));
  asked.target = ids.mine;
  ids.parent = await user("Parent");
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: ids.mine, studentSchoolId: ids.school, status: "ACTIVE" } });
  // A school-wide slip aimed at a target only the parent's child carries (as a college notice to one programme).
  ids.slip = (await db.post.create({ data: { schoolId: ids.school, authorUserId: ids.admin, authorMembershipId: adminM, scope: "SCHOOL", title: "ZZ SlipCost trip", audience: "ALL", audienceTarget: "PROG:zz-slip-target", requiresAck: true, consentQuestion: "May they go?", consentBy: "2099-12-31", status: "APPROVED" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: `slip-answer:${ids.parent}` } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("answering a targeted slip", () => {
  it("asks the tokens of the guardian's own child only, never the rest of the school", async () => {
    asked.ids.length = 0;
    const view = await answerSlip(await as(ids.parent, "PARENT", null), ids.slip, { studentMembershipId: ids.mine, answer: "YES" });
    expect(view.children.map((c) => [c.studentMembershipId, c.answer])).toEqual([[ids.mine, "YES"]]);
    expect(asked.ids.filter((id) => id !== ids.mine)).toEqual([]);
    // Another child of the school, outside the target, is still not answerable.
    await expect(answerSlip(await as(ids.parent, "PARENT", null), ids.slip, { studentMembershipId: ids.others[0]!, answer: "YES" })).rejects.toBeTruthy();
    // The staff's report still reads the whole audience: one child in the target.
    const report = await slipReport(await as(ids.admin, "ADMIN"), ids.slip);
    expect(report.rows.map((r) => r.studentMembershipId)).toEqual([ids.mine]);
  });

  it("is refused 429 at the end of the notice-write budget", async () => {
    await db.rateLimit.upsert({
      where: { bucket: `slip-answer:${ids.parent}` },
      create: { bucket: `slip-answer:${ids.parent}`, hits: NOTICE_WRITE_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
      update: { hits: NOTICE_WRITE_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
    });
    await as(ids.parent, "PARENT", null);
    const res = await consentPost(new Request(`http://localhost/api/v1/shared/bulletin/${ids.slip}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentMembershipId: ids.mine, answer: "NO" }) }), { params: Promise.resolve({ postId: ids.slip }) });
    expect(res.status).toBe(429);
  });
});
