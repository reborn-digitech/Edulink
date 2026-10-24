/**
 * THE LINKS THAT OPEN THE APP, AT THEIR EDGES (QA campaign of 24 October 2026, unit layer; src/lib/deep-links.tsx).
 *
 * test/lib/deep-links.test.tsx holds the SSO hand-off that works, the hand-off this app did not begin, and a web
 * URL routed while open. The campaign's coverage run left the rest unexercised (deep-links.tsx at 85 % of lines):
 * an SSO link with no code, an exchange the server refuses, a sign-in whose second step is a code (the session must
 * NOT be accepted until it is entered), and a tapped notification, which is how most links arrive on a phone.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider, useSession } from "@/lib/session";
import { useDeepLinks } from "@/lib/deep-links";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));

let mockInitialUrl: string | null = null;
const mockOpenURL = jest.fn(async (_url: string) => true);
jest.mock("expo-linking", () => ({
  openURL: (url: string) => mockOpenURL(url),
  getInitialURL: async () => mockInitialUrl,
  addEventListener: () => ({ remove: () => {} }),
  parse: (url: string) => {
    const u = new URL(url.replace("edulink://", "https://app.local/"));
    const hostname = url.startsWith("edulink://") ? url.replace("edulink://", "").split(/[/?]/)[0] : null;
    return { hostname, path: hostname ? null : u.pathname.replace(/^\//, ""), queryParams: Object.fromEntries(u.searchParams.entries()) };
  },
}));

const ME = { user: { id: "u1", name: "ZZ Teacher", preferredName: null, email: "t@zz.test", avatarKey: null, isMinor: false, locale: "en" }, active: { schoolId: "s1", role: "TEACHER", membershipId: "m1" }, contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" }] };
const SESSION = { token: "tok-sso", expiresAt: new Date(Date.now() + 1e7).toISOString(), sessionId: "s", context: { schoolId: "s1", role: "TEACHER" } };

function fakeApi(store: ReturnType<typeof memoryStore>, exchange: () => Response) {
  const calls: { path: string; body: unknown }[] = [];
  const fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(url)).pathname;
    calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (path === "/api/v1/auth/sso/exchange") return exchange();
    if (path === "/api/v1/me") return (await store.get(KEYS.token)) ? new Response(JSON.stringify(ME), { status: 200 }) : new Response("{}", { status: 401 });
    return new Response("{}", { status: 404 });
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: fetch as unknown as typeof globalThis.fetch }));
  return calls;
}

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;
const listener = Notifications.addNotificationResponseReceivedListener as unknown as jest.Mock;

beforeEach(() => {
  mockPush.mockReset();
  mockInitialUrl = null;
  listener.mockClear();
});

describe("an SSO link at its edges", () => {
  it("with no code sends nothing and keeps the verifier for the real answer", async () => {
    const store = memoryStore({ [KEYS.ssoVerifier]: "zz-kept-verifier" });
    __setKeyStore(store);
    const calls = fakeApi(store, () => new Response(JSON.stringify(SESSION), { status: 200 }));
    mockInitialUrl = "edulink://sso?provider=google";
    const { result } = await renderHook(() => (useDeepLinks(), useSession()), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    expect(calls.some((c) => c.path === "/api/v1/auth/sso/exchange")).toBe(false);
    expect(await store.get(KEYS.ssoVerifier)).toBe("zz-kept-verifier");
  });

  it("an exchange the server refuses signs nobody in, and the verifier is spent all the same", async () => {
    const store = memoryStore({ [KEYS.ssoVerifier]: "zz-kept-verifier" });
    __setKeyStore(store);
    const calls = fakeApi(store, () => new Response(JSON.stringify({ error: "expired", code: "SSO_CODE" }), { status: 400 }));
    mockInitialUrl = "edulink://sso?code=zz-stale-code";
    const { result } = await renderHook(() => (useDeepLinks(), useSession()), { wrapper });
    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/auth/sso/exchange")).toBe(true));
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    expect(await store.get(KEYS.token)).toBeFalsy();
    // A replayed link has nothing to pair with: the verifier went with the first try.
    expect(await store.get(KEYS.ssoVerifier)).toBeFalsy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("⚠ a two-step account goes to the code screen with the challenge, and no session is kept before the code", async () => {
    const store = memoryStore({ [KEYS.ssoVerifier]: "zz-kept-verifier" });
    __setKeyStore(store);
    fakeApi(store, () => new Response(JSON.stringify({ code: "TWO_FACTOR", challenge: "zz-challenge-1" }), { status: 200 }));
    mockInitialUrl = "edulink://sso?code=zz-code";
    const { result } = await renderHook(() => (useDeepLinks(), useSession()), { wrapper });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: "/(auth)/two-factor", params: { challenge: "zz-challenge-1" } }));
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeFalsy();
  });
});

describe("a tapped notification", () => {
  it("opens the screen its URL maps to, the web for a page the phone has not (QA-70), and nothing with no URL at all", async () => {
    const store = memoryStore({ [KEYS.token]: "tok" });
    __setKeyStore(store);
    fakeApi(store, () => new Response("{}", { status: 404 }));
    await renderHook(() => useDeepLinks(), { wrapper });
    await waitFor(() => expect(listener).toHaveBeenCalled());
    const tap = listener.mock.calls.at(-1)![0] as (r: unknown) => void;
    const response = (data: unknown) => ({ notification: { request: { content: { data } } } });
    await act(async () => tap(response({ url: "/remarks/c/room9" })));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: "room9" } });
    mockPush.mockClear();
    mockOpenURL.mockClear();
    await act(async () => tap(response({ url: "/parent/placement?child=c1" })));
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL.mock.calls[0]![0]).toMatch(/\/parent\/placement\?child=c1$/);
    await act(async () => tap(response({ url: "//evil.example/x" })));
    await act(async () => tap(response({ url: 42 })));
    await act(async () => tap(response(undefined)));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
  });
});
