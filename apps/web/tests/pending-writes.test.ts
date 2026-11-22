/**
 * The console's held writes (src/app/root/subscriptions/pending-writes.ts; C5 point 1 and the coordinating session's walk of
 * 22 November 2026): a write held behind a toast's Undo runs once, through its server action when the toast commits or the
 * console unmounts within the app, and through the operator's own door when the page is hidden or left, since a server action
 * is dropped with the page. After an early send the toast's commit and Undo do nothing, and the console is told at once so it
 * takes the Undo away. The browser's own part (keepalive outliving the page) is held by e2e/premium-held-writes.spec.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { createPendingWrites, type DoorWrite } from "@/app/root/subscriptions/pending-writes";

const door: DoorWrite = { url: "/api/v1/operator/schools/s1/terms", method: "PUT", body: { premium: { teachers: true }, expect: { note: null } } };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("held writes", () => {
  it("the toast's commit sends the server action once; a second commit, an Undo after it and a later early send do nothing", async () => {
    const send = vi.fn(async () => true);
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
    let answer: (ok: boolean) => void = () => {};
    const send = vi.fn(() => new Promise<boolean>((resolve) => (answer = resolve)));
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
    answer(true);
    await settle();
    expect(onSent).toHaveBeenCalledWith(true);
  });

  it("a door that refuses, or a request lost on the way, is heard as not taken", async () => {
    const writes = createPendingWrites(async () => false);
    const refused = vi.fn();
    writes.hold(vi.fn(), () => door, { onSent: refused });
    const lost = vi.fn();
    const failing = createPendingWrites(() => Promise.reject(new Error("offline")));
    failing.hold(vi.fn(), () => door, { onSent: lost });
    writes.sendEarly();
    failing.sendEarly();
    await settle();
    expect(refused).toHaveBeenCalledWith(false);
    expect(lost).toHaveBeenCalledWith(false);
  });

  it("an Undo before anything is sent writes nothing anywhere; the console unmounting within the app sends the rest by their actions", async () => {
    const send = vi.fn(async () => true);
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

  it("each write held goes to its own door, read when it is sent", async () => {
    const send = vi.fn(async () => true);
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
