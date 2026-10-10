/**
 * The diagram library: twenty schematic parts for the class 6 to 10 science and mathematics exercises,
 * each drawn in its own box from −50 to 50 across and down, with the points its labels name. Drawn
 * plainly, as a textbook's line figure is, and never from a book's drawing.
 */
import { QUIZ_DIAGRAM_PARTS, type QuizDiagramPart } from "@edulink/contracts";
import { arcPath, FILL, INK, n, pointsPath, smoothPath, type Pt, type Stroke, type Svg } from "./svg";

/** Drawing in a part's own box: every point and length passes through the placement. */
export class Pen {
  constructor(
    private readonly svg: Svg,
    private readonly cx: number,
    private readonly cy: number,
    /** Pixels per box unit. */
    readonly k: number,
    private readonly flip: boolean,
  ) {}

  p(x: number, y: number): Pt {
    this.reach(x, y);
    return [this.cx + (this.flip ? -x : x) * this.k, this.cy + y * this.k];
  }
  /**
   * Where the part's ink lies, in the box's own units, so a diagram can keep every label off every part
   * (integration, 11 Oct 2026: two magnets side by side wrote one's pole labels over the other). Every
   * point a drawing passes through counts, a circle by its radius; a curve's control point may lie
   * outside the curve, so the reach is clipped to the part's −50…50 box.
   */
  private x0 = Infinity;
  private y0 = Infinity;
  private x1 = -Infinity;
  private y1 = -Infinity;
  private reach(x: number, y: number, r = 0): void {
    this.x0 = Math.min(this.x0, x - r);
    this.y0 = Math.min(this.y0, y - r);
    this.x1 = Math.max(this.x1, x + r);
    this.y1 = Math.max(this.y1, y + r);
  }
  /** The ink's box on the card, in pixels: [left, top, right, bottom]. */
  inkBox(): [number, number, number, number] {
    const clip = (v: number) => Math.max(-50, Math.min(50, v));
    const xs = [clip(this.x0), clip(this.x1)].map((x) => this.cx + (this.flip ? -x : x) * this.k);
    return [Math.min(...xs), this.cy + clip(this.y0) * this.k, Math.max(...xs), this.cy + clip(this.y1) * this.k];
  }
  private many(points: Pt[]): Pt[] {
    return points.map(([x, y]) => this.p(x, y));
  }
  private w(s: Stroke): Stroke {
    return { ...s, width: (s.width ?? 2.2) * Math.min(1.4, Math.max(0.7, this.k / 2.6)) };
  }
  line(a: Pt, b: Pt, s: Stroke = {}): void {
    this.svg.line(this.p(...a), this.p(...b), this.w(s));
  }
  polyline(points: Pt[], s: Stroke = {}): void {
    this.svg.polyline(this.many(points), this.w(s));
  }
  polygon(points: Pt[], s: Stroke = {}): void {
    this.svg.polygon(this.many(points), this.w(s));
  }
  smooth(points: Pt[], s: Stroke = {}, closed = true): void {
    this.svg.path(smoothPath(this.many(points), closed), this.w(s));
  }
  circle(c: Pt, r: number, s: Stroke = {}): void {
    this.reach(c[0], c[1], r);
    this.svg.circle(this.p(...c), r * this.k, this.w(s));
  }
  ellipse(c: Pt, rx: number, ry: number, s: Stroke = {}, rotate = 0): void {
    this.reach(c[0], c[1], Math.max(rx, ry));
    this.svg.ellipse(this.p(...c), rx * this.k, ry * this.k, this.w(s), this.flip ? -rotate : rotate);
  }
  /** An arc of a circle in the box: degrees counter-clockwise on paper (a flipped part mirrors them). */
  arc(c: Pt, r: number, from: number, to: number, s: Stroke = {}): void {
    this.reach(c[0], c[1], r);
    const [f, t] = this.flip ? [180 - to, 180 - from] : [from, to];
    this.svg.path(arcPath(this.p(...c), r * this.k, f, t), this.w(s));
  }
  arrow(a: Pt, b: Pt, s: Stroke = {}): void {
    this.svg.line(this.p(...a), this.p(...b), this.w(s));
    this.svg.arrowHead(this.p(...a), this.p(...b), 9 + this.k, s.stroke ?? INK);
  }
  /** An arrowhead in the middle of a ray, pointing from a to b. */
  midArrow(a: Pt, b: Pt, colour: string = INK): void {
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    this.svg.arrowHead(this.p(...a), this.p(...m), 8 + this.k * 1.5, colour);
  }
  quad(a: Pt, c: Pt, b: Pt, s: Stroke = {}): void {
    const [pa, pc, pb] = [this.p(...a), this.p(...c), this.p(...b)];
    this.svg.path(`M${n(pa[0])} ${n(pa[1])}Q${n(pc[0])} ${n(pc[1])} ${n(pb[0])} ${n(pb[1])}`, this.w(s));
  }
  path(points: Pt[], s: Stroke = {}, closed = false): void {
    this.svg.path(pointsPath(this.many(points), closed), this.w(s));
  }
  letter(str: string, at: Pt, size: number, colour: string = INK): void {
    const p = this.p(...at);
    this.svg.text(str, [p[0], p[1] + size * 0.35 * this.k], { size: size * this.k, anchor: "middle", weight: "bold", halo: false, colour });
  }
}

/** Where a label points (in the box) and which side of the part it is written on. */
export type Anchor = { at: Pt; side: "e" | "w" | "n" | "s" };
type PartDef = { draw: (g: Pen) => void; anchors: Record<string, Anchor> };

const hatch = (g: Pen, from: Pt, to: Pt, count: number, dx: number, dy: number) => {
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    g.line([x, y], [x + dx, y + dy], { width: 1.2 });
  }
};

const leafShape = (g: Pen, base: Pt, tip: Pt, width: number, fill: string = FILL.leaf) => {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const len = Math.hypot(dx, dy);
  const u: Pt = [dx / len, dy / len];
  const v: Pt = [-u[1], u[0]];
  const at = (t: number, q: number): Pt => [base[0] + u[0] * len * t + v[0] * q, base[1] + u[1] * len * t + v[1] * q];
  g.smooth([base, at(0.3, width), at(0.7, width * 0.8), tip, at(0.7, -width * 0.8), at(0.3, -width)], { fill, stroke: INK });
  g.line(base, at(0.92, 0), { width: 1.2 });
};

const MUTED_OUTLINE = "#9ca3af";

export const PARTS: Record<QuizDiagramPart, PartDef> = {
  beaker: {
    draw: (g) => {
      g.polygon([[-29, 2], [29, 2], [28, 39], [-28, 39]], { fill: FILL.water, stroke: "none" });
      g.line([-29, 2], [29, 2], { stroke: "#60a5fa", width: 1.5 });
      g.polyline([[-36, -44], [-30, -38], [-28, 40], [28, 40], [30, -42]], { width: 2.6 });
      for (const y of [-26, -12, 2, 16, 30]) g.line([18, y], [27, y], { width: 1.4 });
    },
    anchors: { beaker: { at: [30, -30], side: "e" }, liquid: { at: [-10, 22], side: "w" } },
  },
  spiritLamp: {
    draw: (g) => {
      g.smooth([[-30, 42], [30, 42], [36, 18], [16, -4], [-16, -4], [-36, 18]], { fill: FILL.glass, stroke: INK });
      g.polygon([[-30, 22], [30, 22], [29, 40], [-29, 40]], { fill: FILL.water, stroke: "none" });
      g.polygon([[-8, -4], [8, -4], [8, -14], [-8, -14]], { fill: FILL.metal, stroke: INK });
      g.line([0, -14], [0, -24], { width: 3 });
      g.smooth([[0, -52], [9, -34], [0, -22], [-9, -34]], { fill: FILL.flame, stroke: "#ea580c" });
      g.smooth([[0, -40], [4, -31], [0, -25], [-4, -31]], { fill: FILL.sun, stroke: "none" });
    },
    anchors: { lamp: { at: [32, 24], side: "e" }, wick: { at: [0, -18], side: "w" }, flame: { at: [6, -36], side: "e" } },
  },
  planeMirror: {
    draw: (g) => {
      g.line([-44, 30], [44, 30], { width: 3.5 });
      hatch(g, [-42, 30], [42, 30], 14, -5, 7);
      g.line([0, 30], [0, -46], { dashed: true, width: 1.6 });
      g.line([-38, -40], [0, 30], { stroke: "#dc2626" });
      g.midArrow([-38, -40], [0, 30], "#dc2626");
      g.line([0, 30], [38, -40], { stroke: "#dc2626" });
      g.midArrow([0, 30], [38, -40], "#dc2626");
      g.arc([0, 30], 14, 90, 118.5, { width: 1.4 });
      g.arc([0, 30], 17, 61.5, 90, { width: 1.4 });
    },
    anchors: { mirror: { at: [40, 30], side: "e" }, incidentRay: { at: [-24, -14], side: "w" }, reflectedRay: { at: [24, -14], side: "e" }, normal: { at: [0, -44], side: "n" } },
  },
  concaveMirror: {
    draw: (g) => {
      // A circle of radius 72 about C(−40, 0): the pole P is at (32, 0), the focus F half way at (−4, 0).
      g.line([-50, 0], [48, 0], { width: 1.6 });
      g.arc([-40, 0], 72, -36, 36, { width: 3.5 });
      for (let a = -32; a <= 32; a += 8) {
        const r = (a * Math.PI) / 180;
        const x = -40 + 72 * Math.cos(r);
        const y = -72 * Math.sin(r);
        g.line([x, y], [x + 6, y - 4], { width: 1.2 });
      }
      for (const x of [32, -4, -40]) g.circle([x, 0], 1.6, { fill: INK, stroke: INK, width: 1 });
      // A ray parallel to the axis meets the mirror at (28.56, −22) and is reflected through F.
      g.line([-50, -22], [28.56, -22], { stroke: "#dc2626" });
      g.midArrow([-50, -22], [28.56, -22], "#dc2626");
      g.line([28.56, -22], [-27.2, 15.68], { stroke: "#dc2626" });
      g.midArrow([28.56, -22], [-27.2, 15.68], "#dc2626");
    },
    anchors: {
      mirror: { at: [26, -38], side: "e" },
      principalAxis: { at: [-48, 0], side: "w" },
      focus: { at: [-4, 0], side: "s" },
      centre: { at: [-40, 0], side: "s" },
      pole: { at: [32, 0], side: "e" },
    },
  },
  convexLens: {
    draw: (g) => {
      g.line([-50, 0], [50, 0], { width: 1.6 });
      g.quad([0, -42], [-14, 0], [0, 42], { fill: FILL.glass });
      g.quad([0, -42], [14, 0], [0, 42], { fill: FILL.glass });
      for (const x of [-28, 28, 0]) g.circle([x, 0], 1.6, { fill: INK, stroke: INK, width: 1 });
      g.line([-50, -20], [0, -20], { stroke: "#dc2626" });
      g.midArrow([-50, -20], [0, -20], "#dc2626");
      g.line([0, -20], [50, 15.7], { stroke: "#dc2626" });
      g.midArrow([0, -20], [50, 15.7], "#dc2626");
    },
    anchors: { lens: { at: [4, -40], side: "n" }, principalAxis: { at: [-48, 0], side: "w" }, focus: { at: [28, 0], side: "s" }, opticalCentre: { at: [0, 0], side: "s" } },
  },
  prism: {
    draw: (g) => {
      g.polygon([[0, -40], [-38, 30], [38, 30]], { fill: FILL.glass, stroke: INK, width: 2.6 });
      g.line([-50, 12], [-20, -2], { width: 3 });
      g.midArrow([-50, 12], [-20, -2]);
      const colours = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#4f46e5", "#7c3aed"];
      colours.forEach((c, i) => {
        const exit: Pt = [18 + i * 0.8, -6 + i * 1.5];
        g.line([-20, -2], exit, { stroke: c, width: 1.6 });
        g.line(exit, [50, 4 + i * 5], { stroke: c, width: 2 });
      });
    },
    anchors: {
      prism: { at: [0, -40], side: "n" },
      whiteLight: { at: [-44, 9], side: "w" },
      spectrum: { at: [44, 18], side: "e" },
      red: { at: [50, 4], side: "e" },
      violet: { at: [50, 34], side: "e" },
    },
  },
  barMagnet: {
    draw: (g) => {
      for (let i = 1; i <= 3; i++) {
        const lift = 10 + i * 10;
        g.quad([-34, -6], [0, -10 - lift * 1.6], [34, -6], { width: 1.5 });
        g.quad([-34, 6], [0, 10 + lift * 1.6], [34, 6], { width: 1.5 });
        g.midArrow([-2, -8 - lift * 0.8], [2, -8 - lift * 0.8]);
        g.midArrow([-2, 8 + lift * 0.8], [2, 8 + lift * 0.8]);
      }
      g.polygon([[-35, -10], [0, -10], [0, 10], [-35, 10]], { fill: "#fca5a5", stroke: INK });
      g.polygon([[0, -10], [35, -10], [35, 10], [0, 10]], { fill: "#93c5fd", stroke: INK });
      g.letter("N", [-17, 0], 11);
      g.letter("S", [17, 0], 11);
    },
    anchors: { north: { at: [-35, 0], side: "w" }, south: { at: [35, 0], side: "e" }, fieldLine: { at: [0, -42], side: "n" } },
  },
  compass: {
    draw: (g) => {
      g.circle([0, 0], 40, { fill: "#ffffff", stroke: INK, width: 3 });
      g.circle([0, 0], 34, { width: 1.2 });
      for (let a = 0; a < 360; a += 45) {
        const r = (a * Math.PI) / 180;
        g.line([34 * Math.cos(r), 34 * Math.sin(r)], [(a % 90 ? 30 : 27) * Math.cos(r), (a % 90 ? 30 : 27) * Math.sin(r)], { width: 1.4 });
      }
      g.polygon([[0, -28], [5, 0], [-5, 0]], { fill: "#ef4444", stroke: INK, width: 1.4 });
      g.polygon([[0, 28], [5, 0], [-5, 0]], { fill: "#e5e7eb", stroke: INK, width: 1.4 });
      g.circle([0, 0], 2.5, { fill: INK, stroke: INK, width: 1 });
    },
    anchors: { needle: { at: [2, -16], side: "e" }, dial: { at: [-38, 12], side: "w" } },
  },
  dryCell: {
    draw: (g) => {
      g.polygon([[-18, -36], [18, -36], [18, 42], [-18, 42]], { fill: "#e0e7ff", stroke: INK, width: 2.6 });
      g.polygon([[-6, -44], [6, -44], [6, -36], [-6, -36]], { fill: FILL.metal, stroke: INK });
      g.line([-6, -24], [6, -24], { width: 2.4 });
      g.line([0, -30], [0, -18], { width: 2.4 });
      g.line([-6, 32], [6, 32], { width: 2.4 });
    },
    anchors: { positive: { at: [6, -42], side: "e" }, negative: { at: [10, 40], side: "e" }, cell: { at: [-18, 6], side: "w" } },
  },
  plantCell: {
    draw: (g) => {
      g.polygon([[-46, -32], [46, -32], [46, 32], [-46, 32]], { fill: "#d9f99d", stroke: INK, width: 3 });
      g.polygon([[-42, -28], [42, -28], [42, 28], [-42, 28]], { fill: "#ecfccb", stroke: INK, width: 1.4 });
      g.smooth([[-6, -16], [26, -20], [34, 0], [26, 18], [-4, 18], [-10, 0]], { fill: FILL.water, stroke: INK, width: 1.4 });
      g.circle([-26, -12], 9, { fill: "#c4b5fd", stroke: INK, width: 1.6 });
      g.circle([-24, -10], 2.5, { fill: "#6d28d9", stroke: "none" });
      for (const [x, y, r] of [[-30, 14, 20], [-14, 22, -10], [34, -22, 15], [36, 22, -25]] as const) g.ellipse([x, y], 5, 2.6, { fill: FILL.leafDark, stroke: INK, width: 1 }, r);
    },
    anchors: {
      cellWall: { at: [46, -26], side: "e" },
      membrane: { at: [42, 10], side: "e" },
      vacuole: { at: [26, 0], side: "e" },
      nucleus: { at: [-30, -14], side: "w" },
      chloroplast: { at: [-34, 14], side: "w" },
      cytoplasm: { at: [-18, 4], side: "w" },
    },
  },
  animalCell: {
    draw: (g) => {
      g.smooth([[-44, -10], [-30, -32], [0, -36], [32, -28], [46, -2], [36, 26], [6, 34], [-26, 30], [-42, 14]], { fill: FILL.tissue, stroke: INK, width: 2.6 });
      g.circle([-4, -4], 11, { fill: "#c4b5fd", stroke: INK, width: 1.6 });
      g.circle([-2, -2], 3, { fill: "#6d28d9", stroke: "none" });
      for (const [x, y, r] of [[24, 10, 25], [-26, 14, -15]] as const) {
        g.ellipse([x, y], 8, 4, { fill: "#fdba74", stroke: INK, width: 1.2 }, r);
      }
      for (const [x, y] of [[16, -18], [-24, -12], [8, 22], [30, -6]] as const) g.circle([x, y], 1.2, { fill: INK, stroke: "none" });
    },
    anchors: { membrane: { at: [40, -16], side: "e" }, nucleus: { at: [-6, -14], side: "n" }, cytoplasm: { at: [-30, -4], side: "w" }, mitochondrion: { at: [28, 12], side: "e" } },
  },
  leaf: {
    draw: (g) => {
      g.smooth([[-30, 0], [-12, -24], [20, -20], [46, 0], [20, 20], [-12, 24]], { fill: FILL.leaf, stroke: INK, width: 2.4 });
      g.line([-48, 4], [-30, 0], { width: 3.4 });
      g.line([-30, 0], [44, 0], { width: 2.2 });
      for (const x of [-16, -2, 12, 26]) {
        g.quad([x, 0], [x + 8, -8], [x + 14, -16 + Math.max(0, x - 10) * 0.3], { width: 1.2 });
        g.quad([x, 0], [x + 8, 8], [x + 14, 16 - Math.max(0, x - 10) * 0.3], { width: 1.2 });
      }
    },
    anchors: { lamina: { at: [8, -18], side: "n" }, midrib: { at: [38, 0], side: "e" }, vein: { at: [12, 12], side: "s" }, petiole: { at: [-44, 3], side: "w" } },
  },
  flower: {
    draw: (g) => {
      g.line([0, 50], [0, 16], { width: 3, stroke: FILL.leafDark });
      leafShape(g, [-2, 16], [-22, 8], 4, "#86efac");
      leafShape(g, [2, 16], [22, 8], 4, "#86efac");
      g.smooth([[-4, 14], [-30, -2], [-34, -26], [-16, -16], [-4, 6]], { fill: FILL.pink, stroke: INK, width: 1.6 });
      g.smooth([[4, 14], [30, -2], [34, -26], [16, -16], [4, 6]], { fill: FILL.pink, stroke: INK, width: 1.6 });
      for (const x of [-12, 12]) {
        g.line([x * 0.3, 10], [x, -28], { width: 1.4 });
        g.ellipse([x, -30], 2.6, 4, { fill: "#facc15", stroke: INK, width: 1 });
      }
      g.smooth([[-4, 12], [4, 12], [3, -2], [1.6, -26], [-1.6, -26], [-3, -2]], { fill: "#bbf7d0", stroke: INK, width: 1.4 });
      g.ellipse([0, -30], 5, 3, { fill: FILL.leafDark, stroke: INK, width: 1 });
    },
    anchors: { petal: { at: [-30, -10], side: "w" }, sepal: { at: [-18, 9], side: "w" }, stamen: { at: [12, -30], side: "e" }, pistil: { at: [0, -32], side: "n" } },
  },
  plant: {
    draw: (g) => {
      g.polygon([[-50, 18], [50, 18], [50, 50], [-50, 50]], { fill: "#f5e1c8", stroke: "none" });
      g.line([-50, 18], [50, 18], { width: 1.6, stroke: "#92400e" });
      g.polyline([[0, 18], [0, 44]], { width: 2.4, stroke: "#78350f" });
      const roots: [Pt, Pt][] = [[[0, 26], [-16, 40]], [[0, 30], [14, 44]], [[0, 36], [-10, 48]], [[-8, 33], [-18, 34]], [[7, 37], [18, 38]]];
      for (const [a, b] of roots) g.line(a, b, { width: 1.4, stroke: "#78350f" });
      g.line([0, 18], [0, -32], { width: 3, stroke: FILL.leafDark });
      leafShape(g, [0, -2], [-26, -14], 8);
      leafShape(g, [0, 6], [26, -4], 8);
      for (let k = 0; k < 5; k++) {
        const r = ((k * 72 - 90) * Math.PI) / 180;
        g.circle([7 * Math.cos(r), -38 + 7 * Math.sin(r)], 5.5, { fill: FILL.pink, stroke: INK, width: 1.2 });
      }
      g.circle([0, -38], 4, { fill: "#facc15", stroke: INK, width: 1.2 });
    },
    anchors: { root: { at: [10, 40], side: "e" }, stem: { at: [0, 12], side: "e" }, leaf: { at: [-20, -11], side: "w" }, flower: { at: [6, -42], side: "e" } },
  },
  waterCycle: {
    draw: (g) => {
      g.circle([-38, -32], 9, { fill: FILL.sun, stroke: "#d97706", width: 1.6 });
      for (let a = 0; a < 360; a += 45) {
        const r = (a * Math.PI) / 180;
        g.line([-38 + 12 * Math.cos(r), -32 + 12 * Math.sin(r)], [-38 + 16 * Math.cos(r), -32 + 16 * Math.sin(r)], { stroke: "#d97706", width: 1.4 });
      }
      g.polygon([[-50, 34], [16, 34], [16, 50], [-50, 50]], { fill: FILL.water, stroke: "none" });
      g.polyline([[-50, 34], [-40, 32], [-30, 34], [-20, 32], [-10, 34], [0, 32], [10, 34], [16, 33]], { width: 1.4, stroke: "#2563eb" });
      g.polygon([[10, 50], [24, 18], [36, 8], [50, 14], [50, 50]], { fill: "#bbf7d0", stroke: INK, width: 1.6 });
      g.smooth([[6, -30], [14, -40], [26, -42], [38, -36], [46, -28], [36, -22], [14, -22]], { fill: "#f1f5f9", stroke: INK, width: 1.6 });
      for (const x of [-26, -12]) g.arrow([x, 28], [x, -6], { stroke: "#2563eb", width: 1.6, dashed: true });
      g.arrow([-6, -14], [6, -26], { stroke: INK, width: 1.6 });
      for (const x of [20, 28, 36]) g.line([x, -18], [x - 2, -8], { stroke: "#2563eb", width: 1.6 });
      g.arrow([30, 0], [28, 12], { stroke: "#2563eb", width: 1.6 });
      g.arrow([22, 26], [12, 36], { stroke: INK, width: 1.4 });
    },
    anchors: {
      sun: { at: [-38, -42], side: "n" },
      evaporation: { at: [-26, 10], side: "w" },
      condensation: { at: [24, -42], side: "n" },
      precipitation: { at: [36, -10], side: "e" },
      water: { at: [-30, 44], side: "w" },
    },
  },
  digestiveTract: {
    draw: (g) => {
      g.smooth([[-30, -50], [30, -50], [36, 0], [30, 48], [-30, 48], [-36, 0]], { fill: "#fff7ed", stroke: MUTED_OUTLINE, width: 1.4 });
      g.ellipse([0, -46], 6, 3, { fill: "#fda4af", stroke: INK, width: 1.4 });
      g.line([-1.6, -43], [-1.6, -20], { width: 1.6 });
      g.line([1.6, -43], [1.6, -20], { width: 1.6 });
      g.polygon([[-30, -22], [0, -24], [-6, -8], [-30, -10]], { fill: "#b45309", stroke: INK, width: 1.4, opacity: 0.55 });
      g.smooth([[0, -22], [14, -26], [24, -16], [18, -4], [4, -4], [-2, -14]], { fill: "#fecaca", stroke: INK, width: 1.6 });
      g.polyline([[-22, 34], [-24, 2], [24, 2], [24, 34], [4, 36], [2, 46]], { width: 5, stroke: "#d6a77a" });
      g.smooth([[-14, 10], [12, 8], [14, 16], [-12, 16], [-14, 24], [12, 22], [14, 30], [-10, 30]], { width: 2.4, stroke: "#f472b6" }, false);
    },
    anchors: {
      mouth: { at: [5, -46], side: "e" },
      oesophagus: { at: [-2, -32], side: "w" },
      stomach: { at: [20, -14], side: "e" },
      liver: { at: [-24, -16], side: "w" },
      smallIntestine: { at: [12, 22], side: "e" },
      largeIntestine: { at: [-23, 26], side: "w" },
    },
  },
  eye: {
    draw: (g) => {
      g.line([30, 6], [50, 12], { width: 7, stroke: "#fcd34d" });
      g.circle([0, 0], 38, { fill: "#ffffff", stroke: INK, width: 2.6 });
      g.arc([0, 0], 34, -62, 62, { width: 4, stroke: "#f87171" });
      g.quad([-30, -20], [-50, 0], [-30, 20], { fill: FILL.glass, width: 1.8 });
      g.line([-28, -22], [-26, -9], { width: 4, stroke: "#92400e" });
      g.line([-28, 22], [-26, 9], { width: 4, stroke: "#92400e" });
      g.ellipse([-20, 0], 6, 12, { fill: "#e0f2fe", stroke: INK, width: 1.6 });
    },
    anchors: { cornea: { at: [-42, -6], side: "w" }, iris: { at: [-27, -18], side: "n" }, lens: { at: [-18, 10], side: "s" }, retina: { at: [30, -18], side: "e" }, opticNerve: { at: [46, 11], side: "e" } },
  },
  pendulum: {
    draw: (g) => {
      g.polygon([[-30, -48], [30, -48], [30, -42], [-30, -42]], { fill: FILL.wood, stroke: INK, width: 1.6 });
      hatch(g, [-28, -48], [28, -48], 10, 4, -5);
      g.line([0, -42], [0, 30], { dashed: true, width: 1.4 });
      g.circle([0, 30], 7, { fill: "none", stroke: INK, dashed: true, width: 1.4 });
      g.line([0, -42], [26, 24], { width: 1.8 });
      g.circle([26, 24], 7, { fill: "#94a3b8", stroke: INK, width: 1.8 });
      g.arc([0, -42], 72, 245, 295, { dashed: true, width: 1.2 });
    },
    anchors: { support: { at: [30, -45], side: "e" }, string: { at: [13, -9], side: "e" }, bob: { at: [32, 26], side: "e" }, meanPosition: { at: [0, 38], side: "s" } },
  },
  sunEarthMoon: {
    draw: (g) => {
      g.arc([-36, 0], 58, -28, 28, { dashed: true, width: 1.2 });
      g.circle([-36, 0], 16, { fill: FILL.sun, stroke: "#d97706", width: 1.8 });
      g.circle([22, 0], 19, { dashed: true, width: 1.2 });
      g.circle([22, 0], 9, { fill: FILL.earth, stroke: INK, width: 1.6 });
      g.circle([37, -11], 4, { fill: FILL.moon, stroke: INK, width: 1.4 });
    },
    anchors: { sun: { at: [-36, -16], side: "n" }, earth: { at: [22, 9], side: "s" }, moon: { at: [39, -14], side: "n" }, orbit: { at: [35.4, 13.4], side: "e" } },
  },
  lever: {
    draw: (g) => {
      g.polygon([[-48, -3], [48, -3], [48, 3], [-48, 3]], { fill: FILL.wood, stroke: INK, width: 1.8 });
      g.polygon([[-10, 3], [-18, 18], [-2, 18]], { fill: "#94a3b8", stroke: INK, width: 1.8 });
      g.line([-30, 18], [12, 18], { width: 1.6 });
      g.polygon([[-47, -3], [-31, -3], [-31, -18], [-47, -18]], { fill: "#cbd5e1", stroke: INK, width: 1.8 });
      g.arrow([40, -30], [40, -5], { width: 2.4, stroke: "#dc2626" });
    },
    anchors: { fulcrum: { at: [-10, 18], side: "s" }, effort: { at: [40, -30], side: "n" }, load: { at: [-39, -18], side: "n" } },
  },
};


/** The library matches the contract's list of parts and labels exactly; a test holds it. */
export function partAnchorsMatchContract(): string[] {
  const problems: string[] = [];
  for (const [part, anchors] of Object.entries(QUIZ_DIAGRAM_PARTS)) {
    const def = PARTS[part as QuizDiagramPart];
    if (!def) {
      problems.push(`${part} is not drawn`);
      continue;
    }
    const drawn = Object.keys(def.anchors).sort().join(",");
    const listed = [...anchors].sort().join(",");
    if (drawn !== listed) problems.push(`${part}: drawn ${drawn}, listed ${listed}`);
  }
  return problems;
}
