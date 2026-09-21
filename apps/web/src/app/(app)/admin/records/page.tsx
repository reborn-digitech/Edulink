import type { Metadata } from "next";
import Link from "next/link";
import { FolderUserIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { officeRecords } from "@/lib/pupil-records";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AskFamiliesButton } from "./ask-button";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("pupilRecord.officeTitle") };
}

/**
 * The office's view of the pupil records: how many are complete enough to
 * issue a certificate, which are not and what each lacks, when the family
 * was asked and when they answered. One button asks every incomplete
 * family; each row can ask its own.
 */
export default async function PupilRecordsPage({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { missing } = await searchParams;
  const missingOnly = missing === "1";
  // ?missing=filing: the pupils the UDISE+ sheet cannot be filled for — a
  // different set from the certificate's, cut here from the same rows.
  const filingOnly = missing === "filing";
  const all = await officeRecords(ctx, missingOnly);
  const view = filingOnly ? { ...all, rows: all.rows.filter((r) => r.missingForFiling.length > 0) } : all;
  const filingIds = view.rows.filter((r) => r.missingForFiling.length > 0).map((r) => r.studentMembershipId);
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);
  const tab = (active: boolean) => (active ? "rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-strong" : "rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pupilRecord.officeTitle")}
        description={t("pupilRecord.officeIntro")}
        actions={filingOnly ? <AskFamiliesButton membershipIds={filingIds} label={t("pupilRecord.askFamilies")} disabled={filingIds.length === 0} /> : <AskFamiliesButton label={t("pupilRecord.askFamilies")} disabled={view.incomplete === 0} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t("pupilRecord.allPupils")} value={String(view.total)} icon={<UsersThreeIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("pupilRecord.complete")} value={String(view.complete)} tone={view.complete > 0 ? "ok" : "neutral"} icon={<FolderUserIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("pupilRecord.onlyMissing")} value={String(view.incomplete)} tone={view.incomplete > 0 ? "warn" : "neutral"} icon={<FolderUserIcon weight="duotone" className="size-5" />} />
      </div>

      <Card>
        <CardBody className="space-y-4 pt-5">
          <nav className="flex flex-wrap gap-1" aria-label={t("common.activeFilters")}>
            <Link href="/admin/records" className={tab(!missingOnly && !filingOnly)} aria-current={!missingOnly && !filingOnly ? "page" : undefined}>
              {t("pupilRecord.allPupils")}
            </Link>
            <Link href="/admin/records?missing=1" className={tab(missingOnly)} aria-current={missingOnly ? "page" : undefined}>
              {t("pupilRecord.onlyMissing")}
            </Link>
            <Link href="/admin/records?missing=filing" className={tab(filingOnly)} aria-current={filingOnly ? "page" : undefined}>
              {t("filings.onlyMissingFiling")}
            </Link>
          </nav>

          {view.rows.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<UsersThreeIcon weight="duotone" className="size-6" />} title={t("pupilRecord.noPupils")} description={t("pupilRecord.noPupilsBody")} />
          ) : (
            <ul className="divide-y divide-border" data-testid="pupil-records">
              {view.rows.map((row) => (
                <li key={row.studentMembershipId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <PersonLink membershipId={row.studentMembershipId} name={row.studentName} className="font-semibold text-fg" />
                      {row.className && <span className="text-xs text-fg-muted">{row.className}</span>}
                      {row.missing.length === 0 ? (
                        <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge>
                      ) : (
                        <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: row.missing.length })}</Badge>
                      )}
                    </p>
                    {row.missing.length > 0 && <p className="mt-0.5 text-xs text-fg-muted">{t("pupilRecord.missingList", { fields: row.missing.map(fieldLabel).join(", ") })}</p>}
                    {filingOnly && row.missingForFiling.length > 0 && <p className="mt-0.5 text-xs text-fg-muted">{t("filings.missingFilingList", { fields: row.missingForFiling.map(fieldLabel).join(", ") })}</p>}
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {[
                        row.familyFilledAt ? t("pupilRecord.filledOn", { date: formatDate(new Date(row.familyFilledAt)) }) : null,
                        row.requestedAt ? t("pupilRecord.askedOn", { date: formatDate(new Date(row.requestedAt)) }) : t("pupilRecord.neverAsked"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-wrap items-center gap-2">
                    {(row.missing.length > 0 || row.missingForFiling.length > 0) && <AskFamiliesButton membershipIds={[row.studentMembershipId]} label={t("pupilRecord.askSelected")} variant="ghost" />}
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/records/${row.studentMembershipId}`}>{t("pupilRecord.edit")}</Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
