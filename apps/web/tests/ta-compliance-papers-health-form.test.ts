/**
 * TA-111, the web's form (testing analysis of 13 November 2026, second reader's concern): the save now names the card
 * it was drawn from (basedOn) and a card changed since is refused 409 and kept. The web's form took basedOn from the
 * page's current view at the moment of Save, while its fields were state drawn once when it opened; after the refusal
 * the page refreshed, the view moved to the newer card, the form kept its stale fields, and a second Save sent the
 * stale fields based on the NEW card, which the server rightly accepted, erasing the guardian's change after all.
 * The form is now drawn again from the card as it stands after a refusal (keyed by the card's updatedAt) and keeps the
 * refusal's sentence, so the next Save sends what is shown.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT (src/components/health-card.tsx) in a real DOM, as tests/ta-date-field.test.ts
 * draws DateField: jsdom borrowed from the phone app's jest, this app's own react-dom. The server action, the router
 * and the toast are stood in for; the router's refresh hands the page the newer card, as the server would.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { HealthCardSave, HealthCardView } from "@edulink/contracts";

const saveHealthCardAction = vi.fn<(id: string, input: HealthCardSave) => Promise<{ ok: boolean; errorKey?: string }>>();
const refresh = vi.fn<() => void>();
vi.mock("@/app/(app)/parent/health/actions", () => ({
  saveHealthCardAction: (id: string, input: HealthCardSave) => saveHealthCardAction(id, input),
  recordHealthCheckAction: vi.fn(),
}));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ refresh: () => refresh() }) }));
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
let HealthCardEditor: (typeof import("@/components/health-card"))["HealthCardEditor"];
const mounted: { root: Root; host: HTMLElement }[] = [];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/people/x", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLIFrameElement", "Element", "Node", "Event", "FormData", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  HealthCardEditor = (await import("@/components/health-card")).HealthCardEditor;
});

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await React.act(async () => root.unmount());
    host.remove();
  }
  saveHealthCardAction.mockReset();
  refresh.mockReset();
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

const T2 = "2026-11-13T06:30:00.000Z";
const base: HealthCardView = { studentMembershipId: "zz-pupil", studentName: "ZZ Pupil", className: null, card: null, checks: [], canEdit: true, canRecordCheck: true };
/** The card as the guardian left it at noon, after the office's form was opened. */
const guardianCard: HealthCardView = {
  ...base,
  card: { bloodGroup: null, allergies: "Peanuts", conditions: "", medications: "", dietary: "", notes: "", doctorName: "", doctorPhone: "", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], updatedAt: T2, updatedByName: "ZZ Guardian" },
};

async function mountPage(): Promise<HTMLElement> {
  // The page: the view is the server's, and a refresh hands it the newer card.
  function Page() {
    const [view, setView] = React.useState<HealthCardView>(base);
    refresh.mockImplementation(() => setView(guardianCard));
    return React.createElement(HealthCardEditor, { view, timezone: "Asia/Kolkata" });
  }
  const host = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(host);
  const root = createRoot(host);
  mounted.push({ root, host });
  await React.act(async () => root.render(React.createElement(Page)));
  return host;
}

async function browserWrites(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await React.act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

async function save(host: HTMLElement): Promise<void> {
  const form = host.querySelector<HTMLFormElement>('[data-testid="health-card-form"]')!;
  await React.act(async () => {
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("the web's health card form after a refused save", () => {
  it("TA-111: after the 409 the form shows the guardian's card and the refusal, and the next Save sends that card, not the stale form", async () => {
    saveHealthCardAction.mockResolvedValueOnce({ ok: false, errorKey: "health.cardChanged" }).mockResolvedValueOnce({ ok: true });
    const host = await mountPage();

    // The office opens the form in the morning: no card yet.
    const edit = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("health.edit"))!;
    await React.act(async () => edit.click());
    await browserWrites(host.querySelectorAll<HTMLInputElement>('input[type="tel"]')[0]!, "9876500002");

    // The afternoon's Save is refused: the guardian saved at noon.
    await save(host);
    expect(saveHealthCardAction).toHaveBeenCalledTimes(1);
    expect(saveHealthCardAction.mock.calls[0]![1].basedOn).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);

    // The form is drawn again from the card as it now stands, and still says why.
    expect(host.querySelector("textarea")!.value).toBe("Peanuts");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("health.cardChanged");

    // The next Save is based on the newer card and carries what it holds.
    await save(host);
    expect(saveHealthCardAction).toHaveBeenCalledTimes(2);
    const second = saveHealthCardAction.mock.calls[1]![1];
    expect(second.basedOn).toBe(T2);
    expect(second.allergies).toBe("Peanuts");
    expect(second.contacts).toEqual([{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }]);
  });

  it("TA-111: a save refused for another reason keeps what the person typed", async () => {
    saveHealthCardAction.mockResolvedValueOnce({ ok: false, errorKey: "common.tryAgain" });
    const host = await mountPage();
    const edit = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("health.edit"))!;
    await React.act(async () => edit.click());
    await browserWrites(host.querySelectorAll<HTMLInputElement>('input[type="tel"]')[0]!, "9876500002");

    await save(host);
    expect(refresh).not.toHaveBeenCalled();
    expect(host.querySelectorAll<HTMLInputElement>('input[type="tel"]')[0]!.value).toBe("9876500002");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("common.tryAgain");
  });
});
