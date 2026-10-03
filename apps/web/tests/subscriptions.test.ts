/**
 * The operator's dashboard (2026-10-02): the subscription record, the
 * point of contact, the commission partners, the guided onboarding and
 * the daily reminder. The arithmetic is proved on its own; the lib is
 * proved on ZZ schools made here (a status moves only as the list allows,
 * a due date before the start is refused, every change is an audit row
 * with its reason, what a partner is owed is percent × plan price over
 * ACTIVE schools only, and an ACTIVE school on no plan is counted apart);
 * the dashboard narrows by the chips and lists the due-soon schools; the
 * reminder tells the ZZ operator once and is muted for a week; onboarding
 * makes the school, its plan, contact, partner and invitation in one call
 * and one transaction — it refuses a taken slug before writing anything,
 * and a step that throws mid-way leaves no School or CommissionPartner row
 * behind — with the invitation's mail sent after the commit; and every
 * school role is 403 on every new handler. Every row is a ZZ row of this
 * file, deleted after, scoped by school.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { okSchema, operatorDashboardSchema, operatorOnboardedSchema, operatorPartnerCreatedSchema, operatorPartnersSchema, operatorSchoolDetailSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import {
  canMoveSubscription,
  commissionOwedPaise,
  createPartner,
  daysToDue,
  dayToDate,
  dueTone,
  listPartners,
  onboardSchool,
  operatorDashboard,
  remindSubscriptions,
  setContact,
  setSubscription,
  updatePartner,
} from "@/lib/subscriptions";
import { createPlan } from "@/lib/plans";
import { inviteAdmin } from "@/lib/superuser";
import { GET as dashboardGet } from "@/app/api/v1/operator/dashboard/route";
import { POST as subscriptionPost } from "@/app/api/v1/operator/schools/[schoolId]/subscription/route";
import { POST as contactPost } from "@/app/api/v1/operator/schools/[schoolId]/contact/route";
import { GET as partnersGet, POST as partnersPost } from "@/app/api/v1/operator/partners/route";
import { PATCH as partnerPatch } from "@/app/api/v1/operator/partners/[partnerId]/route";
import { POST as onboardPost } from "@/app/api/v1/operator/onboard/route";
import { GET as schoolGet } from "@/app/api/v1/operator/schools/[schoolId]/route";

/**
 * The real superuser module with inviteAdmin wrapped, so one test can make
 * the invitation step throw mid-transaction; every other call passes through.
 */
vi.mock("@/lib/superuser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/superuser")>();
  return { ...actual, inviteAdmin: vi.fn(actual.inviteAdmin) };
});

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
// The audit rows the reminder leaves are stamped with the real clock, so the test's clock is the real one too (rounded to the hour), else a 7-day mute window counted from a fixed date fails once the date has passed.
const NOW = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
const day = (offset: number) => new Date(NOW.getTime() + offset * DAY).toISOString().slice(0, 10);

let schoolId = "";
let soonSchoolId = "";
let pastSchoolId = "";
let endedSchoolId = "";
let unpricedSchoolId = "";
let onboardedSchoolId = "";
let onboardedPartnerId = "";
let operatorUserId = "";
let planId = "";
let partnerId = "";
const roleUsers: Record<string, string> = {};
const ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT"] as const;

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: `zz-subs-op-${STAMP}@test.invalid` } }) as unknown as Parameters<typeof listPartners>[0];
const P = "http://localhost/api/v1/operator";
const get = (path: string) => new Request(`${P}${path}`);
const send = (method: "POST" | "PATCH", path: string, body: unknown) => new Request(`${P}${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function signIn(who: "OPERATOR" | (typeof ROLES)[number] | "OUT") {
  __resetCookies();
  if (who === "OUT") return;
  if (who === "OPERATOR") await createSession(operatorUserId);
  else await createSession(roleUsers[who]!, { schoolId, role: who });
}

async function makeSchool(suffix: string, data: Record<string, unknown> = {}) {
  const row = await db.school.create({
    data: { name: `ZZ Subs ${suffix} ${STAMP}`, slug: `zz-subs-${suffix.toLowerCase()}-${STAMP}`, code: `ZS${suffix.slice(0, 2).toUpperCase()}${String(STAMP).slice(-4)}`, contactEmail: `zz-subs-${suffix.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", ...data },
    select: { id: true },
  });
  return row.id;
}

beforeAll(async () => {
  const op = await db.user.create({ data: { name: "ZZ Subs Operator", email: `zz-subs-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } });
  operatorUserId = op.id;
  const made = await createPlan(operator(), { code: `zz-subs-${STAMP}`, name: "ZZ Subs Plan", priceMonthlyPaise: 100_000 });
  if (!made.ok) throw new Error(made.errorKey);
  planId = made.planId;
  schoolId = await makeSchool("Main", { planId, subscriptionStatus: "TRIAL", subscriptionStartsAt: dayToDate(day(-10)), subscriptionDueAt: dayToDate(day(20)) });
  soonSchoolId = await makeSchool("Soon", { planId, subscriptionStatus: "ACTIVE", subscriptionStartsAt: dayToDate(day(-360)), subscriptionDueAt: dayToDate(day(3)) });
  pastSchoolId = await makeSchool("Past", { planId, subscriptionStatus: "ACTIVE", subscriptionStartsAt: dayToDate(day(-400)), subscriptionDueAt: dayToDate(day(-5)) });
  endedSchoolId = await makeSchool("Ended", { subscriptionStatus: "ENDED", subscriptionDueAt: dayToDate(day(-2)) });
  unpricedSchoolId = await makeSchool("Unpriced", { subscriptionStatus: "ACTIVE", subscriptionStartsAt: dayToDate(day(-30)), subscriptionDueAt: dayToDate(day(300)) });
  for (const role of ROLES) {
    const user = await db.user.create({ data: { name: `ZZ Subs ${role}`, email: `zz-subs-${role.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    roleUsers[role] = user.id;
    await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  __resetCookies();
  const users = [operatorUserId, ...Object.values(roleUsers)];
  const schools = [schoolId, soonSchoolId, pastSchoolId, endedSchoolId, unpricedSchoolId, onboardedSchoolId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: users } }, { targetId: { in: schools } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.school.deleteMany({ where: { name: { startsWith: `ZZ Subs Onboarded ${STAMP}` } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.commissionPartner.deleteMany({ where: { name: { startsWith: `ZZ Subs Partner ${STAMP}` } } });
  await db.plan.deleteMany({ where: { code: `zz-subs-${STAMP}` } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("the arithmetic", () => {
  it("a status moves only as the list allows; nothing recorded may become anything", () => {
    expect(canMoveSubscription(null, "ENDED")).toBe(true);
    expect(canMoveSubscription("TRIAL", "ACTIVE")).toBe(true);
    expect(canMoveSubscription("TRIAL", "DUE")).toBe(false);
    expect(canMoveSubscription("ACTIVE", "DUE")).toBe(true);
    expect(canMoveSubscription("ACTIVE", "TRIAL")).toBe(false);
    expect(canMoveSubscription("DUE", "ACTIVE")).toBe(true);
    expect(canMoveSubscription("SUSPENDED", "ACTIVE")).toBe(true);
    expect(canMoveSubscription("ENDED", "DUE")).toBe(false);
    expect(canMoveSubscription("ENDED", "ACTIVE")).toBe(true);
    expect(canMoveSubscription("ACTIVE", "ACTIVE")).toBe(true);
  });

  it("days to due are whole days by calendar; the tone is red past, amber within thirty, none for a stopped clock", () => {
    const at = new Date("2026-10-02T06:00:00.000Z"); // a pure function: a fixed clock is right here
    expect(daysToDue(dayToDate("2026-10-05"), at)).toBe(3);
    expect(daysToDue(dayToDate("2026-10-02"), at)).toBe(0);
    expect(daysToDue(dayToDate("2026-09-30"), at)).toBe(-2);
    expect(daysToDue(null, at)).toBeNull();
    expect(dueTone(-1, "ACTIVE")).toBe("past");
    expect(dueTone(0, "ACTIVE")).toBe("soon");
    expect(dueTone(30, "TRIAL")).toBe("soon");
    expect(dueTone(31, "ACTIVE")).toBe("later");
    expect(dueTone(-1, "ENDED")).toBe("none");
    expect(dueTone(5, "SUSPENDED")).toBe("none");
    expect(dueTone(null, "ACTIVE")).toBe("none");
  });

  it("commission is tenths of a percent of the recorded price, to the paisa; no price, no share", () => {
    expect(commissionOwedPaise(125, 100_000)).toBe(12_500);
    expect(commissionOwedPaise(333, 100_000)).toBe(33_300);
    expect(commissionOwedPaise(1, 100_001)).toBe(100);
    expect(commissionOwedPaise(125, null)).toBe(0);
    expect(commissionOwedPaise(0, 100_000)).toBe(0);
  });
});

describe("the record", () => {
  it("a partner is added with a share, a bad share is refused, and a correction keeps only what changed", async () => {
    expect(await createPartner(operator(), { name: `ZZ Subs Partner ${STAMP}`, percentTenths: 1001 })).toEqual({ ok: false, errorKey: "root.partnerPercentInvalid" });
    expect(await createPartner(operator(), { name: " ", percentTenths: 100 })).toEqual({ ok: false, errorKey: "root.partnerNameRequired" });
    const made = await createPartner(operator(), { name: `ZZ Subs Partner ${STAMP}`, percentTenths: 125, phone: "+910000000009", email: "ZZ-Partner@test.invalid" });
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    partnerId = made.partnerId;
    expect(await updatePartner(operator(), partnerId, { notes: "brought three schools" })).toEqual({ ok: true });
    expect(await updatePartner(operator(), "nope", { notes: "x" })).toEqual({ ok: false, errorKey: "root.noSuchPartner" });
    const row = await db.commissionPartner.findUniqueOrThrow({ where: { id: partnerId } });
    expect(row).toMatchObject({ percentTenths: 125, email: "zz-partner@test.invalid", notes: "brought three schools" });
    expect(await db.auditLog.count({ where: { action: "superuser.partner.create", targetId: partnerId } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.partner.update", targetId: partnerId } })).toBe(1);
  });

  it("the subscription moves as the list allows, refuses a due date before the start and a blank reason, and every change is two audit rows", async () => {
    expect(await setSubscription(operator(), schoolId, { status: "DUE", reason: "x" })).toEqual({ ok: false, errorKey: "root.subscriptionMoveRefused" });
    expect(await setSubscription(operator(), schoolId, { dueAt: day(-20), reason: "x" })).toEqual({ ok: false, errorKey: "root.subscriptionDatesOrder" });
    expect(await setSubscription(operator(), schoolId, { status: "ACTIVE", reason: "  " })).toEqual({ ok: false, errorKey: "root.subscriptionReasonRequired" });
    expect(await setSubscription(operator(), schoolId, { status: "ACTIVE", commissionPartnerId: "nope", reason: "x" })).toEqual({ ok: false, errorKey: "root.noSuchPartner" });
    expect(await setSubscription(operator(), "nope", { status: "ACTIVE", reason: "x" })).toEqual({ ok: false, errorKey: "root.noSuchSchool" });

    const moved = await setSubscription(operator(), schoolId, { status: "ACTIVE", dueAt: day(355), invoicedAt: day(0), invoiceRef: "INV-1", commissionPartnerId: partnerId, reason: "paid for the year" });
    expect(moved).toEqual({ ok: true });
    const row = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { subscriptionStatus: true, subscriptionDueAt: true, subscriptionInvoiceRef: true, commissionPartnerId: true } });
    expect(row).toMatchObject({ subscriptionStatus: "ACTIVE", subscriptionInvoiceRef: "INV-1", commissionPartnerId: partnerId });
    expect(row.subscriptionDueAt?.toISOString().slice(0, 10)).toBe(day(355));
    const rows = await db.auditLog.findMany({ where: { action: "superuser.school.subscription", targetId: schoolId }, select: { schoolId: true, meta: true } });
    expect(rows).toHaveLength(2);
    const mine = rows.find((r) => r.schoolId === null);
    const theirs = rows.find((r) => r.schoolId === schoolId);
    expect(JSON.parse(mine!.meta as string)).toMatchObject({ status: "ACTIVE", invoiceRef: "INV-1", reason: "paid for the year" });
    expect(JSON.parse(theirs!.meta as string)).toMatchObject({ status: "ACTIVE", reason: "paid for the year" });
    expect(JSON.parse(theirs!.meta as string)).not.toHaveProperty("invoiceRef");
    // Nothing changed: nothing written.
    expect(await setSubscription(operator(), schoolId, { status: "ACTIVE", reason: "again" })).toEqual({ ok: true });
    expect(await db.auditLog.count({ where: { action: "superuser.school.subscription", targetId: schoolId } })).toBe(2);
  });

  it("the point of contact is recorded, a bad email refused, and only a change is audited", async () => {
    expect(await setContact(operator(), schoolId, { email: "not-an-email" })).toEqual({ ok: false, errorKey: "root.emailLooksWrong" });
    expect(await setContact(operator(), schoolId, { name: " ZZ Head Clerk ", role: "Clerk", phone: "+910000000001", email: null })).toEqual({ ok: true });
    expect(await setContact(operator(), schoolId, { name: "ZZ Head Clerk" })).toEqual({ ok: true });
    const row = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { pocName: true, pocRole: true, pocPhone: true, pocEmail: true } });
    expect(row).toEqual({ pocName: "ZZ Head Clerk", pocRole: "Clerk", pocPhone: "+910000000001", pocEmail: null });
    expect(await db.auditLog.count({ where: { action: "superuser.school.contact", targetId: schoolId } })).toBe(1);
  });

  it("what a partner is owed is their share of the plan price over ACTIVE schools only, computed on read; an ACTIVE school on no plan is counted apart", async () => {
    await db.school.update({ where: { id: soonSchoolId }, data: { commissionPartnerId: partnerId } });
    await db.school.update({ where: { id: endedSchoolId }, data: { commissionPartnerId: partnerId, planId } });
    await db.school.update({ where: { id: unpricedSchoolId }, data: { commissionPartnerId: partnerId } });
    const partner = (await listPartners(operator())).find((p) => p.id === partnerId)!;
    expect(partner.schools.map((s) => s.id).sort()).toEqual([schoolId, soonSchoolId, endedSchoolId, unpricedSchoolId].sort());
    // Main (ACTIVE, ₹1,000) and Soon (ACTIVE, ₹1,000) at 12.5 %; Ended is on the plan and owes nothing; Unpriced is ACTIVE on no plan — nothing to take a share of, and said so.
    expect(partner.owedThisMonthPaise).toBe(25_000);
    expect(partner.unpricedSchools).toBe(1);
  });
});

describe("the dashboard", () => {
  it("counts the tiles, narrows by the chips due-first, and lists the schools due within a week", async () => {
    const mine = [schoolId, soonSchoolId, pastSchoolId, endedSchoolId];
    const d = await operatorDashboard(operator(), { schoolIds: mine, now: NOW });
    expect(d.tiles).toMatchObject({ live: 4, trial: 0, dueSoon: 1, pastDue: 1, suspended: 0 });
    expect(d.rows.map((r) => r.id)).toEqual([pastSchoolId, soonSchoolId, schoolId, endedSchoolId]);
    expect(d.rows[0]).toMatchObject({ dueTone: "past", subscription: { daysToDue: -5, status: "ACTIVE" } });
    expect(d.rows[1]).toMatchObject({ dueTone: "soon", subscription: { daysToDue: 3 } });
    expect(d.rows[2]).toMatchObject({ dueTone: "later", commission: { partnerId, percentTenths: 125 }, contact: { name: "ZZ Head Clerk", phone: "+910000000001" }, plan: { id: planId } });
    expect(d.rows[3]).toMatchObject({ dueTone: "none", subscription: { status: "ENDED" } });
    expect(d.dueSoon.map((s) => s.id)).toEqual([pastSchoolId, soonSchoolId]);
    expect(d.partners.find((p) => p.id === partnerId)).toMatchObject({ schools: 4, owedThisMonthPaise: 25_000, unpricedSchools: 1 });

    const due = await operatorDashboard(operator(), { schoolIds: mine, state: "due", now: NOW });
    expect(due.rows.map((r) => r.id)).toEqual([pastSchoolId]);
    const byPartner = await operatorDashboard(operator(), { schoolIds: mine, state: "all", partnerId, now: NOW });
    expect(byPartner.rows.map((r) => r.id).sort()).toEqual([schoolId, soonSchoolId, endedSchoolId].sort());
    const byPlan = await operatorDashboard(operator(), { schoolIds: mine, planId, q: "soon", now: NOW });
    expect(byPlan.rows.map((r) => r.id)).toEqual([soonSchoolId]);
  });
});

describe("the daily reminder", () => {
  it("tells the operator once about each school due within a week or past due, never about an ended one, and is muted for a week", async () => {
    const mine = [schoolId, soonSchoolId, pastSchoolId, endedSchoolId];
    const first = await remindSubscriptions(NOW, { schoolIds: mine, operatorIds: [operatorUserId] });
    expect(first).toMatchObject({ due: 2, reminded: 2, muted: 0, operators: 1 });
    const notes = await db.notification.findMany({ where: { userId: operatorUserId }, select: { title: true, url: true } });
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.url).sort()).toEqual([`/root/${pastSchoolId}`, `/root/${soonSchoolId}`].sort());
    expect(await db.auditLog.count({ where: { action: "superuser.subscription.remind", targetId: { in: mine } } })).toBe(2);

    const again = await remindSubscriptions(new Date(NOW.getTime() + 2 * DAY), { schoolIds: mine, operatorIds: [operatorUserId] });
    expect(again).toMatchObject({ due: 2, reminded: 0, muted: 2 });
    const later = await remindSubscriptions(new Date(NOW.getTime() + 8 * DAY), { schoolIds: mine, operatorIds: [operatorUserId] });
    expect(later).toMatchObject({ due: 2, reminded: 2, muted: 0 });
  });
});

describe("onboarding", () => {
  it("refuses a taken slug, a bad administrator address and an unknown plan before writing anything", async () => {
    const before = await db.school.count({ where: { name: { startsWith: "ZZ Subs" } } });
    const base = { name: `ZZ Subs Onboarded ${STAMP}`, contactEmail: `zz-subs-onb-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", trial: false, adminEmail: `zz-subs-onb-admin-${STAMP}@test.invalid` };
    expect(await onboardSchool(operator(), { ...base, slug: `zz-subs-main-${STAMP}` }, NOW)).toEqual({ ok: false, errorKey: "root.slugTaken" });
    expect(await onboardSchool(operator(), { ...base, adminEmail: "nope" }, NOW)).toEqual({ ok: false, errorKey: "root.emailLooksWrong" });
    expect(await onboardSchool(operator(), { ...base, planId: "nope" }, NOW)).toEqual({ ok: false, errorKey: "root.noSuchPlan" });
    expect(await onboardSchool(operator(), { ...base, commission: { partnerId: "nope" } }, NOW)).toEqual({ ok: false, errorKey: "root.noSuchPartner" });
    expect(await onboardSchool(operator(), { ...base, startsAt: day(0), dueAt: day(0) }, NOW)).toEqual({ ok: false, errorKey: "root.subscriptionDatesOrder" });
    expect(await db.school.count({ where: { name: { startsWith: "ZZ Subs" } } })).toBe(before);
  });

  it("makes the school, puts it on the plan, records the trial, the contact and a new partner, and invites the administrator — in one call", async () => {
    const result = await onboardSchool(
      operator(),
      {
        name: `ZZ Subs Onboarded ${STAMP}`,
        slug: `zz-subs-onboarded-${STAMP}`,
        contactEmail: `zz-subs-onb-${STAMP}@test.invalid`,
        timezone: "Asia/Kolkata",
        board: "CBSE",
        city: "Pune",
        gradeLow: "1",
        gradeHigh: "10",
        planId,
        trial: true,
        contact: { name: "ZZ Onboard Clerk", role: "Clerk", phone: "+910000000002", email: null },
        commission: { newPartner: { name: `ZZ Subs Partner ${STAMP} New`, percentTenths: 50 } },
        adminEmail: `zz-subs-onb-admin-${STAMP}@test.invalid`,
        adminName: "ZZ Onboard Admin",
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    onboardedSchoolId = result.schoolId;
    onboardedPartnerId = result.partnerId ?? "";
    expect(result.slug).toBe(`zz-subs-onboarded-${STAMP}`);
    const school = await db.school.findUniqueOrThrow({ where: { id: onboardedSchoolId }, select: { slug: true, board: true, planId: true, planSince: true, subscriptionStatus: true, subscriptionStartsAt: true, subscriptionDueAt: true, pocName: true, pocPhone: true, commissionPartnerId: true, verifiedAt: true } });
    expect(school).toMatchObject({ slug: `zz-subs-onboarded-${STAMP}`, board: "CBSE", planId, subscriptionStatus: "TRIAL", pocName: "ZZ Onboard Clerk", pocPhone: "+910000000002", commissionPartnerId: onboardedPartnerId });
    expect(school.planSince).not.toBeNull();
    expect(school.verifiedAt).not.toBeNull();
    expect(school.subscriptionStartsAt?.toISOString().slice(0, 10)).toBe(day(0));
    expect(school.subscriptionDueAt?.toISOString().slice(0, 10)).toBe(day(30));
    expect(await db.commissionPartner.findUnique({ where: { id: onboardedPartnerId }, select: { percentTenths: true } })).toEqual({ percentTenths: 50 });
    expect(await db.invite.count({ where: { schoolId: onboardedSchoolId, role: "ADMIN", status: "PENDING", email: `zz-subs-onb-admin-${STAMP}@test.invalid` } })).toBe(1);
    for (const action of ["superuser.school.create", "superuser.school.plan", "superuser.invite.admin", "superuser.school.onboard"]) {
      expect(await db.auditLog.count({ where: { action, targetId: onboardedSchoolId, schoolId: null } }), action).toBe(1);
    }
    // The school-bound rows went through the same transaction.
    for (const action of ["superuser.school.plan", "superuser.invite.admin"]) {
      expect(await db.auditLog.count({ where: { action, targetId: onboardedSchoolId, schoolId: onboardedSchoolId } }), action).toBe(1);
    }
    // The invitation's mail went after the commit.
    expect(result.mailSent).toBe(true);
    expect(await db.outboundEmail.count({ where: { to: `zz-subs-onb-admin-${STAMP}@test.invalid`, purpose: "INVITE" } })).toBe(1);
  });

  it("a step that throws mid-way rolls the whole transaction back: no school, no inline partner, no audit row", async () => {
    vi.mocked(inviteAdmin).mockRejectedValueOnce(new Error("zz invite write failed"));
    const name = `ZZ Subs Onboarded ${STAMP} Rolled`;
    await expect(
      onboardSchool(
        operator(),
        { name, slug: `zz-subs-rolled-${STAMP}`, contactEmail: `zz-subs-rolled-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", planId, trial: true, commission: { newPartner: { name: `ZZ Subs Partner ${STAMP} Rolled`, percentTenths: 75 } }, adminEmail: `zz-subs-rolled-admin-${STAMP}@test.invalid` },
        NOW,
      ),
    ).rejects.toThrow("zz invite write failed");
    expect(await db.school.count({ where: { OR: [{ name }, { slug: `zz-subs-rolled-${STAMP}` }] } })).toBe(0);
    expect(await db.commissionPartner.count({ where: { name: `ZZ Subs Partner ${STAMP} Rolled` } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: { in: ["superuser.school.create", "superuser.school.plan", "superuser.partner.create"] }, meta: { contains: name } } })).toBe(0);
    expect(await db.outboundEmail.count({ where: { to: `zz-subs-rolled-admin-${STAMP}@test.invalid` } })).toBe(0);
  });
});

describe("the handlers", () => {
  const handlers = () => [
    { name: "GET dashboard", call: () => dashboardGet(get("/dashboard?state=due")) },
    { name: "POST subscription", call: () => subscriptionPost(send("POST", `/schools/${schoolId}/subscription`, { reason: "x" }), params({ schoolId })) },
    { name: "POST contact", call: () => contactPost(send("POST", `/schools/${schoolId}/contact`, { role: "Clerk" }), params({ schoolId })) },
    { name: "GET partners", call: () => partnersGet() },
    { name: "POST partners", call: () => partnersPost(send("POST", "/partners", { name: `ZZ Subs Partner ${STAMP} Gate`, percentTenths: 10 })) },
    { name: "PATCH partner", call: () => partnerPatch(send("PATCH", `/partners/${partnerId}`, { notes: "gate" }), params({ partnerId })) },
    { name: "POST onboard", call: () => onboardPost(send("POST", "/onboard", { name: `ZZ Subs Onboarded ${STAMP} Gate`, contactEmail: "x@test.invalid", timezone: "Asia/Kolkata", adminEmail: `zz-subs-gate-${STAMP}@test.invalid` })) },
  ];

  it("signed out is 401 and every school role is 403, on every handler", async () => {
    await signIn("OUT");
    for (const h of handlers()) expect((await h.call()).status, h.name).toBe(401);
    for (const role of ROLES) {
      await signIn(role);
      for (const h of handlers()) expect((await h.call()).status, `${role} ${h.name}`).toBe(403);
    }
    expect(await db.commissionPartner.count({ where: { name: { contains: "Gate" } } })).toBe(0);
    expect(await db.school.count({ where: { name: { contains: `${STAMP} Gate` } } })).toBe(0);
  });

  it("the operator's answers parse: the dashboard, the partners, a subscription and contact change, a partner added and corrected, the school detail with its record", async () => {
    await signIn("OPERATOR");
    const dash = operatorDashboardSchema.parse(await (await dashboardGet(get(`/dashboard?state=all&partnerId=${partnerId}`))).json());
    expect(dash.rows.some((r) => r.id === schoolId && r.commission?.partnerId === partnerId)).toBe(true);
    expect(dash.partners.some((p) => p.id === partnerId)).toBe(true);
    expect((await subscriptionPost(send("POST", `/schools/${schoolId}/subscription`, { paidAt: day(0), paidRef: "UTR-1", reason: "seen on the statement" }), params({ schoolId }))).status).toBe(200);
    expect((await subscriptionPost(send("POST", `/schools/${schoolId}/subscription`, { status: "TRIAL", reason: "no" }), params({ schoolId }))).status).toBe(422);
    expect((await subscriptionPost(send("POST", `/schools/${schoolId}/subscription`, { status: "ACTIVE" }), params({ schoolId }))).status).toBe(422);
    expect(okSchema.parse(await (await contactPost(send("POST", `/schools/${schoolId}/contact`, { role: "Head clerk" }), params({ schoolId }))).json())).toEqual({ ok: true });
    const made = await partnersPost(send("POST", "/partners", { name: `ZZ Subs Partner ${STAMP} Route`, percentTenths: 10 }));
    expect(made.status).toBe(201);
    const created = operatorPartnerCreatedSchema.parse(await made.json());
    expect((await partnerPatch(send("PATCH", `/partners/${created.partnerId}`, { percentTenths: 20 }), params({ partnerId: created.partnerId }))).status).toBe(200);
    expect((await partnerPatch(send("PATCH", "/partners/zz-no-such", { percentTenths: 20 }), params({ partnerId: "zz-no-such" }))).status).toBe(404);
    const partners = operatorPartnersSchema.parse(await (await partnersGet()).json());
    expect(partners.items.find((p) => p.id === created.partnerId)?.percentTenths).toBe(20);
    const detail = operatorSchoolDetailSchema.parse(await (await schoolGet(get(`/schools/${schoolId}`), params({ schoolId }))).json());
    expect(detail.subscription).toMatchObject({ status: "ACTIVE", paidAt: day(0), paidRef: "UTR-1" });
    expect(detail.contact).toMatchObject({ name: "ZZ Head Clerk", role: "Head clerk" });
    expect(detail.commission).toMatchObject({ partnerId, percentTenths: 125 });
  });

  it("the onboard door answers 201 with the id, code and slug, and a taken slug 422", async () => {
    await signIn("OPERATOR");
    const taken = await onboardPost(send("POST", "/onboard", { name: `ZZ Subs Onboarded ${STAMP} Route`, slug: `zz-subs-onboarded-${STAMP}`, contactEmail: "x@test.invalid", timezone: "Asia/Kolkata", adminEmail: `zz-subs-route-admin-${STAMP}@test.invalid` }));
    expect(taken.status).toBe(422);
    const made = await onboardPost(send("POST", "/onboard", { name: `ZZ Subs Onboarded ${STAMP} Route`, contactEmail: "x@test.invalid", timezone: "Asia/Kolkata", trial: true, adminEmail: `zz-subs-route-admin-${STAMP}@test.invalid` }));
    expect(made.status).toBe(201);
    const body = operatorOnboardedSchema.parse(await made.json());
    expect(body.slug).toMatch(/^zz-subs-onboarded-/);
    expect(body.partnerId).toBeNull();
    await db.auditLog.deleteMany({ where: { targetId: body.schoolId } });
    await db.school.delete({ where: { id: body.schoolId } });
  });
});
