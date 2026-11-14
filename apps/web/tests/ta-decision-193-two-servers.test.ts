import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * TA-193, decided 14 November 2026: live signals pass between servers through the database's own notify.
 *
 * The bus of src/lib/realtime.ts fanned out inside one server process, and the deployment runs two web machines
 * and a jobs machine (fly.toml), so a register saved through one machine never reached a colleague whose stream
 * the other machine held. This file runs the real bus in TWO processes of their own (tests/ta-decision-193-server.ts
 * under tsx, as the scripts run) against the real database, and shows the loss and the fix:
 *
 *   - with each process's bus its own (REALTIME_BUS=local, what development and the tests keep), a signal published
 *     in one process is not heard in the other;
 *   - with the bus on the database (REALTIME_BUS=database, what a production server takes), it is heard in the
 *     other, once, and once by the publisher's own streams;
 *   - the assistant's answer words stay in the process that answered, while its stages and its end cross;
 *   - a long route's rider list crosses whole, in parts, and each stream hears the signal once;
 *   - two servers taking the driver's phone in turn hand a stream one position in fifteen seconds, not two;
 *   - when a server's listening connection is ended under it, its streams are ended, and it listens again.
 *
 * Nothing is written to the database but the notify itself: the channels are made-up ids of this run, no row.
 */

const WEB = join(__dirname, "..");
const STAMP = Date.now().toString(36);
const db = new PrismaClient();

type Line = { started?: true; subscribed?: string; phase?: string; published?: true; heard?: string; event?: { type: string } & Record<string, unknown>; ended?: string };

class Server {
  readonly lines: Line[] = [];
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly waiters = new Set<() => void>();
  stderr = "";

  constructor(mode: "local" | "database") {
    this.child = spawn("npx", ["tsx", "--tsconfig", join(WEB, "scripts", "tsconfig.json"), join(WEB, "tests", "ta-decision-193-server.ts")], {
      cwd: WEB,
      env: { ...process.env, REALTIME_BUS: mode },
    });
    createInterface({ input: this.child.stdout }).on("line", (text) => {
      try {
        this.lines.push(JSON.parse(text) as Line);
      } catch {
        // Not a line of the protocol (a warning printed by a library): ignored.
      }
      for (const wake of [...this.waiters]) wake();
    });
    this.child.stderr.on("data", (chunk: Buffer) => {
      this.stderr += chunk.toString("utf8");
    });
  }

  tell(command: Record<string, unknown>): void {
    this.child.stdin.write(`${JSON.stringify(command)}\n`);
  }

  /** The first line from `from` on that matches, or null once the time is up. */
  async until(match: (line: Line) => boolean, timeoutMs: number, from = 0): Promise<Line | null> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = this.lines.slice(from).find(match);
      if (found) return found;
      const left = deadline - Date.now();
      if (left <= 0) return null;
      await new Promise<void>((resolve) => {
        const wake = () => {
          clearTimeout(timer);
          this.waiters.delete(wake);
          resolve();
        };
        const timer = setTimeout(wake, left);
        this.waiters.add(wake);
      });
    }
  }

  async subscribe(name: string, channels: string[]): Promise<Line> {
    this.tell({ do: "subscribe", name, channels });
    const line = await this.until((l) => l.subscribed === name, 20_000);
    if (!line) throw new Error(`the server never subscribed ${name}: ${this.stderr.slice(-400)}`);
    return line;
  }

  async publish(channels: string[], event: Record<string, unknown>): Promise<void> {
    const from = this.lines.length;
    this.tell({ do: "publish", channels, event });
    const line = await this.until((l) => l.published === true, 10_000, from);
    if (!line) throw new Error(`the server never published: ${this.stderr.slice(-400)}`);
  }

  heard(name: string, type?: string): Line[] {
    return this.lines.filter((l) => l.heard === name && (!type || l.event?.type === type));
  }

  stop(): void {
    try {
      this.tell({ do: "exit" });
    } catch {
      // Already gone.
    }
    this.child.kill();
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const listeners = async (): Promise<number[]> => (await db.$queryRaw<{ pid: number }[]>`SELECT pid FROM pg_stat_activity WHERE application_name = 'edulink-realtime' AND datname = current_database() AND usename = current_user`).map((row) => row.pid);

const servers: Server[] = [];
const start = async (mode: "local" | "database"): Promise<Server> => {
  const server = new Server(mode);
  servers.push(server);
  const up = await server.until((l) => l.started === true, 60_000);
  if (!up) throw new Error(`the server did not start: ${server.stderr.slice(-600)}`);
  return server;
};

afterAll(async () => {
  for (const server of servers) server.stop();
  await db.$disconnect();
});

describe("TA-193: each server's bus its own", () => {
  it("TA-193: in development and the tests the bus stays in its own process: a register saved through one server is not heard by a stream the other holds", async () => {
    const [a, b] = await Promise.all([start("local"), start("local")]);
    const klass = `class:zz193-local-${STAMP}`;
    await b.subscribe("colleague", [klass]);
    await a.subscribe("own", [klass]);
    await a.publish([klass], { type: "attendance.updated", classId: "zz193", dateKey: "2026-11-14", clientIds: ["zz193-mark-1"] });
    await pause(1_500);
    // The publisher's own stream has it; the other process's stream does not. This is the loss, kept on purpose here.
    expect(a.heard("own")).toHaveLength(1);
    expect(b.heard("colleague")).toHaveLength(0);
    a.stop();
    b.stop();
  }, 120_000);
});

describe("TA-193: the bus on the database", () => {
  let a: Server;
  let b: Server;
  let bListener: number[] = [];

  beforeAll(async () => {
    const before = await listeners();
    b = await start("database");
    await b.subscribe("warm", [`user:zz193-warm-b-${STAMP}`]);
    // The one listening connection this subscribing made is server B's: found by what is new, to end it below.
    bListener = (await listeners()).filter((pid) => !before.includes(pid));
    a = await start("database");
    await a.subscribe("warm", [`user:zz193-warm-a-${STAMP}`]);
  }, 120_000);

  it("TA-193: a register saved through one server is heard by a colleague's stream on the other, once, and once by the saver's own", async () => {
    const klass = `class:zz193-reg-${STAMP}`;
    const line = await b.subscribe("colleague", [klass, `school:zz193-${STAMP}`]);
    await a.subscribe("own", [klass]);
    await a.publish([klass, `school:zz193-${STAMP}`], { type: "attendance.updated", classId: "zz193", dateKey: "2026-11-14", clientIds: ["zz193-mark-1"] });
    const heard = await b.until((l) => l.heard === "colleague", 5_000);
    expect(heard?.event).toEqual({ type: "attendance.updated", classId: "zz193", dateKey: "2026-11-14", clientIds: ["zz193-mark-1"] });
    expect(line.phase).toBe("up");
    await pause(500);
    // Named on two of its channels, heard once; and the saver's server does not hand its own signal out again.
    expect(b.heard("colleague")).toHaveLength(1);
    expect(a.heard("own")).toHaveLength(1);
  }, 60_000);

  it("TA-193: the assistant's stages and its end cross; its answer words stay on the server that answered", async () => {
    const user = `user:zz193-asker-${STAMP}`;
    await b.subscribe("drawer", [user]);
    await a.subscribe("answering", [user]);
    await a.publish([user], { type: "assistant.stage", conversationId: "zz193c", stage: "WRITING" });
    await a.publish([user], { type: "assistant.delta", conversationId: "zz193c", messageId: "zz193m", seq: 0, text: "zz193 words that must not cross" });
    await a.publish([user], { type: "assistant.done", conversationId: "zz193c", messageId: "zz193m", verdict: "ANSWERED" });
    expect(await b.until((l) => l.heard === "drawer" && l.event?.type === "assistant.done", 5_000)).not.toBeNull();
    await pause(500);
    expect(b.heard("drawer").map((l) => l.event?.type)).toEqual(["assistant.stage", "assistant.done"]);
    expect(JSON.stringify(b.lines)).not.toContain("words that must not cross");
    // On the server that answered, the stream has all three, as before.
    expect(a.heard("answering").map((l) => l.event?.type)).toEqual(["assistant.stage", "assistant.delta", "assistant.done"]);
  }, 60_000);

  it("TA-193: a long route's rider list crosses whole, in parts under the database's limit, and each stream hears the signal once", async () => {
    // 450 riders: about 16,000 bytes of channel names, twice the 8,000 a NOTIFY may carry.
    const riders = Array.from({ length: 450 }, (_, i) => `student:zz193r${STAMP}${String(i).padStart(4, "0")}xxxxxxxxxx`);
    const school = `school:zz193-bus-${STAMP}`;
    await b.subscribe("first", [riders[0]!]);
    await b.subscribe("last", [riders[449]!]);
    // A guardian of two riders whose channels fall in different parts, and the office on the school's channel too.
    await b.subscribe("both", [riders[1]!, riders[448]!, school]);
    await a.publish([school, ...riders], { type: "transport.trip", tripId: `zz193trip${STAMP}`, status: "LIVE" });
    expect(await b.until((l) => l.heard === "last", 5_000)).not.toBeNull();
    await pause(500);
    expect(b.heard("first")).toHaveLength(1);
    expect(b.heard("last")).toHaveLength(1);
    expect(b.heard("both")).toHaveLength(1);
  }, 60_000);

  it("TA-193: two servers taking the driver's phone in turn hand a stream one position in fifteen seconds", async () => {
    const rider = `student:zz193-pos-${STAMP}`;
    const tripId = `zz193pos${STAMP}`;
    await b.subscribe("family", [rider]);
    await a.subscribe("office", [rider]);
    await a.publish([rider], { type: "transport.position", tripId, lat: 18.5, lng: 73.8, at: "2026-11-14T03:00:00.000Z" });
    expect(await b.until((l) => l.heard === "family" && l.event?.type === "transport.position", 5_000)).not.toBeNull();
    // Seconds later the phone's next batch lands on the other server, whose own memory holds no time for this trip.
    await b.publish([rider], { type: "transport.position", tripId, lat: 18.6, lng: 73.9, at: "2026-11-14T03:00:05.000Z" });
    await pause(1_000);
    expect(b.heard("family", "transport.position").map((l) => l.event?.lat)).toEqual([18.5]);
    expect(a.heard("office", "transport.position").map((l) => l.event?.lat)).toEqual([18.5]);
  }, 60_000);

  it("TA-193: a server whose listening connection is ended ends its streams, listens again, and hears the other server once more", async () => {
    expect(bListener).toHaveLength(1);
    const klass = `class:zz193-drop-${STAMP}`;
    await b.subscribe("held", [klass]);
    const from = b.lines.length;
    // The database ends server B's listening connection, as a failover or a restart would.
    await db.$queryRaw`SELECT pg_terminate_backend(${bListener[0]!}::int)`;
    // Every stream the server held is ended (within the five seconds one stream's spread may take).
    expect(await b.until((l) => l.ended === "held", 10_000, from)).not.toBeNull();
    // It listens again by itself (after about a second), and a stream opened then hears the other server.
    const again = await b.subscribe("after", [klass]);
    expect(again.phase).toBe("up");
    const mark = b.lines.length;
    await a.publish([klass], { type: "attendance.session.finalized", classId: "zz193", dateKey: "2026-11-14" });
    expect(await b.until((l) => l.event?.type === "attendance.session.finalized", 5_000, mark)).not.toBeNull();
  }, 90_000);
});
