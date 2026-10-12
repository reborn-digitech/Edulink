import type { ReactNode } from "react";
import Link from "next/link";
import { PlusIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { COMPETITION_SUGGESTION_SHOWS, type CompetitionSuggestionShow } from "@edulink/contracts";
import { requireAppAdmin } from "@/lib/tenancy";
import { listPlatformCompetitions } from "@/lib/app-admin";
import { deskCrawls, deskSources, deskSuggestions } from "@/lib/competition-crawl-desk";
import { SUBJECT_KEY } from "@/lib/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { CompetitionControls } from "@/app/appadmin/competition-controls";
import { CrawlCard } from "./crawl-card";
import { SuggestionCard } from "./suggestion-card";
import { SourcesPanel } from "./sources-panel";
import { AudienceEditor } from "./audience-editor"; // college-content (12 Oct 2026)

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * THE COMPETITIONS DESK, for the content team at /appadmin and the operator at /root/competitions
 * (competitions-crawler, 12 Oct 2026): three tabs — the platform's competitions (as /appadmin always
 * listed them), "Suggested from the web" (the crawl card and what the crawler suggested, with a filter
 * for the published ones whose page changed since review, and the dismissed), and the sources the
 * crawler reads. Every read asserts the content team's gate (the operator passes it).
 */
export async function CompetitionsDeskPage({ base, searchParams, top }: { base: string; searchParams: SearchParams; top?: ReactNode }) {
  const sp = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const tabRaw = one(sp.tab);
  const tab = tabRaw === "web" ? "web" : tabRaw === "sources" ? "sources" : "list";
  const showRaw = (one(sp.show) ?? "SUGGESTED").toUpperCase();
  const show = ((COMPETITION_SUGGESTION_SHOWS as readonly string[]).includes(showRaw) ? showRaw : "SUGGESTED") as CompetitionSuggestionShow;
  const suggestions = await deskSuggestions(session, tab === "web" ? show : "SUGGESTED");
  const subjectLabels = Object.fromEntries(Object.entries(SUBJECT_KEY).map(([code, key]) => [code, t(key)]));

  const tabs = [
    { key: "list", href: base, label: t("appadmin.competitions") },
    { key: "web", href: `${base}?tab=web`, label: t("competitionCrawl.tabWeb"), count: suggestions.counts.suggested + suggestions.counts.changed },
    { key: "sources", href: `${base}?tab=sources`, label: t("competitionCrawl.tabSources") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("appadmin.competitions")} description={t("appadmin.competitionsIntro")} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/appadmin/new">{t("appadmin.postCompetition")}</Link>
        </Button>
      </div>
      {top}
      <TabBar tabs={tabs} current={tab} ariaLabel={t("competitionCrawl.tabsLabel")} />
      {tab === "list" && <PlatformList session={session} status={one(sp.status)} />}
      {tab === "web" && <WebTab session={session} base={base} show={show} suggestions={suggestions} subjectLabels={subjectLabels} />}
      {tab === "sources" && <SourcesPanel initial={await deskSources(session)} />}
    </div>
  );
}

async function PlatformList({ session, status: rawStatus }: { session: Awaited<ReturnType<typeof requireAppAdmin>>; status: string | undefined }) {
  const t = await getT();
  const allCompetitions = await listPlatformCompetitions(session);
  const statuses = [...new Set(allCompetitions.map((c) => c.status))];
  const status = rawStatus && statuses.includes(rawStatus) ? rawStatus : null;
  const competitions = status ? allCompetitions.filter((c) => c.status === status) : allCompetitions;
  return (
    <>
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
                    <p className="truncate text-xs text-fg-muted">{competition.summary}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {competition.organizerName} · {t("appadmin.postedAgo", { when: relativeTime(competition.createdAt) })}
                    </p>
                  </div>
                  <CompetitionControls competitionId={competition.id} status={competition.status} />
                </div>
                {/* college-content (12 Oct 2026): who it is for. */}
                <div className="mt-3 border-t border-border pt-3">
                  <AudienceEditor competitionId={competition.id} audience={competition.audience === "SCHOOL" || competition.audience === "COLLEGE" ? competition.audience : null} streams={competition.streams} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function WebTab({ session, base, show, suggestions, subjectLabels }: { session: Awaited<ReturnType<typeof requireAppAdmin>>; base: string; show: CompetitionSuggestionShow; suggestions: Awaited<ReturnType<typeof deskSuggestions>>; subjectLabels: Record<string, string> }) {
  const t = await getT();
  const [crawls, sources] = await Promise.all([deskCrawls(session), deskSources(session)]);
  const chips: { key: CompetitionSuggestionShow; label: string; count: number }[] = [
    { key: "SUGGESTED", label: t("competitionCrawl.showSUGGESTED"), count: suggestions.counts.suggested },
    { key: "CHANGED", label: t("competitionCrawl.showCHANGED"), count: suggestions.counts.changed },
    { key: "DISMISSED", label: t("competitionCrawl.showDISMISSED"), count: suggestions.counts.dismissed },
  ];
  return (
    <div className="space-y-4">
      <CrawlCard initial={crawls} enabledSources={sources.filter((s) => s.enabled).length} />
      <p className="text-sm text-fg-muted">{t("competitionCrawl.tabIntro")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("competitionCrawl.showLabel")}>
        {chips.map((c) => (
          <ChipLink key={c.key} href={`${base}?tab=web&show=${c.key}`} current={show === c.key}>
            {t("competitionCrawl.chip", { label: c.label, count: c.count })}
          </ChipLink>
        ))}
      </div>
      {suggestions.items.length === 0 ? (
        <EmptyState title={t(`competitionCrawl.empty${show}`)} description={t(`competitionCrawl.empty${show}Body`)} />
      ) : (
        <ul className="space-y-3">
          {suggestions.items.map((item) => (
            <li key={item.competitionId}>
              <SuggestionCard item={item} subjectLabels={subjectLabels} />
              {/* college-content (12 Oct 2026): who it is for, as landed from the page and the source, set here. */}
              <div className="mt-2 px-1">
                <AudienceEditor competitionId={item.competitionId} audience={item.audience ?? null} streams={item.streams ?? []} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
