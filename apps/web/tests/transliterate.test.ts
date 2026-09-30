import { describe, expect, it } from "vitest";
import { transliterateWord, wordAt } from "@/lib/transliterate";

describe("Latin letters to Devanagari", () => {
  it("writes the common words of Hindi and Marathi as people type them on a phone", () => {
    const hi = (w: string) => transliterateWord(w, "hi");
    expect(hi("namaste")).toBe("नमस्ते");
    expect(hi("hindi")).toBe("हिंदी");
    expect(hi("bhaarat")).toBe("भारत");
    // Strict: a long vowel is typed twice; "bharat" is भरत, as it is spelt.
    expect(hi("bharat")).toBe("भरत");
    expect(hi("vidyaalay")).toBe("विद्यालय");
    expect(hi("kRShNa")).toBe("कृष्ण");
    expect(hi("prashna")).toBe("प्रश्न");
    expect(hi("shikshaa")).toBe("शिक्षा");
    expect(hi("raam")).toBe("राम");
    expect(hi("ram")).toBe("रम");
    expect(hi("bachchaa")).toBe("बच्चा");
    expect(hi("dhanyavaad")).toBe("धन्यवाद");
    expect(hi("aMgrezI")).toBe("अंग्रेज़ी");
    expect(hi("kulakarNI")).toBe("कुलकर्णी");
    expect(hi("aam")).toBe("आम");
    expect(hi("kaMpyUTar")).toBe("कंप्यूटर");
    expect(hi("ai")).toBe("ऐ");
    expect(hi("hai")).toBe("है");
    expect(hi("nahIM")).toBe("नहीं");
    expect(hi("ghar")).toBe("घर");
    expect(hi("chhaatra")).toBe("छात्र");
  });

  it("knows the Marathi letters", () => {
    const mr = (w: string) => transliterateWord(w, "mr");
    expect(mr("shaaLaa")).toBe("शाळा");
    expect(mr("maraaThI")).toBe("मराठी");
    expect(mr("dnyaan")).toBe("ज्ञान");
    expect(mr("pune")).toBe("पुने");
    expect(mr("vidyaarthI")).toBe("विद्यार्थी");
    expect(mr("Ophis")).toBe("ऑफिस");
    expect(mr("kRupayaa")).toBe("कृपया");
    expect(mr("mumbaI")).toBe("मुंबई");
  });

  it("leaves alone what is not a Latin word: English typing, Devanagari already, numbers, punctuation", () => {
    expect(transliterateWord("namaste", "en")).toBe("namaste");
    expect(transliterateWord("नमस्ते", "hi")).toBe("नमस्ते");
    expect(transliterateWord("2026", "hi")).toBe("2026");
    expect(transliterateWord("", "hi")).toBe("");
    expect(transliterateWord("hello,", "hi")).toBe("hello,");
  });

  it("finds the word around the caret", () => {
    expect(wordAt("namaste duniya", 3)).toEqual({ start: 0, end: 7 });
    expect(wordAt("namaste duniya", 14)).toEqual({ start: 8, end: 14 });
    expect(wordAt("नमस्ते duniya", 6)).toEqual({ start: 6, end: 6 });
    expect(wordAt("a b", 1)).toEqual({ start: 0, end: 1 });
  });
});
