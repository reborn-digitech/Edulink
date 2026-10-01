import { test, expect } from "@playwright/test";
import { all, currentYear, db, northgate, openAs, sound, STAMP } from "./flow-helpers";

/**
 * The counter. A ZZ fee head, a published ZZ structure with one instalment
 * of ₹2,500 and a plan on it for a fixture pupil who is on no plan this
 * year are made; the office types the amount at the counter, the receipt
 * row appears in the pupil's ledger, and the receipt page prints the amount
 * and a serial of the year's series. The ledger row, its allocation and the
 * settled demand are read back from the database. Everything made here is
 * removed; the year's receipt counter has moved on by one, as it does for
 * any receipt, which is why the fixtures are rebuilt after a write-heavy run.
 */
const admin = all.ADMIN!;
const AMOUNT_PAISE = 250_000;
let schoolId: string;
let yearId: string;
let pupilId: string;
let headId: string;
let structureId: string;
let demandId: string;

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  const year = await currentYear(schoolId);
  yearId = year.id;
  // A pupil the fees office has not touched this year: no plan, no demand, nothing paid.
  const pupil = await db.membership.findFirst({
    where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, feePlans: { none: { academicYearId: yearId } }, feeDemands: { none: {} }, feePayments: { none: { status: { not: "FAILED" } } } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (!pupil) throw new Error("ZZ Northgate has no pupil off the fee plan this year — run npm run zz:fixtures");
  pupilId = pupil.id;
  const head = await db.feeHead.create({ data: { schoolId, name: `ZZ e2e activity ${STAMP}`, code: `ZE${String(STAMP).slice(-6)}`, kind: "ACTIVITY", sortOrder: 99 }, select: { id: true } });
  headId = head.id;
  const structure = await db.feeStructure.create({
    data: {
      schoolId,
      academicYearId: yearId,
      name: `ZZ e2e fees ${STAMP}`,
      gradeLevel: null,
      publishedAt: new Date(),
      instalments: { create: { schoolId, label: "ZZ e2e term", sortOrder: 0, dueDate: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`), lines: { create: { schoolId, headId, amountPaise: AMOUNT_PAISE } } } },
    },
    select: { id: true, instalments: { select: { id: true, label: true, dueDate: true } } },
  });
  structureId = structure.id;
  const instalment = structure.instalments[0]!;
  await db.studentFeePlan.create({ data: { schoolId, studentMembershipId: pupilId, structureId, academicYearId: yearId } });
  const demand = await db.feeDemand.create({
    data: {
      schoolId,
      studentMembershipId: pupilId,
      academicYearId: yearId,
      instalmentId: instalment.id,
      label: instalment.label,
      dueDate: instalment.dueDate,
      grossPaise: AMOUNT_PAISE,
      concessionPaise: 0,
      netPaise: AMOUNT_PAISE,
      linesJson: JSON.stringify([{ headId, code: `ZE${String(STAMP).slice(-6)}`, name: `ZZ e2e activity ${STAMP}`, grossPaise: AMOUNT_PAISE, concessionPaise: 0 }]),
    },
    select: { id: true },
  });
  demandId = demand.id;
});

test.afterAll(async () => {
  if (pupilId) {
    // The payment first (its receipt and allocations cascade), then the demand, the plan, the structure (instalment and line cascade), the head.
    await db.notification.deleteMany({ where: { schoolId, kind: "FEES", meta: { contains: `"demandId"` }, body: { contains: "ZZ e2e" } } }).catch(() => undefined);
    await db.feePayment.deleteMany({ where: { schoolId, studentMembershipId: pupilId, allocations: { some: { demandId } } } });
    await db.feePayment.deleteMany({ where: { schoolId, studentMembershipId: pupilId, clientId: { startsWith: "zz-e2e-" } } });
    await db.feeDemand.deleteMany({ where: { schoolId, id: demandId } });
    await db.studentFeePlan.deleteMany({ where: { schoolId, studentMembershipId: pupilId, academicYearId: yearId, structureId } });
  }
  if (structureId) await db.feeStructure.deleteMany({ where: { schoolId, id: structureId } });
  if (headId) await db.feeHead.deleteMany({ where: { schoolId, id: headId } });
  await db.$disconnect();
});

test("the office records a cash payment against the due, the receipt shows the amount and the serial, and the ledger row exists", async ({ browser, baseURL }) => {
  const page = await openAs(browser, admin, baseURL!);
  expect((await page.goto(`/admin/fees/pupils/${pupilId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("fee-take-form")).toBeVisible();
  await expect(page.getByTestId("fee-payment-row")).toHaveCount(0);

  await page.getByTestId("fee-take-amount").fill("2500");
  await page.getByTestId("fee-take-method").selectOption("CASH");
  await page.getByTestId("fee-take-go").click();
  const paid = page.locator('[data-testid="fee-payment-row"][data-status="PAID"]');
  await expect(paid).toHaveCount(1);
  await expect(page.getByTestId("fee-take-error")).toHaveCount(0);
  await expect(paid).toContainText("2,500");
  await sound(page, "ADMIN the pupil's ledger after the counter");

  // The ledger row, its allocation to the one due, and the due settled.
  const paymentId = (await paid.getAttribute("data-payment-id"))!;
  const payment = await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { schoolId: true, studentMembershipId: true, method: true, status: true, amountPaise: true, allocations: { select: { demandId: true, amountPaise: true } }, receipt: { select: { id: true, serial: true, academicYearId: true } } } });
  expect(payment).toMatchObject({ schoolId, studentMembershipId: pupilId, method: "CASH", status: "PAID", amountPaise: AMOUNT_PAISE, allocations: [{ demandId, amountPaise: AMOUNT_PAISE }] });
  expect(payment.receipt?.academicYearId).toBe(yearId);
  expect(await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true, paidPaise: true } })).toEqual({ status: "PAID", paidPaise: AMOUNT_PAISE });

  // The receipt page, from the ledger's own link: the serial and the amount, as the row has them.
  await paid.getByTestId("fee-payment-receipt").click();
  await page.waitForURL(/\/fees\/receipts\//, { waitUntil: "networkidle" });
  await expect(page.getByTestId("fee-receipt")).toBeVisible();
  await expect(page.getByTestId("receipt-serial")).toHaveText(payment.receipt!.serial);
  expect(payment.receipt!.serial).toMatch(/^[A-Z0-9-]+\/.+\/\d{6}$/);
  await expect(page.getByTestId("receipt-total")).toContainText("2,500");
  await expect(page.getByTestId("fee-receipt")).toContainText("ZZ e2e term");
  await sound(page, "ADMIN the receipt");
  await page.context().close();
});
