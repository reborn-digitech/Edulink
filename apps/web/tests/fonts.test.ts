import { describe, expect, it } from "vitest";
import { parseLayout } from "@/lib/certificate-rules";
import { paragraphFont, typingFor } from "@/lib/fonts";

describe("a certificate paragraph's face, and what is typed into it", () => {
  it("is set in its own face, or the paper's where it names none", () => {
    expect(paragraphFont("default", "hind")).toBe("hind");
    expect(paragraphFont("merriweather", "hind")).toBe("merriweather");
    expect(paragraphFont(undefined, "default")).toBe("default");
    expect(paragraphFont(null, undefined)).toBe("default");
  });

  it("is typed in Devanagari for a Devanagari face, in English for a Latin one, and in the document's language otherwise", () => {
    // A Devanagari face: Hindi or Marathi by the document, Hindi for an English document.
    expect(typingFor("hind", "mr")).toBe("mr");
    expect(typingFor("notoserifdevanagari", "hi")).toBe("hi");
    expect(typingFor("tirodevanagarimarathi", "en")).toBe("hi");
    // A Latin face: English letters, whatever the document's language.
    expect(typingFor("merriweather", "mr")).toBe("en");
    expect(typingFor("inter", "en")).toBe("en");
    // The app's own, an unknown key, and Mukta, which sets both: the document's language.
    expect(typingFor("default", "mr")).toBe("mr");
    expect(typingFor("default", "en")).toBe("en");
    expect(typingFor("nosuchface", "hi")).toBe("hi");
    expect(typingFor("mukta", "mr")).toBe("mr");
    expect(typingFor("mukta", "en")).toBe("en");
  });

  it("reads a layout saved before the paragraphs had faces as the paper's face on both", () => {
    expect(parseLayout(JSON.stringify({ font: "hind", showLogo: false }))).toMatchObject({ font: "hind", introFont: "default", outroFont: "default", showLogo: false });
    expect(paragraphFont(parseLayout(null).introFont, parseLayout(null).font)).toBe("default");
  });
});
