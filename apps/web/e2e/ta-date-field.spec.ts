import { test, expect, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { sessions, VIEWPORTS } from "./actors";

/**
 * TA-017, in a browser: a day picked with the calendar button on the leave
 * form is shown in the box and is not what the form sends (testing analysis
 * of 13 November 2026; the component's own test is tests/ta-date-field.test.ts).
 *
 * The e2e teacher opens /teacher/leave, where the form holds its first and
 * last day in its own state (form.tsx: `value={from} onChange={(e) =>
 * setFrom(e.target.value)}`), both starting at today. Two days ten and eleven
 * days ahead are picked, the reason typed, Send pressed, and what the form
 * asks the server to save is read off the request.
 *
 * NOTHING IS WRITTEN. Every request that is not a GET is read and refused in
 * the browser, so the leave action never reaches the server and no
 * LeaveRequest row is made; the fixture teacher's page is as it was.
 *
 * The control types both days, the path that works: what is typed is sent.
 * The second test plays the picker's part itself, the way a browser does it:
 * the value arrives in the hidden native input underneath the page's script
 * and `input` then `change` fire. The third opens the browser's own picker
 * with a real press of the calendar button and chooses a day with the
 * keyboard; where this browser's picker cannot be driven that way it says so
 * and is skipped, never failed. The two ⚠ tests fail while the defect stands.
 */
const teacher = sessions().TEACHER!;

const iso = (shown: string) => shown.split("/").reverse().join("-");
const shownAs = (key: string) => key.split("-").reverse().join("/");
function daysAfter(key: string, days: number): string {
  const at = new Date(`${key}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/**
 * The teacher's browser, as actors.ts `contextFor` makes it (the minted session under both cookie names, English, phone
 * width, the event stream refused), with one difference: no service worker may register. On a development server there
 * is none to register; on a production build this keeps every request the page's own, so the routes below see them all.
 */
async function teacherContext(browser: Browser, baseURL: string): Promise<BrowserContext> {
  const url = new URL(baseURL);
  const [name, value] = teacher.cookie.split("=") as [string, string];
  const context = await browser.newContext({ viewport: VIEWPORTS.iphone, colorScheme: "light", locale: "en-IN", reducedMotion: "reduce", isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await context.addCookies([
    { name, value, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "edulink_locale", value: "en", domain: url.hostname, path: "/", sameSite: "Lax" },
    { name: `__Host-${name}`, value, domain: url.hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  await context.route("**/api/v1/events", (route) => route.abort("connectionrefused"));
  return context;
}

/** The teacher's context, with every write read and refused before it leaves the browser. */
async function readOnly(context: BrowserContext): Promise<{ posted: string[] }> {
  const posted: string[] = [];
  await context.route("**/*", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") return route.fallback();
    posted.push(request.postData() ?? "");
    return route.abort("failed");
  });
  return { posted };
}

async function openForm(page: Page): Promise<Locator> {
  expect((await page.goto("/teacher/leave", { waitUntil: "networkidle" }))?.status()).toBe(200);
  if (await page.getByTestId("leave-open").isVisible()) await page.getByTestId("leave-open").click();
  const form = page.getByTestId("leave-form");
  await expect(form).toBeVisible();
  return form;
}

/** What the form asked the server to save: the action's argument, read from the refused request. */
async function sentDays(page: Page, posted: string[]): Promise<{ fromDateKey: string | null; toDateKey: string | null }> {
  await page.getByTestId("leave-reason").fill("ZZ e2e TA-017: this request is refused in the browser and never sent");
  await page.getByTestId("leave-send").click();
  await expect.poll(() => posted.some((body) => body.includes("fromDateKey")), { timeout: 15_000 }).toBe(true);
  const body = posted.find((entry) => entry.includes("fromDateKey"))!;
  return {
    fromDateKey: /"fromDateKey":"(\d{4}-\d{2}-\d{2})"/.exec(body)?.[1] ?? null,
    toDateKey: /"toDateKey":"(\d{4}-\d{2}-\d{2})"/.exec(body)?.[1] ?? null,
  };
}

test("control: the days TYPED in the boxes of the leave form are the days the form sends", async ({ browser, baseURL }) => {
  const context = await teacherContext(browser, baseURL!);
  const { posted } = await readOnly(context);
  const page = await context.newPage();
  await openForm(page);
  const from = page.getByTestId("leave-from");
  const to = page.getByTestId("leave-to");
  const today = iso(await from.inputValue());
  const first = daysAfter(today, 10);
  const last = daysAfter(today, 11);

  await from.fill(shownAs(first));
  await to.fill(shownAs(last));

  const sent = await sentDays(page, posted);
  console.log(`TA-017 (control, typed): today ${today}; typed ${shownAs(first)} to ${shownAs(last)}; the form sent ${JSON.stringify(sent)}`);
  expect(sent).toEqual({ fromDateKey: first, toDateKey: last });
  await context.close();
});

test("⚠ TA-017: the days PICKED with the calendar on the leave form are the days the form sends", async ({ browser, baseURL }) => {
  const context = await teacherContext(browser, baseURL!);
  // The native picker is the browser's own window; here its opening is only noted, and its writing is played below.
  await context.addInitScript(() => {
    const opened: string[] = [];
    (window as unknown as { __pickerOpened: string[] }).__pickerOpened = opened;
    HTMLInputElement.prototype.showPicker = function showPicker(this: HTMLInputElement) {
      opened.push(this.type);
    };
  });
  const { posted } = await readOnly(context);
  const page = await context.newPage();
  const form = await openForm(page);

  const from = page.getByTestId("leave-from");
  const to = page.getByTestId("leave-to");
  const today = iso(await from.inputValue());
  expect(today, "the form starts on today").toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(iso(await to.inputValue())).toBe(today);
  const first = daysAfter(today, 10);
  const last = daysAfter(today, 11);

  // The calendar button beside each box opens the picker of the hidden native input.
  const calendars = form.getByRole("button", { name: "Open the calendar" });
  await expect(calendars).toHaveCount(2);
  await calendars.nth(0).click();
  await calendars.nth(1).click();
  expect(await page.evaluate(() => (window as unknown as { __pickerOpened: string[] }).__pickerOpened)).toEqual(["date", "date"]);

  // The picker writes the chosen day into that input: the value changes underneath the page's script, then input and change fire.
  const natives = form.locator('input[type="date"]');
  await expect(natives).toHaveCount(2);
  for (const [index, day] of [[0, first], [1, last]] as const) {
    await natives.nth(index).evaluate((input: HTMLInputElement, value: string) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, day);
  }

  // The boxes show the picked days. This part works, and it is why nobody sees the fault.
  await expect(from).toHaveValue(shownAs(first));
  await expect(to).toHaveValue(shownAs(last));

  // What is shown is what must be sent.
  const sent = await sentDays(page, posted);
  console.log(`TA-017 (played picker): today ${today}; shown ${shownAs(first)} to ${shownAs(last)}; the form sent ${JSON.stringify(sent)}`);
  expect(sent, `the boxes show ${shownAs(first)} and ${shownAs(last)}; the form's own state kept today (${today})`).toEqual({ fromDateKey: first, toDateKey: last });
  await context.close();
});

test("⚠ TA-017: the browser's own picker, opened with the calendar button and a day chosen with the keyboard", async ({ browser, baseURL }) => {
  const context = await teacherContext(browser, baseURL!);
  // The real showPicker, with a note of how each call ended.
  await context.addInitScript(() => {
    const calls: string[] = [];
    (window as unknown as { __pickerCalls: string[] }).__pickerCalls = calls;
    const real = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function showPicker(this: HTMLInputElement) {
      try {
        real.call(this);
        calls.push(`opened:${this.type}`);
      } catch (error) {
        calls.push(`threw:${(error as Error).name}`);
      }
    };
  });
  const { posted } = await readOnly(context);
  const page = await context.newPage();
  const form = await openForm(page);
  const from = page.getByTestId("leave-from");
  const today = iso(await from.inputValue());
  const native = form.locator('input[type="date"]').first();

  // A real press: showPicker needs one, and it is called on the visually hidden input.
  await form.getByRole("button", { name: "Open the calendar" }).first().click();
  const calls = await page.evaluate(() => (window as unknown as { __pickerCalls: string[] }).__pickerCalls);
  console.log(`TA-017 (native picker): showPicker on the hidden input: ${JSON.stringify(calls)}`);
  // The calendar popup takes the keys while it is open: one day on, then Enter to choose it.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  const picked = await native.inputValue();
  console.log(`TA-017 (native picker): after ArrowRight and Enter the hidden input holds ${JSON.stringify(picked)} and the box shows ${JSON.stringify(await from.inputValue())}`);
  test.skip(calls[0] !== "opened:date" || picked === today || picked === "", `this browser's date picker could not be driven by the keyboard (showPicker ${JSON.stringify(calls)}, the input still ${JSON.stringify(picked)}); the played picker above stands`);

  // The picker chose a day by itself: the box shows it, and it is what must be sent.
  await expect(from).toHaveValue(shownAs(picked));
  const sent = await sentDays(page, posted);
  console.log(`TA-017 (native picker): the form sent ${JSON.stringify(sent)}`);
  expect(sent.fromDateKey, `the picker chose ${picked}, the box shows it, and the form sent its own state`).toBe(picked);
  await context.close();
});
