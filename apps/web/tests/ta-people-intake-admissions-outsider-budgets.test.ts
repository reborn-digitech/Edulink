/**
 * TA-181 (testing analysis of 13 November 2026, Medium, Security): an outside
 * account could send a school unlimited enquiry messages and applications.
 *
 * openEnquiry, replyToEnquiry and apply called no limiter, and neither did
 * their doors or the web's actions. Each enquiry message is stored in the
 * school's tenant and announced to its admissions contact or every admin;
 * each application with a new child's name takes the next serial, a row in
 * the pipeline and a notice to the office. Now the libraries (so the doors and
 * the web's actions alike) count the opener's messages and new threads per
 * person, the applications per person, and refuse an account a sixth live
 * application in one cycle; the school's own side answers unbounded.
 *
 * One ZZ school of this suite's own with a published page and an open cycle,
 * removed afterwards with the people made here and the buckets they used.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { openEnquiry, replyToEnquiry } from "@/lib/enquiries";
import { apply } from "@/lib/admissions";
import { AccessError } from "@/lib/access-error";
import { APPLICATION_TRIES, ENQUIRY_MESSAGES } from "@/lib/rate-limit";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tapia-budget-${who}-${STAMP}@test.invalid`;
const ids = { school: "", year: "", cycle: "", admin: "", adminM: "", family: "", enquiry: "" };

function ctx(userId: string, role: "PARENT" | "ADMIN", membershipId: string | null = null): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId: role === "PARENT" ? null : ids.school,
    role,
    user: { id: userId, name: `ZZ TAPIA Budget ${role}`, preferredName: null, email: MAIL(role.toLowerCase()), avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never },
  };
}
const family = () => ctx(ids.family, "PARENT");
const office = () => ctx(ids.admin, "ADMIN", ids.adminM);

async function fill(bucket: string, hits: number): Promise<void> {
  const windowEndsAt = new Date(Date.now() + 60 * 60_000);
  await db.rateLimit.upsert({ where: { bucket }, create: { bucket, hits, windowEndsAt }, update: { hits, windowEndsAt } });
}
const messages = () => db.enquiryMessage.count({ where: { schoolId: ids.school } });
const refusalOf = (work: () => Promise<unknown>) => work().then(() => null, (error: unknown) => (error instanceof AccessError ? error.key : String(error)));

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Budget ${STAMP}`, slug: `zz-tapia-budget-${STAMP}`, code: `ZPB${SUFFIX}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date(), profilePublishedAt: new Date(), isTestFixture: true },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TAPIA Budget Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.family = (await db.user.create({ data: { name: "ZZ TAPIA Budget Family", email: MAIL("parent"), prefs: "{}" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ TAPIA Budget cycle", gradesJson: JSON.stringify([{ grade: "5", seats: 20 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  const userIds = [ids.admin, ids.family].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`enquiry-msg:${ids.family}`, `enquiry-open:${ids.family}`, `enquiry-msg:${ids.admin}`, `admissions-apply:${ids.family}`] } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: userIds } }] } });
  if (ids.school) {
    await db.enquiryMessage.deleteMany({ where: { schoolId: ids.school } });
    await db.enquiry.deleteMany({ where: { schoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-181: enquiries are counted per person", () => {
  it("TA-181: the first enquiry goes through, and past the budget a new message and a reply are refused with a sentence, writing nothing", async () => {
    const first = await openEnquiry(family(), { schoolId: ids.school, kind: "ADMISSION", body: "ZZ TAPIA Is there a seat in grade 5?" });
    expect(first.ok).toBe(true);
    ids.enquiry = first.ok ? first.enquiryId : "";
    const before = await messages();

    await fill(`enquiry-msg:${ids.family}`, ENQUIRY_MESSAGES.limit);
    expect(await openEnquiry(family(), { schoolId: ids.school, kind: "ADMISSION", body: "ZZ TAPIA again" })).toEqual({ ok: false, errorKey: "enquiries.tooManyMessages" });
    expect(await replyToEnquiry(family(), ids.enquiry, "ZZ TAPIA and again")).toEqual({ ok: false, errorKey: "enquiries.tooManyMessages" });
    expect(await messages()).toBe(before);
  });

  it("TA-181: the school's side still answers (its replies are not counted against it)", async () => {
    await fill(`enquiry-msg:${ids.admin}`, ENQUIRY_MESSAGES.limit);
    const answered = await replyToEnquiry(office(), ids.enquiry, "ZZ TAPIA Yes, come on Monday.");
    expect(answered.ok).toBe(true);
  });
});

describe("TA-181: applications are counted per person, and an account's live ones per cycle", () => {
  const input = (childName: string) => ({ schoolId: ids.school, cycleId: ids.cycle, childName, childBirthdate: "2016-02-02", gradeApplied: "5" });

  it("TA-181: a sixth live application in one cycle is refused with a sentence, and no row is made", async () => {
    for (let i = 1; i <= 5; i++) await apply(family(), input(`ZZ TAPIA Child ${i}`));
    expect(await db.application.count({ where: { cycleId: ids.cycle, applicantUserId: ids.family } })).toBe(5);
    expect(await refusalOf(() => apply(family(), input("ZZ TAPIA Child 6")))).toBe("admissions.refuseTooManyLive");
    expect(await db.application.count({ where: { cycleId: ids.cycle, applicantUserId: ids.family } })).toBe(5);
    // The same child again is still the same application, answered as it stands.
    expect((await apply(family(), input("ZZ TAPIA Child 1"))).childName).toBe("ZZ TAPIA Child 1");
  });

  it("TA-181: past the hour's budget an application is refused before anything is read", async () => {
    await fill(`admissions-apply:${ids.family}`, APPLICATION_TRIES.limit);
    expect(await refusalOf(() => apply(family(), input("ZZ TAPIA Child 7")))).toBe("admissions.refuseTooManyTries");
    expect(await db.application.count({ where: { cycleId: ids.cycle, childName: "ZZ TAPIA Child 7" } })).toBe(0);
  });
});
