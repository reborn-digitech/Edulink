import "server-only";
import { db } from "./db";
import { listen, unref, type ListenLink, type ListenOptions } from "./pg-listen";
import { outsideTransaction } from "./tenant-context";

/**
 * Realtime fan-out.
 *
 * The spec asks for WebSockets. v1 uses Server-Sent Events over an in-process
 * pub/sub instead, for one decisive reason: Next's App Router has no WebSocket
 * server of its own, so WS means running and deploying a second process before
 * a single teacher can mark a single register. SSE is one route handler, works
 * through every proxy, and reconnects on its own.
 *
 * BETWEEN SERVERS (TA-193, 14 November 2026). The bus below fans out within one
 * server process, and the deployment runs two web machines and a jobs machine
 * (fly.toml), so a register saved through one machine never reached a colleague
 * whose stream the other held. A published signal is now also passed to the
 * other servers through the database's own NOTIFY, with no outside service:
 *
 *   - SENDING is one statement, `SELECT pg_notify(...)`, on the pool every
 *     process already has; the jobs machine only sends. Each send waits its
 *     turn behind the one before (so signals arrive in the order they were
 *     published and take one pooled connection, not fifteen) and catches its
 *     own failure: a signal that cannot be sent is counted and logged, and
 *     never stops a save or a server.
 *   - HEARING is one connection of its own per web server (pg-listen.ts),
 *     opened when the first stream subscribes, so a process that serves no
 *     stream holds none.
 *   - WHAT CROSSES is ids and progress stages only (CROSSES below). The
 *     assistant's answer words (`assistant.delta`) never do, in either
 *     direction: they stay on the server that answered and still arrive whole
 *     with the reply, which is the moment the pieces are sent anyway.
 *   - A SIGNAL TOO LONG for the database's limit (a payload must be under 8,000
 *     bytes) is split by its channels (a long route's rider list), and a
 *     register's signal carries the first few client ids only, which is all a
 *     register needs to tell its own save from a colleague's.
 *   - THE BUS'S LIMIT of one position per trip every fifteen seconds is
 *     applied here, where a signal is received and handed to the streams,
 *     whichever server took the driver's phone: no time is stored anywhere.
 *   - WHEN THE LISTENING LINK DROPS, the streams this server holds are ended,
 *     spread over time so that their pages do not all re-read together; the
 *     web and the phone reconnect and re-read what they missed. A stream
 *     opened while the link was down is ended the same way once it is back.
 *
 * The same-process bus alone stays for tests and development (busMode).
 */

export type RealtimeEvent =
  /**
   * clientIds: the idempotency keys of the marks applied, so the register
   * that sent them can tell its own save from a colleague's and leave its
   * roster alone (a refetch under a teacher's hand would read as the page
   * fighting them). Opaque random ids, minted on the device; nothing in them.
   */
  | { type: "attendance.updated"; classId: string; dateKey: string; clientIds?: string[] }
  | { type: "attendance.session.finalized"; classId: string; dateKey: string }
  | { type: "grade.updated"; studentMembershipId: string; assignmentId: string }
  | { type: "assignment.published"; classId: string; assignmentId: string }
  | { type: "remark.message"; threadId: string }
  | { type: "conversation.message"; conversationId: string }
  | { type: "post.status"; postId: string; status: string }
  | { type: "notification"; userId: string }
  | { type: "checklist.updated"; schoolId: string }
  /** The board for a day changed: a cover named, taken away, taken up or declined. On the school channel and the substitute's own. */
  | { type: "substitution.updated"; dateKey: string; slotId: string }
  /**
   * Transport (3 Oct 2026): where a bus is (at most one every 15 s per trip),
   * a trip started or ended, and a bus near a pupil's stop. On the school
   * channel for the office and the head, and on the riding pupils' own
   * channels for their families. The BUS's position — never a child's.
   */
  | { type: "transport.position"; tripId: string; lat: number; lng: number; at: string }
  | { type: "transport.trip"; tripId: string; status: string }
  | { type: "transport.near"; tripId: string; studentMembershipId: string }
  /**
   * The assistant (Phase B, 10 Oct 2026; assistantEventSchema in packages/contracts): on the asker's
   * own user channel only. The stages, then the CHECKED answer in pieces, then done — nothing is
   * streamed before the answer gate has passed it.
   */
  | { type: "assistant.stage"; conversationId: string; stage: "SEARCHING" | "WRITING" | "CHECKING" }
  | { type: "assistant.delta"; conversationId: string; messageId: string; seq: number; text: string }
  | { type: "assistant.done"; conversationId: string; messageId: string; verdict: string };

type Subscriber = {
  channels: Set<string>;
  send: (event: RealtimeEvent) => void;
  /** Ends the stream this subscriber feeds, when the link to the other servers was lost under it. */
  end?: () => void;
  /** Opened while the link was down: ended once it is back, since nothing from the other servers reached it. */
  missed: boolean;
  ending: boolean;
  /** The last signal handed over, so the parts of one split signal reach a subscriber once. */
  lastSignal: string | null;
};

/** Where the listening link stands: not asked for, opening for the first time, up, or down and being tried again. */
export type LinkPhase = "off" | "opening" | "up" | "down";

type Link = {
  /** This server process, so that it does not hand out its own signals twice. */
  origin: string;
  counter: number;
  phase: LinkPhase;
  listener: ListenLink | null;
  /** The sends in flight, one behind another. */
  tail: Promise<void>;
  queued: number;
  /** Per trip: when a position was last handed to the streams here, and the signal it came with. */
  positions: Map<string, { at: number; signal: string }>;
  lost: number;
  lostSaidAt: number;
};

const globalForBus = globalThis as unknown as { edulinkBus?: Set<Subscriber>; edulinkBusLink?: Link };
const bus: Set<Subscriber> = (globalForBus.edulinkBus ??= new Set());
const link: Link = (globalForBus.edulinkBusLink ??= {
  origin: globalThis.crypto.randomUUID(),
  counter: 0,
  phase: "off",
  listener: null,
  tail: Promise.resolve(),
  queued: 0,
  positions: new Map(),
  lost: 0,
  lostSaidAt: 0,
});

/** The Postgres channel every server's signals go out on and every web server listens to. */
export const SIGNAL_CHANNEL = "edulink_events";
/**
 * The most bytes one signal may be. Postgres refuses a NOTIFY payload of 8,000 bytes or more (its own rule,
 * confirmed against the database in tests/ta-decision-193-shared-bus.test.ts); this leaves room below it.
 */
export const SIGNAL_MAX_BYTES = 7_000;
/** At most one live position per trip is handed to a server's streams in this many milliseconds. */
export const POSITION_EVERY_MS = 15_000;
/** A register's signal crosses with at most this many of its client ids (each up to 64 characters). */
const CLIENT_IDS_ACROSS = 50;
/** Sends waiting their turn; past this the database is not answering and a signal is dropped rather than kept. */
const SEND_QUEUE_MAX = 5_000;

/**
 * Which signals pass between servers. Every type is named, so a new one cannot be added to RealtimeEvent without
 * deciding here: ids and progress stages cross, words do not.
 */
const CROSSES: Record<RealtimeEvent["type"], boolean> = {
  "attendance.updated": true,
  "attendance.session.finalized": true,
  "grade.updated": true,
  "assignment.published": true,
  "remark.message": true,
  "conversation.message": true,
  "post.status": true,
  notification: true,
  "checklist.updated": true,
  "substitution.updated": true,
  "transport.position": true,
  "transport.trip": true,
  "transport.near": true,
  "assistant.stage": true,
  // The answer's words: never on the shared channel, sent or received.
  "assistant.delta": false,
  "assistant.done": true,
};

type Seams = {
  /** Null reads the environment. */
  mode: "database" | "local" | null;
  notify: (payload: string) => Promise<unknown>;
  now: () => number;
  random: () => number;
  open: (options: ListenOptions) => ListenLink;
};
const REAL: Seams = {
  mode: null,
  notify: (payload) => db.$executeRaw`SELECT pg_notify(${SIGNAL_CHANNEL}, ${payload})`.then(() => undefined),
  now: () => Date.now(),
  random: () => Math.random(),
  open: listen,
};
let seams: Seams = REAL;

/** Tests stand in for the database, the clock and the listening connection; null puts the real ones back. */
export function __setBusSeams(next: Partial<Seams> | null): void {
  seams = next ? { ...REAL, ...next } : REAL;
}

/** Tests start from a bus with no link, no subscriber and no remembered position. */
export function __resetBus(): void {
  link.listener?.close();
  link.listener = null;
  link.phase = "off";
  link.tail = Promise.resolve();
  link.queued = 0;
  link.positions.clear();
  link.lost = 0;
  link.lostSaidAt = 0;
  bus.clear();
}

/**
 * Whether signals pass between servers through the database ("database") or stay in this process ("local").
 * REALTIME_BUS says which; left unset, a production server shares them and development and tests do not.
 */
export function busMode(): "database" | "local" {
  if (seams.mode) return seams.mode;
  const asked = process.env.REALTIME_BUS?.trim().toLowerCase();
  if (asked === "database" || asked === "local") return asked;
  return process.env.NODE_ENV === "production" ? "database" : "local";
}

export function linkPhase(): LinkPhase {
  return link.phase;
}

/** Settles when every signal published so far has been sent to the other servers, or has failed. */
export function signalsSent(): Promise<void> {
  return link.tail;
}

/**
 * Over how long the streams of a lost link are ended: about five a second, never under five seconds nor over two
 * minutes. One process draws some twenty pages a second at most (ops/load/README.md), and every ended stream is a
 * page that reads again.
 */
export function endSpreadMs(streams: number): number {
  return Math.min(120_000, Math.max(5_000, streams * 200));
}

function endSpread(subscribers: Subscriber[]): void {
  const due = subscribers.filter((s) => s.end && !s.ending);
  const over = endSpreadMs(due.length);
  for (const subscriber of due) {
    subscriber.ending = true;
    const timer = setTimeout(
      () => {
        if (!bus.has(subscriber)) return;
        try {
          subscriber.end?.();
        } catch {
          // A stream that cannot be closed is dropped from the bus; its own cancel does the rest.
          bus.delete(subscriber);
        }
      },
      Math.floor(Math.min(1, Math.max(0, seams.random())) * over),
    );
    unref(timer);
  }
}

function linkUp(): void {
  const was = link.phase;
  link.phase = "up";
  if (was === "down") console.warn("[realtime] the link to the other servers is up again");
  const missed = [...bus].filter((s) => s.missed);
  for (const subscriber of bus) subscriber.missed = false;
  endSpread(missed);
}

function linkDown(reason: string): void {
  const was = link.phase;
  link.phase = "down";
  console.error(`[realtime] the link to the other servers is down (${reason}); signals published on other servers are not heard here until it is back`);
  // The streams that leaned on the link end, each in its own time; those opened before it ever came up end once it is.
  if (was === "up") endSpread([...bus]);
  else for (const subscriber of bus) subscriber.missed = true;
}

/** The URL the listening connection takes: a direct one when the pool's goes through a pooler, else the process's own. */
function listenUrl(): string | undefined {
  const direct = process.env.REALTIME_LISTEN_URL?.trim();
  if (direct) return direct;
  // As db.ts chooses: the jobs runner's process is on the owner's URL.
  if (process.env.JOBS_RUNNER === "1" && process.env.DATABASE_ADMIN_URL) return process.env.DATABASE_ADMIN_URL;
  return process.env.DATABASE_URL;
}

function listenOnce(): void {
  if (link.listener) return;
  link.phase = "opening";
  try {
    link.listener = seams.open({ url: listenUrl, channel: SIGNAL_CHANNEL, onNotify: receiveSignal, onUp: linkUp, onDown: linkDown });
  } catch (error) {
    linkDown(error instanceof Error ? error.message : "the listening connection could not be opened");
  }
}

/**
 * Channel names carry the tenant: "school:<id>", "class:<id>", "user:<id>".
 * A subscriber is only ever handed channels the session already proved access
 * to, so the realtime layer cannot become a way around the tenant boundary.
 *
 * `end` closes the stream the subscriber feeds: it is called when this server's link to the others was lost under
 * the stream, so that its page reconnects and re-reads (TA-193). A subscriber without one is simply left.
 */
export function subscribe(channels: string[], send: (event: RealtimeEvent) => void, end?: () => void): () => void {
  if (busMode() === "database") listenOnce();
  const subscriber: Subscriber = { channels: new Set(channels), send, end, missed: link.phase === "down", ending: false, lastSignal: null };
  bus.add(subscriber);
  return () => {
    bus.delete(subscriber);
  };
}

/** One position per trip in fifteen seconds, measured where the signal is received; the parts of one split signal count once. */
function positionDue(tripId: string, signal: string): boolean {
  const now = seams.now();
  const last = link.positions.get(tripId);
  if (last && last.signal === signal) return true;
  if (last && now - last.at < POSITION_EVERY_MS) return false;
  if (link.positions.size >= 500) {
    for (const [id, seen] of link.positions) if (now - seen.at >= POSITION_EVERY_MS) link.positions.delete(id);
  }
  link.positions.set(tripId, { at: now, signal });
  return true;
}

/** Hands a signal to this server's own streams: one published here, or one heard from another server. */
function deliver(channels: string[], event: RealtimeEvent, signal: string): void {
  if (event.type === "transport.position" && typeof event.tripId === "string" && !positionDue(event.tripId, signal)) return;
  const targets = new Set(channels);
  for (const subscriber of bus) {
    if (subscriber.lastSignal === signal) continue;
    for (const name of targets) {
      if (subscriber.channels.has(name)) {
        subscriber.lastSignal = signal;
        try {
          subscriber.send(event);
        } catch {
          // A dead connection must not stop the rest of the fan-out; the
          // stream's own cancel handler removes it from the bus.
          bus.delete(subscriber);
        }
        break;
      }
    }
  }
}

/** A register's signal crosses with a few of its client ids: any one of them tells the register that saved from a colleague's. */
function slim(event: RealtimeEvent): RealtimeEvent {
  if (event.type === "attendance.updated" && event.clientIds && event.clientIds.length > CLIENT_IDS_ACROSS) return { ...event, clientIds: event.clientIds.slice(0, CLIENT_IDS_ACROSS) };
  return event;
}

/**
 * The payloads one published signal crosses as: none for the assistant's words, one for nearly everything, and
 * several when the channel list (a long route's riders) would pass the database's limit: each part names the same
 * signal, with its own share of the channels.
 */
export function signalsFor(origin: string, id: string, channels: string[], event: RealtimeEvent): string[] {
  if (CROSSES[event.type] !== true) return [];
  const e = slim(event);
  const encode = (c: string[]) => JSON.stringify({ o: origin, i: id, c, e });
  const bytes = (text: string) => Buffer.byteLength(text, "utf8");
  const empty = bytes(encode([]));
  const parts: string[] = [];
  let part: string[] = [];
  let size = empty;
  for (const name of new Set(channels)) {
    const more = bytes(JSON.stringify(name)) + 1;
    if (part.length > 0 && size + more > SIGNAL_MAX_BYTES) {
      parts.push(encode(part));
      part = [];
      size = empty;
    }
    part.push(name);
    size += more;
  }
  if (part.length > 0) parts.push(encode(part));
  // A part that is still too long (it cannot be, with ids alone) is not sent: the database would refuse it.
  return parts.filter((text) => bytes(text) <= SIGNAL_MAX_BYTES);
}

function sendLost(): void {
  link.lost++;
  const now = seams.now();
  if (now - link.lostSaidAt < 60_000) return;
  console.error(`[realtime] ${link.lost} live signal(s) could not be passed to the other servers; the screens there show them on their next read`);
  link.lostSaidAt = now;
  link.lost = 0;
}

/** One payload to the other servers, behind the sends before it. Never throws and never rejects. */
function sendAcross(payload: string): void {
  if (link.queued >= SEND_QUEUE_MAX) return sendLost();
  link.queued++;
  link.tail = link.tail.then(async () => {
    try {
      // Started outside any transaction the publisher is in: the statement is no part of that work (tenant-context.ts).
      await outsideTransaction(() => seams.notify(payload).then(() => undefined));
    } catch {
      sendLost();
    } finally {
      link.queued--;
    }
  });
}

/**
 * A payload heard on the shared channel. Our own are dropped (this server's streams had them when they were
 * published), and so is anything that is not a signal of a type that crosses: the channel carries no words.
 */
export function receiveSignal(payload: string): void {
  let heard: unknown;
  try {
    heard = JSON.parse(payload);
  } catch {
    return;
  }
  if (!heard || typeof heard !== "object") return;
  const { o, i, c, e } = heard as { o?: unknown; i?: unknown; c?: unknown; e?: unknown };
  if (typeof o !== "string" || typeof i !== "string" || !Array.isArray(c) || !c.every((name) => typeof name === "string")) return;
  if (!e || typeof e !== "object" || typeof (e as { type?: unknown }).type !== "string") return;
  if (o === link.origin) return;
  const event = e as RealtimeEvent;
  if (CROSSES[event.type] !== true) return;
  deliver(c as string[], event, `${o}:${i}`);
}

export function publish(channels: string[], event: RealtimeEvent): void {
  const id = (++link.counter).toString(36);
  deliver(channels, event, `${link.origin}:${id}`);
  if (busMode() !== "database") return;
  try {
    for (const payload of signalsFor(link.origin, id, channels, event)) sendAcross(payload);
  } catch {
    // Publishing is a courtesy to open screens: it never fails the save that called it.
    sendLost();
  }
}

export const channel = {
  school: (schoolId: string) => `school:${schoolId}`,
  class: (classId: string) => `class:${classId}`,
  user: (userId: string) => `user:${userId}`,
  student: (studentMembershipId: string) => `student:${studentMembershipId}`,
  /** One member of staff, by membership: the remark threads they are party to. */
  staff: (membershipId: string) => `staff:${membershipId}`,
};

export function subscriberCount(): number {
  return bus.size;
}
