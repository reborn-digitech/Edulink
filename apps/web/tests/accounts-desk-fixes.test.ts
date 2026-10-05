/**
 * THE ACCOUNTS DESK'S FIXES (audit of 5 October 2026), at a ZZ college of this
 * suite's own with ADMISSIONS, SCHOLARSHIPS, PAYROLL and INVENTORY on.
 *
 * A3-journeys-8: a no-dues line cleared by hand with ₹12,000 owed and no note.
 * A3-journeys-9: a ₹99,999 sanction on a ₹15,750 claim was accepted.
 * A3-journeys-39: the student's account showed a disbursed claim as ₹0.
 * A3-S-15: a refund asked outside the slab had no ceiling; the principal's
 * decision skipped the ADMISSIONS module on the web action's path; the
 * accounts look-up read "%" and "_" as LIKE wildcards.
 * A3-inventory-1, -2, -3: the fee ledger's sub-pages, the payroll and stores
 * forms, and the admission fee and refund pages answered ADMIN (or ADMIN and
 * PRINCIPAL) while every door behind them names ACCOUNTS; the accounts desk
 * was sent to /switch. Rendered here as the desk: each page renders, draws the
 * forms its doors permit and no others.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { ModuleOffError } from "@/lib/access-error";
import { modulePagePermitted } from "@/lib/role-gate";
import { claimShownPaise } from "@/lib/college-fees";
import { decideRefundException } from "@/lib/head-approvals";
import { lookupStudents } from "@/lib/accounts-lookup";
import { POST as claimsPost } from "@/app/api/v1/college/scholarships/claims/route";
import { POST as claimPost } from "@/app/api/v1/college/scholarships/claims/[claimId]/route";
import { POST as noDuesPost } from "@/app/api/v1/accounts/no-dues/[studentMembershipId]/route";
import { POST as refundAskPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/refund-exception/route";
import DuesPage from "@/app/(app)/admin/fees/dues/page";
import ClaimsPage from "@/app/(app)/admin/fees/claims/page";
import FeeSettingsPage from "@/app/(app)/admin/fees/settings/page";
import FeeHeadsPage from "@/app/(app)/admin/fees/heads/page";
import FeeStructuresPage from "@/app/(app)/admin/fees/structures/page";
import NewStructurePage from "@/app/(app)/admin/fees/structures/new/page";
import StructurePage from "@/app/(app)/admin/fees/structures/[structureId]/page";
import PupilFeesPage from "@/app/(app)/admin/fees/pupils/[studentMembershipId]/page";
import ApplicationPage from "@/app/(app)/admin/college-admissions/[applicationId]/page";
import RefundsPage from "@/app/(app)/admin/college-admissions/refunds/page";
import { payrollGate } from "@/app/(app)/admin/payroll/shared";
import { inventoryGate } from "@/app/(app)/admin/inventory/shared";
import { todayKey } from "@/lib/dates";

// Server components compiled with the classic JSX runtime here need React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");
const ids = { college: "", admin: "", principal: "", accounts: "", s1: "", s2: "", year: "", tui: "", structure: "", application: "", feeDue: "", programme: "" };

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.college, role: role as never });
  return (await getSession())!;
}
/** A page's render: the tree, or what it threw (a redirect to /switch is NEXT_REDIRECT). */
async function render(page: Promise<unknown>): Promise<{ tree: unknown } | { threw: string }> {
  try {
    return { tree: await page };
  } catch (error) {
    return { threw: `${(error as Error).name}: ${(error as { digest?: string }).digest ?? (error as Error).message}` };
  }
}
/** The names of the server actions the tree's forms post to. */
function actionsIn(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) for (const n of node) actionsIn(n, out);
  else if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props: Record<string, unknown> }).props;
    if (typeof props.action === "function") out.push((props.action as { name: string }).name);
    actionsIn(props.children, out);
  }
  return out;
}
const sp = <T extends object>(p: T = {} as T) => ({ params: Promise.resolve(p), searchParams: Promise.resolve({}) });

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ AccFix College ${STAMP}`, slug: `zz-accfix-${STAMP}`, code: `ZF${SUFFIX}`, contactEmail: `zz-accfix-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "ADMISSIONS", "SCHOLARSHIPS", "PAYROLL", "INVENTORY"].map((module) => ({ schoolId: ids.college, module })) });
  const user = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ AccFix ${who}`, email: `zz-accfix-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, principal, accounts, u1, u2] = await Promise.all([user("Admin"), user("Principal"), user("Accounts"), user("Student1", { isMinor: false, birthdate: new Date("2006-01-01T00:00:00Z") }), user("Student2", { isMinor: false, birthdate: new Date("2006-02-01T00:00:00Z") })]);
  Object.assign(ids, { admin: admin.id, principal: principal.id, accounts: accounts.id });
  await db.membership.createMany({ data: [{ userId: admin.id, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" }, { userId: principal.id, schoolId: ids.college, role: "PRINCIPAL", status: "ACTIVE" }, { userId: accounts.id, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" }] });
  ids.s1 = (await db.membership.create({ data: { userId: u1.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZFS1${STAMP}` }, select: { id: true } })).id;
  ids.s2 = (await db.membership.create({ data: { userId: u2.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZFS2${STAMP}` }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const dept = (await db.department.create({ data: { schoolId: ids.college, code: `ZF${SUFFIX}`, name: "ZZ Physics" }, select: { id: true } })).id;
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept, code: "BSCPHY", name: "ZZ BSc Physics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  await db.programmeEnrolment.createMany({ data: [{ schoolId: ids.college, studentMembershipId: ids.s1, programmeId: ids.programme, yearOfEntry: 2026, category: "OBC", quota: "CAP" }, { schoolId: ids.college, studentMembershipId: ids.s2, programmeId: ids.programme, yearOfEntry: 2026, category: "OPEN", quota: "CAP" }] });
  await db.pupilRecord.create({ data: { schoolId: ids.college, studentMembershipId: ids.s1, annualIncome: 90_000 } });
  ids.tui = (await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  ids.structure = (await db.feeStructure.create({ data: { schoolId: ids.college, academicYearId: ids.year, name: "ZZ BSc fees", publishedAt: new Date() }, select: { id: true } })).id;
  // Each student owes ₹31,500 of tuition this year, due in July.
  const lines = JSON.stringify([{ headId: ids.tui, code: "TUI", name: "ZZ Tuition", grossPaise: 31_500_00, concessionPaise: 0 }]);
  for (const s of [ids.s1, ids.s2]) await db.feeDemand.create({ data: { schoolId: ids.college, studentMembershipId: s, academicYearId: ids.year, label: "ZZ Odd semester", dueDate: new Date("2026-07-15T00:00:00Z"), grossPaise: 31_500_00, netPaise: 31_500_00, linesJson: lines, status: "OPEN" } });
  // A seat cancelled after its ₹10,000 admission fee was paid; the slab gave ₹9,000 back.
  const round = (await db.admissionRound.create({ data: { schoolId: ids.college, intakeYear: 2026, kind: "MERIT", name: "ZZ Merit", opensAt: new Date(Date.now() - 86_400_000), closesAt: new Date(Date.now() + 86_400_000) }, select: { id: true } })).id;
  ids.application = (await db.collegeApplication.create({ data: { schoolId: ids.college, roundId: round, programmeId: ids.programme, number: 1, applicantName: "ZZ AccFix Applicant", category: "OPEN", quota: "CAP", status: "CANCELLED", admissionFeePaise: 10_000_00, admissionFeePaidAt: new Date(), refundPaise: 9_000_00, refundSlab: "BEFORE_LAST", cancelledAt: new Date() }, select: { id: true } })).id;
  ids.feeDue = (await db.collegeApplication.create({ data: { schoolId: ids.college, roundId: round, programmeId: ids.programme, number: 2, applicantName: "ZZ AccFix Fee Due", category: "OPEN", quota: "CAP", status: "FEE_DUE", admissionFeePaise: 10_000_00 }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("scholarships (A3-journeys-9 and -39)", () => {
  it("a sanction above the fees the claim covers is refused with a sentence; one within is taken; a disbursed claim shows what was paid", async () => {
    await as(ids.accounts, "ACCOUNTS");
    let res = await claimsPost(json("/api/v1/college/scholarships/claims", { studentMembershipId: ids.s1, scheme: "OBC_POST_MATRIC" }));
    expect(res.status).toBeLessThan(300);
    const claim = await res.json();
    expect(claim.expectedPaise).toBe(31_500_00);
    res = await claimPost(json(`/api/v1/college/scholarships/claims/${claim.id}`, { action: "SANCTION", amountPaise: 99_999_00, on: TODAY }), params("claimId", claim.id));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("The sanction cannot be more than the fees this claim covers.");
    expect((await db.scholarshipClaim.findUniqueOrThrow({ where: { id: claim.id }, select: { status: true } })).status).toBe("APPLIED");
    res = await claimPost(json(`/api/v1/college/scholarships/claims/${claim.id}`, { action: "SANCTION", amountPaise: 31_500_00, on: TODAY }), params("claimId", claim.id));
    expect(res.status).toBe(200);
    expect(claimShownPaise({ status: "DISBURSED", receivablePaise: 0, sanctionedPaise: 31_500_00, disbursedPaise: 15_750_00 })).toBe(15_750_00);
    expect(claimShownPaise({ status: "SANCTIONED", receivablePaise: 31_500_00, sanctionedPaise: 31_500_00, disbursedPaise: null })).toBe(31_500_00);
    expect(claimShownPaise({ status: "APPLIED", receivablePaise: 14_000_00, sanctionedPaise: null, disbursedPaise: null })).toBe(14_000_00);
  }, 30_000);
});

describe("no-dues (A3-journeys-8)", () => {
  it("a line with money owed is not cleared without a note; with one it is, and the note is kept", async () => {
    await as(ids.accounts, "ACCOUNTS");
    let res = await noDuesPost(json(`/api/v1/accounts/no-dues/${ids.s2}`, { event: "EXAM_FORM", desk: "ACCOUNTS" }), params("studentMembershipId", ids.s2));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Money is still owed or items are still out on this line: write in the note why it is cleared.");
    expect(await db.noDuesClearance.count({ where: { studentMembershipId: ids.s2 } })).toBe(0);
    res = await noDuesPost(json(`/api/v1/accounts/no-dues/${ids.s2}`, { event: "EXAM_FORM", desk: "ACCOUNTS", note: "ZZ instalment plan agreed with the principal" }), params("studentMembershipId", ids.s2));
    expect(res.status).toBe(200);
    expect((await res.json()).lines.find((l: { desk: string }) => l.desk === "ACCOUNTS")).toMatchObject({ cleared: true, owedPaise: 31_500_00 });
    const row = await db.noDuesClearance.findFirstOrThrow({ where: { studentMembershipId: ids.s2 }, select: { clearsJson: true } });
    expect(JSON.parse(row.clearsJson).ACCOUNTS.note).toBe("ZZ instalment plan agreed with the principal");
  }, 30_000);
});

describe("refunds and the look-up (A3-S-15)", () => {
  it("a refund outside the slab cannot exceed what was paid on the seat; the principal's decision needs ADMISSIONS on, from any path", async () => {
    await as(ids.admin, "ADMIN");
    let res = await refundAskPost(json(`/api/v1/college/admissions/applications/${ids.application}/refund-exception`, { refundPaise: 50_000_00, reason: "ZZ the student never attended a class" }), params("applicationId", ids.application));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("The refund cannot be more than was paid on this seat.");
    res = await refundAskPost(json(`/api/v1/college/admissions/applications/${ids.application}/refund-exception`, { refundPaise: 10_000_00, reason: "ZZ the student never attended a class" }), params("applicationId", ids.application));
    expect(res.status).toBeLessThan(300);

    const principal = await as(ids.principal, "PRINCIPAL");
    await db.schoolModule.deleteMany({ where: { schoolId: ids.college, module: "ADMISSIONS" } });
    try {
      await expect(decideRefundException(principal, ids.application, { approve: true, note: "" })).rejects.toBeInstanceOf(ModuleOffError);
      expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: ids.application }, select: { refundAskStatus: true } })).refundAskStatus).toBe("ASKED");
    } finally {
      await db.schoolModule.create({ data: { schoolId: ids.college, module: "ADMISSIONS" } });
    }
  }, 30_000);

  it("the look-up reads % and _ as letters, not wildcards", async () => {
    const desk = await as(ids.accounts, "ACCOUNTS");
    expect((await lookupStudents(desk, "__")).items).toEqual([]);
    expect((await lookupStudents(desk, "%%")).items).toEqual([]);
    expect((await lookupStudents(desk, "Student1")).items.map((i) => i.studentMembershipId)).toEqual([ids.s1]);
  }, 30_000);
});

describe("the accounts desk reaches what its doors permit (A3-inventory-1, -2, -3)", () => {
  it("every fee ledger sub-page renders for ACCOUNTS (it was sent to /switch)", async () => {
    await as(ids.accounts, "ACCOUNTS");
    const pages: [string, Promise<unknown>][] = [
      ["dues", DuesPage({ searchParams: Promise.resolve({}) })],
      ["pupil", PupilFeesPage({ params: Promise.resolve({ studentMembershipId: ids.s1 }) })],
      ["structures", FeeStructuresPage({ searchParams: Promise.resolve({}) })],
      ["structure", StructurePage({ params: Promise.resolve({ structureId: ids.structure }), searchParams: Promise.resolve({}) })],
      ["new structure", NewStructurePage()],
      ["heads", FeeHeadsPage()],
      ["settings", FeeSettingsPage()],
      ["claims", ClaimsPage()],
    ];
    for (const [name, page] of pages) {
      const out = await render(page);
      expect(`${name}: ${"threw" in out ? out.threw : "rendered"}`).toBe(`${name}: rendered`);
    }
  }, 60_000);

  it("payroll and stores draw their forms for the desk, as payroll.ts and inventory.ts let it write", async () => {
    await as(ids.accounts, "ACCOUNTS");
    expect((await payrollGate()).canEdit).toBe(true);
    expect((await inventoryGate()).canEdit).toBe(true);
    await as(ids.principal, "PRINCIPAL");
    expect((await payrollGate()).canEdit).toBe(false);
    expect((await inventoryGate()).canEdit).toBe(false);
  }, 30_000);

  it("an application's page draws the admission fee and the refund forms for the desk and none of the registrar's; the refunds page renders; the gate lets it through", async () => {
    await as(ids.accounts, "ACCOUNTS");
    const feeDue = await render(ApplicationPage(sp({ applicationId: ids.feeDue })));
    expect("tree" in feeDue).toBe(true);
    expect(actionsIn((feeDue as { tree: unknown }).tree)).toEqual(["admissionFeeAction"]);
    const cancelled = await render(ApplicationPage(sp({ applicationId: ids.application })));
    expect(actionsIn((cancelled as { tree: unknown }).tree)).toEqual(["refundAction"]);
    expect("tree" in (await render(RefundsPage({ searchParams: Promise.resolve({}) })))).toBe(true);
    // The registrar still sees the whole seat card.
    await as(ids.admin, "ADMIN");
    expect(actionsIn(((await render(ApplicationPage(sp({ applicationId: ids.feeDue })))) as { tree: unknown }).tree)).toEqual(expect.arrayContaining(["admissionFeeAction", "cancelAdmissionAction"]));
    for (const path of ["/admin/college-admissions/refunds", `/admin/college-admissions/${ids.application}`, "/admin/fees/dues", "/admin/fees/structures/new", "/admin/payroll/salaries", "/admin/inventory/items"]) {
      expect(`${path} ${modulePagePermitted("ACCOUNTS", path, ["ADMISSIONS", "PAYROLL", "INVENTORY"])}`).toBe(`${path} true`);
    }
    expect(modulePagePermitted("ACCOUNTS", `/admin/college-admissions/${ids.application}`, [])).toBe(false);
  }, 60_000);
});
