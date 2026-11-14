/**
 * The service worker's decisions, as plain functions (src/sw.ts imports them): the worker itself builds Serwist at
 * module scope and cannot be loaded by a suite, so what it decides lives here and tests/ta-web-shell-ui-offline.test.ts
 * runs it. Nothing here is "use client" or server-only; it runs in the worker and in the page alike.
 */

/** The outbox's object store, as src/lib/offline-queue.ts writes it: db "edulink", store "outbox", keyPath "id". */
export const OUTBOX_STORE = "outbox";
export const OUTBOX_META = "meta";
export const OUTBOX_OWNER_KEY = "owner";
/** The Web Lock both drains take, so the worker and the page never replay the outbox at the same time (TA-218). */
export const OUTBOX_LOCK = "edulink-outbox";

export type OutboxRow = {
  id: string;
  url: string;
  method: string;
  body: string;
  tag: string;
  createdAt?: number;
  owner?: string | null;
};

export type DrainResult = {
  sent: number;
  /** Kept for a later attempt: a 401 or 429, a server error, the network, or an earlier row of the same tag held back. */
  kept: number;
  /** Refused for good and removed: the page says so with its pinned toast (TA-218). */
  rejected: { id: string; tag: string; url: string; status: number }[];
  /** A server error or the network: the sync event should fail so the browser tries again later. */
  retry: boolean;
};

function request<T>(run: () => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const r = run();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/**
 * The worker's replay of the outbox (TA-218), with the page's rules (offline-queue.ts flushQueue): only the signed-in
 * person's rows, oldest first by `createdAt` (the ids are random, so the store's own order is not the queue's), a row
 * kept on 401 (the session may only be stale) and 429, removed and reported on any other 4xx, kept on a 5xx or a
 * network failure; and a tag whose row was kept sends none of its later rows, so a newer marks sheet never lands
 * before an older one that is still waiting.
 */
export async function drainOutbox(db: IDBDatabase, fetcher: typeof fetch): Promise<DrainResult> {
  const all = await request(() => db.transaction(OUTBOX_STORE, "readonly").objectStore(OUTBOX_STORE).getAll() as IDBRequest<OutboxRow[]>);
  const owner = await request(() => db.transaction(OUTBOX_META, "readonly").objectStore(OUTBOX_META).get(OUTBOX_OWNER_KEY) as IDBRequest<string | null | undefined>).catch(
    () => null,
  );
  const items = all.filter((item) => (item.owner ?? null) === (owner ?? null)).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const result: DrainResult = { sent: 0, kept: 0, rejected: [], retry: false };
  const heldTags = new Set<string>();
  const remove = (id: string) => request(() => db.transaction(OUTBOX_STORE, "readwrite").objectStore(OUTBOX_STORE).delete(id));

  for (const item of items) {
    if (heldTags.has(item.tag)) {
      result.kept++;
      continue;
    }
    let status: number;
    try {
      const response = await fetcher(item.url, {
        method: item.method,
        headers: { "content-type": "application/json", "x-edulink-replay": "1", ...(item.owner ? { "x-edulink-owner": item.owner } : {}) },
        body: item.body,
      });
      status = response.status;
      if (response.ok) {
        await remove(item.id);
        result.sent++;
        continue;
      }
    } catch {
      status = 0;
    }
    if (status >= 400 && status < 500 && status !== 401 && status !== 429) {
      await remove(item.id);
      result.rejected.push({ id: item.id, tag: item.tag, url: item.url, status });
      continue;
    }
    // 401, 429, a server error or no network: the row waits, and so do the later rows of its tag.
    heldTags.add(item.tag);
    result.kept++;
    if (status === 0 || status >= 500) result.retry = true;
  }
  return result;
}

/**
 * Whether a navigation's answer may go into the page cache (TA-221). Only a page: an HTML answer of 200 that is not a
 * download. An export (/admin/fees/export/outstanding, a payroll or filing sheet) is a navigation too, and a copy of it
 * would be handed back days later under today's name when the network failed.
 */
export function cacheablePage(response: Response | undefined | null): boolean {
  if (!response || response.status !== 200 || response.type === "opaque") return false;
  const type = response.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("text/html")) return false;
  const disposition = response.headers.get("content-disposition") ?? "";
  return !/^\s*attachment/i.test(disposition);
}

/** A notification's link, when it is a path of this app: never another origin, never a protocol-relative "//host". */
export function appPath(url: unknown): string | null {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return null;
  return url;
}

type WindowLike = { url: string; focused?: boolean };

/**
 * Which open window a pressed notification should use (TA-222): one already on its page if there is one, otherwise
 * the focused one, otherwise the first; null when there is none (the worker then opens a window).
 */
export function pickWindow<T extends WindowLike>(clients: readonly T[], path: string, origin: string): { client: T; onPage: boolean } | null {
  if (clients.length === 0) return null;
  const target = new URL(path, origin);
  const onPage = clients.find((client) => {
    try {
      const at = new URL(client.url);
      return at.origin === target.origin && at.pathname === target.pathname && at.search === target.search;
    } catch {
      return false;
    }
  });
  if (onPage) return { client: onPage, onPage: true };
  return { client: clients.find((client) => client.focused) ?? clients[0]!, onPage: false };
}

/**
 * Opens a path of this app in the page: what the runtime does with the worker's "navigate" message (TA-222). Its own
 * function, so a suite can stand in for the browser's navigation, which jsdom does not do.
 */
export function openAppPath(path: string): void {
  window.location.assign(path);
}
