import { test, expect, type Page } from "@playwright/test";
import { all, currentYear, db, northgate, openAs, sound, STAMP } from "./flow-helpers";

/**
 * A UPI claim, end to end. ZZ Northgate is given a UPI id for the run (put
 * back after), and the e2e pupil a fresh ZZ due of ₹1,200 beside the
 * fixture's own. The guardian picks that due alone, opens the UPI panel,
 * types a UTR and claims; the office finds the claim waiting and confirms
 * it; the guardian's page shows the due paid with its receipt. A second
 * confirm, from an office tab that still shows the claim, is refused with
 * a sentence and changes nothing: one payment, one receipt, the due paid
 * once.
 */
const parent = all.PARENT!;
const admin = all.ADMIN!;
const AMOUNT_PAISE = 120_000;
const UTR = `ZZE2E${String(STAMP).slice(-11)}`;
let schoolId: string;
let pupilId: string;
let demandId: string;
let upiBefore: { feeUpiId: string | null; feeUpiPayee: string | null };

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  pupilId = parent.pupilId!;
  const year = await currentYear(schoolId);
  const row = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { feeUpiId: true, feeUpiPayee: true } });
  upiBefore = row;
  if (!row.feeUpiId || !row.feeUpiPayee) await db.school.update({ where: { id: schoolId }, data: { feeUpiId: "zznorthgate@zzbank", feeUpiPayee: "ZZ Northgate School" } });
  const demand = await db.feeDemand.create({
    data: {
      schoolId,
      studentMembershipId: pupilId,
      academicYearId: year.id,
      instalmentId: null,
      label: `ZZ e2e UPI due ${STAMP}`,
      dueDate: new Date(Date.now() + 10 * 86_400_000),
      grossPaise: AMOUNT_PAISE,
      concessionPaise: 0,
      netPaise: AMOUNT_PAISE,
      linesJson: JSON.stringify([{ headId: "zz-e2e", code: "ZZE", name: "ZZ e2e activity", grossPaise: AMOUNT_PAISE, concessionPaise: 0 }]),
    },
    select: { id: true },
  });
  demandId = demand.id;
});

test.afterAll(async () => {
  if (demandId) {
    const payments = await db.feePayment.findMany({ where: { schoolId, studentMembershipId: pupilId, OR: [{ intentJson: { contains: demandId } }, { allocations: { some: { demandId } } }] }, select: { id: true } });
    for (const p of payments) await db.notification.deleteMany({ where: { schoolId, meta: { contains: p.id } } });
    await db.feePayment.deleteMany({ where: { schoolId, id: { in: payments.map((p) => p.id) } } });
    await db.feeDemand.deleteMany({ where: { schoolId, id: demandId } });
  }
  if (upiBefore && (!upiBefore.feeUpiId || !upiBefore.feeUpiPayee)) await db.school.update({ where: { id: schoolId }, data: { feeUpiId: upiBefore.feeUpiId, feeUpiPayee: upiBefore.feeUpiPayee } });
  await db.$disconnect();
});

/** Only the ZZ due ticked: "all" cleared first, then the one row. */
async function pickOnlyMine(page: Page) {
  const chooser = page.getByTestId("fees-pay-chooser");
  const allBox = chooser.locator("li").first().getByRole("checkbox");
  if (await allBox.isChecked()) await allBox.click();
  const mine = page.locator(`[data-testid="fees-pay-demand"][data-demand-id="${demandId}"]`).getByRole("checkbox");
  await mine.check();
  await expect(page.getByTestId("fees-pay-total")).toContainText("1,200");
}

test("the guardian claims a UPI payment with a UTR, the office confirms it once, and the second confirm changes nothing", async ({ browser, baseURL }) => {
  const family = await openAs(browser, parent, baseURL!);
  expect((await family.goto(`/parent/fees?child=${pupilId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(family.locator(`[data-testid="fees-demand"][data-demand-id="${demandId}"]`)).toHaveAttribute("data-status", "OPEN");
  await pickOnlyMine(family);
  await family.getByTestId("fees-pay-upi").click();
  const panel = family.getByTestId("fees-upi-flow");
  await expect(panel).toContainText("zznorthgate@zzbank");
  await expect(panel).toContainText("1,200");
  await panel.getByTestId("fees-upi-utr").fill(UTR);
  await panel.getByTestId("fees-upi-claim").click();
  await expect(panel.getByTestId("fees-upi-claimed")).toBeVisible();
  const claimed = family.locator('[data-testid="fees-payment"][data-status="CLAIMED"]').filter({ hasText: UTR });
  await expect(claimed).toHaveCount(1);
  await expect(claimed).toContainText("Waiting for the office to confirm");
  await sound(family, "PARENT the fees page after the claim");
  const paymentId = (await claimed.getAttribute("data-payment-id"))!;
  expect(await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { schoolId: true, method: true, status: true, reference: true, amountPaise: true } })).toEqual({ schoolId, method: "UPI", status: "CLAIMED", reference: UTR, amountPaise: AMOUNT_PAISE });

  // The office: the claim waits in the queue; a second tab holds the same queue for later.
  const office = await openAs(browser, admin, baseURL!);
  const stale = await openAs(browser, admin, baseURL!);
  for (const page of [office, stale]) {
    expect((await page.goto("/admin/fees/claims", { waitUntil: "networkidle" }))?.status()).toBe(200);
    await expect(page.locator(`[data-testid="claim-row"][data-payment-id="${paymentId}"]`)).toContainText(UTR);
  }
  await office.locator(`[data-testid="claim-row"][data-payment-id="${paymentId}"]`).getByTestId("claim-confirm").click();
  await expect(office.locator(`[data-testid="claim-row"][data-payment-id="${paymentId}"]`)).toHaveCount(0);
  await sound(office, "ADMIN the claims page after the confirm");
  const paid = await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true, receipt: { select: { id: true, serial: true } }, allocations: { select: { demandId: true, amountPaise: true } } } });
  expect(paid.status).toBe("PAID");
  expect(paid.allocations).toEqual([{ demandId, amountPaise: AMOUNT_PAISE }]);
  expect(await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true, paidPaise: true } })).toEqual({ status: "PAID", paidPaise: AMOUNT_PAISE });

  // The guardian sees it paid, with the receipt.
  await family.reload({ waitUntil: "networkidle" });
  await expect(family.locator(`[data-testid="fees-demand"][data-demand-id="${demandId}"]`)).toHaveAttribute("data-status", "PAID");
  const settled = family.locator(`[data-testid="fees-payment"][data-payment-id="${paymentId}"]`);
  await expect(settled).toHaveAttribute("data-status", "PAID");
  await expect(settled).toContainText(`Receipt ${paid.receipt!.serial}`);

  // The second confirm, from the tab that never refreshed: refused by name, and the ledger as it was.
  await stale.locator(`[data-testid="claim-row"][data-payment-id="${paymentId}"]`).getByTestId("claim-confirm").click();
  await expect(stale.getByRole("status").filter({ hasText: "That payment is not waiting to be confirmed." })).toBeVisible();
  expect(await db.feeReceipt.count({ where: { schoolId, paymentId } })).toBe(1);
  expect(await db.feePayment.count({ where: { schoolId, studentMembershipId: pupilId, reference: UTR } })).toBe(1);
  expect(await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true, paidPaise: true } })).toEqual({ status: "PAID", paidPaise: AMOUNT_PAISE });
  for (const page of [family, office, stale]) await page.context().close();
});
