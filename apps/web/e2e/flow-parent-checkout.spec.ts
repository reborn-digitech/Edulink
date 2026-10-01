import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { all, currentYear, db, northgate, openAs, sound, STAMP } from "./flow-helpers";

/**
 * The guardian pays online, through the devbox gateway the dev server runs
 * (FEES_GATEWAY_TRANSPORT=devbox): the checkout panel shows the order
 * waiting and names /dev/payments, where the operator marks it paid
 * through the same settle door the real webhook uses; the guardian's panel,
 * polling, turns to "Paid. Receipt …" and the due is settled. Then the
 * other way: a second due claimed by UPI with a UTR, left waiting for the
 * office. ZZ Northgate is given a sealed test gateway account and a UPI id
 * for the run when it has none (both put back), and the two ZZ dues, their
 * payments and receipt go in the afterAll.
 */
const parent = all.PARENT!;
const operator = all.OPERATOR;
const ONLINE_PAISE = 150_000;
const UPI_PAISE = 90_000;
const UTR = `ZZE2EUPI${String(STAMP).slice(-9)}`;
/** The test gateway account's webhook secret, sealed into the school for the run; never a real one. */
const WEBHOOK_SECRET = "zz-e2e-webhook-never-real";
let schoolId: string;
let pupilId: string;
let onlineDemandId: string;
let upiDemandId: string;
let upiBefore: { feeUpiId: string | null; feeUpiPayee: string | null };
let gatewayMade = false;

/** secret-box.ts's seal, v2 with the bound string as associated data, so the server's `open` reads it. */
function seal(plain: string, bound: string): string {
  const key = Buffer.from(process.env.FEES_SECRET_KEY!.trim(), "base64");
  if (key.length !== 32) throw new Error("FEES_SECRET_KEY must decode to 32 bytes");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(bound, "utf8"));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v2", nonce.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

async function due(yearId: string, label: string, amountPaise: number) {
  const row = await db.feeDemand.create({
    data: { schoolId, studentMembershipId: pupilId, academicYearId: yearId, instalmentId: null, label, dueDate: new Date(Date.now() + 14 * 86_400_000), grossPaise: amountPaise, concessionPaise: 0, netPaise: amountPaise, linesJson: JSON.stringify([{ headId: "zz-e2e", code: "ZZE", name: "ZZ e2e activity", grossPaise: amountPaise, concessionPaise: 0 }]) },
    select: { id: true },
  });
  return row.id;
}

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  pupilId = parent.pupilId!;
  const year = await currentYear(schoolId);
  upiBefore = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { feeUpiId: true, feeUpiPayee: true } });
  if (!upiBefore.feeUpiId || !upiBefore.feeUpiPayee) await db.school.update({ where: { id: schoolId }, data: { feeUpiId: "zznorthgate@zzbank", feeUpiPayee: "ZZ Northgate School" } });
  if (!(await db.feeGatewayAccount.findUnique({ where: { schoolId }, select: { id: true } }))) {
    await db.feeGatewayAccount.create({ data: { schoolId, provider: "RAZORPAY", keyId: "rzp_test_zze2e000001", secretEnc: seal("zz-e2e-secret-never-real", `${schoolId}:secret`), webhookSecretEnc: seal(WEBHOOK_SECRET, `${schoolId}:webhook`), mode: "TEST" } });
    gatewayMade = true;
  }
  onlineDemandId = await due(year.id, `ZZ e2e online due ${STAMP}`, ONLINE_PAISE);
  upiDemandId = await due(year.id, `ZZ e2e UPI due ${STAMP}`, UPI_PAISE);
});

test.afterAll(async () => {
  const ids = [onlineDemandId, upiDemandId].filter(Boolean);
  if (ids.length) {
    const payments = await db.feePayment.findMany({ where: { schoolId, studentMembershipId: pupilId, OR: [...ids.map((id) => ({ intentJson: { contains: id } })), { allocations: { some: { demandId: { in: ids } } } }] }, select: { id: true } });
    for (const p of payments) await db.notification.deleteMany({ where: { schoolId, meta: { contains: p.id } } });
    await db.feePayment.deleteMany({ where: { schoolId, id: { in: payments.map((p) => p.id) } } });
    await db.feeDemand.deleteMany({ where: { schoolId, id: { in: ids } } });
  }
  if (gatewayMade) await db.feeGatewayAccount.deleteMany({ where: { schoolId, keyId: "rzp_test_zze2e000001" } });
  if (upiBefore && (!upiBefore.feeUpiId || !upiBefore.feeUpiPayee)) await db.school.update({ where: { id: schoolId }, data: { feeUpiId: upiBefore.feeUpiId, feeUpiPayee: upiBefore.feeUpiPayee } });
  await db.$disconnect();
});

/** Only one due ticked: "all" cleared first, then the one row. */
async function pickOnly(page: Page, demandId: string, total: string) {
  const allBox = page.getByTestId("fees-pay-chooser").locator("li").first().getByRole("checkbox");
  if (await allBox.isChecked()) await allBox.click();
  await page.locator(`[data-testid="fees-pay-demand"][data-demand-id="${demandId}"]`).getByRole("checkbox").check();
  await expect(page.getByTestId("fees-pay-total")).toContainText(total);
}

test("the guardian starts an online checkout, the devbox order is marked paid and the page shows the receipt; then a UPI claim on the other due", async ({ browser, baseURL }) => {
  test.skip(!operator, "no operator in the fixtures (zz.operator@zz.test) — the devbox page needs one");
  const family = await openAs(browser, parent, baseURL!);
  expect((await family.goto(`/parent/fees?child=${pupilId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await pickOnly(family, onlineDemandId, "1,500");

  // The order: an INITIATED payment with a devbox order id, and the panel saying where it is settled.
  await family.getByTestId("fees-pay-online").click();
  const panel = family.getByTestId("fees-online-flow");
  const waiting = panel.getByTestId("fees-online-devbox");
  await expect(waiting).toBeVisible({ timeout: 15_000 });
  await expect(waiting).toContainText("/dev/payments");
  await expect(panel).toContainText("1,500");
  const paymentId = (await waiting.getAttribute("data-payment-id"))!;
  const order = await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { schoolId: true, method: true, status: true, amountPaise: true, gatewayOrderId: true, intentJson: true } });
  expect(order).toMatchObject({ schoolId, method: "ONLINE", status: "INITIATED", amountPaise: ONLINE_PAISE });
  expect(order.gatewayOrderId).toMatch(/^order_devbox/);
  expect(JSON.parse(order.intentJson)).toEqual([onlineDemandId]);
  await sound(family, "PARENT the fees page with the order waiting");

  // The operator settles it through the devbox page — the webhook's own door.
  const dev = await openAs(browser, operator!, baseURL!);
  const dashboard = await dev.goto("/dev/payments", { waitUntil: "networkidle" });
  if (dashboard?.status() === 404) {
    // A production build has no devbox dashboard (dev/payments/page.tsx is
    // notFound under NODE_ENV production), and CI's server is one (run
    // 36871181377). The order is settled through the signed gateway webhook
    // instead — the door the dashboard's button stands in for — signed with
    // the test webhook secret this suite sealed into the school's account.
    expect(gatewayMade, "the webhook path needs the test gateway account this suite made").toBe(true);
    const body = JSON.stringify({
      event: "payment.captured",
      id: `evt_zze2e${STAMP}`,
      created_at: Math.floor(Date.now() / 1000),
      payload: { payment: { entity: { id: `pay_devbox${STAMP}`, order_id: order.gatewayOrderId, amount: ONLINE_PAISE, method: "upi" } } },
    });
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    const hook = await fetch(`${baseURL}/api/webhooks/razorpay/${schoolId}`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signature }, body });
    expect(hook.status).toBe(200);
    expect(await hook.json()).toMatchObject({ ok: true, outcome: "settled" });
  } else {
    expect(dashboard?.status()).toBe(200);
    const row = dev.locator(`[data-testid="dev-payment"][data-payment-id="${paymentId}"]`);
    await expect(row).toContainText(order.gatewayOrderId!);
    await row.getByTestId("dev-payment-paid").click();
    await dev.waitForURL((url) => url.searchParams.get("outcome") === "settled", { waitUntil: "networkidle" });
    await expect(dev.getByTestId("dev-payments-outcome")).toContainText("settled");
    await expect(dev.locator(`[data-testid="dev-payment"][data-payment-id="${paymentId}"]`)).toHaveCount(0);
    await sound(dev, "OPERATOR the devbox page after settling");
  }

  // The guardian's panel, polling every two seconds, turns to paid with the serial; the due is settled.
  const paid = panel.getByTestId("fees-online-paid");
  await expect(paid).toBeVisible({ timeout: 30_000 });
  const settled = await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true, gatewayPaymentId: true, receipt: { select: { id: true, serial: true } }, allocations: { select: { demandId: true, amountPaise: true } } } });
  expect(settled.status).toBe("PAID");
  expect(settled.gatewayPaymentId).toMatch(/^pay_devbox/);
  expect(settled.allocations).toEqual([{ demandId: onlineDemandId, amountPaise: ONLINE_PAISE }]);
  await expect(paid).toContainText(`Paid. Receipt ${settled.receipt!.serial}`);
  await expect(paid.getByRole("link", { name: "Receipt" })).toHaveAttribute("href", `/fees/receipts/${settled.receipt!.id}`);
  expect(await db.feeDemand.findUniqueOrThrow({ where: { id: onlineDemandId }, select: { status: true, paidPaise: true } })).toEqual({ status: "PAID", paidPaise: ONLINE_PAISE });
  await expect(family.locator(`[data-testid="fees-demand"][data-demand-id="${onlineDemandId}"]`)).toHaveAttribute("data-status", "PAID");
  await expect(family.locator(`[data-testid="fees-payment"][data-payment-id="${paymentId}"]`)).toHaveAttribute("data-status", "PAID");
  await sound(family, "PARENT the fees page once paid");

  // The alternative: the other due, by UPI, claimed with a UTR and left for the office.
  await panel.getByRole("button", { name: "Back" }).click();
  await expect(panel).toHaveCount(0);
  await pickOnly(family, upiDemandId, "900");
  await family.getByTestId("fees-pay-upi").click();
  const upi = family.getByTestId("fees-upi-flow");
  await expect(upi).toContainText("900");
  await upi.getByTestId("fees-upi-utr").fill(UTR);
  await upi.getByTestId("fees-upi-claim").click();
  await expect(upi.getByTestId("fees-upi-claimed")).toBeVisible();
  const claimed = family.locator('[data-testid="fees-payment"][data-status="CLAIMED"]').filter({ hasText: UTR });
  await expect(claimed).toHaveCount(1);
  const claim = await db.feePayment.findUniqueOrThrow({ where: { id: (await claimed.getAttribute("data-payment-id"))! }, select: { method: true, status: true, reference: true, amountPaise: true, intentJson: true } });
  expect(claim).toEqual({ method: "UPI", status: "CLAIMED", reference: UTR, amountPaise: UPI_PAISE, intentJson: JSON.stringify([upiDemandId]) });
  expect(await db.feeDemand.findUniqueOrThrow({ where: { id: upiDemandId }, select: { status: true } })).toEqual({ status: "OPEN" });
  await sound(family, "PARENT the fees page after the UPI claim");
  for (const page of [family, dev]) await page.context().close();
});
