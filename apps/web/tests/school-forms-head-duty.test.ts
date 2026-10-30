/**
 * owner-batch-item9 (27 October 2026): A SCHOOL'S FORMS FOR THE THREE OPENED DOORS, AND THE HEAD'S PAGES BY DUTY.
 *
 * Part A. Item 5 opened three college-campus functions to a school with the module on, by API only. The school's
 * desk now has forms for them, each answering in place (<ActionForm>, answerForm): the librarian and the office add an
 * e-resource or correct one's link (https only, the refusal beside the link box), open one through the app (counted),
 * paste a publisher's ISBN list on the catalogue (titles added once by ISBN, a failing check digit named back), and the
 * warden and the office move a boarder to another bed (the old place ends today, the new one starts today; a bed taken
 * or not in the room refused beside the bed box).
 *
 * Part B. Leave approval, the trends, the review rounds and the safety centre were open to every ADMIN. They are now
 * the head's pages: the PRINCIPAL always holds them and gives them to an ADMIN from the staff roster (audited
 * `people.headDuty.set`, the admin told); an ADMIN without them is answered 404 on the pages (a server action posted to
 * one too) and 403 on the doors behind them; while the school has no head every admin holds them. The safety centre
 * opens to the head. A leave request tells the head and the admins holding the pages.
 *
 * Two ZZ schools of this file's own (one with a head, one without), removed after by id with everything under them.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { dutiesForRole, adminDutiesHeld } from "@edulink/contracts";
import { FORM_IDLE } from "@/lib/form-state";
import { createSession, getSession, isModuleOffPage } from "@/lib/session";
import { adminDutyPagePermitted, gateRequest } from "@/lib/role-gate";
import { permits } from "@/lib/api-catalog/types";
import { endpointFor } from "@/lib/role-gate";
import { headPageHolders, setHeadDuty } from "@/lib/duties";
import { applyForLeave } from "@/lib/leave";
import { translator } from "@/lib/i18n/dictionary";
import { NAV, PHONE_BAR } from "@/lib/nav";
import type { ActiveContext } from "@/lib/session";
import { eResourceSaveAction, isbnListAction } from "@/app/(app)/library/actions";
import { moveBoarderAction } from "@/app/(app)/hostel/actions";
import { headDutyAction } from "@/app/(app)/principal/staff/actions";
import { GET as eResourceOpen } from "@/app/(app)/library/e-resources/[resourceId]/open/route";
import { GET as safetyGet } from "@/app/api/v1/admin/safety/route";
import { GET as trendsGet } from "@/app/api/v1/principal/trends/route";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const t = translator("en");
const ids: Record<string, string> = {};
const user: Record<string, string> = {};
const member: Record<string, string> = {};
const school: Record<string, string> = {};

/** Signed in as `who`, the request stamped as the middleware would, so the gate reads the real page or door. */
async function as(who: string, role: string, schoolKey: string, route: string) {
  __resetCookies();
  __setHeaders({ "x-edulink-route": route });
  await createSession(user[who]!, { schoolId: school[schoolKey]!, role: role as never });
}
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const ctx = (key: string, role: ActiveContext["role"], schoolKey = "school"): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key]!, schoolId: school[schoolKey]!, role, user: { id: user[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-shd-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const audits = (action: string, targetId?: string) => db.auditLog.count({ where: { schoolId: { in: Object.values(school) }, action, ...(targetId ? { targetId } : {}) } });
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

beforeAll(async () => {
  const mk = (tag: string) =>
    db.school.create({ data: { name: `ZZ SHD ${tag} ${STAMP}`, slug: `zz-shd-${tag.toLowerCase()}-${STAMP}`, code: `ZH${tag.slice(0, 2).toUpperCase()}${SUFFIX}`, contactEmail: `zz-shd-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "SCHOOL", isTestFixture: true }, select: { id: true } });
  school.school = (await mk("School")).id;
  school.solo = (await mk("Solo")).id;
  await db.schoolModule.createMany({ data: ["HOSTEL", "LIBRARY"].map((module) => ({ schoolId: school.school!, module })) });
  const person = async (key: string, schoolKey: string, role: string) => {
    user[key] = (await db.user.create({ data: { name: `ZZ SHD ${key} ${STAMP}`, email: `zz-shd-${key.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, isMinor: role === "STUDENT" }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: user[key]!, schoolId: school[schoolKey]!, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZH${key}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  };
  for (const [key, role] of [["principal", "PRINCIPAL"], ["admin", "ADMIN"], ["admin2", "ADMIN"], ["teacher", "TEACHER"], ["librarian", "LIBRARIAN"], ["warden", "WARDEN"], ["p1", "STUDENT"], ["p2", "STUDENT"]] as const) await person(key, "school", role);
  await person("soloAdmin", "solo", "ADMIN");
  await person("soloTeacher", "solo", "TEACHER");

  // A house with a room of three beds: pupil 1 in bed 1, pupil 2 in bed 3.
  ids.house = (await db.hostel.create({ data: { schoolId: school.school!, name: `ZZ SHD house`, kind: "MIXED", capacity: 3 }, select: { id: true } })).id;
  ids.room = (await db.hostelRoom.create({ data: { schoolId: school.school!, hostelId: ids.house!, number: "R1", beds: 3 }, select: { id: true } })).id;
  const board = async (key: string, who: string, bed: number) =>
    (ids[key] = (await db.hostelAllotment.create({ data: { schoolId: school.school!, membershipId: member[who]!, roomId: ids.room!, bed, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: member[who]!, activeBedKey: `${ids.room}:${bed}`, allottedByUserId: user.admin! }, select: { id: true } })).id);
  await board("p1Place", "p1", 1);
  await board("p2Place", "p2", 3);
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

/* -------------------------------------------------------------------------- */
/* Part A: the school's forms                                                  */
/* -------------------------------------------------------------------------- */

describe("the desk's e-resources at a school (add, correct, open)", () => {
  it("the librarian adds one through the form, audited; the answer names it", async () => {
    await as("librarian", "LIBRARIAN", "school", "POST /library/e-resources");
    const answer = await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "ZZ DIKSHA", url: "https://diksha.gov.in/", kind: "EBOOK" }));
    expect(answer).toMatchObject({ ok: true, message: t("schoolForms.eresSaved", { name: "ZZ DIKSHA" }) });
    const row = await db.libraryEResource.findFirstOrThrow({ where: { schoolId: school.school, name: "ZZ DIKSHA" } });
    expect([row.url, row.kind, row.active]).toEqual(["https://diksha.gov.in/", "EBOOK", true]);
    ids.eres = row.id;
    expect(await audits("library.eresource", row.id)).toBe(1);
  });

  it("a link that is not https is refused beside the link box, everything typed kept, nothing saved", async () => {
    await as("librarian", "LIBRARIAN", "school", "POST /library/e-resources");
    const answer = await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "ZZ Plain", url: "http://example.org/", kind: "OTHER" }));
    expect(answer).toMatchObject({ ok: false, field: "url", message: t("collegeOffice.refuseUrl"), values: { name: "ZZ Plain", url: "http://example.org/" } });
    expect(await db.libraryEResource.count({ where: { schoolId: school.school, name: "ZZ Plain" } })).toBe(0);
  });

  it("a name too short is refused beside the name box", async () => {
    await as("admin", "ADMIN", "school", "POST /library/e-resources");
    const answer = await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "Z", url: "https://example.org/", kind: "OTHER" }));
    expect(answer).toMatchObject({ ok: false, field: "name" });
  });

  it("the office corrects one by its name: the link and kind change, no second row", async () => {
    await as("admin", "ADMIN", "school", "POST /library/e-resources");
    const answer = await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "ZZ DIKSHA", url: "https://diksha.gov.in/explore", kind: "DATABASE" }));
    expect(answer.ok).toBe(true);
    const rows = await db.libraryEResource.findMany({ where: { schoolId: school.school, name: "ZZ DIKSHA" } });
    expect(rows.map((r) => [r.id, r.url, r.kind])).toEqual([[ids.eres, "https://diksha.gov.in/explore", "DATABASE"]]);
  });

  it("the head reads but does not add, and a teacher does not add", async () => {
    for (const [who, role] of [["principal", "PRINCIPAL"], ["teacher", "TEACHER"]] as const) {
      await as(who, role, "school", "POST /library/e-resources");
      const answer = await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "ZZ Not mine", url: "https://example.org/", kind: "OTHER" }));
      expect(answer.ok, who).toBe(false);
    }
    expect(await db.libraryEResource.count({ where: { schoolId: school.school, name: "ZZ Not mine" } })).toBe(0);
  });

  it("an open through the app is counted and sends the reader on to the link", async () => {
    await as("librarian", "LIBRARIAN", "school", `GET /library/e-resources/${ids.eres}/open`);
    const res = await eResourceOpen(new Request("http://localhost/x"), { params: Promise.resolve({ resourceId: ids.eres! }) });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://diksha.gov.in/explore");
    expect((await db.libraryEResource.findUniqueOrThrow({ where: { id: ids.eres } })).clicks).toBe(1);
  });
});

describe("a publisher's ISBN list on the catalogue", () => {
  // 9780306406157 checks; 9780306406158 does not.
  const list = "9780306406157, ZZ SHD Optics, ZZ Author, ZZ Press, 2019\n9780306406158, ZZ SHD Broken, ZZ Author, ZZ Press, 2020\n";

  it("adds each title once by ISBN and names the ISBN whose check digit fails", async () => {
    await as("librarian", "LIBRARIAN", "school", "POST /library/catalogue");
    const answer = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: list }));
    expect(answer).toMatchObject({ ok: true, message: t("campusForms.isbnAddedOneNamed", { added: 1, already: 0, list: "9780306406158" }) /* qb-C: one title, said as one */ });
    expect(await db.libraryTitle.count({ where: { schoolId: school.school, title: { startsWith: "ZZ SHD" } } })).toBe(1);
    expect(await audits("library.isbnImport")).toBe(1);
  });

  it("the same list again adds nothing", async () => {
    await as("admin", "ADMIN", "school", "POST /library/catalogue");
    const answer = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "9780306406157, ZZ SHD Optics" }));
    expect(answer).toMatchObject({ ok: true, message: t("campusForms.isbnAddedMany", { added: 0, already: 1 }) });
    expect(await db.libraryTitle.count({ where: { schoolId: school.school, title: { startsWith: "ZZ SHD" } } })).toBe(1);
  });

  it("an empty list is refused beside the box", async () => {
    await as("librarian", "LIBRARIAN", "school", "POST /library/catalogue");
    expect(await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "  " }))).toMatchObject({ ok: false, field: "text" });
  });
});

describe("a boarder moved to another bed on /hostel/rooms", () => {
  it("the warden moves pupil 1 from bed 1 to bed 2: the old place ends today, the new one starts today, audited", async () => {
    await as("warden", "WARDEN", "school", "POST /hostel/rooms");
    const answer = await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Place!, bed: `${ids.room}:2` }));
    expect(answer).toMatchObject({ ok: true, message: t("collegeOffice.roomChanged") });
    const old = await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.p1Place } });
    expect([old.status, old.toDate, old.activeBedKey]).toEqual(["ENDED", today(), null]);
    const now = await db.hostelAllotment.findFirstOrThrow({ where: { membershipId: member.p1, status: "ACTIVE" } });
    expect([now.roomId, now.bed, now.fromDate]).toEqual([ids.room, 2, today()]);
    ids.p1Now = now.id;
    expect(await audits("hostel.roomChange", now.id)).toBe(1);
  });

  it("a bed somebody holds is refused beside the bed box, and nothing moves", async () => {
    await as("admin", "ADMIN", "school", "POST /hostel/rooms");
    const answer = await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Now!, bed: `${ids.room}:3` }));
    expect(answer).toMatchObject({ ok: false, field: "bed", message: t("hostel.refuseBedTaken") });
    expect((await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.p1Now } })).status).toBe("ACTIVE");
  });

  it("a bed the room does not have is refused beside the bed box", async () => {
    await as("warden", "WARDEN", "school", "POST /hostel/rooms");
    const answer = await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Now!, bed: `${ids.room}:7` }));
    expect(answer).toMatchObject({ ok: false, field: "bed", message: t("hostel.refuseNoSuchBed", { beds: 3 }) });
  });

  it("the head and a teacher do not move boarders", async () => {
    for (const [who, role] of [["principal", "PRINCIPAL"], ["teacher", "TEACHER"]] as const) {
      await as(who, role, "school", "POST /hostel/rooms");
      expect((await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Now!, bed: `${ids.room}:2` }))).ok, who).toBe(false);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Part B: the head's pages                                                    */
/* -------------------------------------------------------------------------- */

const HEAD_HREFS = ["/principal/leave", "/principal/trends", "/admin/reviews", "/admin/safety"];

describe("the menus: the four entries carry the head's duty for the office, none for the head", () => {
  it("NAV.ADMIN's leave, trends, reviews and safety, and the leave tab at a phone's width, name HEAD_PAGES; nothing else does", () => {
    expect(NAV.ADMIN.filter((i) => i.duty).map((i) => [i.href, i.duty]).sort()).toEqual(HEAD_HREFS.map((h) => [h, "HEAD_PAGES"]).sort());
    expect(PHONE_BAR.ADMIN.filter((i) => i.duty).map((i) => i.href)).toEqual(["/principal/leave"]);
  });

  it("the head's menu has all four, with no duty (the head always holds them)", () => {
    for (const href of HEAD_HREFS) expect(NAV.PRINCIPAL.find((i) => i.href === href), href).toMatchObject({ href });
    expect(NAV.PRINCIPAL.some((i) => i.duty)).toBe(false);
  });
});

describe("the gate for an admin with and without the head's pages", () => {
  it("a page under a head's entry is 404 without the duty and passes with it; the staff roster (the leave entry's `also`) passes", async () => {
    for (const href of HEAD_HREFS) {
      expect(adminDutyPagePermitted(href, []), href).toBe(false);
      expect(adminDutyPagePermitted(`${href}/x`, []), href).toBe(false);
      expect(adminDutyPagePermitted(href, ["HEAD_PAGES"]), href).toBe(true);
      expect(await gateRequest(`GET ${href}`, { role: "ADMIN", schoolId: null, duties: [] })).toBe("not-found");
      expect(await gateRequest(`POST ${href}`, { role: "ADMIN", schoolId: null, duties: [] })).toBe("not-found");
      expect(await gateRequest(`GET ${href}`, { role: "ADMIN", schoolId: null, duties: ["HEAD_PAGES"] })).toBe("pass");
      expect(await gateRequest(`GET ${href}`, { role: "PRINCIPAL", schoolId: null, duties: [] })).toBe("pass");
    }
    expect(adminDutyPagePermitted("/principal/staff", [])).toBe(true);
    expect(await gateRequest("GET /principal/staff", { role: "ADMIN", schoolId: null, duties: [] })).toBe("pass");
    expect(await gateRequest("GET /admin/people", { role: "ADMIN", schoolId: null, duties: [] })).toBe("pass");
  });

  it("a door behind them refuses an admin without the duty 403, in words; the head and an admin holding it pass", async () => {
    const doors = ["GET /api/v1/admin/leave", "POST /api/v1/admin/leave/x/decide", "GET /api/v1/principal/trends", "GET /api/v1/admin/reviews", "POST /api/v1/admin/reviews", "POST /api/v1/admin/reviews/x/close", "GET /api/v1/admin/safety", "POST /api/v1/office/safety/take-down", "POST /api/v1/office/safety/dismiss"];
    for (const door of doors) {
      const [method, path] = door.split(" ") as [string, string];
      expect(endpointFor(method, path)?.duties, door).toEqual(["HEAD_PAGES"]);
      await expect(gateRequest(door, { role: "ADMIN", schoolId: null, duties: [] }), door).rejects.toMatchObject({ key: "headDuty.refuseNoDuty", code: "FORBIDDEN" });
      expect(await gateRequest(door, { role: "ADMIN", schoolId: null, duties: ["HEAD_PAGES"] }), door).toBe("pass");
      expect(await gateRequest(door, { role: "PRINCIPAL", schoolId: null, duties: [] }), door).toBe("pass");
    }
    // Another door of the office's is untouched.
    expect(await gateRequest("GET /api/v1/admin/people", { role: "ADMIN", schoolId: null, duties: [] })).toBe("pass");
  });

  it("permits(): an office duty binds an ADMIN only; a college duty still binds FACULTY and HOD only", () => {
    const head = { access: ["ADMIN", "PRINCIPAL"] as never, duties: ["HEAD_PAGES" as const] };
    expect(permits(head, "ADMIN", [])).toBe(false);
    expect(permits(head, "ADMIN", ["HEAD_PAGES"])).toBe(true);
    expect(permits(head, "PRINCIPAL", [])).toBe(true);
    const squad = { access: ["FACULTY", "ADMIN"] as never, duties: ["ANTI_RAGGING_SQUAD" as const] };
    expect(permits(squad, "ADMIN", [])).toBe(true);
    expect(permits(squad, "FACULTY", [])).toBe(false);
    expect(permits(squad, "FACULTY", ["ANTI_RAGGING_SQUAD"])).toBe(true);
  });

  it("the vacancy rule: with no head every admin holds them; a stored duty on another role means nothing", () => {
    expect(adminDutiesHeld("[]", false)).toEqual(["HEAD_PAGES"]);
    expect(adminDutiesHeld("[]", true)).toEqual([]);
    expect(adminDutiesHeld('["HEAD_PAGES"]', true)).toEqual(["HEAD_PAGES"]);
    expect(dutiesForRole("TEACHER", '["HEAD_PAGES"]', true)).toEqual([]);
    expect(dutiesForRole("FACULTY", '["HEAD_PAGES","LAB_INCHARGE"]', true)).toEqual(["LAB_INCHARGE"]);
  });
});

describe("the head gives an admin the head's pages from the staff roster", () => {
  it("without them the admin's session is answered 404 on the leave page and 403 on the safety door; the head reads the safety door", async () => {
    await as("admin", "ADMIN", "school", "GET /principal/leave");
    const page = await getSession();
    expect(page && isModuleOffPage(page)).toBe(true);
    expect(page?.role).toBeNull();

    await as("admin", "ADMIN", "school", "GET /api/v1/admin/safety");
    const refused = await safetyGet(new Request("http://localhost/api/v1/admin/safety?tab=open"));
    expect(refused.status).toBe(403);
    expect((await refused.json()).error).toBe(t("headDuty.refuseNoDuty"));

    await as("principal", "PRINCIPAL", "school", "GET /api/v1/admin/safety");
    expect((await safetyGet(new Request("http://localhost/api/v1/admin/safety?tab=audit"))).status).toBe(200);
  });

  it("an admin cannot give them, not even to themselves", async () => {
    await as("admin", "ADMIN", "school", "POST /principal/staff");
    const answer = await headDutyAction(FORM_IDLE, form({ membershipId: member.admin!, held: "true" }));
    expect(answer).toMatchObject({ ok: false, message: t("headDuty.refuseNotHead") });
    expect(await audits("people.headDuty.set")).toBe(0);
  });

  it("the head gives them through the form: stored on the membership, audited, the admin told; again changes nothing", async () => {
    await as("principal", "PRINCIPAL", "school", "POST /principal/staff");
    const answer = await headDutyAction(FORM_IDLE, form({ membershipId: member.admin!, held: "true" }));
    expect(answer).toMatchObject({ ok: true, message: t("headDuty.given") });
    expect(JSON.parse((await db.membership.findUniqueOrThrow({ where: { id: member.admin } })).dutiesJson)).toEqual(["HEAD_PAGES"]);
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: school.school, action: "people.headDuty.set", targetId: member.admin } });
    expect([row.actorUserId, row.targetType, JSON.parse(row.meta)]).toEqual([user.principal, "Membership", { duty: "HEAD_PAGES", held: true }]);
    expect(await db.notification.count({ where: { userId: user.admin, titleKey: "headDuty.notifyGivenTitle" } })).toBe(1);

    await as("principal", "PRINCIPAL", "school", "POST /principal/staff");
    expect((await headDutyAction(FORM_IDLE, form({ membershipId: member.admin!, held: "true" }))).ok).toBe(true);
    expect(await audits("people.headDuty.set", member.admin)).toBe(1);
  });

  it("holding them, the admin opens the leave page, the safety door and the trends door", async () => {
    await as("admin", "ADMIN", "school", "GET /principal/leave");
    const page = await getSession();
    expect(page && isModuleOffPage(page)).toBe(false);
    expect(page?.role).toBe("ADMIN");
    await as("admin", "ADMIN", "school", "GET /api/v1/admin/safety");
    expect((await safetyGet(new Request("http://localhost/api/v1/admin/safety?tab=open"))).status).toBe(200);
    await as("admin", "ADMIN", "school", "GET /api/v1/principal/trends");
    expect((await trendsGet(new Request("http://localhost/api/v1/principal/trends"))).status).toBe(200);
  });

  it("only to an active admin of the head's own school", async () => {
    await expect(setHeadDuty(ctx("principal", "PRINCIPAL"), member.teacher!, true)).rejects.toMatchObject({ key: "headDuty.refuseNotAdmin" });
    await expect(setHeadDuty(ctx("principal", "PRINCIPAL"), member.soloAdmin!, true)).rejects.toMatchObject({ key: "access.entryNotFound", code: "NOT_FOUND" });
    expect(JSON.parse((await db.membership.findUniqueOrThrow({ where: { id: member.soloAdmin } })).dutiesJson)).toEqual([]);
  });

  it("a leave request tells the head and the admin holding the pages, not the admin without them", async () => {
    expect((await headPageHolders(school.school!)).sort()).toEqual([user.principal, user.admin].sort());
    const done = await applyForLeave(ctx("teacher", "TEACHER"), { fromDateKey: "2027-02-01", toDateKey: "2027-02-02", kind: "CASUAL", reason: "ZZ family" });
    expect(done.ok).toBe(true);
    const told = await db.notification.findMany({ where: { userId: { in: [user.principal!, user.admin!, user.admin2!] }, titleKey: "notifTitle.leaveWaiting" }, select: { userId: true } });
    expect(told.map((n) => n.userId).sort()).toEqual([user.principal, user.admin].sort());
  });

  it("the head takes them back: audited, the duty gone, the page 404 again", async () => {
    await as("principal", "PRINCIPAL", "school", "POST /principal/staff");
    expect(await headDutyAction(FORM_IDLE, form({ membershipId: member.admin!, held: "false" }))).toMatchObject({ ok: true, message: t("headDuty.takenBack") });
    expect(JSON.parse((await db.membership.findUniqueOrThrow({ where: { id: member.admin } })).dutiesJson)).toEqual([]);
    const rows = await db.auditLog.findMany({ where: { schoolId: school.school, action: "people.headDuty.set", targetId: member.admin }, orderBy: { createdAt: "asc" } });
    expect(rows.map((r) => JSON.parse(r.meta).held)).toEqual([true, false]);
    await as("admin", "ADMIN", "school", "POST /principal/leave");
    const page = await getSession();
    expect(page && isModuleOffPage(page)).toBe(true);
  });

  it("at a school with no head, every admin holds them and is told of a leave request", async () => {
    await as("soloAdmin", "ADMIN", "solo", "GET /principal/leave");
    const page = await getSession();
    expect(page && isModuleOffPage(page)).toBe(false);
    expect(page?.role).toBe("ADMIN");
    expect(await headPageHolders(school.solo!)).toEqual([user.soloAdmin]);
    expect(await applyForLeave(ctx("soloTeacher", "TEACHER", "solo"), { fromDateKey: "2027-02-03", toDateKey: "2027-02-03", kind: "CASUAL", reason: "ZZ a day" })).toMatchObject({ ok: true });
    expect(await db.notification.count({ where: { userId: user.soloAdmin, titleKey: "notifTitle.leaveWaiting" } })).toBe(1);
  });
});
