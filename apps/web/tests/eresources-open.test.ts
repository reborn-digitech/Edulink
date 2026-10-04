/**
 * A college's e-resources opened by its members (campaign 2026-10-04, G-3):
 * a STUDENT, a FACULTY member and an HOD read the active list (never the
 * inactive) and open a resource through the web's own route,
 * /library/e-resources/{id}/open, which counts the open and answers a 302 to
 * the publisher's https link; at a college with LIBRARY off the page and the
 * route answer MODULE_OFF. Two ZZ colleges of this suite's own.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ModuleOffError } from "@/lib/access-error";
import { listEResources } from "@/lib/college-campus";
import { ModuleOff } from "@/components/module-off";
import { GET as listGet } from "@/app/api/v1/library/eresources/route";
import { GET as openGet } from "@/app/(app)/library/e-resources/[resourceId]/open/route";
import EResourcesPage from "@/app/(app)/library/e-resources/page";

// The page is a server component compiled with the classic JSX runtime here (tsconfig's "preserve"); it needs React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};

const open = (resourceId: string) => openGet(new Request(`http://localhost/library/e-resources/${resourceId}/open`), { params: Promise.resolve({ resourceId }) });
/** Signed in as `who`, the request stamped as the middleware would (so the module gate reads the real path). */
async function as(who: string, role: string, schoolId: string, route = "GET /") {
  __resetCookies();
  __setHeaders({ "x-edulink-route": route });
  await createSession(ids[who]!, { schoolId, role: role as never });
}
const clicks = async (id: string) => (await db.libraryEResource.findUniqueOrThrow({ where: { id }, select: { clicks: true } })).clicks;

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ EResources ${tag} ${STAMP}`, slug: `zz-eres-${tag.toLowerCase()}-${STAMP}`, code: `ZE${tag[0]}${SUFFIX}`, contactEmail: `zz-eres-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } });
  ids.college = (await mk("College")).id;
  ids.bare = (await mk("Bare")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ACADEMICS" }, { schoolId: ids.college, module: "LIBRARY" }, { schoolId: ids.bare, module: "ACADEMICS" }] });
  const people: [string, string, string][] = [["student", "STUDENT", ids.college], ["faculty", "FACULTY", ids.college], ["hod", "HOD", ids.college], ["bareStudent", "STUDENT", ids.bare], ["bareFaculty", "FACULTY", ids.bare]];
  for (const [who, role, schoolId] of people) {
    ids[who] = (await db.user.create({ data: { name: `ZZ EResources ${who}`, email: `zz-eres-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } })).id;
    await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZES${who}${SUFFIX}` } : {}) } });
  }
  const res = (schoolId: string, name: string, active = true) => db.libraryEResource.create({ data: { schoolId, name, url: `https://example.org/${name.toLowerCase()}`, kind: "NLIST", active }, select: { id: true } });
  ids.nlist = (await res(ids.college, "NLIST")).id;
  ids.retired = (await res(ids.college, "Retired", false)).id;
  ids.bareRes = (await res(ids.bare, "BareNLIST")).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college!, ids.bare!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a college's e-resources, opened by its members", () => {
  it("lists only the active resources to a student and a faculty member", async () => {
    await as("student", "STUDENT", ids.college!, "GET /api/v1/library/eresources");
    const res = await listGet();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { items: { id: string }[] };
    expect(data.items.map((i) => i.id)).toEqual([ids.nlist]);
    await as("faculty", "FACULTY", ids.college!, "GET /library/e-resources");
    const ctx = (await getSession())!;
    expect(ctx.role).toBe("FACULTY");
    expect((await listEResources(ctx)).items.map((i) => i.id)).toEqual([ids.nlist]);
  });

  it("counts an open through the route and sends the member on to the https link", async () => {
    const before = await clicks(ids.nlist!);
    await as("student", "STUDENT", ids.college!, `GET /library/e-resources/${ids.nlist}/open`);
    const r1 = await open(ids.nlist!);
    expect(r1.status).toBe(302);
    expect(r1.headers.get("location")).toBe("https://example.org/nlist");
    // FACULTY and HOD are limited roles: the gate passes the route through their NAV entry (module LIBRARY).
    await as("faculty", "FACULTY", ids.college!, `GET /library/e-resources/${ids.nlist}/open`);
    expect((await open(ids.nlist!)).status).toBe(302);
    await as("hod", "HOD", ids.college!, `GET /library/e-resources/${ids.nlist}/open`);
    expect((await open(ids.nlist!)).status).toBe(302);
    expect(await clicks(ids.nlist!)).toBe(before + 3);
  });

  it("refuses an inactive resource and another college's, counting nothing", async () => {
    await as("student", "STUDENT", ids.college!, `GET /library/e-resources/${ids.retired}/open`);
    expect((await open(ids.retired!)).status).toBe(404);
    expect((await open(ids.bareRes!)).status).toBe(404);
    expect(await clicks(ids.retired!)).toBe(0);
    expect(await clicks(ids.bareRes!)).toBe(0);
  });

  it("answers MODULE_OFF at a college with LIBRARY off: the route, the list and the page", async () => {
    await as("bareStudent", "STUDENT", ids.bare!, `GET /library/e-resources/${ids.bareRes}/open`);
    const r = await open(ids.bareRes!);
    expect(r.status).toBe(403);
    expect(r.headers.get("x-edulink-code")).toBe("MODULE_OFF");
    await expect(listEResources((await getSession())!)).rejects.toBeInstanceOf(ModuleOffError);
    await as("bareStudent", "STUDENT", ids.bare!, "GET /library/e-resources");
    const page = (await EResourcesPage()) as { type: unknown };
    expect(page.type).toBe(ModuleOff);
    // A faculty member's NAV entry is behind LIBRARY: the gate gives the route no school, so it is refused too.
    await as("bareFaculty", "FACULTY", ids.bare!, `GET /library/e-resources/${ids.bareRes}/open`);
    expect((await open(ids.bareRes!)).status).toBe(403);
    expect(await clicks(ids.bareRes!)).toBe(0);
  });
});
