/** geometry: points, segments, rays and lines, polygons, circles, arcs, angle marks, labels, lengths. */
import type { QuizFigureOf } from "@edulink/contracts";
import type { LabelReader } from "./labels";
import { dirOf, placeLabel, type Dir } from "./place";
import { arcPath, HEIGHT, INK, MUTED, n, SHADE, Svg, WIDTH, type Pt } from "./svg";

const MARGIN = 44;

export function drawGeometry(figure: QuizFigureOf<"geometry">, labels: LabelReader): Svg {
  const spec = figure.spec;
  const svg = new Svg();
  const { xMin, xMax, yMin, yMax } = spec.frame;
  const scale = Math.min((WIDTH - 2 * MARGIN) / (xMax - xMin), (HEIGHT - 2 * MARGIN) / (yMax - yMin));
  const ox = (WIDTH - scale * (xMax - xMin)) / 2;
  const oy = (HEIGHT - scale * (yMax - yMin)) / 2;
  const P = (x: number, y: number): Pt => [ox + (x - xMin) * scale, HEIGHT - oy - (y - yMin) * scale];
  const pts = new Map(spec.points.map((p) => [p.id, p]));
  const at = (id: string): Pt => {
    const p = pts.get(id)!;
    return P(p.x, p.y);
  };
  const centroid: Pt = spec.points.length
    ? [spec.points.reduce((s, p) => s + at(p.id)[0], 0) / spec.points.length, spec.points.reduce((s, p) => s + at(p.id)[1], 0) / spec.points.length]
    : [WIDTH / 2, HEIGHT / 2];

  // Grid and axes, faint, under everything.
  const span = Math.max(xMax - xMin, yMax - yMin);
  const step = span <= 24 ? 1 : span <= 60 ? 5 : 10;
  if (spec.grid) {
    for (let x = Math.ceil(xMin / step) * step; x <= xMax + 1e-9; x += step) svg.line(P(x, yMin), P(x, yMax), { stroke: "#e5e7eb", width: 1 });
    for (let y = Math.ceil(yMin / step) * step; y <= yMax + 1e-9; y += step) svg.line(P(xMin, y), P(xMax, y), { stroke: "#e5e7eb", width: 1 });
  }
  if (spec.axes) {
    if (yMin <= 0 && yMax >= 0) svg.arrow(P(xMin, 0), P(xMax, 0), { stroke: MUTED, width: 1.5 });
    if (xMin <= 0 && xMax >= 0) svg.arrow(P(0, yMin), P(0, yMax), { stroke: MUTED, width: 1.5 });
    if (yMin <= 0 && yMax >= 0 && xMin <= 0 && xMax >= 0) {
      for (let x = Math.ceil(xMin / step) * step; x < xMax; x += step) {
        if (Math.abs(x) < 1e-9) continue;
        const p = P(x, 0);
        svg.line([p[0], p[1] - 4], [p[0], p[1] + 4], { stroke: MUTED, width: 1.5 });
        svg.text(labels.measure(x, "units"), [p[0], p[1] + 20], { size: 14, anchor: "middle", colour: MUTED });
      }
      for (let y = Math.ceil(yMin / step) * step; y < yMax; y += step) {
        if (Math.abs(y) < 1e-9) continue;
        const p = P(0, y);
        svg.line([p[0] - 4, p[1]], [p[0] + 4, p[1]], { stroke: MUTED, width: 1.5 });
        svg.text(labels.measure(y, "units"), [p[0] - 8, p[1] + 5], { size: 14, anchor: "end", colour: MUTED });
      }
    }
  }

  for (const poly of spec.polygons) {
    svg.polygon(poly.vertices.map(at), { fill: poly.shade ? SHADE : "none", stroke: INK, dashed: poly.dashed, opacity: poly.shade ? 0.6 : undefined });
  }
  for (const c of spec.circles) {
    svg.circle(at(c.center), c.radius * scale, { dashed: c.dashed, fill: c.shade ? SHADE : "none", stroke: INK, opacity: c.shade ? 0.6 : undefined });
  }
  for (const a of spec.arcs) {
    svg.path(arcPath(at(a.center), a.radius * scale, a.from, a.to, a.sector), { dashed: a.dashed, fill: a.shade ? SHADE : "none", stroke: INK, opacity: a.shade ? 0.6 : undefined });
  }

  // Segments, rays and lines, clipped to the frame.
  const lo = P(xMin, yMax);
  const hi = P(xMax, yMin);
  const toEdge = (from: Pt, through: Pt): Pt => {
    const d: Pt = [through[0] - from[0], through[1] - from[1]];
    let t = Infinity;
    if (d[0] > 1e-9) t = Math.min(t, (hi[0] - from[0]) / d[0]);
    if (d[0] < -1e-9) t = Math.min(t, (lo[0] - from[0]) / d[0]);
    if (d[1] > 1e-9) t = Math.min(t, (hi[1] - from[1]) / d[1]);
    if (d[1] < -1e-9) t = Math.min(t, (lo[1] - from[1]) / d[1]);
    return [from[0] + d[0] * t, from[1] + d[1] * t];
  };
  for (const s of spec.segments) {
    const a = at(s.from);
    const b = at(s.to);
    if (s.kind === "segment") svg.line(a, b, { dashed: s.dashed });
    else {
      const end = toEdge(a, b);
      const start = s.kind === "line" ? toEdge(b, a) : a;
      svg.line(start, end, { dashed: s.dashed });
      svg.arrowHead(start, end);
      if (s.kind === "line") svg.arrowHead(end, start);
    }
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const u: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const normal: Pt = [-u[1], u[0]];
    for (let i = 0; i < s.ticks; i++) {
      const off = (i - (s.ticks - 1) / 2) * 6;
      const c: Pt = [mid[0] + u[0] * off, mid[1] + u[1] * off];
      svg.line([c[0] - normal[0] * 8, c[1] - normal[1] * 8], [c[0] + normal[0] * 8, c[1] + normal[1] * 8], { width: 2 });
    }
    for (let i = 0; i < s.arrows; i++) {
      const c: Pt = [mid[0] + u[0] * (i * 9 + 6), mid[1] + u[1] * (i * 9 + 6)];
      svg.polyline([[c[0] - u[0] * 9 + normal[0] * 6, c[1] - u[1] * 9 + normal[1] * 6], c, [c[0] - u[0] * 9 - normal[0] * 6, c[1] - u[1] * 9 - normal[1] * 6]], { width: 2 });
    }
    const words = [s.label ? labels.key(s.label) : null, s.length ? labels.measure(s.length.value, s.length.unit) : null].filter(Boolean).join(" = ");
    if (words) {
      // Away from the figure's middle, so a triangle's side lengths sit outside it.
      const out: Pt = (mid[0] - centroid[0]) * normal[0] + (mid[1] - centroid[1]) * normal[1] >= 0 ? normal : [-normal[0], -normal[1]];
      placeLabel(svg, words, mid, dirOf(out), { size: 18, gap: 12 });
    }
  }

  for (const ang of spec.angles) {
    const v = at(ang.vertex);
    const a = at(ang.from);
    const b = at(ang.to);
    const t1 = (Math.atan2(-(a[1] - v[1]), a[0] - v[0]) * 180) / Math.PI;
    const t2 = (Math.atan2(-(b[1] - v[1]), b[0] - v[0]) * 180) / Math.PI;
    let sweep = t2 - t1;
    while (sweep < 0) sweep += 360;
    const midDeg = t1 + sweep / 2;
    if (ang.mark === "right") {
      const r = 16;
      const ua: Pt = [Math.cos((t1 * Math.PI) / 180), -Math.sin((t1 * Math.PI) / 180)];
      const ub: Pt = [Math.cos((t2 * Math.PI) / 180), -Math.sin((t2 * Math.PI) / 180)];
      svg.polyline([[v[0] + ua[0] * r, v[1] + ua[1] * r], [v[0] + (ua[0] + ub[0]) * r, v[1] + (ua[1] + ub[1]) * r], [v[0] + ub[0] * r, v[1] + ub[1] * r]], { width: 2 });
    } else {
      for (let i = 0; i < ang.arcs; i++) svg.path(arcPath(v, 24 + i * 6, t1, t1 + sweep), { width: 2 });
    }
    const words = [ang.label ? labels.key(ang.label) : null, ang.measure !== undefined ? labels.measure(ang.measure, "deg") : null].filter(Boolean).join(" = ");
    if (words) {
      const r = 46 + (ang.arcs - 1) * 6;
      const p: Pt = [v[0] + r * Math.cos((midDeg * Math.PI) / 180), v[1] - r * Math.sin((midDeg * Math.PI) / 180)];
      svg.text(words, [p[0], p[1] + 6], { size: 17, anchor: "middle" });
    }
  }

  for (const p of spec.points) {
    const c = at(p.id);
    if (p.dot) svg.circle(c, 4, { fill: INK, stroke: INK, width: 1 });
    const key = p.label === undefined ? p.id : p.label;
    if (key) {
      const dir: Dir = p.place === "auto" ? dirOf([c[0] - centroid[0], c[1] - centroid[1]]) : p.place;
      placeLabel(svg, labels.key(key), c, dir, { size: 20, gap: 10 });
    }
  }
  for (const t of spec.texts) svg.text(labels.key(t.label), [P(t.x, t.y)[0], P(t.x, t.y)[1] + 6], { size: 18, anchor: "middle" });
  void n;
  return svg;
}
