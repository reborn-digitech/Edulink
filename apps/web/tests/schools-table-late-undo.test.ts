/**
 * The Schools tab (src/app/root/subscriptions/schools-table.tsx) holds a row's premium switch, and a bulk "on" over the
 * chosen schools, behind a toast with Undo, and the school's own controls wait while the write is held: its switches, and
 * the bar while it is chosen. An Undo pressed after the write had gone (its commit run in the moment before the toast is
 * drawn away) takes nothing back, since undo() answers false then (pending-writes.ts): the switch stays drawn as set and
 * the school's controls wait until the write's answer, as on the school's card (tests/terms-controls-held-payment.test.ts).
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT in a real DOM: jsdom borrowed from the phone app's jest, this app's own react-dom.
 * The action module, the router, the toast and next/link are stood in for; the held writes are the real ones. No
 * dictionary is provided: the table's words read as their keys.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { premiumSwitchAction, bulkAction, refresh, toast, dismiss } = vi.hoisted(() => ({ premiumSwitchAction: vi.fn(), bulkAction: vi.fn(), refresh: vi.fn(), toast: vi.fn(), dismiss: vi.fn() }));
vi.mock("@/app/root/subscriptions/actions", () => ({ premiumSwitchAction, bulkAction, termsAction: vi.fn(), paymentAction: vi.fn(), offerAction: vi.fn() }));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast, dismiss }) }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return { default: ({ href, className, children }: { href: string; className?: string; children?: unknown }) => React.createElement("a", { href, className }, children as never) };
});

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
type Row = import("@/app/root/subscriptions/schools-table").SchoolRow;

let dom: { window: DomWindow };
let React: ReactModule;
let createRoot: (container: Element) => Root;
let SchoolsTable: (typeof import("@/app/root/subscriptions/schools-table"))["SchoolsTable"];
const mounted: { root: Root; host: HTMLElement }[] = [];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/root/subscriptions", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Element", "Node", "Event", "KeyboardEvent", "FocusEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("self", win);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  SchoolsTable = (await import("@/app/root/subscriptions/schools-table")).SchoolsTable;
});

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await React.act(async () => root.unmount());
    host.remove();
  }
  for (const stand of [premiumSwitchAction, bulkAction, refresh, toast, dismiss]) stand.mockReset();
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

/** ZZ Premium School as a row draws it: terms not set, premium off for students and teachers. */
const ROW: Row = {
  id: "s1",
  name: "ZZ Premium School",
  college: false,
  termsSet: false,
  pays: null,
  premium: "ZZ premium",
  students: false,
  teachers: false,
  renews: null,
  state: "Active",
  tone: "ok",
  seen: { termsSetAt: null, premiumStudents: false, premiumTeachers: false, subscription: { mode: "OURS" }, premium: { mode: "OURS" } },
};

async function mount(): Promise<HTMLElement> {
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  await React.act(async () => root.render(React.createElement(SchoolsTable, { rows: [ROW] })));
  return host;
}

const studentsSwitch = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('[data-testid="premium-students-s1"]')!;
const barButton = (host: HTMLElement, key: string) => [...host.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes(key)) ?? null;

async function click(target: HTMLElement): Promise<void> {
  await React.act(async () => {
    target.click();
  });
}

/** A save the stand-in holds until the case answers it: a write still on its way. */
function heldSave() {
  let answer: (value: { ok: true; changed: true; sentence: string }) => void = () => {};
  const promise = new Promise<{ ok: true; changed: true; sentence: string }>((resolve) => (answer = resolve));
  return { promise, answer: () => answer({ ok: true, changed: true, sentence: "ZZ saved" }) };
}

/** The toast's own handlers, as the toast holding the write was given them. */
function heldToast(): { onCommit: () => void; onUndo: () => void } {
  const options = toast.mock.calls.map((c) => c[0] as { onCommit?: () => void; onUndo?: () => void }).filter((o) => o.onCommit && o.onUndo).at(-1);
  expect(options).toBeTruthy();
  return options as { onCommit: () => void; onUndo: () => void };
}

describe("the Schools tab: an Undo pressed after the write had gone", () => {
  it("a row's switch: the Undo takes nothing back, so the switch stays drawn on and waits until the write's answer", { timeout: 30_000 }, async () => {
    const save = heldSave();
    premiumSwitchAction.mockImplementation(async (_id: string, body: { preview: boolean }) =>
      body.preview ? { ok: true, changed: true, sentence: "ZZ premium on for students", expect: { ...ROW.seen, note: null } } : save.promise,
    );
    const host = await mount();
    await click(studentsSwitch(host));
    await vi.waitFor(() => expect(heldToast()).toBeTruthy());
    expect(studentsSwitch(host).disabled).toBe(true);
    expect(studentsSwitch(host).getAttribute("aria-checked")).toBe("true");
    // The toast goes: the switch's write is sent; its answer is still on its way.
    const { onCommit, onUndo } = heldToast();
    await React.act(async () => onCommit());
    await vi.waitFor(() => expect(premiumSwitchAction.mock.calls.filter((c) => !(c[1] as { preview: boolean }).preview)).toHaveLength(1));
    // The Undo, pressed in the moment before the toast is drawn away.
    await React.act(async () => onUndo());
    expect(studentsSwitch(host).disabled).toBe(true);
    expect(studentsSwitch(host).getAttribute("aria-checked")).toBe("true");
    // Its answer: saved. The school's controls are let go; the switch stays drawn on until the list is drawn again.
    await React.act(async () => {
      save.answer();
      await save.promise;
    });
    await vi.waitFor(() => expect(studentsSwitch(host).disabled).toBe(false));
    expect(studentsSwitch(host).getAttribute("aria-checked")).toBe("true");
    expect(refresh).toHaveBeenCalled();
  });

  it("a bulk \"on\": the Undo takes nothing back, so the bar and the chosen school's switch wait until the write's answer", { timeout: 30_000 }, async () => {
    const save = heldSave();
    bulkAction.mockImplementation(async (body: { preview?: boolean }) => (body.preview ? { ok: true, changed: true, sentence: "ZZ premium on for students at one school" } : save.promise));
    const host = await mount();
    await click(host.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(barButton(host, "subs.bulkStudentsOn")!);
    await vi.waitFor(() => expect(heldToast()).toBeTruthy());
    expect(barButton(host, "subs.bulkStudentsOn")!.disabled).toBe(true);
    expect(studentsSwitch(host).disabled).toBe(true);
    const { onCommit, onUndo } = heldToast();
    await React.act(async () => onCommit());
    await vi.waitFor(() => expect(bulkAction.mock.calls.filter((c) => !(c[0] as { preview?: boolean }).preview)).toHaveLength(1));
    await React.act(async () => onUndo());
    for (const key of ["subs.bulkStudentsOn", "subs.bulkTeachersOn", "subs.bulkPremiumOff", "subs.bulkOurPrices"]) expect(barButton(host, key)!.disabled, key).toBe(true);
    expect(studentsSwitch(host).disabled).toBe(true);
    expect(studentsSwitch(host).getAttribute("aria-checked")).toBe("true");
    // Its answer: saved. The schools are no longer chosen, and their switches are let go.
    await React.act(async () => {
      save.answer();
      await save.promise;
    });
    await vi.waitFor(() => expect(studentsSwitch(host).disabled).toBe(false));
    expect(barButton(host, "subs.bulkStudentsOn")).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });
});
