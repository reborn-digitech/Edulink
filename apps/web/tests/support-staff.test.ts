/**
 * owner-batch-item2a (27 October 2026): SUPPORT STAFF WITHOUT A LOGIN on the payroll.
 *
 * Everyone on a pay run had to be a member with an account, and the office had no way to put a cleaner, cook, guard
 * or peon on the books. Proved here, at two ZZ schools of this suite's own (Teak has PAYROLL on, Ash has it off): the
 * office adds a support worker through POST /api/v1/admin/people/support — an account nobody can sign in as, an
 * ACTIVE SUPPORT membership, a staff record with the job, the joining day and the contact phone (never the account's),
 * an audit row without the number — and two presses at once make one person; the refusals (a phone that is not one, a
 * joining day still to come, a salary where payroll is off or on a structure that is not the school's, a teacher
 * asking) make nobody; the worker's salary, a run drafted with their slip and designation, the lock (whose notice to a
 * person with no login does not stop it), the ECR, ESI and bank advice files carrying their line, the slip's PDF
 * document naming the job, an advance the office records for them; the role refused every door but the person's own
 * and their own payslips, and every /account page but the profile and the payslips; and a first sign-in code that
 * gives the same account and membership a login.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ENDPOINTS } from "@/lib/api-catalog";
import { permits } from "@/lib/api-catalog/types";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { askAdvance, draftRun, lockRun, payrollExport, payslipDocument, recordAdvance, saveSalary, saveStructure, savePayrollSettings, listSalaries } from "@/lib/payroll";
import { addSupportStaff } from "@/lib/support-staff";
import { issueFirstSignIn, redeemFirstSignIn } from "@/lib/first-signin";
import { gateRequest, supportPagePermitted } from "@/lib/role-gate";
import { AccessError } from "@/lib/access-error";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import { POST as supportPost } from "@/app/api/v1/admin/people/support/route";
import { GET as mineGet } from "@/app/api/v1/account/payslips/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MONTH = "2026-09";
const ACCOUNT = "998877665544";
const ids = { teak: "", ash: "", admin: "", ashAdmin: "", teacher: "", structure: "", cook: "", cookUser: "" };

async function as(userId: string, role: string, schoolId: string, route: string | null = null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}
const post = (body: unknown) => new Request("http://localhost/api/v1/admin/people/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const supportCount = (schoolId: string) => db.membership.count({ where: { schoolId, role: "SUPPORT" } });

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Support ${tag} ${STAMP}`, slug: `zz-sup-${tag.toLowerCase()}-${STAMP}`, code: `ZSU${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-sup-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.teak = (await mk("Teak")).id;
  ids.ash = (await mk("Ash")).id;
  await db.schoolModule.create({ data: { schoolId: ids.teak, module: "PAYROLL" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Sup ${who}`, email: `zz-sup-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, aa, t] = await Promise.all([user("Admin"), user("AshAdmin"), user("Teacher")]);
  Object.assign(ids, { admin: a.id, ashAdmin: aa.id, teacher: t.id });
  await db.membership.create({ data: { userId: a.id, schoolId: ids.teak, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: aa.id, schoolId: ids.ash, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: t.id, schoolId: ids.teak, role: "TEACHER", status: "ACTIVE" } });
  const ctx = await as(ids.admin, "ADMIN", ids.teak);
  await savePayrollSettings(ctx, { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "ZZ Teak Trust", pfEstablishmentCode: "MHBAN0000002000", esiEmployerCode: "31000000000000002" });
  const st = await saveStructure(ctx, {
    name: "ZZ Support",
    components: [
      { code: "BASIC", label: "", formula: "FIXED", value: 0 },
      { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 4000 },
      { code: "PF_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
      { code: "PF_EMPLOYER", label: "", formula: "FIXED", value: 0 },
      { code: "ESI_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
      { code: "ESI_EMPLOYER", label: "", formula: "FIXED", value: 0 },
      { code: "PT", label: "", formula: "FIXED", value: 0 },
    ],
  });
  ids.structure = st.id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  // The support workers' accounts have no address: found by their memberships at this suite's two schools, before those go.
  const workers = (await db.membership.findMany({ where: { schoolId: { in: [ids.teak, ids.ash] }, role: "SUPPORT" }, select: { userId: true } })).map((m) => m.userId);
  await db.session.deleteMany({ where: { userId: { in: [...workers, ids.admin, ids.ashAdmin, ids.teacher] } } });
  await db.authToken.deleteMany({ where: { userId: { in: workers } } });
  await db.school.deleteMany({ where: { id: { in: [ids.teak, ids.ash] } } });
  await db.user.deleteMany({ where: { OR: [{ id: { in: workers } }, { email: { contains: `-${STAMP}@test.invalid` } }] } });
  await db.$disconnect();
});

describe("the office adds a support worker with no login", () => {
  it("makes an account nobody signs in as, an ACTIVE SUPPORT membership and a staff record, through the door", async () => {
    await as(ids.admin, "ADMIN", ids.teak, "POST /api/v1/admin/people/support");
    const res = await supportPost(post({ name: "  ZZ Kamala   Jadhav ", designation: "Cook", phone: "98765 43210", joinedOnKey: "2026-06-01", salary: { structureId: ids.structure, basicPaise: 1_200_000, paymentMode: "CASH" } }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { membershipId: string; name: string; role: string; phone: string; salary: { salary: { effectiveFrom: string; paymentMode: string } } | null; duplicate: boolean };
    expect(body).toMatchObject({ name: "ZZ Kamala Jadhav", role: "SUPPORT", phone: "+919876543210", duplicate: false });
    expect(body.salary?.salary.effectiveFrom).toBe("2026-06-01");
    expect(body.salary?.salary.paymentMode).toBe("CASH");
    ids.cook = body.membershipId;
    const m = await db.membership.findUniqueOrThrow({ where: { id: ids.cook }, select: { role: true, status: true, userId: true, user: { select: { email: true, phone: true, passwordHash: true, isTestFixture: true } }, staffRecord: { select: { designation: true, joinedOn: true, contactPhone: true } } } });
    ids.cookUser = m.userId;
    expect(m.role).toBe("SUPPORT");
    expect(m.status).toBe("ACTIVE");
    expect(m.user).toEqual({ email: null, phone: null, passwordHash: null, isTestFixture: true });
    expect(m.staffRecord).toEqual({ designation: "Cook", joinedOn: new Date("2026-06-01T00:00:00.000Z"), contactPhone: "+919876543210" });
    const audit = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.teak, action: "staff.support.add", targetId: ids.cook }, select: { meta: true } });
    expect(audit.meta).not.toContain("9876543210");
  });

  it("answers two presses at once with one person", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.teak);
    const before = await supportCount(ids.teak);
    const input = { name: "ZZ Ramesh Patil", designation: "Security guard", phone: "", joinedOnKey: "2026-07-01", salary: null };
    const [a, b] = await Promise.all([addSupportStaff(ctx, input), addSupportStaff(ctx, input)]);
    expect(a.membershipId).toBe(b.membershipId);
    expect([a.duplicate, b.duplicate].sort()).toEqual([false, true]);
    expect(await supportCount(ids.teak)).toBe(before + 1);
  });

  it("refuses a phone that is not one, a joining day still to come, and a teacher, and makes nobody", async () => {
    const before = await supportCount(ids.teak);
    await as(ids.admin, "ADMIN", ids.teak, "POST /api/v1/admin/people/support");
    const phone = await supportPost(post({ name: "ZZ Bad Phone", designation: "Peon", phone: "call me", joinedOnKey: "2026-06-01" }));
    expect(phone.status).toBe(422);
    expect(((await phone.json()) as { issues?: Record<string, string> }).issues).toHaveProperty("phone");
    const later = await supportPost(post({ name: "ZZ Later", designation: "Peon", joinedOnKey: "2099-01-01" }));
    expect(later.status).toBe(422);
    const impossible = await supportPost(post({ name: "ZZ Never", designation: "Peon", joinedOnKey: "2026-02-30" }));
    expect(impossible.status).toBe(422);
    await as(ids.teacher, "TEACHER", ids.teak, "POST /api/v1/admin/people/support");
    expect((await supportPost(post({ name: "ZZ By Teacher", designation: "Peon", joinedOnKey: "2026-06-01" }))).status).toBe(403);
    expect(await supportCount(ids.teak)).toBe(before);
  });

  it("refuses a salary where payroll is off, or on another school's structure, before anybody is made", async () => {
    const ash = await as(ids.ashAdmin, "ADMIN", ids.ash);
    await expect(addSupportStaff(ash, { name: "ZZ Off", designation: "Gardener", phone: "", joinedOnKey: "2026-06-01", salary: { structureId: ids.structure, basicPaise: 900_000, paymentMode: "CASH" } })).rejects.toMatchObject({ code: "MODULE_OFF" });
    expect(await supportCount(ids.ash)).toBe(0);
    // Without a salary the worker is added where payroll is off: the staff list and the register are theirs too.
    const made = await addSupportStaff(ash, { name: "ZZ Ash Gardener", designation: "Gardener", phone: "", joinedOnKey: "2026-06-01", salary: null });
    expect(made.salary).toBeNull();
    const teak = await as(ids.admin, "ADMIN", ids.teak);
    const otherStructure = await db.salaryStructure.create({ data: { schoolId: ids.ash, name: "ZZ Ash's" }, select: { id: true } });
    const before = await supportCount(ids.teak);
    await expect(addSupportStaff(teak, { name: "ZZ Wrong Structure", designation: "Peon", phone: "", joinedOnKey: "2026-06-01", salary: { structureId: otherStructure.id, basicPaise: 900_000, paymentMode: "CASH" } })).rejects.toMatchObject({ key: "payroll.refuseUnknownStructure" });
    expect(await supportCount(ids.teak)).toBe(before);
  });
});

describe("payroll takes them", () => {
  it("lists the worker with their job, saves their statutory numbers and bank, and records an advance for them", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.teak);
    await saveSalary(ctx, { membershipId: ids.cook, structureId: ids.structure, effectiveFrom: "2026-06-01", basicPaise: 1_200_000, overrides: {}, pfUan: "100200300499", esiNumber: "3100123499", pan: "", bankAccount: ACCOUNT, bankIfsc: "SBIN0001234", bankName: "ZZ Bank", upiId: "", paymentMode: "BANK" });
    const list = await listSalaries(ctx);
    const row = list.staff.find((s) => s.membershipId === ids.cook)!;
    expect(row).toMatchObject({ role: "SUPPORT", designation: "Cook" });
    expect(row.salary?.bankLast4).toBe("5544");
    const advance = await recordAdvance(ctx, { membershipId: ids.cook, amountPaise: 300_000, monthlyRecoveryPaise: 100_000, reason: "ZZ festival advance" });
    expect(advance.status).toBe("RECORDED");
  });

  it("drafts the month with their slip, locks it although they have no login, and cuts the ECR, ESI and bank files with their line", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.teak);
    const run = await draftRun(ctx, MONTH);
    const slip = run.slips!.find((s) => s.membershipId === ids.cook)!;
    expect(slip).toBeDefined();
    expect(slip.designation).toBe("Cook");
    expect(slip.department).toBe("SUPPORT");
    const locked = await lockRun(await as(ids.admin, "ADMIN", ids.teak), MONTH);
    expect(locked.status).not.toBe("DRAFT");
    const ecr = await payrollExport(ctx, MONTH, "PF_ECR");
    expect(ecr.content).toContain("100200300499");
    expect(ecr.content).toContain("ZZ KAMALA JADHAV");
    const esi = await payrollExport(ctx, MONTH, "ESI");
    expect(esi.content).toContain("3100123499");
    const bank = await payrollExport(ctx, MONTH, "BANK_ADVICE");
    expect(bank.content).toContain(ACCOUNT);
    const doc = await payslipDocument(ctx, MONTH, ids.cook);
    expect(doc.slip.designation).toBe("Cook");
  });
});

describe("the role, given a login, reaches its own payslips and profile and nothing else", () => {
  const PERSON = ["/api/v1/me", "/api/v1/account", "/api/v1/auth/", "/api/v1/events", "/api/v1/shared/notifications", "/api/v1/shared/inbox"];
  const PAYSLIPS = ["/api/v1/account/payslips", "/api/v1/account/payslips/statement", "/api/v1/account/payslips/{month}/pdf"];

  it("is named by the catalog only on the person's own doors and the three payslip doors", () => {
    // Doors for anyone, for an account by its memberships, for the operator or the content team decide in their handlers, whatever the role.
    const byRole = ENDPOINTS.filter((e) => e.access === "signed-in" || Array.isArray(e.access));
    const open = byRole.filter((e) => permits({ access: e.access, limitedRoles: e.limitedRoles }, "SUPPORT"));
    for (const e of open) {
      const person = PERSON.some((p) => e.path === p || e.path.startsWith(p.endsWith("/") ? p : `${p}/`));
      expect(person || PAYSLIPS.includes(e.path), `${e.method} ${e.path}`).toBe(true);
    }
    for (const path of PAYSLIPS) expect(open.some((e) => e.path === path && e.method === "GET"), path).toBe(true);
    // The self-service doors a support worker is not given, though they sit under /account and /staff.
    for (const path of ["/api/v1/account/advances", "/api/v1/account/inventory", "/api/v1/account/appointment-letters", "/api/v1/staff/attendance/me", "/api/v1/staff/attendance/check-in", "/api/v1/staff/leave", "/api/v1/admin/payroll", "/api/v1/admin/people/support"]) {
      expect(open.some((e) => e.path === path), path).toBe(false);
    }
    expect(SCHOOL_STAFF_ROLES).toContain("SUPPORT");
  });

  it("is refused at the gate on another door and on every /account page but the profile and the payslips", async () => {
    await expect(gateRequest("GET /api/v1/account/payslips", { role: "SUPPORT", schoolId: ids.teak })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/admin/payroll", { role: "SUPPORT", schoolId: ids.teak })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("POST /api/v1/account/advances", { role: "SUPPORT", schoolId: ids.teak })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/staff/attendance/me", { role: "SUPPORT", schoolId: ids.teak })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /account/payslips", { role: "SUPPORT", schoolId: ids.teak })).resolves.toBe("pass");
    await expect(gateRequest("GET /account", { role: "SUPPORT", schoolId: ids.teak })).resolves.toBe("pass");
    for (const page of ["/account/items", "/account/letters", "/account/attendance", "/account/leave", "/account/plan", "/admin", "/admin/people", "/teacher", "/bulletin"]) {
      await expect(gateRequest(`GET ${page}`, { role: "SUPPORT", schoolId: ids.teak }), page).resolves.toBe("no-context");
    }
    expect(supportPagePermitted("/account/payslips/statement")).toBe(true);
    // The other staff roles keep their /account pages.
    await expect(gateRequest("GET /account/items", { role: "DRIVER", schoolId: ids.teak })).resolves.toBe("pass");
  });

  it("gives the same account and membership a login through a first sign-in code, and lands it on the payslips' role", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.teak);
    const issued = await issueFirstSignIn(ctx, ids.cook);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.issued.handle).toMatch(/^zzkamalajadh\.[a-z2-9]{4}$/);
    const user = await db.user.findUniqueOrThrow({ where: { id: ids.cookUser }, select: { email: true } });
    expect(user.email).toBe(`${issued.issued.handle}@${HANDLE_DOMAIN}`);
    const done = await redeemFirstSignIn(issued.issued.handle, issued.issued.code, "Zz-support-worker-2026!");
    expect(done).toMatchObject({ ok: true, userId: ids.cookUser, schoolId: ids.teak, role: "SUPPORT" });
    // No second account, no second membership.
    expect(await db.membership.count({ where: { userId: ids.cookUser } })).toBe(1);
    const again = await issueFirstSignIn(await as(ids.admin, "ADMIN", ids.teak), ids.cook);
    expect(again).toEqual({ ok: false, errorKey: "supportStaff.alreadySignsIn" });
  });

  it("reads their own locked slip through the payslips door, and may not ask for an advance", async () => {
    await as(ids.cookUser, "SUPPORT", ids.teak, "GET /api/v1/account/payslips");
    const res = await mineGet();
    expect(res.status).toBe(200);
    const mine = (await res.json()) as { slips: { month: string; designation?: string | null }[] };
    expect(mine.slips.map((s) => s.month)).toEqual([MONTH]);
    // The account number never comes back to its owner either: the last four only.
    expect(JSON.stringify(mine)).not.toContain(ACCOUNT);
    const self = await as(ids.cookUser, "SUPPORT", ids.teak);
    await expect(askAdvance(self, { amountPaise: 100_000, reason: "ZZ" })).rejects.toBeInstanceOf(AccessError);
  });
});
