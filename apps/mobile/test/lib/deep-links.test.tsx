import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider, useSession } from "@/lib/session";
import { useDeepLinks } from "@/lib/deep-links";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));

let mockInitialUrl: string | null = null;
const mockListeners: ((e: { url: string }) => void)[] = [];
jest.mock("expo-linking", () => ({
  getInitialURL: async () => mockInitialUrl,
  addEventListener: (_: string, cb: (e: { url: string }) => void) => {
    mockListeners.push(cb);
    return { remove: () => mockListeners.splice(mockListeners.indexOf(cb), 1) };
  },
  parse: (url: string) => {
    const u = new URL(url.replace("edulink://", "https://app.local/"));
    const hostname = url.startsWith("edulink://") ? url.replace("edulink://", "").split(/[/?]/)[0] : null;
    return { hostname, path: hostname ? null : u.pathname.replace(/^\//, ""), queryParams: Object.fromEntries(u.searchParams.entries()) };
  },
}));

const ME = { user: { id: "u1", name: "ZZ Teacher", preferredName: null, email: "t@zz.test", avatarKey: null, isMinor: false, locale: "en" }, active: { schoolId: "s1", role: "TEACHER", membershipId: "m1" }, contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" }] };
const SESSION = { token: "tok-sso", expiresAt: new Date(Date.now() + 1e7).toISOString(), sessionId: "s", context: { schoolId: "s1", role: "TEACHER" } };

function fakeApi(store: ReturnType<typeof memoryStore>) {
  const calls: { path: string; body: unknown }[] = [];
  const fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(url)).pathname;
    calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (path === "/api/v1/auth/sso/exchange") return new Response(JSON.stringify(SESSION), { status: 200 });
    if (path === "/api/v1/me") return new Response(JSON.stringify(ME), { status: 200 });
    return new Response("{}", { status: 404 });
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: fetch as unknown as typeof globalThis.fetch }));
  return calls;
}

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

beforeEach(() => {
  mockPush.mockReset();
  mockListeners.length = 0;
  mockInitialUrl = null;
});

describe("deep links", () => {
  it("the SSO hand-off code is exchanged once, with the verifier this app kept, and the session accepted", async () => {
    const store = memoryStore({ [KEYS.ssoVerifier]: "the-verifier-this-app-made-before-the-browser-opened" });
    __setKeyStore(store);
    const calls = fakeApi(store);
    mockInitialUrl = "edulink://sso?code=one-time-code-from-the-callback&provider=google";
    const { result } = await renderHook(() => (useDeepLinks(), useSession()), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signed-in"));
    expect(calls.find((c) => c.path === "/api/v1/auth/sso/exchange")?.body).toEqual({ code: "one-time-code-from-the-callback", verifier: "the-verifier-this-app-made-before-the-browser-opened", device: "Relay app" });
    expect(await store.get(KEYS.token)).toBe("tok-sso");
    // Spent with the code: the same link arriving again has nothing to send.
    expect(await store.get(KEYS.ssoVerifier)).toBeFalsy();
  });

  it("⚠ a hand-off this app did not begin is not exchanged: no verifier kept, nothing sent", async () => {
    const store = memoryStore();
    __setKeyStore(store);
    const calls = fakeApi(store);
    mockInitialUrl = "edulink://sso?code=a-code-from-somebody-elses-sign-in&provider=google";
    const { result } = await renderHook(() => (useDeepLinks(), useSession()), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    expect(calls.some((c) => c.path === "/api/v1/auth/sso/exchange")).toBe(false);
  });

  it("a notification's web URL, arriving while open, routes to the mapped screen", async () => {
    const store = memoryStore({ [KEYS.token]: "tok" });
    __setKeyStore(store);
    fakeApi(store);
    await renderHook(() => useDeepLinks(), { wrapper });
    await act(async () => mockListeners.forEach((cb) => cb({ url: "https://app.example/remarks/c/room7" })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: "room7" } }));
  });
});
