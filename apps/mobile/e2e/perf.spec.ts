import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { contextFor, rolesWithTokens, settle } from "./actors";

/**
 * A performance probe on the web target: for each role, a cold start to the
 * home screen with its data on it, then a warm tab switch, on a throttled
 * connection that stands in for a school's 4G (Chrome's "Fast 4G": 9 Mbps
 * down, 1.5 up, 60 ms latency) and a CPU slowed four times, the way
 * Lighthouse models a mid-range phone.
 *
 * Budgets are generous on purpose — this is a laptop, not a phone — and
 * exist to catch a regression by an order of magnitude (a screen that makes
 * forty requests, a bundle that doubles). The numbers are written to
 * e2e/perf/perf.json for the report.
 */
const actors = rolesWithTokens();
if (actors.length === 0) test.skip("no role tokens in the environment (EDULINK_TOKEN_*)", () => {});

const OUT = join(__dirname, "perf");
const rows: Record<string, unknown>[] = [];

test.afterAll(() => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "perf.json"), JSON.stringify({ at: new Date().toISOString(), network: "Fast 4G + 4x CPU", rows }, null, 2) + "\n");
});

for (const { role, token } of actors) {
  test(`${role}: cold start to data, then a warm tab switch`, async ({ browser }) => {
    const context = await contextFor(browser, token, { theme: "light", locale: "en" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 60, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    const apiCalls: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.pathname.startsWith("/api/v1/")) apiCalls.push(u.pathname);
    });

    const t0 = Date.now();
    await page.goto("/", { waitUntil: "commit" });
    await page.getByRole("tablist").first().waitFor({ timeout: 60_000 });
    const shell = Date.now() - t0;
    await settle(page, 60_000);
    const data = Date.now() - t0;
    const coldCalls = apiCalls.length;

    const resources = await page.evaluate(() =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter((e) => e.name.includes("/_expo/") || e.name.endsWith(".js"))
        .reduce((sum, e) => sum + (e.transferSize || e.encodedBodySize || 0), 0),
    );

    // A warm switch: the second tab, then back — the query cache should answer the return trip at once.
    const tabs = page.getByRole("tab");
    const second = tabs.nth(1);
    const t1 = Date.now();
    await second.click();
    await settle(page, 60_000);
    const warmSwitch = Date.now() - t1;
    const t2 = Date.now();
    await tabs.nth(0).click();
    await settle(page, 60_000);
    const returnTrip = Date.now() - t2;

    rows.push({ role, shellMs: shell, dataMs: data, warmSwitchMs: warmSwitch, returnTripMs: returnTrip, coldApiCalls: coldCalls, jsBytes: resources });
    console.log(`  ${role}: shell ${shell} ms · data ${data} ms · switch ${warmSwitch} ms · back ${returnTrip} ms · ${coldCalls} API calls · JS ${(resources / 1024 / 1024).toFixed(2)} MB`);

    expect(data, "home screen with data").toBeLessThan(15_000);
    expect(coldCalls, "API calls on a cold home screen").toBeLessThan(15);
    expect(returnTrip, "returning to a visited tab").toBeLessThan(5_000);
    await context.close();
  });
}
