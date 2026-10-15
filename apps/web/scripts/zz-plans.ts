import type { PrismaClient } from "@prisma/client";
import { PERSON_PLANS, PLAN_FEATURES, type PlanCode } from "@edulink/contracts";

/**
 * THE PLANS FIXTURE (16 October 2026; src/lib/person-plans.ts, decision 0006).
 *
 *   - Placeholder prices on the three plans sold per person, which the owner sets for real: ₹99 a month / ₹999 a year
 *     STUDENT, ₹199 / ₹1,999 TEACHER, ₹499 / ₹4,999 EXPERT. Written only while a plan's two prices are both still 0,
 *     so a price the operator has set stands. Whether a plan is ACTIVE is left exactly as the operator left it.
 *   - A working path for the sweep: ZZ Northgate's first pupil (zz.pupil01) holds the STUDENT plan and its first
 *     teacher (zz.teacher1) the TEACHER plan, a year from the first run, granted by the ZZ operator. Made only when the
 *     person holds no live GRANT of that plan, so a second run adds nothing.
 *
 * No audit row and no notice: these are fixture rows, not the operator's act. Removed by --teardown with the ZZ people.
 */
export const ZZ_PLAN_PRICES: Record<PlanCode, { monthly: number; yearly: number }> = {
  STUDENT: { monthly: 9_900, yearly: 99_900 },
  TEACHER: { monthly: 19_900, yearly: 199_900 },
  EXPERT: { monthly: 49_900, yearly: 499_900 },
};

const YEAR_MS = 365 * 86_400_000;

export async function buildPlans(db: PrismaClient, opts: { domain: string; operatorId: string; now?: Date }): Promise<{ priced: number; granted: string[]; kept: string[] }> {
  const now = opts.now ?? new Date();
  let priced = 0;
  for (const code of PERSON_PLANS) {
    await db.personPlan.upsert({ where: { code }, create: { code, features: [...PLAN_FEATURES[code]], active: false }, update: {} });
    const { count } = await db.personPlan.updateMany({
      where: { code, pricePaise: 0, yearlyPricePaise: 0 },
      data: { pricePaise: ZZ_PLAN_PRICES[code].monthly, yearlyPricePaise: ZZ_PLAN_PRICES[code].yearly },
    });
    priced += count;
  }
  const granted: string[] = [];
  const kept: string[] = [];
  for (const [email, plan] of [[`zz.pupil01@${opts.domain}`, "STUDENT"], [`zz.teacher1@${opts.domain}`, "TEACHER"]] as const) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) continue;
    const live = await db.entitlement.count({ where: { userId: user.id, planCode: plan, source: "GRANT", revokedAt: null, validTo: { gt: now } } });
    if (live > 0) {
      kept.push(`${email} ${plan}`);
      continue;
    }
    await db.entitlement.createMany({
      data: PLAN_FEATURES[plan].map((feature) => ({
        userId: user.id,
        feature,
        source: "GRANT",
        planCode: plan,
        validFrom: now,
        validTo: new Date(now.getTime() + YEAR_MS),
        grantedByUserId: opts.operatorId,
        note: "ZZ fixture: a year's grant so the sweep sees a working path",
      })),
    });
    granted.push(`${email} ${plan}`);
  }
  return { priced, granted, kept };
}

/** For --teardown: entitlements carry no foreign key to User, so they go by the ZZ people's ids before the people do. */
export async function removeZzEntitlements(db: PrismaClient, domain: string): Promise<number> {
  const ids = (await db.user.findMany({ where: { email: { endsWith: `@${domain}` } }, select: { id: true } })).map((u) => u.id);
  if (ids.length === 0) return 0;
  return (await db.entitlement.deleteMany({ where: { userId: { in: ids } } })).count;
}
