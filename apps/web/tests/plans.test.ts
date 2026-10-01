/**
 * Plans and metering: the operator adds a plan and puts a ZZ school on it
 * (audited twice, the office told); messaging reads the plan's text cap in
 * place of the school's own and the school's own again once off the plan; a
 * usage sample for the school counts its roll and its texts and is the one
 * writer of UsageSample (a rerun refreshes, never duplicates); the office
 * reads its own month and not another school's; the operator's list ranks
 * the over-cap school first; a plan with a school on it cannot be removed.
 * Every row is a ZZ row made here and deleted after, scoped by school.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { officeUsageSchema, operatorPlansSchema, operatorUsageSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { assignPlan, computeUsage, createPlan, deletePlan, listPlans, listUsage, monthBounds, monthKeyFor, officeUsage, sampleUsage, updatePlan } from "@/lib/plans";
import { messagingSettings } from "@/lib/messaging";
import { GET as plansGet, POST as plansPost } from "@/app/api/v1/operator/plans/route";
import { GET as usageGet } from "@/app/api/v1/operator/usage/route";
import { GET as officeUsageGet } from "@/app/api/v1/office/usage/route";
import { JOBS } from "@/lib/jobs";

const db = new PrismaClient();
const STAMP = Date.now();
const CODE = `zz-plan-${STAMP}`;

let schoolId = "";
let otherSchoolId = "";
let operatorUserId = "";
let adminUserId = "";
let otherAdminUserId = "";
let teacherUserId = "";
let planId = "";

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true } }) as unknown as Parameters<typeof listPlans>[0];
const P = "http://localhost/api/v1";
const get = (path: string) => new Request(`${P}${path}`);
const send = (path: string, body: unknown) => new Request(`${P}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function signIn(who: "OPERATOR" | "ADMIN" | "OTHER_ADMIN" | "TEACHER") {
  __resetCookies();
  if (who === "OPERATOR") await createSession(operatorUserId);
  else if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  else if (who === "OTHER_ADMIN") await createSession(otherAdminUserId, { schoolId: otherSchoolId, role: "ADMIN" });
  else await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  const [school, other] = await Promise.all([
    db.school.create({ data: { name: `ZZ Plans ${STAMP}`, slug: `zz-plans-${STAMP}`, code: `ZP${String(STAMP).slice(-6)}`, contactEmail: `zz-plans-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", msgMonthlyCap: 2000 }, select: { id: true } }),
    db.school.create({ data: { name: `ZZ Plans Other ${STAMP}`, slug: `zz-plans-o-${STAMP}`, code: `ZQ${String(STAMP).slice(-6)}`, contactEmail: `zz-plans-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } }),
  ]);
  schoolId = school.id;
  otherSchoolId = other.id;
  const [op, admin, otherAdmin, teacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Plans Operator", email: `zz-plans-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Plans Admin", email: `zz-plans-admin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Plans Other Admin", email: `zz-plans-oadmin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Plans Teacher", email: `zz-plans-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  operatorUserId = op.id;
  adminUserId = admin.id;
  otherAdminUserId = otherAdmin.id;
  teacherUserId = teacher.id;
  await db.membership.createMany({
    data: [
      { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" },
      { userId: otherAdminUserId, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" },
      { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  // Three pupils on the roll and one who left: the sample counts three.
  for (let i = 0; i < 4; i++) {
    const pupil = await db.user.create({ data: { name: `ZZ Plans Pupil ${i} ${STAMP}`, email: `zz-plans-p${i}-${STAMP}@test.invalid` }, select: { id: true } });
    await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: i === 3 ? new Date(Date.now() - 86_400_000) : null } });
  }
  // Two texts this month, three segments between them, and one skipped (not counted).
  await db.outboundMessage.createMany({
    data: [
      { schoolId, userId: adminUserId, to: "+910000000001", channel: "SMS", templateKey: "absence", locale: "en", varsJson: "{}", body: "zz", status: "SENT", segments: 2, purpose: "zz" },
      { schoolId, userId: adminUserId, to: "+910000000001", channel: "WHATSAPP", templateKey: "absence", locale: "en", varsJson: "{}", body: "zz", status: "DELIVERED", segments: 1, purpose: "zz" },
      { schoolId, userId: adminUserId, to: "+910000000001", channel: "SMS", templateKey: "absence", locale: "en", varsJson: "{}", body: "zz", status: "SKIPPED", segments: 1, purpose: "zz", skipReason: "cap-daily" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  const pupils = await db.membership.findMany({ where: { schoolId, role: "STUDENT" }, select: { userId: true } });
  const users = [operatorUserId, adminUserId, otherAdminUserId, teacherUserId, ...pupils.map((p) => p.userId)].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: [schoolId, otherSchoolId] } }, { actorUserId: { in: users } }] } });
  // Messages, memberships and samples cascade with their school; the plan goes last, once no school names it.
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.plan.deleteMany({ where: { code: { startsWith: `zz-plan-${STAMP}` } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("plans", () => {
  it("the operator adds a plan, a taken code and a bad code are refused, and the list counts schools on it", async () => {
    const made = await createPlan(operator(), { code: CODE, name: "ZZ Starter", pupilCap: 2, messageCap: 2, storageCapMb: null, priceMonthlyPaise: 49900 });
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    planId = made.planId;
    expect(await createPlan(operator(), { code: CODE, name: "Again" })).toEqual({ ok: false, errorKey: "root.planCodeTaken" });
    expect(await createPlan(operator(), { code: "Bad Code!", name: "x" })).toEqual({ ok: false, errorKey: "root.planCodeInvalid" });
    const listed = (await listPlans(operator())).find((p) => p.id === planId);
    expect(listed).toMatchObject({ code: CODE, name: "ZZ Starter", pupilCap: 2, messageCap: 2, storageCapMb: null, priceMonthlyPaise: 49900, schools: 0 });
    expect(await db.auditLog.count({ where: { action: "superuser.plan.create", targetId: planId } })).toBe(1);
  });

  it("a teacher is refused the plan endpoints and the operator's answer parses", async () => {
    await signIn("TEACHER");
    expect((await plansGet()).status).toBe(403);
    expect((await plansPost(send("/operator/plans", { code: `${CODE}-x`, name: "nope" }))).status).toBe(403);
    await signIn("OPERATOR");
    const body = operatorPlansSchema.parse(await (await plansGet()).json());
    expect(body.items.some((p) => p.id === planId)).toBe(true);
    const created = await plansPost(send("/operator/plans", { code: `${CODE}-two`, name: "ZZ Two", messageCap: 10 }));
    expect(created.status).toBe(201);
  });

  it("assigning the plan is audited twice and tells the office; the text cap becomes the plan's, and the school's own again once off it", async () => {
    expect((await messagingSettings(schoolId)).monthlyCap).toBe(2000);
    const result = await assignPlan(operator(), schoolId, planId);
    expect(result).toEqual({ ok: true });
    expect((await messagingSettings(schoolId)).monthlyCap).toBe(2);
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { planId: true, planSince: true } });
    expect(school.planId).toBe(planId);
    expect(school.planSince).not.toBeNull();
    expect(await db.auditLog.count({ where: { action: "superuser.school.plan", targetId: schoolId, schoolId: null } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.school.plan", targetId: schoolId, schoolId } })).toBe(1);
    const told = await db.notification.findFirst({ where: { userId: adminUserId, schoolId }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("ZZ Starter");
    expect((await listPlans(operator())).find((p) => p.id === planId)?.schools).toBe(1);
    // The same plan again is a no-op: no second audit row.
    expect(await assignPlan(operator(), schoolId, planId)).toEqual({ ok: true });
    expect(await db.auditLog.count({ where: { action: "superuser.school.plan", targetId: schoolId, schoolId: null } })).toBe(1);
    // A plan with a school on it stays.
    expect(await deletePlan(operator(), planId)).toEqual({ ok: false, errorKey: "root.planInUse" });
    // A plan with no text cap leaves the school's own in force.
    expect(await updatePlan(operator(), planId, { messageCap: null })).toEqual({ ok: true, planId });
    expect((await messagingSettings(schoolId)).monthlyCap).toBe(2000);
    expect(await updatePlan(operator(), planId, { messageCap: 2 })).toEqual({ ok: true, planId });
  });

  it("a usage sample counts the roll and the texts, a rerun refreshes the one row, and the over-cap school is listed first", async () => {
    const now = new Date();
    const month = monthKeyFor("Asia/Kolkata", now);
    const { start, end } = monthBounds(month, "Asia/Kolkata");
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(end.getTime()).toBeGreaterThan(now.getTime());
    const counts = await computeUsage(schoolId, month, { sizes: new Map(), now });
    expect(counts).toMatchObject({ pupils: 3, messages: 3, storageMb: 0 });

    const first = await sampleUsage(now, { schoolIds: [schoolId, otherSchoolId] });
    expect(first.summary).toEqual({ schools: 2, written: 2, overCap: 1, skipped: 0 });
    expect(first.perSchool[schoolId]).toMatchObject({ pupils: 3, messages: 3, overCap: 1 });
    expect(first.perSchool[otherSchoolId]).toMatchObject({ pupils: 0, messages: 0, overCap: 0 });
    const again = await sampleUsage(new Date(now.getTime() + 1000), { schoolIds: [schoolId] });
    expect(again.summary.written).toBe(1);
    expect(await db.usageSample.count({ where: { schoolId } })).toBe(1);
    const row = await db.usageSample.findUniqueOrThrow({ where: { schoolId_month: { schoolId, month } } });
    expect(row).toMatchObject({ pupils: 3, messages: 3, storageMb: 0 });

    const listed = await listUsage(operator(), month);
    const mine = listed.items.find((i) => i.schoolId === schoolId);
    expect(mine).toMatchObject({ counts: { pupils: 3, messages: 3 }, caps: { pupils: 2, messages: 2, storageMb: null }, over: { pupils: true, messages: true, storageMb: false }, overCap: true });
    expect(listed.items.findIndex((i) => i.schoolId === schoolId)).toBeLessThan(listed.items.findIndex((i) => i.schoolId === otherSchoolId));
    expect(listed.overCap).toBeGreaterThanOrEqual(1);
    expect(JOBS["usage:sample"].schedule).toBe("10 2 * * *");
  });

  it("the operator's usage endpoint answers the contract; a bad month is 422; a teacher is refused", async () => {
    await signIn("OPERATOR");
    const month = monthKeyFor("Asia/Kolkata");
    const res = await usageGet(get(`/operator/usage?month=${month}`));
    expect(res.status).toBe(200);
    const body = operatorUsageSchema.parse(await res.json());
    expect(body.month).toBe(month);
    expect(body.items.find((i) => i.schoolId === schoolId)?.overCap).toBe(true);
    expect((await usageGet(get("/operator/usage?month=2026-13"))).status).toBe(422);
    await signIn("TEACHER");
    expect((await usageGet(get("/operator/usage"))).status).toBe(403);
  });

  it("the office reads its own month and not another school's; a teacher is refused", async () => {
    await signIn("ADMIN");
    const res = await officeUsageGet();
    expect(res.status).toBe(200);
    const body = officeUsageSchema.parse(await res.json());
    expect(body.plan?.id).toBe(planId);
    expect(body.counts).toMatchObject({ pupils: 3, messages: 3 });
    expect(body.over).toEqual({ pupils: true, messages: true, storageMb: false });
    await signIn("OTHER_ADMIN");
    const other = officeUsageSchema.parse(await (await officeUsageGet()).json());
    expect(other.plan).toBeNull();
    expect(other.counts).toMatchObject({ pupils: 0, messages: 0 });
    await signIn("TEACHER");
    expect((await officeUsageGet()).status).toBe(403);
    // The lib refuses a teacher's context too, not only the handler's role gate.
    await expect(officeUsage({ role: "TEACHER", schoolId, user: { id: teacherUserId } } as never)).rejects.toThrow();
  });

  it("taking the school off the plan restores its own cap and lets the plan be removed", async () => {
    expect(await assignPlan(operator(), schoolId, null)).toEqual({ ok: true });
    expect((await messagingSettings(schoolId)).monthlyCap).toBe(2000);
    expect(await assignPlan(operator(), schoolId, "nope")).toEqual({ ok: false, errorKey: "root.noSuchPlan" });
    expect(await deletePlan(operator(), planId)).toEqual({ ok: true });
    expect(await db.plan.findUnique({ where: { id: planId } })).toBeNull();
  });
});
