/**
 * diagram: up to six parts from the library placed on a 100 × 62.5 canvas, with their labels written
 * beside them on leader lines, and arrows and free labels between them. The labels on one side of a
 * part are stacked so none overlaps the next, in the order of the points they name.
 *
 * ⚠ AND NO LABEL IS WRITTEN OVER A PART, ITS OWN OR ANOTHER'S, OR OVER ANOTHER LABEL (integration,
 * 11 Oct 2026). The first layout placed each part's labels as if it were alone on the card: two bar
 * magnets side by side wrote the left one's "South pole (S)" beside the right one's "North pole (N)",
 * and a label slid back from the card's edge landed on its own magnet. Every part is drawn first, its
 * ink's box kept (Pen.inkBox); then each label tries its own side, and when that box is taken it moves
 * above or below its part, one line further out at a time, and takes the first clear place.
 */
import { QUIZ_DIAGRAM_PARTS, type QuizFigureOf } from "@edulink/contracts";
import { textWidth } from "./font";
import type { LabelReader } from "./labels";
import { Pen, PARTS, type Anchor } from "./parts";
import { HEIGHT, INK, MUTED, n, Svg, WIDTH, type Pt } from "./svg";

const UNIT = WIDTH / 100;
const SIZE = 17;
const LINE = SIZE + 5;

export function drawDiagram(figure: QuizFigureOf<"diagram">, labels: LabelReader): Svg {
  return layoutDiagram(figure, labels).svg;
}

/** The drawing with where its parts' ink and its labels landed, for the tests' no-overlap rule. */
export function layoutDiagram(figure: QuizFigureOf<"diagram">, labels: LabelReader): { svg: Svg; inks: Box[]; labels: Box[] } {
  const svg = new Svg();
  const laid = figure.spec.parts.map((placed) => drawPart(svg, placed, labels));
  const keepOut = laid.map((l) => l.ink);
  const taken: Box[] = [];
  for (const l of laid) for (const it of l.items) writeLabel(svg, it, l, keepOut, taken);
  for (const a of figure.spec.arrows) {
    const from: Pt = [a.from[0] * UNIT, a.from[1] * UNIT];
    const to: Pt = [a.to[0] * UNIT, a.to[1] * UNIT];
    const mid: Pt = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    if (a.curved) {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
      const c: Pt = [mid[0] + ((to[1] - from[1]) / len) * len * 0.25, mid[1] - ((to[0] - from[0]) / len) * len * 0.25];
      svg.path(`M${n(from[0])} ${n(from[1])}Q${n(c[0])} ${n(c[1])} ${n(to[0])} ${n(to[1])}`, { width: 2.2 });
      svg.arrowHead(c, to);
      if (a.label) svg.text(labels.key(a.label), [(mid[0] + c[0]) / 2, (mid[1] + c[1]) / 2 - 6], { size: SIZE, anchor: "middle" });
    } else {
      svg.arrow(from, to, { width: 2.2 });
      if (a.label) svg.text(labels.key(a.label), [mid[0], mid[1] - 8], { size: SIZE, anchor: "middle" });
    }
  }
  for (const t of figure.spec.texts) svg.text(labels.key(t.label), [t.x * UNIT, t.y * UNIT + 6], { size: SIZE + 1, anchor: "middle" });
  return { svg, inks: keepOut, labels: taken };
}

type Placed = QuizFigureOf<"diagram">["spec"]["parts"][number];
type Side = Anchor["side"];
type Item = { text: string; from: Pt; side: Side; x: number; y: number; w: number };
/** [left, top, right, bottom] in card pixels. */
export type Box = [number, number, number, number];
type Laid = { items: Item[]; ink: Box };

const PAD = 3;

/** Draws the part and returns its labels, stacked per side, and its ink's box; the labels are written later. */
function drawPart(svg: Svg, placed: Placed, labels: LabelReader): Laid {
  const def = PARTS[placed.part];
  const k = (placed.size * UNIT) / 100;
  const cx = placed.x * UNIT;
  const cy = placed.y * UNIT;
  const pen = new Pen(svg, cx, cy, k, placed.flip);
  def.draw(pen);
  const ink = pen.inkBox();

  const order = QUIZ_DIAGRAM_PARTS[placed.part] as readonly string[];
  const shown = order.filter((a) => placed.labels.includes(a));
  const items: Item[] = shown.map((anchor) => {
    const a = def.anchors[anchor]!;
    let side = a.side;
    if (placed.flip && (side === "e" || side === "w")) side = side === "e" ? "w" : "e";
    const from = pen.p(...a.at);
    const text = labels.part(placed.part, anchor, placed.text[anchor]);
    const w = textWidth(text, SIZE);
    const edge = 50 * k + 10;
    if (side === "e") return { text, from, side, x: cx + edge, y: from[1], w };
    if (side === "w") return { text, from, side, x: cx - edge, y: from[1], w };
    if (side === "n") return { text, from, side, x: from[0], y: cy - 50 * k - 12, w };
    return { text, from, side, x: from[0], y: cy + 50 * k + 12 + SIZE * 0.7, w };
  });

  // Stack each side: east and west by height, north and south by width, pushed apart in order.
  for (const side of ["e", "w"] as const) {
    const col = items.filter((i) => i.side === side).sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i++) if (col[i]!.y - col[i - 1]!.y < LINE) col[i]!.y = col[i - 1]!.y + LINE;
    const overflow = col.length ? col[col.length - 1]!.y + 8 - HEIGHT : 0;
    if (overflow > 0) for (const it of col) it.y -= overflow;
    for (const it of col) it.y = Math.max(SIZE + 4, it.y);
  }
  for (const side of ["n", "s"] as const) {
    const row = items.filter((i) => i.side === side).sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const minGap = (row[i - 1]!.w + row[i]!.w) / 2 + 10;
      if (row[i]!.x - row[i - 1]!.x < minGap) row[i]!.x = row[i - 1]!.x + minGap;
    }
    for (const it of row) it.y = Math.max(SIZE + 4, Math.min(HEIGHT - 8, it.y));
  }
  return { items, ink };
}

/** Keep the words on the card: a long label near an edge slides inwards. */
function onCard(side: Side, x: number, w: number): number {
  if (side === "e") return Math.min(x, WIDTH - 8 - w);
  if (side === "w") return Math.max(x, 8 + w);
  return Math.max(8 + w / 2, Math.min(WIDTH - 8 - w / 2, x));
}

/** The box the words take, as Svg.text writes them (baseline at y; start, end or middle at x). */
export function labelBox(side: Side, x: number, y: number, w: number): Box {
  const left = side === "e" ? x : side === "w" ? x - w : x - w / 2;
  const l = Math.max(6, Math.min(WIDTH - 6 - w, left));
  return [l, y - SIZE * 0.82, l + w, y - SIZE * 0.82 + SIZE * 1.12];
}

function overlap(a: Box, b: Box): number {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]) + PAD * 2;
  const h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]) + PAD * 2;
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Writes one label at its own place when that is clear of every part's ink and every label already
 * written; otherwise above or below its part, a line further out each try, at the first clear place
 * (or, on a card with no clear place, the one that covers least).
 */
function writeLabel(svg: Svg, it: Item, laid: Laid, keepOut: Box[], taken: Box[]): void {
  const cost = (b: Box) => [...keepOut, ...taken].reduce((sum, o) => sum + overlap(b, o), 0);
  const onTheCard = (b: Box) => b[1] >= 2 && b[3] <= HEIGHT - 2;
  type Place = { side: Side; x: number; y: number; box: Box };
  const own: Place = (() => {
    const x = onCard(it.side, it.x, it.w);
    return { side: it.side, x, y: it.y, box: labelBox(it.side, x, it.y, it.w) };
  })();
  let best = own;
  let bestCost = cost(own.box);
  if (bestCost > 0) {
    const x = onCard("n", it.from[0], it.w);
    const [, top, , bottom] = laid.ink;
    for (let step = 0; step < 8 && bestCost > 0; step++) {
      for (const side of ["n", "s"] as const) {
        const y = side === "n" ? top - 8 - step * LINE : bottom + 8 + SIZE * 0.82 + step * LINE;
        const box = labelBox(side, x, y, it.w);
        if (!onTheCard(box)) continue;
        const c = cost(box);
        if (c < bestCost) {
          best = { side, x, y, box };
          bestCost = c;
          if (c === 0) break;
        }
      }
    }
  }
  taken.push(best.box);
  const { side, x, y } = best;
  const end: Pt = side === "e" ? [x - 4, y - SIZE * 0.3] : side === "w" ? [x + 4, y - SIZE * 0.3] : side === "n" ? [x, y + 4] : [x, y - SIZE * 0.85];
  svg.line(it.from, end, { stroke: MUTED, width: 1.2 });
  svg.circle(it.from, 2.2, { fill: INK, stroke: INK, width: 0.5 });
  svg.text(it.text, [x, y], { size: SIZE, anchor: side === "e" ? "start" : side === "w" ? "end" : "middle" });
}
