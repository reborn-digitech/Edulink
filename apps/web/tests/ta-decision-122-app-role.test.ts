/**
 * TA-122 under ROW SECURITY (the owner's decision of 14 November 2026): the family disputes a seat the provider marked,
 * and the operator — bound to no school, whose binding opens no booking — lists the dispute and decides it. The list
 * reads each provider's own disputed seats as that provider (GigBooking's SELF_READABLE clause), and the decision writes
 * under the pupil's school; neither works by the owner's privilege.
 *
 * Every other suite connects as the OWNER (tests/setup.ts). Here src/lib/db.ts connects as the app role (DATABASE_URL
 * put back to it before anything imports db.ts), as tests/ta-experts-sessions-app-role.test.ts does; fixtures are
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
import { decideDispute, operatorDisputes, reportUnheld } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const HOUR = 3_600_000;
const ids: Record<string, string> = {};

const person = (key: string, role: ActiveContext["role"], flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role, user: { id: ids[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;

beforeAll(async () => {
  if (!ENV.appUser) return;
  ids.school = (await owner.school.create({ data: { name: `ZZ TA 122 Row ${STAMP}`, slug: `zz-ta122-${STAMP}`, code: `ZZTA122${STAMP}`, contactEmail: `zz-ta122-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await owner.user.create({ data: { name: `ZZ TA 122 ${key} ${STAMP}`, email: `zz-ta122-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  await user("expert");
  await owner.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ TA 122 expert under row security", offering: "BOTH", publishedAt: new Date() } });
  await user("pupil", { isMinor: true });
  await user("guardian");
  await user("operator", { isSuperuser: true });
  ids.pupilMember = (await owner.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await owner.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterAll(async () => {
  const users = [ids.expert, ids.pupil, ids.guardian, ids.operator].filter((x): x is string => Boolean(x));
  if (users.length) {
    await owner.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
    await owner.notification.deleteMany({ where: { userId: { in: users } } });
    await owner.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }] } }).catch(() => {});
  }
  if (ids.school) await owner.school.deleteMany({ where: { id: ids.school } });
  if (users.length) await owner.user.deleteMany({ where: { id: { in: users } } });
  await owner.$disconnect();
});

describe.skipIf(!ENV.appUser)("TA-122 as the application role", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
  });

  it("TA-122: the family disputes a marked seat under its own binding, and the operator, bound to no school, lists it and decides it", async () => {
    const startsAt = new Date(Date.now() - 4 * HOUR);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
    const markedAt = new Date(startsAt.getTime() + 60_000);
    const slot = await owner.gigSlot.create({ data: { providerUserId: ids.expert!, providerKind: "EXPERT", kind: "ONE_TO_ONE", title: `ZZ TA 122 marked ${STAMP}`, startsAt, endsAt, meetingUrl: `https://meet.jit.si/zz-ta122-${STAMP}`, seats: 1, seatsTaken: 1 }, select: { id: true } });
    const booking = await owner.gigBooking.create({ data: { schoolId: ids.school!, slotId: slot.id, studentMembershipId: ids.pupilMember!, providerUserId: ids.expert!, kind: "ONE_TO_ONE", bookedByUserId: ids.guardian!, purpose: "ZZ a seat marked held at its start.", status: "DELIVERED", consentAt: startsAt, closedAt: markedAt }, select: { id: true } });

    const asGuardian = <T,>(work: () => Promise<T>) => forTenant({ schoolIds: [ids.school!], userId: ids.guardian!, joinCode: null, isSuperuser: false }, work);
    expect(await asGuardian(() => reportUnheld(person("guardian", "PARENT"), booking.id, new Date(endsAt.getTime() + HOUR)))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect(await owner.auditLog.count({ where: { action: "gig.booking.disputed", targetId: booking.id, schoolId: ids.school! } })).toBe(1);

    const operator = person("operator", null, { isSuperuser: true });
    const asOperator = <T,>(work: () => Promise<T>) => forTenant({ schoolIds: [], userId: ids.operator!, joinCode: null, isSuperuser: true }, work);
    const listed = (await asOperator(() => operatorDisputes(operator))).disputes.find((d) => d.bookingId === booking.id);
    expect(listed).toMatchObject({ mark: "DELIVERED", schoolName: `ZZ TA 122 Row ${STAMP}`, title: `ZZ TA 122 marked ${STAMP}` });
    expect(await asOperator(() => decideDispute(operator, booking.id, "RELEASE"))).toMatchObject({ ok: true, status: "DELIVERED" });
    expect((await owner.gigBooking.findUniqueOrThrow({ where: { id: booking.id }, select: { status: true } })).status).toBe("DELIVERED");
    expect(await owner.auditLog.count({ where: { action: "gig.booking.disputeRejected", targetId: booking.id, schoolId: ids.school! } })).toBe(1);
    expect(await owner.notification.count({ where: { userId: ids.expert!, titleKey: "gigs.notifDisputeRejectedProvider" } })).toBe(1);
  }, 60_000);
});
