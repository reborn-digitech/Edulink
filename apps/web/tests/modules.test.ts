/**
 * The per-school modules and the four module roles (3 October 2026).
 *
 * Two ZZ schools of this suite's own: Hill has every module on, Vale keeps
 * the default (ALUMNI alone). What is proved: a door the catalog gives a
 * `module` answers 403 MODULE_OFF at the school that has it off and lets the
 * request through at the one that has it on; a module role reaches only the
 * doors that name it and only its own pages; its own module switched off
 * leaves it its home and its person's doors; the admin's switch is
 * idempotent and audited; a departure opens the ALUMNUS membership and an
 * undo closes it; and the sign-in lands a former pupil where they are now.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SCHOOL_MODULES, SCHOOL_VERSION_MODULES } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { APP_SEGMENTS, gateRequest, modulePagePermitted } from "@/lib/role-gate";
import { routeStamp } from "@/lib/route-header";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError, assertClassAccess } from "@/lib/tenancy";
import { apiFailure } from "@/lib/api-v1";
import { setModule, switchModuleFor, enabledModules, enabledModulesForFamily } from "@/lib/modules";
import { saveAssistantSettings } from "@/lib/assistant/service";
import { recordDeparture, undoDeparture } from "@/lib/school-record";
import { resolveContext } from "@/lib/resolve-context";
import { createPost } from "@/lib/bulletin";
import { actionKey } from "@/lib/safety-labels";
import type { Endpoint } from "@/lib/api-catalog";
import { GET as modulesGet, POST as modulesPost } from "@/app/api/v1/admin/modules/route";
import { GET as overviewGet } from "@/app/api/v1/admin/overview/route";
import { GET as meGet } from "@/app/api/v1/me/route";
import { GET as feedGet, POST as feedPost } from "@/app/api/v1/shared/bulletin/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { hill: "", vale: "", hillAdmin: "", hillPrincipal: "", hillDriver: "", valeAdmin: "", valeAlumnus: "", valePupil: "", pupilMembership: "", hillClass: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** Signed in as `userId` in `role` at `schoolId`, on the door or page the middleware would name. */
async function as(userId: string, role: string, schoolId: string, route: string | null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
}

const FAKE: Endpoint[] = [{ method: "GET", path: "/api/v1/zz/transport/routes", summary: "a transport door, for this suite", access: ["ADMIN", "DRIVER"], response: {} as never, module: "TRANSPORT" }];

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ Modules ${tag} ${STAMP}`, slug: `zz-mod-${tag.toLowerCase()}-${STAMP}`, code: `ZMD${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-mod-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.hill = (await mkSchool("Hill")).id;
  ids.vale = (await mkSchool("Vale")).id;
  await db.schoolModule.createMany({ data: [...SCHOOL_MODULES.map((module) => ({ schoolId: ids.hill, module })), { schoolId: ids.vale, module: "ALUMNI" }] });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Mod ${who}`, email: `zz-mod-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [ha, hp, hd, va, vp] = await Promise.all([mk("HillAdmin"), mk("HillPrincipal"), mk("HillDriver"), mk("ValeAdmin"), mk("ValePupil")]);
  Object.assign(ids, { hillAdmin: ha.id, hillPrincipal: hp.id, hillDriver: hd.id, valeAdmin: va.id, valePupil: vp.id });
  await db.membership.createMany({
    data: [
      { userId: ha.id, schoolId: ids.hill, role: "ADMIN", status: "ACTIVE" },
      { userId: hp.id, schoolId: ids.hill, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: hd.id, schoolId: ids.hill, role: "DRIVER", status: "ACTIVE" },
      { userId: va.id, schoolId: ids.vale, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  ids.pupilMembership = (await db.membership.create({ data: { userId: vp.id, schoolId: ids.vale, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2022-06-01T00:00:00Z"), studentCode: `ZMDP${STAMP}` }, select: { id: true } })).id;
  ids.hillClass = (await db.class.create({ data: { schoolId: ids.hill, name: `ZZ Mod Class ${STAMP}`, subject: "Maths", joinCode: `ZMDC${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.hill, ids.vale] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a door that names a module", () => {
  it("answers MODULE_OFF at the school that has it off, and lets the request through where it is on", async () => {
    await expect(gateRequest("GET /api/v1/zz/transport/routes", { role: "ADMIN", schoolId: ids.vale }, FAKE)).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/zz/transport/routes", { role: "ADMIN", schoolId: ids.hill }, FAKE)).resolves.toBe("pass");
    // The driver at Hill, whose role the door names.
    await expect(gateRequest("GET /api/v1/zz/transport/routes", { role: "DRIVER", schoolId: ids.hill }, FAKE)).resolves.toBe("pass");
  });

  it("is said as a 403 whose envelope code is MODULE_OFF and whose sentence names the module", async () => {
    const res = await apiFailure(new ModuleOffError("TRANSPORT"), "test");
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; code: string };
    expect(body.code).toBe("MODULE_OFF");
    expect(body.error).toContain("Transport");
  });
});

describe("a module role's doors", () => {
  it("are only the ones that name it: the office's overview is refused to a driver, /me answers with the school's modules", async () => {
    await as(ids.hillDriver, "DRIVER", ids.hill, "GET /api/v1/admin/overview");
    expect((await overviewGet()).status).toBe(403);
    await as(ids.hillDriver, "DRIVER", ids.hill, "GET /api/v1/me");
    const me = await meGet();
    expect(me.status).toBe(200);
    const body = (await me.json()) as { active: { role: string }; modules: string[] };
    expect(body.active.role).toBe("DRIVER");
    expect(body.modules).toEqual([...SCHOOL_MODULES]);
  });

  it("a family's modules are the union over the children's schools: a guardian of the Vale pupil sees Vale's ALUMNI, nobody else's", async () => {
    // A guardian's session names no school (4 Oct 2026): the shell and /me read the children's schools instead.
    const guardian = await db.user.create({ data: { name: `ZZ Mod Guardian`, email: `zz-mod-guardian-${STAMP}@test.invalid` }, select: { id: true } });
    const stranger = await db.user.create({ data: { name: `ZZ Mod Stranger`, email: `zz-mod-stranger-${STAMP}@test.invalid` }, select: { id: true } });
    await db.guardianship.create({ data: { parentUserId: guardian.id, studentMembershipId: ids.pupilMembership, studentSchoolId: ids.vale, relation: "PARENT", status: "ACTIVE" } });
    try {
      expect(await enabledModulesForFamily(guardian.id)).toEqual(["ALUMNI"]);
      expect(await enabledModulesForFamily(stranger.id)).toEqual([]);
    } finally {
      await db.guardianship.deleteMany({ where: { parentUserId: guardian.id } });
      await db.user.deleteMany({ where: { id: { in: [guardian.id, stranger.id] } } });
    }
  });

  it("refuse a module role every door the catalog does not name it on, and an uncatalogued path", async () => {
    await expect(gateRequest("POST /api/v1/shared/bulletin", { role: "ALUMNUS", schoolId: ids.vale })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "DRIVER", schoolId: ids.hill })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/nothing/here", { role: "DRIVER", schoolId: ids.hill })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "ALUMNUS", schoolId: ids.vale })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/shared/notifications", { role: "WARDEN", schoolId: ids.hill })).resolves.toBe("pass");
    // The older roles are not judged by the gate: their handlers decide.
    await expect(gateRequest("GET /api/v1/admin/overview", { role: "TEACHER", schoolId: ids.hill })).resolves.toBe("pass");
  });

  it("while its own module is off, keep only the person's doors: the alumnus at a school that switched alumni off", async () => {
    await as(ids.valeAdmin, "ADMIN", ids.vale, null);
    const admin = (await getSession())!;
    await setModule(admin, "ALUMNI", false);
    try {
      await expect(gateRequest("GET /api/v1/shared/bulletin", { role: "ALUMNUS", schoolId: ids.vale })).rejects.toBeInstanceOf(ModuleOffError);
      await expect(gateRequest("GET /api/v1/me", { role: "ALUMNUS", schoolId: ids.vale })).resolves.toBe("pass");
      await expect(gateRequest("POST /api/v1/auth/logout", { role: "ALUMNUS", schoolId: ids.vale })).resolves.toBe("pass");
      expect(modulePagePermitted("ALUMNUS", "/bulletin", await enabledModules(ids.vale))).toBe(false);
      expect(modulePagePermitted("ALUMNUS", "/alumni", await enabledModules(ids.vale))).toBe(true);
    } finally {
      await setModule(admin, "ALUMNI", true);
    }
    expect(modulePagePermitted("ALUMNUS", "/bulletin/some-post", await enabledModules(ids.vale))).toBe(true);
  });

  it("refuse an alumnus a post through the handler, and the feed answers them", async () => {
    // An alumnus row at Vale, made by hand here; the departure test below makes one the real way.
    const alumnus = await db.user.create({ data: { name: "ZZ Mod Alumnus", email: `zz-mod-alumnus-${STAMP}@test.invalid` }, select: { id: true } });
    await db.membership.create({ data: { userId: alumnus.id, schoolId: ids.vale, role: "ALUMNUS", status: "ACTIVE" } });
    await as(alumnus.id, "ALUMNUS", ids.vale, "POST /api/v1/shared/bulletin");
    expect((await feedPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", title: "ZZ", body: "ZZ", tags: [], media: [] }))).status).toBe(403);
    await as(alumnus.id, "ALUMNUS", ids.vale, "GET /api/v1/shared/bulletin");
    expect((await feedGet(get("/api/v1/shared/bulletin?limit=5"))).status).toBe(200);
    // And the library refuses on its own, with no gate in front of it.
    await as(alumnus.id, "ALUMNUS", ids.vale, null);
    const ctx = (await getSession())!;
    await expect(createPost(ctx, { scope: "SCHOOL", title: "ZZ", body: "ZZ", tags: [], media: [] })).rejects.toBeInstanceOf(AccessError);
  });
});

describe("a module role's pages", () => {
  it("are its home, the notices and its NAV; the rest of the school's surface carries no school", async () => {
    const on = await enabledModules(ids.hill);
    expect(modulePagePermitted("DRIVER", "/driver", on)).toBe(true);
    expect(modulePagePermitted("DRIVER", "/notifications", on)).toBe(true);
    expect(modulePagePermitted("DRIVER", "/account", on)).toBe(true);
    expect(modulePagePermitted("DRIVER", "/switch", on)).toBe(true);
    expect(modulePagePermitted("DRIVER", "/admin", on)).toBe(false);
    expect(modulePagePermitted("DRIVER", "/bulletin", on)).toBe(false);
    expect(modulePagePermitted("LIBRARIAN", "/teacher/classes", on)).toBe(false);

    await as(ids.hillDriver, "DRIVER", ids.hill, "GET /admin/people");
    const off = await getSession();
    expect({ role: off?.role, schoolId: off?.schoolId }).toEqual({ role: null, schoolId: null });
    await as(ids.hillDriver, "DRIVER", ids.hill, "GET /driver");
    const home = await getSession();
    expect({ role: home?.role, schoolId: home?.schoolId }).toEqual({ role: "DRIVER", schoolId: ids.hill });
  });

  it("fails closed: a request the middleware never stamped, and a path stamped encoded, carry no school for a module role (campaign S-11)", async () => {
    // No stamp: a dotted last segment ("/admin/people/x.ab") skips the middleware's matcher yet still reaches a page.
    await expect(gateRequest(null, { role: "DRIVER", schoolId: ids.hill })).resolves.toBe("no-context");
    await expect(gateRequest(null, { role: "ADMIN", schoolId: ids.hill })).resolves.toBe("pass");
    // The middleware stamps the DECODED path, as a production router serves "/%61dmin/people".
    expect(routeStamp("GET", "/%61dmin/people")).toBe("GET /admin/people");
    expect(routeStamp("GET", "//admin//people/")).toBe("GET /admin/people");
    expect(routeStamp("GET", "/admin/%2e%2e/driver")).toBe("GET !");
    expect(routeStamp("GET", "/admin%2Fpeople")).toBe("GET !");
    expect(routeStamp("GET", "/%E0%A4")).toBe("GET !");
    await expect(gateRequest(routeStamp("GET", "/%61dmin/people"), { role: "DRIVER", schoolId: ids.hill })).resolves.toBe("no-context");
    // …and should a raw stamp arrive, the gate decodes it itself; an unreadable one is refused a module role.
    await expect(gateRequest("GET /%61dmin/people", { role: "DRIVER", schoolId: ids.hill })).resolves.toBe("no-context");
    await expect(gateRequest("GET !", { role: "DRIVER", schoolId: ids.hill })).resolves.toBe("no-context");
    await expect(gateRequest("GET /%61pi/v1/admin/overview", { role: "DRIVER", schoolId: ids.hill })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /driver", { role: "DRIVER", schoolId: ids.hill })).resolves.toBe("pass");
    // Through getSession: the same driver on the encoded path is served with no school.
    await as(ids.hillDriver, "DRIVER", ids.hill, "GET /%61dmin/people");
    expect((await getSession())?.schoolId).toBeNull();
  });

  it("names every top-level segment of app/(app) in APP_SEGMENTS, and nothing else", () => {
    const root = join(process.cwd(), "src", "app", "(app)");
    const dirs = readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory()).sort();
    expect([...APP_SEGMENTS].sort()).toEqual(dirs);
  });

  it("the class, pupil and work asserts refuse a module role even with the gate out of the way", async () => {
    await expect(assertClassAccess({ schoolId: ids.hill, membershipId: "x", role: "DRIVER" }, ids.hillClass)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the admin's switch", () => {
  it("lists every module to the office and the head; only the admin switches, once, with an audit row each way", async () => {
    await as(ids.hillPrincipal, "PRINCIPAL", ids.hill, "GET /api/v1/admin/modules");
    const listed = (await (await modulesGet()).json()) as { modules: { module: string; on: boolean }[] };
    // A school is offered the school version's six (4 Oct 2026); a college all twelve (tests/college-foundation.test.ts).
    // The assistant is the operator's to switch (16 Oct 2026), so the school's own list leaves it out.
    expect(listed.modules.map((m) => m.module)).toEqual(SCHOOL_VERSION_MODULES.filter((m) => m !== "ASSISTANT"));
    expect(listed.modules.every((m) => m.on)).toBe(true);
    await as(ids.hillPrincipal, "PRINCIPAL", ids.hill, "POST /api/v1/admin/modules");
    expect((await modulesPost(json("/api/v1/admin/modules", { module: "LIBRARY", on: false }))).status).toBe(403);

    await as(ids.hillAdmin, "ADMIN", ids.hill, "POST /api/v1/admin/modules");
    expect((await modulesPost(json("/api/v1/admin/modules", { module: "NOPE", on: true }))).status).toBe(422);
    const offRes = await modulesPost(json("/api/v1/admin/modules", { module: "LIBRARY", on: false }));
    expect(offRes.status).toBe(200);
    expect(((await offRes.json()) as { modules: { module: string; on: boolean }[] }).modules.find((m) => m.module === "LIBRARY")?.on).toBe(false);
    await modulesPost(json("/api/v1/admin/modules", { module: "LIBRARY", on: false }));
    await modulesPost(json("/api/v1/admin/modules", { module: "LIBRARY", on: true }));
    await modulesPost(json("/api/v1/admin/modules", { module: "LIBRARY", on: true }));
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.hill, action: { startsWith: "school.module." } }, orderBy: { createdAt: "asc" }, select: { action: true, meta: true } });
    expect(rows.map((r) => r.action)).toEqual(["school.module.off", "school.module.on"]);
    expect(actionKey("school.module.on")).toBe("audit.schoolModuleOn");
    expect(actionKey("school.module.off")).toBe("audit.schoolModuleOff");
    expect(await enabledModules(ids.hill)).toEqual([...SCHOOL_MODULES]);
  });

  it("⚠ never switches the assistant: the operator does (16 Oct 2026); the door, the library and the office's assistant card all refuse", async () => {
    await as(ids.hillAdmin, "ADMIN", ids.hill, "POST /api/v1/admin/modules");
    const refused = await modulesPost(json("/api/v1/admin/modules", { module: "ASSISTANT", on: false }));
    expect(refused.status).toBe(403);
    expect(((await refused.json()) as { error: string }).error).toBe("The platform's operator switches the assistant on for a school.");
    const admin = (await getSession())!;
    await expect(setModule(admin, "ASSISTANT", false)).rejects.toMatchObject({ key: "modules.refuseAssistant" });
    await expect(setModule(admin, "ASSISTANT", true)).rejects.toMatchObject({ key: "modules.refuseAssistant" });
    // The office's assistant card: a change of `on` is refused; the state the school already has is accepted (an older client).
    await expect(saveAssistantSettings(admin, { on: false })).rejects.toMatchObject({ key: "modules.refuseAssistant" });
    expect((await saveAssistantSettings(admin, { on: true })).on).toBe(true);
    expect(await enabledModules(ids.hill)).toContain("ASSISTANT");
    expect(await db.auditLog.count({ where: { schoolId: ids.hill, action: { startsWith: "school.module." }, meta: { contains: "ASSISTANT" } } })).toBe(0);
    // The operator's path (switchModuleFor with byOperator, operator-college.ts) still switches it.
    expect(await switchModuleFor(ids.hill, ids.hillAdmin, "ASSISTANT", false, { byOperator: true })).toEqual({ changed: true });
    expect(await switchModuleFor(ids.hill, ids.hillAdmin, "ASSISTANT", true, { byOperator: true })).toEqual({ changed: true });
    expect(await enabledModules(ids.hill)).toEqual([...SCHOOL_MODULES]);
  });
});

describe("the alumnus membership", () => {
  it("is opened by a departure, closed by its undo, opened again by the next; the sign-in lands a former pupil where they are now", async () => {
    await as(ids.valeAdmin, "ADMIN", ids.vale, null);
    const admin = (await getSession())!;
    const leftOn = new Date("2026-04-30T06:30:00Z");
    expect(await recordDeparture(admin, ids.pupilMembership, { reason: "GRADUATED", leftOn })).toMatchObject({ ok: true });
    const open = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: ids.valePupil, schoolId: ids.vale, role: "ALUMNUS" } }, select: { status: true, leftAt: true, joinedAt: true } });
    expect(open).toMatchObject({ status: "ACTIVE", leftAt: null });
    expect(open!.joinedAt.toISOString()).toBe(leftOn.toISOString());
    // Nothing else to go to: their alumni home.
    expect(await resolveContext(ids.valePupil)).toEqual({ role: "ALUMNUS", schoolId: ids.vale, redirectTo: "/alumni" });

    expect(await undoDeparture(admin, ids.pupilMembership)).toEqual({ ok: true });
    const closed = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: ids.valePupil, schoolId: ids.vale, role: "ALUMNUS" } }, select: { leftAt: true } });
    expect(closed?.leftAt).not.toBeNull();

    expect(await recordDeparture(admin, ids.pupilMembership, { reason: "TRANSFERRED", leftOn })).toMatchObject({ ok: true });
    const reopened = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: ids.valePupil, schoolId: ids.vale, role: "ALUMNUS" } }, select: { leftAt: true, status: true } });
    expect(reopened).toEqual({ leftAt: null, status: "ACTIVE" });

    // A pupil at a new school as well: they land there, and reach the old one from the chooser.
    await db.membership.create({ data: { userId: ids.valePupil, schoolId: ids.hill, role: "STUDENT", status: "ACTIVE", studentCode: `ZMDQ${STAMP}` } });
    expect(await resolveContext(ids.valePupil)).toEqual({ role: "STUDENT", schoolId: ids.hill, redirectTo: "/student" });
  });
});
