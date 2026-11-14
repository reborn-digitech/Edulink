/**
 * TA-564 under ROW SECURITY (the owner's decision of 14 November 2026): a guardian bound to their child's school books
 * an expert's priced time and agrees to a pupil's ask for one; the expert's free offer is read under that binding (the
 * slot and the mentoring window are no school's rows), the expert's notice is written and its once-a-lapse check read
 * as the expert's own (a notice of no school), and a refused yes cancels the ask under the school's binding. None of it
 * works by the owner's privilege.
 *
 * Every other suite connects as the OWNER (tests/setup.ts). Here src/lib/db.ts connects as the app role (DATABASE_URL
 * put back to it before anything imports db.ts), as tests/ta-decision-122-app-role.test.ts does; fixtures are written
 * and read back through a second, owner client. Skipped, and says so, when the configuration has one role. Every row
 * belongs to a scratch ZZ school and ZZ people of this suite's own (the stamp in each name), removed after. Paid seats
 * are switched on for the run when they were off, and put back.
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
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { db } from "@/lib/db";
import { forTenant } from "@/lib/tenant-context";
import { bookSeat, consentToBooking } from "@/lib/gig-sessions";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import type { ActiveContext } from "@/lib/session";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const DAY = 24 * 3_600_000;
const ids: Record<string, string> = {};
let switchedOn = false;

const person = (key: string, role: ActiveContext["role"], membershipId: string | null = null, schoolId: string | null = null, minor = false): ActiveContext =>
  ({ sessionId: "test", membershipId, schoolId, role, user: { id: ids[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: minor, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const bound = <T,>(userKey: string, work: () => Promise<T>) => forTenant({ schoolIds: [ids.school!], userId: ids[userKey]!, joinCode: null, isSuperuser: false }, work);
const purpose = "ZZ What the pupil wants from this priced time.";

let n = 0;
async function slot(pricePaise: number, kind: "ONE_TO_ONE" | "WORKSHOP") {
  n += 1;
  const startsAt = new Date(Date.now() + 5 * DAY + n * 60_000);
  return (await owner.gigSlot.create({ data: { providerUserId: ids.expert!, providerKind: "EXPERT", kind, title: `ZZ TA 564 row ${STAMP}-${n}`, startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000), meetingUrl: `https://meet.jit.si/zz-ta564-${STAMP}-${n}`, seats: kind === "ONE_TO_ONE" ? 1 : 10, pricePaise }, select: { id: true } })).id;
}

beforeAll(async () => {
  if (!ENV.appUser) return;
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  const settings = await owner.gigSettings.findUnique({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
  if (settings && !settings.paymentsEnabled) {
    await owner.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
    switchedOn = true;
  }
  ids.school = (await owner.school.create({ data: { name: `ZZ TA 564 Row ${STAMP}`, slug: `zz-ta564-${STAMP}`, code: `ZZTA564${STAMP}`, contactEmail: `zz-ta564-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  await owner.academicYear.create({ data: { schoolId: ids.school!, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await owner.user.create({ data: { name: `ZZ TA 564 ${key} ${STAMP}`, email: `zz-ta564-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  await user("expert");
  ids.profile = (await owner.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ TA 564 expert under row security", offering: "BOTH", publishedAt: new Date(), kycStatus: "VERIFIED", verifiedAt: new Date() }, select: { id: true } })).id;
  await user("pupil", { isMinor: true });
  await user("guardian");
  ids.pupilMember = (await owner.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await owner.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterAll(async () => {
  setFeaturesForTests(null);
  if (switchedOn) await owner.gigSettings.updateMany({ where: { id: "gigs", paymentsEnabled: true }, data: { paymentsEnabled: false } });
  const users = [ids.expert, ids.pupil, ids.guardian].filter((x): x is string => Boolean(x));
  if (users.length) {
    await owner.sessionPayment.deleteMany({ where: { OR: [{ payerUserId: { in: users } }, { expertUserId: { in: users } }] } }).catch(() => {});
    if (ids.school) await owner.gigBooking.deleteMany({ where: { schoolId: ids.school } });
    await owner.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
    await owner.notification.deleteMany({ where: { userId: { in: users } } });
    await owner.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }] } }).catch(() => {});
  }
  if (ids.school) await owner.school.deleteMany({ where: { id: ids.school } });
  if (users.length) await owner.user.deleteMany({ where: { id: { in: users } } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("TA-564 as the application role", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
  });

  it("TA-564: under the guardian's binding a booked mentoring window counts as the offer, a lapse refuses the booking and tells the expert once, and a refused yes cancels the pupil's ask and gives the seat back", async () => {
    const mentoringWindow = await owner.expertSlot.create({ data: { expertProfileId: ids.profile!, startsAt: new Date(Date.now() + 3 * DAY), endsAt: new Date(Date.now() + 3 * DAY + 3_600_000), bookedAt: new Date() }, select: { id: true } });
    const priced = await slot(10000, "WORKSHOP");
    // The pupil asks while the (booked) window stands: the ask waits for the guardian.
    const asked = await bound("pupil", () => bookSeat(person("pupil", "STUDENT", ids.pupilMember!, ids.school!, true), { slotId: priced, purpose }));
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const bookingId = (asked as { bookingId: string }).bookingId;

    // The window withdrawn: the guardian's own booking of another priced time is refused, and the expert told once.
    await owner.expertSlot.update({ where: { id: mentoringWindow.id }, data: { cancelledAt: new Date() } });
    const other = await slot(10000, "ONE_TO_ONE");
    expect(await bound("guardian", () => bookSeat(person("guardian", "PARENT"), { slotId: other, studentMembershipId: ids.pupilMember!, purpose }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await owner.notification.count({ where: { userId: ids.expert!, titleKey: "gigs.notifSalesStopped", schoolId: null } })).toBe(1);

    // The guardian's yes to the ask: cancelled, the seat back, the audit row under the school, the family told; the expert not told twice.
    expect(await bound("guardian", () => consentToBooking(person("guardian", "PARENT"), bookingId, true))).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await owner.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true } })).toMatchObject({ status: "CANCELLED" });
    expect((await owner.gigSlot.findUniqueOrThrow({ where: { id: priced }, select: { seatsTaken: true } })).seatsTaken).toBe(0);
    expect(await owner.auditLog.count({ where: { action: "gig.booking.cancel", targetId: bookingId, schoolId: ids.school! } })).toBe(1);
    expect(await owner.notification.count({ where: { userId: { in: [ids.pupil!, ids.guardian!] }, titleKey: "gigs.notifAskStoppedNoOffer" } })).toBe(2);
    expect(await owner.notification.count({ where: { userId: ids.expert!, titleKey: "gigs.notifSalesStopped" } })).toBe(1);
  }, 60_000);
});
