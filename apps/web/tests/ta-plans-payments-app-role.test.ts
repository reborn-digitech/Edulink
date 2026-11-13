/**
 * Paid seats read UNDER ROW SECURITY: two Medium findings of the testing analysis of 13 November 2026 that only
 * show as the application role, each held by a case that fails while the defect stands.
 *
 *   TA-183  The sessions webhook (no cookie, no school bound) settles a captured seat through markCaptured, whose
 *           first read took the booking as a nested relation of the payment; GigBooking is readable only by its
 *           school or its provider, so with nothing bound the required relation came back empty and the capture
 *           threw on every retry. refundSeatPayment (the job's void, the operator's retry) read the same way.
 *   TA-186  An expert's earnings read the paying pupil's school name through the booking; a School row is readable
 *           to an expert only when the school published a profile or has an open vacancy, so one sale to any other
 *           school failed the whole earnings page.
 *
 * Every other suite connects as the OWNER (tests/setup.ts), where none of this can be seen. Here src/lib/db.ts
 * connects as the app role (DATABASE_URL put back to it before anything imports db.ts); fixtures are written and
 * read back through a second, owner client. Skipped, and says so, when the configuration has one role. Every row
 * belongs to a scratch ZZ school and ZZ people of this suite's own (the stamp in each name), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
import { db } from "@/lib/db";
import { forTenant } from "@/lib/tenant-context";
import { expertEarnings, refundSeatPayment } from "@/lib/gig-payments";
import { settleSeatPayment } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const PREFIX = `ZA${String(STAMP).slice(-6)}`;
const ids: Record<string, string> = {};
let savedPrefix: string | null = null;

async function seat(key: string, status: string, over: Record<string, unknown> = {}): Promise<{ bookingId: string; paymentId: string; orderId: string }> {
  const slot = await owner.gigSlot.create({ data: { providerUserId: ids.expert!, providerKind: "EXPERT", kind: "WORKSHOP", title: `ZZ TA paid ${key} ${STAMP}`, startsAt: new Date(Date.now() + 72 * 3_600_000), endsAt: new Date(Date.now() + 73 * 3_600_000), meetingUrl: `https://meet.jit.si/zz-tapp-${key}-${STAMP}`, seats: 5, seatsTaken: 1, pricePaise: 10000 }, select: { id: true } });
  const booking = await owner.gigBooking.create({ data: { schoolId: ids.school!, slotId: slot.id, studentMembershipId: ids.pupilMember!, providerUserId: ids.expert!, kind: "WORKSHOP", bookedByUserId: ids.guardian!, purpose: "ZZ a paid seat read under row security.", status: "PENDING_PAYMENT", paid: true }, select: { id: true } });
  const orderId = `order_zztapp${key}${STAMP}`;
  const payment = await owner.sessionPayment.create({ data: { bookingId: booking.id, slotId: slot.id, payerUserId: ids.guardian!, expertUserId: ids.expert!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId, status, path: "COMPANY", ...over }, select: { id: true } });
  return { bookingId: booking.id, paymentId: payment.id, orderId };
}

beforeAll(async () => {
  if (!ENV.appUser) return;
  const settings = await owner.gigSettings.findUnique({ where: { id: "gigs" }, select: { invoicePrefix: true } });
  if (!settings) throw new Error("GigSettings has no row: run any gig door once first");
  savedPrefix = settings.invoicePrefix;
  // The suite's own receipt series, so nothing it settles takes a number of the server's.
  await owner.gigSettings.update({ where: { id: "gigs" }, data: { invoicePrefix: PREFIX } });
  // No profile published and no vacancy: the school is not readable to an expert by any of School's own clauses.
  ids.school = (await owner.school.create({ data: { name: `ZZ TA Unlisted School ${STAMP}`, slug: `zz-tapp-${STAMP}`, code: `ZZTAPP${STAMP}`, contactEmail: `zz-tapp-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await owner.user.create({ data: { name: `ZZ TA ${key} ${STAMP}`, email: `zz-tapp-${key}-${STAMP}@test.invalid`, ...extra }, select: { id: true } })).id);
  await user("expert");
  await owner.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ Expert under row security", offering: "BOTH", publishedAt: new Date() } });
  await user("pupil", { isMinor: true });
  await user("guardian");
  ids.pupilMember = (await owner.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await owner.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterAll(async () => {
  const users = [ids.expert, ids.pupil, ids.guardian].filter((x): x is string => Boolean(x));
  if (users.length) {
    await owner.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
    await owner.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
    await owner.notification.deleteMany({ where: { userId: { in: users } } });
    await owner.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }] } }).catch(() => {});
  }
  if (ids.school) await owner.school.deleteMany({ where: { id: ids.school } });
  if (users.length) await owner.user.deleteMany({ where: { id: { in: users } } });
  if (savedPrefix) await owner.gigSettings.update({ where: { id: "gigs" }, data: { invoicePrefix: savedPrefix } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("paid seats as the application role", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
  });

  it("TA-183: a captured seat delivered to the sessions webhook with nothing bound settles: PAID then HELD, the booking CONFIRMED", async () => {
    const s = await seat("capture", "INITIATED");
    const result = await settleSeatPayment({ orderId: s.orderId, gatewayPaymentId: `pay_zztapp${STAMP}`, amountPaise: 10000 });
    expect(result).toEqual({ outcome: "settled", bookingId: s.bookingId });
    expect(await owner.sessionPayment.findUniqueOrThrow({ where: { id: s.paymentId }, select: { status: true, receiptNumber: true } })).toMatchObject({ status: "HELD", receiptNumber: expect.stringContaining(`${PREFIX}-R/`) });
    expect((await owner.gigBooking.findUniqueOrThrow({ where: { id: s.bookingId }, select: { status: true } })).status).toBe("CONFIRMED");
  });

  it("TA-183: the job's void of an unpaid seat (refundSeatPayment) runs with nothing bound and with the operator's school-less tenant", async () => {
    const a = await seat("void", "INITIATED");
    expect(await refundSeatPayment(a.bookingId, "expired unpaid", null)).toBe("voided");
    expect((await owner.sessionPayment.findUniqueOrThrow({ where: { id: a.paymentId }, select: { status: true } })).status).toBe("FAILED");
    const b = await seat("opvoid", "INITIATED");
    const operatorTenant = { schoolIds: [], userId: ids.guardian!, joinCode: null, isSuperuser: true };
    expect(await forTenant(operatorTenant, () => refundSeatPayment(b.bookingId, "ZZ operator", null))).toBe("voided");
  });

  it("TA-186: an expert reads their earnings when a paying pupil's school published no profile and has no vacancy", async () => {
    const s = await seat("earn", "HELD", { paymentId: `pay_zztappearn${STAMP}`, paidAt: new Date(), receiptNumber: `${PREFIX}-R/X/${STAMP}`, receiptSerial: 1 });
    const expert = { sessionId: "test", membershipId: null, schoolId: null, role: "EXPERT", user: { id: ids.expert!, name: "ZZ TA expert", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } } as unknown as ActiveContext;
    const earnings = await forTenant({ schoolIds: [], userId: ids.expert!, joinCode: null, isSuperuser: false }, () => expertEarnings(expert));
    expect(earnings.rows.find((r) => r.paymentId === s.paymentId)).toMatchObject({ schoolName: `ZZ TA Unlisted School ${STAMP}`, status: "HELD", netPaise: 7640 });
  });
});
