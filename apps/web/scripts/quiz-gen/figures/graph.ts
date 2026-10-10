/** graph: axes with ranges and ticks, polynomial or tabulated curves, lines, shaded regions, labelled points. */
import type { QuizFigureOf } from "@edulink/contracts";
import type { LabelReader } from "./labels";
import { dirOf, placeLabel } from "./place";
import { ACCENT, HEIGHT, INK, MUTED, Svg, WIDTH, type Pt } from "./svg";

const LEFT = 64;
const RIGHT = 28;
const TOP = 28;
const BOTTOM = 52;
const CURVE_COLOURS = [ACCENT, "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2"];

/** Grid lines at multiples of step, starting from the first multiple at or above min. */
export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil(min / step - 1e-9) * step;
  for (let v = first; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export function drawGraph(figure: QuizFigureOf<"graph">, labels: LabelReader): Svg {
  const { x, y } = figure.spec;
  const spec = figure.spec;
  const svg = new Svg();
  const w = WIDTH - LEFT - RIGHT;
  const h = HEIGHT - TOP - BOTTOM;
  const X = (v: number) => LEFT + ((v - x.min) / (x.max - x.min)) * w;
  const Y = (v: number) => TOP + h - ((v - y.min) / (y.max - y.min)) * h;
  const P = (a: number, b: number): Pt => [X(a), Y(b)];

  const xs = ticks(x.min, x.max, x.step);
  const ys = ticks(y.min, y.max, y.step);
  if (spec.grid) {
    for (const v of xs) svg.line([X(v), TOP], [X(v), TOP + h], { stroke: "#e5e7eb", width: 1 });
    for (const v of ys) svg.line([LEFT, Y(v)], [LEFT + w, Y(v)], { stroke: "#e5e7eb", width: 1 });
  }
  // The axes sit at zero when zero is in range, else on the plot's edge.
  const axisY = y.min <= 0 && y.max >= 0 ? Y(0) : TOP + h;
  const axisX = x.min <= 0 && x.max >= 0 ? X(0) : LEFT;
  svg.arrow([LEFT, axisY], [LEFT + w + 14, axisY], { stroke: INK, width: 1.8 });
  svg.arrow([axisX, TOP + h], [axisX, TOP - 14], { stroke: INK, width: 1.8 });
  const xEvery = xs.length > 20 ? 2 : 1;
  const yEvery = ys.length > 16 ? 2 : 1;
  xs.forEach((v, i) => {
    if (Math.abs(v) < 1e-9 && axisX === X(0)) return;
    svg.line([X(v), axisY - 4], [X(v), axisY + 4], { stroke: INK, width: 1.5 });
    if (i % xEvery === 0) svg.text(labels.measure(v, "units"), [X(v), axisY + 21], { size: 15, anchor: "middle", colour: MUTED });
  });
  ys.forEach((v, i) => {
    if (Math.abs(v) < 1e-9 && axisY === Y(0)) return;
    svg.line([axisX - 4, Y(v)], [axisX + 4, Y(v)], { stroke: INK, width: 1.5 });
    if (i % yEvery === 0) svg.text(labels.measure(v, "units"), [axisX - 8, Y(v) + 5], { size: 15, anchor: "end", colour: MUTED });
  });
  if (axisX === X(0) && axisY === Y(0)) svg.text("O", [axisX - 8, axisY + 20], { size: 15, anchor: "end", colour: MUTED });
  if (x.label) svg.text(labels.key(x.label), [LEFT + w + 4, axisY - 10], { size: 18, anchor: "end" });
  if (y.label) svg.text(labels.key(y.label), [axisX + 10, TOP + 4], { size: 18, anchor: "start" });

  svg.clipOpen("plot", LEFT, TOP, w, h);
  for (const r of spec.regions) svg.polygon(r.vertices.map(([a, b]) => P(a, b)), { fill: ACCENT, opacity: 0.16, stroke: ACCENT, width: 1.5 });
  spec.curves.forEach((c, i) => {
    const colour = CURVE_COLOURS[i % CURVE_COLOURS.length]!;
    if (c.poly) {
      const from = Math.max(c.from ?? x.min, x.min);
      const to = Math.min(c.to ?? x.max, x.max);
      const pts: Pt[] = [];
      for (let k = 0; k <= 160; k++) {
        const t = from + ((to - from) * k) / 160;
        const v = c.poly.reduce((s, a, j) => s + a * t ** j, 0);
        // Far outside the window is clamped so the clip path, not a huge number, ends the curve.
        pts.push([X(t), Math.max(-2000, Math.min(2000, Y(v)))]);
      }
      svg.polyline(pts, { stroke: colour, width: 2.8, dashed: c.dashed });
    } else if (c.points) {
      svg.polyline(c.points.map(([a, b]) => P(a, b)), { stroke: colour, width: 2.8, dashed: c.dashed });
    }
  });
  spec.lines.forEach((l) => {
    const [[x1, y1], [x2, y2]] = l.through;
    if (Math.abs(x2 - x1) < 1e-12) svg.line(P(x1, y.min), P(x1, y.max), { stroke: INK, width: 2.2, dashed: l.dashed });
    else {
      const m = (y2 - y1) / (x2 - x1);
      const f = (t: number) => y1 + m * (t - x1);
      svg.line([X(x.min), Math.max(-2000, Math.min(2000, Y(f(x.min))))], [X(x.max), Math.max(-2000, Math.min(2000, Y(f(x.max))))], { stroke: INK, width: 2.2, dashed: l.dashed });
    }
  });
  svg.clipClose();

  // Labels outside the clip so a name near the edge is not cut.
  const inside = (p: Pt) => p[0] >= LEFT && p[0] <= LEFT + w && p[1] >= TOP && p[1] <= TOP + h;
  spec.curves.forEach((c, i) => {
    if (!c.label) return;
    const colour = CURVE_COLOURS[i % CURVE_COLOURS.length]!;
    let at: Pt | null = null;
    if (c.poly) {
      const from = Math.max(c.from ?? x.min, x.min);
      const to = Math.min(c.to ?? x.max, x.max);
      for (let k = 160; k >= 0 && !at; k--) {
        const t = from + ((to - from) * k) / 160;
        const p: Pt = [X(t), Y(c.poly.reduce((s, a, j) => s + a * t ** j, 0))];
        if (inside(p) && p[0] < LEFT + w - 30 && p[1] > TOP + 20) at = p;
      }
    } else if (c.points) {
      const last = c.points[c.points.length - 1]!;
      at = P(last[0], last[1]);
    }
    if (at) placeLabel(svg, labels.key(c.label), at, "ne", { size: 18, gap: 8, colour });
  });
  spec.lines.forEach((l) => {
    if (!l.label) return;
    const [[x1, y1], [x2, y2]] = l.through;
    placeLabel(svg, labels.key(l.label), P((x1 + x2) / 2, (y1 + y2) / 2), "nw", { size: 18, gap: 10 });
  });
  spec.regions.forEach((r) => {
    if (!r.label) return;
    const cx = r.vertices.reduce((s, v) => s + v[0], 0) / r.vertices.length;
    const cy = r.vertices.reduce((s, v) => s + v[1], 0) / r.vertices.length;
    svg.text(labels.key(r.label), [X(cx), Y(cy) + 6], { size: 18, anchor: "middle", colour: ACCENT });
  });
  const mid: Pt = [LEFT + w / 2, TOP + h / 2];
  for (const p of spec.points) {
    const c = P(p.x, p.y);
    svg.circle(c, 5, { fill: p.open ? "#ffffff" : INK, stroke: INK, width: 2 });
    if (p.label) placeLabel(svg, labels.key(p.label), c, p.place === "auto" ? dirOf([c[0] - mid[0] || 1, c[1] - mid[1] || -1]) : p.place, { size: 18, gap: 10 });
  }
  return svg;
}
