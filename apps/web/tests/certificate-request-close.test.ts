/**
 * QA-11 and QA-12 (QA campaign of 24 October 2026, E2E-A5 and E2E-A4 of layer 5A): a certificate ask and the two
 * things that used to outlive it.
 *
 * QA-11: an ask the office declines, or the family takes back, left the fee the office had set on it OPEN on the
 * pupil's ledger. Now the fee goes with the ask while nothing is paid on it; a fee with money on it is left for the
 * office's refund, and the audit row says so.
 *
 * QA-12: the office and the head pressing Issue on the same ask at once made two numbered papers, both real, one
 * orphaned. Now the issue claims the ask under its lock before a number is taken: one paper, the second press
 * answered with it.
 *
 * Fired together with Promise.allSettled, as the layer did, at a ZZ school of this suite's own, removed afterwards.
 * Each case makes its own pupils and asks, so the cases get 30 s: the 5 s default ran out once beside a generation run.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { presetsFor } from "@/lib/certificate-rules";
import { issueCertificate, saveTemplate } from "@/lib/certificates";
import { cancelRequest, declineRequest, requestCertificate, setRequestFee } from "@/lib/certificate-requests";
import { recordCounterPayment } from "@/lib/fees-payments";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-fixma-cert-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const templates: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);
const head = () => ctx(ids.head!, "PRINCIPAL", ids.school!, ids.headM!);
const guardian = () => ctx(ids.parent!, "PARENT", null);

let pupils = 0;
/** A pupil of the school with a guardian; returns the pupil's membership. */
async function pupil(): Promise<string> {
  pupils += 1;
  const user = await db.user.create({ data: { name: `ZZ FixMA Pupil ${pupils}`, email: mail(`pupil${pupils}`), isTestFixture: true }, select: { id: true } });
  const m = (await db.membership.create({ data: { userId: user.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", studentCode: `ZFC${SUFFIX}${pupils}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId: ids.school!, classId: ids.class!, studentMembershipId: m, status: "ACTIVE" } });
  await db.pupilRecord.create({ data: { schoolId: ids.school!, studentMembershipId: m, fatherName: "ZZ Father", motherName: "ZZ Mother", nationality: "Indian", admissionNumber: `GR-${pupils}` } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: m, studentSchoolId: ids.school!, status: "ACTIVE" } });
  return m;
}
const ask = async (child: string, kind: "BONAFIDE" | "STUDY") => (await requestCertificate(guardian(), { kind, purpose: "a scholarship" }, child)).id;
const demandOf = async (requestId: string) => {
  const r = await db.certificateRequest.findUniqueOrThrow({ where: { id: requestId }, select: { feeDemandId: true } });
  return db.feeDemand.findUniqueOrThrow({ where: { id: r.feeDemandId! }, select: { id: true, status: true, paidPaise: true } });
};

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ FixMA Certs ${STAMP}`, slug: `zz-fixma-certs-${STAMP}`, code: `ZFC${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  for (const who of ["admin", "head", "parent"]) ids[who] = (await db.user.create({ data: { name: `ZZ FixMA ${who}`, email: mail(who), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headM = (await db.membership.create({ data: { userId: ids.head!, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 6B", gradeLevel: "6", joinCode: `ZFC${SUFFIX}` }, select: { id: true } })).id;
  await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Papers", code: "PAP", kind: "OTHER" } });
  for (const kind of ["BONAFIDE", "STUDY"] as const) {
    const preset = presetsFor("en").find((x) => x.kind === kind)!;
    templates[kind] = (await saveTemplate(admin(), { ...preset, active: true })).id;
  }
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("QA-11: a closed ask takes its unpaid fee with it", { timeout: 30_000 }, () => {
  it("the office declines an ask with a ₹100 fee: the ask is DECLINED and the fee CANCELLED, owed by nobody", async () => {
    const child = await pupil();
    const id = await ask(child, "STUDY");
    await setRequestFee(admin(), id, 100_00);
    expect((await demandOf(id)).status).toBe("OPEN");
    const declined = await declineRequest(admin(), id, "No record of the scholarship scheme.");
    expect(declined.status).toBe("DECLINED");
    expect(await demandOf(id)).toMatchObject({ status: "CANCELLED", paidPaise: 0 });
    expect(await db.feeDemand.count({ where: { studentMembershipId: child, status: { in: ["OPEN", "PART"] } } })).toBe(0);
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "certificate.requestDecline", targetId: id } });
    expect(JSON.parse(row.meta ?? "{}")).toMatchObject({ feeCancelled: true });
    // Pressed again: answered as it stands, nothing audited twice.
    expect((await declineRequest(admin(), id, "again")).status).toBe("DECLINED");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "certificate.requestDecline", targetId: id } })).toBe(1);
  });

  it("the family takes back an ask with a fee: CANCELLED, and the fee with it", async () => {
    const child = await pupil();
    const id = await ask(child, "BONAFIDE");
    await setRequestFee(admin(), id, 50_00);
    expect((await cancelRequest(guardian(), id)).status).toBe("CANCELLED");
    expect((await demandOf(id)).status).toBe("CANCELLED");
  });

  it("a fee already paid is left as it stands for the office to refund, and the audit row says how much", async () => {
    const child = await pupil();
    const id = await ask(child, "STUDY");
    await setRequestFee(admin(), id, 100_00);
    const demand = await demandOf(id);
    await recordCounterPayment(admin(), { studentMembershipId: child, amountPaise: 100_00, method: "CASH", demandIds: [demand.id] });
    await declineRequest(admin(), id, "Not a pupil in that year.");
    expect(await demandOf(id)).toMatchObject({ status: "PAID", paidPaise: 100_00 });
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "certificate.requestDecline", targetId: id } });
    expect(JSON.parse(row.meta ?? "{}")).toMatchObject({ feeKeptPaidPaise: 100_00 });
  });

  it("a fee set at the moment of a decline never leaves an open fee on a declined ask", async () => {
    for (let round = 0; round < 3; round += 1) {
      const child = await pupil();
      const id = await ask(child, "STUDY");
      await Promise.allSettled([setRequestFee(admin(), id, 75_00), declineRequest(head(), id, "Declined at once.")]);
      const after = await db.certificateRequest.findUniqueOrThrow({ where: { id }, select: { status: true } });
      expect(after.status).toBe("DECLINED");
      expect(await db.feeDemand.count({ where: { studentMembershipId: child, status: { in: ["OPEN", "PART"] } } })).toBe(0);
    }
  });
});

describe("QA-12: one ask, one paper", { timeout: 30_000 }, () => {
  for (const round of [1, 2, 3]) {
    it(`round ${round}: the office and the head press Issue at once; one paper, both answered with it`, async () => {
      const child = await pupil();
      const id = await ask(child, "BONAFIDE");
      const body = { templateId: templates.BONAFIDE!, studentMembershipId: child, requestId: id };
      const both = await Promise.allSettled([issueCertificate(admin(), body), issueCertificate(head(), body)]);
      expect(both.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason))).toEqual([]);
      const papers = await db.issuedCertificate.findMany({ where: { studentMembershipId: child }, select: { id: true, serial: true } });
      expect(papers).toHaveLength(1);
      const answered = both.map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof issueCertificate>>>).value.id);
      expect(answered).toEqual([papers[0]!.id, papers[0]!.id]);
      const request = await db.certificateRequest.findUniqueOrThrow({ where: { id }, select: { status: true, certificateId: true } });
      expect(request).toEqual({ status: "ISSUED", certificateId: papers[0]!.id });
      expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "certificate.issue", targetId: papers[0]!.id } })).toBe(1);
    });
  }

  it("an ask declined or taken back is not answered by a paper, and another pupil's ask is not found", async () => {
    const child = await pupil();
    const other = await pupil();
    const declined = await ask(child, "BONAFIDE");
    await declineRequest(admin(), declined, "No.");
    await expect(issueCertificate(admin(), { templateId: templates.BONAFIDE!, studentMembershipId: child, requestId: declined })).rejects.toMatchObject({ key: "certificateRequests.refuseClosed", status: 409 });
    const pending = await ask(child, "STUDY");
    await expect(issueCertificate(admin(), { templateId: templates.STUDY!, studentMembershipId: other, requestId: pending })).rejects.toMatchObject({ key: "certificateRequests.notFound" });
    expect(await db.issuedCertificate.count({ where: { studentMembershipId: { in: [child, other] } } })).toBe(0);
    expect((await db.certificateRequest.findUniqueOrThrow({ where: { id: pending } })).status).toBe("PENDING");
  });

  it("a decline and an Issue at the same moment: either the paper and the ask ISSUED, or no paper and the ask DECLINED", async () => {
    for (let round = 0; round < 3; round += 1) {
      const child = await pupil();
      const id = await ask(child, "STUDY");
      await Promise.allSettled([issueCertificate(head(), { templateId: templates.STUDY!, studentMembershipId: child, requestId: id }), declineRequest(admin(), id, "Declined at once.")]);
      const request = await db.certificateRequest.findUniqueOrThrow({ where: { id }, select: { status: true, certificateId: true } });
      const papers = await db.issuedCertificate.count({ where: { studentMembershipId: child } });
      if (request.status === "ISSUED") expect([papers, Boolean(request.certificateId)]).toEqual([1, true]);
      else expect([request.status, papers]).toEqual(["DECLINED", 0]);
    }
  });
});
