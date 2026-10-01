import { Image } from "expo-image";
import { __setOutboxStore, countQueued, enqueue, memoryOutbox } from "@/lib/outbox";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider, useSession } from "@/lib/session";

const ME = { user: { id: "u1", name: "ZZ Teacher", preferredName: null, email: "t@zz.test", avatarKey: null, isMinor: false, locale: "en" }, active: { schoolId: "s1", role: "TEACHER", membershipId: "m1" }, contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" }] };

function fakeApi(answers: Record<string, () => Response>) {
  const fetch: jest.Mock = jest.fn(async (url: string | URL | Request) => {
    const path = new URL(String(url)).pathname;
    return (answers[path] ?? (() => new Response("{}", { status: 404 })))();
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: fetch as unknown as typeof globalThis.fetch }));
  return fetch;
}
let store = memoryStore();
const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

beforeEach(() => {
  store = memoryStore();
  __setKeyStore(store);
});

describe("the session", () => {
  it("starts loading, then signed out with nothing in storage", async () => {
    fakeApi({});
    const { result } = await renderHook(() => useSession(), { wrapper });
    // render() has already flushed the first read of storage; what matters
    // is that nothing in storage means signed out, not a crash.
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
  });

  it("with a stored token, loads /me and is signed in; a 401 clears the token", async () => {
    await store.set(KEYS.token, "tok-1");
    fakeApi({ "/api/v1/me": () => new Response(JSON.stringify(ME), { status: 200 }) });
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signed-in"));
    expect(result.current.me?.active.role).toBe("TEACHER");

    fakeApi({ "/api/v1/me": () => new Response('{"error":"Not signed in","code":"UNAUTHORIZED"}', { status: 401 }) });
    await act(() => result.current.refresh());
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeNull();
  });

  it("accepting a sign-in stores the token and loads me; signing out revokes and forgets", async () => {
    const fetch = fakeApi({ "/api/v1/me": () => new Response(JSON.stringify(ME), { status: 200 }), "/api/v1/auth/logout": () => new Response('{"ok":true}', { status: 200 }) });
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    await act(() => result.current.accept({ token: "tok-2", expiresAt: new Date(Date.now() + 1e7).toISOString(), sessionId: "s", context: { schoolId: "s1", role: "TEACHER" } }));
    expect(result.current.status).toBe("signed-in");
    expect(await store.get(KEYS.token)).toBe("tok-2");
    // What this person left on the phone: a queued write and an unsent crash.
    __setOutboxStore(memoryOutbox());
    await enqueue({ method: "POST", url: "/api/v1/marks", body: "{}", tag: "marks" });
    await store.set(KEYS.crash, JSON.stringify({ message: "boom" }));
    expect(await countQueued()).toBe(1);
    const disk = jest.spyOn(Image, "clearDiskCache").mockResolvedValue(true);
    const memory = jest.spyOn(Image, "clearMemoryCache").mockResolvedValue(true);
    await act(() => result.current.signOut());
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeNull();
    expect(await countQueued()).toBe(0);
    expect(await store.get(KEYS.crash)).toBeNull();
    // The bulletin's photographs go with the person (decision 0002, gap 2).
    expect(disk).toHaveBeenCalledTimes(1);
    expect(memory).toHaveBeenCalledTimes(1);
    const logoutCall = fetch.mock.calls.find((c) => String(c[0]).endsWith("/auth/logout"));
    expect((logoutCall![1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer tok-2" });
  });
});
