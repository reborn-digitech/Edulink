/**
 * Our offer's row, for the suites that write it (the review of 21 November 2026, D-1 and D-2).
 *
 * Our offer is the platform's one SchoolOffer row, and every school's figures, bills and totals read it. The operator
 * subscriptions suite writes it for a few seconds to prove the save, its audit row, its notices and its compare-and-set.
 * Two dangers follow on a shared database, and both are held here:
 *
 *   - two runs at once (the main checkout and a worktree share edulink_dev, and `fileParallelism` orders files only
 *     within one process): a run takes OFFER_LOCK, a Postgres advisory lock, for the length of its offer section, in an
 *     open transaction; a run that cannot take it is beside another run's offer section, and skips its own, touching
 *     nothing (`holdOfferLock`);
 *   - a run killed while the row holds the suite's prices: the row is removed at the start of any vitest run
 *     (tests/setup.ts calls `removeLeftOffer`), not only the next run of that suite, provided it was saved by one of the
 *     suite's own ZZ operators and no run holds the lock now.
 */
import type { Prisma, PrismaClient } from "@prisma/client";

export const OFFER_LOCK = "zz-suites:school-offer";
/** The operator the operator subscriptions suite makes for each run (tests/api-v1-operator-subscriptions.test.ts), as a POSIX pattern. */
export const SUITE_OPERATOR_EMAIL = "^zz-premium-operator-[0-9]+@test\\.invalid$";

/**
 * Removes a row of our offer that a killed run left; never one the platform saved, nor one while a live run holds the lock.
 * One statement, so tests/setup.ts can afford it before every file: the row goes only where its saver is the suite's own ZZ
 * operator and the lock is free (pg_try_advisory_xact_lock, held for the statement alone). `key` is OFFER_LOCK but in
 * tests/suite-offer.test.ts, which proves this with a key of its own while it holds the real one.
 */
export async function removeLeftOffer(db: PrismaClient, key: string = OFFER_LOCK): Promise<boolean> {
  const removed = await db.$executeRaw`
    DELETE FROM "SchoolOffer" AS o USING "User" AS u
     WHERE o."id" = 'offer' AND u."id" = o."updatedByUserId" AND u."email" ~ ${SUITE_OPERATOR_EMAIL}
       AND pg_try_advisory_xact_lock(hashtext(${key}))`;
  return removed > 0;
}

/**
 * Takes the lock (OFFER_LOCK, or `key` in tests/suite-offer.test.ts) for as long as the caller wants it, in a transaction
 * kept open (up to ten minutes): `taken` says whether it was free; `release` ends the transaction and so the lock.
 */
export function holdOfferLock(db: PrismaClient, key: string = OFFER_LOCK): { taken: Promise<boolean>; release: () => Promise<void> } {
  let answer!: (got: boolean) => void;
  let letGo!: () => void;
  const taken = new Promise<boolean>((resolve) => (answer = resolve));
  const released = new Promise<void>((resolve) => (letGo = resolve));
  const holding = db
    .$transaction(
      async (tx) => {
        const [lock] = await tx.$queryRaw<{ got: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtext(${key})) AS got`;
        answer(Boolean(lock?.got));
        if (lock?.got) await released;
      },
      { timeout: 600_000, maxWait: 10_000 },
    )
    .catch(() => answer(false));
  return {
    taken,
    release: async () => {
      letGo();
      await holding;
    },
  };
}

/**
 * Tries a write the database should refuse inside a transaction that always rolls back (the review of 21 November 2026,
 * D-4), and answers what came of it: the error the database gave, or "written" where nothing refused it. Either way nothing
 * of the write stays, whatever constraints the database holds (a database built by `prisma db push` has none of the
 * hand-written CHECKs).
 */
export async function triedAndRolledBack(db: PrismaClient, write: (tx: Prisma.TransactionClient) => Promise<unknown>): Promise<unknown> {
  const rollBack = new Error("zz: roll the write back");
  let outcome: unknown = "written";
  await db
    .$transaction(async (tx) => {
      try {
        await write(tx);
      } catch (error) {
        outcome = error;
      }
      throw rollBack;
    })
    .catch((error: unknown) => {
      if (error !== rollBack) throw error;
    });
  return outcome;
}
