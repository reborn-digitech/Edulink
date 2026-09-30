import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * The report card rules, used as the office uses them: the scale drawn as
 * it is typed and its gaps said, the weights with their totals, the areas
 * as a list, a sample card that follows the form, and ONE save that writes
 * the terms' shares with the rest. ZZ Northgate's rules and its terms'
 * shares are put back as they were when the suite ends.
 */
const admin = sessions().ADMIN!;
const head = sessions().PRINCIPAL!;
const DESK = { width: 1280, height: 900 };
let before: { config: string | null; terms: { id: string; weightPercent: number | null }[] } | null = null;
const northgate = () => db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true, reportCardConfig: true } });

test.beforeAll(async () => {
  const school = await northgate();
  before = { config: school.reportCardConfig, terms: await db.term.findMany({ where: { schoolId: school.id }, select: { id: true, weightPercent: true } }) };
});

test.afterAll(async () => {
  const school = await northgate();
  if (before) {
    await db.school.update({ where: { id: school.id }, data: { reportCardConfig: before.config } });
    for (const term of before.terms) await db.term.update({ where: { id: term.id }, data: { weightPercent: term.weightPercent } });
  }
  await db.$disconnect();
});

async function open(page: Page) {
  expect((await page.goto("/admin/report-cards", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("report-card-rules")).toBeVisible();
}
const grades = (page: Page) => page.getByTestId("preview-grade").allInnerTexts();

test("the scale is drawn as it is typed, a gap and two bands that start together are said, and the sample card follows", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  await page.getByTestId("rules-preset").selectOption({ index: 0 });
  const rows = page.getByTestId("band-row");
  const count = await rows.count();
  expect(count).toBeGreaterThan(2);
  await expect(page.getByTestId("scale-stretch")).toHaveCount(count);
  await expect(page.getByTestId("scale-note")).toHaveText("Every mark from 0 to 100 has a grade.");
  const was = await grades(page);
  expect(was).toHaveLength(5);

  // The top band is made to start higher than the best sample mark: that subject's grade changes on the card.
  await rows.first().getByTestId("band-min").fill("95");
  await expect.poll(() => grades(page)).not.toEqual(was);
  expect((await grades(page)).slice(1)).toEqual(was.slice(1));

  // The lowest band no longer starts at zero: the gap is drawn and said.
  await rows.last().getByTestId("band-min").fill("20");
  await expect(page.getByTestId("scale-gap")).toBeVisible();
  await expect(page.getByTestId("scale-problem")).toHaveText("Marks from 0 to 19 get no grade.");
  await expect(page.getByTestId("rules-tab-scale")).toContainText("something here needs correcting");

  // Two bands that start at the same mark.
  await rows.last().getByTestId("band-min").fill("0");
  await rows.nth(count - 2).getByTestId("band-min").fill("0");
  await expect(page.getByTestId("scale-problem")).toContainText("Two grades start at 0");
  await page.screenshot({ path: "e2e/results/report-card-rules-desk.png", fullPage: true });
  await context.close();
});

test("the weights carry their totals and what a total means", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  await page.getByTestId("rules-tab-weights").click();
  await page.getByTestId("kind-UNIT_TEST").fill("20");
  await page.getByTestId("kind-MID_TERM").fill("30");
  await page.getByTestId("kind-FINAL").fill("50");
  await expect(page.getByTestId("kind-total")).toHaveText("Total: 100");
  await expect(page.getByTestId("kind-warning")).toHaveCount(0);
  await page.getByTestId("kind-FINAL").fill("40");
  await expect(page.getByTestId("kind-total")).toHaveText("Total: 90");
  await expect(page.getByTestId("kind-warning")).toContainText("add up to 90, not 100");
  for (const k of ["UNIT_TEST", "MID_TERM", "FINAL"]) await page.getByTestId(`kind-${k}`).fill("0");
  await expect(page.getByText("All zero: a subject's percent is its marks over the maximum.")).toBeVisible();

  const terms = page.locator('[data-testid^="term-weight-"]');
  if ((await terms.count()) >= 2) {
    for (let i = 0; i < (await terms.count()); i++) await terms.nth(i).fill("");
    await expect(page.getByTestId("term-note")).toHaveText("Every term blank: equal shares.");
    await terms.first().fill("60");
    await expect(page.getByTestId("term-note")).toContainText("Give every term a share, or none.");
  }
  await context.close();
});

test("the areas are a list, and the layout's switches show and hide on the sample card", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  await page.getByTestId("rules-tab-co").click();
  const areas = page.getByTestId("area-row");
  const n = await areas.count();
  await page.getByTestId("add-area").click();
  await expect(areas).toHaveCount(n + 1);
  await areas.last().getByTestId("area-name").fill("ZZ Gardening");
  await page.getByTestId("rules-tab-layout").click();
  const co = page.getByTestId("layout-showCoScholastic");
  if (!(await co.isChecked())) await co.check();
  await expect(page.getByTestId("preview-co")).toContainText("ZZ Gardening");
  // Moved up one, it is one higher on the card.
  await page.getByTestId("rules-tab-co").click();
  if (n > 0) {
    await areas.last().getByRole("button", { name: /^Move up/ }).click();
    await expect(areas.nth(n - 1).getByTestId("area-name")).toHaveValue("ZZ Gardening");
  }
  await page.getByTestId("rules-tab-layout").click();
  await co.uncheck();
  await expect(page.getByTestId("preview-co")).toHaveCount(0);
  const remark = page.getByTestId("layout-showRemark");
  await remark.check();
  await expect(page.getByTestId("preview-remark")).toBeVisible();
  await remark.uncheck();
  await expect(page.getByTestId("preview-remark")).toHaveCount(0);
  await page.getByTestId("layout-headerNote").fill("ZZ Affiliated to the board, no. 1130042");
  await expect(page.getByTestId("preview-header-note")).toHaveText("ZZ Affiliated to the board, no. 1130042");
  await context.close();
});

test("one save writes the rules and the terms' shares together; a wrong number takes the office to its section", async ({ browser, baseURL }) => {
  const school = await northgate();
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  // A wrong weight, typed on a section the office then leaves.
  await page.getByTestId("rules-tab-weights").click();
  await page.getByTestId("kind-FINAL").fill("140");
  await page.getByTestId("rules-tab-layout").click();
  await page.getByTestId("rules-save").click();
  await expect(page.getByTestId("rules-tab-weights")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("alert").filter({ hasText: "A weight is a whole number from 0 to 100." }).first()).toBeVisible();

  await page.getByTestId("kind-UNIT_TEST").fill("25");
  await page.getByTestId("kind-MID_TERM").fill("25");
  await page.getByTestId("kind-FINAL").fill("50");
  const terms = page.locator('[data-testid^="term-weight-"]');
  const termCount = await terms.count();
  const shares = termCount === 0 ? [] : Array.from({ length: termCount }, (_, i) => (i === termCount - 1 ? 100 - Math.floor(100 / termCount) * (termCount - 1) : Math.floor(100 / termCount)));
  for (let i = 0; i < termCount; i++) await terms.nth(i).fill(String(shares[i]));
  await page.getByTestId("rules-tab-layout").click();
  await page.getByTestId("layout-headerNote").fill("ZZ e2e header");
  await page.getByTestId("rules-save").click();
  await expect(page.getByText("Report card rules saved.")).toBeVisible();

  const saved = JSON.parse((await northgate()).reportCardConfig ?? "{}") as { kindWeights?: Record<string, number>; layout?: { headerNote?: string | null } };
  expect(saved.kindWeights).toEqual({ UNIT_TEST: 25, MID_TERM: 25, FINAL: 50 });
  expect(saved.layout?.headerNote).toBe("ZZ e2e header");
  if (termCount > 0) {
    const stored = await db.term.findMany({ where: { schoolId: school.id, weightPercent: { not: null } }, select: { weightPercent: true } });
    expect(stored.map((s) => s.weightPercent).sort()).toEqual([...shares].sort());
  }
  await context.close();
});

test("the head reads the rules and the sample card, and changes nothing", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, head.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  await expect(page.getByTestId("office-sets-this")).toBeVisible();
  await expect(page.getByTestId("rules-save")).toHaveCount(0);
  await expect(page.getByTestId("rules-preset")).toBeDisabled();
  await expect(page.getByTestId("rules-preview")).toBeVisible();
  // The sections can still be read.
  await page.getByTestId("rules-tab-weights").click();
  await expect(page.getByTestId("kind-FINAL")).toBeDisabled();
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  for (const [vpName, viewport] of [["desk", DESK], ["iphone", VIEWPORTS.iphone]] as const) {
    test(`every section of the rules · ${vpName} · ${theme}`, async ({ browser, baseURL }) => {
      const context = await contextFor(browser, admin.cookie, { viewport, theme, locale: "en" }, baseURL!);
      const page = await context.newPage();
      await open(page);
      for (const section of ["scale", "co", "weights", "layout"]) {
        await page.getByTestId(`rules-tab-${section}`).click();
        expect(await overflow(page), `${section}: the page scrolls sideways`).toBeLessThanOrEqual(0);
        expect(await smallTargets(page), `${section}: interactive elements under 44px`).toEqual([]);
        expect(await seriousViolations(page, `rules ${section} ${vpName} ${theme}`)).toEqual([]);
      }
      await context.close();
    });
  }
}
