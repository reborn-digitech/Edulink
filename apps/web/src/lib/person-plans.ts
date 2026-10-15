import "server-only";
import { cache } from "react";
import {
  PERSON_PLANS,
  PLAN_FEATURES,
  PLATFORM_FEATURES,
  PLAN_PRICE_MAX_PAISE,
  type Entitlement as EntitlementView,
  type FeatureCode,
  type OperatorPersonPlan,
  type PlanCode,
} from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./access-error";
import { forUser } from "./tenant-context";
import type { Role } from "./constants";
import type { ActiveContext } from "./session";

export { PERSON_PLANS, PLAN_FEATURES, type PlanCode };

/**
 * PLANS SOLD PER PERSON (the owner's decisions of 15–16 October 2026; docs/decisions/0006-plans-and-paid-seats.md).
 *
 * Three plans — STUDENT, TEACHER, EXPERT — each a price list row (PersonPlan) and, per person, one Entitlement row
 * per feature for a window. A person may use a feature that needs a plan while an unrevoked row covers now. This
 * file is the one writer of both tables; the question every gated surface asks stays `mayUse` in
 * platform-features.ts, which ANDs `planLockFor` below into the platform switch.
 *
 * Not the plans a SCHOOL is put on (caps and a recorded price, the `Plan` table, src/lib/plans.ts): those are the
 * school's and older. The brief named this table's home "src/lib/plans.ts"; it lives here so the two kinds of plan
 * do not share a file.
 *
 * THE TABLE — which features need a plan, by the role on the session. Everything not in it needs no plan: an
 * office's or a head's doors, a school posting a vacancy, a guardian (who reads a child's practice only while the
 * CHILD is entitled: platform-features.ts `assertChildMayUse`), the family booking a seat (sold per seat, never in
 * a plan), a college's staff roles, the operator and the content team.
 *
 *   STUDENT  → QUESTION_BANK, ASSISTANT                                     (the STUDENT plan)
 *   TEACHER  → QUESTION_GIG, TEACHER_SESSIONS (offering), JOB_BOARD (reading), ASSISTANT   (the TEACHER plan)
 *   EXPERT   → EXPERT_SESSIONS (offering)                                   (the EXPERT plan)
 *
 * AN INACTIVE PLAN ASKS NOTHING. The rows are created inactive at no price; while a plan is inactive its features
 * follow the platform switch alone, exactly as before this file existed, so the migration locks nobody out. The
 * operator makes a plan active at /root/features when it is to be asked for (the builder's reading of "active",
 * written in the report for the owner to confirm).
 */
export const PLAN_TABLE: Readonly<Partial<Record<Role, { plan: PlanCode; features: readonly FeatureCode[] }>>> = {
  STUDENT: { plan: "STUDENT", features: PLAN_FEATURES.STUDENT },
  TEACHER: { plan: "TEACHER", features: PLAN_FEATURES.TEACHER },
  EXPERT: { plan: "EXPERT", features: PLAN_FEATURES.EXPERT },
};

/** The plan this role must hold for this feature, or null when the feature needs none for the role (a role-less call included). */
export function planNeeded(role: Role | null | undefined, code: FeatureCode): PlanCode | null {
  if (!role) return null;
  const row = PLAN_TABLE[role];
  return row && row.features.includes(code) ? row.plan : null;
}

const isPlan = (code: string): code is PlanCode => (PERSON_PLANS as readonly string[]).includes(code);
const isFeature = (code: string): code is FeatureCode => (PLATFORM_FEATURES as readonly string[]).includes(code);

/** The words of a plan, for the card, the account page and the operator's page. */
export const PLAN_NAME_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "plans.nameStudent", TEACHER: "plans.nameTeacher", EXPERT: "plans.nameExpert" };
export const PLAN_WHO_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "plans.whoStudent", TEACHER: "plans.whoTeacher", EXPERT: "plans.whoExpert" };

/* -------------------------------------------------------------------------- */
/* For the test suites                                                         */
/* -------------------------------------------------------------------------- */

/**
 * FOR THE TEST SUITES ONLY, like platform-features.ts setFeaturesForTests: the suites run against the developer's
 * own database, where the operator may have made a plan active, and a suite about practice must not start failing
 * 402 because of it. While VITEST is set and nothing was asked, NO plan is active; a suite about plans names the
 * active ones, or passes null to read the table. Never read by a running server.
 */
const TEST_KEY = "__edulinkActivePlansForTests";
export function setActivePlansForTests(active: readonly PlanCode[] | null): void {
  if (!process.env.VITEST) throw new Error("setActivePlansForTests is for the test suites alone");
  (globalThis as Record<string, unknown>)[TEST_KEY] = active ? [...active] : "table";
}
function activePlansForTests(): PlanCode[] | null {
  if (!process.env.VITEST) return null;
  const value = (globalThis as Record<string, unknown>)[TEST_KEY];
  if (value === "table") return null;
  return Array.isArray(value) ? (value as PlanCode[]) : [];
}

/* -------------------------------------------------------------------------- */
/* Reading: the plans and a person's entitlements                              */
/* -------------------------------------------------------------------------- */

type PlanRow = { id: string; code: string; pricePaise: number; yearlyPricePaise: number; features: unknown; active: boolean; updatedAt: Date; updatedByUserId: string | null };
const PLAN_SELECT = { id: true, code: true, pricePaise: true, yearlyPricePaise: true, features: true, active: true, updatedAt: true, updatedByUserId: true } as const;

/** The three plan rows, the missing ones created first (inactive, at no price, with the contracts' features). */
async function planRows(): Promise<PlanRow[]> {
  const found = await db.personPlan.findMany({ select: PLAN_SELECT });
  const missing = PERSON_PLANS.filter((code) => !found.some((r) => r.code === code));
  if (missing.length === 0) return found;
  await db.personPlan.createMany({ data: missing.map((code) => ({ code, features: [...PLAN_FEATURES[code]], active: false })), skipDuplicates: true });
  return db.personPlan.findMany({ select: PLAN_SELECT });
}

/** The features a plan row opens, held to the contracts' list. */
function featuresOfRow(row: Pick<PlanRow, "code" | "features">): FeatureCode[] {
  const raw = Array.isArray(row.features) ? row.features : [];
  const listed = raw.filter((f): f is FeatureCode => typeof f === "string" && isFeature(f));
  return listed.length ? listed : isPlan(row.code) ? [...PLAN_FEATURES[row.code]] : [];
}

/** The plans the operator has made active. Read once per request. */
export const activePlans = cache(async (): Promise<ReadonlySet<PlanCode>> => {
  const forTests = activePlansForTests();
  if (forTests) return new Set(forTests);
  return new Set((await planRows()).filter((r) => r.active && isPlan(r.code)).map((r) => r.code as PlanCode));
});

/** Whether a row covers this instant: unrevoked, started, not yet ended. */
export function covers(row: { validFrom: Date; validTo: Date; revokedAt: Date | null }, now: Date): boolean {
  return !row.revokedAt && row.validFrom.getTime() <= now.getTime() && now.getTime() < row.validTo.getTime();
}

/** The features this person holds an entitlement for now. One indexed read, cached per request. */
export const entitledFeatures = cache(async (userId: string): Promise<ReadonlySet<FeatureCode>> => {
  const now = new Date();
  const rows = await db.entitlement.findMany({
    where: { userId, revokedAt: null, validFrom: { lte: now }, validTo: { gt: now } },
    select: { feature: true },
  });
  return new Set(rows.map((r) => r.feature).filter(isFeature));
});

/**
 * THE PLAN THIS PERSON LACKS FOR THIS FEATURE, or null: null when the feature needs no plan for the role, when that
 * plan is not active, or when the person holds an entitlement covering now. Does not read the platform switch —
 * `mayUse` (platform-features.ts) does that first.
 */
export async function planLockFor(code: FeatureCode, who: { userId: string | null; role?: Role | null }): Promise<PlanCode | null> {
  const plan = planNeeded(who.role, code);
  if (!plan) return null;
  if (!(await activePlans()).has(plan)) return null;
  if (!who.userId) return plan;
  return (await entitledFeatures(who.userId)).has(code) ? null : plan;
}

/** What the plan card shows: the prices and what the plan includes. */
export async function planForCard(code: PlanCode): Promise<{ code: PlanCode; pricePaise: number; yearlyPricePaise: number; features: FeatureCode[] }> {
  const row = (await planRows()).find((r) => r.code === code);
  return { code, pricePaise: row?.pricePaise ?? 0, yearlyPricePaise: row?.yearlyPricePaise ?? 0, features: row ? featuresOfRow(row) : [...PLAN_FEATURES[code]] };
}

/** The account page's "Your plan": each plan the person holds now, with the day it runs to (the latest window). */
export async function myPlans(userId: string, now: Date = new Date()): Promise<{ plan: PlanCode; validTo: Date }[]> {
  const rows = await db.entitlement.findMany({
    where: { userId, revokedAt: null, validFrom: { lte: now }, validTo: { gt: now }, planCode: { not: null } },
    select: { planCode: true, validTo: true },
  });
  const latest = new Map<PlanCode, Date>();
  for (const r of rows) {
    if (!r.planCode || !isPlan(r.planCode)) continue;
    const was = latest.get(r.planCode);
    if (!was || r.validTo > was) latest.set(r.planCode, r.validTo);
  }
  return PERSON_PLANS.filter((p) => latest.has(p)).map((plan) => ({ plan, validTo: latest.get(plan)! }));
}

/* -------------------------------------------------------------------------- */
/* The operator                                                                */
/* -------------------------------------------------------------------------- */

function assertOperator(ctx: ActiveContext): void {
  // "Not here" to anyone else, as every operator door says (superuser.ts assertSuperuser).
  if (!ctx.user.isSuperuser) throw new AccessError("access.thisAreaBelongsToWhoeverRunsThe", "NOT_FOUND");
}

const DAY_MS = 86_400_000;
export const EXPIRING_SOON_DAYS = 7;

/** Each plan for /root/features and GET /api/v1/operator/plans: prices, active, who changed it, and how many hold it. */
export async function listPersonPlans(ctx: ActiveContext, now: Date = new Date()): Promise<OperatorPersonPlan[]> {
  assertOperator(ctx);
  const rows = await planRows();
  const changers = [...new Set(rows.map((r) => r.updatedByUserId).filter((id): id is string => Boolean(id)))];
  const names = new Map((changers.length ? await db.user.findMany({ where: { id: { in: changers } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  // The latest window each person holds per plan, now: one grouped read.
  const live = await db.entitlement.groupBy({
    by: ["planCode", "userId"],
    where: { revokedAt: null, validFrom: { lte: now }, validTo: { gt: now }, planCode: { not: null } },
    _max: { validTo: true },
  });
  const soon = now.getTime() + EXPIRING_SOON_DAYS * DAY_MS;
  const out: OperatorPersonPlan[] = [];
  for (const code of PERSON_PLANS) {
    const row = rows.find((r) => r.code === code);
    const holders = live.filter((l) => l.planCode === code);
    out.push({
      code,
      pricePaise: row?.pricePaise ?? 0,
      yearlyPricePaise: row?.yearlyPricePaise ?? 0,
      features: row ? featuresOfRow(row) : [...PLAN_FEATURES[code]],
      active: row?.active ?? false,
      updatedAt: row?.updatedByUserId ? row.updatedAt.toISOString() : null,
      updatedByName: row?.updatedByUserId ? (names.get(row.updatedByUserId) ?? null) : null,
      entitledNow: holders.length,
      expiringSoon: holders.filter((h) => h._max.validTo && h._max.validTo.getTime() <= soon).length,
    });
  }
  return out;
}

export type PlanChange = { code: PlanCode; pricePaise?: number; yearlyPricePaise?: number; active?: boolean };

/**
 * Change one plan's prices or its active switch. The operator's alone. A field left out stays; a change to what
 * stands writes nothing. Audited "operator.plan.update" with what was and what is.
 */
export async function setPersonPlan(ctx: ActiveContext, change: PlanChange): Promise<{ plan: OperatorPersonPlan; changed: boolean }> {
  assertOperator(ctx);
  if (!isPlan(change.code)) throw new AccessError("plans.unknownPlan", "NOT_FOUND");
  for (const price of [change.pricePaise, change.yearlyPricePaise]) {
    if (price !== undefined && (!Number.isInteger(price) || price < 0 || price > PLAN_PRICE_MAX_PAISE)) throw new AccessError("plans.priceInvalid");
  }
  const row = (await planRows()).find((r) => r.code === change.code);
  if (!row) throw new AccessError("plans.unknownPlan", "NOT_FOUND");
  const next = {
    pricePaise: change.pricePaise ?? row.pricePaise,
    yearlyPricePaise: change.yearlyPricePaise ?? row.yearlyPricePaise,
    active: change.active ?? row.active,
  };
  const changed = next.pricePaise !== row.pricePaise || next.yearlyPricePaise !== row.yearlyPricePaise || next.active !== row.active;
  if (changed) {
    await db.personPlan.update({ where: { id: row.id }, data: { ...next, updatedByUserId: ctx.user.id } });
    await audit({
      schoolId: null,
      actorUserId: ctx.user.id,
      action: "operator.plan.update",
      targetType: "PersonPlan",
      targetId: change.code,
      meta: { plan: change.code, before: { pricePaise: row.pricePaise, yearlyPricePaise: row.yearlyPricePaise, active: row.active }, after: next },
    });
  }
  const plan = (await listPersonPlans(ctx)).find((p) => p.code === change.code)!;
  return { plan, changed };
}

function personByEmail(email: string) {
  return db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, name: true, email: true } });
}

/** Months after a day, held to the month's end (31 January plus one month is 28 or 29 February). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export type GrantInput = { email: string; plan: PlanCode; months: 1 | 3 | 6 | 12; note?: string | null };

/**
 * THE OPERATOR'S GRANT: a plan to a person by email for 1, 3, 6 or 12 months, one GRANT row per feature of the
 * plan. A grant to somebody already holding the plan starts where their latest window ends, so two grants add up
 * rather than overlap. Audited "operator.entitlement.grant"; the person is told in the app.
 */
export async function grantPlan(ctx: ActiveContext, input: GrantInput, now: Date = new Date()): Promise<{ userId: string; plan: PlanCode; validFrom: Date; validTo: Date; created: number }> {
  assertOperator(ctx);
  if (!isPlan(input.plan)) throw new AccessError("plans.unknownPlan", "NOT_FOUND");
  if (![1, 3, 6, 12].includes(input.months)) throw new AccessError("plans.monthsInvalid");
  const person = await personByEmail(input.email);
  if (!person) throw new AccessError("plans.grantNoAccount", "NOT_FOUND");
  const row = (await planRows()).find((r) => r.code === input.plan);
  const features = row ? featuresOfRow(row) : [...PLAN_FEATURES[input.plan]];
  const latest = await db.entitlement.aggregate({ where: { userId: person.id, planCode: input.plan, revokedAt: null, validTo: { gt: now } }, _max: { validTo: true } });
  const validFrom = latest._max.validTo && latest._max.validTo > now ? latest._max.validTo : now;
  const validTo = addMonths(validFrom, input.months);
  const note = input.note?.trim() ? input.note.trim().slice(0, 300) : null;
  // One statement: every feature of the plan or none.
  const { count } = await db.entitlement.createMany({
    data: features.map((feature) => ({ userId: person.id, feature, source: "GRANT", planCode: input.plan, validFrom, validTo, grantedByUserId: ctx.user.id, note })),
  });
  await audit({
    schoolId: null,
    actorUserId: ctx.user.id,
    action: "operator.entitlement.grant",
    targetType: "User",
    targetId: person.id,
    meta: { plan: input.plan, months: input.months, validFrom: validFrom.toISOString(), validTo: validTo.toISOString(), features, note },
  });
  // A notice that belongs to no school, written as the person (expert-kyc.ts's way); a failed notice never fails the grant.
  await forUser(person.id, () => notify({ userId: person.id, schoolId: null, kind: "SYSTEM", titleKey: GRANTED_KEY[input.plan], url: "/account/plan" })).catch((error) => console.error("[person-plans] grant notice failed", error));
  return { userId: person.id, plan: input.plan, validFrom, validTo, created: count };
}

const GRANTED_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "plans.notifGrantedStudent", TEACHER: "plans.notifGrantedTeacher", EXPERT: "plans.notifGrantedExpert" };
const ENDED_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "plans.notifEndedStudent", TEACHER: "plans.notifEndedTeacher", EXPERT: "plans.notifEndedExpert" };

/** One person's entitlements for the operator's list, newest first; `person` null when no account has the address. */
export async function listEntitlements(ctx: ActiveContext, email: string, now: Date = new Date()): Promise<{ person: { id: string; name: string; email: string } | null; entitlements: EntitlementView[] }> {
  assertOperator(ctx);
  const person = await personByEmail(email);
  if (!person) return { person: null, entitlements: [] };
  const rows = await db.entitlement.findMany({ where: { userId: person.id }, orderBy: [{ createdAt: "desc" }, { feature: "asc" }], take: 200 });
  const granters = [...new Set(rows.map((r) => r.grantedByUserId).filter((id): id is string => Boolean(id)))];
  const names = new Map((granters.length ? await db.user.findMany({ where: { id: { in: granters } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  return {
    person: { id: person.id, name: person.name, email: person.email ?? email },
    entitlements: rows
      .filter((r) => isFeature(r.feature))
      .map((r) => ({
        id: r.id,
        feature: r.feature as FeatureCode,
        source: r.source as EntitlementView["source"],
        planCode: r.planCode && isPlan(r.planCode) ? r.planCode : null,
        validFrom: r.validFrom.toISOString(),
        validTo: r.validTo.toISOString(),
        grantedByName: r.grantedByUserId ? (names.get(r.grantedByUserId) ?? null) : null,
        note: r.note,
        revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        live: covers(r, now),
      })),
  };
}

/** End one entitlement now. Revoking a revoked row changes nothing and writes nothing. Audited "operator.entitlement.revoke". */
export async function revokeEntitlement(ctx: ActiveContext, id: string, now: Date = new Date()): Promise<{ id: string; revokedAt: Date; changed: boolean }> {
  assertOperator(ctx);
  const row = await db.entitlement.findUnique({ where: { id }, select: { id: true, userId: true, feature: true, planCode: true, revokedAt: true } });
  if (!row) throw new AccessError("plans.entitlementNotFound", "NOT_FOUND");
  if (row.revokedAt) return { id, revokedAt: row.revokedAt, changed: false };
  const { count } = await db.entitlement.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: now, revokedByUserId: ctx.user.id } });
  if (count === 0) {
    const again = await db.entitlement.findUniqueOrThrow({ where: { id }, select: { revokedAt: true } });
    return { id, revokedAt: again.revokedAt ?? now, changed: false };
  }
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.entitlement.revoke", targetType: "Entitlement", targetId: id, meta: { userId: row.userId, feature: row.feature, plan: row.planCode } });
  return { id, revokedAt: now, changed: true };
}

/* -------------------------------------------------------------------------- */
/* The job                                                                     */
/* -------------------------------------------------------------------------- */

/** The first instant of the day in India, where every school on the platform is. */
function dayStartIndia(now: Date): Date {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 330 * 60_000);
}

/** How far back the job looks for a window it has not yet told anybody about: yesterday's, and a week of missed runs. */
export const EXPIRE_LOOKBACK_DAYS = 7;

/**
 * THE plans:expire JOB (04:20 daily): every window that ended before today began (India time) — yesterday's, and
 * any the job missed in the week before — and was not revoked is told once: an audit line "plans.entitlement.end"
 * per person and plan, and a notice in the app (in-app only; texts are not this job's). A person who holds the
 * plan again (a grant that started where this one ended) is not told; the row is marked either way, so a second
 * run tells nobody twice. `scope.userIds` narrows it to a test's own people.
 */
export async function expireEntitlements(now: Date = new Date(), scope: { userIds?: string[] } = {}): Promise<{ ended: number; told: number; renewed: number }> {
  const todayStart = dayStartIndia(now);
  const since = new Date(todayStart.getTime() - EXPIRE_LOOKBACK_DAYS * DAY_MS);
  const rows = await db.entitlement.findMany({
    where: { revokedAt: null, endNotedAt: null, validTo: { gte: since, lt: todayStart }, ...(scope.userIds ? { userId: { in: scope.userIds } } : {}) },
    select: { id: true, userId: true, feature: true, planCode: true, source: true, validTo: true },
  });
  // One notice per person and plan (a SEAT row is its own).
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.userId}|${r.planCode ?? `seat:${r.id}`}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  let told = 0;
  let renewed = 0;
  for (const group of groups.values()) {
    const first = group[0]!;
    const features = [...new Set(group.map((r) => r.feature))];
    // Held again now (a later window covers every feature that ended)? Then nothing ended for the person.
    const stillHeld = await db.entitlement.count({ where: { userId: first.userId, feature: { in: features }, revokedAt: null, validFrom: { lte: now }, validTo: { gt: now } } });
    const ids = group.map((r) => r.id);
    const { count } = await db.entitlement.updateMany({ where: { id: { in: ids }, endNotedAt: null }, data: { endNotedAt: now } });
    if (count === 0) continue; // another run took them
    if (stillHeld >= features.length) {
      renewed += 1;
      continue;
    }
    await audit({ schoolId: null, actorUserId: null, action: "plans.entitlement.end", targetType: "User", targetId: first.userId, meta: { plan: first.planCode, source: first.source, features, endedAt: first.validTo.toISOString() } });
    if (first.planCode && isPlan(first.planCode)) {
      const userId = first.userId;
      const titleKey = ENDED_KEY[first.planCode];
      await forUser(userId, () => notify({ userId, schoolId: null, kind: "SYSTEM", titleKey, url: "/account/plan" }))
        .then(() => (told += 1))
        .catch((error) => console.error("[person-plans] ended notice failed", error));
    }
  }
  return { ended: rows.length, told, renewed };
}
