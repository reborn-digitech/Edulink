import "server-only";
import { db } from "./db";
import { schoolIdForSlug } from "./site-publish";
import { isDevelopment, processSiteEnv } from "./site-env";
import { counterpartOf, devSlugOfHost, normaliseHost } from "./site-host-match";

/**
 * WHICH SCHOOL A WEBSITE HOST IS, AND WHERE A SCHOOL'S WEBSITE LIVES (website-builder B, 15 October 2026; the
 * school's own domain only since the owner's decision of 16 October 2026 — there is no platform subdomain).
 *
 *   schoolIdForHost(host)  a LIVE SchoolSiteDomain, the exact name first and then its www/bare counterpart (a school
 *                          that holds www.example.in is also example.in, whose A record points here). Read with no
 *                          session: a LIVE row is readable by anyone (scripts/gen-rls.ts, GLOBALLY_READABLE). In a
 *                          development process `<slug>.localhost` is the school by its slug too (the flow builder's
 *                          schoolIdForSlug, src/lib/site-publish.ts), so the owner can try zz-northgate-school.localhost:3000
 *                          on this machine; never in production.
 *   siteHostFor(schoolId)  the school's own domain while it is LIVE, else null: before then the site is published but
 *                          reachable nowhere outside, and the Publish screen says so.
 *
 * Both are kept for sixty seconds in this process: a site host is asked about on every page view, and a domain
 * changes state a few times in its life. The domain library forgets everything it changes (forgetSiteHosts), so
 * this process sees a change at once and another within a minute.
 */

const TTL_MS = 60_000;
const byHost = new Map<string, { value: string | null; at: number }>();
const bySchool = new Map<string, { value: string | null; at: number }>();

/** Drop what this process remembers about hosts, after a domain is saved, verified, removed or flipped by the job. */
export function forgetSiteHosts(): void {
  byHost.clear();
  bySchool.clear();
}

/** The school a website host belongs to, or null (not a site, not LIVE, not published is the route's to say). */
export async function schoolIdForHost(host: string, now: number = Date.now()): Promise<string | null> {
  const n = normaliseHost(host);
  if (!n) return null;
  const hit = byHost.get(n.hostname);
  if (hit && now - hit.at < TTL_MS) return hit.value;
  const value = await lookupHost(n.hostname);
  byHost.set(n.hostname, { value, at: now });
  return value;
}

async function lookupHost(hostname: string): Promise<string | null> {
  // Development only: <slug>.localhost (devSlugOfHost answers null in any other process).
  const slug = devSlugOfHost(hostname, isDevelopment(processSiteEnv()));
  if (slug) return schoolIdForSlug(slug);
  const names = [hostname, counterpartOf(hostname)].filter((d): d is string => Boolean(d));
  const rows = await db.schoolSiteDomain.findMany({ where: { domain: { in: names }, status: "LIVE" }, select: { schoolId: true, domain: true } });
  return (rows.find((r) => r.domain === hostname) ?? rows[0])?.schoolId ?? null;
}

/** The host a school's published website answers on: its own domain while LIVE, else null (reachable nowhere yet). */
export async function siteHostFor(schoolId: string, now: number = Date.now()): Promise<string | null> {
  const hit = bySchool.get(schoolId);
  if (hit && now - hit.at < TTL_MS) return hit.value;
  const live = await db.schoolSiteDomain.findFirst({ where: { schoolId, status: "LIVE" }, orderBy: { verifiedAt: "desc" }, select: { domain: true } });
  const value = live?.domain ?? null;
  bySchool.set(schoolId, { value, at: now });
  return value;
}
