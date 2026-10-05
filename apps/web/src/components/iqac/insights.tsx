import Link from "next/link";
import { InfoIcon, LightbulbIcon } from "@phosphor-icons/react/ssr";
import type { InsightCta, NaacInsights, NbaInsights, NirfInsights } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Translate } from "@/lib/i18n/dictionary";
import { recomputeAction } from "@/app/(app)/iqac/actions";

/**
 * "Actionable insights" (module IQAC, 5 Oct 2026), drawn on every
 * accreditation page from lib/iqac-insights.ts: the way to the next band (or
 * the SAR's marks, or the NIRF estimate), the steps ranked by what one unit
 * buys, each with its call to action — a link (44 px) when the reader is one
 * who makes that change, else the page and who to ask — and "what you did
 * last" from the audit log. Every section carries the sentence that the
 * platform does not score for NAAC, NBA or NIRF.
 */

type Who = string | null | undefined;

export function InsightsNotAScore({ t }: { t: Translate }) {
  return (
    <p className="flex items-start gap-2 rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted" data-testid="insights-not-a-score">
      <InfoIcon weight="duotone" className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t("insights.notAScore")}
    </p>
  );
}

/** A call to action: a link for a reader who makes the change there, else the page and who does it. */
export function CtaLink({ t, cta, role }: { t: Translate; cta: InsightCta; role: Who }) {
  if (role && (cta.roles as string[]).includes(role)) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href={cta.href} data-testid={`cta-${cta.code}`}>
          {cta.label}
        </Link>
      </Button>
    );
  }
  return <span className="text-sm text-fg-muted">{t("insights.ctaAsk", { label: cta.label })}</span>;
}

function Step({ t, sentence, cta, role }: { t: Translate; sentence: string; cta: InsightCta; role: Who }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0">
      <span className="min-w-0 flex-1 basis-64 text-sm">{sentence}</span>
      <CtaLink t={t} cta={cta} role={role} />
    </li>
  );
}

function StepList<T extends { code: string; sentence: string; cta: InsightCta }>({ t, rows, role, limit }: { t: Translate; rows: T[]; role: Who; limit: number }) {
  const head = rows.slice(0, limit);
  const rest = rows.slice(limit);
  return (
    <>
      <ol>
        {head.map((r) => (
          <Step key={r.code} t={t} sentence={r.sentence} cta={r.cta} role={role} />
        ))}
      </ol>
      {rest.length ? (
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-accent-strong">{t("insights.moreRanked", { n: rest.length })}</summary>
          <ol>
            {rest.map((r) => (
              <Step key={r.code} t={t} sentence={r.sentence} cta={r.cta} role={role} />
            ))}
          </ol>
        </details>
      ) : null}
    </>
  );
}

const when = (iso: string, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

function LastDone({ t, rows, locale, sinceKey, recompute }: { t: Translate; rows: NaacInsights["lastDone"]; locale: string; sinceKey: "insights.doneSince" | "insights.doneSinceFiling"; recompute?: { cycleId: string; back: string } | null }) {
  return (
    <section className="space-y-2" aria-labelledby="insights-done">
      <h3 id="insights-done" className="text-sm font-semibold text-fg">
        {t("insights.doneTitle")}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("insights.doneNone")}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={`${r.action}:${r.at}`} className="flex flex-wrap items-center gap-2">
              <span>{t("insights.doneLine", { action: r.label, by: r.by ?? "—", at: when(r.at, locale) })}</span>
              <Badge tone={r.sinceCompute ? "warn" : "neutral"}>{t(r.sinceCompute ? sinceKey : "insights.doneCounted")}</Badge>
            </li>
          ))}
        </ul>
      )}
      {recompute && rows.some((r) => r.sinceCompute) ? (
        <form action={recomputeAction}>
          <input type="hidden" name="back" value={recompute.back} />
          <input type="hidden" name="cycleId" value={recompute.cycleId} />
          <Button type="submit" size="sm">
            {t("iqac.recompute")}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

/** The NAAC section: on the predictor, the principal's accreditation page and the simulator's "show as insights". */
export function NaacInsightsSection({ t, insights, role, locale, back, limit = 8, canRecompute = false, simulatorHref = "/iqac/simulator" }: { t: Translate; insights: NaacInsights; role: Who; locale: string; back: string; limit?: number; canRecompute?: boolean; simulatorHref?: string | null }) {
  return (
    <Card data-testid="insights-naac">
      <CardHeader
        id="insights"
        icon={<LightbulbIcon weight="duotone" className="size-5" />}
        title={t("insights.title")}
        description={t("insights.intro")}
        action={
          simulatorHref ? (
            <Button asChild size="sm" variant="soft">
              <Link href={simulatorHref}>{t("insights.openSimulator")}</Link>
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-5">
        {insights.scenarioName ? <p className="text-sm font-medium">{t("insights.scenarioBanner", { name: insights.scenarioName })}</p> : null}
        {insights.paths.length === 0 ? <p className="text-sm">{t("insights.atTop")}</p> : null}
        {insights.paths.map((p) => (
          <section key={p.grade} className="space-y-2" aria-label={t("insights.targetTitle", { grade: p.grade })}>
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              {t("insights.targetTitle", { grade: p.grade })}
              <Badge tone={p.reachable ? "ok" : "warn"}>{p.distance.toFixed(2)}</Badge>
            </h3>
            <p className="text-sm">{p.sentence}</p>
            <ol>
              {p.steps.map((s) => (
                <Step key={s.code} t={t} sentence={s.sentence} cta={s.cta} role={role} />
              ))}
            </ol>
          </section>
        ))}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-fg">{t("insights.rankedTitle")}</h3>
          <p className="text-sm text-fg-muted">{t("insights.rankedIntro")}</p>
          <StepList t={t} rows={insights.ranked} role={role} limit={limit} />
        </section>
        {insights.qualitative.length ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-fg">{t("insights.qualitativeTitle")}</h3>
            <StepList t={t} rows={insights.qualitative} role={role} limit={limit} />
          </section>
        ) : null}
        <LastDone t={t} rows={insights.lastDone} locale={locale} sinceKey="insights.doneSince" recompute={canRecompute ? { cycleId: insights.cycle.id, back } : null} />
        <InsightsNotAScore t={t} />
      </CardBody>
    </Card>
  );
}

/** The IQAC home's card: the way to the next band in a line, the three best steps, and the way to the rest. */
export function InsightsSummaryCard({ t, insights, role }: { t: Translate; insights: NaacInsights; role: Who }) {
  const next = insights.paths[0];
  return (
    <Card data-testid="insights-summary">
      <CardHeader
        icon={<LightbulbIcon weight="duotone" className="size-5" />}
        title={t("insights.title")}
        description={next ? next.sentence : t("insights.atTop")}
        action={
          <Button asChild size="sm" variant="soft">
            <Link href="/iqac/predictor#insights">{t("insights.openInsights")}</Link>
          </Button>
        }
      />
      <CardBody className="space-y-3">
        <ol>
          {insights.ranked.slice(0, 3).map((r) => (
            <Step key={r.code} t={t} sentence={r.sentence} cta={r.cta} role={role} />
          ))}
        </ol>
        <Button asChild size="sm" variant="secondary">
          <Link href="/iqac/simulator">{t("insights.openSimulator")}</Link>
        </Button>
        <InsightsNotAScore t={t} />
      </CardBody>
    </Card>
  );
}

/** The NBA SAR's section: on /hod/nba and the IQAC's NBA document page. */
export function NbaInsightsSection({ t, insights, role, locale, simulatorHref }: { t: Translate; insights: NbaInsights; role: Who; locale: string; simulatorHref: string | null }) {
  return (
    <Card data-testid="insights-nba">
      <CardHeader
        id="insights"
        icon={<LightbulbIcon weight="duotone" className="size-5" />}
        title={t("insights.nbaTitle")}
        description={t("insights.nbaTotals", { computed: insights.computed, self: insights.self, total: insights.total, max: insights.max })}
        action={
          simulatorHref ? (
            <Button asChild size="sm" variant="soft">
              <Link href={simulatorHref}>{t("insights.nbaOpenSimulator")}</Link>
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-5">
        {insights.scenarioName ? <p className="text-sm font-medium">{t("insights.scenarioBanner", { name: insights.scenarioName })}</p> : null}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-fg">{t("insights.nbaRankedTitle")}</h3>
          <StepList t={t} rows={insights.ranked} role={role} limit={11} />
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-fg">{t("insights.nbaSelfTitle")}</h3>
          <StepList t={t} rows={insights.selfAssess} role={role} limit={6} />
        </section>
        <LastDone t={t} rows={insights.lastDone} locale={locale} sinceKey="insights.doneSinceFiling" />
        <InsightsNotAScore t={t} />
      </CardBody>
    </Card>
  );
}

/** NIRF's section: on the IQAC's NIRF document page. */
export function NirfInsightsSection({ t, insights, role }: { t: Translate; insights: NirfInsights; role: Who }) {
  return (
    <Card data-testid="insights-nirf">
      <CardHeader id="insights" icon={<LightbulbIcon weight="duotone" className="size-5" />} title={t("insights.nirfTitle")} description={insights.projected === null ? t("insights.nirfNoData") : t("insights.nirfEstimate", { partial: insights.partial.toFixed(2), covered: insights.coveredMarks.toFixed(2), projected: insights.projected.toFixed(2) })} />
      <CardBody className="space-y-5">
        {insights.band ? (
          <p className="text-sm">{insights.nextBand ? t("insights.nirfBandLine", { band: insights.band.label, distance: insights.nextBand.distance.toFixed(2), next: insights.nextBand.label }) : t("insights.nirfBandTop", { band: insights.band.label })}</p>
        ) : null}
        <p className="text-sm text-fg-muted">{t("insights.nirfCheck")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {insights.parameters.map((p) => (
                <tr key={p.code} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">
                    {p.code} {p.name}
                  </th>
                  <td className="py-2 pr-3 text-right">{Math.round(p.weight * 100)}%</td>
                  <td className="py-2 text-right">{p.marks === null ? "—" : `${p.marks.toFixed(2)} / ${p.covered}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StepList t={t} rows={insights.ranked} role={role} limit={6} />
        <InsightsNotAScore t={t} />
      </CardBody>
    </Card>
  );
}
