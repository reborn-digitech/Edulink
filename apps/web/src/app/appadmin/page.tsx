import Link from "next/link";
import { PlusIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listPlatformCompetitions } from "@/lib/app-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { relativeTime } from "@/lib/dates";
import { CompetitionControls } from "./competition-controls";
import { getT } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { ModelServersCard } from "@/components/quiz-review/model-servers-card";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.competitions") };
}

/**
 * Platform competitions — the ones posted for every school at once.
 * School-organised competitions are managed by their own admins and are
 * deliberately not listed here.
 */
export default async function AppAdminHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const allCompetitions = await listPlatformCompetitions(session);
  const statuses = [...new Set(allCompetitions.map((c) => c.status))];
  const status = rawStatus && statuses.includes(rawStatus) ? rawStatus : null;
  const competitions = status ? allCompetitions.filter((c) => c.status === status) : allCompetitions;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("appadmin.competitions")} description={t("appadmin.competitionsIntro")} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/appadmin/new">{t("appadmin.postCompetition")}</Link>
        </Button>
      </div>

      {/* quiz-publish-jobs (11 Oct 2026): the two model servers' state and the way to the generated bank. */}
      <ModelServersCard deskHref="/appadmin/quiz-review" />

      {statuses.length > 1 && (
        <DataToolbar
          facets={[
            {
              key: "status",
              label: t("enquiries.statusFilter"),
              value: status ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: allCompetitions.length },
                ...statuses.map((st) => ({ value: st, label: st === "PUBLISHED" ? t("appadmin.statusLive") : st === "ARCHIVED" ? t("appadmin.statusWithdrawn") : t("appadmin.statusDraft"), count: allCompetitions.filter((c) => c.status === st).length })),
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {competitions.length === 0 && status ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : competitions.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon weight="duotone" className="size-8" />}
          title={t("appadmin.noCompetitionsYet")}
          description={t("appadmin.noCompetitionsBody")}
          action={
            <Button asChild>
              <Link href="/appadmin/new">{t("appadmin.postCompetition")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{competition.title}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {competition.summary}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {competition.organizerName} ·{" "}
                      {t("appadmin.postedAgo", { when: relativeTime(competition.createdAt) })}
                    </p>
                  </div>
                  <CompetitionControls
                    competitionId={competition.id}
                    status={competition.status}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
