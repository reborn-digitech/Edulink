import type { Metadata } from "next";
import Link from "next/link";
import { ListChecksIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listCertificates } from "@/lib/certificates";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { getT } from "@/lib/i18n/server";
import { CERTIFICATE_KIND_KEY } from "@/components/certificates/labels";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("certificates.issuedTitle") };
}

const CUID = /^c[a-z0-9]{20,}$/;

/** Every certificate the school has issued, newest first; one pupil's when the URL names them. */
export default async function IssuedCertificatesPage({ searchParams }: { searchParams: Promise<{ membershipId?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { membershipId: requested } = await searchParams;
  const membershipId = requested && CUID.test(requested) ? requested : undefined;
  const { items } = await listCertificates(ctx, membershipId);
  const pupilName = membershipId ? items[0]?.studentName : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("certificates.issuedTitle")}
        description={t("certificates.issuedIntro")}
        back={{ href: "/admin/certificates", label: t("certificates.title") }}
        actions={
          <Button asChild size="sm" icon={<SealCheckIcon weight="bold" />}>
            <Link href={membershipId ? `/admin/certificates/issue?membershipId=${membershipId}` : "/admin/certificates/issue"}>{t("certificates.issueTitle")}</Link>
          </Button>
        }
      />

      {membershipId && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <span>
            {t("certificates.filterPupil")}: <PersonLink membershipId={membershipId} name={pupilName ?? membershipId} className="font-medium text-fg" />
          </span>
          <Link href="/admin/certificates/issued" className="font-medium text-accent-strong underline underline-offset-2">
            {t("common.clearAll")}
          </Link>
        </p>
      )}

      <Card>
        <CardBody className="pt-5">
          {items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<ListChecksIcon weight="duotone" className="size-6" />} title={t("certificates.noIssued")} description={t("certificates.noIssuedBody")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[40rem] text-sm" data-testid="issued-certificates">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("certificates.serial")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("certificates.heading")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("certificates.pupil")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("tc.issuedOn")}</th>
                    <th scope="col" className="py-2 font-semibold">
                      <span className="sr-only">{t("certificates.open")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-3 font-mono text-xs text-fg">{item.serial}</td>
                      <td className="py-2 pr-3">
                        <span className="block font-medium text-fg">{item.title}</span>
                        <span className="block text-xs text-fg-muted">{t(CERTIFICATE_KIND_KEY[item.kind])}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <PersonLink membershipId={item.studentMembershipId} name={item.studentName} className="font-medium text-fg" />
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-fg-muted">
                        {formatDate(new Date(item.issuedAt))}
                        {item.revokedAt && (
                          <Badge tone="danger" size="sm" className="ml-2">
                            {t("certificates.revoke")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Link href={`/certificates/${item.id}?from=${encodeURIComponent(membershipId ? `/admin/certificates/issued?membershipId=${membershipId}` : "/admin/certificates/issued")}`} className="font-medium text-accent-strong underline underline-offset-2 hover:text-accent">
                          {t("certificates.open")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
