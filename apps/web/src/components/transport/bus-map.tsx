"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { mapView, type LatLng } from "@/lib/transport-geo";

export type MapStop = LatLng & { id: string; label: string; mine?: boolean; passed?: boolean };
export type MapBus = LatLng & { id: string; label: string; stale?: boolean };

const W = 640;
const H = 360;

/**
 * A map with no map library and no key: OpenStreetMap's tiles placed by hand
 * in an SVG (lib/transport-geo.ts does the Web Mercator arithmetic), the
 * route's stops as numbered dots joined in order, the bus's track as a line
 * and the bus itself as a labelled marker. The SVG scales to its box, so the
 * same 640 × 360 frame fits a phone and a desk. Two buttons zoom; the
 * attribution OpenStreetMap asks for is always drawn. Every point is a stop's
 * or a bus's — nothing here locates a child.
 */
export function BusMap({ stops = [], buses = [], track = [], className, testId }: { stops?: MapStop[]; buses?: MapBus[]; track?: LatLng[]; className?: string; testId?: string }) {
  const t = useT();
  const [zoomDelta, setZoomDelta] = useState(0);
  const points: LatLng[] = [...stops, ...buses];
  if (points.length === 0) {
    return <p className="rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-sm text-fg-muted">{t("transport.mapNoPoints")}</p>;
  }
  const view = mapView(points, W, H, zoomDelta);
  const path = (list: LatLng[]) => list.map((p, i) => `${i === 0 ? "M" : "L"}${view.place(p).x.toFixed(1)},${view.place(p).y.toFixed(1)}`).join(" ");
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted ${className ?? ""}`} data-testid={testId}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("transport.mapAria")} className="block h-auto w-full" preserveAspectRatio="xMidYMid slice">
        {view.tiles.map((tile) => (
          <image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={256} height={256} />
        ))}
        {stops.length > 1 && <path d={path(stops)} fill="none" style={{ stroke: "var(--color-accent)" }} strokeWidth={3} strokeDasharray="6 5" opacity={0.7} />}
        {track.length > 1 && <path d={path(track)} fill="none" style={{ stroke: "var(--color-info)" }} strokeWidth={4} strokeLinecap="round" opacity={0.85} />}
        {stops.map((s, i) => {
          const p = view.place(s);
          return (
            <g key={s.id}>
              <circle cx={p.x} cy={p.y} r={s.mine ? 12 : 9} style={{ fill: s.mine ? "var(--color-accent)" : s.passed ? "var(--color-fg-muted)" : "var(--color-surface)", stroke: "var(--color-accent)" }} strokeWidth={3} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} style={{ fill: s.mine || s.passed ? "var(--color-surface)" : "var(--color-accent)" }}>
                {i + 1}
              </text>
              <title>{s.label}</title>
            </g>
          );
        })}
        {buses.map((b) => {
          const p = view.place(b);
          return (
            <g key={b.id} opacity={b.stale ? 0.55 : 1}>
              <rect x={p.x - 16} y={p.y - 12} width={32} height={24} rx={6} style={{ fill: "var(--color-warn)", stroke: "var(--color-surface)" }} strokeWidth={2} />
              <rect x={p.x - 10} y={p.y - 6} width={20} height={7} rx={1.5} style={{ fill: "var(--color-surface)" }} opacity={0.9} />
              <circle cx={p.x - 8} cy={p.y + 8} r={3} style={{ fill: "var(--color-fg)" }} />
              <circle cx={p.x + 8} cy={p.y + 8} r={3} style={{ fill: "var(--color-fg)" }} />
              <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize={11} fontWeight={700} style={{ fill: "var(--color-fg)", paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 3 }}>
                {b.label}
              </text>
              <title>{b.label}</title>
            </g>
          );
        })}
      </svg>
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button type="button" onClick={() => setZoomDelta((z) => Math.min(z + 1, 4))} aria-label={t("transport.mapZoomIn")} className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-fg shadow-sm hover:bg-surface-muted">
          <PlusIcon weight="bold" className="size-4" />
        </button>
        <button type="button" onClick={() => setZoomDelta((z) => Math.max(z - 1, -6))} aria-label={t("transport.mapZoomOut")} className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-fg shadow-sm hover:bg-surface-muted">
          <MinusIcon weight="bold" className="size-4" />
        </button>
      </div>
      <p className="absolute bottom-0 right-0 bg-surface/85 px-1.5 py-0.5 text-[0.65rem] text-fg-muted">{t("transport.mapAttribution")}</p>
    </div>
  );
}
