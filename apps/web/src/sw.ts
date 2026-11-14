/// <reference lib="webworker" />
import { Serwist, NetworkFirst, NetworkOnly, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { OUTBOX_LOCK, appPath, cacheablePage, drainOutbox as drainRows, pickWindow } from "./lib/sw-helpers";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
  /** Background Sync is not in TypeScript's DOM lib yet. */
  interface SyncEvent extends ExtendableEvent {
    readonly tag: string;
    readonly lastChance: boolean;
  }
}
declare const self: ServiceWorkerGlobalScope;

/**
 * Shalaghar service worker.
 *
 * Caching strategy is chosen per resource by how bad stale data would be:
 *   * app shell / build assets — precached, immutable, hashed filenames
 *   * navigations              — network-first, falling back to /offline
 *   * API reads                — never cached (network only); the page cache
 *                                and the outbox carry what offline needs
 *   * API writes               — never cached; they go through the outbox
 *   * images/fonts             — cache-first with expiry
 */

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // a silent swap mid-register would lose in-flight state
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Writes must never be served from cache, and must never be *retried*
      // by the SW — the outbox owns replay so it can stay idempotent.
      matcher: ({ request, url }) =>
        url.pathname.startsWith("/api/") && request.method !== "GET",
      handler: new NetworkOnly(),
    },
    {
      /**
       * Per-user authorised files are NEVER cached by the service worker.
       *
       * This rule must come before the generic /api/ and image rules, both of
       * which would otherwise catch it. The SW cache is per-ORIGIN, not per-user,
       * and survives sign-out — so a cached submission attachment could be read
       * by the next person to use the device, for up to 30 days under the image
       * rule. The server refusing them is irrelevant if the request never
       * reaches the server.
       *
       * A school logo would be safe to cache, but it is not worth branching on
       * inside the worker: logos are small, immutable and already cached by the
       * browser via Cache-Control.
       */
      matcher: ({ url }) => url.pathname.startsWith("/api/files/"),
      handler: new NetworkOnly(),
    },
    {
      /**
       * API reads are NEVER cached by the worker since 2 October 2026. They
       * were kept a day under NetworkFirst, for a phone that lost signal to
       * show this morning's register; but the pages are server-rendered
       * (the page cache below carries them), the outbox carries the writes
       * that matter, and a day of one person's JSON on a shared classroom
       * tablet was the privacy surface the campaign of 1 October named. A
       * read with no network now fails as the fetch fails, and the page
       * says so, rather than answering with what the last person saw.
       */
      matcher: ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "image" && !url.pathname.startsWith("/api/files/"),
      handler: new CacheFirst({
        cacheName: "edulink-images",
        plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    {
      /**
       * The dictionaries (lib/i18n/delivery.ts, campaign LOAD-4): a page no
       * longer carries its words, it names /i18n/<locale>.<hash>.json and
       * comes alive once that file is in — so a page served from the page
       * cache below while offline needs it here too. Named by the hash of its
       * content, a copy never goes stale; a new dictionary is a new name.
       */
      matcher: ({ request, url }) => request.method === "GET" && url.pathname.startsWith("/i18n/"),
      handler: new CacheFirst({
        cacheName: "edulink-i18n",
        plugins: [new ExpirationPlugin({ maxEntries: 6 })],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "font" || request.destination === "style",
      handler: new StaleWhileRevalidate({ cacheName: "edulink-static" }),
    },
    {
      /**
       * A stored page only when the network has FAILED (TA-221), never because it was slow: with a four-second
       * timeout a slow morning answered yesterday's register as today's. And only pages are stored (cacheablePage):
       * an export is a navigation too, and its copy came back days later under today's name.
       */
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "edulink-pages",
        plugins: [
          { cacheWillUpdate: async ({ response }) => (cacheablePage(response) ? response : null) },
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.mode === "navigate" }],
  },
});

serwist.addEventListeners();

/* -------------------------------------------------------------------------- */
/* Background Sync — flush the outbox when connectivity returns                */
/* -------------------------------------------------------------------------- */

/**
 * The queue lives in IndexedDB (see src/lib/offline-queue.ts). The SW cannot
 * import that module's "use client" code, so it reads the same object store
 * directly. Both sides agree on: db "edulink", store "outbox", keyPath "id".
 */
const DB_NAME = "edulink";
const STORE = "outbox";

const META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("tag", "tag");
        store.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * The replay itself is sw-helpers.ts drainOutbox, with the page's rules (TA-218): oldest first, 401 and 429 kept, a
 * tag's later rows held behind a kept one. Under the outbox's Web Lock, so the page's own flush never runs beside it.
 * A row refused for good is told to every open tab, which shows the page's pinned "change rejected" toast.
 */
async function drainOutbox(): Promise<void> {
  const run = async () => {
    const db = await openDb();
    try {
      return await drainRows(db, fetch);
    } finally {
      db.close();
    }
  };
  const result = self.navigator.locks ? await self.navigator.locks.request(OUTBOX_LOCK, run) : await run();

  // Tell any open tab to refresh its pending badges, and what was refused.
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    for (const refused of result.rejected) client.postMessage({ type: "outbox:rejected", status: refused.status, tag: refused.tag });
    client.postMessage({ type: "outbox:drained" });
  }
  // Throwing aborts the sync event, and the browser retries the whole tag later with backoff — what is wanted while
  // the network or the server is still bad. Idempotency on the server makes the replay safe.
  if (result.retry) throw new Error(`outbox: ${result.kept} item(s) kept for a later attempt`);
}

self.addEventListener("sync", (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag.startsWith("outbox:")) {
    syncEvent.waitUntil(drainOutbox());
  }
});

/* -------------------------------------------------------------------------- */
/* Web Push                                                                    */
/* -------------------------------------------------------------------------- */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title: string; body: string; url: string; tag?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Shalaghar", body: event.data.text(), url: "/notifications" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/maskable-192.png",
      tag: payload.tag,
      data: { url: payload.url },
      // Children's devices are often on a desk during class; a vibrating,
      // silent-by-default notification is less disruptive than a sound.
      vibrate: [80, 40, 80],
    } as NotificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = appPath((event.notification.data as { url?: string } | undefined)?.url) ?? "/";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an existing window rather than piling up duplicates: one already on the notice's page if there is one.
      // Otherwise the window is told to go there (TA-222): the runtime (components/app-runtime.tsx) listens for this
      // message and routes to the path, which a window not controlled by this worker could not be made to do here.
      const picked = pickWindow(clients, url, self.location.origin);
      if (picked) {
        await picked.client.focus();
        if (!picked.onPage) picked.client.postMessage({ type: "navigate", url });
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = (event.data as { type?: string } | undefined)?.type;
  if (type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
  // The page saw the person change (sign-out, or someone else signing in):
  // what the last person read must not be the next person's offline page.
  // edulink-api is no longer written; deleting it clears what an earlier worker left.
  if (type === "CLEAR_PRIVATE") {
    event.waitUntil(Promise.all(["edulink-api", "edulink-pages"].map((name) => caches.delete(name))));
  }
});
