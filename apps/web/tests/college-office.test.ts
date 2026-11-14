/**
 * The college office (4 October 2026): admissions from the CET Cell's
 * rounds, fee structures by category, scholarships on the ledger, no-dues,
 * the bulletin's college audiences, the adult boarder's leave, and the
 * module and kind gates — through the /api/v1 doors with primed sessions at
 * three ZZ institutions of this suite's own: College (every module the office
 * needs on), Bare (a college with ADMISSIONS and SCHOLARSHIPS off) and School
 * (a school, where somebody made an ACCOUNTS member by hand).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { refundFor, requiredDocuments, scrutinyComplete } from "@/lib/college-admissions";
import { ledgerFor } from "@/lib/college-fees";
import { noDuesFor } from "@/lib/no-dues";
import { createPost, listFeed } from "@/lib/bulletin";
import { requestLeave } from "@/lib/hostel";
import { GET as roundsGet, POST as roundsPost } from "@/app/api/v1/college/admissions/rounds/route";
import { POST as importPost } from "@/app/api/v1/college/admissions/rounds/[roundId]/import/route";
import { GET as vacancyGet } from "@/app/api/v1/college/admissions/rounds/[roundId]/vacancy/route";
import { POST as appsPost } from "@/app/api/v1/college/admissions/applications/route";
import { POST as docPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/documents/route";
import { POST as undertakingPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/undertaking/route";
import { POST as offerPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/offer/route";
import { POST as feePost } from "@/app/api/v1/college/admissions/applications/[applicationId]/fee/route";
import { POST as admitPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/admit/route";
import { POST as supernumeraryPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/supernumerary/route";
import { POST as structuresPost } from "@/app/api/v1/accounts/fee-structures/route";
import { POST as raisePost } from "@/app/api/v1/accounts/demands/raise/route";
import { POST as concessionPost } from "@/app/api/v1/accounts/concessions/route";
import { POST as decidePost } from "@/app/api/v1/accounts/concessions/[concessionId]/decide/route";
import { GET as claimsGet, POST as claimsPost } from "@/app/api/v1/college/scholarships/claims/route";
import { POST as claimPost } from "@/app/api/v1/college/scholarships/claims/[claimId]/route";
import { GET as myLedgerGet } from "@/app/api/v1/student/ledger/route";
import { GET as overviewGet } from "@/app/api/v1/accounts/overview/route";
import { GET as noDuesGet, POST as noDuesPost } from "@/app/api/v1/accounts/no-dues/[studentMembershipId]/route";
import { GET as feeOverviewGet } from "@/app/api/v1/fees/overview/route";
import { POST as schoolConcessionPost } from "@/app/api/v1/fees/concessions/route";
import { GET as familyFeesGet } from "@/app/api/v1/fees/family/route";
import { POST as counterPost } from "@/app/api/v1/fees/payments/route";
import { POST as reversePost } from "@/app/api/v1/fees/payments/[paymentId]/reverse/route";
import { GET as receiptGet } from "@/app/api/v1/fees/receipts/[receiptId]/route";
import { GET as familyCertRequestsGet, POST as familyCertRequestsPost } from "@/app/api/v1/family/certificate-requests/route";
// A grant is one guardian's since TA-555 (14 November 2026): "the student grants X" is to each family guardian linked to them.
import { grantToGuardians } from "./consent-grants";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { college: "", bare: "", school: "", admin: "", principal: "", accounts: "", librarian: "", bareAdmin: "", schoolAccounts: "", parent: "", s1: "", s2: "", s1User: "", s2User: "", year: "", programme: "", programme2: "", scheme: "", dept: "", tui: "", cau: "", lib: "", hostel: "", room: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(userId: string, schoolId: string | null, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
}
async function ctxAs(userId: string, schoolId: string | null, role: string) {
  await as(userId, schoolId, role);
  return (await getSession())!;
}

beforeAll(async () => {
  const mk = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Office ${tag} ${STAMP}`, slug: `zz-office-${tag.toLowerCase()}-${STAMP}`, code: `ZO${tag[0]}${SUFFIX}`, contactEmail: `zz-office-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  ids.college = (await mk("College", "COLLEGE")).id;
  ids.bare = (await mk("Bare", "COLLEGE")).id;
  ids.school = (await mk("School", "SCHOOL")).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "ADMISSIONS", "SCHOLARSHIPS", "LIBRARY", "HOSTEL"].map((module) => ({ schoolId: ids.college, module })).concat([{ schoolId: ids.bare, module: "ACADEMICS" }]) });
  const user = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Office ${who}`, email: `zz-office-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, principal, accounts, librarian, bareAdmin, schoolAccounts, parent, u1, u2] = await Promise.all([user("Admin"), user("Principal"), user("Accounts"), user("Librarian"), user("BareAdmin"), user("SchoolAccounts"), user("Parent"), user("Student1", { isMinor: false, birthdate: new Date("2006-01-01T00:00:00Z") }), user("Student2", { isMinor: false, birthdate: new Date("2006-02-01T00:00:00Z") })]);
  Object.assign(ids, { admin: admin.id, principal: principal.id, accounts: accounts.id, librarian: librarian.id, bareAdmin: bareAdmin.id, schoolAccounts: schoolAccounts.id, parent: parent.id, s1User: u1.id, s2User: u2.id });
  await db.membership.createMany({
    data: [
      { userId: admin.id, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" },
      { userId: principal.id, schoolId: ids.college, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: accounts.id, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" },
      { userId: librarian.id, schoolId: ids.college, role: "LIBRARIAN", status: "ACTIVE" },
      { userId: bareAdmin.id, schoolId: ids.bare, role: "ADMIN", status: "ACTIVE" },
      // Made by hand: a school is never offered ACCOUNTS (invitableRolesFor).
      { userId: schoolAccounts.id, schoolId: ids.school, role: "ACCOUNTS", status: "ACTIVE" },
    ],
  });
  ids.s1 = (await db.membership.create({ data: { userId: u1.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZOS1${STAMP}` }, select: { id: true } })).id;
  ids.s2 = (await db.membership.create({ data: { userId: u2.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZOS2${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.s1, studentSchoolId: ids.college, status: "ACTIVE" } });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.dept = (await db.department.create({ data: { schoolId: ids.college, code: `ZP${SUFFIX}`, name: "ZZ Physics" }, select: { id: true } })).id;
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college, departmentId: ids.dept, code: "BSCPHY", name: "ZZ BSc Physics", level: "UG", durationYears: 4, regulator: "UGC" }, select: { id: true } })).id;
  ids.programme2 = (await db.programme.create({ data: { schoolId: ids.college, departmentId: ids.dept, code: "BSCCHE", name: "ZZ BSc Chemistry", level: "UG", durationYears: 4, regulator: "UGC" }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: ids.college, programmeId: ids.programme, name: "ZZ 2026 scheme", effectiveYear: 2026 }, select: { id: true } })).id;
  const head = (code: string, kind: string) => db.feeHead.create({ data: { schoolId: ids.college, name: `ZZ ${code}`, code, kind }, select: { id: true } });
  ids.tui = (await head("TUI", "TUITION")).id;
  ids.cau = (await head("CAU", "CAUTION_DEPOSIT")).id;
  // Two enrolled students: s1 OBC, s2 OPEN, both in BSc Physics from 2026.
  await db.programmeEnrolment.createMany({ data: [{ schoolId: ids.college, studentMembershipId: ids.s1, programmeId: ids.programme, yearOfEntry: 2026, category: "OBC", quota: "CAP" }, { schoolId: ids.college, studentMembershipId: ids.s2, programmeId: ids.programme, yearOfEntry: 2026, category: "OPEN", quota: "CAP" }] });
  await db.pupilRecord.create({ data: { schoolId: ids.college, studentMembershipId: ids.s1, annualIncome: 90_000 } });
  // A hostel with a bed for the adult s2.
  ids.hostel = (await db.hostel.create({ data: { schoolId: ids.college, name: `ZZ Office Hostel ${STAMP}`, kind: "MIXED" }, select: { id: true } })).id;
  ids.room = (await db.hostelRoom.create({ data: { schoolId: ids.college, hostelId: ids.hostel, number: "1", beds: 2 }, select: { id: true } })).id;
  await db.hostelAllotment.create({ data: { schoolId: ids.college, membershipId: ids.s2, roomId: ids.room, bed: 1, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: ids.s2, activeBedKey: `${ids.room}:1`, allottedByUserId: admin.id } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.college, ids.bare, ids.school] } } });
  const admittedUsers = await db.membership.findMany({ where: { schoolId: ids.college, role: "STUDENT", id: { notIn: [ids.s1, ids.s2] } }, select: { userId: true } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.bare, ids.school] } } });
  await db.uploadTicket.deleteMany({ where: { fileId: { endsWith: `-${STAMP}` } } });
  await db.user.deleteMany({ where: { OR: [{ email: { contains: `-${STAMP}@test.invalid` } }, { id: { in: admittedUsers.map((u) => u.userId) } }] } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("answers MODULE_OFF for ADMISSIONS and SCHOLARSHIPS at a college that has them off, at the door and at the gate", async () => {
    await as(ids.bareAdmin, ids.bare, "ADMIN");
    const rounds = await roundsGet();
    expect(rounds.status).toBe(403);
    expect((await body(rounds)).code).toBe("MODULE_OFF");
    const claims = await claimsGet(get("/api/v1/college/scholarships/claims"));
    expect(claims.status).toBe(403);
    expect((await body(claims)).code).toBe("MODULE_OFF");
    await expect(gateRequest("GET /api/v1/college/admissions/rounds", { role: "ADMIN", schoolId: ids.bare })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/college/scholarships/claims", { role: "ACCOUNTS", schoolId: ids.bare })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/accounts/overview", { role: "ACCOUNTS", schoolId: ids.college })).resolves.toBe("pass");
  });

  it("gives an ACCOUNTS member at a school nothing college — the desk's doors answer 403 MODULE_OFF, the module gate's answer (W-17) — while the role still keeps the fee ledger", async () => {
    await as(ids.schoolAccounts, ids.school, "ACCOUNTS");
    const overview = await overviewGet();
    expect(overview.status).toBe(403);
    expect((await body(overview)).code).toBe("MODULE_OFF");
    const raise = await raisePost(json("/api/v1/accounts/demands/raise", {}));
    expect(raise.status).toBe(403);
    expect((await body(raise)).code).toBe("MODULE_OFF");
    expect((await feeOverviewGet()).status).not.toBe(403);
    // ACCOUNTS is limited: a door that does not name it refuses before the body.
    await expect(gateRequest("GET /api/v1/library/titles", { role: "ACCOUNTS", schoolId: ids.college })).rejects.toThrow();
  });

  it("refuses the wrong role before the body: a librarian cannot open a round", async () => {
    await as(ids.librarian, ids.college, "LIBRARIAN");
    expect((await roundsPost(json("/api/v1/college/admissions/rounds", {}))).status).toBe(403);
  });
});

describe("fee structures by category, and the ledger", () => {
  it("raises each student's demands from their category's structure, and a second run changes nothing", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    const terms = (tui: number) => [
      { label: "ZZ Odd", dueDateKey: "2026-07-15", lines: [{ headId: ids.tui, amountPaise: tui }, { headId: ids.cau, amountPaise: 200_000 }] },
      { label: "ZZ Even", dueDateKey: "2026-12-15", lines: [{ headId: ids.tui, amountPaise: tui }] },
    ];
    for (const [category, tui] of [["OPEN", 1_250_000], ["OBC", 625_000]] as const) {
      const res = await structuresPost(json("/api/v1/accounts/fee-structures", { programmeId: ids.programme, yearOfStudy: 1, category, approvalRef: "ZZ/FRA/0042", name: `ZZ FY ${category}`, terms: terms(tui), lateFeeSlabs: [{ afterDays: 15, paise: 50_000 }] }));
      expect(res.status).toBe(200);
    }
    // The same programme, year and category twice is refused.
    expect((await structuresPost(json("/api/v1/accounts/fee-structures", { programmeId: ids.programme, yearOfStudy: 1, category: "OPEN", approvalRef: "ZZ/FRA/0043", name: "ZZ again", terms: terms(1), lateFeeSlabs: [] }))).status).toBe(403);
    const first = await body<{ assigned: number; unchanged: number }>(await raisePost(json("/api/v1/accounts/demands/raise", {})));
    expect(first.assigned).toBe(2);
    const again = await body<{ assigned: number; unchanged: number }>(await raisePost(json("/api/v1/accounts/demands/raise", {})));
    expect(again).toMatchObject({ assigned: 0, unchanged: 2 });
    const s1 = await db.feeDemand.findMany({ where: { studentMembershipId: ids.s1 }, orderBy: { dueDate: "asc" }, select: { netPaise: true } });
    const s2 = await db.feeDemand.findMany({ where: { studentMembershipId: ids.s2 }, orderBy: { dueDate: "asc" }, select: { netPaise: true } });
    expect(s1.map((d) => d.netPaise)).toEqual([825_000, 625_000]);
    expect(s2.map((d) => d.netPaise)).toEqual([1_450_000, 1_250_000]);
  });

  it("holds a concession above the office's limit for the principal, and applies it when approved", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    const res = await body<{ id: string; approvalStatus: string }>(await concessionPost(json("/api/v1/accounts/concessions", { studentMembershipId: ids.s2, headId: ids.tui, kind: "PERCENT", value: 5000, reason: "ZZ merit", authority: "ZZ Governing body" })));
    expect(res.approvalStatus).toBe("PENDING");
    expect((await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: ids.s2 }, orderBy: { dueDate: "asc" } })).netPaise).toBe(1_450_000);
    // The accounts desk cannot decide it; the principal can.
    expect((await decidePost(json("/x", { approve: true }), params("concessionId", res.id))).status).toBe(403);
    await as(ids.principal, ids.college, "PRINCIPAL");
    expect((await body(await decidePost(json("/x", { approve: true }), params("concessionId", res.id)))).approvalStatus).toBe("APPROVED");
    expect((await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: ids.s2 }, orderBy: { dueDate: "asc" } })).netPaise).toBe(1_450_000 - 625_000);
  });

  it("never lets the person who granted a held concession approve it too (four eyes, A3-S-4)", async () => {
    // A principal who also holds the office's role granted it: the row as such a person's grant writes it.
    const own = await db.feeConcession.create({ data: { schoolId: ids.college, studentMembershipId: ids.s2, academicYearId: ids.year, headId: ids.tui, kind: "PERCENT", value: 100, reason: "ZZ own grant", grantedByUserId: ids.principal, approvalStatus: "PENDING" }, select: { id: true } });
    await as(ids.principal, ids.college, "PRINCIPAL");
    expect((await decidePost(json("/x", { approve: true }), params("concessionId", own.id))).status).toBe(403);
    expect((await db.feeConcession.findUniqueOrThrow({ where: { id: own.id }, select: { approvalStatus: true } })).approvalStatus).toBe("PENDING");
    await db.feeConcession.delete({ where: { id: own.id } });
  });

  it("refuses the school's concession door at a college, for ACCOUNTS and ADMIN alike: it has no limit and no principal (campaign S-1)", async () => {
    const before = await db.feeConcession.count({ where: { schoolId: ids.college } });
    for (const [userId, role] of [[ids.accounts, "ACCOUNTS"], [ids.admin, "ADMIN"]] as const) {
      await as(userId, ids.college, role);
      const res = await schoolConcessionPost(json("/api/v1/fees/concessions", { studentMembershipId: ids.s2, kind: "PERCENT", value: 10000, reason: "ZZ the whole fee" }));
      expect(res.status).toBe(403);
      expect((await body(res)).error).toContain("Accounts");
    }
    expect(await db.feeConcession.count({ where: { schoolId: ids.college } })).toBe(before);
    expect((await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: ids.s2 }, orderBy: { dueDate: "asc" } })).netPaise).toBe(1_450_000 - 625_000);
  });

  it("shows the family what it owes net of the state's share, and a lapse puts it back with a notification", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    // s2 is OPEN: an OBC scheme is not open to her.
    expect((await claimsPost(json("/api/v1/college/scholarships/claims", { studentMembershipId: ids.s2, scheme: "OBC_POST_MATRIC" }))).status).toBe(403);
    const claim = await body<{ id: string; expectedPaise: number }>(await claimsPost(json("/api/v1/college/scholarships/claims", { studentMembershipId: ids.s1, scheme: "OBC_POST_MATRIC", portalApplicationId: "ZZMDBT0001" })));
    // The scheme covers the tuition (the caution deposit is no head a scholarship pays).
    expect(claim.expectedPaise).toBe(1_250_000);
    // The same student, scheme and year again is the same claim.
    expect((await body(await claimsPost(json("/api/v1/college/scholarships/claims", { studentMembershipId: ids.s1, scheme: "OBC_POST_MATRIC" })))).id).toBe(claim.id);
    expect((await body(await claimPost(json("/x", { action: "SANCTION", amountPaise: 1_000_000, on: "2026-09-15" }), params("claimId", claim.id)))).status).toBe("SANCTIONED");
    const before = await ledgerFor(ids.s1, ids.year);
    expect(before.totals).toMatchObject({ demandPaise: 1_450_000, scholarshipReceivablePaise: 1_000_000, paidPaise: 0, netDuePaise: 450_000 });
    // The receivable is set against the earliest demand first.
    expect(before.terms[0]).toMatchObject({ demandPaise: 825_000, scholarshipReceivablePaise: 825_000, netDuePaise: 0 });
    // The student reads the same ledger.
    await as(ids.s1User, ids.college, "STUDENT");
    expect((await body<{ totals: { netDuePaise: number } }>(await myLedgerGet(get("/api/v1/student/ledger")))).totals.netDuePaise).toBe(450_000);
    await as(ids.accounts, ids.college, "ACCOUNTS");
    expect((await body(await claimPost(json("/x", { action: "LAPSE", reason: "ZZ portal deadline missed" }), params("claimId", claim.id)))).status).toBe("LAPSED");
    const after = await ledgerFor(ids.s1, ids.year);
    expect(after.totals).toMatchObject({ scholarshipReceivablePaise: 0, netDuePaise: 1_450_000 });
    const told = await db.notification.findFirst({ where: { userId: ids.s1User, schoolId: ids.college, title: { contains: "lapsed" } }, select: { body: true } });
    expect(told?.body).toContain("10000");
  });
});

describe("a guardian's view of an adult's money", () => {
  it("the older family doors ask for MONEY too: fees, a receipt and its notice, and certificate requests are the adult's (campaign S-2)", async () => {
    await as(ids.accounts, ids.college, "ACCOUNTS");
    const paid = await body<{ paymentId: string; receiptId: string }>(await counterPost(json("/api/v1/fees/payments", { studentMembershipId: ids.s1, amountPaise: 100, method: "CASH", clientId: `zz-s2-${STAMP}` })));
    expect(paid.receiptId).toBeTruthy();
    // No notice of the payment to a guardian the student has not let see their money.
    expect(await db.notification.count({ where: { userId: ids.parent, kind: "FEES" } })).toBe(0);
    await as(ids.parent, null, "PARENT");
    expect((await familyFeesGet(get(`/api/v1/fees/family?childId=${ids.s1}`))).status).toBe(403);
    const unnamed = await body<{ children: { studentMembershipId: string }[]; child: unknown }>(await familyFeesGet(get("/api/v1/fees/family")));
    expect(unnamed.children.map((c) => c.studentMembershipId)).not.toContain(ids.s1);
    expect(unnamed.child).toBeNull();
    expect((await receiptGet(get(`/api/v1/fees/receipts/${paid.receiptId}`), params("receiptId", paid.receiptId))).status).toBe(404);
    expect((await familyCertRequestsGet(get(`/api/v1/family/certificate-requests?childId=${ids.s1}`))).status).toBe(403);
    expect((await familyCertRequestsGet(get("/api/v1/family/certificate-requests"))).status).toBe(403);
    expect((await familyCertRequestsPost(json(`/api/v1/family/certificate-requests?childId=${ids.s1}`, { kind: "BONAFIDE", purpose: "ZZ bank account" }))).status).toBe(403);
    expect(await db.certificateRequest.count({ where: { studentMembershipId: ids.s1 } })).toBe(0);
    // Granted, the money doors open (the next test reads the ledger); certificate papers stay the adult's.
    await grantToGuardians(db, ids.college, ids.s1, "MONEY");
    expect((await familyFeesGet(get(`/api/v1/fees/family?childId=${ids.s1}`))).status).toBe(200);
    expect((await receiptGet(get(`/api/v1/fees/receipts/${paid.receiptId}`), params("receiptId", paid.receiptId))).status).toBe(200);
    await db.studentConsent.deleteMany({ where: { studentMembershipId: ids.s1, grant: "MONEY" } });
    await as(ids.accounts, ids.college, "ACCOUNTS");
    expect((await reversePost(json("/x", { reason: "ZZ test payment" }), params("paymentId", paid.paymentId))).status).toBe(200);
  });

  it("is refused until the student grants MONEY, then reads the same ledger under the child's college", async () => {
    await as(ids.parent, null, "PARENT");
    expect((await myLedgerGet(get(`/api/v1/student/ledger?childId=${ids.s1}`))).status).toBe(403);
    await grantToGuardians(db, ids.college, ids.s1, "MONEY");
    const res = await myLedgerGet(get(`/api/v1/student/ledger?childId=${ids.s1}`));
    expect(res.status).toBe(200);
    expect((await body<{ totals: { demandPaise: number } }>(res)).totals.demandPaise).toBe(1_450_000);
  });
});

describe("no-dues", () => {
  it("lists a desk's open line, which the exam form reads, until the desk clears it — and a new due reopens it", async () => {
    // s2 owes the library a counter fine.
    const title = await db.libraryTitle.create({ data: { schoolId: ids.college, title: "ZZ Office Book" }, select: { id: true } });
    const copy = await db.libraryCopy.create({ data: { schoolId: ids.college, titleId: title.id, accession: `ZZO-${SUFFIX}` }, select: { id: true } });
    const member = await db.libraryMember.create({ data: { schoolId: ids.college, membershipId: ids.s2, kind: "STUDENT_COLLEGE", cardNumber: `LZO${SUFFIX}` }, select: { id: true } });
    const issue = await db.libraryIssue.create({ data: { schoolId: ids.college, copyId: copy.id, memberId: member.id, dueOn: "2026-08-01", returnedAt: new Date(), issuedByUserId: ids.admin }, select: { id: true } });
    await db.libraryFine.create({ data: { schoolId: ids.college, issueId: issue.id, memberId: member.id, paise: 500, reason: "OVERDUE", raisedByUserId: ids.admin } });
    const form = await noDuesFor(ids.s2, "EXAM_FORM");
    expect(form.completed).toBe(false);
    expect(form.lines.find((l) => l.desk === "LIBRARY")).toMatchObject({ owedPaise: 500, cleared: false });
    // Fees are owed too, and the hostel line appears for a boarder.
    expect(form.lines.find((l) => l.desk === "ACCOUNTS")?.cleared).toBe(false);
    expect(form.lines.map((l) => l.desk).sort()).toEqual(["ACCOUNTS", "HOSTEL", "LIBRARY"]);
    // The accounts desk cannot clear the library's line; the librarian can; the accounts desk clears its own.
    await as(ids.accounts, ids.college, "ACCOUNTS");
    expect((await noDuesPost(json("/x", { event: "EXAM_FORM", desk: "LIBRARY" }), params("studentMembershipId", ids.s2))).status).toBe(403);
    // A line with something owed is cleared with a note saying why (A3-journeys-8).
    expect((await noDuesPost(json("/x", { event: "EXAM_FORM", desk: "ACCOUNTS" }), params("studentMembershipId", ids.s2))).status).toBe(403);
    expect((await noDuesPost(json("/x", { event: "EXAM_FORM", desk: "ACCOUNTS", note: "ZZ fees deferred by the principal" }), params("studentMembershipId", ids.s2))).status).toBe(200);
    await as(ids.librarian, ids.college, "LIBRARIAN");
    const cleared = await body<{ completed: boolean }>(await noDuesPost(json("/x", { event: "EXAM_FORM", desk: "LIBRARY", note: "ZZ fine paid at the counter" }), params("studentMembershipId", ids.s2)));
    expect(cleared.completed).toBe(true);
    expect((await noDuesFor(ids.s2, "EXAM_FORM")).completed).toBe(true);
    expect((await db.noDuesClearance.findFirstOrThrow({ where: { studentMembershipId: ids.s2, event: "EXAM_FORM" } })).completedAt).not.toBeNull();
    // A new fine afterwards reopens the library's line.
    await db.libraryFine.create({ data: { schoolId: ids.college, issueId: issue.id, memberId: member.id, paise: 3000, reason: "DAMAGE", raisedByUserId: ids.admin } });
    expect((await noDuesFor(ids.s2, "EXAM_FORM")).completed).toBe(false);
    // Leaving the hostel asks the hostel alone, and the bed is out.
    const exit = await noDuesFor(ids.s2, "HOSTEL_EXIT");
    expect(exit.lines).toEqual([expect.objectContaining({ desk: "HOSTEL", itemsOut: 1, cleared: false })]);
    await as(ids.accounts, ids.college, "ACCOUNTS");
    expect((await noDuesGet(get(`/x?event=LEAVING`), params("studentMembershipId", ids.s2))).status).toBe(200);
  });

  it("an exam form counts only the instalments already due; leaving counts every one (LIFECYCLE-3)", async () => {
    const u = await db.user.create({ data: { name: "ZZ Office Student3", email: `zz-office-student3-${STAMP}@test.invalid`, isMinor: false, birthdate: new Date("2006-03-01T00:00:00Z") }, select: { id: true } });
    const s3 = (await db.membership.create({ data: { userId: u.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZOS3${STAMP}` }, select: { id: true } })).id;
    const day = (offset: number) => new Date(`${new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)}T00:00:00.000Z`);
    const demand = (label: string, dueDate: Date, paid: boolean) => db.feeDemand.create({ data: { schoolId: ids.college, studentMembershipId: s3, academicYearId: ids.year, label, dueDate, grossPaise: 600_000, netPaise: 600_000, paidPaise: paid ? 600_000 : 0, status: paid ? "PAID" : "OPEN" }, select: { id: true } });
    const odd = await demand("ZZ odd semester", day(-100), true);
    await demand("ZZ even semester", day(60), false);
    // The odd semester is paid and the even one is not yet due: nothing is owed today.
    const form = await noDuesFor(s3, "EXAM_FORM");
    expect(form.lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 0, cleared: true });
    expect(form.completed).toBe(true);
    // Leaving the college still asks for every instalment.
    expect((await noDuesFor(s3, "LEAVING")).lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 600_000, cleared: false });
    // An instalment past its date and unpaid stops the form, for its own amount only.
    await db.feeDemand.update({ where: { id: odd.id }, data: { paidPaise: 100_000, status: "PART" } });
    const owing = await noDuesFor(s3, "EXAM_FORM");
    expect(owing.lines.find((l) => l.desk === "ACCOUNTS")).toMatchObject({ owedPaise: 500_000, cleared: false });
    // Due today counts as due.
    await db.feeDemand.update({ where: { id: odd.id }, data: { paidPaise: 600_000, status: "PAID" } });
    await demand("ZZ due today", day(0), false);
    expect((await noDuesFor(s3, "EXAM_FORM", new Date(Date.now()))).lines.find((l) => l.desk === "ACCOUNTS")?.owedPaise).toBe(600_000);
  });
});

describe("admissions", () => {
  let roundId = "";
  it("imports the CET Cell's list once: the same list again adds nothing", async () => {
    await as(ids.admin, ids.college, "ADMIN");
    // A round takes no list after its closing day (TA-572): this one closes sixty days from today.
    const closesOn = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
    roundId = (await body<{ id: string }>(await roundsPost(json("/api/v1/college/admissions/rounds", { programmeId: ids.programme, intakeYear: 2026, kind: "CAP_1", name: "ZZ CAP 1", opensOn: "2026-06-20", closesOn, seats: { OPEN: 2, OBC: 1 } })))).id;
    const sheet = ["Sr. No.,Application ID,Name,Gender,Category,Seat Type,Choice Code,Merit No", "1,ZZEN0001,ZZ Asha Rao,F,OPEN,GOPENS,BSCPHY,101", "2,ZZEN0002,ZZ Vikram Pai,M,OBC,GOBCS,BSCPHY,140", "3,ZZEN0003,ZZ Neel Sen,M,NT2,GNT2S,616BSCPHY,151", "4,ZZEN0004,Z,M,OPEN,GOPENS,BSCPHY,160", "5,ZZEN0005,ZZ Mira Das,F,KSHATRIYA,GOPENS,BSCPHY,170"].join("\n");
    const first = await body<{ added: number; already: number; refused: { reason: string }[] }>(await importPost(json("/x", { text: sheet }), params("roundId", roundId)));
    expect(first.added).toBe(3);
    expect(first.refused.map((r) => r.reason).sort()).toEqual(["category", "name"]);
    const again = await body<{ added: number; already: number }>(await importPost(json("/x", { text: sheet }), params("roundId", roundId)));
    expect(again).toMatchObject({ added: 0, already: 3 });
    expect(await db.capAllotment.count({ where: { roundId } })).toBe(3);
    // NT2 is the VJ/NT fee category; a choice code ending in the programme's code is that programme.
    expect(await db.capAllotment.findFirst({ where: { roundId, cetApplicationId: "ZZEN0003" }, select: { category: true, programmeId: true } })).toEqual({ category: "VJNT", programmeId: ids.programme });
  });

  it("will not offer the seat until every document the category needs is verified against a scan and both undertakings are recorded", async () => {
    expect(requiredDocuments("OBC")).toEqual(["caste", "income", "domicile", "marksheets"]);
    expect(requiredDocuments("OPEN", ["gap"])).toEqual(["domicile", "marksheets", "gap"]);
    expect(scrutinyComplete({ domicile: { required: true, fileId: "f", status: "VERIFIED", note: null }, marksheets: { required: true, fileId: null, status: "VERIFIED", note: null } })).toBe(false);
    await as(ids.admin, ids.college, "ADMIN");
    const row = await db.capAllotment.findFirstOrThrow({ where: { roundId, cetApplicationId: "ZZEN0002" }, select: { id: true } });
    const app = await body<{ id: string; documents: { doc: string }[] }>(await appsPost(json("/x", { roundId, capAllotmentId: row.id })));
    expect(app.documents.map((d) => d.doc)).toEqual(["caste", "income", "domicile", "marksheets"]);
    // The same row again is the same application.
    expect((await body(await appsPost(json("/x", { roundId, capAllotmentId: row.id })))).id).toBe(app.id);
    // Verified with no scan is refused.
    expect((await docPost(json("/x", { doc: "caste", status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(403);
    // A scan is an upload of the desk's own: an id it did not upload, another college's file, is refused (campaign S-12).
    const planted = await db.uploadTicket.create({ data: { userId: ids.principal, fileId: `zz-scan-other-${STAMP}`, mime: "application/pdf", size: 10 } });
    expect((await docPost(json("/x", { doc: "caste", fileId: planted.fileId, status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(403);
    expect((await docPost(json("/x", { doc: "caste", fileId: "zz-never-uploaded", status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(403);
    await db.uploadTicket.createMany({ data: ["caste", "income", "domicile", "marks"].map((doc) => ({ userId: ids.admin, fileId: `zz-scan-${doc}-${STAMP}`, mime: "application/pdf", size: 10 })) });
    for (const doc of ["caste", "income", "domicile"]) expect((await docPost(json("/x", { doc, fileId: `zz-scan-${doc}-${STAMP}`, status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(200);
    // The same scan named again on the same line is no second spend.
    expect((await docPost(json("/x", { doc: "caste", fileId: `zz-scan-caste-${STAMP}`, status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(200);
    await undertakingPost(json("/x", { by: "STUDENT" }), params("applicationId", app.id));
    await undertakingPost(json("/x", { by: "PARENT" }), params("applicationId", app.id));
    // Mark sheets still pending: no offer.
    expect((await offerPost(json("/x", {}), params("applicationId", app.id))).status).toBe(403);
    expect((await docPost(json("/x", { doc: "marksheets", fileId: `zz-scan-marks-${STAMP}`, status: "VERIFIED" }), params("applicationId", app.id))).status).toBe(200);
    const offered = await body<{ status: string; admissionFeePaise: number }>(await offerPost(json("/x", {}), params("applicationId", app.id)));
    expect(offered).toMatchObject({ status: "FEE_DUE", admissionFeePaise: 825_000 });
  });

  it("admits in one transaction — account, membership, record, enrolment, academic seat and fee plan — and undoes all of it when one step is refused", async () => {
    await as(ids.admin, ids.college, "ADMIN");
    const app = await db.collegeApplication.findFirstOrThrow({ where: { roundId, status: "FEE_DUE" }, select: { id: true } });
    expect((await admitPost(json("/x", {}), params("applicationId", app.id))).status).toBe(403); // the fee is not recorded yet
    expect((await feePost(json("/x", { amountPaise: 800_000, method: "BANK", reference: "ZZUTR1" }), params("applicationId", app.id))).status).toBe(403); // less than asked
    expect((await feePost(json("/x", { amountPaise: 825_000, method: "BANK", reference: "ZZUTR0001" }), params("applicationId", app.id))).status).toBe(200);
    // An APAAR id already on another student refuses the admission, and nothing it began remains.
    await db.pupilRecord.update({ where: { studentMembershipId: ids.s1 }, data: { apaarId: "123456789012" } });
    const users = await db.user.count();
    const members = await db.membership.count({ where: { schoolId: ids.college } });
    const refused = await admitPost(json("/x", { apaarId: "123456789012" }), params("applicationId", app.id));
    expect(refused.status).toBe(403);
    expect(await db.user.count()).toBe(users);
    expect(await db.membership.count({ where: { schoolId: ids.college } })).toBe(members);
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: app.id } })).status).toBe("FEE_DUE");
    const done = await body<{ studentMembershipId: string; demands: number; receiptSerial: string | null }>(await admitPost(json("/x", { prn: "ZZPRN0002", apaarId: "210987654321" }), params("applicationId", app.id)));
    expect(done.demands).toBe(2);
    expect(done.receiptSerial).toBeTruthy();
    const m = await db.membership.findUniqueOrThrow({ where: { id: done.studentMembershipId }, select: { role: true, status: true, pupilRecord: { select: { prn: true, apaarId: true, admissionCategory: true, yearOfEntry: true } }, programmeEnrolments: { select: { programmeId: true, category: true, quota: true, roundId: true } }, academicSeat: { select: { schemeId: true, yearOfStudy: true } } } });
    expect(m).toMatchObject({ role: "STUDENT", status: "ACTIVE", pupilRecord: { prn: "ZZPRN0002", apaarId: "210987654321", admissionCategory: "OBC", yearOfEntry: 2026 }, programmeEnrolments: [{ programmeId: ids.programme, category: "OBC", quota: "CAP", roundId }], academicSeat: { schemeId: ids.scheme, yearOfStudy: 1 } });
    // The admission fee is on the ledger against the first term.
    const firstTerm = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: done.studentMembershipId }, orderBy: { dueDate: "asc" } });
    expect(firstTerm).toMatchObject({ paidPaise: 825_000, status: "PAID" });
    // The vacancy report counts the seat.
    const vac = await body<{ rows: { category: string; admitted: number; vacant: number }[] }>(await vacancyGet(get("/x"), params("roundId", roundId)));
    expect(vac.rows.find((r) => r.category === "OBC")).toMatchObject({ admitted: 1, vacant: 0 });
    // Admitting again answers as it stands.
    expect((await body(await admitPost(json("/x", {}), params("applicationId", app.id)))).studentMembershipId).toBe(done.studentMembershipId);
  });

  it("refuses an admission past the round's seats or the programme's intake 409 with the limit named, until the principal approves it as supernumerary (LIFECYCLE-4)", async () => {
    // OBC had one seat in this round, and the admission above took it.
    const make = (n: number, category: string) => db.collegeApplication.create({ data: { schoolId: ids.college, roundId, programmeId: ids.programme, number: n, applicantName: `ZZ Over ${n}`, category, quota: "CAP", status: "FEE_DUE" }, select: { id: true } });
    const over = await make(901, "OBC");
    await as(ids.admin, ids.college, "ADMIN");
    const users = await db.user.count();
    const refused = await admitPost(json("/x", {}), params("applicationId", over.id));
    expect(refused.status).toBe(409);
    expect((await body<{ error: string }>(refused)).error).toContain("OBC");
    expect(await db.user.count()).toBe(users);
    // The office cannot give the seat beyond the limit; the principal can, with a reason.
    expect((await supernumeraryPost(json("/x", { reason: "ZZ ward of a serviceman" }), params("applicationId", over.id))).status).toBe(403);
    await as(ids.principal, ids.college, "PRINCIPAL");
    expect((await supernumeraryPost(json("/x", {}), params("applicationId", over.id))).status).toBe(422);
    const approved = await body<{ supernumeraryAt: string | null; supernumeraryReason: string }>(await supernumeraryPost(json("/x", { reason: "ZZ ward of a serviceman" }), params("applicationId", over.id)));
    expect(approved.supernumeraryAt).not.toBeNull();
    expect(approved.supernumeraryReason).toBe("ZZ ward of a serviceman");
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "college.admissions.supernumerary", targetId: over.id } })).toBe(1);
    await as(ids.admin, ids.college, "ADMIN");
    expect((await admitPost(json("/x", {}), params("applicationId", over.id))).status).toBe(200);
    // The programme's intake is a limit too: with an intake of 1, an OPEN seat still free in the round is refused.
    await db.programme.update({ where: { id: ids.programme }, data: { intake: 1 } });
    const open = await make(902, "OPEN");
    const full = await admitPost(json("/x", {}), params("applicationId", open.id));
    expect(full.status).toBe(409);
    expect((await body<{ error: string }>(full)).error).toContain("ZZ BSc Physics");
    // An offer is held to the same limits.
    const offerApp = await db.collegeApplication.create({ data: { schoolId: ids.college, roundId, programmeId: ids.programme, number: 903, applicantName: "ZZ Over 903", category: "OPEN", quota: "CAP", status: "SCRUTINY", antiRaggingStudentAt: new Date(), antiRaggingParentAt: new Date(), documentsJson: JSON.stringify({ domicile: { required: true, fileId: "f1", status: "VERIFIED", note: null }, marksheets: { required: true, fileId: "f2", status: "VERIFIED", note: null } }) }, select: { id: true } });
    expect((await offerPost(json("/x", {}), params("applicationId", offerApp.id))).status).toBe(409);
    await db.programme.update({ where: { id: ids.programme }, data: { intake: 0 } });
  });

  it("measures the refund by the slab from the last date of admission; the caution deposit comes back whole", () => {
    const base = { paidPaise: 1_200_000, cautionPaise: 200_000, lastKey: "2026-08-15" };
    expect(refundFor({ ...base, cancelKey: "2026-07-20" })).toMatchObject({ slab: "FULL", processingPaise: 50_000, refundPaise: 1_000_000 - 50_000 + 200_000 });
    expect(refundFor({ ...base, cancelKey: "2026-08-10" })).toMatchObject({ slab: "BEFORE_LAST", refundPaise: 900_000 + 200_000 });
    expect(refundFor({ ...base, cancelKey: "2026-08-25" })).toMatchObject({ slab: "WITHIN_15_AFTER", refundPaise: 800_000 + 200_000 });
    expect(refundFor({ ...base, cancelKey: "2026-09-10" })).toMatchObject({ slab: "WITHIN_30_AFTER", refundPaise: 500_000 + 200_000 });
    expect(refundFor({ ...base, cancelKey: "2026-10-01" })).toMatchObject({ slab: "NONE", refundPaise: 200_000 });
    // The processing charge stops at ₹5,000.
    expect(refundFor({ paidPaise: 30_000_000, cautionPaise: 0, lastKey: "2026-08-15", cancelKey: "2026-07-01" }).processingPaise).toBe(500_000);
  });
});

describe("the bulletin's college audiences, and an adult boarder's leave", () => {
  it("keeps a notice for one programme in that programme's students' feed and out of everyone else's", async () => {
    const admin = await ctxAs(ids.admin, ids.college, "ADMIN");
    const post = await createPost(admin, { scope: "SCHOOL", title: "ZZ BSc Physics practicals move", body: "", tags: [], media: [], audience: "STUDENTS", audienceTarget: { kind: "PROGRAMME", id: ids.programme } });
    const batch = await createPost(admin, { scope: "SCHOOL", title: "ZZ 2025 batch photo", body: "", tags: [], media: [], audience: "ALL", audienceTarget: { kind: "BATCH", id: "2025" } });
    expect((await db.post.findUniqueOrThrow({ where: { id: post.postId }, select: { audienceTarget: true } })).audienceTarget).toBe(`PROGRAMME:${ids.programme}`);
    // Another college's programme is refused.
    await expect(createPost(admin, { scope: "SCHOOL", title: "ZZ elsewhere", body: "", tags: [], media: [], audienceTarget: { kind: "PROGRAMME", id: "cnotaprogramme000000000" } })).rejects.toThrow();
    const s1 = await ctxAs(ids.s1User, ids.college, "STUDENT");
    const feed = (await listFeed(s1)).map((p) => p.id);
    expect(feed).toContain(post.postId);
    expect(feed).not.toContain(batch.postId);
    // Moved to Chemistry, s1 no longer sees the Physics notice.
    await db.programmeEnrolment.updateMany({ where: { studentMembershipId: ids.s1 }, data: { programmeId: ids.programme2 } });
    expect((await listFeed(await ctxAs(ids.s1User, ids.college, "STUDENT"))).map((p) => p.id)).not.toContain(post.postId);
    await db.programmeEnrolment.updateMany({ where: { studentMembershipId: ids.s1 }, data: { programmeId: ids.programme } });
    // Staff read every notice.
    expect((await listFeed(await ctxAs(ids.principal, ids.college, "PRINCIPAL"))).map((p) => p.id)).toContain(batch.postId);
  });

  it("lets an adult boarder ask for leave without a guardian's consent, and a hostel that allows no night-outs refuses one", async () => {
    const s2 = await ctxAs(ids.s2User, ids.college, "STUDENT");
    const from = new Date(Date.now() + 86_400_000).toISOString();
    const to = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const leave = await requestLeave(s2, { kind: "HOME", fromAt: from, toAt: to, destination: "ZZ Satara", reason: "" });
    expect(leave.status).toBe("PENDING");
    await db.hostel.update({ where: { id: ids.hostel }, data: { nightOutAllowed: false } });
    await expect(requestLeave(s2, { kind: "NIGHT_OUT", fromAt: from, toAt: to, destination: "ZZ Pune", reason: "" })).rejects.toThrow("collegeOffice.refuseNightOut");
  });
});
