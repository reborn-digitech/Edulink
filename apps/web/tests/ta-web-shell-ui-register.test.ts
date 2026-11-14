/**
 * The web register (src/app/(app)/teacher/attendance/register.tsx), testing analysis of 13 November 2026:
 *
 *   TA-216 — "Mark all present" was posted 0.7 s after the press while its Undo stayed five seconds, so an Undo after
 *            the save restored the screen and left the class marked present on the server.
 *   TA-217 — a refused save (401, 403, 422) took its batch out of the waiting marks before posting and never put it
 *            back, so Retry sent nothing and the next accepted save read "Saved" with the refused marks never stored.
 *   TA-230 — a pressed mark button drew white on the dark theme's pale status colours.
 *   TA-233 — "{n} not marked" and "{n} student(s)" were English literals the i18n gate could not see.
 *
 * WHAT RUNS HERE IS THE REAL COMPONENT inside the real ToastProvider (whose Undo and expiry are what TA-216 is about),
 * drawn by this app's react-dom in jsdom (tests/ta-web-shell-ui-dom.ts). The network is a stand-in fetch; the outbox
 * and the live stream are stood in for, because nothing here goes offline. No dictionary is loaded, so `t` answers
 * with the key, which is what the buttons are found by.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setUpDom, type Dom } from "./ta-web-shell-ui-dom";

const HERE = dirname(fileURLToPath(import.meta.url));
let minted = 0;
vi.mock("@/lib/offline-queue", () => ({
  enqueue: vi.fn(async () => "queued-id"),
  countQueued: vi.fn(async () => 0),
  newClientId: () => `zz-cid-${++minted}`,
}));
vi.mock("@/lib/use-events", () => ({ useEvents: () => undefined }));

type Posted = { classId: string; dateKey: string; marks: { studentMembershipId: string; status: string; clientId: string }[] };

let dom: Dom;
let Register: (typeof import("@/app/(app)/teacher/attendance/register"))["Register"];
let ToastProvider: (typeof import("@/components/ui/toast"))["ToastProvider"];
const answers: Response[] = [];
const network = vi.fn(async (input: unknown, init?: RequestInit) => {
  void input;
  void init;
  return answers.shift() ?? new Response(JSON.stringify({ applied: 0, rejected: [] }), { status: 200 });
});
const posts = () => network.mock.calls.filter(([, init]) => init?.method === "POST").map(([, init]) => JSON.parse(String(init!.body)) as Posted);

const ROSTER = ["zz-a", "zz-b", "zz-c"].map((id, i) => ({ membershipId: id, name: `ZZ Pupil ${i + 1}`, fullName: `ZZ Pupil ${i + 1}`, avatarKey: null, status: null, note: null }));

beforeAll(async () => {
  dom = await setUpDom("http://localhost:3000/teacher/attendance?classId=zz-class");
  vi.stubGlobal("fetch", network);
  ({ Register } = await import("@/app/(app)/teacher/attendance/register"));
  ({ ToastProvider } = await import("@/components/ui/toast"));
});

afterAll(() => {
  dom?.window.close();
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  network.mockClear();
  answers.length = 0;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  const { React } = dom;
  await dom.mount(
    React.createElement(ToastProvider, null, React.createElement(Register, { classId: "zz-class", className: "ZZ 6A", dateKey: "2026-11-14", dateLabel: "14 Nov", initialRoster: ROSTER })),
  );
});

afterEach(async () => {
  await dom.unmountAll();
  vi.useRealTimers();
});

const doc = () => dom.window.document;
const button = (text: string) => [...doc().querySelectorAll("button")].find((b) => b.textContent?.includes(text)) ?? null;
const row = (id: string) => doc().querySelector(`[data-testid="register-row"][data-membership-id="${id}"]`);
const pass = (ms: number) => dom.act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

describe("TA-216: Mark all present waits for its Undo", () => {
  it("TA-216: Undo pressed 1.5 s after the press takes it back and nothing was ever posted", async () => {
    await dom.click(button("teacher.markAllPresent"));
    expect(row("zz-a")?.getAttribute("data-status")).toBe("PRESENT");
    await pass(1500);
    expect(posts(), "the class was posted present while its Undo was still on the screen").toEqual([]);
    await dom.click(button("ui.undo"));
    expect(row("zz-a")?.getAttribute("data-status")).toBe("");
    await pass(20_000);
    expect(posts()).toEqual([]);
  });

  it("TA-216: once the toast goes without Undo the whole class is posted present, once", async () => {
    await dom.click(button("teacher.markAllPresent"));
    await pass(11_000);
    const sent = posts();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.marks.map((m) => [m.studentMembershipId, m.status])).toEqual([
      ["zz-a", "PRESENT"],
      ["zz-b", "PRESENT"],
      ["zz-c", "PRESENT"],
    ]);
  });

  it("TA-216: a pupil marked by hand while the Undo is up keeps the hand mark, and Undo leaves it alone", async () => {
    await dom.click(button("teacher.markAllPresent"));
    await dom.click(row("zz-b")!.querySelector('[data-testid="register-mark-ABSENT"]'));
    await pass(800);
    expect(posts().flatMap((p) => p.marks.map((m) => [m.studentMembershipId, m.status]))).toEqual([["zz-b", "ABSENT"]]);
    await dom.click(button("ui.undo"));
    expect(row("zz-a")?.getAttribute("data-status")).toBe("");
    expect(row("zz-b")?.getAttribute("data-status")).toBe("ABSENT");
    await pass(20_000);
    expect(posts()).toHaveLength(1);
  });

  it("TA-216: the page being hidden sends the held marks at once", async () => {
    await dom.click(button("teacher.markAllPresent"));
    await dom.act(() => {
      dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    });
    await pass(10);
    expect(posts()).toHaveLength(1);
    expect(posts()[0]!.marks).toHaveLength(3);
  });
});

describe("TA-217: a refused save waits to be sent again", () => {
  it("TA-217: Retry after a 401 sends the refused marks", async () => {
    answers.push(new Response(JSON.stringify({ error: "Sign in again." }), { status: 401 }));
    await dom.click(row("zz-a")!.querySelector('[data-testid="register-mark-PRESENT"]'));
    await dom.click(row("zz-b")!.querySelector('[data-testid="register-mark-ABSENT"]'));
    await pass(800);
    expect(posts()).toHaveLength(1);
    expect(doc().querySelector('[data-testid="register-sync"]')?.getAttribute("data-state")).toBe("error");
    await dom.click(button("teacher.retry"));
    await pass(10);
    const sent = posts();
    expect(sent, "Retry posted nothing").toHaveLength(2);
    expect(sent[1]!.marks.map((m) => [m.studentMembershipId, m.status])).toEqual([
      ["zz-a", "PRESENT"],
      ["zz-b", "ABSENT"],
    ]);
  });

  it("TA-217: the next mark after a refusal carries the refused ones with it, so Saved is true when it says so", async () => {
    answers.push(new Response(JSON.stringify({ error: "Not allowed." }), { status: 403 }));
    await dom.click(row("zz-a")!.querySelector('[data-testid="register-mark-PRESENT"]'));
    await pass(800);
    await dom.click(row("zz-c")!.querySelector('[data-testid="register-mark-LATE"]'));
    await pass(800);
    const sent = posts();
    expect(sent).toHaveLength(2);
    expect(sent[1]!.marks.map((m) => m.studentMembershipId).sort()).toEqual(["zz-a", "zz-c"]);
    expect(doc().querySelector('[data-testid="register-sync"]')?.getAttribute("data-state")).toBe("saved");
  });
});

describe("TA-221: a register drawn for a day that has passed", () => {
  it("TA-221: today's register shown on a later day (a stored copy) stops marking and offers a reload", async () => {
    await dom.unmountAll();
    const { React } = dom;
    // Drawn as today's on 13 November; the device's clock (and the school's day) is 14 November.
    vi.setSystemTime(new Date("2026-11-14T04:00:00Z"));
    await dom.mount(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(Register, { classId: "zz-class", className: "ZZ 6A", dateKey: "2026-11-13", dateLabel: "13 Nov", initialRoster: ROSTER, forToday: true, timezone: "Asia/Kolkata" }),
      ),
    );
    expect(doc().querySelector('[data-testid="register-stale"]')?.textContent).toContain("teacher.registerStale");
    const markButton = row("zz-a")!.querySelector<HTMLButtonElement>('[data-testid="register-mark-PRESENT"]')!;
    expect(markButton.disabled).toBe(true);
    expect(button("teacher.markAllPresent")).toBeNull();
    await dom.click(markButton);
    await pass(800);
    expect(posts()).toEqual([]);
  });

  it("TA-221: the same register on its own day marks as usual", async () => {
    await dom.unmountAll();
    const { React } = dom;
    vi.setSystemTime(new Date("2026-11-13T04:00:00Z"));
    await dom.mount(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(Register, { classId: "zz-class", className: "ZZ 6A", dateKey: "2026-11-13", dateLabel: "13 Nov", initialRoster: ROSTER, forToday: true, timezone: "Asia/Kolkata" }),
      ),
    );
    expect(doc().querySelector('[data-testid="register-stale"]')).toBeNull();
    await dom.click(row("zz-a")!.querySelector('[data-testid="register-mark-PRESENT"]'));
    await pass(800);
    expect(posts()).toHaveLength(1);
  });

  it("TA-221: the page passes whether the register was drawn as today's, and the school's timezone", () => {
    const page = readFileSync(resolve(HERE, "../src/app/(app)/teacher/attendance/page.tsx"), "utf8");
    expect(page).toMatch(/forToday=\{dateKey === today\}/);
    expect(page).toMatch(/timezone=\{school\.timezone\}/);
  });
});

describe("TA-230 and TA-233: what the register draws", () => {
  it("TA-230: a pressed mark draws its letter in the status-fill foreground token, not a fixed white", async () => {
    await dom.click(row("zz-a")!.querySelector('[data-testid="register-mark-PRESENT"]'));
    const pressed = row("zz-a")!.querySelector<HTMLElement>('[data-testid="register-mark-PRESENT"]')!;
    expect(pressed.getAttribute("aria-pressed")).toBe("true");
    // jsdom's style object drops a var() colour, so the drawn white is checked absent and the source read for the token.
    expect(pressed.style.color).not.toBe("rgb(255, 255, 255)");
    const source = readFileSync(resolve(HERE, "../src/app/(app)/teacher/attendance/register.tsx"), "utf8");
    expect(source).toMatch(/backgroundColor: `var\(--att-\$\{meta\.token\}\)`,[\s\S]{0,200}color: "var\(--status-fg\)"/);
  });

  it("TA-233: the counts in the summary bar are dictionary keys, not English literals", async () => {
    const bar = doc().querySelector(".sticky")!;
    expect(bar.textContent).not.toMatch(/not marked|students?\b/);
    expect(bar.textContent).toContain("teacher.notMarkedCount");
    expect(bar.textContent).toContain("teacher.studentsCount");
    const source = readFileSync(resolve(HERE, "../src/app/(app)/teacher/attendance/register.tsx"), "utf8");
    expect(source).not.toMatch(/\}\s*not marked/);
    expect(source).not.toMatch(/student\{roster/);
  });
});
