/** bar and pie: categories and values, a title, axis labels, a legend when there is more than one series. */
import type { QuizFigureOf } from "@edulink/contracts";
import { textWidth } from "./font";
import { formatNumber, type LabelReader } from "./labels";
import { arcPath, HEIGHT, INK, MUTED, Svg, WIDTH, type Pt } from "./svg";
import { ticks } from "./graph";

/** Fixed colours, distinguishable in print and for the commoner colour blindness. */
export const SERIES = ["#2563eb", "#f59e0b", "#059669", "#db2777", "#7c3aed", "#0891b2", "#65a30d", "#dc2626", "#475569", "#a16207"];

/** A round step giving about five intervals up to `max`. */
export function niceStep(max: number): number {
  const rough = max / 5;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
}

/** The largest size (down to `min`) at which `str` fits in `width`. */
function fitSize(str: string, width: number, size: number, min = 12): number {
  let s = size;
  while (s > min && textWidth(str, s) > width) s -= 1;
  return s;
}

export function drawBar(figure: QuizFigureOf<"bar">, labels: LabelReader): Svg {
  const s = figure.spec;
  const svg = new Svg();
  const top = s.title ? 56 : 28;
  const legend = s.series.length > 1;
  const bottom = (s.xLabel ? 76 : 50) + (legend ? 30 : 0);
  const left = s.yLabel ? 84 : 64;
  const right = 24;
  const w = WIDTH - left - right;
  const h = HEIGHT - top - bottom;
  const dataMax = Math.max(...s.series.flatMap((x) => x.values), 0);
  const step = s.yStep ?? niceStep(s.yMax ?? (dataMax || 1));
  const yMax = s.yMax ?? Math.max(step, Math.ceil((dataMax || 1) / step - 1e-9) * step);
  const Y = (v: number) => top + h - (Math.min(v, yMax) / yMax) * h;

  if (s.title) svg.text(labels.key(s.title), [WIDTH / 2, 34], { size: 22, anchor: "middle", weight: "bold" });
  for (const v of ticks(0, yMax, step)) {
    svg.line([left, Y(v)], [left + w, Y(v)], { stroke: "#e5e7eb", width: 1 });
    svg.text(formatNumber(v), [left - 8, Y(v) + 5], { size: 15, anchor: "end", colour: MUTED });
  }
  const groupW = w / s.categories.length;
  const barW = Math.min(56, (groupW * 0.72) / s.series.length);
  s.categories.forEach((cat, i) => {
    const gx = left + groupW * i + (groupW - barW * s.series.length) / 2;
    s.series.forEach((series, k) => {
      const v = series.values[i]!;
      const x = gx + barW * k;
      svg.rect(x, Y(v), barW, top + h - Y(v), { fill: SERIES[k]!, stroke: INK, width: 1 });
      if (s.showValues) svg.text(formatNumber(v), [x + barW / 2, Y(v) - 6], { size: 14, anchor: "middle" });
    });
    const name = labels.key(cat);
    svg.text(name, [left + groupW * (i + 0.5), top + h + 22], { size: fitSize(name, groupW - 4, 16), anchor: "middle" });
  });
  svg.line([left, top + h], [left + w, top + h], { width: 2 });
  svg.line([left, top], [left, top + h], { width: 2 });
  if (s.xLabel) svg.text(labels.key(s.xLabel), [left + w / 2, top + h + 52], { size: 18, anchor: "middle" });
  if (s.yLabel) {
    // Written level, above the axis: a turned label is harder for a young reader and for the outlines.
    svg.text(labels.key(s.yLabel), [left - 4, top - 10], { size: 16, anchor: "start" });
  }
  if (legend) {
    let x = left;
    const y = HEIGHT - 16;
    s.series.forEach((series, k) => {
      svg.rect(x, y - 13, 16, 16, { fill: SERIES[k]!, stroke: INK, width: 1 });
      const name = series.name ? labels.key(series.name) : String(k + 1);
      svg.text(name, [x + 22, y], { size: 16 });
      x += 22 + textWidth(name, 16) + 26;
    });
  }
  return svg;
}

export function drawPie(figure: QuizFigureOf<"pie">, labels: LabelReader): Svg {
  const s = figure.spec;
  const svg = new Svg();
  const total = s.values.reduce((a, b) => a + b, 0);
  const top = s.title ? 52 : 16;
  const r = Math.min(150, (HEIGHT - top - 24) / 2);
  const c: Pt = [24 + r, top + (HEIGHT - top) / 2 - 6];
  if (s.title) svg.text(labels.key(s.title), [WIDTH / 2, 34], { size: 22, anchor: "middle", weight: "bold" });
  // From twelve o'clock, clockwise, as the books draw it.
  let angle = 90;
  s.values.forEach((v, i) => {
    const sweep = (v / total) * 360;
    if (sweep >= 359.99) svg.circle(c, r, { fill: SERIES[i % SERIES.length]!, stroke: "#ffffff", width: 2 });
    else svg.path(arcPath(c, r, angle - sweep, angle, true), { fill: SERIES[i % SERIES.length]!, stroke: "#ffffff", width: 2 });
    if (s.show === "percent" && sweep >= 25) {
      const mid = ((angle - sweep / 2) * Math.PI) / 180;
      svg.text(`${formatNumber(Math.round((v / total) * 1000) / 10)}%`, [c[0] + r * 0.62 * Math.cos(mid), c[1] - r * 0.62 * Math.sin(mid) + 6], { size: 17, anchor: "middle", colour: "#ffffff", halo: false, weight: "bold" });
    }
    angle -= sweep;
  });
  // The legend says the name and the number, so the figure reads without telling colours apart.
  const lx = c[0] + r + 36;
  const rowH = Math.min(34, (HEIGHT - top - 20) / s.categories.length);
  const y0 = c[1] - (rowH * (s.categories.length - 1)) / 2;
  s.categories.forEach((cat, i) => {
    const y = y0 + rowH * i;
    svg.rect(lx, y - 9, 18, 18, { fill: SERIES[i % SERIES.length]!, stroke: INK, width: 1 });
    const v = s.values[i]!;
    const tail = s.show === "percent" ? ` — ${formatNumber(Math.round((v / total) * 1000) / 10)}%` : s.show === "value" ? ` — ${formatNumber(v)}` : "";
    const str = `${labels.key(cat)}${tail}`;
    svg.text(str, [lx + 26, y + 6], { size: fitSize(str, WIDTH - lx - 34, 17), anchor: "start" });
  });
  return svg;
}
