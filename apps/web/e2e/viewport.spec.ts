import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * The language of a signed-in page is the ACCOUNT's preference, not the
 * cookie (src/lib/i18n/server.ts: the user row wins), so the Hindi half of
 * this matrix was rendering English until the actor's own preference was
 * set for the test — and set back to English after it. This file runs in one
 * worker, test after test (fullyParallel is off), so the two never overlap.
 */
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

/**
 * The viewport matrix: the four pages most likely to regress on a phone, at
 * four sizes, in both themes and two languages. Three assertions per cell:
 * nothing scrolls sideways, every interactive element is at least 44 px
 * tall, and the screenshot matches the platform's baseline (skipped where no
 * baseline exists yet; see README).
 */
const all = sessions();
const teacher = all.TEACHER!;
const admin = all.ADMIN!;

const PAGES = [
  { name: "register", actor: teacher, path: () => `/teacher/attendance?classId=${teacher.classId}` },
  { name: "marks", actor: teacher, path: () => `/teacher/exams?slotId=${teacher.slotId}&classId=${teacher.classId}` },
  { name: "timetable", actor: admin, path: () => "/admin/timetable" },
  { name: "people-toolbar", actor: admin, path: () => "/admin/people" },
];

for (const { name, actor, path } of PAGES) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of ["light", "dark"] as const) {
      for (const locale of ["en", "hi"] as const) {
        test(`${name} · ${vpName} · ${theme} · ${locale}`, async ({ browser, baseURL }) => {
          await preferLocale(actor.email, locale);
          const context = await contextFor(browser, actor.cookie, { viewport, theme, locale }, baseURL!);
          const page = await context.newPage();
          const response = await page.goto(path(), { waitUntil: "networkidle" });
          expect(response?.status()).toBe(200);

          expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);

          const small = await smallTargets(page);
          expect(small, "interactive elements under 44px").toEqual([]);

          await expect(page).toHaveScreenshot(`${name}-${vpName}-${theme}-${locale}.png`, { fullPage: false });
          await context.close();
          await preferLocale(actor.email, "en");
        });
      }
    }
  }
}
