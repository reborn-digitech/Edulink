/**
 * What an adult student at a college lets a guardian see (4 October 2026,
 * src/lib/student-consent.ts).
 *
 * A ZZ college with a minor (17) and an adult (20) student under one
 * guardian, and a ZZ school with an eighteen-year-old pupil under another.
 * What is proved: a minor's guardian, and every guardian at a school, sees
 * everything without asking; an adult at a college has granted nothing until
 * they grant it, one grant at a time, and may take it back; only the student
 * writes, only where the grants apply, idempotently and audited; the
 * guardianship assertion family doors call refuses a door that names no grant
 * and one whose grant is off, and the remark thread follows MESSAGES; and the
 * student's own door reads and writes through the handler.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { consentApplies, myStudentConsent, parentMaySee, setStudentConsent } from "@/lib/student-consent";
import { AccessError, assertGuardianAccess, assertRemarkAccess } from "@/lib/tenancy";
import { actionKey } from "@/lib/safety-labels";
import type { ActiveContext } from "@/lib/session";
import { GET as consentGet, POST as consentPost } from "@/app/api/v1/student/consent/route";
import { parentAttendance } from "@/lib/api-reads/family";
import { grantToGuardians } from "./consent-grants";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { college: "", school: "", parent: "", schoolParent: "", minorUser: "", adultUser: "", minor: "", adult: "", pupil: "", teacher: "", thread: "" };

async function as(userId: string, role: string, schoolId: string | null, route: string | null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
}

function parentCtx(userId: string): ActiveContext {
  return { sessionId: "t", membershipId: null, schoolId: null, role: "PARENT", user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } } };
}

beforeAll(async () => {
  const mk = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ Consent ${tag} ${STAMP}`, slug: `zz-consent-${tag.toLowerCase()}-${STAMP}`, code: `ZCN${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-consent-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  ids.college = (await mk("College", "COLLEGE")).id;
  ids.school = (await mk("School", "SCHOOL")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ALUMNI" }, { schoolId: ids.college, module: "ACADEMICS" }, { schoolId: ids.school, module: "ALUMNI" }] });
  const user = (who: string, isMinor = false) => db.user.create({ data: { name: `ZZ Consent ${who}`, email: `zz-consent-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor }, select: { id: true } });
  const [parent, schoolParent, minor, adult, pupil, teacher] = await Promise.all([user("Parent"), user("SchoolParent"), user("Minor", true), user("Adult"), user("Pupil"), user("Teacher")]);
  Object.assign(ids, { parent: parent.id, schoolParent: schoolParent.id, minorUser: minor.id, adultUser: adult.id, teacher: teacher.id });
  ids.minor = (await db.membership.create({ data: { userId: minor.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.adult = (await db.membership.create({ data: { userId: adult.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupil = (await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  const faculty = await db.membership.create({ data: { userId: teacher.id, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" }, select: { id: true } });
  await db.guardianship.createMany({
    data: [
      { parentUserId: parent.id, studentMembershipId: ids.minor, studentSchoolId: ids.college, relation: "PARENT", status: "ACTIVE" },
      { parentUserId: parent.id, studentMembershipId: ids.adult, studentSchoolId: ids.college, relation: "PARENT", status: "ACTIVE" },
      { parentUserId: schoolParent.id, studentMembershipId: ids.pupil, studentSchoolId: ids.school, relation: "PARENT", status: "ACTIVE" },
    ],
  });
  ids.thread = (await db.remarkThread.create({ data: { schoolId: ids.college, studentMembershipId: ids.adult, teacherMembershipId: faculty.id, subject: "ZZ Consent thread" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: [ids.college, ids.school] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.school] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who the grants apply to", () => {
  it("a minor's guardian and a school pupil's guardian see everything; an adult at a college has granted nothing", async () => {
    expect(await consentApplies(ids.minor)).toBe(false);
    expect(await consentApplies(ids.pupil)).toBe(false);
    expect(await consentApplies(ids.adult)).toBe(true);
    for (const grant of ["ATTENDANCE", "RESULTS", "MONEY", "HOSTEL_TRANSPORT", "PLACEMENT", "MESSAGES"] as const) {
      // A grant is one guardian's (TA-555): the question is asked for the guardian reading.
      expect(await parentMaySee(ids.minor, grant, ids.parent)).toBe(true);
      expect(await parentMaySee(ids.pupil, grant, ids.schoolParent)).toBe(true);
      expect(await parentMaySee(ids.adult, grant, ids.parent)).toBe(false);
    }
  });
});

describe("the adult's grants", () => {
  it("are the student's to give and take back, one at a time, idempotent and audited", async () => {
    await as(ids.adultUser, "STUDENT", ids.college, null);
    const me = (await getSession())!;
    expect(await setStudentConsent(me, "RESULTS", true)).toEqual({ changed: true });
    expect(await setStudentConsent(me, "RESULTS", true)).toEqual({ changed: false });
    expect(await parentMaySee(ids.adult, "RESULTS", ids.parent)).toBe(true);
    expect(await parentMaySee(ids.adult, "MONEY", ids.parent)).toBe(false);
    // A guardian the student never granted it to does not read under another's grant (TA-555).
    expect(await parentMaySee(ids.adult, "RESULTS", ids.schoolParent)).toBe(false);
    const view = await myStudentConsent(me);
    expect(view.applies).toBe(true);
    expect(view.grants.find((g) => g.grant === "RESULTS")?.on).toBe(true);
    expect(view.guardians).toHaveLength(1);
    expect(await setStudentConsent(me, "RESULTS", false)).toEqual({ changed: true });
    expect(await parentMaySee(ids.adult, "RESULTS", ids.parent)).toBe(false);
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.college, action: { startsWith: "student.consent." } }, orderBy: { createdAt: "asc" }, select: { action: true } });
    expect(rows.map((r) => r.action)).toEqual(["student.consent.grant", "student.consent.revoke"]);
    expect(actionKey("student.consent.grant")).toBe("audit.studentConsentGrant");
    expect(actionKey("student.consent.revoke")).toBe("audit.studentConsentRevoke");
  });

  it("are refused to a minor, whose guardian already sees everything, and to anyone but a student", async () => {
    await as(ids.minorUser, "STUDENT", ids.college, null);
    await expect(setStudentConsent((await getSession())!, "RESULTS", false)).rejects.toMatchObject({ key: "consent.refuseNotAdult" });
    await expect(setStudentConsent(parentCtx(ids.parent), "RESULTS", true)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the family's doors", () => {
  it("refuse an adult's guardian a door that names no grant, and one whose grant is off; pass it when the grant is on", async () => {
    await expect(assertGuardianAccess(ids.parent, ids.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    await expect(assertGuardianAccess(ids.parent, ids.adult, "ATTENDANCE")).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    await as(ids.adultUser, "STUDENT", ids.college, null);
    await setStudentConsent((await getSession())!, "ATTENDANCE", true);
    await expect(assertGuardianAccess(ids.parent, ids.adult, "ATTENDANCE")).resolves.toMatchObject({ studentMembershipId: ids.adult });
    await expect(assertGuardianAccess(ids.parent, ids.adult, "MONEY")).rejects.toBeInstanceOf(AccessError);
    // A minor's guardian, and a school's, pass with or without a grant named.
    await expect(assertGuardianAccess(ids.parent, ids.minor)).resolves.toMatchObject({ studentMembershipId: ids.minor });
    await expect(assertGuardianAccess(ids.schoolParent, ids.pupil, "MONEY")).resolves.toMatchObject({ studentMembershipId: ids.pupil });
  });

  it("read an adult's month of attendance on the family's attendance door once ATTENDANCE is granted, as the web page does (DS-9)", async () => {
    await db.studentConsent.deleteMany({ where: { studentMembershipId: ids.adult, grant: "ATTENDANCE" } });
    await expect(parentAttendance(parentCtx(ids.parent), ids.adult, null)).rejects.toBeInstanceOf(AccessError);
    // To the guardian (TA-555: a grant is one guardian's, so the row names the link).
    await grantToGuardians(db, ids.college, ids.adult, "ATTENDANCE");
    const view = await parentAttendance(parentCtx(ids.parent), ids.adult, null);
    expect(view.child.studentMembershipId).toBe(ids.adult);
    expect(view.summary.total).toBe(0);
    await db.studentConsent.deleteMany({ where: { studentMembershipId: ids.adult, grant: "ATTENDANCE" } });
  });

  it("keep an adult's guardian out of the remark thread until MESSAGES is granted", async () => {
    await expect(assertRemarkAccess(parentCtx(ids.parent), ids.thread)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await as(ids.adultUser, "STUDENT", ids.college, null);
    await setStudentConsent((await getSession())!, "MESSAGES", true);
    await expect(assertRemarkAccess(parentCtx(ids.parent), ids.thread)).resolves.toMatchObject({ id: ids.thread });
  });
});

describe("the student's own door", () => {
  it("reads the grants and writes one, through the handler", async () => {
    await as(ids.adultUser, "STUDENT", ids.college, "GET /api/v1/student/consent");
    const read = await consentGet();
    expect(read.status).toBe(200);
    const body = (await read.json()) as { applies: boolean; grants: { grant: string; on: boolean }[] };
    expect(body.applies).toBe(true);
    expect(body.grants).toHaveLength(6);
    await as(ids.adultUser, "STUDENT", ids.college, "POST /api/v1/student/consent");
    const bad = await consentPost(new Request("http://localhost/api/v1/student/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ grant: "EVERYTHING", on: true }) }));
    expect(bad.status).toBe(422);
    const res = await consentPost(new Request("http://localhost/api/v1/student/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ grant: "PLACEMENT", on: true }) }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { grants: { grant: string; on: boolean }[] }).grants.find((g) => g.grant === "PLACEMENT")?.on).toBe(true);
    // A minor's door answers too, and says the grants do not apply.
    await as(ids.minorUser, "STUDENT", ids.college, "GET /api/v1/student/consent");
    expect(((await (await consentGet()).json()) as { applies: boolean }).applies).toBe(false);
  });
});
