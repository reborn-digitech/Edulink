import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { templatePalette, templatesView } from "@/lib/certificates";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { TemplateEditor } from "../template-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("certificates.newTemplate") };
}

/** A new template, started from a preset in the language the document is written in. The admin's page: the head reads templates, and does not design them. */
export default async function NewTemplatePage() {
  const ctx = await requireRole("ADMIN");
  const t = await getT();
  const [view, palette] = await Promise.all([templatesView(ctx), templatePalette(ctx)]);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={t("certificates.newTemplate")} description={t("certificates.templatesIntro")} back={{ href: "/admin/certificates", label: t("certificates.title") }} />
      <TemplateEditor view={view} palette={palette} />
    </div>
  );
}
