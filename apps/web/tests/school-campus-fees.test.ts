/**
 * owner-batch-item5 (27 October 2026): A SCHOOL RAISES ROUTE AND MESS FEES, AND A COLLEGE'S DOORS SAY SO.
 *
 * What was wrong: `raiseRouteFees` and `billMess` (college-fees.ts) went through `collegeDesk`, which refuses any
 * institution that is not a college, so a school running the bus and the hostel had no way to charge a term's route
 * fee or a month's mess but by hand; the college's campus doors named school roles in the catalog and answered a
 * school 403 MODULE_OFF for a module the school had on; and the web had no bus page for a pupil.
 *
 * What this holds:
 * - a school's office (ADMIN; the school version has no ACCOUNTS desk) raises a term's route fees and bills a month's
 *   mess once — a second press "already", two presses together one demand each — audited in the school's words, and
 *   is refused without the role or with the module off (MODULE_OFF naming the module, not "this is a college's");
 * - a college's accounts desk still does both, audited as the college's;
 * - the two new doors answer 200, 422 and 403 as the catalog says;
 * - the e-resources, the ISBN list and a room change work at a school; the college's own (the criterion tables, the
 *   squad, the borrowing terms) stay a college's, and the gate answers a school 404 for their doors (`kinds`);
 * - a route's fee per term and a house's mess charge are set through the school's own route and house saves;
 * - the pupil's own bus page reads their seat.
 *
 * As the owner (tests/setup.ts). Three ZZ institutions of this file's own, removed after by id with everything under them.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { PrismaClient } from "@prisma/client";
import { billMess, raiseRouteFees } from "@/lib/college-fees";
import { changeRoom, importIsbnList, libraryTableFor, listEResources, openEResource, saveEResource } from "@/lib/college-campus";
import { saveRoute, transportOverview, familyTransport } from "@/lib/transport";
import { hostelsView, saveHostel } from "@/lib/hostel";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError, NotACollegeError, NotForThisKindError } from "@/lib/access-error";
import { createSession } from "@/lib/session";
import { translator } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { POST as routeFeesPost } from "@/app/api/v1/admin/transport/route-fees/route";
import { POST as messBillPost } from "@/app/api/v1/admin/hostel/mess-bill/route";
import { POST as accountsMessBillPost } from "@/app/api/v1/accounts/mess-bill/route";
import { POST as accountsRouteFeesPost } from "@/app/api/v1/accounts/route-fees/route";
import { GET as collegeTableGet } from "@/app/api/v1/library/college-table/route";
import { GET as eresourcesGet } from "@/app/api/v1/library/eresources/route";
import StudentTransportPage from "@/app/(app)/student/transport/page";
import { FamilyTransportCards } from "@/components/transport/family-view";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

// The page is a server component compiled with the classic JSX runtime here (tsconfig's "preserve"); it needs React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const t = translator("en");
const ids: Record<string, string> = {};
const user: Record<string, string> = {};
const member: Record<string, string> = {};
const school: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], schoolKey: string): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key]!, schoolId: school[schoolKey]!, role, user: { id: user[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-scf-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const admin = () => ctx("admin", "ADMIN", "school");
const json = (body: unknown) => new Request("http://localhost/api/v1/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
/** Signed in as `who`, the request stamped as the middleware would, so the gate reads the real door. */
async function as(who: string, role: string, schoolKey: string, route: string) {
  __resetCookies();
  __setHeaders({ "x-edulink-route": route });
  await createSession(user[who]!, { schoolId: school[schoolKey]!, role: role as never });
}
const audits = (schoolKey: string, action: string) => db.auditLog.count({ where: { schoolId: school[schoolKey]!, action } });

beforeAll(async () => {
  const mk = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ SCF ${tag} ${STAMP}`, slug: `zz-scf-${tag.toLowerCase()}-${STAMP}`, code: `ZF${tag[0]}${SUFFIX}`, contactEmail: `zz-scf-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind, isTestFixture: true }, select: { id: true } });
  school.school = (await mk("School", "SCHOOL")).id;
  school.bare = (await mk("Bare", "SCHOOL")).id;
  school.college = (await mk("College", "COLLEGE")).id;
  await db.schoolModule.createMany({ data: ["TRANSPORT", "HOSTEL", "LIBRARY"].map((module) => ({ schoolId: school.school!, module })) });
  await db.schoolModule.createMany({ data: ["ACADEMICS", "TRANSPORT", "HOSTEL", "LIBRARY"].map((module) => ({ schoolId: school.college!, module })) });
  const person = async (key: string, schoolKey: string, role: string, extra: Record<string, unknown> = {}) => {
    user[key] = (await db.user.create({ data: { name: `ZZ SCF ${key} ${STAMP}`, email: `zz-scf-${key.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, isMinor: role === "STUDENT" }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: user[key]!, schoolId: school[schoolKey]!, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZF${key}${SUFFIX}` } : {}), ...extra }, select: { id: true } })).id;
  };
  for (const [key, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["teacher", "TEACHER"], ["librarian", "LIBRARIAN"], ["warden", "WARDEN"], ["handAccounts", "ACCOUNTS"]] as const) await person(key, "school", role);
  await person("p1", "school", "STUDENT");
  await person("p2", "school", "STUDENT");
  await person("p3", "school", "STUDENT", { leftAt: new Date("2026-08-01T00:00:00Z") });
  await person("bareAdmin", "bare", "ADMIN");
  await person("cAccounts", "college", "ACCOUNTS");
  await person("cLibrarian", "college", "LIBRARIAN");
  await person("c1", "college", "STUDENT");

  const year = (schoolKey: string) => db.academicYear.create({ data: { schoolId: school[schoolKey]!, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  ids.year = (await year("school")).id;
  ids.cyear = (await year("college")).id;
  const head = async (schoolKey: string, code: string, kind: string) => (ids[`${schoolKey}${code}`] = (await db.feeHead.create({ data: { schoolId: school[schoolKey]!, name: `ZZ ${code}`, code, kind }, select: { id: true } })).id);
  await head("school", "TRN", "TRANSPORT");
  await head("school", "MES", "MESS");
  await head("college", "BUS", "TRANSPORT");
  await head("college", "MES", "MESS");

  // The school's two routes: one charging a fee per term, one charging nothing; three riders, one of whom has left.
  const route = async (key: string, schoolKey: string, fee: number) => {
    ids[key] = (await db.transportRoute.create({ data: { schoolId: school[schoolKey]!, name: `ZZ SCF ${key}`, kind: "FIXED", feePerTermPaise: fee }, select: { id: true } })).id;
    ids[`${key}Stop`] = (await db.transportStop.create({ data: { schoolId: school[schoolKey]!, routeId: ids[key]!, order: 1, name: "ZZ Gate", lat: 18.5, lng: 73.8, morningMinute: 470, eveningMinute: 940 }, select: { id: true } })).id;
  };
  await route("routePaid", "school", 1_800_00);
  await route("routeFree", "school", 0);
  await route("cRoute", "college", 2_400_00);
  const ride = (who: string, schoolKey: string, routeKey: string) => db.transportAllotment.create({ data: { schoolId: school[schoolKey]!, studentMembershipId: member[who]!, routeId: ids[routeKey]!, stopId: ids[`${routeKey}Stop`]!, fromDateKey: "2026-07-01" } });
  await ride("p1", "school", "routePaid");
  await ride("p2", "school", "routePaid");
  await ride("p3", "school", "routePaid");
  await ride("c1", "college", "cRoute");

  // A house with a mess charge and a room of four beds; pupil 1 boards from July. The college's own.
  const hostel = async (key: string, schoolKey: string, mess: number) => {
    ids[key] = (await db.hostel.create({ data: { schoolId: school[schoolKey]!, name: `ZZ SCF ${key}`, kind: "MIXED", capacity: 4, messMonthlyPaise: mess }, select: { id: true } })).id;
    ids[`${key}Room`] = (await db.hostelRoom.create({ data: { schoolId: school[schoolKey]!, hostelId: ids[key]!, number: `R${key.length}`, beds: 4 }, select: { id: true } })).id;
  };
  await hostel("house", "school", 2_500_00);
  await hostel("cHouse", "college", 3_000_00);
  const board = async (key: string, who: string, schoolKey: string, roomKey: string) =>
    (ids[key] = (await db.hostelAllotment.create({ data: { schoolId: school[schoolKey]!, membershipId: member[who]!, roomId: ids[roomKey]!, bed: 1, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: member[who]!, activeBedKey: `${ids[roomKey]}:1`, allottedByUserId: user.admin! }, select: { id: true } })).id);
  await board("p1Place", "p1", "school", "houseRoom");
  await board("c1Place", "c1", "college", "cHouseRoom");
});

afterEach(() => {
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  await db.session.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.school.deleteMany({ where: { id: { in: Object.values(school) } } });
  await db.notification.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.user.deleteMany({ where: { id: { in: Object.values(user) } } });
  await db.$disconnect();
});

describe("a school's route fees for a term", () => {
  it("charges each rider of a priced route once for the term, under the Transport head, in the school's words; again, nobody twice", async () => {
    expect(await raiseRouteFees(admin(), { termLabel: "Term 2", dueDateKey: "2026-12-15" })).toEqual({ raised: 2, already: 0 });
    const fees = await db.feeDemand.findMany({ where: { schoolId: school.school, raisedKey: { startsWith: "ROUTE:" } }, orderBy: { studentMembershipId: "asc" } });
    expect(fees.map((f) => f.studentMembershipId).sort()).toEqual([member.p1, member.p2].sort());
    for (const f of fees) {
      expect([f.netPaise, f.dueDate.toISOString().slice(0, 10), f.status, f.raisedKey, f.label]).toEqual([1_800_00, "2026-12-15", "OPEN", `ROUTE:${ids.year}:${ids.routePaid}:term 2`, t("collegeOffice.routeFeeLabel", { term: "Term 2", route: "ZZ SCF routePaid" })]);
      expect(JSON.parse(f.linesJson)).toMatchObject([{ headId: ids.schoolTRN, code: "TRN", grossPaise: 1_800_00 }]);
    }
    expect(await raiseRouteFees(admin(), { termLabel: " term 2 ", dueDateKey: "2026-12-15" })).toEqual({ raised: 0, already: 2 });
    expect(await audits("school", "fees.routeFees")).toBe(2);
    expect(await audits("school", "college.fees.route")).toBe(0);
  });

  it("⚠ two presses of one term at the same moment raise one demand for each rider", async () => {
    const both = await Promise.all([raiseRouteFees(admin(), { termLabel: "Term 3", dueDateKey: "2027-03-15" }), raiseRouteFees(admin(), { termLabel: "Term 3", dueDateKey: "2027-03-15" })]);
    expect(both.reduce((a, r) => a + r.raised, 0)).toBe(2);
    expect(both.reduce((a, r) => a + r.already, 0)).toBe(2);
    for (const who of ["p1", "p2"]) expect(await db.feeDemand.count({ where: { studentMembershipId: member[who], raisedKey: `ROUTE:${ids.year}:${ids.routePaid}:term 3` } })).toBe(1);
  });

  it("is the office's alone, and needs the bus switched on", async () => {
    for (const [who, role] of [["principal", "PRINCIPAL"], ["teacher", "TEACHER"], ["librarian", "LIBRARIAN"], ["handAccounts", "ACCOUNTS"]] as const) {
      await expect(raiseRouteFees(ctx(who, role, "school"), { termLabel: "Term 9", dueDateKey: "2027-03-15" }), who).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    }
    // At a school with the bus off: the module's own answer, not "this is a college's".
    const off = raiseRouteFees(ctx("bareAdmin", "ADMIN", "bare"), { termLabel: "Term 9", dueDateKey: "2027-03-15" });
    await expect(off).rejects.toBeInstanceOf(ModuleOffError);
    await expect(off).rejects.not.toBeInstanceOf(NotACollegeError);
    await expect(off).rejects.toMatchObject({ code: "MODULE_OFF", key: "modules.refuseOff", vars: { module: "TRANSPORT" } });
    expect(await db.feeDemand.count({ where: { schoolId: school.school, raisedKey: { endsWith: ":term 9" } } })).toBe(0);
  });
});

describe("a school's mess bill for a month", () => {
  it("bills each boarder of the month once at the house's charge, due on the tenth of the next month; again, nobody twice", async () => {
    expect(await billMess(admin(), { month: "2026-10" })).toEqual({ billed: 1, already: 0, skipped: 0 });
    const bill = await db.feeDemand.findFirstOrThrow({ where: { schoolId: school.school, raisedKey: "MESS:2026-10" } });
    expect([bill.studentMembershipId, bill.netPaise, bill.dueDate.toISOString().slice(0, 10), bill.label]).toEqual([member.p1, 2_500_00, "2026-11-10", t("collegeOffice.messLabel", { month: "2026-10" })]);
    expect(JSON.parse(bill.linesJson)).toMatchObject([{ headId: ids.schoolMES, code: "MES" }]);
    expect(await billMess(admin(), { month: "2026-10" })).toEqual({ billed: 0, already: 1, skipped: 0 });
    expect(await audits("school", "fees.messBill")).toBe(2);
    expect(await audits("school", "college.fees.mess")).toBe(0);
  });

  it("⚠ two presses of one month at the same moment bill the boarder once", async () => {
    const both = await Promise.all([billMess(admin(), { month: "2026-11" }), billMess(admin(), { month: "2026-11" })]);
    expect(both.map((r) => r.billed).sort()).toEqual([0, 1]);
    expect(await db.feeDemand.count({ where: { schoolId: school.school, raisedKey: "MESS:2026-11" } })).toBe(1);
  });

  it("is the office's alone, and needs the hostel switched on", async () => {
    for (const [who, role] of [["warden", "WARDEN"], ["principal", "PRINCIPAL"], ["handAccounts", "ACCOUNTS"]] as const) {
      await expect(billMess(ctx(who, role, "school"), { month: "2026-12" }), who).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    }
    await expect(billMess(ctx("bareAdmin", "ADMIN", "bare"), { month: "2026-12" })).rejects.toMatchObject({ code: "MODULE_OFF", vars: { module: "HOSTEL" } });
    await expect(billMess(admin(), { month: "December" })).rejects.toMatchObject({ key: "collegeOffice.refuseDates" });
  });
});

describe("a college's accounts desk, as before", () => {
  it("raises its route fees and bills its mess, audited as the college's; its librarian is refused", async () => {
    const accounts = ctx("cAccounts", "ACCOUNTS", "college");
    expect(await raiseRouteFees(accounts, { termLabel: "Odd semester", dueDateKey: "2026-10-15" })).toEqual({ raised: 1, already: 0 });
    expect(await billMess(accounts, { month: "2026-10" })).toEqual({ billed: 1, already: 0, skipped: 0 });
    expect(await audits("college", "college.fees.route")).toBe(1);
    expect(await audits("college", "college.fees.mess")).toBe(1);
    expect(await audits("college", "fees.routeFees")).toBe(0);
    await expect(billMess(ctx("cLibrarian", "LIBRARIAN", "college"), { month: "2026-10" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });
});

describe("the school's two doors", () => {
  it("POST /api/v1/admin/transport/route-fees: the office's 200, a broken body 422, a teacher 403", async () => {
    const door = "POST /api/v1/admin/transport/route-fees";
    await as("admin", "ADMIN", "school", door);
    const res = await routeFeesPost(json({ termLabel: "Term 4", dueDateKey: "2027-04-15" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ raised: 2, already: 0 });
    expect((await routeFeesPost(json({ termLabel: "" }))).status).toBe(422);
    await as("teacher", "TEACHER", "school", door);
    expect((await routeFeesPost(json({ termLabel: "Term 4", dueDateKey: "2027-04-15" }))).status).toBe(403);
    await as("bareAdmin", "ADMIN", "bare", door);
    const off = await routeFeesPost(json({ termLabel: "Term 4", dueDateKey: "2027-04-15" }));
    expect([off.status, ((await off.json()) as { code: string }).code]).toEqual([403, "MODULE_OFF"]);
  });

  it("POST /api/v1/admin/hostel/mess-bill: the office's 200, a broken body 422, the warden 403", async () => {
    const door = "POST /api/v1/admin/hostel/mess-bill";
    await as("admin", "ADMIN", "school", door);
    const res = await messBillPost(json({ month: "2027-01" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ billed: 1, already: 0, skipped: 0 });
    expect((await messBillPost(json({ month: "January" }))).status).toBe(422);
    await as("warden", "WARDEN", "school", door);
    expect((await messBillPost(json({ month: "2027-01" }))).status).toBe(403);
  });
});

describe("the college office's fee doors are a college's (coordinator's decision 1)", () => {
  it("a school's ADMIN is answered 404 by /accounts/mess-bill and /accounts/route-fees and 200 by the school's own doors, raising nothing through the first", async () => {
    const before = await db.feeDemand.count({ where: { schoolId: school.school } });
    await as("admin", "ADMIN", "school", "POST /api/v1/accounts/mess-bill");
    const mess = await accountsMessBillPost(json({ month: "2027-02" }));
    expect([mess.status, ((await mess.json()) as { code: string }).code]).toEqual([404, "NOT_FOUND"]);
    await as("admin", "ADMIN", "school", "POST /api/v1/accounts/route-fees");
    const route = await accountsRouteFeesPost(json({ termLabel: "Term 5", dueDateKey: "2027-05-15" }));
    expect([route.status, ((await route.json()) as { code: string }).code]).toEqual([404, "NOT_FOUND"]);
    expect(await db.feeDemand.count({ where: { schoolId: school.school } })).toBe(before);
    await as("admin", "ADMIN", "school", "POST /api/v1/admin/hostel/mess-bill");
    expect((await messBillPost(json({ month: "2027-02" }))).status).toBe(200);
    await as("admin", "ADMIN", "school", "POST /api/v1/admin/transport/route-fees");
    expect((await routeFeesPost(json({ termLabel: "Term 5", dueDateKey: "2027-05-15" }))).status).toBe(200);
    expect(await db.feeDemand.count({ where: { schoolId: school.school } })).toBe(before + 3);
  });

  it("the college's accounts desk still raises through them", async () => {
    await as("cAccounts", "ACCOUNTS", "college", "POST /api/v1/accounts/route-fees");
    const res = await accountsRouteFeesPost(json({ termLabel: "Even semester", dueDateKey: "2027-03-15" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ raised: 1, already: 0 });
    await as("cAccounts", "ACCOUNTS", "college", "POST /api/v1/accounts/mess-bill");
    const mess = await accountsMessBillPost(json({ month: "2026-11" }));
    expect(mess.status).toBe(200);
    expect(await mess.json()).toEqual({ billed: 1, already: 0, skipped: 0 });
  });
});

describe("a college's door at a school is not here (kinds)", () => {
  it("the gate answers 404 for every role at a school, before the module or the role; a college passes", async () => {
    for (const role of ["ADMIN", "TEACHER", "STUDENT", "LIBRARIAN", "WARDEN"] as const) {
      const verdict = gateRequest("GET /api/v1/library/college-table", { role, schoolId: school.school! });
      await expect(verdict, role).rejects.toBeInstanceOf(NotForThisKindError);
      await expect(verdict, role).rejects.toMatchObject({ code: "NOT_FOUND", key: "collegeOffice.refuseNotCollege" });
    }
    await expect(gateRequest("POST /api/v1/hostel/squad-rounds", { role: "WARDEN", schoolId: school.school! })).rejects.toBeInstanceOf(NotForThisKindError);
    await expect(gateRequest("GET /api/v1/library/college-table", { role: "ADMIN", schoolId: school.college! })).resolves.toBe("pass");
    // A guardian's session names no school: the handler decides.
    await expect(gateRequest("GET /api/v1/library/college-table", { role: "PARENT", schoolId: null })).resolves.toBe("pass");
    // The doors a school shares pass the gate at a school with the module on.
    for (const door of ["GET /api/v1/library/eresources", "POST /api/v1/library/isbn-import", "POST /api/v1/hostel/room-change"]) await expect(gateRequest(door, { role: "ADMIN", schoolId: school.school! }), door).resolves.toBe("pass");
  });

  it("a request is answered 404 NOT_FOUND in words, where it used to be 403 MODULE_OFF", async () => {
    await as("admin", "ADMIN", "school", "GET /api/v1/library/college-table");
    const res = await collegeTableGet(new Request("http://localhost/api/v1/library/college-table"));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "NOT_FOUND", error: t("collegeOffice.refuseNotCollege") });
    // The college's own function still refuses a school by itself, whoever calls it past the gate.
    await expect(libraryTableFor(admin())).rejects.toBeInstanceOf(NotACollegeError);
  });
});

describe("what a school shares with a college", () => {
  it("e-resources: the desk adds one, a pupil and a teacher read and open it, through the door too", async () => {
    const saved = await saveEResource(ctx("librarian", "LIBRARIAN", "school"), { name: "ZZ SCF DIKSHA", url: "https://diksha.gov.in/", kind: "OTHER" });
    expect((await listEResources(ctx("p1", "STUDENT", "school"))).items.map((i) => i.id)).toEqual([saved.id]);
    expect(await openEResource(ctx("teacher", "TEACHER", "school"), saved.id)).toEqual({ url: "https://diksha.gov.in/", clicks: 1 });
    await expect(saveEResource(ctx("teacher", "TEACHER", "school"), { name: "ZZ x", url: "https://x.test/", kind: "OTHER" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await expect(listEResources(ctx("bareAdmin", "ADMIN", "bare"))).rejects.toMatchObject({ code: "MODULE_OFF", vars: { module: "LIBRARY" } });
    await as("teacher", "TEACHER", "school", "GET /api/v1/library/eresources");
    const res = await eresourcesGet();
    expect(res.status).toBe(200);
    expect(((await res.json()) as { items: { id: string }[] }).items.map((i) => i.id)).toEqual([saved.id]);
  });

  it("a publisher's ISBN list and a boarder's room change", async () => {
    const r = await importIsbnList(ctx("librarian", "LIBRARIAN", "school"), "9780143031031, ZZ SCF Malgudi Days, R. K. Narayan, Penguin, 2006\n9780000000001, bad");
    expect(r).toMatchObject({ added: 1, already: 0, invalid: ["9780000000001"] });
    const moved = await changeRoom(ctx("warden", "WARDEN", "school"), { allotmentId: ids.p1Place!, roomId: ids.houseRoom!, bed: 2 });
    const place = await db.hostelAllotment.findUniqueOrThrow({ where: { id: moved.allotmentId }, select: { bed: true, status: true, membershipId: true } });
    expect(place).toEqual({ bed: 2, status: "ACTIVE", membershipId: member.p1 });
    ids.p1Place = moved.allotmentId;
  });
});

describe("a school sets the fee and the charge on its own forms", () => {
  it("a route's fee per term is written by the route's save and kept when not sent", async () => {
    const stops = [{ name: "ZZ Gate", lat: 18.5, lng: 73.8, morningMinute: 470, eveningMinute: 940, radiusM: 150 }];
    const { id } = await saveRoute(admin(), null, { name: `ZZ SCF new ${STAMP}`, direction: "BOTH", active: true, note: "", stops, feePerTermPaise: 3_000_00 });
    const fee = async () => (await transportOverview(admin())).routes.find((r) => r.id === id)?.feePerTermPaise;
    expect(await fee()).toBe(3_000_00);
    const kept = (await db.transportStop.findFirstOrThrow({ where: { routeId: id }, select: { id: true } })).id;
    await saveRoute(admin(), id, { name: `ZZ SCF new ${STAMP}`, direction: "BOTH", active: true, note: "renamed", stops: [{ ...stops[0]!, id: kept }] });
    expect(await fee()).toBe(3_000_00);
    await saveRoute(admin(), id, { name: `ZZ SCF new ${STAMP}`, direction: "BOTH", active: false, note: "", stops: [{ ...stops[0]!, id: kept }], feePerTermPaise: 0 });
    expect(await fee()).toBe(0);
  });

  it("a house's mess charge is written by the house's save and kept when not sent", async () => {
    const house = async () => (await hostelsView(admin())).hostels.find((h) => h.id === ids.house)!;
    const base = { id: ids.house!, name: "ZZ SCF house", kind: "MIXED" as const, capacity: 4, wardenMembershipId: null, messAttendance: false };
    await saveHostel(admin(), { ...base, messMonthlyPaise: 2_750_00 });
    expect((await house()).messMonthlyPaise).toBe(2_750_00);
    await saveHostel(admin(), base);
    expect((await house()).messMonthlyPaise).toBe(2_750_00);
    await expect(saveHostel(ctx("warden", "WARDEN", "school"), { ...base, messMonthlyPaise: 0 })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });
});

describe("the pupil's own bus page", () => {
  it("reads the pupil's own seat with the guardian's switch left out; one with no seat is told in their own words", async () => {
    const own = await familyTransport(ctx("p1", "STUDENT", "school"), null);
    expect([own.studentMembershipId, own.moduleOn, own.seat?.routeName]).toEqual([member.p1, true, "ZZ SCF routePaid"]);
    await as("p1", "STUDENT", "school", "GET /student/transport");
    const page = (await StudentTransportPage()) as React.ReactElement<{ children: React.ReactNode[] }>;
    const cards = React.Children.toArray(page.props.children).find((c) => React.isValidElement(c) && c.type === FamilyTransportCards) as React.ReactElement<React.ComponentProps<typeof FamilyTransportCards>>;
    expect(cards.props.view.seat?.routeName).toBe("ZZ SCF routePaid");
    expect(cards.props.seatExtra).toBeUndefined();
    expect(cards.props.noSeatTitle).toBe(t("schoolCampus.myNoSeat"));
    // A pupil with no seat: the cards say so in the pupil's words.
    const none = FamilyTransportCards({ view: { ...own, seat: null, trip: null }, t, time: () => "", noSeatTitle: t("schoolCampus.myNoSeat"), noTripBody: t("schoolCampus.myNoTripBody") }) as React.ReactElement<{ title: string }>;
    expect(none.props.title).toBe("You have no seat on a school bus");
  });
});
