/** numberline: a range with ticks, marked points, intervals and hops. */
import type { QuizFigureOf } from "@edulink/contracts";
import type { LabelReader } from "./labels";
import { ticks } from "./graph";
import { ACCENT, INK, MUTED, n, Svg, WIDTH, type Pt } from "./svg";

const LEFT = 48;
const RIGHT = 48;
const LINE_Y = 236;

export function drawNumberline(figure: QuizFigureOf<"numberline">, labels: LabelReader): Svg {
  const s = figure.spec;
  const svg = new Svg();
  const w = WIDTH - LEFT - RIGHT;
  const X = (v: number) => LEFT + ((v - s.min) / (s.max - s.min)) * w;

  svg.line([LEFT - 30, LINE_Y], [LEFT + w + 30, LINE_Y], { width: 2.5 });
  svg.arrowHead([LEFT, LINE_Y], [LEFT + w + 32, LINE_Y]);
  svg.arrowHead([LEFT + w, LINE_Y], [LEFT - 32, LINE_Y]);

  const major = ticks(s.min, s.max, s.step);
  major.forEach((v, i) => {
    svg.line([X(v), LINE_Y - 10], [X(v), LINE_Y + 10], { width: 2 });
    if (i % s.labelEvery === 0) svg.text(labels.measure(v, "units"), [X(v), LINE_Y + 34], { size: 18, anchor: "middle" });
    if (s.minor && i < major.length - 1) {
      for (let k = 1; k <= s.minor; k++) {
        const m = v + (s.step * k) / (s.minor + 1);
        svg.line([X(m), LINE_Y - 5], [X(m), LINE_Y + 5], { width: 1.5, stroke: MUTED });
      }
    }
  });

  // The first interval is drawn on the line itself, as the books shade an inequality; a second one
  // below the numbers. An open end is a hollow ring, a missing end runs off along the arrow.
  s.intervals.forEach((iv, i) => {
    const y = i === 0 ? LINE_Y : LINE_Y + 62 + (i - 1) * 22;
    const a = iv.from === null ? LEFT - 28 : X(iv.from);
    const b = iv.to === null ? LEFT + w + 28 : X(iv.to);
    svg.line([a, y], [b, y], { stroke: ACCENT, width: 6 });
    if (iv.from === null) svg.arrowHead([b, y], [a - 6, y], 16, ACCENT);
    else svg.circle([a, y], 7, { fill: iv.closedFrom ? ACCENT : "#ffffff", stroke: ACCENT, width: 3 });
    if (iv.to === null) svg.arrowHead([a, y], [b + 6, y], 16, ACCENT);
    else svg.circle([b, y], 7, { fill: iv.closedTo ? ACCENT : "#ffffff", stroke: ACCENT, width: 3 });
  });

  // Hops as arcs above, each a little higher than the last so two hops over the same stretch both show.
  s.jumps.forEach((j, i) => {
    const a = X(j.from);
    const b = X(j.to);
    const lift = 40 + Math.min(70, Math.abs(b - a) * 0.35) + (i % 3) * 8;
    const top = LINE_Y - 12 - lift;
    const mid = (a + b) / 2;
    svg.path(`M${n(a)} ${n(LINE_Y - 12)}Q${n(mid)} ${n(top)} ${n(b)} ${n(LINE_Y - 12)}`, { stroke: "#d97706", width: 2.2 });
    // Tangent to the curve at its end: from the control point to the end.
    svg.arrowHead([mid, top], [b, LINE_Y - 12], 12, "#d97706");
    if (j.label) svg.text(labels.key(j.label), [mid, (LINE_Y - 12 + top) / 2 - 4], { size: 18, anchor: "middle", colour: "#b45309" });
  });

  for (const p of s.points) {
    const c: Pt = [X(p.value), LINE_Y];
    svg.circle(c, 7, { fill: p.open ? "#ffffff" : INK, stroke: INK, width: 2.5 });
    if (p.label) svg.text(labels.key(p.label), [c[0], LINE_Y - 20], { size: 20, anchor: "middle", weight: "bold" });
  }
  return svg;
}
