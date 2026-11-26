"use client";

import { useCallback, useEffect, useRef } from "react";

/** The operator's own door that does what a held write does (the terms PUT, the payment POST, the bulk POST). */
export type DoorWrite = { url: string; method: "PUT" | "POST"; body: unknown };
/**
 * How a door answered a write sent early: taken (a 2xx); refused (a 4xx: the door's refusal, or a school that is gone), so
 * not written; or not known (no answer at all, a 5xx, or anything else), since a door can answer 500 after its write has
 * committed.
 */
export type DoorAnswer = "taken" | "refused" | "unknown";
/** What the console does when a held write is sent early: take the Undo away at once, and hear how it went. */
export type EarlySend = { onSending?: () => void; onSent?: (answer: DoorAnswer) => void };

type Entry = { commit: () => void; early: () => void; leave: () => void };

/**
 * The held writes, apart from React so a suite can drive them (tests/pending-writes.test.ts). `send` makes the door's request
 * and answers how the door took it. A write runs once, whichever comes first: the toast's commit (the server action,
 * `write`), an Undo (nothing), an early send (the door, through `send`), or the console unmounting within the app (the server
 * action, `write`), after which the toast's commit and Undo do nothing, and the Undo answers false. After an early send or an
 * unmount the console is told (onSending) and takes the Undo away, since an Undo then could not take the write back.
 */
export function createPendingWrites(send: (door: DoorWrite) => Promise<DoorAnswer>) {
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
    /** Whether the Undo took the write back: false where it had already gone (its commit, an early send or an unmount). */
    const undo = (): boolean => finish();
    const sendEarly = () => {
      if (!finish()) return;
      early.onSending?.();
      void send(door()).then(
        (answer) => early.onSent?.(answer),
        () => early.onSent?.("unknown"),
      );
    };
    // The console unmounting within the app: the write goes through its action now, its answer heard as a commit's, and
    // its Undo is taken away (the toast lives on in the layout); once marked done, the dismissal's commit does nothing.
    const leave = () => {
      if (!finish()) return;
      write();
      early.onSending?.();
    };
    pending.set(id, { commit, early: sendEarly, leave });
    return { commit, undo };
  }

  return {
    hold,
    /** The page is hidden or going: every write still held goes to its door now. */
    sendEarly: () => {
      for (const entry of [...pending.values()]) entry.early();
    },
    /** The console unmounts within the app, where the page lives on: every write still held goes through its server action, and its Undo goes. */
    commitAll: () => {
      for (const entry of [...pending.values()]) entry.leave();
    },
    size: () => pending.size,
  };
}

/** A door's request that outlives the page: sent with keepalive, as sign-out's is (src/lib/push-client.ts). */
export function sendToDoor(door: DoorWrite): Promise<DoorAnswer> {
  return fetch(door.url, {
    method: door.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(door.body),
    credentials: "same-origin",
    keepalive: true,
  }).then(
    (response): DoorAnswer => (response.ok ? "taken" : response.status >= 400 && response.status < 500 ? "refused" : "unknown"),
    (): DoorAnswer => "unknown",
  );
}

/**
 * A held write's commit, heard both ways: the action's answer to `answered`, and a rejection to `unknown`. A server action
 * answers its own refusals, so it rejects only when no answer could be read: the request was lost, or the server answered
 * with something other than the action's answer (a 5xx page, an action unknown after a deploy). Whether the write happened
 * is then not known. Every held write goes through this (tests/held-writes-source-rule.test.ts), so none is left without a
 * word when its answer is lost.
 */
export function whenAnswered<T>(call: Promise<T>, answered: (answer: T) => void, unknown: () => void): void {
  void call.then(answered, () => unknown());
}

/**
 * A switch drawn as the operator set it while its write is held. `savedOn` is the screen's data as it stood when the write's
 * commit was answered as saved (the card's terms, the tab's rows); absent while the write is held or in flight.
 */
export type HeldSwitch = { on: boolean; savedOn?: object };

/**
 * How a switch whose write is held is drawn: as the operator set it while the write is held or in flight, whatever else
 * redraws the screen meanwhile; once its commit is answered as saved, still so until the first redraw after that answer, so
 * it never flicks back; and from what the screen holds (`holds`) when no write holds it, the entry being dropped at once on a
 * refusal, an Undo or no clear answer. The answer's handlers run in closures from the press, so `savedOn` is the screen's data
 * as last drawn, read from a ref, never the objects the press saw.
 */
export function drawnOn(held: HeldSwitch | undefined, screen: object, holds: boolean): boolean {
  if (!held) return holds;
  if (held.savedOn === undefined) return held.on;
  return held.savedOn === screen ? held.on : holds;
}

/** The Schools tab's bar, and a bulk sheet's Confirm, wait while any school they act on has a write held. */
export function barWaits(schoolIds: Iterable<string>, waiting: ReadonlySet<string>): boolean {
  for (const id of schoolIds) if (waiting.has(id)) return true;
  return false;
}

/**
 * WRITES HELD BEHIND A TOAST'S UNDO ARE NEVER LOST (the coordinating session's C5 point 1; the review of phase 5, C2; its walk
 * of 22 November 2026). The console sends a switch, a sheet's save, Record payment and a bulk change from the toast's onCommit,
 * ten seconds after the operator has read that it is done. A tab closed, reloaded or sent to another address meanwhile would
 * drop it: the toast's timers die with the page, and a server action is an ordinary request that the browser drops with the
 * page (the walk found the switch still off nine seconds after leaving). So every write still held goes at once, when the page
 * is hidden or left, to the operator's own door that does the same, as a keepalive request the browser finishes after the page
 * has gone; and through its own server action when this console unmounts within the app, where the page lives on. Each write
 * runs once. After an early send or an unmount the console is told (onSending) and takes the Undo away, since an Undo then
 * could not take it back; it hears how the door took an early send (onSent), and an unmount's answer as a commit's. A commit
 * whose answer is lost is said too (whenAnswered): whether it was saved is then not known.
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
