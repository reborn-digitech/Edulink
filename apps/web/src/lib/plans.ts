import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { forTenant } from "./tenant-context";
import { AccessError } from "./tenancy";
import { assertSuperuser } from "./superuser";
import { todayKey, zonedStartOfDay } from "./dates";
import { readAttachments, readMedia } from "./files";
import { blobStore } from "./blob-store";
import type { ActiveContext } from "./session";

/**
 * Plans and metering.
 *
 * A PLAN IS FOUR CAPS AND A NAME. The operator writes them; a school is put
 * on one (audited, and the school's office told); and once a night the
 * usage:sample job writes what each school used that month — pupils on the
 * roll, texts sent, bytes held, people active — as one UsageSample row per
 * school and month, which is the ONE WRITER of that table. The operator
 * reads every school's row against its plan's caps; the office reads its
 * own. The price on a plan is a number the operator records so the page can
 * say what a school is on; nothing here collects it (decision 0003).
 *
 * THE CAP THAT ALREADY EXISTED keeps working: messaging.ts reads the
 * school's monthly text cap through `effectiveMessageCap`, which is the
 * plan's when the school has a plan and the school's own value otherwise.
 * Nothing else is enforced by a cap here — the operator's usage page flags a
 * school over its plan; it does not refuse the school its sixtieth pupil.
 */

/* -------------------------------------------------------------------------- */
/* Plans                                                                       */
/* -------------------------------------------------------------------------- */

export type PlanInput = {
  code: string;
  name: string;
  pupilCap?: number | null;
  messageCap?: number | null;
  storageCapMb?: number | null;
  priceMonthlyPaise?: number | null;
};

export type PlanRow = {
  id: string;
  code: string;
  name: string;
  pupilCap: number | null;
  messageCap: number | null;
  storageCapMb: number | null;
  priceMonthlyPaise: number | null;
  createdAt: Date;
  /** Live schools on the plan. */
  schools: number;
};

export type PlanResult = { ok: true; planId: string } | { ok: false; errorKey: TranslationKey };

const PLAN_SELECT = { id: true, code: true, name: true, pupilCap: true, messageCap: true, storageCapMb: true, priceMonthlyPaise: true, createdAt: true } as const;

/** Every plan, oldest first, with how many live schools are on each. */
export async function listPlans(session: ActiveContext): Promise<PlanRow[]> {
  assertSuperuser(session);
  const [plans, counts] = await Promise.all([
    db.plan.findMany({ orderBy: { createdAt: "asc" }, select: PLAN_SELECT }),
    db.school.groupBy({ by: ["planId"], where: { planId: { not: null }, removedAt: null }, _count: { _all: true } }),
  ]);
  const onPlan = new Map(counts.map((c) => [c.planId, c._count._all]));
  return plans.map((p) => ({ ...p, schools: onPlan.get(p.id) ?? 0 }));
}

function cap(value: number | null | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0) throw new AccessError("root.planCapInvalid");
  return value;
}

export async function createPlan(session: ActiveContext, input: PlanInput): Promise<PlanResult> {
  assertSuperuser(session);
  const code = input.code.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(code)) return { ok: false, errorKey: "root.planCodeInvalid" };
  if (!name) return { ok: false, errorKey: "root.planNameRequired" };
  if (await db.plan.findUnique({ where: { code }, select: { id: true } })) return { ok: false, errorKey: "root.planCodeTaken" };
  const plan = await db.plan.create({
    data: {
      code,
      name,
      pupilCap: cap(input.pupilCap) ?? null,
      messageCap: cap(input.messageCap) ?? null,
      storageCapMb: cap(input.storageCapMb) ?? null,
      priceMonthlyPaise: cap(input.priceMonthlyPaise) ?? null,
    },
    select: { id: true },
  });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.plan.create", targetType: "Plan", targetId: plan.id, meta: { code, name } });
  return { ok: true, planId: plan.id };
}

export async function updatePlan(session: ActiveContext, planId: string, input: Partial<PlanInput>): Promise<PlanResult> {
  assertSuperuser(session);
  const existing = await db.plan.findUnique({ where: { id: planId }, select: { id: true, code: true } });
  if (!existing) return { ok: false, errorKey: "root.noSuchPlan" };
  const data: Partial<PlanInput> = {};
  if (input.code !== undefined) {
    const code = input.code.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(code)) return { ok: false, errorKey: "root.planCodeInvalid" };
    if (code !== existing.code && (await db.plan.findUnique({ where: { code }, select: { id: true } }))) return { ok: false, errorKey: "root.planCodeTaken" };
    data.code = code;
  }
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false, errorKey: "root.planNameRequired" };
    data.name = name;
  }
  for (const key of ["pupilCap", "messageCap", "storageCapMb", "priceMonthlyPaise"] as const) {
    const value = cap(input[key]);
    if (value !== undefined) data[key] = value;
  }
  if (Object.keys(data).length === 0) return { ok: true, planId };
  await db.plan.update({ where: { id: planId }, data });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.plan.update", targetType: "Plan", targetId: planId, meta: { ...data } });
  return { ok: true, planId };
}

/** A plan with a school on it stays: take the schools off first. */
export async function deletePlan(session: ActiveContext, planId: string): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);
  const existing = await db.plan.findUnique({ where: { id: planId }, select: { id: true, code: true } });
  if (!existing) return { ok: false, errorKey: "root.noSuchPlan" };
  const onIt = await db.school.count({ where: { planId } });
  if (onIt > 0) return { ok: false, errorKey: "root.planInUse" };
  await db.plan.delete({ where: { id: planId } });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.plan.delete", targetType: "Plan", targetId: planId, meta: { code: existing.code } });
  return { ok: true };
}

/**
 * Puts a school on a plan, or takes it off every plan (null). Audited twice
 * like an admin invitation: the operator's own unattributed row, and a row
 * bound to the school so its Safety Centre says the plan changed. The
 * school's office and head are told through a notification.
 */
export async function assignPlan(session: ActiveContext, schoolId: string, planId: string | null): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, removedAt: true, planId: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  const plan = planId ? await db.plan.findUnique({ where: { id: planId }, select: { id: true, code: true, name: true } }) : null;
  if (planId && !plan) return { ok: false, errorKey: "root.noSuchPlan" };
  if (school.planId === (plan?.id ?? null)) return { ok: true };

  await db.school.update({ where: { id: schoolId }, data: { planId: plan?.id ?? null, planSince: plan ? new Date() : null } });

  const meta = { schoolId, name: school.name, planId: plan?.id ?? null, planCode: plan?.code ?? null };
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.plan", targetType: "School", targetId: schoolId, meta });
  await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.plan", targetType: "School", targetId: schoolId, meta: { planCode: plan?.code ?? null, planName: plan?.name ?? null } });

  // Told, best-effort: a notification that fails to write must not undo the plan.
  try {
    const { notify } = await import("./notify");
    await forTenant({ schoolIds: [schoolId], userId: session.user.id, joinCode: null, isSuperuser: true }, async () => {
      const office = await db.membership.findMany({
        where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
        select: { userId: true },
        distinct: ["userId"],
      });
      for (const member of office) {
        await notify({
          userId: member.userId,
          schoolId,
          kind: "SYSTEM",
          titleKey: plan ? "notifTitle.schoolPlanSet" : "notifTitle.schoolPlanCleared",
          titleVars: { school: school.name, plan: plan?.name ?? "" },
          bodyKey: plan ? "notifBody.schoolPlanSet" : "notifBody.schoolPlanCleared",
          bodyVars: { school: school.name, plan: plan?.name ?? "" },
          url: "/admin/safety",
          meta: { event: "school.plan" },
        });
      }
    });
  } catch (error) {
    console.error("[plans] school.plan notification failed", error instanceof Error ? error.message : error);
  }
  return { ok: true };
}

/**
 * The monthly text cap in force: the plan's when the school is on a plan
 * that states one, else the school's own setting. Read by messaging.ts
 * before every text, so a school put on a smaller plan is held to it the
 * same night.
 */
export async function effectiveMessageCap(schoolId: string, client: Pick<typeof db, "school"> = db): Promise<number> {
  const s = await client.school.findUniqueOrThrow({ where: { id: schoolId }, select: { msgMonthlyCap: true, plan: { select: { messageCap: true } } } });
  return s.plan?.messageCap ?? s.msgMonthlyCap;
}

/* -------------------------------------------------------------------------- */
/* Usage                                                                       */
/* -------------------------------------------------------------------------- */

export type UsageCounts = { pupils: number; messages: number; storageMb: number; activeUsers: number };

/** The YYYY-MM holding `now` in a school's own clock. */
export function monthKeyFor(timezone: string, now: Date = new Date()): string {
  return todayKey(timezone, now).slice(0, 7);
}

/** The first instant of a YYYY-MM and of the month after it, in a zone. */
export function monthBounds(month: string, timezone: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start: zonedStartOfDay(`${month}-01`, timezone), end: zonedStartOfDay(`${next}-01`, timezone) };
}

/**
 * Every stored original's size by file id, listed once for a whole run: a
 * school's storage is the bytes of the files its own rows name. A store that
 * cannot be listed (no directory yet, a refused bucket) is an empty map, and
 * every school's storage reads 0 that night rather than the job failing.
 */
export async function loadStoredSizes(): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  const store = blobStore("files");
  if (!(await store.probe())) return sizes;
  for await (const object of store.list()) {
    const entry = object.name.split("/").pop() ?? object.name;
    sizes.set(entry, object.size);
  }
  return sizes;
}

/**
 * One school's counts for one month, from the rows themselves. Needs no
 * tenant binding of its own: the job runs as the owner and the data audit
 * does too; called from a request it reads under whatever the request bound.
 *
 *   pupils      — STUDENT memberships on the roll at the end of the month
 *                 (joined before it ended, not left before it ended); the
 *                 running month counts today's roll.
 *   messages    — segments of texts QUEUED/SENT/DELIVERED/UNDELIVERED in the
 *                 school's month, the figure the cap is held against.
 *   storageMb   — bytes of the originals the school's posts, assignments,
 *                 submissions and logo name, rounded up to the megabyte.
 *   activeUsers — people whose session was seen in the month while bound to
 *                 the school, or who belong to the school.
 */
export async function computeUsage(schoolId: string, month: string, opts: { sizes?: Map<string, number>; now?: Date } = {}): Promise<UsageCounts> {
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, logoPath: true } });
  const { start, end } = monthBounds(month, school.timezone);
  const now = opts.now ?? new Date();
  const rollAt = end.getTime() < now.getTime() ? end : now;

  const [pupils, segments, members, sessions] = await Promise.all([
    db.membership.count({ where: { schoolId, role: "STUDENT", joinedAt: { lt: rollAt }, OR: [{ leftAt: null }, { leftAt: { gte: rollAt } }] } }),
    db.outboundMessage.aggregate({ where: { schoolId, status: { in: ["QUEUED", "SENT", "DELIVERED", "UNDELIVERED"] }, createdAt: { gte: start, lt: end } }, _sum: { segments: true } }),
    db.membership.findMany({ where: { schoolId }, select: { userId: true }, distinct: ["userId"] }),
    db.session.findMany({ where: { lastSeenAt: { gte: start, lt: end } }, select: { userId: true, activeSchoolId: true } }),
  ]);
  const memberIds = new Set(members.map((m) => m.userId));
  const active = new Set<string>();
  for (const s of sessions) if (s.activeSchoolId === schoolId || memberIds.has(s.userId)) active.add(s.userId);

  const sizes = opts.sizes ?? (await loadStoredSizes());
  const [assignments, submissions, posts] = await Promise.all([
    db.assignment.findMany({ where: { schoolId }, select: { attachments: true } }),
    db.submission.findMany({ where: { schoolId }, select: { attachments: true } }),
    db.post.findMany({ where: { schoolId }, select: { media: true } }),
  ]);
  const fileIds = new Set<string>();
  if (school.logoPath) fileIds.add(school.logoPath);
  for (const row of assignments) for (const a of readAttachments(row.attachments)) fileIds.add(a.fileId);
  for (const row of submissions) for (const a of readAttachments(row.attachments)) fileIds.add(a.fileId);
  for (const row of posts) for (const m of readMedia(row.media)) fileIds.add(m.fileId);
  let bytes = 0;
  for (const fileId of fileIds) bytes += sizes.get(fileId) ?? 0;

  return { pupils, messages: segments._sum.segments ?? 0, storageMb: Math.ceil(bytes / (1024 * 1024)), activeUsers: active.size };
}

/**
 * The nightly job: every live school's current month, one row each, upserted
 * so a rerun refreshes rather than duplicates. A school on a removed flag is
 * left alone. Counts only in the summary, never a name.
 */
export async function sampleUsage(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{ summary: { schools: number; written: number; overCap: number; skipped: number }; perSchool: Record<string, Record<string, number>> }> {
  const schools = await db.school.findMany({
    where: { removedAt: null, ...(scope.schoolIds ? { id: { in: scope.schoolIds } } : {}) },
    select: { id: true, timezone: true, plan: { select: { pupilCap: true, messageCap: true, storageCapMb: true } } },
  });
  const sizes = await loadStoredSizes();
  const perSchool: Record<string, Record<string, number>> = {};
  let written = 0;
  let overCap = 0;
  let skipped = 0;
  for (const school of schools) {
    const month = monthKeyFor(school.timezone, now);
    // A school erased between the list and its count (a test's fixture, a
    // shredded duplicate) is skipped and counted, not the whole night lost.
    let counts: UsageCounts;
    try {
      counts = await computeUsage(school.id, month, { sizes, now });
    } catch (error) {
      if (await db.school.findUnique({ where: { id: school.id }, select: { id: true } })) throw error;
      skipped++;
      continue;
    }
    try {
      await db.usageSample.upsert({
        where: { schoolId_month: { schoolId: school.id, month } },
        create: { schoolId: school.id, month, ...counts, computedAt: now },
        update: { ...counts, computedAt: now },
      });
    } catch (error) {
      if (await db.school.findUnique({ where: { id: school.id }, select: { id: true } })) throw error;
      skipped++;
      continue;
    }
    written++;
    const over = overCaps(counts, capsOf(school.plan));
    const flagged = over.pupils || over.messages || over.storageMb ? 1 : 0;
    overCap += flagged;
    perSchool[school.id] = { ...counts, overCap: flagged };
  }
  return { summary: { schools: schools.length, written, overCap, skipped }, perSchool };
}

export type UsageCaps = { pupils: number | null; messages: number | null; storageMb: number | null };
export type UsageOver = { pupils: boolean; messages: boolean; storageMb: boolean };

export function capsOf(plan: { pupilCap: number | null; messageCap: number | null; storageCapMb: number | null } | null | undefined): UsageCaps {
  return { pupils: plan?.pupilCap ?? null, messages: plan?.messageCap ?? null, storageMb: plan?.storageCapMb ?? null };
}

export function overCaps(counts: UsageCounts | null, caps: UsageCaps): UsageOver {
  const over = (value: number | undefined, limit: number | null) => value !== undefined && limit !== null && value > limit;
  return { pupils: over(counts?.pupils, caps.pupils), messages: over(counts?.messages, caps.messages), storageMb: over(counts?.storageMb, caps.storageMb) };
}

export type UsageRow = {
  schoolId: string;
  schoolName: string;
  month: string;
  plan: { id: string; code: string; name: string } | null;
  counts: UsageCounts | null;
  caps: UsageCaps;
  over: UsageOver;
  overCap: boolean;
  computedAt: Date | null;
};

/**
 * Every live school's month against its plan, over-cap first, for the
 * operator. The UsageSample policy lets the superuser read every school's
 * row (SUPERUSER_READABLE in scripts/gen-rls.ts); nothing else of the
 * school is read. Fixtures are left out as the school list leaves them out.
 */
export async function listUsage(session: ActiveContext, month?: string): Promise<{ month: string; items: UsageRow[]; sampled: number; overCap: number }> {
  assertSuperuser(session);
  // "This month" is UTC's: a school's row is keyed in its own calendar, so for
  // the few hours either side of a month's turn a school on the far side of
  // the date line reads "not written yet" here until the next night's run.
  const key = month ?? monthKeyFor("UTC");
  const [schools, samples] = await Promise.all([
    db.school.findMany({
      where: { removedAt: null, isTestFixture: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, plan: { select: { id: true, code: true, name: true, pupilCap: true, messageCap: true, storageCapMb: true } } },
    }),
    db.usageSample.findMany({ where: { month: key }, select: { schoolId: true, pupils: true, messages: true, storageMb: true, activeUsers: true, computedAt: true } }),
  ]);
  const bySchool = new Map(samples.map((s) => [s.schoolId, s]));
  const items: UsageRow[] = schools.map((s) => {
    const sample = bySchool.get(s.id) ?? null;
    const counts = sample ? { pupils: sample.pupils, messages: sample.messages, storageMb: sample.storageMb, activeUsers: sample.activeUsers } : null;
    const caps = capsOf(s.plan);
    const over = overCaps(counts, caps);
    return {
      schoolId: s.id,
      schoolName: s.name,
      month: key,
      plan: s.plan ? { id: s.plan.id, code: s.plan.code, name: s.plan.name } : null,
      counts,
      caps,
      over,
      overCap: over.pupils || over.messages || over.storageMb,
      computedAt: sample?.computedAt ?? null,
    };
  });
  items.sort((a, b) => Number(b.overCap) - Number(a.overCap) || a.schoolName.localeCompare(b.schoolName));
  return { month: key, items, sampled: items.filter((i) => i.counts !== null).length, overCap: items.filter((i) => i.overCap).length };
}

export type OfficeUsage = {
  month: string;
  plan: { id: string; code: string; name: string } | null;
  counts: UsageCounts | null;
  caps: UsageCaps;
  over: UsageOver;
  computedAt: Date | null;
  history: (UsageCounts & { month: string })[];
};

/**
 * One school's own usage: the running month against the plan and the twelve
 * months before it. Called by the office for its school and by the operator
 * for a school's page; the caller binds the school.
 */
export async function schoolUsage(schoolId: string, now: Date = new Date()): Promise<OfficeUsage> {
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true, plan: { select: { id: true, code: true, name: true, pupilCap: true, messageCap: true, storageCapMb: true } } },
  });
  const month = monthKeyFor(school.timezone, now);
  const rows = await db.usageSample.findMany({ where: { schoolId }, orderBy: { month: "desc" }, take: 13, select: { month: true, pupils: true, messages: true, storageMb: true, activeUsers: true, computedAt: true } });
  const current = rows.find((r) => r.month === month) ?? null;
  const counts = current ? { pupils: current.pupils, messages: current.messages, storageMb: current.storageMb, activeUsers: current.activeUsers } : null;
  const caps = capsOf(school.plan);
  return {
    month,
    plan: school.plan ? { id: school.plan.id, code: school.plan.code, name: school.plan.name } : null,
    counts,
    caps,
    over: overCaps(counts, caps),
    computedAt: current?.computedAt ?? null,
    history: rows.filter((r) => r.month !== month).map((r) => ({ month: r.month, pupils: r.pupils, messages: r.messages, storageMb: r.storageMb, activeUsers: r.activeUsers })),
  };
}

/** The office reads its own school's usage. */
export async function officeUsage(ctx: ActiveContext): Promise<OfficeUsage> {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) throw new AccessError("messaging.refuseOffice");
  return schoolUsage(ctx.schoolId);
}
