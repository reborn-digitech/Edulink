/**
 * THE WORDS THAT DIFFER BY STREAM (5 Oct 2026, the UX builder): every variant
 * a preset can ask for exists in English, Hindi and Marathi, singular and
 * plural, in Devanagari where it should be; `tv` and the academics pages'
 * helpers give a pharmacy college its "practical", a law college its
 * "faculty" and an architecture college its "studio", and keep the general
 * word where the streams disagree or none is recorded.
 */
import { describe, expect, it } from "vitest";
import { STREAM_PRESETS, STREAM_WORD_VARIANTS, STREAMS } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { translator } from "@/lib/i18n/dictionary";
import { tv } from "@/lib/stream-words";
import { lectureKindLabel, roomKindLabel } from "@/components/academics/parts";

const words = { en, hi, mr } as const;

describe("the stream words in three languages", () => {
  it.each(["en", "hi", "mr"] as const)("%s has every variant, singular and plural", (code) => {
    const w = (words[code] as unknown as { streams: { word: Record<string, string> } }).streams.word;
    for (const v of STREAM_WORD_VARIANTS) {
      expect(w[v], `${code} streams.word.${v}`).toBeTruthy();
      expect(w[`${v}Many`], `${code} streams.word.${v}Many`).toBeTruthy();
      if (code !== "en") {
        expect(w[v]).toMatch(/[ऀ-ॿ]/);
        expect(w[`${v}Many`]).toMatch(/[ऀ-ॿ]/);
      }
    }
  });

  it("asks only for variants that exist, for every stream's preset", () => {
    for (const s of STREAMS) for (const v of Object.values(STREAM_PRESETS[s].vocabulary)) expect(STREAM_WORD_VARIANTS).toContain(v);
  });

  it("gives each college its own word, in each language, and the general word where streams disagree", () => {
    for (const code of ["en", "hi", "mr"] as const) {
      const t = translator(code);
      expect(tv("lab", ["PHARMACY"], t)).toBe(t("streams.word.practical"));
      expect(tv("department", ["LAW"], t, true)).toBe(t("streams.word.facultyMany"));
      expect(tv("lecture", ["ARCHITECTURE"], t)).toBe(t("streams.word.studio"));
      // Engineering with pharmacy disagree about the lab; no stream recorded keeps the general word.
      expect(tv("lab", ["ENGINEERING", "PHARMACY"], t)).toBe(t("streams.word.lab"));
      expect(tv("department", [], t)).toBe(t("streams.word.department"));
      expect(t("streams.word.practical")).not.toBe(t("streams.word.lab"));
    }
  });

  it("says a lecture's and a room's kind in the college's words on the academics pages", () => {
    const t = translator("en");
    expect(lectureKindLabel("LAB", t, ["PHARMACY"])).toBe("Practical");
    expect(lectureKindLabel("LECTURE", t, ["ARCHITECTURE"])).toBe("Studio");
    expect(lectureKindLabel("LECTURE", t, ["ARTS", "SCIENCE"])).toBe("Lecture");
    expect(lectureKindLabel("TUTORIAL", t, ["ARCHITECTURE"])).toBe(t("academics.lectureTUTORIAL"));
    expect(roomKindLabel("LAB", t, ["PHARMACY"])).toBe("Practical");
    expect(roomKindLabel("SEMINAR", t, ["PHARMACY"])).toBe(t("academics.roomSEMINAR"));
    const mr = translator("mr");
    expect(lectureKindLabel("LAB", mr, ["PHARMACY"])).toBe(mr("streams.word.practical"));
  });
});
