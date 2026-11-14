/**
 * Forms, fields and pages of the web shell (testing analysis of 13 November 2026):
 *
 *   TA-252 — the marks sheet and a message reply went to the outbox only when the browser already knew it was offline;
 *            a save that failed on the way threw the page into the error boundary with everything typed.
 *   TA-404 — the date box raised an error alert on the first keystroke.
 *   TA-506 — visually hidden file inputs stayed in the tab order beside the button that opens them; the picker's
 *            refusal was tied to nothing; its remove button was 32 px.
 *   TA-403 — filtering a list said nothing to a screen reader, and the active-filter chips did not say they remove.
 *   TA-392 — the account's saved appearance was never applied on a browser where it was not chosen.
 *   TA-406 — pages outside the signed-in shell fell to Next's bare English error page.
 *   TA-134 — every upload above the action body limit was refused by the framework with nothing said about size.
 *   TA-233 — the i18n audit could not see English trailing an interpolation.
 *
 * The real components, drawn by this app's react-dom in jsdom (tests/ta-web-shell-ui-dom.ts); server actions, the
 * router and the outbox are stood in for. No dictionary is loaded, so `t` answers with the key.
 */
import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setUpDom, type Dom } from "./ta-web-shell-ui-dom";

const queued = vi.hoisted(() => [] as { url: string; body: string; tag: string }[]);
vi.mock("@/lib/offline-queue", () => ({
  enqueue: async (item: { url: string; body: string; tag: string }) => {
    queued.push(item);
    return "queued-id";
  },
  countQueued: async () => queued.length,
  newClientId: () => "zz-client-id",
}));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: () => "toast-id", dismiss: () => undefined }) }));
const pushed = vi.hoisted(() => [] as string[]);
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ push: (href: string) => void pushed.push(href), refresh: () => undefined }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/people" }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef<HTMLAnchorElement, { href: string; children?: ReactNode } & Record<string, unknown>>(function Anchor({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children as ReactNode);
    }),
  };
});
vi.mock("@/app/(app)/remarks/conversation-actions", () => ({
  sendConversationReply: async () => {
    throw new TypeError("Failed to fetch");
  },
}));

const attached = vi.hoisted(() => [] as number[]);
vi.mock("@/app/(app)/attachments/actions", () => ({
  attachToAssignment: async (form: FormData) => {
    attached.push(form.getAll("files").length);
    return { ok: true };
  },
  attachToSubmission: async (form: FormData) => {
    attached.push(form.getAll("files").length);
    return { ok: true };
  },
  detach: async () => ({ ok: true }),
}));

let dom: Dom;
const doc = () => dom.window.document;

beforeAll(async () => {
  dom = await setUpDom("http://localhost:3000/teacher/exams");
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  queued.length = 0;
  pushed.length = 0;
});

afterEach(async () => {
  await dom.unmountAll();
});

/** Types into a box the way a person does: the value under React, then the input event React listens for. */
async function typeInto(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof dom.window.HTMLTextAreaElement ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  await dom.act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}

const settle = () => dom.act(() => new Promise<void>((done) => setTimeout(done, 50)));

describe("TA-252: a save that fails on the way keeps what was typed", () => {
  it("TA-252: the marks sheet goes to the outbox when the action fails though the browser says online, and the marks stay", async () => {
    const { MarksForm } = await import("@/app/(app)/teacher/exams/marks-form");
    const action = async () => {
      throw new TypeError("Failed to fetch");
    };
    const { React } = dom;
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => void errors.push(event.error);
    dom.window.addEventListener("error", onError);
    await dom.mount(
      React.createElement(
        MarksForm,
        { slotId: "zz-slot", classId: "zz-class", action } as unknown as Parameters<typeof MarksForm>[0],
        React.createElement("input", { name: "marks-zz-pupil-1", defaultValue: "", "data-testid": "mark" }),
        React.createElement("input", { type: "hidden", name: "basedOn", value: "v1" }),
        React.createElement("button", { type: "submit" }, "save"),
      ),
    );
    const box = doc().querySelector<HTMLInputElement>('[data-testid="mark"]')!;
    box.value = "45";
    const form = doc().querySelector("form")!;
    await dom.act(() => {
      form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    await settle();
    dom.window.removeEventListener("error", onError);
    expect(box.isConnected, "the form was thrown away").toBe(true);
    expect(box.value).toBe("45");
    expect(queued).toHaveLength(1);
    expect(queued[0]!.url).toBe("/api/v1/marks");
    expect(JSON.parse(queued[0]!.body)).toEqual({ slotId: "zz-slot", classId: "zz-class", entries: [{ membershipId: "zz-pupil-1", marks: 45 }], basedOn: "v1" });
  });

  it("TA-252: a reply whose send fails on the way stays in the box with a sentence, rather than the page failing", async () => {
    const { ConversationReplyBox } = await import("@/app/(app)/remarks/c/[conversationId]/reply-box");
    await dom.mount(dom.React.createElement(ConversationReplyBox, { conversationId: "zz-conversation" }));
    const box = doc().querySelector<HTMLTextAreaElement>("textarea")!;
    await typeInto(box, "ZZ: please bring the form tomorrow");
    await dom.act(() => {
      doc().querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    await settle();
    expect(box.isConnected).toBe(true);
    expect(box.value).toBe("ZZ: please bring the form tomorrow");
    expect(doc().querySelector('[role="alert"]')?.textContent).toBe("remarks.couldNotSendTryAgain");
  });
});

describe("TA-404: the date box waits for the date", () => {
  it("TA-404: a first keystroke raises no alert and keeps the hint; leaving the box with half a date says so", async () => {
    const { DateField } = await import("@/components/ui/field");
    await dom.mount(dom.React.createElement(DateField, { label: "ZZ day", name: "day" }));
    const box = doc().querySelector<HTMLInputElement>('input[type="text"]')!;
    await typeInto(box, "0");
    expect(doc().querySelector('[role="alert"]'), "an alert on the first keystroke").toBeNull();
    expect(box.getAttribute("aria-invalid")).toBeNull();
    expect(doc().body.textContent).toContain("field.dateHint");
    await typeInto(box, "05/04");
    expect(doc().querySelector('[role="alert"]')).toBeNull();
    await dom.act(() => {
      box.dispatchEvent(new dom.window.FocusEvent("focusout", { bubbles: true }));
    });
    expect(doc().querySelector('[role="alert"]')?.textContent).toBe("field.dateInvalid");
    await typeInto(box, "05/04/2026");
    expect(doc().querySelector('[role="alert"]')).toBeNull();
  });
});

describe("TA-506: hidden file inputs are not tab stops", () => {
  it("TA-506: every visually hidden file input is out of the tab order behind the button that opens it, or comes before a label that shows its focus", () => {
    const files = [
      "src/components/ui/file-field.tsx",
      "src/components/ui/file-picker.tsx",
      "src/components/admissions/document-upload.tsx",
      "src/app/(app)/admin/intake/form.tsx",
      "src/app/(app)/admin/settings/logo-picker.tsx",
      "src/app/(app)/admin/timetable/import-form.tsx",
      "src/app/(app)/teacher/exams/marks-sheet.tsx",
      "src/app/(app)/bulletin/new/form.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/<input\b[^>]*?type="file"[\s\S]*?\/>/g)) {
        const tag = m[0];
        if (!/\bsr-only\b/.test(tag)) continue;
        const hidden = /tabIndex=\{-1\}/.test(tag) && /aria-hidden="true"/.test(tag);
        const peer = /className="peer sr-only"/.test(tag) && /peer-focus-visible:/.test(source.slice(m.index! + tag.length, m.index! + tag.length + 800));
        expect(hidden || peer, `${file}: a hidden file input that is still a tab stop nothing shows focus on`).toBe(true);
      }
    }
  });

  it("TA-506: the file field's button is named by its label, and the picker's refusal is tied to its button, whose remove buttons are 44 px", async () => {
    const { FileField } = await import("@/components/ui/file-field");
    await dom.mount(dom.React.createElement(FileField, { label: "ZZ scan", name: "file" }));
    const input = doc().querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.tabIndex).toBe(-1);
    const button = doc().querySelector("button")!;
    const names = button.getAttribute("aria-labelledby")!.split(" ").map((id) => doc().getElementById(id)?.textContent);
    expect(names[0]).toBe("ZZ scan");
    const picker = readFileSync("src/components/ui/file-picker.tsx", "utf8");
    expect(picker).toMatch(/aria-describedby=\{error \? `\$\{inputId\}-error` : undefined\}/);
    expect(picker).toMatch(/<p id=\{`\$\{inputId\}-error`\} role="alert"/);
    expect(picker).not.toMatch(/grid size-8 shrink-0 place-items-center rounded-full/);
  });
});

describe("TA-403: filtering a list is said", () => {
  it("TA-403: the active filters are a named group whose chips say they remove, and a landed filter says the count", async () => {
    const { DataToolbar } = await import("@/components/ui/data-toolbar");
    const facets = [{ key: "class", label: "Class", value: "6A", options: [{ value: "", label: "All" }, { value: "6A", label: "6A" }] }];
    await dom.mount(
      dom.React.createElement(DataToolbar, {
        search: { value: "zz", placeholder: "Search", label: "Search people" },
        facets,
        labels: { clearAll: "Clear all", clearSearch: "Clear search", activeFilters: "Active filters" },
        resultCount: 7,
      }),
    );
    const group = doc().querySelector('[aria-label="Active filters"]')!;
    expect(group.getAttribute("role")).toBe("group");
    const chips = [...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"));
    expect(chips).toContain("ui.removeFilter");
    expect(chips).toContain("ui.removeSearchFilter");
    const status = doc().querySelector('[data-testid="toolbar-said"]')!;
    expect(status.getAttribute("role")).toBe("status");
    await dom.click(group.querySelector('button[aria-label="ui.removeFilter"]'));
    await settle();
    expect(pushed).toEqual(["/admin/people?q=zz"]);
    expect(status.textContent).toBe("ui.resultCount");
  });
});

describe("TA-392: the account's saved appearance", () => {
  async function scriptFor(account: { theme?: string; contrast?: string; font?: string; motion?: string } | null) {
    const { ThemeScript } = await import("@/components/theme-script");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(dom.React.createElement(ThemeScript, { nonce: "n", account }));
    return /<script[^>]*>([\s\S]*)<\/script>/.exec(html)![1]!;
  }
  function run(body: string) {
    const win = dom.window;
    (win as unknown as { matchMedia: (q: string) => { matches: boolean } }).matchMedia = () => ({ matches: false });
    new Function("document", "window", "localStorage", body)(win.document, win, win.localStorage);
    return win.document.documentElement;
  }

  it("TA-392: a browser that never chose anything draws the signed-in person's saved high contrast, font and theme", async () => {
    dom.window.localStorage.clear();
    const root = run(await scriptFor({ theme: "dark", contrast: "high", font: "dyslexic", motion: "reduced" }));
    expect(root.getAttribute("data-contrast")).toBe("high");
    expect(root.getAttribute("data-font")).toBe("dyslexic");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.getAttribute("data-motion")).toBe("reduced");
    expect(JSON.parse(dom.window.localStorage.getItem("edulink.appearance")!)).toMatchObject({ contrast: "high", font: "dyslexic" });
  });

  it("TA-392: the account's choice wins over what the last person left on a shared browser; signed out, the browser's stays", async () => {
    dom.window.localStorage.setItem("edulink.appearance", JSON.stringify({ theme: "light", contrast: "high", font: "dyslexic" }));
    let root = run(await scriptFor({ theme: "light", contrast: "normal", font: "default", motion: "full" }));
    expect(root.getAttribute("data-contrast")).toBe("normal");
    expect(root.getAttribute("data-font")).toBe("default");
    dom.window.localStorage.setItem("edulink.appearance", JSON.stringify({ contrast: "high" }));
    root = run(await scriptFor(null));
    expect(root.getAttribute("data-contrast")).toBe("high");
  });

  it("TA-392: nothing but the known values reaches the script, and the root layout passes the session's prefs", async () => {
    const body = await scriptFor({ theme: "</script><script>alert(1)</script>", contrast: "high" });
    expect(body).not.toContain("alert(1)");
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toMatch(/<ThemeScript nonce=\{[^}]*\} account=\{session\?\.user\.prefs \?\? null\} \/>/);
  });
});

describe("TA-406: pages outside the shell fail in the reader's language", () => {
  it("TA-406: a root error boundary draws the translated failure with a retry and the way home", async () => {
    const { default: RootError } = await import("@/app/error");
    const reset = vi.fn();
    await dom.mount(dom.React.createElement(RootError, { error: Object.assign(new Error("zz"), { digest: "zz-digest" }), reset }));
    const alert = doc().querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain("appError.title");
    expect(alert.textContent).toContain("appError.reference");
    await dom.click([...alert.querySelectorAll("button")].find((b) => b.textContent === "appError.retry"));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("TA-406: a failure of the root layout itself has its own page, with its own html and body", async () => {
    const { default: GlobalError } = await import("@/app/global-error");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(dom.React.createElement(GlobalError, { error: new Error("zz"), reset: () => undefined }));
    expect(html).toMatch(/^<html[^>]*>(<head><\/head>)?<body/);
    expect(html).toContain("appError.title");
    expect(html).toContain("appError.retry");
  });
});

describe("TA-134: an upload is not refused by the framework for its size", () => {
  it("TA-134: the action body limit holds a 5 MB file and its form, and next.config.ts says the same number", async () => {
    const { ACTION_BODY_LIMIT_MB, ACTION_FILES_MAX_BYTES } = await import("@/lib/action-body-limit");
    const { MAX_FILE_BYTES } = await import("@/components/ui/file-picker");
    expect(ACTION_FILES_MAX_BYTES).toBeGreaterThanOrEqual(MAX_FILE_BYTES);
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toMatch(new RegExp(`bodySizeLimit:\\s*"${ACTION_BODY_LIMIT_MB}mb"`));
  });

  it("TA-134: the post composer checks what its files add up to before sending, and says so in words", () => {
    const form = readFileSync("src/app/(app)/bulletin/new/form.tsx", "utf8");
    expect(form).toMatch(/import \{ ACTION_BODY_LIMIT_MB, ACTION_FILES_MAX_BYTES \} from "@\/lib\/action-body-limit"/);
    expect(form).toMatch(/if \(total > MAX_POST_FILES_BYTES\) \{[\s\S]{0,120}t\("bulletin\.postFilesTooBig"/);
  });

  /** Files of the given sizes, chosen in a file input the way the browser hands them over (jsdom keeps them tiny). */
  async function choose(input: HTMLInputElement, megabytes: number[]) {
    const files = megabytes.map((mb, i) => {
      const file = new dom.window.File(["zz"], `zz-scan-${i}.png`, { type: "image/png" });
      Object.defineProperty(file, "size", { value: Math.round(mb * 1024 * 1024) });
      return file;
    });
    Object.defineProperty(input, "files", { configurable: true, value: Object.assign(files, { item: (i: number) => files[i] ?? null }) });
    await dom.act(() => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  }

  it("TA-134: the file picker refuses files that add up to more than one action carries, in words, where the form asks it to", async () => {
    const { FilePicker } = await import("@/components/ui/file-picker");
    const { ACTION_FILES_MAX_BYTES } = await import("@/lib/action-body-limit");
    const calls: { files: File[]; error?: string }[] = [];
    const onChange = (files: File[], error?: string) => void calls.push({ files, error });
    await dom.mount(dom.React.createElement(FilePicker, { idPrefix: "zz-total", files: [], onChange, maxTotalBytes: ACTION_FILES_MAX_BYTES }));
    await choose(doc().querySelector<HTMLInputElement>("#zz-total-files")!, [4, 4]);
    expect(calls).toEqual([{ files: [], error: "ui.filesTooBigTogether" }]);

    // Under the total the files are taken.
    calls.length = 0;
    await choose(doc().querySelector<HTMLInputElement>("#zz-total-files")!, [2, 3]);
    expect(calls.map((c) => [c.files.length, c.error])).toEqual([[2, undefined]]);

    // A form whose files travel one by one through the upload door (the expert's KYC card) asks no total.
    await dom.unmountAll();
    calls.length = 0;
    await dom.mount(dom.React.createElement(FilePicker, { idPrefix: "zz-door", files: [], onChange }));
    await choose(doc().querySelector<HTMLInputElement>("#zz-door-files")!, [4, 4]);
    expect(calls.map((c) => [c.files.length, c.error])).toEqual([[2, undefined]]);

    // The new assignment's handouts go inside its server action, so its picker asks the total.
    const assignment = readFileSync("src/app/(app)/teacher/assignments/new/form.tsx", "utf8");
    expect(assignment).toMatch(/<FilePicker[\s\S]{0,400}maxTotalBytes=\{ACTION_FILES_MAX_BYTES\}/);
  });

  it("TA-134: the attachment strip refuses files that add up to more than one action carries, in words, and sends nothing", async () => {
    const { AttachmentList } = await import("@/components/attachment-list");
    attached.length = 0;
    const { host } = await dom.mount(
      dom.React.createElement(AttachmentList, { target: "submission", assignmentId: "zz-assignment", recordId: null, attachments: [], canEdit: true }),
    );
    await choose(host.querySelector<HTMLInputElement>('input[type="file"]')!, [3, 3]);
    await settle();
    expect(attached).toEqual([]);
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("ui.filesTooBigTogether");

    await choose(host.querySelector<HTMLInputElement>('input[type="file"]')!, [1, 2]);
    await settle();
    expect(attached).toEqual([2]);
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});

describe("TA-233: English after an interpolation is counted", () => {
  it("TA-233: the audit's rule takes lowercase words trailing a {value}, and not TypeScript", () => {
    const audit = readFileSync("scripts/i18n-audit.ts", "utf8");
    const source = /for \(const m of code\.matchAll\((\/\\\}\[ \\t\]\+[^\n]*?\/g)\)\)/.exec(audit)?.[1];
    expect(source, "rule 1e is in the audit").toBeDefined();
    const rule = new Function(`return ${source}`)() as RegExp;
    const taken = (code: string) => [...code.matchAll(rule)].map((m) => m[1]!.trim()).filter((t) => /\s[a-z]/.test(t));
    expect(taken("<span>{counts.unmarked} not marked\n</span>")).toEqual(["not marked"]);
    expect(taken("const x = { a } as unknown as Array<string>;")).toEqual([]);
  });

  it("TA-233: the named literals are gone from the pages", () => {
    const literals: [string, RegExp][] = [
      ["src/app/(app)/parent/page.tsx", /\{childName\} was marked/],
      ["src/app/(app)/reports/[studentMembershipId]/page.tsx", /% overall|\}\s*to\{" "\}/],
      ["src/app/(app)/teacher/assignments/page.tsx", /\{graded\} of \{roster\} marked|to mark\n/],
      ["src/app/(app)/teacher/classes/[classId]/page.tsx", / of \{roster\.length\} marked/],
      ["src/app/(app)/teacher/classes/page.tsx", /\} student\n|Room \$\{|of work set/],
      ["src/app/(app)/teacher/assignments/[assignmentId]/gradebook.tsx", /unsaved change\{|not a usable number/],
      ["src/app/(app)/student/profile/badges.tsx", /\{badge\.progress\.current\} of \{/],
    ];
    for (const [file, literal] of literals) expect(readFileSync(file, "utf8"), file).not.toMatch(literal);
  });
});
