/**
 * The figure renderer's drawing surface: a fixed viewBox, a handful of primitives, and every number
 * written with at most two decimals so the same spec gives byte-identical SVG on every machine (the
 * golden tests compare text). No <text>: words are drawn as outlines (font.ts), so the SVG needs no
 * font where it is shown and the PNG made from it looks the same as the SVG.
 */
import { textOutline, textWidth, type TextAnchor, type TextWeight } from "./font";

export const WIDTH = 640;
export const HEIGHT = 400;
export const INK = "#1f2933";
export const MUTED = "#7b8794";
export const SHADE = "#cbd5e1";
export const ACCENT = "#2563eb";
/** Light fills for parts of a diagram (water, a leaf, the sun): fixed by the renderer, never by a spec. */
export const FILL = {
  water: "#cfe8fc",
  leaf: "#cdeccf",
  leafDark: "#5aa469",
  sun: "#fde68a",
  flame: "#fdba74",
  glass: "#eef6fb",
  red: "#ef4444",
  violet: "#7c3aed",
  wood: "#e7d3b0",
  metal: "#d1d5db",
  pink: "#fbcfe8",
  tissue: "#fde2e4",
  earth: "#93c5fd",
  moon: "#e5e7eb",
} as const;

/** Two decimals, no trailing zeros, no "-0". */
export function n(value: number): string {
  const r = Math.round(value * 100) / 100;
  return Object.is(r, -0) || r === 0 ? "0" : String(r);
}

export type Stroke = { stroke?: string; width?: number; dashed?: boolean; fill?: string; opacity?: number; cap?: "round" | "butt" };

function attrs(s: Stroke): string {
  const out: string[] = [];
  out.push(`fill="${s.fill ?? "none"}"`);
  // Outlined in ink unless the caller says stroke "none" (a flat fill, the water in a beaker).
  out.push(`stroke="${s.stroke ?? INK}"`);
  if (s.width !== undefined) out.push(`stroke-width="${n(s.width)}"`);
  if (s.dashed) out.push(`stroke-dasharray="8 6"`);
  if (s.opacity !== undefined) out.push(`fill-opacity="${n(s.opacity)}"`);
  if (s.cap) out.push(`stroke-linecap="${s.cap}"`);
  return out.join(" ");
}

export type Pt = [number, number];

export class Svg {
  private readonly parts: string[] = [];

  line(a: Pt, b: Pt, s: Stroke = {}): void {
    this.parts.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" ${attrs({ width: 2.5, ...s })}/>`);
  }

  polyline(points: Pt[], s: Stroke = {}): void {
    if (points.length < 2) return;
    this.parts.push(`<polyline points="${points.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" ${attrs({ width: 2.5, ...s })} stroke-linejoin="round"/>`);
  }

  polygon(points: Pt[], s: Stroke = {}): void {
    this.parts.push(`<polygon points="${points.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" ${attrs({ width: 2.5, ...s })} stroke-linejoin="round"/>`);
  }

  circle(c: Pt, r: number, s: Stroke = {}): void {
    this.parts.push(`<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}" ${attrs({ width: 2.5, ...s })}/>`);
  }

  ellipse(c: Pt, rx: number, ry: number, s: Stroke = {}, rotate = 0): void {
    const t = rotate ? ` transform="rotate(${n(rotate)} ${n(c[0])} ${n(c[1])})"` : "";
    this.parts.push(`<ellipse cx="${n(c[0])}" cy="${n(c[1])}" rx="${n(rx)}" ry="${n(ry)}" ${attrs({ width: 2.5, ...s })}${t}/>`);
  }

  rect(x: number, y: number, w: number, h: number, s: Stroke = {}, radius = 0): void {
    const r = radius ? ` rx="${n(radius)}"` : "";
    this.parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r} ${attrs({ width: 2.5, ...s })}/>`);
  }

  /** A path from commands built with the helpers below (numbers already rounded). */
  path(d: string, s: Stroke = {}): void {
    this.parts.push(`<path d="${d}" ${attrs({ width: 2.5, ...s })} stroke-linejoin="round"/>`);
  }

  /** A filled arrowhead at `tip`, pointing along from→tip. */
  arrowHead(from: Pt, tip: Pt, size = 12, colour = INK): void {
    const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
    const a: Pt = [tip[0] - size * Math.cos(ang - 0.4), tip[1] - size * Math.sin(ang - 0.4)];
    const b: Pt = [tip[0] - size * Math.cos(ang + 0.4), tip[1] - size * Math.sin(ang + 0.4)];
    this.parts.push(`<polygon points="${n(tip[0])},${n(tip[1])} ${n(a[0])},${n(a[1])} ${n(b[0])},${n(b[1])}" fill="${colour}"/>`);
  }

  /** A line with an arrowhead at its end. */
  arrow(from: Pt, to: Pt, s: Stroke = {}): void {
    this.line(from, to, s);
    this.arrowHead(from, to, 12, s.stroke ?? INK);
  }

  /**
   * Words as outlines. `at` is the baseline point for the anchor; returns the box the words took so a
   * caller can keep the next label clear of it. A white halo behind keeps a label readable over lines.
   */
  text(str: string, at: Pt, opts: { size?: number; anchor?: TextAnchor; weight?: TextWeight; colour?: string; halo?: boolean } = {}): { x: number; y: number; w: number; h: number } {
    const size = opts.size ?? 20;
    const weight = opts.weight ?? "regular";
    const anchor = opts.anchor ?? "start";
    // Every word stays on the card: a label pushed past an edge slides back inside it.
    const w = textWidth(str, size, weight);
    const wanted = anchor === "start" ? at[0] : anchor === "middle" ? at[0] - w / 2 : at[0] - w;
    const left = Math.max(6, Math.min(WIDTH - 6 - w, wanted));
    const baseline = Math.max(size * 0.85 + 4, Math.min(HEIGHT - size * 0.3 - 4, at[1]));
    const out = textOutline(str, left, baseline, size, "start", weight);
    const box = { x: out.x, y: baseline - size * 0.82, w: out.width, h: size * 1.12 };
    if (opts.halo !== false && out.d) this.parts.push(`<path d="${out.d}" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>`);
    if (out.d) this.parts.push(`<path d="${out.d}" fill="${opts.colour ?? INK}"/>`);
    return box;
  }

  /** Everything drawn between open and close is clipped to the rectangle (a graph's plot area). */
  clipOpen(id: string, x: number, y: number, w: number, h: number): void {
    this.parts.push(`<clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath>`, `<g clip-path="url(#${id})">`);
  }

  clipClose(): void {
    this.parts.push(`</g>`);
  }

  /** The finished document: a white card, then everything drawn in order. */
  toString(): string {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
      `<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>`,
      ...this.parts,
      `</svg>`,
      "",
    ].join("\n");
  }
}

/** Arc path data on a circle (SVG y down): from and to in degrees counter-clockwise on paper. */
export function arcPath(c: Pt, r: number, fromDeg: number, toDeg: number, sector = false): string {
  let sweepDeg = toDeg - fromDeg;
  while (sweepDeg < 0) sweepDeg += 360;
  while (sweepDeg > 360) sweepDeg -= 360;
  if (sweepDeg === 0) sweepDeg = 360;
  const at = (deg: number): Pt => [c[0] + r * Math.cos((deg * Math.PI) / 180), c[1] - r * Math.sin((deg * Math.PI) / 180)];
  if (sweepDeg >= 359.99) {
    const a = at(fromDeg);
    const b = at(fromDeg + 180);
    return `M${n(a[0])} ${n(a[1])}A${n(r)} ${n(r)} 0 1 0 ${n(b[0])} ${n(b[1])}A${n(r)} ${n(r)} 0 1 0 ${n(a[0])} ${n(a[1])}${sector ? "Z" : ""}`;
  }
  const a = at(fromDeg);
  const b = at(fromDeg + sweepDeg);
  const large = sweepDeg > 180 ? 1 : 0;
  const arc = `A${n(r)} ${n(r)} 0 ${large} 0 ${n(b[0])} ${n(b[1])}`;
  return sector ? `M${n(c[0])} ${n(c[1])}L${n(a[0])} ${n(a[1])}${arc}Z` : `M${n(a[0])} ${n(a[1])}${arc}`;
}

/** Path data through points: M x y L … (Z when closed). */
export function pointsPath(points: Pt[], closed = false): string {
  return points.map((p, i) => `${i ? "L" : "M"}${n(p[0])} ${n(p[1])}`).join("") + (closed ? "Z" : "");
}

/** A smooth closed outline through points (Catmull-Rom as cubic Béziers), for blobs and organs. */
export function smoothPath(points: Pt[], closed = true): string {
  const count = points.length;
  if (count < 3) return pointsPath(points, closed);
  const p = (i: number) => (closed ? points[(i + count) % count]! : points[Math.max(0, Math.min(count - 1, i))]!);
  let d = `M${n(points[0]![0])} ${n(points[0]![1])}`;
  const last = closed ? count : count - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + (closed ? "Z" : "");
}
