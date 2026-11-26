import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
test.afterAll(async () => {
  await db.$disconnect();
});
const all = sessions();

type Terms = { termsSetAt: string | null; premiumStudents: boolean; premiumTeachers: boolean; subscription: unknown; premium: unknown; note: string | null };
const asRead = (t: Terms) => ({ termsSetAt: t.termsSetAt, premiumStudents: t.premiumStudents, premiumTeachers: t.premiumTeachers, subscription: t.subscription, premium: t.premium, note: t.note });
const STAMP = Date.now();

/** A school's terms door, read and switched through the operator's own requests. */
function termsDoor(context: BrowserContext, schoolId: string) {
  const door = `/api/v1/operator/schools/${schoolId}/terms`;
  const read = async (): Promise<Terms> => (await (await context.request.get(door)).json()) as Terms;
  /** The switches named, set as given, against the terms as read now; nothing sent where they already stand so. */
  const set = async (premium: { students?: boolean; teachers?: boolean }) => {
    const now = await settled(read);
    const moves = Object.fromEntries(Object.entries(premium).filter(([role, on]) => (role === "students" ? now.premiumStudents : now.premiumTeachers) !== on));
    if (Object.keys(moves).length === 0) return;
    const res = await context.request.put(door, { data: { premium: moves, expect: asRead(now) } });
    expect(res.ok(), await res.text()).toBe(true);
  };
  return { read, set };
}

/** The toast still offering Undo, if any is on the page: pressed, so a write still held is never sent. It never throws, so a restore after it always runs. */
async function undoIfShown(page: Page | null) {
  if (!page || page.isClosed()) return;
  const undo = page.getByTestId("toast").getByRole("button", { name: "Undo" });
  for (const button of await undo.all().catch(() => [])) if (await button.isVisible().catch(() => false)) await button.click({ timeout: 1_000 }).catch(() => undefined);
}

/** Polls `read` every half second, up to five seconds, until two reads in a row agree: a write still on its way has landed. */
async function settled<T>(read: () => Promise<T>): Promise<T> {
  let last = JSON.stringify(await read());
  for (const until = Date.now() + 5_000; Date.now() < until; ) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const now = JSON.stringify(await read());
    if (now === last) break;
    last = now;
  }
  return JSON.parse(last) as T;
}

/** How long a write the page sent as it went is given to land: this file's polls and quiet() wait this long. */
const LANDS_WITHIN = 8_000;

/** Reads every half second for the whole window and answers the last read: a write the page sent as it went, landing within the window, has landed by then. */
async function quiet<T>(read: () => Promise<T>, ms = LANDS_WITHIN): Promise<T> {
  let last = await read();
  for (const until = Date.now() + ms; Date.now() < until; ) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    last = await read();
  }
  return last;
}

/** Before a restore: Undo whatever is still held, leave the page, so that a write the Undo missed goes now as it would with the page, and wait out its landing. */
async function leaveAndWait(page: Page | null, read: () => Promise<unknown>): Promise<void> {
  await undoIfShown(page);
  await page?.goto("about:blank").catch(() => undefined);
  await quiet(read);
}

/** ZZ Premium School as the fixture holds it, or the reason a case cannot run on it. */
async function premiumSchool() {
  const school = await db.school.findUnique({ where: { slug: "zz-premium-school" }, select: { id: true, name: true, isTestFixture: true, termsSetAt: true, subscriptionStatus: true, subscriptionDueAt: true, subscriptionPaidAt: true, subscriptionPaidRef: true } });
  if (!school?.isTestFixture) return { skip: "no ZZ Premium School (run zz:fixtures)" } as const;
  if (school.termsSetAt) return { skip: "ZZ Premium School's terms are set, which the fixture does not hold (run zz:fixtures)" } as const;
  return { school } as const;
}

/**
 * A write held behind a toast's Undo outlives the page (the coordinating session's C5 point 1, and its walk of 22 November
 * 2026, which found the switch still off nine seconds after the page was left by the address bar). The console sends what is
 * held to the operator's own door as a keepalive request when the page is hidden or left, since a server action is an
 * ordinary request the browser drops with the page; vitest cannot see a page go (tests/pending-writes.test.ts holds the rest).
 * On ZZ Premium School only (zz:fixtures; both premium switches on): Teachers is put off through the door, pressed on in the
 * card, and the page left within the toast's ten seconds; the door then reads it on, which is how the fixture stands.
 */
test.describe("OPERATOR · a held write outlives the page", () => {
  test("the card's Teachers switch pressed on, then the page left within the toast: the switch is on", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const school = await db.school.findUnique({ where: { slug: "zz-premium-school" }, select: { id: true, isTestFixture: true } });
    test.skip(!school?.isTestFixture, "no ZZ Premium School (run zz:fixtures)");
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en" }, baseURL!);
    const door = `/api/v1/operator/schools/${school!.id}/terms`;
    const read = async (): Promise<Terms> => (await (await context.request.get(door)).json()) as Terms;
    const terms = termsDoor(context, school!.id);
    let page: Page | null = null;
    try {
      const before = await read();
      if (before.premiumTeachers) {
        const off = await context.request.put(door, { data: { premium: { teachers: false }, expect: asRead(before) } });
        expect(off.ok(), await off.text()).toBe(true);
      }

      page = await context.newPage();
      await page.goto(`/root/${school!.id}`, { waitUntil: "networkidle" });
      const teachers = page.getByTestId("card-premium-teachers");
      await expect(teachers).toHaveAttribute("aria-checked", "false");
      await teachers.click();
      // The toast with its Undo: the switch is held, not yet written.
      await expect(page.getByTestId("toast").getByRole("button", { name: "Undo" })).toBeVisible();
      // Left the way a reload, the address bar or a closed tab leaves it, well within the toast's ten seconds.
      await page.goto("about:blank");
      await expect.poll(async () => (await read()).premiumTeachers, { timeout: LANDS_WITHIN, intervals: [250, 500, 1_000] }).toBe(true);
    } finally {
      // As the fixture holds it, both switches on, once anything still held has gone and landed.
      try {
        await leaveAndWait(page, read);
        await terms.set({ students: true, teachers: true });
      } finally {
        await context.close();
      }
    }
  });
});

/**
 * A held write sent because the console unmounted within the app (a link followed) is sent by its action at once, and its
 * toast goes with its Undo, as after an early send: an Undo there could not take it back.
 */
test.describe("OPERATOR · a held write sent as the console is left within the app", () => {
  test("the card's Teachers switch pressed on, then the Dashboard link followed: the toast and its Undo go at once, and the switch is on", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en" }, baseURL!);
    const terms = termsDoor(context, school.id);
    let page: Page | null = null;
    try {
      await terms.set({ teachers: false });
      page = await context.newPage();
      await page.goto(`/root/${school.id}`, { waitUntil: "networkidle" });
      const teachers = page.getByTestId("card-premium-teachers");
      await expect(teachers).toHaveAttribute("aria-checked", "false");
      const pressedAt = Date.now();
      await teachers.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      const sentence = (await held.locator("p").first().textContent())!.trim();
      await page.getByRole("main").getByRole("link", { name: "Dashboard" }).click();
      // The pointer off the toast: a pointer resting on it stops its clock.
      await page.mouse.move(1, 1);
      await page.waitForURL((url) => url.pathname === "/root");
      await expect(page.getByTestId("toast").filter({ hasText: sentence })).toHaveCount(0, { timeout: 1_000 });
      // Gone because the write was sent, not because its ten seconds ran out.
      expect(Date.now() - pressedAt).toBeLessThan(8_000);
      await expect.poll(async () => (await terms.read()).premiumTeachers, { timeout: LANDS_WITHIN, intervals: [250, 500, 1_000] }).toBe(true);
    } finally {
      // As the fixture holds it: both switches on, once anything still held has gone and landed.
      try {
        await leaveAndWait(page, terms.read);
        await terms.set({ students: true, teachers: true });
      } finally {
        await context.close();
      }
    }
  });
});

/**
 * A held write whose commit gets no clear answer (the action rejects: the request was lost, or its answer could not be read)
 * is said in a pinned toast naming the school, and what it held is let go. A payment's sheet opens again with what was typed
 * and the standing it was sent with, so where it did land, its preview is refused as already recorded and Save waits.
 */
test.describe("OPERATOR · a held write with no clear answer", () => {
  test("Record payment whose answer is lost after it landed: said, its sheet open again refused as already recorded with Save disabled, still so for a preview asked after the card is drawn again, one payment recorded", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    // The fixture holds no renewal, no paid day and no reference (npm run zz:fixtures puts them back): each is put back to none afterwards.
    expect(
      { status: school.subscriptionStatus, due: school.subscriptionDueAt, paid: school.subscriptionPaidAt, ref: school.subscriptionPaidRef },
      "ZZ Premium School's subscription is not as the fixture holds it (Active, no renewal, no paid day, no reference): run npm run zz:fixtures",
    ).toEqual({ status: "ACTIVE", due: null, paid: null, ref: null });
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en", serviceWorkers: "block" }, baseURL!);
    const row = () => db.school.findUniqueOrThrow({ where: { id: school.id }, select: { subscriptionStatus: true, subscriptionStartsAt: true, subscriptionDueAt: true, subscriptionPaidAt: true, subscriptionPaidRef: true } });
    let page: Page | null = null;
    try {
      page = await context.newPage();
      await page.goto(`/root/${school.id}`, { waitUntil: "networkidle" });
      await page.getByTestId("record-payment").click();
      const sheet = page.getByTestId("payment-sheet");
      await sheet.getByLabel("Amount, before GST (₹)").fill("1000");
      await sheet.getByLabel("Reference (optional)").fill(`ZZ e2e ${STAMP}`);
      const save = sheet.getByRole("button", { name: "Record payment" });
      await expect(save).toBeEnabled({ timeout: 8_000 });
      await save.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      // From here the first server action's request is sent on and its answer lost; every later one goes through.
      let lost = false;
      await context.route("**/*", async (route) => {
        const request = route.request();
        if (!lost && request.method() === "POST" && request.headers()["next-action"]) {
          lost = true;
          await route.fetch();
          return route.abort();
        }
        return route.fallback();
      });
      const since = new Date();
      await held.getByRole("button", { name: "Dismiss notification" }).click();
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      await expect(sheet.getByText("That payment is already recorded: the renewal has moved on.")).toBeVisible({ timeout: 8_000 });
      // The sheet stays on the standing it was opened on, and says so in a line of its own under the server's sentence.
      await expect(sheet.getByTestId("payment-pinned")).toHaveText(
        "This sheet keeps the subscription as it stood when the sheet was opened, so it cannot be saved against what stands now. Look at the school's subscription first: if this payment is already there, nothing more is needed. If it is not, close this sheet and open Record payment again; what was typed is not kept.",
      );
      await expect(save).toBeDisabled();
      // The card drawn again from the server, the payment having landed: the corrections card, keyed on the record, shows the
      // moved renewal. A preview asked after that, on an edit, is still on the standing the sheet was opened on (the fixture
      // has no renewal), refused as already recorded, and Save stays disabled. This step asks a preview only: no save, no write.
      const landed = await row();
      // The card's date fields are drawn as the operator types them, dd/mm/yyyy.
      const [year, month, day] = landed.subscriptionDueAt!.toISOString().slice(0, 10).split("-");
      await expect(page.getByLabel("Due on", { exact: true })).toHaveValue(`${day}/${month}/${year}`, { timeout: LANDS_WITHIN });
      const edited = `ZZ e2e ${STAMP} after the redraw`;
      const asked = page.waitForRequest((request) => request.method() === "POST" && Boolean(request.headers()["next-action"]) && (request.postData() ?? "").includes(edited));
      await sheet.getByLabel("Reference (optional)").fill(edited);
      const preview = await asked;
      expect(preview.postData() ?? "", "the preview asked after the redraw carries the standing the sheet was opened on").toContain('"fromDueAt":null');
      await preview.response();
      await expect(sheet.getByText("That payment is already recorded: the renewal has moved on.")).toBeVisible();
      await expect(save).toBeDisabled();
      const logged = await db.auditLog.findMany({ where: { action: "superuser.school.subscription", schoolId: null, targetId: school.id, createdAt: { gt: since } }, select: { meta: true } });
      expect(logged.filter((r) => (JSON.parse(String(r.meta)) as { kind?: string }).kind === "payment")).toHaveLength(1);
    } finally {
      try {
        await leaveAndWait(page, row);
        const now = await row();
        if (now.subscriptionDueAt || now.subscriptionPaidAt || now.subscriptionPaidRef) {
          // Through the corrections door, with the standing as read at this point (a stale one is refused).
          const day = (value: string | Date | null) => (value ? new Date(value).toISOString().slice(0, 10) : null);
          const standing = { status: now.subscriptionStatus, startsAt: day(now.subscriptionStartsAt), dueAt: day(now.subscriptionDueAt), paidAt: day(now.subscriptionPaidAt) };
          const res = await context.request.post(`/api/v1/operator/schools/${school.id}/subscription`, { data: { dueAt: null, paidAt: null, paidRef: null, reason: `ZZ e2e: the fixture put back ${STAMP}`, expect: standing } });
          expect(res.ok(), await res.text()).toBe(true);
        }
      } finally {
        await context.close();
      }
    }
  });

  test("the card's Teachers switch whose commit gets no answer: said in a pinned toast naming the school, and the switch let go", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en", serviceWorkers: "block" }, baseURL!);
    const terms = termsDoor(context, school.id);
    let page: Page | null = null;
    try {
      await terms.set({ teachers: false });
      page = await context.newPage();
      await page.goto(`/root/${school.id}`, { waitUntil: "networkidle" });
      const teachers = page.getByTestId("card-premium-teachers");
      await teachers.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      // From here every server action's request is lost on the way.
      await context.route("**/*", (route) => (route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.fallback()));
      await held.getByRole("button", { name: "Dismiss notification" }).click();
      await expect(page.getByTestId("toast").filter({ hasText: "No clear answer came back from the server for ZZ Premium School" })).toBeVisible({ timeout: 8_000 });
      await expect(teachers).toBeEnabled();
      // Drawn from what the card holds: the write never reached the server.
      await expect(teachers).toHaveAttribute("aria-checked", "false");
    } finally {
      try {
        await leaveAndWait(page, terms.read);
        await terms.set({ students: true, teachers: true });
      } finally {
        await context.close();
      }
    }
  });
});

/** While a write is held behind its toast, the console's own controls for that school wait, and a waiting switch stays drawn. */
test.describe("OPERATOR · the controls wait while a write is held", () => {
  test("the card: a sheet's save held behind its toast holds the switches; its Undo writes nothing", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    const columns = { termsSetAt: true, subscriptionPricePaise: true, subscriptionDiscountBps: true, premiumPricePaise: true, premiumDiscountBps: true, termsNote: true } as const;
    const asFound = await db.school.findUniqueOrThrow({ where: { id: school.id }, select: columns });
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en" }, baseURL!);
    const terms = termsDoor(context, school.id);
    let page: Page | null = null;
    try {
      expect((await terms.read()).termsSetAt).toBeNull();
      page = await context.newPage();
      await page.goto(`/root/${school.id}`, { waitUntil: "networkidle" });
      await page.getByTestId("change-subscription").click();
      const sheet = page.getByTestId("subscription-sheet");
      await sheet.getByLabel("Reason", { exact: true }).fill(`ZZ e2e ${STAMP}`);
      const save = sheet.getByRole("button", { name: "Save", exact: true });
      await expect(save).toBeEnabled({ timeout: 8_000 });
      await save.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      await expect(page.getByTestId("card-premium-teachers")).toBeDisabled({ timeout: 2_000 });
      await held.getByRole("button", { name: "Undo" }).click();
      expect((await terms.read()).termsSetAt).toBeNull();
    } finally {
      // Undo whatever is still held; then leave the page, as this file makes a held write go, so that a write the Undo
      // missed goes out now rather than as the context closes; then read once the whole window for its landing has passed.
      try {
        await leaveAndWait(page, terms.read);
        const now = await terms.read();
        // No door unsets terms: the row's own columns go back as read before.
        if (now.termsSetAt !== null) await db.school.update({ where: { id: school.id }, data: asFound });
      } finally {
        await context.close();
      }
    }
  });

  test("the Schools tab: a row's switch held behind its toast, the row ticked: the bar's four acts wait; its Undo writes nothing", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en" }, baseURL!);
    const terms = termsDoor(context, school.id);
    let page: Page | null = null;
    try {
      await terms.set({ students: false });
      page = await context.newPage();
      await page.goto("/root/subscriptions", { waitUntil: "networkidle" });
      const students = page.getByTestId(`premium-students-${school.id}`);
      await expect(students).toHaveAttribute("aria-checked", "false");
      await students.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      await page.getByRole("checkbox", { name: `Choose ${school.name}` }).check();
      const bar = page.getByTestId("subscriptions-bulk");
      for (const name of ["Premium for students on", "Premium for teachers on", "Switch premium off…", "Put on our prices…"]) await expect(bar.getByRole("button", { name }), name).toBeDisabled({ timeout: 2_000 });
      await held.getByRole("button", { name: "Undo" }).click();
    } finally {
      try {
        await leaveAndWait(page, terms.read);
        await terms.set({ students: true, teachers: true });
      } finally {
        await context.close();
      }
    }
  });

  test("the Schools tab: a row's switch held behind its toast stays drawn as set while another row's sheet writes and the list is drawn again", async ({ browser, baseURL }) => {
    const actor = all.OPERATOR;
    test.skip(!actor, "no operator actor");
    const found = await premiumSchool();
    test.skip("skip" in found, "skip" in found ? found.skip : "");
    const school = found.school!;
    // The other row: ZZ Southbank School, premium off in the fixture; switched on through its door for the case, off through
    // its own row's sheet during it, and put back as found.
    const other = await db.school.findUnique({ where: { slug: "zz-southbank-school" }, select: { id: true, isTestFixture: true, premiumStudents: true, premiumTeachers: true } });
    test.skip(!other?.isTestFixture, "no ZZ Southbank School (run zz:fixtures)");
    test.skip(Boolean(other?.premiumStudents || other?.premiumTeachers), "ZZ Southbank School has premium on, which the fixture does not hold (run zz:fixtures)");
    const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en" }, baseURL!);
    const terms = termsDoor(context, school.id);
    const otherTerms = termsDoor(context, other!.id);
    let page: Page | null = null;
    try {
      await terms.set({ teachers: false });
      await otherTerms.set({ students: true });
      page = await context.newPage();
      await page.goto("/root/subscriptions", { waitUntil: "networkidle" });
      const first = page.getByTestId(`premium-teachers-${school.id}`);
      const pressedAt = Date.now();
      await first.click();
      const held = page.getByTestId("toast").filter({ has: page.getByRole("button", { name: "Undo" }) });
      await expect(held).toBeVisible();
      await expect(first).toHaveAttribute("aria-checked", "true");
      // The other row's Students off through its sheet: written at once, and the list drawn again from the server.
      const second = page.getByTestId(`premium-students-${other!.id}`);
      await second.click();
      const offSheet = page.getByTestId("premium-off-sheet");
      await offSheet.getByRole("button", { name: "Confirm" }).click();
      await expect(offSheet).toBeHidden();
      // The redraw has landed when the other row reads off: nothing held draws it.
      await expect(second).toHaveAttribute("aria-checked", "false", { timeout: 8_000 });
      await expect(first).toHaveAttribute("aria-checked", "true", { timeout: 1_000 });
      // Still held: the toast still offers Undo, well within its ten seconds.
      await expect(held).toBeVisible();
      expect(Date.now() - pressedAt).toBeLessThan(8_000);
      await held.getByRole("button", { name: "Undo" }).click();
    } finally {
      try {
        await leaveAndWait(page, terms.read);
        // Each school put back as the fixture holds it, the second whether or not the first's restore went through.
        try {
          await otherTerms.set({ students: false, teachers: false });
        } finally {
          await terms.set({ students: true, teachers: true });
        }
      } finally {
        await context.close();
      }
    }
  });
});
