import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { backoffMs, connectEvents, IDLE_TIMEOUT_MS, jittered, type StreamFetch } from "@/lib/use-events";

/**
 * The phone's live stream (testing analysis of 13 November 2026, communication), driven without React as
 * test/lib/use-events.test.ts drives it.
 *
 * TA-253 (Medium): a stream that ended and was reopened never re-read what was published while it was down, and a
 * stream a network had silently dropped was never noticed, so a cover's register or a family's bus page froze with no
 * sign it was stale. TA-455 (Low): the reconnect waited exactly 1 s, 2 s, 4 s, so after a restart every phone came
 * back at the same second.
 */
const encoder = new TextEncoder();

function fakeBody() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return { stream, send: (text: string) => controller.enqueue(encoder.encode(text)), close: () => controller.close() };
}

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
    /** Runs the waiting timer of this delay. */
    fire: (ms: number) => {
      const i = pending.findIndex((p) => p.ms === ms);
      if (i < 0) throw new Error(`no timer of ${ms} ms waiting`);
      const [next] = pending.splice(i, 1);
      next!.fn();
    },
  };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function bench() {
  const bodies: ReturnType<typeof fakeBody>[] = [];
  const calls: { signal: AbortSignal }[] = [];
  const fetch: StreamFetch = async (_url, init) => {
    bodies.push(fakeBody());
    calls.push({ signal: init.signal });
    return { ok: true, status: 200, body: bodies.at(-1)!.stream };
  };
  return { bodies, calls, fetch };
}

describe("TA-253: the phone's stream", () => {
  beforeEach(() => {
    __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
  });

  it("TA-253: a stream that ended and opened again asks the screen to re-read; the first open does not", async () => {
    const { bodies, fetch } = bench();
    const timers = fakeTimers();
    const reread = jest.fn();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, onReconnect: reread, fetch, ...timers });
    await tick();
    bodies[0]!.send('event: ready\ndata: {"channels":[]}\n\n');
    await tick();
    expect(reread).not.toHaveBeenCalled();
    bodies[0]!.close();
    await tick();
    timers.fire(backoffMs(0));
    await tick();
    bodies[1]!.send('event: ready\ndata: {"channels":[]}\n\n');
    await tick();
    expect(reread).toHaveBeenCalledTimes(1);
    close();
  });

  it("TA-253: a stream that carries nothing, not even a keep-alive, for the idle limit is reopened; a keep-alive keeps it", async () => {
    const { bodies, calls, fetch } = bench();
    const timers = fakeTimers();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, idleMs: IDLE_TIMEOUT_MS, fetch, ...timers });
    await tick();
    bodies[0]!.send('event: ready\ndata: {"channels":[]}\n\n');
    await tick();
    expect(timers.pending.map((p) => p.ms)).toEqual([IDLE_TIMEOUT_MS]);
    // A keep-alive comment starts the idle clock again (the old one is cleared, a new one set).
    const before = timers.pending[0];
    bodies[0]!.send(": keep-alive\n\n");
    await tick();
    expect(timers.pending).toHaveLength(1);
    expect(timers.pending[0]).not.toBe(before);
    // Silence: the watchdog ends the connection, and it is reopened on the backoff table.
    timers.fire(IDLE_TIMEOUT_MS);
    await tick();
    expect(calls[0]!.signal.aborted).toBe(true);
    expect(timers.pending.map((p) => p.ms)).toEqual([backoffMs(0)]);
    timers.fire(backoffMs(0));
    await tick();
    expect(calls).toHaveLength(2);
    close();
    expect(timers.pending).toHaveLength(0);
  });
});

describe("TA-455: the phone's reconnect is spread", () => {
  beforeEach(() => {
    __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
  });

  it("TA-455: the same attempt waits between half its table value and all of it", () => {
    expect(jittered(backoffMs(0), () => 0)).toBe(500);
    expect(jittered(backoffMs(0), () => 1)).toBe(1_000);
    const spread = new Set(Array.from({ length: 50 }, () => jittered(backoffMs(2), Math.random)));
    expect(spread.size).toBeGreaterThan(10);
    for (const ms of spread) expect(ms >= 2_000 && ms <= 4_000).toBe(true);
  });

  it("TA-455: connectEvents waits the spread delay when given a random source", async () => {
    const { bodies, fetch } = bench();
    const timers = fakeTimers();
    const close = connectEvents({ types: ["notification"], onEvent: () => {}, onSessionEnded: () => {}, random: () => 0.25, fetch, ...timers });
    await tick();
    bodies[0]!.close();
    await tick();
    expect(timers.pending.map((p) => p.ms)).toEqual([625]);
    close();
  });
});
