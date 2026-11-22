import { test, expect } from "@playwright/test";
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

    const before = await read();
    if (before.premiumTeachers) {
      const off = await context.request.put(door, { data: { premium: { teachers: false }, expect: asRead(before) } });
      expect(off.ok(), await off.text()).toBe(true);
    }

    const page = await context.newPage();
    await page.goto(`/root/${school!.id}`, { waitUntil: "networkidle" });
    const teachers = page.getByTestId("card-premium-teachers");
    await expect(teachers).toHaveAttribute("aria-checked", "false");
    await teachers.click();
    // The toast with its Undo: the switch is held, not yet written.
    await expect(page.getByTestId("toast").getByRole("button", { name: "Undo" })).toBeVisible();
    // Left the way a reload, the address bar or a closed tab leaves it, well within the toast's ten seconds.
    await page.goto("about:blank");
    await expect.poll(async () => (await read()).premiumTeachers, { timeout: 8_000, intervals: [250, 500, 1_000] }).toBe(true);
    await context.close();
  });
});
