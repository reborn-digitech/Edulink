import { describe, expect, it } from "vitest";
import { translator } from "./i18n/dictionary";
import { SUGGESTED_DAY } from "./school-day";
import { periodLabel, reportCardPresetLabel } from "./coded-defaults";
import { certificateNameLabel } from "./certificate-names";
import { presetsFor } from "./report-card-rules";
import { kindTitle } from "./certificate-rules";

/**
 * B-15 (4 Oct 2026): words the code wrote into a school's rows in English
 * ("Period 1", "Lunch", "Bonafide Certificate", "CBSE eight-point scale")
 * showed in English on Marathi pages. Each kind has one lookup from the
 * default's English to its key; these read every coded default through it
 * and check a school's own word is left as typed.
 */
const en = translator("en");
const mr = translator("mr");
const hi = translator("hi");
const latin = /[A-Za-z]{3}/;

describe("the suggested school day reads in the reader's language", () => {
  it("every name SUGGESTED_DAY writes has a Marathi and a Hindi reading", () => {
    for (const p of SUGGESTED_DAY) {
      expect(periodLabel(p.name, en)).toBe(p.name);
      expect(periodLabel(p.name, mr)).not.toMatch(latin);
      expect(periodLabel(p.name, hi)).not.toMatch(latin);
    }
    expect(periodLabel("Period 3", mr)).toBe("तासिका 3");
    expect(periodLabel("Lunch", mr)).toBe("जेवणाची सुट्टी");
  });

  it("a name the office typed is the school's word and stays as typed", () => {
    expect(periodLabel("Assembly", mr)).toBe("Assembly");
    expect(periodLabel("Period 9", mr)).toBe("Period 9");
    expect(periodLabel("तासिका 1", en)).toBe("तासिका 1");
  });
});

describe("certificate presets' names read in the reader's language", () => {
  const englishWords = (key: string) => en(key as Parameters<typeof en>[0]);
  it("every kind's English default title maps to its key", () => {
    for (const kind of ["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM", "MIGRATION", "PROVISIONAL", "COURSE_COMPLETION"] as const) {
      const english = kindTitle(kind, englishWords);
      expect(certificateNameLabel(english, en)).toBe(english);
      expect(certificateNameLabel(english, mr)).toBe(kindTitle(kind, (k) => mr(k as Parameters<typeof mr>[0])));
      expect(certificateNameLabel(english, mr)).not.toMatch(latin);
    }
    expect(certificateNameLabel("Bonafide Certificate", mr)).toBe("बोनाफाईड प्रमाणपत्र");
    expect(certificateNameLabel(en("certificateDefaults.collegeBonafideName"), hi)).toBe(hi("certificateDefaults.collegeBonafideName"));
  });

  it("a template the office renamed keeps its name", () => {
    expect(certificateNameLabel("Bonafide for the bank", mr)).toBe("Bonafide for the bank");
  });
});

describe("report card presets are labelled in the reader's language", () => {
  it("each coded preset, whatever language its stored name is in, reads in the reader's", () => {
    for (const preset of presetsFor()) {
      expect(reportCardPresetLabel(preset, mr)).not.toMatch(/^[A-Za-z ,]+$/);
      expect(reportCardPresetLabel(preset, en)).toBe(preset.name);
    }
    expect(reportCardPresetLabel({ key: "custom", name: "Our scale" }, mr)).toBe("Our scale");
  });
});
