import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowSquareOutIcon, BriefcaseIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { readSchoolProfile } from "@/lib/school-profile";
import { findMyOpenEnquiry } from "@/lib/enquiries";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { EnquireForm } from "../enquire-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("explore.metaTitle") };
}

/**
 * One school's profile — the prospectus page. What renders here is exactly
 * what the RLS clause lets cross: the school's own words and details, its
 * open vacancies, and (for a parent) the admissions door.
 */
export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const { schoolId } = await params;

  const school = await readSchoolProfile(ctx, schoolId);
  if (!school) notFound();

  const myEnquiryId = school.canEnquire
    ? await findMyOpenEnquiry(ctx, schoolId, "ADMISSION", null)
    : null;

  const place = [school.addressLine, school.city, school.region, school.postalCode, school.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{school.name}</h1>
          {school.ours && (
            <Badge tone="info" size="sm">
              {t("explore.yourSchool")}
            </Badge>
          )}
        </div>
        {place && <p className="mt-1 text-sm text-fg-muted">{place}</p>}
      </div>

      <Card>
        <CardBody className="space-y-2 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("explore.aboutTitle")}
          </h2>
          {school.about ? (
            <p className="whitespace-pre-wrap text-sm text-fg">{school.about}</p>
          ) : (
            <p className="text-sm text-fg-muted">{t("explore.noAbout")}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-fg-muted">
            {school.gradeLow && school.gradeHigh && (
              <span>{t("explore.grades", { low: school.gradeLow, high: school.gradeHigh })}</span>
            )}
            {school.website && (
              <a
                href={school.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                {t("explore.websiteLabel")}
                <ArrowSquareOutIcon className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </CardBody>
      </Card>

      {school.vacancies.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("explore.vacanciesTitle")}
          </h2>
          <ul className="space-y-2">
            {school.vacancies.map((vacancy) => (
              <li key={vacancy.id}>
                <Card interactive>
                  <Link href={`/vacancies/${vacancy.id}`} className="block">
                    <CardBody className="flex flex-wrap items-center gap-2 py-3">
                      <BriefcaseIcon className="size-4 text-fg-muted" aria-hidden="true" />
                      <span className="font-medium text-fg">{vacancy.title}</span>
                      <span className="text-xs text-fg-muted">
                        {t(EMPLOYMENT_TYPE_KEYS[vacancy.employmentType as EmploymentType] ?? "vacancies.typeFullTime")}
                      </span>
                      <span className="ml-auto text-xs text-fg-muted">
                        {t("vacancies.postedAgo", { when: relative(vacancy.createdAt) })}
                      </span>
                    </CardBody>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {school.canEnquire && (
        <Card>
          <CardBody className="space-y-2 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
              {t("explore.admissionsTitle")}
            </h2>
            {myEnquiryId ? (
              <div className="space-y-1">
                <p className="text-sm text-fg-muted">{t("explore.yourEnquiry")}</p>
                <Link
                  href={`/enquiries/${myEnquiryId}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {t("explore.openEnquiryLink")}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-fg-muted">{t("explore.admissionsBody")}</p>
                <EnquireForm schoolId={school.schoolId} />
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
