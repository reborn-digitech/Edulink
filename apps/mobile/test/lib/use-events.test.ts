import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { backoffMs, connectEvents, createFrameParser, parseEvent, readFrames, holdsStream, type Frame, type RealtimeEvent, type StreamFetch } from "@/lib/use-events";

/**
 * The phone's ear on the event stream, driven without React: the frame
 * parser over chunks cut anywhere, the keep-alive comment, an event the
 * screen did not ask for, session.ended closing the stream for good, and the
 * reconnect table (1 s doubling to 30 s) when the stream ends or fails.
 */
const encoder = new TextEncoder();

/** A body the test feeds by hand: frames go in as text, the stream closes or fails on demand. */
function fakeBody() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    stream,
    send: (text: string) => controller.enqueue(encoder.encode(text)),
    close: () => controller.close(),
    fail: (why: Error) => controller.error(why),
  };
}

/** Fake timers the connection logic takes, run by the test one at a time. */
function fakeTimers() {
  const pending: { fn: () => void; ms: number }[] = [];
  return {
    pending,
    setTimer: (fn: () => void, ms: number) => {
      const handle = { fn, ms };
      pending.push(handle);
      return handle;
    },
    clearTimer: (handle: unknown) => {
      const i = pending.indexOf(handle as { fn: () => void; ms: number });
      if (i >= 0) pending.splice(i, 1);
    },
    /** Runs the one timer waiting and returns its delay. */
    fire: () => {
      const next = pending.shift();
      if (!next) throw new Error("no timer waiting");
      next.fn();
      return next.ms;
    },
  };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe("the frame parser", () => {
  it("reads event, data and id, and dispatches on the blank line", () => {
    const p = createFrameParser();
    expect(p.push('event: attendance.updated\ndata: {"type":"attendance.updated"}\nid: 7\n\n')).toEqual<Frame[]>([{ event: "attendance.updated", data: '{"type":"attendance.updated"}', id: "7" }]);
  });

  it("joins a frame split across chunks, anywhere in a line or a line break", () => {
    const p = createFrameParser();
    expect(p.push("event: substitution.upd")).toEqual([]);
    expect(p.push('ated\r\ndata: {"a":1,\r\n')).toEqual([]);
    expect(p.push('data: "b":2}\r')).toEqual([]);
    expect(p.push("\n\r\n")).toEqual([{ event: "substitution.updated", data: '{"a":1,\n"b":2}' }]);
  });

  it("drops the keep-alive comment and an unknown field, and names an unnamed event 'message'", () => {
    const p = createFrameParser();
    expect(p.push(": keep-alive\n\n")).toEqual([]);
    expect(p.push("retry: 5000\ndata:x\n\n")).toEqual([{ event: "message", data: "x" }]);
    expect(p.push("data\n\n")).toEqual([{ event: "message", data: "" }]);
  });

  it("flushes a last frame the server did not end with a blank line", () => {
    const p = createFrameParser();
    expect(p.push("event: notification\ndata: {}")).toEqual([]);
    expect(p.end()).toEqual([{ event: "notification", data: "{}" }]);
    expect(p.end()).toEqual([]);
  });

  it("parses the data of a named event and refuses anything that is not one", () => {
    expect(parseEvent('{"type":"notification","userId":"u1"}')).toEqual({ type: "notification", userId: "u1" });
    expect(parseEvent("{}")).toBeNull();
    expect(parseEvent("not json")).toBeNull();
    expect(parseEvent("null")).toBeNull();
  });

  it("readFrames hands each frame on as its bytes arrive, and resolves when the stream closes", async () => {
    const body = fakeBody();
    const seen: Frame[] = [];
    const done = readFrames(body.stream, (f) => seen.push(f));
    body.send("event: a\n");
    body.send("data: 1\n\n: keep-alive\n\nevent: b\ndata: 2\n\n");
    await tick();
    expect(seen).toEqual([
      { event: "a", data: "1" },
      { event: "b", data: "2" },
    ]);
    body.send("event: c\ndata: 3");
    body.close();
    await done;
    expect(seen).toHaveLength(3);
    expect(seen[2]).toEqual({ event: "c", data: "3" });
  });
});

describe("the backoff table", () => {
  it("doubles from one second and caps at thirty", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 9].map(backoffMs)).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000]);
  });

  it("only an active (or not yet known) app holds a stream", () => {
    expect(holdsStream("active")).toBe(true);
    expect(holdsStream("unknown")).toBe(true);
    expect(holdsStream(null)).toBe(true);
    expect(holdsStream("background")).toBe(false);
    expect(holdsStream("inactive")).toBe(false);
  });
});

describe("the connection", () => {
  beforeEach(() => {
    __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
  });

  /** A fetch whose every answer is a fresh fake body the test controls; the calls are kept for their headers. */
  function bench(answer?: (n: number) => { ok: boolean; status: number; body: ReadableStream<Uint8Array> | null }) {
    const bodies: ReturnType<typeof fakeBody>[] = [];
    const calls: { url: string; headers: Record<string, string>; signal: AbortSignal }[] = [];
    const fetch: StreamFetch = async (url, init) => {
      bodies.push(fakeBody());
      calls.push({ url, headers: init.headers, signal: init.signal });
      return answer ? answer(calls.length) : { ok: true, status: 200, body: bodies.at(-1)!.stream };
    };
    return { bodies, calls, fetch };
  }

  it("opens with the bearer in the header, never the URL, and hands on only the events asked for", async () => {
    const { bodies, calls, fetch } = bench();
    const timers = fakeTimers();
    const events: RealtimeEvent[] = [];
    const ended = jest.fn();
    const close = connectEvents({ types: ["attendance.updated"], onEvent: (e) => events.push(e), onSessionEnded: ended, fetch, ...timers });
    await tick();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("http://localhost:3000/api/v1/events");
    expect(calls[0]!.url).not.toContain("tok-zz");
    expect(calls[0]!.headers).toMatchObject({ Authorization: "Bearer tok-zz", Accept: "text/event-stream" });
    const body = bodies[0]!;
    body.send('event: ready\ndata: {"channels":["class:c1"]}\n\n');
    body.send(': keep-alive\n\nevent: substitution.updated\ndata: {"type":"substitution.updated","dateKey":"2026-09-07","slotId":"s1"}\n\n');
    body.send('event: attendance.updated\ndata: {"type":"attendance.updated","classId":"c1","dateKey":"2026-09-07","clientIds":["k1"]}\n\n');
    // A frame whose data does not say the type it was sent under is not an event.
    body.send('event: attendance.updated\ndata: {"type":"grade.updated"}\n\n');
    await tick();
    expect(events).toEqual([{ type: "attendance.updated", classId: "c1", dateKey: "2026-09-07", clientIds: ["k1"] }]);
    expect(ended).not.toHaveBeenCalled();
    expect(timers.pending).toHaveLength(0);
    close();
    expect(calls[0]!.signal.aborted).toBe(true);
    // Closed: nothing more is heard, and no reconnect is scheduled.
    await tick();
    expect(timers.pending).toHaveLength(0);
  });

  it("session.ended closes the stream for good and says so", async () => {
    const { bodies, calls, fetch } = bench();
    const timers = fakeTimers();
    const events: RealtimeEvent[] = [];
    const ended = jest.fn();
    connectEvents({ types: ["notification"], onEvent: (e) => events.push(e), onSessionEnded: ended, fetch, ...timers });
    await tick();
    bodies[0]!.send('event: session.ended\ndata: {}\n\nevent: notification\ndata: {"type":"notification","userId":"u1"}\n\n');
    await tick();
    expect(ended).toHaveBeenCalledTimes(1);
    expect(events).toEqual([]);
    expect(calls[0]!.signal.aborted).toBe(true);
    // The reader was cancelled with the abort: the body is done, no reconnect is scheduled, nothing is reopened.
    await tick();
    expect(timers.pending).toHaveLength(0);
    expect(calls).toHaveLength(1);
  });

  it("reopens on the backoff table when the stream ends, and again when it fails; a stream that opened resets the count", async () => {
    const { bodies, calls, fetch } = bench();
    const timers = fakeTimers();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, fetch, ...timers });
    await tick();
    bodies[0]!.close();
    await tick();
    expect(timers.fire()).toBe(1_000);
    await tick();
    expect(calls).toHaveLength(2);
    bodies[1]!.fail(new Error("ZZ dropped"));
    await tick();
    expect(timers.fire()).toBe(2_000);
    await tick();
    expect(calls).toHaveLength(3);
    bodies[2]!.close();
    await tick();
    expect(timers.fire()).toBe(4_000);
    await tick();
    // The fourth attempt opened AND delivered a frame: the next failure starts the table over
    // (an open that dies before its first frame counts as a failure, so a proxy that accepts
    // and drops at once is not asked again every second).
    bodies[3]!.send('event: notification\ndata: {"type":"notification","userId":"u1"}\n\n');
    await tick();
    bodies[3]!.close();
    await tick();
    expect(timers.fire()).toBe(1_000);
    await tick();
    expect(calls).toHaveLength(5);
    close();
  });

  it("a refused open (429 over the cap, 401 after the token went) is tried again later, and a close while waiting clears the wait", async () => {
    const { calls, fetch } = bench((n) => (n < 3 ? { ok: false, status: n === 1 ? 429 : 401, body: null } : { ok: true, status: 200, body: null }));
    const timers = fakeTimers();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, fetch, ...timers });
    await tick();
    expect(calls).toHaveLength(1);
    expect(timers.fire()).toBe(1_000);
    await tick();
    expect(calls).toHaveLength(2);
    expect(timers.pending.map((t) => t.ms)).toEqual([2_000]);
    close();
    expect(timers.pending).toHaveLength(0);
  });

  it("a fetch that throws (offline) is tried again later", async () => {
    const timers = fakeTimers();
    const fetch: StreamFetch = async () => {
      throw new TypeError("Network request failed");
    };
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, fetch, ...timers });
    await tick();
    expect(timers.pending.map((t) => t.ms)).toEqual([1_000]);
    close();
  });

  it("signed out, the stream is opened without a bearer", async () => {
    __setKeyStore(memoryStore({}));
    const { calls, fetch } = bench();
    const timers = fakeTimers();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, fetch, ...timers });
    await tick();
    expect(calls[0]!.headers.Authorization).toBeUndefined();
    close();
  });
});
