/**
 * Who may touch a PEN, and how a correction is agreed: the admin enters it
 * once, the family's form cannot set it, a principal cannot; a second entry
 * is refused and routed to a proposal; the proposal tells the head and the
 * guardian, each decides once, both approvals change the number on the
 * account and the record, either refusal settles it, the admin may withdraw,
 * and a pupil with no guardian rests on the head's word alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";
import { POST as proposePost } from "@/app/api/v1/office/pupil-records/[membershipId]/pen-change/route";
import { GET as officeListGet } from "@/app/api/v1/office/pen-changes/route";
import { POST as headDecide } from "@/app/api/v1/office/pen-changes/[requestId]/decide/route";
import { POST as withdrawPost } from "@/app/api/v1/office/pen-changes/[requestId]/withdraw/route";
import { GET as familyListGet } from "@/app/api/v1/family/pen-changes/route";
import { POST as guardianDecide } from "@/app/api/v1/family/pen-changes/[requestId]/decide/route";

const db = new PrismaClient();
const STAMP = Date.now();
const PEN_1 = `31${String(STAMP).slice(-9)}`;
const PEN_2 = `32${String(STAMP).slice(-9)}`;
const PEN_3 = `33${String(STAMP).slice(-9)}`;
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let parentUserId = "";
let pupilUserId = "";
let pupil = "";
let orphan = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "PRINCIPAL" | "PARENT" | "PUPIL" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(pupilUserId, { schoolId, role: "STUDENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ PenChg School ${STAMP}`, slug: `zz-penchg-${STAMP}`, code: `ZC${suffix}`, contactEmail: `zz-penchg-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ PenChg ${who}`, email: `zz-penchg-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, parent, p, o] = await Promise.all([mk("Admin"), mk("Principal"), mk("Parent"), mk("Riya Rane"), mk("Orphan Child")]);
  adminUserId = admin.id; principalUserId = principal.id; parentUserId = parent.id; pupilUserId = p.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  pupil = (await db.membership.create({ data: { userId: p.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZCA${STAMP}` }, select: { id: true } })).id;
  orphan = (await db.membership.create({ data: { userId: o.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZCB${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, parentUserId, pupilUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

let requestId = "";

describe("who enters and who corrects", () => {
  it("the family and the head cannot set it; the admin enters it once; a second entry is refused and pointed at a proposal", async () => {
    await as("PARENT");
    // The family writes nothing, and what it may ask the office to change does not include the PEN: a body naming it is refused whole.
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { penNumber: PEN_1, fatherName: "Rahul" }, reason: "ZZ test" }))).status).toBe(422);
    await as("PUPIL");
    expect((await familyChangePost(json("/api/v1/family/record/changes", { changes: { penNumber: PEN_1 }, reason: "ZZ test" }))).status).toBe(422);
    await as("PRINCIPAL");
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { penNumber: PEN_1 }), params({ membershipId: pupil }))).status).toBe(403);
    await as("ADMIN");
    let res = await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }));
    expect((await res.json())).toMatchObject({ penEditable: true, penChange: null });
    res = await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { penNumber: PEN_1 }), params({ membershipId: pupil }));
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.record.penNumber).toBe(PEN_1);
    expect(view.penEditable).toBe(false);
    // The account's number is in the way: a 409 (TA-602; it was a 403).
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { penNumber: PEN_2 }), params({ membershipId: pupil }))).status).toBe(409);
    // The same number again, as the form always sends it, is fine.
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { penNumber: PEN_1, city: "Pune" }), params({ membershipId: pupil }))).status).toBe(200);
    // Once on record, the family can no more ask for another.
    await as("PARENT");
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { penNumber: PEN_2 }, reason: "ZZ test" }))).status).toBe(422);
    expect(await db.recordChangeRequest.count({ where: { schoolId } })).toBe(0);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "pen.set", targetId: pupil } });
    expect(audit).not.toBeNull();
    expect(audit!.meta).not.toContain(PEN_1);
  });

  it("the admin proposes with a reason; nobody else may; a proposal on a pupil with no number is refused; the head and the family are told; the same number again is the same ask", async () => {
    await as("PRINCIPAL");
    expect((await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_2, reason: "x" }), params({ membershipId: pupil }))).status).toBe(403);
    await as("ADMIN");
    // No number to correct is a state in the way (409); the same number is a value refused (422) (TA-602; both were 403).
    expect((await proposePost(json(`/api/v1/office/pupil-records/${orphan}/pen-change`, { toPen: PEN_2, reason: "x" }), params({ membershipId: orphan }))).status).toBe(409);
    expect((await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_1, reason: "same" }), params({ membershipId: pupil }))).status).toBe(422);
    expect((await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: "12" }), params({ membershipId: pupil }))).status).toBe(422);
    let res = await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_2, reason: "Two digits were swapped at entry." }), params({ membershipId: pupil }));
    expect(res.status).toBe(201);
    const proposed = await res.json();
    requestId = proposed.id;
    expect(proposed).toMatchObject({ studentMembershipId: pupil, fromPen: PEN_1, toPen: PEN_2, status: "PENDING", requestedByName: "ZZ PenChg Admin", principal: { decided: false }, guardian: { decided: false, waived: false }, can: { decide: false, withdraw: true } });
    expect((await (await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_2, reason: "again" }), params({ membershipId: pupil }))).json()).id).toBe(requestId);
    res = await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }));
    expect((await res.json()).penChange.id).toBe(requestId);
    const toldHead = await db.notification.findFirst({ where: { userId: principalUserId, titleKey: "pupilRecord.notifPenProposed" } });
    const toldParent = await db.notification.findFirst({ where: { userId: parentUserId, titleKey: "pupilRecord.notifPenProposed" } });
    expect(toldHead?.url).toBe(`/admin/records/${pupil}`);
    expect(toldParent?.url).toBe(`/parent/record?child=${pupil}`);
    expect(toldParent?.body).toBe("Two digits were swapped at entry.");
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "pen.propose" } });
    expect(JSON.parse(audit!.meta)).toEqual({ requestId, removes: false, guardianWaived: false, replaced: null });
    expect(audit!.meta).not.toContain(PEN_2);
    await as("PRINCIPAL");
    res = await officeListGet(get("/api/v1/office/pen-changes"));
    const list = await res.json();
    expect(list.pending).toBe(1);
    expect(list.items[0]).toMatchObject({ id: requestId, can: { decide: true, withdraw: false } });
  });

  it("both approvals change the number on the account and the record and tell everyone; each decides once; a stranger 404", async () => {
    await as("PARENT");
    let res = await familyListGet();
    expect((await res.json())).toMatchObject({ pending: 1 });
    res = await guardianDecide(json(`/api/v1/family/pen-changes/${requestId}/decide`, { approve: true }), params({ requestId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "PENDING", guardian: { decided: true, approved: true, by: "ZZ PenChg Parent" }, principal: { decided: false }, can: { decide: false } });
    // Deciding again changes nothing, whichever way.
    expect((await (await guardianDecide(json(`/api/v1/family/pen-changes/${requestId}/decide`, { approve: false }), params({ requestId }))).json()).guardian.approved).toBe(true);
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUserId }, select: { penNumber: true } })).penNumber).toBe(PEN_1);
    // Somebody else's guardian is nobody here.
    const stranger = await db.user.create({ data: { name: `ZZ PenChg Stranger ${STAMP}`, email: `zz-penchg-stranger-${STAMP}@test.invalid` }, select: { id: true } });
    __resetCookies();
    await createSession(stranger.id, { schoolId: null, role: "PARENT" });
    expect((await guardianDecide(json(`/api/v1/family/pen-changes/${requestId}/decide`, { approve: true }), params({ requestId }))).status).toBe(403);
    await as("PRINCIPAL");
    res = await headDecide(json(`/api/v1/office/pen-changes/${requestId}/decide`, { approve: true }), params({ requestId }));
    expect(res.status).toBe(200);
    const applied = await res.json();
    expect(applied).toMatchObject({ status: "APPLIED", principal: { decided: true, approved: true, by: "ZZ PenChg Principal" } });
    expect(applied.appliedAt).not.toBeNull();
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUserId }, select: { penNumber: true } })).penNumber).toBe(PEN_2);
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil }, select: { penNumber: true } })).penNumber).toBe(PEN_2);
    expect((await db.notification.findFirst({ where: { userId: adminUserId, titleKey: "pupilRecord.notifPenApplied" } }))).not.toBeNull();
    expect((await db.notification.findFirst({ where: { userId: parentUserId, titleKey: "pupilRecord.notifPenApplied" } }))).not.toBeNull();
    const audits = (await db.auditLog.findMany({ where: { schoolId, action: { in: ["pen.decide", "pen.apply"] } }, select: { action: true, meta: true } })).map((r) => [r.action, r.meta]);
    expect(audits.map((a) => a[0]).sort()).toEqual(["pen.apply", "pen.decide", "pen.decide"]);
    for (const [, meta] of audits) expect(meta).not.toContain(PEN_2);
    await as("ADMIN");
    res = await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }));
    expect((await res.json())).toMatchObject({ penChange: null, penEditable: false });
  });

  it("a refusal settles it and a withdrawal too; a new proposal replaces a pending one; a pupil with no guardian rests on the head alone", async () => {
    await as("ADMIN");
    let res = await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_3, reason: "Portal shows another number." }), params({ membershipId: pupil }));
    const second = await res.json();
    await as("PRINCIPAL");
    res = await headDecide(json(`/api/v1/office/pen-changes/${second.id}/decide`, { approve: false, reason: "The portal agrees with what we have." }), params({ requestId: second.id }));
    expect(await res.json()).toMatchObject({ status: "REJECTED", decisionReason: "The portal agrees with what we have." });
    await as("PARENT");
    expect((await (await guardianDecide(json(`/api/v1/family/pen-changes/${second.id}/decide`, { approve: true }), params({ requestId: second.id }))).json()).status).toBe("REJECTED");
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUserId }, select: { penNumber: true } })).penNumber).toBe(PEN_2);
    await as("ADMIN");
    res = await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: PEN_3, reason: "Once more." }), params({ membershipId: pupil }));
    const third = await res.json();
    res = await proposePost(json(`/api/v1/office/pupil-records/${pupil}/pen-change`, { toPen: null, reason: "Remove it instead." }), params({ membershipId: pupil }));
    const fourth = await res.json();
    expect(fourth.toPen).toBeNull();
    expect((await db.penChangeRequest.findUniqueOrThrow({ where: { id: third.id } })).status).toBe("WITHDRAWN");
    res = await withdrawPost(get(`/api/v1/office/pen-changes/${fourth.id}/withdraw`), params({ requestId: fourth.id }));
    expect((await res.json()).status).toBe("WITHDRAWN");
    expect((await (await withdrawPost(get(`/api/v1/office/pen-changes/${fourth.id}/withdraw`), params({ requestId: fourth.id }))).json()).status).toBe("WITHDRAWN");
    // The orphan: the admin enters, then proposes; the head's approval alone applies it.
    await recordPost(json(`/api/v1/office/pupil-records/${orphan}`, { penNumber: PEN_3 }), params({ membershipId: orphan }));
    res = await proposePost(json(`/api/v1/office/pupil-records/${orphan}/pen-change`, { toPen: null, reason: "Entered on the wrong child." }), params({ membershipId: orphan }));
    const waived = await res.json();
    expect(waived.guardian).toMatchObject({ waived: true, decided: false });
    await as("PRINCIPAL");
    res = await headDecide(json(`/api/v1/office/pen-changes/${waived.id}/decide`, { approve: true }), params({ requestId: waived.id }));
    expect((await res.json()).status).toBe("APPLIED");
    const orphanUser = await db.membership.findUniqueOrThrow({ where: { id: orphan }, select: { user: { select: { penNumber: true } } } });
    expect(orphanUser.user.penNumber).toBeNull();
    res = await officeListGet(get("/api/v1/office/pen-changes?status=APPLIED"));
    expect((await res.json()).items.map((r: { id: string }) => r.id).sort()).toEqual([requestId, waived.id].sort());
  });
});
