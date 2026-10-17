import type { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES } from "@edulink/contracts";

/**
 * THE PASSES FIXTURE (17 October 2026; src/lib/pass-orders.ts, decision 0006).
 *
 * One PAID month of the STUDENT plan for ZZ Northgate's first pupil (zz.pupil01), bought by their guardian
 * (zz.parent01) through the devbox gateway, with its ORDER entitlements and its tax invoice — so /account/plan shows a
 * pass and an invoice to the guardian, the operator's /root/features a pass in the month's revenue with a Refund, and
 * the invoice door a PDF. Idempotent by the order's fixed gateway id: a second run writes nothing.
 *
 * As the library would write it: the price and the GST frozen from the plan and the company's rate, the window
 * starting where the pupil's current window of the plan ends (zz-plans.ts gives them a year's grant), one ORDER row
 * per feature. The invoice is numbered in its own series "ZZ-PASS/<year>", never the company's real one, so a fixture
 * takes no number from the real series; its seller block is GigSettings as it stands, the name marked as the fixture's
 * when the company's legal name is not set (no detail is invented). No audit row and no notice: fixture rows.
 * Removed by --teardown with the ZZ people (removeZzPasses, before their entitlements).
 */
const ORDER_ID = "order_zzfixturepupil01pass";
const PAYMENT_ID = "pay_zzfixturepupil01pass";

/** "2026-27": April to March, India's calendar (gig-payments.ts financialYearOf, which is server-only). */
function financialYear(at: Date): string {
  const ist = new Date(at.getTime() + 330 * 60_000);
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** Months after a day, held to the month's end (person-plans.ts addMonths). */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export async function buildPasses(db: PrismaClient, opts: { domain: string; now?: Date }): Promise<{ made: boolean; reason?: string; invoiceNumber?: string }> {
  const now = opts.now ?? new Date();
  const existing = await db.passOrder.findUnique({ where: { gatewayOrderId: ORDER_ID }, select: { id: true, invoiceId: true } });
  if (existing) {
    const inv = existing.invoiceId ? await db.passInvoice.findUnique({ where: { id: existing.invoiceId }, select: { number: true } }) : null;
    return { made: false, reason: "already there", invoiceNumber: inv?.number };
  }
  const pupil = await db.user.findUnique({ where: { email: `zz.pupil01@${opts.domain}` }, select: { id: true, name: true } });
  const parent = await db.user.findUnique({ where: { email: `zz.parent01@${opts.domain}` }, select: { id: true, name: true, prefs: true } });
  if (!pupil || !parent) return { made: false, reason: "no zz.pupil01 or zz.parent01" };
  const plan = await db.personPlan.findUnique({ where: { code: "STUDENT" }, select: { pricePaise: true } });
  const settings = await db.gigSettings.findUnique({ where: { id: "gigs" }, select: { gstPercent: true, companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true } });
  const amountPaise = plan && plan.pricePaise >= 100 ? plan.pricePaise : 9_900;
  const gstPercent = settings?.gstPercent ?? 18;
  const gstPaise = Math.round((amountPaise * gstPercent) / 100);
  const totalPaise = amountPaise + gstPaise;
  const latest = await db.entitlement.aggregate({ where: { userId: pupil.id, planCode: "STUDENT", revokedAt: null, validTo: { gt: now } }, _max: { validTo: true } });
  const validFrom = latest._max.validTo && latest._max.validTo > now ? latest._max.validTo : now;
  const validTo = addMonths(validFrom, 1);
  const series = `ZZ-PASS/${financialYear(now)}`;
  let locale = "en";
  try {
    const l = (JSON.parse(parent.prefs) as { locale?: string }).locale;
    if (l === "hi" || l === "mr") locale = l;
  } catch {
    // An unreadable prefs row reads as English.
  }

  const made = await db.$transaction(async (tx) => {
    const order = await tx.passOrder.create({
      data: { userId: pupil.id, payerUserId: parent.id, planCode: "STUDENT", period: "MONTH", amountPaise, gstPaise, totalPaise, gstPercent, gatewayOrderId: ORDER_ID, gatewayPaymentId: PAYMENT_ID, status: "PAID", paidAt: now },
      select: { id: true },
    });
    await tx.entitlement.createMany({ data: PLAN_FEATURES.STUDENT.map((feature) => ({ userId: pupil.id, feature, source: "ORDER", planCode: "STUDENT", validFrom, validTo, orderId: order.id })) });
    const last = (await tx.passInvoice.findFirst({ where: { series }, orderBy: { serial: "desc" }, select: { serial: true } }))?.serial ?? 0;
    const serial = last + 1;
    const number = `${series}/${String(serial).padStart(4, "0")}`;
    const cgstPaise = Math.floor(gstPaise / 2);
    const seller = { name: settings?.companyLegalName?.trim() || "ZZ fixture (the company's legal name is not set)", gstin: settings?.companyGstin ?? null, address: settings?.companyAddress ?? null, stateCode: settings?.companyStateCode ?? null };
    const invoice = await tx.passInvoice.create({
      data: {
        number,
        series,
        serial,
        passOrderId: order.id,
        payerUserId: parent.id,
        issuedAt: now,
        locale,
        taxableValuePaise: amountPaise,
        cgstPaise,
        sgstPaise: gstPaise - cgstPaise,
        igstPaise: 0,
        totalPaise,
        sacCode: settings?.invoiceSacCode ?? "998599",
        sellerJson: JSON.stringify(seller),
        buyerJson: JSON.stringify({ name: parent.name, gstin: null, address: null, stateCode: null }),
        linesJson: JSON.stringify([{ passOrderId: order.id, plan: "STUDENT", period: "MONTH", holderName: pupil.name, validFrom: validFrom.toISOString(), validTo: validTo.toISOString(), amountPaise, gstPaise }]),
      },
      select: { id: true, number: true },
    });
    await tx.passOrder.update({ where: { id: order.id }, data: { invoiceId: invoice.id } });
    return invoice.number;
  });
  return { made: true, invoiceNumber: made };
}

/** For --teardown: pass orders and invoices carry no foreign key to User, so they go by the ZZ people's ids before the people do. */
export async function removeZzPasses(db: PrismaClient, domain: string): Promise<number> {
  const ids = (await db.user.findMany({ where: { email: { endsWith: `@${domain}` } }, select: { id: true } })).map((u) => u.id);
  if (ids.length === 0) return 0;
  const orders = (await db.passOrder.findMany({ where: { OR: [{ userId: { in: ids } }, { payerUserId: { in: ids } }] }, select: { id: true } })).map((o) => o.id);
  await db.passInvoice.deleteMany({ where: { passOrderId: { in: orders } } });
  return (await db.passOrder.deleteMany({ where: { id: { in: orders } } })).count;
}
