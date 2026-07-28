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

const DB_NAME = "edulink";
const DB_VERSION = 1;
const STORE = "outbox";

export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  body: string;
  createdAt: number;
  attempts: number;
  /** Groups related items so the UI can show "3 pending" per class. */
  tag: string;
  lastError?: string;
};

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
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        transaction.oncomplete = () => db.close();
      }),
  );
}

export function newClientId(): string {
  // crypto.randomUUID needs a secure context; the fallback keeps the app usable
  // on a plain-http LAN address during a school's own testing.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueue(item: Omit<QueuedRequest, "id" | "createdAt" | "attempts">): Promise<string> {
  const record: QueuedRequest = {
    ...item,
    id: newClientId(),
    createdAt: Date.now(),
    attempts: 0,
  };
  await tx("readwrite", (store) => store.put(record));
  await requestSync(item.tag);
  return record.id;
}

export async function listQueued(tag?: string): Promise<QueuedRequest[]> {
  const all = await tx<QueuedRequest[]>("readonly", (store) => store.getAll() as IDBRequest<QueuedRequest[]>);
  return tag ? all.filter((item) => item.tag === tag) : all;
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

  let sent = 0;
  let failed = 0;

  try {
    const items = (await listQueued()).sort((a, b) => a.createdAt - b.createdAt);

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: { "content-type": "application/json", "x-edulink-replay": "1" },
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
  } finally {
    flushing = false;
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
    const registration = await navigator.serviceWorker.ready;
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
