/**
 * TA-111 (testing analysis of 13 November 2026): the health card is saved whole, so a form opened before another
 * writer's save wrote its stale copy over theirs: the office's afternoon save of a form opened in the morning blanked
 * the allergy and the contact a guardian had added at noon, and nobody was told. A save now names the card it was
 * drawn from (basedOn, the card's updatedAt, or null for no card yet); a card changed since is refused 409 and kept,
 * the same form sent twice is answered as saved, and a body without basedOn (an older phone) is applied as before.
 *
 * One scratch ZZ school of this suite's own, through the owner connection, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as familyPost } from "@/app/api/v1/family/health/route";
import { GET as staffGet, POST as staffPost } from "@/app/api/v1/staff/pupils/[membershipId]/health/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let parentUserId = "";
let pupilMembershipId = "";

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = (membershipId: string) => ({ params: Promise.resolve({ membershipId }) });
async function as(who: "ADMIN" | "PARENT") {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  else await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}
type Card = { card: { allergies: string; doctorPhone: string; contacts: unknown[]; updatedAt: string } | null };
const office = async (body: Record<string, unknown>) => {
  await as("ADMIN");
  return staffPost(json(`/api/v1/staff/pupils/${pupilMembershipId}/health`, body), params(pupilMembershipId));
};
const family = async (body: Record<string, unknown>) => {
  await as("PARENT");
  return familyPost(json("/api/v1/family/health", { ...body, childId: pupilMembershipId }));
};
const stored = () => db.healthCard.findUniqueOrThrow({ where: { studentMembershipId: pupilMembershipId }, select: { allergies: true, doctorPhone: true, contactsJson: true, updatedAt: true } });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ TA Health Card ${STAMP}`, slug: `zz-tacp-health-${STAMP}`, code: `ZCH${suffix}`, contactEmail: `zz-tacp-health-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ TACP Health ${who}`, email: `zz-tacp-health-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, parent, pupil] = [await mk("Admin"), await mk("Parent"), await mk("Pupil")];
  adminUserId = admin.id;
  parentUserId = parent.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  pupilMembershipId = (await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilMembershipId, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, parentUserId] } } });
  await db.auditLog.deleteMany({ where: { schoolId } }).catch(() => {});
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a stale health card form", () => {
  it("TA-111: the office's form opened before the card existed does not erase the guardian's allergy saved since", async () => {
    // The office opens the pupil's page: no card yet.
    await as("ADMIN");
    const opened = (await (await staffGet(new Request(`http://localhost/api/v1/staff/pupils/${pupilMembershipId}/health`), params(pupilMembershipId))).json()) as Card;
    expect(opened.card).toBeNull();
    // At noon the guardian adds the allergy and a contact.
    const guardian = await family({ allergies: "Peanuts", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], basedOn: null });
    expect(guardian.status).toBe(200);
    // In the afternoon the office saves the doctor's number from the form it opened in the morning.
    const stale = await office({ doctorPhone: "9876500002", basedOn: null });
    expect(stale.status).toBe(409);
    expect(((await stale.json()) as { code: string }).code).toBe("CONFLICT");
    const card = await stored();
    expect(card.allergies).toBe("Peanuts");
    expect(card.doctorPhone).toBeNull();
    expect(card.contactsJson).toContain("ZZ Aunt");
  });

  it("TA-111: a save drawn from an earlier version of the card is refused 409 and the newer card kept; one drawn from the current version is saved", async () => {
    const before = await stored();
    const v1 = before.updatedAt.toISOString();
    // The office reads the card as it stands (v1); the guardian then changes it.
    const guardian = (await (await family({ allergies: "Peanuts, dust", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], basedOn: v1 })).json()) as Card;
    expect(guardian.card?.allergies).toBe("Peanuts, dust");
    const stale = await office({ allergies: "Peanuts", doctorPhone: "9876500002", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], basedOn: v1 });
    expect(stale.status).toBe(409);
    expect((await stored()).allergies).toBe("Peanuts, dust");
    const fresh = await office({ allergies: "Peanuts, dust", doctorPhone: "9876500002", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], basedOn: guardian.card!.updatedAt });
    expect(fresh.status).toBe(200);
    expect((await stored()).doctorPhone).toBe("9876500002");
  });

  it("TA-111: the same form sent twice is answered as saved both times", async () => {
    const at = (await stored()).updatedAt.toISOString();
    const form = { allergies: "Peanuts, dust", doctorPhone: "9876500003", contacts: [{ name: "ZZ Aunt", relation: "Aunt", phone: "9876500001" }], basedOn: at };
    expect((await office(form)).status).toBe(200);
    expect((await office(form)).status).toBe(200);
    expect((await stored()).doctorPhone).toBe("9876500003");
  });

  it("TA-111: a body with no basedOn (the web before this, an older phone) is applied whole, as before", async () => {
    const res = await office({ allergies: "Peanuts", doctorPhone: "9876500004" });
    expect(res.status).toBe(200);
    expect(await stored()).toMatchObject({ allergies: "Peanuts", doctorPhone: "9876500004", contactsJson: "[]" });
  });
});
