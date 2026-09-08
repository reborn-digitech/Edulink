/**
 * The /api/v1/app handlers — the kill switch and "Report a problem" —
 * invoked directly with a primed session the way api-v1-shared.test.ts does.
 *
 * The version endpoint is configuration: defaults when nothing is set, the
 * operator's values when they are, and a malformed value reported by
 * checkEnv rather than served. The report endpoint is a record: the audit
 * row the safety centre lists, the admins told about a problem and not about
 * a crash, and the hourly limit.
 *
 * Everything here is ZZ-prefixed and removed in afterAll.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { APP_RELEASE_VARS, checkEnv } from "@/lib/env";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as versionGet } from "@/app/api/v1/app/version/route";
import { POST as reportPost } from "@/app/api/v1/app/report/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let adminUserId = "";
let secondAdminUserId = "";
let teacherUserId = "";
let parentUserId = "";

const json = (body: unknown) =>
  new Request("http://localhost/api/v1/app/report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const device = { platform: "android" as const, os: "Android 14", model: "ZZ Phone", appVersion: "1.2.3", build: "45" };

async function as(userId: string, opts: { schoolId?: string | null; role: "ADMIN" | "TEACHER" | "PARENT" }) {
  __resetCookies();
  await createSession(userId, opts);
}

const env = process.env as Record<string, string | undefined>;
const original = Object.fromEntries(APP_RELEASE_VARS.map((k) => [k, env[k]]));
function clearRelease() {
  for (const key of APP_RELEASE_VARS) delete env[key];
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ App School ${STAMP}`, slug: `zz-app-${STAMP}`, code: `ZA${tail}`, contactEmail: `zz-app-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const mk = (tag: string) => db.user.create({ data: { name: `ZZ App ${tag}`, email: `zz-app-${tag}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, secondAdmin, teacher, parent, formerAdmin] = await Promise.all([mk("admin"), mk("admin-two"), mk("teacher"), mk("parent"), mk("former-admin")]);
  adminUserId = admin.id;
  secondAdminUserId = secondAdmin.id;
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  await Promise.all([
    db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" } }),
    db.membership.create({ data: { userId: secondAdmin.id, schoolId, role: "ADMIN", status: "ACTIVE" } }),
    // Left the school: must not be told.
    db.membership.create({ data: { userId: formerAdmin.id, schoolId, role: "ADMIN", status: "REMOVED" } }),
    db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" } }),
  ]);
});

afterAll(async () => {
  __resetCookies();
  clearRelease();
  for (const key of APP_RELEASE_VARS) if (original[key] !== undefined) env[key] = original[key];
  const userIds = [adminUserId, secondAdminUserId, teacherUserId, parentUserId];
  await db.rateLimit.deleteMany({ where: { bucket: { in: userIds.map((id) => `app-report:${id}`) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* GET /api/v1/app/version                                                     */
/* -------------------------------------------------------------------------- */

describe("GET /api/v1/app/version", () => {
  afterEach(() => {
    clearRelease();
    for (const key of APP_RELEASE_VARS) if (original[key] !== undefined) env[key] = original[key];
  });

  it("with nothing set, refuses nobody: 0.0.0 everywhere, no links, no message", async () => {
    clearRelease();
    __resetCookies(); // no session needed
    const res = await versionGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      minimum: { ios: "0.0.0", android: "0.0.0" },
      latest: { ios: "0.0.0", android: "0.0.0" },
      storeUrls: { ios: null, android: null },
      message: null,
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("an operator's values come through, and the latest defaults to the minimum", async () => {
    clearRelease();
    env.APP_MIN_VERSION_IOS = "1.4.0";
    env.APP_MIN_VERSION_ANDROID = "1.3";
    env.APP_LATEST_VERSION_IOS = "1.5.2";
    env.APP_STORE_URL_IOS = "https://apps.apple.com/app/id123";
    env.APP_UPDATE_MESSAGE = "  Please update before Monday.  ";
    const res = await versionGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      minimum: { ios: "1.4.0", android: "1.3" },
      latest: { ios: "1.5.2", android: "1.3" },
      storeUrls: { ios: "https://apps.apple.com/app/id123", android: null },
      message: "Please update before Monday.",
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("a malformed value is reported by checkEnv, never fatally, and served as unset", async () => {
    clearRelease();
    env.APP_MIN_VERSION_IOS = "latest";
    env.APP_STORE_URL_ANDROID = "play store";
    const problems = checkEnv().filter((p) => p.key.startsWith("APP_"));
    expect(problems.map((p) => p.key).sort()).toEqual(["APP_MIN_VERSION_IOS", "APP_STORE_URL_ANDROID"]);
    for (const p of problems) expect(p.fatal).toBe(false);
    expect(problems[0]!.message).toMatch(/"latest".*dotted version/);
    // The phone is not locked out by a typo.
    const body = await (await versionGet()).json();
    expect(body.minimum.ios).toBe("0.0.0");
    expect(body.storeUrls.android).toBeNull();
  });

  it("a latest older than the minimum is a contradiction: reported, and the minimum answers for both", async () => {
    clearRelease();
    env.APP_MIN_VERSION_ANDROID = "2.0.0";
    env.APP_LATEST_VERSION_ANDROID = "1.9.9";
    expect(checkEnv().find((p) => p.key === "APP_LATEST_VERSION_ANDROID")?.message).toMatch(/older than the minimum/);
    expect((await (await versionGet()).json()).latest.android).toBe("2.0.0");
  });

  it("with everything well-formed, checkEnv says nothing about the release", () => {
    clearRelease();
    env.APP_MIN_VERSION_IOS = "1.0.0";
    env.APP_LATEST_VERSION_IOS = "1.2.0";
    env.APP_STORE_URL_IOS = "https://apps.apple.com/app/id123";
    expect(checkEnv().some((p) => p.key.startsWith("APP_"))).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* POST /api/v1/app/report                                                     */
/* -------------------------------------------------------------------------- */

describe("POST /api/v1/app/report", () => {
  it("signed out is 401 in the envelope", async () => {
    __resetCookies();
    const res = await reportPost(json({ kind: "PROBLEM", message: "ZZ nobody", device }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("a body without a message is 422 with the field named, and burns no allowance", async () => {
    await as(teacherUserId, { schoolId, role: "TEACHER" });
    const res = await reportPost(json({ kind: "PROBLEM", device }));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "BAD_REQUEST", issues: { message: expect.any(String) } });
    expect(await db.rateLimit.findUnique({ where: { bucket: `app-report:${teacherUserId}` } })).toBeNull();
    const empty = await reportPost(json({}));
    expect(empty.status).toBe(422);
  });

  it("a PROBLEM report writes the audit row the safety centre lists, and tells every active admin", async () => {
    await as(teacherUserId, { schoolId, role: "TEACHER" });
    const message = "ZZ The attendance screen shows yesterday's register. " + "x".repeat(600);
    const res = await reportPost(json({ kind: "PROBLEM", message, screen: "attendance", device }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reference).toMatch(/^APP-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const row = await db.auditLog.findUniqueOrThrow({ where: { id: body.reportId } });
    expect(row.action).toBe("APP_PROBLEM_REPORTED");
    expect(row.schoolId).toBe(schoolId);
    expect(row.actorUserId).toBe(teacherUserId);
    expect(row.targetType).toBe("app");
    const meta = JSON.parse(row.meta) as Record<string, unknown>;
    expect(meta.reference).toBe(body.reference);
    expect(meta.screen).toBe("attendance");
    expect(meta.device).toEqual(device);
    expect(meta.stackPresent).toBe(false);
    // Trimmed to 500, not stored whole.
    expect((meta.message as string).length).toBe(500);
    expect(meta.message as string).toMatch(/^ZZ The attendance screen/);

    const told = await db.notification.findMany({ where: { userId: { in: [adminUserId, secondAdminUserId] }, kind: "SYSTEM", titleKey: "notifTitle.appProblem" } });
    expect(told.map((n) => n.userId).sort()).toEqual([adminUserId, secondAdminUserId].sort());
    const first = told[0]!;
    expect(first.schoolId).toBe(schoolId);
    expect(first.bodyKey).toBe("notifBody.appProblem");
    expect(JSON.parse(first.bodyVars)).toEqual({ name: "ZZ App teacher", reference: body.reference });
    expect(first.title).toBe("ZZ App teacher reported a problem with the app");
    expect(first.body).toContain(body.reference);
    expect(first.url).toBe("/admin/safety?tab=audit");
    // The teacher who reported it is not an admin and is not told; the former admin has left.
    expect(await db.notification.count({ where: { userId: { notIn: [adminUserId, secondAdminUserId] }, titleKey: "notifTitle.appProblem", bodyVars: { contains: body.reference } } })).toBe(0);
  });

  it("a CRASH report is audited and nobody is told", async () => {
    await as(teacherUserId, { schoolId, role: "TEACHER" });
    const before = await db.notification.count({ where: { userId: { in: [adminUserId, secondAdminUserId] } } });
    const res = await reportPost(json({ kind: "CRASH", message: "ZZ TypeError: cannot read properties of undefined", stack: "at Attendance (app/attendance.tsx:12)", device }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const row = await db.auditLog.findUniqueOrThrow({ where: { id: body.reportId } });
    expect(row.action).toBe("APP_CRASH_REPORTED");
    expect(row.schoolId).toBe(schoolId);
    const meta = JSON.parse(row.meta) as Record<string, unknown>;
    expect(meta.stackPresent).toBe(true);
    expect(meta.reference).toBe(body.reference);
    expect(meta).not.toHaveProperty("stack");
    expect(await db.notification.count({ where: { userId: { in: [adminUserId, secondAdminUserId] } } })).toBe(before);
  });

  it("a guardian, who has no active school, is recorded unattributed and nobody is told", async () => {
    await as(parentUserId, { role: "PARENT" });
    const before = await db.notification.count({ where: { userId: { in: [adminUserId, secondAdminUserId] } } });
    const res = await reportPost(json({ kind: "PROBLEM", message: "ZZ The report card will not open", device }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const row = await db.auditLog.findUniqueOrThrow({ where: { id: body.reportId } });
    expect(row.schoolId).toBeNull();
    expect(row.actorUserId).toBe(parentUserId);
    expect(row.action).toBe("APP_PROBLEM_REPORTED");
    expect(await db.notification.count({ where: { userId: { in: [adminUserId, secondAdminUserId] } } })).toBe(before);
  });

  it("the eleventh report in an hour is 429 with the RATE_LIMITED envelope", async () => {
    await as(teacherUserId, { schoolId, role: "TEACHER" });
    // A fresh hour for this person; crashes, so the loop tells nobody.
    await db.rateLimit.deleteMany({ where: { bucket: `app-report:${teacherUserId}` } });
    for (let i = 1; i <= 10; i++) {
      const res = await reportPost(json({ kind: "CRASH", message: `ZZ crash ${i}`, device }));
      expect(res.status, `report ${i}`).toBe(200);
    }
    const res = await reportPost(json({ kind: "CRASH", message: "ZZ crash 11", device }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(await res.json()).toMatchObject({ code: "RATE_LIMITED", retryAfterSeconds: expect.any(Number), error: expect.any(String) });
    // Refused means not recorded.
    expect(await db.auditLog.count({ where: { actorUserId: teacherUserId, action: "APP_CRASH_REPORTED" } })).toBe(11); // 1 earlier + 10 here
  });
});
