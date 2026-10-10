/**
 * THE PREVIOUS SCHOOLS (R-70, the owner's decision of 10 October 2026): on the
 * pupil's record at the new school and on the family's page, each school the
 * pupil has left with its leaving certificate and its PUBLISHED report cards.
 *
 * WHAT THIS FILE CAN SHOW. It runs as the database owner, so the row policy
 * (scripts/gen-rls.ts, verified live by `npm run rls:verify`) is not in
 * force; what is held here is the library's own reading of the same
 * clauses — the roll clause (a pupil who left the new school too reads
 * nothing), the guardian clause (a guardian linked at the old school reads
 * the old papers; one linked only at the new school does not, as the TC
 * itself works), a draft never listed, and a school that never had the pupil
 * refused with NOT_FOUND (the door's 404).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { previousSchoolsFor } from "@/lib/previous-schools";
import { recordDeparture } from "@/lib/school-record";
import { AccessError } from "@/lib/access-error";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { old: "", next: "", third: "", oldAdmin: "", nextAdmin: "", thirdAdmin: "", oldAdminM: "", nextAdminM: "", thirdAdminM: "", pupil: "", oldM: "", nextM: "", parentOld: "", parentNew: "", card: "" };

function ctx(role: "ADMIN" | "PARENT" | "STUDENT", userId: string, membershipId: string | null, schoolId: string | null): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role,
    user: { id: userId, name: "ZZ Prev", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  const school = async (tag: string) => (await db.school.create({ data: { name: `ZZ Prev ${tag} ${STAMP}`, slug: `zz-prev-${tag.toLowerCase()}-${STAMP}`, code: `ZP${tag[0]}${SUFFIX}`, contactEmail: `zz-prev-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en" }, select: { id: true } })).id;
  ids.old = await school("Old");
  ids.next = await school("New");
  ids.third = await school("Third");
  const user = async (who: string, birthdate: Date | null = null) => (await db.user.create({ data: { name: `ZZ Prev ${who}`, email: `zz-prev-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate }, select: { id: true } })).id;
  const admin = async (schoolId: string, who: string) => {
    const userId = await user(who);
    const m = await db.membership.create({ data: { userId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    return [userId, m.id] as const;
  };
  [ids.oldAdmin, ids.oldAdminM] = await admin(ids.old, "OldAdmin");
  [ids.nextAdmin, ids.nextAdminM] = await admin(ids.next, "NewAdmin");
  [ids.thirdAdmin, ids.thirdAdminM] = await admin(ids.third, "ThirdAdmin");
  ids.pupil = await user("Pupil", new Date("2015-02-14T00:00:00Z"));
  ids.parentOld = await user("ParentOld");
  ids.parentNew = await user("ParentNew");
  const longAgo = new Date(Date.now() - 400 * 86_400_000);
  ids.oldM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.old, role: "STUDENT", status: "ACTIVE", studentCode: `ZPO${STAMP}`, joinedAt: longAgo, gradeLevel: "5" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: ids.old, name: "ZZ Prev 5A", gradeLevel: "5", joinCode: `ZP5${SUFFIX}` }, select: { id: true } });
  await db.enrollment.create({ data: { classId: klass.id, schoolId: ids.old, studentMembershipId: ids.oldM, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.parentOld, studentMembershipId: ids.oldM, studentSchoolId: ids.old, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
  const card = (title: string, status: string) =>
    db.reportCard.create({ data: { schoolId: ids.old, classId: klass.id, studentMembershipId: ids.oldM, title, status, fromDateKey: "2025-06-01", toDateKey: "2026-04-30", attendancePresent: 180, attendanceTotal: 200, overallPercentMilli: 79_750, overallLetter: "B+", subjects: JSON.stringify([{ subject: "English", percent: 78, letter: "B+" }, { subject: "Mathematics", percent: 86, letter: "A" }]), remark: "ZZ Promoted.", publishedAt: status === "PUBLISHED" ? new Date("2026-04-25T09:00:00Z") : null }, select: { id: true } });
  ids.card = (await card("ZZ Annual 2025–26", "PUBLISHED")).id;
  await card("ZZ Draft", "DRAFT");
  // The old school records the departure: the live leaving certificate that opens its papers.
  const left = await recordDeparture(ctx("ADMIN", ids.oldAdmin, ids.oldAdminM, ids.old), ids.oldM, { reason: "TRANSFERRED", conduct: "GOOD", leftOn: new Date("2026-04-30T12:00:00Z") });
  if (!left.ok) throw new Error(`recordDeparture refused: ${left.errorKey}`);
  // On the new school's roll now; the new-school parent linked only here.
  ids.nextM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.next, role: "STUDENT", status: "ACTIVE", studentCode: `ZPN${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parentNew, studentMembershipId: ids.nextM, studentSchoolId: ids.next, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
}, 120_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [ids.old, ids.next, ids.third] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 60_000);

describe("the roll clause", () => {
  it("the new school's office reads the old school's certificate and its PUBLISHED card with the subjects snapshot, never the draft", async () => {
    const view = await previousSchoolsFor(ctx("ADMIN", ids.nextAdmin, ids.nextAdminM, ids.next), ids.nextM);
    expect(view.schools).toHaveLength(1);
    const s = view.schools[0]!;
    expect(s.schoolName).toBe(`ZZ Prev Old ${STAMP}`);
    expect(s.reason).toBe("TRANSFERRED");
    expect(s.serial).toMatch(/^TC\//);
    expect(s.cards.map((c) => c.id)).toEqual([ids.card]);
    expect(s.cards[0]).toMatchObject({ title: "ZZ Annual 2025–26", overallPercent: 79.75, overallLetter: "B+", attendancePresent: 180, attendanceTotal: 200, remark: "ZZ Promoted." });
    expect(s.cards[0]!.subjects).toEqual([{ subject: "English", percent: 78, letter: "B+" }, { subject: "Mathematics", percent: 86, letter: "A" }]);
  }, 60_000);

  it("a pupil who has left the new school too reads nothing; back on the roll, everything again", async () => {
    await db.membership.update({ where: { id: ids.nextM }, data: { leftAt: new Date() } });
    const gone = await previousSchoolsFor(ctx("ADMIN", ids.nextAdmin, ids.nextAdminM, ids.next), ids.nextM);
    expect(gone.schools).toEqual([]);
    await db.membership.update({ where: { id: ids.nextM }, data: { leftAt: null } });
    expect((await previousSchoolsFor(ctx("ADMIN", ids.nextAdmin, ids.nextAdminM, ids.next), ids.nextM)).schools).toHaveLength(1);
  }, 60_000);

  it("a school that never had the pupil is refused (NOT_FOUND, the door's 404), the old school's own office reads nothing across, and a non-office role at the school is refused", async () => {
    await expect(previousSchoolsFor(ctx("ADMIN", ids.thirdAdmin, ids.thirdAdminM, ids.third), ids.nextM)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(previousSchoolsFor(ctx("ADMIN", ids.thirdAdmin, ids.thirdAdminM, ids.third), ids.oldM)).rejects.toMatchObject({ code: "NOT_FOUND" });
    // The old school's office: the pupil left it, so the roll clause closes, and its own papers are its own pages' anyway.
    expect((await previousSchoolsFor(ctx("ADMIN", ids.oldAdmin, ids.oldAdminM, ids.old), ids.oldM)).schools).toEqual([]);
    await expect(previousSchoolsFor({ ...ctx("ADMIN", ids.nextAdmin, ids.nextAdminM, ids.next), role: "TEACHER" }, ids.nextM)).rejects.toBeInstanceOf(AccessError);
  }, 60_000);
});

describe("the guardian and self clauses", () => {
  it("a guardian linked at the old school reads its certificate and card for the child's new membership; one linked only at the new school reads nothing of the old school", async () => {
    await db.guardianship.create({ data: { parentUserId: ids.parentOld, studentMembershipId: ids.nextM, studentSchoolId: ids.next, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
    const old = await previousSchoolsFor(ctx("PARENT", ids.parentOld, null, null), ids.nextM);
    expect(old.schools).toHaveLength(1);
    expect(old.schools[0]!.cards.map((c) => c.id)).toEqual([ids.card]);
    const onlyNew = await previousSchoolsFor(ctx("PARENT", ids.parentNew, null, null), ids.nextM);
    expect(onlyNew.schools).toEqual([]);
    // A stranger is not a guardian at all.
    await expect(previousSchoolsFor(ctx("PARENT", ids.thirdAdmin, null, null), ids.nextM)).rejects.toBeInstanceOf(AccessError);
  }, 60_000);

  it("the pupil reads their own", async () => {
    const mine = await previousSchoolsFor(ctx("STUDENT", ids.pupil, ids.nextM, ids.next), ids.nextM);
    expect(mine.schools).toHaveLength(1);
    expect(mine.schools[0]!.cards).toHaveLength(1);
    await expect(previousSchoolsFor(ctx("STUDENT", ids.parentNew, ids.nextM, ids.next), ids.nextM)).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 60_000);
});
