/**
 * The pupil record is the office's to write. A guardian or the pupil reads
 * it and asks for a change; the office applies it or declines. Proved here:
 * the family's own save is refused; asking again replaces what waits and
 * rings nobody twice; the family takes a waiting ask back and a settled one
 * is answered as it stands; another family and another school's office find
 * nothing; a value the save refuses is refused when it is asked; a pupil who
 * has left cannot be asked about; the head decides as the admin does.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { savePupilRecord } from "@/lib/pupil-records";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as familyRecordGet } from "@/app/api/v1/family/record/route";
import { GET as familyChangesGet, POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";
import { POST as withdrawPost } from "@/app/api/v1/family/record/changes/[requestId]/withdraw/route";
import { GET as officeChangesGet } from "@/app/api/v1/office/record-changes/route";
import { POST as decidePost } from "@/app/api/v1/office/record-changes/[requestId]/decide/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
const users: Record<string, string> = {};
let pupil = "";
let leaver = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
type Who = "ADMIN" | "PRINCIPAL" | "PARENT" | "OTHER_PARENT" | "PUPIL" | "OTHER_ADMIN";
async function as(who: Who) {
  __resetCookies();
  if (who === "ADMIN" || who === "PRINCIPAL") await createSession(users[who]!, { schoolId, role: who });
  if (who === "OTHER_ADMIN") await createSession(users[who]!, { schoolId: otherSchoolId, role: "ADMIN" });
  if (who === "PARENT" || who === "OTHER_PARENT") await createSession(users[who]!, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(users[who]!, { schoolId, role: "STUDENT" });
}
const ask = (query: string, changes: Record<string, string>, reason = "ZZ we moved") => familyChangePost(json(`/api/v1/family/record/changes${query}`, { changes, reason }));
const decide = (id: string, body: { approve: boolean; reason?: string }) => decidePost(json(`/api/v1/office/record-changes/${id}/decide`, body), params({ requestId: id }));
const withdraw = (id: string) => withdrawPost(json(`/api/v1/family/record/changes/${id}/withdraw`, {}), params({ requestId: id }));

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  const school = (tag: string, code: string) => db.school.create({ data: { name: `ZZ RecChg ${tag} ${STAMP}`, slug: `zz-recchg-${tag}-${STAMP}`, code: `${code}${suffix}`, contactEmail: `zz-recchg-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  schoolId = (await school("a", "ZR")).id;
  otherSchoolId = (await school("b", "ZS")).id;
  for (const who of ["ADMIN", "PRINCIPAL", "PARENT", "OTHER_PARENT", "PUPIL", "OTHER_ADMIN", "LEAVER", "OTHER_PUPIL"]) {
    users[who] = (await db.user.create({ data: { name: `ZZ RecChg ${who}`, email: `zz-recchg-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
  }
  await db.membership.create({ data: { userId: users.ADMIN!, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.PRINCIPAL!, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.OTHER_ADMIN!, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" } });
  pupil = (await db.membership.create({ data: { userId: users.PUPIL!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRA${STAMP}` }, select: { id: true } })).id;
  leaver = (await db.membership.create({ data: { userId: users.LEAVER!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRB${STAMP}`, leftAt: new Date() }, select: { id: true } })).id;
  const otherPupil = (await db.membership.create({ data: { userId: users.OTHER_PUPIL!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRC${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: users.PARENT!, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: users.PARENT!, studentMembershipId: leaver, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: users.OTHER_PARENT!, studentMembershipId: otherPupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.pupilRecord.create({ data: { schoolId, studentMembershipId: pupil, fatherName: "Rahul Rane", city: "Pune", category: "OBC", admissionNumber: "GR-7" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: Object.values(users) } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the family reads and asks", () => {
  it("the family's own save is refused outright, for the guardian and for the pupil", async () => {
    for (const who of ["PARENT", "PUPIL"] as const) {
      await as(who);
      const ctx = (await getSession())!;
      await expect(savePupilRecord(ctx, pupil, { city: "Mumbai" })).rejects.toMatchObject({ key: "pupilRecord.askTheOffice" });
    }
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).city).toBe("Pune");
  });

  it("an ask may name the office's fields; it changes nothing while it waits; asking again replaces it and tells the office once", async () => {
    await as("PARENT");
    let res = await ask(`?childId=${pupil}`, { city: "Mumbai", category: "SC", admissionNumber: "GR-70" });
    expect(res.status).toBe(200);
    const first = await res.json();
    expect(first.changes).toEqual(expect.arrayContaining([{ field: "city", from: "Pune", to: "Mumbai" }, { field: "category", from: "OBC", to: "SC" }, { field: "admissionNumber", from: "GR-7", to: "GR-70" }]));
    const view = await (await familyRecordGet(get(`/api/v1/family/record?childId=${pupil}`))).json();
    expect(view.record).toMatchObject({ city: "Pune", category: "OBC", admissionNumber: "GR-7" });
    expect(view).toMatchObject({ canEdit: false, canRequest: true, change: { id: first.id } });

    // The pupil asks for something else: the same paper, rewritten, and now the pupil's.
    await as("PUPIL");
    res = await ask("", { city: "Nashik" }, "ZZ the city was wrong");
    const second = await res.json();
    expect(second).toMatchObject({ id: first.id, byPupil: true, status: "PENDING", reason: "ZZ the city was wrong" });
    expect(second.changes).toEqual([{ field: "city", from: "Pune", to: "Nashik" }]);
    expect(await db.recordChangeRequest.count({ where: { studentMembershipId: pupil, status: "PENDING" } })).toBe(1);
    // The admin and the head were told when it was first asked, and not again.
    const told = await db.notification.findMany({ where: { schoolId, titleKey: "recordChanges.notifAsked" }, select: { userId: true, url: true } });
    expect(told.map((n) => n.userId).sort()).toEqual([users.ADMIN, users.PRINCIPAL].sort());
    expect(told.every((n) => n.url === `/admin/records/${pupil}`)).toBe(true);
  });

  it("a value the save would refuse is refused when it is asked: a PIN of five digits, a language off the list, a category off the list", async () => {
    await as("PARENT");
    // A refused value is a 422 naming its field, as the category's is (TA-602; it was a 403).
    expect((await ask(`?childId=${pupil}`, { postalCode: "41100" })).status).toBe(422);
    expect((await ask(`?childId=${pupil}`, { motherTongue: "Klingon" })).status).toBe(422);
    expect((await ask(`?childId=${pupil}`, { category: "Maratha" })).status).toBe(422);
    expect((await ask(`?childId=${pupil}`, { city: "Nashik" }, "")).status).toBe(422);
  });

  it("another family finds nothing of it, and cannot ask about a child who is not theirs or take the ask back", async () => {
    const open = await db.recordChangeRequest.findFirstOrThrow({ where: { studentMembershipId: pupil, status: "PENDING" } });
    await as("OTHER_PARENT");
    expect((await ask(`?childId=${pupil}`, { city: "Delhi" })).status).not.toBe(200);
    expect((await familyChangesGet(get(`/api/v1/family/record/changes?childId=${pupil}`))).status).not.toBe(200);
    expect((await withdraw(open.id)).status).toBe(404);
    expect((await decide(open.id, { approve: true })).status).toBe(403);
    expect((await db.recordChangeRequest.findUniqueOrThrow({ where: { id: open.id } })).status).toBe("PENDING");
  });

  it("a pupil who has left cannot be asked about", async () => {
    await as("PARENT");
    const res = await ask(`?childId=${leaver}`, { city: "Mumbai" });
    expect(res.status).not.toBe(200);
    expect(await db.recordChangeRequest.count({ where: { studentMembershipId: leaver } })).toBe(0);
  });
});

describe("the office decides", () => {
  it("another school's office finds no such ask and its queue is empty", async () => {
    const open = await db.recordChangeRequest.findFirstOrThrow({ where: { studentMembershipId: pupil, status: "PENDING" } });
    await as("OTHER_ADMIN");
    expect((await decide(open.id, { approve: true })).status).toBe(404);
    expect(await (await officeChangesGet(get("/api/v1/office/record-changes"))).json()).toEqual({ items: [], pending: 0 });
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).city).toBe("Pune");
  });

  it("the head declines with a sentence the family reads; the family is told; the record is as it was", async () => {
    await as("PRINCIPAL");
    const queue = await (await officeChangesGet(get("/api/v1/office/record-changes?status=PENDING"))).json();
    expect(queue.pending).toBe(1);
    expect(queue.items[0]).toMatchObject({ studentMembershipId: pupil, can: { decide: true, withdraw: false } });
    const res = await decide(queue.items[0].id, { approve: false, reason: "Please bring the rent agreement." });
    expect(await res.json()).toMatchObject({ status: "DECLINED", declineReason: "Please bring the rent agreement." });
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).city).toBe("Pune");
    const told = await db.notification.findMany({ where: { schoolId, titleKey: "recordChanges.notifDeclined" }, select: { userId: true, body: true } });
    // The guardian, and the pupil because the pupil asked.
    expect(told.map((n) => n.userId).sort()).toEqual([users.PARENT, users.PUPIL].sort());
    expect(told.every((n) => n.body === "Please bring the rent agreement.")).toBe(true);
    await as("PARENT");
    const list = await (await familyChangesGet(get(`/api/v1/family/record/changes?childId=${pupil}`))).json();
    expect(list).toMatchObject({ pending: 0, items: [{ status: "DECLINED", declineReason: "Please bring the rent agreement." }] });
  });

  it("the family takes a waiting ask back; taking it back again, or deciding it, answers it as it stands", async () => {
    await as("PARENT");
    const asked = await (await ask(`?childId=${pupil}`, { city: "Mumbai" })).json();
    expect(await (await withdraw(asked.id)).json()).toMatchObject({ status: "WITHDRAWN", can: { withdraw: false } });
    expect(await (await withdraw(asked.id)).json()).toMatchObject({ status: "WITHDRAWN" });
    await as("ADMIN");
    expect(await (await decide(asked.id, { approve: true })).json()).toMatchObject({ status: "WITHDRAWN" });
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).city).toBe("Pune");
  });

  it("the admin approves: the values are on the record, a blank clears a field, the family's date is set, and the audit names fields and no values", async () => {
    await as("PARENT");
    const asked = await (await ask(`?childId=${pupil}`, { city: "Mumbai", fatherName: "", bpl: "yes", annualIncome: "0240000", admissionDate: "2024-06-15" })).json();
    expect(asked.changes).toEqual(expect.arrayContaining([{ field: "annualIncome", from: null, to: "240000" }, { field: "fatherName", from: "Rahul Rane", to: null }]));
    await as("ADMIN");
    expect(await (await decide(asked.id, { approve: true })).json()).toMatchObject({ status: "APPLIED", decidedByName: "ZZ RecChg ADMIN" });
    const row = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } });
    expect(row).toMatchObject({ city: "Mumbai", fatherName: null, bpl: true, annualIncome: 240000, category: "OBC", admissionNumber: "GR-7" });
    expect(row.admissionDate?.toISOString().slice(0, 10)).toBe("2024-06-15");
    expect(row.familyFilledAt).not.toBeNull();
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { startsWith: "pupilRecord." } }, select: { action: true, meta: true } });
    expect(audits.some((a) => a.action === "pupilRecord.change.apply")).toBe(true);
    expect(audits.every((a) => !a.meta.includes("Mumbai") && !a.meta.includes("rent agreement") && !a.meta.includes("we moved"))).toBe(true);
  });
});
