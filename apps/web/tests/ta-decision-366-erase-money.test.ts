/**
 * TA-366, the owner's decision of 14 November 2026: the operator's erase (deleteSchoolEntirely, and the bulk erase,
 * which runs it per school) shredded money by the schema's cascades — a pupil's paid seat went with the school's
 * bookings, and a person who belonged only to that school went with their payouts, commission invoices,
 * question-writer payments and earnings, and their slots with the payments on them. The decision refuses in code,
 * with no schema change: while such rows exist the school is not erased and no account is removed, and the sentence
 * points to "Remove school", which keeps everything. The database's own refusing rules and a counter row per number
 * series go on the go-live runbook as a dated item before paid seats or passes open.
 *
 * Run as the APPLICATION ROLE, as /root runs it (the pattern of tests/ta-cascading-deletes-app-role.test.ts): the
 * school's bookings are policied, so a check that read them unbound would see none. Fixtures are written and read
 * back through a second, owner client. Every row belongs to a scratch ZZ school or a ZZ person of this suite's own.
 */
import { afterAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  if (appUser) process.env.DATABASE_URL = app;
  return { appUser, admin };
});

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { deleteSchoolEntirely, deleteSchoolsEntirely } from "@/lib/superuser";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const HOUR = 3_600_000;
const MAIL = (who: string) => `zz-ta366-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const schools: string[] = [];
let n = 0;

async function school(key: string): Promise<{ id: string; name: string }> {
  const made = await owner.school.create({
    data: { name: `ZZ TA366 ${key} ${STAMP}`, slug: `zz-ta366-${key.toLowerCase()}-${STAMP}`, code: `ZZ366${key}${STAMP}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", isTestFixture: true },
    select: { id: true, name: true },
  });
  schools.push(made.id);
  return made;
}

async function user(who: string, extra: object = {}): Promise<string> {
  ids[who] = (await owner.user.create({ data: { name: `ZZ TA366 ${who}`, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  return ids[who]!;
}

async function member(who: string, schoolId: string, role: string): Promise<string> {
  return (await owner.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

/** A provider's slot with one paid seat of a pupil at `schoolId`, and the seat's payment, captured. */
async function paidSeat(provider: string, schoolId: string, pupilMembershipId: string, payer: string) {
  n += 1;
  const slot = await owner.gigSlot.create({ data: { providerUserId: ids[provider]!, providerKind: "TEACHER", kind: "WORKSHOP", title: `ZZ TA366 seat ${STAMP}-${n}`, startsAt: new Date(Date.now() + 72 * HOUR + n * HOUR), endsAt: new Date(Date.now() + 73 * HOUR + n * HOUR), meetingUrl: `https://meet.jit.si/zz-ta366-${STAMP}-${n}`, seats: 5, seatsTaken: 1, pricePaise: 10000 }, select: { id: true } });
  const booking = await owner.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: pupilMembershipId, providerUserId: ids[provider]!, kind: "WORKSHOP", bookedByUserId: ids[payer]!, purpose: "ZZ a paid seat.", status: "CONFIRMED", paid: true }, select: { id: true } });
  const payment = await owner.sessionPayment.create({ data: { bookingId: booking.id, slotId: slot.id, payerUserId: ids[payer]!, expertUserId: ids[provider]!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId: `order_zz366${STAMP}n${n}`, paymentId: `pay_zz366${STAMP}n${n}`, status: "PAID", path: "COMPANY", paidAt: new Date(), receiptNumber: `ZZ366-R/${STAMP}/${n}`, receiptSerial: n }, select: { id: true } });
  return { slotId: slot.id, bookingId: booking.id, paymentId: payment.id };
}

/** A payout to `who` with the company's commission invoice on it. */
async function payoutWithInvoice(who: string) {
  n += 1;
  const payout = await owner.expertPayout.create({ data: { expertUserId: ids[who]!, netPaise: 7640, paymentsCount: 1, status: "PAID", reference: `ZZ366UTR${STAMP}P${n}`, paidAt: new Date() }, select: { id: true } });
  const invoice = await owner.gigInvoice.create({
    data: { number: `ZZ366/${STAMP}/${n}`, series: `ZZ366/${STAMP}`, serial: n, payoutId: payout.id, expertUserId: ids[who]!, taxableValuePaise: 2000, cgstPaise: 180, sgstPaise: 180, igstPaise: 0, totalPaise: 2360, sacCode: "998599", sellerJson: "{}", buyerJson: "{}", linesJson: "[]" },
    select: { id: true },
  });
  return { payoutId: payout.id, invoiceId: invoice.id };
}

/** A question writer's payment recorded by the operator. */
async function writerPayment(who: string) {
  n += 1;
  return (await owner.gigPayment.create({ data: { userId: ids[who]!, amountPaise: 5000, upiId: "zz366@upi", utr: `ZZ366GP${STAMP}${n}`, paidByUserId: ids.operator!, paidAt: new Date() }, select: { id: true } })).id;
}

/** The operator's own session, with no school on it: what /root runs under. */
async function operatorSession(): Promise<ActiveContext> {
  if (!ids.operator) await user("operator", { isSuperuser: true });
  __resetCookies();
  __setHeaders({});
  await createSession(ids.operator!);
  return (await getSession()) as ActiveContext;
}

const exists = {
  school: (id: string) => owner.school.count({ where: { id } }),
  account: (who: string) => owner.user.count({ where: { id: ids[who] } }),
};

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = (await owner.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((u) => u.id);
  await owner.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await owner.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await owner.gigPayment.deleteMany({ where: { userId: { in: users } } });
  await owner.session.deleteMany({ where: { userId: { in: users } } });
  await owner.notification.deleteMany({ where: { userId: { in: users } } });
  await owner.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users } }] } });
  await owner.school.deleteMany({ where: { id: { in: schools } } });
  await owner.user.deleteMany({ where: { id: { in: users } } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("TA-366: the operator's erase keeps the money, as the application role", () => {
  it("TA-366: a school whose pupil holds a paid seat is not erased, and the seat's payment, the school and the pupil stay", async () => {
    const S = await school("A");
    await user("pupilA");
    await user("guardianA");
    await user("providerA");
    const pupilM = await member("pupilA", S.id, "STUDENT");
    const seat = await paidSeat("providerA", S.id, pupilM, "guardianA");

    const result = await deleteSchoolEntirely(await operatorSession(), S.id, S.name);

    expect(result).toEqual({ ok: false, errorKey: "root.deleteHoldsMoney" });
    expect({
      school: await exists.school(S.id),
      booking: await owner.gigBooking.count({ where: { id: seat.bookingId } }),
      payment: await owner.sessionPayment.count({ where: { id: seat.paymentId } }),
      pupil: await exists.account("pupilA"),
    }).toEqual({ school: 1, booking: 1, payment: 1, pupil: 1 });
  }, 60_000);

  it("TA-366: a teacher who belongs only to the school, with a payout and its commission invoice, keeps the school and the account", async () => {
    const S = await school("B");
    await user("teacherB");
    await member("teacherB", S.id, "TEACHER");
    const money = await payoutWithInvoice("teacherB");

    const result = await deleteSchoolEntirely(await operatorSession(), S.id, S.name);

    expect(result).toEqual({ ok: false, errorKey: "root.deleteHoldsMoney" });
    expect({
      school: await exists.school(S.id),
      teacher: await exists.account("teacherB"),
      payout: await owner.expertPayout.count({ where: { id: money.payoutId } }),
      invoice: await owner.gigInvoice.count({ where: { id: money.invoiceId } }),
    }).toEqual({ school: 1, teacher: 1, payout: 1, invoice: 1 });
  }, 60_000);

  it("TA-366: a question writer who belongs only to the school, with a payment recorded, keeps the school and the account", async () => {
    const S = await school("C");
    await user("writerC");
    await member("writerC", S.id, "TEACHER");
    await operatorSession();
    const paymentId = await writerPayment("writerC");

    const result = await deleteSchoolEntirely(await operatorSession(), S.id, S.name);

    expect(result).toEqual({ ok: false, errorKey: "root.deleteHoldsMoney" });
    expect({ school: await exists.school(S.id), writer: await exists.account("writerC"), payment: await owner.gigPayment.count({ where: { id: paymentId } }) }).toEqual({ school: 1, writer: 1, payment: 1 });
  }, 60_000);

  it("TA-366: a provider who belongs only to the school, whose slot holds another school's paid seat, keeps the school, the slot and the payment", async () => {
    const S = await school("D");
    const K = await school("DK");
    await user("teacherD");
    await user("pupilDK");
    await user("guardianDK");
    await member("teacherD", S.id, "TEACHER");
    const pupilM = await member("pupilDK", K.id, "STUDENT");
    const seat = await paidSeat("teacherD", K.id, pupilM, "guardianDK");

    const result = await deleteSchoolEntirely(await operatorSession(), S.id, S.name);

    expect(result).toEqual({ ok: false, errorKey: "root.deleteHoldsMoney" });
    expect({
      school: await exists.school(S.id),
      provider: await exists.account("teacherD"),
      slot: await owner.gigSlot.count({ where: { id: seat.slotId } }),
      payment: await owner.sessionPayment.count({ where: { id: seat.paymentId } }),
    }).toEqual({ school: 1, provider: 1, slot: 1, payment: 1 });
  }, 60_000);

  it("TA-366: a teacher with a payout who also teaches at another school does not stop the erase, and keeps the account and the payout", async () => {
    const S = await school("E");
    const K = await school("EK");
    await user("teacherE");
    await user("pupilE");
    await member("teacherE", S.id, "TEACHER");
    await member("teacherE", K.id, "TEACHER");
    await member("pupilE", S.id, "STUDENT");
    const money = await payoutWithInvoice("teacherE");

    const result = await deleteSchoolEntirely(await operatorSession(), S.id, S.name);

    expect(result).toEqual({ ok: true, removedUsers: 1 });
    expect({
      school: await exists.school(S.id),
      teacher: await exists.account("teacherE"),
      pupil: await exists.account("pupilE"),
      payout: await owner.expertPayout.count({ where: { id: money.payoutId } }),
      invoice: await owner.gigInvoice.count({ where: { id: money.invoiceId } }),
    }).toEqual({ school: 0, teacher: 1, pupil: 0, payout: 1, invoice: 1 });
  }, 60_000);

  it("TA-366: the bulk erase refuses the school with money by the same sentence and erases the clean one", async () => {
    const withMoney = await school("F");
    const clean = await school("G");
    await user("writerF");
    await user("pupilG");
    await member("writerF", withMoney.id, "TEACHER");
    await member("pupilG", clean.id, "STUDENT");
    await operatorSession();
    const paymentId = await writerPayment("writerF");

    const outcome = await deleteSchoolsEntirely(await operatorSession(), [withMoney.id, clean.id], "DELETE 2");

    expect(outcome).toEqual({ ok: false, done: 1, failed: [{ id: withMoney.id, name: withMoney.name, errorKey: "root.deleteHoldsMoney" }] });
    expect({
      withMoney: await exists.school(withMoney.id),
      writer: await exists.account("writerF"),
      payment: await owner.gigPayment.count({ where: { id: paymentId } }),
      clean: await exists.school(clean.id),
    }).toEqual({ withMoney: 1, writer: 1, payment: 1, clean: 0 });
  }, 90_000);
});

describe.skipIf(Boolean(ENV.appUser))("TA-366 with a single database role", () => {
  it("is skipped: there is no application role to run under row security", () => {
    expect(ENV.appUser).toBeNull();
  });
});

describe("TA-366: the sentence and the runbook", () => {
  it("TA-366: the refusal is a sentence in en, hi and mr that points to Remove school", () => {
    const sentences = { en: en.root.deleteHoldsMoney, hi: hi.root.deleteHoldsMoney, mr: mr.root.deleteHoldsMoney } as Record<string, string | undefined>;
    expect(sentences.en).toContain(en.root.removeCta);
    expect(sentences.hi).toContain(hi.root.removeCta);
    expect(sentences.mr).toContain(mr.root.removeCta);
    expect(sentences.hi?.trim().endsWith("।")).toBe(true);
    expect(sentences.mr?.trim().endsWith(".")).toBe(true);
    expect(sentences.mr).not.toContain("स्कूल");
  });

  it("TA-366: the go-live runbook carries the database's refusing rules and a counter row per number series as a dated item before paid seats or passes open", () => {
    const goLive = readFileSync(resolve(__dirname, "..", "..", "..", "docs/runbooks/go-live.md"), "utf8");
    const at = goLive.indexOf("- [ ] **2.8 ");
    expect(at).toBeGreaterThan(-1);
    const rest = goLive.slice(at + 1);
    const end = rest.search(/\n- \[ \] \*\*|\n## /);
    const item = end < 0 ? rest : rest.slice(0, end);
    expect(item).toContain("TA-366");
    expect(item).toContain("14 November 2026");
    expect(item).toMatch(/onDelete: Restrict/);
    expect(item).toMatch(/counter row/i);
    expect(item).toMatch(/paid seats/);
    expect(item).toMatch(/passes/);
    const blockers = goLive.slice(goLive.indexOf("## Not yet possible until"));
    expect(blockers).toMatch(/\| [^|\n]*\(2\.8\) \| [^|\n]*paid seats on[^|\n]*passes[^|\n]* \| engineer[^|\n]*\|/);
  });
});
