import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * The certificate template editor, used as the office uses it: a detail of
 * the pupil is chosen from a list and never typed as a code, a row is made
 * by choosing what it prints, and the certificate is drawn beside the form
 * as it is written. What is SAVED is what was always saved — the text with
 * its double brackets — and the one template this suite saves is read back
 * from the database to prove it, then removed. It is named "ZZ e2e …" and
 * is ZZ Northgate's.
 */
const admin = sessions().ADMIN!;
const DESK = { width: 1280, height: 900 };
const NAME = `ZZ e2e template ${Date.now()}`;

test.afterAll(async () => {
  await db.certificateTemplate.deleteMany({ where: { name: { startsWith: "ZZ e2e template " }, school: { slug: "zz-northgate-school" } } });
  await db.$disconnect();
});

async function open(page: Page) {
  expect((await page.goto("/admin/certificates/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("certificate-template-editor")).toBeVisible();
}
const rows = (page: Page) => page.getByTestId("template-row");
const formText = (page: Page) => page.getByTestId("certificate-template-editor").innerText();

test("a detail is a word on a chip, and the certificate is drawn beside the form", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  // The preset's rows, each value a chip and none a code.
  expect(await rows(page).count()).toBeGreaterThan(5);
  expect(await formText(page)).not.toContain("[[");
  await expect(rows(page).first().getByTestId("row-value").locator("[data-token]")).toHaveText("Admission register number");
  // The old list of thirty-six at the foot of the form is gone.
  await expect(page.getByText("Placeholders", { exact: true })).toHaveCount(0);
  // The preview is the paper, filled for the sample pupil.
  await expect(page.getByTestId("preview-title")).toHaveText(/transfer certificate/i);
  await expect(page.getByTestId("preview-rows")).toContainText("GR-1042");
  await page.screenshot({ path: "e2e/results/template-editor-desk.png", fullPage: true });
  await context.close();
});

test("a row is made by choosing what it prints, labelled in the document's language", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  const before = await rows(page).count();

  await page.getByTestId("add-row").click();
  await expect(page.getByTestId("detail-picker")).toBeVisible();
  await expect(page.getByTestId("detail-search")).toBeFocused();
  await page.getByTestId("detail-search").fill("proceeding");
  await expect(page.getByTestId("detail-picker").locator("li")).toHaveCount(1);
  await page.screenshot({ path: "e2e/results/template-editor-picker.png" });
  await page.getByTestId("detail-record.destination").click();
  await expect(page.getByTestId("detail-picker")).toHaveCount(0);
  await expect(rows(page)).toHaveCount(before + 1);
  const added = rows(page).last();
  await expect(added.getByTestId("row-label")).toHaveValue("Proceeding to");
  await expect(added.getByTestId("row-value").locator("[data-token]")).toHaveAttribute("data-token", "record.destination");
  // The preview has the row, filled.
  await expect(page.getByTestId("preview-rows").locator("tr").last()).toContainText("Proceeding to");

  // The document in Marathi: the next row's label is Marathi, whatever language the reader reads.
  await page.getByTestId("template-language").selectOption("mr");
  await page.getByTestId("add-row").click();
  await page.getByTestId("detail-search").fill("blood");
  await expect(page.getByText("Nothing matches that.")).toBeVisible();
  await page.getByTestId("detail-search").fill("PEN");
  await page.getByTestId("detail-pupil.penNumber").click();
  const label = await rows(page).last().getByTestId("row-label").inputValue();
  expect(label).toMatch(/[ऀ-ॿ]|PEN/);
  expect(label).not.toBe("");

  // A row of the office's own, typed.
  await page.getByTestId("add-row").click();
  await page.getByTestId("detail-blank").click();
  await expect(rows(page)).toHaveCount(before + 3);
  await expect(rows(page).last().getByTestId("row-label")).toHaveValue("");
  await context.close();
});

test("a detail goes into the paragraph its own button belongs to, at the caret", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  const intro = page.getByTestId("template-intro");
  const outroBefore = await page.getByTestId("template-outro").innerText();
  await intro.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("ZZ certify that ");
  await page.getByTestId("insert-intro").click();
  await page.getByTestId("detail-pupil.name").click();
  await page.keyboard.type(" is a pupil here.");
  await expect(intro.locator("[data-token='pupil.name']")).toHaveText("Pupil's name");
  await expect(intro).toHaveText("ZZ certify that Pupil's name is a pupil here.");
  await expect(page.getByTestId("preview-intro")).toHaveText("ZZ certify that Aarav Apte is a pupil here.");
  // The other paragraph was not written in.
  expect(await page.getByTestId("template-outro").innerText()).toBe(outroBefore);
  await context.close();
});

test("a code the certificate cannot fill is named and stops the save; a good template saves what was always saved", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await open(page);
  await page.getByTestId("template-name").fill(NAME);
  const outro = page.getByTestId("template-outro");
  await outro.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Issued for [[pupil.nmae]] on [[issue.date]].");
  await page.getByTestId("template-name").click(); // leave the paragraph: what was typed becomes chips
  await expect(outro.locator("[data-token='issue.date']")).toHaveAttribute("data-known", "true");
  await expect(outro.locator("[data-token='pupil.nmae']")).toHaveAttribute("data-known", "false");
  await expect(page.getByTestId("unknown-details")).toContainText("[[pupil.nmae]]");
  await page.getByTestId("template-save").click();
  await expect(page.getByRole("alert").filter({ hasText: "[[pupil.nmae]]" })).toBeVisible();
  expect(await db.certificateTemplate.count({ where: { name: NAME } })).toBe(0);

  // Put right: the bad chip removed, a row added, saved.
  await outro.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Issued on ");
  await page.getByTestId("insert-outro").click();
  await page.getByTestId("detail-issue.date").click();
  await expect(page.getByTestId("unknown-details")).toHaveCount(0);
  await page.getByTestId("add-row").click();
  await page.getByTestId("detail-record.destination").click();
  await page.getByTestId("template-save").click();
  await page.waitForURL(/\/admin\/certificates$/);
  const saved = await db.certificateTemplate.findFirstOrThrow({ where: { name: NAME, school: { slug: "zz-northgate-school" } } });
  expect(saved.outro).toBe("Issued on [[issue.date]]");
  const savedRows = JSON.parse(saved.rowsJson) as { label: string; value: string }[];
  expect(savedRows.at(-1)).toEqual({ label: "Proceeding to", value: "[[record.destination]]" });
  expect(savedRows[0]).toEqual({ label: "Admission register number", value: "[[pupil.admissionNumber]]" });
  // Nothing of the editor's own leaks into what is stored.
  expect(JSON.stringify(savedRows) + saved.intro + saved.outro).not.toMatch(/​|<span|data-token/);

  // Opened again, it is the same template, in chips.
  expect((await page.goto(`/admin/certificates/${saved.id}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("template-outro")).toHaveText("Issued on Date of issue (figures)");
  expect(await formText(page)).not.toContain("[[");
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  for (const [vpName, viewport] of [["desk", DESK], ["iphone", VIEWPORTS.iphone]] as const) {
    test(`the editor with the list open · ${vpName} · ${theme}`, async ({ browser, baseURL }) => {
      const context = await contextFor(browser, admin.cookie, { viewport, theme, locale: "en" }, baseURL!);
      const page = await context.newPage();
      await open(page);
      expect(await seriousViolations(page, `template editor ${vpName} ${theme}`)).toEqual([]);
      await page.getByTestId("add-row").click();
      await expect(page.getByTestId("detail-picker")).toBeVisible();
      expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
      expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
      expect(await seriousViolations(page, `template editor ${vpName} ${theme}, list open`)).toEqual([]);
      if (theme === "light") await page.screenshot({ path: `e2e/results/template-editor-${vpName}-open.png`, fullPage: vpName === "iphone" });
      await context.close();
    });
  }
}
