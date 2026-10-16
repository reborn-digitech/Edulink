import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { addDaysToKey, todayKey } from "./dates";
import { forSchool } from "./tenant-context";
import { siteEditor } from "./site-admin";
import type { ActiveContext } from "./session";

/**
 * A SCHOOL WEBSITE'S PAGE VIEWS, PRIVACY FIRST (website-two, 16 October 2026). The public route on the school's own
 * domain adds one to a counter per page per day (SchoolSiteVisit) after it has served the page: counted on the server,
 * so no cookie is set and no script runs on the site; no address, browser or referrer is kept, so nothing here can
 * tell one visitor from another, or follow one. A page served from a cache in between is not counted, so the number
 * is a floor, which the editor says. The office reads thirty days as a line and the pages' totals on the Publish
 * section; the weekly site:enquiries job deletes rows older than 400 days.
 */

export const SITE_VISITS_KEEP_DAYS = 400;
const PAGE_KEY = /^[a-z0-9-]{1,40}$/;

/** One more view of `page` ("home" or a page's path) today in the school's zone. Never throws: a count is not worth a failed page. */
export async function countSiteVisit(schoolId: string, page: string, now: Date = new Date()): Promise<void> {
  if (!PAGE_KEY.test(page)) return;
  try {
    await forSchool(schoolId, async () => {
      const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
      const dateKey = todayKey(school?.timezone ?? "Asia/Kolkata", now);
      const where = { schoolId_dateKey_page: { schoolId, dateKey, page } };
      try {
        await db.schoolSiteVisit.upsert({ where, create: { schoolId, dateKey, page, count: 1 }, update: { count: { increment: 1 } } });
      } catch (error) {
        // Two first views of a page in the same instant: the other made the row; count on it.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") await db.schoolSiteVisit.update({ where, data: { count: { increment: 1 } } });
        else throw error;
      }
    });
  } catch (error) {
    console.error("[site-visits]", error);
  }
}

export type SiteVisits = { days: { dateKey: string; count: number }[]; total: number; pages: { page: string; count: number }[] };

/** The last thirty days (today included), each day's total, the total and the pages by views. */
export async function siteVisits(ctx: ActiveContext, now: Date = new Date(), days = 30): Promise<SiteVisits> {
  const ed = await siteEditor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone, now);
  const from = addDaysToKey(today, -(days - 1));
  const rows = await db.schoolSiteVisit.findMany({ where: { schoolId: ed.schoolId, dateKey: { gte: from, lte: today } }, select: { dateKey: true, page: true, count: true } });
  const byDay = new Map<string, number>();
  const byPage = new Map<string, number>();
  for (const r of rows) {
    byDay.set(r.dateKey, (byDay.get(r.dateKey) ?? 0) + r.count);
    byPage.set(r.page, (byPage.get(r.page) ?? 0) + r.count);
  }
  const list = Array.from({ length: days }, (_, i) => addDaysToKey(from, i)).map((dateKey) => ({ dateKey, count: byDay.get(dateKey) ?? 0 }));
  return {
    days: list,
    total: list.reduce((n, d) => n + d.count, 0),
    pages: [...byPage.entries()].map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count || a.page.localeCompare(b.page)),
  };
}

/** Rows older than SITE_VISITS_KEEP_DAYS, for the weekly job. `schoolIds` narrows it (a test's own). */
export async function pruneSiteVisits(now: Date, scope: { schoolIds?: string[] } = {}): Promise<number> {
  const cutoff = addDaysToKey(todayKey("Asia/Kolkata", now), -SITE_VISITS_KEEP_DAYS);
  const gone = await db.schoolSiteVisit.deleteMany({ where: { dateKey: { lt: cutoff }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) } });
  return gone.count;
}
