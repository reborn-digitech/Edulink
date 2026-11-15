import { waitFor } from "@testing-library/react-native";
import { __setOutboxStore, countQueued, enqueue, flushQueue, listQueued, memoryOutbox, onQueueEvent, outboxOwner, queueMark, SEND_DAYS, supersedeQueued, type QueueEvent } from "@/lib/outbox";

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

  it("TA-010: a row stored under a clock that was ahead carries the outbox's clock only when it is this person's at this school and less than a day ahead", async () => {
    const DAY = 86_400_000;
    const me = outboxOwner()!;
    const store = memoryOutbox();
    // Queued while the phone's clock was ten days ahead: another person's row, held for them and never sent here, and this person's own.
    await store.put({ id: "zz-someone-else-ahead", url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c9", createdAt: Date.now() + 10 * DAY, attempts: 0, owner: "zz-someone-else", schoolId: me.schoolId, membershipId: "m9" });
    await store.put({ id: "zz-mine-far-ahead", url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages:r9", createdAt: Date.now() + 10 * DAY, attempts: 0, owner: me.userId, schoolId: me.schoolId, membershipId: me.membershipId });
    __setOutboxStore(store);
    // The badge reads the store when a screen opens.
    expect(await countQueued()).toBe(1);
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages:r1" });
    const [row] = await listQueued("messages:r1");
    expect(row!.createdAt).toBeLessThan(Date.now() + DAY);
    // So the new row ages from when it was queued: past SEND_DAYS it is dropped and reported, not sent.
    const rejected: string[] = [];
    const stop = onQueueEvent((e) => e.type === "rejected" && rejected.push(`${e.item.tag} ${e.status}`));
    const sent: string[] = [];
    await flushQueue(async (item) => {
      sent.push(item.tag);
      return { status: 200 };
    }, row!.createdAt + (SEND_DAYS + 1) * DAY);
    stop();
    expect({ sentTheNewRow: sent.includes("messages:r1"), rejected }).toEqual({ sentTheNewRow: false, rejected: ["messages:r1 0"] });
  });

  it("a row superseded while its send is out, then kept for another try by its answer, is not put back", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"n":"older"}', tag: "marks:c1:s1" });
    let answer!: (r: { status: number }) => void;
    let started!: () => void;
    const out = new Promise<void>((resolve) => (started = resolve));
    const flush = flushQueue(() => {
      started();
      return new Promise((resolve) => (answer = resolve));
    });
    await out;
    // A newer sheet of the paper went through live while the older one was out.
    expect(await supersedeQueued("marks:c1:s1", queueMark())).toBe(1);
    answer({ status: 503 });
    expect(await flush).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(await listQueued("marks:c1:s1")).toEqual([]);
  });

  it("CI R2: a row the server took is told to the listeners with what the server answered, before the flush's own event", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1:s1" });
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages:r1" });
    const answer = { saved: 1, cleared: 0, skipped: 0, version: "2026-11-13T09:00:05.000Z" };
    const events: QueueEvent[] = [];
    const stop = onQueueEvent((e) => events.push(e));
    await flushQueue(async (item) => (item.url === "/api/v1/marks" ? { status: 200, data: answer } : { status: 503 }));
    stop();
    // The message kept for another try is not "sent".
    expect(events.map((e) => (e.type === "sent" ? [e.type, e.item.tag, e.data, e.superseded ?? false] : [e.type]))).toEqual([["sent", "marks:c1:s1", answer, false], ["flushed"]]);
  });

  it("CI R2: a row superseded while its send was out, then taken by the server, is told as superseded", async () => {
    await enqueue({ url: "/api/v1/marks", method: "POST", body: '{"n":"older"}', tag: "marks:c1:s1" });
    let answer!: (r: { status: number; data?: unknown }) => void;
    let started!: () => void;
    const out = new Promise<void>((resolve) => (started = resolve));
    const events: QueueEvent[] = [];
    const stop = onQueueEvent((e) => events.push(e));
    const flush = flushQueue(() => {
      started();
      return new Promise((resolve) => (answer = resolve));
    });
    await out;
    // The teacher's live save of the same paper went through while the older sheet was out.
    expect(await supersedeQueued("marks:c1:s1", queueMark())).toBe(1);
    answer({ status: 200, data: { saved: 0, cleared: 0, skipped: 1, version: "2026-11-13T09:00:09.000Z" } });
    await flush;
    stop();
    expect(events.filter((e) => e.type === "sent").map((e) => (e.type === "sent" ? e.superseded ?? false : null))).toEqual([true]);
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

  // TA-010's clock, pinned (CI's "Mobile battery" at 399aeda0, 2ffc5f66 and 4c23397c failed the whole-state case above
  // one run in four): a live request's mark and every row queued after it are ordered by the outbox's own clock, so a
  // row queued in the mark's millisecond, after the phone's clock was set back, or after a restart over rows an earlier
  // run stored under a later clock (once the outbox has been read, as the app reads it before it writes), is newer than
  // all of them and is the one kept and sent.
  describe("TA-010: the outbox's clock when Date.now() stands still or goes back", () => {
    const TAG = "marks:c1:s1";
    const HOUR = 3_600_000;
    // Each case's clock starts ten hours above the last case's, all of them above every createdAt the cases before
    // this block minted (at most a millisecond a row ahead of the real clock), so no case leans on another's rows.
    const BASE = Date.now() + 10 * HOUR;
    let clock: jest.SpyInstance<number, []>;
    beforeEach(() => {
      clock = jest.spyOn(Date, "now");
    });
    afterEach(() => clock.mockRestore());
    const bodies = async () => (await listQueued(TAG)).map((i) => i.body);
    const queueSheet = (n: string) => enqueue({ url: "/api/v1/marks", method: "POST", body: `{"n":"${n}"}`, tag: TAG });
    /** A row as an earlier run of the app (or the build before this one) left it in the store, under its clock then. */
    const storedBefore = async (createdAt: number) => {
      const me = outboxOwner()!;
      const store = memoryOutbox();
      await store.put({ id: `zz-before-restart-${createdAt}`, url: "/api/v1/marks", method: "POST", body: '{"n":"before the restart"}', tag: TAG, createdAt, attempts: 1, lastError: "HTTP 503", owner: me.userId, schoolId: me.schoolId, membershipId: me.membershipId });
      __setOutboxStore(store);
    };

    it("a row queued in the same millisecond as a live request's mark is newer than the mark and stays", async () => {
      const t0 = BASE;
      clock.mockReturnValue(t0);
      await queueSheet("older");
      // The wall clock has gone past the outbox's: the live request leaves, and in that same millisecond a newer sheet is queued.
      clock.mockReturnValue(t0 + 1);
      const startedAt = queueMark();
      await queueSheet("newer");
      expect((await listQueued(TAG)).map((i) => i.createdAt > startedAt)).toEqual([true]);
      // The live answer removes what was queued before it left, never what was queued after.
      expect(await supersedeQueued(TAG, startedAt)).toBe(0);
      expect(await bodies()).toEqual(['{"n":"newer"}']);
    });

    it("a row queued after the clock is set back is still newer than a mark taken before, and rows keep their order", async () => {
      const t0 = BASE + 10 * HOUR;
      clock.mockReturnValue(t0);
      await queueSheet("older");
      // Half a minute later a live request leaves.
      clock.mockReturnValue(t0 + 30_000);
      const startedAt = queueMark();
      // While it is out, the phone's clock is set back an hour (the network's time corrects it), then further, and two rows are queued.
      clock.mockReturnValue(t0 + 30_000 - HOUR);
      await queueSheet("newer");
      clock.mockReturnValue(t0 + 30_000 - 2 * HOUR);
      await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages:r1" });
      const rows = await listQueued();
      expect(rows.map((i) => [i.tag, i.createdAt > startedAt])).toEqual([
        [TAG, true],
        ["messages:r1", true],
      ]);
      expect(rows[1]!.createdAt).toBeGreaterThan(rows[0]!.createdAt);
      // The live answer arrives: the older sheet went when the newer was queued, and the newer one stays.
      expect(await supersedeQueued(TAG, startedAt)).toBe(0);
      expect(await bodies()).toEqual(['{"n":"newer"}']);
    });

    it("a row an earlier run stored under a clock since set back is older than a row queued now: the newer one is kept and sent", async () => {
      const t0 = BASE + 20 * HOUR;
      await storedBefore(t0 + HOUR);
      clock.mockReturnValue(t0);
      // The app reads the outbox before it writes: the runner's first flush on signing in, the screen's badge when it opens.
      expect(await countQueued(TAG)).toBe(1);
      await queueSheet("after the restart");
      expect(await bodies()).toEqual(['{"n":"after the restart"}']);
      const sent: string[] = [];
      await flushQueue(async (item) => {
        sent.push(item.body);
        return { status: 200 };
      });
      expect({ sent, left: await countQueued() }).toEqual({ sent: ['{"n":"after the restart"}'], left: 0 });
    });

    it("once the outbox has been read, a live request's mark covers what an earlier run stored under a clock since set back", async () => {
      const t0 = BASE + 30 * HOUR;
      await storedBefore(t0 + 5 * HOUR);
      clock.mockReturnValue(t0);
      // The screen's badge reads the outbox when it opens, before anything can be saved.
      expect(await countQueued(TAG)).toBe(1);
      const startedAt = queueMark();
      expect(await supersedeQueued(TAG, startedAt)).toBe(1);
      expect(await countQueued(TAG)).toBe(0);
      // And a sheet queued after that mark is still newer than it.
      await queueSheet("after the mark");
      expect((await listQueued(TAG)).map((i) => i.createdAt > startedAt)).toEqual([true]);
    });
  });
});
