"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowSquareOutIcon, PlusIcon } from "@phosphor-icons/react";
import { COMPETITION_SOURCE_KINDS, sourceKindAudience, type CompetitionSource, type CompetitionSourceKind, type StreamCode } from "@edulink/contracts";
import { StreamPicker } from "./audience-editor"; // college-content (12 Oct 2026)
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { addSourceAction, sourceAction } from "@/app/appadmin/crawl-actions";

/**
 * THE ORGANISERS' SITES the crawler reads (competitions-crawler, 12 Oct 2026): each with its kind, whether
 * it is the organiser's own site, its last crawl's numbers or why it was refused, and the desk's acts —
 * switch off or on, remove (a stamp: what it suggested stays) — and a form to add one. Official organisers'
 * own sites only: a coaching site or an aggregator is not a source (docs/plans/competitions-crawler.md).
 */
export function SourcesPanel({ initial }: { initial: CompetitionSource[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [sources, setSources] = useState(initial);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rootUrl, setRootUrl] = useState("");
  const [organiser, setOrganiser] = useState("");
  const [kind, setKind] = useState<CompetitionSourceKind | "">("");
  const [official, setOfficial] = useState(true);
  // college-content (12 Oct 2026): a college organiser's streams.
  const [streams, setStreams] = useState<StreamCode[]>([]);
  const collegeKind = kind !== "" && sourceKindAudience(kind) !== "SCHOOL";

  const act = (id: string, action: "ENABLE" | "DISABLE" | "REMOVE") =>
    startTransition(async () => {
      const result = await sourceAction(id, action);
      if (!result.ok) return void toast({ tone: "danger", title: result.error });
      setSources(result.sources);
      setConfirming(null);
      toast({ tone: "ok", title: t(`competitionCrawl.source${action}Done`) });
      router.refresh();
    });

  const add = () => {
    if (!kind) return void toast({ tone: "danger", title: t("competitionCrawl.sourceFieldsNeeded") });
    startTransition(async () => {
      const result = await addSourceAction({ name, rootUrl, organiser, kind, official, ...(collegeKind && streams.length ? { streams } : {}) });
      if (!result.ok) return void toast({ tone: "danger", title: result.error });
      setSources(result.sources);
      setName("");
      setRootUrl("");
      setOrganiser("");
      setKind("");
      setOfficial(true);
      setStreams([]);
      toast({ tone: "ok", title: t("competitionCrawl.sourceAdded") });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4" aria-busy={pending || undefined}>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-semibold text-fg">{s.name}</p>
                  <p className="text-xs text-fg-muted">{s.organiser}</p>
                  <a href={s.rootUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-1 break-all text-sm text-accent-strong underline-offset-2 hover:underline">
                    {s.rootUrl}
                    <ArrowSquareOutIcon aria-hidden="true" className="size-4 shrink-0" />
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge size="sm" tone="outline">{t(`competitionCrawl.kind${s.kind}`)}</Badge>
                  {/* college-content (12 Oct 2026): a college organiser's streams. */}
                  {s.streams?.length ? <Badge size="sm" tone="outline">{s.streams.map((x) => t(`streams.${x}.name` as never)).join(", ")}</Badge> : null}
                  <Badge size="sm" tone={s.enabled ? "ok" : "neutral"}>{s.enabled ? t("competitionCrawl.sourceOn") : t("competitionCrawl.sourceOff")}</Badge>
                  {s.official ? <Badge size="sm" tone="accent">{t("competitionCrawl.officialBadge")}</Badge> : <Badge size="sm" tone="warn">{t("competitionCrawl.notOfficialBadge")}</Badge>}
                  {s.waiting > 0 && <Badge size="sm" tone="info">{t("competitionCrawl.waitingCount", { count: s.waiting })}</Badge>}
                </div>
              </div>
              <p className="mt-2 text-sm text-fg-muted">
                {!s.lastCrawledAt
                  ? t("competitionCrawl.neverCrawled")
                  : s.lastResult?.refused
                    ? t("competitionCrawl.lastRefused", { when: formatInZone(new Date(s.lastCrawledAt), "Asia/Kolkata"), reason: t(`competitionCrawl.refusal${s.lastResult.refused.reason}`) })
                    : t("competitionCrawl.lastResult", {
                        when: formatInZone(new Date(s.lastCrawledAt), "Asia/Kolkata"),
                        pages: s.lastResult?.pages ?? 0,
                        cached: s.lastResult?.cached ?? 0,
                        candidates: s.lastResult?.candidates ?? 0,
                        drafted: s.lastResult?.drafted ?? 0,
                        rejected: s.lastResult?.rejected ?? 0,
                      })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(s.id, s.enabled ? "DISABLE" : "ENABLE")}>
                  {s.enabled ? t("competitionCrawl.switchOff") : t("competitionCrawl.switchOn")}
                </Button>
                {confirming === s.id ? (
                  <>
                    <Button size="sm" variant="danger" disabled={pending} onClick={() => act(s.id, "REMOVE")}>
                      {t("competitionCrawl.removeConfirm")}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(null)}>
                      {t("competitionCrawl.cancel")}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(s.id)}>
                    {t("competitionCrawl.remove")}
                  </Button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("competitionCrawl.addTitle")} description={t("competitionCrawl.addIntro")} />
        <CardBody>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <TextField label={t("competitionCrawl.sourceName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
            <TextField label={t("competitionCrawl.sourceRoot")} value={rootUrl} onChange={(e) => setRootUrl(e.target.value)} maxLength={500} inputMode="url" hint={t("competitionCrawl.sourceRootHint")} required />
            <TextField label={t("competitionCrawl.sourceOrganiser")} value={organiser} onChange={(e) => setOrganiser(e.target.value)} maxLength={140} required />
            <SelectField label={t("competitionCrawl.sourceKind")} value={kind} onChange={(e) => setKind(e.target.value as CompetitionSourceKind | "")} required>
              <option value="">{t("quizJobs.choose")}</option>
              {COMPETITION_SOURCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`competitionCrawl.kind${k}`)}
                </option>
              ))}
            </SelectField>
            {collegeKind && <StreamPicker legend={t("competitionAudience.sourceStreams")} hint={t("competitionAudience.sourceStreamsHint")} value={streams} onChange={setStreams} />}
            <CheckboxField label={t("competitionCrawl.officialLabel")} description={t("competitionCrawl.officialHint")} checked={official} onChange={(e) => setOfficial(e.target.checked)} />
            <Button type="submit" size="sm" disabled={pending}>
              {t("competitionCrawl.addSource")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
