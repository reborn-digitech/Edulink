import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/tenancy";
import { readPosting } from "@/lib/vacancies";
import { findMyOpenEnquiry } from "@/lib/enquiries";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { EnquireForm } from "../enquire-form";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.metaTitle") };
}

/** One vacancy: the advertisement, the school behind it, and — for a teacher
 *  of another school — the door to the hiring team. */
export default async function VacancyPage({
  params,
}: {
  params: Promise<{ postingId: string }>;
}) {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const { postingId } = await params;

  const posting = await readPosting(ctx, postingId);
  if (!posting) notFound();

  const myEnquiryId = posting.canEnquire
    ? await findMyOpenEnquiry(ctx, posting.schoolId, "JOB", posting.id)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={posting.title}
        meta={
          <>
            {posting.status === "CLOSED" && (
              <Badge tone="neutral" size="sm">
                {t("vacancies.closedBadge")}
              </Badge>
            )}
            {posting.ours && (
              <Badge tone="info" size="sm">
                {t("explore.yourSchool")}
              </Badge>
            )}
          </>
        }
        description={
          <>
            {[posting.schoolName, posting.city, posting.region].filter(Boolean).join(" · ")}
            {" · "}
            {t(EMPLOYMENT_TYPE_KEYS[posting.employmentType as EmploymentType] ?? "vacancies.typeFullTime")}
            {" · "}
            {t("vacancies.postedAgo", { when: relative(posting.createdAt) })}
          </>
        }
      />


      {posting.status === "CLOSED" && (
        <p className="text-sm font-medium text-fg-muted">{t("vacancies.closedNotice")}</p>
      )}

      <Card>
        <CardBody className="space-y-3 py-4">
          <p className="whitespace-pre-wrap text-sm text-fg">{posting.body}</p>
          {posting.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {posting.subjects.map((subject) => (
                <Badge key={subject} tone="neutral" size="sm">
                  {subject}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="text-sm">
        <Link
          href={`/explore/${posting.schoolId}`}
          className="font-medium text-accent hover:underline"
        >
          {t("vacancies.viewProfile")}
        </Link>
      </div>

      {posting.ours && posting.enquiryCount !== null && (
        <p className="text-sm text-fg-muted">
          {posting.enquiryCount === 0
            ? t("vacancies.enquiriesNone")
            : posting.enquiryCount === 1
              ? t("vacancies.enquiriesOne")
              : t("vacancies.enquiriesMany", { count: posting.enquiryCount })}
          {posting.contactName && <> · {t("vacancies.contactCell", { name: posting.contactName })}</>}
        </p>
      )}

      {posting.canEnquire && (
        <Card>
          <CardBody className="space-y-2 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
              {t("vacancies.enquireTitle")}
            </h2>
            {myEnquiryId ? (
              <div className="space-y-1">
                <p className="text-sm text-fg-muted">{t("vacancies.yourThread")}</p>
                <Link
                  href={`/enquiries/${myEnquiryId}`}
                  className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline"
                >
                  {t("vacancies.openThreadLink")}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-fg-muted">{t("vacancies.enquireBody")}</p>
                <EnquireForm schoolId={posting.schoolId} postingId={posting.id} />
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
