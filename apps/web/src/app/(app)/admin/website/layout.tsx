import type { ReactNode } from "react";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { SiteSteps, PublishNowButton } from "./steps";

/**
 * The school website's six screens (website-builder A, 15 Oct 2026): Look, About, Sections, Preview, Publish,
 * and Your domain (builder B's /admin/website/domain). One heading and the progress strip for all of them; once
 * the site has been published once, "Publish changes" sits beside the heading on every screen, so publishing is
 * never more than one press away. The office and the head; the module off, the page says so and nothing else.
 */
export default async function WebsiteLayout({ children }: { children: ReactNode }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "WEBSITE"))) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("website.title")} />
        <ModuleOff module="WEBSITE" t={t} />
      </div>
    );
  }
  const publishedOnce = (await db.schoolSiteVersion.count({ where: { schoolId: ctx.schoolId } })) > 0;
  return (
    <div className="space-y-6">
      <PageHeader title={t("website.title")} description={t("website.intro")} actions={publishedOnce ? <PublishNowButton /> : null} />
      <SiteSteps />
      {children}
    </div>
  );
}
