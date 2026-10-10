/**
 * What a label key reads as in one language: the item's own text (figure.labels), a literal (a point's
 * name, a number), or a diagram part's built-in label and a unit from the dictionaries (namespace
 * `quizFigure` in packages/i18n), so the three languages' figures differ only in their words.
 */
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import {
  diagramLabelKey,
  isLiteralFigureLabel,
  type QuizDiagramPart,
  type QuizFigure,
  type QuizFigureLanguage,
} from "@edulink/contracts";

const DICTIONARIES = { en, hi, mr } as const;

/** Thrown when a figure cannot be drawn in a language; the importer refuses the item on it. */
export class FigureLabelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FigureLabelError";
  }
}

function dictionary(language: QuizFigureLanguage, key: string): string {
  const [ns, leaf] = key.split(".") as [string, string];
  const table = (DICTIONARIES[language] as unknown as Record<string, Record<string, string>>)[ns];
  const value = table?.[leaf];
  if (!value) throw new FigureLabelError(`no ${language} text for ${key}`);
  return value;
}

/** A number as a figure writes it: Western digits (the boards' books use them in all three media), at most three decimals, a true minus. */
export function formatNumber(value: number): string {
  const r = Math.round(value * 1000) / 1000;
  const s = String(Math.abs(r));
  return r < 0 ? `−${s}` : s;
}

export type LabelReader = {
  language: QuizFigureLanguage;
  /** The text of an item key. */
  key(key: string): string;
  /** A diagram part's built-in label, or the item key the spec put in its place. */
  part(part: QuizDiagramPart, anchor: string, override?: string): string;
  /** A measure with its unit: "5 cm", "5 सेमी", "60°". */
  measure(value: number, unit: string): string;
};

export function labelReader(figure: QuizFigure, language: QuizFigureLanguage): LabelReader {
  const key = (k: string): string => {
    if (isLiteralFigureLabel(k)) return k.replace(/^-/, "−");
    const text = figure.labels[k]?.[language];
    if (!text) throw new FigureLabelError(`label "${k}" has no ${language} text`);
    return text;
  };
  return {
    language,
    key,
    part: (part, anchor, override) => (override ? key(override) : dictionary(language, diagramLabelKey(part, anchor))),
    measure: (value, unit) => {
      const num = formatNumber(value);
      if (unit === "deg") return `${num}°`;
      if (unit === "units") return num;
      if (unit === "V" || unit === "A" || unit === "W") return `${num} ${unit}`;
      if (unit === "ohm") return `${num} Ω`;
      const unitKey = `quizFigure.unit${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
      return `${num} ${dictionary(language, unitKey)}`;
    },
  };
}
