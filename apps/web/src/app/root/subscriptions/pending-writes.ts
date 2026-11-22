"use client";

import { useCallback, useEffect, useRef } from "react";

/** The operator's own door that does what a held write does (the terms PUT, the payment POST, the bulk POST). */
export type DoorWrite = { url: string; method: "PUT" | "POST"; body: unknown };
/** What the console does when a held write is sent early: take the Undo away at once, and hear how it went. */
export type EarlySend = { onSending?: () => void; onSent?: (ok: boolean) => void };

type Entry = { commit: () => void; early: () => void };

/**
 * The held writes, apart from React so a suite can drive them (tests/pending-writes.test.ts). `send` makes the door's request
 * and answers whether the door took it. A write runs once, whichever comes first: the toast's commit (the server action,
 * `write`), an Undo (nothing), or an early send (the door, through `send`), after which the toast's commit and Undo do nothing.
 */
export function createPendingWrites(send: (door: DoorWrite) => Promise<boolean>) {
  const pending = new Map<number, Entry>();
  let next = 0;

  function hold(write: () => void, door: () => DoorWrite, early: EarlySend = {}) {
    const id = next++;
    let done = false;
    const finish = () => {
      if (done) return false;
      done = true;
      pending.delete(id);
      return true;
    };
    const commit = () => {
      if (finish()) write();
    };
    const undo = () => {
      finish();
    };
    const sendEarly = () => {
      if (!finish()) return;
      early.onSending?.();
      void send(door()).then(
        (ok) => early.onSent?.(ok),
        () => early.onSent?.(false),
      );
    };
    pending.set(id, { commit, early: sendEarly });
    return { commit, undo };
  }

  return {
    hold,
    /** The page is hidden or going: every write still held goes to its door now. */
    sendEarly: () => {
      for (const entry of [...pending.values()]) entry.early();
    },
    /** The console unmounts within the app, where the page lives on: every write still held goes through its server action. */
    commitAll: () => {
      for (const entry of [...pending.values()]) entry.commit();
    },
    size: () => pending.size,
  };
}

/** A door's request that outlives the page: sent with keepalive, as sign-out's is (src/lib/push-client.ts). */
export function sendToDoor(door: DoorWrite): Promise<boolean> {
  return fetch(door.url, {
    method: door.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(door.body),
    credentials: "same-origin",
    keepalive: true,
  }).then(
    (response) => response.ok,
    () => false,
  );
}

/**
 * WRITES HELD BEHIND A TOAST'S UNDO ARE NEVER LOST (the coordinating session's C5 point 1; the review of phase 5, C2; its walk
 * of 22 November 2026). The console sends a switch, a sheet's save, Record payment and a bulk change from the toast's onCommit,
 * ten seconds after the operator has read that it is done. A tab closed, reloaded or sent to another address meanwhile would
 * drop it: the toast's timers die with the page, and a server action is an ordinary request that the browser drops with the
 * page (the walk found the switch still off nine seconds after leaving). So every write still held goes at once, when the page
 * is hidden or left, to the operator's own door that does the same, as a keepalive request the browser finishes after the page
 * has gone; and through its own server action when this console unmounts within the app, where the page lives on. Each write
 * runs once. After an early send the console is told (onSending) and takes the Undo away, since an Undo then could not take it
 * back, and hears whether the door took it (onSent).
 */
export function usePendingWrites() {
  const writes = useRef<ReturnType<typeof createPendingWrites> | null>(null);
  if (writes.current === null) writes.current = createPendingWrites(sendToDoor);

  const hold = useCallback((write: () => void, door: () => DoorWrite, early?: EarlySend) => writes.current!.hold(write, door, early), []);

  useEffect(() => {
    const held = writes.current!;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") held.sendEarly();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", held.sendEarly);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", held.sendEarly);
      held.commitAll();
    };
  }, []);

  return hold;
}
