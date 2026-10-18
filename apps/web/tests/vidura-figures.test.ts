/**
 * F-1 OF THE LOOSE-ENDS WALK (18 October 2026): a "My records" answer may not state a figure the data did not hold.
 * A guardian asked "How much fee is still due for my child this term?" and was told ₹16,000; the fee door said
 * ₹12,500 outstanding for every term and nothing due in this term. Proved here, each failing without its rule:
 *
 *   1. through the service, on the real fixture (zz.parent01 at ZZ Northgate, the fee door read as them through the
 *      real handler, a fake model writing the wrong figure): the answer is discarded with the reason FIGURE before the
 *      classifier is asked, and the person gets the fixed sentence, where to see it and "Ask a person"; the figure the
 *      door holds passes;
 *   2. the check itself (figures.ts): amounts in ₹, Rs and rupees with Indian or Western grouping, Devanagari digits,
 *      dates in the forms the model writes, counts in digits and in words ("three" only when the data's count is 3),
 *      a bare count the question named; percentages, page paths, citation marks and clock times are not figures;
 *   3. the window that shows nothing due (summary.ts): its own totals made by code and the fixed sentence; not for a
 *      window with a row still owed, nor for a list of payments; the payment calendar's paise read as rupees.
 *
 * Reads the ZZ fixture and writes only the conversations, usage rows and sessions of zz.parent01 it makes, removed
 * afterwards (the usage rows put back as they were).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, openConversation, type AssistantDeps } from "@/lib/assistant/service";
import { runDoors } from "@/lib/assistant/router";
import { figureSet, latinDigits, unsupportedFigures } from "@/lib/assistant/figures";
import { summariseDoor, windowNothingDue } from "@/lib/assistant/summary";
import { hintsOf } from "@/lib/assistant/doors";
import { DOOR_SCOPE_THRESHOLD } from "@/lib/assistant/config";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";
import type { HelpHit } from "@/lib/assistant-retrieval";
import type { ChatMessage, ChatOptions, ChatResult } from "@/lib/assistant-model";
import type { TimeWindow } from "@/lib/assistant/when";

const db = new PrismaClient();
const started = new Date();
const ids = { parent: "", school: "" };
let usageBefore: Awaited<ReturnType<typeof db.assistantUsage.findMany>> = [];

async function asParent(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({ "user-agent": "zz-walk" });
  await createSession(ids.parent, { schoolId: ids.school, role: "PARENT" as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

const FEE_DOOR: HelpHit = { entryId: "door-fees", kind: "door", title: "A guardian's child: dues", text: "GET /api/v1/fees/family: a child's dues.", pagePath: null, door: "GET /api/v1/fees/family", module: null, roles: [], language: "en", sourceFile: "catalog", commit: "test", similarity: DOOR_SCOPE_THRESHOLD + 0.2, vectorRank: 1, keywordRank: 1, score: 1 };

/** A fake model (the answer it writes is `answer`) and fake searches finding only the fee door; the doors are read for real. */
function fake(answer: string) {
  const calls: { messages: ChatMessage[]; opts: ChatOptions }[] = [];
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages, opts): Promise<ChatResult> => {
      calls.push({ messages, opts });
      const base = { usage: { promptTokens: 100, completionTokens: 10 }, tokensPerSecond: null, promptTokensPerSecond: null };
      if (messages[0]!.content.startsWith("You classify")) return { ...base, content: "PLATFORM", firstTokenLogprob: 0 };
      return { ...base, content: answer, firstTokenLogprob: null, finishReason: "stop" };
    },
    searchHelp: async (q) => (q.kinds?.includes("door") ? [FEE_DOOR] : []),
    searchCurriculum: async () => [],
    runDoors: (input) => runDoors(input),
    publish: () => {},
    now: () => new Date(),
  };
  return { deps, calls };
}

beforeAll(async () => {
  const parent = await db.user.findUnique({ where: { email: "zz.parent01@zz.test" }, select: { id: true } });
  const school = await db.school.findFirst({ where: { slug: "zz-northgate-school" }, select: { id: true } });
  if (!parent || !school) throw new Error("the ZZ fixture is missing: npm run zz:fixtures");
  Object.assign(ids, { parent: parent.id, school: school.id });
  usageBefore = await db.assistantUsage.findMany({ where: { userId: parent.id } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const convs = await db.assistantConversation.findMany({ where: { userId: ids.parent, schoolId: ids.school, createdAt: { gte: started } }, select: { id: true } });
  await db.assistantMessage.deleteMany({ where: { conversationId: { in: convs.map((c) => c.id) } } });
  await db.assistantConversation.deleteMany({ where: { id: { in: convs.map((c) => c.id) } } });
  const before = new Map(usageBefore.map((u) => [u.id, u]));
  for (const row of await db.assistantUsage.findMany({ where: { userId: ids.parent } })) {
    const b = before.get(row.id);
    if (!b) await db.assistantUsage.delete({ where: { id: row.id } });
    else {
      const { questions, answered, hints, refused, counsellorRoutes, modelCalls, promptTokens, completionTokens, helpful, notHelpful, standardAnswers } = b;
      await db.assistantUsage.update({ where: { id: row.id }, data: { questions, answered, hints, refused, counsellorRoutes, modelCalls, promptTokens, completionTokens, helpful, notHelpful, standardAnswers } });
    }
  }
  await db.session.deleteMany({ where: { userId: ids.parent, userAgent: "zz-walk" } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* 1. Through the service, on the real fixture                                 */
/* -------------------------------------------------------------------------- */

describe("1. the ₹16,000 answer, on zz.parent01's own fee door", () => {
  it("is discarded with FIGURE before the classifier reads it; the person gets the sentence, where to see it and a person", async () => {
    const parent = await asParent();
    const conv = await openConversation(parent, { language: "en" });
    const f = fake("The total outstanding fee for your child this term is ₹16,000.");
    const out = await ask(parent, conv.id, { text: "How much fee is still due for my child this term?" }, f.deps);
    expect(out.answer.verdict).toBe("ANSWER_DISCARDED");
    expect(out.answer.text).toBe("I could not answer that from your records.\n\nWhere to see it: /parent/fees");
    expect(out.answer.text).not.toContain("16,000");
    expect(out.answer.askPerson).not.toBeNull();
    // The fee door was read as the person, and the model was given its figures, not ₹16,000.
    const prompt = f.calls.find((c) => c.messages[0]!.content.startsWith("You are Vidura"))!;
    expect(prompt.messages[1]!.content).toContain("₹12,500");
    expect(prompt.messages[1]!.content).not.toContain("16,000");
    // Code found it: the answer's classifier was never asked.
    expect(f.calls.filter((c) => c.messages[0]!.content.startsWith("You classify")).length).toBe(1);
    const row = await db.assistantMessage.findFirstOrThrow({ where: { conversationId: conv.id, role: "ASSISTANT" }, select: { verdict: true, gateReasons: true, scope: true, mode: true } });
    expect(row).toEqual({ verdict: "ANSWER_DISCARDED", gateReasons: "FIGURE", scope: "RECORDS", mode: null });
  });

  it("passes the figure and the date the door holds, in Latin or Devanagari digits", async () => {
    const parent = await asParent();
    const fee = await db.feeDemand.findFirstOrThrow({ where: { schoolId: ids.school, status: "OPEN", student: { guardianships: { some: { parentUserId: ids.parent } } } }, orderBy: { dueDate: "asc" }, select: { netPaise: true, paidPaise: true, dueDate: true } });
    const rupees = ((fee.netPaise - fee.paidPaise) / 100).toLocaleString("en-IN");
    const [y, m, d] = fee.dueDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).split("-").map(Number) as [number, number, number];
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1];
    for (const answer of [`₹${rupees} is still due, by ${d} ${month} ${y}.`, `Rs. ${rupees.replace(/,/g, "")}/- is still due.`]) {
      const conv = await openConversation(parent, { language: "en" });
      const out = await ask(parent, conv.id, { text: "How much fee is still due for my child?" }, fake(answer).deps);
      expect(out.answer.verdict, answer).toBe("ANSWERED");
      expect(out.answer.text).toContain(answer);
    }
    const conv = await openConversation(parent, { language: "hi" });
    const devanagari = `₹${rupees}`.replace(/\d/g, (x) => "०१२३४५६७८९"[Number(x)]!);
    const out = await ask(parent, conv.id, { text: "मेरे बच्चे की कितनी फ़ीस बाकी है?" }, fake(`आपके बच्चे की ${devanagari} फ़ीस बाकी है।`).deps);
    expect(out.answer.verdict).toBe("ANSWERED");
    const wrong = await ask(parent, (await openConversation(parent, { language: "hi" })).id, { text: "मेरे बच्चे की कितनी फ़ीस बाकी है?" }, fake("आपके बच्चे की ₹१६,००० फ़ीस बाकी है।").deps);
    expect(wrong.answer.verdict).toBe("ANSWER_DISCARDED");
    expect(wrong.answer.text).toBe("मैं आपके रिकॉर्ड से इसका उत्तर नहीं दे सका।\n\nकहाँ देखें: /parent/fees");
  });
});

/* -------------------------------------------------------------------------- */
/* 2. The check                                                                */
/* -------------------------------------------------------------------------- */

const SUMMARY = [
  "child.demands: 2 rows; by status: PAID 1, OPEN 1; total outstanding in rupees: ₹12,500; total net in rupees: ₹1,27,500; dueDateKey from 15 July 2026 to 15 December 2026",
  "  - label: Term 2; dueDateKey: 15 December 2026; net in rupees: ₹12,500; status: OPEN; lines: 3",
  "items: 3 rows; by status: ISSUED 3",
  "child.year.name: 2026–27",
  "attendance: 18 of 20 days; percent: 90",
  "cgpa: 8.47",
].join("\n");

describe("2. the figures an answer states against the data's", () => {
  const set = figureSet([SUMMARY], [{ demands: [{ outstandingPaise: 1_250_000, paidAt: "2026-07-10T05:30:00.000Z", lines: [{ grossPaise: 50_000 }] }] }]);
  const bad = (answer: string, question = "") => unsupportedFigures(answer, set, question).map((f) => `${f.kind} ${f.written}`);

  it("amounts: ₹, Rs and rupees, Indian and Western grouping, the rows' paise as rupees, lakh", () => {
    expect(bad("₹12,500 is still due.")).toEqual([]);
    expect(bad("Rs 12500/- is still due, and 12,500 rupees is the Term 2 fee.")).toEqual([]);
    expect(bad("The year's fee is ₹127,500 (₹1.275 lakh).")).toEqual([]);
    expect(bad("The exam line is ₹500.")).toEqual([]);
    expect(bad("₹16,000 is still due.")).toEqual(["AMOUNT ₹16,000"]);
    expect(bad("16,000 is still due.")).toEqual(["AMOUNT 16,000"]);
    expect(bad("Rs. 15,000.00 was paid.")).toEqual(["AMOUNT Rs. 15,000.00"]);
  });

  it("Devanagari digits are the same figures", () => {
    expect(latinDigits("₹१२,५००")).toBe("₹12,500");
    expect(bad("आपके बच्चे की ₹१२,५०० फ़ीस बाकी है।")).toEqual([]);
    expect(bad("तुमच्या मुलाची १२,५०० रुपये फी बाकी आहे.")).toEqual([]);
    expect(bad("आपके बच्चे की ₹१६,००० फ़ीस बाकी है।")).toEqual(["AMOUNT ₹16,000"]);
  });

  it("dates: the data's in any form the model writes them, and no other", () => {
    expect(bad("It is due on 15 December 2026.")).toEqual([]);
    expect(bad("It is due on December 15, 2026, and was paid on 10 July.")).toEqual([]);
    expect(bad("Due 15/12/2026 (2026-12-15), for the year 2026-27.")).toEqual([]);
    expect(bad("It is due on १५ डिसेंबर २०२६.")).toEqual([]);
    expect(bad("It is due on 16 December 2026.")).toEqual(["DATE 2026-12-16"]);
    expect(bad("It is due on 30 November.")).toEqual(["DATE 11-30"]);
    expect(bad("For the year 2025–26.")).toEqual(["DATE 2025–26"]);
  });

  it("counts: digits and words, only the data's; one the question named may be said back", () => {
    expect(bad("You have 3 books issued.")).toEqual([]);
    expect(bad("You have three books issued.")).toEqual([]);
    expect(bad("You have two books issued, and 18 of 20 days present.")).toEqual([]);
    expect(bad("You have four books issued.")).toEqual(["COUNT four"]);
    expect(bad("You have 7 books issued.")).toEqual(["COUNT 7"]);
    // "one" is an article as often as a count, and is not read.
    expect(bad("The one due in December is Term 2.")).toEqual([]);
    expect(bad("In Grade 9, 3 books are issued.", "How many books are issued in Grade 9?")).toEqual([]);
    expect(bad("In Grade 9, 3 books are issued.")).toEqual(["COUNT 9"]);
    // An amount is never the question's to give.
    expect(bad("Yes, ₹16,000 is due.", "Is ₹16,000 due?")).toEqual(["AMOUNT ₹16,000"]);
    // A decimal at the precision written: 8.47 may be 8.5.
    expect(bad("Your CGPA is 8.5.")).toEqual([]);
    expect(bad("Your CGPA is 8.6.")).toEqual(["COUNT 8.6"]);
  });

  it("not figures: a percentage, a page path, a citation mark, a clock time, a code", () => {
    expect(bad("Attendance is 75% (or 76 per cent, ७७ प्रतिशत) [4]; see /bulletin/2025/42 at 10:30 am, paper PHY301.")).toEqual([]);
    // Zero is the data's when it says none (or no, or ₹0), and only then.
    expect(bad("Nothing is due; ₹0 this term.")).toEqual(["AMOUNT ₹0"]);
    expect(unsupportedFigures("Nothing is due; ₹0 this term.", figureSet(["child.demands: none"]))).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* 3. The window that shows nothing due                                        */
/* -------------------------------------------------------------------------- */

describe("3. a window in which the rows show nothing due", () => {
  const NOW = new Date("2026-10-18T06:30:00Z");
  const calendar = { today: "2026-10-18", terms: [{ id: "t1", n: 1, from: "2026-06-01", to: "2026-11-13" }, { id: "t2", n: 2, from: "2026-11-14", to: "2027-04-30" }] };
  const thisTerm = hintsOf("How much fee is still due for my child this term?", NOW, calendar);
  const demand = (label: string, due: string, net: number, paid: number) => ({ id: label, label, dueDateKey: due, grossPaise: net, concessionPaise: 0, netPaise: net, paidPaise: paid, outstandingPaise: net - paid, status: paid >= net ? "PAID" : "OPEN", overdue: false, lines: [] });
  const fees = (demands: ReturnType<typeof demand>[]) => ({ child: { demands, totals: { outstandingPaise: demands.reduce((s, d) => s + d.outstandingPaise, 0) }, payments: [{ id: "p1", amountPaise: 1_500_000, method: "CASH", status: "PAID", paidAt: "2026-07-10T05:30:00.000Z" }] } });

  it("gives the window's own totals and says nothing is due, in a fixed sentence, when its rows owe nothing", () => {
    expect((thisTerm.window as TimeWindow).label).toBe("THIS_TERM");
    const s = summariseDoor(fees([demand("Term 1", "2026-07-15", 1_500_000, 1_500_000), demand("Term 2", "2026-12-15", 1_250_000, 0)]), { door: "/api/v1/fees/family", hints: thisTerm, question: "How much fee is still due for my child this term?", firstNumber: 1 });
    expect(s.text).toContain("total outstanding in rupees: ₹12,500");
    expect(s.text).toContain("total outstanding in rupees in this term: ₹0");
    expect(s.text).toContain(windowNothingDue("this term"));
    // The payments are not dues: no such sentence on their line.
    expect(s.text.split("\n").find((l) => l.startsWith("child.payments"))).not.toContain("nothing is due");
  });

  it("says no such thing when a row of the window is still owed, or when no window was asked", () => {
    const owed = summariseDoor(fees([demand("Term 1", "2026-07-15", 1_500_000, 1_000_000), demand("Term 2", "2026-12-15", 1_250_000, 0)]), { door: "/api/v1/fees/family", hints: thisTerm, question: "q", firstNumber: 1 });
    expect(owed.text).toContain("total outstanding in rupees in this term: ₹5,000");
    expect(owed.text).not.toContain("nothing is due");
    const none = summariseDoor(fees([demand("Term 1", "2026-07-15", 1_500_000, 1_500_000)]), { door: "/api/v1/fees/family", hints: hintsOf("How much fee is still due?", NOW, calendar), question: "q", firstNumber: 1 });
    expect(none.text).not.toContain("nothing is due");
  });

  it("reads the payment calendar's paise as rupees, and its statuses for what is owed", () => {
    const rows = [
      { date: "2026-07-15", title: "Term 1", amount: 1_500_000, status: "PAID", kind: "INSTALMENT", demandId: "d1" },
      { date: "2026-12-15", title: "Term 2", amount: 1_250_000, status: "UPCOMING", kind: "INSTALMENT", demandId: "d2" },
    ];
    const s = summariseDoor({ todayKey: "2026-10-18", rows }, { door: "/api/v1/family/fees/calendar", hints: thisTerm, question: "q", firstNumber: 1 });
    expect(s.text).toContain("amount in rupees: ₹15,000");
    expect(s.text).not.toContain("1500000");
    expect(s.text).toContain(windowNothingDue("this term"));
    const upcoming = summariseDoor({ todayKey: "2026-10-18", rows }, { door: "/api/v1/family/fees/calendar", hints: hintsOf("what fee is due next term", NOW, calendar), question: "q", firstNumber: 1 });
    expect(upcoming.text).not.toContain("nothing is due");
  });

  it("the discard's sentence and its reason are in the three languages", () => {
    expect([en.assistantService.recordsFigure, hi.assistantService.recordsFigure, mr.assistantService.recordsFigure]).toEqual(["I could not answer that from your records.", "मैं आपके रिकॉर्ड से इसका उत्तर नहीं दे सका।", "तुमच्या नोंदींवरून मला याचे उत्तर देता आले नाही."]);
    expect([en.viduraOps.reason.FIGURE, hi.viduraOps.reason.FIGURE, mr.viduraOps.reason.FIGURE].every((x) => typeof x === "string" && x.length > 0)).toBe(true);
  });
});
