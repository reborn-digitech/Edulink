import { Platform } from "react-native";

/**
 * The offline outbox, the phone's twin of the web's lib/offline-queue.ts.
 *
 * Same contract: a queued item is a URL, a method and a JSON body with a
 * device-minted client id; flushing sends in the order queued, drops what the
 * server refused for good (4xx other than 401 and 429), and keeps what the
 * network dropped for the next try. Storage is expo-sqlite on a phone and an
 * in-memory list on the web target and in tests, behind one adapter so the
 * flush logic is exercised the same way everywhere.
 */
export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  body: string;
  tag: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

export type OutboxStore = {
  all(): Promise<QueuedRequest[]>;
  put(item: QueuedRequest): Promise<void>;
  remove(id: string): Promise<void>;
};

export function memoryOutbox(): OutboxStore {
  const items = new Map<string, QueuedRequest>();
  return {
    async all() {
      return [...items.values()];
    },
    async put(item) {
      items.set(item.id, item);
    },
    async remove(id) {
      items.delete(id);
    },
  };
}

function sqliteOutbox(): OutboxStore {
  type Db = { execAsync(sql: string): Promise<void>; runAsync(sql: string, ...params: unknown[]): Promise<unknown>; getAllAsync<T>(sql: string): Promise<T[]> };
  let dbPromise: Promise<Db> | null = null;
  const open = () => {
    if (!dbPromise) {
      dbPromise = import("expo-sqlite").then(async (sqlite) => {
        const db = (await sqlite.openDatabaseAsync("edulink-outbox.db")) as unknown as Db;
        await db.execAsync(
          "CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, url TEXT NOT NULL, method TEXT NOT NULL, body TEXT NOT NULL, tag TEXT NOT NULL, createdAt INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lastError TEXT)",
        );
        return db;
      });
    }
    return dbPromise;
  };
  return {
    async all() {
      const db = await open();
      return db.getAllAsync<QueuedRequest & { lastError: string | null }>("SELECT * FROM outbox ORDER BY createdAt ASC").then((rows) =>
        rows.map((r) => ({ ...r, lastError: r.lastError ?? undefined })),
      );
    },
    async put(item) {
      const db = await open();
      await db.runAsync(
        "INSERT OR REPLACE INTO outbox (id, url, method, body, tag, createdAt, attempts, lastError) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        item.id, item.url, item.method, item.body, item.tag, item.createdAt, item.attempts, item.lastError ?? null,
      );
    },
    async remove(id) {
      const db = await open();
      await db.runAsync("DELETE FROM outbox WHERE id = ?", id);
    },
  };
}

let store: OutboxStore | null = null;
function current(): OutboxStore {
  if (!store) store = Platform.OS === "web" ? memoryOutbox() : sqliteOutbox();
  return store;
}
export function __setOutboxStore(next: OutboxStore | null): void {
  store = next;
}

export function newClientId(): string {
  const bytes = new Uint8Array(12);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `${Date.now().toString(36)}-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export type QueueEvent =
  | { type: "queued"; item: QueuedRequest; remaining: number }
  | { type: "flushed"; sent: number; failed: number; remaining: number }
  | { type: "rejected"; item: QueuedRequest; status: number };

const listeners = new Set<(event: QueueEvent) => void>();
export function onQueueEvent(listener: (event: QueueEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event: QueueEvent) {
  for (const l of listeners) l(event);
}

let lastCreatedAt = 0;

export async function enqueue(item: Omit<QueuedRequest, "id" | "createdAt" | "attempts">): Promise<string> {
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  const record: QueuedRequest = { ...item, id: newClientId(), createdAt: lastCreatedAt, attempts: 0 };
  await current().put(record);
  emit({ type: "queued", item: record, remaining: (await current().all()).length });
  return record.id;
}

export async function listQueued(tag?: string): Promise<QueuedRequest[]> {
  const all = (await current().all()).sort((a, b) => a.createdAt - b.createdAt);
  return tag ? all.filter((i) => i.tag === tag) : all;
}

export async function countQueued(tag?: string): Promise<number> {
  return (await listQueued(tag)).length;
}

let flushing = false;

/**
 * Sends everything queued, oldest first. `send` is the transport — the api
 * client's request with the replay header — injected so the suite can prove
 * the policy without a network.
 */
export async function flushQueue(
  send: (item: QueuedRequest) => Promise<{ status: number }>,
): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing) return { sent: 0, failed: 0, remaining: await countQueued() };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    for (const item of await listQueued()) {
      let status = 0;
      let error = "";
      try {
        status = (await send(item)).status;
      } catch (e) {
        error = e instanceof Error ? e.message : "network";
      }
      if (status >= 200 && status < 300) {
        await current().remove(item.id);
        sent++;
        continue;
      }
      if (status >= 400 && status < 500 && status !== 401 && status !== 429) {
        await current().remove(item.id);
        failed++;
        emit({ type: "rejected", item, status });
        continue;
      }
      await current().put({ ...item, attempts: item.attempts + 1, lastError: error || `HTTP ${status}` });
      failed++;
    }
  } finally {
    flushing = false;
  }
  const remaining = await countQueued();
  emit({ type: "flushed", sent, failed, remaining });
  return { sent, failed, remaining };
}
