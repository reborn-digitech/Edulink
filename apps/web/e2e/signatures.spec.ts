import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

/**
 * Signatures and the seal, in a browser: the admin signs in the box and the
 * signature is kept; the head finds the fixture's certificate waiting,
 * opens it, reads it and signs it there, and the picture is on the paper;
 * the template editor offers who signs each line. ZZ Northgate's rows are
 * put back as the fixtures made them when the suite ends.
 */
const all = sessions();
const admin = all.ADMIN!;
const head = all.PRINCIPAL!;
const DESK = { width: 1280, height: 900 };

let before: { signatures: { membershipId: string | null; kind: string; png: Uint8Array<ArrayBuffer> }[]; papers: { id: string; status: string; signerUserId: string | null; signerName: string | null; png: Uint8Array<ArrayBuffer> | null; decidedAt: Date | null }[] } | null = null;
const northgate = () => db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true } });

test.beforeAll(async () => {
  const school = await northgate();
  before = {
    signatures: (await db.signatureImage.findMany({ where: { schoolId: school.id } })).map((s) => ({ membershipId: s.membershipId, kind: s.kind, png: new Uint8Array(s.png) })),
    papers: (await db.paperSignature.findMany({ where: { schoolId: school.id } })).map((p) => ({ id: p.id, status: p.status, signerUserId: p.signerUserId, signerName: p.signerName, png: p.png ? new Uint8Array(p.png) : null, decidedAt: p.decidedAt })),
  };
});

test.afterAll(async () => {
  const school = await northgate();
  if (before) {
    await db.signatureImage.deleteMany({ where: { schoolId: school.id } });
    for (const s of before.signatures) await db.signatureImage.create({ data: { schoolId: school.id, kind: s.kind, membershipId: s.membershipId, png: s.png } });
    for (const p of before.papers) await db.paperSignature.update({ where: { id: p.id }, data: { status: p.status, signerUserId: p.signerUserId, signerName: p.signerName, png: p.png, decidedAt: p.decidedAt } });
  }
  await db.$disconnect();
});

test("the admin signs in the box, with a mouse at a desk and a finger on a phone, and the signature is kept", async ({ browser, baseURL }) => {
  for (const viewport of [DESK, VIEWPORTS.iphone]) {
    const context = await contextFor(browser, admin.cookie, { viewport, theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    expect((await page.goto("/admin/signatures", { waitUntil: "networkidle" }))?.status()).toBe(200);
    const mine = page.getByTestId("signature-mine");
    const was = await mine.getByTestId("signature-mine-current").getAttribute("src");
    // Nothing to save until something is signed.
    await expect(mine.getByTestId("signature-mine-save")).toBeDisabled();
    const pad = mine.getByTestId("signature-mine-pad");
    // To the middle of the window: at its edge the box lies under the header or the bottom bar, which take the press.
    await pad.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const box = (await pad.boundingBox())!;
    const at = (fx: number, fy: number) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });
    const stroke = [at(0.15, 0.7), at(0.3, 0.3), at(0.45, 0.7), at(0.6, 0.3), at(0.8, 0.6)];
    await page.mouse.move(stroke[0]!.x, stroke[0]!.y);
    await page.mouse.down();
    for (const p of stroke.slice(1)) await page.mouse.move(p.x, p.y, { steps: 5 });
    await page.mouse.up();
    await expect(mine.getByTestId("signature-mine-save")).toBeEnabled();
    await mine.getByTestId("signature-mine-save").click();
    await expect(page.getByText("Signature saved")).toBeVisible();
    // What is kept is a PNG and not what was there before.
    await expect.poll(async () => mine.getByTestId("signature-mine-current").getAttribute("src")).not.toBe(was);
    expect(await mine.getByTestId("signature-mine-current").getAttribute("src")).toMatch(/^data:image\/png;base64,/);
    await context.close();
  }
});

test("the head finds a paper waiting, opens it, signs it there, and the picture is on the paper", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, head.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/signatures", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const waiting = page.getByTestId("signatures-waiting");
  await expect(waiting.getByText("1 waiting")).toBeVisible();
  // The head reads the seal and does not set it.
  await expect(page.getByText("Only a school admin sets the seal.")).toBeVisible();
  await expect(page.getByTestId("signature-seal")).toHaveCount(0);
  await waiting.getByRole("link", { name: "Open the paper" }).click();
  await page.waitForURL(/\/certificates\//);
  // The admin's signature and the seal are drawn; the head's line says it waits.
  await expect(page.getByTestId("certificate-signature-left")).toBeVisible();
  await expect(page.getByTestId("certificate-seal")).toBeVisible();
  await expect(page.getByTestId("certificate-signature-right-pending")).toHaveText("Awaiting signature");
  await page.getByTestId("signature-waits").getByTestId("sign-approve").click();
  await expect(page.getByTestId("certificate-signature-right")).toBeVisible();
  await expect(page.getByTestId("signature-waits")).toHaveCount(0);
  await page.screenshot({ path: "e2e/results/certificate-signed.png", fullPage: true });
  await page.goto("/admin/signatures", { waitUntil: "networkidle" });
  await expect(page.getByText("Nothing is waiting for you.")).toBeVisible();
  await context.close();
});

test("the admin cannot sign the head's line, and the paper says so to nobody but the head", async ({ browser, baseURL }) => {
  const school = await northgate();
  const pending = await db.paperSignature.findFirst({ where: { schoolId: school.id, role: "PRINCIPAL", slot: "RIGHT" }, select: { id: true, paperId: true } });
  test.skip(!pending, "no fixture signature — run npm run zz:fixtures");
  await db.paperSignature.update({ where: { id: pending!.id }, data: { status: "PENDING", png: null, signerUserId: null, signerName: null, decidedAt: null } });
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto(`/certificates/${pending!.paperId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("certificate-signature-right-pending")).toBeVisible();
  await expect(page.getByTestId("signature-waits")).toHaveCount(0);
  await expect(page.getByTestId("sign-approve")).toHaveCount(0);
  await context.close();
});

test("a template says who signs each line and whether the seal is printed, and the preview shows where", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/certificates/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const preview = page.getByTestId("preview-signatures");
  await expect(preview.getByText("signature")).toHaveCount(0);
  await page.getByTestId("template-signerRight").selectOption("PRINCIPAL");
  await expect(preview.getByText("signature")).toHaveCount(1);
  await page.getByTestId("template-signerLeft").selectOption("ADMIN");
  await page.getByLabel("Print the school seal").check();
  await expect(preview.getByText("signature")).toHaveCount(2);
  await expect(preview.getByText("seal")).toHaveCount(1);
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  for (const [who, actor] of [["ADMIN", admin], ["PRINCIPAL", head]] as const) {
    test(`the signatures page · ${who} · ${theme}`, async ({ browser, baseURL }) => {
      const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
      const page = await context.newPage();
      expect((await page.goto("/admin/signatures", { waitUntil: "networkidle" }))?.status()).toBe(200);
      expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
      expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
      expect(await seriousViolations(page, `signatures ${who} ${theme}`)).toEqual([]);
      await context.close();
    });
  }
}
