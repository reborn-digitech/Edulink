import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listMarketplace, ownImpact } from "@/lib/experts";
import { expertRatings } from "@/lib/expert-kyc";
import type { ActiveContext } from "@/lib/session";

/**
 * Ratings on the expert's card: families rate delivered sessions
 * (GigBooking.rating), and the marketplace shows the average to one decimal
 * with the count once THREE or more have rated — fewer reads as "New"
 * (null). Computed on read from the rows themselves; nothing is stored on
 * the profile, so there is nothing to drift.
 *
 * The suite runs as the database's owner, so it proves the arithmetic and
 * the threshold, not the row policies (rls:verify's).
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const slotIds: string[] = [];

const ctx = (key: string, role: ActiveContext["role"], school: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: key, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;

/** A delivered seat of `pupil` with `expertKey`'s slot, rated or not. */
async function delivered(expertKey: string, pupil: string, rating: number | null) {
  const slot = await db.gigSlot.create({ data: { providerUserId: id[expertKey]!, providerKind: "EXPERT", kind: "ONE_TO_ONE", title: `ZZ rated ${STAMP} ${slotIds.length}`, startsAt: new Date(Date.now() - (slotIds.length + 2) * HOUR), endsAt: new Date(Date.now() - (slotIds.length + 1) * HOUR), meetingUrl: "https://meet.example.test/zz", seats: 1, seatsTaken: 1 }, select: { id: true } });
  slotIds.push(slot.id);
  await db.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: member[pupil]!, providerUserId: id[expertKey]!, kind: "ONE_TO_ONE", bookedByUserId: id[pupil]!, purpose: "ZZ a rated session for the test", status: "DELIVERED", closedAt: new Date(), rating, ratedAt: rating ? new Date() : null } });
}

beforeAll(async () => {
  const s = await db.school.create({ data: { name: `ZZ Ratings School ${STAMP}`, slug: `zz-rate-${STAMP}`, code: `ZZR${String(STAMP).slice(-7)}`, contactEmail: `zz-rate-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
  schoolId = s.id;
  const person = async (key: string, role: string | null) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-rate-${key}-${STAMP}@test.invalid` }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("rated", null);
  await person("fresh", null);
  await person("admin", "ADMIN");
  for (const p of ["p1", "p2", "p3", "p4"]) await person(p, "STUDENT");
  await db.expertProfile.create({ data: { userId: id.rated!, headline: "ZZ Rated expert", offering: "BOTH", publishedAt: new Date() } });
  await db.expertProfile.create({ data: { userId: id.fresh!, headline: "ZZ Fresh expert", offering: "BOTH", publishedAt: new Date() } });
  // Four ratings and one unrated delivery for the first; two ratings for the second.
  await delivered("rated", "p1", 5);
  await delivered("rated", "p2", 4);
  await delivered("rated", "p3", 4);
  await delivered("rated", "p4", 3);
  await delivered("rated", "p1", null);
  await delivered("fresh", "p1", 5);
  await delivered("fresh", "p2", 5);
});

afterAll(async () => {
  await db.gigSlot.deleteMany({ where: { id: { in: slotIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: Object.values(id) } } });
  await db.$disconnect();
});

describe("ratings on the expert's card", () => {
  it("four ratings read as their average to one decimal and the count; an unrated delivery does not count", async () => {
    const ratings = await expertRatings([id.rated!, id.fresh!]);
    expect(ratings.get(id.rated!)).toEqual({ average: 4, count: 4 });
    const card = (await listMarketplace(ctx("admin", "ADMIN", schoolId))).find((e) => e.name === `ZZ rated ${STAMP}`);
    expect(card?.rating).toEqual({ average: 4, count: 4 });
    expect((await ownImpact(ctx("rated", "EXPERT", null))).rating).toEqual({ average: 4, count: 4 });
  });

  it("two ratings are New: null on the card and on the expert's own profile, however high they were", async () => {
    expect((await expertRatings([id.fresh!])).get(id.fresh!)).toBeNull();
    const card = (await listMarketplace(ctx("admin", "ADMIN", schoolId))).find((e) => e.name === `ZZ fresh ${STAMP}`);
    expect(card).toBeDefined();
    expect(card?.rating).toBeNull();
    expect((await ownImpact(ctx("fresh", "EXPERT", null))).rating).toBeNull();
  });

  it("the third rating tips it over, rounded to one decimal", async () => {
    await delivered("fresh", "p3", 4);
    expect((await expertRatings([id.fresh!])).get(id.fresh!)).toEqual({ average: 4.7, count: 3 });
  });
});
