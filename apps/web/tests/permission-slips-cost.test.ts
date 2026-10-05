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
 *
 * R-54 (the risks batch, 5 October 2026): the staff's report asked each of
 * up to 5,000 students' tokens one by one, three reads each, with no budget.
 * It now asks them all at once (studentTokensMany: three reads a thousand,
 * wrapped here to count) and the report door takes the heavy-read budget.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const asked = vi.hoisted(() => ({ ids: [] as string[], target: "", many: [] as number[] }));
vi.mock("@/lib/college-audience", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/college-audience")>();
  return {
    ...real,
    studentTokensOf: async (id: string) => {
      asked.ids.push(id);
      return id === asked.target ? ["PROG:zz-slip-target"] : real.studentTokensOf(id);
    },
    studentTokensMany: async (ids: readonly string[]) => {
      asked.many.push(ids.length);
      const tokens = await real.studentTokensMany(ids);
      if (tokens.has(asked.target)) tokens.set(asked.target, ["PROG:zz-slip-target"]);
      return tokens;
    },
  };
});

import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { HEAVY_READ_BUDGET, NOTICE_WRITE_BUDGET } from "@/lib/api-v1";
import { answerSlip, slipReport } from "@/lib/permission-slips";
import { studentTokensMany, studentTokensOf } from "@/lib/college-audience";
import { POST as consentPost } from "@/app/api/v1/shared/bulletin/[postId]/consent/route";
import { GET as reportGet } from "@/app/api/v1/shared/bulletin/[postId]/consent/report/route";

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
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`slip-answer:${ids.parent}`, `heavy:${ids.admin}`] } } });
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

describe("the staff's report on a targeted slip (R-54)", () => {
  it("asks every student's tokens in one batch, not one student at a time", async () => {
    asked.ids.length = 0;
    asked.many.length = 0;
    const report = await slipReport(await as(ids.admin, "ADMIN"), ids.slip);
    expect(report.rows.map((r) => r.studentMembershipId)).toEqual([ids.mine]);
    // The five students of the school, asked together once; none asked alone.
    expect(asked.many).toEqual([5]);
    expect(asked.ids).toEqual([]);
  });

  it("the batch gives each student the tokens they have alone: a seat, a live enrolment, nothing", async () => {
    const dept = await db.department.create({ data: { schoolId: ids.school, code: `ZSCD${SUFFIX}`, name: "ZZ SlipCost Dept" }, select: { id: true } });
    const prog = await db.programme.create({ data: { schoolId: ids.school, departmentId: dept.id, code: `ZSCP${SUFFIX}`, name: "ZZ SlipCost BA", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: ids.school, programmeId: prog.id, name: "ZZ SlipCost scheme", effectiveYear: 2026, passingRules: "{}" }, select: { id: true } });
    await db.studentProgramme.create({ data: { schoolId: ids.school, studentMembershipId: ids.others[1]!, programmeId: prog.id, schemeId: scheme.id, entryYear: 2026 } });
    await db.programmeEnrolment.create({ data: { schoolId: ids.school, studentMembershipId: ids.others[2]!, programmeId: prog.id, yearOfEntry: 2025, category: "OPEN", quota: "CAP" } });
    const people = [ids.others[1]!, ids.others[2]!, ids.others[3]!];
    const batch = await studentTokensMany(people);
    for (const id of people) expect(batch.get(id), id).toEqual(await studentTokensOf(id));
    expect(batch.get(ids.others[1]!)).toEqual([`PROGRAMME:${prog.id}`, `DEPARTMENT:${dept.id}`, "BATCH:2026"]);
    expect(batch.get(ids.others[2]!)).toEqual([`PROGRAMME:${prog.id}`, `DEPARTMENT:${dept.id}`, "BATCH:2025"]);
    expect(batch.get(ids.others[3]!)).toEqual([]);
  });

  it("the report door is refused 429 at the end of the heavy-read budget", async () => {
    await as(ids.admin, "ADMIN");
    const call = () => reportGet(new Request(`http://localhost/api/v1/shared/bulletin/${ids.slip}/consent/report`), { params: Promise.resolve({ postId: ids.slip }) });
    expect((await call()).status).toBe(200);
    await db.rateLimit.upsert({
      where: { bucket: `heavy:${ids.admin}` },
      create: { bucket: `heavy:${ids.admin}`, hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
      update: { hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 600_000) },
    });
    expect((await call()).status).toBe(429);
  });
});
