/**
 * The web's outbox and its service worker (testing analysis of 13 November 2026):
 *
 *   TA-218 — the worker's Background Sync drain replayed rows in the order of their random ids, removed a row on any
 *            4xx (401 and 429 included) and told the page nothing.
 *   TA-219, TA-519 — a session that ENDED while writes were queued (owner null) dropped them at once, and the runtime
 *            never said how many.
 *   TA-221 — the page cache answered a merely slow navigation with a copy up to seven days old, and kept exports.
 *   TA-222 — a pressed notification focused a window and posted a "navigate" message nobody listened for.
 *   TA-220 — next.config.ts reloaded the page whenever the network came back.
 *
 * The outbox and the worker's drain run here for real against an in-memory IndexedDB (fake-indexeddb, as
 * tests/offline-queue.test.ts). The worker file itself builds Serwist at module scope and cannot be loaded by a suite,
 * so its decisions live in src/lib/sw-helpers.ts, which runs here, and sw.ts is read to see it uses them.
 */
import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countQueued, enqueue, flushQueue, listQueued, OUTBOX_HOLD_MS, setOutboxOwner } from "@/lib/offline-queue";
import { appPath, cacheablePage, drainOutbox, pickWindow, type OutboxRow } from "@/lib/sw-helpers";

const fetchMock = vi.fn<typeof fetch>();

/** The browser's database as the worker opens it. */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("edulink", 2);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

async function rows(): Promise<OutboxRow[]> {
  const db = await openDb();
  const all = await new Promise<OutboxRow[]>((resolve, reject) => {
    const r = db.transaction("outbox", "readonly").objectStore("outbox").getAll();
    r.onsuccess = () => resolve(r.result as OutboxRow[]);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return all;
}

async function put(row: OutboxRow): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const r = db.transaction("outbox", "readwrite").objectStore("outbox").put(row);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
  db.close();
}

async function clearAll(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const r = db.transaction("outbox", "readwrite").objectStore("outbox").clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
  db.close();
}

beforeEach(async () => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { onLine: true, serviceWorker: undefined });
  fetchMock.mockReset();
  // Opens (and creates) the database through the app's own module, then starts from an empty outbox.
  await setOutboxOwner("zz-ta218-teacher");
  await clearAll();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TA-218: the worker's drain keeps the page's rules", () => {
  const OWNER = "zz-ta218-teacher";

  it("TA-218: rows go out oldest first, whatever their random ids", async () => {
    // "aaa" sorts first by key and was queued last; "zzz" sorts last and was queued first.
    await put({ id: "aaa", url: "/api/v1/marks", method: "POST", body: '{"sheet":2}', tag: "marks:c1", createdAt: 2000, owner: OWNER });
    await put({ id: "zzz", url: "/api/v1/marks", method: "POST", body: '{"sheet":1}', tag: "marks:c1", createdAt: 1000, owner: OWNER });
    fetchMock.mockImplementation(async () => new Response("{}", { status: 200 }));
    const db = await openDb();
    const result = await drainOutbox(db, fetchMock);
    db.close();
    expect(fetchMock.mock.calls.map(([, init]) => (init as RequestInit).body)).toEqual(['{"sheet":1}', '{"sheet":2}']);
    expect(result).toMatchObject({ sent: 2, kept: 0, rejected: [], retry: false });
    expect(await rows()).toEqual([]);
  });

  it("TA-218: a 401 or a 429 keeps the row (and holds its tag's later rows back); another 4xx removes it and is reported", async () => {
    await put({ id: "r1", url: "/api/attendance", method: "POST", body: "a1", tag: "attendance:c1", createdAt: 1, owner: OWNER });
    await put({ id: "r2", url: "/api/attendance", method: "POST", body: "a2", tag: "attendance:c1", createdAt: 2, owner: OWNER });
    await put({ id: "r3", url: "/api/v1/messages", method: "POST", body: "m1", tag: "message:x", createdAt: 3, owner: OWNER });
    await put({ id: "r4", url: "/api/v1/marks", method: "POST", body: "k1", tag: "marks:c2", createdAt: 4, owner: OWNER });
    fetchMock.mockImplementation(async (_url, init) => {
      const body = (init as RequestInit).body;
      if (body === "a1") return new Response("", { status: 401 });
      if (body === "m1") return new Response("", { status: 429 });
      return new Response('{"error":"no"}', { status: 422 });
    });
    const db = await openDb();
    const result = await drainOutbox(db, fetchMock);
    db.close();
    // a2 is never sent: a1, before it on the same register, is still waiting.
    expect(fetchMock.mock.calls.map(([, init]) => (init as RequestInit).body)).toEqual(["a1", "m1", "k1"]);
    expect((await rows()).map((r) => r.id).sort()).toEqual(["r1", "r2", "r3"]);
    expect(result.rejected).toEqual([{ id: "r4", tag: "marks:c2", url: "/api/v1/marks", status: 422 }]);
    expect(result.retry).toBe(false);
  });

  it("TA-218: a server error or no network keeps the row and asks the browser to try again", async () => {
    await put({ id: "s1", url: "/api/attendance", method: "POST", body: "x", tag: "attendance:c1", createdAt: 1, owner: OWNER });
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const db = await openDb();
    const result = await drainOutbox(db, fetchMock);
    db.close();
    expect(result).toMatchObject({ sent: 0, kept: 1, retry: true });
    expect(await rows()).toHaveLength(1);
  });

  it("TA-218: only the signed-in person's rows go out", async () => {
    await put({ id: "o1", url: "/api/attendance", method: "POST", body: "theirs", tag: "attendance:c1", createdAt: 1, owner: "zz-someone-else" });
    const db = await openDb();
    await drainOutbox(db, fetchMock);
    db.close();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TA-218: the worker drains through these rules, under the outbox's lock, and tells the page what was refused", () => {
    const sw = readFileSync("src/sw.ts", "utf8");
    expect(sw).toMatch(/import \{[^}]*drainOutbox as drainRows[^}]*\} from "\.\/lib\/sw-helpers"/);
    expect(sw).toMatch(/locks\.request\(OUTBOX_LOCK/);
    expect(sw).toMatch(/type: "outbox:rejected"/);
    expect(sw, "the old rule removed a row on any 4xx").not.toMatch(/response\.status >= 400 && response\.status < 500\)\) \{/);
    const runtime = readFileSync("src/components/app-runtime.tsx", "utf8");
    expect(runtime).toMatch(/"outbox:rejected"/);
    expect(readFileSync("src/lib/offline-queue.ts", "utf8")).toMatch(/locks\.request\(OUTBOX_LOCK/);
  });
});

describe("TA-219 and TA-519: a session that ends keeps what it queued", () => {
  it("TA-219: owner a queues, the session ends (null): the row is kept and not sent; a signs in again and it goes", async () => {
    await setOutboxOwner("zz-ta219-a");
    await enqueue({ url: "/api/attendance", method: "POST", body: '{"marks":30}', tag: "attendance:c1" });
    const ended = await setOutboxOwner(null);
    expect(ended).toEqual({ dropped: 0, changed: true });
    expect((await rows()).map((r) => r.owner)).toEqual(["zz-ta219-a"]);
    // Nobody signed in: nothing of hers is listed or sent.
    expect(await countQueued()).toBe(0);
    expect(await flushQueue()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    // She signs in again: it is hers, and it goes.
    expect(await setOutboxOwner("zz-ta219-a")).toEqual({ dropped: 0, changed: true });
    expect(await listQueued()).toHaveLength(1);
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    expect(await flushQueue()).toMatchObject({ sent: 1 });
  });

  it("TA-519: somebody else signing in after the session ended drops the rows and says how many", async () => {
    await setOutboxOwner("zz-ta519-a");
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1" });
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks:c1" });
    await setOutboxOwner(null);
    expect(await rows()).toHaveLength(2);
    expect(await setOutboxOwner("zz-ta519-b")).toEqual({ dropped: 2, changed: true });
    expect(await rows()).toEqual([]);
  });

  it("TA-219: a row that has waited longer than the hold goes when nobody is signed in", async () => {
    await setOutboxOwner("zz-ta219-c");
    await put({ id: "old", url: "/api/attendance", method: "POST", body: "{}", tag: "attendance:c1", createdAt: Date.now() - OUTBOX_HOLD_MS - 1000, owner: "zz-ta219-c" });
    expect(await setOutboxOwner(null)).toEqual({ dropped: 1, changed: true });
  });

  it("TA-519: the runtime says what was dropped, in a toast that stays", () => {
    const runtime = readFileSync("src/components/app-runtime.tsx", "utf8");
    expect(runtime).toMatch(/setOutboxOwner\(owner\)\.then\(\(\{ changed, dropped \}\)/);
    expect(runtime).toMatch(/dropped > 0[\s\S]{0,200}duration: null/);
  });
});

describe("TA-221: the page cache", () => {
  const html = (status = 200, headers: Record<string, string> = { "content-type": "text/html; charset=utf-8" }) => new Response("<html></html>", { status, headers });

  it("TA-221: only a page is stored: not an export, not an error, not a download", () => {
    expect(cacheablePage(html())).toBe(true);
    expect(cacheablePage(html(500))).toBe(false);
    expect(cacheablePage(new Response("a,b\n1,2", { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="outstanding.csv"' } }))).toBe(false);
    expect(cacheablePage(new Response("x", { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } }))).toBe(false);
    expect(cacheablePage(new Response("<html></html>", { headers: { "content-type": "text/html", "content-disposition": "attachment" } }))).toBe(false);
  });

  it("TA-221: a slow network is waited for: the navigation rule has no timeout, and it stores through cacheablePage", () => {
    const sw = readFileSync("src/sw.ts", "utf8");
    const rule = sw.slice(sw.indexOf('cacheName: "edulink-pages"') - 200, sw.indexOf('cacheName: "edulink-pages"') + 400);
    expect(rule).not.toMatch(/networkTimeoutSeconds/);
    expect(rule).toMatch(/cacheWillUpdate: async \(\{ response \}\) => \(cacheablePage\(response\) \? response : null\)/);
  });
});

describe("TA-222: a pressed notification opens its page", () => {
  it("TA-222: the window already on the page is used as it is; otherwise the focused one is told to go there", () => {
    const origin = "https://shalaghar.example";
    const a = { url: `${origin}/teacher`, focused: false };
    const b = { url: `${origin}/parent/attendance`, focused: false };
    const c = { url: `${origin}/notifications`, focused: true };
    expect(pickWindow([a, b, c], "/parent/attendance", origin)).toEqual({ client: b, onPage: true });
    expect(pickWindow([a, c], "/parent/attendance", origin)).toEqual({ client: c, onPage: false });
    expect(pickWindow([], "/parent/attendance", origin)).toBeNull();
  });

  it("TA-222: a notice's link is followed only when it is a path of this app", () => {
    expect(appPath("/parent/attendance?child=1")).toBe("/parent/attendance?child=1");
    expect(appPath("//evil.example/x")).toBeNull();
    expect(appPath("https://evil.example/x")).toBeNull();
    expect(appPath(undefined)).toBeNull();
  });

  it("TA-222: the worker posts navigate to a window not on the page, and the runtime listens for it", () => {
    const sw = readFileSync("src/sw.ts", "utf8");
    expect(sw).toMatch(/pickWindow\(clients, url, self\.location\.origin\)/);
    expect(sw).toMatch(/if \(!picked\.onPage\) picked\.client\.postMessage\(\{ type: "navigate", url \}\)/);
    const runtime = readFileSync("src/components/app-runtime.tsx", "utf8");
    expect(runtime).toMatch(/container\.addEventListener\("message", onMessage\)/);
    expect(runtime).toMatch(/data\?\.type === "navigate"[\s\S]{0,120}openAppPath\(path\)/);
  });
});

describe("TA-220: the network coming back does not reload the page", () => {
  it("TA-220: next.config.ts does not set reloadOnOnline", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toMatch(/reloadOnOnline:\s*false/);
    expect(config).not.toMatch(/reloadOnOnline:\s*true/);
  });
});
