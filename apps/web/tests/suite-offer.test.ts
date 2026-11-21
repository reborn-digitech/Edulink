/**
 * The guard on our offer's row for the suites that write it (tests/suite-offer.ts; the review of 21 November 2026, D-1, D-2
 * and D-4): a row a killed run left is removed once no run holds the lock, kept while one does, and a row the platform saved
 * is never removed; the lock is taken by one run at a time; a write tried and rolled back leaves nothing, refused or not.
 *
 * This file writes our offer's row for a moment, with the owner's starting values, so no school's figure moves even then;
 * it holds the suites' real lock throughout, so it never meets the operator subscriptions suite's offer section in another
 * process, and proves the lock with a key of its own. It runs only where the platform has saved no offer of its own.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { OFFER_START } from "@edulink/contracts";
import { holdOfferLock, removeLeftOffer, triedAndRolledBack } from "./suite-offer";

const db = new PrismaClient();
const STAMP = Date.now();
const KEY = `zz-suites:school-offer:test-${STAMP}`;
const users: string[] = [];
let real: ReturnType<typeof holdOfferLock> | null = null;
let free = false;

beforeAll(async () => {
  real = holdOfferLock(db);
  free = (await real.taken) && (await db.schoolOffer.findUnique({ where: { id: "offer" } })) === null;
  if (!free) console.warn("[suite-offer] our offer's row is held by another run or saved by the platform: skipped");
});

afterAll(async () => {
  await db.schoolOffer.deleteMany({ where: { id: "offer", updatedByUserId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await real?.release();
  await db.$disconnect();
});

async function person(email: string): Promise<string> {
  const id = (await db.user.create({ data: { name: "ZZ Suite Offer", email, isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  users.push(id);
  return id;
}
const starting = (updatedByUserId: string) => ({
  id: "offer",
  subscriptionPricePaise: OFFER_START.subscriptionPricePaise,
  subscriptionDiscountBps: OFFER_START.subscriptionDiscountBps,
  premiumPricePaise: OFFER_START.premiumPricePaise,
  premiumDiscountBps: OFFER_START.premiumDiscountBps,
  freeMonths: OFFER_START.freeMonths,
  updatedByUserId,
});
const rowNow = () => db.schoolOffer.findUnique({ where: { id: "offer" }, select: { updatedByUserId: true } });

describe("our offer's row, guarded for the suites", () => {
  it("a row a killed run left is kept while a run holds the lock and removed once none does; the platform's is never removed", async (c) => {
    if (!free) c.skip();
    const suite = await person(`zz-premium-operator-${STAMP}@test.invalid`);
    const platform = await person(`zz-suite-offer-platform-${STAMP}@test.invalid`);
    try {
      await db.schoolOffer.create({ data: starting(suite) });
      const live = holdOfferLock(db, KEY);
      expect(await live.taken).toBe(true);
      // One run at a time: the lock is not free while it is held.
      const second = holdOfferLock(db, KEY);
      expect(await second.taken).toBe(false);
      await second.release();
      expect(await removeLeftOffer(db, KEY)).toBe(false);
      expect(await rowNow()).toEqual({ updatedByUserId: suite });
      await live.release();
      expect(await removeLeftOffer(db, KEY)).toBe(true);
      expect(await rowNow()).toBeNull();
      // A row anyone else saved is the platform's.
      await db.schoolOffer.create({ data: starting(platform) });
      expect(await removeLeftOffer(db, KEY)).toBe(false);
      expect(await rowNow()).toEqual({ updatedByUserId: platform });
    } finally {
      await db.schoolOffer.deleteMany({ where: { id: "offer", updatedByUserId: { in: [suite, platform] } } });
    }
  });

  it("a write tried and rolled back leaves nothing, whether the database refuses it or not", async (c) => {
    if (!free) c.skip();
    const suite = await person(`zz-premium-operator-${STAMP}-2@test.invalid`);
    // Not refused: written, and rolled back all the same.
    expect(await triedAndRolledBack(db, (tx) => tx.schoolOffer.create({ data: starting(suite) }))).toBe("written");
    expect(await rowNow()).toBeNull();
    // Refused by a CHECK: the error is the answer, and nothing stays.
    const refused = await triedAndRolledBack(db, (tx) => tx.schoolOffer.create({ data: { ...starting(suite), freeMonths: 2 } }));
    expect(refused instanceof Error ? refused.message : String(refused)).toMatch(/SchoolOffer_free_months_check/);
    expect(await rowNow()).toBeNull();
  });
});
