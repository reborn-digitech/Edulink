"use client";

import { useT } from "@/lib/i18n";

/**
 * The grading scale as a bar from 0 to 100: each band a stretch of it, from
 * the mark the band starts at up to the mark the next band starts at. What
 * no band covers is drawn hatched, and said in words by `scaleProblems`,
 * which the form prints under the bar — the bar is a picture of the rule
 * "a percent falls into the first band whose minimum it reaches", and the
 * sentences are the same rule for somebody who cannot see the picture.
 */
export type LiveBand = { label: string; minPercent: number | null; points: number | null; descriptor: string | null };
export type ScaleProblem = { kind: "gap"; from: number; to: number } | { kind: "overlap"; percent: number; first: string; second: string };

/** The bands that have a mark to start at, highest first: the order a percent is read off in. */
function ordered(bands: LiveBand[]): (LiveBand & { minPercent: number })[] {
  return bands.filter((b): b is LiveBand & { minPercent: number } => b.minPercent !== null).sort((a, b) => b.minPercent - a.minPercent);
}

export function scaleProblems(bands: LiveBand[]): ScaleProblem[] {
  const list = ordered(bands);
  if (list.length === 0) return [];
  const problems: ScaleProblem[] = [];
  for (let i = 1; i < list.length; i++) if (list[i]!.minPercent === list[i - 1]!.minPercent) problems.push({ kind: "overlap", percent: list[i]!.minPercent, first: list[i - 1]!.label, second: list[i]!.label });
  const lowest = list[list.length - 1]!.minPercent;
  if (lowest > 0) problems.push({ kind: "gap", from: 0, to: lowest - 1 });
  return problems;
}

/**
 * Two tones, taken in turn. A band was shaded by how high it stood, eight
 * shades of one colour, and the letters on the pale ones could not be read
 * (axe, 2026-09-30). Each of these two is a pair the theme already keeps
 * readable in light and in dark, and neighbours still differ.
 */
const TONES = ["bg-accent text-accent-fg", "bg-accent-soft text-accent-strong"];

export function ScaleBar({ bands }: { bands: LiveBand[] }) {
  const t = useT();
  const list = ordered(bands);
  // Lowest first, left to right: the way a ruler is read.
  const stretches = [...list].reverse().map((band, index, all) => ({ band, from: band.minPercent, to: index === all.length - 1 ? 100 : all[index + 1]!.minPercent - 1 }));
  const uncovered = list.length > 0 ? list[list.length - 1]!.minPercent : 0;

  return (
    <div className="space-y-1.5" data-testid="scale-bar">
      <div role="img" aria-label={[t("reportCardConfig.scaleBar"), ...stretches.map((s) => t("reportCardConfig.bandRange", { label: s.band.label, from: s.from, to: s.to }))].join(". ")} className="flex h-10 w-full overflow-hidden rounded-[--radius-md] border border-border bg-surface-muted">
        {uncovered > 0 && <div style={{ width: `${uncovered}%` }} className="bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,var(--warn)_4px,var(--warn)_5px)] opacity-60" data-testid="scale-gap" />}
        {stretches
          .filter((s) => s.to >= s.from)
          .map((s, index) => (
            <div key={`${s.band.label}-${index}`} style={{ width: `${s.to - s.from + (s.to === 100 ? 0 : 1)}%` }} className={`grid min-w-0 place-items-center border-l border-surface text-xs font-semibold first:border-l-0 ${TONES[(stretches.length - 1 - index) % TONES.length]}`} data-testid="scale-stretch">
              <span className="truncate px-0.5">{s.band.label}</span>
            </div>
          ))}
      </div>
      <div className="flex justify-between text-[0.6875rem] tabular-nums text-fg-muted" aria-hidden="true">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
