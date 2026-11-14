"use client";

/**
 * Durable outbox for writes made while offline.
 *
 * IndexedDB rather than localStorage: localStorage is synchronous (janks the
 * main thread mid-tap), capped around 5 MB, and — critically — invisible to the
 * service worker, which is the thing that has to flush the queue when
 * connectivity returns while the tab is closed.
 *
 * Every queued item carries a `clientId` minted here. The server treats that as
 * an idempotency key, so a Background Sync replay after a half-delivered batch
 * cannot double-write a register. (§10 "operation writes twice")
 */

import { OUTBOX_LOCK } from "./sw-helpers";

const DB_NAME = "edulink";
const DB_VERSION = 2;
const STORE = "outbox";
const META = "meta";
const OWNER_KEY = "owner";

export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: number;
  attempts: number;
  /** Groups related items so the UI can show "3 pending" per class. */
  tag: string;
  /**
   * Who queued it: the signed-in person's id, or null for a row queued with
   * no one signed in (a row from before the stamp, or the login page). A row
   * replays only under its owner's session — the next person to sign in on
   * the same browser inherits nothing — and the server refuses a replay that
   * names someone else (X-Edulink-Owner).
   */
  owner: string | null;
  lastError?: string;
};

/* -------------------------------------------------------------------------- */
/* Whose outbox this is                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The signed-in person, as the app shell tells the runtime on every page.
 * Kept in the database's own meta store rather than in localStorage, so the
 * service worker — which cannot read localStorage — drains the same rows.
 */
let currentOwner: string | null | undefined;

/** How long a row waits, with nobody signed in, for its owner's next session (the phone's outbox holds seven days too). */
export const OUTBOX_HOLD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Called by the runtime with the session's user id, or null when signed out.
 * When the owner changes the private caches are cleared, so what one person
 * read on a shared staff-room machine is not the next person's offline page.
 *
 * NOBODY IS NOT SOMEBODY ELSE (TA-219, TA-519). A change to null — a session
 * that reached its thirtieth day, a "sign out everywhere", a sign-out — keeps
 * the rows: each is bound to its owner, both drains send only the signed-in
 * person's rows and the server refuses a replay under anyone else, so they
 * wait for the owner's next session, up to OUTBOX_HOLD_MS. Rows are dropped
 * when a DIFFERENT person signs in, or when they have waited longer than
 * that. Returns what was dropped so the caller can say (the runtime's toast).
 */
export async function setOutboxOwner(owner: string | null): Promise<{ dropped: number; changed: boolean }> {
  const before = currentOwner === undefined ? await readOwner() : currentOwner;
  currentOwner = owner;
  const changed = before !== undefined && before !== owner;
  try {
    await metaTx("readwrite", (store) => store.put(owner, OWNER_KEY));
  } catch {
    // No IndexedDB: nothing is queued either.
  }
  let dropped = 0;
  if (changed) {
    try {
      const all = await tx<QueuedRequest[]>("readonly", (store) => store.getAll() as IDBRequest<QueuedRequest[]>);
      const now = Date.now();
      for (const item of all) {
        const rowOwner = item.owner ?? null;
        if (rowOwner === owner) continue;
        if (owner === null && rowOwner !== null && now - item.createdAt < OUTBOX_HOLD_MS) continue;
        await remove(item.id);
        dropped++;
      }
    } catch {
      // Nothing to drop.
    }
    await clearPrivateCaches();
  }
  return { dropped, changed };
}

async function readOwner(): Promise<string | null | undefined> {
  try {
    const value = await metaTx<string | null | undefined>("readonly", (store) => store.get(OWNER_KEY) as IDBRequest<string | null | undefined>);
    return value === undefined ? null : value;
  } catch {
    return undefined;
  }
}

/** The service worker's API and page caches: one person's register must not be the next person's offline page. */
export async function clearPrivateCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    await Promise.all(["edulink-api", "edulink-pages"].map((name) => caches.delete(name)));
  } catch {
    // A browser without CacheStorage has nothing cached.
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("tag", "tag");
        store.createIndex("createdAt", "createdAt");
      }
      // Version 2: the owner beside the rows, for the worker to read.
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function storeTx<T>(name: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(name, mode);
        const request = run(transaction.objectStore(name));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        transaction.oncomplete = () => db.close();
      }),
  );
}

const tx = <T,>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => storeTx(STORE, mode, run);
const metaTx = <T,>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => storeTx(META, mode, run);

export function newClientId(): string {
  // crypto.randomUUID needs a secure context; the fallback keeps the app usable
  // on a plain-http LAN address during a school's own testing.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let lastCreatedAt = 0;

export async function enqueue(item: Omit<QueuedRequest, "id" | "createdAt" | "attempts" | "owner">): Promise<string> {
  // Strictly increasing, so two items queued in the same millisecond replay
  // in the order they were queued rather than in the order of their random ids
  // — a register and then the note about it, not the note first.
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  const owner = currentOwner === undefined ? (await readOwner()) ?? null : currentOwner;
  const record: QueuedRequest = {
    ...item,
    id: newClientId(),
    createdAt: lastCreatedAt,
    attempts: 0,
    owner,
  };
  await tx("readwrite", (store) => store.put(record));
  notifyListeners({ type: "queued", item: record, remaining: await countQueued() });
  await requestSync(item.tag);
  return record.id;
}

/** The signed-in person's rows only; another owner's wait for their own session. */
export async function listQueued(tag?: string): Promise<QueuedRequest[]> {
  const all = await tx<QueuedRequest[]>("readonly", (store) => store.getAll() as IDBRequest<QueuedRequest[]>);
  const owner = currentOwner === undefined ? (await readOwner()) ?? null : currentOwner;
  const own = all.filter((item) => (item.owner ?? null) === owner);
  return tag ? own.filter((item) => item.tag === tag) : own;
}

export async function countQueued(tag?: string): Promise<number> {
  return (await listQueued(tag)).length;
}

export async function remove(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id));
}

async function markAttempt(item: QueuedRequest, error: string): Promise<void> {
  await tx("readwrite", (store) => store.put({ ...item, attempts: item.attempts + 1, lastError: error }));
}

/**
 * Sends everything in the outbox. Safe to call repeatedly and concurrently —
 * a second call while one is in flight returns immediately rather than
 * double-sending.
 */
let flushing = false;

export async function flushQueue(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing) return { sent: 0, failed: 0, remaining: await countQueued() };
  flushing = true;
  // Under the outbox's Web Lock (sw-helpers.ts OUTBOX_LOCK), which the worker's Background Sync drain takes too, so
  // the two never replay the same rows side by side and out of order (TA-218). The rows are read inside it.
  const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
  try {
    return locks ? await locks.request(OUTBOX_LOCK, () => flushUnlocked()) : await flushUnlocked();
  } finally {
    flushing = false;
  }
}

async function flushUnlocked(): Promise<{ sent: number; failed: number; remaining: number }> {
  let sent = 0;
  let failed = 0;

  {
    const items = (await listQueued()).sort((a, b) => a.createdAt - b.createdAt);

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: { "content-type": "application/json", "x-edulink-replay": "1", ...(item.owner ? { "x-edulink-owner": item.owner } : {}) },
          body: item.body,
        });

        if (response.ok) {
          await remove(item.id);
          sent++;
          continue;
        }

        // 4xx means the server rejected the *content*; replaying will never
        // help, so drop it rather than retry forever — but surface it, because
        // silently discarding a teacher's attendance mark is worse than a
        // visible error. 401 is the exception: the session may just be stale.
        if (response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 429) {
          await remove(item.id);
          failed++;
          const detail = await response.text().catch(() => "");
          console.error(`[outbox] permanently rejected ${item.url}: ${response.status} ${detail.slice(0, 200)}`);
          notifyListeners({ type: "rejected", item, status: response.status });
          continue;
        }

        await markAttempt(item, `HTTP ${response.status}`);
        failed++;
      } catch (error) {
        // Network still down — leave it queued for the next attempt.
        await markAttempt(item, error instanceof Error ? error.message : "network error");
        failed++;
      }
    }
  }

  const remaining = await countQueued();
  notifyListeners({ type: "flushed", sent, failed, remaining });
  return { sent, failed, remaining };
}

/* -------------------------------------------------------------------------- */
/* Background Sync                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Asks the service worker to retry when connectivity returns, even if the tab
 * is closed. Background Sync is Chromium-only; where it is missing we fall back
 * to flushing on the `online` event, which covers the tab-still-open case.
 */
async function requestSync(tag: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    // getRegistration, NOT ready: `ready` is a promise that never settles
    // while no worker is registered — dev mode, a browser that refused the
    // script, Safari before the first install — and this function sits on the
    // enqueue path, so the queued item's caller (the reply box clearing its
    // textarea, the toast) hung with it. Found by walking the reply box in a
    // browser with no worker: the message was queued and the box never cleared.
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    const sync = (registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    }).sync;
    if (sync) await sync.register(`outbox:${tag}`);
  } catch {
    // Permission denied or unsupported — the online-event fallback handles it.
  }
}

/* -------------------------------------------------------------------------- */
/* Listeners                                                                   */
/* -------------------------------------------------------------------------- */

export type QueueEvent =
  | { type: "queued"; item: QueuedRequest; remaining: number }
  | { type: "flushed"; sent: number; failed: number; remaining: number }
  | { type: "rejected"; item: QueuedRequest; status: number };

const listeners = new Set<(event: QueueEvent) => void>();

export function onQueueEvent(listener: (event: QueueEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(event: QueueEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error("[outbox] listener threw", error);
    }
  }
}
