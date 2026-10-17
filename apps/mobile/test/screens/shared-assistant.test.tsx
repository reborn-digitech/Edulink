import { AccessibilityInfo, Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ASSISTANT_NOT_FOR, MENU } from "@/lib/nav";
import { FamilyAssistantCard, citationTarget, shortAnswer, shortBlocks, SHORT_ANSWER } from "@/screens/shared/assistant";
import { ViduraHost, ViduraSheet, viduraAccess } from "@/screens/shared/vidura";
import { WEB_HOME, webPageFor } from "@/lib/links";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITED_ROLES } from "@edulink/contracts";
import { countQueued } from "@/lib/outbox";
import { allowed, type Doc } from "../contract/role-matrix";
import { callsInSource } from "../lib/api-catalog.test";
import { json, mountStaff, offline, type Answer } from "./staff-harness";

/**
 * Vidura on the phone (Phase C, 10 Oct 2026; Vidura pass 1, 17 Oct 2026): the round button above the tab bar and the
 * bottom sheet it opens, reading the web's doors, per role — the first screen in the role's terms (a guardian's with
 * the way to the opt-out), three suggested questions, the mode for the next question, short answers by default drawn
 * from their restricted Markdown, a refusal as Vidura's own line with "Ask a person" and nothing to retry, "Go on" for
 * a cut answer, the citations, the offline state (no offline tutor), the history inside the sheet, and the guardian's
 * switch per child.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const STATUS = { available: true, reason: null, help: true, tutor: true, language: "en", dailyCap: 40, usedToday: 0, retentionDays: 30, optOutPath: null, modes: ["USING", "RECORDS", "LEARNING"] };
const AT = "2026-10-10T04:00:00.000Z";
const CONVERSATION = { id: "zz-c", language: "en", createdAt: AT, lastAt: AT, title: "ZZ explain Newton's third law", messageCount: 2, expiresAt: "2026-11-09T04:00:00.000Z" };
const BOOK = { kind: "CURRICULUM", n: 1, board: "NCERT", book: "Science: Exploration", grade: "9", chapter: "6", section: "6.6", page: 87, sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", chunkId: "zz-chunk" } as const;
const HELP = { kind: "HELP", n: 2, title: "People", pagePath: "/admin/people", entryId: "zz-help" } as const;
const message = (over: Record<string, unknown>) => ({ id: "zz-a", role: "ASSISTANT", text: "ZZ answer", createdAt: AT, citations: [], verdict: "ANSWERED", mode: "HELP", hint: false, helpful: null, chip: "USING", cut: false, askPerson: null, ...over });
const question = (over: Record<string, unknown> = {}) => message({ id: "zz-q", role: "USER", text: "ZZ q", verdict: null, mode: null, chip: null, ...over });
const LONG = `ZZ Every action has an equal and opposite reaction. ${"When you push a wall, the wall pushes you back with the same force. ".repeat(8)}That is the third law [1].`;
const SUGGESTIONS = { suggestions: [{ text: "How do I hand in my work?", mode: null }, { text: "How do I see my timetable?", mode: null }] };
const answers = (over: Record<string, Answer> = {}, status: Record<string, unknown> = {}): Record<string, Answer> => ({
  "GET /api/v1/assistant": () => json({ ...STATUS, ...status }),
  "GET /api/v1/assistant/conversations": () => json({ conversations: [CONVERSATION], retentionDays: 30 }),
  "GET /api/v1/assistant/suggestions": () => json(SUGGESTIONS),
  "POST /api/v1/assistant/conversations": () => json(CONVERSATION),
  ...over,
});
const sheet = (props: Partial<Parameters<typeof ViduraSheet>[0]> = {}) => <ViduraSheet visible plan={false} conversationId={null} page={null} onClose={jest.fn()} {...props} />;

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
});

describe("Vidura's sheet, per role", () => {
  it("a student: the first screen names the tutor, three suggestions ask at a press, and the history opens one in the sheet", async () => {
    const { calls } = await mountStaff(
      sheet({ page: "/student/assignments" }),
      "STUDENT",
      answers({
        "POST /api/v1/assistant/conversations/zz-c/messages": () => json({ conversationId: "zz-c", question: question({ text: "How do I hand in my work?" }), answer: message({ text: "### Steps\n1. Open /student/assignments [1].\n2. Press **Hand it in**.", citations: [HELP] }) }),
        "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [question({ id: "zz-q0" }), message({ id: "zz-a0" })] }),
      }),
    );
    expect(await screen.findByText(/^• It also explains topics from your textbooks/)).toBeTruthy();
    expect(screen.getByText(/^• A conversation is the unit\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open your settings" })).toBeNull();
    // The page the sheet is beside goes with the suggestions and the question (page awareness).
    await fireEvent.press(await screen.findByRole("button", { name: "How do I hand in my work?" }));
    expect(await screen.findByText("Steps")).toBeTruthy();
    expect(screen.getByText("Hand it in")).toBeTruthy();
    expect(screen.getByTestId("vidura-chip")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("GET /api/v1/assistant/suggestions"))?.line).toBe("GET /api/v1/assistant/suggestions?page=%2Fstudent%2Fassignments");
    expect(calls().find((c) => c.line === "POST /api/v1/assistant/conversations/zz-c/messages")?.body).toEqual({ text: "How do I hand in my work?", page: "/student/assignments" });
    await fireEvent.press(screen.getByRole("button", { name: "Your conversations" }));
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ explain Newton's third law/ }));
    expect(await screen.findByText("ZZ answer")).toBeTruthy();
  });

  it("a mode picked goes with the next question only", async () => {
    const { calls } = await mountStaff(
      sheet(),
      "STUDENT",
      answers({
        "POST /api/v1/assistant/conversations/zz-c/messages": (() => {
          let n = 0;
          return () => {
            n += 1;
            return json({ conversationId: "zz-c", question: question({ id: `zz-q${n}`, text: "ZZ what is a lever" }), answer: message({ id: `zz-a${n}`, text: "ZZ A lever is a bar [1].", chip: "LEARNING", mode: "TUTOR", citations: [BOOK] }) });
          };
        })(),
      }),
    );
    await fireEvent.press(await screen.findByRole("radio", { name: "Learning" }));
    await fireEvent.changeText(screen.getByLabelText("Your question"), "ZZ what is a lever");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByLabelText("Answered as: Learning")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Your question"), "ZZ and a pulley");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/assistant/conversations/zz-c/messages")).toHaveLength(2));
    const bodies = calls().filter((c) => c.line === "POST /api/v1/assistant/conversations/zz-c/messages").map((c) => c.body);
    expect(bodies).toEqual([{ text: "ZZ what is a lever", mode: "LEARNING" }, { text: "ZZ and a pulley" }]);
  });

  it("a guardian: platform help only, the way to the opt-out; a topic question gets the one sentence with 'Ask a person', nothing to retry", async () => {
    const sentence = "ZZ The tutor is for students and teachers; I can help you find your way around Shalaghar.";
    const onClose = jest.fn();
    const { calls } = await mountStaff(
      sheet({ onClose }),
      "PARENT",
      answers(
        {
          "POST /api/v1/assistant/conversations/zz-c/messages": () => json({ conversationId: "zz-c", question: question({ text: "explain photosynthesis" }), answer: message({ text: sentence, verdict: "TUTOR_NOT_FOR_ROLE", mode: null, chip: null, askPerson: { who: "CLASS_TEACHER", schoolId: "s1", userId: "zz-t" } }) }),
          "POST /api/v1/shared/conversations": () => json({ conversationId: "zz-room", created: true }),
        },
        { tutor: false, optOutPath: "/parent/settings#assistant", modes: ["USING", "RECORDS"] },
      ),
    );
    expect(await screen.findByText(/^• Questions about topics are for students and teachers/)).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Learning" })).toBeNull();
    expect(screen.getByText(/^• Your children can use it too/)).toBeTruthy();
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    announce.mockClear();
    await fireEvent.changeText(screen.getByLabelText("Your question"), "explain photosynthesis");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(sentence)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ask again" })).toBeNull();
    // Told once, the whole answer (other parts of the screen may announce their own things).
    expect(announce.mock.calls.filter(([said]) => String(said).startsWith("Vidura answered"))).toEqual([[`Vidura answered: ${sentence}`]]);
    announce.mockRestore();
    // "Ask a person": the room with the class teacher, through the messaging door; nothing of the question carried.
    await fireEvent.press(screen.getByRole("button", { name: "Ask your class teacher" }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: "zz-room" } }));
    expect(calls().find((c) => c.line === "POST /api/v1/shared/conversations")?.body).toEqual({ schoolId: "s1", userId: "zz-t" });
    expect(onClose).toHaveBeenCalled();
  });

  it("a cut answer offers 'Go on', which continues it", async () => {
    let n = 0;
    const { calls } = await mountStaff(
      sheet(),
      "TEACHER",
      answers({
        "POST /api/v1/assistant/conversations/zz-c/messages": () => {
          n += 1;
          return n === 1
            ? json({ conversationId: "zz-c", question: question({ text: "ZZ explain levers" }), answer: message({ id: "zz-a1", text: "ZZ part one", cut: true, chip: "LEARNING" }) })
            : json({ conversationId: "zz-c", question: question({ id: "zz-q2", text: "Go on" }), answer: message({ id: "zz-a2", text: "ZZ part two", chip: "LEARNING" }) });
          // (the first turn's ids are zz-q and zz-a1)
        },
      }),
    );
    await fireEvent.changeText(await screen.findByLabelText("Your question"), "ZZ explain levers");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("The answer stopped at its length limit.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Go on" }));
    expect(await screen.findByText("ZZ part two")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/assistant/conversations/zz-c/messages")[1]?.body).toEqual({ text: "Go on", goOn: true });
    expect(screen.queryByRole("button", { name: "Go on" })).toBeNull();
  });

  it("an answer is short by default, whole on request, with its sources and 'was this helpful'", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(
      sheet({ conversationId: "zz-c" }),
      "TEACHER",
      answers({
        "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [question({ text: "ZZ explain Newton's third law" }), message({ text: LONG, citations: [BOOK, HELP], mode: "TUTOR", chip: "LEARNING" })] }),
        "POST /api/v1/assistant/conversations/zz-c/feedback": () => json({ messageId: "zz-a", helpful: true }),
      }),
    );
    const cut = shortAnswer(LONG);
    expect(cut.cut).toBe(true);
    expect(await screen.findByText(cut.text.replace(" [1]", ""), { exact: false })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Show the whole answer" }));
    expect(screen.getByText(/That is the third law/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "[1] NCERT · Science: Exploration, chapter 6, section 6.6, page 87" }));
    expect(open).toHaveBeenCalledWith("https://ncert.nic.in/textbook/pdf/iesc106.pdf#page=87");
    await fireEvent.press(screen.getByRole("button", { name: "[2] People" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/people" });
    await fireEvent.press(screen.getByRole("button", { name: "Was this helpful? Yes" }));
    expect(await screen.findByText("Thank you for saying.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/assistant/conversations/zz-c/feedback")?.body).toEqual({ messageId: "zz-a", helpful: true });
    open.mockRestore();
  });

  it.each(["STUDENT", "PARENT"])("%s: a book's citation is text, never a link off the platform; a help entry still opens its page", async (role) => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(
      sheet({ conversationId: "zz-c" }),
      role as never,
      answers({ "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [question(), message({ text: "ZZ short", citations: [BOOK, HELP], mode: "TUTOR", chip: "LEARNING" })] }) }),
    );
    expect(await screen.findByText("[1] NCERT · Science: Exploration, chapter 6, section 6.6, page 87")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^\[1\]/ })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "[2] People" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/people" });
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("a conversation is deleted after a second press, and the sheet goes back to the history", async () => {
    const { calls } = await mountStaff(
      sheet({ conversationId: "zz-c" }),
      "TEACHER",
      answers({
        "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [question(), message({})] }),
        "DELETE /api/v1/assistant/conversations/zz-c": () => json({ conversationId: "zz-c", deleted: true }),
      }),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Delete this conversation" }));
    expect(calls().some((c) => c.line.startsWith("DELETE"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Delete it" }));
    expect(await screen.findByText("The last thirty days. A conversation is deleted thirty days after it was last used.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "DELETE /api/v1/assistant/conversations/zz-c")).toHaveLength(1);
  });

  it("offline: Vidura says it needs a connection, and nothing is queued", async () => {
    const { calls } = await mountStaff(sheet(), "STUDENT", answers({ "GET /api/v1/assistant": offline }));
    expect(await screen.findByText("You are offline")).toBeTruthy();
    expect(screen.getByText(/nothing is answered on this phone by itself/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Ask again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/assistant").length).toBe(2));
  });

  it("a question that cannot reach Vidura is offered again; a cap's refusal is its sentence", async () => {
    let reach = 0;
    await mountStaff(
      sheet(),
      "STUDENT",
      answers({
        "POST /api/v1/assistant/conversations/zz-c/messages": () => {
          reach += 1;
          if (reach === 1) throw new TypeError("Network request failed");
          return json({ error: "ZZ You have asked today's questions.", code: "RATE_LIMITED" }, 429);
        },
      }),
    );
    await fireEvent.changeText(await screen.findByLabelText("Your question"), "ZZ what is a lever");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("You are offline")).toBeTruthy();
    // No offline tutor: the question is not put in the outbox to be sent later.
    expect(await countQueued()).toBe(0);
    await fireEvent.press(screen.getByRole("button", { name: "Ask again" }));
    expect(await screen.findByText("ZZ You have asked today's questions.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("when the door says no (a guardian's opt-out), it says why and offers no box", async () => {
    await mountStaff(sheet(), "STUDENT", answers({}, { available: false, reason: "OPTED_OUT" }));
    expect(await screen.findByTestId("assistant-unavailable")).toBeTruthy();
    expect(screen.queryByLabelText("Your question")).toBeNull();
  });

  it("where the plan is missing, the sheet says so and leads to the account's plan; no door is read", async () => {
    const onClose = jest.fn();
    const { calls } = await mountStaff(sheet({ plan: true, onClose }), "STUDENT", answers());
    expect(await screen.findByText("Vidura comes with a plan")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "See the plan" }));
    expect(onClose).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
    expect(calls().filter((c) => c.line.startsWith("GET /api/v1/assistant"))).toHaveLength(0);
  });
});

describe("the round button", () => {
  it("opens the sheet from any screen, and is not drawn where Vidura is not the person's", async () => {
    await mountStaff(
      <ViduraHost access="open" home="/student">
        <></>
      </ViduraHost>,
      "STUDENT",
      answers(),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Ask Vidura" }));
    expect(await screen.findByTestId("vidura-sheet")).toBeTruthy();
  });

  it("is decided by the operator's switch, the school's module and the plan, never for an expert or a recruiter", () => {
    const base = { active: { schoolId: "s1", role: "STUDENT" as const, membershipId: "m1" }, modules: ["ASSISTANT" as const], features: ["ASSISTANT" as const], locked: [] };
    expect(viduraAccess(base as never)).toBe("open");
    expect(viduraAccess({ ...base, locked: ["ASSISTANT"] } as never)).toBe("plan");
    expect(viduraAccess({ ...base, features: [] } as never)).toBeNull();
    expect(viduraAccess({ ...base, modules: [] } as never)).toBeNull();
    for (const role of ASSISTANT_NOT_FOR) expect(viduraAccess({ ...base, active: { ...base.active, role } } as never)).toBeNull();
    expect(viduraAccess(null)).toBeNull();
  });

  it("is no longer in More for any role", () => {
    for (const [role, items] of Object.entries(MENU)) expect({ role, has: items.some((i) => i.screen === "/(app)/assistant") }).toEqual({ role, has: false });
  });

  it("tells Vidura the web page a screen stands for (page awareness), the home tab the role's home", () => {
    expect(webPageFor("/", WEB_HOME.STUDENT!)).toBe("/student");
    expect(webPageFor("/payslips", "/teacher")).toBe("/account/payslips");
    expect(webPageFor("/no-such-screen", "/teacher")).toBeNull();
  });
});

describe("every role that has the button", () => {
  const roles = Object.keys(MENU).filter((role) => !ASSISTANT_NOT_FOR.includes(role as never));
  it.each(roles)("%s: the first screen in the role's terms, from the status door", async (role) => {
    const tutor = ["STUDENT", "TEACHER", "FACULTY", "HOD"].includes(role);
    await mountStaff(sheet(), role as never, answers({}, { tutor, optOutPath: role === "PARENT" ? "/parent/settings#assistant" : null, modes: tutor ? ["USING", "RECORDS", "LEARNING"] : ["USING", "RECORDS"] }));
    expect(await screen.findByText(/^• Vidura answers questions about using Shalaghar/)).toBeTruthy();
    expect(screen.queryByText(/^• It also explains topics from your textbooks/) !== null).toBe(tutor);
    expect(screen.queryByText(/^• Questions about topics are for students and teachers/) !== null).toBe(!tutor);
    expect(screen.queryByRole("button", { name: "Open your settings" }) !== null).toBe(role === "PARENT");
    expect(screen.queryByRole("radio", { name: "Learning" }) !== null).toBe(tutor);
    expect(screen.getByLabelText("Your question")).toBeTruthy();
  });
});

describe("the pieces", () => {
  it("cuts a long answer at a sentence and keeps a short one whole", () => {
    expect(shortAnswer("ZZ short.")).toEqual({ text: "ZZ short.", cut: false });
    const cut = shortAnswer(LONG);
    expect(cut.text.length).toBeLessThanOrEqual(SHORT_ANSWER + 1);
    expect(cut.text.endsWith(".…")).toBe(true);
  });

  it("cuts a long answer at a block: a heading and its first list, never half a table", () => {
    const text = `### Steps\n1. Open /student/assignments.\n2. Press Hand it in.\n\n| Month | Due |\n|---|---|\n${"| ZZ month | ₹2,000 |\n".repeat(30)}`;
    const short = shortBlocks(text);
    expect(short.cut).toBe(true);
    expect(short.blocks.map((b) => b.kind)).toEqual(["heading", "list"]);
    expect(shortBlocks("ZZ short.").cut).toBe(false);
  });

  it("opens a book only for staff and only over https, and a help entry in the app or on the web for everyone, never off the platform", () => {
    for (const role of ["TEACHER", "FACULTY", "HOD", "ADMIN", "PRINCIPAL"]) expect(citationTarget(BOOK, role)).toEqual({ kind: "url", url: "https://ncert.nic.in/textbook/pdf/iesc106.pdf#page=87" });
    for (const role of ["STUDENT", "PARENT", "LIBRARIAN", null]) expect(citationTarget(BOOK, role)).toBeNull();
    expect(citationTarget({ ...BOOK, sourceUrl: "http://ncert.nic.in/x.pdf" }, "TEACHER")).toBeNull();
    expect(citationTarget({ ...BOOK, sourceUrl: null }, "TEACHER")).toBeNull();
    expect(citationTarget(HELP, "STUDENT")).toEqual({ kind: "screen", target: { pathname: "/(app)/people" } });
    expect(citationTarget({ ...HELP, pagePath: "/admin/report-cards" }, "PARENT")).toEqual({ kind: "web", path: "/admin/report-cards" });
    expect(citationTarget({ ...HELP, pagePath: "//evil.example" }, "TEACHER")).toBeNull();
  });

  it("opens a LINK citation (the data questions: one of the person's own posts, circulars or threads) on the platform as a help entry is, never off it", () => {
    const LINK = { kind: "LINK", n: 4, title: "Circular from your school, 22 Sept 2026", pagePath: "/bulletin/zz-post", rowId: "zz-post" } as const;
    expect(citationTarget(LINK, "PARENT")).toEqual({ kind: "screen", target: { pathname: "/(app)/post", params: { postId: "zz-post" } } });
    expect(citationTarget({ ...LINK, pagePath: "/remarks/c/zz-room" }, "STUDENT")).toEqual({ kind: "screen", target: { pathname: "/(app)/messages/room", params: { conversationId: "zz-room" } } });
    expect(citationTarget({ ...LINK, pagePath: "/remarks/people?role=staff", rowId: null }, "PARENT")).toEqual({ kind: "screen", target: { pathname: "/(app)/people", params: { role: "staff" } } });
    expect(citationTarget({ ...LINK, pagePath: "https://evil.example/x" }, "PARENT")).toBeNull();
    expect(citationTarget({ ...LINK, pagePath: "//evil.example" }, "PARENT")).toBeNull();
  });
});

describe("a guardian's switch per child", () => {
  it("lists each child with a switch, a school with it off as a line, and turns it off for one", async () => {
    const { calls } = await mountStaff(<FamilyAssistantCard />, "PARENT", {
      "GET /api/v1/family/assistant": () => json({ children: [{ childId: "zz-k1", name: "ZZ Asha", schoolOn: true, optedOut: false, changedAt: null }, { childId: "zz-k2", name: "ZZ Ravi", schoolOn: false, optedOut: false, changedAt: null }] }),
      "POST /api/v1/family/assistant/opt-out": () => json({ childId: "zz-k1", optedOut: true, changedAt: AT }),
    });
    const asha = await screen.findByRole("switch", { name: "ZZ Asha may use Vidura" });
    expect(asha).toBeChecked();
    expect(screen.getByText("ZZ Ravi's school has Vidura switched off.")).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "ZZ Ravi may use Vidura" })).toBeNull();
    await fireEvent.press(asha);
    expect(await screen.findByText("Vidura is turned off for ZZ Asha.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/family/assistant/opt-out")?.body).toEqual({ childId: "zz-k1", optedOut: true });
  });
});

describe("the x-access matrix for Vidura's doors", () => {
  const doc = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "api", "openapi.json"), "utf8")) as Doc & { paths: Record<string, Record<string, { "x-module"?: string }>> };
  const LIMITED = [...LIMITED_ROLES] as string[];
  const want = (method: "get" | "post" | "delete", path: string, role: string) => allowed(doc.paths[path]![method] as never, role, LIMITED);

  it("draws the button for exactly the roles every door the sheet calls opens to", () => {
    const calls = callsInSource().filter((c) => (c.where.endsWith("shared/assistant.tsx") || c.where.endsWith("shared/vidura.tsx")) && c.path.startsWith("/api/v1/assistant"));
    expect(new Set(calls.map((c) => `${c.method} ${c.path}`))).toEqual(
      new Set([
        "GET /api/v1/assistant",
        "GET /api/v1/assistant/conversations",
        "GET /api/v1/assistant/conversations/x",
        "GET /api/v1/assistant/suggestions",
        "POST /api/v1/assistant/conversations",
        "POST /api/v1/assistant/conversations/x/messages",
        "DELETE /api/v1/assistant/conversations/x",
        "POST /api/v1/assistant/conversations/x/feedback",
      ]),
    );
    const doors: ["get" | "post" | "delete", string][] = [
      ["get", "/api/v1/assistant"],
      ["get", "/api/v1/assistant/conversations"],
      ["get", "/api/v1/assistant/suggestions"],
      ["post", "/api/v1/assistant/conversations"],
      ["get", "/api/v1/assistant/conversations/{conversationId}"],
      ["delete", "/api/v1/assistant/conversations/{conversationId}"],
      ["post", "/api/v1/assistant/conversations/{conversationId}/messages"],
      ["post", "/api/v1/assistant/conversations/{conversationId}/feedback"],
    ];
    for (const role of Object.keys(MENU)) {
      const drawn = !ASSISTANT_NOT_FOR.includes(role as never);
      for (const [method, path] of doors) expect({ role, door: `${method} ${path}`, opens: want(method, path, role) === "2xx" }).toEqual({ role, door: `${method} ${path}`, opens: drawn });
    }
    // Asking is behind the module the button is behind; reading one's own conversations is not, so a school that switches it off leaves them readable until they age out.
    expect(doc.paths["/api/v1/assistant/conversations/{conversationId}/messages"]!.post!["x-module"]).toBe("ASSISTANT");
  });

  it("gives the guardian's switch to a guardian alone", () => {
    for (const role of Object.keys(MENU)) expect({ role, opens: want("get", "/api/v1/family/assistant", role) === "2xx" }).toEqual({ role, opens: role === "PARENT" });
  });
});
