import type { Translate, TranslationKey } from "./i18n/dictionary";
import { SUGGESTED_DAY } from "./school-day";

/**
 * WORDS THE CODE WROTE INTO A SCHOOL'S ROWS, READ BACK IN THE READER'S
 * LANGUAGE (B-15, 4 Oct 2026).
 *
 * A suggested school day ("Period 1", "Lunch") and the certificate presets
 * ("Bonafide Certificate") are written into the school's own rows in
 * English, where the office then edits them as text. A Marathi reader saw
 * those English words on an otherwise Marathi page. The rows are the
 * school's and are never rewritten here; a value is translated at render
 * only while it is still, character for character, the English default the
 * code wrote — the moment the office retypes it, it is the school's word and
 * is shown as typed. One lookup per kind, from the default's English to its
 * dictionary key.
 *
 * This file is imported by client components (the timetable grids), so it
 * carries no dictionary; the certificate names, which need the English
 * dictionary to know their defaults, are in certificate-names.ts (server).
 */

/** "Period 3" → `timetable.suggestedPeriod` with n = 3, for the names SUGGESTED_DAY writes. */
const PERIOD_DEFAULTS: Map<string, { key: TranslationKey; n?: number }> = new Map(
  SUGGESTED_DAY.map((p) => {
    const m = /^Period (\d+)$/.exec(p.name);
    if (m) return [p.name, { key: "timetable.suggestedPeriod" as TranslationKey, n: Number(m[1]) }];
    return [p.name, { key: (p.name === "Lunch" ? "timetable.suggestedLunch" : "timetable.suggestedBreak") as TranslationKey }];
  }),
);

/** A period's name as the reader should see it: the suggested day's words in their language, the school's own words as typed. */
export function periodLabel(name: string, t: Translate): string {
  const hit = PERIOD_DEFAULTS.get(name);
  if (!hit) return name;
  return hit.n === undefined ? t(hit.key) : t(hit.key, { n: hit.n });
}

/** The report card presets are coded (report-card-rules.ts `presetsFor`); their names are labels in a picker, so they follow the reader. */
const PRESET_KEY: Record<string, TranslationKey> = {
  cbse8: "reportCardDefaults.presetCbse8",
  mh5: "reportCardDefaults.presetMh5",
  percent: "reportCardDefaults.presetPercent",
};

export function reportCardPresetLabel(preset: { key: string; name: string }, t: Translate): string {
  const key = PRESET_KEY[preset.key];
  return key ? t(key) : preset.name;
}
