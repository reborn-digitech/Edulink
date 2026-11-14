/**
 * The page's live stream (testing analysis of 13 November 2026, communication), driven with a fake EventSource and
 * fake timers as tests/use-events.test.ts drives it.
 *
 * TA-253 (Medium): a stream that dropped and reconnected (the browser's own retry, or the hook's after a refusal)
 * never re-read what was published while it was down, so a register shared by a class teacher and a cover showed
 * neither's marks made in the gap until a reload. TA-455 (Low): the reconnect waited exactly 1 s, 2 s, 4 s, so after a
 * restart every tab returned at the same second.
 */
import { describe, expect, it } from "vitest";
import { backoffMs, connectEvents, jittered, type EventSourceLike } from "@/lib/use-events";

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

class FakeSource implements EventSourceLike {
  static instances: FakeSource[] = [];
  readyState = CONNECTING;
  listeners = new Map<string, ((event: { data?: unknown }) => void)[]>();
  constructor(public url: string) {
    FakeSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: { data?: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {
    this.readyState = CLOSED;
  }
  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener({});
  }
  opens() {
    this.readyState = OPEN;
    this.emit("open");
  }
}

function timers() {
  const queue: { fn: () => void; ms: number }[] = [];
  return {
    setTimer: (fn: () => void, ms: number) => queue.push({ fn, ms }),
    clearTimer: () => {},
    fire: () => {
      const next = queue.shift()!;
      next.fn();
      return next.ms;
    },
  };
}

describe("TA-253: a stream that comes back re-reads what it missed", () => {
  it("TA-253: the browser's own reconnect and the hook's reopen each ask the page to re-read; the first open does not", () => {
    FakeSource.instances = [];
    const t = timers();
    let reread = 0;
    const close = connectEvents(() => {}, { types: ["attendance.updated"], EventSource: FakeSource, onSessionEnded: () => {}, onReconnect: () => reread++, setTimer: t.setTimer, clearTimer: t.clearTimer });
    const first = FakeSource.instances[0]!;
    first.opens();
    expect(reread).toBe(0);
    // The connection drops; the browser retries it by itself (CONNECTING) and it opens again.
    first.readyState = CONNECTING;
    first.emit("error");
    first.opens();
    expect(reread).toBe(1);
    // A refusal closes the source; the hook reopens it after the backoff, and that open re-reads too.
    first.readyState = CLOSED;
    first.emit("error");
    t.fire();
    FakeSource.instances[1]!.opens();
    expect(reread).toBe(2);
    close();
  });
});

describe("TA-455: the reconnect is spread", () => {
  it("TA-455: the same attempt waits between half its table value and all of it, by the random draw", () => {
    expect(jittered(backoffMs(0), () => 0)).toBe(500);
    expect(jittered(backoffMs(0), () => 1)).toBe(1_000);
    expect(jittered(backoffMs(3), () => 0.5)).toBe(6_000);
    const spread = new Set(Array.from({ length: 50 }, () => jittered(backoffMs(2), Math.random)));
    expect(spread.size).toBeGreaterThan(10);
    for (const ms of spread) expect(ms >= 2_000 && ms <= 4_000).toBe(true);
  });

  it("TA-455: connectEvents waits the spread delay when given a random source", () => {
    FakeSource.instances = [];
    const t = timers();
    const close = connectEvents(() => {}, { types: ["attendance.updated"], EventSource: FakeSource, onSessionEnded: () => {}, random: () => 0.25, setTimer: t.setTimer, clearTimer: t.clearTimer });
    const source = FakeSource.instances[0]!;
    source.readyState = CLOSED;
    source.emit("error");
    expect(t.fire()).toBe(625);
    close();
  });
});
