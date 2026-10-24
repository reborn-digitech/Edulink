/**
 * QA-30, QA-31, QA-33 and QA-48 (QA campaign of 24 October 2026, E2E-B7, B8,
 * B10 and B11), the library run AS THE APP ROLE, through the policies, each
 * caller bound as its own request would be (a college's people to the
 * college and themselves, a recruiter to no school and themselves).
 *
 *   - QA-30: the TPO pressing Accept on one recruiter requirement twice at
 *     once made two DRAFT drives. Now a drive is one per requirement at a
 *     college (the unique key Drive_schoolId_requirementId_key), and the
 *     losing press is answered with the drive the winner made.
 *   - QA-31: applying to a drive from two devices at once answered 200 and
 *     500 (the unique key held; the second device read "Something went
 *     wrong"). Now the loser is told placement.refuseApplied (409).
 *   - QA-33: two recruiters of one company offering one candidate at once
 *     each saw their own package recorded while the last write was kept and
 *     the student was told twice. The placement rule is one offer per drive
 *     and candidate (Offer_driveId_studentMembershipId_key), which the
 *     company may correct until it is answered: so a fresh offer is created
 *     only, an edit changes only the offer the recorder read, and the loser
 *     of a race is refused placement.refuseOfferChangedMeanwhile (409) with
 *     the package that stands; the student is told once; an edit's audit row
 *     carries the package it replaced.
 *   - QA-48: the recruiter's "joined" answer carried studentName "", since a
 *     recruiter cannot read the student's membership. The name now comes off
 *     the application, as the offer's answer does.
 *
 * At a ZZ college of this suite's own, removed afterwards by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";

const OWNER_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = process.env.DATABASE_APP_URL;

const { db: appDb } = await import("@/lib/db");
const { forTenant } = await import("@/lib/tenant-context");
const { acceptRequirement, applyToDrive, recordOffer, recordJoined } = await import("@/lib/placement");
const { recruiterActor, recruiterActorForOffer } = await import("@/lib/placement-recruiter");
const { RuleRefusal } = await import("@/lib/rule-refusal");

const db = new PrismaClient({ datasourceUrl: OWNER_URL });
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-pl-lows-${who.toLowerCase()}-${STAMP}@test.invalid`;
const id: Record<string, string> = {};

const PREFS = { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never;
const ctxOf = (userKey: string, role: "TPO" | "STUDENT" | "RECRUITER", membershipKey: string | null): ActiveContext => ({
  sessionId: "test-session",
  membershipId: membershipKey ? id[membershipKey]! : null,
  schoolId: role === "RECRUITER" ? null : id.college!,
  role,
  user: { id: id[userKey]!, name: `ZZ PL Lows ${userKey}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: PREFS },
});
/** As the request would bind it: a college's person to the college, a recruiter to none. */
const asCollege = <T>(userKey: string, work: () => Promise<T>) => forTenant({ schoolIds: [id.college!], userId: id[userKey]!, joinCode: null, isSuperuser: false }, work);
const asRecruiter = <T>(userKey: string, work: () => Promise<T>) => forTenant({ schoolIds: [], userId: id[userKey]!, joinCode: null, isSuperuser: false }, work);

const refusalKey = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? (r.reason instanceof RuleRefusal ? r.reason.key : String(r.reason)) : null);
const fulfilled = <T>(rs: PromiseSettledResult<T>[]) => rs.filter((r): r is PromiseFulfilledResult<T> => r.status === "fulfilled").map((r) => r.value);

async function liveDrive(title: string, status: string) {
  return (await db.drive.create({ data: { schoolId: id.college!, companyId: id.company!, kind: "ON_CAMPUS", title, packageMinRupees: 500_000, packageMaxRupees: 800_000, status, createdByUserId: id.tpoUser! }, select: { id: true } })).id;
}
async function applied(driveId: string, key: string) {
  await db.driveApplication.create({ data: { schoolId: id.college!, driveId, studentMembershipId: id[key]!, studentUserId: id[`${key}User`]!, schoolName: `ZZ PL Lows ${STAMP}`, consentAt: new Date() } });
}

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ PL Lows ${STAMP}`, slug: `zz-pl-lows-${STAMP}`, code: `ZPLL${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL("school"), timezone: "Asia/Kolkata" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: ["PLACEMENT", "ACADEMICS"].map((module) => ({ schoolId: c, module })) });
  const user = async (key: string, name: string) => (id[key] = (await db.user.create({ data: { name, email: MAIL(key) }, select: { id: true } })).id);
  await user("tpoUser", "ZZ PL Lows TPO");
  id.tpo = (await db.membership.create({ data: { userId: id.tpoUser!, schoolId: c, role: "TPO", status: "ACTIVE" }, select: { id: true } })).id;
  for (const [key, name] of [["s1", "ZZ Aarti Lows"], ["s2", "ZZ Bhushan Lows"], ["s3", "ZZ Chitra Lows"], ["s4", "ZZ Dinesh Lows"]] as const) {
    await user(`${key}User`, name);
    id[key] = (await db.membership.create({ data: { userId: id[`${key}User`]!, schoolId: c, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  }
  // Two recruiters of one company, both addresses proved and both bindings accepted.
  for (const key of ["r1", "r2"]) {
    await user(key, `ZZ PL Lows recruiter ${key}`);
    await db.user.update({ where: { id: id[key] }, data: { emailVerifiedAt: new Date() } });
  }
  await db.recruiterProfile.createMany({ data: [{ userId: id.r1!, companyName: "ZZ PL Lows Co" }, { userId: id.r2!, companyName: "ZZ PL Lows Co" }] });
  id.company = (await db.company.create({ data: { name: `ZZ PL Lows Co ${STAMP}`, identifier: `ZZ-PL-LOWS-${STAMP}`, sectors: JSON.stringify(["IT_SOFTWARE"]), pointOfContact: "ZZ", verifiedAt: new Date() }, select: { id: true } })).id;
  await db.companyRecruiter.createMany({ data: [{ companyId: id.company, userId: id.r1!, acceptedAt: new Date() }, { companyId: id.company, userId: id.r2!, acceptedAt: new Date() }] });
  // QA-30: a requirement r1 posted to this college.
  id.requirement = (await db.requirement.create({ data: { companyId: id.company, byUserId: id.r1!, role: `ZZ Analyst ${STAMP}`, packageRupees: 600_000, rounds: JSON.stringify([{ kind: "APTITUDE", note: "" }]), targetSchoolIds: JSON.stringify([c]) }, select: { id: true } })).id;
  // QA-31: an OPEN drive with no conditions.
  id.openDrive = await liveDrive("ZZ Open drive", "OPEN");
  // QA-33 and QA-48: a drive at OFFERS, s1 and s2 applied (consented), s3 applied with an offer accepted.
  id.offersDrive = await liveDrive("ZZ Offers drive", "OFFERS");
  for (const key of ["s1", "s2", "s3", "s4"]) await applied(id.offersDrive, key);
  id.s3Offer = (await db.offer.create({ data: { schoolId: c, driveId: id.offersDrive, studentMembershipId: id.s3!, packageRupees: 650_000, byUserId: id.r1!, acceptedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.drive.deleteMany({ where: { schoolId: id.college } });
  await db.requirement.deleteMany({ where: { id: id.requirement } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.company.deleteMany({ where: { id: id.company } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  process.env.DATABASE_URL = OWNER_URL;
});

describe("the suite", () => {
  it("runs as the app role, not the owner", async () => {
    const [app] = await appDb.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    const [owner] = await db.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(app!.u).not.toBe(owner!.u);
  });
});

describe("QA-30: the TPO accepts one requirement twice at the same moment", () => {
  it("makes one drive, and both presses answer with it", async () => {
    const tpo = ctxOf("tpoUser", "TPO", "tpo");
    const results = await Promise.allSettled([asCollege("tpoUser", () => acceptRequirement(tpo, id.requirement!)), asCollege("tpoUser", () => acceptRequirement(tpo, id.requirement!))]);
    expect(results.map(refusalKey)).toEqual([null, null]);
    const drives = await db.drive.findMany({ where: { schoolId: id.college, requirementId: id.requirement }, select: { id: true } });
    expect(drives).toHaveLength(1);
    expect(fulfilled(results).map((d) => d.id)).toEqual([drives[0]!.id, drives[0]!.id]);
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "placement.drive.open", targetId: drives[0]!.id } })).toBe(1);
  });
});

describe("QA-31: a student applies from two devices at the same moment", () => {
  it("one application; the other device is told it has applied (409), not a 500", async () => {
    const s = ctxOf("s1User", "STUDENT", "s1");
    const results = await Promise.allSettled([asCollege("s1User", () => applyToDrive(s, id.openDrive!)), asCollege("s1User", () => applyToDrive(s, id.openDrive!))]);
    expect(fulfilled(results)).toHaveLength(1);
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["placement.refuseApplied"]);
    const loser = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((loser.reason as InstanceType<typeof RuleRefusal>).status).toBe(409);
    expect(await db.driveApplication.count({ where: { driveId: id.openDrive, studentMembershipId: id.s1 } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "placement.apply", meta: { contains: id.openDrive! } } })).toBe(1);
  });
});

/**
 * The invariant two recorders at once must keep: one offer row, and no write lost unannounced. Fired together the
 * two overlap and the loser is refused as changed meanwhile, the winner's package standing and the student told once.
 * A loaded machine can still run the two one after the other (the second reading the first's offer as it stands):
 * then the second is an edit, and its audit row names the package it replaced, as an edit afterwards does.
 */
async function expectOneStands(results: PromiseSettledResult<{ packageRupees: number }>[], studentKey: string, toldBefore: number) {
  const offers = await db.offer.findMany({ where: { driveId: id.offersDrive, studentMembershipId: id[studentKey] }, select: { id: true, packageRupees: true } });
  expect(offers).toHaveLength(1);
  const won = fulfilled(results);
  const told = await db.notification.count({ where: { userId: id[`${studentKey}User`], titleKey: "placement.notifOffer" } });
  if (won.length === 1) {
    expect(results.map(refusalKey).filter(Boolean)).toEqual(["placement.refuseOfferChangedMeanwhile"]);
    const loser = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((loser.reason as InstanceType<typeof RuleRefusal>).status).toBe(409);
    expect((loser.reason as InstanceType<typeof RuleRefusal>).vars).toMatchObject({ offer: expect.any(String) });
    // What the winner's screen says was recorded is what is stored, and the student is told once.
    expect(offers[0]!.packageRupees).toBe(won[0]!.packageRupees);
    expect(told - toldBefore).toBe(1);
    return "overlapped";
  }
  expect(won).toHaveLength(2);
  const rows = await db.auditLog.findMany({ where: { schoolId: id.college, action: "placement.offer", targetId: offers[0]!.id }, orderBy: { createdAt: "asc" }, select: { meta: true } });
  const [first, second] = rows.slice(-2).map((r) => JSON.parse(r.meta ?? "{}") as { packageRupees: number; previousPackageRupees?: number });
  expect(second!.previousPackageRupees).toBe(first!.packageRupees);
  expect(offers[0]!.packageRupees).toBe(second!.packageRupees);
  return "serialised";
}

describe("QA-33: two recruiters of one company offer one candidate at the same moment", () => {
  it("one offer stands as recorded, the other is refused as changed meanwhile, and the student is told once", async () => {
    const [a1, a2] = await Promise.all([asRecruiter("r1", () => recruiterActor(ctxOf("r1", "RECRUITER", null), id.offersDrive!)), asRecruiter("r2", () => recruiterActor(ctxOf("r2", "RECRUITER", null), id.offersDrive!))]);
    const results = await Promise.allSettled([
      asRecruiter("r1", () => recordOffer(a1, { studentMembershipId: id.s2!, packageRupees: 600_000, letterFileId: null })),
      asRecruiter("r2", () => recordOffer(a2, { studentMembershipId: id.s2!, packageRupees: 650_000, letterFileId: null })),
    ]);
    console.info("[QA-33 fresh offer]", await expectOneStands(results, "s2", 0));
  });

  it("an edit by a colleague afterwards changes the offer and its audit row names the package it replaced", async () => {
    const before = await db.offer.findFirstOrThrow({ where: { driveId: id.offersDrive, studentMembershipId: id.s2 }, select: { id: true, packageRupees: true } });
    const a2 = await asRecruiter("r2", () => recruiterActor(ctxOf("r2", "RECRUITER", null), id.offersDrive!));
    const view = await asRecruiter("r2", () => recordOffer(a2, { studentMembershipId: id.s2!, packageRupees: 700_000, letterFileId: null }));
    expect(view.packageRupees).toBe(700_000);
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: id.college, action: "placement.offer", targetId: before.id, actorUserId: id.r2 }, orderBy: { createdAt: "desc" }, select: { meta: true } });
    expect(JSON.parse(row.meta ?? "{}")).toMatchObject({ packageRupees: 700_000, previousPackageRupees: before.packageRupees });
  });

  it("two edits at once: one stands and the other is refused, never both written unannounced", async () => {
    const toldBefore = await db.notification.count({ where: { userId: id.s2User, titleKey: "placement.notifOffer" } });
    const [a1, a2] = await Promise.all([asRecruiter("r1", () => recruiterActor(ctxOf("r1", "RECRUITER", null), id.offersDrive!)), asRecruiter("r2", () => recruiterActor(ctxOf("r2", "RECRUITER", null), id.offersDrive!))]);
    const results = await Promise.allSettled([
      asRecruiter("r1", () => recordOffer(a1, { studentMembershipId: id.s2!, packageRupees: 710_000, letterFileId: null })),
      asRecruiter("r2", () => recordOffer(a2, { studentMembershipId: id.s2!, packageRupees: 720_000, letterFileId: null })),
    ]);
    console.info("[QA-33 two edits]", await expectOneStands(results, "s2", toldBefore));
  });

  it("the TPO and a recruiter at once: the same rule", async () => {
    const tpo = ctxOf("tpoUser", "TPO", "tpo");
    const { cellActor } = await import("@/lib/placement");
    const [cell, rec] = await Promise.all([asCollege("tpoUser", () => cellActor(tpo, id.offersDrive!)), asRecruiter("r1", () => recruiterActor(ctxOf("r1", "RECRUITER", null), id.offersDrive!))]);
    const results = await Promise.allSettled([
      asCollege("tpoUser", () => recordOffer(cell, { studentMembershipId: id.s4!, packageRupees: 600_000, letterFileId: null })),
      asRecruiter("r1", () => recordOffer(rec, { studentMembershipId: id.s4!, packageRupees: 620_000, letterFileId: null })),
    ]);
    console.info("[QA-33 cell and recruiter]", await expectOneStands(results, "s4", 0));
  });
});

describe("QA-48: the recruiter records the day a student joined", () => {
  it("the answer names the student, as the offer's answer does", async () => {
    const actor = await asRecruiter("r1", () => recruiterActorForOffer(ctxOf("r1", "RECRUITER", null), id.s3Offer!));
    const view = await asRecruiter("r1", () => recordJoined(actor, id.s3Offer!, "2026-10-20"));
    expect(view.studentName).toBe("ZZ Chitra Lows");
    expect(view.companyName).toBe(`ZZ PL Lows Co ${STAMP}`);
    expect(view.joinedAt).toBe("2026-10-20T00:00:00.000Z");
  });
});
