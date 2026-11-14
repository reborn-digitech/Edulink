/**
 * TA-173 (testing analysis of 13 November 2026, batch mobile-core): a guardian's "Report a problem" from the phone was
 * written with no school, which no school's Safety centre lists and the operator's server log filtered out by action,
 * and nobody was told, while the phone says the Shalaghar team reads every report. Now such a row is in the server
 * log (SERVER_AUDIT_WHERE) and the operators are told of a problem.
 *
 * notify is replaced with a recorder, so no notice reaches a real operator of the dev database; the stamped ZZ people
 * and every row they wrote are removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const notified = vi.hoisted(() => [] as { userId: string; schoolId?: string | null; url?: string; bodyKey?: string; meta?: Record<string, unknown> }[]);
vi.mock("@/lib/notify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/notify")>();
  return {
    ...actual,
    notify: vi.fn(async (input: { userId: string; schoolId?: string | null; url?: string; bodyKey?: string; meta?: Record<string, unknown> }) => {
      notified.push(input);
    }),
  };
});

import { createSession } from "@/lib/session";
import { SERVER_AUDIT_WHERE } from "@/lib/superuser";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as reportPost } from "@/app/api/v1/app/report/route";

const db = new PrismaClient();
const STAMP = Date.now();

let parentUserId = "";
let operatorUserId = "";

const device = { platform: "android" as const, os: "Android 14", model: "ZZ Phone", appVersion: "1.2.3", build: "45" };
const post = (body: unknown) => new Request("http://localhost/api/v1/app/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  const parent = await db.user.create({ data: { name: "ZZ MC Report Parent", email: `zz-mc-report-parent-${STAMP}@test.invalid` }, select: { id: true } });
  const operator = await db.user.create({ data: { name: "ZZ MC Report Operator", email: `zz-mc-report-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } });
  parentUserId = parent.id;
  operatorUserId = operator.id;
});

afterAll(async () => {
  __resetCookies();
  const ids = [parentUserId, operatorUserId];
  await db.rateLimit.deleteMany({ where: { bucket: { in: ids.map((id) => `app-report:${id}`) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a report from someone with no school reaches somebody (TA-173)", () => {
  it("TA-173: a guardian's problem report is in the operator's server log and the operators are told", async () => {
    __resetCookies();
    await createSession(parentUserId, { schoolId: null, role: "PARENT" });
    const res = await reportPost(post({ kind: "PROBLEM", message: "ZZ The report card will not open", device }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reportId: string; reference: string };
    const row = await db.auditLog.findUniqueOrThrow({ where: { id: body.reportId } });
    expect(row.schoolId).toBeNull();
    expect(row.action).toBe("APP_PROBLEM_REPORTED");
    // The server log's own filter finds it.
    expect(await db.auditLog.count({ where: { AND: [SERVER_AUDIT_WHERE, { id: body.reportId }] } })).toBe(1);
    // An operator is told, with the reference and the server log as the place to read it.
    const told = notified.filter((n) => n.userId === operatorUserId);
    expect(told).toHaveLength(1);
    expect(told[0]).toMatchObject({ schoolId: null, url: "/root/audit", bodyKey: "notifBody.appProblemOperator", meta: { reportId: body.reportId, reference: body.reference } });
  });

  it("TA-173: a guardian's crash report is in the server log too, and nobody is paged", async () => {
    __resetCookies();
    notified.length = 0;
    await createSession(parentUserId, { schoolId: null, role: "PARENT" });
    const res = await reportPost(post({ kind: "CRASH", message: "ZZ crash on start", device, stack: "at ZZ" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reportId: string };
    expect(await db.auditLog.count({ where: { AND: [SERVER_AUDIT_WHERE, { id: body.reportId }] } })).toBe(1);
    expect(notified).toHaveLength(0);
  });
});
