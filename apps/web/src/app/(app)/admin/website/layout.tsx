import type { ReactNode } from "react";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";

/**
 * The school website's editor and its domain screen (website-builder A, 15 Oct 2026; website-two, 16 Oct 2026: one
 * editor at /admin/website in place of the six screens, which are its sections). One heading for both; the editor
 * carries its own state, Save and Publish. The office and the head; the module off, the page says so and nothing
 * else, and every page under this returns nothing first (./gate.ts), so the answer is a plain 200.
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
  return (
    <div className="space-y-6">
      <PageHeader title={t("website.title")} description={t("siteEditor.intro")} />
      {children}
    </div>
  );
}
