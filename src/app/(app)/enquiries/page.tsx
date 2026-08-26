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
export default async function EnquiriesPage() {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const { sent, inbox } = await listEnquiries(ctx);

  const isStaff = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL" || ctx.role === "TEACHER";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("enquiries.title")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("enquiries.intro")}</p>
      </div>

      {sent.length === 0 && inbox.length === 0 && (
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
