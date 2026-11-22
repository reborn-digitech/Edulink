import { test, expect, type BrowserContext, type Page, type Request } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { OFFER_START, operatorOnboardBodySchema } from "@edulink/contracts";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { ONBOARD_FORMS, TERMS_FIELDS, daysOn, onboardFormBody, typedDay, type OnboardFormName } from "./onboard-forms";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
test.afterAll(async () => {
  await db.$disconnect();
});
const all = sessions();
/**
 * The form's sentence when a request is not answered. Its alert is read narrowed by this text: every App Router page also
 * carries Next's route announcer, a role="alert" in an open shadow root that role locators reach, so an unfiltered alert
 * locator meets two elements and a strict assertion throws on a correct form (the coordinating session's read of 02ec52be, D1).
 */
const NOT_REACHED = "The server could not be reached, so it is not known whether the school was made.";
const STAMP = Date.now();

/** Today in a zone, as the form starts it. */
const todayIn = (zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const kolkataToday = () => todayIn("Asia/Kolkata");
/** A zone whose today is not Kolkata's at this moment: Honolulu is behind until 15:30 IST, Kiritimati ahead from then. */
const otherDayZone = () => ["Pacific/Honolulu", "Pacific/Kiritimati"].find((zone) => todayIn(zone) !== kolkataToday())!;

/**
 * A server action's request body as React encodes it (encodeReply): a JSON array of the action's arguments, a value left
 * undefined written "$undefined" and a leading "$" doubled; the first argument is the body.
 */
function decodeAction(raw: string | null): Record<string, unknown> {
  if (!raw) throw new Error("a POST with no body");
  const revive = (value: unknown): unknown => {
    if (typeof value === "string") return value === "$undefined" ? undefined : value.startsWith("$$") ? value.slice(1) : value;
    if (Array.isArray(value)) return value.map(revive);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .map(([key, inner]) => [key, revive(inner)] as const)
          .filter(([, inner]) => inner !== undefined),
      );
    return value;
  };
  const args = JSON.parse(raw) as unknown[];
  return revive(args[0]) as Record<string, unknown>;
}

type Post = { request: Request; answered: boolean; aborted: boolean; failed: boolean };

/**
 * Every POST the page makes, and from the moment `block()` is called every request that is not GET or HEAD aborted before it
 * leaves the browser (the coordinating session's capture trial: on the context, with service workers blocked, so nothing goes
 * round the route). Others fall back to the context's own routes (contextFor refuses the event stream).
 */
async function watchPosts(context: BrowserContext, page: Page) {
  const posts: Post[] = [];
  let blocking = false;
  await context.route("**/*", (route) => {
    const method = route.request().method();
    if (blocking && method !== "GET" && method !== "HEAD") {
      const post = posts.find((p) => p.request === route.request());
      if (post) post.aborted = true;
      return route.abort();
    }
    return route.fallback();
  });
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push({ request, answered: false, aborted: false, failed: false });
  });
  page.on("requestfinished", (request) => {
    const post = posts.find((p) => p.request === request);
    if (post) post.answered = true;
  });
  page.on("requestfailed", (request) => {
    const post = posts.find((p) => p.request === request);
    if (post) post.failed = true;
  });
  return {
    posts,
    block: () => {
      blocking = true;
    },
  };
}

/**
 * Until no request the page has made is still out, read past the moment a change asks the summary (300 ms after it): the
 * coordinating session's review of 07d594f3, R1 (form (b) types the zone away and back, which asks the summary again for the
 * same terms while the old answer already frees the button, and that request must not be the one `block()` aborts) and L1
 * (what a press sends is read once it has all gone). A request ends answered, or failed (aborted after `block()`).
 */
async function settle(posts: Post[]) {
  const from = Date.now();
  await expect.poll(() => Date.now() - from >= 700 && posts.every((p) => p.answered || p.failed), { timeout: 10_000, intervals: [100] }).toBe(true);
}

/** The body of the last summary request answered so far (before `block()` every POST of the page is a summary's). */
function lastSummary(posts: Post[]): Record<string, unknown> {
  const post = [...posts].reverse().find((p) => p.answered && !(p.request.postData() ?? "").includes('"adminEmail"'));
  expect(post, "a summary answered").toBeTruthy();
  return decodeAction(post!.request.postData());
}

/**
 * Each form as an operator presses it (e2e/onboard-forms.ts): the chips, the dates, the boxes. After its last change each form
 * reads the button disabled, the summary shown no longer being for the terms as they stand (C7.1).
 */
async function press(page: Page, form: OnboardFormName, today: string, posts: Post[]) {
  const submit = page.getByRole("button", { name: "Onboard a school" });
  const students = page.getByLabel("Students", { exact: true });
  const change = page.getByRole("button", { name: "Change: Shalaghar subscription" });
  if (form === "school-opened") {
    if (!(await students.isChecked())) await students.check();
    await expect(submit).toBeDisabled();
    return;
  }
  if (await students.isChecked()) await students.uncheck();
  await change.click();
  if (form === "school-own-price-long") {
    await page.getByRole("button", { name: "₹150", exact: true }).click();
    await expect(submit).toBeDisabled();
    await page.getByLabel("Renews on").fill(typedDay(daysOn(today, 400)));
    const tick = page.getByLabel("More than a year, on purpose");
    await expect(tick).toBeVisible();
    // The summary asks a tick: the button waits for it, and goes once it is ticked.
    await expect(submit).toBeDisabled();
    await tick.check();
    await expect(submit).toBeEnabled();
    // C7.2: a start that moves by itself (here the timezone, to a zone on another day) clears the tick, and it stays cleared
    // when the start moves back.
    const zone = page.getByRole("textbox", { name: "Timezone (required)", exact: true });
    await zone.fill(otherDayZone());
    await expect(submit).toBeDisabled();
    await zone.fill("Asia/Kolkata");
    await expect(tick).toBeVisible();
    await expect(tick).not.toBeChecked();
    await expect(submit).toBeDisabled();
    await tick.check();
    return;
  }
  // (c): an own price and Teachers first, while the kind is still a school, so that the college's body shows them let go.
  await page.getByRole("button", { name: "₹150", exact: true }).click();
  await page.getByLabel("Teachers", { exact: true }).check();
  await page.getByLabel("Kind of institution").selectOption("COLLEGE");
  await page.locator('input[data-stream="ARTS"]').check();
  await page.getByRole("button", { name: /^Affiliated college at ₹199$/ }).click();
  // The kind change alone lets the own price and Teachers go (the review of 07d594f3, R2): read before the discount sets the
  // subscription's mode anew.
  await settle(posts);
  const atTier = lastSummary(posts) as { subscription: { mode: string }; premium: { teachers: boolean }; tier?: string };
  expect({ mode: atTier.subscription.mode, teachers: atTier.premium.teachers, tier: atTier.tier }).toEqual({ mode: "OURS", teachers: false, tier: "college-affiliated" });
  await page.getByRole("button", { name: "Add a discount" }).click();
  await page.getByRole("button", { name: "10 %", exact: true }).click();
  await expect(submit).toBeDisabled();
}

/**
 * The body the click on "Onboard a school" builds is the body whose summary the operator has just read (the coordinating
 * session's C7, 22 November 2026): the one link nothing else exercises, and the one that matters to money. It creates nothing
 * and invites nobody: from the moment before the click every POST the page makes is aborted, the school is ZZ-named with
 * every address @demo.relay.test, and the case ends by reading that no school of that name or web address exists. For each
 * of three forms the click's body parses with the onboard contract; its name, kind, zone, start, renewal or free months
 * (never both), subscription, premium and tier equal the last summary request the server answered; a tick is sent only
 * where that summary asked for it and the box was ticked; a school's plan is as chosen and a college sends none, no own
 * price and no teachers; the trial is off; and the body is the one tests/premium-onboard.test.ts saves (e2e/onboard-forms.ts),
 * whose save writes what the summary said. The button waits until the summary shown is for the terms as they stand and
 * every tick asked for is ticked, and a submit whose request does not come back leaves the form as typed with the sentence
 * that the server could not be reached; the press after it asks first whether that request made the school, and sends no
 * second save (C7.8).
 */
test.describe("OPERATOR · onboarding sends the terms its summary said, and this case saves nothing", () => {
  for (const form of ONBOARD_FORMS) {
    test(form.title, async ({ browser, baseURL }) => {
      const actor = all.OPERATOR;
      test.skip(!actor, "no operator actor");
      const today = kolkataToday();
      const offer = await db.schoolOffer.findUnique({ where: { id: "offer" }, select: { freeMonths: true } });
      const name = `ZZ Onboard Body ${STAMP} ${form.name}`;
      const contactEmail = `zz-onb-body-${form.name}-${STAMP}@demo.relay.test`;
      const adminEmail = `zz-onb-body-admin-${form.name}-${STAMP}@demo.relay.test`;
      const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.tablet, theme: "light", locale: "en", serviceWorkers: "block" }, baseURL!);
      const page = await context.newPage();
      const watch = await watchPosts(context, page);
      await page.goto("/root/onboard", { waitUntil: "networkidle" });
      const submit = page.getByRole("button", { name: "Onboard a school" });

      // A required field's accessible name carries "(required)" (the coordinating session's run of this case against a real page,
      // 22 November 2026, where the bare labels found nothing).
      await page.getByRole("textbox", { name: "Name (required)", exact: true }).fill(name);
      await page.getByRole("textbox", { name: "Contact email (required)", exact: true }).fill(contactEmail);
      await page.getByRole("textbox", { name: "Email (required)", exact: true }).fill(adminEmail);
      await press(page, form.name, today, watch.posts);
      // No summary request still out for the terms as they stand (R1), so the one the click is compared with is the last.
      await settle(watch.posts);
      await expect(page.getByTestId("onboard-summary")).toBeVisible();
      await expect(submit).toBeEnabled();

      // The ticks as the summary's answer asked them, read from what it drew, and as they stand.
      const tickOver = page.getByLabel("More than a year, on purpose");
      const tickDue = page.getByLabel("Due now", { exact: true });
      const sent0 = { over: (await tickOver.isVisible()) && (await tickOver.isChecked()), due: (await tickDue.isVisible()) && (await tickDue.isChecked()) };
      // The last summary request the server answered before the click (a summary's body names no first administrator);
      // then every request that is not GET or HEAD is aborted.
      const summary = [...watch.posts].reverse().find((p) => p.answered && !(p.request.postData() ?? "").includes('"adminEmail"'));
      expect(summary, "a summary answered before the click").toBeTruthy();
      watch.block();
      await submit.click();
      // The submit is the aborted request that names the first administrator (a dev server may post its overlay's own after).
      const isSubmit = (p: Post) => p.aborted && (p.request.postData() ?? "").includes('"adminEmail"');
      await expect.poll(() => watch.posts.some(isSubmit), { timeout: 5_000 }).toBe(true);
      const sent = watch.posts.find(isSubmit)!;
      expect(sent.answered, "the click's request never reached the server").toBe(false);
      // A request that does not come back leaves the form as typed, says the server could not be reached and to look for the
      // school before trying again, and frees the button (the capture trial found the error screen in the form's place).
      await expect(page.getByRole("alert").filter({ hasText: NOT_REACHED })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name (required)", exact: true })).toHaveValue(name);
      await expect(submit).toBeEnabled();

      // C7.8 (C7a point 1): the next press first asks whether the school that request would have made is there, a server
      // action of its own, told from the save and the summary by its next-action header (its body names the administrator's
      // address too), and sends no second save; its question aborted as well, the first sentence is said again.
      const actionOf = (p: Post) => p.request.headers()["next-action"];
      const saveAction = actionOf(sent);
      const summaryAction = actionOf(summary!);
      expect(saveAction, "the save's action").toBeTruthy();
      const pressed = watch.posts.length;
      await submit.click();
      const asked = (p: Post) => p.aborted && Boolean(actionOf(p)) && actionOf(p) !== saveAction && actionOf(p) !== summaryAction;
      await expect.poll(() => watch.posts.slice(pressed).some(asked), { timeout: 5_000 }).toBe(true);
      await expect(page.getByRole("alert").filter({ hasText: NOT_REACHED })).toBeVisible();
      await expect(submit).toBeEnabled();
      // Read once the press is over and all it sent has gone (L1): a save sent after the question failed would show here.
      await settle(watch.posts);
      expect(watch.posts.slice(pressed).filter((p) => actionOf(p) === saveAction), "no second request of the save's action").toHaveLength(0);

      const summarised = decodeAction(summary!.request.postData());
      const clicked = operatorOnboardBodySchema.parse(decodeAction(sent.request.postData())) as Record<string, unknown>;
      for (const field of TERMS_FIELDS) expect(clicked[field], field).toEqual(summarised[field]);
      expect([clicked.dueAt, clicked.freeMonths].filter((v) => v !== undefined), "a renewal or free months, never both").toHaveLength(1);
      // A tick is sent only where the summary's answer asked for it and the box was ticked (C7.1).
      expect(clicked.acceptOverAYear === true, "acceptOverAYear as asked and ticked").toBe(sent0.over);
      expect(clicked.acceptDueNow === true, "acceptDueNow as asked and ticked").toBe(sent0.due);
      const expected = onboardFormBody(form.name, { day: today, freeMonths: offer?.freeMonths ?? OFFER_START.freeMonths, name, contactEmail, adminEmail }) as Record<string, unknown>;
      for (const field of [...TERMS_FIELDS, "acceptOverAYear", "acceptDueNow"] as const) expect(clicked[field], `${field} as the saved body has it`).toEqual(expected[field]);
      expect(clicked.trial).toBe(false);
      if (form.name === "college-tier-discount") {
        expect(clicked.planId).toBeUndefined();
        expect((clicked.subscription as { mode: string }).mode).not.toBe("OWN_PRICE");
        expect((clicked.premium as { teachers: boolean }).teachers).toBe(false);
      } else expect(clicked.planId).toBeNull();

      await context.close();
      expect(await db.school.count({ where: { OR: [{ name }, { slug: { startsWith: `zz-onboard-body-${STAMP}` } }] } }), "nothing was made").toBe(0);
    });
  }
});
