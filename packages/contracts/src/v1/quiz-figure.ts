/**
 * The quiz bank's figure spec (docs/plans/assistant-and-quiz-bank.md, Phase 1 "the image field" and
 * section 8 item 1, the owner's decision of 10 October 2026): the bank's figures are NOT cropped from
 * the books, whose drawings are the boards' copyright. The generator's model writes a small spec;
 * a deterministic renderer (apps/web/scripts/quiz-gen/figures/render.ts) draws it as SVG and PNG;
 * the importer stores the PNG per language and points the question at it.
 *
 * On a generated item: `figure: { kind, spec, labels }` beside `imageAlt`, and `needsFigure: true`.
 *
 * STRICT AND BOUNDED, on purpose. The spec is model output: every object is `.strict()` (an unknown
 * field is refused, not ignored), every array is capped, a figure has at most
 * QUIZ_FIGURE_MAX_ELEMENTS drawn elements, every number is finite and inside a stated range, and there
 * is no free SVG, no path data, no colour, no URL and no HTML anywhere — the renderer draws only from
 * its own library of shapes.
 *
 * LABELS ARE KEYS. An element names what it shows by a key; `labels` gives the key's text in each
 * language ({ en, hi, mr }), so one spec serves the English, Hindi and Marathi rows of the same item.
 * A key that is a point's name ("A", "B'", "P1", a single letter "x") or a number shows as itself in
 * every language and needs no entry. A diagram part's own labels ("principal axis", "nucleus") come
 * from the dictionaries (namespace `quizFigure`), not from the spec. A key the item uses must have
 * text in every language the item is rendered in; the renderer refuses otherwise.
 */
import { z } from "zod";

export const QUIZ_FIGURE_KINDS = ["geometry", "graph", "numberline", "bar", "pie", "circuit", "diagram"] as const;
export type QuizFigureKind = (typeof QUIZ_FIGURE_KINDS)[number];

/** The most drawn elements (points, segments, curves, bars, parts, arrows, texts…) one figure may hold. */
export const QUIZ_FIGURE_MAX_ELEMENTS = 40;

/** The languages a figure is rendered in: the bank's three. */
export const QUIZ_FIGURE_LANGUAGES = ["en", "hi", "mr"] as const;
export type QuizFigureLanguage = (typeof QUIZ_FIGURE_LANGUAGES)[number];

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

/** A label key: a short identifier, or a literal (see isLiteralFigureLabel). */
export const quizFigureLabelKeySchema = z
  .string()
  .regex(/^(?:[A-Za-z][A-Za-z0-9_']{0,23}|-?\d{1,6}(?:\.\d{1,3})?)$/, "label key: letters, digits, _ and ', or a number");

/**
 * A key that shows as itself in every language: a capital with an optional digit and primes (a point:
 * A, B', P1, O), one lower-case letter (a variable: x, r), or a number. Everything else is looked up.
 */
export function isLiteralFigureLabel(key: string): boolean {
  return /^[A-Z][0-9]?'{0,2}$/.test(key) || /^[a-z]$/.test(key) || /^-?\d{1,6}(?:\.\d{1,3})?$/.test(key);
}

/** The text a label shows: short, one line, no markup and no address. */
const labelText = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine((s) => !/[<>&"\u0000-\u001f]/.test(s), "no markup in a label")
  .refine((s) => !/(?:https?:|www\.|\.com\b|\.in\b)/i.test(s), "no address in a label");

export const quizFigureLabelTextSchema = z
  .object({ en: labelText, hi: labelText.optional(), mr: labelText.optional() })
  .strict();

const labelsSchema = z
  .record(quizFigureLabelKeySchema, quizFigureLabelTextSchema)
  .refine((r) => Object.keys(r).length <= 60, "at most 60 labels");

/** Where a label sits against the thing it names (compass points); "auto" lets the renderer choose. */
export const QUIZ_FIGURE_PLACES = ["auto", "n", "ne", "e", "se", "s", "sw", "w", "nw", "c"] as const;
const place = z.enum(QUIZ_FIGURE_PLACES);

/** A measure written beside a segment or an angle; the unit is printed in the item's language. */
export const QUIZ_FIGURE_UNITS = ["cm", "mm", "m", "km", "deg", "units"] as const;
const measure = z
  .object({ value: z.number().finite().min(-100000).max(100000), unit: z.enum(QUIZ_FIGURE_UNITS) })
  .strict();

const coord = z.number().finite().min(-1000).max(1000);
const xy = z.tuple([coord, coord]);

/* -------------------------------------------------------------------------- */
/* geometry                                                                   */
/* -------------------------------------------------------------------------- */

const pointId = z.string().regex(/^[A-Za-z][A-Za-z0-9']{0,3}$/, "point id: a letter, then up to three letters, digits or primes");

const geometrySpec = z
  .object({
    /** The window onto the plane, in the frame's units. */
    frame: z
      .object({ xMin: coord, xMax: coord, yMin: coord, yMax: coord, unit: z.enum(["cm", "units"]).default("units") })
      .strict()
      .refine((f) => f.xMax > f.xMin && f.yMax > f.yMin, "max must exceed min")
      .refine((f) => f.xMax - f.xMin <= 200 && f.yMax - f.yMin <= 200, "a frame spans at most 200 units"),
    grid: z.boolean().default(false),
    axes: z.boolean().default(false),
    points: z
      .array(
        z
          .object({
            id: pointId,
            x: coord,
            y: coord,
            /** What the point is called on the figure; its id when left out, nothing when null. */
            label: quizFigureLabelKeySchema.nullable().optional(),
            place: place.default("auto"),
            dot: z.boolean().default(true),
          })
          .strict(),
      )
      .max(26)
      .default([]),
    segments: z
      .array(
        z
          .object({
            from: pointId,
            to: pointId,
            kind: z.enum(["segment", "ray", "line"]).default("segment"),
            dashed: z.boolean().default(false),
            /** Written at the middle: a measure, or a key. */
            length: measure.optional(),
            label: quizFigureLabelKeySchema.optional(),
            /** Equal-length marks: 1 to 3 ticks across the middle. */
            ticks: z.number().int().min(0).max(3).default(0),
            /** Parallel marks: 1 to 2 arrowheads at the middle. */
            arrows: z.number().int().min(0).max(2).default(0),
          })
          .strict(),
      )
      .max(30)
      .default([]),
    polygons: z
      .array(z.object({ vertices: z.array(pointId).min(3).max(8), shade: z.boolean().default(false), dashed: z.boolean().default(false) }).strict())
      .max(6)
      .default([]),
    circles: z
      .array(
        z
          .object({ center: pointId, radius: z.number().finite().positive().max(200), dashed: z.boolean().default(false), shade: z.boolean().default(false) })
          .strict(),
      )
      .max(6)
      .default([]),
    arcs: z
      .array(
        z
          .object({
            center: pointId,
            radius: z.number().finite().positive().max(200),
            /** Degrees, counter-clockwise from the positive x direction. */
            from: z.number().finite().min(-360).max(720),
            to: z.number().finite().min(-360).max(720),
            dashed: z.boolean().default(false),
            /** Close the arc to its centre (a sector). */
            sector: z.boolean().default(false),
            shade: z.boolean().default(false),
          })
          .strict(),
      )
      .max(6)
      .default([]),
    angles: z
      .array(
        z
          .object({
            /** The angle from→vertex→to, measured counter-clockwise from `from` to `to`. */
            vertex: pointId,
            from: pointId,
            to: pointId,
            mark: z.enum(["arc", "right"]).default("arc"),
            arcs: z.number().int().min(1).max(3).default(1),
            label: quizFigureLabelKeySchema.optional(),
            measure: z.number().finite().min(0).max(360).optional(),
          })
          .strict(),
      )
      .max(12)
      .default([]),
    texts: z.array(z.object({ x: coord, y: coord, label: quizFigureLabelKeySchema }).strict()).max(10).default([]),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const ids = new Set<string>();
    for (const p of spec.points) {
      if (ids.has(p.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `point ${p.id} twice`, path: ["points"] });
      ids.add(p.id);
      if (p.x < spec.frame.xMin || p.x > spec.frame.xMax || p.y < spec.frame.yMin || p.y > spec.frame.yMax) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `point ${p.id} lies outside the frame`, path: ["points"] });
      }
    }
    const need = (id: string, where: string) => {
      if (!ids.has(id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${where} names point ${id}, which is not defined`, path: [where] });
    };
    for (const s of spec.segments) {
      need(s.from, "segments");
      need(s.to, "segments");
      if (s.from === s.to) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a segment joins two different points", path: ["segments"] });
    }
    for (const p of spec.polygons) p.vertices.forEach((v) => need(v, "polygons"));
    for (const c of spec.circles) need(c.center, "circles");
    for (const a of spec.arcs) need(a.center, "arcs");
    for (const a of spec.angles) {
      need(a.vertex, "angles");
      need(a.from, "angles");
      need(a.to, "angles");
    }
    const n = spec.points.length + spec.segments.length + spec.polygons.length + spec.circles.length + spec.arcs.length + spec.angles.length + spec.texts.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} elements; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

/* -------------------------------------------------------------------------- */
/* graph                                                                      */
/* -------------------------------------------------------------------------- */

const axis = z
  .object({ min: coord, max: coord, step: z.number().finite().positive(), label: quizFigureLabelKeySchema.optional() })
  .strict()
  .refine((a) => a.max > a.min, "max must exceed min")
  .refine((a) => (a.max - a.min) / a.step <= 40, "at most 40 ticks on an axis");

const graphSpec = z
  .object({
    x: axis,
    y: axis,
    grid: z.boolean().default(true),
    curves: z
      .array(
        z
          .object({
            /** Coefficients a0, a1, … a4 of a0 + a1·x + a2·x² + …; or `points`, joined in order. */
            poly: z.array(z.number().finite().min(-10000).max(10000)).min(1).max(5).optional(),
            points: z.array(xy).min(2).max(40).optional(),
            /** The x range drawn; the axis's when left out. */
            from: coord.optional(),
            to: coord.optional(),
            dashed: z.boolean().default(false),
            label: quizFigureLabelKeySchema.optional(),
          })
          .strict()
          .refine((c) => Boolean(c.poly) !== Boolean(c.points), "a curve is either poly or points"),
      )
      .max(6)
      .default([]),
    /** Straight lines through two points, drawn across the whole window. */
    lines: z
      .array(z.object({ through: z.tuple([xy, xy]), dashed: z.boolean().default(false), label: quizFigureLabelKeySchema.optional() }).strict())
      .max(6)
      .default([]),
    /** Shaded polygons (a feasible region, an area). */
    regions: z.array(z.object({ vertices: z.array(xy).min(3).max(12), label: quizFigureLabelKeySchema.optional() }).strict()).max(4).default([]),
    points: z
      .array(z.object({ x: coord, y: coord, label: quizFigureLabelKeySchema.optional(), place: place.default("auto"), open: z.boolean().default(false) }).strict())
      .max(20)
      .default([]),
  })
  .strict()
  .superRefine((spec, ctx) => {
    for (const l of spec.lines) {
      if (l.through[0][0] === l.through[1][0] && l.through[0][1] === l.through[1][1]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a line needs two different points", path: ["lines"] });
      }
    }
    const n = spec.curves.length + spec.lines.length + spec.regions.length + spec.points.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} elements; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

/* -------------------------------------------------------------------------- */
/* numberline                                                                 */
/* -------------------------------------------------------------------------- */

const numberlineSpec = z
  .object({
    min: coord,
    max: coord,
    step: z.number().finite().positive(),
    /** Write the number at every n-th tick. */
    labelEvery: z.number().int().min(1).max(10).default(1),
    /** Unlabelled small ticks between two big ones (fractions: 4 makes fifths). */
    minor: z.number().int().min(0).max(9).default(0),
    points: z
      .array(z.object({ value: coord, label: quizFigureLabelKeySchema.optional(), open: z.boolean().default(false) }).strict())
      .max(12)
      .default([]),
    intervals: z
      .array(
        z
          .object({
            from: coord.nullable(),
            to: coord.nullable(),
            closedFrom: z.boolean().default(true),
            closedTo: z.boolean().default(true),
          })
          .strict()
          .refine((i) => i.from !== null || i.to !== null, "an interval has at least one end"),
      )
      .max(4)
      .default([]),
    /** Hops drawn as arcs above the line (6 + 3 as a jump of 3 from 6). */
    jumps: z.array(z.object({ from: coord, to: coord, label: quizFigureLabelKeySchema.optional() }).strict()).max(10).default([]),
  })
  .strict()
  .refine((s) => s.max > s.min, "max must exceed min")
  .refine((s) => (s.max - s.min) / s.step <= 40, "at most 40 ticks")
  .superRefine((s, ctx) => {
    const inside = (v: number) => v >= s.min && v <= s.max;
    for (const p of s.points) if (!inside(p.value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `point ${p.value} is off the line`, path: ["points"] });
    for (const j of s.jumps) if (!inside(j.from) || !inside(j.to)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a jump is off the line", path: ["jumps"] });
    const n = s.points.length + s.intervals.length + s.jumps.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} elements; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

/* -------------------------------------------------------------------------- */
/* bar and pie                                                                */
/* -------------------------------------------------------------------------- */

const barSpec = z
  .object({
    title: quizFigureLabelKeySchema.optional(),
    xLabel: quizFigureLabelKeySchema.optional(),
    yLabel: quizFigureLabelKeySchema.optional(),
    categories: z.array(quizFigureLabelKeySchema).min(1).max(12),
    series: z
      .array(z.object({ name: quizFigureLabelKeySchema.optional(), values: z.array(z.number().finite().min(0).max(1e9)).min(1).max(12) }).strict())
      .min(1)
      .max(3),
    /** The top of the value axis and its step; the renderer picks round ones when left out. */
    yMax: z.number().finite().positive().max(1e9).optional(),
    yStep: z.number().finite().positive().max(1e9).optional(),
    /** Write each bar's value above it. */
    showValues: z.boolean().default(false),
  })
  .strict()
  .superRefine((s, ctx) => {
    for (const series of s.series) {
      if (series.values.length !== s.categories.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a series has one value per category", path: ["series"] });
    }
    if (s.yMax !== undefined && s.yStep !== undefined && s.yMax / s.yStep > 40) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "at most 40 ticks", path: ["yStep"] });
    const n = s.categories.length * s.series.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} bars; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

const pieSpec = z
  .object({
    title: quizFigureLabelKeySchema.optional(),
    categories: z.array(quizFigureLabelKeySchema).min(2).max(10),
    values: z.array(z.number().finite().positive().max(1e9)).min(2).max(10),
    /** What each slice says beside its name. */
    show: z.enum(["percent", "value", "none"]).default("percent"),
  })
  .strict()
  .refine((s) => s.values.length === s.categories.length, "one value per category");

/* -------------------------------------------------------------------------- */
/* circuit                                                                    */
/* -------------------------------------------------------------------------- */

export const QUIZ_CIRCUIT_PARTS = [
  "wire",
  "cell",
  "battery",
  "resistor",
  "rheostat",
  "bulb",
  "switchOpen",
  "switchClosed",
  "ammeter",
  "voltmeter",
  "galvanometer",
  "fuse",
] as const;

const nodeId = z.string().regex(/^[A-Za-z0-9]{1,6}$/, "node id: up to six letters or digits");

const circuitSpec = z
  .object({
    /** Junctions on a 12 × 8 grid. */
    nodes: z.array(z.object({ id: nodeId, x: z.number().int().min(0).max(12), y: z.number().int().min(0).max(8), label: quizFigureLabelKeySchema.optional() }).strict()).min(2).max(20),
    /** Each part sits on the straight run between two nodes in the same row or column. */
    parts: z
      .array(
        z
          .object({
            type: z.enum(QUIZ_CIRCUIT_PARTS),
            from: nodeId,
            to: nodeId,
            label: quizFigureLabelKeySchema.optional(),
            value: z.object({ value: z.number().finite().min(0).max(1e6), unit: z.enum(["V", "A", "ohm", "W"]) }).strict().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((s, ctx) => {
    const nodes = new Map<string, { x: number; y: number }>();
    for (const n of s.nodes) {
      if (nodes.has(n.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `node ${n.id} twice`, path: ["nodes"] });
      nodes.set(n.id, n);
    }
    for (const p of s.parts) {
      const a = nodes.get(p.from);
      const b = nodes.get(p.to);
      if (!a || !b) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `a ${p.type} names a node that is not defined`, path: ["parts"] });
        continue;
      }
      if (a.x === b.x && a.y === b.y) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `a ${p.type} joins two different places`, path: ["parts"] });
      else if (a.x !== b.x && a.y !== b.y) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `a ${p.type} runs along a row or a column`, path: ["parts"] });
    }
    const n = s.nodes.length + s.parts.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} elements; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

/* -------------------------------------------------------------------------- */
/* diagram: a labelled schematic from a fixed library of parts                */
/* -------------------------------------------------------------------------- */

/**
 * The twenty parts, and the labels each can show. Chosen from the figure captions of the class 6 to 10
 * science and mathematics books in the corpus (NCERT and Balbharati, 3,931 captions: earth/sun/moon,
 * plant, cell, mirror, magnet and compass, leaf, circuit, flower, the lamp, digestion, the eye,
 * the pendulum, the water cycle) and the plan's own list. A part's labels are dictionary keys
 * `quizFigure.<part><Anchor>` in en, hi and mr; an item may replace a shown label's text by a key.
 */
export const QUIZ_DIAGRAM_PARTS = {
  beaker: ["beaker", "liquid"],
  spiritLamp: ["lamp", "wick", "flame"],
  planeMirror: ["mirror", "incidentRay", "reflectedRay", "normal"],
  concaveMirror: ["mirror", "principalAxis", "focus", "centre", "pole"],
  convexLens: ["lens", "principalAxis", "focus", "opticalCentre"],
  prism: ["prism", "whiteLight", "spectrum", "red", "violet"],
  barMagnet: ["north", "south", "fieldLine"],
  compass: ["needle", "dial"],
  dryCell: ["positive", "negative", "cell"],
  plantCell: ["cellWall", "membrane", "nucleus", "vacuole", "chloroplast", "cytoplasm"],
  animalCell: ["membrane", "nucleus", "cytoplasm", "mitochondrion"],
  leaf: ["lamina", "midrib", "vein", "petiole"],
  flower: ["petal", "sepal", "stamen", "pistil"],
  plant: ["root", "stem", "leaf", "flower"],
  waterCycle: ["sun", "evaporation", "condensation", "precipitation", "water"],
  digestiveTract: ["mouth", "oesophagus", "stomach", "liver", "smallIntestine", "largeIntestine"],
  eye: ["cornea", "iris", "lens", "retina", "opticNerve"],
  pendulum: ["support", "string", "bob", "meanPosition"],
  sunEarthMoon: ["sun", "earth", "moon", "orbit"],
  lever: ["fulcrum", "effort", "load"],
} as const satisfies Record<string, readonly string[]>;

export type QuizDiagramPart = keyof typeof QUIZ_DIAGRAM_PARTS;
export const QUIZ_DIAGRAM_PART_NAMES = Object.keys(QUIZ_DIAGRAM_PARTS) as [QuizDiagramPart, ...QuizDiagramPart[]];

/** The dictionary key of a part's built-in label: `quizFigure.convexLensPrincipalAxis`. */
export function diagramLabelKey(part: QuizDiagramPart, anchor: string): string {
  return `quizFigure.${part}${anchor.charAt(0).toUpperCase()}${anchor.slice(1)}`;
}

const diagramSpec = z
  .object({
    /** The canvas is 100 wide and 62.5 high; a part is placed by its centre. */
    parts: z
      .array(
        z
          .object({
            part: z.enum(QUIZ_DIAGRAM_PART_NAMES),
            x: z.number().finite().min(0).max(100).default(50),
            y: z.number().finite().min(0).max(62.5).default(31),
            /** The part's width on the canvas, 10 to 70. */
            size: z.number().finite().min(10).max(70).default(40),
            /** Which of the part's own labels to show; none when left out. */
            labels: z.array(z.string().max(24)).max(8).default([]),
            /** A shown label's text replaced by an item key (a letter to name, a word the exercise asks for). */
            text: z.record(z.string().max(24), quizFigureLabelKeySchema).default({}),
            /** Drawn mirrored left to right. */
            flip: z.boolean().default(false),
          })
          .strict(),
      )
      .min(1)
      .max(6),
    arrows: z
      .array(z.object({ from: z.tuple([z.number().min(0).max(100), z.number().min(0).max(62.5)]), to: z.tuple([z.number().min(0).max(100), z.number().min(0).max(62.5)]), label: quizFigureLabelKeySchema.optional(), curved: z.boolean().default(false) }).strict())
      .max(10)
      .default([]),
    texts: z.array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(62.5), label: quizFigureLabelKeySchema }).strict()).max(10).default([]),
  })
  .strict()
  .superRefine((s, ctx) => {
    for (const p of s.parts) {
      const anchors = QUIZ_DIAGRAM_PARTS[p.part] as readonly string[];
      for (const a of [...p.labels, ...Object.keys(p.text)]) {
        if (!anchors.includes(a)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${p.part} has no label "${a}" (it has ${anchors.join(", ")})`, path: ["parts"] });
      }
    }
    const n = s.parts.reduce((sum, p) => sum + 1 + p.labels.length, 0) + s.arrows.length + s.texts.length;
    if (n > QUIZ_FIGURE_MAX_ELEMENTS) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${n} elements; at most ${QUIZ_FIGURE_MAX_ELEMENTS}` });
  });

/* -------------------------------------------------------------------------- */
/* The figure                                                                 */
/* -------------------------------------------------------------------------- */

const figure = <K extends QuizFigureKind, S extends z.ZodTypeAny>(kind: K, spec: S) =>
  z.object({ kind: z.literal(kind), spec, labels: labelsSchema.default({}) }).strict();

/** `figure` on a quiz item. The generator reads it from here (scripts/quiz-gen). */
export const quizFigureSpecSchema = z.discriminatedUnion("kind", [
  figure("geometry", geometrySpec),
  figure("graph", graphSpec),
  figure("numberline", numberlineSpec),
  figure("bar", barSpec),
  figure("pie", pieSpec),
  figure("circuit", circuitSpec),
  figure("diagram", diagramSpec),
]);
/** A figure as written (defaults optional). */
export type QuizFigureInput = z.input<typeof quizFigureSpecSchema>;
/** A figure as parsed (defaults filled). */
export type QuizFigure = z.output<typeof quizFigureSpecSchema>;
export type QuizFigureOf<K extends QuizFigureKind> = Extract<QuizFigure, { kind: K }>;

/** Every label key a figure's elements name, in drawing order (diagram parts' own labels excluded). */
export function figureLabelKeys(f: QuizFigure): string[] {
  const keys: string[] = [];
  const add = (k: string | null | undefined) => {
    if (k) keys.push(k);
  };
  switch (f.kind) {
    case "geometry":
      for (const p of f.spec.points) add(p.label === undefined ? p.id : p.label);
      for (const s of f.spec.segments) add(s.label);
      for (const a of f.spec.angles) add(a.label);
      for (const t of f.spec.texts) add(t.label);
      break;
    case "graph":
      add(f.spec.x.label);
      add(f.spec.y.label);
      for (const c of f.spec.curves) add(c.label);
      for (const l of f.spec.lines) add(l.label);
      for (const r of f.spec.regions) add(r.label);
      for (const p of f.spec.points) add(p.label);
      break;
    case "numberline":
      for (const p of f.spec.points) add(p.label);
      for (const j of f.spec.jumps) add(j.label);
      break;
    case "bar":
      add(f.spec.title);
      add(f.spec.xLabel);
      add(f.spec.yLabel);
      f.spec.categories.forEach(add);
      for (const s of f.spec.series) add(s.name);
      break;
    case "pie":
      add(f.spec.title);
      f.spec.categories.forEach(add);
      break;
    case "circuit":
      for (const n of f.spec.nodes) add(n.label);
      for (const p of f.spec.parts) add(p.label);
      break;
    case "diagram":
      for (const p of f.spec.parts) Object.values(p.text).forEach(add);
      for (const a of f.spec.arrows) add(a.label);
      for (const t of f.spec.texts) add(t.label);
      break;
  }
  return keys;
}

/**
 * The keys a figure cannot show in `language`: neither a literal nor given text in that language.
 * Empty means the figure can be drawn in that language. The verifier and the renderer both ask this.
 */
export function missingFigureLabels(f: QuizFigure, language: QuizFigureLanguage): string[] {
  const missing = new Set<string>();
  for (const key of figureLabelKeys(f)) {
    if (isLiteralFigureLabel(key)) continue;
    if (!f.labels[key]?.[language]) missing.add(key);
  }
  return [...missing];
}
