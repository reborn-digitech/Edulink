/**
 * The phone's outbox store: expo-sqlite. This file is picked by Metro on iOS
 * and Android only (.native.ts); the web file beside it returns null and the
 * outbox falls back to memory — so the web bundle and the static render
 * never see expo-sqlite, whose web worker source cannot be server-rendered.
 */
import type { OutboxStore, QueuedRequest } from "./outbox";

export function platformOutbox(): OutboxStore {
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

