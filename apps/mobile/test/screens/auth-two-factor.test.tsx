import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "@edulink/api-client";
import { renderApp, untilRendered } from "../utils";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider } from "@/lib/session";
import SignIn from "@/app/(auth)/index";
import TwoFactor from "@/app/(auth)/two-factor";
import { json, me, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SESSION = { token: "tok-".padEnd(40, "x"), expiresAt: "2026-12-01T00:00:00.000Z", sessionId: "s1", context: { schoolId: "s1", role: "ADMIN" } };
const CHALLENGE = "challenge-".padEnd(48, "c");

/** Signed out: an empty key store, so the router would show the sign-in screen. */
async function mountSignedOut(ui: React.ReactElement, answers: Answers) {
  const store = memoryStore({});
  __setKeyStore(store);
  const fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname !== "/api/v1/me") await untilRendered();
    const answer = answers[`${init?.method ?? "GET"} ${url.pathname}`];
    if (answer) return answer({ url, init: init ?? {} });
    if (url.pathname === "/api/v1/me") return json(me("ADMIN"));
    return json({ error: "Not found", code: "NOT_FOUND" }, 404);
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: fetch as unknown as typeof globalThis.fetch }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const rendered = await renderApp(
    <QueryClientProvider client={client}>
      <SessionProvider>{ui}</SessionProvider>
    </QueryClientProvider>,
  );
  const calls = () => fetch.mock.calls.map(([input, init]) => ({ line: `${init?.method ?? "GET"} ${new URL(String(input)).pathname}`, body: typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : undefined }));
  return { ...rendered, store, calls };
}

describe("two-step sign-in on the phone", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = {};
  });

  it("the password answers TWO_FACTOR: a code box appears, a wrong code is refused under it, the right one signs in", async () => {
    let totpCalls = 0;
    const { store, calls } = await mountSignedOut(<SignIn />, {
      "POST /api/v1/auth/login": () => json({ code: "TWO_FACTOR", challenge: CHALLENGE }),
      "POST /api/v1/auth/totp": () => (++totpCalls === 1 ? json({ error: "ZZ That code is not right. 4 tries left.", code: "UNAUTHORIZED" }, 401) : json(SESSION)),
    });
    await fireEvent.changeText(screen.getByLabelText("Email, mobile number or login name"), "head@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Password"), "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));

    const box = await screen.findByLabelText("The six-digit code from the app");
    expect(screen.getByText("One more step")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
    // No session was stored on the first step.
    expect(await store.get(KEYS.token)).toBeNull();

    const submit = screen.getByRole("button", { name: "Sign in" });
    expect(submit.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(box, "000000");
    await fireEvent.press(submit);
    expect(await screen.findByText("ZZ That code is not right. 4 tries left.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/auth/totp")[0]?.body).toEqual({ challenge: CHALLENGE, code: "000000", device: "Shalaghar app" });

    await fireEvent.changeText(box, "123456");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(async () => expect(await store.get(KEYS.token)).toBe(SESSION.token));
    expect(calls().map((c) => c.line)).toContain("GET /api/v1/me");
  });

  it("a recovery code goes as typed, and back to sign-in drops the step", async () => {
    const { calls } = await mountSignedOut(<SignIn />, {
      "POST /api/v1/auth/login": () => json({ code: "TWO_FACTOR", challenge: CHALLENGE }),
      "POST /api/v1/auth/totp": () => json(SESSION),
    });
    await fireEvent.changeText(screen.getByLabelText("Email, mobile number or login name"), "head@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Password"), "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    const box = await screen.findByLabelText("The six-digit code from the app");
    await fireEvent.changeText(box, "k7pm-3xq2");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/auth/totp")).toHaveLength(1));
    expect(calls().filter((c) => c.line === "POST /api/v1/auth/totp")[0]?.body).toMatchObject({ code: "k7pm-3xq2" });
  });

  it("back to sign-in returns to the password form with the password cleared", async () => {
    await mountSignedOut(<SignIn />, { "POST /api/v1/auth/login": () => json({ code: "TWO_FACTOR", challenge: CHALLENGE }) });
    await fireEvent.changeText(screen.getByLabelText("Email, mobile number or login name"), "head@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Password"), "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    await screen.findByLabelText("The six-digit code from the app");
    await fireEvent.press(screen.getByRole("button", { name: "Back to sign-in" }));
    expect(await screen.findByLabelText("Password")).toBeTruthy();
    expect(screen.getByLabelText("Password").props.value).toBe("");
    expect(screen.getByLabelText("Email, mobile number or login name").props.value).toBe("head@zz.test");
  });

  it("a password that simply signs in still does, with no step in between", async () => {
    const { store } = await mountSignedOut(<SignIn />, { "POST /api/v1/auth/login": () => json(SESSION) });
    await fireEvent.changeText(screen.getByLabelText("Email, mobile number or login name"), "head@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Password"), "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    await waitFor(async () => expect(await store.get(KEYS.token)).toBe(SESSION.token));
    expect(screen.queryByText("One more step")).toBeNull();
  });

  it("the step screen a link or SSO lands on takes the challenge from its params and a rate limit shows its countdown", async () => {
    mockRouter.params = { challenge: CHALLENGE };
    const { calls } = await mountSignedOut(<TwoFactor />, {
      "POST /api/v1/auth/totp": () => json({ error: "ZZ Too many attempts.", code: "RATE_LIMITED", retryAfterSeconds: 90 }, 429),
    });
    const box = await screen.findByLabelText("The six-digit code from the app");
    await fireEvent.changeText(box, "123456");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("ZZ Too many attempts. (90s)")).toBeTruthy();
    expect(calls()[0]?.body).toMatchObject({ challenge: CHALLENGE });
    await fireEvent.press(screen.getByRole("button", { name: "Back to sign-in" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
