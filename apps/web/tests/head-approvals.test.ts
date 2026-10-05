/**
 * The principal's last two approvals (5 Oct 2026; integration decision 10, docs/college.md "Not built"): a refund
 * outside the slab and a hostel expulsion. The office (or the warden) asks with a reason; only the principal decides;
 * each decision is an audit row the head's decision log reads back as a sentence of its own kind; the same answer
 * twice is the same; the bank reference waits for the principal's word; an approved expulsion ends the place on its
 * day and tells the student; the doors keep the roles.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { askRefundException, decideRefundException, decideExpulsion, headApprovalCounts, listExpulsions, proposeExpulsion, refundExceptions, withdrawExpulsion } from "@/lib/head-approvals";
import { recordRefund } from "@/lib/college-admissions";
import { listDecisions } from "@/lib/decision-log";
import { principalCollege } from "@/lib/college-principal";
import { POST as askPost } from "@/app/api/v1/college/admissions/applications/[applicationId]/refund-exception/route";
import { POST as expulsionDecidePost } from "@/app/api/v1/hostel/expulsions/[expulsionId]/decide/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { college: "", users: [] as string[], admin: "", principal: "", warden: "", accounts: "", app: "", boarderUser: "", boarder: "", allotment: "", allotment2: "", incident: "" };

async function ctxAs(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.college, role: role as never });
  return (await getSession())!;
}
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ Heads College ${STAMP}`, slug: `zz-heads-${STAMP}`, code: `ZH${SUFFIX}`, contactEmail: `zz-heads-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "ADMISSIONS", "HOSTEL"].map((module) => ({ schoolId: ids.college, module })) });
  const person = async (who: string, role: string | null) => {
    const u = await db.user.create({ data: { name: `ZZ Heads ${who}`, email: `zz-heads-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate: new Date("2004-01-01T00:00:00Z"), isMinor: false }, select: { id: true } });
    ids.users.push(u.id);
    const m = role ? await db.membership.create({ data: { userId: u.id, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } }) : null;
    return { userId: u.id, membershipId: m?.id ?? "" };
  };
  ids.admin = (await person("Admin", "ADMIN")).userId;
  ids.principal = (await person("Principal", "PRINCIPAL")).userId;
  ids.warden = (await person("Warden", "WARDEN")).userId;
  ids.accounts = (await person("Accounts", "ACCOUNTS")).userId;
  const boarder = await person("Boarder", "STUDENT");
  const boarder2 = await person("Boarder Two", "STUDENT");
  ids.boarderUser = boarder.userId;
  ids.boarder = boarder.membershipId;
  const dept = await db.department.create({ data: { schoolId: ids.college, code: `ZHD${SUFFIX}`, name: "ZZ Heads Dept" }, select: { id: true } });
  const programme = await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "ZZHBA", name: "ZZ BA", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
  const round = await db.admissionRound.create({ data: { schoolId: ids.college, programmeId: programme.id, intakeYear: 2026, kind: "CAP", name: "ZZ Round 1", opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2026-08-31T00:00:00Z") }, select: { id: true } });
  ids.app = (await db.collegeApplication.create({ data: { schoolId: ids.college, roundId: round.id, programmeId: programme.id, number: 1, applicantName: "ZZ Heads Applicant", category: "OPEN", quota: "CAP", status: "CANCELLED", cancelledAt: new Date(), cancelReason: "ZZ family moved", admissionFeePaise: 2_000_000, admissionFeePaidAt: new Date(), refundPaise: 1_000_000, refundSlab: "WITHIN_15_AFTER", refundRecordedAt: new Date() }, select: { id: true } })).id;
  const hostel = await db.hostel.create({ data: { schoolId: ids.college, name: `ZZ Heads House ${SUFFIX}`, kind: "MIXED" }, select: { id: true } });
  const room = await db.hostelRoom.create({ data: { schoolId: ids.college, hostelId: hostel.id, number: "H1", beds: 2 }, select: { id: true } });
  ids.allotment = (await db.hostelAllotment.create({ data: { schoolId: ids.college, membershipId: boarder.membershipId, roomId: room.id, bed: 1, fromDate: "2026-07-01", status: "ACTIVE", allottedByUserId: ids.admin }, select: { id: true } })).id;
  ids.allotment2 = (await db.hostelAllotment.create({ data: { schoolId: ids.college, membershipId: boarder2.membershipId, roomId: room.id, bed: 2, fromDate: "2026-07-01", status: "ACTIVE", allottedByUserId: ids.admin }, select: { id: true } })).id;
  const reporter = (await db.membership.findFirstOrThrow({ where: { schoolId: ids.college, role: "WARDEN" }, select: { id: true } })).id;
  ids.incident = (await db.incident.create({ data: { schoolId: ids.college, studentMembershipId: boarder.membershipId, reportedByMembershipId: reporter, kind: "BEHAVIOUR", severity: "SERIOUS", occurredAt: new Date(), place: "ZZ House", title: "ZZ Ragging a junior", body: "ZZ details", actionTaken: "ZZ reported", hostelId: hostel.id }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("a refund outside the slab", () => {
  it("is asked by the office only, with the reason, and holds the bank reference until the principal answers", async () => {
    const accounts = await ctxAs(ids.accounts, "ACCOUNTS");
    await expect(askRefundException(accounts, ids.app, { refundPaise: 1_500_000, reason: "ZZ hospitalised the week of admission" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const admin = await ctxAs(ids.admin, "ADMIN");
    await expect(askRefundException(admin, ids.app, { refundPaise: 1_000_000, reason: "ZZ hospitalised the week of admission" })).rejects.toMatchObject({ key: "collegeDesks.refuseRefundSameAsSlab" });
    // Never more than the ₹20,000 paid on the seat (A3-S-15).
    await expect(askRefundException(admin, ids.app, { refundPaise: 2_000_100, reason: "ZZ hospitalised the week of admission" })).rejects.toMatchObject({ key: "collegeDesks.refuseRefundTooMuch" });
    // Through the door: 200 with the application carrying the ask.
    const res = await askPost(json(`/api/v1/college/admissions/applications/${ids.app}/refund-exception`, { refundPaise: 1_500_000, reason: "ZZ hospitalised the week of admission" }), params("applicationId", ids.app));
    expect(res.status).toBe(200);
    const view = (await res.json()) as { refundAsk: { status: string; paise: number } };
    expect(view.refundAsk).toMatchObject({ status: "ASKED", paise: 1_500_000 });
    await expect(askRefundException(admin, ids.app, { refundPaise: 1_200_000, reason: "ZZ asked again" })).rejects.toMatchObject({ key: "collegeDesks.refuseRefundAlreadyAsked" });
    await expect(recordRefund(admin, ids.app, "ZZ-BANK-1")).rejects.toMatchObject({ key: "collegeDesks.refuseRefundWaiting" });
    expect((await headApprovalCounts(ids.college)).refundException).toBe(1);
    // The principal is told.
    expect(await db.notification.count({ where: { userId: ids.principal, titleKey: "collegeDesks.notifRefundAsk" } })).toBe(1);
  });

  it("is decided by the principal alone; an approval makes the asked amount the refund and keeps the slab's", async () => {
    const admin = await ctxAs(ids.admin, "ADMIN");
    await expect(decideRefundException(admin, ids.app, { approve: true, note: "" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const principal = await ctxAs(ids.principal, "PRINCIPAL");
    await decideRefundException(principal, ids.app, { approve: true, note: "ZZ medical certificate seen" });
    await decideRefundException(principal, ids.app, { approve: true, note: "" }); // the same answer twice is the same
    await expect(decideRefundException(principal, ids.app, { approve: false, note: "" })).rejects.toMatchObject({ key: "collegeDesks.refuseRefundDecided" });
    const row = await db.collegeApplication.findUniqueOrThrow({ where: { id: ids.app }, select: { refundPaise: true, refundSlabPaise: true, refundAskStatus: true } });
    expect(row).toEqual({ refundPaise: 1_500_000, refundSlabPaise: 1_000_000, refundAskStatus: "APPROVED" });
    const list = await refundExceptions(principal);
    expect(list.canDecide).toBe(true);
    expect(list.items[0]).toMatchObject({ status: "APPROVED", askedPaise: 1_500_000, slabPaise: 1_000_000 });
    // Now the bank reference may be recorded.
    await recordRefund(await ctxAs(ids.admin, "ADMIN"), ids.app, "ZZ-BANK-1");
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "college.admissions.refundException.approve" } })).toBe(1);
  });
});

describe("a hostel expulsion", () => {
  it("is proposed by the warden with the incident and a day, one open proposal a place", async () => {
    const warden = await ctxAs(ids.warden, "WARDEN");
    await expect(proposeExpulsion(warden, { allotmentId: ids.allotment, reason: "ZZ repeated ragging of a junior", incidentId: null, effectiveOn: "2020-01-01" })).rejects.toMatchObject({ key: "collegeDesks.refuseExpulsionDate" });
    // The other boarder's place with this boarder's incident: refused.
    await expect(proposeExpulsion(warden, { allotmentId: ids.allotment2, reason: "ZZ repeated ragging of a junior", incidentId: ids.incident, effectiveOn: "2099-01-01" })).rejects.toMatchObject({ key: "collegeDesks.refuseExpulsionIncident" });
    const x = await proposeExpulsion(warden, { allotmentId: ids.allotment, reason: "ZZ repeated ragging of a junior", incidentId: ids.incident, effectiveOn: "2099-01-01" });
    expect(x).toMatchObject({ status: "ASKED", incidentId: ids.incident, effectiveOn: "2099-01-01" });
    await expect(proposeExpulsion(warden, { allotmentId: ids.allotment, reason: "ZZ the same again", incidentId: null, effectiveOn: "2099-01-01" })).rejects.toMatchObject({ key: "collegeDesks.refuseExpulsionOpen" });
    // A second proposal for the other place, withdrawn by its proposer.
    const y = await proposeExpulsion(warden, { allotmentId: ids.allotment2, reason: "ZZ a case that settled itself", incidentId: null, effectiveOn: "2099-01-01" });
    expect((await withdrawExpulsion(warden, y.id)).status).toBe("WITHDRAWN");
    expect((await headApprovalCounts(ids.college)).expulsion).toBe(1);
    const listed = await listExpulsions(warden);
    expect([listed.canPropose, listed.canDecide]).toEqual([true, false]);
  });

  it("is decided by the principal alone: an approval ends the place on its day and tells the student", async () => {
    const x = (await db.hostelExpulsion.findFirstOrThrow({ where: { schoolId: ids.college, status: "ASKED" }, select: { id: true } })).id;
    await ctxAs(ids.warden, "WARDEN");
    const refused = await expulsionDecidePost(json(`/api/v1/hostel/expulsions/${x}/decide`, { approve: true }), params("expulsionId", x));
    expect(refused.status).toBe(403);
    const principal = await ctxAs(ids.principal, "PRINCIPAL");
    const decided = await decideExpulsion(principal, x, { approve: true, note: "ZZ the committee's report read" });
    expect(decided.status).toBe("APPROVED");
    // The day is ahead, so the place stays live until it, read at the time (A3-S-15; tests/smaller-security-items.test.ts walks the day).
    expect(await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.allotment }, select: { status: true, toDate: true } })).toEqual({ status: "ACTIVE", toDate: null });
    expect(await db.notification.count({ where: { userId: ids.boarderUser, titleKey: "collegeDesks.notifExpelled" } })).toBe(1);
    // The same answer twice is the same; the other answer refused.
    expect((await decideExpulsion(principal, x, { approve: true, note: "" })).status).toBe("APPROVED");
    await expect(decideExpulsion(principal, x, { approve: false, note: "" })).rejects.toMatchObject({ key: "collegeDesks.refuseExpulsionDecided" });
  });
});

describe("the head's own record", () => {
  it("reads both decisions back as sentences of their own kinds, and the college page counts nothing left waiting", async () => {
    const principal = await ctxAs(ids.principal, "PRINCIPAL");
    const all = await listDecisions(principal, { limit: 30 });
    const kinds = all.items.map((i) => i.kind);
    expect(kinds).toEqual(expect.arrayContaining(["refundException", "expulsion"]));
    const refund = all.items.find((i) => i.kind === "refundException")!;
    expect(refund.sentence).toContain("ZZ Heads Applicant");
    expect(refund.sentence).toContain("15,000");
    const expulsion = all.items.find((i) => i.kind === "expulsion")!;
    expect(expulsion.sentence).toContain("ZZ Heads Boarder");
    expect((await listDecisions(principal, { kind: "expulsion", limit: 30 })).items.every((i) => i.kind === "expulsion")).toBe(true);
    const page = await principalCollege(principal);
    expect(page.approvals.filter((a) => a.key === "refundException" || a.key === "expulsion")).toEqual([
      { key: "refundException", count: 0, href: "/admin/college-admissions/refunds" },
      { key: "expulsion", count: 0, href: "/hostel/expulsions" },
    ]);
  });
});

describe("four eyes on a head's approval (A3-S-4)", () => {
  it("refuses the person who asked or proposed, though they also hold PRINCIPAL; another principal still decides", async () => {
    // One person holding ADMIN and PRINCIPAL at the college, as the ZZ Banyan multi-role accounts do.
    const both = await db.user.create({ data: { name: "ZZ Heads Both", email: `zz-heads-both-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } });
    ids.users.push(both.id);
    await db.membership.createMany({ data: [{ userId: both.id, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" }, { userId: both.id, schoolId: ids.college, role: "PRINCIPAL", status: "ACTIVE" }] });
    const app = await db.collegeApplication.findUniqueOrThrow({ where: { id: ids.app }, select: { roundId: true, programmeId: true } });
    const second = (await db.collegeApplication.create({ data: { schoolId: ids.college, roundId: app.roundId, programmeId: app.programmeId, number: 2, applicantName: "ZZ Heads Second", category: "OPEN", quota: "CAP", status: "CANCELLED", cancelledAt: new Date(), cancelReason: "ZZ moved", admissionFeePaise: 2_000_000, admissionFeePaidAt: new Date(), refundPaise: 1_000_000, refundSlab: "WITHIN_15_AFTER", refundRecordedAt: new Date() }, select: { id: true } })).id;
    await askRefundException(await ctxAs(both.id, "ADMIN"), second, { refundPaise: 1_500_000, reason: "ZZ asked by the dual holder" });
    await expect(decideRefundException(await ctxAs(both.id, "PRINCIPAL"), second, { approve: true, note: "" })).rejects.toMatchObject({ key: "collegeDesks.refuseOwnAsk" });
    expect((await db.collegeApplication.findUniqueOrThrow({ where: { id: second }, select: { refundAskStatus: true } })).refundAskStatus).toBe("ASKED");
    await decideRefundException(await ctxAs(ids.principal, "PRINCIPAL"), second, { approve: false, note: "ZZ another head" });

    const pupil = await db.user.create({ data: { name: "ZZ Heads Boarder Three", email: `zz-heads-boarder3-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } });
    ids.users.push(pupil.id);
    const member = await db.membership.create({ data: { userId: pupil.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
    const room = await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.allotment }, select: { roomId: true } });
    const place = (await db.hostelAllotment.create({ data: { schoolId: ids.college, membershipId: member.id, roomId: room.roomId, bed: 1, fromDate: "2026-07-01", status: "ACTIVE", allottedByUserId: ids.admin }, select: { id: true } })).id;
    const x = await proposeExpulsion(await ctxAs(both.id, "ADMIN"), { allotmentId: place, reason: "ZZ proposed by the dual holder", incidentId: null, effectiveOn: "2099-01-01" });
    await expect(decideExpulsion(await ctxAs(both.id, "PRINCIPAL"), x.id, { approve: true, note: "" })).rejects.toMatchObject({ key: "collegeDesks.refuseOwnAsk" });
    expect((await decideExpulsion(await ctxAs(ids.principal, "PRINCIPAL"), x.id, { approve: false, note: "ZZ another head" })).status).toBe("REFUSED");
  });
});
