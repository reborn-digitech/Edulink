/**
 * The web's corrections card, "Status and dates" (src/app/root/[schoolId]/subscription-panel.tsx): a save carries the
 * standing of the record the card was drawn from (the status, the start, the renewal and the paid day), so the server can
 * refuse a card drawn before a payment and saved after it. When the server refuses it as changed meanwhile, the card asks
 * the page to draw itself again, once, and says so in a pinned toast, since the page keys the card on the record and the
 * redraw starts it afresh; any other refusal is said on the card, as before, with no redraw.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT in a real DOM, as tests/ta-auth-code-box.test.ts draws its form: jsdom borrowed from
 * the phone app's jest, this app's own react-dom. The server action, the router and the toast are stood in for; no
 * dictionary is provided, so every sentence of the card's own reads as its key.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { setSubscriptionAction, refresh, toast } = vi.hoisted(() => ({ setSubscriptionAction: vi.fn(), refresh: vi.fn(), toast: vi.fn() }));
vi.mock("@/app/root/actions", () => ({ setSubscriptionAction, setContactAction: vi.fn() }));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast, dismiss: vi.fn() }) }));

type DomWindow = Window & typeof globalThis;
type Jsdom = { JSDOM: new (html: string, options?: { url?: string; pretendToBeVisual?: boolean }) => { window: DomWindow } };

function loadJsdom(): Jsdom {
  const here = dirname(fileURLToPath(import.meta.url));
  const mobile = createRequire(resolve(here, "../../mobile/package.json"));
  const jestExpo = createRequire(mobile.resolve("jest-expo/package.json"));
  const environment = createRequire(jestExpo.resolve("jest-environment-jsdom/package.json"));
  return environment("jsdom") as Jsdom;
}

type ReactModule = typeof import("react");
type Root = { render(node: unknown): void; unmount(): void };

let dom: { window: DomWindow };
let React: ReactModule;
let createRoot: (container: Element) => Root;
let SubscriptionPanel: (typeof import("@/app/root/[schoolId]/subscription-panel"))["SubscriptionPanel"];
const mounted: { root: Root; host: HTMLElement }[] = [];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/root/s1", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "Element", "Node", "Event", "FormData", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  // next/link reads `self` as a browser does.
  vi.stubGlobal("self", win);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  SubscriptionPanel = (await import("@/app/root/[schoolId]/subscription-panel")).SubscriptionPanel;
});

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await React.act(async () => root.unmount());
    host.remove();
  }
  setSubscriptionAction.mockReset();
  refresh.mockReset();
  toast.mockReset();
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

/** The record as the page read it: paid, renewing a year on. */
const RECORD = { status: "ACTIVE" as const, startsAt: "2026-06-01", dueAt: "2027-06-01", daysToDue: 187, invoicedAt: null, invoiceRef: null, paidAt: "2026-06-01", paidRef: "UTR-1" };

async function mount(): Promise<HTMLElement> {
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  await React.act(async () => root.render(React.createElement(SubscriptionPanel, { schoolId: "s1", subscription: RECORD, partnerId: null, partners: [] })));
  return host;
}

/** The input a label names: the label's own text starts with the field's key (no dictionary here). */
function field(host: HTMLElement, key: string): HTMLInputElement {
  const label = [...host.querySelectorAll("label")].find((l) => (l.textContent ?? "").startsWith(key));
  if (!label) throw new Error(`no field labelled ${key}`);
  return dom.window.document.getElementById(label.htmlFor) as HTMLInputElement;
}

/** What a browser does when a person types: the value changes underneath React, then input and change fire. */
async function type(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await React.act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

/** An invoice reference and a reason typed, then Save pressed (enabled: a field changed and a reason is given). */
async function saveAnInvoiceReference(host: HTMLElement): Promise<void> {
  await type(field(host, "root.subscriptionInvoiceRef"), "ZZ INV-7");
  await type(field(host, "root.subscriptionReason"), "ZZ the invoice went out");
  const save = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("root.subscriptionSave"))!;
  expect(save.disabled).toBe(false);
  await React.act(async () => {
    save.click();
  });
  await vi.waitFor(() => expect(setSubscriptionAction).toHaveBeenCalledTimes(1));
}

describe("the corrections card carries the standing it was drawn from", () => {
  it("a save sends what changed, the reason, and the standing of the record the card was drawn from", { timeout: 60_000 }, async () => {
    setSubscriptionAction.mockResolvedValue({ ok: true });
    const host = await mount();
    await saveAnInvoiceReference(host);
    expect(setSubscriptionAction).toHaveBeenCalledWith("s1", { reason: "ZZ the invoice went out", invoiceRef: "ZZ INV-7", expect: { status: "ACTIVE", startsAt: "2026-06-01", dueAt: "2027-06-01", paidAt: "2026-06-01" } });
  });

  it("refused as changed meanwhile: the page is drawn again, once, and the sentence is a pinned toast, which outlives the redraw", { timeout: 60_000 }, async () => {
    setSubscriptionAction.mockResolvedValue({ ok: false, error: "ZZ changed while this was open.", stale: true });
    const host = await mount();
    await saveAnInvoiceReference(host);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: "danger", description: "ZZ changed while this was open.", duration: null }));
  });

  it("any other refusal is said on the card, with no redraw and no toast (a guard: so it was before)", { timeout: 60_000 }, async () => {
    setSubscriptionAction.mockResolvedValue({ ok: false, error: "ZZ that status cannot follow the current one." });
    const host = await mount();
    await saveAnInvoiceReference(host);
    await vi.waitFor(() => expect(host.querySelector('[role="alert"]')?.textContent).toBe("ZZ that status cannot follow the current one."));
    expect(refresh).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
});
