/**
 * TA-017 — DateField: a date picked with the calendar button never reaches a
 * controlled form (testing analysis of 13 November 2026, found by reading).
 *
 * `DateField` (src/components/ui/field.tsx) draws a day-first text box and,
 * beside it, a visually hidden `<input type="date">` that the calendar button
 * opens with `showPicker()`. A typed date goes through `report()`, which calls
 * the caller's `onChange` with the ISO day. The hidden input's own `onChange`
 * only rewrites the text in the box. So a caller that keeps the value in its
 * own state (the leave form's first and last day, the pupil record's admission
 * date, term dates, `DateTimeField`'s hidden input, about forty forms) shows
 * the picked day and saves the earlier one.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT, drawn by this app's own react-dom into
 * a real DOM, and the picker's part is played the way a browser plays it: the
 * value is written into the hidden input underneath React (the prototype's
 * setter, as the native picker does not go through the property React tracks)
 * and `input` then `change` are dispatched on it. The first case is the
 * control: the same mechanism on the text box does reach the parent, so a red
 * case below is the component's answer and not a harness that fires nothing.
 *
 * ⚠ WHERE THE DOM COMES FROM. apps/web declares no DOM library, and vitest
 * runs these suites in the node environment. jsdom is in the workspace's store
 * all the same, as a dependency of the phone app's jest (jest-expo →
 * jest-environment-jsdom → jsdom), and `loadJsdom` below walks that chain; no
 * package was added for this file. Its proper home, once somebody is allowed
 * to add packages: `jsdom` (and `@testing-library/react`) as devDependencies
 * of apps/web and `// @vitest-environment jsdom` at the top of this file, and
 * the loader and the DOM globals below go; `esbuild: { jsx: "automatic" }` in
 * vitest.config.ts (or the React plugin) would retire the `React` global too.
 * React and react-dom are apps/web's own (one instance), so no second copy of
 * React is in play.
 *
 * Each ⚠ case fails while the defect stands and passes once the hidden input
 * reports a picked day the way the text box reports a typed one.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type DomWindow = Window & typeof globalThis;
type Jsdom = { JSDOM: new (html: string, options?: { url?: string; pretendToBeVisual?: boolean }) => { window: DomWindow } };

/** jsdom, borrowed from the phone app's jest (see the header). Says what is missing rather than failing on a bare "Cannot find module". */
function loadJsdom(): Jsdom {
  const here = dirname(fileURLToPath(import.meta.url));
  try {
    const mobile = createRequire(resolve(here, "../../mobile/package.json"));
    const jestExpo = createRequire(mobile.resolve("jest-expo/package.json"));
    const environment = createRequire(jestExpo.resolve("jest-environment-jsdom/package.json"));
    return environment("jsdom") as Jsdom;
  } catch (error) {
    throw new Error(
      `TA-017 needs a DOM and found none: jsdom is not reachable through apps/mobile's jest (${error instanceof Error ? error.message.split("\n")[0] : String(error)}). ` +
        "Add jsdom (and @testing-library/react) to apps/web's devDependencies and run this file with // @vitest-environment jsdom.",
    );
  }
}

type ReactModule = typeof import("react");
type Root = { render(node: unknown): void; unmount(): void };

let dom: { window: DomWindow };
let React: ReactModule;
let createRoot: (container: Element) => Root;
let DateField: (typeof import("@/components/ui/field"))["DateField"];
let DateTimeField: (typeof import("@/components/ui/date-time-field"))["DateTimeField"];
let showPicker: ReturnType<typeof vi.fn>;
const mounted: { root: Root; host: HTMLElement }[] = [];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/teacher/leave", pretendToBeVisual: true });
  const win = dom.window;
  // What react-dom reads off the global scope when it loads and while it works.
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLIFrameElement", "Element", "Node", "Event", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // jsdom has no native picker. The button only draws where `showPicker` exists; this stands in for the browser's.
  showPicker = vi.fn();
  (win.HTMLInputElement.prototype as unknown as { showPicker: () => void }).showPicker = showPicker;

  // After the globals: react-dom decides whether it has a DOM when it is first loaded.
  React = await import("react");
  // The suite's esbuild compiles JSX to React.createElement (tsconfig says "preserve", there is no React plugin here),
  // and the kit's files import hooks by name only.
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  DateField = (await import("@/components/ui/field")).DateField;
  DateTimeField = (await import("@/components/ui/date-time-field")).DateTimeField;
});

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await React.act(async () => root.unmount());
    host.remove();
  }
  showPicker.mockClear();
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

async function mount(node: unknown): Promise<HTMLElement> {
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  await React.act(async () => root.render(node));
  return host;
}

/**
 * What a browser does when a value arrives in an input from outside the page's
 * script (typing, or a day chosen in the native picker): the element's value
 * changes underneath React, then `input` and `change` fire and bubble.
 */
async function browserWrites(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await React.act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

/** A caller that holds the day in its own state, as the leave form does (teacher/leave/form.tsx: `value={from} onChange={(e) => setFrom(e.target.value)}`). */
function controlledForm(reported: (value: string) => void) {
  return function LeaveLikeForm() {
    const [from, setFrom] = React.useState("2026-11-13");
    return React.createElement(
      "form",
      null,
      React.createElement(DateField, {
        label: "First day",
        name: "fromDateKey",
        value: from,
        onChange: (event: { target: { value: string } }) => {
          reported(event.target.value);
          setFrom(event.target.value);
        },
      }),
      // What the form would send: its own state, never the box.
      React.createElement("output", { "data-testid": "would-send" }, from),
    );
  };
}

const textBox = (host: HTMLElement) => host.querySelector<HTMLInputElement>('input[type="text"]')!;
const nativeDate = (host: HTMLElement) => host.querySelector<HTMLInputElement>('input[type="date"]')!;
const wouldSend = (host: HTMLElement) => host.querySelector('[data-testid="would-send"]')!.textContent;

describe("TA-017: DateField and a controlled form", () => {
  it("control — a date TYPED in the box is reported to the form, which then holds it", async () => {
    const reported = vi.fn<(value: string) => void>();
    const host = await mount(React.createElement(controlledForm(reported)));
    expect(textBox(host).value).toBe("13/11/2026");

    await browserWrites(textBox(host), "24/11/2026");

    expect(reported).toHaveBeenLastCalledWith("2026-11-24");
    expect(wouldSend(host)).toBe("2026-11-24");
    expect(nativeDate(host).value).toBe("2026-11-24");
  });

  it("the calendar button opens the picker of the hidden native input, the one the picked day is written into", async () => {
    const host = await mount(React.createElement(controlledForm(vi.fn())));
    const button = host.querySelector<HTMLButtonElement>('button[type="button"]');
    expect(button, "the calendar button is drawn where showPicker exists").not.toBeNull();
    await React.act(async () => button!.click());
    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(showPicker.mock.instances[0]).toBe(nativeDate(host));
  });

  it("⚠ a date PICKED with the calendar is reported to the form too: what is shown is what would be sent", async () => {
    const reported = vi.fn<(value: string) => void>();
    const host = await mount(React.createElement(controlledForm(reported)));

    // The picker writes 24 November into the hidden input.
    await browserWrites(nativeDate(host), "2026-11-24");

    // The box follows the picker; this much works today, and it is why nobody sees the fault.
    expect(textBox(host).value).toBe("24/11/2026");
    // The form must be told, or it keeps and sends the 13th.
    expect(reported.mock.calls, "the caller's onChange was never called for the picked day").toEqual([["2026-11-24"]]);
    expect(wouldSend(host)).toBe("2026-11-24");
  });

  it("⚠ DateTimeField posts the picked day: its hidden input is built from the state DateField reports into", async () => {
    const host = await mount(React.createElement("form", null, React.createElement(DateTimeField, { label: "Starts", name: "startsAt", defaultValue: "2026-11-13T10:30" })));
    const posted = () => host.querySelector<HTMLInputElement>('input[type="hidden"][name="startsAt"]')!.value;
    expect(posted()).toBe("2026-11-13T10:30");

    await browserWrites(nativeDate(host), "2026-11-24");

    expect(textBox(host).value).toBe("24/11/2026");
    expect(posted()).toBe("2026-11-24T10:30");
  });
});
