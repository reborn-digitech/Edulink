/**
 * Campaign S-18, the web half (5 Oct 2026): the recruiter's web forms spend the
 * same hourly budgets as the API doors that do the same work — a requirement to
 * many colleges and a colleague's invitation the `fanout` bucket, round results
 * and offers the `notice-write` one. Before, POST /api/v1/recruiter/requirements
 * was budgeted and the form posting the same requirement was not.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { FANOUT_BUDGET } from "@/lib/api-v1";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
import { __resetCookies } from "../tests/stubs/next-headers";
import { addColleagueAction, postRequirementAction } from "@/app/(app)/placement/actions";
import { FORM_IDLE } from "@/lib/form-state";

const db = new PrismaClient();
const STAMP = Date.now();
let userId = "";
let colleagueId = "";

/** A form's answer in place (A3-journeys-27, risks batch): what the person is told, done or refused. */
async function said(work: () => Promise<{ ok: boolean; message?: string }>): Promise<{ ok: boolean; message: string }> {
  const answer = await work();
  return { ok: answer.ok, message: answer.message ?? "" };
}

beforeAll(async () => {
  userId = (await db.user.create({ data: { name: "ZZ Budget Recruiter", email: `zz-rbudget-${STAMP}@test.invalid` }, select: { id: true } })).id;
  colleagueId = (await db.user.create({ data: { name: "ZZ Budget Colleague", email: `zz-rbudget-c-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.recruiterProfile.create({ data: { userId, companyName: "ZZ Budget Co" } });
  await createSession(userId, { schoolId: null, role: "RECRUITER" });
});

afterAll(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`fanout:${userId}`, `notice-write:${userId}`] } } });
  await db.session.deleteMany({ where: { userId } });
  await db.recruiterProfile.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: { in: [userId, colleagueId] } } });
  await db.$disconnect();
});

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

describe("the recruiter's web forms and the fanout budget", () => {
  it("lets a form through under the budget (the refusal is the library's, not the budget's)", async () => {
    const to = await said(() => addColleagueAction(FORM_IDLE, form({ back: "/recruiter", email: `zz-rbudget-c-${STAMP}@test.invalid` })));
    expect(to.message).not.toContain("Too many requests");
    const row = await db.rateLimit.findUnique({ where: { bucket: `fanout:${userId}` } });
    expect(row?.hits).toBe(1);
  });

  it("refuses the colleague's invitation and the requirement once the hour's fanout is spent, before any work", async () => {
    await db.rateLimit.update({ where: { bucket: `fanout:${userId}` }, data: { hits: FANOUT_BUDGET.limit } });
    const invite = await said(() => addColleagueAction(FORM_IDLE, form({ back: "/recruiter", email: `zz-rbudget-c-${STAMP}@test.invalid` })));
    expect(invite.ok).toBe(false);
    expect(invite.message).toMatch(/^Too many requests\. Try again in about/);
    const requirement = await said(() => postRequirementAction(FORM_IDLE, form({ back: "/recruiter", role: "Analyst", package: "6", targetSchoolIds: "none" })));
    expect(requirement.ok).toBe(false);
    expect(requirement.message).toMatch(/^Too many requests\./);
    // Refused before the library ran: no requirement was written.
    expect(await db.requirement.count({ where: { byUserId: userId } })).toBe(0);
  });
});
