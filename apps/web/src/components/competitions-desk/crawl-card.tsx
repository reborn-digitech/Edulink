"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CpuIcon, GlobeIcon, PlayIcon, StopIcon } from "@phosphor-icons/react";
import { COMPETITION_CRAWL_ACTIVE_STATES, CRAWL_REJECT_REASONS, type CompetitionCrawlJob, type CompetitionCrawlState } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { crawlStateAction, startCrawlAction, stopCrawlAction } from "@/app/appadmin/crawl-actions";

const POLL_ACTIVE_MS = 3_000;
const POLL_IDLE_MS = 20_000;

const isActive = (job: CompetitionCrawlJob | null) => !!job && (COMPETITION_CRAWL_ACTIVE_STATES as readonly string[]).includes(job.state);

/**
 * THE CRAWL, STARTED AND STOPPED FROM THE DESK (competitions-crawler, 12 Oct 2026): Start reads every
 * enabled source; the live line the runner rewrites after every page (read again every three seconds while
 * a crawl runs); Stop; the two model servers' state (their own Start and Stop are on the quiz bank desk).
 * The rules — one crawl at a time, the servers a crawl brought up go down with it or to a quiz run still
 * going — are the library's (src/lib/competition-crawl-jobs.ts); this card only asks.
 */
export function CrawlCard({ initial, enabledSources }: { initial: CompetitionCrawlState; enabledSources: number }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<CompetitionCrawlState>(initial);
  const job = state.current;
  const active = isActive(job);

  useEffect(() => {
    const id = window.setInterval(() => {
      void crawlStateAction().then((result) => {
        if (!result.ok) return;
        setState(result.state);
        // New suggestions land while the crawl goes on: the tab's list moves.
        if (active) router.refresh();
      });
    }, active ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return () => window.clearInterval(id);
  }, [active, router]);

  const start = () =>
    startTransition(async () => {
      const result = await startCrawlAction();
      if (!result.ok) return void toast({ tone: "danger", title: result.error });
      toast({ tone: "ok", title: t("competitionCrawl.started") });
      setState(result.state);
    });

  const stop = () => {
    if (!job) return;
    startTransition(async () => {
      const result = await stopCrawlAction(job.id);
      if (!result.ok) return void toast({ tone: "danger", title: result.error });
      toast({ tone: "ok", title: t("competitionCrawl.stopAsked") });
      setState(result.state);
    });
  };

  return (
    <Card aria-busy={pending || undefined}>
      <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("competitionCrawl.cardTitle")} description={t("competitionCrawl.cardIntro")} />
      <CardBody className="space-y-4">
        {!active && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={start} disabled={pending || enabledSources === 0} icon={<PlayIcon weight="bold" aria-hidden="true" />}>
              {t("competitionCrawl.start")}
            </Button>
            <span className="text-sm text-fg-muted">{enabledSources === 0 ? t("competitionCrawl.noSourcesOn") : t("competitionCrawl.startHint", { count: enabledSources })}</span>
          </div>
        )}

        {job ? <LiveLine job={job} active={active} onStop={stop} pending={pending} /> : <p className="text-sm text-fg-muted">{t("competitionCrawl.noCrawl")}</p>}

        <section className="space-y-1 border-t border-border pt-3" aria-label={t("quizJobs.serversTitle")}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CpuIcon aria-hidden="true" className="size-4" />
            {t("quizJobs.serversTitle")}
          </h3>
          <ul className="space-y-1">
            {state.servers.map((s) => (
              <li key={s.server} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-40 font-medium text-fg">{t(`quizJobs.server${s.server}`)}</span>
                <Badge size="sm" tone={s.state === "RUNNING" ? "ok" : s.state === "STARTING" ? "warn" : "neutral"}>
                  {t(`quizJobs.server${s.state}`)}
                </Badge>
                <span className="text-xs text-fg-muted">{t("quizJobs.serverLine", { model: s.model, port: s.port ?? "—" })}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-muted">{t("competitionCrawl.serversNote")}</p>
        </section>

        {state.recent.filter((r) => r.id !== job?.id).length > 0 && (
          <section className="space-y-1 border-t border-border pt-3">
            <h3 className="text-sm font-semibold">{t("competitionCrawl.recent")}</h3>
            <ul className="space-y-0.5 text-sm text-fg-muted">
              {state.recent
                .filter((r) => r.id !== job?.id)
                .map((r) => (
                  <li key={r.id}>
                    {t("competitionCrawl.recentLine", { state: t(`quizJobs.state${r.state}`), when: formatInZone(new Date(r.createdAt), "Asia/Kolkata"), drafted: r.progress?.drafted ?? 0, pages: r.progress?.pagesRead ?? 0 })}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </CardBody>
    </Card>
  );
}

function LiveLine({ job, active, onStop, pending }: { job: CompetitionCrawlJob; active: boolean; onStop: () => void; pending: boolean }) {
  const t = useT();
  const p = job.progress;
  const tone = job.state === "FAILED" ? "danger" : job.state === "FINISHED" ? "ok" : job.state === "STOPPED" ? "neutral" : "accent";
  const rejects = Object.fromEntries(CRAWL_REJECT_REASONS.map((r) => [r, p?.rejects[r] ?? 0]));
  return (
    <section className="space-y-2" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{t(`quizJobs.state${job.state}`)}</Badge>
        {active && p && <span className="text-sm text-fg">{job.state === "STOPPING" ? t("competitionCrawl.phaseHALTING") : t(`competitionCrawl.phase${p.phase}`)}</span>}
        {active && (
          <Button size="sm" variant="danger" onClick={onStop} disabled={pending || job.state === "STOPPING"} icon={<StopIcon weight="bold" aria-hidden="true" />} className="ml-auto">
            {t("competitionCrawl.stop")}
          </Button>
        )}
      </div>
      {p && (
        <div className="space-y-1 rounded-[var(--radius-md)] border border-border p-3 text-sm">
          {p.source && <p className="font-medium text-fg">{t("competitionCrawl.readingNow", { source: p.source })}</p>}
          <p className="text-fg-muted">{t("competitionCrawl.liveLine", { visited: p.sourcesVisited, total: p.sourcesTotal, pages: p.pagesRead, cached: p.cachedHits, candidates: p.candidates })}</p>
          <p className="text-fg-muted">{t("competitionCrawl.landedLine", { drafted: p.drafted, updated: p.updated, dismissed: p.dismissedUnchanged, changed: p.changedPublished })}</p>
          <p className="text-fg-muted">{t("competitionCrawl.rejectsLine", rejects)}</p>
          {p.refused.length > 0 && (
            <p className="text-warn">{t("competitionCrawl.refusedLine", { list: p.refused.map((r) => `${r.source} (${t(`competitionCrawl.refusal${r.reason}`)})`).join("; ") })}</p>
          )}
        </div>
      )}
      {job.error && <p className="text-sm text-danger">{t("quizJobs.errorLine", { error: job.error })}</p>}
      <p className="text-xs text-fg-muted">
        {t("quizJobs.startedBy", { name: job.startedBy, role: t(job.startedByRole === "OPERATOR" ? "quizReview.roleOPERATOR" : "quizReview.roleAPP_ADMIN"), when: formatInZone(new Date(job.createdAt), "Asia/Kolkata") })}
      </p>
    </section>
  );
}
