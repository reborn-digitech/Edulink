import Link from "next/link";
import { BuildingsIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listSchools, schoolCountries } from "@/lib/superuser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { BulkSelectProvider, SelectSchool } from "./bulk-select";
import { UsageSummary } from "./usage-summary";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.schools") };
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; country?: string; sort?: string }>;
}) {
  const { q, state: rawState, country: rawCountry, sort: rawSort } = await searchParams;
  const t = await getT();
  const relativeTime = await getRelativeTime();
  const session = await requireSuperuser();
  const state = rawState === "removed" || rawState === "noadmin" || rawState === "unverified" || rawState === "test" || rawState === "all" ? rawState : "live";
  const sort = rawSort === "oldest" || rawSort === "name" ? rawSort : "newest";
  const countries = await schoolCountries(session);
  const country = rawCountry && countries.includes(rawCountry) ? rawCountry : undefined;
  const [schools, totals] = await Promise.all([
    listSchools(session, { q, state, country, sort }),
    listSchools(session, { state: "all" }),
  ]);
  // The fixtures are their own chip: the default list is the real schools, 14 ZZ schools once buried the four that were.
  const real = totals.filter((s) => !s.isTestFixture);
  const liveCount = real.filter((s) => !s.removedAt).length;
  const narrowed = Boolean(q || state !== "live" || country);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("root.schools")} description={totals.length === 0
              ? t("root.nothingHereYet")
              : totals.length === 1
                ? t("root.schoolsOnServerOne")
                : t("root.schoolsOnServerMany", { count: totals.length })} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/root/new">{t("root.addSchool")}</Link>
        </Button>
      </div>

      {/* Said once, on the page it applies to, rather than only in a comment. */}
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("root.operatorIntro")}
      </p>

      {/* This month against each school's plan, from the nightly rows; only when there is a live school to count. */}
      {liveCount > 0 && <UsageSummary session={session} />}

      {(totals.length > 1 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("root.searchPlaceholder"), label: t("common.searchLabel") }}
          sort={{
            label: t("common.sortBy"),
            value: sort,
            defaultValue: "newest",
            options: [
              { value: "newest", label: t("common.newest") },
              { value: "oldest", label: t("common.oldest") },
              { value: "name", label: t("common.byName") },
            ],
          }}
          facets={[
            {
              key: "state",
              label: t("root.stateFilter"),
              value: state,
              defaultValue: "live",
              options: [
                { value: "live", label: t("root.stateLive"), count: liveCount },
                { value: "noadmin", label: t("root.stateNoAdmin"), count: real.filter((s) => !s.removedAt && s.pendingAdminInvites > 0).length },
                { value: "unverified", label: t("root.stateUnverified"), count: real.filter((s) => !s.removedAt && !s.verifiedAt).length },
                { value: "removed", label: t("root.removedBadge"), count: real.length - liveCount },
                { value: "test", label: t("root.stateTest"), count: totals.length - real.length },
                { value: "all", label: t("vacancies.filterAll"), count: totals.length },
              ],
            },
            ...(countries.length > 1
              ? [{ key: "country", label: t("explore.countryFilter"), value: country ?? "", as: "select" as const, options: [{ value: "", label: t("explore.anyCountry") }, ...countries.map((c) => ({ value: c, label: c }))] }]
              : []),
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {schools.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon weight="duotone" className="size-8" />}
          title={t("root.noSchoolsYet")}
          description={t("root.addFirstOne")}
          action={
            <Button asChild>
              <Link href="/root/new">{t("root.addSchool")}</Link>
            </Button>
          }
        />
      ) : (
        <BulkSelectProvider schools={schools.map((s) => ({ id: s.id, name: s.name }))}>
        <ul className="space-y-2">
          {schools.map((school) => (
            <li key={school.id}>
              <Card className={`flex items-stretch ${school.removedAt ? "opacity-70" : ""}`}>
                <div className="flex items-center pl-2">
                  <SelectSchool id={school.id} name={school.name} />
                </div>
                <Link href={`/root/${school.id}`} className="block min-w-0 flex-1 p-4 pl-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">{school.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {[school.city, school.country].filter(Boolean).join(", ") || t("root.noAddress")} ·{" "}
                        {school.removedAt
                          ? t("root.removedAgo", { when: relativeTime(school.removedAt) })
                          : t("root.joinedAgo", { when: relativeTime(school.createdAt) })}
                      </p>
                      {!school.removedAt && (
                        <p className="mt-0.5 truncate text-xs text-fg-subtle">
                          {t("root.joinCode")} <span className="font-mono font-semibold">{school.code}</span>
                          {school.gradeLow && school.gradeHigh
                            ? ` · ${t("root.gradesRange", { low: school.gradeLow, high: school.gradeHigh })}`
                            : ` · ${t("root.noGradeRange")}`}
                        </p>
                      )}
                    </div>

                    {school.removedAt ? (
                      <Badge tone="danger" size="sm">
                        {t("root.removedBadge")}
                      </Badge>
                    ) : (
                      <>
                        {!school.verifiedAt && (
                          <Badge tone="warn" size="sm">
                            {t("root.stateUnverified")}
                          </Badge>
                        )}
                        {school.pendingAdminInvites > 0 && (
                          <Badge tone="warn" size="sm">
                            {school.pendingAdminInvites === 1
                              ? t("root.invitesPendingOne")
                              : t("root.invitesPendingMany", { count: school.pendingAdminInvites })}
                          </Badge>
                        )}
                        {!school.gradeLow || !school.gradeHigh ? (
                          <span
                            className="flex items-center gap-1 text-xs font-medium text-warn"
                            title={t("root.needsSetupTitle")}
                          >
                            <WarningIcon weight="bold" className="size-4" />
                            {t("root.needsSetup")}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
        </BulkSelectProvider>
      )}
    </div>
  );
}
