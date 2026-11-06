import "server-only";
import { cache } from "react";
import { PLATFORM_FEATURES, type FeatureCode, type OperatorFeature, type PlanCode } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, FeatureOffError, PlanRequiredError } from "./access-error";
import { forTenant } from "./tenant-context";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { planLockFor } from "./person-plans";

export { PLATFORM_FEATURES, type FeatureCode };

/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026).
 *
 * Eight parts of the platform — the assistant, the question bank's practice, the teachers' question gig,
 * expert sessions, teacher sessions, the job board, text messaging and (decision 0007, 6 Nov 2026) the
 * competition marketplace — are dark on the WHOLE platform
 * until the operator switches each on at /root/features (packages/contracts v1/platform-features.ts has
 * the list). One PlatformFeature row per code, OFF by default; a missing row is created, off, on first
 * read. Switching off deletes nothing: every page, door, row and key comes back as it was when it is
 * switched on again (an open vacancy stays OPEN, a booking stays booked).
 *
 * WHAT A GATED SURFACE CALLS — and nothing else:
 *   - nothing, for an /api/v1 door: give its catalog entry `feature: "X"` and the session's gate
 *     (role-gate.ts) answers 404 with code FEATURE_OFF before the handler runs, for every role;
 *   - `assertFeatureOn(code, who)` at the top of a page, a server action or a lib function, which throws
 *     the same refusal (a page renders the app's 404, the API answers 404 FEATURE_OFF);
 *   - `mayUse(code, who)` to decide what to draw (a tile, a card, a section of a shared page);
 *   - a NAV entry's `feature` (nav.ts), dropped by the shell while off; the phone's by /api/v1/me's `features`.
 *
 * THE SEAM (16 October 2026, plans sold per person; src/lib/person-plans.ts, decision 0006): `mayUse` is the
 * platform switch AND (the feature needs no plan for this person's role OR the person holds an entitlement
 * covering now). A feature that is on but locked for the person answers 402 PLAN_REQUIRED at a door
 * (`PlanRequiredError`), shows the plan card on a page (feature-page.ts), and keeps its nav entry so the person
 * can reach the card (`featuresFor` is the switch alone; `lockedFor` names what is locked).
 */

/**
 * Who is asking. `role` is the role on the session, which decides whether a plan is needed (person-plans.ts
 * PLAN_TABLE); a call naming no role — a job, the calendar feed, the texts — asks the platform switch alone.
 */
export type Who = { userId: string | null; schoolId: string | null; role?: Role | null };
/** A session, or the person and school it is about; null for a call with nobody behind it (a job, the gate before a session). */
export type WhoLike = Who | (Pick<ActiveContext, "user" | "schoolId"> & Partial<Pick<ActiveContext, "role">>) | null | undefined;

function whoOf(who: WhoLike): Who {
  if (!who) return { userId: null, schoolId: null, role: null };
  if ("user" in who) return { userId: who.user.id, schoolId: who.schoolId, role: who.role ?? null };
  return who;
}

/**
 * FOR THE TEST SUITES ONLY. Vitest runs against the developer's own database, where every feature is off
 * until the operator says otherwise; tests/setup.ts therefore opens every feature for the suites that
 * exercise those features (`setFeaturesForTests([...PLATFORM_FEATURES])`), and a suite about the switch
 * itself passes null to read the table. Held on globalThis (a module may be evaluated more than once) and
 * read only while VITEST is set: no running server ever consults it.
 */
const TEST_KEY = "__edulinkPlatformFeaturesForTests";
export function setFeaturesForTests(on: readonly FeatureCode[] | null): void {
  if (!process.env.VITEST) throw new Error("setFeaturesForTests is for the test suites alone");
  (globalThis as Record<string, unknown>)[TEST_KEY] = on ? [...on] : null;
}
function featuresForTests(): FeatureCode[] | null {
  if (!process.env.VITEST) return null;
  const value = (globalThis as Record<string, unknown>)[TEST_KEY];
  return Array.isArray(value) ? (value as FeatureCode[]) : null;
}

const isCode = (code: string): code is FeatureCode => (PLATFORM_FEATURES as readonly string[]).includes(code);

type Row = { code: string; enabled: boolean; changedAt: Date | null; changedByUserId: string | null };

/** Every feature's row, the missing ones created OFF first. One indexed read of seven rows in the common case. */
async function rows(): Promise<Row[]> {
  const found = await db.platformFeature.findMany({ select: { code: true, enabled: true, changedAt: true, changedByUserId: true } });
  const missing = PLATFORM_FEATURES.filter((code) => !found.some((r) => r.code === code));
  if (missing.length === 0) return found;
  await db.platformFeature.createMany({ data: missing.map((code) => ({ code, enabled: false })), skipDuplicates: true });
  return db.platformFeature.findMany({ select: { code: true, enabled: true, changedAt: true, changedByUserId: true } });
}

/** The features the operator has on, in the contracts' order. Read once per request. */
export const featuresOn = cache(async (): Promise<FeatureCode[]> => {
  const forTests = featuresForTests();
  if (forTests) return PLATFORM_FEATURES.filter((code) => forTests.includes(code));
  const on = new Set((await rows()).filter((r) => r.enabled).map((r) => r.code));
  return PLATFORM_FEATURES.filter((code) => on.has(code));
});

/** Whether the platform switch for `code` is on. Cheap: one read per request (featuresOn). */
export async function featureOn(code: FeatureCode): Promise<boolean> {
  return (await featuresOn()).includes(code);
}

/** The plan this person lacks for a feature that is on, or null (no plan needed, the plan inactive, or entitled). */
export async function lockOf(code: FeatureCode, who: WhoLike): Promise<PlanCode | null> {
  const w = whoOf(who);
  return planLockFor(code, { userId: w.userId, role: w.role });
}

/**
 * MAY THIS PERSON USE THIS FEATURE HERE? The only question a gated surface asks: the platform switch, and then
 * (16 Oct 2026) the person's plan where their role needs one (person-plans.ts).
 */
export async function mayUse(code: FeatureCode, who: WhoLike): Promise<boolean> {
  if (!(await featureOn(code))) return false;
  return (await lockOf(code, who)) === null;
}

/** Whether any of `codes` may be used: a page two features share (the family's /sessions, the office's). */
export async function mayUseAny(codes: readonly FeatureCode[], who: WhoLike): Promise<boolean> {
  for (const code of codes) if (await mayUse(code, who)) return true;
  return false;
}

/**
 * What a person meets at a surface of `codes` (any of): "open"; "off" while every one is off for the platform; or
 * "plan" — a feature is on but the person lacks its plan — naming the first such feature and its plan.
 */
export type FeatureAccess = { state: "open" } | { state: "off"; feature: FeatureCode } | { state: "plan"; feature: FeatureCode; plan: PlanCode };
export async function accessTo(codes: readonly FeatureCode[], who: WhoLike): Promise<FeatureAccess> {
  let locked: { feature: FeatureCode; plan: PlanCode } | null = null;
  for (const code of codes) {
    if (!(await featureOn(code))) continue;
    const plan = await lockOf(code, who);
    if (plan === null) return { state: "open" };
    locked ??= { feature: code, plan };
  }
  return locked ? { state: "plan", ...locked } : { state: "off", feature: codes[0]! };
}

/**
 * The features this person is SHOWN: /api/v1/me's `features` and the shell's nav. The platform switch alone, so a
 * feature behind a plan the person lacks keeps its entry and leads to the plan card (`lockedFor` names those).
 */
export async function featuresFor(who: WhoLike): Promise<FeatureCode[]> {
  void who;
  return [...(await featuresOn())];
}

/** The features on for the platform that this person reaches only with a plan they do not hold: /api/v1/me's `locked`. */
export async function lockedFor(who: WhoLike): Promise<FeatureCode[]> {
  const out: FeatureCode[] = [];
  for (const code of await featuresOn()) if ((await lockOf(code, who)) !== null) out.push(code);
  return out;
}

/**
 * Throws unless `code` may be used: FeatureOffError while the platform has it off (404 FEATURE_OFF at the API; the
 * app's 404 on a page), PlanRequiredError while it is on and the person lacks its plan (402 PLAN_REQUIRED).
 */
export async function assertFeatureOn(code: FeatureCode, who: WhoLike): Promise<void> {
  await assertAnyFeatureOn([code], who);
}

/** …unless any of `codes` may be used. */
export async function assertAnyFeatureOn(codes: readonly FeatureCode[], who: WhoLike): Promise<void> {
  const access = await accessTo(codes, who);
  if (access.state === "off") throw new FeatureOffError(codes[0]!);
  if (access.state === "plan") throw new PlanRequiredError(access.plan, access.feature);
}

/** The platform switch alone, plan or not: for what a lapsed plan must keep open (an expert's earnings, a provider's own bookings). */
export async function assertFeatureSwitchOn(codes: readonly FeatureCode[]): Promise<void> {
  for (const code of codes) if (await featureOn(code)) return;
  throw new FeatureOffError(codes[0]!);
}

/**
 * A GUARDIAN READING A CHILD'S FEATURE (16 Oct 2026): a guardian needs no plan of their own, but reads a child's
 * practice only while the CHILD may use it — the plan the guardian buys is the pupil's. The child is the pupil of
 * `studentMembershipId`, judged as a STUDENT. The gate cannot do this (the child is in the query, which the gate
 * never sees), so the guardian's door and page call it once the child is chosen.
 */
export async function childLock(code: FeatureCode, studentMembershipId: string): Promise<PlanCode | null> {
  const m = await db.membership.findUnique({ where: { id: studentMembershipId }, select: { userId: true, schoolId: true } });
  if (!m) return null;
  return planLockFor(code, { userId: m.userId, role: "STUDENT" });
}
export async function assertChildMayUse(code: FeatureCode, studentMembershipId: string): Promise<void> {
  if (!(await featureOn(code))) throw new FeatureOffError(code);
  const plan = await childLock(code, studentMembershipId);
  if (plan) throw new PlanRequiredError(plan, code);
}

/* -------------------------------------------------------------------------- */
/* The operator                                                                */
/* -------------------------------------------------------------------------- */

function assertOperator(ctx: ActiveContext): void {
  // The same refusal as every operator door: "not here" to anyone else (superuser.ts assertSuperuser).
  if (!ctx.user.isSuperuser) throw new AccessError("access.thisAreaBelongsToWhoeverRunsThe", "NOT_FOUND");
}

/** The first instant of this calendar month in India, where every school on the platform is. */
function monthStartIndia(now: Date): Date {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - 330 * 60_000);
}

/**
 * A count over every school, read one school at a time under the operator's own binding to that school
 * (as operator-college.ts reads a college's health): the operator is never given every school at once.
 * Numbers only; nothing about a person leaves the query. Fixture schools are left out, as on /root.
 */
async function acrossSchools(ctx: ActiveContext, count: (schoolId: string) => Promise<number>): Promise<number> {
  const schools = await db.school.findMany({ where: { removedAt: null, isTestFixture: false }, select: { id: true } });
  let total = 0;
  for (const s of schools) total += await forTenant({ schoolIds: [s.id], userId: ctx.user.id, joinCode: null, isSuperuser: true }, () => count(s.id));
  return total;
}

/** The one number that explains each feature on the operator's page. */
async function explainingCount(ctx: ActiveContext, code: FeatureCode, now: Date): Promise<number> {
  switch (code) {
    case "ASSISTANT":
      // Schools with the assistant module on: those that would have it the moment the feature is on.
      return acrossSchools(ctx, (schoolId) => db.schoolModule.count({ where: { schoolId, module: "ASSISTANT" } }));
    case "QUESTION_BANK":
      // Chapters in the practice bank.
      return db.quizTopic.count({ where: { retiredAt: null } });
    case "QUESTION_GIG":
      // Teachers' questions waiting for the content team.
      return db.questionContribution.count({ where: { status: "SUBMITTED" } });
    case "EXPERT_SESSIONS":
      // Experts published on the directory.
      return db.expertProfile.count({ where: { publishedAt: { not: null }, disabledAt: null, user: { isTestFixture: false } } });
    case "TEACHER_SESSIONS":
      // Schools that let their teachers offer guidance.
      return db.school.count({ where: { removedAt: null, isTestFixture: false, teacherGuidanceOn: true } });
    case "JOB_BOARD":
      // Open postings, kept OPEN while the board is off.
      return acrossSchools(ctx, (schoolId) => db.jobPosting.count({ where: { schoolId, status: "OPEN" } }));
    case "TEXT_MESSAGING": {
      // Texts skipped this month because the feature is off.
      const since = monthStartIndia(now);
      return acrossSchools(ctx, (schoolId) => db.outboundMessage.count({ where: { schoolId, status: "SKIPPED", skipReason: "feature-off", createdAt: { gte: since } } }));
    }
    case "COMPETITIONS":
      // The platform's published competitions (the content team's and the crawler's), waiting behind the switch.
      return db.competition.count({ where: { organizerSchoolId: null, status: "PUBLISHED" } });
  }
}

/** Every feature for the operator's page and GET /api/v1/operator/features. */
export async function listFeatures(ctx: ActiveContext, now: Date = new Date()): Promise<OperatorFeature[]> {
  assertOperator(ctx);
  const all = (await rows()).filter((r) => isCode(r.code));
  const byCode = new Map(all.map((r) => [r.code, r]));
  const changers = [...new Set(all.map((r) => r.changedByUserId).filter((id): id is string => Boolean(id)))];
  const names = new Map((changers.length ? await db.user.findMany({ where: { id: { in: changers } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  const out: OperatorFeature[] = [];
  for (const code of PLATFORM_FEATURES) {
    const row = byCode.get(code);
    out.push({
      code,
      enabled: row?.enabled ?? false,
      changedAt: row?.changedAt ? row.changedAt.toISOString() : null,
      changedByName: row?.changedByUserId ? (names.get(row.changedByUserId) ?? null) : null,
      count: await explainingCount(ctx, code, now),
    });
  }
  return out;
}

/**
 * Switch one feature on or off. The operator's alone (the app admin does not get this switch). Idempotent:
 * switching to what stands changes nothing and writes no audit row. Audited in the operator's own log
 * (no school) as "operator.feature.on" or "operator.feature.off".
 */
export async function setFeature(ctx: ActiveContext, code: FeatureCode, on: boolean): Promise<{ code: FeatureCode; enabled: boolean; changed: boolean }> {
  assertOperator(ctx);
  if (!isCode(code)) throw new AccessError("platformFeatures.unknown", "NOT_FOUND");
  await rows();
  const now = new Date();
  const { count } = await db.platformFeature.updateMany({ where: { code, enabled: !on }, data: { enabled: on, changedAt: now, changedByUserId: ctx.user.id } });
  if (count === 0) return { code, enabled: on, changed: false };
  if (on) await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.feature.on", targetType: "PlatformFeature", targetId: code, meta: { feature: code } });
  else await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.feature.off", targetType: "PlatformFeature", targetId: code, meta: { feature: code } });
  return { code, enabled: on, changed: true };
}
