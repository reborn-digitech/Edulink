import { describe, expect, it } from "vitest";
import { backoffMs, connectEvents, EVENTS_URL, parseEvent, type EventSourceLike } from "@/lib/use-events";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * The page's EventSource wrapper, driven with a fake source and fake timers:
 * what it parses, what it ignores, when it reconnects and how long it waits,
 * and that `session.ended` stops it for good.
 */

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

class FakeSource implements EventSourceLike {
  static instances: FakeSource[] = [];
  readyState = CONNECTING;
  closed = false;
  listeners = new Map<string, ((event: { data?: unknown }) => void)[]>();
  constructor(
    public url: string,
    public init?: { withCredentials?: boolean },
  ) {
    FakeSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: { data?: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() {
    this.closed = true;
    this.readyState = CLOSED;
  }
  /** The server's side: an `event:` line with its `data:`. */
  emit(type: string, data?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener({ data });
  }
  opens() {
    this.readyState = OPEN;
    this.emit("open");
  }
  /** The browser's error after a refused connection: readyState CLOSED. */
  refused() {
    this.readyState = CLOSED;
    this.emit("error");
  }
  /** The browser's error on a dropped connection it retries itself: readyState CONNECTING. */
  dropped() {
    this.readyState = CONNECTING;
    this.emit("error");
  }
}

/** Timers the test advances by hand. */
function fakeTimers() {
  const queue: { at: number; fn: () => void; id: number }[] = [];
  let now = 0;
  let next = 1;
  return {
    setTimer: (fn: () => void, ms: number) => {
      const id = next++;
      queue.push({ at: now + ms, fn, id });
      return id;
    },
    clearTimer: (handle: unknown) => {
      const idx = queue.findIndex((q) => q.id === handle);
      if (idx >= 0) queue.splice(idx, 1);
    },
    advance(ms: number) {
      now += ms;
      for (const due of queue.filter((q) => q.at <= now).sort((a, b) => a.at - b.at)) {
        queue.splice(queue.indexOf(due), 1);
        due.fn();
      }
    },
    pending: () => queue.map((q) => q.at - now),
  };
}

function setup(types: RealtimeEvent["type"][] = ["attendance.updated"]) {
  FakeSource.instances = [];
  const heard: RealtimeEvent[] = [];
  const timers = fakeTimers();
  let ended = 0;
  const close = connectEvents((event) => heard.push(event), {
    types,
    EventSource: FakeSource,
    onSessionEnded: () => ended++,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  return { heard, timers, close, endedCount: () => ended, source: () => FakeSource.instances.at(-1)! };
}

describe("parseEvent", () => {
  it("reads the data line as the event and refuses anything else", () => {
    expect(parseEvent(JSON.stringify({ type: "attendance.updated", classId: "c", dateKey: "2026-10-02" }))).toEqual({ type: "attendance.updated", classId: "c", dateKey: "2026-10-02" });
    expect(parseEvent("not json")).toBeNull();
    expect(parseEvent(JSON.stringify({ classId: "c" }))).toBeNull();
    expect(parseEvent(JSON.stringify("attendance.updated"))).toBeNull();
    expect(parseEvent(undefined)).toBeNull();
    expect(parseEvent(null)).toBeNull();
  });
});

describe("backoff", () => {
  it("doubles from one second and stops at thirty", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 20].map(backoffMs)).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000]);
  });
});

describe("connectEvents", () => {
  it("opens one stream with credentials and hands the page only the types it asked for", () => {
    const { heard, source, close } = setup(["attendance.updated", "remark.message"]);
    expect(FakeSource.instances).toHaveLength(1);
    expect(source().url).toBe(EVENTS_URL);
    expect(source().init?.withCredentials).toBe(true);
    source().opens();

    source().emit("attendance.updated", JSON.stringify({ type: "attendance.updated", classId: "c1", dateKey: "2026-10-02", clientIds: ["a"] }));
    source().emit("remark.message", JSON.stringify({ type: "remark.message", threadId: "t1" }));
    // A grade event is not listened for: nothing registered, nothing heard.
    source().emit("grade.updated", JSON.stringify({ type: "grade.updated", studentMembershipId: "s", assignmentId: "a" }));
    // A malformed line, and a line whose type does not match the event name, are dropped.
    source().emit("attendance.updated", "{{");
    source().emit("attendance.updated", JSON.stringify({ type: "remark.message", threadId: "t2" }));

    expect(heard).toEqual([
      { type: "attendance.updated", classId: "c1", dateKey: "2026-10-02", clientIds: ["a"] },
      { type: "remark.message", threadId: "t1" },
    ]);
    close();
    expect(source().closed).toBe(true);
  });

  it("reconnects a refused stream with a doubling wait, resets the wait once it opens, and leaves the browser's own retry alone", () => {
    const { heard, timers, source, close } = setup();
    const first = source();
    first.refused();
    expect(first.closed).toBe(true);
    expect(timers.pending()).toEqual([1_000]);
    timers.advance(999);
    expect(FakeSource.instances).toHaveLength(1);
    timers.advance(1);
    expect(FakeSource.instances).toHaveLength(2);

    // Refused again: two seconds, then four.
    source().refused();
    expect(timers.pending()).toEqual([2_000]);
    timers.advance(2_000);
    source().refused();
    expect(timers.pending()).toEqual([4_000]);
    timers.advance(4_000);
    expect(FakeSource.instances).toHaveLength(4);

    // It opens: the next refusal starts from one second again.
    source().opens();
    source().emit("attendance.updated", JSON.stringify({ type: "attendance.updated", classId: "c", dateKey: "d" }));
    expect(heard).toHaveLength(1);
    source().refused();
    expect(timers.pending()).toEqual([1_000]);
    timers.advance(1_000);

    // A dropped connection the browser is retrying itself (CONNECTING) is not touched and not re-timed.
    const live = source();
    live.opens();
    live.dropped();
    expect(live.closed).toBe(false);
    expect(timers.pending()).toEqual([]);
    expect(FakeSource.instances).toHaveLength(5);

    close();
    expect(live.closed).toBe(true);
  });

  it("closing while a reconnect is pending cancels it, and a late event after close is not heard", () => {
    const { heard, timers, source, close } = setup();
    const first = source();
    first.refused();
    expect(timers.pending()).toEqual([1_000]);
    close();
    timers.advance(5_000);
    expect(FakeSource.instances).toHaveLength(1);
    first.emit("attendance.updated", JSON.stringify({ type: "attendance.updated", classId: "c", dateKey: "d" }));
    expect(heard).toEqual([]);
  });

  it("session.ended closes the stream for good and tells the page once", () => {
    const { timers, source, close, endedCount } = setup();
    source().opens();
    source().emit("session.ended", "{}");
    expect(endedCount()).toBe(1);
    expect(source().closed).toBe(true);
    // No reconnect follows, whatever the browser says next.
    source().refused();
    source().emit("session.ended", "{}");
    timers.advance(60_000);
    expect(FakeSource.instances).toHaveLength(1);
    expect(endedCount()).toBe(1);
    close();
  });

  it("a constructor that throws leaves the page as it was, without a retry loop", () => {
    class Refusing implements EventSourceLike {
      readyState = CLOSED;
      constructor() {
        throw new Error("no");
      }
      addEventListener() {}
      close() {}
    }
    const timers = fakeTimers();
    const close = connectEvents(() => {}, { types: ["attendance.updated"], EventSource: Refusing, onSessionEnded: () => {}, setTimer: timers.setTimer, clearTimer: timers.clearTimer });
    expect(timers.pending()).toEqual([]);
    close();
  });
});
