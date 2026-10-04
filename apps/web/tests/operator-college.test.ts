/**
 * The operator's college console (4 October 2026), on the ZZ college
 * fixtures (ZZ Vidya College, an affiliated college with every module on,
 * and ZZ Shastri Autonomous College): the colleges view lists both with
 * their kind and counts; the health numbers are what Vidya's rows say; the
 * operator switches a module at Vidya on its behalf, which writes the audit
 * rows, tells the admins and reads "switched on by the platform" on the
 * college's own modules page — with the admin's refusals kept and a college
 * tier refused for a school; the regulators' calendar says which window
 * applies to which college and its reminder, run twice, notifies once; a
 * recruiter disabled across every college is refused by the recruiter
 * doors and let back; and a non-operator is refused every new door.
 *
 * Nothing of the fixtures is torn down. The rows this file makes — its
 * operator, its recruiter, the reminder rows and notifications, the module's
 * audit rows — are its own and removed after, scoped to Vidya and Northgate;
 * the module switched off and on is put back as it was (its date, its
 * author and its settings).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  NAAC_BANDS,
  operatorCollegeCalendarSchema,
  operatorCollegesSchema,
  operatorRecruitersSchema,
  operatorSchoolModulesSchema,
  REGULATOR_CALENDAR,
  REGULATOR_DEADLINES,
} from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { listColleges, regulatorCalendar, remindRegulatorDeadlines } from "@/lib/operator-college";
import { schoolModules } from "@/lib/modules";
import { assignPlan } from "@/lib/plans";
import { onboardSchool } from "@/lib/subscriptions";
import { addDaysToKey, todayKey, zonedStartOfDay } from "@/lib/dates";
import { GET as collegesGet } from "@/app/api/v1/operator/colleges/route";
import { GET as calendarGet } from "@/app/api/v1/operator/colleges/calendar/route";
import { GET as modulesGet, POST as modulesPost } from "@/app/api/v1/operator/schools/[schoolId]/modules/route";
import { GET as recruitersGet } from "@/app/api/v1/operator/recruiters/route";
import { POST as standingPost } from "@/app/api/v1/operator/recruiters/[userId]/standing/route";
import { GET as recruiterMeGet } from "@/app/api/v1/recruiter/me/route";

const db = new PrismaClient();
const STAMP = Date.now();
const STARTED = new Date();
const MODULE = "INVENTORY" as const;
const AGENT = `zz-opcol-${STAMP}`;

let operatorUserId = "";
let recruiterUserId = "";
let vidyaId = "";
let shastriId = "";
let northgateId = "";
let vidyaAdminUserId = "";
let vidyaTimezone = "Asia/Kolkata";
let tierPlanId: string | null = null;
let original: { enabledAt: Date; enabledByUserId: string | null; settingsJson: string | null } | null = null;

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: `zz-opcol-op-${STAMP}@zz.test` } }) as unknown as Parameters<typeof listColleges>[0];
const P = "http://localhost/api/v1";
const get = (path: string) => new Request(`${P}${path}`);
const post = (path: string, body: unknown) => new Request(`${P}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function signIn(who: "OPERATOR" | "ADMIN" | "RECRUITER" | "OUT", route: string | null = null) {
  __resetCookies();
  __setHeaders({ "user-agent": AGENT, ...(route ? { "x-edulink-route": route } : {}) });
  if (who === "OPERATOR") await createSession(operatorUserId);
  if (who === "ADMIN") await createSession(vidyaAdminUserId, { schoolId: vidyaId, role: "ADMIN" });
  if (who === "RECRUITER") await createSession(recruiterUserId, { schoolId: null, role: "RECRUITER" });
}

beforeAll(async () => {
  const [vidya, shastri, northgate] = await Promise.all([
    db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, timezone: true } }),
    db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } }),
    db.school.findFirst({ where: { name: { startsWith: "ZZ Northgate" }, kind: "SCHOOL", isTestFixture: true }, select: { id: true } }),
  ]);
  if (!vidya || !shastri || !northgate) throw new Error("Run npm run zz:fixtures first: ZZ Vidya, ZZ Shastri and ZZ Northgate are needed.");
  vidyaId = vidya.id;
  vidyaTimezone = vidya.timezone;
  shastriId = shastri.id;
  northgateId = northgate.id;
  const admin = await db.membership.findFirst({ where: { schoolId: vidyaId, role: "ADMIN", status: "ACTIVE", leftAt: null, user: { email: "zz.cadmin@zz.test" } }, select: { userId: true } });
  if (!admin) throw new Error("ZZ Vidya's admin zz.cadmin@zz.test is missing.");
  vidyaAdminUserId = admin.userId;
  operatorUserId = (await db.user.create({ data: { name: "ZZ OpCol Operator", email: `zz-opcol-op-${STAMP}@zz.test`, isSuperuser: true }, select: { id: true } })).id;
  recruiterUserId = (await db.user.create({ data: { name: "ZZ OpCol Recruiter", email: `zz-opcol-rec-${STAMP}@zz.test`, recruiterProfile: { create: { companyName: `ZZ OpCol Co ${STAMP}` } } }, select: { id: true } })).id;
  const row = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId: vidyaId, module: MODULE } }, select: { enabledAt: true, enabledByUserId: true, settingsJson: true } });
  original = row;
  // A run that died midway may have left this file's reminder rows behind. Only a scoped run reminds a fixture (the daily job leaves them out), so every such row keyed on Vidya is this file's.
  await db.auditLog.deleteMany({ where: { action: "superuser.regulator.remind", targetId: { startsWith: `${vidyaId}:` } } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  // The module as it was, if the test left it otherwise.
  if (original) {
    await db.schoolModule.upsert({
      where: { schoolId_module: { schoolId: vidyaId, module: MODULE } },
      update: { enabledAt: original.enabledAt, enabledByUserId: original.enabledByUserId, settingsJson: original.settingsJson },
      create: { schoolId: vidyaId, module: MODULE, enabledAt: original.enabledAt, enabledByUserId: original.enabledByUserId, settingsJson: original.settingsJson },
    });
  }
  const vidyaPeople = (await db.membership.findMany({ where: { schoolId: vidyaId }, select: { userId: true } })).map((m) => m.userId);
  await db.notification.deleteMany({ where: { userId: { in: vidyaPeople }, createdAt: { gte: STARTED }, OR: [{ titleKey: { startsWith: "operatorCollege." } }] } });
  await db.auditLog.deleteMany({ where: { action: "superuser.regulator.remind", targetId: { startsWith: `${vidyaId}:` } } });
  await db.auditLog.deleteMany({ where: { actorUserId: operatorUserId, schoolId: { in: [vidyaId, shastriId, northgateId] } } });
  await db.auditLog.deleteMany({ where: { actorUserId: operatorUserId, schoolId: null } });
  await db.operatorAccess.deleteMany({ where: { userId: operatorUserId } });
  if (tierPlanId) await db.plan.delete({ where: { id: tierPlanId } }).catch(() => undefined);
  await db.session.deleteMany({ where: { userId: { in: [operatorUserId, recruiterUserId] } } });
  await db.user.deleteMany({ where: { id: { in: [operatorUserId, recruiterUserId] } } });
  // The ADMIN sessions this file signed in with, by the user agent it gave them — nobody else's.
  await db.session.deleteMany({ where: { userId: vidyaAdminUserId, userAgent: AGENT } });
  await db.$disconnect();
});

describe("the colleges view", () => {
  it("lists Vidya and Shastri with their kind, regulators and counts from the rows", async () => {
    const { items } = await listColleges(operator(), { schoolIds: [vidyaId, shastriId] });
    const vidya = items.find((i) => i.id === vidyaId)!;
    const shastri = items.find((i) => i.id === shastriId)!;
    expect(vidya.kind).toBe("COLLEGE");
    expect(shastri.kind).toBe("AUTONOMOUS_COLLEGE");
    expect(vidya.affiliatingUniversity).toBeTruthy();
    expect(vidya.regulators.naacGrade).toBe((await db.school.findUniqueOrThrow({ where: { id: vidyaId }, select: { naacGrade: true } })).naacGrade);
    for (const [row, id] of [[vidya, vidyaId], [shastri, shastriId]] as const) {
      expect(row.students).toBe(await db.membership.count({ where: { schoolId: id, role: "STUDENT", status: "ACTIVE", leftAt: null } }));
      const programmes = await db.programme.findMany({ where: { schoolId: id, archivedAt: null }, select: { intake: true } });
      expect(row.programmes).toHaveLength(programmes.length);
      expect(row.intake).toBe(programmes.reduce((s, p) => s + p.intake, 0));
      expect(row.modulesOn).toHaveLength(await db.schoolModule.count({ where: { schoolId: id } }));
    }
    // Each read is noted in the college's own log, counts only, and the visit in its visitor book.
    const read = await db.auditLog.findFirst({ where: { schoolId: vidyaId, actorUserId: operatorUserId, action: "operator.read.college" }, select: { meta: true } });
    expect(read).not.toBeNull();
    expect(JSON.parse(read!.meta)).not.toHaveProperty("names");
    expect(await db.operatorAccess.count({ where: { schoolId: vidyaId, userId: operatorUserId } })).toBe(1);
  });

  it("answers in the contract's shape (the door's own 200 is not called here: it reads every college, the demo ones included)", async () => {
    // The door and the page read every college, and each read is noted in that college's log; this file
    // stays inside Vidya and Shastri, so the shape is proved on the lib's answer and the fence below.
    const body = operatorCollegesSchema.parse(await listColleges(operator(), { schoolIds: [vidyaId, shastriId] }));
    expect(body.items.map((i) => i.id).sort()).toEqual([vidyaId, shastriId].sort());
  });

  it("Vidya's health is what its rows say", async () => {
    const { items } = await listColleges(operator(), { schoolIds: [vidyaId] });
    const h = items[0]!.health;
    const today = todayKey(vidyaTimezone);
    const lectures = await db.lecture.findMany({ where: { schoolId: vidyaId, cancelledAt: null, dateKey: { gte: addDaysToKey(today, -6), lte: today } }, select: { id: true } });
    const marked = await db.lectureAttendance.groupBy({ by: ["lectureId"], where: { lectureId: { in: lectures.map((l) => l.id) } } });
    expect(h.lecturesScheduled).toBe(lectures.length);
    expect(h.lecturesMarked).toBe(marked.length);
    expect(h.examFormsOpen).toBe(await db.examSession.count({ where: { schoolId: vidyaId, status: "FORMS" } }));
    const term = await db.academicTerm.findFirst({ where: { schoolId: vidyaId, startsOn: { lte: today }, endsOn: { gte: today } }, orderBy: { startsOn: "desc" } });
    expect(h.termName).toBe(term?.name ?? null);
    if (term) {
      expect(h.resultsPublishedThisTerm).toBe(
        await db.resultRun.count({ where: { schoolId: vidyaId, status: "PUBLISHED", publishedAt: { gte: zonedStartOfDay(term.startsOn, vidyaTimezone), lt: zonedStartOfDay(addDaysToKey(term.endsOn, 1), vidyaTimezone) } } }),
      );
    }
    const cycle = await db.accreditationCycle.findFirst({ where: { schoolId: vidyaId, status: { in: ["OPEN", "SUBMITTED"] } }, orderBy: { createdAt: "desc" } });
    expect(h.naac?.cgpa ?? null).toBe(cycle?.cgpa ?? null);
    if (cycle?.cgpa !== null && cycle?.cgpa !== undefined) expect(h.naac?.grade).toBe(NAAC_BANDS.find((b) => cycle.cgpa! >= b.min)?.grade);
    expect(h.scholarshipsPending).toBe(await db.scholarshipClaim.count({ where: { schoolId: vidyaId, status: { in: ["APPLIED", "SANCTIONED"] }, disbursedAt: null } }));
    expect(h.grievancesPastDue).toBe(await db.grievance.count({ where: { schoolId: vidyaId, status: { in: ["OPEN", "ACKNOWLEDGED"] }, dueOn: { lt: today } } }));
    expect(h.placement.on).toBe((await db.schoolModule.count({ where: { schoolId: vidyaId, module: "PLACEMENT" } })) === 1);
    expect(h.placement.drivesOpen).toBe(await db.drive.count({ where: { schoolId: vidyaId, status: { in: ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"] } } }));
  });
});

describe("modules on an institution's behalf", () => {
  it("switches a module off and on at Vidya: audited twice, the admins told, and the college's page says the platform switched it", async () => {
    await signIn("OPERATOR");
    const off = await modulesPost(post(`/operator/schools/${vidyaId}/modules`, { module: MODULE, on: false }), params({ schoolId: vidyaId }));
    expect(off.status).toBe(200);
    expect(operatorSchoolModulesSchema.parse(await off.json()).modules.find((m) => m.module === MODULE)?.on).toBe(false);
    const schoolRow = await db.auditLog.findFirst({ where: { schoolId: vidyaId, actorUserId: operatorUserId, action: "school.module.off" }, select: { meta: true } });
    expect(JSON.parse(schoolRow!.meta)).toEqual({ module: MODULE, byOperator: true });
    expect(await db.auditLog.count({ where: { schoolId: null, actorUserId: operatorUserId, action: "superuser.school.module", targetId: vidyaId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: vidyaAdminUserId, titleKey: "operatorCollege.notifModuleOffTitle", createdAt: { gte: STARTED } } })).toBe(1);

    const on = await modulesPost(post(`/operator/schools/${vidyaId}/modules`, { module: MODULE, on: true }), params({ schoolId: vidyaId }));
    expect(on.status).toBe(200);
    const listed = operatorSchoolModulesSchema.parse(await on.json()).modules.find((m) => m.module === MODULE)!;
    expect(listed).toMatchObject({ on: true, byPlatform: true });
    // Pressing again changes nothing and tells nobody twice.
    await modulesPost(post(`/operator/schools/${vidyaId}/modules`, { module: MODULE, on: true }), params({ schoolId: vidyaId }));
    expect(await db.notification.count({ where: { userId: vidyaAdminUserId, titleKey: "operatorCollege.notifModuleOnTitle", createdAt: { gte: STARTED } } })).toBe(1);

    // The college sees it: its own modules page reads "switched on by the platform".
    const mine = await schoolModules({ user: { id: vidyaAdminUserId }, schoolId: vidyaId, role: "ADMIN" } as unknown as Parameters<typeof schoolModules>[0]);
    expect(mine.find((m) => m.module === MODULE)).toMatchObject({ on: true, byPlatform: true });
    expect(mine.find((m) => m.module === "ALUMNI")?.byPlatform).toBe(false);
  });

  it("keeps the admin's refusals: ACADEMICS stays on at a college, a college module is not for a school", async () => {
    await signIn("OPERATOR");
    const academics = await modulesPost(post(`/operator/schools/${vidyaId}/modules`, { module: "ACADEMICS", on: false }), params({ schoolId: vidyaId }));
    expect(academics.status).toBe(422);
    const exams = await modulesPost(post(`/operator/schools/${northgateId}/modules`, { module: "EXAMS", on: true }), params({ schoolId: northgateId }));
    expect(exams.status).toBe(422);
    expect(await db.schoolModule.count({ where: { schoolId: northgateId, module: "EXAMS" } })).toBe(0);
    const school = operatorSchoolModulesSchema.parse(await (await modulesGet(get(`/operator/schools/${northgateId}/modules`), params({ schoolId: northgateId }))).json());
    expect(school.modules.map((m) => m.module)).not.toContain("EXAMS");
  });

  it("offers a college tier to a college only, and the onboarding refuses a malformed AISHE code before writing", async () => {
    const existing = await db.plan.findUnique({ where: { code: "college-affiliated" }, select: { id: true } });
    const planId = existing?.id ?? (tierPlanId = (await db.plan.create({ data: { code: "college-affiliated", name: "ZZ tier" }, select: { id: true } })).id);
    expect(await assignPlan(operator(), northgateId, planId)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierNotCollege" });
    const before = await db.school.count();
    const refused = await onboardSchool(operator(), { name: `ZZ OpCol Onboard ${STAMP}`, contactEmail: `zz-opcol-onb-${STAMP}@zz.test`, timezone: "Asia/Kolkata", kind: "COLLEGE", aisheCode: "99001", trial: true, adminEmail: `zz-opcol-adm-${STAMP}@zz.test` });
    expect(refused).toEqual({ ok: false, errorKey: "college.profileCheck" });
    expect(await db.school.count()).toBe(before);
  });
});

describe("the regulators' calendar", () => {
  // A fixed day: 20 October 2026 — the university's winter exams are open, AISHE and NIRF open on 1 November.
  const NOW = new Date("2026-10-20T06:00:00.000Z");

  it("reads the IQAC desk's own months and says which window applies to which college", async () => {
    for (const row of REGULATOR_CALENDAR) {
      const mine = REGULATOR_DEADLINES.find((d) => d.code === row.code)!;
      expect({ from: mine.fromMonth, to: mine.toMonth }).toEqual({ from: row.fromMonth, to: row.toMonth });
    }
    const calendar = await regulatorCalendar(operator(), { schoolIds: [vidyaId, shastriId], now: NOW });
    const winter = calendar.items.find((i) => i.code === "UNIVERSITY_EXAMS_WINTER")!;
    expect(winter).toMatchObject({ from: "2026-10-01", to: "2026-12-31", openNow: true });
    expect(winter.colleges.map((c) => c.schoolId)).toEqual([vidyaId]);
    const aishe = calendar.items.find((i) => i.code === "AISHE")!;
    expect(aishe).toMatchObject({ from: "2026-11-01", to: "2027-01-31", openNow: false, daysToOpen: 12 });
    expect(aishe.colleges.map((c) => c.schoolId).sort()).toEqual([vidyaId, shastriId].sort());
    await signIn("OPERATOR");
    const res = await calendarGet(get("/operator/colleges/calendar?test=1"));
    expect(res.status).toBe(200);
    operatorCollegeCalendarSchema.parse(await res.json());
  });

  it("reminds Vidya's IQAC and office once per window: run twice, notified once", async () => {
    const first = await remindRegulatorDeadlines(NOW, { schoolIds: [vidyaId] });
    // Winter exams (open), AISHE and NIRF (12 days): the three windows that apply to Vidya.
    expect(first.windows).toBe(3);
    expect(first.reminded).toBe(3);
    expect(first.people).toBeGreaterThan(0);
    const iqac = await db.membership.findFirst({ where: { schoolId: vidyaId, role: "IQAC", status: "ACTIVE" }, select: { userId: true } });
    const toIqac = await db.notification.findMany({ where: { userId: iqac!.userId, titleKey: { startsWith: "operatorCollege.deadline." }, createdAt: { gte: STARTED } }, select: { url: true, titleKey: true } });
    expect(toIqac.map((n) => n.titleKey).sort()).toEqual(["operatorCollege.deadline.AISHE", "operatorCollege.deadline.NIRF"]);
    expect(new Set(toIqac.map((n) => n.url))).toEqual(new Set(["/iqac"]));
    const toAdmin = await db.notification.count({ where: { userId: vidyaAdminUserId, titleKey: { startsWith: "operatorCollege.deadline." }, createdAt: { gte: STARTED } } });
    expect(toAdmin).toBe(3);

    const second = await remindRegulatorDeadlines(NOW, { schoolIds: [vidyaId] });
    expect(second).toMatchObject({ windows: 3, reminded: 0, muted: 3, people: 0 });
    expect(await db.notification.count({ where: { userId: vidyaAdminUserId, titleKey: { startsWith: "operatorCollege.deadline." }, createdAt: { gte: STARTED } } })).toBe(3);
  });
});

describe("a recruiter disabled across every college", () => {
  it("is refused by the recruiter doors and its sessions end; enabled again, it is let back", async () => {
    await signIn("RECRUITER", "GET /api/v1/recruiter/me");
    expect((await recruiterMeGet()).status).toBe(200);

    await signIn("OPERATOR");
    const listed = operatorRecruitersSchema.parse(await (await recruitersGet()).json());
    expect(listed.items.find((r) => r.userId === recruiterUserId)?.liveSessions).toBe(1);
    const off = await standingPost(post(`/operator/recruiters/${recruiterUserId}/standing`, { disabled: true, reason: "ZZ test" }), params({ userId: recruiterUserId }));
    expect(off.status).toBe(200);
    expect((await off.json()).sessionsEnded).toBe(1);
    expect((await db.recruiterProfile.findUniqueOrThrow({ where: { userId: recruiterUserId } })).disabledAt).not.toBeNull();
    expect(await db.auditLog.count({ where: { actorUserId: operatorUserId, action: "superuser.recruiter.disable", targetId: recruiterUserId } })).toBe(1);

    // A fresh session (a sign-in after the operator's switch) is still refused at every recruiter door.
    await signIn("RECRUITER", "GET /api/v1/recruiter/me");
    expect((await recruiterMeGet()).status).toBe(403);

    await signIn("OPERATOR");
    expect((await standingPost(post(`/operator/recruiters/${recruiterUserId}/standing`, { disabled: false }), params({ userId: recruiterUserId }))).status).toBe(200);
    await signIn("RECRUITER", "GET /api/v1/recruiter/me");
    expect((await recruiterMeGet()).status).toBe(200);
    await signIn("OPERATOR");
    expect((await standingPost(post(`/operator/recruiters/zz-no-such-${STAMP}/standing`, { disabled: true }), params({ userId: `zz-no-such-${STAMP}` }))).status).toBe(404);
  });
});

describe("a non-operator is refused", () => {
  it("answers a college's admin 403 and nobody 401 on every new door", async () => {
    for (const who of ["ADMIN", "OUT"] as const) {
      await signIn(who);
      const want = who === "ADMIN" ? 403 : 401;
      expect((await collegesGet(get("/operator/colleges"))).status).toBe(want);
      expect((await calendarGet(get("/operator/colleges/calendar"))).status).toBe(want);
      expect((await modulesGet(get(`/operator/schools/${vidyaId}/modules`), params({ schoolId: vidyaId }))).status).toBe(want);
      expect((await modulesPost(post(`/operator/schools/${vidyaId}/modules`, { module: MODULE, on: false }), params({ schoolId: vidyaId }))).status).toBe(want);
      expect((await recruitersGet()).status).toBe(want);
      expect((await standingPost(post(`/operator/recruiters/${recruiterUserId}/standing`, { disabled: true }), params({ userId: recruiterUserId }))).status).toBe(want);
    }
    expect(await db.schoolModule.count({ where: { schoolId: vidyaId, module: MODULE } })).toBe(1);
    expect((await db.recruiterProfile.findUniqueOrThrow({ where: { userId: recruiterUserId } })).disabledAt).toBeNull();
  });
});
