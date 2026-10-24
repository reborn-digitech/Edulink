import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listOurPostings } from "@/lib/vacancies";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { CloseButton } from "./close-button";
import { PageHeader } from "@/components/ui/page-header";
import { institutionKindOf } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.metaTitle") };
}

/** The school's own desk: what it has posted, and what each post has drawn. */
export default async function AdminVacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  // A college's postings are the college's (QA-69).
  const college = isCollegeKind(await institutionKindOf(ctx.schoolId));
  // The head reads the desk and its enquiries; posting and closing are the admin's.
  const canPost = ctx.role === "ADMIN";
  const { status: rawStatus } = await searchParams;
  // Open is the default view: closed posts accumulate for years and the
  // question this page answers is "what are we hiring for now".
  const status = rawStatus === "closed" ? "CLOSED" : rawStatus === "all" ? "ALL" : "OPEN";
  const [postings, counts] = await Promise.all([
    listOurPostings(ctx, { status }),
    listOurPostings(ctx, { status: "ALL" }).then((all) => ({
      open: all.filter((p) => p.status === "OPEN").length,
      closed: all.filter((p) => p.status !== "OPEN").length,
    })),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={t(college ? "qaInterface.collegeDeskTitle" : "vacancies.ourDeskTitle")} description={t(college ? "qaInterface.collegeDeskIntro" : "vacancies.ourDeskIntro")} />
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/vacancies">{t("vacancies.title")}</Link>
          </Button>
          {canPost && (
            <Button asChild size="sm">
              <Link href="/admin/vacancies/new">
                <PlusIcon className="size-4" aria-hidden="true" />
                {t("vacancies.postCta")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <DataToolbar
        facets={[
          {
            key: "status",
            label: t("vacancies.filterLabel"),
            value: status === "OPEN" ? "" : status === "CLOSED" ? "closed" : "all",
            options: [
              { value: "", label: t("vacancies.openBadge"), count: counts.open },
              { value: "closed", label: t("vacancies.closedBadge"), count: counts.closed },
              { value: "all", label: t("vacancies.filterAll") },
            ],
          },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />

      {postings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="size-8" aria-hidden="true" />}
          title={status === "OPEN" && counts.closed > 0 ? t("vacancies.emptyOpenTitle") : t("vacancies.emptyTitle")}
          description={status === "OPEN" && counts.closed > 0 ? t("vacancies.emptyOpenBody") : t("vacancies.emptyOwnBody")}
          action={
            canPost ? (
              <Button asChild size="sm">
                <Link href="/admin/vacancies/new">{t("vacancies.postCta")}</Link>
              </Button>
            ) : undefined
          }
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
                  {/* The count is the door to the enquiries, not a caption. */}
                  {posting.enquiryCount === 0 ? (
                    <span className="text-xs text-fg-muted">{t("vacancies.enquiriesNone")}</span>
                  ) : (
                    <Link href={`/vacancies/${posting.id}#enquiries`} className="text-xs font-medium text-accent hover:underline">
                      {posting.enquiryCount === 1
                        ? t("vacancies.enquiriesOne")
                        : t("vacancies.enquiriesMany", { count: posting.enquiryCount })}
                    </Link>
                  )}
                  {posting.contactName && (
                    <span className="text-xs text-fg-muted">
                      {t("vacancies.contactCell", { name: posting.contactName })}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-fg-muted">
                      {t("vacancies.postedAgo", { when: relative(posting.createdAt) })}
                    </span>
                    {posting.status === "OPEN" && canPost && <CloseButton postingId={posting.id} />}
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
