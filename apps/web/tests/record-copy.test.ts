/**
 * COPY FROM THE PREVIOUS SCHOOL'S RECORD (R-69, the owner's decision of 10
 * October 2026). A pupil admitted on their PEN through the real admission
 * steps (officeApply, offer, respond, admit) is offered the coded lines of
 * the previous school's record; the copy fills the blanks here, audits at
 * both schools and tells the guardian; a line already filled is kept; a
 * coded line whose old value does not code is not copied; an admission with
 * no PEN mints a new account with no certificate elsewhere, so there is no
 * offer (null) and the click is refused.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { admit, createCycle, officeApply, offer, respond, setCycleStatus } from "@/lib/admissions";
import { copyPreviousRecord, recordCopyPreview } from "@/lib/record-copy";
import { recordDeparture } from "@/lib/school-record";
import { assignPen } from "@/lib/pen";
import { AccessError } from "@/lib/access-error";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");
const PEN = `5${String(STAMP).slice(-10)}`;
const ids = { old: "", next: "", oldAdmin: "", oldAdminM: "", nextAdmin: "", nextAdminM: "", pupil: "", oldM: "", parent: "", nextM: "", freshM: "" };

function ctx(role: "ADMIN" | "PRINCIPAL", userId: string, membershipId: string, schoolId: string): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role,
    user: { id: userId, name: "ZZ Copy", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}
const nextOffice = () => ctx("ADMIN", ids.nextAdmin, ids.nextAdminM, ids.next);

beforeAll(async () => {
  const school = async (tag: string) => (await db.school.create({ data: { name: `ZZ Copy ${tag} ${STAMP}`, slug: `zz-copy-${tag.toLowerCase()}-${STAMP}`, code: `ZC${tag[0]}${SUFFIX}`, contactEmail: `zz-copy-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date() }, select: { id: true } })).id;
  ids.old = await school("Old");
  ids.next = await school("New");
  const user = async (who: string, birthdate: Date | null = null) => (await db.user.create({ data: { name: `ZZ Copy ${who}`, email: `zz-copy-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate }, select: { id: true } })).id;
  const admin = async (schoolId: string, who: string) => {
    const userId = await user(who);
    const m = await db.membership.create({ data: { userId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    return [userId, m.id] as const;
  };
  [ids.oldAdmin, ids.oldAdminM] = await admin(ids.old, "OldAdmin");
  [ids.nextAdmin, ids.nextAdminM] = await admin(ids.next, "NewAdmin");
  ids.pupil = await user("Pupil", new Date("2015-02-14T00:00:00Z"));
  ids.parent = await user("Parent");
  await assignPen(ids.pupil, PEN);
  const longAgo = new Date(Date.now() - 400 * 86_400_000);
  ids.oldM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.old, role: "STUDENT", status: "ACTIVE", studentCode: `ZCO${STAMP}`, joinedAt: longAgo, gradeLevel: "5" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: ids.oldM, studentSchoolId: ids.old, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
  // The old school's record: coded lines, a mother tongue typed before the lists (not copied), the address and a phone (never copied).
  await db.pupilRecord.create({ data: { schoolId: ids.old, studentMembershipId: ids.oldM, category: "OBC", religion: "HINDU", caste: "ZZ Kunbi", motherTongue: "Konkani-ish", placeOfBirth: "ZZ Pune", nationality: "INDIAN", fatherName: "ZZ Prakash", motherName: "ZZ Sunita", addressLine: "ZZ 7 Sahakar Nagar", guardianPhone: "+919800000000", admissionNumber: "OLD/1", penNumber: PEN } });
  const left = await recordDeparture(ctx("ADMIN", ids.oldAdmin, ids.oldAdminM, ids.old), ids.oldM, { reason: "TRANSFERRED", conduct: "GOOD", leftOn: new Date("2026-04-30T12:00:00Z") });
  if (!left.ok) throw new Error(`recordDeparture refused: ${left.errorKey}`);

  // The new school: a year, a grade-6 class, an open cycle, and two walk-ins — one on the PEN, one with none.
  const year = await db.academicYear.create({ data: { schoolId: ids.next, name: "ZZ 2026–27", startDate: new Date(`${addDaysToKey(TODAY, -120)}T00:00:00Z`), endDate: new Date(`${addDaysToKey(TODAY, 240)}T00:00:00Z`), isCurrent: true }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId: ids.next, name: "ZZ Copy 6A", gradeLevel: "6", joinCode: `ZC6${SUFFIX}` }, select: { id: true } });
  const office = nextOffice();
  const cycle = await createCycle(office, { academicYearId: year.id, name: "ZZ Copy cycle", grades: [{ grade: "6", seats: 5 }], documents: [], testRequired: false, notice: "ZZ", feeStructureId: null, opensAt: null, closesAt: null } as never);
  await setCycleStatus(office, cycle.id, "OPEN");
  const walkIn = async (name: string, penNumber: string | null) => {
    const app = await officeApply(office, { cycleId: cycle.id, childName: name, childBirthdate: "2015-02-14", gradeApplied: "6", previousSchool: "ZZ Copy Old", penNumber, addressLine: "ZZ 12 Mayur Colony", city: "Pune", note: null, applicantName: "ZZ Copy Parent", applicantPhone: "+919800000001", applicantEmail: null, relation: "PARENT" } as never);
    await offer(office, app.id, { expiresOn: null, feeStructureId: null });
    await respond(office, app.id, { answer: "ACCEPT" });
    return (await admit(office, app.id, { classId: klass.id, feeStructureId: null })).studentMembershipId;
  };
  ids.nextM = await walkIn("ZZ Copy Pupil", PEN);
  ids.freshM = await walkIn("ZZ Copy Fresh", null);
}, 120_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [ids.old, ids.next] } } });
  await db.user.deleteMany({ where: { OR: [{ email: { contains: `-${STAMP}@test.invalid` } }, { name: { startsWith: "ZZ Copy Fresh" } }, { name: "ZZ Copy Pupil" }] } });
  await db.$disconnect();
}, 60_000);

describe("the offer and the copy", () => {
  it("an admission matched by PEN is offered the coded lines of the previous school's record; the old record's address, phone and a word that codes to nothing are not among them", async () => {
    const m = await db.membership.findUniqueOrThrow({ where: { id: ids.nextM }, select: { userId: true } });
    expect(m.userId).toBe(ids.pupil);
    const preview = await recordCopyPreview(nextOffice(), ids.nextM);
    expect(preview).not.toBeNull();
    expect(preview!.fromSchoolName).toBe(`ZZ Copy Old ${STAMP}`);
    expect(preview!.canCopy).toBe(true);
    expect(preview!.copiedAt).toBeNull();
    expect(preview!.lines.map((l) => [l.field, l.value, l.blankHere])).toEqual([
      ["category", "OBC", true],
      ["religion", "HINDU", true],
      ["caste", "ZZ Kunbi", true],
      ["placeOfBirth", "ZZ Pune", true],
      ["nationality", "INDIAN", true],
      ["fatherName", "ZZ Prakash", true],
      ["motherName", "ZZ Sunita", true],
    ]);
    // The head reads the offer but may not click.
    expect((await recordCopyPreview(ctx("PRINCIPAL", ids.nextAdmin, ids.nextAdminM, ids.next), ids.nextM))!.canCopy).toBe(false);
    await expect(copyPreviousRecord(ctx("PRINCIPAL", ids.nextAdmin, ids.nextAdminM, ids.next), ids.nextM)).rejects.toBeInstanceOf(AccessError);
  }, 60_000);

  it("the copy fills the blanks, keeps a line already filled, audits at both schools and tells the guardian; the preview then says when", async () => {
    await db.pupilRecord.update({ where: { studentMembershipId: ids.nextM }, data: { fatherName: "ZZ Prakash P." } });
    const result = await copyPreviousRecord(nextOffice(), ids.nextM);
    expect(result.copied).toEqual(["category", "religion", "caste", "placeOfBirth", "nationality", "motherName"]);
    const record = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: ids.nextM }, select: { category: true, religion: true, caste: true, motherTongue: true, placeOfBirth: true, nationality: true, fatherName: true, motherName: true, addressLine: true, guardianPhone: true, previousSchool: true, penNumber: true } });
    expect(record).toEqual({ category: "OBC", religion: "HINDU", caste: "ZZ Kunbi", motherTongue: null, placeOfBirth: "ZZ Pune", nationality: "INDIAN", fatherName: "ZZ Prakash P.", motherName: "ZZ Sunita", addressLine: "ZZ 12 Mayur Colony", guardianPhone: null, previousSchool: "ZZ Copy Old", penNumber: PEN });
    const here = await db.auditLog.findFirst({ where: { schoolId: ids.next, action: "pupilRecord.copiedFrom", targetId: ids.nextM }, select: { meta: true } });
    expect(JSON.parse(here!.meta)).toMatchObject({ fromSchoolId: ids.old, fields: result.copied });
    const there = await db.auditLog.findFirst({ where: { schoolId: ids.old, action: "pupilRecord.copiedTo", targetId: ids.oldM }, select: { meta: true } });
    expect(JSON.parse(there!.meta)).toMatchObject({ toSchoolId: ids.next, fields: result.copied });
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "ownerDecisions.notifRecordCopiedTitle" } })).toBe(1);
    const again = await recordCopyPreview(nextOffice(), ids.nextM);
    expect(again!.copiedAt).not.toBeNull();
    expect(again!.canCopy).toBe(false);
    expect(again!.lines.every((l) => !l.blankHere)).toBe(true);
    // Clicking again copies nothing and changes nothing.
    expect((await copyPreviousRecord(nextOffice(), ids.nextM)).copied).toEqual([]);
  }, 60_000);

  it("an admission with no PEN has no such offer: the preview is null and the click is refused", async () => {
    expect(await recordCopyPreview(nextOffice(), ids.freshM)).toBeNull();
    await expect(copyPreviousRecord(nextOffice(), ids.freshM)).rejects.toMatchObject({ key: "ownerDecisions.refuseNoPreviousRecord", code: "NOT_FOUND" });
    // Nor for a pupil of another school.
    await expect(recordCopyPreview(ctx("ADMIN", ids.oldAdmin, ids.oldAdminM, ids.old), ids.nextM)).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 60_000);
});
