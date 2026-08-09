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

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.competitions") };
}

/**
 * Platform competitions — the ones posted for every school at once.
 * School-organised competitions are managed by their own admins and are
 * deliberately not listed here.
 */
export default async function AppAdminHome() {
  const t = await getT();
  const session = await requireAppAdmin();
  const competitions = await listPlatformCompetitions(session);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("appadmin.competitions")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t("appadmin.competitionsIntro")}</p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/appadmin/new">{t("appadmin.postCompetition")}</Link>
        </Button>
      </div>

      {competitions.length === 0 ? (
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
