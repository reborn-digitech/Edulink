/**
 * qb-A (31 October 2026): the QA pass's bank-content findings, as pure rules.
 *
 *   QB-01  a college unit is named after what the programme teaches, never after a heading of its document
 *          (src/lib/college-syllabi.ts unitNameRefusal, nameUnits, subjectOfTitle; the loader's gate)
 *   QB-17  a chapter's name in capitals is put in title case (src/lib/chapter-title-case.ts fixShoutedTitle, the
 *          generator's chapterTitleOf); the misspelt book title (NCERT_BOOK_TITLES); the book on the chapter door
 *   QB-18  a model's Hindi or Marathi name loses its labels, numbers and run-on summary, and one in the other
 *          language is no name (scripts/quiz-queue-load.ts cleanTranslatedName, translatedNameFor)
 *   QB-19  the duplicates finder's strict score (src/lib/bank-tools.ts strictPairScore)
 */
import { describe, expect, it } from "vitest";
import { nameUnits, programmesNamed, subjectOfTitle, unitNameRefusal, unitsOf } from "@/lib/college-syllabi";
import { fixShoutedTitle } from "@/lib/chapter-title-case";
import { chapterBookOfLine } from "@/lib/bank-desk";
import { strictPairScore, strictStem } from "@/lib/bank-tools";
import { planCollegeUnits } from "../scripts/quiz-gen/college";
import { chapterTitleOf, ncertBookTitle } from "../scripts/quiz-gen/select";
import { cleanTranslatedName, translatedNameFor, wrongLanguageName } from "../scripts/quiz-queue-load";

describe("QB-01: a college unit's name", () => {
  it("refuses the nine headings the QA pass found, and passes real unit names", () => {
    for (const junk of ["Notes:", "Syllabus", "Intake: 60 Duration: 4 Year", "MM Curriclum upadated structure 2024", "BA LL. B., BBA LL.B., and LL. B.", "Core Subjects", "BTechDataScience 2024 Final", "Click here."]) {
      expect(unitNameRefusal(junk), junk).not.toBeNull();
    }
    for (const real of ["Science and Technology Law", "Criminal Law", "Constitutional and Administrative Law", "International Law", "Business Law", "Foundation Course in Cyber Security", "Psychology", "Digital Marketing"]) {
      expect(unitNameRefusal(real), real).toBeNull();
    }
    expect(programmesNamed("BA LL. B., BBA LL.B., and LL. B.")).toBeGreaterThanOrEqual(2);
    expect(programmesNamed("Science and Technology Law")).toBe(0);
  });

  it("names a whole-document unit by the subject its title names, and refuses a title that names none", () => {
    expect(subjectOfTitle("F.Y.B.A. Psychology Syllabus From 2024-25")).toBe("Psychology");
    expect(subjectOfTitle("MBA Digital Marketing - Syllabus 2024 Pattern - NEP 2020")).toBe("Digital Marketing");
    expect(subjectOfTitle("SE Electrical Syllabus 2024 pattern 14th July")).toBe("Electrical");
    expect(subjectOfTitle("B.A. B.Sc. (Mathematics) syllabus")).toBe("Mathematics");
    expect(subjectOfTitle("MM Curriclum upadated structure 2024")).toBe("");
    expect(subjectOfTitle("BA LL. B., BBA LL.B., and LL. B.")).toBe("");
    expect(subjectOfTitle("BTechDataScience 2024 Final")).toBe("");
    expect(subjectOfTitle("Equivalence for M.A Sociology Syllabus 2019 pattern to 2023 pattern")).toBe("");
    expect(subjectOfTitle("LL. M. (2 Year) Syllabus For Affiliated law Colleges Academic Year 2025-2026")).toBe("");
    expect(subjectOfTitle("SE IT Syllabus 2024")).toBe("");
  });

  it("keeps every unit's number, refuses the title page and the labels, and gives a lone label the document's subject", () => {
    const c = (ordinal: number, head: string) => ({ ordinal, headingPath: head ? [head] : [] });
    // The Foundation Course in Data Science: its title page (about, eligibility, marks), then one "Syllabus".
    const data = unitsOf([c(0, "Foundation Course in Data Science"), c(1, "Foundation Course in Data Science"), c(2, "Syllabus"), c(3, "Syllabus")], "Foundation Course in Data Science");
    expect(data.map((u) => [u.number, u.name, u.refusal === null])).toEqual([
      [1, "Foundation Course in Data Science", false],
      [2, "Foundation Course in Data Science", true],
    ]);
    // The LL.M. syllabus: "Core Subjects" refused, the units after it keep their numbers (they are in the topics' slugs).
    const llm = unitsOf([c(0, "CORE SUBJECTS"), c(1, "SCIENCE AND TECHNOLOGY LAW"), c(2, "CRIMINAL LAW")], "LL. M. (2 Year) Syllabus Ac 2025-26 (Department)");
    expect(llm.map((u) => [u.number, u.name, u.refusal])).toEqual([
      [1, "Core Subjects", "a label of the document, not a subject"],
      [2, "Science and Technology Law", null],
      [3, "Criminal Law", null],
    ]);
    // Headless documents: one unit named by the document's subject, or refused.
    expect(unitsOf([c(0, ""), c(1, "")], "BA LL. B., BBA LL.B., and LL. B.")[0]!.refusal).not.toBeNull();
    expect(unitsOf([c(0, ""), c(1, "")], "MM Curriclum upadated structure 2024")[0]!.refusal).not.toBeNull();
    expect(unitsOf([c(0, ""), c(1, "")], "F.Y.B.A. Psychology Syllabus From 2024-25").map((u) => [u.name, u.refusal])).toEqual([["Psychology", null]]);
    expect(nameUnits([{ number: 1, heading: "Notes:", chunks: [c(0, "Notes:")] }], "CB Board Updated Syllabus 2024")[0]!.refusal).toBe("a heading cut after a mark");
  });

  it("plans no refused unit", () => {
    const units = unitsOf([{ ordinal: 0, headingPath: ["CORE SUBJECTS"] }, { ordinal: 1, headingPath: ["INTERNATIONAL LAW"] }], "LL. M. Syllabus 2025");
    const plan = planCollegeUnits({ stream: "LAW", programme: "LL.M." }, [{ doc: { path: "zz/llm.pdf", title: "LL. M. Syllabus 2025" }, stream: "LAW", board: "SPPU", programme: "LL.M.", units }]);
    expect(plan.map((w) => [w.unit, w.unitName])).toEqual([[2, "International Law"]]);
  });
});

describe("QB-17: names in capitals, the book's title, the book on the chapter", () => {
  it("puts a name in capitals in title case and leaves abbreviations", () => {
    expect(fixShoutedTitle("CHANGING TRADITIONS")).toBe("Changing Traditions");
    expect(fixShoutedTitle("THE THREE ORDERS")).toBe("The Three Orders");
    expect(fixShoutedTitle("TOWARDS Modernisation")).toBe("Towards Modernisation");
    expect(fixShoutedTitle("Chapter 3 — CHANGING TRADITIONS")).toBe("Chapter 3 — Changing Traditions");
    for (const kept of ["NCERT and the UN", "DNA", "The pH of Soil", "Role of the RBI in GDP", "Early Societies"]) expect(fixShoutedTitle(kept)).toBe(kept);
    expect(chapterTitleOf("Chapter 2: HUMAN SETTLEMENTS", 2)).toBe("Human Settlements");
    expect(chapterTitleOf("Chapter 1: early societies", 1)).toBe("Early Societies");
  });

  it("names Indian Constitution at Work as the book prints it, and reads the book off a chapter's line", () => {
    expect(ncertBookTitle("keps2", "India Constitution at Work")).toBe("Indian Constitution at Work");
    expect(chapterBookOfLine("Chapter 9 (Indian Constitution at Work) — Constitution as a Living Document")).toBe("Indian Constitution at Work");
    expect(chapterBookOfLine("Chapter 7 — Regional Aspirations")).toBeNull();
  });
});

describe("QB-18: a model's Hindi or Marathi name", () => {
  it("loses the class, subject, label, number and run-on summary", () => {
    const cases: [string, string][] = [
      ["गणित कक्षा 6 अध्याय 1 - गणित में पैटर्न", "गणित में पैटर्न"],
      ["गणित इयत्ता 6 अध्याय 1 - गणितात पॅटर्न", "गणितात पॅटर्न"],
      ["5. अभाज्य समय", "अभाज्य समय"],
      ["कक्षा 7 विज्ञान: अध्याय 6 — अवस्था के साथ बढ़ते हैं: किशोर वर्ष", "अवस्था के साथ बढ़ते हैं: किशोर वर्ष"],
      ["अध्याय नौ: संविधान एक जीवंत दस्तावेज", "संविधान एक जीवंत दस्तावेज"],
      ["चौथा अध्याय - विचारक, विश्वास और भवन", "विचारक, विश्वास और भवन"],
      ["नऊवा अध्याय - निवडलेल्या विषयांवर भूगोलीय दृष्टिकोण", "निवडलेल्या विषयांवर भूगोलीय दृष्टिकोण"],
      ["इकाई 1 - मूलभूत विषय", "मूलभूत विषय"],
      ["लंबाई और गति का मापन। इस अध्याय में मानक इकाइयों के उपयोग से लंबाई के मापन का वर्णन किया गया है", "लंबाई और गति का मापन"],
      ["अध्याय 3", ""],
      // Names that are names stay.
      ["तीन वर्ग", "तीन वर्ग"],
      ["पाठशाला", "पाठशाला"],
      ["एकक आणि मापन", "एकक आणि मापन"],
      ["दो बिल्लियाँ", "दो बिल्लियाँ"],
      ["कितना भारी? कितना हलका?", "कितना भारी? कितना हलका?"],
      ["लोकशाही म्हणजे काय? लोकशाही का?", "लोकशाही म्हणजे काय? लोकशाही का?"],
    ];
    for (const [given, want] of cases) expect(cleanTranslatedName(given), given).toBe(want);
  });

  it("calls a Marathi name in Hindi, and a Hindi name in Marathi, no name", () => {
    expect(wrongLanguageName("mr", "उम्र के साथ बढ़त रहे हैं: किशोर वर्ष")).toBe(true);
    expect(wrongLanguageName("mr", "आपल्या सभोवतालचे पदार्थ शुद्ध आहेत का")).toBe(false);
    expect(wrongLanguageName("hi", "गुणनखंड आणि लसावी")).toBe(true);
    expect(wrongLanguageName("hi", "गुणनखंड और लघुत्तम")).toBe(false);
    expect(translatedNameFor("mr", "कक्षा 7 विज्ञान: अध्याय 6 — उम्र के साथ बढ़त रहे हैं: किशोर वर्ष")).toBe("");
    expect(translatedNameFor("hi", "कक्षा 7 विज्ञान: अध्याय 6 — अवस्था के साथ बढ़ते हैं: किशोर वर्ष")).toBe("अवस्था के साथ बढ़ते हैं: किशोर वर्ष");
  });
});

describe("QB-19: the duplicates finder's strict score", () => {
  it("never gives 1.0 to different maths stems, and gives it to the same stem spaced or marked otherwise", () => {
    for (const [a, b] of [
      ["What is (−3) + 3?", "What is √3 × √3?"],
      ["What is 2⁵?", "What is (2³)²?"],
      ["What is the coefficient of x² in (1 + x)⁵?", "What is the coefficient of x³ in (1 + x)⁶?"],
      ["What is sin⁻¹(1/2)?", "What is sin⁻¹(−1/2)?"],
      ["What is 3.5 + 1?", "What is 35 + 1?"],
    ]) {
      expect(strictPairScore(a!, b!, true) ?? 0, `${a} | ${b}`).toBeLessThan(1);
      expect(strictPairScore(a!, b!, false), `${a} | ${b}`).toBeNull();
    }
    expect(strictPairScore("What is the capital of France?", "what is the capital of  France", true)).toBe(1);
    const near = strictPairScore("Which of the following is a property of metals?", "Which of the following is a property of metal?", true);
    expect(near).toBeGreaterThanOrEqual(0.8);
    expect(near).toBeLessThan(1);
    expect(strictStem("What is 3.5 + 1?")).toBe("whatis3.5+1");
    expect(strictPairScore("Which of the following is a property of non-metals?", "Which of the following is a property of nonmetals?", true)).toBe(1);
    expect(strictPairScore("What is 5 - 3?", "What is 53?", true) ?? 0).toBeLessThan(1);
  });
});
