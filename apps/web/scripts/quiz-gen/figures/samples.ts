/**
 * One figure per kind, and each diagram part alone with all its labels: the golden tests' inputs and
 * what `npm run quiz:figure -- --samples <dir>` draws for a hand check. Written as a generator would
 * write them, with every non-literal label in English, Hindi and Marathi.
 */
import { QUIZ_DIAGRAM_PARTS, type QuizDiagramPart, type QuizFigureInput, type QuizFigureKind } from "@edulink/contracts";

export const KIND_SAMPLES: Record<QuizFigureKind, QuizFigureInput> = {
  geometry: {
    kind: "geometry",
    spec: {
      frame: { xMin: 0, xMax: 10, yMin: 0, yMax: 7, unit: "cm" },
      points: [
        { id: "A", x: 1, y: 1 },
        { id: "B", x: 9, y: 1 },
        { id: "C", x: 1, y: 6 },
        { id: "D", x: 4, y: 1, place: "ne" },
      ],
      segments: [
        { from: "A", to: "B", length: { value: 8, unit: "cm" } },
        { from: "A", to: "C", length: { value: 5, unit: "cm" } },
        { from: "B", to: "C", label: "hyp" },
        { from: "C", to: "D", dashed: true },
      ],
      angles: [
        { vertex: "A", from: "B", to: "C", mark: "right" },
        { vertex: "B", from: "C", to: "A", label: "theta" },
      ],
      polygons: [{ vertices: ["A", "D", "C"], shade: true }],
    },
    labels: {
      hyp: { en: "hypotenuse", hi: "कर्ण", mr: "कर्ण" },
      theta: { en: "θ", hi: "θ", mr: "θ" },
    },
  },
  graph: {
    kind: "graph",
    spec: {
      x: { min: -4, max: 4, step: 1, label: "x" },
      y: { min: -2, max: 10, step: 2, label: "y" },
      curves: [{ poly: [1, 0, 0.5], label: "curve" }],
      lines: [{ through: [[0, 2], [2, 6]], dashed: true, label: "line" }],
      regions: [{ vertices: [[0, 0], [2, 0], [2, 3], [0, 1]] }],
      points: [
        { x: 2, y: 3, label: "P" },
        { x: 0, y: 1, label: "Q", place: "w", open: true },
      ],
    },
    labels: {
      curve: { en: "y = 1 + x²/2", hi: "y = 1 + x²/2", mr: "y = 1 + x²/2" },
      line: { en: "y = 2x + 2", hi: "y = 2x + 2", mr: "y = 2x + 2" },
    },
  },
  numberline: {
    kind: "numberline",
    spec: {
      min: -5,
      max: 5,
      step: 1,
      minor: 1,
      points: [
        { value: -3, label: "P" },
        { value: 2.5, label: "Q", open: true },
      ],
      intervals: [{ from: 1, to: null, closedFrom: false }],
      jumps: [
        { from: -2, to: 1, label: "plus3" },
        { from: 1, to: 4, label: "plus3" },
      ],
    },
    labels: { plus3: { en: "+3", hi: "+3", mr: "+3" } },
  },
  bar: {
    kind: "bar",
    spec: {
      title: "title",
      xLabel: "day",
      yLabel: "pupils",
      categories: ["mon", "tue", "wed", "thu", "fri"],
      series: [
        { name: "boys", values: [12, 15, 9, 14, 11] },
        { name: "girls", values: [14, 13, 12, 16, 15] },
      ],
      showValues: true,
    },
    labels: {
      title: { en: "Pupils present", hi: "उपस्थित विद्यार्थी", mr: "उपस्थित विद्यार्थी" },
      day: { en: "Day", hi: "दिन", mr: "दिवस" },
      pupils: { en: "Pupils", hi: "विद्यार्थी", mr: "विद्यार्थी" },
      mon: { en: "Mon", hi: "सोम", mr: "सोम" },
      tue: { en: "Tue", hi: "मंगल", mr: "मंगळ" },
      wed: { en: "Wed", hi: "बुध", mr: "बुध" },
      thu: { en: "Thu", hi: "गुरु", mr: "गुरु" },
      fri: { en: "Fri", hi: "शुक्र", mr: "शुक्र" },
      boys: { en: "Boys", hi: "लड़के", mr: "मुलगे" },
      girls: { en: "Girls", hi: "लड़कियाँ", mr: "मुली" },
    },
  },
  pie: {
    kind: "pie",
    spec: {
      title: "title",
      categories: ["rice", "wheat", "pulses", "other"],
      values: [45, 30, 15, 10],
      show: "percent",
    },
    labels: {
      title: { en: "Crops sown in a village", hi: "एक गाँव में बोई गई फसलें", mr: "एका गावात पेरलेली पिके" },
      rice: { en: "Rice", hi: "चावल", mr: "तांदूळ" },
      wheat: { en: "Wheat", hi: "गेहूँ", mr: "गहू" },
      pulses: { en: "Pulses", hi: "दालें", mr: "डाळी" },
      other: { en: "Other", hi: "अन्य", mr: "इतर" },
    },
  },
  circuit: {
    kind: "circuit",
    spec: {
      nodes: [
        { id: "a", x: 1, y: 1 },
        { id: "b", x: 6, y: 1 },
        { id: "c", x: 11, y: 1 },
        { id: "d", x: 11, y: 7 },
        { id: "e", x: 6, y: 7 },
        { id: "f", x: 1, y: 7 },
        { id: "g", x: 6, y: 4 },
        { id: "h", x: 11, y: 4 },
      ],
      parts: [
        { type: "battery", from: "a", to: "b", value: { value: 6, unit: "V" } },
        { type: "switchClosed", from: "b", to: "c", label: "K" },
        { type: "resistor", from: "c", to: "h", label: "R", value: { value: 4, unit: "ohm" } },
        { type: "wire", from: "h", to: "d" },
        { type: "ammeter", from: "d", to: "e" },
        { type: "bulb", from: "e", to: "f" },
        { type: "wire", from: "f", to: "a" },
        { type: "voltmeter", from: "g", to: "h" },
        { type: "wire", from: "g", to: "e" },
      ],
    },
    labels: {},
  },
  diagram: {
    kind: "diagram",
    spec: {
      parts: [
        { part: "convexLens", x: 50, y: 31, size: 46, labels: ["lens", "principalAxis", "focus", "opticalCentre"] },
      ],
      texts: [{ x: 18, y: 8, label: "F1" }],
    },
    labels: {},
  },
};

/** One part alone, centred, every label shown. */
export function partSample(part: QuizDiagramPart): QuizFigureInput {
  return {
    kind: "diagram",
    spec: { parts: [{ part, x: 50, y: 31.25, size: 44, labels: [...QUIZ_DIAGRAM_PARTS[part]] }] },
    labels: {},
  };
}

/**
 * Diagrams of two parts side by side, as the generator drew them on 10 October 2026: the labels each part
 * would write as if alone fall on the other part or on its own (a label slid back from the card's edge).
 * The layout rule in diagram.ts keeps every label clear; tests/quiz-figures.test.ts holds it.
 */
export const LAYOUT_SAMPLES: Record<string, QuizFigureInput> = {
  "two-magnets": {
    kind: "diagram",
    spec: {
      parts: [
        { part: "barMagnet", x: 20, y: 30, size: 20, labels: ["north", "south"] },
        { part: "barMagnet", x: 80, y: 30, size: 20, labels: ["north", "south"] },
      ],
    },
    labels: {},
  },
  "magnet-compass": {
    kind: "diagram",
    spec: {
      parts: [
        { part: "barMagnet", x: 50, y: 30, size: 30, labels: ["north", "south"] },
        { part: "compass", x: 70, y: 30, size: 20, labels: ["needle"] },
      ],
    },
    labels: {},
  },
};
