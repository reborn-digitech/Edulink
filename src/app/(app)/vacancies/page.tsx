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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.metaTitle") };
}

/** The platform-wide board. Staff only; the enquiry door is a teacher's. */
export default async function VacanciesBoardPage() {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const postings = await listBoard(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("vacancies.title")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("vacancies.boardIntro")}</p>
      </div>

      {postings.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="size-8" aria-hidden="true" />}
          title={t("vacancies.emptyTitle")}
          description={t("vacancies.emptyBody")}
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
