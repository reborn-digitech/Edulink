/**
 * The college foundation (4 October 2026): the tenant's kind, the seven
 * college roles behind the default-deny gate, the six college modules and the
 * autonomous switch, and the recruiter's own account.
 *
 * Three ZZ tenants of this suite's own, all removed after: a college with
 * every module on, an autonomous college with ACADEMICS and EXAMS alone, and
 * a school. What is proved: a college staff role passes only the doors that
 * name it and, while its own module is off, only the person's doors; FACULTY
 * is scoped to its classes as a teacher is and the other four staff roles are
 * refused a class outright; a school is offered the school version's six
 * modules and refused a college's, a college all twelve; the autonomous
 * switch is the kind; the invitable roles follow the kind; and a recruiter
 * registers itself, lands on its own home and reaches no school door; and
 * (5 Oct 2026) the registrar changes the college's streams on its profile.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SCHOOL_MODULES, SCHOOL_VERSION_MODULES } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest, modulePagePermitted } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError, assertClassAccess } from "@/lib/tenancy";
import { enabledModules, institutionKindOf, isAutonomous, schoolModules, setModule, writeDefaultModules } from "@/lib/modules";
import { invitableRolesFor, ROLE_HOME } from "@/lib/constants";
import { institutionNoun } from "@/lib/institution";
import { translator } from "@/lib/i18n/dictionary";
import { registerRecruiter, myRecruiterProfile } from "@/lib/recruiters";
import { resolveContext } from "@/lib/resolve-context";
import { actionKey } from "@/lib/safety-labels";
import { NAV } from "@/lib/nav";
import { GET as recruiterMeGet } from "@/app/api/v1/recruiter/me/route";
import { GET as recruiterDrivesGet } from "@/app/api/v1/recruiter/drives/route";
import { GET as recruiterCollegesGet } from "@/app/api/v1/recruiter/colleges/route";
import { GET as feedGet } from "@/app/api/v1/shared/bulletin/route";
import { POST as profilePost } from "@/app/api/v1/admin/college-profile/route";
import { collegeProfile, setCollegeProfile } from "@/lib/college-profile";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { college: "", autonomous: "", school: "", cAdmin: "", sAdmin: "", faculty: "", facultyMembership: "", examCtrl: "", tpoAuto: "", class: "", otherClass: "" };

async function as(userId: string, role: string, schoolId: string | null, route: string | null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
}

beforeAll(async () => {
  const mk = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ College ${tag} ${STAMP}`, slug: `zz-col-${tag.toLowerCase()}-${STAMP}`, code: `ZCL${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-col-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  ids.college = (await mk("Vidya", "COLLEGE")).id;
  ids.autonomous = (await mk("Autonomous", "AUTONOMOUS_COLLEGE")).id;
  ids.school = (await mk("Hill", "SCHOOL")).id;
  await db.schoolModule.createMany({ data: [...SCHOOL_MODULES.map((module) => ({ schoolId: ids.college, module })), ...["ALUMNI", "ACADEMICS", "EXAMS"].map((module) => ({ schoolId: ids.autonomous, module })), { schoolId: ids.school, module: "ALUMNI" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Col ${who}`, email: `zz-col-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [ca, sa, fa, ec, tp] = await Promise.all([user("CAdmin"), user("SAdmin"), user("Faculty"), user("ExamCtrl"), user("Tpo")]);
  Object.assign(ids, { cAdmin: ca.id, sAdmin: sa.id, faculty: fa.id, examCtrl: ec.id, tpoAuto: tp.id });
  await db.membership.createMany({
    data: [
      { userId: ca.id, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" },
      { userId: sa.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: ec.id, schoolId: ids.college, role: "EXAM_CONTROLLER", status: "ACTIVE" },
      { userId: tp.id, schoolId: ids.autonomous, role: "TPO", status: "ACTIVE" },
    ],
  });
  ids.facultyMembership = (await db.membership.create({ data: { userId: fa.id, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" }, select: { id: true } })).id;
  ids.class = (await db.class.create({ data: { schoolId: ids.college, name: `ZZ FY Physics ${STAMP}`, subject: "Physics", joinCode: `ZCLA${STAMP}`, gradeLevel: "11" }, select: { id: true } })).id;
  ids.otherClass = (await db.class.create({ data: { schoolId: ids.college, name: `ZZ FY Chemistry ${STAMP}`, subject: "Chemistry", joinCode: `ZCLB${STAMP}`, gradeLevel: "11" }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.class, schoolId: ids.college, teacherMembershipId: ids.facultyMembership, role: "LEAD" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.autonomous, ids.school] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the college's roles at the gate", () => {
  it("pass only the doors that name them: faculty reads the feed, and is refused the office and a door that names no limited role", async () => {
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "FACULTY", schoolId: ids.college })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/shared/bulletin/global", { role: "FACULTY", schoolId: ids.college })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/me", { role: "ACCOUNTS", schoolId: ids.college })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/admin/overview", { role: "FACULTY", schoolId: ids.college })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/shared/competitions", { role: "HOD", schoolId: ids.college })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/teaching/classes", { role: "FACULTY", schoolId: ids.college })).rejects.toBeInstanceOf(AccessError);
  });

  it("while the role's own module is off keep only the person's doors: the placement officer at a college with PLACEMENT off", async () => {
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "TPO", schoolId: ids.autonomous })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/me", { role: "TPO", schoolId: ids.autonomous })).resolves.toBe("pass");
    // FACULTY's ACADEMICS is on there; ACCOUNTS hangs on no module and is never closed by a switch.
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "FACULTY", schoolId: ids.autonomous })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "ACCOUNTS", schoolId: ids.autonomous })).resolves.toBe("pass");
  });

  it("open their home, their NAV and the notices, and nothing else of the school's surface", async () => {
    const vidya = await enabledModules(ids.college);
    expect(modulePagePermitted("FACULTY", "/faculty", vidya)).toBe(true);
    expect(modulePagePermitted("FACULTY", "/bulletin", vidya)).toBe(true);
    expect(modulePagePermitted("FACULTY", "/bulletin/global", vidya)).toBe(true);
    expect(modulePagePermitted("FACULTY", "/teacher/classes", vidya)).toBe(false);
    expect(modulePagePermitted("EXAM_CONTROLLER", "/exam-cell", vidya)).toBe(true);
    expect(modulePagePermitted("EXAM_CONTROLLER", "/exams", vidya)).toBe(false);
    // The accounts desk keeps the fee ledger with the office (the college office, 4 Oct 2026): its NAV opens the fee pages, and nothing else of the office's.
    expect(modulePagePermitted("ACCOUNTS", "/admin/fees", vidya)).toBe(true);
    expect(modulePagePermitted("ACCOUNTS", "/admin/people", vidya)).toBe(false);
    const shastri = await enabledModules(ids.autonomous);
    expect(modulePagePermitted("TPO", "/placement", shastri)).toBe(true);
    expect(modulePagePermitted("TPO", "/bulletin", shastri)).toBe(false);
    expect(modulePagePermitted("RECRUITER", "/recruiter", [])).toBe(true);
    expect(modulePagePermitted("RECRUITER", "/admin", [])).toBe(false);
    // Every one of the seven has a home and a NAV that starts with it.
    for (const role of ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER"] as const) expect(NAV[role][0]!.href).toBe(ROLE_HOME[role]);
  });

  it("are served the feed through the handler, as the teacher they read as there", async () => {
    await as(ids.faculty, "FACULTY", ids.college, "GET /api/v1/shared/bulletin");
    expect((await feedGet(new Request("http://localhost/api/v1/shared/bulletin?limit=5"))).status).toBe(200);
  });
});

describe("the class, pupil and work asserts", () => {
  it("scope faculty to the classes they teach, as a teacher, and refuse the exam controller outright", async () => {
    await expect(assertClassAccess({ schoolId: ids.college, membershipId: ids.facultyMembership, role: "FACULTY" }, ids.class)).resolves.toMatchObject({ id: ids.class });
    await expect(assertClassAccess({ schoolId: ids.college, membershipId: ids.facultyMembership, role: "FACULTY" }, ids.otherClass)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(assertClassAccess({ schoolId: ids.college, membershipId: "x", role: "EXAM_CONTROLLER" }, ids.class)).rejects.toBeInstanceOf(AccessError);
    await expect(assertClassAccess({ schoolId: ids.college, membershipId: "x", role: "RECRUITER" }, ids.class)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the modules by kind, and the autonomous switch", () => {
  it("offer a school the school version's six and a college all twelve", async () => {
    await as(ids.sAdmin, "ADMIN", ids.school, null);
    const school = (await getSession())!;
    expect((await schoolModules(school)).map((m) => m.module)).toEqual([...SCHOOL_VERSION_MODULES]);
    await expect(setModule(school, "ACADEMICS", true)).rejects.toMatchObject({ key: "modules.refuseNotForKind" });
    expect(await enabledModules(ids.school)).toEqual(["ALUMNI"]);
    await as(ids.cAdmin, "ADMIN", ids.college, null);
    const college = (await getSession())!;
    expect((await schoolModules(college)).map((m) => m.module)).toEqual([...SCHOOL_MODULES]);
    // And a college may switch one of its own off and on, audited as any module.
    expect(await setModule(college, "PLACEMENT", false)).toEqual({ changed: true });
    expect(await setModule(college, "PLACEMENT", true)).toEqual({ changed: true });
  });

  it("start a new college with alumni and academics, a school with alumni alone", async () => {
    const fresh = await db.school.create({ data: { name: `ZZ College Fresh ${STAMP}`, slug: `zz-col-fresh-${STAMP}`, code: `ZCLF${String(STAMP).slice(-5)}`, contactEmail: `zz-col-fresh-${STAMP}@test.invalid`, kind: "COLLEGE" }, select: { id: true } });
    try {
      await writeDefaultModules(fresh.id, undefined, "COLLEGE");
      expect(await enabledModules(fresh.id)).toEqual(["ALUMNI", "ACADEMICS"]);
    } finally {
      await db.school.deleteMany({ where: { id: fresh.id } });
    }
  });

  it("read the autonomous switch from the kind, and name the tenant by it", async () => {
    expect(await isAutonomous(ids.autonomous)).toBe(true);
    expect(await isAutonomous(ids.college)).toBe(false);
    expect(await isAutonomous(ids.school)).toBe(false);
    expect(await institutionKindOf(ids.college)).toBe("COLLEGE");
    const t = translator("en");
    expect(institutionNoun("COLLEGE", t)).toBe("college");
    expect(institutionNoun("AUTONOMOUS_COLLEGE", t)).toBe("college");
    expect(institutionNoun(null, t)).toBe("school");
    expect(institutionNoun("COLLEGE", translator("mr"))).toBe("महाविद्यालय");
  });

  it("offer a college its six staff roles to invite and no TEACHER, a school the other way round, and the recruiter never", () => {
    const college = invitableRolesFor("COLLEGE");
    expect(college).toEqual(expect.arrayContaining(["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "STUDENT", "ADMIN"]));
    expect(college).not.toContain("TEACHER");
    const school = invitableRolesFor("SCHOOL");
    expect(school).toContain("TEACHER");
    expect(school).not.toContain("FACULTY");
    expect(invitableRolesFor("JUNIOR_COLLEGE")).toContain("TEACHER");
    for (const list of [college, school]) expect(list as string[]).not.toContain("RECRUITER");
  });
});

describe("the recruiter", () => {
  const email = `zz-col-recruiter-${STAMP}@test.invalid`;
  it("registers itself, lands on its own home with no school, and is refused a second account on the same address", async () => {
    const made = await registerRecruiter({ name: "ZZ Col Recruiter", email, password: "a long enough zz password 1", companyName: "ZZ Col Company" }, "en");
    expect(made).toMatchObject({ ok: true });
    if (!made.ok) return;
    expect(await resolveContext(made.userId)).toEqual({ role: "RECRUITER", schoolId: null, redirectTo: "/recruiter" });
    expect(await registerRecruiter({ name: "ZZ Col Recruiter", email, password: "a long enough zz password 1", companyName: "ZZ Col Company" }, "en")).toMatchObject({ ok: false, errorKey: "recruiter.refuseEmailTaken" });
    const audited = await db.auditLog.findFirst({ where: { actorUserId: made.userId, action: "recruiter.register" }, select: { id: true } });
    expect(audited).not.toBeNull();
    expect(actionKey("recruiter.register")).toBe("audit.recruiterRegister");

    await as(made.userId, "RECRUITER", null, "GET /api/v1/recruiter/me");
    const me = await recruiterMeGet();
    expect(me.status).toBe(200);
    expect(((await me.json()) as { companyName: string }).companyName).toBe("ZZ Col Company");
    const session = (await getSession())!;
    expect({ role: session.role, schoolId: session.schoolId }).toEqual({ role: "RECRUITER", schoolId: null });
    expect((await myRecruiterProfile(session)).companyName).toBe("ZZ Col Company");
    // No school door: the feed is refused at the gate.
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "RECRUITER", schoolId: null })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/me", { role: "RECRUITER", schoolId: null })).resolves.toBe("pass");
    // Signed in at once, but nothing of a college's until the address is proved (campaign S-4).
    const drives = await recruiterDrivesGet();
    expect(drives.status).toBe(403);
    expect(((await drives.json()) as { error: string }).error).toContain("Confirm your email");
    expect((await recruiterCollegesGet()).status).toBe(403);
    await db.user.update({ where: { id: made.userId }, data: { emailVerifiedAt: new Date() } });
    expect((await recruiterDrivesGet()).status).toBe(200);
    // Signed out, the recruiter's own door answers 401 like every other, so the phone signs out (campaign W-11).
    __resetCookies();
    __setHeaders({});
    expect((await recruiterMeGet()).status).toBe(401);
  });

  it("is shut out everywhere once disabled", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
    await db.recruiterProfile.update({ where: { userId: user.id }, data: { disabledAt: new Date() } });
    const landing = await resolveContext(user.id);
    expect(landing.role).toBeNull();
  });
});

describe("the college profile's streams (5 Oct 2026)", () => {
  it("are the registrar's to change: at least one, audited once as college.streams.set, refused at a school", async () => {
    await as(ids.cAdmin, "ADMIN", ids.college, null);
    const admin = (await getSession())!;
    expect((await collegeProfile(admin)).streams).toEqual([]);
    expect(await setCollegeProfile(admin, { streams: ["SCIENCE", "ARTS"] })).toEqual({ changed: ["streams"] });
    expect((await collegeProfile(admin)).streams).toEqual(["ARTS", "SCIENCE"]);
    // The same list again changes nothing; the references and the streams together write one row each.
    expect(await setCollegeProfile(admin, { streams: ["ARTS", "SCIENCE"] })).toEqual({ changed: [] });
    expect(await setCollegeProfile(admin, { streams: ["ARTS", "SCIENCE", "COMMERCE"], affiliatingUniversity: "ZZ University" })).toEqual({ changed: ["affiliatingUniversity", "streams"] });
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.college, action: "college.streams.set" }, orderBy: { createdAt: "asc" }, select: { meta: true } });
    expect(rows.map((r) => JSON.parse(String(r.meta)))).toEqual([{ from: [], to: ["ARTS", "SCIENCE"] }, { from: ["ARTS", "SCIENCE"], to: ["ARTS", "SCIENCE", "COMMERCE"] }]);
    expect(actionKey("college.streams.set")).toBe("audit.collegeStreamsSet");
    // None is refused (422 on the field), and the references sent with it are not written either.
    await expect(setCollegeProfile(admin, { streams: [], aisheCode: "C-12345" })).rejects.toMatchObject({ key: "streams.refuseNone", status: 422 });
    expect((await collegeProfile(admin)).aisheCode).toBeNull();
    __setHeaders({ "x-edulink-route": "POST /api/v1/admin/college-profile" });
    const refused = await profilePost(new Request("http://localhost/api/v1/admin/college-profile", { method: "POST", body: JSON.stringify({ streams: [] }) }));
    expect(refused.status).toBe(422);
    // A school has no streams to keep.
    await as(ids.sAdmin, "ADMIN", ids.school, null);
    await expect(setCollegeProfile((await getSession())!, { streams: ["ARTS"] })).rejects.toMatchObject({ key: "college.refuseNotACollege" });
  });
});
