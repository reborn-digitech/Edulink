import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listExpertsForCuration } from "@/lib/superuser";
import { EmptyState } from "@/components/ui/states";
import { CurationRow } from "./curation-row";
import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.experts") };
}

/**
 * The marketplace queue.
 *
 * WHY IT IS THE OPERATOR'S AND NOT A SCHOOL'S. An expert belongs to no school —
 * that is the whole point of a shared marketplace — so no school is in a
 * position to vouch for one, and a school that could publish would be putting an
 * adult in front of every OTHER school on the installation. Admins and teachers
 * may still invite an expert; what an invitation buys is a profile, not an
 * audience.
 */
export default async function RootExpertsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  const { q, state: rawState } = await searchParams;
  const t = await getT();
  const session = await requireSuperuser();
  const experts = await listExpertsForCuration(session);
  const state = rawState === "waiting" || rawState === "listed" ? rawState : null;
  const needle = (q ?? "").trim().toLowerCase();
  const matches = (e: (typeof experts)[number]) =>
    !needle || [e.name, e.email ?? "", e.headline, ...e.specialisms].join(" ").toLowerCase().includes(needle);

  const allWaiting = experts.filter((e) => e.publishedAt === null);
  const allListed = experts.filter((e) => e.publishedAt !== null);
  const waiting = state === "listed" ? [] : allWaiting.filter(matches);
  const listed = state === "waiting" ? [] : allListed.filter(matches);
  const narrowed = Boolean(state || needle);

  return (
    <div className="space-y-5">
      <PageHeader title={t("expert.curationTitle")} description={experts.length === 0
            ? t("expert.curationNobodyYet")
            : t("expert.curationCount", { waiting: allWaiting.length, listed: allListed.length })} />

      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("expert.curationNote")}
      </p>

      {(experts.length > 2 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("expert.searchPlaceholder"), label: t("common.searchLabel") }}
          facets={[
            {
              key: "state",
              label: t("root.stateFilter"),
              value: state ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: experts.length },
                { value: "waiting", label: t("expert.waitingForYou"), count: allWaiting.length },
                { value: "listed", label: t("expert.onMarketplace"), count: allListed.length },
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {experts.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={t("expert.curationEmpty")}
          description={t("expert.curationEmptyBody")}
        />
      ) : waiting.length === 0 && listed.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : (
        <>
          {/* Waiting first, and under its own heading. A queue mixed into a
              list of people already dealt with is a queue nobody works. */}
          {waiting.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                {t("expert.waitingForYou")}
              </h2>
              {waiting.map((entry) => (
                <CurationRow key={entry.profileId} entry={entry} />
              ))}
            </section>
          )}

          {listed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                {t("expert.onMarketplace")}
              </h2>
              {listed.map((entry) => (
                <CurationRow key={entry.profileId} entry={entry} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
