/**
 * TA-405 (testing analysis of 13 November 2026, Low, UI-UX): the web's two-step code box asked a phone's browser
 * for a number pad (inputMode="numeric"), while the page tells the person they may type a recovery code, which is
 * two groups of four letters and digits. The box now asks for a text keyboard in capitals.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT (src/app/login/code/form.tsx) in a real DOM, as
 * tests/ta-compliance-papers-health-form.test.ts draws its form: jsdom borrowed from the phone app's jest, this
 * app's own react-dom. The server action, the router and the toast are stood in for.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/app/login/code/actions", () => ({ completeTwoFactor: vi.fn() }));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

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

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/login/code", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "Element", "Node", "Event", "FormData", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  // next/link reads `self` as a browser does.
  vi.stubGlobal("self", win);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

describe("TA-405: the two-step code box takes a recovery code's letters", () => {
  it("TA-405: the box asks for a text keyboard in capitals, not a number pad", { timeout: 60_000 }, async () => {
    const { CodeForm } = await import("@/app/login/code/form");
    const host = dom.window.document.createElement("div");
    dom.window.document.body.appendChild(host);
    const root = createRoot(host);
    await React.act(async () => root.render(React.createElement(CodeForm)));
    const box = host.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')!;
    expect(box).toBeTruthy();
    expect(box.getAttribute("inputmode")).not.toBe("numeric");
    expect(box.getAttribute("autocapitalize")).toBe("characters");
    await React.act(async () => root.unmount());
    host.remove();
  });
});
