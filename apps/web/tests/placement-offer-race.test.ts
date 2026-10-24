/**
 * QA-14 (QA campaign of 24 October 2026, E2E-B3), with QA-32 (E2E-B9).
 *
 * QA-14: at sac a student holding two non-dream offers accepted both at the
 * same moment from two tabs; both answered 200 and both stood, because the
 * one-offer rule's "earlier acceptance" was read outside any lock. Now the
 * answer takes the student's membership row first and reads the earlier
 * acceptances again under it: one acceptance stands and the other is refused
 * placement.refuseOneOffer.
 *
 * QA-32: an accept and a decline of one offer at once stamped both
 * acceptedAt and declinedAt. Now the offer is answered by a conditional
 * update that matches only while it is unanswered; the loser is told
 * placement.refuseOfferAnswered.
 *
 * At two ZZ colleges of this suite's own (one hosting a pooled drive the
 * other's student applied to), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { answerOffer } from "@/lib/placement";
import { RuleRefusal } from "@/lib/rule-refusal";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-offer-race-${who.toLowerCase()}-${STAMP}@test.invalid`;
const id: Record<string, string> = {};
const STUDENTS = ["s1", "s2", "s3", "s4", "s5"] as const;

const student = (key: (typeof STUDENTS)[number]): ActiveContext => ({
  sessionId: "test-session",
  membershipId: id[key]!,
  schoolId: id.college!,
  role: "STUDENT",
  user: { id: id[`${key}User`]!, name: `ZZ Offer ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
});

async function drive(schoolId: string, title: string, pool: string[] = []) {
  return (await db.drive.create({ data: { schoolId, companyId: id.company!, kind: pool.length ? "POOLED" : "ON_CAMPUS", title, packageMinRupees: 400_000, packageMaxRupees: 700_000, poolSchoolIds: JSON.stringify(pool), status: "OFFERS", createdByUserId: id.tpoUser! }, select: { id: true } })).id;
}
async function offer(schoolId: string, driveId: string, key: string, packageRupees: number) {
  return (await db.offer.create({ data: { schoolId, driveId, studentMembershipId: id[key]!, packageRupees, byUserId: id.tpoUser! }, select: { id: true } })).id;
}

beforeAll(async () => {
  const school = (tag: string) => db.school.create({ data: { name: `ZZ Offer Race ${tag} ${STAMP}`, slug: `zz-offer-race-${tag.toLowerCase()}-${STAMP}`, code: `ZOR${tag[0]}${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL(`school-${tag}`), timezone: "Asia/Kolkata" }, select: { id: true } });
  id.college = (await school("Own")).id;
  id.host = (await school("Host")).id;
  await db.schoolModule.createMany({ data: [id.college, id.host].flatMap((schoolId) => ["PLACEMENT", "ACADEMICS"].map((module) => ({ schoolId, module }))) });
  id.tpoUser = (await db.user.create({ data: { name: "ZZ Offer TPO", email: MAIL("tpo") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: id.tpoUser, schoolId: id.college, role: "TPO", status: "ACTIVE" } });
  for (const key of STUDENTS) {
    id[`${key}User`] = (await db.user.create({ data: { name: `ZZ Offer ${key}`, email: MAIL(key) }, select: { id: true } })).id;
    id[key] = (await db.membership.create({ data: { userId: id[`${key}User`]!, schoolId: id.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  }
  id.company = (await db.company.create({ data: { name: `ZZ Offer Race Co ${STAMP}`, identifier: `ZZ-OFFER-RACE-${STAMP}`, pointOfContact: "ZZ" }, select: { id: true } })).id;
  id.driveA = await drive(id.college, "ZZ Drive A");
  id.driveB = await drive(id.college, "ZZ Drive B");
  id.drivePooled = await drive(id.host, "ZZ Pooled drive", [id.college]);
  // s1–s3: two non-dream offers each on the own college's drives (₹6,50,000 and ₹5,00,000, as at sac).
  for (const key of ["s1", "s2", "s3"]) {
    id[`${key}A`] = await offer(id.college, id.driveA, key, 650_000);
    id[`${key}B`] = await offer(id.college, id.driveB, key, 500_000);
  }
  // s4: one offer, accepted and declined at once (QA-32).
  id.s4A = await offer(id.college, id.driveA, "s4", 650_000);
  // s5: one offer at home and one on the host college's pooled drive.
  id.s5A = await offer(id.college, id.driveA, "s5", 650_000);
  await db.driveApplication.create({ data: { schoolId: id.college, driveId: id.drivePooled, studentMembershipId: id.s5!, studentUserId: id.s5User!, schoolName: `ZZ Offer Race Own ${STAMP}`, consentAt: new Date() } });
  id.s5P = await offer(id.host, id.drivePooled, "s5", 600_000);
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { schoolId: { in: [id.college!, id.host!] } } });
  await db.school.deleteMany({ where: { id: { in: [id.college!, id.host!] } } });
  await db.company.deleteMany({ where: { id: id.company } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const refusalKey = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? (r.reason instanceof RuleRefusal ? r.reason.key : String(r.reason)) : null);

describe("QA-14: two acceptances at the same moment", () => {
  it.each(["s1", "s2", "s3"] as const)("%s holds one offer; the other accept is refused placement.refuseOneOffer", async (key) => {
    const results = await Promise.allSettled([answerOffer(student(key), id[`${key}A`]!, true), answerOffer(student(key), id[`${key}B`]!, true)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["placement.refuseOneOffer"]);
    const rows = await db.offer.findMany({ where: { studentMembershipId: id[key] }, select: { acceptedAt: true, declinedAt: true } });
    expect(rows.filter((r) => r.acceptedAt && !r.declinedAt)).toHaveLength(1);
    expect(rows.filter((r) => !r.acceptedAt && !r.declinedAt)).toHaveLength(1);
  });

  it("holds across colleges: an offer at home and one on a pooled drive's host", async () => {
    const results = await Promise.allSettled([answerOffer(student("s5"), id.s5A!, true), answerOffer(student("s5"), id.s5P!, true)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["placement.refuseOneOffer"]);
    expect(await db.offer.count({ where: { studentMembershipId: id.s5, acceptedAt: { not: null }, declinedAt: null } })).toBe(1);
  });
});

describe("QA-32: an accept and a decline of one offer at the same moment", () => {
  it("one answer stands and the other is told the offer is answered", async () => {
    const results = await Promise.allSettled([answerOffer(student("s4"), id.s4A!, true), answerOffer(student("s4"), id.s4A!, false)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["placement.refuseOfferAnswered"]);
    const row = await db.offer.findUniqueOrThrow({ where: { id: id.s4A }, select: { acceptedAt: true, declinedAt: true } });
    expect(Boolean(row.acceptedAt) !== Boolean(row.declinedAt)).toBe(true);
  });
});
