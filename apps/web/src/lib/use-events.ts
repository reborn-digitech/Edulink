"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/lib/navigation";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * The page's ear on GET /api/v1/events.
 *
 * One EventSource per page, opened with the session cookie, listening for
 * the named event types the page cares about. The server caps a session at
 * four open streams, so the hook closes on unmount and never opens a second
 * for the same page; a page that needs two kinds of event lists both in
 * `types` rather than calling the hook twice.
 *
 * The browser reconnects a dropped connection on its own. What it does NOT
 * retry is a connection the server refused (a 429 over the cap, a 401 after
 * the cookie went, a proxy's 502): those close the source for good, and the
 * hook reopens it with a backoff from one second to thirty. `session.ended`
 * — the server's word that the session was revoked or expired — stops the
 * hook and sends the person to /login the way the server does when a page
 * finds no session, with the "expired" notice.
 *
 * Only a visible tab holds a stream (the browser's connection budget and
 * the server's four-per-session cap are both small); a tab shown again
 * reopens it and is told to re-read what it missed (`onResume`).
 *
 * Where EventSource does not exist (tests, an old browser) the hook is a
 * no-op, and every page that uses it keeps the behaviour it had before:
 * what is on screen is what the page loaded, until it is reloaded.
 *
 * The phone keeps polling; a native EventSource there is a later job.
 */

export const EVENTS_URL = "/api/v1/events";
export const BACKOFF_MIN_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

/** The subset of EventSource the connection logic touches, so a test can hand in a fake. */
export type EventSourceLike = {
  readonly readyState: number;
  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void;
  close(): void;
};
export type EventSourceCtor = new (url: string, init?: { withCredentials?: boolean }) => EventSourceLike;

const CLOSED = 2;

export type ConnectOptions = {
  types: readonly RealtimeEvent["type"][];
  EventSource: EventSourceCtor;
  /** The session is gone: the caller sends the person to sign in. */
  onSessionEnded: () => void;
  /** Injectable for tests; window's by default. */
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  /**
   * The stream opened again after an earlier connection had opened — the browser's own reconnect or ours (TA-253).
   * Nothing published while it was down is replayed, so the page re-reads what it may have missed.
   */
  onReconnect?: () => void;
  /** Spreads each reconnect delay (jittered); the hook passes Math.random. Without it the table is exact. */
  random?: () => number;
};

/** The reconnect delay for the n-th consecutive failure (0-based): 1 s, 2 s, 4 s … capped at 30 s. */
export function backoffMs(attempt: number): number {
  return Math.min(BACKOFF_MIN_MS * 2 ** Math.max(0, attempt), BACKOFF_MAX_MS);
}

/**
 * A delay spread between half of `ms` and all of it (TA-455): after a restart every tab dropped at the same second
 * came back at the same second; the random half spreads them, the fixed half keeps a failing server from being asked
 * again at once.
 */
export function jittered(ms: number, random: () => number): number {
  return Math.round(ms / 2 + Math.min(1, Math.max(0, random())) * (ms / 2));
}

/**
 * Opens the stream and keeps it open; returns the function that closes it
 * for good. Pure of React so tests can drive it with a fake EventSource.
 */
export function connectEvents(onEvent: (event: RealtimeEvent) => void, options: ConnectOptions): () => void {
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  let source: EventSourceLike | null = null;
  let timer: unknown = null;
  let stopped = false;
  let attempt = 0;
  let everOpened = false;

  const open = () => {
    if (stopped) return;
    let es: EventSourceLike;
    try {
      es = new options.EventSource(EVENTS_URL, { withCredentials: true });
    } catch {
      // A constructor that throws (a browser that refuses the URL) is not
      // worth retrying forever; the page works without the stream.
      return;
    }
    source = es;
    es.addEventListener("open", () => {
      attempt = 0;
      // "open" fires on every connection, the browser's silent reconnects included: after the first, re-read (TA-253).
      if (everOpened && !stopped) options.onReconnect?.();
      everOpened = true;
    });
    for (const type of options.types) {
      es.addEventListener(type, (event) => {
        if (stopped) return;
        const parsed = parseEvent(event.data);
        if (parsed && parsed.type === type) onEvent(parsed);
      });
    }
    es.addEventListener("session.ended", () => {
      if (stopped) return;
      stopped = true;
      es.close();
      options.onSessionEnded();
    });
    es.addEventListener("error", () => {
      if (stopped) return;
      // CONNECTING means the browser is retrying by itself; leave it to it.
      if (es.readyState !== CLOSED) return;
      es.close();
      source = null;
      const table = backoffMs(attempt++);
      const delay = options.random ? jittered(table, options.random) : table;
      timer = setTimer(() => {
        timer = null;
        open();
      }, delay);
    });
  };

  open();

  return () => {
    stopped = true;
    if (timer !== null) clearTimer(timer);
    timer = null;
    source?.close();
    source = null;
  };
}

/** The `data:` line of a named event, as the route writes it: JSON of the RealtimeEvent. Anything else is ignored. */
export function parseEvent(data: unknown): RealtimeEvent | null {
  if (typeof data !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || typeof (parsed as { type?: unknown }).type !== "string") return null;
    return parsed as RealtimeEvent;
  } catch {
    return null;
  }
}

/** Where an ended session goes: the login page with its "expired" line, as the server sends a page that finds no session. */
export const SESSION_ENDED_URL = "/login?expired=1";

export type UseEventsOptions = {
  types: readonly RealtimeEvent["type"][];
  enabled?: boolean;
  /**
   * The tab was hidden and is shown again: the stream was closed while it
   * was hidden (see below), so the page re-reads what it may have missed.
   */
  onResume?: () => void;
};

export function useEvents(onEvent: (event: RealtimeEvent) => void, options: UseEventsOptions): void {
  const enabled = options.enabled ?? true;
  const router = useRouter();
  // The listeners always see the latest handlers without reopening the
  // stream when they change. (useEffectEvent would be the word for this, but
  // the React that Next 15 bundles does not have it yet.)
  const latest = useRef({ onEvent, onResume: options.onResume, router });
  useEffect(() => {
    latest.current = { onEvent, onResume: options.onResume, router };
  });
  // A stable key: a page passing a fresh array each render must not reconnect each render.
  const key = options.types.join(",");

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    /**
     * ONLY A VISIBLE TAB HOLDS A STREAM. A browser allows six connections to
     * a host over HTTP/1.1 and the server allows four streams to a session;
     * a teacher with five registers open in the background would spend both
     * on tabs nobody is looking at and lock the one she is looking at out
     * (429). So a hidden tab closes its stream and a shown one opens it
     * again, telling the page to re-read what it missed meanwhile.
     */
    let close: (() => void) | null = null;
    let missed = false;
    const start = () => {
      close ??= connectEvents((event) => latest.current.onEvent(event), {
        types: key.split(",").filter(Boolean) as RealtimeEvent["type"][],
        EventSource,
        onSessionEnded: () => latest.current.router.push(SESSION_ENDED_URL),
        // A stream that dropped and came back missed what was published meanwhile: re-read, as on a shown tab (TA-253).
        onReconnect: () => latest.current.onResume?.(),
        random: Math.random,
      });
    };
    const stop = () => {
      close?.();
      close = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
        missed = true;
        return;
      }
      start();
      if (missed) {
        missed = false;
        latest.current.onResume?.();
      }
    };
    if (document.visibilityState === "hidden") missed = true;
    else start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [enabled, key]);
}
