/**
 * The operator's plans and the nightly usage sample (testing analysis of 13 November 2026, operator-console batch).
 *
 * TA-591 (Low, Functional): a plan held only by removed schools was listed with 0 schools and could never be deleted,
 *   because listPlans counted live schools and deletePlan every school. Now deletePlan counts the live schools as the
 *   list does, and a removed school's link to the plan is cleared with the plan.
 * TA-592 (Low, Data-integrity): renaming a plan's code to a college tier's code bypassed the tier's college-only rule
 *   (assignPlan's) and repriced its schools per student. Now updatePlan refuses a rename into a tier while a school on
 *   the plan is not a college, and a rename out of a tier while any school is on it.
 * TA-363 (Low, Data-integrity): the last day of a month never reached that month's usage row: the 02:10 run writes only
 *   the running month. Now the first run after a month ends recomputes the closed month once.
 *
 * Every row is one this suite makes (stamped ZZ schools and plans, @test.invalid accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPlan, deletePlan, listPlans, sampleUsage, updatePlan } from "@/lib/plans";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SHORT = String(STAMP).slice(-8);
const MAIL = (who: string) => `zz-taopc-pl-${who}-${STAMP}@test.invalid`;
const schools: string[] = [];
const plans: string[] = [];
let operatorId = "";
let operator: ActiveContext;

function ctx(userId: string): ActiveContext {
  return {
    sessionId: `zz-taopc-pl-${STAMP}`,
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "ZZ TA Operator",
      preferredName: null,
      email: MAIL("operator"),
      avatarKey: null,
      isMinor: false,
      isSuperuser: true,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

let serial = 0;
async function school(label: string, extra: { planId?: string; removedAt?: Date } = {}): Promise<string> {
  serial++;
  const id = (
    await db.school.create({
      data: { name: `ZZ TA OPC ${label} ${STAMP}`, slug: `zz-taopc-pl-${serial}-${STAMP}`, code: `ZOPP${serial}${String(STAMP).slice(-5)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", ...extra },
      select: { id: true },
    })
  ).id;
  schools.push(id);
  return id;
}

async function plan(tag: string): Promise<string> {
  const made = await createPlan(operator, { code: `zz-${tag}-${SHORT}`, name: `ZZ TA OPC ${tag}` });
  if (!made.ok) throw new Error(`setup: ${made.errorKey}`);
  plans.push(made.planId);
  return made.planId;
}

beforeAll(async () => {
  operatorId = (await db.user.create({ data: { name: "ZZ TA Operator", email: MAIL("operator"), isSuperuser: true, prefs: "{}" }, select: { id: true } })).id;
  operator = ctx(operatorId);
}, 60_000);

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: operatorId }] } });
  await db.notification.deleteMany({ where: { userId: operatorId } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.plan.deleteMany({ where: { id: { in: plans } } });
  await db.user.deleteMany({ where: { id: operatorId } });
  await db.$disconnect();
});

describe("TA-591: a plan held only by removed schools", () => {
  it("TA-591: is listed with 0 schools and can then be deleted", async () => {
    const planId = await plan("r13");
    const id = await school("Removed On Plan", { planId, removedAt: new Date() });
    const listed = (await listPlans(operator)).find((p) => p.id === planId);
    expect(listed?.schools).toBe(0);
    expect(await deletePlan(operator, planId)).toEqual({ ok: true });
    expect(await db.plan.count({ where: { id: planId } })).toBe(0);
    expect((await db.school.findUniqueOrThrow({ where: { id }, select: { planId: true } })).planId).toBeNull();
  });

  it("TA-591: a plan with a live school on it is still refused", async () => {
    const planId = await plan("r13b");
    await school("Live On Plan", { planId });
    expect(await deletePlan(operator, planId)).toEqual({ ok: false, errorKey: "root.planInUse" });
  });
});

describe("TA-592: a plan's code cannot be renamed into a college tier around the tier's rule", () => {
  it("TA-592: renaming a plan a school is on to college-affiliated is refused, and the code stays", async () => {
    const planId = await plan("r14");
    await school("School On Plan", { planId });
    expect(await updatePlan(operator, planId, { code: "college-affiliated" })).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierNotCollege" });
    expect((await db.plan.findUniqueOrThrow({ where: { id: planId }, select: { code: true } })).code).toBe(`zz-r14-${SHORT}`);
  });
});

describe("TA-363: the closed month's usage row", () => {
  it("TA-363: a text sent on the last evening of a month reaches that month's row on the first run of the next", async () => {
    const id = await school("Usage Month End");
    // 02:10 in Kolkata on 31 October 2026, then a text at 20:00 that evening, then 02:10 on 1 November.
    const lastMorning = new Date("2026-10-30T20:40:00Z");
    const evening = new Date("2026-10-31T14:30:00Z");
    const firstMorning = new Date("2026-10-31T20:40:00Z");
    await sampleUsage(lastMorning, { schoolIds: [id] });
    expect((await db.usageSample.findUniqueOrThrow({ where: { schoolId_month: { schoolId: id, month: "2026-10" } } })).messages).toBe(0);

    await db.outboundMessage.create({ data: { schoolId: id, to: "+910000000000", channel: "SMS", templateKey: "zz", body: "ZZ month-end reminder", status: "SENT", segments: 3, purpose: "BROADCAST", createdAt: evening } });
    await sampleUsage(firstMorning, { schoolIds: [id] });
    const closed = await db.usageSample.findUniqueOrThrow({ where: { schoolId_month: { schoolId: id, month: "2026-10" } } });
    expect(closed.messages).toBe(3);
    expect(closed.computedAt.getTime()).toBe(firstMorning.getTime());
    expect(await db.usageSample.count({ where: { schoolId: id, month: "2026-11" } })).toBe(1);

    // A second run that morning leaves the closed month as it is.
    await db.outboundMessage.create({ data: { schoolId: id, to: "+910000000000", channel: "SMS", templateKey: "zz", body: "ZZ late write", status: "SENT", segments: 5, purpose: "BROADCAST", createdAt: evening } });
    await sampleUsage(new Date(firstMorning.getTime() + 60_000), { schoolIds: [id] });
    expect((await db.usageSample.findUniqueOrThrow({ where: { schoolId_month: { schoolId: id, month: "2026-10" } } })).messages).toBe(3);
  });
});
