import { test, expect, type Page } from "@playwright/test";
import { API, contextFor, settle } from "./actors";

/**
 * The server operator and the content team on the web target. Neither has a
 * school role, so the app gives them a stack whose home is their console.
 * This proves the screens they open from it actually render (before the
 * stack, the layout drew the console in place of any navigator and every
 * pushed screen was silently ignored), that each has "‹ Back", and that
 * Back lands on the console again.
 *
 * Tokens: EDULINK_TOKEN_OPERATOR and EDULINK_TOKEN_APPADMIN, minted by the
 * web's `npm run zz:token -- OPERATOR` / `-- APPADMIN` on the ZZ fixture.
 */
const operator = process.env.EDULINK_TOKEN_OPERATOR?.trim() || null;
const contentTeam = process.env.EDULINK_TOKEN_APPADMIN?.trim() || null;

async function noAlert(page: Page) {
  await expect(page.getByRole("alert")).toHaveCount(0);
}

test.describe("the server operator", () => {
  test.skip(!operator, "EDULINK_TOKEN_OPERATOR is not set");

  test("the console is home; a school's page opens with Back, and Back returns to the console", async ({ browser, request }) => {
    const overview = await request.get(`${API}/api/v1/operator/overview`, { headers: { authorization: `Bearer ${operator}` } });
    expect(overview.status()).toBe(200);
    const body = (await overview.json()) as { schools: { id: string; name: string }[] };
    expect(body.schools.length).toBeGreaterThan(0);
    const school = body.schools[0]!;

    const context = await contextFor(browser, operator!, { theme: "light", locale: "en" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await noAlert(page);

    await page.goto(`/operator-school?schoolId=${encodeURIComponent(school.id)}`, { waitUntil: "networkidle" });
    await settle(page);
    await expect(page.getByText(school.name).first()).toBeVisible();
    await noAlert(page);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await settle(page);
    await expect(page).toHaveURL(/\/$/);
    await noAlert(page);

    await page.goto("/operator-new-school", { waitUntil: "networkidle" });
    await settle(page);
    await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible();
    await noAlert(page);
    await context.close();
  });
});

test.describe("the content team", () => {
  test.skip(!contentTeam, "EDULINK_TOKEN_APPADMIN is not set");

  test("the console is home; the question bank and a new competition open with Back", async ({ browser }) => {
    const context = await contextFor(browser, contentTeam!, { theme: "light", locale: "en" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await settle(page);
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await noAlert(page);

    for (const path of ["/question-bank", "/competition-new"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await settle(page);
      await expect(page.getByRole("button", { name: "Back", exact: true }), `${path} has Back`).toBeVisible();
      await noAlert(page);
    }
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await settle(page);
    await noAlert(page);
    await context.close();
  });
});
