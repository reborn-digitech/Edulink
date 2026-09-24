/**
 * Small fixes from the security review, each with the one test that pins it:
 * a caller-typed grade cannot reach a Content-Disposition filename; an
 * incident's push carries no health or incident words; the audit log holds
 * no free-text reason for a suspension or a departure; an organiser's link
 * is https or refused.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { cbseCandidatesExport, msbshseCandidatesExport } from "@/lib/filings";
import { recordIncident } from "@/lib/incidents";
import { suspendMembership } from "@/lib/membership";
import { recordDeparture } from "@/lib/school-record";
import { isHttpsUrl, readPlatformCompetitionForm } from "@/lib/app-admin";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let teacherMembershipId = "";
let parentUserId = "";
let pupilMembershipId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return { sessionId: "t", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null, user: { id: over.userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Secfix ${STAMP}`, slug: `zz-secfix-${STAMP}`, code: `ZSF${suffix}`, contactEmail: `zz-secfix-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Secfix ${who}`, email: `zz-secfix-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [adminUser, teacherUser, parentUser, pupilUser] = await Promise.all([mk("Admin"), mk("Teacher"), mk("Parent"), mk("Pupil")]);
  adminUserId = adminUser.id;
  parentUserId = parentUser.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  pupilMembershipId = (await db.membership.create({ data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSF${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilMembershipId, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("export filenames", () => {
  it("a grade typed by the caller reaches the filename as word characters and hyphens only", async () => {
    const cbse = await cbseCandidatesExport(admin(), '5.html";x=');
    expect(cbse.filename).toMatch(/^cbse-candidates-class-5htmlx-\d{4}-\d{2}-\d{2}\.csv$/);
    const state = await msbshseCandidatesExport(admin(), "10\r\nContent-Type: text/html");
    expect(state.filename).toMatch(/^msbshse-candidates-std-10Content-Typetexthtml-\d{4}-\d{2}-\d{2}\.csv$/);
    expect((await cbseCandidatesExport(admin(), "!!!")).filename).toMatch(/^cbse-candidates-class-grade-/);
  });
});

describe("push bodies", () => {
  it("an incident tells the family a note exists, never what it says", async () => {
    await recordIncident(admin(), { studentMembershipId: pupilMembershipId, kind: "ILLNESS", severity: "MINOR", place: "", title: "Vomited after lunch, sent home", body: "Details for the file.", actionTaken: "", notifyGuardians: true });
    const row = await db.notification.findFirstOrThrow({ where: { userId: parentUserId, kind: "INCIDENT" }, orderBy: { createdAt: "desc" } });
    expect(row.body).not.toContain("Vomited");
    expect(row.body).toContain("ZZ Secfix Pupil");
    expect(row.bodyKey).toBe("notifBody.incidentNote");
    expect(row.title).toContain("unwell");
  });
});

describe("audit rows", () => {
  it("a suspension's reason and a departure's destination stay off the audit log", async () => {
    const reason = "Shouted at a pupil called Meera in the corridor";
    expect((await suspendMembership(admin(), teacherMembershipId, reason)).ok).toBe(true);
    const suspended = await db.auditLog.findFirstOrThrow({ where: { action: "membership.suspend", targetId: teacherMembershipId }, orderBy: { createdAt: "desc" } });
    expect(suspended.meta).not.toContain("Meera");
    expect(JSON.parse(suspended.meta)).toMatchObject({ role: "TEACHER", reasonLength: reason.length });

    await recordDeparture(admin(), pupilMembershipId, { reason: "TRANSFERRED", destination: "St Mary's, Pune, because of the father's job", leftOn: new Date() });
    const left = await db.auditLog.findFirstOrThrow({ where: { action: "student.leave", targetId: pupilMembershipId }, orderBy: { createdAt: "desc" } });
    expect(left.meta).not.toContain("St Mary");
    expect(JSON.parse(left.meta)).toMatchObject({ reason: "TRANSFERRED", hasDestination: true });
  });
});

describe("an organiser's link", () => {
  it("is https or refused", () => {
    expect(isHttpsUrl("https://example.org/bee")).toBe(true);
    expect(isHttpsUrl("http://example.org/bee")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("intent://x#Intent;end")).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
    const base = { title: "ZZ Bee", summary: "A maths bee" };
    expect(readPlatformCompetitionForm({ ...base, externalUrl: "http://example.org" })).toEqual({ ok: false, errorKey: "appadmin.linkMustBeHttps" });
    const fine = readPlatformCompetitionForm({ ...base, externalUrl: "https://example.org/bee" });
    expect(fine.ok).toBe(true);
    expect(fine.ok && fine.input.externalUrl).toBe("https://example.org/bee");
    expect(readPlatformCompetitionForm(base).ok).toBe(true);
  });
});
