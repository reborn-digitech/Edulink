import type { Metadata } from "next";
import Link from "next/link";
import { CertificateIcon, ListChecksIcon, PlusIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { templatesView } from "@/lib/certificates";
import { certificateNameLabel } from "@/lib/certificate-names";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { CERTIFICATE_KIND_KEY, localeName } from "@/components/certificates/labels";
import { TemplateRowActions } from "./template-row-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("certificates.metaTitle") };
}

/**
 * The office's certificate templates: what the school issues, in which
 * language, under which serial prefix, and how many times each has been
 * issued. A retired template stays on the list because the certificates
 * issued from it stand; it is simply offered no more.
 */
export default async function CertificatesPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await templatesView(ctx);
  // The head reads the templates and issues from them; designing one is the admin's.
  const canDesign = ctx.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("certificates.title")}
        description={t("certificates.intro")}
        actions={
          <span className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm" icon={<ListChecksIcon weight="bold" />}>
              <Link href="/admin/certificates/issued">{t("certificates.issuedTitle")}</Link>
            </Button>
            {/* Appointment letters to staff (risks batch 5A, 5 Oct 2026). */}
            <Button asChild variant="secondary" size="sm" icon={<ListChecksIcon weight="bold" />}>
              <Link href="/admin/certificates/appointments">{t("appointmentLetters.title")}</Link>
            </Button>
            {view.templates.some((x) => x.active) && (
              <Button asChild size="sm" icon={<SealCheckIcon weight="bold" />}>
                <Link href="/admin/certificates/issue">{t("certificates.issueTitle")}</Link>
              </Button>
            )}
          </span>
        }
      />

      <Card>
        <CardHeader
          icon={<CertificateIcon weight="duotone" className="size-5" />}
          title={t("certificates.templatesTitle")}
          description={t("certificates.templatesIntro")}
          action={
            canDesign ? (
              <Button asChild variant="secondary" size="sm" icon={<PlusIcon weight="bold" />}>
                <Link href="/admin/certificates/new">{t("certificates.newTemplate")}</Link>
              </Button>
            ) : undefined
          }
        />
        <CardBody>
          {view.templates.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              icon={<CertificateIcon weight="duotone" className="size-6" />}
              title={t("certificates.noTemplates")}
              description={t("certificates.noTemplatesBody")}
              action={
                canDesign ? (
                  <Button asChild size="sm" icon={<PlusIcon weight="bold" />}>
                    <Link href="/admin/certificates/new">{t("certificates.newTemplate")}</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border" data-testid="certificate-templates">
              {view.templates.map((template) => (
                <li key={template.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/certificates/${template.id}`} className="font-semibold text-fg hover:underline">
                        {certificateNameLabel(template.name, t)}
                      </Link>
                      {template.active ? (
                        <Badge tone="ok" size="sm">{t("certificates.active")}</Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">{t("certificates.archive")}</Badge>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {[t(CERTIFICATE_KIND_KEY[template.kind]), localeName(template.locale), `${t("certificates.serialPrefix")}: ${template.serialPrefix}`, t("certificates.issued", { count: template.issuedCount })].join(" · ")}
                    </p>
                  </div>
                  {canDesign && <TemplateRowActions templateId={template.id} name={certificateNameLabel(template.name, t)} active={template.active} />}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
