/**
 * TA-488, the owner's decision of 14 November 2026: the college tiers each list the kinds they suit
 * (COLLEGE_TIERS in packages/contracts/src/v1/operator-college.ts: ₹199 suits an affiliated college only, ₹299
 * an autonomous or an affiliated one), but nothing read that list, so the operator could put an autonomous
 * college on the ₹199 price, from the school's page, the new-school form or the phone, with no word. Now a
 * college price whose list lacks the college's kind is refused with its own sentence wherever a plan is set
 * (assignPlan, which the school's page, the plan door the phone calls and the guided onboarding all reach); a
 * plan is not renamed to the ₹199 code while an autonomous college is on it; an affiliated college may take
 * either price; and the web's school page and new-school form offer only the prices that suit the kind.
 *
 * Every school, person and ordinary plan here is this suite's own, stamped and removed after. The two tier
 * plans are found by their code, or made by this suite and removed after when it made them.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { assignPlan, updatePlan } from "@/lib/plans";
import { onboardSchool } from "@/lib/subscriptions";
import { POST as planPost } from "@/app/api/v1/operator/schools/[schoolId]/plan/route";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";

const db = new PrismaClient();
const STAMP = Date.now();
const TAG = `zz-ta488-${STAMP}`;
const AGENT = `zz-ta488-${STAMP}`;
const ROOT = resolve(__dirname, "..");

let operatorUserId = "";
let autonomousId = "";
let affiliatedId = "";
let affiliatedTierId = "";
let autonomousTierId = "";
let ordinaryPlanId = "";
const madeTiers: string[] = [];

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: `${TAG}-op@test.invalid` } }) as unknown as Parameters<typeof assignPlan>[0];
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

/** The tier's Plan row by its code, made by this suite (and removed after) when the dev database has none. */
async function tier(code: "college-affiliated" | "college-autonomous"): Promise<string> {
  const found = await db.plan.findUnique({ where: { code }, select: { id: true } });
  if (found) return found.id;
  try {
    const made = await db.plan.create({ data: { code, name: `ZZ TA488 ${code}` }, select: { id: true } });
    madeTiers.push(made.id);
    return made.id;
  } catch {
    // Another suite made it at the same moment: theirs is used and left to them.
    return (await db.plan.findUniqueOrThrow({ where: { code }, select: { id: true } })).id;
  }
}

async function college(key: string, kind: "COLLEGE" | "AUTONOMOUS_COLLEGE"): Promise<string> {
  return (
    await db.school.create({
      data: { name: `ZZ TA488 ${key} ${STAMP}`, slug: `${TAG}-${key}`, code: `Z488${key}${String(STAMP).slice(-6)}`, contactEmail: `${TAG}-${key}@test.invalid`, timezone: "Asia/Kolkata", kind, streamsJson: JSON.stringify(["ARTS"]), isTestFixture: true },
      select: { id: true },
    })
  ).id;
}

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: "ZZ TA488 Operator", email: `${TAG}-op@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  autonomousId = await college("A", "AUTONOMOUS_COLLEGE");
  affiliatedId = await college("F", "COLLEGE");
  affiliatedTierId = await tier("college-affiliated");
  autonomousTierId = await tier("college-autonomous");
  ordinaryPlanId = (await db.plan.create({ data: { code: `${TAG}`.slice(0, 32), name: `ZZ TA488 ordinary ${STAMP}` }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = (await db.school.findMany({ where: { slug: { startsWith: TAG } }, select: { id: true } })).map((s) => s.id);
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: operatorUserId }] } });
  await db.operatorAccess.deleteMany({ where: { userId: operatorUserId } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.plan.deleteMany({ where: { id: { in: [ordinaryPlanId, ...madeTiers] }, schools: { none: {} } } });
  await db.session.deleteMany({ where: { userId: operatorUserId } });
  await db.user.deleteMany({ where: { id: operatorUserId } });
  await db.$disconnect();
});

const planOf = async (id: string) => (await db.school.findUniqueOrThrow({ where: { id }, select: { planId: true } })).planId;

describe("TA-488: a college price is set only on a college whose kind it suits", () => {
  it("TA-488: an autonomous college is refused the affiliated price with its own sentence, and its plan is unchanged", async () => {
    expect(await assignPlan(operator(), autonomousId, affiliatedTierId)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind" });
    expect(await planOf(autonomousId)).toBeNull();
    // The autonomous price suits it.
    expect(await assignPlan(operator(), autonomousId, autonomousTierId)).toEqual({ ok: true });
    expect(await planOf(autonomousId)).toBe(autonomousTierId);
    // And from it, still refused the cheaper one.
    expect(await assignPlan(operator(), autonomousId, affiliatedTierId)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind" });
    expect(await planOf(autonomousId)).toBe(autonomousTierId);
    await db.school.update({ where: { id: autonomousId }, data: { planId: null, planSince: null } });
  }, 60_000);

  it("TA-488: an affiliated college may take either college price, and an ordinary plan stays open to an autonomous college", async () => {
    expect(await assignPlan(operator(), affiliatedId, affiliatedTierId)).toEqual({ ok: true });
    expect(await assignPlan(operator(), affiliatedId, autonomousTierId)).toEqual({ ok: true });
    expect(await planOf(affiliatedId)).toBe(autonomousTierId);
    expect(await assignPlan(operator(), autonomousId, ordinaryPlanId)).toEqual({ ok: true });
    expect(await planOf(autonomousId)).toBe(ordinaryPlanId);
    await db.school.update({ where: { id: affiliatedId }, data: { planId: null, planSince: null } });
  }, 60_000);

  it("TA-488: the plan door the phone calls answers 422 with the sentence, and nothing changes", async () => {
    __resetCookies();
    __setHeaders({ "user-agent": AGENT });
    await createSession(operatorUserId);
    const before = await planOf(autonomousId);
    const res = await planPost(
      new Request(`http://localhost/api/v1/operator/schools/${autonomousId}/plan`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId: affiliatedTierId }) }),
      params({ schoolId: autonomousId }),
    );
    expect(res.status).toBe(422);
    expect(((await res.json()) as { error: string }).error).toBe(en.operatorCollege.refuseTierKind);
    expect(await planOf(autonomousId)).toBe(before);
  }, 60_000);

  it("TA-488: a plan an autonomous college is on is not renamed to the affiliated price's code", async () => {
    // The autonomous college sits on this suite's ordinary plan.
    await db.school.update({ where: { id: autonomousId }, data: { planId: ordinaryPlanId, planSince: new Date() } });
    expect(await updatePlan(operator(), ordinaryPlanId, { code: "college-affiliated" })).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind" });
    expect((await db.plan.findUniqueOrThrow({ where: { id: ordinaryPlanId }, select: { code: true } })).code).not.toBe("college-affiliated");
  }, 60_000);

  it("TA-488: the guided onboarding refuses an autonomous college on the affiliated price and leaves nothing behind", async () => {
    const slug = `${TAG}-onb`;
    const refused = await onboardSchool(operator(), {
      name: `ZZ TA488 Onboard ${STAMP}`,
      slug,
      contactEmail: `${TAG}-onb@test.invalid`,
      timezone: "Asia/Kolkata",
      kind: "AUTONOMOUS_COLLEGE",
      streams: ["ARTS"],
      planId: affiliatedTierId,
      trial: true,
      adminEmail: `${TAG}-onb-admin@test.invalid`,
    });
    expect(refused).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind" });
    expect(await db.school.count({ where: { slug } })).toBe(0);
  }, 60_000);

  it("TA-488: the web's school page and new-school form offer only the prices that suit the kind", () => {
    const page = readFileSync(resolve(ROOT, "src/app/root/[schoolId]/page.tsx"), "utf8");
    expect(page).toMatch(/plans\.filter\(\(p\) => planSuitsKind\(p\.code, school\.kind\)/);
    const form = readFileSync(resolve(ROOT, "src/app/root/onboard/onboard-form.tsx"), "utf8");
    expect(form).toMatch(/plans\.filter\(\(p\) => planSuitsKind\(p\.code, school\.kind\)\)/);
  });

  it("TA-488: the refusal is a sentence in English, Hindi and Marathi", () => {
    const words = [en, hi, mr].map((d) => (d.operatorCollege as unknown as Record<string, string>).refuseTierKind);
    for (const w of words) expect(typeof w === "string" && w.length > 20).toBe(true);
    expect(words[1]!.trim().endsWith("।")).toBe(true);
    expect(words[2]!.trim().endsWith(".")).toBe(true);
    expect(words[2]).not.toMatch(/स्कूल/);
  });
});
