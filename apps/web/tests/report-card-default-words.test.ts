import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";
import { certificateNameLabel, reportCardDefaultLabel, reportCardDefaultLabels } from "@/lib/certificate-names";
import { DEFAULT_REPORT_CARD_CONFIG, REPORT_CARD_PRESETS } from "@/lib/report-card-rules";

/**
 * A3-states-18 (risks batch, 5 Oct 2026): the Marathi walk found the report
 * card's coded words in English — "Needs improvement" on the scale, "Physical
 * education" and "Work education" among the co-scholastic areas — where a
 * school's rules were written with the English defaults, and "Bonafide
 * Certificate" on the issued list. They read in the reader's language while
 * they are still the English default; a word the office typed stays as typed.
 */
const en = translator("en");
const mr = translator("mr");
const hi = translator("hi");
const latin = /[A-Za-z]{3}/;

const englishDefaults = [
  ...REPORT_CARD_PRESETS.flatMap((p) => p.bands.map((b) => b.descriptor).filter((d): d is string => Boolean(d))),
  ...DEFAULT_REPORT_CARD_CONFIG.coScholastic.areas,
  ...DEFAULT_REPORT_CARD_CONFIG.coScholastic.scale.map((g) => g.descriptor).filter((d): d is string => Boolean(d)),
];

describe("the report card's coded words read in the reader's language", () => {
  it("every English default band descriptor and co-scholastic area has a Hindi and a Marathi reading", () => {
    expect(englishDefaults).toEqual(expect.arrayContaining(["Needs improvement", "Physical education", "Work education"]));
    for (const text of englishDefaults) {
      expect(reportCardDefaultLabel(text, en), text).toBe(text);
      expect(reportCardDefaultLabel(text, mr), text).not.toMatch(latin);
      expect(reportCardDefaultLabel(text, hi), text).not.toMatch(latin);
    }
    expect(reportCardDefaultLabel("Physical education", mr)).toBe(mr("reportCardDefaults.physicalEducation"));
  });

  it("a word the office typed is the school's and stays as typed", () => {
    expect(reportCardDefaultLabel("Needs more practice", mr)).toBe("Needs more practice");
    expect(reportCardDefaultLabel("शारीरिक शिक्षण", en)).toBe("शारीरिक शिक्षण");
  });

  it("the preview's lookup gives the same words as the server's", () => {
    const labels = reportCardDefaultLabels(mr);
    for (const text of englishDefaults) expect(labels[text]).toBe(reportCardDefaultLabel(text, mr));
    // A Marathi preview of the default rules shows none of the listed English words.
    const shown = englishDefaults.map((text) => labels[text] ?? text).join(" ");
    for (const word of ["Needs improvement", "Physical education", "Work education"]) expect(shown).not.toContain(word);
  });

  it("the card's page, its PDF and the office's preview print the coded words through the lookup", () => {
    const read = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
    const card = read("app/(app)/report-cards/[cardId]/page.tsx");
    expect(card).toContain("reportCardDefaultLabel(row.area, t)");
    expect(card).toContain("reportCardDefaultLabel(b.descriptor, t)");
    expect(card).toContain("reportCardDefaultLabel(item.title, t)");
    const pdf = read("lib/report-card-pdf.tsx");
    expect(pdf).toContain("reportCardDefaultLabel(c.area, t)");
    expect(pdf).toContain("reportCardDefaultLabel(b.descriptor, t)");
    const preview = read("app/(app)/admin/report-cards/rules-preview.tsx");
    expect(preview).toContain("said(row.band.descriptor)");
    expect(preview).toContain("said(area)");
    expect(read("app/(app)/admin/report-cards/page.tsx")).toContain("defaultLabels={reportCardDefaultLabels(t)}");
  });
});

describe("a certificate preset's title on the office's issued list", () => {
  it("reads in the reader's language while it is the English default", () => {
    expect(certificateNameLabel("Bonafide Certificate", mr)).not.toMatch(latin);
    expect(readFileSync(join(process.cwd(), "src", "app/(app)/admin/certificates/issued/page.tsx"), "utf8")).toContain("certificateNameLabel(item.title, t)");
  });
});
