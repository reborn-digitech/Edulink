/**
 * THE SWEEPS AND THIS WEEK'S GATES (16 October 2026): the platform's feature switches (src/lib/platform-features.ts)
 * and the plans sold per person (src/lib/person-plans.ts). Both sweeps — scripts/sweep.ts (pages) and
 * scripts/api-sweep.ts (doors) — read what the database says before they judge an answer, so the same run is right
 * whichever way the operator has left the switches:
 *
 *   - a door whose catalog `feature` is off answers 404 FEATURE_OFF to every role token, before any other refusal;
 *     a page under a feature's layout carries the app's not-found boundary;
 *   - a feature that is on but needs a plan the caller's role must hold, while that plan is ACTIVE and the caller
 *     holds no entitlement covering now, answers 402 PLAN_REQUIRED at a door and draws the plan card on a page
 *     (`data-testid="plan-card"`), unless the door is `planFree` or the layout asks the switch alone.
 *
 * What is read here mirrors the server's own rules and is held to them by tests/sweep-features.test.ts: `accessFor`
 * is platform-features.ts `accessTo`, `doorGate` is role-gate.ts `assertDoorFeature`, `planNeeded` is
 * person-plans.ts PLAN_TABLE, and FEATURE_PAGES is every feature layout under app/(app).
 *
 * `--features=on` switches every platform feature that is off ON for the length of the run, through the operator's
 * own door (POST /api/v1/operator/features/{code}, audited operator.feature.on) as the ZZ operator, and back OFF at
 * the end (audited operator.feature.off) — in a `finally`, and on Ctrl-C or a kill. Only the codes the run itself
 * switched are put back; nothing is ever left on. `--plans=on` does the same for the three plans' active switches
 * (PUT /api/v1/operator/person-plans, audited operator.plan.update), so the 402 path can be swept.
 */
import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { PERSON_PLANS, PLAN_FEATURES, PLATFORM_FEATURES, type FeatureCode, type PlanCode } from "@edulink/contracts";
import { featuresOf, type Endpoint } from "../src/lib/api-catalog/types";

export type GateState = {
  /** The platform features the operator has on. */
  on: ReadonlySet<FeatureCode>;
  /** The plans the operator has made active (an inactive plan asks nothing). */
  activePlans: ReadonlySet<PlanCode>;
  /** Per user id, the features an unrevoked entitlement covers now. */
  entitled: ReadonlyMap<string, ReadonlySet<FeatureCode>>;
};

/** Who is asking: the role on the session and the person. A role-less caller (signed out, the operator) needs no plan. */
export type Who = { role: string | null; userId: string | null };

/** What the gate makes of a caller at a surface: open, off for the platform, or locked behind a plan. */
export type Gate = { state: "open" } | { state: "off"; feature: FeatureCode } | { state: "plan"; feature: FeatureCode; plan: PlanCode };

const isFeature = (code: string): code is FeatureCode => (PLATFORM_FEATURES as readonly string[]).includes(code);
const isPlan = (code: string): code is PlanCode => (PERSON_PLANS as readonly string[]).includes(code);

/** The switches, the active plans and these people's entitlements, read once before a run judges anything. */
export async function readGateState(db: PrismaClient, userIds: readonly string[] | "everyone", now: Date = new Date()): Promise<GateState> {
  const live = { revokedAt: null, validFrom: { lte: now }, validTo: { gt: now } };
  const [features, plans, rows] = await Promise.all([
    db.platformFeature.findMany({ select: { code: true, enabled: true } }),
    db.personPlan.findMany({ select: { code: true, active: true } }),
    // "everyone": the page sweep mints its actors as it goes, so it reads every live row (a small table) once.
    userIds === "everyone"
      ? db.entitlement.findMany({ where: live, select: { userId: true, feature: true } })
      : userIds.length
        ? db.entitlement.findMany({ where: { userId: { in: [...new Set(userIds)] }, ...live }, select: { userId: true, feature: true } })
        : Promise.resolve([]),
  ]);
  const entitled = new Map<string, Set<FeatureCode>>();
  for (const r of rows) if (isFeature(r.feature)) entitled.set(r.userId, (entitled.get(r.userId) ?? new Set()).add(r.feature));
  return {
    on: new Set(features.filter((f) => f.enabled && isFeature(f.code)).map((f) => f.code as FeatureCode)),
    activePlans: new Set(plans.filter((p) => p.active && isPlan(p.code)).map((p) => p.code as PlanCode)),
    entitled,
  };
}

/**
 * The plan this role must hold for this feature, or null — person-plans.ts PLAN_TABLE, where the STUDENT, TEACHER and
 * EXPERT roles each need the plan of their own name for that plan's features (contracts PLAN_FEATURES) and every
 * other role needs none.
 */
export function planNeeded(role: string | null, code: FeatureCode): PlanCode | null {
  if (!role || !isPlan(role)) return null;
  return PLAN_FEATURES[role].includes(code) ? role : null;
}

/** platform-features.ts `accessTo`: open as soon as one feature of the list is on and not locked for this caller. */
export function accessFor(codes: readonly FeatureCode[], who: Who, s: GateState): Gate {
  let locked: { feature: FeatureCode; plan: PlanCode } | null = null;
  for (const code of codes) {
    if (!s.on.has(code)) continue;
    const plan = planNeeded(who.role, code);
    if (!plan || !s.activePlans.has(plan) || (who.userId !== null && s.entitled.get(who.userId)?.has(code))) return { state: "open" };
    locked ??= { feature: code, plan };
  }
  return locked ? { state: "plan", ...locked } : { state: "off", feature: codes[0]! };
}

/** The switch alone (platform-features.ts `assertFeatureSwitchOn`): what a lapsed plan keeps open. */
function switchFor(codes: readonly FeatureCode[], s: GateState): Gate {
  return codes.some((c) => s.on.has(c)) ? { state: "open" } : { state: "off", feature: codes[0]! };
}

/**
 * role-gate.ts `assertDoorFeature` for a signed-in caller: a door naming no feature, or one whose handler decides
 * (`featureInHandler`), is open as far as the gate goes; a `planFree` door asks the switch alone.
 */
export function doorGate(e: Pick<Endpoint, "feature" | "featureInHandler" | "planFree">, who: Who, s: GateState): Gate {
  const codes = featuresOf(e);
  if (codes.length === 0 || e.featureInHandler) return { state: "open" };
  if (e.planFree) return switchFor(codes, s);
  return accessFor(codes, who, s);
}

/**
 * EVERY LAYOUT UNDER app/(app) THAT GATES ITS PAGES BY A FEATURE (feature-page.ts): `featurePageLock` (the app's 404
 * while off, the plan card while locked) or, marked `planFree`, `requireFeatureSwitchPage` (the 404 alone). A list is
 * "any of" (nav.ts SESSION_FEATURES). tests/sweep-features.test.ts holds this table to the directory.
 */
export const FEATURE_PAGES: readonly { prefix: string; features: readonly FeatureCode[]; planFree?: true }[] = [
  { prefix: "/assistant", features: ["ASSISTANT"] },
  { prefix: "/student/practice", features: ["QUESTION_BANK"] },
  { prefix: "/parent/practice", features: ["QUESTION_BANK"] },
  { prefix: "/teacher/practice", features: ["QUESTION_BANK"] },
  { prefix: "/teacher/worksheets", features: ["QUESTION_BANK"] },
  { prefix: "/teacher/contributions", features: ["QUESTION_GIG"] },
  { prefix: "/teacher/guidance", features: ["TEACHER_SESSIONS"] },
  { prefix: "/experts", features: ["EXPERT_SESSIONS"] },
  { prefix: "/mentoring", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/availability", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/sessions", features: ["EXPERT_SESSIONS"] },
  { prefix: "/expert/bookings", features: ["EXPERT_SESSIONS"], planFree: true },
  { prefix: "/expert/earnings", features: ["EXPERT_SESSIONS"], planFree: true },
  { prefix: "/sessions", features: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] },
  { prefix: "/admin/sessions", features: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] },
  { prefix: "/vacancies", features: ["JOB_BOARD"] },
  { prefix: "/admin/vacancies", features: ["JOB_BOARD"] },
];

/** The feature layout a page sits under, or null. The query string is not part of the route. */
export function featurePageOf(path: string): (typeof FEATURE_PAGES)[number] | null {
  const route = path.split("?")[0]!.split("#")[0]!;
  return FEATURE_PAGES.find((p) => route === p.prefix || route.startsWith(`${p.prefix}/`)) ?? null;
}

/** What a signed-in caller meets on this page, or null for a page under no feature's layout. */
export function pageGate(path: string, who: Who, s: GateState): Gate | null {
  const page = featurePageOf(path);
  if (!page) return null;
  return page.planFree ? switchFor(page.features, s) : accessFor(page.features, who, s);
}

/** The flags both sweeps take: `--features=on` and `--plans=on`. */
export function gateFlags(argv: readonly string[]): { features: boolean; plans: boolean } {
  return { features: argv.includes("--features=on"), plans: argv.includes("--plans=on") };
}

/* -------------------------------------------------------------------------- */
/* Switching for a run, as the ZZ operator, through the operator's own doors   */
/* -------------------------------------------------------------------------- */

const OPERATOR_EMAIL = "zz.operator@zz.test";

/** One short-lived bearer session for the ZZ operator, used for one batch of switches and deleted after it. */
async function asOperator<T>(db: PrismaClient, act: (token: string) => Promise<T>): Promise<T> {
  const operator = await db.user.findUnique({ where: { email: OPERATOR_EMAIL }, select: { id: true, isSuperuser: true } });
  if (!operator?.isSuperuser) throw new Error(`${OPERATOR_EMAIL} is not the fixture operator here (npm run zz:fixtures): nothing was switched`);
  const token = randomBytes(32).toString("base64url");
  const session = await db.session.create({
    data: { userId: operator.id, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: null, activeRole: null, userAgent: "sweep-features", expiresAt: new Date(Date.now() + 15 * 60_000) },
  });
  try {
    return await act(token);
  } finally {
    await db.session.deleteMany({ where: { id: session.id } });
  }
}

async function call(base: string, token: string, method: "POST" | "PUT", path: string, body: unknown): Promise<void> {
  const res = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (res.status !== 200) throw new Error(`${method} ${path} answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/**
 * A run's switches: `on()` turns on every feature (and, with `plans`, every plan) that is off and remembers which;
 * `restore()` turns exactly those back off, once — however many times it is called, from the `finally` or a signal.
 */
export function runSwitches(db: PrismaClient, base: string, opts: { features: boolean; plans: boolean }) {
  let features: FeatureCode[] = [];
  let plans: PlanCode[] = [];
  let restoring: Promise<void> | null = null;
  return {
    async on(): Promise<{ features: FeatureCode[]; plans: PlanCode[] }> {
      if (!opts.features && !opts.plans) return { features, plans };
      const [fRows, pRows] = await Promise.all([db.platformFeature.findMany({ select: { code: true, enabled: true } }), db.personPlan.findMany({ select: { code: true, active: true } })]);
      const featuresOff = opts.features ? PLATFORM_FEATURES.filter((c) => !fRows.find((r) => r.code === c)?.enabled) : [];
      const plansOff = opts.plans ? PERSON_PLANS.filter((c) => !pRows.find((r) => r.code === c)?.active) : [];
      await asOperator(db, async (token) => {
        for (const code of featuresOff) {
          await call(base, token, "POST", `/api/v1/operator/features/${code}`, { on: true });
          features.push(code);
        }
        for (const code of plansOff) {
          await call(base, token, "PUT", "/api/v1/operator/person-plans", { code, active: true });
          plans.push(code);
        }
      });
      return { features: [...features], plans: [...plans] };
    },
    restore(): Promise<void> {
      restoring ??= (async () => {
        if (features.length === 0 && plans.length === 0) return;
        await asOperator(db, async (token) => {
          for (const code of plans) await call(base, token, "PUT", "/api/v1/operator/person-plans", { code, active: false });
          for (const code of features) await call(base, token, "POST", `/api/v1/operator/features/${code}`, { on: false });
        });
        console.log(`· switched back off what this run switched on: ${[...features, ...plans.map((p) => `plan ${p}`)].join(", ")}`);
        features = [];
        plans = [];
      })();
      return restoring;
    },
  };
}

/** One line for the log: the state a run judged against. */
export function describeGateState(s: GateState): string {
  const on = PLATFORM_FEATURES.filter((c) => s.on.has(c));
  return `features on: ${on.length ? on.join(", ") : "none"}; plans active: ${s.activePlans.size ? [...s.activePlans].join(", ") : "none"}`;
}
