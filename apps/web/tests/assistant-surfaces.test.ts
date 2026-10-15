/**
 * The assistant's surfaces, Phase C (10 Oct 2026; docs/plans/assistant.md section 5): the web panel and page, the
 * office's card, the family's opt-out and the teacher's switch, against Phase B's doors (packages/contracts
 * v1/assistant.ts). Rendered to markup with the real dictionaries, the doors answered by a fake fetch; the shell's and
 * the menus' wiring read from the files and the NAV as they are. The gates themselves (who is refused what, and the
 * fixed sentences) are Phase B's suites; here: that the surfaces show what the doors say the way the plan asks.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AssistantMessage, AssistantStatus, AssistantUsage } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ push() {}, refresh() {} }), usePathname: () => "/student" }));

import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { ToastProvider } from "@/components/ui/toast";
import { AssistantChat, FailureLine, MessageBubble } from "@/components/assistant/chat";
import { UsageBody, budgetPercent, USAGE_COUNTS } from "@/components/assistant/usage-card";
import { __setAssistantFetch, askQuestion, call, openConversation, sendFeedback } from "@/components/assistant/doors";
import {
  ASSISTANT_DOORS,
  announcement,
  citationHref,
  citationLabel,
  firstScreenKeys,
  isFixedSentence,
  streamIdle,
  streamReduce,
  streamText,
} from "@/components/assistant/model";
import { ASSISTANT_HREF, ASSISTANT_NOT_FOR, NAV } from "@/lib/nav";
import { APP_SEGMENTS, modulePagePermitted } from "@/lib/role-gate";
import { ROLE_HOME, type Role } from "@/lib/constants";

const t = translator("en");
const hi = translator("hi");
const mr = translator("mr");
const wrap = (node: React.ReactElement, locale: "en" | "hi" | "mr" = "en") =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale, href: dictionaryAsset(locale).href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, node)));
const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const STUDENT: AssistantStatus = { available: true, reason: null, help: true, tutor: true, language: "en", dailyCap: 40, usedToday: 2, retentionDays: 30, optOutPath: null };
const PARENT: AssistantStatus = { ...STUDENT, tutor: false, optOutPath: "/parent/settings#assistant" };
const ADMIN: AssistantStatus = { ...STUDENT, tutor: false };

const msg = (over: Partial<AssistantMessage>): AssistantMessage => ({ id: "zz-m", role: "ASSISTANT", text: "ZZ answer", createdAt: "2026-10-10T04:00:00.000Z", citations: [], verdict: "ANSWERED", mode: "HELP", hint: false, helpful: null, ...over });
const BOOK = { kind: "CURRICULUM" as const, n: 1, board: "NCERT", book: "Science: Exploration", grade: "9", chapter: "6", section: "6.6", page: 87, sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", chunkId: "zz-chunk" };
const HELP = { kind: "HELP" as const, n: 2, title: "People", pagePath: "/admin/people", entryId: "zz-help" };

describe("the question box clears as the question is sent (10 October 2026)", () => {
  const web = readFileSync(join(process.cwd(), "src", "components", "assistant", "chat.tsx"), "utf8");
  const phone = readFileSync(join(process.cwd(), "..", "mobile", "src", "screens", "shared", "assistant.tsx"), "utf8");
  it("on the web the box is emptied before the door is called and refilled on a failure", () => {
    expect(web.indexOf('setQuestion("")')).toBeLessThan(web.indexOf("openConversation(locale)"));
    expect(web.match(/setQuestion\(q\);/g)?.length).toBe(2);
  });
  it("on the phone the same", () => {
    expect(phone.indexOf('setQuestion("")')).toBeLessThan(phone.indexOf('api().post("/api/v1/assistant/conversations"'));
    expect(phone.match(/setQuestion\(q\);/g)?.length).toBe(2);
  });
});

describe("the first screen says what the assistant is for, the conversation as the unit, and a family's opt-out", () => {
  it("names the tutor for a student, platform help only for the office and a guardian, and the opt-out for a guardian only", () => {
    expect(firstScreenKeys(STUDENT)).toEqual(["assistantUi.firstHelp", "assistantUi.firstTutor", "assistantUi.firstNotGeneral", "assistantUi.firstConversation", "assistantUi.firstKept"]);
    expect(firstScreenKeys(ADMIN)).toContain("assistantUi.firstHelpOnly");
    expect(firstScreenKeys(ADMIN)).not.toContain("assistantUi.firstFamily");
    expect(firstScreenKeys(PARENT)).toEqual(["assistantUi.firstHelp", "assistantUi.firstHelpOnly", "assistantUi.firstNotGeneral", "assistantUi.firstConversation", "assistantUi.firstKept", "assistantUi.firstFamily"]);
  });

  it("draws it in an empty conversation, with the guardian's link to the opt-out and the box to ask", () => {
    const html = decode(wrap(React.createElement(AssistantChat, { status: PARENT, role: "PARENT" })));
    expect(html).toContain(t("assistantUi.firstTitle"));
    expect(html).toContain(t("assistantUi.firstConversation"));
    expect(html).toContain(t("assistantUi.firstHelpOnly"));
    expect(html).not.toContain(t("assistantUi.firstTutor"));
    expect(html).toContain(t("assistantUi.firstFamily"));
    expect(html).toMatch(/href="\/parent\/settings#assistant"/);
    expect(html).toMatch(/<textarea[^>]*name="question"[^>]*maxLength="1200"/);
    const student = decode(wrap(React.createElement(AssistantChat, { status: STUDENT, role: "STUDENT" })));
    expect(student).toContain(t("assistantUi.firstTutor"));
    expect(student).not.toContain(t("assistantUi.firstFamilyLink"));
  });

  it("says it in Hindi and Marathi with the house's full stops", () => {
    const h = wrap(React.createElement(AssistantChat, { status: PARENT, role: "PARENT" }), "hi");
    expect(h).toContain(hi("assistantUi.firstConversation"));
    expect(hi("assistantUi.firstConversation").endsWith("।")).toBe(true);
    const m = wrap(React.createElement(AssistantChat, { status: PARENT, role: "PARENT" }), "mr");
    expect(m).toContain(mr("assistantUi.firstConversation"));
    expect(mr("assistantUi.firstConversation").endsWith(".")).toBe(true);
    expect(mr("assistantUi.cardSwitch")).toContain("शाळे");
    expect(mr("assistantUi.cardSwitch")).not.toContain("स्कूल");
  });

  it("offers no box when the door says the person may not ask, and says why", () => {
    const html = decode(wrap(React.createElement(AssistantChat, { status: { ...PARENT, available: false, reason: "OPTED_OUT" }, role: "PARENT" })));
    expect(html).not.toContain("<textarea");
    expect(html).toContain('data-testid="assistant-unavailable"');
  });
});

describe("an answer, a refusal and a hint, as drawn", () => {
  it("links a book's citation to the publisher's chapter for staff only, never for a pupil or a guardian; a help entry links on the platform for everyone", () => {
    for (const role of ["TEACHER", "FACULTY", "HOD", "ADMIN", "PRINCIPAL"]) expect({ role, link: citationHref(BOOK, role) }).toEqual({ role, link: { href: "https://ncert.nic.in/textbook/pdf/iesc106.pdf#page=87", external: true } });
    for (const role of ["STUDENT", "PARENT", "LIBRARIAN", "ALUMNUS", null]) expect({ role, link: citationHref(BOOK, role) }).toEqual({ role, link: null });
    for (const role of ["STUDENT", "PARENT", "TEACHER"]) expect(citationHref(HELP, role)).toEqual({ href: "/admin/people", external: false });
    // Only https off the platform, only a path on it.
    expect(citationHref({ ...BOOK, sourceUrl: "http://ncert.nic.in/x.pdf" }, "TEACHER")).toBeNull();
    expect(citationHref({ ...BOOK, sourceUrl: "javascript:alert(1)" }, "TEACHER")).toBeNull();
    expect(citationHref({ ...BOOK, sourceUrl: null }, "TEACHER")).toBeNull();
    expect(citationHref({ ...HELP, pagePath: "//evil.example/x" }, "STUDENT")).toBeNull();
    expect(citationHref({ ...HELP, pagePath: "https://evil.example" }, "STUDENT")).toBeNull();
    expect(citationLabel(BOOK, t)).toBe(t("assistantUi.citationSection", { book: "NCERT · Science: Exploration", chapter: "6", section: "6.6", page: 87 }));
    expect(citationLabel({ ...BOOK, board: "Balbharati (Maharashtra State Bureau of Textbook Production and Curriculum Research)", book: "Science 7" }, t)).toBe(t("assistantUi.citationSection", { book: "Balbharati · Science 7", chapter: "6", section: "6.6", page: 87 }));
    expect(citationLabel({ ...BOOK, section: null }, t)).toBe(t("assistantUi.citation", { book: "NCERT · Science: Exploration", chapter: "6", page: 87 }));
    const message = msg({ citations: [BOOK, HELP], mode: "TUTOR", text: "ZZ every action has an equal and opposite reaction [1]" });
    const teacher = decode(wrap(React.createElement(MessageBubble, { message, conversationId: "zz-c", role: "TEACHER", t })));
    expect(teacher).toMatch(/<a href="https:\/\/ncert\.nic\.in\/textbook\/pdf\/iesc106\.pdf#page=87" target="_blank" rel="noopener noreferrer"/);
    expect(teacher).toContain(t("assistantUi.citationOpens"));
    for (const role of ["STUDENT", "PARENT"]) {
      const html = decode(wrap(React.createElement(MessageBubble, { message, conversationId: "zz-c", role, t })));
      expect(html).toContain(`[1] ${citationLabel(BOOK, t)}`);
      expect(html).not.toContain("ncert.nic.in");
      expect(html).not.toContain(t("assistantUi.citationOpens"));
      expect(html).toMatch(/<a [^>]*href="\/admin\/people"/);
      expect(html.match(/<a /g)?.length).toBe(1);
    }
    expect(teacher).toContain(t("assistantUi.helpful"));
  });

  it("shows a refusal as the assistant's own line, the server's sentence, with no 'ask again' beside it", () => {
    const sentence = "ZZ The tutor is for students and teachers; I can help you find your way around Shalaghar.";
    const refusal = msg({ verdict: "TUTOR_NOT_FOR_ROLE", mode: null, text: sentence });
    expect(isFixedSentence(refusal)).toBe(true);
    expect(isFixedSentence(msg({ verdict: "ANSWERED" }))).toBe(false);
    expect(isFixedSentence(msg({ verdict: "HINT", hint: true }))).toBe(false);
    for (const verdict of ["OUT_OF_SCOPE", "SELF_HARM", "INJECTION", "ANSWER_DISCARDED", "MODEL_UNAVAILABLE"] as const) expect(isFixedSentence(msg({ verdict }))).toBe(true);
    const html = decode(wrap(React.createElement(MessageBubble, { message: refusal, conversationId: "zz-c", role: "TEACHER", t })));
    expect(html).toContain(sentence);
    expect(html).toContain('data-verdict="TUTOR_NOT_FOR_ROLE"');
    expect(html).toContain('data-fixed="true"');
    expect(html).not.toContain(t("assistantUi.retry"));
    expect(html).not.toContain(t("common.retry"));
    expect(html).not.toContain('role="alert"');
  });

  it("marks a hint and says how the worked answer comes", () => {
    const html = decode(wrap(React.createElement(MessageBubble, { message: msg({ verdict: "HINT", hint: true, mode: "TUTOR" }), conversationId: "zz-c", role: "TEACHER", t })));
    expect(html).toContain('data-testid="assistant-hint"');
    expect(html).toContain(t("assistantUi.hintNote"));
  });

  it("thanks instead of asking once an answer was rated", () => {
    const html = decode(wrap(React.createElement(MessageBubble, { message: msg({ helpful: true }), conversationId: "zz-c", role: "TEACHER", t })));
    expect(html).toContain(t("assistantUi.helpfulThanks"));
    expect(html).not.toContain('data-testid="assistant-helpful"');
  });

  it("offers to ask again only when the assistant was not reached; a door's refusal is its own sentence", () => {
    const down = decode(renderToStaticMarkup(React.createElement(FailureLine, { failure: { ok: false, status: 0, error: "" }, t, asked: true, onRetry: () => undefined })));
    expect(down).toContain(t("assistantUi.failed"));
    expect(decode(renderToStaticMarkup(React.createElement(FailureLine, { failure: { ok: false, status: 502, error: "" }, t, onRetry: () => undefined })))).toContain(t("assistantUi.notReached"));
    expect(down).toContain(t("assistantUi.retry"));
    const capped = decode(renderToStaticMarkup(React.createElement(FailureLine, { failure: { ok: false, status: 429, error: "ZZ You have asked today's questions.", code: "RATE_LIMITED" }, t, onRetry: () => undefined })));
    expect(capped).toContain("ZZ You have asked today's questions.");
    expect(capped).not.toContain(t("assistantUi.retry"));
  });
});

describe("the streamed answer and the screen reader", () => {
  it("places the checked pieces by their seq, ignores another conversation, and is told the stage", () => {
    let s = streamIdle("zz-c");
    s = streamReduce(s, { type: "assistant.stage", conversationId: "zz-c", stage: "CHECKING" });
    expect(s.stage).toBe("CHECKING");
    s = streamReduce(s, { type: "assistant.delta", conversationId: "zz-c", messageId: "m", seq: 1, text: "world" });
    s = streamReduce(s, { type: "assistant.delta", conversationId: "zz-c", messageId: "m", seq: 0, text: "hello " });
    s = streamReduce(s, { type: "assistant.delta", conversationId: "zz-c", messageId: "m", seq: 0, text: "hello " });
    s = streamReduce(s, { type: "assistant.delta", conversationId: "zz-other", messageId: "n", seq: 2, text: "!!" });
    expect(streamText(s)).toBe("hello world");
    expect(streamReduce(s, { type: "assistant.done", conversationId: "zz-c", messageId: "m", verdict: "ANSWERED" }).done).toBe(true);
  });

  it("speaks once per answer, the whole answer, from one polite status region that starts empty", () => {
    expect(announcement(msg({ text: "ZZ whole" }), t)).toBe(t("assistantUi.announce", { answer: "ZZ whole" }));
    expect(announcement(msg({ role: "USER" }), t)).toBe("");
    const html = wrap(React.createElement(AssistantChat, { status: STUDENT, role: "STUDENT", conversationId: "zz-c", messages: [msg({ id: "q", role: "USER", verdict: null, text: "ZZ q" }), msg({ id: "a" })] }));
    expect(html.match(/aria-live=/g)?.length).toBe(1);
    expect(html).toMatch(/<p role="status" aria-live="polite" aria-atomic="true" class="sr-only" data-testid="assistant-announce"><\/p>/);
  });
});

describe("the doors the panel calls", () => {
  it("opens with the reader's language, asks with the text, rates an answer, and answers status 0 when not reached", async () => {
    const seen: { url: string; method: string; body: unknown }[] = [];
    __setAssistantFetch((async (url: string, init: RequestInit) => {
      seen.push({ url, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : undefined });
      if (url.endsWith("/messages")) return new Response(JSON.stringify({ error: "ZZ cap", code: "RATE_LIMITED" }), { status: 429 });
      return new Response(JSON.stringify({ id: "zz-c" }), { status: 200 });
    }) as unknown as typeof fetch);
    expect(await openConversation("mr")).toEqual({ ok: true, data: { id: "zz-c" } });
    expect(await askQuestion("zz-c", "ZZ q")).toEqual({ ok: false, status: 429, error: "ZZ cap", code: "RATE_LIMITED" });
    await sendFeedback("zz-c", "zz-m", false);
    expect(seen).toEqual([
      { url: ASSISTANT_DOORS.conversations, method: "POST", body: { language: "mr" } },
      { url: "/api/v1/assistant/conversations/zz-c/messages", method: "POST", body: { text: "ZZ q" } },
      { url: "/api/v1/assistant/conversations/zz-c/feedback", method: "POST", body: { messageId: "zz-m", helpful: false } },
    ]);
    __setAssistantFetch((async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch);
    expect(await call("GET", ASSISTANT_DOORS.status)).toEqual({ ok: false, status: 0, error: "" });
    __setAssistantFetch(null);
  });
});

describe("the office's card: counts only, the switch and the helpline", () => {
  const usage: AssistantUsage = { on: true, platformOn: true, month: "2026-10", questions: 120, answered: 90, hints: 6, refused: 24, counsellorRoutes: 1, helpful: 30, notHelpful: 4, people: 41, tokens: 360000, tokenBudget: 1000000, dailyCapPerPerson: 40, helplineText: null, helplineDefault: "ZZ Tele-MANAS 14416", retentionDays: 30 };

  it("shows the month against the budget and every count, with the form for the office", () => {
    expect(budgetPercent(usage)).toBe(36);
    expect(budgetPercent({ tokens: 5, tokenBudget: 0 })).toBe(0);
    expect(budgetPercent({ tokens: 2_000_000, tokenBudget: 1_000_000 })).toBe(100);
    const html = decode(wrap(React.createElement(UsageBody, { usage, canEdit: true, t })));
    expect(html).toContain(t("assistantUi.cardUsed", { used: "3,60,000", budget: "10,00,000", percent: 36 }));
    for (const [, key] of USAGE_COUNTS) expect(html).toContain(t(key));
    expect(html).toMatch(/aria-valuenow="36"/);
    expect(html).toContain(t("assistantUi.cardSwitch"));
    expect(html).toMatch(/<textarea[^>]*name="helplineText"[^>]*maxLength="300"[^>]*placeholder="ZZ Tele-MANAS 14416"/);
    expect(html).not.toContain(t("assistantUi.cardKilled"));
  });

  it("gives the head the counts without the form, and says when the platform's switch is thrown", () => {
    const html = decode(wrap(React.createElement(UsageBody, { usage: { ...usage, platformOn: false }, canEdit: false, t })));
    expect(html).toContain(t("assistantUi.cardKilled"));
    expect(html).not.toContain(t("assistantUi.cardSwitch"));
    expect(html).not.toContain("<form");
  });
});

describe("where the surfaces hang", () => {
  const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
  const SCHOOL_ROLES = (Object.keys(ROLE_HOME) as Role[]).filter((r) => !ASSISTANT_NOT_FOR.includes(r));

  it("gives every role that belongs to a school one menu entry behind the module, and none to an expert or a recruiter", () => {
    for (const role of SCHOOL_ROLES) {
      const entries = NAV[role].filter((i) => i.href === ASSISTANT_HREF);
      expect({ role, entries: entries.length, module: entries[0]?.module }).toEqual({ role, entries: 1, module: "ASSISTANT" });
    }
    for (const role of ASSISTANT_NOT_FOR) expect(NAV[role].some((i) => i.href === ASSISTANT_HREF)).toBe(false);
    expect(APP_SEGMENTS).toContain("assistant");
  });

  it("opens the page to a module role while the school has the assistant on, and not while it is off", () => {
    expect(modulePagePermitted("LIBRARIAN", "/assistant", ["LIBRARY", "ASSISTANT"])).toBe(true);
    expect(modulePagePermitted("LIBRARIAN", "/assistant/zz-c", ["LIBRARY", "ASSISTANT"])).toBe(true);
    expect(modulePagePermitted("LIBRARIAN", "/assistant", ["LIBRARY"])).toBe(false);
    expect(modulePagePermitted("FACULTY", "/assistant", ["ACADEMICS", "ASSISTANT"])).toBe(true);
  });

  it("puts the launcher in the shell for whoever's menu has the entry, and the panel once, not on the assistant's own page", () => {
    const shell = read("src/components/nav/app-shell.tsx");
    expect(shell).toContain("const assistant = items.some((item) => item.href === ASSISTANT_HREF) && !pathname.startsWith(ASSISTANT_HREF);");
    expect(shell.match(/data-testid="assistant-launcher(-rail)?"/g)?.length).toBe(2);
    expect(shell.match(/<AssistantPanel /g)?.length).toBe(1);
    const panel = read("src/components/assistant/panel.tsx");
    expect(panel).toContain('role="dialog"');
    expect(panel).toContain('aria-modal="true"');
    expect(panel).toContain('aria-labelledby="assistant-panel-title"');
    expect(panel).toContain('event.key === "Escape"');
  });

  it("puts the office's card on /admin, the opt-out on the family's settings and the switch on the teacher's and the faculty's assignment", () => {
    expect(read("src/app/(app)/admin/page.tsx")).toContain('{(await mayUse("ASSISTANT", ctx)) && <AssistantUsageCard canEdit />}');
    expect(read("src/app/(app)/parent/settings/page.tsx")).toContain('{(await mayUse("ASSISTANT", session)) && <FamilyAssistantCard />}');
    expect(read("src/components/assistant/family-card.tsx")).toContain('<Card id="assistant"');
    // …each drawn only while the platform's ASSISTANT feature is on (15 Oct 2026; src/lib/platform-features.ts).
    expect(read("src/app/(app)/teacher/assignments/[assignmentId]/page.tsx")).toContain('{ctx.role === "TEACHER" && (await mayUse("ASSISTANT", ctx)) && <AssignmentAssistantSwitch assignmentId={assignment.id} />}');
    expect(read("src/app/(app)/faculty/work/[assignmentId]/page.tsx")).toContain('{(await mayUse("ASSISTANT", ctx)) && <AssignmentAssistantSwitch assignmentId={a.id} />}');
  });
});

describe("the only limit is the daily cap (12 October 2026)", () => {
  it("the monthly budget is off by default and the card says so without a bar", () => {
    const card = readFileSync(join(process.cwd(), "src", "components", "assistant", "usage-card.tsx"), "utf8");
    expect(card).toMatch(/usage\.tokenBudget > 0 \? t\("assistantUi\.cardUsed"/);
    expect(card).toMatch(/assistantUi\.cardUsedNoBudget/);
    const config = readFileSync(join(process.cwd(), "src", "lib", "assistant", "config.ts"), "utf8");
    expect(config).toMatch(/MONTHLY_TOKEN_BUDGET_DEFAULT = 0;/);
    expect(config).toMatch(/DAILY_QUESTION_CAP_DEFAULT = 20;/);
    const service = readFileSync(join(process.cwd(), "src", "lib", "assistant", "service.ts"), "utf8");
    expect(service).toMatch(/budget > 0 && totals\.tokens >= budget/);
  });
});

