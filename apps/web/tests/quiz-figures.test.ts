/**
 * The quiz bank's figure builder (scripts/quiz-gen/figures): golden renders, the contract's refusals and
 * the PNG step. The English figure of every kind is compared with a checked-in SVG
 * (tests/golden/quiz-figures/<kind>.en.svg) so a reviewer sees a drawing change in the diff; every kind
 * in Hindi and Marathi and every diagram part in all three languages is compared by its SHA-256
 * (hashes.json), which keeps a megabyte of outlines out of git while still failing on any change.
 *
 * After an intended change to the renderer: UPDATE_GOLDEN=1 npx vitest run tests/quiz-figures.test.ts,
 * look at the new files (npm run quiz:figure -- --samples <dir> --png), and bump FIGURE_RENDER_VERSION.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
  QUIZ_DIAGRAM_PART_NAMES,
  QUIZ_DIAGRAM_PARTS,
  QUIZ_FIGURE_KINDS,
  QUIZ_FIGURE_LANGUAGES,
  diagramLabelKey,
  missingFigureLabels,
  quizFigureSpecSchema,
  type QuizFigureInput,
} from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { FigureLabelError, renderFigurePng, renderFigureSvg } from "../scripts/quiz-gen/figures/render";
import { partAnchorsMatchContract } from "../scripts/quiz-gen/figures/parts";
import { figureProblems } from "../scripts/quiz-gen/figures/check";
import { KIND_SAMPLES, LAYOUT_SAMPLES, partSample } from "../scripts/quiz-gen/figures/samples";
import { layoutDiagram, type Box } from "../scripts/quiz-gen/figures/diagram";
import { labelReader } from "../scripts/quiz-gen/figures/labels";
import { parseFigure } from "../scripts/quiz-gen/figures/render";

const GOLDEN = join(__dirname, "golden", "quiz-figures");
const UPDATE = process.env.UPDATE_GOLDEN === "1";
const hashFile = join(GOLDEN, "hashes.json");
const hashes: Record<string, string> = existsSync(hashFile) ? JSON.parse(readFileSync(hashFile, "utf8")) : {};
const seen: Record<string, string> = {};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

afterAll(() => {
  if (UPDATE) writeFileSync(hashFile, `${JSON.stringify(Object.fromEntries(Object.entries(seen).sort()), null, 2)}\n`);
});

describe("golden renders", () => {
  it("has a sample for every kind", () => {
    expect(Object.keys(KIND_SAMPLES).sort()).toEqual([...QUIZ_FIGURE_KINDS].sort());
  });

  it.each(QUIZ_FIGURE_KINDS)("draws %s in English as the checked-in SVG", (kind) => {
    const svg = renderFigureSvg(KIND_SAMPLES[kind], "en");
    const file = join(GOLDEN, `${kind}.en.svg`);
    if (UPDATE) writeFileSync(file, svg);
    expect(svg).toBe(readFileSync(file, "utf8"));
  });

  it.each(QUIZ_FIGURE_KINDS.flatMap((kind) => (["hi", "mr"] as const).map((lang) => [kind, lang] as const)))("draws %s in %s as before", (kind, lang) => {
    const svg = renderFigureSvg(KIND_SAMPLES[kind], lang);
    seen[`${kind}.${lang}`] = sha(svg);
    if (!UPDATE) expect(sha(svg)).toBe(hashes[`${kind}.${lang}`]);
  });

  it.each(QUIZ_DIAGRAM_PART_NAMES.flatMap((part) => QUIZ_FIGURE_LANGUAGES.map((lang) => [part, lang] as const)))("draws the part %s in %s as before", (part, lang) => {
    const svg = renderFigureSvg(partSample(part), lang);
    expect(svg.startsWith("<svg ")).toBe(true);
    // Words are outlines: no <text>, no font, no reference to anything outside the document.
    expect(svg).not.toMatch(/<text|font-family|href|url\((?!#plot\))/);
    seen[`part-${part}.${lang}`] = sha(svg);
    if (!UPDATE) expect(sha(svg)).toBe(hashes[`part-${part}.${lang}`]);
  });

  it("is deterministic", () => {
    expect(renderFigureSvg(KIND_SAMPLES.diagram, "mr")).toBe(renderFigureSvg(KIND_SAMPLES.diagram, "mr"));
  });

  it("writes Hindi and Marathi words, not the English ones, into the figure", () => {
    const enSvg = renderFigureSvg(partSample("plant"), "en");
    const mrSvg = renderFigureSvg(partSample("plant"), "mr");
    expect(enSvg).not.toBe(mrSvg);
  });
});

describe("the diagram library", () => {
  it("draws exactly the parts and labels the contract lists, twenty of them", () => {
    expect(QUIZ_DIAGRAM_PART_NAMES).toHaveLength(20);
    expect(partAnchorsMatchContract()).toEqual([]);
  });

  it("has every part's label in English, Hindi and Marathi", () => {
    const missing: string[] = [];
    for (const [part, anchors] of Object.entries(QUIZ_DIAGRAM_PARTS)) {
      for (const anchor of anchors) {
        const leaf = diagramLabelKey(part as keyof typeof QUIZ_DIAGRAM_PARTS, anchor).split(".")[1]!;
        for (const [code, dict] of Object.entries({ en, hi, mr })) {
          if (!(dict.quizFigure as Record<string, string>)[leaf]) missing.push(`${code}:${leaf}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("the contract refuses", () => {
  const ok = KIND_SAMPLES.geometry as Extract<QuizFigureInput, { kind: "geometry" }>;
  const refused = (f: unknown) => !quizFigureSpecSchema.safeParse(f).success;

  it("accepts every sample", () => {
    for (const f of Object.values(KIND_SAMPLES)) expect(quizFigureSpecSchema.safeParse(f).success).toBe(true);
  });
  it("an unknown kind or field, and anything that looks like SVG", () => {
    expect(refused({ ...ok, kind: "svg" })).toBe(true);
    expect(refused({ ...ok, spec: { ...ok.spec, path: "M0 0L10 10" } })).toBe(true);
    expect(refused({ ...ok, svg: "<svg/>" })).toBe(true);
  });
  it("a label with markup or an address", () => {
    expect(refused({ ...ok, labels: { hyp: { en: "<b>x</b>" } } })).toBe(true);
    expect(refused({ ...ok, labels: { hyp: { en: "see https://example.com" } } })).toBe(true);
    expect(refused({ ...ok, labels: { hyp: { en: "www.example.in" } } })).toBe(true);
  });
  it("more than forty elements", () => {
    const points = Array.from({ length: 26 }, (_, i) => ({ id: `P${i}`.slice(0, 4), x: i % 10, y: Math.floor(i / 10) }));
    const segments = Array.from({ length: 15 }, (_, i) => ({ from: points[i]!.id, to: points[i + 1]!.id }));
    expect(refused({ kind: "geometry", spec: { frame: { xMin: 0, xMax: 10, yMin: 0, yMax: 5 }, points, segments } })).toBe(true);
  });
  it("a point the frame does not show, and a segment to a point that does not exist", () => {
    expect(refused({ kind: "geometry", spec: { frame: { xMin: 0, xMax: 5, yMin: 0, yMax: 5 }, points: [{ id: "A", x: 9, y: 1 }] } })).toBe(true);
    expect(refused({ kind: "geometry", spec: { frame: { xMin: 0, xMax: 5, yMin: 0, yMax: 5 }, points: [{ id: "A", x: 1, y: 1 }], segments: [{ from: "A", to: "Z" }] } })).toBe(true);
  });
  it("a circuit part off a row or column, and a diagram label the part does not have", () => {
    expect(refused({ kind: "circuit", spec: { nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 2, y: 3 }], parts: [{ type: "cell", from: "a", to: "b" }] } })).toBe(true);
    expect(refused({ kind: "diagram", spec: { parts: [{ part: "leaf", labels: ["nucleus"] }] } })).toBe(true);
    expect(refused({ kind: "diagram", spec: { parts: [{ part: "dragon" }] } })).toBe(true);
  });
  it("a series that does not match its categories, and a pie with one value too few", () => {
    expect(refused({ kind: "bar", spec: { categories: ["1", "2"], series: [{ values: [1] }] } })).toBe(true);
    expect(refused({ kind: "pie", spec: { categories: ["1", "2", "3"], values: [1, 2] } })).toBe(true);
  });
});

describe("the renderer refuses", () => {
  it("a label with no text in the language asked for, naming it", () => {
    const f = { ...KIND_SAMPLES.geometry, labels: { hyp: { en: "hypotenuse" }, theta: { en: "θ", hi: "θ", mr: "θ" } } };
    expect(missingFigureLabels(quizFigureSpecSchema.parse(f), "mr")).toEqual(["hyp"]);
    expect(() => renderFigureSvg(f, "mr")).toThrow(FigureLabelError);
    expect(() => renderFigureSvg(f, "en")).not.toThrow();
  });
  it("a character no bundled face draws, rather than a blank box", () => {
    const f = { kind: "pie", spec: { categories: ["a1", "b1"], values: [1, 1] }, labels: { a1: { en: "∠ABC" }, b1: { en: "B" } } };
    expect(() => renderFigureSvg(f, "en")).toThrow(/no bundled font draws "∠"/);
  });
  it("a spec the contract refuses, with the path", () => {
    expect(() => renderFigureSvg({ kind: "pie", spec: { categories: ["1"], values: [1] } }, "en")).toThrow(/figure spec refused: spec/);
  });
});

describe("the PNG", () => {
  it("is a 1280 × 800 PNG with something drawn on it", async () => {
    const png = await renderFigurePng(renderFigureSvg(KIND_SAMPLES.circuit, "hi"));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const meta = await sharp(png).metadata();
    expect([meta.width, meta.height]).toEqual([1280, 800]);
    const stats = await sharp(png).stats();
    // Mostly white card, but not blank: some channel goes dark.
    expect(stats.channels[0]!.min).toBeLessThan(80);
  });
});

describe("the verifier's check (scripts/verify-quiz.ts)", () => {
  const good = { figure: KIND_SAMPLES.bar, imageAlt: "Pupils present on five days.", translations: { hi: { imageAlt: "पाँच दिनों की उपस्थिति।" }, mr: { imageAlt: "पाच दिवसांची उपस्थिती." } } };
  it("passes an item it can draw in every language it is read in", () => {
    expect(figureProblems(good)).toEqual([]);
    expect(figureProblems({ imageAlt: "x" })).toEqual([]);
  });
  it("names what is wrong: a refused spec, a missing translation's words, a language it cannot draw", () => {
    expect(figureProblems({ ...good, figure: { kind: "bar", spec: {} } })[0]).toMatch(/figure spec refused/);
    expect(figureProblems({ ...good, translations: { ...good.translations, mr: {} } })).toEqual(["has a figure but its mr translation has no imageAlt"]);
    const noMarathi = { ...KIND_SAMPLES.bar, labels: { ...KIND_SAMPLES.bar.labels, day: { en: "Day", hi: "दिन" } } };
    expect(figureProblems({ ...good, figure: noMarathi })).toEqual(["figure cannot be drawn in mr: no mr text for label day"]);
    expect(figureProblems({ ...good, imageKey: "x.png" })[0]).toMatch(/both an imageKey and a figure/);
  });
});

/**
 * The diagram's layout rule (integration, 11 Oct 2026): no label is written over a part, its own or
 * another's, or over another label. Two magnets side by side once wrote the left one's south label
 * beside the right one's north label, and a label slid back from the card's edge onto its own magnet.
 */
describe("a diagram's labels", () => {
  const area = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const layouts = Object.keys(LAYOUT_SAMPLES).flatMap((name) => QUIZ_FIGURE_LANGUAGES.map((lang) => [name, lang] as const));

  it.each(layouts)("%s in %s: no label over a part or another label", (name, lang) => {
    const figure = parseFigure(LAYOUT_SAMPLES[name]);
    if (figure.kind !== "diagram") throw new Error("a layout sample is a diagram");
    const laid = layoutDiagram(figure, labelReader(figure, lang));
    expect(laid.labels).toHaveLength(figure.spec.parts.reduce((n, p) => n + p.labels.length, 0));
    for (const [i, label] of laid.labels.entries()) {
      for (const ink of laid.inks) expect(area(label, ink), `label ${i} over a part`).toBe(0);
      for (const [j, other] of laid.labels.entries()) if (j !== i) expect(area(label, other), `label ${i} over label ${j}`).toBe(0);
      expect(label[0]).toBeGreaterThanOrEqual(0);
      expect(label[2]).toBeLessThanOrEqual(640);
    }
  });

  it.each(Object.keys(LAYOUT_SAMPLES))("draws %s in English as the checked-in SVG", (name) => {
    const svg = renderFigureSvg(LAYOUT_SAMPLES[name], "en");
    const file = join(GOLDEN, `layout-${name}.en.svg`);
    if (UPDATE) writeFileSync(file, svg);
    expect(svg).toBe(readFileSync(file, "utf8"));
  });
});
