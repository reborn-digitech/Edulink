import { AppState, type AppStateStatus } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { createApiClient, type ApiClient } from "@edulink/api-client";
import { API_BASE } from "./api";
import { KEYS, keyStore } from "./storage";
import { flushQueue, type QueuedRequest } from "./outbox";

/**
 * Drains the outbox when the phone is back: the app returning to the
 * foreground, React Query learning the network is up, or a screen's own write
 * succeeding (the surest sign the network is there). Every replayed request
 * goes out through the same bearer client as a live one, plus the header
 * `X-Edulink-Replay: 1` the web's service worker sends, so the server can tell
 * a replay from a fresh tap in its logs.
 */
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let replayFetch: typeof fetch | null = null;
let client: ApiClient | null = null;

/** Tests inject the fake fetch the replayed requests should reach. */
export function __setReplayFetch(next: typeof fetch | null): void {
  replayFetch = next;
  client = null;
}

function replayClient(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: API_BASE,
      getToken: () => keyStore().get(KEYS.token),
      fetch: (input, init) => {
        const headers = { ...((init?.headers as Record<string, string> | undefined) ?? {}), "X-Edulink-Replay": "1" };
        return (replayFetch ?? globalThis.fetch)(input, { ...init, headers });
      },
    });
  }
  return client;
}

/** The transport flushQueue is given: one queued item, sent as it was queued. */
export async function sendQueued(item: QueuedRequest): Promise<{ status: number }> {
  let body: unknown;
  try {
    body = JSON.parse(item.body);
  } catch {
    body = undefined;
  }
  const result = await replayClient().request(item.method as Method, item.url, body);
  return { status: result.ok ? 200 : result.status };
}

/** Send everything waiting, oldest first. Safe to call from anywhere, any time. */
export function flushOutbox(): Promise<{ sent: number; failed: number; remaining: number }> {
  return flushQueue(sendQueued);
}

let started = false;
let stop: (() => void) | null = null;

/**
 * Wires the reconnect listeners once for the whole app and flushes right
 * away. Idempotent: every screen that fills the outbox calls it on mount.
 */
export function startOutboxRunner(): () => void {
  if (started) return () => {};
  started = true;
  const onAppState = (state: AppStateStatus) => {
    if (state === "active") void flushOutbox();
  };
  const appState = AppState.addEventListener("change", onAppState);
  const unsubscribeOnline = onlineManager.subscribe((online) => {
    if (online) void flushOutbox();
  });
  void flushOutbox();
  stop = () => {
    appState.remove();
    unsubscribeOnline();
    started = false;
    stop = null;
  };
  return stop;
}

/** Tests reset the runner between cases. */
export function __stopOutboxRunner(): void {
  stop?.();
}
