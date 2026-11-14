/**
 * The web shell from the keyboard (testing analysis of 13 November 2026):
 *
 *   TA-232 — the More sheet, the class archive confirm and the post report dialog declared aria-modal dialogs and moved
 *            no focus, ignored Escape and returned focus nowhere; the account menu's list came before its button.
 *   TA-393 — in the command palette, Enter on a row reached with Tab opened the highlighted first row, and Tab left the
 *            dialog.
 *   TA-400 — the palette's arrow keys moved a highlight a screen reader never heard (no combobox, no options).
 *   TA-606 — the language switch declared a radio group and answered no arrow key, every option a tab stop.
 *
 * The real components, drawn by this app's react-dom in jsdom (tests/ta-web-shell-ui-dom.ts). The router, the server
 * actions and next/link (an anchor here) are stood in for. No dictionary is loaded, so `t` answers with the key.
 */
import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setUpDom, type Dom } from "./ta-web-shell-ui-dom";

const pushed = vi.hoisted(() => [] as string[]);
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ push: (href: string) => void pushed.push(href), refresh: () => undefined }) }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef<HTMLAnchorElement, { href: string; children?: ReactNode } & Record<string, unknown>>(function Anchor({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children as ReactNode);
    }),
  };
});
const chosenLocales = vi.hoisted(() => [] as string[]);
vi.mock("@/app/account/actions", () => ({ setLocale: async (code: string) => void chosenLocales.push(code) }));
vi.mock("@/app/(app)/admin/classes/actions", () => ({
  archiveClass: vi.fn(async () => ({ ok: true })),
  restoreClass: vi.fn(async () => ({ ok: true })),
  regenerateJoinCode: vi.fn(async () => ({ ok: true, joinCode: "ZZ1234" })),
}));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: () => "toast-id", dismiss: () => undefined }) }));

let dom: Dom;
const doc = () => dom.window.document;
const active = () => doc().activeElement;

beforeAll(async () => {
  dom = await setUpDom("http://localhost:3000/admin");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  pushed.length = 0;
  chosenLocales.length = 0;
});

afterEach(async () => {
  await dom.unmountAll();
});

describe("TA-232: a modal dialog takes the focus, keeps it, gives it back", () => {
  it("TA-232: the class archive confirm takes focus, keeps Tab inside, closes on Escape and returns focus to the row's menu button", async () => {
    const { ClassRowActions } = await import("@/app/(app)/admin/classes/row-actions");
    await dom.mount(dom.React.createElement(ClassRowActions, { classId: "zz-class", className: "ZZ 6A", joinCode: "ZZ0001", archived: false, enrollmentCount: 3 }));
    const trigger = doc().querySelector<HTMLButtonElement>('button[aria-label="classes.actionsFor"]')!;
    await dom.act(() => trigger.focus());
    await dom.click(trigger);
    const archive = [...doc().querySelectorAll("button")].find((b) => b.textContent?.includes("classes.archiveClass"))!;
    await dom.act(() => archive.focus());
    await dom.click(archive);
    const dialog = doc().querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.contains(active()), "focus stayed behind the dialog").toBe(true);
    const buttons = [...dialog.querySelectorAll("button")];
    const last = buttons[buttons.length - 1]!;
    await dom.act(() => last.focus());
    const tab = await dom.key(last, "Tab");
    expect(tab.defaultPrevented).toBe(true);
    expect(active()).toBe(buttons[0]);
    await dom.key(active()!, "Escape");
    expect(doc().querySelector('[role="dialog"]'), "Escape did not close it").toBeNull();
    expect(active(), "focus went to the body, not back to the menu button").toBe(trigger);
  });

  it("TA-232: the More sheet and the report dialog use the same focus handling, and the account menu's list follows its button", () => {
    const shell = readFileSync("src/components/nav/app-shell.tsx", "utf8");
    expect(shell).toMatch(/useModalFocus\(moreOpen, moreSheet, closeMore, moreButton\)/);
    expect(shell).toMatch(/<div ref=\{moreSheet\} data-chrome/);
    const post = readFileSync("src/app/(app)/bulletin/post-card.tsx", "utf8");
    expect(post).toMatch(/useModalFocus\(true, dialogRef, onClose\)/);
    expect(post).toMatch(/ref=\{dialogRef\}\s+role="dialog"/);
    const menu = readFileSync("src/components/nav/account-menu.tsx", "utf8");
    const body = menu.slice(menu.indexOf("<div ref={root}"));
    expect(body.indexOf("{list}"), "the list is drawn before its button").toBeGreaterThan(body.indexOf("data-testid=\"account-menu-button-bar\""));
  });
});

describe("TA-393 and TA-400: the command palette from the keyboard", () => {
  async function openPalette() {
    const { CommandPalette } = await import("@/components/nav/command-palette");
    await dom.mount(dom.React.createElement(CommandPalette, { open: true, onClose: () => undefined, role: "ADMIN", contextCount: 1 }));
    const input = doc().querySelector<HTMLInputElement>('[role="dialog"] input')!;
    // The palette focuses its input on the next animation frame: let that land before the keyboard moves.
    await dom.act(() => new Promise<void>((done) => setTimeout(done, 50)));
    expect(active()).toBe(input);
    const options = [...doc().querySelectorAll<HTMLAnchorElement>('[role="option"]')];
    return { input, options };
  }

  it("TA-400: the input is a combobox whose active descendant follows the arrow keys", async () => {
    const { input, options } = await openPalette();
    expect(options.length).toBeGreaterThan(3);
    expect(input.getAttribute("role")).toBe("combobox");
    const list = doc().getElementById(input.getAttribute("aria-controls")!);
    expect(list?.getAttribute("role")).toBe("listbox");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0]!.id);
    await dom.key(input, "ArrowDown");
    await dom.key(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[2]!.id);
    expect(doc().getElementById(options[2]!.id)?.getAttribute("aria-selected")).toBe("true");
    expect(options[0]!.getAttribute("aria-selected")).toBe("false");
  });

  it("TA-393: Enter on a row reached with Tab is that row's own, not the highlighted first row", async () => {
    const { options } = await openPalette();
    const third = options[2]!;
    await dom.act(() => third.focus());
    const enter = await dom.key(third, "Enter");
    expect(enter.defaultPrevented, "the palette took the Enter from the focused row").toBe(false);
    expect(pushed, "the palette opened another row").toEqual([]);
    // The highlight followed the focus.
    expect(doc().querySelector('[role="combobox"]')?.getAttribute("aria-activedescendant")).toBe(third.id);
  });

  it("TA-393: Tab stays inside the palette, round again at either end", async () => {
    const { input, options } = await openPalette();
    const last = options[options.length - 1]!;
    await dom.act(() => last.focus());
    const tab = await dom.key(last, "Tab");
    expect(tab.defaultPrevented).toBe(true);
    expect(active()).toBe(input);
    const back = await dom.key(input, "Tab", { shiftKey: true });
    expect(back.defaultPrevented).toBe(true);
    expect(active()).toBe(last);
  });

  it("TA-393: an input method committing its word with Enter opens nothing; a plain Enter in the box opens the highlighted row", async () => {
    const { input, options } = await openPalette();
    await dom.key(input, "Enter", { isComposing: true });
    expect(pushed).toEqual([]);
    await dom.key(input, "Enter");
    expect(pushed).toEqual([options[0]!.getAttribute("href")]);
  });
});

describe("TA-606: the language switch is a radio group a keyboard can use", () => {
  it("TA-606: one tab stop, and the arrow keys move to the next language and choose it", async () => {
    const { LanguageSwitch } = await import("@/components/language-switch");
    await dom.mount(dom.React.createElement(LanguageSwitch));
    const radios = [...doc().querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios.length).toBe(3);
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    await dom.act(() => radios[0]!.focus());
    const right = await dom.key(radios[0]!, "ArrowRight");
    expect(right.defaultPrevented).toBe(true);
    expect(active()).toBe(radios[1]);
    expect(chosenLocales).toEqual([radios[1]!.getAttribute("lang")]);
  });
});
