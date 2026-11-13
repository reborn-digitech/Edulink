/**
 * TA-004 (testing analysis of 13 November 2026, High), beyond the regression
 * suite tests/ta-concession-before-demands.test.ts: the two other ways a
 * concession could come to take more than the office's limit without the
 * principal.
 *
 *   - A student with no demand, no plan and no published structure their
 *     standing calls for: the concession cannot be valued, so it waits for
 *     the principal however small it looks.
 *   - A concession the office applied on its own word, within the limit on a
 *     cheap structure, takes four times the limit once the student is moved
 *     to a dearer one. The rewrite of the demands (regenerateDemands) sends it
 *     back to the principal, takes it off the demands and writes its audit
 *     row; once the principal approves, it is applied and stays approved
 *     through the next rewrite.
 *
 * A scratch ZZ college of this suite's own (its stamp in every name and
 * address): a year, a programme, a tuition head, two published structures of
 * two terms (OPEN at Rs 12,500 a term, EWS at Rs 50,000 a term), two
 * students, an accounts desk and a principal. Removed with the college.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { decideConcession, grantCollegeConcession, raiseDemands } from "@/lib/college-fees";
import { assignPlansAs } from "@/lib/fees";
import { POST as structuresPost } from "@/app/api/v1/accounts/fee-structures/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-hrb-ta004-${who}-${STAMP}@test.invalid`;
const CHEAP = 1_250_000; // Rs 12,500 a term
const DEAR = 5_000_000; // Rs 50,000 a term
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who} as ${role}`);
  return session;
}

async function person(who: string, role: string, name: string, extra: object = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function structure(category: string, perTerm: number): Promise<string> {
  await as("accounts", "ACCOUNTS");
  const res = await structuresPost(
    new Request("http://localhost/api/v1/accounts/fee-structures", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ programmeId: ids.programme, yearOfStudy: 1, category, approvalRef: `ZZ/FRA/${category}`, name: `ZZ HRB TA004 FY ${category}`, terms: [{ label: "ZZ Odd", dueDateKey: "2026-07-15", lines: [{ headId: ids.tuition, amountPaise: perTerm }] }, { label: "ZZ Even", dueDateKey: "2026-12-15", lines: [{ headId: ids.tuition, amountPaise: perTerm }] }], lateFeeSlabs: [] }),
    }),
  );
  if (res.status !== 200) throw new Error(`the ${category} structure was refused: ${res.status} ${await res.text()}`);
  return (await db.feeStructure.findFirstOrThrow({ where: { schoolId: ids.college, category }, select: { id: true } })).id;
}

const demandsOf = (who: string) => db.feeDemand.findMany({ where: { studentMembershipId: ids[`${who}M`] }, orderBy: { dueDate: "asc" }, select: { grossPaise: true, netPaise: true } });
const concession = (id: string) => db.feeConcession.findUniqueOrThrow({ where: { id }, select: { approvalStatus: true, approvedByUserId: true } });

let unvalued: { approvalStatus: string } = { approvalStatus: "" };
let granted: { id: string; approvalStatus: string; valuePaise: number } = { id: "", approvalStatus: "", valuePaise: -1 };
let onCheap: Awaited<ReturnType<typeof demandsOf>> = [];
let afterMove: { concession: Awaited<ReturnType<typeof concession>>; demands: Awaited<ReturnType<typeof demandsOf>>; audits: number } | null = null;
let afterApproval: { concession: Awaited<ReturnType<typeof concession>>; demands: Awaited<ReturnType<typeof demandsOf>> } | null = null;

beforeAll(async () => {
  const college = await db.school.create({ data: { name: `ZZ HRB TA004 College ${STAMP}`, slug: `zz-hrb-ta004-${STAMP}`, code: `ZZHRB4${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } });
  ids.college = college.id;
  await db.schoolModule.create({ data: { schoolId: college.id, module: "ACADEMICS" } });
  await person("accounts", "ACCOUNTS", "ZZ HRB TA004 Accounts");
  await person("principal", "PRINCIPAL", "ZZ HRB TA004 Principal");
  const adult = { isMinor: false, birthdate: new Date("2006-01-01T00:00:00Z") };
  await person("nri", "STUDENT", "ZZ HRB TA004 No Structure", adult);
  await person("moved", "STUDENT", "ZZ HRB TA004 Moved", adult);
  ids.year = (await db.academicYear.create({ data: { schoolId: college.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const dept = await db.department.create({ data: { schoolId: college.id, code: "MAT", name: "ZZ HRB TA004 Maths" }, select: { id: true } });
  ids.programme = (await db.programme.create({ data: { schoolId: college.id, departmentId: dept.id, code: "BSCMAT", name: "ZZ HRB TA004 BSc Maths", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  ids.tuition = (await db.feeHead.create({ data: { schoolId: college.id, name: "ZZ HRB TA004 Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  await db.programmeEnrolment.createMany({
    data: [
      { schoolId: college.id, studentMembershipId: ids.nriM!, programmeId: ids.programme, yearOfEntry: 2026, category: "NRI", quota: "INSTITUTE" },
      { schoolId: college.id, studentMembershipId: ids.movedM!, programmeId: ids.programme, yearOfEntry: 2026, category: "OPEN", quota: "CAP" },
    ],
  });
  ids.cheap = await structure("OPEN", CHEAP);
  ids.dear = await structure("EWS", DEAR);

  // No demand, no plan, no NRI structure: a Rs 1,000 concession cannot be valued.
  unvalued = await grantCollegeConcession(await as("accounts", "ACCOUNTS"), { studentMembershipId: ids.nriM!, headId: null, kind: "AMOUNT", value: 100_000, reason: "ZZ hardship", authority: "ZZ Governing body" });

  // On the cheap structure, 20 % is Rs 5,000 for the year: the limit exactly, the office's to apply.
  await raiseDemands(await as("accounts", "ACCOUNTS"), {});
  granted = await grantCollegeConcession(await as("accounts", "ACCOUNTS"), { studentMembershipId: ids.movedM!, headId: null, kind: "PERCENT", value: 2000, reason: "ZZ merit", authority: "ZZ Governing body" });
  onCheap = await demandsOf("moved");

  // Moved to the dear structure: 20 % is now Rs 20,000.
  const accounts = await as("accounts", "ACCOUNTS");
  await assignPlansAs({ schoolId: ids.college!, userId: accounts.user.id, role: "ACCOUNTS", membershipId: accounts.membershipId }, { structureId: ids.dear!, studentMembershipIds: [ids.movedM!] });
  afterMove = {
    concession: await concession(granted.id),
    demands: await demandsOf("moved"),
    audits: await db.auditLog.count({ where: { schoolId: ids.college, action: "college.fees.concessionBackToPrincipal", targetId: ids.movedM } }),
  };

  // The principal approves; the next rewrite leaves the principal's word as it is.
  await decideConcession(await as("principal", "PRINCIPAL"), granted.id, { approve: true });
  await assignPlansAs({ schoolId: ids.college!, userId: accounts.user.id, role: "ACCOUNTS", membershipId: accounts.membershipId }, { structureId: ids.dear!, studentMembershipIds: [ids.movedM!] });
  afterApproval = { concession: await concession(granted.id), demands: await demandsOf("moved") };
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-004: no concession takes more than the limit on the office's word alone", () => {
  it("TA-004: a concession for a student with no demand, no plan and no structure for their standing waits for the principal", () => {
    expect(unvalued.approvalStatus).toBe("PENDING");
  });

  it("TA-004: on the cheap structure 20 % is worth the limit exactly and is applied by the office", () => {
    expect({ status: granted.approvalStatus, worth: granted.valuePaise }).toEqual({ status: "APPROVED", worth: 500_000 });
    expect(onCheap.map((d) => [d.grossPaise, d.netPaise])).toEqual([[CHEAP, CHEAP - 250_000], [CHEAP, CHEAP - 250_000]]);
  });

  it("TA-004: moved to the dear structure, the office's concession goes back to the principal and comes off the demands, with its audit row", () => {
    expect(afterMove).toEqual({ concession: { approvalStatus: "PENDING", approvedByUserId: null }, demands: [{ grossPaise: DEAR, netPaise: DEAR }, { grossPaise: DEAR, netPaise: DEAR }], audits: 1 });
  });

  it("TA-004: approved by the principal it is applied, and the next rewrite keeps it approved", () => {
    expect(afterApproval).toEqual({ concession: { approvalStatus: "APPROVED", approvedByUserId: ids.principal }, demands: [{ grossPaise: DEAR, netPaise: DEAR - 1_000_000 }, { grossPaise: DEAR, netPaise: DEAR - 1_000_000 }] });
  });
});
