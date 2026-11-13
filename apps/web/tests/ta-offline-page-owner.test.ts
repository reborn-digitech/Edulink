/**
 * TA-215 — the precached offline page carries a frozen owner; shown to anyone
 * else it deletes that person's queued writes and their page cache (testing
 * analysis of 13 November 2026, found by reading).
 *
 * THE CHAIN, and which links run here:
 *
 *   1. The root layout (src/app/layout.tsx) mounts <AppRuntime owner={…}> on
 *      every page, /offline included, with the id of whoever the request was
 *      for. RUN HERE: the real layout is called for a signed-out GET /offline,
 *      the request a worker installing from the login page makes.
 *   2. The worker precaches /offline once per install (next.config.ts) and
 *      answers every navigation it cannot serve with that copy (src/sw.ts).
 *      ONLY READ HERE (the last case): next.config.ts disables the worker in
 *      development and a production build is not something a unit suite makes.
 *   3. That copy mounts in the browser of whoever is offline, and the
 *      runtime's first effect (src/components/app-runtime.tsx) tells the
 *      outbox the owner the copy was built with. RUN HERE: the element the
 *      layout made in step 1 is mounted, by this app's own react-dom in a real
 *      DOM, beside the offline page it was made for, in a browser that is
 *      offline and whose outbox holds a teacher's two unsent writes.
 *   4. The outbox (src/lib/offline-queue.ts) sees the owner "change", drops
 *      every row of the other owner and clears the page cache. RUN HERE, on
 *      the real module against an in-memory IndexedDB (fake-indexeddb, as
 *      tests/offline-queue.test.ts) and a CacheStorage that is a Map.
 *
 * What must hold, whichever way it is mended (a marker that makes the fallback
 * document leave the owner alone, or an owner taken only from a fresh answer
 * of the server): a document built for somebody else and served from the
 * precache deletes nothing of the person in front of it. The ⚠ cases fail
 * while the defect stands. The page the teacher reads meanwhile says
 * "offline.stillWorks": her register was not lost.
 *
 * The DOM is jsdom, borrowed from the phone app's jest because apps/web
 * declares no DOM library (tests/ta-date-field.test.ts says how and what the
 * proper set-up would be). Nothing here touches the database: nobody is
 * signed in, so the layout's session read stops at the empty cookie jar.
 */
import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));

type DomWindow = Window & typeof globalThis;
type Jsdom = { JSDOM: new (html: string, options?: { url?: string; pretendToBeVisual?: boolean }) => { window: DomWindow } };

function loadJsdom(): Jsdom {
  try {
    const mobile = createRequire(resolve(HERE, "../../mobile/package.json"));
    const jestExpo = createRequire(mobile.resolve("jest-expo/package.json"));
    const environment = createRequire(jestExpo.resolve("jest-environment-jsdom/package.json"));
    return environment("jsdom") as Jsdom;
  } catch (error) {
    throw new Error(
      `TA-215 needs a DOM and found none: jsdom is not reachable through apps/mobile's jest (${error instanceof Error ? error.message.split("\n")[0] : String(error)}). ` +
        "Add jsdom to apps/web's devDependencies and run this file with // @vitest-environment jsdom.",
    );
  }
}

/** The teacher in front of the device. Never looked up anywhere: the outbox only ever compares the id. */
const TEACHER = "zz-ta215-teacher-user-id";
const PAGE_CACHE = "edulink-pages";

type Row = { id: string; url: string; tag: string; owner: string | null; createdAt: number };
type Made = { type: unknown; props: Record<string, unknown> & { children?: unknown } };
type Root = { render(node: unknown): void; unmount(): void };

const isElement = (node: unknown): node is Made => typeof node === "object" && node !== null && "type" in node && "props" in node;

/** The element whose direct children include the one `wanted` names: the piece of the layout the runtime sits in, page beside it. */
function parentOf(node: unknown, wanted: (element: Made) => boolean): Made | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = parentOf(child, wanted);
      if (found) return found;
    }
    return null;
  }
  if (!isElement(node)) return null;
  const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
  if (children.some((child) => isElement(child) && wanted(child))) return node;
  return parentOf(node.props.children, wanted);
}

/** The outbox as it lies in the browser's database, oldest first, read without the app's own module (which shows only the current owner's rows). */
function outboxRows(): Promise<Row[]> {
  return new Promise((done, fail) => {
    const open = indexedDB.open("edulink", 2);
    open.onerror = () => fail(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const all = database.transaction("outbox", "readonly").objectStore("outbox").getAll();
      all.onerror = () => fail(all.error);
      all.onsuccess = () => {
        database.close();
        done((all.result as Row[]).sort((a, b) => a.createdAt - b.createdAt));
      };
    };
  });
}

function storedOwner(): Promise<unknown> {
  return new Promise((done, fail) => {
    const open = indexedDB.open("edulink", 2);
    open.onerror = () => fail(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const read = database.transaction("meta", "readonly").objectStore("meta").get("owner");
      read.onerror = () => fail(read.error);
      read.onsuccess = () => {
        database.close();
        done(read.result);
      };
    };
  });
}

let dom: { window: DomWindow };
let React: typeof import("react");
let createRoot: (container: Element) => Root;

/** The device: online on the teacher's own pages, offline from the moment her writes are queued; one worker in control throughout. */
const worker = { postMessage: vi.fn() };
const device = {
  onLine: true,
  userAgent: "vitest (TA-215)",
  serviceWorker: {
    controller: worker,
    register: async () => ({ addEventListener: () => undefined }),
    getRegistration: async () => undefined,
  },
};
/** CacheStorage as a Map: `delete` is all the app calls on it. */
const cached = new Map<string, Map<string, string>>();
const cacheStorage = {
  open: async (name: string) => {
    if (!cached.has(name)) cached.set(name, new Map());
    const store = cached.get(name)!;
    return { put: async (url: string, body: string) => void store.set(url, body) };
  },
  has: async (name: string) => cached.has(name),
  delete: async (name: string) => cached.delete(name),
  keys: async () => [...cached.keys()],
};
const network = vi.fn<(input: unknown) => Promise<Response>>(async () => {
  throw new TypeError("Failed to fetch");
});

/** Effects, then the IndexedDB work they start (several small transactions): a fixed wait, since "nothing was deleted" has no event to wait for. */
async function settle(ms = 400): Promise<void> {
  await React.act(async () => {
    await new Promise((done) => setTimeout(done, ms));
  });
}

async function mount(node: unknown): Promise<{ root: Root; host: HTMLElement }> {
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  await React.act(async () => root.render(node));
  return { root, host };
}

type Standing = { rows: Row[]; owner: unknown; pageCache: boolean; workerTold: unknown[]; offlinePageDrawn: boolean };

/**
 * The document the server builds for a signed-out GET /offline — the request a worker installing from the login page
 * makes — as a fresh page load meets it: the real root layout around the real offline page, and in it the piece the
 * browser brings to life (the runtime with the props the server gave it, the page beside it).
 */
async function fallbackDocument(): Promise<{ shell: Made | null; runtime: Made | null; offlinePage: unknown }> {
  // Nothing of the last page's script survives a navigation: the outbox module starts again, not knowing whose it is.
  vi.resetModules();
  const requestOf = await import("./stubs/next-headers");
  // No session cookie; the route as the middleware stamps it.
  requestOf.__resetCookies();
  requestOf.__setHeaders({ "x-edulink-route": "GET /offline" });
  const { default: RootLayout } = await import("@/app/layout");
  const { default: OfflinePage } = await import("@/app/offline/page");
  const { AppRuntime } = await import("@/components/app-runtime");
  const offlinePage = await OfflinePage();
  const built = await RootLayout({ children: offlinePage });
  requestOf.__setHeaders({});
  const shell = parentOf(built, (element) => element.type === AppRuntime);
  const beside = shell ? (Array.isArray(shell.props.children) ? shell.props.children : [shell.props.children]) : [];
  const runtime = beside.find((child): child is Made => isElement(child) && child.type === AppRuntime) ?? null;
  return { shell, runtime, offlinePage };
}

/** The device shows `node`, its effects and their IndexedDB work run, and what stands afterwards is read. */
async function shown(node: unknown): Promise<Standing> {
  worker.postMessage.mockClear();
  const page = await mount(node);
  await settle();
  const standing = {
    rows: await outboxRows(),
    owner: await storedOwner(),
    pageCache: await cacheStorage.has(PAGE_CACHE),
    workerTold: worker.postMessage.mock.calls.map((call) => call[0] as unknown),
    offlinePageDrawn: page.host.querySelector("main#main h1") !== null,
  };
  await React.act(async () => page.root.unmount());
  page.host.remove();
  return standing;
}

/** What stood before any fallback was shown; after one built for HER (the control); after the one built for nobody. */
let before: Pick<Standing, "rows" | "owner" | "pageCache">;
let builtForHer: Standing;
let builtForNobody: Standing;
let frozenProps: Record<string, unknown> | null = null;

beforeAll(async () => {
  // The address she asked for and the worker could not serve: the fallback is shown under it.
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/teacher/timetable", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "HTMLIFrameElement", "Element", "Node", "Event", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("navigator", device);
  vi.stubGlobal("caches", cacheStorage);
  vi.stubGlobal("fetch", network);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  // The suite's esbuild compiles JSX to React.createElement, and the app's files import hooks by name only.
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as typeof createRoot;

  /* ---- the teacher's own pages, with signal: the outbox is told whose device it is, then two writes wait ---- */
  {
    const outbox = await import("@/lib/offline-queue");
    // What the runtime does on every page of hers (app-runtime.tsx, with the id the layout read from her session).
    await outbox.setOutboxOwner(TEACHER);
    // The signal goes; the register and a marks sheet are saved and wait in the outbox, as the pages queue them.
    device.onLine = false;
    await outbox.enqueue({ url: "/api/attendance", method: "POST", body: JSON.stringify({ classId: "zz-ta215-class", marks: 2 }), tag: "attendance:zz-ta215-class" });
    await outbox.enqueue({ url: "/api/v1/marks", method: "POST", body: JSON.stringify({ classId: "zz-ta215-class", entries: 2 }), tag: "marks:zz-ta215-class" });
    // And the worker has kept the pages she opened.
    await (await cacheStorage.open(PAGE_CACHE)).put("/teacher/attendance", "<html>the register, as she last saw it</html>");
    before = { rows: await outboxRows(), owner: await storedOwner(), pageCache: await cacheStorage.has(PAGE_CACHE) };
  }

  /* ---- the control: she opens a page the worker never cached, and the copy of /offline it kept was built for HER ---- */
  {
    const { shell, runtime, offlinePage } = await fallbackDocument();
    // The same document with her id where the server wrote the install request's: what an install made while she was signed in keeps.
    const hers =
      shell && runtime
        ? React.cloneElement(shell as never, undefined, ...(shell.props.children as unknown[]).map((child) => (child === runtime ? React.cloneElement(runtime as never, { owner: TEACHER } as never) : child) as never))
        : offlinePage;
    builtForHer = await shown(hers);
  }

  /* ---- the finding: the same, and the copy was built while nobody was signed in (an install from the login page) ---- */
  {
    const { shell, runtime, offlinePage } = await fallbackDocument();
    frozenProps = runtime ? { ...runtime.props } : null;
    builtForNobody = await shown(shell ?? offlinePage);
  }
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

describe("TA-215: the offline fallback document and the outbox of the person in front of it", () => {
  const hers = [
    ["/api/attendance", TEACHER],
    ["/api/v1/marks", TEACHER],
  ];

  it("before: the teacher's two writes wait under her id, the outbox knows whose it is, and her pages are cached", () => {
    expect(before.rows.map((row) => [row.url, row.owner])).toEqual(hers);
    expect(before.owner).toBe(TEACHER);
    expect(before.pageCache).toBe(true);
  });

  it("control — a copy of /offline built for HER is shown: the page is drawn and nothing of hers is touched", () => {
    expect(builtForHer.offlinePageDrawn).toBe(true);
    expect(builtForHer.rows.map((row) => [row.url, row.owner])).toEqual(hers);
    expect(builtForHer.pageCache).toBe(true);
    expect(builtForHer.workerTold).not.toContainEqual({ type: "CLEAR_PRIVATE" });
  });

  it("the copy built for nobody really came up: the offline page is drawn, and no row went to the network", () => {
    expect(builtForNobody.offlinePageDrawn).toBe(true);
    // A row that is gone below was deleted, not delivered: neither of the two queued requests was made.
    expect(network.mock.calls.map(([input]) => String(input)).filter((url) => url === "/api/attendance" || url === "/api/v1/marks")).toEqual([]);
  });

  it("⚠ her queued writes are still in the outbox after the copy built for nobody is shown", () => {
    expect(
      builtForNobody.rows.map((row) => [row.url, row.owner]),
      `the document the layout built for a signed-out /offline mounted the runtime with ${JSON.stringify(frozenProps)} and the outbox dropped her rows`,
    ).toEqual(hers);
  });

  it("⚠ the pages the worker kept for her are still cached", () => {
    expect(builtForNobody.pageCache, "edulink-pages was deleted by the fallback document").toBe(true);
  });

  it("⚠ the worker is not told to clear her private caches", () => {
    expect(builtForNobody.workerTold).not.toContainEqual({ type: "CLEAR_PRIVATE" });
  });

  it("read, not run: the worker precaches /offline at install and answers a navigation it cannot serve with that copy", () => {
    const nextConfig = readFileSync(resolve(HERE, "../next.config.ts"), "utf8");
    const serviceWorker = readFileSync(resolve(HERE, "../src/sw.ts"), "utf8");
    // Stored once per install, whoever is (or is not) signed in at that moment.
    expect(nextConfig).toMatch(/additionalPrecacheEntries:\s*\[\{\s*url:\s*"\/offline"/);
    // Shown for any navigation the worker cannot answer, whoever is in front of the device then.
    expect(serviceWorker).toMatch(/fallbacks:\s*\{\s*entries:\s*\[\{\s*url:\s*"\/offline",\s*matcher:\s*\(\{\s*request\s*\}\)\s*=>\s*request\.mode === "navigate"/);
    // Why this file cannot run the worker: it does not exist on a development server.
    expect(nextConfig).toMatch(/disable:\s*process\.env\.NODE_ENV === "development"/);
  });
});
