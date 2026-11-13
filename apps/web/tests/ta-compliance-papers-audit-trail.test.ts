/**
 * TA-109 (testing analysis of 13 November 2026): the school's audit trail could be read only as its newest 200 rows.
 * listAudit took nothing but an action prefix and a cap, both readers asked for 200 with no other filter, and the page
 * filtered those 200 in the browser, so a row older than the newest 200 (who exported the directory last week) could
 * not be reached by the school although it is kept for two years. The trail now pages back by a cursor (the last row's
 * id, before=) and the door takes the action prefix as well, answering the next page's cursor as auditNext.
 *
 * At a ZZ school of this suite's own with 250 audit rows of its own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as safetyGet } from "@/app/api/v1/admin/safety/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
let schoolId = "";
let adminUserId = "";
let oldestId = "";

type Safety = { audit: { id: string; action: string }[]; auditNext?: string | null };
async function read(query: string): Promise<Safety> {
  __resetCookies();
  await createSession(adminUserId, { schoolId, role: "ADMIN" });
  const res = await safetyGet(new Request(`http://localhost/api/v1/admin/safety?tab=audit${query}`));
  expect(res.status).toBe(200);
  return (await res.json()) as Safety;
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA Audit Trail ${STAMP}`, slug: `zz-tacp-audit-${STAMP}`, code: `ZCA${SUFFIX}`, contactEmail: `zz-tacp-audit-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  adminUserId = (await db.user.create({ data: { name: "ZZ TACP Audit Admin", email: `zz-tacp-audit-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  // The directory export is the oldest; 249 register marks follow it, a minute apart.
  const start = Date.now() - 300 * 60_000;
  oldestId = (await db.auditLog.create({ data: { schoolId, actorUserId: adminUserId, action: "directory.export", meta: "{}", createdAt: new Date(start) }, select: { id: true } })).id;
  await db.auditLog.createMany({ data: Array.from({ length: 249 }, (_, i) => ({ schoolId, actorUserId: adminUserId, action: "attendance.mark", meta: "{}", createdAt: new Date(start + (i + 1) * 60_000) })) });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: adminUserId } });
  await db.auditLog.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: adminUserId } });
  await db.$disconnect();
});

describe("the school's audit trail", () => {
  it("TA-109: the first page is the newest 200 and names the next page; the next page reaches the oldest row", async () => {
    const first = await read("");
    expect(first.audit).toHaveLength(200);
    expect(first.audit.map((a) => a.id)).not.toContain(oldestId);
    expect(first.auditNext).toBe(first.audit[199]!.id);
    const second = await read(`&before=${first.auditNext}`);
    expect(second.audit).toHaveLength(50);
    expect(second.audit.at(-1)!.id).toBe(oldestId);
    expect(second.audit.map((a) => a.id).filter((id) => first.audit.some((a) => a.id === id))).toEqual([]);
    expect(second.auditNext).toBeNull();
  });

  it("TA-109: the action filter is asked of the trail itself, so a row older than the newest 200 is found at once", async () => {
    const exports = await read("&action=directory.");
    expect(exports.audit.map((a) => a.id)).toEqual([oldestId]);
  });
});
