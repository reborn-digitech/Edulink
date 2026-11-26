/**
 * Record payment on the school's card (src/app/root/[schoolId]/terms-controls.tsx) is pinned to the standing it was opened
 * on: its preview and its save send the status and the renewal as they stood when the sheet was opened, and nothing moves
 * them, not a redraw of the card, not a refusal of the save (its commit's or its early send's), not a lost answer, after each
 * of which the sheet opens again with what was typed and on the same standing. Only closing the sheet, or opening it afresh,
 * lets it go. So where a payment did land, whatever its answer said, or where the same payment was recorded elsewhere, the
 * redrawn card cannot hand the sheet the moved renewal: its preview is refused as already recorded, its Save waits, and while
 * its last answer was stale it says so in a line of its own. A second year is never recorded by a second press. An Undo that
 * came after the payment had gone takes nothing back, and the card waits for the payment's answer. That the library refuses
 * the same payment twice is held by tests/api-v1-operator-subscriptions.test.ts; that the action reads the school's day before
 * it writes, by tests/subscription-actions.test.ts.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT in a real DOM, as tests/ta-auth-code-box.test.ts draws its form: jsdom borrowed from
 * the phone app's jest, this app's own react-dom. The two action modules the card imports, the router and the toast are
 * stood in for; the held writes (usePendingWrites) are the real ones, their early send reaching a stubbed fetch. No
 * dictionary is provided: the card's sentences read as their keys. No negative here rests on a fixed pause: each waits for a
 * preview asked after the point it judges, and for its answer.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { paymentAction, termsAction, refresh, toast, dismiss } = vi.hoisted(() => ({ paymentAction: vi.fn(), termsAction: vi.fn(), refresh: vi.fn(), toast: vi.fn(), dismiss: vi.fn() }));
vi.mock("@/app/root/subscriptions/actions", () => ({ paymentAction, termsAction, premiumSwitchAction: vi.fn(), bulkAction: vi.fn(), offerAction: vi.fn() }));
vi.mock("@/app/root/colleges/actions", () => ({ setSchoolModuleAction: vi.fn() }));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast, dismiss }) }));

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
type Props = import("@/app/root/[schoolId]/terms-controls").TermsControlsProps;
type Standing = { fromStatus: string | null; fromDueAt: string | null };
type Body = Standing & { ref: string | null; preview?: boolean };
type Refusal = { ok: false; error: string; stale?: boolean };

/** The early send's door: a stubbed fetch answering with the status the case sets. */
const early = { status: 200 };
const doorFetch = vi.fn<(url: string, init?: { body?: string }) => Promise<Response>>(async () => new Response(null, { status: early.status }));

let dom: { window: DomWindow };
let React: ReactModule;
let createRoot: (container: Element) => Root;
let TermsControls: (typeof import("@/app/root/[schoolId]/terms-controls"))["TermsControls"];
const mounted: { root: Root; host: HTMLElement }[] = [];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/root/s1", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Element", "Node", "Event", "KeyboardEvent", "FocusEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("self", win);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", doorFetch);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  TermsControls = (await import("@/app/root/[schoolId]/terms-controls")).TermsControls;
});

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await React.act(async () => root.unmount());
    host.remove();
  }
  for (const stand of [paymentAction, termsAction, refresh, toast, dismiss]) stand.mockReset();
  doorFetch.mockClear();
  early.status = 200;
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

/** ZZ Premium School as its card reads it: terms not set, both switches on, paid up with a renewal on 10 January 2027. */
const SENT = { fromStatus: "ACTIVE", fromDueAt: "2027-01-10" } as const;
/** The renewal a year on, as a payment that landed moves it. */
const NEXT = "2028-01-10";
const MOVED = { fromStatus: "ACTIVE", fromDueAt: NEXT } as const;
const ALREADY: Refusal = { ok: false, error: "ZZ already recorded", stale: true };
/** What a case's card opens on: the standing (SENT unless named), whether the page opens Record payment itself, and the Teachers switch. */
type Opened = { payment?: Standing; initialSheet?: Props["initialSheet"]; teachers?: boolean };
const props = (payment: Standing, opened: Opened = {}): Props => ({
  schoolId: "s1",
  school: "ZZ Premium School",
  college: false,
  expect: { termsSetAt: null, premiumStudents: true, premiumTeachers: opened.teachers ?? true, subscription: { mode: "OURS" }, premium: { mode: "OURS" }, note: null },
  ours: { subscriptionPaise: 10_000, subscriptionDiscountBps: 0, premiumPaise: 5_000, premiumDiscountBps: 0 },
  premiumLines: [],
  payment: { ...payment, today: "2026-11-26", billPaise: 412_000 },
  viduraOff: false,
  initialSheet: opened.initialSheet ?? null,
});

async function mount(opened: Opened = {}): Promise<{ host: HTMLElement; redraw: (payment: Standing) => Promise<void> }> {
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  await React.act(async () => root.render(React.createElement(TermsControls, props(opened.payment ?? SENT, opened))));
  return { host, redraw: async (payment) => React.act(async () => root.render(React.createElement(TermsControls, props(payment, opened)))) };
}

const button = (scope: ParentNode, text: string) => [...scope.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes(text)) ?? null;
const sheet = (host: HTMLElement) => host.querySelector<HTMLElement>('[data-testid="payment-sheet"]');
const recordPayment = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('[data-testid="record-payment"]')!;
const saveOf = (host: HTMLElement) => button(sheet(host)!, "subs.recordPayment")!;
const cancelOf = (host: HTMLElement) => button(sheet(host)!, "common.cancel")!;
const teachersSwitch = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('[data-testid="card-premium-teachers"]')!;
const previews = () => paymentAction.mock.calls.map((c) => c[1] as Body).filter((b) => b.preview);
const saves = () => paymentAction.mock.calls.map((c) => c[1] as Body).filter((b) => !b.preview);
/** The payment sheet's alert: the server's sentence, and the line under it that says the sheet is pinned (null where none). */
function alertOf(host: HTMLElement): { sentence: string; pinned: string | null } | null {
  const alert = sheet(host)?.querySelector('[role="alert"]');
  if (!alert) return null;
  return { sentence: alert.firstChild?.textContent ?? "", pinned: alert.querySelector('[data-testid="payment-pinned"]')?.textContent ?? null };
}

async function click(target: HTMLElement): Promise<void> {
  await React.act(async () => {
    target.click();
  });
}

async function type(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await React.act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

function field(scope: HTMLElement, key: string): HTMLInputElement {
  const label = [...scope.querySelectorAll("label")].find((l) => (l.textContent ?? "").startsWith(key));
  if (!label) throw new Error(`no field labelled ${key}`);
  return dom.window.document.getElementById(label.htmlFor) as HTMLInputElement;
}

/** The last call to the payment stand-in answered, and what its answer moved drawn. */
async function answered(): Promise<void> {
  const last = paymentAction.mock.results.at(-1);
  await React.act(async () => {
    await Promise.resolve(last?.value).catch(() => undefined);
  });
}

/**
 * The positive point after a redraw: a new reference typed, the preview it asks for awaited and its answer drawn. A sheet
 * that followed the redraw would ask it with the redrawn standing.
 */
async function nextPreview(host: HTMLElement, ref: string): Promise<Body> {
  const before = previews().length;
  await type(field(sheet(host)!, "subs.reference"), ref);
  await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
  await answered();
  const asked = previews().at(-1)!;
  expect(asked.ref).toBe(ref);
  return asked;
}

/** The page hidden: every write still held goes to its door, the stubbed fetch answering `status`. */
async function hidePage(status: number): Promise<void> {
  early.status = status;
  const document = dom.window.document;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  try {
    await React.act(async () => {
      document.dispatchEvent(new dom.window.Event("visibilitychange"));
    });
  } finally {
    delete (document as unknown as Record<string, unknown>).visibilityState;
  }
  await vi.waitFor(() => expect(doorFetch).toHaveBeenCalled());
  await React.act(async () => {
    await doorFetch.mock.results.at(-1)?.value;
  });
}

/**
 * The payment door as the server answers it, set before anything is pressed, so no case rests on the preview's timer. A
 * preview is taken only against the status and the renewal as they stand on the server (`status`, `dueAt`, from `opened`);
 * else it is refused as already recorded, the house's stale refusal, so a sheet that moved to the redrawn standing would be
 * armed. The first save is answered as `first`
 * says: its answer lost while its write goes on ("lost": it lands when the case calls land(); "lost-landed": as its answer is
 * lost); refused though it landed (the renewal moved a year on, then common.tryAgainMoment's sentence); refused as recorded
 * elsewhere (the renewal moved before the commit, then the stale refusal); refused with nothing landed; held until the case
 * releases it, then taken; or taken. Every later save is taken only against the status and the renewal as they stand. Wherever
 * a payment lands, the first save's or by land(), the server moves as a payment moves it: Active, the renewal a year on.
 */
function door(first: "lost" | "lost-landed" | "refused-landed" | "recorded-elsewhere" | "refused" | "held" | "taken", opened: Standing = SENT) {
  const server = {
    status: opened.fromStatus as string | null,
    dueAt: opened.fromDueAt as string,
    saves: 0,
    lost: false,
    /** After the first save's answer is lost, every preview answers this instead (one that gets no sentence). */
    afterLoss: null as Refusal | null,
    /** The next preview answers this, once. */
    previewOnce: null as Refusal | null,
    /** Lets a held first save go on. */
    release: null as (() => void) | null,
  };
  /** A payment landing on the server: Active, the renewal a year on. */
  const landed = () => {
    server.status = "ACTIVE";
    server.dueAt = NEXT;
  };
  paymentAction.mockImplementation(async (_id: string, body: Body) => {
    if (body.preview) {
      if (server.previewOnce) {
        const once = server.previewOnce;
        server.previewOnce = null;
        return once;
      }
      if (server.lost && server.afterLoss) return server.afterLoss;
      return body.fromStatus === server.status && body.fromDueAt === server.dueAt ? { ok: true, changed: false, sentence: `ZZ the renewal moves a year on from ${body.fromDueAt}.`, bill: 412_000 } : ALREADY;
    }
    server.saves += 1;
    if (server.saves === 1) {
      if (first === "lost" || first === "lost-landed") {
        server.lost = true;
        if (first === "lost-landed") landed();
        throw new TypeError("Failed to fetch");
      }
      if (first === "refused-landed") {
        landed();
        return { ok: false, error: "common.tryAgainMoment" };
      }
      if (first === "recorded-elsewhere") {
        landed();
        return ALREADY;
      }
      if (first === "refused") return { ok: false, error: "ZZ refused" };
      if (first === "held") await new Promise<void>((resolve) => (server.release = resolve));
    }
    if (body.fromStatus !== server.status || body.fromDueAt !== server.dueAt) return ALREADY;
    server.status = "ACTIVE";
    server.dueAt = body.fromDueAt === SENT.fromDueAt ? NEXT : "2029-01-10";
    return { ok: true, changed: true, sentence: "ZZ recorded" };
  });
  return {
    server,
    /** The lost payment's write lands: the school is Active and its renewal a year on. */
    land: landed,
  };
}

/** The toast still holding a write: its commit run as the toast's going runs it. */
async function commitHeld(): Promise<void> {
  const held = toast.mock.calls.map((c) => c[0] as { onCommit?: () => void }).filter((options) => options.onCommit).at(-1);
  expect(held).toBeTruthy();
  await React.act(async () => {
    held!.onCommit!();
  });
}

/** Record payment pressed on a fresh card, a reference typed, the preview's sentence read and Save pressed: held behind its toast. */
async function payAndHold(host: HTMLElement, ref: string): Promise<void> {
  await click(recordPayment(host));
  await type(field(sheet(host)!, "subs.reference"), ref);
  await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
  await click(saveOf(host));
  expect(sheet(host)).toBeNull();
  // While the payment is held behind its toast, the card's switches and Record payment wait.
  expect(teachersSwitch(host).disabled).toBe(true);
  expect(recordPayment(host).disabled).toBe(true);
}

/** payAndHold, then the toast's commit and the first save's answer drawn: the count of previews asked before the commit. */
async function payAndCommit(host: HTMLElement, ref: string): Promise<number> {
  await payAndHold(host, ref);
  const atCommit = previews().length;
  await commitHeld();
  await vi.waitFor(() => expect(saves()).toHaveLength(1));
  await answered();
  return atCommit;
}

/** Every preview asked since `from`: there is one at least, and each carries the standing the sheet was opened on. */
function allPinned(from: number): void {
  const since = previews().slice(from);
  expect(since.length).toBeGreaterThan(0);
  for (const body of since) expect(body).toMatchObject(SENT);
}

describe("Record payment is pinned to the standing it was opened on", () => {
  it("(a) a fresh sheet whose save is refused though it landed, the card then drawn again with the moved renewal: every preview since the commit carries the standing the sheet was opened on, and Save waits once the reopened sheet's preview is answered", { timeout: 60_000 }, async () => {
    door("refused-landed");
    const { host, redraw } = await mount();
    const atCommit = await payAndCommit(host, "ZZ UTR 1");
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    expect(field(sheet(host)!, "subs.reference").value).toBe("ZZ UTR 1");
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 1a");
    allPinned(atCommit);
    expect(saveOf(host).disabled).toBe(true);
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    expect(saves()).toHaveLength(1);
  });

  it("(b) a fresh sheet whose save is refused as recorded elsewhere, the card then drawn again with the moved renewal: the same", { timeout: 60_000 }, async () => {
    door("recorded-elsewhere");
    const { host, redraw } = await mount();
    const atCommit = await payAndCommit(host, "ZZ UTR 1");
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    expect(field(sheet(host)!, "subs.reference").value).toBe("ZZ UTR 1");
    // The commit's own refusal, stale, is said on the reopened sheet with the line under it.
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 1a");
    allPinned(atCommit);
    expect(saveOf(host).disabled).toBe(true);
    expect(saves()).toHaveLength(1);
  });

  it("(c) a fresh sheet simply open while the same payment is recorded elsewhere, the card then drawn again: no preview carries the redrawn standing, and Save waits", { timeout: 60_000 }, async () => {
    const { server } = door("taken");
    const { host, redraw } = await mount();
    await click(recordPayment(host));
    await type(field(sheet(host)!, "subs.reference"), "ZZ UTR 1");
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    server.dueAt = NEXT;
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 2");
    allPinned(0);
    expect(saveOf(host).disabled).toBe(true);
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    expect(saves()).toHaveLength(0);
  });

  it("(d) the pin goes when the sheet is closed: after (a), Cancel and Record payment open it on the standing as now drawn, and Save is enabled once its preview passes", { timeout: 60_000 }, async () => {
    door("refused-landed");
    const { host, redraw } = await mount();
    await payAndCommit(host, "ZZ UTR 1");
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await redraw(MOVED);
    await click(cancelOf(host));
    expect(sheet(host)).toBeNull();
    const before = previews().length;
    await click(recordPayment(host));
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
    await answered();
    expect(previews().at(-1)).toMatchObject(MOVED);
    expect(saveOf(host).disabled).toBe(false);
    expect(alertOf(host)).toBeNull();
  });

  it("(e) while the sheet's last answer was stale it says so in a line of its own under the server's sentence; a preview that passes takes it away, and a sheet opened afresh shows no such line for an answer that is not stale", { timeout: 60_000 }, async () => {
    const { server } = door("recorded-elsewhere");
    const { host, redraw } = await mount();
    const atCommit = await payAndCommit(host, "ZZ UTR 1");
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await redraw(MOVED);
    // The reopened sheet's own preview, refused as already recorded: the server's sentence, and the line under it.
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(atCommit), { timeout: 3_000 });
    await answered();
    expect(previews().at(-1)).toMatchObject(SENT);
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    // The standing it holds stands on the server again, and the card is drawn so: its next preview passes and the line goes.
    server.dueAt = SENT.fromDueAt;
    await redraw(SENT);
    await nextPreview(host, "ZZ UTR 2");
    expect(alertOf(host)).toBeNull();
    expect(saveOf(host).disabled).toBe(false);
    // Closed and opened afresh: nothing is shown, and a refusal that is not stale is shown with no line.
    await click(cancelOf(host));
    server.previewOnce = { ok: false, error: "common.tryAgainMoment" };
    const before = previews().length;
    await click(recordPayment(host));
    expect(alertOf(host)).toBeNull();
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
    await answered();
    expect(alertOf(host)).toEqual({ sentence: "common.tryAgainMoment", pinned: null });
  });

  it("(f) an early send answered 4xx from a sheet that had opened again, the lost payment having landed meanwhile: the sheet opens again with what was typed, on the same standing, and Save waits", { timeout: 60_000 }, async () => {
    const { server } = door("lost");
    const { host, redraw } = await mount();
    await payAndCommit(host, "ZZ UTR 1");
    // Its answer lost and nothing landed: the sheet opens again on the standing it was opened on, and its preview passes.
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    await click(saveOf(host));
    expect(sheet(host)).toBeNull();
    // The lost payment lands while the second is held: the door's 4xx stands for "already recorded".
    server.dueAt = NEXT;
    await hidePage(422);
    expect(JSON.parse(String(doorFetch.mock.calls[0]![1]!.body))).toMatchObject({ ...SENT, ref: "ZZ UTR 1", preview: false });
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: "danger", description: "subs.earlyNotSaved" }));
    expect(field(sheet(host)!, "subs.reference").value).toBe("ZZ UTR 1");
    const atReopen = previews().length;
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 2");
    allPinned(atReopen);
    expect(saveOf(host).disabled).toBe(true);
    expect(saves()).toHaveLength(1);
  });

  it("(f) a save that was taken by its commit leaves the next fresh opening on the standing as then drawn", { timeout: 60_000 }, async () => {
    door("taken");
    const { host, redraw } = await mount();
    await payAndCommit(host, "ZZ UTR 1");
    expect(refresh).toHaveBeenCalled();
    expect(sheet(host)).toBeNull();
    await redraw(MOVED);
    const before = previews().length;
    await click(recordPayment(host));
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
    await answered();
    expect(previews().at(-1)).toMatchObject(MOVED);
    expect(saveOf(host).disabled).toBe(false);
  });

  it("(f) a save that was taken by its early send leaves the next fresh opening on the standing as then drawn", { timeout: 60_000 }, async () => {
    const { server } = door("taken");
    const { host, redraw } = await mount();
    await payAndHold(host, "ZZ UTR 1");
    await hidePage(200);
    expect(JSON.parse(String(doorFetch.mock.calls[0]![1]!.body))).toMatchObject({ ...SENT, ref: "ZZ UTR 1", preview: false });
    // The door wrote it; the card is drawn again from the server.
    server.dueAt = NEXT;
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(sheet(host)).toBeNull();
    await redraw(MOVED);
    const before = previews().length;
    await click(recordPayment(host));
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
    await answered();
    expect(previews().at(-1)).toMatchObject(MOVED);
    expect(saveOf(host).disabled).toBe(false);
    expect(saves()).toHaveLength(0);
  });

  it("(c) with the status alone moved: a fresh sheet opened on Trial, the school then set Active by hand and the card drawn again, keeps Trial in every preview, and Save waits", { timeout: 60_000 }, async () => {
    const TRIAL = { fromStatus: "TRIAL", fromDueAt: SENT.fromDueAt } as const;
    const { server } = door("taken", TRIAL);
    const { host, redraw } = await mount({ payment: TRIAL });
    await click(recordPayment(host));
    await type(field(sheet(host)!, "subs.reference"), "ZZ UTR 1");
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    server.status = "ACTIVE";
    await redraw({ fromStatus: "ACTIVE", fromDueAt: SENT.fromDueAt });
    await nextPreview(host, "ZZ UTR 2");
    expect(previews().length).toBeGreaterThan(1);
    for (const body of previews()) expect(body).toMatchObject(TRIAL);
    expect(saveOf(host).disabled).toBe(true);
    expect(saves()).toHaveLength(0);
  });

  it("the page opening Record payment itself pins it too: its first preview carries the standing as the page drew it, and after a redraw with the server moved every later preview stays on it and Save waits", { timeout: 60_000 }, async () => {
    const { server } = door("taken");
    const { host, redraw } = await mount({ initialSheet: "payment" });
    expect(sheet(host)).not.toBeNull();
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(0), { timeout: 3_000 });
    await answered();
    expect(previews()[0]).toMatchObject(SENT);
    expect(saveOf(host).disabled).toBe(false);
    server.dueAt = NEXT;
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 2");
    allPinned(0);
    expect(saveOf(host).disabled).toBe(true);
  });

  it("a preview refused as stale drops the sentence kept from an earlier one: the server moved, the reference changed and changed back, Save stays disabled", { timeout: 60_000 }, async () => {
    const { server } = door("taken");
    const { host } = await mount();
    await click(recordPayment(host));
    await type(field(sheet(host)!, "subs.reference"), "ZZ UTR 1");
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    // Recorded elsewhere meanwhile: the next preview is refused as stale.
    server.dueAt = NEXT;
    await nextPreview(host, "ZZ UTR 2");
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    // The reference back to the value the first sentence was worded for: no sentence stands, before its preview or after it.
    const before = previews().length;
    await type(field(sheet(host)!, "subs.reference"), "ZZ UTR 1");
    expect(saveOf(host).disabled).toBe(true);
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(before), { timeout: 3_000 });
    await answered();
    expect(saveOf(host).disabled).toBe(true);
    expect(saves()).toHaveLength(0);
  });

  it("a refusal on a switch's off sheet is never drawn with Record payment's line", { timeout: 60_000 }, async () => {
    const { server } = door("taken");
    termsAction.mockImplementation(async (_id: string, body: { preview?: boolean }) => (body.preview ? { ok: true, changed: true, sentence: "ZZ premium off for teachers" } : { ok: false, error: "ZZ off refused" }));
    const { host } = await mount();
    await click(recordPayment(host));
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    server.dueAt = NEXT;
    await nextPreview(host, "ZZ UTR 2");
    expect(alertOf(host)?.pinned).toBe("subs.paymentSheetPinned");
    // The Teachers switch pressed off while Record payment is open, its preview answered in that window: the off sheet
    // opens, and its Confirm is refused.
    await click(teachersSwitch(host));
    const offSheet = () => host.querySelector<HTMLElement>('[data-testid="card-premium-off-sheet"]');
    await vi.waitFor(() => expect(offSheet()).not.toBeNull());
    await click(button(offSheet()!, "common.confirm")!);
    await vi.waitFor(() => expect(offSheet()!.querySelector('[role="alert"]')?.textContent).toBe("ZZ off refused"));
    expect(alertOf(host)).toEqual({ sentence: "ZZ off refused", pinned: null });
  });

  it("an Undo pressed after a switch's commit had gone takes nothing back: the switch stays drawn on and disabled until its answer", { timeout: 60_000 }, async () => {
    let release: () => void = () => {};
    termsAction.mockImplementation(async (_id: string, body: { preview?: boolean }) =>
      body.preview ? { ok: true, changed: true, sentence: "ZZ premium on for teachers" } : new Promise((resolve) => (release = () => resolve({ ok: true, changed: true, sentence: "ZZ saved" }))),
    );
    const { host } = await mount({ teachers: false });
    expect(teachersSwitch(host).getAttribute("aria-checked")).toBe("false");
    await click(teachersSwitch(host));
    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "ZZ premium on for teachers" })));
    expect(teachersSwitch(host).getAttribute("aria-checked")).toBe("true");
    expect(teachersSwitch(host).disabled).toBe(true);
    await commitHeld();
    await vi.waitFor(() => expect(termsAction.mock.calls.filter((c) => !(c[1] as { preview?: boolean }).preview)).toHaveLength(1));
    const options = toast.mock.calls.map((c) => c[0] as { onUndo?: () => void }).filter((o) => o.onUndo).at(-1);
    await React.act(async () => options!.onUndo!());
    expect(teachersSwitch(host).getAttribute("aria-checked")).toBe("true");
    expect(teachersSwitch(host).disabled).toBe(true);
    await React.act(async () => release());
    await vi.waitFor(() => expect(teachersSwitch(host).disabled).toBe(false));
    expect(teachersSwitch(host).getAttribute("aria-checked")).toBe("true");
  });

  it("while a switch's preview is out, Record payment waits, so its sheet and the switch's off sheet are never open together; it is enabled again once the preview has answered and the off sheet is closed", { timeout: 60_000 }, async () => {
    let answer: () => void = () => {};
    termsAction.mockImplementation(async (_id: string, body: { preview?: boolean }) =>
      body.preview ? new Promise((resolve) => (answer = () => resolve({ ok: true, changed: true, sentence: "ZZ premium off for teachers" }))) : { ok: true, changed: true, sentence: "ZZ saved" },
    );
    const { host } = await mount();
    expect(recordPayment(host).disabled).toBe(false);
    // The Teachers switch pressed off: its preview is out.
    await click(teachersSwitch(host));
    expect(recordPayment(host).disabled).toBe(true);
    // The preview answers: the off sheet opens; closed with Cancel, Record payment is free again.
    await React.act(async () => answer());
    const offSheet = () => host.querySelector<HTMLElement>('[data-testid="card-premium-off-sheet"]');
    await vi.waitFor(() => expect(offSheet()).not.toBeNull());
    await click(button(offSheet()!, "common.cancel")!);
    expect(offSheet()).toBeNull();
    await vi.waitFor(() => expect(recordPayment(host).disabled).toBe(false));
  });

  it("an Undo pressed after the payment's commit had gone takes nothing back: Record payment and the switches wait until its answer", { timeout: 60_000 }, async () => {
    const { server } = door("held");
    const { host } = await mount();
    await payAndHold(host, "ZZ UTR 1");
    await commitHeld();
    await vi.waitFor(() => expect(saves()).toHaveLength(1));
    // The toast's Undo, pressed in the moment before the toast is drawn away.
    const options = toast.mock.calls.map((c) => c[0] as { onUndo?: () => void }).filter((o) => o.onUndo).at(-1);
    await React.act(async () => {
      options!.onUndo!();
    });
    expect(recordPayment(host).disabled).toBe(true);
    expect(teachersSwitch(host).disabled).toBe(true);
    // Its answer: taken.
    await React.act(async () => {
      server.release!();
    });
    await answered();
    await vi.waitFor(() => expect(recordPayment(host).disabled).toBe(false));
    expect(refresh).toHaveBeenCalled();
  });
});

describe("a payment whose commit gets no clear answer", () => {
  it("is said, and its sheet opens again with what was typed on the standing it was opened on; the redraw cannot move that standing, so Save stays disabled and no second payment is sent", { timeout: 60_000 }, async () => {
    // The write lands, and then its answer is lost.
    door("lost-landed");
    const { host, redraw } = await mount();
    const atCommit = await payAndCommit(host, "ZZ UTR 1");
    // Said in a pinned danger toast of its own, and the card drawn again from the server.
    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: "danger", title: "subs.noClearAnswer", duration: null })));
    expect(refresh).toHaveBeenCalled();
    // What the write held is let go: the switches no longer wait.
    expect(teachersSwitch(host).disabled).toBe(false);
    // The sheet is open again with the reference as typed.
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    expect(field(sheet(host)!, "subs.reference").value).toBe("ZZ UTR 1");
    // Before its preview answers, no sentence stands for the reopened sheet (the first preview's went when it closed).
    expect(saveOf(host).disabled).toBe(true);
    // Its own preview, on the standing it was opened on, is refused as already recorded.
    await vi.waitFor(() => expect(previews().length).toBeGreaterThan(atCommit), { timeout: 3_000 });
    await answered();
    expect(previews().at(-1)).toMatchObject({ ...SENT, ref: "ZZ UTR 1" });
    expect(alertOf(host)?.sentence).toBe("ZZ already recorded");
    expect(saveOf(host).disabled).toBe(true);
    // The card drawn again from the server, the payment having landed: paid, the renewal a year on.
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 1a");
    allPinned(atCommit);
    expect(saveOf(host).disabled).toBe(true);
    expect(saves()).toHaveLength(1);
  });

  it("the pin outlasts a preview answered with no sentence and the redraw, and the next preview after an edit still carries it", { timeout: 60_000 }, async () => {
    const { server } = door("lost-landed");
    server.afterLoss = { ok: false, error: "common.tryAgainMoment" };
    const { host, redraw } = await mount();
    const atCommit = await payAndCommit(host, "ZZ UTR 1");
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await vi.waitFor(() => expect(alertOf(host)?.sentence).toBe("common.tryAgainMoment"), { timeout: 3_000 });
    expect(alertOf(host)?.pinned).toBeNull();
    await redraw(MOVED);
    expect(await nextPreview(host, "ZZ UTR 2")).toMatchObject({ ...SENT, ref: "ZZ UTR 2" });
    allPinned(atCommit);
    expect(saves()).toHaveLength(1);
  });

  it("the reopened sheet's own Save, refused because the lost payment landed meanwhile, opens it again still on the standing it was opened on: Save waits, and no third save is sent", { timeout: 60_000 }, async () => {
    const { land } = door("lost");
    const { host, redraw } = await mount();
    await payAndCommit(host, "ZZ UTR 1");
    // The lost payment's write is still on its way: the reopened sheet's preview meets the server before it lands.
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await vi.waitFor(() => expect(saveOf(host).disabled).toBe(false), { timeout: 3_000 });
    expect(previews().at(-1)).toMatchObject(SENT);
    await click(saveOf(host));
    expect(saves()).toHaveLength(1);
    // Then it lands, and the reopened sheet's save, held behind its toast, is committed against a standing gone by.
    land();
    const atSecond = previews().length;
    await commitHeld();
    await vi.waitFor(() => expect(saves()).toHaveLength(2));
    await answered();
    expect(saves()[1]).toMatchObject(SENT);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: "danger", title: "root.didNotWork", description: "ZZ already recorded", duration: null }));
    // The sheet opens again; the card is drawn again from the server with the renewal the landed payment moved.
    await vi.waitFor(() => expect(sheet(host)).not.toBeNull());
    await redraw(MOVED);
    await nextPreview(host, "ZZ UTR 1a");
    expect(alertOf(host)).toEqual({ sentence: "ZZ already recorded", pinned: "subs.paymentSheetPinned" });
    // Every preview since the second commit is on the standing the sheet was opened on, refused as already recorded: Save waits.
    allPinned(atSecond);
    expect(saveOf(host).disabled).toBe(true);
    // The first payment, lost after it landed, and the reopened sheet's refused save: no third.
    expect(saves()).toHaveLength(2);
  });

  it("a sheet's save whose commit gets no clear answer is said, and its sheet opens again with what was typed; an Undo pressed after that commit had gone takes nothing back", { timeout: 60_000 }, async () => {
    let lose: () => void = () => {};
    termsAction.mockImplementation(async (_id: string, body: { preview?: boolean }) =>
      body.preview ? { ok: true, changed: true, sentence: "ZZ the terms are set at our prices." } : new Promise((_resolve, reject) => (lose = () => reject(new TypeError("Failed to fetch")))),
    );
    const { host } = await mount();
    const subscriptionSheet = () => host.querySelector<HTMLElement>('[data-testid="subscription-sheet"]');
    await click(host.querySelector<HTMLElement>('[data-testid="change-subscription"]')!);
    await type(field(subscriptionSheet()!, "subs.reason"), "ZZ agreed at the meeting");
    const save = () => button(subscriptionSheet()!, "common.save")!;
    await vi.waitFor(() => expect(save().disabled).toBe(false), { timeout: 3_000 });
    await click(save());
    expect(subscriptionSheet()).toBeNull();
    expect(teachersSwitch(host).disabled).toBe(true);
    const held = toast.mock.calls.map((c) => c[0] as { onCommit?: () => void; onUndo?: () => void }).find((options) => options.onCommit);
    await React.act(async () => {
      held!.onCommit!();
    });
    // The Undo, pressed after the commit had gone: it takes nothing back, and the switches still wait.
    await React.act(async () => {
      held!.onUndo!();
    });
    expect(teachersSwitch(host).disabled).toBe(true);
    // Then the commit's answer is lost.
    await React.act(async () => lose());
    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: "danger", title: "subs.noClearAnswer", duration: null })));
    expect(refresh).toHaveBeenCalled();
    expect(teachersSwitch(host).disabled).toBe(false);
    await vi.waitFor(() => expect(subscriptionSheet()).not.toBeNull());
    expect(field(subscriptionSheet()!, "subs.reason").value).toBe("ZZ agreed at the meeting");
    expect(termsAction.mock.calls.filter((c) => !(c[1] as { preview?: boolean }).preview)).toHaveLength(1);
  });
});
