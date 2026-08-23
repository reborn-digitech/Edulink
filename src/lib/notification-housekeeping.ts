import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Notifications do not live forever.
 *
 * WHAT THREE YEARS LOOKED LIKE. The simulation left a pupil with "76 unread",
 * seventy-three of them three years old — "You have moved up" three times
 * over — because nothing ever read a notification on anyone's behalf and
 * nothing ever removed one. A badge that says 76 when the answer is 3 is a
 * badge people learn to ignore, which is the one thing a badge must not
 * teach.
 *
 * TWO RULES, AND THE ORDER THEY SIT IN.
 *
 *   - AUTO-READ AT NINETY DAYS. A notice nobody opened in a term is not
 *     going to be opened; it is marked read so the badge counts what is
 *     current. It is not deleted — it stays in the list, under "All", for
 *     anyone who goes looking.
 *   - EXPIRE READ ONES AT A YEAR. A read notification a year old is noise in
 *     a list whose job is to say what is new. Unread ones are NEVER deleted
 *     here, the same rule `clearRead` keeps: the app must not be able to
 *     make a message about a child vanish before anyone saw it. Because the
 *     first rule reads everything at ninety days, nothing survives past a
 *     year in practice; the split keeps each rule honest on its own.
 *
 * WHERE IT RUNS. There is no scheduler in this deployment, so the shell runs
 * it for whoever is signed in — a cheap indexed probe first, so on an
 * ordinary day it writes nothing — and `npm run notifications:tidy` runs it
 * for everyone, for the people a term passes without.
 *
 * PER SCHOOL, WHEN A SCHOOL SAYS SO. The two numbers are platform defaults;
 * a school may set its own (School.notifAutoReadDays / notifExpireDays),
 * and the tidy applies each school's numbers to THAT school's notices —
 * notices with no school (platform mail) keep the defaults. The rules
 * themselves do not bend: unread is still never deleted, expiry still runs
 * first.
 */

export const AUTO_READ_AFTER_DAYS = 90;
export const EXPIRE_READ_AFTER_DAYS = 365;

/** What a school may set its own numbers to — wide, but not nonsense. */
export const AUTO_READ_RANGE = { min: 7, max: 365 } as const;
export const EXPIRE_RANGE = { min: 30, max: 1095 } as const;

const DAY = 86_400_000;

export type TidyResult = { autoRead: number; expired: number };

type Thresholds = { autoReadDays: number; expireDays: number };

export function cutoffs(now: Date = new Date(), t: Thresholds = { autoReadDays: AUTO_READ_AFTER_DAYS, expireDays: EXPIRE_READ_AFTER_DAYS }) {
  return {
    autoReadBefore: new Date(now.getTime() - t.autoReadDays * DAY),
    expireBefore: new Date(now.getTime() - t.expireDays * DAY),
  };
}

/** The numbers in force for one school — its own where set, the defaults where not. */
export function effectiveThresholds(school: { notifAutoReadDays: number | null; notifExpireDays: number | null } | null): Thresholds {
  return {
    autoReadDays: school?.notifAutoReadDays ?? AUTO_READ_AFTER_DAYS,
    expireDays: school?.notifExpireDays ?? EXPIRE_READ_AFTER_DAYS,
  };
}

/** The buckets a tidy works in: every school with its OWN numbers, and one default bucket for the rest. */
async function customSchools(): Promise<{ id: string; t: Thresholds }[]> {
  const rows = await db.school.findMany({
    where: { OR: [{ notifAutoReadDays: { not: null } }, { notifExpireDays: { not: null } }] },
    select: { id: true, notifAutoReadDays: true, notifExpireDays: true },
  });
  return rows.map((s) => ({ id: s.id, t: effectiveThresholds(s) }));
}

/** One person's notifications, tidied. Safe to call on every page: probes before it writes. */
export async function tidyNotificationsFor(userId: string, now: Date = new Date()): Promise<TidyResult> {
  // One read of the (tiny) custom-school list, then TWO probes whose clauses
  // carry each bucket's OWN cutoff — so the ordinary visit still writes
  // nothing and costs three indexed reads, custom thresholds or not.
  const custom = await customSchools();
  const customIds = custom.map((c) => c.id);
  const buckets: { schoolWhere: object; t: Thresholds }[] = [
    // Everything with no custom numbers: other schools' notices and platform
    // mail with no school at all.
    { schoolWhere: customIds.length > 0 ? { OR: [{ schoolId: null }, { schoolId: { notIn: customIds } }] } : {}, t: effectiveThresholds(null) },
    ...custom.map((c) => ({ schoolWhere: { schoolId: c.id }, t: c.t })),
  ];

  const staleClauses = buckets.map((b) => ({ ...b.schoolWhere, createdAt: { lt: cutoffs(now, b.t).autoReadBefore } }));
  const oldClauses = buckets.map((b) => ({ ...b.schoolWhere, createdAt: { lt: cutoffs(now, b.t).expireBefore } }));
  const [maybeStale, maybeOld] = await Promise.all([
    db.notification.findFirst({ where: { userId, readAt: null, OR: staleClauses }, select: { id: true } }),
    db.notification.findFirst({ where: { userId, readAt: { not: null }, OR: oldClauses }, select: { id: true } }),
  ]);
  if (!maybeStale && !maybeOld) return { autoRead: 0, expired: 0 };

  // EXPIRY FIRST. A row this very pass marks read must not be deleted by the
  // same pass — it stays in the list for this visit and goes on a later one.
  let expired = 0;
  let autoRead = 0;
  for (const bucket of buckets) {
    const { autoReadBefore, expireBefore } = cutoffs(now, bucket.t);
    expired += (
      await db.notification.deleteMany({
        where: { userId, readAt: { not: null }, createdAt: { lt: expireBefore }, ...bucket.schoolWhere },
      })
    ).count;
    autoRead += (
      await db.notification.updateMany({
        where: { userId, readAt: null, createdAt: { lt: autoReadBefore }, ...bucket.schoolWhere },
        // Read "now", not back-dated: the row says when the app gave up
        // waiting, which is the truth.
        data: { readAt: now },
      })
    ).count;
  }
  return { autoRead, expired };
}

/** Everyone's, for the script. The same buckets with no user clause. */
export async function tidyAllNotifications(now: Date = new Date()): Promise<TidyResult> {
  const custom = await customSchools();
  const customIds = custom.map((c) => c.id);
  const buckets: { schoolWhere: object; t: Thresholds }[] = [
    { schoolWhere: customIds.length > 0 ? { OR: [{ schoolId: null }, { schoolId: { notIn: customIds } }] } : {}, t: effectiveThresholds(null) },
    ...custom.map((c) => ({ schoolWhere: { schoolId: c.id }, t: c.t })),
  ];
  let expired = 0;
  let autoRead = 0;
  for (const bucket of buckets) {
    const { autoReadBefore, expireBefore } = cutoffs(now, bucket.t);
    expired += (
      await db.notification.deleteMany({ where: { readAt: { not: null }, createdAt: { lt: expireBefore }, ...bucket.schoolWhere } })
    ).count;
    autoRead += (
      await db.notification.updateMany({ where: { readAt: null, createdAt: { lt: autoReadBefore }, ...bucket.schoolWhere }, data: { readAt: now } })
    ).count;
  }
  return { autoRead, expired };
}


/**
 * A school sets its own numbers — or clears them back to the defaults.
 * Null means "the platform's"; a number is kept inside a range wide enough
 * for real policy and narrow enough to keep nonsense out, and expiry may
 * not undercut auto-read: a notice must not be deleted before the rule
 * that reads it would have fired.
 */
export async function setNotifThresholds(
  ctx: ActiveContext,
  input: { autoReadDays: number | null; expireDays: number | null },
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanSetThresholds");
  const { autoReadDays, expireDays } = input;
  const intOr = (v: number | null) => v === null || Number.isInteger(v);
  if (!intOr(autoReadDays) || !intOr(expireDays)) return { ok: false, errorKey: "notif.thresholdNotWhole" };
  if (autoReadDays !== null && (autoReadDays < AUTO_READ_RANGE.min || autoReadDays > AUTO_READ_RANGE.max)) {
    return { ok: false, errorKey: "notif.autoReadOutOfRange" };
  }
  if (expireDays !== null && (expireDays < EXPIRE_RANGE.min || expireDays > EXPIRE_RANGE.max)) {
    return { ok: false, errorKey: "notif.expireOutOfRange" };
  }
  const effAuto = autoReadDays ?? AUTO_READ_AFTER_DAYS;
  const effExpire = expireDays ?? EXPIRE_READ_AFTER_DAYS;
  if (effExpire < effAuto) return { ok: false, errorKey: "notif.expireBeforeAutoRead" };

  await db.school.update({
    where: { id: ctx.schoolId },
    data: { notifAutoReadDays: autoReadDays, notifExpireDays: expireDays },
  });
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "school.notifTidy.set",
    targetType: "School",
    targetId: ctx.schoolId,
    meta: { autoReadDays, expireDays },
  });
  return { ok: true };
}
