/**
 * The experts-sessions batch's two findings that only show UNDER ROW SECURITY (testing analysis of 13 November 2026),
 * each held by a case that fails while the defect stands.
 *
 *   TA-117  A seat payment captured by the gateway's webhook carries no session. The capture itself settles since
 *           TA-183, but the office's notice (tellOffice) read the school's ADMIN and PRINCIPAL memberships with nothing
 *           bound, so under the application role it found nobody, and the office was never told that an outside adult
 *           is to meet its pupil (decision 0004).
 *   TA-124  An expert's bookings list and a booking's page asked for the school as a required relation. An expert's
 *           binding opens a school only while a booking there is CONFIRMED (or the school is listed), so a cancelled
 *           booking's school came back empty and Prisma threw "Field school is required": a 500 on the expert's home.
 *
 * Every other suite connects as the OWNER (tests/setup.ts). Here src/lib/db.ts connects as the app role (DATABASE_URL
 * put back to it before anything imports db.ts), as tests/ta-plans-payments-app-role.test.ts does; fixtures are
 * written and read back through a second, owner client. Skipped, and says so, when the configuration has one role.
 * Every row belongs to a scratch ZZ school and ZZ people of this suite's own (the stamp in each name), removed after.
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
import { getBooking, listBookings } from "@/lib/experts";
import { settleSeatPayment } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const PREFIX = String.fromCharCode(88 + (STAMP % 3), 65 + (Math.floor(STAMP / 3) % 26));
const ids: Record<string, string> = {};
let savedPrefix: string | null = null;

beforeAll(async () => {
  if (!ENV.appUser) return;
  const settings = await owner.gigSettings.findUnique({ where: { id: "gigs" }, select: { invoicePrefix: true } });
  if (!settings) throw new Error("GigSettings has no row: run any gig door once first");
  savedPrefix = settings.invoicePrefix;
  // The suite's own receipt series, so nothing it settles takes a number of the server's.
  await owner.gigSettings.update({ where: { id: "gigs" }, data: { invoicePrefix: PREFIX } });
  // No profile published and no vacancy: the school is not readable to an expert by any of School's own clauses.
  ids.school = (await owner.school.create({ data: { name: `ZZ TA ese Unlisted ${STAMP}`, slug: `zz-taese-${STAMP}`, code: `ZZTAESE${STAMP}`, contactEmail: `zz-taese-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await owner.user.create({ data: { name: `ZZ TA ese ${key} ${STAMP}`, email: `zz-taese-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  await user("expert");
  ids.profile = (await owner.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ TA ese expert under row security", offering: "BOTH", publishedAt: new Date() }, select: { id: true } })).id;
  await user("pupil", { isMinor: true });
  await user("guardian");
  await user("admin");
  ids.pupilMember = (await owner.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.adminMember = (await owner.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await owner.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterAll(async () => {
  const users = [ids.expert, ids.pupil, ids.guardian, ids.admin].filter((x): x is string => Boolean(x));
  if (users.length) {
    await owner.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
    await owner.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
    await owner.notification.deleteMany({ where: { userId: { in: users } } });
    await owner.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }] } }).catch(() => {});
  }
  if (ids.school) await owner.school.deleteMany({ where: { id: ids.school } });
  if (ids.profile) await owner.expertSlot.deleteMany({ where: { expertProfileId: ids.profile } });
  if (users.length) await owner.user.deleteMany({ where: { id: { in: users } } });
  // Put the series back only if it is still this suite's own (another suite may have set its own meanwhile).
  if (savedPrefix) await owner.gigSettings.updateMany({ where: { id: "gigs", invoicePrefix: PREFIX }, data: { invoicePrefix: savedPrefix } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("experts and seats as the application role", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
  });

  it("TA-117: a seat captured through the webhook with nothing bound tells the pupil's office that an outside adult is to meet their pupil", async () => {
    const slot = await owner.gigSlot.create({ data: { providerUserId: ids.expert!, providerKind: "EXPERT", kind: "WORKSHOP", title: `ZZ TA ese paid ${STAMP}`, startsAt: new Date(Date.now() + 72 * 3_600_000), endsAt: new Date(Date.now() + 73 * 3_600_000), meetingUrl: `https://meet.jit.si/zz-taese-${STAMP}`, seats: 5, seatsTaken: 1, pricePaise: 10000 }, select: { id: true } });
    const booking = await owner.gigBooking.create({ data: { schoolId: ids.school!, slotId: slot.id, studentMembershipId: ids.pupilMember!, providerUserId: ids.expert!, kind: "WORKSHOP", bookedByUserId: ids.guardian!, purpose: "ZZ a paid seat captured by the webhook.", status: "PENDING_PAYMENT", paid: true }, select: { id: true } });
    const orderId = `order_zztaese${STAMP}`;
    await owner.sessionPayment.create({ data: { bookingId: booking.id, slotId: slot.id, payerUserId: ids.guardian!, expertUserId: ids.expert!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId, status: "INITIATED", path: "COMPANY" } });
    expect(await settleSeatPayment({ orderId, gatewayPaymentId: `pay_zztaese${STAMP}`, amountPaise: 10000 })).toEqual({ outcome: "settled", bookingId: booking.id });
    expect(await owner.notification.count({ where: { userId: ids.admin!, titleKey: "gigs.notifOffice" } })).toBe(1);
  });

  it("TA-124: an expert reads their bookings list and a cancelled booking's page at a school that has published no profile", async () => {
    const slot = await owner.expertSlot.create({ data: { expertProfileId: ids.profile!, startsAt: new Date(Date.now() + 96 * 3_600_000), endsAt: new Date(Date.now() + 97 * 3_600_000), bookedAt: new Date(), cancelledAt: new Date() }, select: { id: true } });
    const booking = await owner.expertBooking.create({ data: { schoolId: ids.school!, expertProfileId: ids.profile!, expertUserId: ids.expert!, slotId: slot.id, bookedByMembershipId: ids.adminMember!, topic: "ZZ careers in marine science", status: "CANCELLED" }, select: { id: true } });
    const expert = { sessionId: "test", membershipId: null, schoolId: null, role: "EXPERT", user: { id: ids.expert!, name: "ZZ TA ese expert", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } } as unknown as ActiveContext;
    const asExpert = <T,>(work: () => Promise<T>) => forTenant({ schoolIds: [], userId: ids.expert!, joinCode: null, isSuperuser: false }, work);
    const list = await asExpert(() => listBookings(expert));
    expect(list.find((b) => b.id === booking.id)).toMatchObject({ status: "CANCELLED", schoolName: `ZZ TA ese Unlisted ${STAMP}` });
    expect(await asExpert(() => getBooking(expert, booking.id))).toMatchObject({ id: booking.id, status: "CANCELLED", schoolName: `ZZ TA ese Unlisted ${STAMP}` });
  });
});
