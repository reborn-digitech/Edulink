/**
 * TA-525, built as the owner decided on 14 November 2026 (option 1): every number the company issues fits sixteen
 * characters. Decision 0006 as amended: <prefix of one or two letters><series letter: P passes, C commission>/<the
 * financial year as 26-27>/<six-digit serial>, e.g. SGP/26-27/000001; the family's seat receipt takes the same shape
 * with R, since it is numbered by the same nextInSeries. A prefix that would not fit is refused when the operator
 * saves it, and nextPassNumber and nextInSeries refuse to issue a number over sixteen characters or holding anything
 * but letters, digits, hyphen and slash — a prefix saved before the rule, or a serial past 999,999, issues nothing.
 *
 * As the database's owner (tests/setup.ts). The rows are made directly — a scratch ZZ school, ZZ people, their seats,
 * payouts and pass orders — and removed afterwards. The shared GigSettings row (the company's details and the invoice
 * prefix) is set for the suite and put back as it was; the gateway is devbox. The suite's prefix is two letters
 * starting X, Y or Z, so it never shares a series with the company's own SG.
 */
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";
import { financialYearOf, markCaptured, recordPayout, saveCompanyDetails, type CompanyDetails } from "@/lib/gig-payments";
import { markPassPaid, setPassSaleForTests } from "@/lib/pass-orders";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
/** Two capital letters of the suite's own, never the company's SG. */
const PREFIX = String.fromCharCode(88 + (STAMP % 3), 65 + (Math.floor(STAMP / 3) % 26));
const HOUR = 3_600_000;
const FY = financialYearOf(new Date()).slice(2);
/** The decision's shape, and rule 46(b)'s sixteen characters of letters, digits, hyphen and slash. */
const SHAPE = /^[A-Z]{1,2}[PCR]\/\d{2}-\d{2}\/\d{6}$/;
const CHARS = /^[A-Z0-9/-]+$/;
const ids: Record<string, string> = {};
const SETTINGS_SELECT = { paymentsEnabled: true, invoicePrefix: true, companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true, gstPercent: true } as const;
let saved: Prisma.GigSettingsGetPayload<{ select: typeof SETTINGS_SELECT }> | null = null;
let n = 0;

const COMPANY: CompanyDetails = { legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998431", invoicePrefix: PREFIX, gstPercent: 18, missing: [] };
const PRICES = { STUDENT: { monthly: 9_900, yearly: 99_900 }, TEACHER: { monthly: 19_900, yearly: 199_900 }, EXPERT: { monthly: 49_900, yearly: 499_900 } };
const companyInput = (invoicePrefix: string) => ({ legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998599", invoicePrefix, gstPercent: 18 });

const operator = (): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: ids.operator!, name: "ZZ operator", preferredName: null, email: `zz-d525-operator-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: true, isAppAdmin: false } }) as ActiveContext;
const setPrefix = (invoicePrefix: string) => db.gigSettings.update({ where: { id: "gigs" }, data: { invoicePrefix } });

/** A teacher's slot with one booking and its payment (the company-collects path), as the rows stand at that moment. */
async function seat(payment: Record<string, unknown>, booking: Record<string, unknown> = {}) {
  n += 1;
  const slot = await db.gigSlot.create({ data: { providerUserId: ids.teacher!, providerKind: "TEACHER", kind: "WORKSHOP", title: `ZZ D525 seat ${STAMP}-${n}`, startsAt: new Date(Date.now() + 72 * HOUR + n * HOUR), endsAt: new Date(Date.now() + 73 * HOUR + n * HOUR), meetingUrl: `https://meet.jit.si/zz-d525-${STAMP}-${n}`, seats: 5, seatsTaken: 1, pricePaise: 10000 }, select: { id: true } });
  const b = await db.gigBooking.create({ data: { schoolId: ids.school!, slotId: slot.id, studentMembershipId: ids.pupilMember!, providerUserId: ids.teacher!, kind: "WORKSHOP", bookedByUserId: ids.guardian!, purpose: "ZZ a paid seat for the invoice numbers.", status: "PENDING_PAYMENT", paid: true, ...booking }, select: { id: true } });
  const orderId = `order_zzd525${STAMP}n${n}`;
  const p = await db.sessionPayment.create({ data: { bookingId: b.id, slotId: slot.id, payerUserId: ids.guardian!, expertUserId: ids.teacher!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId, status: "INITIATED", path: "COMPANY", ...payment }, select: { id: true } });
  return { bookingId: b.id, paymentId: p.id, orderId };
}

/** A DUE teacher seat in an OPEN payout, ready for the operator to record. */
async function openPayout() {
  const payout = await db.expertPayout.create({ data: { expertUserId: ids.teacher!, netPaise: 7640, paymentsCount: 1, status: "OPEN" }, select: { id: true } });
  const s = await seat({ status: "DUE", paymentId: `pay_zzd525${STAMP}due${n + 1}`, paidAt: new Date(), dueAt: new Date(), payoutId: payout.id, receiptNumber: `ZZ-D525/${STAMP}/${n + 1}`, receiptSerial: 1 }, { status: "DELIVERED" });
  return { payoutId: payout.id, paymentId: s.paymentId };
}

/** A pass order waiting for its capture, made as the row stands then. */
async function passOrder() {
  n += 1;
  return db.passOrder.create({ data: { userId: ids.guardian!, payerUserId: ids.guardian!, planCode: "TEACHER", period: "MONTH", amountPaise: 19_900, gstPaise: 3_582, totalPaise: 23_482, gstPercent: 18, gatewayOrderId: `order_zzd525pass${STAMP}n${n}` }, select: { id: true, gatewayOrderId: true, totalPaise: true } });
}
const capturePass = (o: { gatewayOrderId: string; totalPaise: number }) => markPassPaid({ orderId: o.gatewayOrderId, gatewayPaymentId: `pay_zzd525pass${STAMP}n${(n += 1)}`, amountPaise: o.totalPaise });
/** An invoice already standing in the suite's pass series at the given serial. */
const seedPassInvoice = (serial: number) =>
  db.passInvoice.create({ data: { number: `${PREFIX}P/${FY}/${String(serial).padStart(6, "0")}`, series: `${PREFIX}P/${FY}`, serial, passOrderId: `zz-d525-seed-${STAMP}-${serial}`, payerUserId: ids.guardian!, taxableValuePaise: 100, cgstPaise: 9, sgstPaise: 9, igstPaise: 0, totalPaise: 118, sacCode: "998431", sellerJson: "{}", buyerJson: "{}", linesJson: "[]" } });

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  const row = await db.gigSettings.findUnique({ where: { id: "gigs" }, select: SETTINGS_SELECT });
  if (!row) throw new Error("GigSettings has no row: run any gig door once first");
  saved = row;
  await db.gigSettings.update({ where: { id: "gigs" }, data: { invoicePrefix: PREFIX, companyLegalName: "ZZ Shalaghar Test Private Limited", companyGstin: "27AAACZ1234A1Z5", companyAddress: "ZZ 1 Test Road, Pune", companyStateCode: "27", invoiceSacCode: "998599", gstPercent: 18 } });
  setPassSaleForTests({ company: COMPANY, prices: PRICES });
  ids.school = (await db.school.create({ data: { name: `ZZ D525 School ${STAMP}`, slug: `zz-d525-${STAMP}`, code: `ZZD525${STAMP}`, contactEmail: `zz-d525-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await db.user.create({ data: { name: `ZZ D525 ${key} ${STAMP}`, email: `zz-d525-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  await user("teacher");
  await db.membership.create({ data: { userId: ids.teacher!, schoolId: ids.school!, role: "TEACHER", status: "ACTIVE" } });
  await db.gigPayee.create({ data: { userId: ids.teacher!, upiId: `zz-d525-${STAMP}@upi`, payeeName: "ZZ Teacher Payee" } });
  await user("pupil", { isMinor: true });
  await user("guardian");
  await user("operator", { isSuperuser: true });
  ids.pupilMember = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterAll(async () => {
  setPassSaleForTests(null);
  const users = ["teacher", "pupil", "guardian", "operator"].map((k) => ids[k]).filter((x): x is string => Boolean(x));
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.gigInvoice.deleteMany({ where: { expertUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.entitlement.deleteMany({ where: { userId: { in: users } } });
  await db.passInvoice.deleteMany({ where: { payerUserId: { in: users } } });
  await db.passOrder.deleteMany({ where: { OR: [{ userId: { in: users } }, { payerUserId: { in: users } }] } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }, { targetId: { in: users } }] } }).catch(() => {});
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("the operator's prefix", () => {
  it("TA-525: a prefix that would not fit sixteen characters is refused when the operator saves it; one or two capital letters are kept", async () => {
    for (const bad of ["SHALAGHR", "SGA", "S1", "1S", "S-"]) {
      expect(await saveCompanyDetails(operator(), companyInput(bad)), bad).toMatchObject({ ok: false, errorKey: "gigs.refuseInvoicePrefixFit" });
    }
    expect((await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { invoicePrefix: true } })).invoicePrefix).toBe(PREFIX);
    expect(await saveCompanyDetails(operator(), companyInput("s"))).toMatchObject({ ok: true, company: { invoicePrefix: "S" } });
    expect(await saveCompanyDetails(operator(), companyInput(PREFIX))).toMatchObject({ ok: true, company: { invoicePrefix: PREFIX } });
  });
});

describe("the pass series (nextPassNumber)", () => {
  it("TA-525: a pass invoice is numbered <prefix>P/26-27/000001, sixteen characters at most, letters, digits, hyphen and slash", async () => {
    const o = await passOrder();
    expect((await capturePass(o)).outcome).toBe("settled");
    const inv = await db.passInvoice.findUniqueOrThrow({ where: { passOrderId: o.id } });
    expect(inv.series).toBe(`${PREFIX}P/${FY}`);
    expect(inv.number).toBe(`${PREFIX}P/${FY}/000001`);
    expect(inv.number).toMatch(SHAPE);
    expect(inv.number).toMatch(CHARS);
    expect(inv.number.length).toBeLessThanOrEqual(16);
  });

  it("TA-525: a series past 9,999 still issues within sixteen; a serial past 999,999 is refused and nothing of the capture is written", async () => {
    await seedPassInvoice(9_999);
    const o = await passOrder();
    expect((await capturePass(o)).outcome).toBe("settled");
    const inv = await db.passInvoice.findUniqueOrThrow({ where: { passOrderId: o.id } });
    expect(inv.number).toBe(`${PREFIX}P/${FY}/010000`);
    expect(inv.number.length).toBe(PREFIX.length === 2 ? 16 : 15);

    await seedPassInvoice(999_999);
    const late = await passOrder();
    await expect(capturePass(late)).rejects.toMatchObject({ name: "InvoiceNumberRefused" });
    expect(await db.passOrder.findUniqueOrThrow({ where: { id: late.id }, select: { status: true, invoiceId: true } })).toEqual({ status: "CREATED", invoiceId: null });
    expect(await db.entitlement.count({ where: { orderId: late.id } })).toBe(0);
    expect(await db.passInvoice.count({ where: { series: `${PREFIX}P/${FY}`, serial: { gt: 999_999 } } })).toBe(0);
  });

  it("TA-525: a prefix saved before the rule (too long, or a character outside the set) issues no pass invoice", async () => {
    for (const legacy of ["ZZQASHOP", "Z_"]) {
      setPassSaleForTests({ company: { ...COMPANY, invoicePrefix: legacy }, prices: PRICES });
      const o = await passOrder();
      await expect(capturePass(o), legacy).rejects.toMatchObject({ name: "InvoiceNumberRefused" });
      expect(await db.passOrder.findUniqueOrThrow({ where: { id: o.id }, select: { status: true } })).toEqual({ status: "CREATED" });
      expect(await db.passInvoice.count({ where: { passOrderId: o.id } })).toBe(0);
    }
    setPassSaleForTests({ company: COMPANY, prices: PRICES });
  });
});

describe("the commission and receipt series (nextInSeries)", () => {
  it("TA-525: the commission invoice is numbered <prefix>C/26-27/000001 within sixteen characters", async () => {
    const { payoutId } = await openPayout();
    const recorded = await recordPayout(operator(), payoutId, { reference: `ZZUTR${STAMP}C1` });
    expect(recorded).toMatchObject({ ok: true, invoice: { number: `${PREFIX}C/${FY}/000001` } });
    const invoice = await db.gigInvoice.findUniqueOrThrow({ where: { payoutId } });
    expect(invoice.series).toBe(`${PREFIX}C/${FY}`);
    expect(invoice.number).toMatch(SHAPE);
    expect(invoice.number.length).toBeLessThanOrEqual(16);
  });

  it("TA-525: a stored prefix that would not fit issues no commission invoice: the payout is refused by name and nothing is written", async () => {
    await setPrefix("ZZQASHOP");
    try {
      const { payoutId, paymentId } = await openPayout();
      expect(await recordPayout(operator(), payoutId, { reference: `ZZUTR${STAMP}C2` })).toMatchObject({ ok: false, errorKey: "gigs.refuseInvoiceNumber" });
      expect(await db.expertPayout.findUniqueOrThrow({ where: { id: payoutId }, select: { status: true, reference: true } })).toEqual({ status: "OPEN", reference: null });
      expect((await db.sessionPayment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true } })).status).toBe("DUE");
      expect(await db.gigInvoice.count({ where: { payoutId } })).toBe(0);
    } finally {
      await setPrefix(PREFIX);
    }
  });

  it("TA-525: the family's receipt, numbered by the same nextInSeries, is <prefix>R/26-27/000001; a prefix that would not fit takes no receipt and leaves the payment as it was", async () => {
    const s = await seat({});
    const done = await markCaptured({ orderId: s.orderId, gatewayPaymentId: `pay_zzd525${STAMP}cap1`, amountPaise: 10000 });
    expect(done.outcome).toBe("settled");
    const p = await db.sessionPayment.findUniqueOrThrow({ where: { id: s.paymentId }, select: { receiptNumber: true, receiptSerial: true } });
    expect(p.receiptNumber).toMatch(new RegExp(`^${PREFIX}R/${FY}/\\d{6}$`));
    expect(p.receiptNumber!.length).toBeLessThanOrEqual(16);

    await setPrefix("ZZQASHOP");
    try {
      const other = await seat({});
      await expect(markCaptured({ orderId: other.orderId, gatewayPaymentId: `pay_zzd525${STAMP}cap2`, amountPaise: 10000 })).rejects.toMatchObject({ name: "InvoiceNumberRefused" });
      expect(await db.sessionPayment.findUniqueOrThrow({ where: { id: other.paymentId }, select: { status: true, receiptNumber: true } })).toEqual({ status: "INITIATED", receiptNumber: null });
    } finally {
      await setPrefix(PREFIX);
    }
  });
});
