/**
 * THE SMALL ITEMS OF THE LOOSE-ENDS AND FIGURE PASSES (18 October 2026). Each failing without its fix:
 *
 *   F-11  the website editor's columns follow the editor's own width, the form never under 30rem at three columns;
 *   F-12  the operator's /root/vidura-review carries the strip of Vidura's desks, the app admin's copy does not;
 *   F-13  a help answer's marks and its sources run 1, 2, 3 together, a mark whose source was dropped going with it;
 *   F-14  the operator's trial of a standard answer reads a guide passage as its whole section, steps in order;
 *   6     a fee question naming a window reads the fee door (the ledger) first, on zz.parent01's real fixture;
 *   7     the payment calendar's total counts each due once, not once more per reminder (₹27,500, not ₹77,500);
 *   8     DATA_RULES gives the shape of a total, never a figure the model could copy.
 *
 * F-10 (the plan's end date) is proved in tests/passes.test.ts beside the passes it reads.
 *
 * Reads the ZZ fixture and the help index; writes only zz.parent01's conversations, usage rows and "zz-walk" sessions
 * it makes, removed afterwards (the usage rows put back as they were).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { familyFeeCalendarSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, openConversation, previewAnswer, wholeSections, type AssistantDeps } from "@/lib/assistant/service";
import { chooseDoors, runDoors, type RunInput } from "@/lib/assistant/router";
import { renumberCitations } from "@/lib/assistant/gate";
import { hintsOf, type DataContext } from "@/lib/assistant/doors";
import { summariseDoor, windowNothingDue } from "@/lib/assistant/summary";
import { DATA_RULES } from "@/lib/assistant/prompt";
import { DOOR_SCOPE_THRESHOLD } from "@/lib/assistant/config";
import { guideSection, type HelpHit } from "@/lib/assistant-retrieval";
import { buildCalendar, calendarTotalPaise, paymentCalendar } from "@/lib/fees-family";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";
import type { ChatMessage, ChatOptions, ChatResult } from "@/lib/assistant-model";

const db = new PrismaClient();
const started = new Date();
const NOW = new Date("2026-10-18T06:00:00Z");
const ids = { parent: "", school: "" };
let usageBefore: Awaited<ReturnType<typeof db.assistantUsage.findMany>> = [];
const SRC = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

async function asParent(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({ "user-agent": "zz-walk" });
  await createSession(ids.parent, { schoolId: ids.school, role: "PARENT" as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

const door = (path: string, similarity: number): HelpHit => ({ entryId: `door-${path}`, kind: "door", title: path, text: `GET ${path}`, pagePath: null, door: `GET ${path}`, module: null, roles: [], language: "en", sourceFile: "catalog", commit: "test", similarity, vectorRank: 1, keywordRank: 1, score: 1 });
/** As the walk found them for "this term": the schedule doors above the ledger, the report cards listing among them. */
const FEE_HITS = [door("/api/v1/family/fees/plans", 0.85), door("/api/v1/family/fees/calendar", 0.841), door("/api/v1/fees/family", 0.821), door("/api/v1/family/report-cards", 0.79)];
const calendar = { today: "2026-10-18", terms: [{ id: "t1", n: 1, from: "2026-06-01", to: "2026-11-13" }, { id: "t2", n: 2, from: "2026-11-14", to: "2027-04-30" }] };

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

/** A fake model writing `answer`, the searches given; the doors read for real unless replaced. */
function fake(answer: string, over: Partial<AssistantDeps> = {}) {
  const calls: { messages: ChatMessage[]; opts: ChatOptions }[] = [];
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages, opts): Promise<ChatResult> => {
      calls.push({ messages, opts });
      const base = { usage: { promptTokens: 100, completionTokens: 10 }, tokensPerSecond: null, promptTokensPerSecond: null };
      if (messages[0]!.content.startsWith("You classify")) return { ...base, content: "PLATFORM", firstTokenLogprob: 0 };
      return { ...base, content: answer, firstTokenLogprob: null, finishReason: "stop" };
    },
    searchHelp: async () => [],
    searchCurriculum: async () => [],
    runDoors: (input) => runDoors(input),
    publish: () => {},
    now: () => new Date(),
    ...over,
  };
  return { deps, calls };
}

describe("F-11: the website editor's columns", () => {
  it("are set by the editor's own width: three only when the form keeps 30rem, the preview giving way first", () => {
    const src = SRC("src/app/(app)/admin/website/editor/site-editor.tsx");
    expect(src).toContain('<div className="@container">');
    expect(src).toContain("@min-[60rem]:grid-cols-[15rem_minmax(30rem,1fr)_minmax(0,1.1fr)]");
    expect(src).not.toMatch(/xl:grid-cols-\[15rem_minmax\(0,1fr\)_/);
  });
});

describe("F-12: the strip of Vidura's desks", () => {
  it("is on every operator desk the strip names, the review page's operator copy included, and not on the app admin's", () => {
    const nav = SRC("src/components/vidura-ops/ops-nav.tsx");
    const desks = [...nav.matchAll(/href: "(\/root\/vidura-[a-z-]+)"/g)].map((m) => m[1]!);
    expect(desks).toHaveLength(5);
    const review = SRC("src/components/vidura-review/review-page.tsx");
    for (const desk of desks) {
      const page = desk === "/root/vidura-review" ? review : SRC(`src/app${desk}/page.tsx`);
      expect(page, desk).toContain(`<ViduraOpsNav current="${desk}"`);
    }
    expect(review).toContain('base === "/root/vidura-review" ? <ViduraOpsNav');
  });
});

describe("F-13: the marks and the sources run 1, 2, 3", () => {
  const help = (n: number) => ({ kind: "HELP" as const, n, title: `t${n}`, pagePath: "/teacher/attendance", entryId: `e${n}` });

  it("renumbers [1], [4], [5] as [1], [2], [3], the sources with them, in the order first cited", () => {
    const out = renumberCitations("Open the page [1].\n1. Mark [4].\n2. Pick [5], then again [4].", [help(1), help(4), help(5)]);
    expect(out.body).toBe("Open the page [1].\n1. Mark [2].\n2. Pick [3], then again [2].");
    expect(out.citations.map((c) => [c.n, c.entryId])).toEqual([[1, "e1"], [2, "e4"], [3, "e5"]]);
    const later = renumberCitations("First [5], then [2].", [help(2), help(5)]);
    expect(later.body).toBe("First [1], then [2].");
    expect(later.citations.map((c) => c.entryId)).toEqual(["e5", "e2"]);
  });

  it("drops a middle source that was dropped after numbering: its mark goes, the rest close up", () => {
    // Row 7 was cited but not kept (another role's page): the answer may not point at nothing, nor skip from 1 to 3.
    const out = renumberCitations("See [2], the row [7] and [9].", [help(2), help(9)]);
    expect(out.body).toBe("See [1], the row and [2].");
    expect(out.citations.map((c) => c.n)).toEqual([1, 2]);
  });

  it("keeps the prompt's numbers for a part 'Go on' may continue, still taking out a mark with no source", () => {
    const out = renumberCitations("See [2], [7] and [9].", [help(2), help(9)], { keepNumbers: true });
    expect(out.body).toBe("See [2], and [9].");
    expect(out.citations.map((c) => c.n)).toEqual([2, 9]);
  });

  it("through the service: a help answer citing passages 1, 4 and 5 is shown as 1, 2 and 3", async () => {
    const hits: HelpHit[] = [1, 2, 3, 4, 5].map((n) => ({ entryId: `h${n}`, kind: "nav", title: `Passage ${n}`, text: `Open /teacher/attendance and press Mark ${n}.`, pagePath: "/teacher/attendance", door: null, module: null, roles: [], language: "en", sourceFile: "nav", commit: "test", similarity: 0.9, vectorRank: n, keywordRank: n, score: 1 / n }));
    const f = fake("Open /teacher/attendance [1].\n### Steps\n1. **Mark**: press Mark [4].\n2. **Save**: press Mark [5].", { searchHelp: async (q) => (q.kinds?.includes("door") ? [] : hits) });
    const out = await previewAnswer({ role: "TEACHER", question: "How do I mark today's attendance for my class?", language: "en" }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    expect(out.text).toContain("press Mark [2]");
    expect(out.text).toContain("press Mark [3]");
    expect(out.text).not.toMatch(/\[[45]\]/);
    expect(out.citations.map((c) => [c.n, c.kind === "HELP" ? c.entryId : null])).toEqual([[1, "h1"], [2, "h4"], [3, "h5"]]);
  });
});

describe("F-14: a standard answer is written from the guide's whole section", () => {
  it("reads a guide step back with its section, in order (the help index's own rows for the teacher's attendance)", async (t) => {
    // The help index is built by npm run help:index through the embedding server, which CI does not have (1 Nov 2026):
    // without its rows this case is skipped, not failed; the dev database holds them.
    if ((await db.helpEntry.count({ where: { kind: "doc", language: "en", sourceFile: "docs/guide/teacher.md" } })) === 0) return t.skip();
    const step = await db.helpEntry.findFirst({ where: { kind: "doc", language: "en", sourceFile: "docs/guide/teacher.md", text: { startsWith: "Pick the class." } }, select: { kind: true, title: true, sourceFile: true, language: true } });
    expect(step, "the help index holds the teacher's guide").not.toBeNull();
    const whole = await guideSection(step!, { db });
    expect(whole).not.toBeNull();
    const at = (s: string) => whole!.text.indexOf(s);
    expect(at("Open `/teacher/attendance`")).toBeGreaterThanOrEqual(0);
    expect(at("Pick the class.")).toBeGreaterThan(at("Open `/teacher/attendance`"));
    expect(at('Press "Mark all')).toBeGreaterThan(at("Pick the class."));
    expect(await guideSection({ ...step!, kind: "nav" }, { db })).toBeNull();
  });

  it("gives each section once, in the hits' order, and leaves other passages as they are", async () => {
    const hit = (id: string, kind: string, title: string): HelpHit => ({ entryId: id, kind, title, text: `${id} alone`, pagePath: "/teacher/attendance", door: null, module: null, roles: [], language: "en", sourceFile: "docs/guide/teacher.md", commit: "t", similarity: 0.9, vectorRank: 1, keywordRank: 1, score: 1 });
    const out = await wholeSections([hit("a", "nav", "Attendance"), hit("b", "doc", "S"), hit("c", "doc", "S"), hit("d", "doc", "Lone")], async (h) => (h.title === "S" ? { key: "S", text: "step 1\nstep 2" } : null));
    expect(out.map((h) => [h.entryId, h.text])).toEqual([["a", "a alone"], ["b", "step 1\nstep 2"], ["d", "d alone"]]);
  });

  it("the trial passes the section reader, so the stored answer is written from it; the drawer's own answers do not", () => {
    expect(SRC("src/lib/assistant/standard.ts")).toContain("helpSection: deps.helpSection ?? ((hit) => guideSection(hit, { db }))");
    expect(SRC("src/lib/assistant/service.ts")).not.toMatch(/helpSection:\s*\(hit\)/);
  });
});

describe("6. a fee question naming a window reads the ledger", () => {
  const parentCtx: DataContext = { role: "PARENT", membershipId: null, children: [{ id: "c1", className: "3 A" }], childId: "c1", duties: [], now: NOW };

  it("puts the fee door first when the schedule doors rank above it for 'this term'; leaves the rank alone without a window", () => {
    const term = chooseDoors({ hits: FEE_HITS, language: "en", ctx: parentCtx, hints: hintsOf("How much fee is still due for my child this term?", NOW, calendar) });
    expect(term[0]!.door).toBe("/api/v1/fees/family");
    expect(term.filter((c) => c.door === "/api/v1/fees/family")).toHaveLength(1);
    const plain = chooseDoors({ hits: FEE_HITS, language: "en", ctx: parentCtx, hints: hintsOf("How much fee is still due for my child?", NOW, calendar) });
    expect(plain.map((c) => c.door).slice(0, 3)).toEqual(["/api/v1/family/fees/plans", "/api/v1/family/fees/calendar", "/api/v1/fees/family"]);
  });

  it("on zz.parent01's fixture: the fee door is read first and the prompt says nothing is due in this term, from the ledger", async () => {
    const parent = await asParent();
    const conv = await openConversation(parent, { language: "en" });
    let chosen: string[] = [];
    const f = fake("Nothing is due for your child this term: ₹0.", {
      searchHelp: async (q) => (q.kinds?.includes("door") ? FEE_HITS.map((h) => ({ ...h, similarity: Math.max(h.similarity!, DOOR_SCOPE_THRESHOLD + 0.1) })) : []),
      runDoors: (input: RunInput) => {
        chosen = input.chosen.map((c) => c.door);
        return runDoors(input);
      },
      // The clock pinned to the walk's day, inside the fixture's Term 1 (paid in full): on the real clock the window
      // moved on 14 November 2026 into Term 2, whose ₹12,500 due on 15 December is owed, and the case went red.
      now: () => NOW,
    });
    const out = await ask(parent, conv.id, { text: "How much fee is still due for my child this term?" }, f.deps);
    expect(chosen[0]).toBe("/api/v1/fees/family");
    const prompt = f.calls.find((c) => c.messages[0]!.content.startsWith("You are Vidura"))!.messages[1]!.content;
    const first = prompt.slice(prompt.indexOf('<data n="1"'), prompt.indexOf("</data>") + 7);
    expect(first).toContain("total outstanding in rupees: ₹12,500");
    expect(first).toContain(windowNothingDue("this term"));
    expect(out.answer.verdict).toBe("ANSWERED");
    expect(out.answer.text).toContain("Where to see it: /parent/fees");
  });
});

describe("7. the payment calendar's total counts each due once", () => {
  const demand = (id: string, label: string, dueDateKey: string, net: number, paid: number) => ({ id, label, dueDateKey, grossPaise: net, concessionPaise: 0, netPaise: net, paidPaise: paid, outstandingPaise: net - paid, status: paid >= net ? "PAID" : "OPEN", overdue: false, lines: [] });
  const rows = buildCalendar({
    instalments: [
      { id: "i1", label: "Term 1", dueDateKey: "2026-07-15", totalPaise: 1_500_000 },
      { id: "i2", label: "Term 2", dueDateKey: "2026-12-15", totalPaise: 1_250_000 },
    ],
    demands: [demand("d1", "Term 1", "2026-07-15", 1_500_000, 1_500_000), demand("d2", "Term 2", "2026-12-15", 1_250_000, 0)],
    demandInstalment: new Map([["d1", "i1"], ["d2", "i2"]]),
    today: "2026-10-18",
  });

  it("sums the instalments and dues, never the reminders that repeat them (₹27,500, not ₹77,500)", () => {
    expect(rows.filter((r) => r.kind === "REMINDER")).toHaveLength(4);
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(7_750_000);
    expect(calendarTotalPaise(rows)).toBe(2_750_000);
  });

  it("Vidura's summary of the calendar totals the same way, the window's too", () => {
    const s = summariseDoor({ todayKey: "2026-10-18", rows, totalPaise: calendarTotalPaise(rows) }, { door: "/api/v1/family/fees/calendar", hints: hintsOf("what fee is due next term", NOW, calendar), question: "q", firstNumber: 1 });
    expect(s.text).toContain("total amount in rupees: ₹27,500");
    expect(s.text).not.toContain("77,500");
    expect(s.text).toContain("total amount in rupees in next term: ₹12,500");
  });

  it("on zz.parent01's child: the door's own total is the year's dues once each, and the contract keeps it", async () => {
    const parent = await asParent();
    const child = await db.guardianship.findFirst({ where: { parentUserId: ids.parent, studentSchoolId: ids.school, status: "ACTIVE" }, select: { studentMembershipId: true }, orderBy: { createdAt: "asc" } });
    const cal = await paymentCalendar(parent, child!.studentMembershipId);
    expect(cal.totalPaise).toBe(calendarTotalPaise(cal.rows));
    expect(cal.totalPaise).toBe(cal.rows.filter((r) => r.kind !== "REMINDER").reduce((s, r) => s + r.amount, 0));
    expect(familyFeeCalendarSchema.parse(cal).totalPaise).toBe(cal.totalPaise);
  });

  it("the page's line is in the three languages", () => {
    for (const d of [en, hi, mr]) expect(d.fees.calendarTotal).toContain("{amount}");
    expect(hi.fees.calendarTotal.endsWith("।")).toBe(true);
    expect(mr.fees.calendarTotal.endsWith(".")).toBe(true);
    expect(SRC("src/app/(app)/parent/fees/page.tsx")).toContain('t("fees.calendarTotal", { amount: money(calendar.totalPaise) })');
  });
});

describe("8. DATA_RULES shows the shape of a total, not a figure", () => {
  it("holds no amount, and still tells the model to copy the code's totals", () => {
    const rules = DATA_RULES.join("\n");
    expect(rules).not.toMatch(/₹\s?\d/);
    expect(rules).not.toContain("16,000");
    expect(rules).toContain("₹<amount>");
    expect(rules).toContain("never count rows yourself and never add up amounts yourself");
  });
});
