import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { hidePinned, overflow, screenshotWhereBaselined, seriousViolations, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * The pupil record, which the navigation sweep in axe.spec.ts reaches only
 * as it first draws. Three things it cannot see are opened here: the
 * family's form once "Ask for a change" is pressed, the office's page for
 * one pupil with a family's ask waiting and the box a decline opens, and the
 * pupil's page with the office's door to the record. Nothing is sent: the
 * suite presses what opens a form and never what submits one, so the
 * fixtures are as they were afterwards.
 *
 * And the guardian's record page at the four widths, in both themes and two
 * languages, measured as viewport.spec.ts measures its pages. The picture is
 * of the form alone: the cards above it carry what the sweep and a person
 * testing by hand leave waiting, and would differ from run to run.
 */
const all = sessions();
const parent = all.PARENT!;
const student = all.STUDENT!;
const admin = all.ADMIN!;
const principal = all.PRINCIPAL!;

async function preferLocale(email: string | undefined, locale: "en" | "hi"): Promise<void> {
  if (!email) return;
  const user = await db.user.findUnique({ where: { email }, select: { prefs: true } });
  if (!user) return;
  let prefs: Record<string, unknown> = {};
  try {
    prefs = JSON.parse(user.prefs) as Record<string, unknown>;
  } catch {
    prefs = {};
  }
  await db.user.update({ where: { email }, data: { prefs: JSON.stringify({ ...prefs, locale }) } });
}

test.afterAll(async () => {
  await db.$disconnect();
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`the record, opened · ${theme}`, () => {
    for (const [who, actor, path] of [["PARENT", parent, "/parent/record"], ["STUDENT", student, "/student/record"]] as const) {
      test(`${who} asks for a change`, async ({ browser, baseURL }) => {
        const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
        const page = await context.newPage();
        expect((await page.goto(path, { waitUntil: "networkidle" }))?.status()).toBe(200);
        // Read, not written: no save, and nothing to type in until the family asks.
        await expect(page.getByTestId("record-save")).toHaveCount(0);
        await expect(page.getByTestId("record-fatherName")).toBeDisabled();
        await page.getByTestId("record-ask").click();
        await expect(page.getByTestId("record-ask-box")).toBeVisible();
        await expect(page.getByTestId("record-fatherName")).toBeEnabled();
        await expect(page.getByTestId("record-category")).toBeEnabled();
        // The PEN and the enrolment's two are never the family's to ask about.
        for (const locked of ["record-penNumber", "record-rollNumber", "record-repeating"]) await expect(page.getByTestId(locked)).toBeDisabled();
        expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
        expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
        expect(await seriousViolations(page, `${who} ${theme} ${path} (asking)`)).toEqual([]);
        await context.close();
      });
    }

    for (const [who, actor] of [["ADMIN", admin], ["PRINCIPAL", principal]] as const) {
      test(`${who} decides a family's ask`, async ({ browser, baseURL }) => {
        test.skip(!actor.askedAboutPupilId, "no ask waiting in the fixtures — run npm run zz:fixtures");
        const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
        const page = await context.newPage();
        expect((await page.goto(`/admin/records/${actor.askedAboutPupilId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
        await expect(page.getByTestId("record-change-waiting")).toBeVisible();
        await expect(page.getByTestId("record-change-approve")).toBeVisible();
        expect(await seriousViolations(page, `${who} ${theme} the ask waiting`)).toEqual([]);
        await page.getByTestId("record-change-decline").click();
        await expect(page.getByTestId("record-change-decline-confirm")).toBeVisible();
        expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
        expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
        expect(await seriousViolations(page, `${who} ${theme} the decline box`)).toEqual([]);
        await context.close();
      });
    }

    test("the pupil's page gives the office the door to the record, and nobody else", async ({ browser, baseURL }) => {
      for (const [actor, door] of [[admin, 1], [principal, 1], [all.TEACHER!, 0], [parent, 0]] as const) {
        const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
        const page = await context.newPage();
        const response = await page.goto(`/people/${admin.pupilId}`, { waitUntil: "networkidle" });
        // A teacher who does not teach the pupil is refused the page itself, which is no door either.
        if (response?.status() === 200) {
          await expect(page.getByTestId("person-record")).toHaveCount(door);
          expect(await seriousViolations(page, `${actor.role} ${theme} the pupil's page`)).toEqual([]);
        } else expect(door, `${actor.role} was refused the pupil's page`).toBe(0);
        await context.close();
      }
    });
  });
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of ["light", "dark"] as const) {
    for (const locale of ["en", "hi"] as const) {
      test(`guardian-record · ${vpName} · ${theme} · ${locale}`, async ({ browser, baseURL }, info) => {
        await preferLocale(parent.email, locale);
        const context = await contextFor(browser, parent.cookie, { viewport, theme, locale }, baseURL!);
        const page = await context.newPage();
        expect((await page.goto(`/parent/record?child=${parent.pupilId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
        expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
        expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
        await hidePinned(page);
        await screenshotWhereBaselined(page.getByTestId("pupil-record-form"), `guardian-record-${vpName}-${theme}-${locale}.png`, info);
        await context.close();
        await preferLocale(parent.email, "en");
      });
    }
  }
}
