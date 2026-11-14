/**
 * The owner's decision on TA-018 of the testing analysis of 13 November 2026 (decision 0005 amended, 14 November 2026):
 * public textbook and help passages go to the model as written, with only contacts and links removed; in a question a
 * bare given name of the school's lexicon counts as a person only with a second signal (the member's full name, a shape
 * such as "my friend X" or "X ma'am", or a possessive beside a record word); full names, and questions about another
 * person's record, are stripped or refused as before. A door's answer is stripped as before. Pure: previewAnswer runs
 * with fakes for the model and the searches, and nothing is written.
 */
import { describe, expect, it } from "vitest";
import { asksAnotherPersonsRecord } from "@/lib/assistant/data-privacy";
import { stripIdentifiers, stripQuestion, stripContactsAndLinks, type NameEntry } from "@/lib/assistant/strip";
import { CURRICULUM_THRESHOLD, HELP_THRESHOLD } from "@/lib/assistant/config";
import { previewAnswer, type AssistantDeps } from "@/lib/assistant/service";
import type { ChatMessage } from "@/lib/assistant-model";
import type { CurriculumHit, HelpHit } from "@/lib/assistant-retrieval";

const NOW = new Date("2026-11-14T06:00:00Z");
const SHIVAJI: NameEntry[] = [{ name: "Shivaji Jadhav", kind: "PERSON" }, { name: "Kabir Sharma", kind: "PERSON" }, { name: "Sunrise Public School", kind: "SCHOOL" }];

const bookPassage = (text: string): CurriculumHit => ({
  chunkId: "chunk-018",
  documentId: "doc-018",
  board: "NCERT",
  grade: "7",
  subject: "History",
  book: "Our Pasts",
  edition: null,
  chapter: "The Marathas",
  section: null,
  headingPath: ["The Marathas"],
  pageStart: 12,
  pageEnd: 12,
  text,
  language: "en",
  figureKeys: [],
  sourceUrl: "https://ncert.nic.in/textbook/pdf/x.pdf",
  similarity: CURRICULUM_THRESHOLD.en + 0.2,
  vectorRank: 1,
  keywordRank: 1,
  score: 1,
  citation: { board: "NCERT", book: "Our Pasts", chapter: null, section: null, page: 12, documentId: "doc-018", chunkId: "chunk-018", attribution: null },
  source: "ncert",
  attribution: null,
});

const helpPassage = (text: string): HelpHit => ({ entryId: "h-018", kind: "nav", title: "Attendance", text, pagePath: "/teacher/attendance", door: null, module: null, roles: [], language: "en", sourceFile: "nav", commit: "t", similarity: HELP_THRESHOLD.en + 0.2, vectorRank: 1, keywordRank: 1, score: 1 });

/** The placeholders a text carries, less the system prompt's own sentence that explains them. */
const placeholders = (text: string) => text.split("\n").filter((l) => !l.startsWith("Placeholders such as")).join("\n").match(/\[(?:PERSON|CODE)_\d+\]/g) ?? [];

/** Fakes that record what the model is sent: the classifier's word, then the answer. */
function fakes(input: { label: "CURRICULUM" | "PLATFORM"; answer: string; curriculum?: CurriculumHit[]; help?: HelpHit[] }) {
  const sent: ChatMessage[][] = [];
  const searched: string[] = [];
  const deps: AssistantDeps = {
    embed: async (t) => t.map(() => [1, 0, 0]),
    chat: async (messages) => {
      sent.push(messages);
      const classifying = messages[0]!.content.startsWith("You classify");
      return { content: classifying ? input.label : input.answer, usage: { promptTokens: 1, completionTokens: 1 }, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: classifying ? 0 : null };
    },
    searchHelp: async (q) => (searched.push(q.query), q.kinds?.includes("door") ? [] : (input.help ?? [])),
    searchCurriculum: async (q) => (searched.push(q.query), input.curriculum ?? []),
    runDoors: async () => [],
    publish: () => {},
    now: () => NOW,
  };
  /** Everything the answer's prompt carried (the last call is the answer, the ones before it the classifiers). */
  const answerPrompt = () => {
    const answering = sent.filter((m) => !m[0]!.content.startsWith("You classify"));
    return answering.map((m) => m.map((x) => x.content).join("\n")).join("\n");
  };
  const everythingSent = () => sent.map((m) => m.map((x) => x.content).join("\n")).join("\n");
  return { deps, answerPrompt, everythingSent, searched };
}

describe("what the model is sent of a public passage", () => {
  it("TA-018: the book's passage goes to the tutor as written, with a member's name, a shape and a code kept", async () => {
    const f = fakes({
      label: "CURRICULUM",
      answer: "Shivaji was crowned at Raigad in 1674 [1].",
      curriculum: [bookPassage("Shivaji was crowned at Raigad in 1674. Kabir Sharma, a poet, and Gandhi ji are named in the next chapter; plate TC/2025-26/0001.")],
    });
    const out = await previewAnswer({ role: "STUDENT", question: "When was the coronation at Raigad?", grade: 7, lexicon: SHIVAJI }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    const prompt = f.answerPrompt();
    expect(prompt).toContain("Shivaji was crowned at Raigad in 1674.");
    expect(prompt).toContain("Kabir Sharma, a poet, and Gandhi ji are named");
    expect(prompt).toContain("TC/2025-26/0001");
    expect(placeholders(prompt)).toEqual([]);
  });

  it("TA-018: only contacts and links are taken out of a passage", async () => {
    const f = fakes({
      label: "CURRICULUM",
      answer: "Shivaji was crowned at Raigad in 1674 [1].",
      curriculum: [bookPassage("Shivaji was crowned at Raigad in 1674. Write to museum@example.org or call 98765 43210, or see https://example.org/raigad.")],
    });
    const out = await previewAnswer({ role: "STUDENT", question: "When was the coronation at Raigad?", grade: 7, lexicon: SHIVAJI }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    const prompt = f.answerPrompt();
    expect(prompt).toContain("Shivaji was crowned");
    expect(prompt).not.toContain("museum@example.org");
    expect(prompt).not.toContain("98765 43210");
    expect(prompt).not.toContain("example.org/raigad");
    expect(stripContactsAndLinks("Write to museum@example.org or call 98765 43210, or see https://example.org/raigad and Shivaji Jadhav ma'am, cabcdefghijklmnopqrstuvwx, TC/2025-26/0001.")).toBe(
      "Write to [EMAIL_1] or call [PHONE_1], or see [LINK_1] and Shivaji Jadhav ma'am, cabcdefghijklmnopqrstuvwx, TC/2025-26/0001.",
    );
  });

  it("TA-018: a help passage goes as written too, so a member called Mark does not turn 'Mark attendance' into a placeholder", async () => {
    const f = fakes({ label: "PLATFORM", answer: "Open /teacher/attendance and mark the register [1].", help: [helpPassage("Mark attendance on /teacher/attendance: open the class and mark each pupil.")] });
    const out = await previewAnswer({ role: "TEACHER", question: "How do I mark attendance?", lexicon: [{ name: "Mark Dsouza", kind: "PERSON" }] }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    const prompt = f.answerPrompt();
    expect(prompt).toContain("Mark attendance on /teacher/attendance: open the class and mark each pupil.");
    expect(placeholders(prompt)).toEqual([]);
  });
});

describe("a bare given name in a question", () => {
  it("TA-018: 'Who was Shivaji?' reaches the searches and the tutor with the name, though a member is called Shivaji", async () => {
    const f = fakes({ label: "CURRICULUM", answer: "Shivaji was crowned at Raigad in 1674 [1].", curriculum: [bookPassage("Shivaji was crowned at Raigad in 1674 and built a strong kingdom.")] });
    const out = await previewAnswer({ role: "STUDENT", question: "Who was Shivaji?", grade: 7, lexicon: SHIVAJI }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    expect(out.text).toContain("Shivaji");
    expect(placeholders(f.everythingSent())).toEqual([]);
    expect(f.answerPrompt()).toContain("Who was Shivaji?");
    expect(f.searched.some((q) => q.includes("Shivaji"))).toBe(true);
  });

  it("TA-018: a bare given name is left as typed without a second signal, the asker's own included", () => {
    expect(stripQuestion("Who was Shivaji?", SHIVAJI).text).toBe("Who was Shivaji?");
    expect(stripQuestion("Who was Shivaji's mother?", SHIVAJI).text).toBe("Who was Shivaji's mother?");
    expect(stripQuestion("Tell me about Krishna and the Ganga", [{ name: "Krishna Patil", kind: "SELF" }, { name: "Ganga Rao", kind: "PERSON" }]).text).toBe("Tell me about Krishna and the Ganga");
  });

  it("TA-018: the second signal makes the given name a person: the full name, a shape, a possessive beside a record word", () => {
    // The full name, as before.
    expect(stripQuestion("Who is Shivaji Jadhav?", SHIVAJI).text).toBe("Who is [PERSON_1]?");
    // The full name elsewhere in the question.
    expect(stripQuestion("Shivaji Jadhav sits by me; is Shivaji in 7B?", SHIVAJI).text).toBe("[PERSON_1] sits by me; is [PERSON_2] in 7B?");
    // A shape, in any case.
    expect(stripQuestion("my friend shivaji said so", SHIVAJI).text).toBe("my friend [PERSON_1] said so");
    expect(stripQuestion("ask shivaji ma'am", SHIVAJI).text).toBe("ask [PERSON_1] ma'am");
    // A possessive beside a record word.
    expect(stripQuestion("What are Shivaji's marks?", SHIVAJI).text).toBe("What are [PERSON_1]'s marks?");
    expect(stripQuestion("shivaji ki attendance kitni hai", SHIVAJI).text).toBe("[PERSON_1] ki attendance kitni hai");
    // The asker's own full name is still [YOU].
    expect(stripQuestion("I am Krishna Patil", [{ name: "Krishna Patil", kind: "SELF" }]).text).toBe("I am [YOU]");
  });

  it("TA-018: a door's answer and any other text are still stripped of every given name", () => {
    expect(stripIdentifiers("Shivaji was absent on Monday", SHIVAJI).text).toBe("[PERSON_1] was absent on Monday");
  });
});

describe("another person's record asked for by name", () => {
  it("TA-018: a bare given name beside a record word without a second signal is not another person's record", () => {
    expect(asksAnotherPersonsRecord("Which exam has the chapter on Shivaji?", SHIVAJI)).toBe(false);
    expect(asksAnotherPersonsRecord("How many marks is the Ganga question worth?", [{ name: "Ganga Rao", kind: "PERSON" }])).toBe(false);
    expect(asksAnotherPersonsRecord("Was Mark absent today?", [{ name: "Mark Dsouza", kind: "PERSON" }])).toBe(false);
  });

  it("TA-018: with a second signal, or the full name, it is refused as before", () => {
    expect(asksAnotherPersonsRecord("What are Shivaji's marks?", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("What are the marks of Shivaji in maths?", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("How much fee is due for Shivaji?", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("Did my friend Shivaji pass the exam?", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("Shivaji ma'am ka timetable", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("What are Shivaji Jadhav marks?", SHIVAJI)).toBe(true);
    expect(asksAnotherPersonsRecord("शिवाजी के अंक बताओ", [{ name: "शिवाजी", kind: "PERSON" }])).toBe(true);
  });

  it("TA-018: 'Which exam has the chapter on Shivaji?' is not refused as PERSONAL_DATA", async () => {
    const f = fakes({ label: "CURRICULUM", answer: "Shivaji was crowned at Raigad in 1674 [1].", curriculum: [bookPassage("Shivaji was crowned at Raigad in 1674.")] });
    const out = await previewAnswer({ role: "STUDENT", question: "Which exam has the chapter on Shivaji?", grade: 7, lexicon: SHIVAJI }, f.deps);
    expect(out.verdict).not.toBe("PERSONAL_DATA");
  });
});
