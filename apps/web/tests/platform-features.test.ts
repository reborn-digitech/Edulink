/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026; src/lib/platform-features.ts).
 *
 * What is proved: every door of a feature carries the catalog's `feature` (listed here by path prefix, so a door
 * added under a feature's prefix without it fails), and the operator's and the content team's tooling carries
 * none; the session's gate answers a feature's door 404 FEATURE_OFF for every role while it is off and lets it
 * through while it is on (a list is "any of"); the API envelope says FEATURE_OFF; /api/v1/me names the features
 * that are on; the web's nav drops a feature's entries for every role; a text while TEXT_MESSAGING is off is a
 * SKIPPED row with the reason "feature-off"; every feature starts off (the table's default, the migration's rows,
 * a missing row created off) and new schools start without the ASSISTANT module; the operator's switch is
 * idempotent and audited, and refused to anybody else.
 *
 * tests/setup.ts opens every feature for the other suites; this one sets its own list per test and reads the
 * table where it says so. ZZ rows of its own only, removed after.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_COLLEGE_MODULES, DEFAULT_SCHOOL_MODULES, PLATFORM_FEATURES, apiErrorSchema, type FeatureCode } from "@edulink/contracts";
import { ENDPOINTS, type Endpoint } from "@/lib/api-catalog";
import { featuresOf } from "@/lib/api-catalog/types";
import { gateRequest } from "@/lib/role-gate";
import { FeatureOffError, PAGE_NOT_FOUND_DIGEST } from "@/lib/access-error";
import { apiFailure } from "@/lib/api-v1";
import { NAV, hiddenByFeature } from "@/lib/nav";
import { featuresFor, featuresOn, listFeatures, mayUse, setFeature, setFeaturesForTests } from "@/lib/platform-features";
import { deliverToUser } from "@/lib/messaging";
import { actionKey } from "@/lib/safety-labels";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as meGet } from "@/app/api/v1/me/route";
import type { Role } from "@/lib/constants";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", operator: "", parent: "" };
const ALL = [...PLATFORM_FEATURES];
const WITHOUT = (code: FeatureCode) => ALL.filter((c) => c !== code);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Features ${STAMP}`, slug: `zz-features-${STAMP}`, code: `ZFT${String(STAMP).slice(-6)}`, contactEmail: `zz-features-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.operator = (await db.user.create({ data: { name: "ZZ Features Operator", email: `zz-features-operator-${STAMP}@test.invalid`, isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  ids.parent = (await db.user.create({ data: { name: "ZZ Features Parent", email: `zz-features-parent-${STAMP}@test.invalid`, phone: `+9198711${String(STAMP).slice(-6)}`, phoneVerifiedAt: new Date(), isTestFixture: true }, select: { id: true } })).id;
});

afterEach(() => setFeaturesForTests(ALL));

afterAll(async () => {
  setFeaturesForTests(ALL);
  __resetCookies();
  __setHeaders({});
  await db.outboundMessage.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { actorUserId: ids.operator } });
  await db.session.deleteMany({ where: { userId: { in: [ids.operator, ids.parent] } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: [ids.operator, ids.parent] } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

/** Every door of a feature, by path prefix (and the one method-specific door). */
const FEATURE_DOORS: { feature: FeatureCode; match: (e: Endpoint) => boolean }[] = [
  { feature: "ASSISTANT", match: (e) => /^\/api\/v1\/(assistant|admin\/assistant\/|family\/assistant)/.test(e.path) || e.path === "/api/v1/teacher/assignments/{assignmentId}/assistant" },
  { feature: "QUESTION_BANK", match: (e) => e.path.startsWith("/api/v1/practice/") || ["/api/v1/family/practice", "/api/v1/family/student/practice", "/api/v1/staff/practice", "/api/v1/staff/practice/archive", "/api/practice/answer"].includes(e.path) },
  { feature: "QUESTION_GIG", match: (e) => e.path.startsWith("/api/v1/gigs/questions") || e.path === "/api/v1/gigs/payee" },
  {
    feature: "EXPERT_SESSIONS",
    match: (e) =>
      /^\/api\/v1\/(community\/mentoring\/|shared\/mentoring|shared\/expert\/(bookings|availability)|staff\/experts|expert\/(payout|earnings|invoices|free-duty|calendar))/.test(e.path) ||
      ["/api/v1/gigs/sessions", "/api/v1/gigs/sessions/book", "/api/v1/gigs/slots", "/api/v1/gigs/school", "/api/v1/gigs/payments/{paymentId}/confirm"].includes(e.path) ||
      /^\/api\/v1\/gigs\/(sessions\/\{bookingId\}|slots\/\{slotId\}|series|meeting-account)/.test(e.path),
  },
  { feature: "TEACHER_SESSIONS", match: (e) => e.path === "/api/v1/gigs/school/guidance" || ["/api/v1/gigs/sessions", "/api/v1/gigs/sessions/book", "/api/v1/gigs/slots", "/api/v1/gigs/school"].includes(e.path) || /^\/api\/v1\/gigs\/(sessions\/\{bookingId\}\/(consent|cancel|unheld|rate|close)|slots\/\{slotId\}|series|meeting-account)/.test(e.path) },
  { feature: "JOB_BOARD", match: (e) => e.path.startsWith("/api/v1/admin/vacancies") || e.path === "/api/v1/shared/vacancies" || e.path === "/api/v1/community/vacancies/{postingId}" || (e.method === "POST" && e.path === "/api/v1/shared/enquiries") },
  // decision 0007 (6 Nov 2026): the marketplace's doors — the content team's competitions and the crawler. The shared and contest doors stay unmarked: a school's own competitions are never behind the switch, and their handlers hide the platform's.
  { feature: "COMPETITIONS", match: (e) => e.path.startsWith("/api/v1/appadmin/competition") },
];

describe("the catalog marks every door of a feature", () => {
  it("names the feature on every door under its prefixes", () => {
    const missing: string[] = [];
    for (const { feature, match } of FEATURE_DOORS) {
      const doors = ENDPOINTS.filter(match);
      expect(doors.length, `no doors found for ${feature}`).toBeGreaterThan(0);
      for (const e of doors) if (!featuresOf(e).includes(feature)) missing.push(`${feature} ${e.method} ${e.path}`);
    }
    expect(missing).toEqual([]);
  });

  it("marks nothing else: every door that names a feature is one of a feature's", () => {
    const stray = ENDPOINTS.filter((e) => e.feature && !FEATURE_DOORS.some((d) => d.match(e))).map((e) => `${e.method} ${e.path}`);
    expect(stray).toEqual([]);
  });

  it("leaves the operator's and the content team's tooling unmarked (the bank desk, the generator, the gig's review) — except the competition marketplace's, which is a feature of its own (decision 0007)", () => {
    const tooling = ENDPOINTS.filter((e) => e.access === "operator" || e.access === "app-admin");
    expect(tooling.length).toBeGreaterThan(20);
    expect(tooling.filter((e) => e.feature && !e.path.startsWith("/api/v1/appadmin/competition")).map((e) => e.path)).toEqual([]);
    expect(tooling.filter((e) => e.path.startsWith("/api/v1/appadmin/competition") && featuresOf(e).includes("COMPETITIONS")).length).toBeGreaterThan(10);
  });

  it("keeps the handler-decided doors explained, and their access as it was", () => {
    const inHandler = ENDPOINTS.filter((e) => e.featureInHandler).map((e) => `${e.method} ${e.path}`);
    expect(inHandler.sort()).toEqual(["POST /api/v1/gigs/payee", "POST /api/v1/shared/enquiries"]);
    for (const e of ENDPOINTS.filter((x) => x.feature)) expect(e.access, `${e.method} ${e.path}`).toBeTruthy();
  });

  it("lists the operator's two doors, operator only", () => {
    for (const path of ["/api/v1/operator/features", "/api/v1/operator/features/{code}"]) {
      const e = ENDPOINTS.find((x) => x.path === path);
      expect(e?.access).toBe("operator");
      expect(e?.feature).toBeUndefined();
    }
  });
});

describe("the gate", () => {
  const FAKE: Endpoint[] = [
    { method: "GET", path: "/api/v1/zz/feature/one", summary: "a door of one feature, for this suite", access: ["STUDENT", "PARENT"], response: {} as never, feature: "QUESTION_BANK" },
    { method: "GET", path: "/api/v1/zz/feature/either", summary: "a door two features share, for this suite", access: ["PARENT"], response: {} as never, feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] },
    { method: "POST", path: "/api/v1/zz/feature/handler", summary: "a door whose handler decides, for this suite", access: ["TEACHER"], response: {} as never, feature: "JOB_BOARD", featureInHandler: "for this suite" },
    { method: "POST", path: "/api/zz/feature/unversioned", summary: "a door outside /api/v1, for this suite", access: ["STUDENT"], response: {} as never, feature: "QUESTION_BANK" } as unknown as Endpoint,
  ];
  const ROLES: (Role | null)[] = ["STUDENT", "PARENT", "TEACHER", "ADMIN", "EXPERT", "DRIVER", null];

  it("answers a feature's door 404 FEATURE_OFF for every role while it is off, and lets it through while it is on", async () => {
    setFeaturesForTests(WITHOUT("QUESTION_BANK"));
    for (const role of ROLES) await expect(gateRequest("GET /api/v1/zz/feature/one", { role, schoolId: null, userId: null }, FAKE)).rejects.toBeInstanceOf(FeatureOffError);
    await expect(gateRequest("POST /api/zz/feature/unversioned", { role: "STUDENT", schoolId: null }, FAKE)).rejects.toBeInstanceOf(FeatureOffError);
    setFeaturesForTests(["QUESTION_BANK"]);
    await expect(gateRequest("GET /api/v1/zz/feature/one", { role: "STUDENT", schoolId: null }, FAKE)).resolves.toBe("pass");
    await expect(gateRequest("POST /api/zz/feature/unversioned", { role: "STUDENT", schoolId: null }, FAKE)).resolves.toBe("pass");
  });

  it("reads a list as any of", async () => {
    setFeaturesForTests([]);
    await expect(gateRequest("GET /api/v1/zz/feature/either", { role: "PARENT", schoolId: null }, FAKE)).rejects.toBeInstanceOf(FeatureOffError);
    setFeaturesForTests(["TEACHER_SESSIONS"]);
    await expect(gateRequest("GET /api/v1/zz/feature/either", { role: "PARENT", schoolId: null }, FAKE)).resolves.toBe("pass");
    setFeaturesForTests(["EXPERT_SESSIONS"]);
    await expect(gateRequest("GET /api/v1/zz/feature/either", { role: "PARENT", schoolId: null }, FAKE)).resolves.toBe("pass");
  });

  it("leaves a handler-decided door to its handler", async () => {
    setFeaturesForTests([]);
    await expect(gateRequest("POST /api/v1/zz/feature/handler", { role: "TEACHER", schoolId: null }, FAKE)).resolves.toBe("pass");
  });

  it("refuses the real doors from the real catalog: practice, the assistant, vacancies, mentoring, the gig", async () => {
    setFeaturesForTests([]);
    for (const route of ["GET /api/v1/practice/revision", "GET /api/v1/assistant", "GET /api/v1/shared/vacancies", "GET /api/v1/shared/mentoring", "GET /api/v1/gigs/questions", "GET /api/v1/gigs/sessions", "POST /api/practice/answer"]) {
      await expect(gateRequest(route, { role: "TEACHER", schoolId: null }), route).rejects.toBeInstanceOf(FeatureOffError);
    }
    // A door that names no feature is untouched, and the operator's own doors are not features.
    await expect(gateRequest("GET /api/v1/shared/enquiries", { role: "TEACHER", schoolId: null })).resolves.toBe("pass");
    setFeaturesForTests(ALL);
    await expect(gateRequest("GET /api/v1/practice/revision", { role: "STUDENT", schoolId: null })).resolves.toBe("pass");
  });

  it("is answered 404 with the envelope code FEATURE_OFF, and a page renders the app's 404", async () => {
    const response = await apiFailure(new FeatureOffError("JOB_BOARD"), "test");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-edulink-code")).toBe("FEATURE_OFF");
    const body = apiErrorSchema.parse(await response.json());
    expect(body.code).toBe("FEATURE_OFF");
    expect(body.error.length).toBeGreaterThan(0);
    expect(new FeatureOffError("ASSISTANT").digest).toBe(PAGE_NOT_FOUND_DIGEST);
  });
});

describe("what a person is told", () => {
  it("/api/v1/me names the features that are on", async () => {
    __resetCookies();
    __setHeaders({ "x-edulink-route": "GET /api/v1/me" });
    await createSession(ids.parent, {});
    setFeaturesForTests(["JOB_BOARD", "ASSISTANT"]);
    const body = await (await meGet()).json();
    expect(body.features).toEqual(["ASSISTANT", "JOB_BOARD"]);
    setFeaturesForTests([]);
    expect((await (await meGet()).json()).features).toEqual([]);
  });

  it("mayUse is the platform switch today, whoever asks", async () => {
    setFeaturesForTests(["EXPERT_SESSIONS"]);
    expect(await mayUse("EXPERT_SESSIONS", { userId: ids.parent, schoolId: ids.school })).toBe(true);
    expect(await mayUse("EXPERT_SESSIONS", null)).toBe(true);
    expect(await mayUse("JOB_BOARD", { userId: ids.parent, schoolId: null })).toBe(false);
    expect(await featuresFor(null)).toEqual(["EXPERT_SESSIONS"]);
  });

  it("drops a feature's nav entries for every role while it is off, and none while all are on", () => {
    const expected: Partial<Record<Role, string[]>> = {
      ADMIN: ["/experts", "/admin/vacancies", "/mentoring", "/admin/sessions"],
      PRINCIPAL: ["/admin/vacancies", "/admin/sessions"],
      TEACHER: ["/teacher/practice", "/teacher/contributions", "/experts", "/vacancies", "/mentoring", "/teacher/guidance"],
      STUDENT: ["/student/practice", "/mentoring", "/sessions"],
      PARENT: ["/parent/practice", "/mentoring", "/sessions"],
      EXPERT: ["/expert/availability", "/mentoring", "/expert/sessions", "/expert/earnings"],
      // Vidura has no menu entry since pass 1 (17 Oct 2026): its round button is drawn by the shell (signed-in-shell.tsx).
      DRIVER: [],
    };
    for (const [role, hrefs] of Object.entries(expected) as [Role, string[]][]) {
      expect(new Set(hiddenByFeature(NAV[role], [])), role).toEqual(new Set(hrefs));
      expect(hiddenByFeature(NAV[role], ALL), role).toEqual([]);
    }
    // The family's and the office's sessions stay while either kind is on; a teacher's guidance is teacher sessions alone.
    expect(hiddenByFeature(NAV.PARENT, ["TEACHER_SESSIONS"])).not.toContain("/sessions");
    expect(hiddenByFeature(NAV.ADMIN, ["EXPERT_SESSIONS"])).not.toContain("/admin/sessions");
    expect(hiddenByFeature(NAV.TEACHER, ["EXPERT_SESSIONS"])).toContain("/teacher/guidance");
    // The expert keeps a home and a profile to fill in.
    const expertLeft = NAV.EXPERT.map((i) => i.href).filter((h) => !hiddenByFeature(NAV.EXPERT, []).includes(h));
    expect(expertLeft).toEqual(["/expert", "/expert/profile", "/account"]);
  });

  it("records a text as SKIPPED feature-off while text messaging is off; in-app notices are not this path", async () => {
    setFeaturesForTests(WITHOUT("TEXT_MESSAGING"));
    const out = await deliverToUser({ schoolId: ids.school, userId: ids.parent, templateKey: "test", vars: {}, purpose: "test", force: true });
    expect(out).toMatchObject({ status: "SKIPPED", skipReason: "feature-off" });
    const row = await db.outboundMessage.findUniqueOrThrow({ where: { id: out.id }, select: { status: true, skipReason: true, schoolId: true } });
    expect(row).toEqual({ status: "SKIPPED", skipReason: "feature-off", schoolId: ids.school });
  });
});

describe("every feature starts off, and the operator switches it", () => {
  it("defaults off: the column's default, the migration's rows, and a new school without the assistant module", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/model PlatformFeature \{[^}]*enabled\s+Boolean\s+@default\(false\)/);
    // The seven of 15 October in the platform_features migration; a feature added since (COMPETITIONS, decision 0007) in the migration that names it.
    const dirs = readdirSync("prisma/migrations").filter((d) => d.endsWith("_platform_features") || d.startsWith("20261106130000_platform_feature_"));
    expect(dirs.length).toBeGreaterThanOrEqual(2);
    const sql = dirs.map((d) => readFileSync(join("prisma/migrations", d, "migration.sql"), "utf8")).join("\n");
    for (const code of PLATFORM_FEATURES) expect(sql).toContain(`('${code}', false)`);
    expect(sql).not.toMatch(/, true\)/);
    expect(DEFAULT_SCHOOL_MODULES).not.toContain("ASSISTANT");
    expect(DEFAULT_COLLEGE_MODULES).not.toContain("ASSISTANT");
  });

  it("reads the table when the suites' list is cleared, with a row for every feature", async () => {
    setFeaturesForTests(null);
    const on = await featuresOn();
    const rows = await db.platformFeature.findMany({ select: { code: true, enabled: true } });
    expect(new Set(rows.map((r) => r.code))).toEqual(new Set(PLATFORM_FEATURES));
    expect(on).toEqual(PLATFORM_FEATURES.filter((code) => rows.find((r) => r.code === code)?.enabled));
  });

  it("switches for the operator alone, idempotently, audited both ways, and puts the switch back", async () => {
    setFeaturesForTests(null);
    __resetCookies();
    __setHeaders({});
    await createSession(ids.operator, {});
    const operator = (await getSession()) as ActiveContext;
    expect(operator.user.isSuperuser).toBe(true);
    // The row as it stands — its state and who last switched it — is put back exactly at the end.
    const snapshot = await db.platformFeature.findUniqueOrThrow({ where: { code: "JOB_BOARD" } });
    const before = snapshot.enabled;
    try {
      // From the state it is in to the other and back: each change one audit row, a repeat none.
      const first = await setFeature(operator, "JOB_BOARD", !before);
      expect(first).toEqual({ code: "JOB_BOARD", enabled: !before, changed: true });
      expect(await setFeature(operator, "JOB_BOARD", !before)).toEqual({ code: "JOB_BOARD", enabled: !before, changed: false });
      expect((await featuresOn()).includes("JOB_BOARD")).toBe(!before);
      const listed = (await listFeatures(operator)).find((f) => f.code === "JOB_BOARD")!;
      expect(listed).toMatchObject({ enabled: !before, changedByName: "ZZ Features Operator" });
      expect(listed.changedAt).not.toBeNull();
      expect(typeof listed.count).toBe("number");
      await setFeature(operator, "JOB_BOARD", before);
      const audits = await db.auditLog.findMany({ where: { actorUserId: ids.operator }, orderBy: { createdAt: "asc" }, select: { action: true, schoolId: true, targetId: true } });
      expect(audits.map((a) => a.action)).toEqual(before ? ["operator.feature.off", "operator.feature.on"] : ["operator.feature.on", "operator.feature.off"]);
      expect(audits.every((a) => a.schoolId === null && a.targetId === "JOB_BOARD")).toBe(true);
      expect(actionKey("operator.feature.on")).toBe("audit.operatorFeatureOn");
      expect(actionKey("operator.feature.off")).toBe("audit.operatorFeatureOff");
    } finally {
      await db.platformFeature.update({ where: { code: "JOB_BOARD" }, data: { enabled: snapshot.enabled, changedAt: snapshot.changedAt, changedByUserId: snapshot.changedByUserId } });
    }
  });

  it("refuses the switch and the list to anybody but the operator", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.parent, {});
    const parent = (await getSession()) as ActiveContext;
    await expect(setFeature(parent, "ASSISTANT", true)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listFeatures(parent)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
