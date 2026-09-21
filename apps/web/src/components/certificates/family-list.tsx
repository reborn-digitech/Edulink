import Link from "next/link";
import { CertificateIcon, DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import type { CertificateKind } from "@edulink/contracts";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { CERTIFICATE_KIND_KEY } from "./labels";

type Item = { id: string; kind: CertificateKind; serial: string; title: string; studentName: string; issuedAt: string; revokedAt: string | null };

/**
 * The family's certificates: one line each, with the document to open and
 * the PDF to keep. A revoked certificate stays on the list and says so — a
 * paper already handed over cannot be unprinted, and the family should know
 * the school no longer stands behind it. `showPupil` names the child for a
 * guardian with more than one.
 */
export async function FamilyCertificateList({ items, showPupil, from }: { items: Item[]; showPupil: boolean; from: string }) {
  const t = await getT();
  if (items.length === 0) {
    return <EmptyState className="border-0 bg-transparent py-6" icon={<CertificateIcon weight="duotone" className="size-6" />} title={t("certificates.noMine")} description={t("certificates.noMineBody")} />;
  }
  const link = "inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-strong underline underline-offset-2 hover:text-accent";
  return (
    <ul className="divide-y divide-border" data-testid="family-certificates">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1 basis-56">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-fg">{item.title}</span>
              {item.revokedAt && (
                <Badge tone="danger" size="sm">
                  {t("certificates.revoke")}
                </Badge>
              )}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {[showPupil ? item.studentName : null, t(CERTIFICATE_KIND_KEY[item.kind]), `${t("certificates.serial")} ${item.serial}`, t("certificates.issuedOn", { date: formatDate(new Date(item.issuedAt)) })].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className="flex shrink-0 flex-wrap items-center gap-3">
            <Link href={`/certificates/${item.id}?from=${encodeURIComponent(from)}`} className={link}>
              {t("certificates.open")}
            </Link>
            <a href={`/api/v1/shared/certificates/${item.id}/pdf`} target="_blank" rel="noopener" className={link}>
              <DownloadSimpleIcon weight="bold" className="size-4" aria-hidden="true" />
              {t("certificates.downloadPdf")}
            </a>
          </span>
        </li>
      ))}
    </ul>
  );
}
