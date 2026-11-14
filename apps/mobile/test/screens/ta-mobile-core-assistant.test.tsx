/**
 * The network's batch of the testing analysis of 13 November 2026 (mobile-core), the second reader's concern on TA-149:
 * the client's new 30 s limit cut every request, the assistant's ask too, though the server lets the model's answer
 * alone take 90 s (assistant/config.ts), so a slow answer failed on the phone and was asked again. The ask now passes
 * a limit of its own, above the server's.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { api, __setApiClient } from "@/lib/api";
import { ASSISTANT_ANSWER_TIMEOUT_MS } from "@/screens/shared/assistant";
import { ViduraSheet } from "@/screens/shared/vidura";
import { json, mountStaff, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const AT = "2026-11-14T04:00:00.000Z";
const STATUS = { available: true, reason: null, help: true, tutor: true, language: "en", dailyCap: 40, usedToday: 0, retentionDays: 30, optOutPath: null, modes: ["USING", "RECORDS", "LEARNING"] };
const CONVERSATION = { id: "zz-c", language: "en", createdAt: AT, lastAt: AT, title: "ZZ lever", messageCount: 2, expiresAt: "2026-12-14T04:00:00.000Z" };
const message = (over: Record<string, unknown>) => ({ id: "zz-a", role: "ASSISTANT", text: "ZZ A lever is a bar.", createdAt: AT, citations: [], verdict: "ANSWERED", mode: "HELP", hint: false, helpful: null, chip: "USING", cut: false, askPerson: null, ...over });
const answers: Record<string, Answer> = {
  "GET /api/v1/assistant": () => json(STATUS),
  "GET /api/v1/assistant/conversations": () => json({ conversations: [], retentionDays: 30 }),
  "GET /api/v1/assistant/suggestions": () => json({ suggestions: [] }),
  "POST /api/v1/assistant/conversations": () => json(CONVERSATION),
  "POST /api/v1/assistant/conversations/zz-c/messages": () =>
    json({ conversationId: "zz-c", question: message({ id: "zz-q", role: "USER", text: "ZZ what is a lever", verdict: null, mode: null, chip: null }), answer: message({}) }),
};

describe("the assistant's ask is not cut at the client's default limit (TA-149)", () => {
  it("TA-149: the ask passes a limit above the server's own (classifier 8 s, embedding 10 s, answer 90 s); the open keeps the default", async () => {
    await mountStaff(<ViduraSheet visible plan={false} conversationId={null} page={null} onClose={jest.fn()} />, "STUDENT", answers);
    const real = api();
    const post = jest.fn(real.post);
    __setApiClient({ ...real, post: post as unknown as typeof real.post });
    await fireEvent.changeText(await screen.findByLabelText("Your question"), "ZZ what is a lever");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("ZZ A lever is a bar.")).toBeTruthy();
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    const ask = post.mock.calls.find(([path]) => path === "/api/v1/assistant/conversations/zz-c/messages");
    expect(ask?.[2]).toEqual({ timeoutMs: ASSISTANT_ANSWER_TIMEOUT_MS });
    expect(ASSISTANT_ANSWER_TIMEOUT_MS).toBeGreaterThan(8_000 + 10_000 + 90_000);
    const open = post.mock.calls.find(([path]) => path === "/api/v1/assistant/conversations");
    expect(open?.[2]).toBeUndefined();
  });
});
