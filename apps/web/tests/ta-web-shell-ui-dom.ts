/**
 * A real DOM for the web-shell-ui suites (testing analysis of 13 November 2026): jsdom borrowed from the phone app's
 * jest, as tests/ta-date-field.test.ts explains (apps/web declares no DOM library), and this app's own react-dom. Not a
 * suite itself (no .test. in the name): the ta-web-shell-ui-*.test.ts files call it in their beforeAll.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

export type DomWindow = Window & typeof globalThis;
type Jsdom = { JSDOM: new (html: string, options?: { url?: string; pretendToBeVisual?: boolean }) => { window: DomWindow } };
export type Root = { render(node: unknown): void; unmount(): void };

function loadJsdom(): Jsdom {
  const here = dirname(fileURLToPath(import.meta.url));
  const mobile = createRequire(resolve(here, "../../mobile/package.json"));
  const jestExpo = createRequire(mobile.resolve("jest-expo/package.json"));
  const environment = createRequire(jestExpo.resolve("jest-environment-jsdom/package.json"));
  return environment("jsdom") as Jsdom;
}

export type Dom = {
  window: DomWindow;
  React: typeof import("react");
  act: (fn: () => void | Promise<void>) => Promise<void>;
  mount: (node: unknown) => Promise<{ root: Root; host: HTMLElement }>;
  unmountAll: () => Promise<void>;
  click: (element: Element | null | undefined) => Promise<void>;
  key: (target: EventTarget, key: string, init?: KeyboardEventInit) => Promise<KeyboardEvent>;
};

const GLOBALS = [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLAnchorElement",
  "HTMLButtonElement",
  "HTMLTextAreaElement",
  "HTMLSelectElement",
  "HTMLIFrameElement",
  "Element",
  "Node",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "FormData",
  "MutationObserver",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
] as const;

/** Sets the DOM globals react-dom reads, and `navigator` unless the caller stands in its own. */
export async function setUpDom(url: string, options: { navigator?: unknown } = {}): Promise<Dom> {
  const dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url, pretendToBeVisual: true });
  const win = dom.window;
  for (const name of GLOBALS) vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  vi.stubGlobal("navigator", options.navigator ?? win.navigator);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const React = await import("react");
  // The suite's esbuild compiles JSX to React.createElement, and the app's files import hooks by name only.
  vi.stubGlobal("React", React);
  const { createRoot } = (await import("react-dom/client")) as unknown as { createRoot: (container: Element) => Root };
  const mounted: { root: Root; host: HTMLElement }[] = [];
  const act = async (fn: () => void | Promise<void>) => {
    await React.act(async () => {
      await fn();
    });
  };
  return {
    window: win,
    React,
    act,
    async mount(node) {
      const host = win.document.createElement("div");
      win.document.body.appendChild(host);
      const root = createRoot(host);
      await act(() => root.render(node));
      mounted.push({ root, host });
      return { root, host };
    },
    async unmountAll() {
      for (const { root, host } of mounted.splice(0)) {
        await act(() => root.unmount());
        host.remove();
      }
    },
    async click(element) {
      if (!element) throw new Error("nothing to click");
      await act(() => {
        element.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    },
    async key(target, key, init = {}) {
      const event = new win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
      await act(() => {
        target.dispatchEvent(event);
      });
      return event;
    },
  };
}
