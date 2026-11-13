/**
 * TA-175 (testing analysis of 13 November 2026, Medium, Security): a school a person has LEFT could still
 * rewrite or clear their date of birth (and correct their legal name) on the shared account. The office's
 * lookup asked `status: { not: "REMOVED" }`, a value Membership.status never holds, and no `leftAt`, so a
 * departed pupil's old membership id still opened the write. Clearing the date sets the account's isMinor,
 * and at the college the person now attends their guardian's consent gate stops asking for a grant.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) where the adult studies and has
 * granted nothing, and a scratch ZZ school the same person left, with its office.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { setMemberBirthdate } from "@/lib/birthdate";
import { correctLegalName } from "@/lib/legal-name";
import { parentMaySee } from "@/lib/student-consent";

let c: College;
const old = { schoolId: "", adminUserId: "", adminM: "", leftM: "" };

beforeAll(async () => {
  c = await makeCollege("birth");
  old.schoolId = (await c.db.school.create({ data: { name: `ZZ TA-175 Old School ${c.stamp}`, slug: `zz-ta175-old-${c.stamp}`, code: `ZT175${String(c.stamp).slice(-6)}`, contactEmail: `zz-tacons-birth-oldoffice-${c.stamp}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  old.adminUserId = (await c.db.user.create({ data: { name: "ZZ TA-175 Old Admin", email: `zz-tacons-birth-oldadmin-${c.stamp}@test.invalid`, prefs: "{}" }, select: { id: true } })).id;
  old.adminM = (await c.db.membership.create({ data: { userId: old.adminUserId, schoolId: old.schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  // The same person's seat at the old school, which they left.
  old.leftM = (await c.db.membership.create({ data: { userId: c.adult.userId, schoolId: old.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: new Date("2025-04-30T00:00:00.000Z") }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await c.db.school.deleteMany({ where: { id: old.schoolId } });
  await c.cleanup();
});

describe("TA-175: the office of a school the person has left", () => {
  it("TA-175: cannot clear their date of birth, and the college's consent gate still asks for a grant", async () => {
    const admin = c.ctx({ userId: old.adminUserId, membershipId: old.adminM }, "ADMIN", old.schoolId);
    const result = await setMemberBirthdate(admin, old.leftM, null);
    expect(result).toEqual({ ok: false, errorKey: "refusal.notAMemberHere" });
    const user = await c.db.user.findUniqueOrThrow({ where: { id: c.adult.userId }, select: { birthdate: true, isMinor: true } });
    expect(user.birthdate?.toISOString().slice(0, 10)).toBe("2000-01-15");
    expect(user.isMinor).toBe(false);
    expect(await parentMaySee(c.adult.membershipId, "RESULTS")).toBe(false);
  });

  it("TA-175: cannot correct their legal name either", async () => {
    const admin = c.ctx({ userId: old.adminUserId, membershipId: old.adminM }, "ADMIN", old.schoolId);
    const result = await correctLegalName(admin, old.leftM, "ZZ Someone Else", "SPELLING");
    expect(result).toEqual({ ok: false, errorKey: "refusal.notAMemberHere" });
    expect((await c.db.user.findUniqueOrThrow({ where: { id: c.adult.userId }, select: { name: true } })).name).toBe("ZZ TA Consent adult");
  });

  it("TA-175: the college the person attends still may", async () => {
    const admin = c.ctx(c.admin, "ADMIN");
    expect(await setMemberBirthdate(admin, c.adult.membershipId, "2000-01-16")).toEqual({ ok: true });
  });
});
