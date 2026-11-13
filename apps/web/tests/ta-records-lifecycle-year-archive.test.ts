/**
 * A closed year's archive after a pupil comes back: finding TA-376 of the
 * testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-376  schoolYearArchive counted a closed year's leavers by
 *           Membership.leftAt, which every readmission sets back to null, and
 *           its roll and closedYearsForPupil read Membership.joinedAt, which
 *           intake and admissions reset to the day of readmission: after a
 *           pupil who left in a closed year came back, that year's leavers
 *           dropped by one, its roll lost the pupil, and the pupil's Past
 *           years no longer offered it. The existing test titled "leavers
 *           survive a readmission" readmitted nobody.
 *
 * One scratch ZZ school of this suite's own (its stamp in every name and
 * address), made through the owner connection and removed in afterAll. The
 * readmission is a real one: intake with the school's own student code.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { recordDeparture } from "@/lib/school-record";
import { admitPupils } from "@/lib/intake";
import { closedYearsForPupil, schoolYearArchive } from "@/lib/year-archive";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-archive-${who}-${STAMP}@test.invalid`;
const CODE = `ZRLA-${String(STAMP).slice(-6)}`;
const ids: Record<string, string> = {};

function admin(): ActiveContext {
  return {
    sessionId: "zz-ta-rl-archive",
    membershipId: ids.adminM!,
    schoolId: ids.school!,
    role: "ADMIN",
    user: {
      id: ids.admin!, name: "ZZ RL Archive Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

let before: { leavers: number; pupilsOnRoll: number; pupilYears: string[] };
let after: { leavers: number; pupilsOnRoll: number; pupilYears: string[]; readmitted: string };

async function snapshot() {
  const archive = await schoolYearArchive(admin(), ids.closed!);
  const years = await closedYearsForPupil(ids.school!, ids.pupilM!);
  return { leavers: archive.leavers, pupilsOnRoll: archive.pupilsOnRoll, pupilYears: years.map((y) => y.name) };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-RL Archive ${STAMP}`, slug: `zz-ta-rl-archive-${STAMP}`, code: `ZZRLX${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ RL Archive Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.closed = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2024–25", startDate: new Date("2024-06-01T00:00:00Z"), endDate: new Date("2025-04-30T00:00:00Z"), isCurrent: false, closedAt: new Date("2025-05-01T00:00:00Z") }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true } });
  // On the roll from June 2024 (no admission date on a record), left in March 2025.
  ids.pupil = (await db.user.create({ data: { name: "ZZ RL Archive Pupil", email: MAIL("pupil"), prefs: "{}", birthdate: new Date("2014-01-01T00:00:00Z") }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: CODE, joinedAt: new Date("2024-06-10T04:00:00Z") }, select: { id: true } })).id;
  const left = await recordDeparture(admin(), ids.pupilM, { reason: "LEFT", leftOn: new Date("2025-03-01T06:00:00Z") });
  if (!left.ok) throw new Error(left.errorKey);

  before = await snapshot();
  const intake = await admitPupils(admin(), [{ line: 1, name: "ZZ RL Archive Pupil", birthdateKey: "2014-01-01", className: null, pupilEmail: null, guardianEmail: null, guardianName: null, relation: "PARENT", studentCode: CODE, pen: null }], { locale: "en" });
  after = { ...(await snapshot()), readmitted: intake.outcomes[0]?.status ?? "" };
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-376: a closed year's figures stay as they were when a pupil who left in it comes back", () => {
  it("TA-376 arrange: before the readmission the closed year counts one leaver on its roll, and the pupil's Past years offer it", () => {
    expect(before).toEqual({ leavers: 1, pupilsOnRoll: 1, pupilYears: ["ZZ 2024–25"] });
    expect(after.readmitted).toBe("admitted");
  });

  it("TA-376: after the readmission the closed year still counts the leaver and the roll, and the pupil's Past years still offer it", () => {
    expect({ leavers: after.leavers, pupilsOnRoll: after.pupilsOnRoll, pupilYears: after.pupilYears }).toEqual({ leavers: 1, pupilsOnRoll: 1, pupilYears: ["ZZ 2024–25"] });
  });
});
