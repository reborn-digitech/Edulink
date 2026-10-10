/** circuit: cells, resistors, bulbs, switches and meters as a small netlist on a 12 × 8 grid. */
import type { QuizFigureOf } from "@edulink/contracts";
import type { LabelReader } from "./labels";
import { placeLabel } from "./place";
import { INK, Svg, type Pt } from "./svg";

const X0 = 60;
const Y0 = 44;
const DX = 43.33;
const DY = 39;

type Part = QuizFigureOf<"circuit">["spec"]["parts"][number];

export function drawCircuit(figure: QuizFigureOf<"circuit">, labels: LabelReader): Svg {
  const s = figure.spec;
  const svg = new Svg();
  const nodes = new Map(s.nodes.map((nd) => [nd.id, nd]));
  const P = (id: string): Pt => {
    const nd = nodes.get(id)!;
    return [X0 + nd.x * DX, Y0 + nd.y * DY];
  };
  const ends = new Map<string, number>();

  for (const part of s.parts) {
    ends.set(part.from, (ends.get(part.from) ?? 0) + 1);
    ends.set(part.to, (ends.get(part.to) ?? 0) + 1);
    const a = P(part.from);
    const b = P(part.to);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const v: Pt = [-u[1], u[0]];
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    // Local frame: along the run (t) and across it (q), centred on the run's middle.
    const L = (t: number, q: number): Pt => [mid[0] + u[0] * t + v[0] * q, mid[1] + u[1] * t + v[1] * q];
    const half = part.type === "wire" ? 0 : Math.min(22, len / 2 - 4);
    if (part.type === "wire") svg.line(a, b, { width: 2.5, cap: "round" });
    else {
      svg.line(a, L(-half, 0), { width: 2.5, cap: "round" });
      svg.line(L(half, 0), b, { width: 2.5, cap: "round" });
      drawSymbol(svg, part, L, half);
    }
    const words = [part.label ? labels.key(part.label) : null, part.value ? labels.measure(part.value.value, part.value.unit) : null].filter(Boolean).join(" = ");
    if (words) {
      // Outside the loop: above a horizontal run, to the outer side of a vertical one.
      const horizontal = Math.abs(u[0]) > 0.5;
      const anchor = L(0, 0);
      if (horizontal) placeLabel(svg, words, [anchor[0], anchor[1] - 18], "n", { size: 17, gap: 4 });
      else {
        const leftHalf = anchor[0] < X0 + 6 * DX;
        placeLabel(svg, words, [anchor[0] + (leftHalf ? -20 : 20), anchor[1]], leftHalf ? "w" : "e", { size: 17, gap: 4 });
      }
    }
  }
  for (const nd of s.nodes) {
    const p = P(nd.id);
    if ((ends.get(nd.id) ?? 0) >= 3) svg.circle(p, 4.5, { fill: INK, stroke: INK, width: 1 });
    if (nd.label) placeLabel(svg, labels.key(nd.label), p, nd.y >= 4 ? "s" : "n", { size: 17, gap: 8 });
  }
  return svg;
}

function drawSymbol(svg: Svg, part: Part, L: (t: number, q: number) => Pt, half: number): void {
  const plate = (t: number, long: boolean) => svg.line(L(t, long ? -16 : -8), L(t, long ? 16 : 8), { width: long ? 2.5 : 5 });
  const meter = (letter: string) => {
    svg.line(L(-half, 0), L(-14, 0), { width: 2.5 });
    svg.line(L(14, 0), L(half, 0), { width: 2.5 });
    svg.circle(L(0, 0), 14, { fill: "#ffffff", stroke: INK, width: 2.5 });
    const c = L(0, 0);
    svg.text(letter, [c[0], c[1] + 7], { size: 20, anchor: "middle", weight: "bold", halo: false });
  };
  const join = (from: number, to: number) => svg.line(L(from, 0), L(to, 0), { width: 2.5 });
  switch (part.type) {
    case "cell":
      join(-half, -4);
      join(4, half);
      plate(-4, true);
      plate(4, false);
      return;
    case "battery":
      join(-half, -12);
      join(12, half);
      plate(-12, true);
      plate(-4, false);
      plate(4, true);
      plate(12, false);
      svg.line(L(-4, 0), L(4, 0), { width: 2, dashed: true });
      return;
    case "resistor":
    case "rheostat": {
      const pts: Pt[] = [L(-half, 0), L(-18, 0)];
      for (let k = 0; k < 6; k++) pts.push(L(-18 + 3 + k * 6, k % 2 ? 7 : -7));
      pts.push(L(18, 0), L(half, 0));
      svg.polyline(pts, { width: 2.5 });
      if (part.type === "rheostat") svg.arrow(L(-14, 14), L(14, -14), { width: 2 });
      return;
    }
    case "bulb": {
      join(-half, -13);
      join(13, half);
      svg.circle(L(0, 0), 13, { fill: "#fffbe6", stroke: INK, width: 2.5 });
      svg.line(L(-9, -9), L(9, 9), { width: 2 });
      svg.line(L(-9, 9), L(9, -9), { width: 2 });
      return;
    }
    case "switchOpen":
    case "switchClosed": {
      join(-half, -14);
      join(14, half);
      svg.circle(L(-14, 0), 3.5, { fill: "#ffffff", stroke: INK, width: 2 });
      svg.circle(L(14, 0), 3.5, { fill: "#ffffff", stroke: INK, width: 2 });
      svg.line(L(-11, 0), part.type === "switchOpen" ? L(12, -14) : L(11, 0), { width: 2.5, cap: "round" });
      return;
    }
    case "ammeter":
      return meter("A");
    case "voltmeter":
      return meter("V");
    case "galvanometer":
      return meter("G");
    case "fuse":
      join(-half, -15);
      join(15, half);
      svg.polygon([L(-15, -6), L(15, -6), L(15, 6), L(-15, 6)], { fill: "#ffffff", stroke: INK, width: 2 });
      svg.line(L(-15, 0), L(15, 0), { width: 1.5 });
      return;
    case "wire":
      return;
  }
}
