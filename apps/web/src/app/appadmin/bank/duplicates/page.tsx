import Link from "next/link";
import { ArrowLeftIcon, CopySimpleIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { findDuplicates } from "@/lib/bank-tools";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("bankImport.duplicatesTitle") };
}

/**
 * Pairs of questions that are, or nearly are, the same question — by trigram
 * similarity where pg_trgm is installed, by exact normalised stem otherwise,
 * and the page says which. Each side opens its question's editor.
 */
export default async function DuplicatesPage() {
  const t = await getT();
  const session = await requireAppAdmin();
  const report = await findDuplicates(session);

  return (
    <div className="space-y-5">
      <Link href="/appadmin/bank" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("appadmin.questionBank")}
      </Link>
      <PageHeader
        title={t("bankImport.duplicatesTitle")}
        description={report.trigram ? t("bankImport.duplicatesTrigram", { threshold: Math.round(report.threshold * 100) }) : t("bankImport.duplicatesExact")}
      />
      {report.pairs.length === 0 ? (
        <EmptyState icon={<CopySimpleIcon weight="duotone" className="size-8" />} title={t("bankImport.noDuplicates")} description={t("bankImport.noDuplicatesBody")} />
      ) : (
        <ul className="space-y-2">
          {report.pairs.map((pair) => (
            <li key={`${pair.a.id}:${pair.b.id}`}>
              <Card>
                <CardBody className="space-y-2">
                  <Badge tone={pair.similarity >= 1 ? "danger" : "warn"} size="sm">
                    {pair.similarity >= 1 ? t("bankImport.identical") : t("bankImport.similarPercent", { percent: Math.round(pair.similarity * 100) })}
                  </Badge>
                  {[pair.a, pair.b].map((side) => (
                    <Link key={side.id} href={`/appadmin/bank/${side.topicId}/${side.id}`} className="block rounded-[--radius-sm] px-2 py-1.5 hover:bg-surface-muted/60">
                      <span className="block text-sm text-fg">{side.stem}</span>
                      <span className="block text-xs text-fg-muted">
                        {t("appadmin.classN", { n: side.classLevel })} · {side.topicName}
                      </span>
                    </Link>
                  ))}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
