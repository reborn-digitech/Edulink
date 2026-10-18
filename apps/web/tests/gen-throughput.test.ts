import { describe, expect, it } from "vitest";
import { ChatPool, discoverPool, FALLBACK_IN_FLIGHT, transportFailure, usableSlots, type ChatClient, type JsonCall, type PoolServer } from "../scripts/quiz-gen/model";
import { runChapter } from "../scripts/quiz-gen/pipeline";
import { SYSTEM_CRITIQUE, SYSTEM_DRAFT } from "../scripts/quiz-gen/prompts";
import type { DraftItem, Level } from "../scripts/quiz-gen/shape";
import type { SelectedChapter } from "../scripts/quiz-gen/select";
import type { AssistantEndpoint } from "../src/lib/assistant-env";

/**
 * Generation throughput (gen-throughput, 19 October 2026): the generator's pool of chat servers
 * (scripts/quiz-gen/model.ts — the slots read from /props, slots − 1 on the server Vidura shares and every slot on the
 * second when it is switched on, least-in-flight dispatch, a server that stops answering dropped) and the items the
 * pipeline keeps in hand sized by the pool (scripts/quiz-gen/pipeline.ts). No model and no database: the servers and
 * the model are the suite's own.
 */

const ep = (port: number): AssistantEndpoint => ({ url: `http://127.0.0.1:${port}/v1`, model: "zz", key: null });
const A: PoolServer = { name: "chat", endpoint: ep(8180), slots: 2 };
const B: PoolServer = { name: "chat2", endpoint: ep(8183), slots: 3 };

/** A call that holds its slot until released. */
function held() {
  const open: { port: string; release: () => void }[] = [];
  const fn = (endpoint: AssistantEndpoint) =>
    new Promise<string>((resolve) => {
      const port = new URL(endpoint.url).port;
      open.push({ port, release: () => resolve(port) });
    });
  return { open, fn };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("the pool of chat servers", () => {
  it("keeps slots − 1 in flight on the server Vidura shares and every slot on the second; three when the chat server does not say", async () => {
    expect(usableSlots(8, true)).toBe(7);
    expect(usableSlots(8, false)).toBe(8);
    expect(usableSlots(4, true)).toBe(3);
    expect(usableSlots(1, true)).toBe(1);
    expect(usableSlots(0, false)).toBe(1);
    const slots = new Map([["8180", 8], ["8183", 8]]);
    const slotsOf = async (e: AssistantEndpoint) => slots.get(new URL(e.url).port) ?? null;
    const on = { QUIZ_GEN_CHAT2: "on" };
    const both = await discoverPool(ep(8180), { env: on, slotsOf });
    expect(both.servers.map((s) => `${s.name}:${s.slots}`)).toEqual(["chat:7", "chat2:8"]);
    expect(both.servers[1]!.endpoint).toMatchObject({ url: "http://127.0.0.1:8183/v1", model: "zz" });
    expect(both.lines.join(" ")).toContain("7 in flight of 8 slots (one left for Vidura)");
    slots.delete("8183");
    const alone = await discoverPool(ep(8180), { env: on, slotsOf });
    expect(alone.servers.map((s) => s.name)).toEqual(["chat"]);
    expect(alone.lines.join(" ")).toContain("chat2 (http://127.0.0.1:8183) is not answering");
    expect((await discoverPool(ep(8180), { env: on, slotsOf: async () => null })).servers).toEqual([{ name: "chat", endpoint: ep(8180), slots: FALLBACK_IN_FLIGHT }]);
    // Off unless switched on (measured slower on the owner's machine): an answering chat2 is left alone.
    const off = await discoverPool(ep(8180), { env: {}, slotsOf: async () => 8 });
    expect(off.servers.map((s) => s.name)).toEqual(["chat"]);
    expect(off.lines.join(" ")).toContain("chat2 not used (QUIZ_GEN_CHAT2 is not on)");
    expect((await discoverPool(ep(8180), { env: { ...on, QUIZ_GEN_CHAT2_URL: "http://127.0.0.1:8180/v1" }, slotsOf: async () => 8 })).servers.map((s) => s.name)).toEqual(["chat"]);
  });

  it("sends each call to the server with the fewest in flight that has a free slot, and queues when every slot is busy", async () => {
    const pool = new ChatPool([A, B]);
    expect(pool.capacity).toBe(5);
    const h = held();
    const calls = Array.from({ length: 6 }, () => pool.run(h.fn));
    await tick();
    // 0/0 → chat (the tie goes to the first), 1/0 → chat2, 1/1 → chat, then chat is full: chat2 twice; the sixth waits.
    expect(h.open.map((c) => c.port)).toEqual(["8180", "8183", "8180", "8183", "8183"]);
    expect([pool.inFlight("chat"), pool.inFlight("chat2")]).toEqual([2, 3]);
    h.open[0]!.release();
    await tick();
    await tick();
    expect(h.open.length).toBe(6);
    expect(h.open[5]!.port).toBe("8180");
    for (const c of h.open.slice(1)) c.release();
    expect(await Promise.all(calls)).toEqual(["8180", "8183", "8180", "8183", "8183", "8180"]);
    expect([pool.inFlight("chat"), pool.inFlight("chat2")]).toEqual([0, 0]);
  });

  it("drops a server that stops answering, with a log line, and sends the call again to the servers left", async () => {
    const lines: string[] = [];
    const down = new Set(["8183"]);
    const pool = new ChatPool([B, A], (l) => lines.push(l), async (e) => !down.has(new URL(e.url).port));
    const answered = await pool.run(async (e) => {
      const port = new URL(e.url).port;
      if (down.has(port)) throw Object.assign(new TypeError("fetch failed"), { cause: new Error("connect ECONNREFUSED 127.0.0.1:8183") });
      return port;
    });
    expect(answered).toBe("8180");
    expect(pool.servers.map((s) => s.name)).toEqual(["chat"]);
    expect(pool.capacity).toBe(2);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/chat server chat2 \(http:\/\/127\.0\.0\.1:8183\) stopped answering .*dropped from the pool, the run goes on with chat 2 in flight left/);

    // A slow call on a server still there is the call's own failure (as before): thrown, the server kept.
    const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
    await expect(pool.run(async () => Promise.reject(timeout))).rejects.toBe(timeout);
    // An answer that is an error is not a dead server either.
    await expect(pool.run(async () => Promise.reject(new Error("chat endpoint answered 500: oops")))).rejects.toThrow(/answered 500/);
    expect(pool.servers.map((s) => s.name)).toEqual(["chat"]);
    // The last server gone: the call fails, and so does the next one.
    down.add("8180");
    await expect(pool.run(async () => Promise.reject(new TypeError("fetch failed")))).rejects.toThrow(/no chat server answers/);
    expect(pool.capacity).toBe(0);
    await expect(pool.run(async () => "never")).rejects.toThrow(/no chat server answers/);
  });

  it("a call whose server is gone waits for a slot on the servers left", async () => {
    const down = new Set<string>(["8183"]);
    const pool = new ChatPool([{ ...A, slots: 1 }, { ...B, slots: 1 }], () => {}, async (e) => !down.has(new URL(e.url).port));
    const h = held();
    const first = pool.run(h.fn);
    // chat holds the first call; the second goes to chat2, which is gone: dropped, and the call waits for chat's slot.
    const second = pool.run(async (e) => {
      const port = new URL(e.url).port;
      if (down.has(port)) throw new TypeError("fetch failed");
      return port;
    });
    await tick();
    await tick();
    expect(pool.servers.map((s) => s.name)).toEqual(["chat"]);
    expect(pool.inFlight("chat")).toBe(1);
    h.open[0]!.release();
    expect(await first).toBe("8180");
    expect(await second).toBe("8180");
  });

  it("knows a transport failure from an answer", () => {
    expect(transportFailure(new TypeError("fetch failed"))).toBe(true);
    expect(transportFailure(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe(true);
    expect(transportFailure(Object.assign(new Error("request failed"), { cause: new Error("read ECONNRESET") }))).toBe(true);
    expect(transportFailure(new Error("chat endpoint answered 503: Loading model"))).toBe(false);
    expect(transportFailure(new Error("the model's answer was not JSON"))).toBe(false);
    expect(transportFailure("fetch failed")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Items in hand sized by the pool                                             */
/* -------------------------------------------------------------------------- */

const DOC = "zz/zz-throughput.pdf";
const chunk = (ordinal: number) => ({ id: `zz-c${ordinal}`, ordinal, headingPath: ["ZZ"], pageStart: ordinal + 1, pageEnd: ordinal + 1, text: `ZZ passage ${ordinal} about magnets.`, tokens: 1700, figureKeys: [] });
const chapter = {
  board: "NCERT",
  source: "ncert",
  book: "ZZ",
  bookCode: null,
  documentPath: DOC,
  classLevel: 8,
  subject: "Science",
  subjectCode: "SCIENCE",
  chapterNumber: 4,
  chapterName: "ZZ",
  chapterLabel: "Chapter 4 — ZZ",
  edition: null,
  sourceUrl: "https://zz.invalid",
  // 1,700 tokens a chunk: one chunk a group, five groups.
  chunks: [0, 1, 2, 3, 4].map(chunk),
  figures: new Map(),
  headings: [],
} as unknown as SelectedChapter;

/** The levels a drafting prompt asks for ("  level 3 — … Write 1."). */
const askedLevels = (user: string) => [...user.matchAll(/^ {2}level (\d) — .*Write (\d+)\.$/gm)].map((m) => Number(m[1]) as Level);

const draftItem = (seed: number, l: Level): DraftItem => ({
  difficulty: l,
  stem: `zz ${seed} L${l}`,
  options: ["a", "b", "c", "d"],
  answerIndex: 0,
  solution: "zz",
  checkExpr: "",
  figure: { kind: "", spec: {}, labels: {} },
  figureAlt: "",
  distractorReasons: ["x", "y", "z"],
});

/** A fake model: drafts what is asked, one group at a time as before; the critique rejects every item. Counts the critiques in flight. */
function fakeClient(capacity: number | undefined) {
  const seen = { drafting: 0, mostDrafting: 0, critiquing: 0, mostCritiquing: 0, critiques: 0 };
  const client: ChatClient = {
    model: "zz",
    capacity,
    async json<T>(call: JsonCall) {
      if (call.system === SYSTEM_DRAFT) {
        seen.drafting++;
        seen.mostDrafting = Math.max(seen.mostDrafting, seen.drafting);
        await new Promise((r) => setTimeout(r, 2));
        seen.drafting--;
        return { value: { items: askedLevels(call.user).map((l) => draftItem(call.seed, l)) } as T, promptTokens: 1, completionTokens: 1, ms: 2, cached: false };
      }
      if (call.system === SYSTEM_CRITIQUE) {
        seen.critiques++;
        seen.critiquing++;
        seen.mostCritiquing = Math.max(seen.mostCritiquing, seen.critiquing);
        await new Promise((r) => setTimeout(r, 10));
        seen.critiquing--;
        return { value: { correctIndex: 3, oneAnswer: false, distractors: [], solutionSound: false, note: "zz" } as T, promptTokens: 1, completionTokens: 1, ms: 10, cached: false };
      }
      throw new Error("zz: no other call in this case");
    },
    embed: async () => [],
  };
  return { client, seen };
}

describe("items in hand", () => {
  it("as many as the pool keeps in flight (three without a pool, as before); the drafting still one group at a time", async () => {
    const opts = { limit: 20, perLevel: 4, bankStems: [], glossary: [], style: { present: true, excerpts: ["zz"], note: "zz" }, log: () => {} };
    const seven = fakeClient(7);
    const r = await runChapter(seven.client, chapter, opts);
    expect(r.questions).toEqual([]);
    expect(seven.seen.mostCritiquing).toBe(7);
    expect(seven.seen.mostDrafting, "drafting unchanged: one call at a time").toBe(1);
    const three = fakeClient(undefined);
    await runChapter(three.client, chapter, opts);
    expect(three.seen.mostCritiquing).toBe(3);
    // The same calls either way: how many items are in hand changes when a call is made, not what is asked.
    expect(three.seen.critiques).toBe(seven.seen.critiques);
    expect(r.log.stages.draft.calls).toBe((await runChapter(fakeClient(15).client, chapter, opts)).log.stages.draft.calls);
  });
});
