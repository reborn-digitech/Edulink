/** Where a label goes against the point it names: a compass direction, chosen or given. */
import type { Pt, Svg } from "./svg";
import type { TextAnchor } from "./font";

export type Dir = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "c";

const VEC: Record<Dir, Pt> = {
  n: [0, -1],
  ne: [0.71, -0.71],
  e: [1, 0],
  se: [0.71, 0.71],
  s: [0, 1],
  sw: [-0.71, 0.71],
  w: [-1, 0],
  nw: [-0.71, -0.71],
  c: [0, 0],
};

/** The compass direction nearest to a vector given in SVG space (y down). */
export function dirOf(v: Pt): Dir {
  if (Math.hypot(v[0], v[1]) < 1e-9) return "ne";
  const deg = (Math.atan2(-v[1], v[0]) * 180) / Math.PI; // paper angle, counter-clockwise
  const names: Dir[] = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  const i = Math.round(((deg + 360) % 360) / 45) % 8;
  return names[i]!;
}

/** Draws `str` beside `at` in direction `dir`, `gap` pixels away. */
export function placeLabel(svg: Svg, str: string, at: Pt, dir: Dir, opts: { size?: number; gap?: number; colour?: string } = {}): void {
  const size = opts.size ?? 20;
  const gap = opts.gap ?? 10;
  const v = VEC[dir];
  const anchor: TextAnchor = v[0] > 0.3 ? "start" : v[0] < -0.3 ? "end" : "middle";
  const x = at[0] + v[0] * gap;
  // Baseline: above the point for north, below for south, centred on the point's height otherwise.
  const y = v[1] < -0.3 ? at[1] + v[1] * gap : v[1] > 0.3 ? at[1] + v[1] * gap + size * 0.72 : at[1] + size * 0.33;
  svg.text(str, [x, y], { size, anchor, colour: opts.colour });
}
