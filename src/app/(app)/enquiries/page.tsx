import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listEnquiries, type EnquiryListItem } from "@/lib/enquiries";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("enquiries.metaTitle") };
}

function EnquiryRow({
  enquiry,
  t,
  relative,
  showFrom,
}: {
  enquiry: EnquiryListItem;
  t: Translate;
  relative: (d: Date) => string;
  showFrom: boolean;
}) {
  return (
    <Card interactive>
      <Link href={`/enquiries/${enquiry.id}`} className="block">
        <CardBody className="space-y-1 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" size="sm">
              {enquiry.kind === "ADMISSION" ? t("enquiries.admissionTag") : t("enquiries.vacancyTag")}
            </Badge>
            <span className="font-medium text-fg">
              {showFrom
                ? enquiry.subject
                  ? `${enquiry.fromName} — ${enquiry.subject}`
                  : enquiry.fromName
                : enquiry.subject
                  ? t("enquiries.threadTitleVacancy", {
                      subject: enquiry.subject,
                      school: enquiry.schoolName,
                    })
                  : t("enquiries.threadTitleAdmission", { school: enquiry.schoolName })}
            </span>
            {enquiry.status === "CLOSED" && (
              <Badge tone="neutral" size="sm">
                {t("enquiries.closedBadge")}
              </Badge>
            )}
            {enquiry.unread && enquiry.status === "OPEN" && (
              <Badge tone="accent" size="sm">
                {t("enquiries.newBadge")}
              </Badge>
            )}
            <span className="ml-auto text-xs text-fg-muted">{relative(enquiry.lastMessageAt)}</span>
          </div>
          {enquiry.lastMessagePreview && (
            <p className="line-clamp-1 text-sm text-fg-muted">{enquiry.lastMessagePreview}</p>
          )}
        </CardBody>
      </Link>
    </Card>
  );
}

/** One desk, both directions: what you asked, and what your school was asked. */
export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const { status: rawStatus, kind: rawKind } = await searchParams;
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const { sent: allSent, inbox: allInbox } = await listEnquiries(ctx);
  const status = rawStatus === "open" || rawStatus === "closed" ? rawStatus : null;
  const kind = rawKind === "ADMISSION" || rawKind === "VACANCY" ? rawKind : null;
  const keep = (e: EnquiryListItem) =>
    (!status || e.status === (status === "open" ? "OPEN" : "CLOSED")) && (!kind || e.kind === kind);
  const sent = allSent.filter(keep);
  const inbox = allInbox.filter(keep);
  const everything = [...allSent, ...allInbox];
  const narrowed = Boolean(status || kind);

  const isStaff = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL" || ctx.role === "TEACHER";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("enquiries.title")} description={t("enquiries.intro")} />

      {(everything.length > 2 || narrowed) && (
        <DataToolbar
          facets={[
            {
              key: "status",
              label: t("enquiries.statusFilter"),
              value: status ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: everything.length },
                { value: "open", label: t("enquiries.statusOpen"), count: everything.filter((e) => e.status === "OPEN").length },
                { value: "closed", label: t("enquiries.closedBadge"), count: everything.filter((e) => e.status === "CLOSED").length },
              ],
            },
            {
              key: "kind",
              label: t("enquiries.kindFilter"),
              value: kind ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll") },
                { value: "ADMISSION", label: t("enquiries.admissionTag"), count: everything.filter((e) => e.kind === "ADMISSION").length },
                { value: "VACANCY", label: t("enquiries.vacancyTag"), count: everything.filter((e) => e.kind === "VACANCY").length },
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {sent.length === 0 && inbox.length === 0 && narrowed && (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      )}

      {allSent.length === 0 && allInbox.length === 0 && (
        <EmptyState
          icon={<EnvelopeSimpleIcon className="size-8" aria-hidden="true" />}
          title={t("enquiries.emptyTitle")}
          description={isStaff ? t("enquiries.emptyBodyStaff") : t("enquiries.emptyBodyParent")}
        />
      )}

      {inbox.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("enquiries.inboxTitle")}
          </h2>
          <ul className="space-y-2">
            {inbox.map((enquiry) => (
              <li key={enquiry.id}>
                <EnquiryRow enquiry={enquiry} t={t} relative={relative} showFrom />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("enquiries.sentTitle")}
          </h2>
          <ul className="space-y-2">
            {sent.map((enquiry) => (
              <li key={enquiry.id}>
                <EnquiryRow enquiry={enquiry} t={t} relative={relative} showFrom={false} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
