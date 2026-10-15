import "server-only";
import { cache } from "react";
import { PLATFORM_FEATURES, type FeatureCode, type OperatorFeature } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, FeatureOffError } from "./access-error";
import { forTenant } from "./tenant-context";
import type { ActiveContext } from "./session";

export { PLATFORM_FEATURES, type FeatureCode };

/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026).
 *
 * Seven parts of the platform — the assistant, the question bank's practice, the teachers' question gig,
 * expert sessions, teacher sessions, the job board and text messaging — are dark on the WHOLE platform
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
 * THE SEAM FOR WHAT COMES NEXT: the operator will sell student, teacher and expert subscriptions that
 * open a feature per person. That check is ANDed into `mayUse` below — the one function every gated
 * surface reaches — so no gated page or door has to be touched again. Today it is the platform switch.
 */

export type Who = { userId: string | null; schoolId: string | null };
/** A session, or the person and school it is about; null for a call with nobody behind it (a job, the gate before a session). */
export type WhoLike = Who | Pick<ActiveContext, "user" | "schoolId"> | null | undefined;

function whoOf(who: WhoLike): Who {
  if (!who) return { userId: null, schoolId: null };
  if ("user" in who) return { userId: who.user.id, schoolId: who.schoolId };
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

/**
 * MAY THIS PERSON USE THIS FEATURE HERE? The only question a gated surface asks. Today it is the platform
 * switch alone; the per-person subscription check of the next task is ANDed in here, with `who`.
 */
export async function mayUse(code: FeatureCode, who: WhoLike): Promise<boolean> {
  void whoOf(who); // the person and the school the per-person entitlement will read
  return featureOn(code);
}

/** Whether any of `codes` may be used: a page two features share (the family's /sessions, the office's). */
export async function mayUseAny(codes: readonly FeatureCode[], who: WhoLike): Promise<boolean> {
  for (const code of codes) if (await mayUse(code, who)) return true;
  return false;
}

/** The features this person may use: /api/v1/me's `features` and the shell's nav. */
export async function featuresFor(who: WhoLike): Promise<FeatureCode[]> {
  const out: FeatureCode[] = [];
  for (const code of PLATFORM_FEATURES) if (await mayUse(code, who)) out.push(code);
  return out;
}

/** Throws FeatureOffError (404, code FEATURE_OFF at the API; the app's 404 on a page) unless `code` may be used. */
export async function assertFeatureOn(code: FeatureCode, who: WhoLike): Promise<void> {
  if (!(await mayUse(code, who))) throw new FeatureOffError(code);
}

/** …unless any of `codes` may be used. */
export async function assertAnyFeatureOn(codes: readonly FeatureCode[], who: WhoLike): Promise<void> {
  if (!(await mayUseAny(codes, who))) throw new FeatureOffError(codes[0]!);
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
