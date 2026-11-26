/**
 * The console's held writes (src/app/root/subscriptions/pending-writes.ts; C5 point 1 and the coordinating session's walk of
 * 22 November 2026): a write held behind a toast's Undo runs once, through its server action when the toast commits or the
 * console unmounts within the app, and through the operator's own door when the page is hidden or left, since a server action
 * is dropped with the page. After an early send or an unmount the toast's commit and Undo do nothing, and the console is told
 * at once so it takes the Undo away. The door answers three ways (taken, refused, not known); a commit's lost answer is heard
 * (whenAnswered); a switch whose write is held is drawn as set (drawnOn); the Schools tab's bar waits for a held school
 * (barWaits). The browser's own part is held by e2e/premium-held-writes.spec.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { barWaits, createPendingWrites, drawnOn, sendToDoor, whenAnswered, type DoorAnswer, type DoorWrite } from "@/app/root/subscriptions/pending-writes";

const door: DoorWrite = { url: "/api/v1/operator/schools/s1/terms", method: "PUT", body: { premium: { teachers: true }, expect: { note: null } } };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("held writes", () => {
  it("the toast's commit sends the server action once; a second commit, an Undo after it and a later early send do nothing", async () => {
    const send = vi.fn(async (): Promise<DoorAnswer> => "taken");
    const writes = createPendingWrites(send);
    const write = vi.fn();
    const held = writes.hold(write, () => door);
    held.commit();
    held.commit();
    held.undo();
    writes.sendEarly();
    await settle();
    expect(write).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(writes.size()).toBe(0);
  });

  it("the page hidden or left: the write goes to its door, not the action, the Undo is taken away at once, and the door's answer is heard", async () => {
    let answer: (answer: DoorAnswer) => void = () => {};
    const send = vi.fn(() => new Promise<DoorAnswer>((resolve) => (answer = resolve)));
    const writes = createPendingWrites(send);
    const write = vi.fn();
    const onSending = vi.fn();
    const onSent = vi.fn();
    const held = writes.hold(write, () => door, { onSending, onSent });
    writes.sendEarly();
    expect(send).toHaveBeenCalledWith(door);
    expect(onSending).toHaveBeenCalledTimes(1);
    expect(onSent).not.toHaveBeenCalled();
    // The toast's own commit (its Undo taken away by onSending, or its timer) and an Undo do nothing now.
    held.commit();
    held.undo();
    writes.sendEarly();
    expect(write).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    answer("taken");
    await settle();
    expect(onSent).toHaveBeenCalledWith("taken");
  });

  it("an Undo answers whether it took the write back: true while the write is held, false once it has gone by its commit, an early send or an unmount", async () => {
    const writes = createPendingWrites(async (): Promise<DoorAnswer> => "taken");
    const held = writes.hold(vi.fn(), () => door);
    expect(held.undo()).toBe(true);
    expect(held.undo()).toBe(false);
    const committed = writes.hold(vi.fn(), () => door);
    committed.commit();
    expect(committed.undo()).toBe(false);
    const early = writes.hold(vi.fn(), () => door);
    writes.sendEarly();
    expect(early.undo()).toBe(false);
    const left = writes.hold(vi.fn(), () => door);
    writes.commitAll();
    expect(left.undo()).toBe(false);
    await settle();
  });

  it("a door that refuses is heard as refused, and a request lost on the way as not known", async () => {
    const writes = createPendingWrites(async (): Promise<DoorAnswer> => "refused");
    const refused = vi.fn();
    writes.hold(vi.fn(), () => door, { onSent: refused });
    const lost = vi.fn();
    const failing = createPendingWrites(() => Promise.reject(new Error("offline")));
    failing.hold(vi.fn(), () => door, { onSent: lost });
    writes.sendEarly();
    failing.sendEarly();
    await settle();
    expect(refused).toHaveBeenCalledWith("refused");
    expect(lost).toHaveBeenCalledWith("unknown");
  });

  it("an Undo before anything is sent writes nothing anywhere; the console unmounting within the app sends the rest by their actions", async () => {
    const send = vi.fn(async (): Promise<DoorAnswer> => "taken");
    const writes = createPendingWrites(send);
    const undone = vi.fn();
    const kept = vi.fn();
    writes.hold(undone, () => door).undo();
    writes.hold(kept, () => door);
    writes.commitAll();
    writes.sendEarly();
    await settle();
    expect(undone).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("the console unmounting within the app sends each held write by its action and takes its Undo away at once: its commit and Undo then do nothing", async () => {
    const send = vi.fn(async (): Promise<DoorAnswer> => "taken");
    const writes = createPendingWrites(send);
    const write = vi.fn();
    const onSending = vi.fn();
    const held = writes.hold(write, () => door, { onSending });
    writes.commitAll();
    expect(write).toHaveBeenCalledTimes(1);
    expect(onSending).toHaveBeenCalledTimes(1);
    // The toast's dismissal runs its commit, and its Undo is gone; either, pressed or run now, does nothing.
    held.commit();
    held.undo();
    writes.commitAll();
    writes.sendEarly();
    await settle();
    expect(write).toHaveBeenCalledTimes(1);
    expect(onSending).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(writes.size()).toBe(0);
  });

  it("each write held goes to its own door, read when it is sent", async () => {
    const send = vi.fn(async (): Promise<DoorAnswer> => "taken");
    const writes = createPendingWrites(send);
    let amount = 100;
    writes.hold(vi.fn(), () => ({ url: "/api/v1/operator/schools/s1/payment", method: "POST", body: { amountPaise: amount } }));
    writes.hold(vi.fn(), () => ({ url: "/api/v1/operator/subscriptions/bulk", method: "POST", body: { schoolIds: ["a", "b"], action: "STUDENTS_ON" } }));
    amount = 200;
    writes.sendEarly();
    await settle();
    expect(send.mock.calls.map((call) => (call as unknown as [DoorWrite])[0])).toEqual([
      { url: "/api/v1/operator/schools/s1/payment", method: "POST", body: { amountPaise: 200 } },
      { url: "/api/v1/operator/subscriptions/bulk", method: "POST", body: { schoolIds: ["a", "b"], action: "STUDENTS_ON" } },
    ]);
  });
});

describe("the door's answer to an early send", () => {
  it("taken on a 2xx; refused on a 4xx, the door's refusal or a school that is gone; not known on a 5xx, any other answer, or a request that never came back", async () => {
    const answers = [new Response(null, { status: 204 }), new Response("{}", { status: 422 }), new Response("{}", { status: 404 }), new Response("oops", { status: 500 }), new Response("<html>", { status: 502 })];
    const fetch = vi.fn(async () => answers.shift()!);
    vi.stubGlobal("fetch", fetch);
    try {
      expect(await sendToDoor(door)).toBe("taken");
      expect(await sendToDoor(door)).toBe("refused");
      expect(await sendToDoor(door)).toBe("refused");
      expect(await sendToDoor(door)).toBe("unknown");
      expect(await sendToDoor(door)).toBe("unknown");
      fetch.mockImplementationOnce(async () => {
        throw new TypeError("Failed to fetch");
      });
      expect(await sendToDoor(door)).toBe("unknown");
      expect(fetch.mock.calls[0]).toEqual([door.url, expect.objectContaining({ method: "PUT", keepalive: true, body: JSON.stringify(door.body) })]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("a held write's commit is heard both ways", () => {
  it("an action that answers reaches the answer's handler once; one that rejects reaches the not-known handler once and the answer's never", async () => {
    const answered = vi.fn();
    const unknown = vi.fn();
    whenAnswered(Promise.resolve({ ok: true }), answered, unknown);
    await settle();
    expect(answered).toHaveBeenCalledTimes(1);
    expect(answered).toHaveBeenCalledWith({ ok: true });
    expect(unknown).not.toHaveBeenCalled();
    const lostAnswered = vi.fn();
    const lostUnknown = vi.fn();
    whenAnswered(Promise.reject(new TypeError("Failed to fetch")), lostAnswered, lostUnknown);
    await settle();
    expect(lostUnknown).toHaveBeenCalledTimes(1);
    expect(lostAnswered).not.toHaveBeenCalled();
  });
});

describe("a switch whose write is held is drawn as set", () => {
  const before = { drawn: "before" };
  const redrawn = { drawn: "after" };
  it("no write held: drawn from what the screen holds", () => {
    expect(drawnOn(undefined, before, false)).toBe(false);
    expect(drawnOn(undefined, before, true)).toBe(true);
  });
  it("held or in flight: drawn as set, whatever redraws the screen meanwhile", () => {
    expect(drawnOn({ on: true }, before, false)).toBe(true);
    expect(drawnOn({ on: true }, redrawn, false)).toBe(true);
  });
  it("answered as saved: drawn as set until the first redraw after the answer, then from what the screen holds", () => {
    expect(drawnOn({ on: true, savedOn: before }, before, false)).toBe(true);
    expect(drawnOn({ on: true, savedOn: before }, redrawn, true)).toBe(true);
    expect(drawnOn({ on: true, savedOn: before }, redrawn, false)).toBe(false);
  });
});

describe("the Schools tab's bar waits for a held school", () => {
  it("waits while any school it acts on has a write held, and not otherwise", () => {
    expect(barWaits(["a", "b"], new Set(["b"]))).toBe(true);
    expect(barWaits(["a"], new Set(["b"]))).toBe(false);
    expect(barWaits([], new Set(["a"]))).toBe(false);
    expect(barWaits(["a", "b"], new Set())).toBe(false);
  });
});
