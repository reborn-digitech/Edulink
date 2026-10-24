/**
 * QA-57 (QA campaign of 24 October 2026): a college's head lands on the college's dashboard at sign-in, not on the
 * school's /principal that then sends them on inside its loading boundary (two navigations at every sign-in). A
 * school's head, a college's office and every other role land where ROLE_HOME says.
 *
 * A ZZ college and a ZZ school of the suite's own, people at @test.invalid, deleted by id afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { resolveContext } from "@/lib/resolve-context";
import { homeFor } from "@/lib/role-home";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};

beforeAll(async () => {
  for (const [k, kind] of [["college", "COLLEGE"], ["school", "SCHOOL"]] as const) {
    ids[k] = (await db.school.create({ data: { name: `ZZ Home ${k} ${STAMP}`, slug: `zz-home-${k}-${STAMP}`, code: `ZH${k.slice(0, 1).toUpperCase()}${SUFFIX}`, contactEmail: `zz-home-${k}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } })).id;
  }
  for (const [who, role, school] of [["cHead", "PRINCIPAL", "college"], ["sHead", "PRINCIPAL", "school"], ["cAdmin", "ADMIN", "college"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ Home ${who}`, email: `zz-home-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    await db.membership.create({ data: { userId: ids[who]!, schoolId: ids[school]!, role, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [ids.college!, ids.school!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-57: where a head lands", () => {
  it("sends a college's head to the college's dashboard at sign-in, and a school's head to the school's", async () => {
    expect(await resolveContext(ids.cHead!)).toEqual({ role: "PRINCIPAL", schoolId: ids.college, redirectTo: "/principal/college" });
    expect(await resolveContext(ids.sHead!)).toEqual({ role: "PRINCIPAL", schoolId: ids.school, redirectTo: "/principal" });
    expect(await resolveContext(ids.cAdmin!)).toEqual({ role: "ADMIN", schoolId: ids.college, redirectTo: "/admin" });
    // The last context remembered is honoured the same way.
    expect((await resolveContext(ids.cHead!, "PRINCIPAL", ids.college)).redirectTo).toBe("/principal/college");
  });

  it("answers ROLE_HOME for every other case", async () => {
    expect(await homeFor("PRINCIPAL", ids.college)).toBe("/principal/college");
    expect(await homeFor("PRINCIPAL", ids.school)).toBe("/principal");
    expect(await homeFor("PRINCIPAL", null)).toBe("/principal");
    expect(await homeFor("ADMIN", ids.college)).toBe("/admin");
    expect(await homeFor("PARENT", null)).toBe("/parent");
  });
});
