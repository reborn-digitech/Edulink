import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, BriefcaseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { redirect } from "next/navigation";
import { listDirectory, directoryPlaces } from "@/lib/school-profile";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("explore.metaTitle") };
}

/**
 * The directory. Any signed-in person may browse — what is listed is only
 * what schools chose to publish — but the enquiry door on each profile is a
 * parent's alone.
 *
 * FILTERS ARE A GET FORM, deliberately: a filtered directory is a URL a
 * parent can send to the other parent, and the back button behaves.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; region?: string }>;
}) {
  const t = await getT();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");

  const params = await searchParams;
  const q = params.q?.slice(0, 80) ?? "";
  const country = params.country ?? "";
  const region = params.region ?? "";

  const [schools, places] = await Promise.all([
    listDirectory(ctx, { q, country: country || undefined, region: region || undefined }),
    directoryPlaces(),
  ]);
  const regions = country ? (places.regionsByCountry[country] ?? []) : [];
  const filtered = Boolean(q || country || region);

  const inputClass =
    "rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("explore.title")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("explore.intro")}</p>
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("explore.searchPlaceholder")}
            aria-label={t("explore.searchPlaceholder")}
            className={`${inputClass} pl-9`}
          />
        </label>
        <select name="country" defaultValue={country} aria-label={t("explore.countryFilter")} className={inputClass}>
          <option value="">{t("explore.anyCountry")}</option>
          {places.countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {/* Regions only make sense inside a chosen country; the select
            appears once one is picked and the page has reloaded with it. */}
        {country && regions.length > 0 && (
          <select name="region" defaultValue={region} aria-label={t("explore.regionFilter")} className={inputClass}>
            <option value="">{t("explore.anyRegion")}</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" size="sm" variant="secondary">
          {t("explore.filterCta")}
        </Button>
        {filtered && (
          <Link href="/explore" className="text-sm font-medium text-accent hover:underline">
            {t("explore.clearFilters")}
          </Link>
        )}
      </form>

      {schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon className="size-8" aria-hidden="true" />}
          title={filtered ? t("explore.noMatchesTitle") : t("explore.emptyTitle")}
          description={filtered ? t("explore.noMatchesBody") : t("explore.emptyBody")}
        />
      ) : (
        <>
          <p className="text-sm text-fg-muted">
            {schools.length === 1
              ? t("explore.resultsOne")
              : t("explore.resultsMany", { count: schools.length })}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {schools.map((school) => (
              <li key={school.schoolId}>
                <Card interactive className="h-full">
                  <Link href={`/explore/${school.schoolId}`} className="block h-full">
                    <CardBody className="space-y-2 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-fg">{school.name}</span>
                        {school.ours && (
                          <Badge tone="info" size="sm">
                            {t("explore.yourSchool")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-fg-muted">
                        {[school.city, school.region, school.country].filter(Boolean).join(", ")}
                      </p>
                      {school.about && (
                        <p className="line-clamp-2 text-sm text-fg-muted">{school.about}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                        {school.gradeLow && school.gradeHigh && (
                          <span>
                            {t("explore.grades", { low: school.gradeLow, high: school.gradeHigh })}
                          </span>
                        )}
                        {school.openVacancies > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <BriefcaseIcon className="size-3.5" aria-hidden="true" />
                            {school.openVacancies === 1
                              ? t("explore.openVacanciesOne")
                              : t("explore.openVacanciesMany", { count: school.openVacancies })}
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
