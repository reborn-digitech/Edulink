import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listOurPostings } from "@/lib/vacancies";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { CloseButton } from "./close-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.metaTitle") };
}

/** The school's own desk: what it has posted, and what each post has drawn. */
export default async function AdminVacanciesPage() {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const postings = await listOurPostings(ctx);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("vacancies.ourDeskTitle")}
          </h1>
          <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("vacancies.ourDeskIntro")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/vacancies">{t("vacancies.title")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/vacancies/new">
              <PlusIcon className="size-4" aria-hidden="true" />
              {t("vacancies.postCta")}
            </Link>
          </Button>
        </div>
      </div>

      {postings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="size-8" aria-hidden="true" />}
          title={t("vacancies.emptyTitle")}
          description={t("vacancies.ourDeskIntro")}
        />
      ) : (
        <ul className="space-y-2">
          {postings.map((posting) => (
            <li key={posting.id}>
              <Card>
                <CardBody className="flex flex-wrap items-center gap-2 py-4">
                  <Link
                    href={`/vacancies/${posting.id}`}
                    className="font-medium text-fg hover:underline"
                  >
                    {posting.title}
                  </Link>
                  <span className="text-xs text-fg-muted">
                    {t(EMPLOYMENT_TYPE_KEYS[posting.employmentType as EmploymentType] ?? "vacancies.typeFullTime")}
                  </span>
                  <Badge tone={posting.status === "OPEN" ? "ok" : "neutral"} size="sm">
                    {posting.status === "OPEN"
                      ? t("vacancies.openBadge")
                      : t("vacancies.closedBadge")}
                  </Badge>
                  <span className="text-xs text-fg-muted">
                    {posting.enquiryCount === 0
                      ? t("vacancies.enquiriesNone")
                      : posting.enquiryCount === 1
                        ? t("vacancies.enquiriesOne")
                        : t("vacancies.enquiriesMany", { count: posting.enquiryCount })}
                  </span>
                  {posting.contactName && (
                    <span className="text-xs text-fg-muted">
                      {t("vacancies.contactCell", { name: posting.contactName })}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-fg-muted">
                      {t("vacancies.postedAgo", { when: relative(posting.createdAt) })}
                    </span>
                    {posting.status === "OPEN" && <CloseButton postingId={posting.id} />}
                  </span>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
