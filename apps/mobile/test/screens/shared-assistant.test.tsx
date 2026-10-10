import { AccessibilityInfo, Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ASSISTANT_NOT_FOR, ASSISTANT_ENTRY, MENU, menuFor } from "@/lib/nav";
import { Assistant, FamilyAssistantCard, citationTarget, shortAnswer, SHORT_ANSWER } from "@/screens/shared/assistant";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITED_ROLES } from "@edulink/contracts";
import { countQueued } from "@/lib/outbox";
import { allowed, type Doc } from "../contract/role-matrix";
import { callsInSource } from "../lib/api-catalog.test";
import { json, mountStaff, offline, type Answer } from "./staff-harness";

/**
 * The assistant on the phone (Phase C, 10 Oct 2026): the screen under More reading the web's doors, per role — the
 * first screen in the role's terms (a guardian's with the way to the opt-out), short answers by default, a refusal as
 * the assistant's own line with nothing to retry, the citations, the offline state (no offline tutor), a conversation
 * re-read and deleted, and the guardian's switch per child.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const STATUS = { available: true, reason: null, help: true, tutor: true, language: "en", dailyCap: 40, usedToday: 0, retentionDays: 30, optOutPath: null };
const AT = "2026-10-10T04:00:00.000Z";
const CONVERSATION = { id: "zz-c", language: "en", createdAt: AT, lastAt: AT, title: "ZZ explain Newton's third law", messageCount: 2, expiresAt: "2026-11-09T04:00:00.000Z" };
const BOOK = { kind: "CURRICULUM", n: 1, board: "NCERT", book: "Science: Exploration", grade: "9", chapter: "6", section: "6.6", page: 87, sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", chunkId: "zz-chunk" } as const;
const HELP = { kind: "HELP", n: 2, title: "People", pagePath: "/admin/people", entryId: "zz-help" } as const;
const message = (over: Record<string, unknown>) => ({ id: "zz-a", role: "ASSISTANT", text: "ZZ answer", createdAt: AT, citations: [], verdict: "ANSWERED", mode: "HELP", hint: false, helpful: null, ...over });
const LONG = `ZZ Every action has an equal and opposite reaction. ${"When you push a wall, the wall pushes you back with the same force. ".repeat(8)}That is the third law [1].`;
const answers = (over: Record<string, Answer> = {}, status: Record<string, unknown> = {}): Record<string, Answer> => ({
  "GET /api/v1/assistant": () => json({ ...STATUS, ...status }),
  "GET /api/v1/assistant/conversations": () => json({ conversations: [CONVERSATION], retentionDays: 30 }),
  "POST /api/v1/assistant/conversations": () => json(CONVERSATION),
  ...over,
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
});

describe("the assistant's screen, per role", () => {
  it("a student: the first screen names the tutor, the conversations of thirty days are listed and open by id", async () => {
    await mountStaff(<Assistant />, "STUDENT", answers());
    expect(await screen.findByText(/^• It also explains topics from your textbooks/)).toBeTruthy();
    expect(screen.getByText(/^• A conversation is the unit\./)).toBeTruthy();
    expect(screen.getByText(/^• Each conversation is deleted thirty days after it was last used\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open your settings" })).toBeNull();
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ explain Newton's third law/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assistant", params: { id: "zz-c" } });
  });

  it("a guardian: platform help only, and the way to the opt-out; a topic question gets the one sentence, with nothing to retry", async () => {
    const sentence = "ZZ The tutor is for students and teachers; I can help you find your way around Shalaghar.";
    const { calls } = await mountStaff(
      <Assistant />,
      "PARENT",
      answers({ "POST /api/v1/assistant/conversations/zz-c/messages": () => json({ conversationId: "zz-c", question: message({ id: "zz-q", role: "USER", text: "explain photosynthesis", verdict: null, mode: null }), answer: message({ text: sentence, verdict: "TUTOR_NOT_FOR_ROLE", mode: null }) }) }, { tutor: false, optOutPath: "/parent/settings#assistant" }),
    );
    expect(await screen.findByText(/^• Questions about topics are for students and teachers/)).toBeTruthy();
    expect(screen.queryByText(/^• It also explains topics/)).toBeNull();
    expect(screen.getByText(/^• Your children can use it too/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open your settings" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/settings" });
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    await fireEvent.changeText(screen.getByLabelText("Your question"), "explain photosynthesis");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(sentence)).toBeTruthy();
    expect(calls().filter((c) => c.line.startsWith("POST /api/v1/assistant/conversations")).map((c) => [c.line, c.body])).toEqual([
      ["POST /api/v1/assistant/conversations", { language: "en" }],
      ["POST /api/v1/assistant/conversations/zz-c/messages", { text: "explain photosynthesis" }],
    ]);
    // The assistant's own line: no alert, no "Try again", no "Ask again"; told once to a screen reader.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ask again" })).toBeNull();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(`The assistant answered: ${sentence}`);
    announce.mockRestore();
  });

  it("an answer is short by default, whole on request, with its sources and 'was this helpful'", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    mockRouter.params = { id: "zz-c" };
    const { calls } = await mountStaff(
      <Assistant />,
      "TEACHER",
      answers({
        "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [message({ id: "zz-q", role: "USER", text: "ZZ explain Newton's third law", verdict: null, mode: null }), message({ text: LONG, citations: [BOOK, HELP], mode: "TUTOR" })] }),
        "POST /api/v1/assistant/conversations/zz-c/feedback": () => json({ messageId: "zz-a", helpful: true }),
      }),
    );
    const cut = shortAnswer(LONG);
    expect(cut.cut).toBe(true);
    expect(await screen.findByText(cut.text)).toBeTruthy();
    expect(screen.queryByText(LONG)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Show the whole answer" }));
    expect(screen.getByText(LONG)).toBeTruthy();
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
    mockRouter.params = { id: "zz-c" };
    await mountStaff(
      <Assistant />,
      role as never,
      answers({ "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [message({ id: "zz-q", role: "USER", text: "ZZ q", verdict: null, mode: null }), message({ text: "ZZ short", citations: [BOOK, HELP], mode: "TUTOR" })] }) }),
    );
    expect(await screen.findByText("[1] NCERT · Science: Exploration, chapter 6, section 6.6, page 87")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^\[1\]/ })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "[2] People" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/people" });
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("a conversation is deleted after a second press, and the screen goes back to the list", async () => {
    mockRouter.params = { id: "zz-c" };
    const { calls } = await mountStaff(
      <Assistant />,
      "TEACHER",
      answers({
        "GET /api/v1/assistant/conversations/zz-c": () => json({ conversation: CONVERSATION, messages: [message({ id: "zz-q", role: "USER", text: "ZZ q", verdict: null, mode: null }), message({})] }),
        "DELETE /api/v1/assistant/conversations/zz-c": () => json({ conversationId: "zz-c", deleted: true }),
      }),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Delete this conversation" }));
    expect(calls().some((c) => c.line.startsWith("DELETE"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Delete it" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/assistant"));
    expect(calls().filter((c) => c.line === "DELETE /api/v1/assistant/conversations/zz-c")).toHaveLength(1);
  });

  it("offline: the assistant says it needs a connection, and nothing is queued", async () => {
    const { calls } = await mountStaff(<Assistant />, "STUDENT", answers({ "GET /api/v1/assistant": offline }));
    expect(await screen.findByText("You are offline")).toBeTruthy();
    expect(screen.getByText(/nothing is answered on this phone by itself/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Ask again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/assistant").length).toBe(2));
  });

  it("a question that cannot reach the assistant is offered again; a cap's refusal is its sentence", async () => {
    let reach = 0;
    await mountStaff(
      <Assistant />,
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
    await mountStaff(<Assistant />, "STUDENT", answers({}, { available: false, reason: "OPTED_OUT" }));
    expect(await screen.findByTestId("assistant-unavailable")).toBeTruthy();
    expect(screen.queryByLabelText("Your question")).toBeNull();
  });
});

describe("every role that has the screen", () => {
  const roles = Object.keys(MENU).filter((role) => !ASSISTANT_NOT_FOR.includes(role as never));
  it.each(roles)("%s: the first screen in the role's terms, from the status door", async (role) => {
    const tutor = ["STUDENT", "TEACHER", "FACULTY", "HOD"].includes(role);
    await mountStaff(<Assistant />, role as never, answers({}, { tutor, optOutPath: role === "PARENT" ? "/parent/settings#assistant" : null }));
    expect(await screen.findByText(/^• It answers questions about using Shalaghar/)).toBeTruthy();
    expect(screen.queryByText(/^• It also explains topics from your textbooks/) !== null).toBe(tutor);
    expect(screen.queryByText(/^• Questions about topics are for students and teachers/) !== null).toBe(!tutor);
    expect(screen.queryByRole("button", { name: "Open your settings" }) !== null).toBe(role === "PARENT");
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

  it("opens a book only for staff and only over https, and a help entry in the app or on the web for everyone, never off the platform", () => {
    for (const role of ["TEACHER", "FACULTY", "HOD", "ADMIN", "PRINCIPAL"]) expect(citationTarget(BOOK, role)).toEqual({ kind: "url", url: "https://ncert.nic.in/textbook/pdf/iesc106.pdf#page=87" });
    for (const role of ["STUDENT", "PARENT", "LIBRARIAN", null]) expect(citationTarget(BOOK, role)).toBeNull();
    expect(citationTarget({ ...BOOK, sourceUrl: "http://ncert.nic.in/x.pdf" }, "TEACHER")).toBeNull();
    expect(citationTarget({ ...BOOK, sourceUrl: null }, "TEACHER")).toBeNull();
    expect(citationTarget(HELP, "STUDENT")).toEqual({ kind: "screen", target: { pathname: "/(app)/people" } });
    expect(citationTarget({ ...HELP, pagePath: "/admin/report-cards" }, "PARENT")).toEqual({ kind: "web", path: "/admin/report-cards" });
    expect(citationTarget({ ...HELP, pagePath: "//evil.example" }, "TEACHER")).toBeNull();
  });

  it("is in More for every role that belongs to a school, behind the module, and not for an expert or a recruiter", () => {
    for (const [role, items] of Object.entries(MENU)) {
      const has = items.some((i) => i.screen === "/(app)/assistant");
      expect({ role, has }).toEqual({ role, has: !ASSISTANT_NOT_FOR.includes(role as never) });
    }
    expect(ASSISTANT_ENTRY.module).toBe("ASSISTANT");
    const screens = (modules: string[]) => menuFor("STUDENT", modules).flatMap((g) => g.items.map((i) => i.screen));
    expect(screens(["ASSISTANT"])).toContain("/(app)/assistant");
    expect(screens([])).not.toContain("/(app)/assistant");
  });
});

describe("a guardian's switch per child", () => {
  it("lists each child with a switch, a school with it off as a line, and turns it off for one", async () => {
    const { calls } = await mountStaff(<FamilyAssistantCard />, "PARENT", {
      "GET /api/v1/family/assistant": () => json({ children: [{ childId: "zz-k1", name: "ZZ Asha", schoolOn: true, optedOut: false, changedAt: null }, { childId: "zz-k2", name: "ZZ Ravi", schoolOn: false, optedOut: false, changedAt: null }] }),
      "POST /api/v1/family/assistant/opt-out": () => json({ childId: "zz-k1", optedOut: true, changedAt: AT }),
    });
    const asha = await screen.findByRole("switch", { name: "ZZ Asha may use the assistant" });
    expect(asha).toBeChecked();
    expect(screen.getByText("ZZ Ravi's school has the assistant switched off.")).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "ZZ Ravi may use the assistant" })).toBeNull();
    await fireEvent.press(asha);
    expect(await screen.findByText("The assistant is turned off for ZZ Asha.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/family/assistant/opt-out")?.body).toEqual({ childId: "zz-k1", optedOut: true });
  });
});

describe("the x-access matrix for the assistant's doors", () => {
  const doc = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "api", "openapi.json"), "utf8")) as Doc & { paths: Record<string, Record<string, { "x-module"?: string }>> };
  const LIMITED = [...LIMITED_ROLES] as string[];
  const want = (method: "get" | "post" | "delete", path: string, role: string) => allowed(doc.paths[path]![method] as never, role, LIMITED);

  it("lists the screen in More for exactly the roles every door it calls opens to", () => {
    const calls = callsInSource().filter((c) => c.where.endsWith("shared/assistant.tsx") && c.path.startsWith("/api/v1/assistant"));
    expect(new Set(calls.map((c) => `${c.method} ${c.path}`))).toEqual(
      new Set(["GET /api/v1/assistant", "GET /api/v1/assistant/conversations", "GET /api/v1/assistant/conversations/x", "POST /api/v1/assistant/conversations", "POST /api/v1/assistant/conversations/x/messages", "DELETE /api/v1/assistant/conversations/x", "POST /api/v1/assistant/conversations/x/feedback"]),
    );
    const doors: ["get" | "post" | "delete", string][] = [
      ["get", "/api/v1/assistant"],
      ["get", "/api/v1/assistant/conversations"],
      ["post", "/api/v1/assistant/conversations"],
      ["get", "/api/v1/assistant/conversations/{conversationId}"],
      ["delete", "/api/v1/assistant/conversations/{conversationId}"],
      ["post", "/api/v1/assistant/conversations/{conversationId}/messages"],
      ["post", "/api/v1/assistant/conversations/{conversationId}/feedback"],
    ];
    for (const role of Object.keys(MENU)) {
      const listed = MENU[role as keyof typeof MENU].some((i) => i.screen === "/(app)/assistant");
      for (const [method, path] of doors) expect({ role, door: `${method} ${path}`, opens: want(method, path, role) === "2xx" }).toEqual({ role, door: `${method} ${path}`, opens: listed });
    }
    // Asking is behind the module the entry is behind; reading one's own conversations is not, so a school that switches it off leaves them readable until they age out.
    expect(doc.paths["/api/v1/assistant/conversations/{conversationId}/messages"]!.post!["x-module"]).toBe(ASSISTANT_ENTRY.module);
  });

  it("gives the guardian's switch to a guardian alone", () => {
    for (const role of Object.keys(MENU)) expect({ role, opens: want("get", "/api/v1/family/assistant", role) === "2xx" }).toEqual({ role, opens: role === "PARENT" });
  });
});

