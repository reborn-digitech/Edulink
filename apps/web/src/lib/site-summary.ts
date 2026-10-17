import "server-only";
import type { SiteSummary } from "@edulink/contracts";
import { db } from "./db";
import { loadSite, siteEditor } from "./site-admin";
import { siteVisits } from "./site-visits";
import type { ActiveContext } from "./session";

/**
 * THE WEBSITE AT A GLANCE, FOR THE PHONE (website-three, 17 October 2026): GET /api/v1/admin/site/summary for the office
 * and the head, read-only — whether the site is a draft or published (and since when), its live address on the school's
 * own domain, the "Ready: n of 7" list, the enquiries waiting with the newest three (a name, when, the state; never the
 * message or the contact), and the page views of the last thirty days. Editing stays on the web, at `editPath`.
 */
export async function siteSummary(ctx: ActiveContext, now: Date = new Date()): Promise<SiteSummary> {
  const ed = await siteEditor(ctx);
  const [view, visits, grouped, newest] = await Promise.all([
    loadSite(ctx),
    siteVisits(ctx, now),
    db.schoolSiteEnquiry.groupBy({ by: ["status"], where: { schoolId: ed.schoolId }, _count: { _all: true } }),
    db.schoolSiteEnquiry.findMany({ where: { schoolId: ed.schoolId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, name: true, createdAt: true, status: true, wantsVisit: true } }),
  ]);
  const count = (status: string) => grouped.find((g) => g.status === status)?._count._all ?? 0;
  return {
    state: view.published ? "PUBLISHED" : "DRAFT",
    publishedAt: view.publishedAt?.toISOString() ?? null,
    unpublishedChanges: view.unpublishedChanges,
    address: view.address,
    checklist: view.checklist,
    ready: { done: view.checklist.filter((c) => c.done).length, total: view.checklist.length },
    enquiries: {
      newCount: count("NEW"),
      total: grouped.reduce((n, g) => n + g._count._all, 0),
      newest: newest.map((e) => ({ id: e.id, name: e.name, createdAt: e.createdAt.toISOString(), status: e.status === "REPLIED" || e.status === "CLOSED" ? e.status : "NEW", wantsVisit: e.wantsVisit })),
    },
    visits: { total: visits.total, days: visits.days },
    editPath: "/admin/website",
  };
}
