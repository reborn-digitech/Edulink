import { waitFor } from "@testing-library/react-native";
import { __setOutboxStore, countQueued, enqueue, flushQueue, listQueued, memoryOutbox, onQueueEvent, type QueueEvent } from "@/lib/outbox";

describe("the outbox", () => {
  beforeEach(() => __setOutboxStore(memoryOutbox()));

  it("queues in order, counts per tag, and tells its listeners", async () => {
    const events: QueueEvent[] = [];
    const stop = onQueueEvent((e) => events.push(e));
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1" });
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1" });
    stop();
    expect(await countQueued()).toBe(2);
    expect(await countQueued("marks:c1")).toBe(1);
    expect((await listQueued()).map((i) => i.url)).toEqual(["/api/attendance", "/api/v1/marks"]);
    expect(events.map((e) => e.type)).toEqual(["queued", "queued"]);
  });

  it("flushes oldest first, drops the accepted and the permanently refused, keeps the rest", async () => {
    await enqueue({ url: "/a", method: "POST", body: "{}", tag: "t" });
    await enqueue({ url: "/b", method: "POST", body: "{}", tag: "t" });
    await enqueue({ url: "/c", method: "POST", body: "{}", tag: "t" });
    await enqueue({ url: "/d", method: "POST", body: "{}", tag: "t" });
    const answers: Record<string, number> = { "/a": 200, "/b": 422, "/c": 401, "/d": 0 };
    const rejected: number[] = [];
    const stop = onQueueEvent((e) => e.type === "rejected" && rejected.push(e.status));
    const result = await flushQueue(async (item) => {
      if (answers[item.url] === 0) throw new Error("Network request failed");
      return { status: answers[item.url]! };
    });
    stop();
    expect(result).toEqual({ sent: 1, failed: 3, remaining: 2 });
    expect(rejected).toEqual([422]);
    const left = await listQueued();
    expect(left.map((i) => i.url)).toEqual(["/c", "/d"]);
    expect(left[1]!.attempts).toBe(1);
    expect(left[1]!.lastError).toContain("Network");
  });

  it("does not double-send while a flush is running", async () => {
    await enqueue({ url: "/a", method: "POST", body: "{}", tag: "t" });
    let release!: () => void;
    const first = flushQueue(() => new Promise((r) => (release = () => r({ status: 200 }))));
    expect(await flushQueue(async () => ({ status: 200 }))).toEqual({ sent: 0, failed: 0, remaining: 1 });
    // The first flush reaches its send once the expired rows are looked at.
    await waitFor(() => expect(release).toBeDefined());
    release();
    expect(await first).toEqual({ sent: 1, failed: 0, remaining: 0 });
  });
});
