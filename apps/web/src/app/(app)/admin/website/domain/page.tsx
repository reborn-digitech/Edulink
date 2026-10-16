import type { Metadata } from "next";
import Link from "next/link";
import { websitePageContext } from "../gate";
import { siteDomainView } from "@/lib/site-domains";
import { domainProblem, STATUS_KEYS } from "@/lib/site-domain-words";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableScroll } from "@/components/ui/table-scroll";
import { DomainForm, DomainActions } from "./panel";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("siteDomains.title") };
}

/**
 * THE WEBSITE FLOW'S SIXTH SCREEN, "Your domain" (website-builder B, 15 October 2026). The office and the head,
 * with the WEBSITE module on: the school's own domain typed once — the only address a school website has (the
 * owner's decision of 16 October 2026) — exactly the records to add at the registrar, a Verify that checks the DNS
 * and asks for the certificate, the state in plain words with the last thing that went wrong, and Remove; until the
 * domain is live, where the published site stands. The library is src/lib/site-domains.ts.
 */
export default async function WebsiteDomainPage() {
  // The flow's layout (/admin/website/layout.tsx, builder A) draws the heading, the progress strip and the module's
  // "switched off" page; this screen is its cards, and nothing at all while the module is off (website-two: the early
  // return, so the answer carries no not-found marker).
  const ctx = await websitePageContext();
  if (!ctx) return null;
  const t = await getT();
  const relative = await getRelativeTime();
  const view = await siteDomainView(ctx);
  const d = view.domain;
  const status = d ? STATUS_KEYS[d.status] : null;
  const problem = d ? domainProblem(t, d, view.target) : null;
  const checkedAt = d ? (d.certCheckedAt && (!d.dnsCheckedAt || d.certCheckedAt > d.dnsCheckedAt) ? d.certCheckedAt : d.dnsCheckedAt) : null;
  const apexRow = d?.records.find((r) => r.type === "REDIRECT");
  const wwwRow = d?.records.find((r) => r.type === "CNAME" && r.name === "www");

  return (
    <div className="space-y-6">
      <p className="text-sm text-fg-muted">{t("siteDomains.intro")}</p>
      {/* A site lives only on the school's own domain (16 Oct 2026): where the published site stands until it is live. */}
      {d?.status !== "LIVE" ? (
        <p className="text-sm font-medium text-fg" data-testid="site-publish-state">
          {t(view.published ? "siteDomains.publishedWaiting" : "siteDomains.notPublishedYet")}
        </p>
      ) : null}

      <Card>
        <CardHeader title={t("siteDomains.fieldLabel")} description={d ? t("siteDomains.replaceNote") : undefined} />
        <CardBody>
          <DomainForm current={d?.domain ?? ""} />
        </CardBody>
      </Card>

      {d && status ? (
        <Card data-testid="site-domain" data-status={d.status}>
          <CardHeader title={d.domain} description={t(status.what, { domain: d.domain })} action={<Badge tone={status.tone}>{t(status.label)}</Badge>} />
          <CardBody className="space-y-5">
            {problem ? (
              <p role="status" className={`text-sm font-medium ${d.status === "FAILED" ? "text-danger" : "text-fg"}`} data-testid="site-domain-problem">
                {problem}
              </p>
            ) : null}
            {checkedAt ? <p className="text-xs text-fg-subtle">{t("siteDomains.lastChecked", { when: relative(new Date(checkedAt)) })}</p> : null}
            {!view.certificatesHere && !d.certError ? <p className="text-xs text-fg-subtle">{t("siteDomains.certNotConfigured")}</p> : null}

            <section className="space-y-2" aria-labelledby="site-domain-records">
              <h2 id="site-domain-records" className="text-base font-semibold text-fg">
                {t("siteDomains.recordsTitle")}
              </h2>
              <p className="text-sm text-fg-muted">{t("siteDomains.recordsIntro")}</p>
              {apexRow && wwwRow ? <p className="text-sm text-fg-muted">{t("siteDomains.apexServedOnWww", { www: wwwRow.host, apex: apexRow.host })}</p> : null}
              <DomainRecords records={d.records} labels={{ title: t("siteDomains.recordsTitle"), type: t("siteDomains.colType"), name: t("siteDomains.colName"), value: t("siteDomains.colValue"), redirect: t("siteDomains.typeRedirect"), apex: t("siteDomains.nameApex") }} />
              {apexRow ? <p className="text-xs text-fg-subtle">{t("siteDomains.redirectNote", { apex: apexRow.host, www: apexRow.value })}</p> : null}
            </section>

            <p className="text-sm text-fg-muted">{t("siteDomains.verifyHint")}</p>
            <DomainActions domain={d.domain} />
          </CardBody>
        </Card>
      ) : null}

      <div>
        <Button asChild variant="secondary">
          <Link href="/admin/website?s=publish">{t("siteDomains.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

function DomainRecords({ records, labels }: { records: { type: string; name: string; value: string }[]; labels: { title: string; type: string; name: string; value: string; redirect: string; apex: string } }) {
  return (
    <TableScroll label={labels.title}>
      <table className="w-full text-left text-sm" data-testid="site-domain-records">
        <thead className="text-fg-muted">
          <tr>
            <th scope="col" className="py-1.5 pr-3 font-medium">{labels.type}</th>
            <th scope="col" className="py-1.5 pr-3 font-medium">{labels.name}</th>
            <th scope="col" className="py-1.5 pr-3 font-medium">{labels.value}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={`${r.type}-${r.name}`} className="border-t border-border">
              <td className="py-2 pr-3 font-medium text-fg">{r.type === "REDIRECT" ? labels.redirect : <code>{r.type}</code>}</td>
              <td className="py-2 pr-3 text-fg">{r.name === "@" ? labels.apex : <code className="break-all">{r.name}</code>}</td>
              <td className="py-2 pr-3 text-fg">
                <code className="break-all">{r.value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
