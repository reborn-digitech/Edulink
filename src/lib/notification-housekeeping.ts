import "server-only";
import { db } from "./db";

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
 */

export const AUTO_READ_AFTER_DAYS = 90;
export const EXPIRE_READ_AFTER_DAYS = 365;

const DAY = 86_400_000;

export type TidyResult = { autoRead: number; expired: number };

export function cutoffs(now: Date = new Date()) {
  return {
    autoReadBefore: new Date(now.getTime() - AUTO_READ_AFTER_DAYS * DAY),
    expireBefore: new Date(now.getTime() - EXPIRE_READ_AFTER_DAYS * DAY),
  };
}

/** One person's notifications, tidied. Safe to call on every page: probes before it writes. */
export async function tidyNotificationsFor(userId: string, now: Date = new Date()): Promise<TidyResult> {
  const { autoReadBefore, expireBefore } = cutoffs(now);

  const [staleUnread, oldRead] = await Promise.all([
    db.notification.findFirst({ where: { userId, readAt: null, createdAt: { lt: autoReadBefore } }, select: { id: true } }),
    db.notification.findFirst({ where: { userId, readAt: { not: null }, createdAt: { lt: expireBefore } }, select: { id: true } }),
  ]);

  // EXPIRY FIRST. A row this very pass marks read must not be deleted by the
  // same pass — it stays in the list for this visit and goes on a later one.
  let expired = 0;
  let autoRead = 0;
  if (oldRead) {
    expired = (
      await db.notification.deleteMany({
        where: { userId, readAt: { not: null }, createdAt: { lt: expireBefore } },
      })
    ).count;
  }
  if (staleUnread) {
    autoRead = (
      await db.notification.updateMany({
        where: { userId, readAt: null, createdAt: { lt: autoReadBefore } },
        // Read "now", not back-dated: the row says when the app gave up
        // waiting, which is the truth.
        data: { readAt: now },
      })
    ).count;
  }
  return { autoRead, expired };
}

/** Everyone's, for the script. The same two rules with no user clause. */
export async function tidyAllNotifications(now: Date = new Date()): Promise<TidyResult> {
  const { autoReadBefore, expireBefore } = cutoffs(now);
  const expired = (
    await db.notification.deleteMany({ where: { readAt: { not: null }, createdAt: { lt: expireBefore } } })
  ).count;
  const autoRead = (
    await db.notification.updateMany({ where: { readAt: null, createdAt: { lt: autoReadBefore } }, data: { readAt: now } })
  ).count;
  return { autoRead, expired };
}
