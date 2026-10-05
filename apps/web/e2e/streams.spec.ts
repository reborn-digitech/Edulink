import { createHash, randomBytes } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { presetUnion, type StreamCode } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { contextFor } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * THE REGISTRAR'S HOME PER STREAM (5 Oct 2026): at each ZZ college — Vidya
 * (arts, science, commerce), Shastri (engineering) and an architecture college
 * this file makes and removes, whose studios and juries are not built — the
 * home draws exactly the preset's tiles in the preset's order and no other
 * stream's, the header carries the streams' chip, and the banner says what is
 * not kept yet only where a stream has such records. Sessions are minted with
 * userAgent "e2e" (global-setup's teardown removes them); the architecture
 * college and its registrar are ZZ rows removed in afterAll.
 */
const streamName = (code: StreamCode) => en.streams[code].name;
type College = { label: string; schoolId: string; streams: StreamCode[]; cookie: string };
const colleges: College[] = [];
const made: { schoolId?: string; userId?: string } = {};

async function mint(userId: string, schoolId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole: "ADMIN", userAgent: "e2e", expiresAt: new Date(Date.now() + 3_600_000) } });
  return `edulink_session=${token}`;
}

test.beforeAll(async () => {
  for (const [label, slug, email] of [["Vidya", "zz-vidya-college", "zz.cadmin@zz.test"], ["Shastri", "zz-shastri-college", "zz.cadmin.s@zz.test"]] as const) {
    const school = await db.school.findUnique({ where: { slug }, select: { id: true, streamsJson: true } });
    const member = school ? await db.membership.findFirst({ where: { schoolId: school.id, role: "ADMIN", status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true } }) : null;
    if (school && member) colleges.push({ label, schoolId: school.id, streams: JSON.parse(school.streamsJson) as StreamCode[], cookie: await mint(member.userId, school.id) });
  }
  const stamp = randomBytes(3).toString("hex");
  const streams: StreamCode[] = ["ARCHITECTURE"];
  const school = await db.school.create({
    data: { name: "ZZ E2E Architecture College", slug: `zz-e2e-arch-${stamp}`, code: `ZZEA-${stamp.toUpperCase()}`, kind: "COLLEGE", isTestFixture: true, contactEmail: `zz-e2e-arch-${stamp}@zz.test`, timezone: "Asia/Kolkata", streamsJson: JSON.stringify(streams) },
    select: { id: true },
  });
  made.schoolId = school.id;
  await db.schoolModule.createMany({ data: presetUnion(streams).modulesOn.map((module) => ({ schoolId: school.id, module })) });
  const user = await db.user.create({ data: { email: `zz.e2e.arch.${stamp}@zz.test`, name: "ZZ E2E Registrar", isTestFixture: true, passwordHash: `!${randomBytes(24).toString("hex")}`, emailVerifiedAt: new Date() }, select: { id: true } });
  made.userId = user.id;
  await db.membership.create({ data: { userId: user.id, schoolId: school.id, role: "ADMIN", status: "ACTIVE" } });
  colleges.push({ label: "Architecture", schoolId: school.id, streams, cookie: await mint(user.id, school.id) });
});

test.afterAll(async () => {
  if (made.userId) await db.session.deleteMany({ where: { userId: made.userId } });
  if (made.schoolId) await db.school.delete({ where: { id: made.schoolId } });
  if (made.userId) await db.user.delete({ where: { id: made.userId } });
  await db.$disconnect();
});

for (const label of ["Vidya", "Shastri", "Architecture"]) {
  test(`the registrar's home at ZZ ${label} draws its streams' tiles, its chip and its banner`, async ({ browser, baseURL }) => {
    const college = colleges.find((c) => c.label === label);
    test.skip(!college, `ZZ ${label} is not in this database (npm run zz:fixtures)`);
    const { streams, cookie } = college!;
    const preset = presetUnion(streams);
    const context = await contextFor(browser, cookie, { viewport: { width: 1280, height: 900 }, theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    const response = await page.goto("/admin", { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);
    // Exactly the preset's tiles, in its order: none of another stream's.
    const tiles = await page.locator("[data-testid=stream-home] li[data-tile]").evaluateAll((els) => els.map((el) => el.getAttribute("data-tile")));
    expect(tiles).toEqual([...preset.homeTiles]);
    // The chip beside the college's name in the rail.
    await expect(page.locator("aside [data-testid=stream-chip]")).toHaveText(new RegExp(streams.map(streamName).join(" · ")));
    // The not-built banner only where a stream keeps records the app does not yet.
    const banner = page.locator("[data-testid=streams-coming]");
    if (preset.notBuilt.length) {
      await expect(banner).toBeVisible();
      for (const code of preset.notBuilt) await expect(banner).toContainText(en.streams.notBuilt[code]);
    } else {
      await expect(banner).toHaveCount(0);
    }
    // A built tile whose module is on carries its figure line; a coming one says so.
    for (const tile of preset.homeTiles) {
      const li = page.locator(`[data-testid=stream-home] li[data-tile=${tile}]`);
      if (["clinicalPostings", "studios", "fieldWork"].includes(tile)) await expect(li).toContainText(en.streams.tileComing);
    }
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await seriousViolations(page, `${label} /admin`)).toEqual([]);
    await context.close();
  });
}

test("the chip and the tiles hold at phone width with no sideways scroll or small target", async ({ browser, baseURL }) => {
  const college = colleges.find((c) => c.label === "Vidya") ?? colleges[0];
  test.skip(!college, "no ZZ college");
  const context = await contextFor(browser, college!.cookie, { viewport: { width: 390, height: 844 }, theme: "dark", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page.locator("header [data-testid=stream-chip]")).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(await smallTargets(page)).toEqual([]);
  await context.close();
});
