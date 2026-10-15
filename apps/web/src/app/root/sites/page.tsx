import type { Metadata } from "next";
import { requireSuperuser } from "@/lib/tenancy";
import { operatorSites } from "@/lib/site-domains";
import { CERT_KEYS, domainProblem, STATUS_KEYS } from "@/lib/site-domain-words";
import { sitesTarget } from "@/lib/site-env";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("siteDomains.opTitle") };
}

/**
 * THE OPERATOR'S TABLE OF SCHOOL WEBSITES (website-builder B, 15 October 2026): every published site and every
 * school's own domain, with the domain's state, its certificate and the last thing that went wrong. A site lives
 * only on its school's own domain (16 Oct 2026), so the table shows the domain and its state, and no other address.
 * Read only: a school's office sets its own domain at /admin/website/domain. The library is src/lib/site-domains.ts.
 */
export default async function RootSitesPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const relative = await getRelativeTime();
  const rows = await operatorSites(session);
  const target = sitesTarget();

  return (
    <div className="space-y-5">
      <PageHeader title={t("siteDomains.opTitle")} description={t("siteDomains.opIntro")} />
      {rows.length === 0 ? (
        <EmptyState title={t("siteDomains.opEmpty")} />
      ) : (
        <TableScroll label={t("siteDomains.opTitle")}>
          <table className="w-full text-left text-sm" data-testid="root-sites">
            <thead className="text-fg-muted">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">{t("siteDomains.opColSchool")}</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">{t("siteDomains.opColPublished")}</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">{t("siteDomains.opColDomain")}</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">{t("siteDomains.opColState")}</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">{t("siteDomains.opColCertificate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = r.domain ? STATUS_KEYS[r.domain.status] : null;
                const problem = r.domain ? domainProblem(t, r.domain, target) : null;
                return (
                  <tr key={r.schoolId} className="border-t border-border align-top" data-testid={`root-site-${r.schoolId}`}>
                    <td className="py-2 pr-3 text-fg">
                      <span className="font-medium">{r.schoolName}</span>
                      {r.isTestFixture ? (
                        <Badge size="sm" className="ml-2">
                          {t("siteDomains.opTest")}
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-fg-muted">{r.publishedAt ? relative(r.publishedAt) : t("siteDomains.opNotPublished")}</td>
                    <td className="py-2 pr-3 break-all text-fg">{r.domain?.domain ?? t("siteDomains.opNoDomain")}</td>
                    <td className="py-2 pr-3">
                      {r.domain && status ? (
                        <>
                          <Badge size="sm" tone={status.tone}>
                            {t(status.label)}
                          </Badge>
                          {problem ? <p className="mt-1 text-xs text-fg-subtle">{problem}</p> : null}
                        </>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-fg-muted">{r.domain ? t(CERT_KEYS[r.domain.certStatus]) : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
