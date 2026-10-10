/**
 * Stripping in and out (src/lib/assistant/strip.ts, the owner's rule 5): what reaches the model has
 * names, ids, codes, e-mails, phone numbers and links replaced by placeholders, the same original by
 * the same placeholder; a chemical formula and a schoolbook number are left alone; and what an answer
 * must never carry is found. Pure.
 */
import { describe, expect, it } from "vitest";
import { answerProblems, expandLexicon, restoreSelf, stripIdentifiers, type NameEntry } from "@/lib/assistant/strip";

const LEXICON: NameEntry[] = [
  { name: "Asha Patil", kind: "SELF" },
  { name: "Rohan Deshmukh", kind: "PERSON" },
  { name: "Meera Kulkarni", kind: "PERSON" },
  { name: "Sunrise Public School", kind: "SCHOOL" },
];

describe("stripping what goes in", () => {
  it("replaces the person's own name, other people's, the school's, e-mails, phone numbers, links, ids and codes", () => {
    const s = stripIdentifiers(
      "I am Asha Patil of Sunrise Public School. Rohan Deshmukh's number is +91 98765 43210 and mail rohan@example.com; see https://bit.ly/x or free-games.in; my id cabcdefghij0123456789xyz and certificate TC/2025-26/0001. Rohan said hi.",
      LEXICON,
    );
    expect(s.text).toBe("I am [YOU] of [SCHOOL]. [PERSON_1]'s number is [PHONE_1] and mail [EMAIL_1]; see [LINK_1] or [LINK_2]; my id [ID_1] and certificate [CODE_1]. [PERSON_2] said hi.");
    expect(s.text).not.toMatch(/Asha|Rohan|Sunrise|98765|example\.com|bit\.ly|TC\//);
    expect(s.replacements.find((r) => r.placeholder === "[YOU]")?.original).toBe("Asha Patil");
  });

  it("gives the same original the same placeholder", () => {
    const s = stripIdentifiers("Meera Kulkarni and Meera Kulkarni again", LEXICON);
    expect(s.text).toBe("[PERSON_1] and [PERSON_1] again");
  });

  it("catches a name the lexicon does not hold by its shape: my friend X, X ma'am", () => {
    expect(stripIdentifiers("my friend Kabir told me, and Joshi ma'am agreed", []).text).toBe("my friend [PERSON_1] told me, and [PERSON_2] ma'am agreed");
    expect(stripIdentifiers("my teacher said so", []).text).toBe("my teacher said so");
  });

  it("leaves chemistry, years and schoolbook numbers alone", () => {
    const q = "Balance C6H12O6 + O2 -> CO2 + H2O; in 1857 the revolt began; find the square root of 123456 and 3.14159; COVID-19";
    expect(stripIdentifiers(q, LEXICON).text).toBe(q);
  });

  it("takes a given name of four letters or more, never a surname alone", () => {
    const names = expandLexicon([{ name: "Mohan Gandhi", kind: "PERSON" }, { name: "Om Rao", kind: "PERSON" }]).map((e) => e.name);
    expect(names).toContain("Mohan");
    expect(names).not.toContain("Gandhi");
    expect(names).not.toContain("Om");
  });

  it("puts the person's own given name back where the model wrote [YOU]", () => {
    const s = stripIdentifiers("I am Asha Patil", LEXICON);
    expect(restoreSelf("Well done, [YOU]!", s.replacements, "")).toBe("Well done, Asha!");
  });
});

describe("what an answer must not carry", () => {
  const ok = "Photosynthesis is how green plants make food from carbon dioxide and water using sunlight [1]. See the page /student/practice.";
  it("passes a clean answer, and a platform path", () => {
    expect(answerProblems(ok, LEXICON, "")).toEqual([]);
  });

  it("finds a link, an e-mail, a phone number and an address", () => {
    expect(answerProblems("Watch https://youtu.be/abc for more.", LEXICON, "")).toContain("LINK");
    expect(answerProblems("Visit www.example.org.", LEXICON, "")).toContain("LINK");
    expect(answerProblems("Try freegames.com today.", LEXICON, "")).toContain("LINK");
    expect(answerProblems("Write to help@school.in.", LEXICON, "")).toContain("EMAIL");
    expect(answerProblems("Call 98765 43210 now.", LEXICON, "")).toContain("PHONE");
    expect(answerProblems("Go to Flat No. 12, Shivaji Nagar.", LEXICON, "")).toContain("ADDRESS");
    expect(answerProblems("It is at 14 MG Road, Pune 411001.", LEXICON, "")).toContain("ADDRESS");
    expect(answerProblems("पता: मकान नं. 12, पिन कोड 411001", LEXICON, "")).toContain("ADDRESS");
  });

  it("finds another person's name, unless the passages it was built from print it", () => {
    expect(answerProblems("Ask Rohan Deshmukh for his notes.", LEXICON, "")).toContain("NAME");
    expect(answerProblems("Ask Rohan for his notes.", LEXICON, "")).toContain("NAME");
    expect(answerProblems("Rohan was a character in the chapter.", LEXICON, "Rohan and his kite, chapter 3")).not.toContain("NAME");
    // The person's own name is not another person's.
    expect(answerProblems("Well done, Asha!", LEXICON, "")).not.toContain("NAME");
  });

  it("finds a placeholder other than [YOU]", () => {
    expect(answerProblems("As [PERSON_1] said…", LEXICON, "")).toContain("PLACEHOLDER");
    expect(answerProblems("Well done, [YOU].", LEXICON, "")).toEqual([]);
  });
});
