/**
 * The client outbox, driven for real against an in-memory IndexedDB.
 *
 * Untested until now for want of exactly this: the module talks to
 * `indexedDB` directly, so it needed a fake one rather than a mock of itself.
 * `fake-indexeddb/auto` installs the global before the module is imported.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countQueued, enqueue, flushQueue, listQueued, onQueueEvent, remove, type QueueEvent } from "@/lib/offline-queue";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(async () => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { onLine: true, serviceWorker: undefined });
  fetchMock.mockReset();
  for (const item of await listQueued()) await remove(item.id);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the outbox", () => {
  it("queues under a tag, counts per tag and in total, and tells its listeners", async () => {
    const events: QueueEvent[] = [];
    const stop = onQueueEvent((e) => events.push(e));
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1" });
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "message:r1" });
    stop();
    expect(await countQueued()).toBe(3);
    expect(await countQueued("marks:c1")).toBe(1);
    expect(events.map((e) => e.type)).toEqual(["queued", "queued", "queued"]);
    expect((events[2] as { remaining: number }).remaining).toBe(3);
  });

  it("flushes in order, removes what the server accepted, and keeps what the network dropped", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"a":1}', tag: "marks:c1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: '{"b":2}', tag: "message:r1" });
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await flushQueue();
    expect(result).toEqual({ sent: 1, failed: 1, remaining: 1 });
    const left = await listQueued();
    expect(left).toHaveLength(1);
    expect(left[0]!.url).toBe("/api/v1/messages");
    expect(left[0]!.attempts).toBe(1);
    expect(left[0]!.lastError).toContain("Failed to fetch");
    // The replay header rides on every flush, so the server can tell a
    // replay from a live submission if it ever needs to.
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ "x-edulink-replay": "1" });
  });

  it("drops what the server refused for good (4xx) and says so, but keeps 401 and 429 for later", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "message:r1" });
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1" });
    fetchMock
      .mockResolvedValueOnce(new Response('{"error":"Some of this needs another look."}', { status: 422 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 429 }));
    const rejected: number[] = [];
    const stop = onQueueEvent((e) => {
      if (e.type === "rejected") rejected.push(e.status);
    });
    const result = await flushQueue();
    stop();
    expect(result).toEqual({ sent: 0, failed: 3, remaining: 2 });
    expect(rejected).toEqual([422]);
    expect((await listQueued()).map((i) => i.url).sort()).toEqual(["/api/attendance", "/api/v1/messages"]);
  });

  it("a second flush while one is running does not double-send", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1" });
    let release!: () => void;
    fetchMock.mockImplementationOnce(() => new Promise((r) => (release = () => r(new Response("{}", { status: 200 })))));
    const first = flushQueue();
    const second = await flushQueue();
    expect(second).toEqual({ sent: 0, failed: 0, remaining: 1 });
    release();
    expect(await first).toEqual({ sent: 1, failed: 0, remaining: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
