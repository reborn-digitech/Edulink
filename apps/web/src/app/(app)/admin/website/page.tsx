import type { Metadata } from "next";
import { isCollegeKind } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { isModuleOn } from "@/lib/modules";
import { FONTS } from "@/lib/fonts";
import { loadSite, logoColourFor, sitePostChoices, siteVersions } from "@/lib/site-admin";
import { siteFiles } from "@/lib/site-files";
import { siteShares } from "@/lib/site-share";
import { siteInbox } from "@/lib/site-inbox";
import { siteVisits } from "@/lib/site-visits";
import { readableFromLogo } from "@/lib/site-colour";
import { websitePageContext } from "./gate";
import { SiteEditor } from "./editor/site-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("website.title") };
}

/**
 * /admin/website — THE WEBSITE EDITOR (website-two, 16 October 2026): the six screens of 15 October as sections of one
 * screen, with the page drawn live beside the form (editor/site-editor.tsx). ?s= opens a section (look, about, home,
 * page:<CODE>, custom:<id>, publish, enquiries; the old screens' names too). The first open shows a whole draft built
 * from what the school already has (site-publish.ts `draftConfigFor`). The module off, the layout's notice alone.
 */
export default async function WebsiteEditorPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const ctx = await websitePageContext();
  if (!ctx) return null;
  const { s } = await searchParams;
  const view = await loadSite(ctx);
  const [posts, files, versions, shares, inbox, visits, admissionsOn, school, domain, head, logoRgb] = await Promise.all([
    sitePostChoices(ctx),
    siteFiles(ctx),
    siteVersions(ctx),
    siteShares(ctx),
    siteInbox(ctx),
    siteVisits(ctx),
    isModuleOn(ctx.schoolId, "ADMISSIONS"),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
    db.schoolSiteDomain.findFirst({ where: { schoolId: ctx.schoolId }, select: { domain: true, status: true } }),
    db.membership.findFirst({ where: { schoolId: ctx.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, orderBy: { joinedAt: "asc" }, select: { user: { select: { name: true } } } }),
    logoColourFor(view.school.logoFileId),
  ]);
  const metricValues = Object.fromEntries(
    view.data.numbers.map((n) => [n.metric, n.kind === "percent" ? `${n.value}%` : n.kind === "rupees" ? `₹${n.value.toLocaleString("en-IN")}` : String(n.value)]),
  );
  const iso = (d: Date) => d.toISOString();
  // The editor's own "nothing to show yet" lines read which pictures the site may show: every picture of the posts it
  // may carry and every file uploaded for it, so a picture chosen in the editor counts before the next save.
  const data = { ...view.data, files: { ...view.data.files } };
  for (const p of posts) for (const img of p.images) data.files[img.fileId] ??= { size: 0, kind: "IMAGE" };
  for (const f of files) data.files[f.fileId] ??= { size: f.size, kind: f.kind };
  return (
    <SiteEditor
      config={view.config}
      data={data}
      school={{ name: view.school.name, slug: view.school.slug, logoFileId: view.school.logoFileId, college: isCollegeKind(view.school.kind), timezone: school.timezone }}
      published={view.published}
      publishedAt={view.publishedAt ? iso(view.publishedAt) : null}
      publishedOnce={view.publishedOnce}
      draftSavedAt={view.draftSavedAt ? iso(view.draftSavedAt) : null}
      unpublishedChanges={view.unpublishedChanges}
      address={view.address}
      localPath={view.localPath}
      domain={domain ? { name: domain.domain, status: domain.status } : null}
      checklist={view.checklist}
      posts={posts.map((p) => ({ id: p.id, title: p.title, createdAt: iso(p.createdAt), images: p.images }))}
      files={files.map((f) => ({ ...f, createdAt: iso(f.createdAt) }))}
      versions={versions.map((v) => ({ ...v, renderedAt: iso(v.renderedAt) }))}
      shares={shares.map((x) => ({ ...x, createdAt: iso(x.createdAt), expiresAt: iso(x.expiresAt) }))}
      inbox={inbox}
      visits={visits}
      fonts={FONTS.map((f) => ({ key: f.key, family: f.family, devanagari: f.scripts.includes("devanagari") }))}
      logoColour={readableFromLogo(logoRgb)}
      principalName={head?.user.name ?? null}
      canNamePrincipal={ctx.role === "PRINCIPAL"}
      admissionsOn={admissionsOn}
      metricValues={metricValues}
      section={s ?? ""}
    />
  );
}
