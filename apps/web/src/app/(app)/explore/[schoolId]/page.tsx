import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowSquareOutIcon, BriefcaseIcon, DoorOpenIcon, MegaphoneIcon, SealCheckIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { readSchoolProfile } from "@/lib/school-profile";
import { findMyOpenEnquiry } from "@/lib/enquiries";
import { schoolAdmissions } from "@/lib/admissions";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { ADMISSION_STATUS_KEY, ADMISSION_STATUS_TONE } from "@/components/admissions/labels";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT, getRelativeTime, getLocale } from "@/lib/i18n/server";
import { EMPLOYMENT_TYPE_KEYS, type EmploymentType } from "@/lib/constants";
import { EnquireForm } from "../enquire-form";
import { PageHeader } from "@/components/ui/page-header";
import { mayUse } from "@/lib/platform-features";
import { websiteHref } from "@/lib/website-address";

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
  const locale = await getLocale();
  const relative = await getRelativeTime();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const { schoolId } = await params;

  const school = await readSchoolProfile(ctx, schoolId);
  if (!school) notFound();

  const [myEnquiryId, admissions] = await Promise.all([
    school.canEnquire ? findMyOpenEnquiry(ctx, schoolId, "ADMISSION", null) : Promise.resolve(null),
    schoolAdmissions(ctx, schoolId),
  ]);

  const place = [school.addressLine, school.city, school.region, school.postalCode, school.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={school.name}
        description={place || undefined}
        meta={
          <>
            {school.verified && (
              <Badge tone="accent" size="sm">
                <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
                {t("explore.verifiedBadge")}
              </Badge>
            )}
            {school.ours && (
              <Badge tone="info" size="sm">
                {t("explore.yourSchool")}
              </Badge>
            )}
          </>
        }
      />


      {/* The prospectus numbers — counts and only counts; see school-profile.ts. */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [t("explore.metricPupils"), school.metrics.pupils],
          [t("explore.metricTeachers"), school.metrics.teachers],
          [t("explore.metricClasses"), school.metrics.classes],
          [t("explore.metricSince"), school.sinceYear],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
            <dd className="text-lg font-bold tabular-nums text-fg">{value}</dd>
          </div>
        ))}
      </dl>

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
            {/* A link only for an http(s) address, whatever an older row holds (QA-27). */}
            {websiteHref(school.website) && (
              <a
                href={websiteHref(school.website)!}
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

      {school.achievements.length > 0 && (
        <Card>
          <CardBody className="space-y-2 py-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              <TrophyIcon weight="duotone" className="size-4" aria-hidden="true" />
              {t("explore.achievementsTitle")}
            </h2>
            <ul className="space-y-1.5">
              {school.achievements.map((a) => (
                <li key={a.competitionTitle} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-fg">{a.competitionTitle}</span>
                  <span className="text-fg-muted">
                    {a.bestRank !== null && t("explore.bestPlace", { rank: a.bestRank })}
                    {a.participants > 0 && ` · ${
                      a.participants === 1
                        ? t("explore.entrantsOne")
                        : t("explore.entrantsMany", { count: a.participants })
                    }`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">{t("explore.achievementsNote")}</p>
          </CardBody>
        </Card>
      )}

      {school.highlights.length > 0 && (
        <Card>
          <CardBody className="space-y-2 py-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              <MegaphoneIcon weight="duotone" className="size-4" aria-hidden="true" />
              {t("explore.highlightsTitle")}
            </h2>
            <ul className="space-y-1.5">
              {school.highlights.map((post) => (
                <li key={post.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <Link href={`/bulletin/${post.id}`} className="font-medium text-fg hover:underline">
                    {post.title}
                  </Link>
                  <span className="text-xs text-fg-muted">{relative(post.createdAt)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">{t("explore.highlightsNote")}</p>
          </CardBody>
        </Card>
      )}

      {school.vacancies.length > 0 && (await mayUse("JOB_BOARD", ctx)) && (
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

      {/* The admissions door: every open cycle (QA-17: a mid-year round beside next year's), what each asks for, and the reader's own applications here. See admissions.ts. */}
      {admissions.cycles.length > 0 && (
        <Card data-testid="admissions-card">
          <CardBody className="space-y-3 py-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              <DoorOpenIcon weight="duotone" className="size-4" aria-hidden="true" />
              {t("admissions.applyHere")}
            </h2>
            {admissions.cycles.map((cycle, i) => (
              <div key={cycle.cycleId} data-testid="admissions-cycle" className={i > 0 ? "space-y-3 border-t border-border pt-3" : "space-y-3"}>
                <p className="text-sm font-medium text-fg">{t("admissions.applyIntro", { cycle: cycle.name, year: cycle.academicYearName })}</p>
                <ul className="space-y-1 text-sm text-fg-muted">
                  {cycle.grades.map((g) => (
                    <li key={g.grade}>{`${t("admissions.grade")} ${g.grade} · ${t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats })}`}</li>
                  ))}
                  {cycle.closesAt && <li>{t("admissions.closesOn", { date: formatDateKey(cycle.closesAt, undefined, locale) })}</li>}
                  {cycle.documents.length > 0 && <li>{t("admissions.documentsAsked", { names: cycle.documents.map((d) => d.name).join(", ") })}</li>}
                  {cycle.testRequired && <li>{t("admissions.testAsked")}</li>}
                </ul>
                {cycle.notice && <p className="whitespace-pre-wrap text-sm text-fg">{cycle.notice}</p>}
                {ctx.role === "PARENT" && (
                  <Button asChild size="sm">
                    <Link href={`/explore/${school.schoolId}/apply?cycle=${encodeURIComponent(cycle.cycleId)}`} aria-label={admissions.cycles.length > 1 ? `${t("admissions.apply")}: ${cycle.name}` : undefined}>
                      {t("admissions.apply")}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
            {admissions.mine.length > 0 && (
              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("admissions.yourApplicationsHere")}</p>
                <ul className="space-y-1">
                  {admissions.mine.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link href={`/parent/applications/${row.id}`} className="font-medium text-fg hover:underline">
                          {row.childName}
                        </Link>
                        <Badge tone={ADMISSION_STATUS_TONE[row.status]} size="sm">{t(ADMISSION_STATUS_KEY[row.status])}</Badge>
                      </span>
                      <Link href={`/parent/applications/${row.id}`} className="text-xs font-medium text-accent hover:underline">
                        {t("admissions.viewApplication")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
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
