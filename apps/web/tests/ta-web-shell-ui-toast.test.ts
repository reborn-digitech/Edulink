/**
 * The toast and the runtime that raises the shell's own toasts (testing analysis of 13 November 2026):
 *
 *   TA-235 — each toast was a role="status" card inserted already filled (often not read), and every toast went in five
 *            seconds with nothing to hold it, its Undo or Open receipt with it.
 *   TA-605 — the fifth toast pushed off the oldest, a pinned one (a rejected change, the register's Retry) included.
 *   TA-519 — the runtime ignored how many queued writes were dropped when somebody else signed in.
 *   TA-222 — nothing in the page listened for the worker's "navigate" message after a pressed notification.
 *   TA-218 — nothing in the page heard the worker's drain refuse a row.
 *
 * The real ToastProvider and the real AppRuntime, drawn by this app's react-dom in jsdom (tests/ta-web-shell-ui-dom.ts).
 * The outbox module is stood in for in the runtime's cases (what it answers is the point there), and so is the
 * browser's navigation, which jsdom does not do. No dictionary is loaded, so `t` answers with the key.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setUpDom, type Dom } from "./ta-web-shell-ui-dom";
import type { Toast } from "@/components/ui/toast";

const outbox = vi.hoisted(() => ({ answer: { changed: true, dropped: 0 } }));
vi.mock("@/lib/offline-queue", () => ({
  setOutboxOwner: vi.fn(async () => outbox.answer),
  flushQueue: vi.fn(async () => ({ sent: 0, failed: 0, remaining: 0 })),
  onQueueEvent: () => () => undefined,
}));
const opened = vi.hoisted(() => [] as string[]);
vi.mock("@/lib/sw-helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sw-helpers")>()),
  openAppPath: (path: string) => void opened.push(path),
}));

let dom: Dom;
let ToastProvider: (typeof import("@/components/ui/toast"))["ToastProvider"];
let useToast: (typeof import("@/components/ui/toast"))["useToast"];
let AppRuntime: (typeof import("@/components/app-runtime"))["AppRuntime"];
let api: { toast: (input: Omit<Toast, "id">) => string; dismiss: (id: string) => void };
let container: EventTarget & { controller: { postMessage: ReturnType<typeof vi.fn> }; register: () => Promise<{ addEventListener: () => void }>; startMessages: () => void };

beforeAll(async () => {
  const navigatorStandIn: Record<string, unknown> = { onLine: true, userAgent: "vitest (web-shell-ui)" };
  dom = await setUpDom("http://localhost:3000/teacher", { navigator: navigatorStandIn });
  container = Object.assign(new dom.window.EventTarget(), {
    controller: { postMessage: vi.fn() },
    register: async () => ({ addEventListener: () => undefined }),
    startMessages: () => undefined,
  });
  navigatorStandIn.serviceWorker = container;
  ({ ToastProvider, useToast } = await import("@/components/ui/toast"));
  ({ AppRuntime } = await import("@/components/app-runtime"));
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

function Probe() {
  const value = useToast();
  dom.React.useEffect(() => {
    api = value;
  });
  return null;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  opened.length = 0;
});

afterEach(async () => {
  await dom.unmountAll();
  vi.useRealTimers();
});

const doc = () => dom.window.document;
const cards = () => [...doc().querySelectorAll('[data-testid="toast"]')];
const pass = (ms: number) => dom.act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const mountProvider = () => dom.mount(dom.React.createElement(ToastProvider, null, dom.React.createElement(Probe)));
const raise = (input: Omit<Toast, "id">) => dom.act(() => void api.toast(input));

describe("TA-235: toasts are said, and wait for the person", () => {
  it("TA-235: the live regions stand before the first toast, and a toast's words are written into them", async () => {
    await mountProvider();
    const polite = doc().querySelector('[data-testid="toast-said-polite"]');
    const assertive = doc().querySelector('[data-testid="toast-said-assertive"]');
    expect(polite?.getAttribute("role")).toBe("status");
    expect(polite?.getAttribute("aria-live")).toBe("polite");
    expect(assertive?.getAttribute("role")).toBe("alert");
    expect(polite?.textContent).toBe("");
    await raise({ title: "Saved", description: "Register complete" });
    expect(polite?.textContent).toBe("Saved. Register complete");
    // The card itself is no longer a live region of its own, inserted already filled.
    expect(cards()[0]!.getAttribute("role")).toBeNull();
    await raise({ tone: "danger", title: "That did not save" });
    expect(assertive?.textContent).toBe("That did not save");
  });

  it("TA-235: a toast with an Undo stays ten seconds, not five", async () => {
    await mountProvider();
    await raise({ title: "3 marked present", onUndo: () => undefined });
    await pass(6000);
    expect(cards()).toHaveLength(1);
    await pass(4500);
    expect(cards()).toHaveLength(0);
  });

  it("TA-235: the pointer on the toast, or the focus in it, stops its clock", async () => {
    await mountProvider();
    await raise({ title: "Payment recorded", action: { label: "Open receipt", onClick: () => undefined } });
    await pass(1000);
    await dom.act(() => {
      cards()[0]!.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true, relatedTarget: doc().body }));
    });
    await pass(60_000);
    expect(cards(), "the toast went while the pointer was on it").toHaveLength(1);
    await dom.act(() => {
      cards()[0]!.dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: doc().body }));
    });
    // Focus on its button holds it again.
    await dom.act(() => cards()[0]!.querySelector("button")!.focus());
    await pass(60_000);
    expect(cards(), "the toast went while the focus was in it").toHaveLength(1);
    await dom.act(() => (doc().activeElement as HTMLElement).blur());
    await pass(10_500);
    expect(cards()).toHaveLength(0);
  });

  it("TA-235: the commit runs when the toast goes without Undo, and not when Undo is pressed", async () => {
    await mountProvider();
    const committed: string[] = [];
    await raise({ title: "A", onUndo: () => undefined, onCommit: () => void committed.push("A") });
    await raise({ title: "B", onUndo: () => undefined, onCommit: () => void committed.push("B") });
    const undo = [...doc().querySelectorAll("button")].filter((b) => b.textContent === "ui.undo");
    await dom.click(undo[1]);
    await pass(11_000);
    expect(committed).toEqual(["A"]);
  });
});

describe("TA-605: a pinned toast stays", () => {
  it("TA-605: four toasts after a pinned one leave it on the screen", async () => {
    await mountProvider();
    await raise({ tone: "danger", duration: null, title: "Change rejected" });
    for (const n of [1, 2, 3, 4]) await raise({ title: `Synced ${n}` });
    const titles = cards().map((c) => c.querySelector("p")?.textContent);
    expect(titles).toContain("Change rejected");
    expect(titles).toHaveLength(4);
  });
});

describe("the runtime's toasts and the worker's messages", () => {
  const mountRuntime = (owner: string | null) =>
    dom.mount(dom.React.createElement(ToastProvider, null, dom.React.createElement(AppRuntime, { owner })));

  it("TA-519: what was dropped when somebody else signed in is said, and the toast stays", async () => {
    outbox.answer = { changed: true, dropped: 2 };
    await mountRuntime("zz-ta519-b");
    await pass(10);
    expect(cards().map((c) => c.textContent).join(" ")).toContain("ui.outboxDroppedMany");
    await pass(60_000);
    expect(cards()).toHaveLength(1);
    outbox.answer = { changed: true, dropped: 0 };
  });

  it("TA-519: nothing is said when nothing was dropped", async () => {
    outbox.answer = { changed: true, dropped: 0 };
    await mountRuntime(null);
    await pass(10);
    expect(cards()).toHaveLength(0);
  });

  it("TA-222: the worker's navigate message opens the notice's page, and only a path of this app", async () => {
    await mountRuntime("zz-ta222");
    await dom.act(() => {
      container.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "navigate", url: "/parent/attendance" } }));
      container.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "navigate", url: "//evil.example/x" } }));
    });
    expect(opened).toEqual(["/parent/attendance"]);
  });

  it("TA-218: a row the worker's drain found refused raises the pinned rejected toast", async () => {
    await mountRuntime("zz-ta218");
    await dom.act(() => {
      container.dispatchEvent(new dom.window.MessageEvent("message", { data: { type: "outbox:rejected", status: 422, tag: "marks:c1" } }));
    });
    expect(cards().map((c) => c.textContent).join(" ")).toContain("ui.changeRejected");
    await pass(60_000);
    expect(cards()).toHaveLength(1);
  });
});
