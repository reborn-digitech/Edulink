import type { Metadata } from "next";
import Link from "next/link";
import { PenNibIcon, SealCheckIcon, SignatureIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { signaturesView } from "@/lib/signatures";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SignPaper } from "@/components/certificates/sign-paper";
import { getT } from "@/lib/i18n/server";
import { SignaturePad } from "./signature-pad";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("signatures.title"), robots: { index: false, follow: false } };
}

/**
 * The signatures page of an admin and of the head: the papers that wait for
 * the reader's signature first, because they are somebody else's work held
 * up; then the reader's own signature; then the school's seal, which the
 * head reads and the admin sets.
 */
export default async function SignaturesPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await signaturesView(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("signatures.title")} description={t("signatures.intro")} />

      <Card className={view.waiting.length > 0 ? "border-warn/40" : undefined} data-testid="signatures-waiting">
        <CardHeader
          icon={<PenNibIcon weight="duotone" className="size-5" />}
          title={t("signatures.waitingTitle")}
          description={t("signatures.waitingIntro")}
          action={view.waiting.length > 0 ? <Badge tone="warn" size="sm">{t("signatures.waitingCount", { count: view.waiting.length })}</Badge> : undefined}
        />
        <CardBody>
          {view.waiting.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" icon={<PenNibIcon weight="duotone" className="size-6" />} title={t("signatures.waitingNone")} />
          ) : (
            <ul className="divide-y divide-border">
              {view.waiting.map((paper) => {
                const href = paper.paperKind === "CERTIFICATE" ? `/certificates/${paper.paperId}` : `/report-cards/${paper.paperId}`;
                const name = [paper.studentName, paper.title].join(", ");
                return (
                  <li key={paper.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="font-semibold text-fg">{paper.studentName}</p>
                      <p className="text-sm text-fg">{[paper.title, paper.serial].filter(Boolean).join(" · ")}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">{t("signatures.issuedBy", { name: paper.requestedByName ?? "—", date: formatDate(new Date(paper.createdAt)) })}</p>
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`${href}?from=${encodeURIComponent("/admin/signatures")}`}>{t("signatures.openPaper")}</Link>
                      </Button>
                      <SignPaper signatureId={paper.id} label={name} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<SignatureIcon weight="duotone" className="size-5" />} title={t("signatures.mineTitle")} description={t("signatures.mineIntro")} />
        <CardBody>
          <SignaturePad key={view.mine.updatedAt ?? "none"} which="mine" current={view.mine.image} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("signatures.sealTitle")} description={t("signatures.sealIntro")} />
        <CardBody>
          {view.canSetSeal ? (
            <SignaturePad key={view.seal.updatedAt ?? "none"} which="seal" current={view.seal.image} />
          ) : (
            <div className="space-y-2">
              {view.seal.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- a picture kept in the row, handed over as a data URL
                <img src={view.seal.image} alt={t("signatures.sealCurrent")} className="size-28 rounded-[--radius-md] border border-border bg-white object-contain p-2" />
              ) : (
                <p className="text-sm text-fg-muted">{t("signatures.sealNone")}</p>
              )}
              <p className="text-xs text-fg-muted">{t("signatures.sealOnlyAdmin")}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
