/**
 * Notices to an adult college student's guardians (testing analysis of 13 November 2026, the 'consent'
 * batch). The owner's rule (G4-7, src/lib/student-consent.ts): an adult's guardian sees nothing a grant
 * guards until the student grants it, and a family page that names no grant is refused for such a
 * student outright (assertGuardianAccess). The notices were the other way round.
 *
 *   TA-262  notifyGuardians and notifyGuardiansOfClass told every guardian whenever the caller passed no grant.
 *   TA-106  an incident was pushed and texted to an adult's guardians, guardiansNotifiedAt stamped.
 *   TA-281  the register's absence notice and the office's absence alert skipped the ATTENDANCE grant.
 *   TA-176  the weekly digest named the adult's days, practice and badges with nothing granted.
 *   TA-129  the leaving settlement told the guardians the cancelled and kept amounts without MONEY.
 *   TA-027  Vidura's one-time notice went to an adult's guardians, and a guardian's opt-out set before
 *           eighteen locked the adult out with nobody able to lift it.
 *   TA-527  revoking a certificate told the guardians only, and an adult (whose guardians are skipped) nobody.
 *   TA-262  (again) a caller that checked parentMaySee itself and then named no grant lost the granted guardian's notice.
 *
 * One scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { notifyGuardians, notifyGuardiansOfClass } from "@/lib/notify";
import { recordIncident } from "@/lib/incidents";
import { saveAttendanceBatch } from "@/lib/attendance";
import { sendAbsenceAlert } from "@/lib/attendance-intel";
import { sendWeeklyDigests } from "@/lib/digest";
import { settleOnLeaving } from "@/lib/leaving-settlement";
import { assistantStatus, familyAssistant, openConversation } from "@/lib/assistant/service";
import { revokeCertificate } from "@/lib/certificates";
import { updateClaim } from "@/lib/scholarships";
import { addDaysToKey, todayKey } from "@/lib/dates";

let c: College;
let classId = "";

const count = (userId: string, where: Record<string, unknown> = {}) => c.db.notification.count({ where: { userId, ...where } });

beforeAll(async () => {
  c = await makeCollege("notices");
  classId = (await c.db.class.create({ data: { schoolId: c.schoolId, name: "ZZ TA Consent FY-A", gradeLevel: "FY", joinCode: `ZTCN${c.stamp}` }, select: { id: true } })).id;
  await c.db.enrollment.createMany({
    data: [c.adult.membershipId, c.minor.membershipId].map((studentMembershipId) => ({ classId, schoolId: c.schoolId, studentMembershipId, status: "ACTIVE" })),
  });
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-262: a notice to the guardians names its grant, and naming none tells an adult's guardians nothing", () => {
  it("TA-262: notifyGuardians with no grant tells the minor's guardian and not the adult's", async () => {
    const build = () => ({ schoolId: c.schoolId, kind: "SYSTEM" as const, title: `ZZ TA-262 ${c.stamp}`, url: "/parent" });
    await notifyGuardians(c.adult.membershipId, build);
    await notifyGuardians(c.minor.membershipId, build);
    expect(await count(c.guardianOfAdult.userId, { title: `ZZ TA-262 ${c.stamp}` })).toBe(0);
    expect(await count(c.guardian.userId, { title: `ZZ TA-262 ${c.stamp}` })).toBe(1);
  });

  it("TA-262: notifyGuardiansOfClass with no grant leaves the adult's guardians out", async () => {
    const told = await notifyGuardiansOfClass([c.adult.membershipId, c.minor.membershipId], () => ({ schoolId: c.schoolId, kind: "SYSTEM" as const, title: `ZZ TA-262 class ${c.stamp}`, url: "/parent" }));
    expect(told).toBe(1);
    expect(await count(c.guardianOfAdult.userId, { title: `ZZ TA-262 class ${c.stamp}` })).toBe(0);
    expect(await count(c.guardian.userId, { title: `ZZ TA-262 class ${c.stamp}` })).toBe(1);
  });

  it("TA-262: a grant the adult has given still tells their guardians", async () => {
    await c.grant(c.adult.membershipId, "RESULTS");
    await notifyGuardians(c.adult.membershipId, () => ({ schoolId: c.schoolId, kind: "SYSTEM" as const, title: `ZZ TA-262 granted ${c.stamp}`, url: "/parent" }), "RESULTS");
    expect(await count(c.guardianOfAdult.userId, { title: `ZZ TA-262 granted ${c.stamp}` })).toBe(1);
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-106: an incident recorded for an adult college student", () => {
  it("TA-106: is not pushed or texted to the adult's guardians, and guardiansNotifiedAt stays empty; a minor's are told", async () => {
    const admin = c.ctx(c.admin, "ADMIN");
    const input = { kind: "ILLNESS" as const, severity: "MINOR" as const, place: "", title: "ZZ TA-106 fainted in the lab", body: "ZZ TA-106 a short note.", actionTaken: "", notifyGuardians: true };
    const adult = await recordIncident(admin, { ...input, studentMembershipId: c.adult.membershipId });
    const minor = await recordIncident(admin, { ...input, studentMembershipId: c.minor.membershipId });
    expect(await count(c.guardianOfAdult.userId, { kind: "INCIDENT" })).toBe(0);
    expect(await c.db.outboundMessage.count({ where: { purpose: `incident:${adult.id}` } })).toBe(0);
    expect((await c.db.incident.findUniqueOrThrow({ where: { id: adult.id }, select: { guardiansNotifiedAt: true } })).guardiansNotifiedAt).toBeNull();
    expect(await count(c.guardian.userId, { kind: "INCIDENT", url: { contains: minor.id } })).toBe(1);
    expect(await count(c.guardian.userId, { kind: "INCIDENT", url: { contains: adult.id } })).toBe(0);
  });
});

describe("TA-281: the register's absence notice and the office's absence alert", () => {
  it("TA-281: marking an adult absent tells their guardians nothing until ATTENDANCE is granted; a minor's are told", async () => {
    const today = todayKey("Asia/Kolkata");
    const mark = (dateKey: string, studentMembershipId: string, n: number) =>
      saveAttendanceBatch({ schoolId: c.schoolId, classId, dateKey, marks: [{ studentMembershipId, status: "ABSENT", clientId: `zz-ta281-${c.stamp}-${n}` }], takenByMembershipId: c.teacher.membershipId, actorUserId: c.teacher.userId });
    await mark(addDaysToKey(today, -2), c.adult.membershipId, 1);
    await mark(addDaysToKey(today, -2), c.minor.membershipId, 2);
    expect(await count(c.guardianOfAdult.userId, { kind: "ATTENDANCE" })).toBe(0);
    expect(await count(c.guardian.userId, { kind: "ATTENDANCE" })).toBe(1);
    await c.grant(c.adult.membershipId, "ATTENDANCE");
    await mark(addDaysToKey(today, -1), c.adult.membershipId, 3);
    expect(await count(c.guardianOfAdult.userId, { kind: "ATTENDANCE" })).toBe(1);
    await c.revokeAll(c.adult.membershipId);
  });

  it("TA-281: the office's absence alert for an adult who has not granted ATTENDANCE goes to nobody", async () => {
    const admin = c.ctx(c.admin, "ADMIN");
    const before = await count(c.guardianOfAdult.userId, { titleKey: "notifTitle.aboutAttendance" });
    const result = await sendAbsenceAlert(admin, c.adult.membershipId);
    expect(result.notified).toBe(0);
    expect(await count(c.guardianOfAdult.userId, { titleKey: "notifTitle.aboutAttendance" })).toBe(before);
    expect(await c.db.outboundMessage.count({ where: { userId: c.guardianOfAdult.userId, purpose: "absence" } })).toBe(0);
  });
});

describe("TA-176: the weekly digest", () => {
  const digests = (userId: string) => c.db.notification.findMany({ where: { userId, meta: { contains: '"weekly-digest"' } }, select: { body: true } });

  it("TA-176: names an adult's week to their guardian only under the grants each line needs", async () => {
    // The adult has register days this week (TA-281's case above). Nothing is granted.
    await sendWeeklyDigests({ onlyParentUserIds: [c.guardianOfAdult.userId] });
    expect(await digests(c.guardianOfAdult.userId)).toEqual([]);
    // RESULTS alone: the attendance line stays out, and with nothing else to say no digest goes.
    await c.grant(c.adult.membershipId, "RESULTS");
    await sendWeeklyDigests({ onlyParentUserIds: [c.guardianOfAdult.userId] });
    expect(await digests(c.guardianOfAdult.userId)).toEqual([]);
    // ATTENDANCE as well: the days are told.
    await c.grant(c.adult.membershipId, "ATTENDANCE");
    await sendWeeklyDigests({ onlyParentUserIds: [c.guardianOfAdult.userId] });
    const sent = await digests(c.guardianOfAdult.userId);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.body).toContain("ZZ TA Consent adult");
    await c.revokeAll(c.adult.membershipId);
  });
});

describe("TA-129: the leaving settlement's notice", () => {
  it("TA-129: tells an adult's guardians the amounts only under the MONEY grant", async () => {
    const year = await c.db.academicYear.create({ data: { schoolId: c.schoolId, name: "ZZ 2026-27", startDate: new Date("2026-06-01T00:00:00.000Z"), endDate: new Date("2027-05-31T00:00:00.000Z"), isCurrent: true }, select: { id: true } });
    const admin = c.ctx(c.admin, "ADMIN");
    const settle = async (studentMembershipId: string) => {
      const demand = await c.db.feeDemand.create({ data: { schoolId: c.schoolId, studentMembershipId, academicYearId: year.id, label: "ZZ TA-129 Term 2", dueDate: new Date("2026-12-01T00:00:00.000Z"), grossPaise: 1_200_000, netPaise: 1_200_000 }, select: { id: true } });
      await c.db.membership.update({ where: { id: studentMembershipId }, data: { leftAt: new Date("2026-11-01T00:00:00.000Z") } });
      await settleOnLeaving(admin, studentMembershipId, { lines: [{ demandId: demand.id, choice: "KEEP" }] });
    };
    await settle(c.adult.membershipId);
    expect(await count(c.guardianOfAdult.userId, { titleKey: "ownerDecisions.notifSettledTitle" })).toBe(0);
    expect(await count(c.guardian.userId, { titleKey: "ownerDecisions.notifSettledTitle" })).toBe(0);
    const granted = await c.addStudent("adult2", true);
    await c.grant(granted.membershipId, "MONEY");
    await settle(granted.membershipId);
    expect(await count(c.guardian.userId, { titleKey: "ownerDecisions.notifSettledTitle" })).toBe(1);
    // Back on the roll for the cases below.
    await c.db.membership.update({ where: { id: c.adult.membershipId }, data: { leftAt: null } });
  });
});

describe("TA-027: Vidura and an adult college student", () => {
  it("TA-027: the first conversation tells an adult's guardians nothing, and a minor's are told once", async () => {
    await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "ASSISTANT" } });
    await openConversation(c.ctx(c.adult, "STUDENT"), { language: "en" });
    await openConversation(c.ctx(c.minor, "STUDENT"), { language: "en" });
    expect(await count(c.guardianOfAdult.userId, { titleKey: "assistantService.noticeTitle" })).toBe(0);
    expect(await count(c.guardian.userId, { titleKey: "assistantService.noticeTitle" })).toBe(1);
  });

  it("TA-027: an opt-out a guardian set before the student was eighteen does not hold for the adult, and the guardian's card does not offer the adult's switch", async () => {
    await c.db.assistantChildSetting.upsert({
      where: { studentMembershipId: c.adult.membershipId },
      create: { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, optedOut: true, changedByUserId: c.guardian.userId, changedAt: new Date() },
      update: { optedOut: true },
    });
    const status = await assistantStatus(c.ctx(c.adult, "STUDENT"));
    expect(status.reason).not.toBe("OPTED_OUT");
    const card = await familyAssistant(c.ctx(c.guardian, "PARENT"));
    expect(card.children.map((x) => x.childId)).toEqual([c.minor.membershipId]);
  });
});

describe("TA-527: revoking a certificate", () => {
  it("TA-527: tells the student themself; an adult's guardians are still not told, a minor's are", async () => {
    const paper = (studentMembershipId: string, n: number) =>
      c.db.issuedCertificate.create({ data: { schoolId: c.schoolId, studentMembershipId, kind: "BONAFIDE", locale: "en", serial: `ZZ-TA527-${n}`, number: n, title: "Bonafide certificate", code: `ZZ527${n}${c.stamp}` }, select: { id: true } });
    const admin = c.ctx(c.admin, "ADMIN");
    const adultPaper = await paper(c.adult.membershipId, 1);
    const minorPaper = await paper(c.minor.membershipId, 2);
    await revokeCertificate(admin, adultPaper.id, "ZZ issued in error");
    await revokeCertificate(admin, minorPaper.id, "ZZ issued in error");
    expect(await count(c.adult.userId, { url: `/certificates/${adultPaper.id}` })).toBe(1);
    expect(await count(c.minor.userId, { url: `/certificates/${minorPaper.id}` })).toBe(1);
    expect(await count(c.guardianOfAdult.userId, { url: `/certificates/${adultPaper.id}` })).toBe(0);
    expect(await count(c.guardian.userId, { url: `/certificates/${minorPaper.id}` })).toBe(1);
  });
});

describe("TA-262: a notice whose caller checked the grant itself", () => {
  it("TA-262: a lapsed scholarship is still told to the guardian of an adult who granted MONEY, and not to one who granted nothing", async () => {
    await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "SCHOLARSHIPS" } });
    const admin = c.ctx(c.admin, "ADMIN");
    const granted = await c.addStudent("adult3", true);
    await c.grant(granted.membershipId, "MONEY");
    const lapse = async (studentMembershipId: string) => {
      const claim = await c.db.scholarshipClaim.create({ data: { schoolId: c.schoolId, studentMembershipId, scheme: "EBC", academicYear: "2026-27", expectedPaise: 2_500_000, status: "APPLIED" }, select: { id: true } });
      await updateClaim(admin, claim.id, { action: "LAPSE", reason: "ZZ TA-262 not renewed on the portal" });
    };
    await lapse(c.adult.membershipId);
    expect(await count(c.guardianOfAdult.userId, { titleKey: "collegeOffice.notifScholarshipLapsed" })).toBe(0);
    await lapse(granted.membershipId);
    expect(await count(c.guardian.userId, { titleKey: "collegeOffice.notifScholarshipLapsed" })).toBe(1);
    // The students themselves are told either way.
    expect(await count(c.adult.userId, { titleKey: "collegeOffice.notifScholarshipLapsed" })).toBe(1);
    expect(await count(granted.userId, { titleKey: "collegeOffice.notifScholarshipLapsed" })).toBe(1);
  });
});
