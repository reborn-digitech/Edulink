import Link from "next/link";
import { CompassIcon, HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { streamPreset, streamsOf } from "@/lib/streams";
import { enabledModules } from "@/lib/modules";
import { streamLabel } from "@/lib/institution";
import { HOME_TILE_META, tileHref } from "@/lib/stream-tiles";
import { homeFigures, type HomeFigure } from "@/lib/stream-home";
import type { Translate } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

/**
 * THE COLLEGE'S STREAMS ON THE REGISTRAR'S AND THE PRINCIPAL'S HOMES (5 Oct
 * 2026): the streams the college teaches, a tile for each part of the college
 * its streams use, in the preset's order (the base six, then each stream's:
 * labs and NBA for engineering, the moot court for law, teaching practice for
 * education…), and a banner for any record a stream asks for that the app
 * does not keep yet. A tile whose module is off says so; one whose page is not
 * built says "coming". A college with no stream chosen is asked to choose.
 * Each live tile carries one line of its numbers (lib/stream-home.ts, counted
 * on read), and a college whose streams offer NSS sees the unit's year.
 */
export async function StreamHome({ schoolId, role, t }: { schoolId: string; role: "ADMIN" | "PRINCIPAL"; t: Translate }) {
  const [streams, modulesOn] = await Promise.all([streamsOf(schoolId), enabledModules(schoolId)]);
  const preset = streamPreset(streams);
  const figures = await homeFigures(schoolId, { tiles: preset.homeTiles, modulesOn, streams });
  const say = (f: HomeFigure) => t(f.key, { ...f.values, ...Object.fromEntries(Object.entries(f.words ?? {}).map(([k, key]) => [k, t(key)])) });
  return (
    <section className="space-y-3" aria-label={t("streams.homeTitle")} data-testid="stream-home">
      <Card>
        <CardHeader
          icon={<CompassIcon weight="duotone" className="size-5" />}
          title={t("streams.homeTitle")}
          description={streams.length ? streams.map((s) => streamLabel(s, t)).join(" · ") : t("streams.homeNone")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/settings/college">{t(role === "ADMIN" ? "streams.homeEdit" : "streams.homeView")}</Link>
            </Button>
          }
        />
        <CardBody>
          <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {preset.homeTiles.map((tile) => {
              const meta = HOME_TILE_META[tile];
              const href = tileHref(tile, role);
              const off = meta.module ? !modulesOn.includes(meta.module) : false;
              // A switched-off tile tells the office where to switch it on, and opens that page for the registrar (5 Oct 2026).
              const note = !href ? t("streams.tileComing") : off ? t(role === "ADMIN" ? "streams.tileOffSwitch" : "streams.tileOff") : null;
              const figure = !note ? figures.tiles[tile] : undefined;
              const body = (
                <>
                  <span className="block text-sm font-semibold text-fg">{t(meta.labelKey)}</span>
                  {note ? <span className="block text-xs text-fg-muted">{note}</span> : null}
                  {figure ? <span className="mt-0.5 block text-xs tabular-nums text-fg-muted" data-figure>{say(figure)}</span> : null}
                </>
              );
              return (
                <li key={tile} data-tile={tile}>
                  {href && off && role === "ADMIN" ? (
                    <Link href="/admin/settings/modules" className="block min-h-11 rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2.5 transition-colors hover:bg-surface-muted">
                      {body}
                    </Link>
                  ) : href && !off ? (
                    <Link href={href} className="block min-h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-muted">
                      {body}
                    </Link>
                  ) : (
                    <div className={cn("rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2.5")}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {figures.nss && figures.nss.enrolled + figures.nss.hours > 0 ? <p className="mt-3 text-xs tabular-nums text-fg-muted" data-testid="stream-home-nss">{t("streams.figure.nss", figures.nss)}</p> : null}
        </CardBody>
      </Card>
      {preset.notBuilt.length > 0 && (
        <div role="note" className="flex gap-3 rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-fg" data-testid="streams-coming">
          <HourglassMediumIcon weight="duotone" className="mt-0.5 size-5 shrink-0 text-warn" />
          <div className="space-y-1">
            <p className="font-semibold">{t("streams.comingTitle")}</p>
            <ul className="list-inside list-disc space-y-0.5 text-fg-muted">
              {preset.notBuilt.map((n) => (
                <li key={n}>{t(`streams.notBuilt.${n}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
