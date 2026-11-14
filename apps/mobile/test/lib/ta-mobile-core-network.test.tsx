/**
 * The network's batch of the testing analysis of 13 November 2026 (mobile-core):
 *
 * TA-149 no request had a time limit, so a connection that never answered left Save busy and stopped the outbox;
 * TA-150 the token was readable only while an iPhone was unlocked, so a driver's positions stopped at the lock;
 * TA-164 nothing re-read a screen when the app came back to the front;
 * TA-251 the outbox did not send when the signal came back while the app stayed open;
 * TA-146 a replay the server refused was dropped without a word on every screen but the register.
 */
import { AppState } from "react-native";
import { act, renderHook, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import { createApiClient, REQUEST_TIMEOUT_MS } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setOutboxStore, enqueue, flushQueue, listQueued, memoryOutbox, setOutboxOwner } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, startOutboxRunner } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { makeQueryClient } from "@/lib/query";
import { useReplayRefusalNotice } from "@/lib/outbox-held";
import { ToastProvider } from "@/components";
import { I18nProvider } from "@/lib/i18n";

jest.mock("expo-secure-store", () => {
  const map = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY",
    getItemAsync: jest.fn(async (k: string) => map.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void map.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void map.delete(k)),
  };
});

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  setOutboxOwner({ userId: "A", schoolId: "s1", membershipId: "m-A" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("a request has a time limit (TA-149)", () => {
  it("TA-149: a fetch that never answers is a network failure (status 0) after the limit, and the signal is aborted", async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | undefined;
    const never = jest.fn((_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    });
    const client = createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: never as unknown as typeof fetch });
    const pending = client.post("/api/attendance", { marks: [] });
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);
    await expect(pending).resolves.toMatchObject({ ok: false, status: 0 });
    expect(signal?.aborted).toBe(true);
  });

  it("TA-149: a request given its own limit outlives the 30 s default and is cut at its own; the next request is still cut at 30 s", async () => {
    jest.useFakeTimers();
    const never = jest.fn(() => new Promise<Response>(() => {}));
    const client = createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: never as unknown as typeof fetch });
    let long: unknown = "pending";
    void client.post("/api/v1/assistant/conversations/zz-c/messages", { text: "ZZ" }, { timeoutMs: 150_000 }).then((r) => (long = r));
    let short: unknown = "pending";
    void client.get("/api/v1/me").then((r) => (short = r));
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);
    expect(short).toMatchObject({ ok: false, status: 0 });
    expect(long).toBe("pending");
    await jest.advanceTimersByTimeAsync(150_000 - REQUEST_TIMEOUT_MS);
    expect(long).toMatchObject({ ok: false, status: 0 });
  });

  it("TA-149: a slow answer within its own limit arrives whole", async () => {
    jest.useFakeTimers();
    const slow = jest.fn(() => new Promise<Response>((resolve) => setTimeout(() => resolve(new Response('{"answer":"ZZ"}', { status: 200 })), 60_000)));
    const client = createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: slow as unknown as typeof fetch });
    const pending = client.post("/api/v1/assistant/conversations/zz-c/messages", { text: "ZZ" }, { timeoutMs: 150_000 });
    await jest.advanceTimersByTimeAsync(60_001);
    await expect(pending).resolves.toEqual({ ok: true, data: { answer: "ZZ" } });
  });

  it("TA-149: a body cut off part-way is a network failure, not a throw", async () => {
    const cut = jest.fn(async () => ({ ok: true, status: 200, statusText: "OK", text: () => Promise.reject(new TypeError("Network request failed")) }) as unknown as Response);
    const client = createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: cut as unknown as typeof fetch });
    await expect(client.get("/api/v1/me")).resolves.toMatchObject({ ok: false, status: 0 });
  });

  it("TA-149: a queued row whose send never settles is kept, and a later flush still sends the next row", async () => {
    jest.useFakeTimers();
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "one" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "two" });
    const sent: string[] = [];
    const first = flushQueue((item) => (item.tag === "one" ? new Promise<{ status: number }>(() => {}) : (sent.push(item.tag), Promise.resolve({ status: 200 }))), Date.now(), 1_000);
    await jest.advanceTimersByTimeAsync(1_001);
    await expect(first).resolves.toEqual({ sent: 1, failed: 1, remaining: 1 });
    expect(sent).toEqual(["two"]);
    expect((await listQueued()).map((r) => r.tag)).toEqual(["one"]);
    // The flush was released: a later one runs.
    await expect(flushQueue(async () => ({ status: 200 }))).resolves.toEqual({ sent: 1, failed: 0, remaining: 0 });
  });
});

describe("the token is readable on a locked phone (TA-150)", () => {
  it("TA-150: the key store keeps the token after the first unlock, on this device only, rewriting an old item", async () => {
    const { platformKeyStore } = jest.requireActual<typeof import("@/lib/storage-platform.native")>("@/lib/storage-platform.native");
    const keys = platformKeyStore();
    await keys.set(KEYS.token, "tok");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(KEYS.token, "tok", { keychainAccessible: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEYS.token, { keychainAccessible: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" });
    expect(await keys.get(KEYS.token)).toBe("tok");
  });
});

describe("React Query hears the phone (TA-164, TA-251)", () => {
  it("TA-164: the app's return to the front is focus, so a stale query on screen is read again", async () => {
    const listen = jest.spyOn(AppState, "addEventListener");
    makeQueryClient();
    // The focus manager's listener is the app's state.
    expect(listen).toHaveBeenCalled();
    const onChange = listen.mock.calls[listen.mock.calls.length - 1]![1] as (s: string) => void;
    await act(async () => {
      onChange("background");
    });
    expect(focusManager.isFocused()).toBe(false);
    await act(async () => {
      onChange("active");
    });
    expect(focusManager.isFocused()).toBe(true);
    // Not restored: AppState is the preset's own mock, and restoring it would leave addEventListener answering nothing.
  });

  it("TA-251: the signal coming back with the app open flushes the outbox", async () => {
    makeQueryClient();
    const calls = (Network.addNetworkStateListener as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const say = calls[calls.length - 1]![0] as (s: { isConnected?: boolean; isInternetReachable?: boolean }) => void;
    const fetch = jest.fn(async () => new Response('{"ok":true}', { status: 200 }));
    __setKeyStore(memoryStore({ [KEYS.token]: "tok" }));
    __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "tok", fetch: fetch as unknown as typeof globalThis.fetch }));
    __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
    await act(async () => {
      say({ isConnected: false, isInternetReachable: false });
    });
    expect(onlineManager.isOnline()).toBe(false);
    startOutboxRunner();
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1" });
    fetch.mockClear();
    await act(async () => {
      say({ isConnected: true, isInternetReachable: true });
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await waitFor(async () => expect(await listQueued()).toHaveLength(0));
  });
});

describe("a replay the server refused is said, whatever screen is up (TA-146)", () => {
  it("TA-146: a marks sheet refused on replay shows the person a notice with the server's sentence", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider initial="en">
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    );
    await renderHook(() => useReplayRefusalNotice(), { wrapper });
    await enqueue({ url: "/api/v1/teacher/marks", method: "POST", body: "{}", tag: "marks:c1:slot1" });
    await act(async () => {
      await flushQueue(async () => ({ status: 403, error: "That year is finished." }));
    });
    expect(await screen.findByText("Something you saved without signal was refused by the server and was not saved. That year is finished.")).toBeTruthy();
  });
});
