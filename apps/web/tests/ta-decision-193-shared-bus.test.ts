import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import * as realtime from "@/lib/realtime";
import type { RealtimeEvent } from "@/lib/realtime";
import * as pgListen from "@/lib/pg-listen";
import type { ListenLink, ListenOptions } from "@/lib/pg-listen";
import { markInTransaction } from "@/lib/tenant-context";
import { checkEnv } from "@/lib/env";
import { createSession } from "@/lib/session";
import { GET as eventsGet } from "@/app/api/v1/events/route";
import { __resetCookies } from "./stubs/next-headers";

/**
 * TA-193, decided 14 November 2026: the rules of the bus between servers, each held on its own.
 *
 * tests/ta-decision-193-two-servers.test.ts runs two real processes; this file holds, in one process, what the
 * decision says of each part, with the database, the clock and the listening connection stood in for where a case
 * needs to see inside (realtime.ts's seams) and the real database where the rule is the database's own:
 *
 *   - what crosses: ids and progress stages; the assistant's answer words never, sent or received;
 *   - a signal too long for the database's limit is split, and the limit itself is confirmed against the database;
 *   - one position per trip in fifteen seconds, kept where signals are received, with no stored time;
 *   - every send catches its own failure, and a signal published from inside a transaction's work is still sent;
 *   - when the listening link drops, the streams end, spread over time, and the events door ends its stream;
 *   - the listening connection itself: any role may listen, it hears what another role notifies, and it comes back
 *     by itself when the database ends it.
 *
 * One ZZ person of this file's own (for the events door's session), removed afterwards.
 */

const db = new PrismaClient();
const STAMP = Date.now();
const WEB = join(__dirname, "..");

const bus = realtime as unknown as {
  subscribe: (channels: string[], send: (event: RealtimeEvent) => void, end?: () => void) => () => void;
  publish: (channels: string[], event: RealtimeEvent) => void;
  __setBusSeams: (next: Record<string, unknown> | null) => void;
  __resetBus: () => void;
  signalsFor: (origin: string, id: string, channels: string[], event: RealtimeEvent) => string[];
  receiveSignal: (payload: string) => void;
  signalsSent: () => Promise<void>;
  endSpreadMs: (streams: number) => number;
  linkPhase: () => string;
  SIGNAL_CHANNEL: string;
  SIGNAL_MAX_BYTES: number;
  POSITION_EVERY_MS: number;
};

/** A signal as another server would have sent it. */
const from = (origin: string, id: string, channels: string[], event: RealtimeEvent): string => JSON.stringify({ o: origin, i: id, c: channels, e: event });
const position = (tripId: string, lat: number): RealtimeEvent => ({ type: "transport.position", tripId, lat, lng: 73.8, at: "2026-11-14T03:00:00.000Z" });

let userId = "";

beforeAll(async () => {
  userId = (await db.user.create({ data: { name: "ZZ TA193 Person", email: `zz-ta193-${STAMP}@test.invalid` }, select: { id: true } })).id;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  bus.__resetBus?.();
  bus.__setBusSeams?.(null);
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("TA-193: what crosses between servers", () => {
  it("TA-193: a signal heard from another server reaches this server's streams, and this server's own, heard back, is not handed out twice", async () => {
    const sent: string[] = [];
    bus.__setBusSeams({ mode: "database", notify: async (payload: string) => void sent.push(payload), open: () => ({ close: () => {} }) });
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["class:zz193a"], (event) => heard.push(event));

    bus.receiveSignal(from("another-server", "1", ["class:zz193a", "school:zz193"], { type: "attendance.updated", classId: "zz193a", dateKey: "2026-11-14", clientIds: ["m1"] }));
    expect(heard).toEqual([{ type: "attendance.updated", classId: "zz193a", dateKey: "2026-11-14", clientIds: ["m1"] }]);

    bus.publish(["class:zz193a"], { type: "remark.message", threadId: "zz193t" });
    await bus.signalsSent();
    expect(heard).toHaveLength(2);
    expect(sent).toHaveLength(1);
    // Every listening server hears the channel, the sender included: its own signal comes back and is dropped.
    bus.receiveSignal(sent[0]!);
    expect(heard).toHaveLength(2);
    // What crossed: the server's own name, the signal's number, its channels and the event, ids only.
    expect(Object.keys(JSON.parse(sent[0]!) as object).sort()).toEqual(["c", "e", "i", "o"]);
    expect((JSON.parse(sent[0]!) as { c: string[]; e: unknown }).c).toEqual(["class:zz193a"]);
    expect((JSON.parse(sent[0]!) as { e: unknown }).e).toEqual({ type: "remark.message", threadId: "zz193t" });
  });

  it("TA-193: the assistant's answer words never cross: not sent, and not taken if they arrive", async () => {
    const sent: string[] = [];
    bus.__setBusSeams({ mode: "database", notify: async (payload: string) => void sent.push(payload), open: () => ({ close: () => {} }) });
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["user:zz193u"], (event) => heard.push(event));
    const delta: RealtimeEvent = { type: "assistant.delta", conversationId: "c", messageId: "m", seq: 0, text: "a child's answer words" };

    bus.publish(["user:zz193u"], { type: "assistant.stage", conversationId: "c", stage: "SEARCHING" });
    bus.publish(["user:zz193u"], delta);
    bus.publish(["user:zz193u"], { type: "assistant.done", conversationId: "c", messageId: "m", verdict: "ANSWERED" });
    await bus.signalsSent();
    // The stream on the answering server has the words, as before.
    expect(heard.map((e) => e.type)).toEqual(["assistant.stage", "assistant.delta", "assistant.done"]);
    // The shared channel has the stage and the end, and no word.
    expect(sent.map((p) => (JSON.parse(p) as { e: { type: string } }).e.type)).toEqual(["assistant.stage", "assistant.done"]);
    expect(sent.join("")).not.toContain("answer words");
    expect(bus.signalsFor("o", "1", ["user:zz193u"], delta)).toEqual([]);

    // Sent by something else on the channel, the words are still not handed to a stream; nor is a type nobody knows.
    bus.receiveSignal(from("another-server", "9", ["user:zz193u"], delta));
    bus.receiveSignal(from("another-server", "10", ["user:zz193u"], { type: "made.up", text: "x" } as unknown as RealtimeEvent));
    bus.receiveSignal("not json");
    bus.receiveSignal(JSON.stringify({ o: "another-server", i: "11", c: "user:zz193u", e: { type: "notification" } }));
    expect(heard).toHaveLength(3);
  });

  it("TA-193: in development and the tests nothing is sent to the database and no connection is opened", async () => {
    const notify = vi.fn(async () => undefined);
    const open = vi.fn(() => ({ close: () => {} }));
    bus.__setBusSeams({ notify, open });
    expect(process.env.NODE_ENV).toBe("test");
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["class:zz193b"], (event) => heard.push(event));
    bus.publish(["class:zz193b"], { type: "remark.message", threadId: "zz193t" });
    await bus.signalsSent();
    expect(heard).toHaveLength(1);
    expect(notify).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("TA-193: only a server that holds a stream listens: publishing alone, as the jobs server does, opens no connection", async () => {
    const open = vi.fn(() => ({ close: () => {} }));
    const notify = vi.fn(async () => undefined);
    bus.__setBusSeams({ mode: "database", notify, open });
    bus.publish(["user:zz193j"], { type: "notification", userId: "zz193j" });
    await bus.signalsSent();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    bus.subscribe(["user:zz193j"], () => {});
    bus.subscribe(["user:zz193k"], () => {});
    // One connection for the server, however many streams.
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe("TA-193: a signal too long for the database", () => {
  it("TA-193: the database refuses a payload of 8,000 bytes and takes one of 7,999; no signal is made longer than 7,000", async () => {
    // The database's own rule, not stated in the repository: confirmed here against the server the suite runs on.
    await expect(db.$executeRaw`SELECT pg_notify(${`zz_ta193_size_${STAMP}`}, repeat('a', 7999))`).resolves.toBeDefined();
    await expect(db.$executeRaw`SELECT pg_notify(${`zz_ta193_size_${STAMP}`}, repeat('a', 8000))`).rejects.toThrow();
    expect(bus.SIGNAL_MAX_BYTES).toBeLessThan(8_000);

    // A long route: 450 riders and the school, about 16,000 bytes of channel names (transport.ts publishes exactly this list).
    const riders = Array.from({ length: 450 }, (_, i) => `student:cmzz193${String(i).padStart(4, "0")}xxxxxxxxxxxxxxxx`);
    const channels = ["school:cmzz193school0000000000000", ...riders];
    const parts = bus.signalsFor("5d0f8a3e-0000-4000-8000-000000000000", "k3", channels, position("cmzz193trip00000000000000", 18.5));
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(Buffer.byteLength(part, "utf8")).toBeLessThanOrEqual(bus.SIGNAL_MAX_BYTES);
    const decoded = parts.map((part) => JSON.parse(part) as { o: string; i: string; c: string[]; e: RealtimeEvent });
    // Every channel is in exactly one part, and every part names the same signal.
    expect(decoded.flatMap((d) => d.c)).toEqual(channels);
    expect(new Set(decoded.map((d) => `${d.o}:${d.i}`)).size).toBe(1);
    for (const d of decoded) expect(d.e).toEqual(position("cmzz193trip00000000000000", 18.5));
    // And the database takes each part.
    for (const part of parts) await expect(db.$executeRaw`SELECT pg_notify(${`zz_ta193_size_${STAMP}`}, ${part})`).resolves.toBeDefined();
  });

  it("TA-193: a register's signal for a very large class crosses with a few of its client ids, enough to tell the saver's own save", () => {
    const clientIds = Array.from({ length: 300 }, (_, i) => `zz193-${"m".repeat(52)}-${String(i).padStart(4, "0")}`);
    const parts = bus.signalsFor("o", "1", ["class:zz193big", "school:zz193"], { type: "attendance.updated", classId: "zz193big", dateKey: "2026-11-14", clientIds });
    expect(parts).toHaveLength(1);
    expect(Buffer.byteLength(parts[0]!, "utf8")).toBeLessThanOrEqual(bus.SIGNAL_MAX_BYTES);
    const crossed = (JSON.parse(parts[0]!) as { e: { clientIds: string[] } }).e.clientIds;
    expect(crossed.length).toBeGreaterThan(0);
    // The register's rule (register.tsx): "ours" when every id on the event is one this tab minted.
    expect(crossed.every((id) => clientIds.includes(id))).toBe(true);
  });

  it("TA-193: the parts of one split signal reach a stream once, though it listens on channels in two of them", () => {
    bus.__setBusSeams({ mode: "database", notify: async () => undefined, open: () => ({ close: () => {} }) });
    const riders = Array.from({ length: 450 }, (_, i) => `student:cmzz193${String(i).padStart(4, "0")}xxxxxxxxxxxxxxxx`);
    const parts = bus.signalsFor("another-server", "7", ["school:zz193", ...riders], position("zz193trip", 18.5));
    const guardian: RealtimeEvent[] = [];
    const last: RealtimeEvent[] = [];
    bus.subscribe([riders[0]!, riders[449]!], (event) => guardian.push(event));
    bus.subscribe([riders[449]!], (event) => last.push(event));
    for (const part of parts) bus.receiveSignal(part);
    expect(guardian).toHaveLength(1);
    // The fifteen-second limit counts the parts of one signal once: the rider in the last part is not skipped.
    expect(last).toHaveLength(1);
  });
});

describe("TA-193: the bus's fifteen seconds, where signals are received", () => {
  it("TA-193: one position per trip in fifteen seconds reaches a stream, whichever server took the driver's phone", () => {
    let now = 1_000_000;
    bus.__setBusSeams({ mode: "database", notify: async () => undefined, open: () => ({ close: () => {} }), now: () => now });
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["student:zz193rider"], (event) => heard.push(event));
    const lats = () => heard.map((e) => (e as { lat: number }).lat);

    bus.receiveSignal(from("server-a", "1", ["student:zz193rider"], position("zz193trip", 1)));
    now += 7_000;
    // The next batch landed on another server, which had kept no time for this trip.
    bus.receiveSignal(from("server-b", "1", ["student:zz193rider"], position("zz193trip", 2)));
    now += 3_000;
    // And the one after on this server itself.
    bus.publish(["student:zz193rider"], position("zz193trip", 3));
    expect(lats()).toEqual([1]);
    // Another trip is not held back by this one.
    bus.receiveSignal(from("server-b", "2", ["student:zz193rider"], position("zz193other", 9)));
    expect(lats()).toEqual([1, 9]);
    now += 5_000;
    bus.receiveSignal(from("server-b", "3", ["student:zz193rider"], position("zz193trip", 4)));
    expect(lats()).toEqual([1, 9, 4]);
    // A trip's start and end are never held back.
    bus.receiveSignal(from("server-b", "4", ["student:zz193rider"], { type: "transport.trip", tripId: "zz193trip", status: "ENDED" }));
    expect(heard).toHaveLength(4);
    expect(bus.POSITION_EVERY_MS).toBe(15_000);
  });

  it("TA-193: the limit is no longer kept in the memory of the server that took the phone, and no time is stored", () => {
    const transport = readFileSync(join(WEB, "src/lib/transport.ts"), "utf8");
    expect(transport).not.toMatch(/lastPublished/);
    expect(transport).not.toMatch(/PUBLISH_EVERY_MS/);
    // The position goes out with every accepted batch; the receiving side keeps the fifteen seconds.
    expect(transport).toMatch(/await tellNear\(d\.schoolId, trip, riders\);\s+const newest = [^\n]+\n\s+publish\(\[channel\.school\(d\.schoolId\)/);
  });
});

describe("TA-193: every send catches its own failure", () => {
  it("TA-193: a database that refuses the notify, or a send that throws, fails nothing: the save's own streams still hear, and the next signal still goes", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    let calls = 0;
    const sent: string[] = [];
    bus.__setBusSeams({
      mode: "database",
      open: () => ({ close: () => {} }),
      notify: (payload: string) => {
        calls++;
        if (calls === 1) return Promise.reject(new Error("the database is away"));
        if (calls === 2) throw new Error("thrown at once");
        sent.push(payload);
        return Promise.resolve();
      },
    });
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["class:zz193c"], (event) => heard.push(event));
    try {
      expect(() => bus.publish(["class:zz193c"], { type: "remark.message", threadId: "one" })).not.toThrow();
      expect(() => bus.publish(["class:zz193c"], { type: "remark.message", threadId: "two" })).not.toThrow();
      expect(() => bus.publish(["class:zz193c"], { type: "remark.message", threadId: "three" })).not.toThrow();
      await bus.signalsSent();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(heard).toHaveLength(3);
      expect(calls).toBe(3);
      expect(sent).toHaveLength(1);
      expect(sent[0]).toContain("three");
      expect(unhandled).toEqual([]);
      // Said once, with a count and no signal's contents.
      expect(said).toHaveBeenCalledTimes(1);
      expect(String(said.mock.calls[0]![0])).not.toContain("one");
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("TA-193: sends go one behind another, in the order published, and a database that stops answering does not pile them up without end", async () => {
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    const sent: string[] = [];
    let inFlight = 0;
    let most = 0;
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    bus.__setBusSeams({
      mode: "database",
      open: () => ({ close: () => {} }),
      notify: async (payload: string) => {
        most = Math.max(most, ++inFlight);
        // The first send waits on a database that is not answering; the rest queue behind it.
        if (sent.length === 0) await held;
        sent.push((JSON.parse(payload) as { e: { threadId: string } }).e.threadId);
        inFlight--;
      },
    });
    const heard: RealtimeEvent[] = [];
    bus.subscribe(["class:zz193q"], (event) => heard.push(event));
    for (let i = 0; i < 5_003; i++) bus.publish(["class:zz193q"], { type: "remark.message", threadId: `t${i}` });
    // The server's own streams have every one at once, whatever the database is doing.
    expect(heard).toHaveLength(5_003);
    release();
    await bus.signalsSent();
    // 5,000 wait their turn; the three past that were dropped and said so, once.
    expect(sent).toHaveLength(5_000);
    expect(sent.slice(0, 3)).toEqual(["t0", "t1", "t2"]);
    expect(sent[4_999]).toBe("t4999");
    expect(most).toBe(1);
    expect(said).toHaveBeenCalledTimes(1);
  });

  it("TA-193: a signal published from inside a tenant transaction's work is sent on the real pool, and a listening connection hears it", async () => {
    const heard: string[] = [];
    let up: () => void = () => {};
    const isUp = new Promise<void>((resolve) => (up = resolve));
    // Any connection may listen: this one is the application role's (tests/setup.ts keeps its URL), and the notify is the owner's.
    const listener = pgListen.listen({ url: () => process.env.DATABASE_APP_URL, channel: bus.SIGNAL_CHANNEL, onNotify: (payload) => heard.push(payload), onUp: () => up(), onDown: () => {} });
    try {
      await isUp;
      bus.__setBusSeams({ mode: "database", open: () => ({ close: () => {} }) });
      const marker = `zz193-in-tx-${STAMP}`;
      // db.ts's guard throws on a query made through `db` inside this flag in development and test: the notify is
      // started outside it, so the signal goes and nothing is thrown or swallowed.
      const said = vi.spyOn(console, "error").mockImplementation(() => {});
      await markInTransaction(async () => {
        bus.publish([`class:${marker}`], { type: "attendance.session.finalized", classId: marker, dateKey: "2026-11-14" });
        await bus.signalsSent();
      });
      for (let i = 0; i < 100 && !heard.some((p) => p.includes(marker)); i++) await new Promise((resolve) => setTimeout(resolve, 50));
      const mine = heard.filter((p) => p.includes(marker));
      expect(mine).toHaveLength(1);
      expect((JSON.parse(mine[0]!) as { e: unknown }).e).toEqual({ type: "attendance.session.finalized", classId: marker, dateKey: "2026-11-14" });
      expect(said).not.toHaveBeenCalled();
    } finally {
      listener.close();
    }
  }, 30_000);
});

describe("TA-193: when the listening link drops", () => {
  /** A listening connection the test drives by hand. */
  const fakeLink = () => {
    const held: { options: ListenOptions | null; opened: number } = { options: null, opened: 0 };
    const open = (options: ListenOptions): ListenLink => {
      held.options = options;
      held.opened++;
      return { close: () => {} };
    };
    return { held, open };
  };

  it("TA-193: the server's streams are ended, spread over time, and it goes on serving its own signals meanwhile", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { held, open } = fakeLink();
    const randoms = [0, 0.5, 0.999];
    bus.__setBusSeams({ mode: "database", notify: async () => undefined, open, random: () => randoms.shift() ?? 0 });
    const ended: string[] = [];
    const heard: string[] = [];
    const unsubscribe: Record<string, () => void> = {};
    for (const name of ["a", "b", "c"]) unsubscribe[name] = bus.subscribe(["class:zz193d"], () => heard.push(name), () => {
      ended.push(name);
      unsubscribe[name]!();
    });
    expect(bus.linkPhase()).toBe("opening");
    held.options!.onUp();
    expect(bus.linkPhase()).toBe("up");
    vi.advanceTimersByTime(60_000);
    // A link that comes up for the first time ends nobody.
    expect(ended).toEqual([]);

    held.options!.onDown("the connection closed");
    expect(bus.linkPhase()).toBe("down");
    // Not all at once: three streams over five seconds, each at its own moment.
    vi.advanceTimersByTime(1);
    expect(ended).toEqual(["a"]);
    bus.publish(["class:zz193d"], { type: "remark.message", threadId: "local" });
    expect(heard).toEqual(["b", "c"]);
    vi.advanceTimersByTime(2_500);
    expect(ended).toEqual(["a", "b"]);
    vi.advanceTimersByTime(2_500);
    expect(ended).toEqual(["a", "b", "c"]);
    // The connection is the listener's to open again; the bus asks for it once.
    expect(held.opened).toBe(1);
  });

  it("TA-193: a stream opened while the link is down is ended once it is back, and one opened after is left alone", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { held, open } = fakeLink();
    bus.__setBusSeams({ mode: "database", notify: async () => undefined, open, random: () => 0 });
    const ended: string[] = [];
    bus.subscribe(["class:zz193e"], () => {}, () => ended.push("first"));
    // The first opening fails: the stream is left (its own server's signals reach it) until the link is up.
    held.options!.onDown("ECONNREFUSED");
    bus.subscribe(["class:zz193e"], () => {}, () => ended.push("while-down"));
    vi.advanceTimersByTime(120_000);
    expect(ended).toEqual([]);
    held.options!.onUp();
    vi.advanceTimersByTime(1);
    expect(ended.sort()).toEqual(["first", "while-down"]);
    bus.subscribe(["class:zz193e"], () => {}, () => ended.push("after"));
    vi.advanceTimersByTime(120_000);
    expect(ended).toHaveLength(2);
  });

  it("TA-193: the spread is about five streams a second, never under five seconds nor over two minutes", () => {
    expect(bus.endSpreadMs(1)).toBe(5_000);
    expect(bus.endSpreadMs(100)).toBe(20_000);
    expect(bus.endSpreadMs(5_000)).toBe(120_000);
  });

  it("TA-193: the events door ends its stream with link.lost and gives the session's slot back", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { held, open } = fakeLink();
    bus.__setBusSeams({ mode: "database", notify: async () => undefined, open, random: () => 0 });
    __resetCookies();
    await createSession(userId, { schoolId: null, role: "PARENT" });
    const decoder = new TextDecoder();
    const read = async (response: Response): Promise<string> => {
      const reader = response.body!.getReader();
      let text = "";
      const deadline = Date.now() + 5_000;
      for (;;) {
        const chunk = await Promise.race([reader.read(), new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), Math.max(0, deadline - Date.now())))]);
        if (chunk === "timeout") return `${text}<still open>`;
        if (chunk.done) return `${text}<closed>`;
        text += decoder.decode(chunk.value);
      }
    };
    const controllers: AbortController[] = [];
    const openStream = () => {
      const controller = new AbortController();
      controllers.push(controller);
      return eventsGet(new Request("http://localhost/api/v1/events", { signal: controller.signal }));
    };
    try {
      const first = await openStream();
      expect(first.status).toBe(200);
      held.options!.onUp();
      // Three more fill the session's four slots on this server.
      const others = [await openStream(), await openStream(), await openStream()];
      expect(others.map((r) => r.status)).toEqual([200, 200, 200]);
      expect((await openStream()).status).toBe(429);

      held.options!.onDown("the connection closed");
      const text = await read(first);
      expect(text).toContain("event: ready");
      expect(text).toContain("event: link.lost");
      expect(text.endsWith("<closed>")).toBe(true);
      for (const other of others) expect(await read(other)).toContain("event: link.lost");
      // The slots are free again: the client's reconnect is not refused.
      const again = await openStream();
      expect(again.status).toBe(200);
    } finally {
      for (const controller of controllers) controller.abort();
    }
  }, 30_000);
});

describe("TA-193: the listening connection", () => {
  it("TA-193: the application role may listen, hears what the owner's connection notifies, and comes back by itself when the database ends it", async () => {
    const heardByApp: string[] = [];
    const heard: string[] = [];
    const states: string[] = [];
    const appStates: string[] = [];
    const waitFor = async (check: () => boolean, ms: number) => {
      for (let waited = 0; waited < ms && !check(); waited += 25) await new Promise((resolve) => setTimeout(resolve, 25));
      return check();
    };
    const channel = `zz_ta193_${STAMP}`;
    // This suite's own connections of its own role (another role's are not shown to a role that is no superuser).
    const mine = () => db.$queryRaw<{ pid: number; query: string }[]>`SELECT pid, query FROM pg_stat_activity WHERE application_name = 'edulink-realtime' AND datname = current_database() AND usename = current_user`;
    const before = (await mine()).map((r) => r.pid);
    // One on the suite's own URL, which the suite may end below; one on the application role's.
    const listener = pgListen.listen({ url: () => process.env.DATABASE_URL, channel, onNotify: (payload) => heard.push(payload), onUp: () => states.push("up"), onDown: () => states.push("down"), retryMinMs: 100, retryMaxMs: 200 });
    let appListener: ListenLink | null = null;
    try {
      expect(await waitFor(() => states.includes("up"), 10_000)).toBe(true);
      const own = (await mine()).filter((row) => !before.includes(row.pid));
      expect(own).toHaveLength(1);
      // Nothing is set on the connection and no table is read on it: its statements are LISTEN and its own heartbeat.
      expect(own[0]!.query).toMatch(/^(LISTEN|NOTIFY) /);

      // Who may listen is the database's rule, not the repository's: any role, the application's included.
      appListener = pgListen.listen({ url: () => process.env.DATABASE_APP_URL, channel, onNotify: (payload) => heardByApp.push(payload), onUp: () => appStates.push("up"), onDown: () => appStates.push("down") });
      expect(await waitFor(() => appStates.includes("up"), 10_000)).toBe(true);
      await db.$executeRaw`SELECT pg_notify(${channel}, ${"first"})`;
      // Another channel's payload is not these connections'.
      await db.$executeRaw`SELECT pg_notify(${`${channel}_other`}, ${"not ours"})`;
      expect(await waitFor(() => heard.includes("first") && heardByApp.includes("first"), 5_000)).toBe(true);
      expect(heard).toEqual(["first"]);
      expect(heardByApp).toEqual(["first"]);

      // The database ends one (a failover, a restart): the caller is told once, and the connection is opened again.
      await db.$queryRaw`SELECT pg_terminate_backend(${own[0]!.pid}::int)`;
      expect(await waitFor(() => states.join(",") === "up,down,up", 10_000)).toBe(true);
      await db.$executeRaw`SELECT pg_notify(${channel}, ${"second"})`;
      expect(await waitFor(() => heard.includes("second"), 5_000)).toBe(true);
      expect(appStates).toEqual(["up"]);
    } finally {
      listener.close();
      appListener?.close();
    }
    // Closed, they are gone from the server and nothing opens them again.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect((await mine()).filter((row) => !before.includes(row.pid))).toEqual([]);
  }, 60_000);

  it("TA-193: a database that cannot be reached is a link that is down, told once, and tried again; nothing is thrown", async () => {
    const states: string[] = [];
    let asked = 0;
    const listener = pgListen.listen({
      url: () => {
        asked++;
        return undefined;
      },
      channel: "zz_ta193_none",
      onNotify: () => {},
      onUp: () => states.push("up"),
      onDown: (reason) => states.push(`down: ${reason}`),
      retryMinMs: 20,
      retryMaxMs: 40,
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    listener.close();
    expect(states).toEqual(["down: no database URL to listen on"]);
    expect(asked).toBeGreaterThan(2);
    const settled = asked;
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(asked).toBe(settled);
  });

  it("TA-193: the boot check says so when the bus is mistyped, or when the pool goes through a pooler and no direct URL is given to listen on", () => {
    const env = process.env as Record<string, string | undefined>;
    const kept = { bus: env.REALTIME_BUS, url: env.DATABASE_URL, listen: env.REALTIME_LISTEN_URL };
    const about = (key: string) => checkEnv().filter((problem) => problem.key === key);
    // Nothing between here and the finally waits: the suite's own database URL is back before any query is made.
    try {
      delete env.REALTIME_BUS;
      delete env.REALTIME_LISTEN_URL;
      expect(about("REALTIME_BUS")).toEqual([]);
      expect(about("REALTIME_LISTEN_URL")).toEqual([]);
      env.REALTIME_BUS = "databse";
      expect(about("REALTIME_BUS")).toHaveLength(1);
      expect(about("REALTIME_BUS")[0]!.fatal).toBe(false);
      env.REALTIME_BUS = "database";
      expect(about("REALTIME_BUS")).toEqual([]);
      // A stand-in that names no server: only its pgbouncer flag is read.
      env.DATABASE_URL = "postgresql://zz:zz@pooler.invalid:6543/zz?pgbouncer=true&connection_limit=15";
      expect(about("REALTIME_LISTEN_URL")).toHaveLength(1);
      expect(about("REALTIME_LISTEN_URL")[0]!.fatal).toBe(false);
      env.REALTIME_LISTEN_URL = "postgresql://zz:zz@direct.invalid:5432/zz";
      expect(about("REALTIME_LISTEN_URL")).toEqual([]);
      delete env.REALTIME_LISTEN_URL;
      env.REALTIME_BUS = "local";
      expect(about("REALTIME_LISTEN_URL")).toEqual([]);
    } finally {
      for (const [key, value] of [["REALTIME_BUS", kept.bus], ["DATABASE_URL", kept.url], ["REALTIME_LISTEN_URL", kept.listen]] as const) {
        if (value === undefined) delete env[key];
        else env[key] = value;
      }
    }
  });

  it("TA-193: the URL is read as Prisma reads it: TLS tried unless switched off, required when asked, the certificate checked only when asked", () => {
    const t = pgListen.listenTarget;
    expect(t("postgresql://zz_app:p%40ss%2Fword@db.internal:6543/edulink?connection_limit=15&pool_timeout=20")).toEqual({ host: "db.internal", port: 6543, socketPath: null, user: "zz_app", password: "p@ss/word", database: "edulink", tls: "try", verify: false });
    expect(t("postgres://zz_app@localhost/edulink_dev?sslmode=disable")).toMatchObject({ host: "localhost", port: 5432, password: "", tls: "off" });
    expect(t("postgresql://zz_app:x@db.example/edulink?sslmode=require")).toMatchObject({ tls: "must", verify: false });
    expect(t("postgresql://zz_app:x@db.example/edulink?sslmode=require&sslaccept=strict")).toMatchObject({ tls: "must", verify: true });
    expect(t("postgresql://zz_app:x@db.example/edulink?sslmode=verify-full")).toMatchObject({ tls: "must", verify: true });
    expect(t("postgresql://zz_app:x@localhost/edulink?host=/var/run/postgresql")).toMatchObject({ socketPath: "/var/run/postgresql/.s.PGSQL.5432" });
    expect(t("postgresql://zz_app:x@[::1]:5433/edulink")).toMatchObject({ host: "::1", port: 5433 });
    expect(() => t("mysql://zz_app:x@localhost/edulink")).toThrow();
    expect(() => t("edulink_dev")).toThrow();
  });

  it("TA-193: the password exchange is SCRAM-SHA-256 as RFC 7677 works it, and a server that does not know the password is refused", () => {
    // RFC 7677, section 3: user "user", password "pencil".
    const scram = { bare: "n=user,r=rOprNGfwEbeRWgbNEkqO", nonce: "rOprNGfwEbeRWgbNEkqO", serverSignature: null as Buffer | null };
    const serverFirst = "r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096";
    const message = pgListen.__scram.final(scram, "pencil", serverFirst);
    // A front-end message: the letter p, four bytes of length, then the client's final message.
    expect(message.subarray(0, 1).toString("latin1")).toBe("p");
    expect(message.readInt32BE(1)).toBe(message.length - 1);
    expect(message.subarray(5).toString("utf8")).toBe("c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,p=dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=");
    expect(() => pgListen.__scram.verify(scram, "v=6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=")).not.toThrow();
    expect(() => pgListen.__scram.verify(scram, "v=7rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=")).toThrow();
    // A server nonce that does not continue ours is not an answer to this exchange.
    expect(() => pgListen.__scram.final({ bare: "n=user,r=abc", nonce: "abc", serverSignature: null }, "pencil", "r=xyz123,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096")).toThrow();
  });
});
