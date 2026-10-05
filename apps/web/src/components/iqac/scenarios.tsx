import Link from "next/link";
import type { ScenarioCompare, Scenarios } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import type { Translate } from "@/lib/i18n/dictionary";
import { removeScenarioAction } from "@/app/(app)/iqac/simulator/actions";

/**
 * The simulator's saved scenarios (module IQAC, 5 Oct 2026): each with what it
 * reads now and its lead over today, a way to load it into the simulator, to
 * show it as insights and to remove it; two of them compared side by side.
 * Server-drawn; the links carry the page's own query (`base`).
 */

const signed = (x: number | null) => (x === null ? "—" : `${x > 0 ? "+" : ""}${Number.isInteger(x) ? x : x.toFixed(2)}`);
const when = (iso: string, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function ScenarioPanel({ t, locale, list, base, back, compare }: { t: Translate; locale: string; list: Scenarios; base: string; back: string; compare: ScenarioCompare | null }) {
  const link = (extra: Record<string, string>) => {
    const q = new URLSearchParams(base);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    return `?${q.toString()}`;
  };
  return (
    <>
      <Card data-testid="scenario-list">
        <CardHeader title={t("insights.simScenariosTitle")} />
        <CardBody>
          {list.items.length === 0 ? (
            <EmptyState
              title={t("insights.simScenariosEmpty")}
              action={
                <Button asChild size="sm" variant="secondary">
                  <a href="#top">{t("insights.simTitle")}</a>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {list.items.map((s) => (
                <li key={s.id} className="space-y-2 rounded-[--radius-md] border border-border p-3 text-sm" data-testid={`scenario-${s.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      {s.grade ? <Badge>{s.grade}</Badge> : null}
                      <Badge tone={s.delta > 0 ? "ok" : s.delta < 0 ? "warn" : "neutral"}>{signed(s.delta)}</Badge>
                    </span>
                  </div>
                  <p className="text-fg-muted">{t("insights.simScenarioLine", { result: s.result.toFixed(2), today: s.today.toFixed(2), delta: signed(s.delta), by: s.by || "—", at: when(s.at, locale) })}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={link({ load: s.id })}>{t("insights.simLoad")}</Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`${link({ insights: s.id })}#insights`}>{t("insights.simShowInsights")}</Link>
                    </Button>
                    {s.canRemove ? (
                      <form action={removeScenarioAction}>
                        <input type="hidden" name="back" value={back} />
                        <input type="hidden" name="scenarioId" value={s.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t("insights.simRemove")}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {list.items.length >= 2 ? (
        <Card data-testid="scenario-compare">
          <CardHeader id="compare" title={t("insights.simCompareTitle")} />
          <CardBody className="space-y-4">
            <form method="get" className="grid gap-3 sm:grid-cols-3 sm:items-end">
              {[...new URLSearchParams(base)].filter(([k]) => !["a", "b"].includes(k)).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              {(["a", "b"] as const).map((side, i) => (
                <label key={side} className="grid gap-1 text-sm font-medium">
                  {t(side === "a" ? "insights.simCompareA" : "insights.simCompareB")}
                  <select name={side} defaultValue={compare?.[side].id ?? list.items[i]?.id} className="min-h-11 rounded-[--radius-md] border border-border bg-surface px-3">
                    {list.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <Button type="submit" variant="secondary">
                {t("insights.simCompareButton")}
              </Button>
            </form>
            {compare ? (
              <div className="space-y-3 text-sm">
                <p className="font-medium">
                  {t("insights.simCompareResult")}: {compare.result.a.toFixed(2)} → {compare.result.b.toFixed(2)} ({signed(compare.result.delta)})
                </p>
                {compare.inputs.length === 0 ? <p className="text-fg-muted">{t("insights.simCompareNone")}</p> : null}
                {compare.inputs.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <caption className="py-1 text-left font-semibold">{t("insights.simCompareInputs")}</caption>
                      <tbody>
                        {compare.inputs.map((r) => (
                          <tr key={r.key} className="border-b border-border last:border-0">
                            <th scope="row" className="py-1 pr-3 text-left font-normal">
                              {r.label}
                            </th>
                            <td className="py-1 pr-3 text-right">{r.a ?? "—"}</td>
                            <td className="py-1 pr-3 text-right">{r.b ?? "—"}</td>
                            <td className="py-1 text-right">{signed(r.delta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {compare.scores.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <caption className="py-1 text-left font-semibold">{t("insights.simCompareScores")}</caption>
                      <tbody>
                        {compare.scores.map((r) => (
                          <tr key={r.code} className="border-b border-border last:border-0">
                            <th scope="row" className="py-1 pr-3 text-left font-normal">
                              <span className="font-mono text-fg-muted">{r.code}</span> {r.label}
                            </th>
                            <td className="py-1 pr-3 text-right">{r.a.toFixed(2)}</td>
                            <td className="py-1 pr-3 text-right">{r.b.toFixed(2)}</td>
                            <td className="py-1 text-right">{signed(r.delta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
