import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { contextFor, LOCALES, settle, tokenFor, type Role } from "./actors";

/**
 * The store screenshots, produced by the CI in each language the way the
 * plan asks: six screens, at the App Store's 6.7-inch size (1290 × 2796) and
 * a Play phone size (1080 × 2400), light theme, as the person who uses each
 * screen. They land in e2e/store/<locale>/<device>/<n>-<name>.png for the
 * listing (captions are in apps/mobile/store/listing.<locale>.md). A device
 * pixel ratio of 3 over a logical viewport gives the store's pixels without
 * changing the layout the phone shows.
 */
const DEVICES = {
  "iphone-6.7": { width: 430, height: 932, scale: 3 },
  "android-phone": { width: 360, height: 800, scale: 3 },
} as const;

const SHOTS: { name: string; role: Role; route: string }[] = [
  { name: "today", role: "TEACHER", route: "/" },
  { name: "register", role: "TEACHER", route: "/attendance" },
  { name: "marks", role: "TEACHER", route: "/marks" },
  { name: "overview", role: "PARENT", route: "/" },
  { name: "practice", role: "STUDENT", route: "/practice" },
  { name: "messages", role: "TEACHER", route: "/messages" },
];

function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function capture(page: Page, route: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await settle(page);
}

for (const locale of LOCALES) {
  for (const [device, size] of Object.entries(DEVICES)) {
    test.describe(`store · ${locale} · ${device}`, () => {
      SHOTS.forEach((shot, i) => {
        test(`${i + 1} ${shot.name}`, async ({ browser }) => {
          const token = tokenFor(shot.role);
          test.skip(!token, `no token for ${shot.role}`);
          const context = await contextFor(browser, token!, { theme: "light", locale, viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.scale });
          const page = await context.newPage();
          try {
            await capture(page, shot.route);
            const dir = join(__dirname, "store", locale, device);
            mkdirSync(dir, { recursive: true });
            const file = join(dir, `${i + 1}-${shot.name}.png`);
            await page.screenshot({ path: file, fullPage: false });
            expect(pngSize(file)).toEqual({ width: size.width * size.scale, height: size.height * size.scale });
          } finally {
            await context.close();
          }
        });
      });
    });
  }
}
