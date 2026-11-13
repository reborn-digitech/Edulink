import { waitFor } from "@testing-library/react-native";
import { __setOutboxStore, countQueued, enqueue, flushQueue, listQueued, memoryOutbox, onQueueEvent, queueMark, SEND_DAYS, supersedeQueued, type QueueEvent } from "@/lib/outbox";

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
    // One tag each: a row kept for another try holds the later rows of its own tag (TA-010, the case below).
    await enqueue({ url: "/a", method: "POST", body: "{}", tag: "ta" });
    await enqueue({ url: "/b", method: "POST", body: "{}", tag: "tb" });
    await enqueue({ url: "/c", method: "POST", body: "{}", tag: "tc" });
    await enqueue({ url: "/d", method: "POST", body: "{}", tag: "td" });
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

  it("TA-010: a row kept for another try holds the later rows of its tag, and only those", async () => {
    await enqueue({ url: "/m1", method: "POST", body: "{}", tag: "messages:r1" });
    await enqueue({ url: "/m2", method: "POST", body: "{}", tag: "messages:r1" });
    await enqueue({ url: "/x", method: "POST", body: "{}", tag: "messages:r2" });
    const sent: string[] = [];
    const first = await flushQueue(async (item) => {
      sent.push(item.url);
      return { status: item.url === "/m1" ? 503 : 200 };
    });
    expect(sent).toEqual(["/m1", "/x"]);
    expect(first).toEqual({ sent: 1, failed: 2, remaining: 2 });
    const left = await listQueued();
    expect(left.map((i) => [i.url, i.attempts])).toEqual([
      ["/m1", 1],
      ["/m2", 0],
    ]);
    sent.length = 0;
    await flushQueue(async (item) => {
      sent.push(item.url);
      return { status: 200 };
    });
    expect(sent).toEqual(["/m1", "/m2"]);
  });

  it("TA-010: a whole-state tag keeps only its newest row, and a sent body removes what was queued under it before", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"n":1}', tag: "marks:c1:s1" });
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"n":2}', tag: "marks:c1:s1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: '{"n":1}', tag: "messages:r1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: '{"n":2}', tag: "messages:r1" });
    expect((await listQueued("marks:c1:s1")).map((i) => i.body)).toEqual(['{"n":2}']);
    expect(await countQueued("messages:r1")).toBe(2);
    // A newer sheet went live: the queued one is older than what the server holds.
    expect(await supersedeQueued("marks:c1:s1", queueMark())).toBe(1);
    expect(await countQueued("marks:c1:s1")).toBe(0);
    // Two messages are two messages: a sent one removes nothing.
    expect(await supersedeQueued("messages:r1", queueMark())).toBe(0);
    expect(await countQueued("messages:r1")).toBe(2);
    // A row queued after the live request left is newer than it and stays.
    const startedAt = queueMark();
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"n":3}', tag: "marks:c1:s1" });
    await supersedeQueued("marks:c1:s1", startedAt);
    expect((await listQueued("marks:c1:s1")).map((i) => i.body)).toEqual(['{"n":3}']);
  });

  it(`TA-010: a row the person could send that has waited past ${SEND_DAYS} days is dropped and reported, not sent`, async () => {
    await enqueue({ url: "/old", method: "POST", body: "{}", tag: "attendance:c1" });
    const rejected: number[] = [];
    const stop = onQueueEvent((e) => e.type === "rejected" && rejected.push(e.status));
    const sent: string[] = [];
    await flushQueue(async (item) => {
      sent.push(item.url);
      return { status: 200 };
    }, Date.now() + (SEND_DAYS + 1) * 86_400_000);
    stop();
    expect({ sent, rejected, left: await countQueued() }).toEqual({ sent: [], rejected: [0], left: 0 });
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
