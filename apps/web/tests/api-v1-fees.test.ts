/**
 * The /api/v1/fees handlers, invoked directly with a primed session the way
 * the other api-v1 suites do: 401 signed out, 403 for a role with no door,
 * 422 for a body that does not parse, 404 for another school's ids, and the
 * happy path of the reads and the counter. The ledger's own behaviour is
 * tests/fees.test.ts; this pins the shell.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as overviewGet } from "@/app/api/v1/fees/overview/route";
import { GET as duesGet } from "@/app/api/v1/fees/dues/route";
import { GET as settingsGet, POST as settingsPost } from "@/app/api/v1/fees/settings/route";
import { POST as gatewayPost, DELETE as gatewayDelete } from "@/app/api/v1/fees/settings/gateway/route";
import { GET as headsGet, POST as headsPost } from "@/app/api/v1/fees/heads/route";
import { GET as structuresGet, POST as structuresPost } from "@/app/api/v1/fees/structures/route";
import { GET as structureGet } from "@/app/api/v1/fees/structures/[structureId]/route";
import { POST as publishPost } from "@/app/api/v1/fees/structures/[structureId]/publish/route";
import { POST as plansPost } from "@/app/api/v1/fees/plans/route";
import { GET as rosterGet } from "@/app/api/v1/fees/classes/roster/route";
import { GET as pupilGet } from "@/app/api/v1/fees/pupils/[studentMembershipId]/route";
import { POST as paymentsPost } from "@/app/api/v1/fees/payments/route";
import { GET as receiptGet } from "@/app/api/v1/fees/receipts/[receiptId]/route";
import { GET as claimsGet } from "@/app/api/v1/fees/claims/route";
import { POST as matchPost } from "@/app/api/v1/fees/claims/match/route";
import { GET as familyGet } from "@/app/api/v1/fees/family/route";
import { POST as upiPost } from "@/app/api/v1/fees/family/upi/route";
import { POST as upiClaimPost } from "@/app/api/v1/fees/family/upi/claim/route";
import { GET as familyPaymentGet } from "@/app/api/v1/fees/family/payments/[paymentId]/route";
import { GET as exportCollectionsGet } from "@/app/api/v1/fees/export/collections/route";
import { POST as remindPost } from "@/app/api/v1/fees/remind/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let otherSchoolId = "";
let classId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let parentUserId = "";
let strangerParentUserId = "";
let pupilId = "";
let headId = "";
let structureId = "";
let otherStructureId = "";
let receiptId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function as(role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT" | "STRANGER" | null) {
  __resetCookies();
  if (role === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (role === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (role === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (role === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (role === "STRANGER") await createSession(strangerParentUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  schoolId = (await db.school.create({ data: { name: `ZZ FeesApi School ${STAMP}`, slug: `zz-feesapi-${STAMP}`, code: `ZFA${String(STAMP).slice(-5)}`, contactEmail: `zz-feesapi-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  otherSchoolId = (await db.school.create({ data: { name: `ZZ FeesApi Other ${STAMP}`, slug: `zz-feesapio-${STAMP}`, code: `ZFB${String(STAMP).slice(-5)}`, contactEmail: `zz-feesapio-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const year = await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  const otherYear = await db.academicYear.create({ data: { schoolId: otherSchoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ FeesApi ${who}`, email: `zz-feesapi-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, parent, stranger, pupil] = await Promise.all(["Admin", "Principal", "Teacher", "Parent", "Stranger", "Pupil"].map(mk));
  adminUserId = admin!.id;
  principalUserId = principal!.id;
  teacherUserId = teacher!.id;
  parentUserId = parent!.id;
  strangerParentUserId = stranger!.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }] });
  pupilId = (await db.membership.create({ data: { userId: pupil!.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFP${STAMP}`, gradeLevel: "5" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilId, studentSchoolId: schoolId, status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ FeesApi 5A", gradeLevel: "5", joinCode: `ZA${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilId, status: "ACTIVE" } });
  otherStructureId = (await db.feeStructure.create({ data: { schoolId: otherSchoolId, academicYearId: otherYear.id, name: "Other", publishedAt: new Date() }, select: { id: true } })).id;
  void year;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, parentUserId, strangerParentUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("doors", () => {
  it("signed out is 401 everywhere; a teacher is 403 on the office's reads and a parent on the office's writes", async () => {
    await as(null);
    expect((await overviewGet()).status).toBe(401);
    expect((await familyGet(get("/api/v1/fees/family"))).status).toBe(401);
    expect((await paymentsPost(json("/api/v1/fees/payments", {}))).status).toBe(401);
    await as("TEACHER");
    expect((await overviewGet()).status).toBe(403);
    expect((await duesGet(get("/api/v1/fees/dues"))).status).toBe(403);
    expect((await headsGet()).status).toBe(403);
    await as("PARENT");
    expect((await headsPost(json("/api/v1/fees/heads", { name: "X", code: "XX" }))).status).toBe(403);
    expect((await settingsGet()).status).toBe(403);
    await as("PRINCIPAL");
    expect((await overviewGet()).status).toBe(200);
    expect((await headsPost(json("/api/v1/fees/heads", { name: "X", code: "XX" }))).status).toBe(403);
  });
});

describe("the office", () => {
  it("sets up heads and a structure, publishes it, assigns the class and reads the roster and the pupil", async () => {
    await as("ADMIN");
    expect((await headsPost(json("/api/v1/fees/heads", ""))).status).toBe(422);
    const head = await headsPost(json("/api/v1/fees/heads", { name: "Tuition", code: "TUI", kind: "TUITION" }));
    expect(head.status).toBe(201);
    headId = (await head.json()).id;
    expect((await (await headsGet()).json()).heads.map((h: { code: string }) => h.code)).toEqual(["TUI"]);

    expect((await structuresPost(json("/api/v1/fees/structures", { name: "G5" }))).status).toBe(422);
    const created = await structuresPost(json("/api/v1/fees/structures", { name: "Grade 5 fees", gradeLevel: "5", instalments: [{ label: "Term 1", dueDateKey: "2026-09-01", lines: [{ headId, amountPaise: 1_200_00 }] }] }));
    expect(created.status).toBe(201);
    structureId = (await created.json()).id;
    const list = await (await structuresGet(get("/api/v1/fees/structures"))).json();
    expect(list.structures.map((s: { id: string; totalPaise: number }) => [s.id, s.totalPaise])).toEqual([[structureId, 1_200_00]]);
    expect((await structureGet(get("/x"), params({ structureId: otherStructureId }))).status).toBe(404);
    const detail = await (await structureGet(get("/x"), params({ structureId }))).json();
    expect(detail.classes.map((c: { id: string }) => c.id)).toEqual([classId]);
    expect((await publishPost(get("/x"), params({ structureId }))).status).toBe(200);
    const assigned = await plansPost(json("/api/v1/fees/plans", { structureId, classId }));
    expect(assigned.status).toBe(200);
    expect(await assigned.json()).toEqual({ assigned: 1, moved: 0, unchanged: 0, refused: [] });
    const roster = await (await rosterGet(get(`/api/v1/fees/classes/roster?classId=${classId}`))).json();
    expect(roster.pupils.map((p: { structureName: string; outstandingPaise: number }) => [p.structureName, p.outstandingPaise])).toEqual([["Grade 5 fees", 1_200_00]]);
    const pupil = await (await pupilGet(get("/x"), params({ studentMembershipId: pupilId }))).json();
    expect(pupil.demands).toHaveLength(1);
    expect(pupil.heads.map((h: { id: string }) => h.id)).toEqual([headId]);
    expect(pupil.structures.map((s: { id: string }) => s.id)).toEqual([structureId]);
    expect(pupil.todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("the counter records a payment with a receipt; the family and the office read the receipt, a stranger gets 404", async () => {
    await as("ADMIN");
    expect((await paymentsPost(json("/api/v1/fees/payments", { studentMembershipId: pupilId, amountPaise: 50, method: "CASH" }))).status).toBe(422);
    const paid = await paymentsPost(json("/api/v1/fees/payments", { studentMembershipId: pupilId, amountPaise: 700_00, method: "CASH", clientId: `api-${STAMP}` }));
    expect(paid.status).toBe(201);
    const body = await paid.json();
    expect(body.serial).toBe("RCPT/2026–27/000001");
    receiptId = body.receiptId;
    const replay = await paymentsPost(json("/api/v1/fees/payments", { studentMembershipId: pupilId, amountPaise: 700_00, method: "CASH", clientId: `api-${STAMP}` }));
    expect(replay.status).toBe(200);
    expect((await replay.json()).already).toBe(true);
    expect((await receiptGet(get("/x"), params({ receiptId }))).status).toBe(200);
    await as("PARENT");
    const receipt = await receiptGet(get("/x"), params({ receiptId }));
    expect(receipt.status).toBe(200);
    expect((await receipt.json()).snapshot.payment.amountPaise).toBe(700_00);
    await as("STRANGER");
    expect((await receiptGet(get("/x"), params({ receiptId }))).status).toBe(404);
    // A teacher has no door to receipts at all: 403 before the id is looked at.
    await as("TEACHER");
    expect((await receiptGet(get("/x"), params({ receiptId }))).status).toBe(403);
    await as(null);
    expect((await receiptGet(get("/x"), params({ receiptId }))).status).toBe(401);
  });

  it("settings, the gateway keys, the claims queue, the matcher, the export and the reminder", async () => {
    await as("ADMIN");
    expect((await settingsPost(json("/api/v1/fees/settings", { upiId: "zzapi@okaxis", upiPayee: "ZZ FeesApi School" }))).status).toBe(200);
    const settings = await (await settingsGet()).json();
    expect(settings.upiId).toBe("zzapi@okaxis");
    expect(settings.gateway).toBeNull();
    expect(settings.webhookUrl).toContain(`/api/webhooks/razorpay/${schoolId}`);
    expect((await gatewayPost(json("/api/v1/fees/settings/gateway", { keyId: "rzp_test_zzapi000001", secret: "zz-secret-1", webhookSecret: "zz-webhook-1" }))).status).toBe(200);
    expect((await (await settingsGet()).json()).gateway.keyId).toBe("rzp_test_zzapi000001");
    expect((await gatewayDelete()).status).toBe(200);
    expect((await (await settingsGet()).json()).gateway).toBeNull();
    expect((await (await claimsGet()).json()).claims).toEqual([]);
    expect((await matchPost(json("/api/v1/fees/claims/match", { csv: "" }))).status).toBe(422);
    expect((await (await matchPost(json("/api/v1/fees/claims/match", { csv: "UTR,Amount\nNOPE000000000001,1" }))).json()).matches[0].problem).toBe("no-claim");
    const csv = await (await exportCollectionsGet(get("/api/v1/fees/export/collections?fromKey=2026-06-01&toKey=2027-04-30"))).json();
    expect(csv.rows).toBe(1);
    expect(csv.filename).toMatch(/^fees-collections-/);
    expect((await exportCollectionsGet(get("/api/v1/fees/export/collections?fromKey=bad"))).status).toBe(422);
    // QA-55: a backwards window, and a day that does not exist, are refused naming the field (a backwards window was a 200 with an empty sheet).
    const backwards = await exportCollectionsGet(get("/api/v1/fees/export/collections?fromKey=2026-10-24&toKey=2026-04-01"));
    expect(backwards.status).toBe(422);
    expect(((await backwards.json()) as { issues?: Record<string, string> }).issues?.toKey).toBeTruthy();
    expect((await exportCollectionsGet(get("/api/v1/fees/export/collections?fromKey=2026-02-30&toKey=2026-03-01"))).status).toBe(422);
    expect(await (await remindPost(json("/api/v1/fees/remind", {}))).json()).toEqual({ families: 1, demands: 1 });
  });
});

describe("the family", () => {
  it("reads the child's dues, starts a UPI payment, claims it and polls it", async () => {
    await as("PARENT");
    const fam = await (await familyGet(get("/api/v1/fees/family"))).json();
    expect(fam.child.studentMembershipId).toBe(pupilId);
    expect(fam.child.totals.outstandingPaise).toBe(500_00);
    expect(fam.child.options.upi.vpa).toBe("zzapi@okaxis");
    expect(fam.child.payments[0].serial).toBe("RCPT/2026–27/000001");
    expect((await upiPost(json("/api/v1/fees/family/upi", {}))).status).toBe(422);
    const started = await upiPost(json("/api/v1/fees/family/upi", { studentMembershipId: pupilId, demandIds: fam.child.demands.map((d: { id: string }) => d.id) }));
    expect(started.status).toBe(201);
    const upi = await started.json();
    expect(upi.amountPaise).toBe(500_00);
    expect(upi.link.startsWith("upi://pay?")).toBe(true);
    expect((await upiClaimPost(json("/api/v1/fees/family/upi/claim", { paymentId: upi.paymentId, utr: "ZZAPI12345678901" }))).status).toBe(200);
    const status = await (await familyPaymentGet(get("/x"), params({ paymentId: upi.paymentId }))).json();
    expect(status.status).toBe("CLAIMED");
    // A parent with no child linked has no family door at all: 403 before any id is looked at.
    await as("STRANGER");
    expect((await familyPaymentGet(get("/x"), params({ paymentId: upi.paymentId }))).status).toBe(403);
    expect((await familyGet(get(`/api/v1/fees/family?childId=${pupilId}`))).status).toBe(403);
    await as("ADMIN");
    expect((await (await claimsGet()).json()).claims.map((c: { utr: string }) => c.utr)).toEqual(["ZZAPI12345678901"]);
  });
});
