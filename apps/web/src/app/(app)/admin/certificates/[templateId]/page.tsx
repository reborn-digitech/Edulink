import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/tenancy";
import { templatePalette, templatesView } from "@/lib/certificates";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";
import { CERTIFICATE_KIND_KEY, localeName } from "@/components/certificates/labels";
import { TemplateEditor } from "../template-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("certificates.metaTitle") };
}

/** One template, reworded. Certificates already issued from it keep the wording they were issued with. */
export default async function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { templateId } = await params;
  const [view, palette] = await Promise.all([templatesView(ctx), templatePalette(ctx)]);
  const template = view.templates.find((x) => x.id === templateId);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={template.name}
        description={[t(CERTIFICATE_KIND_KEY[template.kind]), localeName(template.locale), t("certificates.issued", { count: template.issuedCount })].join(" · ")}
        meta={template.active ? <Badge tone="ok" size="sm">{t("certificates.active")}</Badge> : <Badge tone="neutral" size="sm">{t("certificates.archive")}</Badge>}
        back={{ href: "/admin/certificates", label: t("certificates.title") }}
      />
      <TemplateEditor key={template.updatedAt} view={view} palette={palette} template={template} readOnly={ctx.role !== "ADMIN"} />
    </div>
  );
}
