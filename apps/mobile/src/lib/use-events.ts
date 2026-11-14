import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { fetch as expoFetch } from "expo/fetch";
import { API_BASE, apiLocale, sessionToken } from "./api";
import { useSessionIfAny } from "./session";

/**
 * The phone's ear on GET /api/v1/events — the web's src/lib/use-events.ts
 * over a streaming fetch, since React Native has no EventSource of its own.
 *
 * `expo/fetch` streams a response body on a phone and is the browser's fetch
 * on the web target, so one hook serves both. The text/event-stream frames
 * are parsed here (event:, data:, id:, a blank line ends a frame, a line
 * starting with ":" is the server's keep-alive and is dropped), `onEvent`
 * is called for the named types only, and a stream that ends or fails is
 * reopened on the web's backoff table: one second, doubling, capped at
 * thirty. `session.ended` — the server's word that the session was revoked
 * or expired — stops the hook for good and hands the session provider the
 * news: its `refresh` asks /api/v1/me, is told 401, drops the token, and the
 * gate in app/_layout.tsx sends the person to sign in, the way a 401 on any
 * other door does.
 *
 * ONLY A FOREGROUND APP HOLDS A STREAM. The server allows four streams to a
 * session; a phone put in a pocket with the register open would keep one
 * for hours, and a phone with the app in the background opened three times
 * over would lock the fourth out (429). So the stream closes when the app
 * leaves "active" and reopens when it returns, and the screen is told
 * (`onResume`) to re-read what it may have missed meanwhile — the web's
 * hidden-tab rule, for the same reason.
 *
 * The bearer goes in the Authorization header, read through api.ts's one
 * door (`sessionToken`), never in the URL and never logged. The parsing and
 * the reconnect loop are plain functions below so a test can drive them with
 * a ReadableStream of encoded frames and fake timers; the hook is the thin
 * React skin over them.
 */

export const EVENTS_PATH = "/api/v1/events";
export const BACKOFF_MIN_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

/** The events the phone's screens listen for, as src/lib/realtime.ts on the server names them. */
export type RealtimeEvent =
  | { type: "attendance.updated"; classId: string; dateKey: string; clientIds?: string[] }
  | { type: "attendance.session.finalized"; classId: string; dateKey: string }
  | { type: "substitution.updated"; dateKey: string; slotId: string }
  | { type: "notification"; userId: string }
  | { type: "checklist.updated"; schoolId: string };
export type RealtimeEventType = RealtimeEvent["type"];

/** The reconnect delay for the n-th consecutive failure (0-based): 1 s, 2 s, 4 s … capped at 30 s. */
export function backoffMs(attempt: number): number {
  return Math.min(BACKOFF_MIN_MS * 2 ** Math.max(0, attempt), BACKOFF_MAX_MS);
}

/**
 * A delay spread between half of `ms` and all of it (TA-455): after a server restart every phone dropped at the same
 * second came back at the same second, 1 s, 2 s, 4 s later; the random half spreads them, the fixed half keeps a
 * failing server from being asked again at once.
 */
export function jittered(ms: number, random: () => number): number {
  return Math.round(ms / 2 + Math.min(1, Math.max(0, random())) * (ms / 2));
}

/**
 * A stream that has carried nothing for this long, not even the server's keep-alive (every 25 s), is taken for dead
 * (TA-253): a network that drops an idle connection without a word leaves the read waiting for ever.
 */
export const IDLE_TIMEOUT_MS = 60_000;

/* ------------------------------------------------------------------------- */
/* The wire format                                                           */
/* ------------------------------------------------------------------------- */

/** One frame of a text/event-stream: its event name ("message" when the server named none), its data lines joined, its id if any. */
export type Frame = { event: string; data: string; id?: string };

/**
 * An incremental parser for text/event-stream, as the WHATWG spec reads it:
 * a chunk may end mid-line, so what is left after the last line break is
 * kept for the next push; lines end in \n, \r\n or \r; a field is split at
 * the first ":" and one space after it is dropped; ":" alone at the start
 * of a line is a comment; a blank line dispatches the frame if it has data.
 */
export function createFrameParser(): { push(chunk: string): Frame[]; end(): Frame[] } {
  let rest = "";
  let event = "";
  let data: string[] = [];
  let id: string | undefined;
  const take = (): Frame | null => {
    const frame = data.length > 0 ? { event: event || "message", data: data.join("\n"), ...(id !== undefined ? { id } : {}) } : null;
    event = "";
    data = [];
    return frame;
  };
  const line = (text: string): Frame | null => {
    if (text === "") return take();
    if (text.startsWith(":")) return null;
    const colon = text.indexOf(":");
    const field = colon < 0 ? text : text.slice(0, colon);
    let value = colon < 0 ? "" : text.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
    // "retry" and anything unknown: the reconnect delay is this module's own table.
    return null;
  };
  return {
    push(chunk) {
      rest += chunk;
      const frames: Frame[] = [];
      let at = 0;
      for (;;) {
        const nl = rest.indexOf("\n", at);
        const cr = rest.indexOf("\r", at);
        let end = nl < 0 ? cr : cr < 0 ? nl : Math.min(nl, cr);
        if (end < 0) break;
        // A \r at the very end of the chunk may be the first half of \r\n: wait for the rest.
        if (rest[end] === "\r" && end === rest.length - 1) break;
        const frame = line(rest.slice(at, end));
        if (frame) frames.push(frame);
        end += rest[end] === "\r" && rest[end + 1] === "\n" ? 2 : 1;
        at = end;
      }
      rest = rest.slice(at);
      return frames;
    },
    end() {
      const frames: Frame[] = [];
      if (rest !== "") {
        const frame = line(rest);
        if (frame) frames.push(frame);
        rest = "";
      }
      const last = take();
      if (last) frames.push(last);
      return frames;
    },
  };
}

/**
 * Reads a body to its end, handing each frame on as it completes. Resolves
 * when the stream closes (or the signal aborts, which cancels the reader —
 * a fetch's abort ends the body on a phone, but a stream a test hands in
 * knows nothing of the controller); rejects when the stream fails.
 */
export async function readFrames(body: ReadableStream<Uint8Array>, onFrame: (frame: Frame) => void, signal?: AbortSignal, onChunk?: () => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createFrameParser();
  const cancel = () => void reader.cancel().catch(() => {});
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel);
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      // Any bytes at all, a keep-alive comment included: the connection is alive.
      onChunk?.();
      for (const frame of parser.push(decoder.decode(value, { stream: true }))) onFrame(frame);
    }
    for (const frame of parser.push(decoder.decode())) onFrame(frame);
    for (const frame of parser.end()) onFrame(frame);
  } finally {
    signal?.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}

/** The `data:` of a named event, as the route writes it: JSON of the RealtimeEvent. Anything else is ignored. */
export function parseEvent(data: string): RealtimeEvent | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || typeof (parsed as { type?: unknown }).type !== "string") return null;
    return parsed as RealtimeEvent;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/* The connection                                                            */
/* ------------------------------------------------------------------------- */

/** The slice of fetch the connection uses, so a test can hand in a fake that answers with a ReadableStream. */
export type StreamFetch = (url: string, init: { method: "GET"; headers: Record<string, string>; signal: AbortSignal }) => Promise<{ ok: boolean; status: number; body: ReadableStream<Uint8Array> | null }>;

export type ConnectOptions = {
  types: readonly RealtimeEventType[];
  onEvent: (event: RealtimeEvent) => void;
  /** The session is gone: the caller hands the person to the sign-out path. */
  onSessionEnded: () => void;
  /** Injectable for tests; expo/fetch by default. */
  fetch?: StreamFetch;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  /**
   * The stream opened again after an earlier connection had opened (TA-253): events published while it was down
   * were not replayed, so the screen re-reads what it may have missed, as after a return from the background.
   */
  onReconnect?: () => void;
  /** Spreads each reconnect delay (jittered); the hook passes Math.random. Without it the table is exact. */
  random?: () => number;
  /** Reopens a stream that has carried nothing for this long (IDLE_TIMEOUT_MS from the hook); off without it. */
  idleMs?: number;
};

let streamFetch: StreamFetch | null = null;
/** Tests inject the fake fetch the stream should reach. */
export function __setEventsFetch(next: StreamFetch | null): void {
  streamFetch = next;
}

/**
 * Opens the stream and keeps it open until the returned function is called.
 * Pure of React: the hook below is the only caller in the app, the tests
 * the others.
 */
export function connectEvents(options: ConnectOptions): () => void {
  const doFetch = options.fetch ?? streamFetch ?? (expoFetch as unknown as StreamFetch);
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const types = new Set<string>(options.types);
  let controller: AbortController | null = null;
  let timer: unknown = null;
  let idle: unknown = null;
  let stopped = false;
  let attempt = 0;
  let everOpened = false;

  const later = () => {
    if (stopped) return;
    const table = backoffMs(attempt++);
    const delay = options.random ? jittered(table, options.random) : table;
    timer = setTimer(() => {
      timer = null;
      void open();
    }, delay);
  };

  const quiet = () => {
    if (idle !== null) clearTimer(idle);
    idle = null;
  };

  const open = async () => {
    if (stopped) return;
    const abort = new AbortController();
    controller = abort;
    // Silence for idleMs ends this connection; its read then resolves and the stream is reopened as after a close.
    const watch = () => {
      if (!options.idleMs || stopped) return;
      quiet();
      idle = setTimer(() => {
        idle = null;
        abort.abort();
      }, options.idleMs);
    };
    try {
      const headers: Record<string, string> = { Accept: "text/event-stream", "Accept-Language": apiLocale() };
      const token = await sessionToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      if (stopped) return;
      const response = await doFetch(`${API_BASE}${EVENTS_PATH}`, { method: "GET", headers, signal: abort.signal });
      if (stopped) return;
      // A 401 to the bearer is the session ended on the server (TA-145): handed to the sign-out path, not retried for good.
      if (response.status === 401 && token) {
        stopped = true;
        options.onSessionEnded();
        return;
      }
      if (!response.ok || !response.body) {
        // Refused (a 429 over the cap, a 401 after the token went, a proxy's 502): try again later, as the web does.
        later();
        return;
      }
      watch();
      let first = true;
      await readFrames(
        response.body,
        (frame) => {
          if (stopped) return;
          // A frame arrived (the route's "ready" is the first): the connection is good, and the next failure starts the table over.
          attempt = 0;
          if (first) {
            first = false;
            // Open again after an earlier connection: what was published in the gap is re-read (TA-253).
            if (everOpened) options.onReconnect?.();
            everOpened = true;
          }
          if (frame.event === "session.ended") {
            stopped = true;
            abort.abort();
            options.onSessionEnded();
            return;
          }
          if (!types.has(frame.event)) return;
          const parsed = parseEvent(frame.data);
          if (parsed && parsed.type === frame.event) options.onEvent(parsed);
        },
        abort.signal,
        watch,
      );
      quiet();
      // The server closed the stream (a restart, a proxy's idle limit), or it fell silent: reopen.
      later();
    } catch {
      quiet();
      // Offline, a dropped connection, or our own abort: the latter has set `stopped`, and `later` is a no-op then.
      later();
    } finally {
      if (controller === abort) controller = null;
    }
  };

  void open();

  return () => {
    stopped = true;
    if (timer !== null) clearTimer(timer);
    timer = null;
    quiet();
    controller?.abort();
    controller = null;
  };
}

/* ------------------------------------------------------------------------- */
/* The hook                                                                  */
/* ------------------------------------------------------------------------- */

export type UseEventsOptions = {
  enabled?: boolean;
  /** The app was in the background and is in front again: the stream was closed meanwhile, so the screen re-reads what it may have missed. */
  onResume?: () => void;
};

/** Holds the stream only while the app is in front: "active", or an AppState that has not said yet (null before the first change; a mock, under jest). */
export function holdsStream(state: AppStateStatus | null | undefined): boolean {
  return typeof state !== "string" || state === "active" || state === "unknown";
}

export function useEvents(types: readonly RealtimeEventType[], onEvent: (event: RealtimeEvent) => void, options: UseEventsOptions = {}): void {
  const enabled = options.enabled ?? true;
  const session = useSessionIfAny();
  // The stream sees the latest handlers without reopening when they change.
  const latest = useRef({ onEvent, onResume: options.onResume, session });
  useEffect(() => {
    latest.current = { onEvent, onResume: options.onResume, session };
  });
  // A stable key: a screen passing a fresh array each render must not reconnect each render.
  const key = types.join(",");

  useEffect(() => {
    if (!enabled) return;
    let close: (() => void) | null = null;
    let missed = false;
    const start = () => {
      close ??= connectEvents({
        types: key.split(",").filter(Boolean) as RealtimeEventType[],
        onEvent: (event) => latest.current.onEvent(event),
        onSessionEnded: () => void latest.current.session?.refresh(),
        // A stream that dropped and came back missed what was published meanwhile: re-read, as on a return (TA-253).
        onReconnect: () => latest.current.onResume?.(),
        random: Math.random,
        idleMs: IDLE_TIMEOUT_MS,
      });
    };
    const stop = () => {
      close?.();
      close = null;
    };
    const onAppState = (state: AppStateStatus) => {
      if (!holdsStream(state)) {
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
    if (holdsStream(AppState.currentState)) start();
    else missed = true;
    const subscription = AppState.addEventListener("change", onAppState);
    return () => {
      subscription.remove();
      stop();
    };
  }, [enabled, key]);
}
