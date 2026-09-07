import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listBoard } from "@/lib/vacancies";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.metaTitle") };
}

/** The platform-wide board. Staff only; the enquiry door is a teacher's. */
export default async function VacanciesBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; region?: string; subject?: string }>;
}) {
  const { q, type: rawType, region: rawRegion, subject: rawSubject } = await searchParams;
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const allPostings = await listBoard(ctx);
  const regions = [...new Set(allPostings.map((p) => p.region).filter((r): r is string => Boolean(r)))].sort();
  const subjects = [...new Set(allPostings.flatMap((p) => p.subjects))].sort();
  const type = rawType && Object.hasOwn(EMPLOYMENT_TYPE_KEYS, rawType) ? (rawType as EmploymentType) : null;
  const region = rawRegion && regions.includes(rawRegion) ? rawRegion : null;
  const subject = rawSubject && subjects.includes(rawSubject) ? rawSubject : null;
  const needle = (q ?? "").trim().toLowerCase();
  const postings = allPostings.filter(
    (p) =>
      (!type || p.employmentType === type) &&
      (!region || p.region === region) &&
      (!subject || p.subjects.includes(subject)) &&
      (!needle || [p.title, p.schoolName, p.city ?? ""].join(" ").toLowerCase().includes(needle)),
  );
  const narrowed = Boolean(type || region || subject || needle);

  return (
    <div className="space-y-6">
      <PageHeader title={t("vacancies.title")} description={t("vacancies.boardIntro")} />

      {(allPostings.length > 2 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("vacancies.searchPlaceholder"), label: t("common.searchLabel") }}
          facets={[
            {
              key: "type",
              label: t("vacancies.typeFilter"),
              value: type ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: allPostings.length },
                ...(Object.keys(EMPLOYMENT_TYPE_KEYS) as EmploymentType[]).map((k) => ({ value: k, label: t(EMPLOYMENT_TYPE_KEYS[k]), count: allPostings.filter((p) => p.employmentType === k).length })).filter((o) => o.count > 0),
              ],
            },
            ...(regions.length > 1 ? [{ key: "region", label: t("explore.regionFilter"), value: region ?? "", as: "select" as const, options: [{ value: "", label: t("explore.anyRegion") }, ...regions.map((r) => ({ value: r, label: r }))] }] : []),
            ...(subjects.length > 1 ? [{ key: "subject", label: t("staff.subjectFilter"), value: subject ?? "", as: "select" as const, options: [{ value: "", label: t("staff.allSubjects") }, ...subjects.map((r) => ({ value: r, label: r }))] }] : []),
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {postings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="size-8" aria-hidden="true" />}
          title={narrowed ? t("common.noResultsTitle") : t("vacancies.emptyTitle")}
          description={narrowed ? t("common.noResultsBody") : t("vacancies.emptyBody")}
        />
      ) : (
        <ul className="space-y-2">
          {postings.map((posting) => (
            <li key={posting.id}>
              <Card interactive>
                <Link href={`/vacancies/${posting.id}`} className="block">
                  <CardBody className="space-y-1 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-fg">{posting.title}</span>
                      <span className="text-xs text-fg-muted">
                        {t(EMPLOYMENT_TYPE_KEYS[posting.employmentType as EmploymentType] ?? "vacancies.typeFullTime")}
                      </span>
                      {posting.ours && (
                        <Badge tone="info" size="sm">
                          {t("explore.yourSchool")}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-fg-muted">
                        {t("vacancies.postedAgo", { when: relative(posting.createdAt) })}
                      </span>
                    </div>
                    <p className="text-sm text-fg-muted">
                      {[posting.schoolName, posting.city, posting.region].filter(Boolean).join(" · ")}
                    </p>
                    {posting.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {posting.subjects.map((subject) => (
                          <Badge key={subject} tone="neutral" size="sm">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
