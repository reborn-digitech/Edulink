import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlassIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { templatesView } from "@/lib/certificates";
import { pupilRecordFor } from "@/lib/pupil-records";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { IssueForm } from "./issue-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("certificates.issueTitle") };
}

const CUID = /^c[a-z0-9]{20,}$/;
const PUPIL_LIMIT = 300;

/**
 * Issuing one certificate: the pupil, the template, and what the record
 * lacks before the paper is numbered. The pupil is chosen from the roll —
 * a search box narrows a big school's list to a name or a code — and the
 * choice lives in the URL so the page can look the record up and say, before
 * the serial is spent, which rows would print as a dash.
 */
export default async function IssueCertificatePage({ searchParams }: { searchParams: Promise<{ membershipId?: string; templateId?: string; q?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { membershipId: requested, templateId: requestedTemplate, q: rawQuery } = await searchParams;
  const q = rawQuery?.trim().slice(0, 80) ?? "";

  const [view, pupils] = await Promise.all([
    templatesView(ctx),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: "STUDENT",
        status: "ACTIVE",
        leftAt: null,
        ...(q ? { OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { user: { preferredName: { contains: q, mode: "insensitive" } } }, { studentCode: { contains: q, mode: "insensitive" } }] } : {}),
      },
      select: { id: true, studentCode: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } },
      orderBy: [{ user: { name: "asc" } }],
      take: PUPIL_LIMIT,
    }),
  ]);
  const templates = view.templates.filter((x) => x.active);
  const selectedId = requested && CUID.test(requested) ? requested : "";
  const templateId = requestedTemplate && templates.some((x) => x.id === requestedTemplate) ? requestedTemplate : (templates[0]?.id ?? "");

  // The chosen pupil may be outside the search's page; the record names them anyway.
  let record: Awaited<ReturnType<typeof pupilRecordFor>> | null = null;
  if (selectedId) {
    try {
      record = await pupilRecordFor(ctx, selectedId);
    } catch {
      record = null;
    }
  }
  const options = pupils.map((p) => ({ id: p.id, name: p.user.preferredName ?? p.user.name, code: p.studentCode, className: p.enrollments[0]?.class.name ?? null }));
  if (record && !options.some((o) => o.id === record!.studentMembershipId)) {
    options.unshift({ id: record.studentMembershipId, name: record.studentName, code: record.studentCode, className: record.className });
  }
  const missingLabels = record ? record.missing.map((f) => t(`pupilRecord.${f}` as TranslationKey)) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("certificates.issueTitle")} description={t("certificates.issueIntro")} back={{ href: "/admin/certificates", label: t("certificates.title") }} />

      {templates.length === 0 ? (
        <EmptyState
          title={t("certificates.noTemplates")}
          description={t("certificates.noTemplatesBody")}
          action={
            <Button asChild size="sm">
              <Link href="/admin/certificates/new">{t("certificates.newTemplate")}</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardBody className="space-y-4 pt-5">
            {/* The search is a plain GET so the list it narrows is the server's own. */}
            <form method="get" action="/admin/certificates/issue" className="flex flex-wrap items-end gap-2">
              {templateId && <input type="hidden" name="templateId" value={templateId} />}
              {selectedId && <input type="hidden" name="membershipId" value={selectedId} />}
              <label className="min-w-0 flex-1 basis-56">
                <span className="block text-sm font-medium text-fg">{t("certificates.findPupil")}</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  maxLength={80}
                  autoComplete="off"
                  className="mt-1.5 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-[0.9375rem] text-fg outline-none focus:border-accent"
                />
              </label>
              <Button type="submit" variant="secondary" icon={<MagnifyingGlassIcon weight="bold" />}>
                {t("common.searchLabel")}
              </Button>
            </form>

            {record && record.missing.length > 0 && (
              <div className="flex flex-wrap items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn" data-testid="missing-warning">
                <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  {t("certificates.missingWarning", { fields: missingLabels.join(", ") })}{" "}
                  <Link href={`/admin/records/${record.studentMembershipId}`} className="font-semibold underline underline-offset-2">
                    {t("certificates.fillRecord")}
                  </Link>
                </span>
              </div>
            )}

            <IssueForm pupils={options} templates={templates.map((x) => ({ id: x.id, name: x.name, kind: x.kind }))} selectedId={record?.studentMembershipId ?? selectedId} templateId={templateId} query={q} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
