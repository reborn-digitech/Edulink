/**
 * TA-276 (testing analysis of 13 November 2026): changing a certificate fee while it is being paid. setRequestFee read
 * the demand's "nothing paid yet" outside its transaction and then updated the demand by id alone, so a payment that
 * held the demand's lock and committed PAID in between was followed by the fee change writing a new net amount onto
 * the PAID row: PAID with money still owed, or paid above the net. The case below holds the demand's row lock the way
 * a counter payment does (FOR UPDATE, then PAID), starts the fee change while it is held, and commits.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { requestCertificate, setRequestFee } from "@/lib/certificate-requests";
import { presetsFor } from "@/lib/certificate-rules";
import { saveTemplate } from "@/lib/certificates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tacp-fee-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);
const guardian = () => ctx(ids.parent!, "PARENT", null);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Cert Fee ${STAMP}`, slug: `zz-tacp-fee-${STAMP}`, code: `ZCP${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  for (const who of ["admin", "parent", "pupil"]) ids[who] = (await db.user.create({ data: { name: `ZZ TACP Fee ${who}`, email: mail(who), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZCP${SUFFIX}1` }, select: { id: true } })).id;
  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 6C", gradeLevel: "6", joinCode: `ZCP${SUFFIX}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId: ids.school, classId: ids.class, studentMembershipId: ids.pupilM, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, status: "ACTIVE" } });
  await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Papers", code: "PAP", kind: "OTHER" } });
  await saveTemplate(admin(), { ...presetsFor("en").find((x) => x.kind === "STUDY")!, active: true });
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("a certificate fee changed while it is being paid", { timeout: 30_000 }, () => {
  it("TA-276: a payment committing PAID while the fee change waits for the demand's lock: the change is refused and the PAID demand still adds up", async () => {
    const requestId = (await requestCertificate(guardian(), { kind: "STUDY", purpose: "a scholarship" }, ids.pupilM!)).id;
    await setRequestFee(admin(), requestId, 100_00);
    const demandId = (await db.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, select: { feeDemandId: true } })).feeDemandId!;

    let change: Promise<unknown> | null = null;
    await db.$transaction(
      async (tx) => {
        // The counter's payment: the demand locked, then paid in full, not yet committed.
        await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${demandId} FOR UPDATE`;
        await tx.feeDemand.update({ where: { id: demandId }, data: { paidPaise: 100_00, status: "PAID" } });
        // Another office user raises the fee now: its first read still sees nothing paid, and its write waits on the lock.
        change = setRequestFee(admin(), requestId, 200_00).then(
          () => "changed",
          (error: unknown) => (error instanceof Error ? error.message : String(error)),
        );
        await sleep(1500);
      },
      { timeout: 20_000 },
    );
    expect(await change).toBe("certificateRequests.refuseFeePaid");
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true, paidPaise: true, netPaise: true, grossPaise: true } });
    expect(demand).toEqual({ status: "PAID", paidPaise: 100_00, netPaise: 100_00, grossPaise: 100_00 });
    expect((await db.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, select: { feePaise: true } })).feePaise).toBe(100_00);
  });
});
