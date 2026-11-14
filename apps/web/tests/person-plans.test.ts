/**
 * PLANS SOLD PER PERSON (the owner's decisions of 15–16 October 2026; src/lib/person-plans.ts, decision 0006).
 *
 * What is proved: the seam's table, cell by cell (which role needs which plan for which feature, and that every other
 * role needs none); `mayUse` is the platform switch AND (no plan needed, the plan inactive, or an entitlement covering
 * now); an entitlement's window (starts at validFrom, ends at validTo, a revoked row covers nothing); the gate answers
 * 402 PLAN_REQUIRED naming the plan, and a `planFree` door asks the switch alone; the API envelope's shape; the
 * operator's grant (one row per feature, a second grant starting where the first ends, audited, the person told) and
 * revoke (audited, idempotent), refused to anybody else; the plan's prices and active switch, audited and put back
 * exactly; a guardian reads a child's practice only while the child holds the plan; the plan card and a locked layout
 * render; the plans:expire job tells once and not twice, and not a person who holds the plan again.
 *
 * Every feature is on (tests/setup.ts) and no plan is active unless a test says so (setActivePlansForTests). ZZ rows
 * of its own only, removed after; the plan rows it changes are put back exactly.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { PERSON_PLANS, PLAN_FEATURES, PLATFORM_FEATURES, apiErrorSchema, type FeatureCode, type PlanCode } from "@edulink/contracts";
import { ENDPOINTS } from "@/lib/api-catalog";
import { featuresOf } from "@/lib/api-catalog/types";
import { gateRequest } from "@/lib/role-gate";
import { PlanRequiredError } from "@/lib/access-error";
import { apiFailure } from "@/lib/api-v1";
import { accessTo, assertChildMayUse, childLock, featuresFor, lockedFor, mayUse, setFeaturesForTests } from "@/lib/platform-features";
import {
  PLAN_TABLE,
  addMonths,
  covers,
  expireEntitlements,
  grantPlan,
  listEntitlements,
  listPersonPlans,
  myPlans,
  planNeeded,
  revokeEntitlement,
  setActivePlansForTests,
  setPersonPlan,
} from "@/lib/person-plans";
import { actionKey } from "@/lib/safety-labels";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { translator } from "@/lib/i18n/dictionary";
import { ROLES, type Role } from "@/lib/constants";
import { FEATURE_META } from "@/lib/feature-meta";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");

const db = new PrismaClient();
const STAMP = Date.now();
const DOMAIN = "test.invalid";
const ids = { school: "", operator: "", student: "", teacher: "", expert: "", parent: "", studentMembership: "" };
const email = (who: string) => `zz-plans-${who}-${STAMP}@${DOMAIN}`;

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Plans ${STAMP}`, slug: `zz-plans-${STAMP}`, code: `ZPL${String(STAMP).slice(-6)}`, contactEmail: email("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const user = async (who: string, name: string, extra: Record<string, unknown> = {}) => (await db.user.create({ data: { name, email: email(who), isTestFixture: true, ...extra }, select: { id: true } })).id;
  ids.operator = await user("operator", "ZZ Plans Operator", { isSuperuser: true });
  ids.student = await user("student", "ZZ Plans Pupil");
  ids.teacher = await user("teacher", "ZZ Plans Teacher");
  ids.expert = await user("expert", "ZZ Plans Expert");
  ids.parent = await user("parent", "ZZ Plans Parent");
  ids.studentMembership = (await db.membership.create({ data: { userId: ids.student, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZPL${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.teacher, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" } });
});

afterEach(() => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
});

afterAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  __resetCookies();
  __setHeaders({});
  const people = [ids.operator, ids.student, ids.teacher, ids.expert, ids.parent];
  await db.entitlement.deleteMany({ where: { userId: { in: people } } });
  await db.notification.deleteMany({ where: { userId: { in: people } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: ids.operator }, { action: "plans.entitlement.end", targetId: { in: people } }] } });
  await db.session.deleteMany({ where: { userId: { in: people } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

async function asOperator(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.operator, {});
  const ctx = (await getSession()) as ActiveContext;
  expect(ctx.user.isSuperuser).toBe(true);
  return ctx;
}

/** A row straight into the table, for the window and job tests. */
async function row(userId: string, feature: FeatureCode, plan: PlanCode | null, from: Date, to: Date, extra: { revokedAt?: Date } = {}) {
  return db.entitlement.create({ data: { userId, feature, source: plan ? "GRANT" : "SEAT", planCode: plan, validFrom: from, validTo: to, ...extra }, select: { id: true } });
}

const DAY = 86_400_000;

/* -------------------------------------------------------------------------- */

describe("the seam's table", () => {
  // The owner's model, written out cell by cell (16 Oct 2026).
  const NEEDS: Partial<Record<Role, { plan: PlanCode; features: FeatureCode[] }>> = {
    // decision 0007 (6 Nov 2026): the competition marketplace is in the pupil's plan beside the bank and the assistant.
    STUDENT: { plan: "STUDENT", features: ["QUESTION_BANK", "ASSISTANT", "COMPETITIONS"] },
    // decision 0008 (7 Nov 2026): the TEACHER plan includes the question bank.
    TEACHER: { plan: "TEACHER", features: ["QUESTION_BANK", "QUESTION_GIG", "TEACHER_SESSIONS", "JOB_BOARD", "ASSISTANT"] },
    EXPERT: { plan: "EXPERT", features: ["EXPERT_SESSIONS"] },
  };

  it("names the plan for every (role, feature) cell, and none for every other role", () => {
    for (const role of ROLES) {
      for (const feature of PLATFORM_FEATURES) {
        const want = NEEDS[role]?.features.includes(feature) ? NEEDS[role]!.plan : null;
        expect(planNeeded(role, feature), `${role} × ${feature}`).toBe(want);
      }
    }
    expect(planNeeded(null, "QUESTION_BANK")).toBeNull();
    expect(planNeeded(undefined, "ASSISTANT")).toBeNull();
  });

  it("keeps the plans' feature lists and the table in step, and TEXT_MESSAGING in no plan", () => {
    for (const plan of PERSON_PLANS) expect([...PLAN_TABLE[plan]!.features].sort()).toEqual([...PLAN_FEATURES[plan]].sort());
    expect(PERSON_PLANS.some((p) => PLAN_FEATURES[p].includes("TEXT_MESSAGING"))).toBe(false);
  });
});

describe("an entitlement's window", () => {
  const from = new Date("2026-10-01T00:00:00Z");
  const to = new Date("2026-11-01T00:00:00Z");
  it("covers from validFrom up to, not including, validTo; a revoked row covers nothing", () => {
    expect(covers({ validFrom: from, validTo: to, revokedAt: null }, from)).toBe(true);
    expect(covers({ validFrom: from, validTo: to, revokedAt: null }, new Date(to.getTime() - 1))).toBe(true);
    expect(covers({ validFrom: from, validTo: to, revokedAt: null }, to)).toBe(false);
    expect(covers({ validFrom: from, validTo: to, revokedAt: null }, new Date(from.getTime() - 1))).toBe(false);
    expect(covers({ validFrom: from, validTo: to, revokedAt: new Date("2026-10-05T00:00:00Z") }, new Date("2026-10-10T00:00:00Z"))).toBe(false);
  });

  it("adds months held to the month's end", () => {
    expect(addMonths(new Date("2026-01-31T10:00:00Z"), 1).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addMonths(new Date("2026-10-16T00:00:00Z"), 12).toISOString()).toBe("2027-10-16T00:00:00.000Z");
  });

  it("opens the feature only while a live row covers now (a past, a future and a revoked row do not)", async () => {
    setActivePlansForTests(["STUDENT"]);
    const who = { userId: ids.parent, schoolId: ids.school, role: "STUDENT" as const };
    const now = Date.now();
    const past = await row(ids.parent, "ASSISTANT", "STUDENT", new Date(now - 30 * DAY), new Date(now - DAY));
    const future = await row(ids.parent, "ASSISTANT", "STUDENT", new Date(now + DAY), new Date(now + 30 * DAY));
    const revoked = await row(ids.parent, "ASSISTANT", "STUDENT", new Date(now - DAY), new Date(now + 30 * DAY), { revokedAt: new Date(now - 1000) });
    try {
      expect(await mayUse("ASSISTANT", who)).toBe(false);
      const live = await row(ids.parent, "ASSISTANT", "STUDENT", new Date(now - DAY), new Date(now + DAY));
      expect(await mayUse("ASSISTANT", who)).toBe(true);
      await db.entitlement.delete({ where: { id: live.id } });
    } finally {
      await db.entitlement.deleteMany({ where: { id: { in: [past.id, future.id, revoked.id] } } });
    }
  });
});

describe("mayUse: the switch, then the plan", () => {
  it("asks no plan while the plan is inactive, and the switch above everything", async () => {
    const pupil = { userId: ids.student, schoolId: ids.school, role: "STUDENT" as const };
    setActivePlansForTests([]);
    expect(await mayUse("QUESTION_BANK", pupil)).toBe(true);
    setActivePlansForTests(["STUDENT"]);
    expect(await mayUse("QUESTION_BANK", pupil)).toBe(false);
    expect(await accessTo(["QUESTION_BANK"], pupil)).toEqual({ state: "plan", feature: "QUESTION_BANK", plan: "STUDENT" });
    // A feature in no plan of the role is the switch alone.
    expect(await mayUse("EXPERT_SESSIONS", pupil)).toBe(true);
    // The office, a guardian and a call with no role need no plan.
    expect(await mayUse("QUESTION_BANK", { userId: ids.parent, schoolId: null, role: "PARENT" })).toBe(true);
    expect(await mayUse("ASSISTANT", { userId: ids.operator, schoolId: ids.school, role: "ADMIN" })).toBe(true);
    expect(await mayUse("QUESTION_BANK", null)).toBe(true);
    // Off for the platform is off for everyone, plan or not.
    setFeaturesForTests(PLATFORM_FEATURES.filter((c) => c !== "QUESTION_BANK"));
    expect(await accessTo(["QUESTION_BANK"], pupil)).toEqual({ state: "off", feature: "QUESTION_BANK" });
    expect(await mayUse("QUESTION_BANK", { userId: ids.parent, schoolId: null, role: "PARENT" })).toBe(false);
  });

  it("keeps a locked feature in what the person is shown, and names it as locked", async () => {
    setActivePlansForTests(["TEACHER"]);
    const teacher = { userId: ids.teacher, schoolId: ids.school, role: "TEACHER" as const };
    expect(await featuresFor(teacher)).toEqual([...PLATFORM_FEATURES]);
    expect(await lockedFor(teacher)).toEqual(PLATFORM_FEATURES.filter((f) => PLAN_FEATURES.TEACHER.includes(f)));
  });

  it("a list is any of: open while one feature is open, the plan of the first locked one otherwise", async () => {
    setActivePlansForTests(["TEACHER", "EXPERT"]);
    const teacher = { userId: ids.teacher, schoolId: ids.school, role: "TEACHER" as const };
    // A teacher on a door expert and teacher sessions share: the expert half needs no plan of a teacher.
    expect((await accessTo(["EXPERT_SESSIONS", "TEACHER_SESSIONS"], teacher)).state).toBe("open");
    setFeaturesForTests(PLATFORM_FEATURES.filter((c) => c !== "EXPERT_SESSIONS"));
    expect(await accessTo(["EXPERT_SESSIONS", "TEACHER_SESSIONS"], teacher)).toEqual({ state: "plan", feature: "TEACHER_SESSIONS", plan: "TEACHER" });
  });
});

describe("the gate and the envelope", () => {
  const practiceDoor = ENDPOINTS.find((e) => e.method === "GET" && featuresOf(e).includes("QUESTION_BANK") && e.access !== "anyone" && Array.isArray(e.access) && e.access.includes("STUDENT"))!;

  it("answers a pupil without the plan 402 PLAN_REQUIRED naming STUDENT, and lets the plan's holder through", async () => {
    expect(practiceDoor).toBeTruthy();
    setActivePlansForTests(["STUDENT"]);
    const route = `GET ${practiceDoor.path.replace(/\{[^}]+\}/g, "zz")}`;
    await expect(gateRequest(route, { role: "STUDENT", schoolId: ids.school, userId: ids.student })).rejects.toBeInstanceOf(PlanRequiredError);
    await expect(gateRequest(route, { role: "STUDENT", schoolId: ids.school, userId: ids.student })).rejects.toMatchObject({ plan: "STUDENT", feature: "QUESTION_BANK" });
    const live = await row(ids.student, "QUESTION_BANK", "STUDENT", new Date(Date.now() - DAY), new Date(Date.now() + DAY));
    try {
      // A new request, so the per-request cache of what the person holds is read afresh.
      expect(await gateRequest(route, { role: "STUDENT", schoolId: ids.school, userId: ids.student })).toBe("pass");
    } finally {
      await db.entitlement.delete({ where: { id: live.id } });
    }
  });

  it("asks a planFree door the switch alone, and an office door no plan", async () => {
    setActivePlansForTests(["EXPERT", "TEACHER"]);
    const free = ENDPOINTS.filter((e) => e.planFree);
    expect(free.map((e) => `${e.method} ${e.path}`).sort()).toEqual(
      [
        // TA-189 (decision of 14 Nov 2026): a commission invoice stays readable to the person it is addressed to.
        "GET /api/v1/account/gig-invoices/{invoiceId}/pdf",
        "GET /api/v1/expert/calendar.ics",
        "GET /api/v1/expert/calendar/token",
        "GET /api/v1/expert/earnings",
        "GET /api/v1/expert/invoices",
        "GET /api/v1/expert/invoices/{invoiceId}/pdf",
        "GET /api/v1/expert/payout",
        // seats (17 Oct 2026): the meeting link of a session already booked stays the provider's after their plan ends.
        "GET /api/v1/gigs/sessions/{bookingId}/join",
        "GET /api/v1/practice/once",
        "GET /api/v1/shared/expert/bookings",
        "POST /api/v1/expert/calendar/token",
        "POST /api/v1/expert/payout",
        "POST /api/v1/expert/payout/link",
        "POST /api/v1/practice/once",
        "POST /api/v1/practice/once/answer",
      ].sort(),
    );
    expect(await gateRequest("GET /api/v1/expert/earnings", { role: "EXPERT", schoolId: null, userId: ids.expert })).toBe("pass");
    await expect(gateRequest("POST /api/v1/shared/expert/availability", { role: "EXPERT", schoolId: null, userId: ids.expert })).rejects.toMatchObject({ plan: "EXPERT" });
    // The office's vacancies need no plan; a teacher reading the board does.
    expect(await gateRequest("GET /api/v1/admin/vacancies", { role: "ADMIN", schoolId: ids.school, userId: ids.operator })).toBe("pass");
    await expect(gateRequest("GET /api/v1/shared/vacancies", { role: "TEACHER", schoolId: ids.school, userId: ids.teacher })).rejects.toMatchObject({ plan: "TEACHER", feature: "JOB_BOARD" });
  });

  it("says 402 with code PLAN_REQUIRED, the plan, a sentence naming it, and the header", async () => {
    const res = await apiFailure(new PlanRequiredError("TEACHER", "ASSISTANT"), "test");
    expect(res.status).toBe(402);
    expect(res.headers.get("x-edulink-code")).toBe("PLAN_REQUIRED");
    const body = apiErrorSchema.parse(await res.json());
    expect(body).toMatchObject({ code: "PLAN_REQUIRED", plan: "TEACHER", error: t("plans.refuseTeacher") });
    // The feature too, so the phone's plan card names what is locked as the web's does (QA-18).
    expect(body.feature).toBe("ASSISTANT");
  });
});

describe("the operator's grant and revoke", () => {
  it("grants one row per feature of the plan, a second grant from where the first ends, audited, the person told", async () => {
    const operator = await asOperator();
    const now = new Date("2026-10-16T06:00:00Z");
    const first = await grantPlan(operator, { email: email("teacher").toUpperCase(), plan: "TEACHER", months: 1, note: "ZZ trial" }, now);
    expect(first).toMatchObject({ userId: ids.teacher, plan: "TEACHER", created: PLAN_FEATURES.TEACHER.length });
    expect(first.validFrom.toISOString()).toBe(now.toISOString());
    expect(first.validTo.toISOString()).toBe("2026-11-16T06:00:00.000Z");
    const second = await grantPlan(operator, { email: email("teacher"), plan: "TEACHER", months: 3 }, now);
    expect(second.validFrom.toISOString()).toBe(first.validTo.toISOString());
    expect(second.validTo.toISOString()).toBe("2027-02-16T06:00:00.000Z");

    const listed = await listEntitlements(operator, email("teacher"), now);
    expect(listed.person?.id).toBe(ids.teacher);
    expect(listed.entitlements).toHaveLength(PLAN_FEATURES.TEACHER.length * 2);
    expect(listed.entitlements.filter((e) => e.live)).toHaveLength(PLAN_FEATURES.TEACHER.length);
    expect(listed.entitlements.every((e) => e.source === "GRANT" && e.planCode === "TEACHER" && e.grantedByName === "ZZ Plans Operator")).toBe(true);
    expect((await listEntitlements(operator, "zz-plans-nobody@test.invalid")).person).toBeNull();

    const audits = await db.auditLog.findMany({ where: { actorUserId: ids.operator, action: "operator.entitlement.grant" }, select: { schoolId: true, targetId: true } });
    expect(audits).toHaveLength(2);
    expect(audits.every((a) => a.schoolId === null && a.targetId === ids.teacher)).toBe(true);
    const notices = await db.notification.findMany({ where: { userId: ids.teacher, titleKey: "plans.notifGrantedTeacher" } });
    expect(notices.length).toBe(2);
    expect(actionKey("operator.entitlement.grant")).toBe("audit.operatorEntitlementGrant");
  });

  it("refuses an address with no account and anybody but the operator", async () => {
    const operator = await asOperator();
    await expect(grantPlan(operator, { email: "zz-plans-nobody@test.invalid", plan: "STUDENT", months: 1 })).rejects.toMatchObject({ key: "plans.grantNoAccount" });
    __resetCookies();
    await createSession(ids.parent, {});
    const parent = (await getSession()) as ActiveContext;
    await expect(grantPlan(parent, { email: email("student"), plan: "STUDENT", months: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listPersonPlans(parent)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(revokeEntitlement(parent, "zz-none")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("revokes one row now, audited once, and a second revoke changes nothing", async () => {
    const operator = await asOperator();
    const g = await grantPlan(operator, { email: email("expert"), plan: "EXPERT", months: 12 });
    expect(g.created).toBe(1);
    const [only] = (await listEntitlements(operator, email("expert"))).entitlements;
    setActivePlansForTests(["EXPERT"]);
    expect(await mayUse("EXPERT_SESSIONS", { userId: ids.expert, schoolId: null, role: "EXPERT" })).toBe(true);
    const r = await revokeEntitlement(operator, only!.id);
    expect(r.changed).toBe(true);
    expect((await revokeEntitlement(operator, only!.id)).changed).toBe(false);
    const audits = await db.auditLog.count({ where: { actorUserId: ids.operator, action: "operator.entitlement.revoke", targetId: only!.id } });
    expect(audits).toBe(1);
    expect((await listEntitlements(operator, email("expert"))).entitlements[0]).toMatchObject({ live: false });
    expect(actionKey("operator.entitlement.revoke")).toBe("audit.operatorEntitlementRevoke");
  });
});

describe("the plans' prices and active switch", () => {
  it("changes a plan, audited, a repeat changes nothing, counts its holders, and is put back exactly", async () => {
    const operator = await asOperator();
    await listPersonPlans(operator); // the rows exist
    const snapshot = await db.personPlan.findUniqueOrThrow({ where: { code: "EXPERT" } });
    try {
      const target = { code: "EXPERT" as const, pricePaise: snapshot.pricePaise + 100, yearlyPricePaise: snapshot.yearlyPricePaise + 1000, active: !snapshot.active };
      const set = await setPersonPlan(operator, target);
      expect(set.changed).toBe(true);
      expect(set.plan).toMatchObject({ code: "EXPERT", pricePaise: target.pricePaise, yearlyPricePaise: target.yearlyPricePaise, active: target.active, updatedByName: "ZZ Plans Operator" });
      expect((await setPersonPlan(operator, target)).changed).toBe(false);
      await expect(setPersonPlan(operator, { code: "EXPERT", pricePaise: -1 })).rejects.toMatchObject({ key: "plans.priceInvalid" });
      const audits = await db.auditLog.findMany({ where: { actorUserId: ids.operator, action: "operator.plan.update" }, select: { targetId: true, schoolId: true } });
      expect(audits).toEqual([{ targetId: "EXPERT", schoolId: null }]);
      expect(actionKey("operator.plan.update")).toBe("audit.operatorPlanUpdate");

      // Holders now and ending within a week, by person: a row ending in three days counts in both.
      const before = (await listPersonPlans(operator)).find((p) => p.code === "STUDENT")!;
      const soon = await row(ids.student, "QUESTION_BANK", "STUDENT", new Date(Date.now() - DAY), new Date(Date.now() + 3 * DAY));
      const after = (await listPersonPlans(operator)).find((p) => p.code === "STUDENT")!;
      expect(after.entitledNow - before.entitledNow).toBe(1);
      expect(after.expiringSoon - before.expiringSoon).toBe(1);
      expect(await myPlans(ids.student)).toEqual([{ plan: "STUDENT", validTo: expect.any(Date) }]);
      await db.entitlement.delete({ where: { id: soon.id } });
    } finally {
      await db.personPlan.update({ where: { code: "EXPERT" }, data: { pricePaise: snapshot.pricePaise, yearlyPricePaise: snapshot.yearlyPricePaise, active: snapshot.active, updatedByUserId: snapshot.updatedByUserId, updatedAt: snapshot.updatedAt } });
    }
  });
});

describe("a guardian reads a child's practice only while the child holds the plan", () => {
  it("locks on the child's plan, not the guardian's", async () => {
    setActivePlansForTests(["STUDENT"]);
    expect(await childLock("QUESTION_BANK", ids.studentMembership)).toBe("STUDENT");
    await expect(assertChildMayUse("QUESTION_BANK", ids.studentMembership)).rejects.toMatchObject({ plan: "STUDENT" });
    const live = await row(ids.student, "QUESTION_BANK", "STUDENT", new Date(Date.now() - DAY), new Date(Date.now() + DAY));
    try {
      expect(await childLock("QUESTION_BANK", ids.studentMembership)).toBeNull();
    } finally {
      await db.entitlement.delete({ where: { id: live.id } });
    }
    setActivePlansForTests([]);
    expect(await childLock("QUESTION_BANK", ids.studentMembership)).toBeNull();
  });
});

describe("the operator's doors", () => {
  it("lists the plans, grants and lists by email, and revokes, as the operator; 403 to anybody else", async () => {
    const { GET: plansGet, PUT: plansPut } = await import("@/app/api/v1/operator/person-plans/route");
    const { GET: entGet, POST: entPost } = await import("@/app/api/v1/operator/entitlements/route");
    const { POST: revokePost } = await import("@/app/api/v1/operator/entitlements/[id]/revoke/route");
    const json = (body: unknown, method = "POST") => new Request("http://localhost/x", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    await asOperator();
    const plans = await (await plansGet()).json();
    expect(plans.plans.map((p: { code: string }) => p.code)).toEqual([...PERSON_PLANS]);
    expect((await plansPut(json({ code: "STUDENT", pricePaise: "nine" }, "PUT"))).status).toBe(422);
    const granted = await entPost(json({ email: email("student"), plan: "STUDENT", months: 6, note: "ZZ door" }));
    expect(granted.status).toBe(200);
    expect(await granted.json()).toMatchObject({ userId: ids.student, plan: "STUDENT", created: PLAN_FEATURES.STUDENT.length });
    expect((await entPost(json({ email: email("student"), plan: "STUDENT", months: 2 }))).status).toBe(422);
    const listed = await (await entGet(new Request(`http://localhost/api/v1/operator/entitlements?email=${encodeURIComponent(email("student"))}`))).json();
    const doorRow = listed.entitlements.find((e: { note: string | null }) => e.note === "ZZ door");
    const revoked = await revokePost(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id: doorRow.id }) });
    expect(await revoked.json()).toMatchObject({ id: doorRow.id, changed: true });
    expect((await revokePost(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id: "zz-sweep-no-such-entitlement" }) })).status).toBe(404);
    __resetCookies();
    await createSession(ids.teacher, {});
    expect((await plansGet()).status).toBe(403);
    expect((await entPost(json({ email: email("teacher"), plan: "TEACHER", months: 1 }))).status).toBe(403);
    // The pupil's grant is this test's own; the next tests start from a pupil who holds nothing.
    await db.entitlement.deleteMany({ where: { userId: ids.student } });
  });
});

describe("what a locked person sees", () => {
  it("the plan card names the plan, what it includes, its prices and Subscribe", async () => {
    const { PlanCard } = await import("@/components/plan-card");
    const html = renderToStaticMarkup(await PlanCard({ plan: "STUDENT", feature: "QUESTION_BANK" }));
    expect(html).toContain('data-testid="plan-card"');
    expect(html).toContain(t("plans.nameStudent"));
    for (const f of PLAN_FEATURES.STUDENT) expect(html).toContain(t(FEATURE_META[f].nameKey));
    expect(html).toContain('href="/account/plan?plan=STUDENT"');
    expect(html).toMatch(/data-testid="plan-card-prices"/);
    const child = renderToStaticMarkup(await PlanCard({ plan: "STUDENT", feature: "QUESTION_BANK", child: "ZZ Asha" }));
    expect(child).toContain("ZZ Asha");
  });

  it("a feature's layout draws the card in place of the page for a pupil without the plan, and the page for one with it", async () => {
    setActivePlansForTests(["STUDENT"]);
    vi.resetModules();
    vi.doMock("@/lib/session", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/lib/session")>()),
      getSession: async () => ({ user: { id: ids.student, isSuperuser: false }, schoolId: ids.school, role: "STUDENT", membershipId: ids.studentMembership, sessionId: "zz" }),
    }));
    try {
      const { default: Layout } = await import("@/app/(app)/student/practice/layout");
      const { PlanCard } = await import("@/components/plan-card");
      const page = React.createElement("p", null, "ZZ the page");
      // The layout hands back the (async) plan card in place of its children — since decision 0008 (7 Nov 2026) wrapped
      // with the sets a teacher assigned, which open once without the plan; the card is the first child. Drawn here as Next would.
      const wrapped = (await Layout({ children: page })) as React.ReactElement<{ children: React.ReactElement<{ plan: PlanCode; feature: FeatureCode }>[] }>;
      expect(wrapped.type).toBe("div");
      const locked = wrapped.props.children[0]!;
      expect(locked.type).toBe(PlanCard);
      expect(locked.props).toMatchObject({ plan: "STUDENT", feature: "QUESTION_BANK" });
      const html = renderToStaticMarkup(await PlanCard(locked.props));
      expect(html).toContain('data-testid="plan-card"');
      expect(html).not.toContain("ZZ the page");
      const live = await row(ids.student, "QUESTION_BANK", "STUDENT", new Date(Date.now() - DAY), new Date(Date.now() + DAY));
      try {
        expect(await Layout({ children: page })).toBe(page);
      } finally {
        await db.entitlement.delete({ where: { id: live.id } });
      }
    } finally {
      vi.doUnmock("@/lib/session");
      vi.resetModules();
    }
  });
});

describe("the plans:expire job", () => {
  it("tells a person once that yesterday's window ended, and not one who holds the plan again", async () => {
    // The job runs as the owner; here the operator's binding stands in, so its school-less audit line may be written.
    await asOperator();
    const now = new Date("2026-10-16T22:50:00Z"); // 04:20 on 17 October in India
    const yesterday = new Date("2026-10-16T12:00:00Z"); // 17:30 on 16 October in India
    const ended = await Promise.all(PLAN_FEATURES.STUDENT.map((f) => row(ids.parent, f, "STUDENT", new Date("2026-09-16T12:00:00Z"), yesterday)));
    // The teacher's ended too, but a later window carries on.
    const teacherEnded = await row(ids.teacher, "QUESTION_GIG", "TEACHER", new Date("2026-09-16T12:00:00Z"), yesterday);
    const teacherNext = await row(ids.teacher, "QUESTION_GIG", "TEACHER", yesterday, new Date("2026-11-16T12:00:00Z"));
    // Ended today (India) is tomorrow's run's.
    const today = await row(ids.expert, "EXPERT_SESSIONS", "EXPERT", new Date("2026-09-16T12:00:00Z"), new Date("2026-10-16T19:00:00Z"));
    try {
      const scope = { userIds: [ids.parent, ids.teacher, ids.expert] };
      const first = await expireEntitlements(now, scope);
      expect(first).toEqual({ ended: ended.length + 1, told: 1, renewed: 1 });
      expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "plans.notifEndedStudent" } })).toBe(1);
      expect(await db.notification.count({ where: { userId: ids.teacher, titleKey: "plans.notifEndedTeacher" } })).toBe(0);
      expect(await db.auditLog.count({ where: { action: "plans.entitlement.end", targetId: ids.parent } })).toBe(1);
      expect(await expireEntitlements(now, scope)).toEqual({ ended: 0, told: 0, renewed: 0 });
      expect(actionKey("plans.entitlement.end")).toBe("audit.plansEntitlementEnd");
    } finally {
      await db.entitlement.deleteMany({ where: { id: { in: [...ended.map((e) => e.id), teacherEnded.id, teacherNext.id, today.id] } } });
    }
  });
});
