/**
 * Vitest setup.
 *
 * Loads .env so integration tests hit the same DATABASE_URL and VAPID keys the
 * dev server uses. NODE_ENV is assigned through a cast because @types/node
 * declares it readonly, but vitest needs it set before Prisma initialises.
 */
import { config } from "dotenv";

config({ path: ".env" });

/**
 * Tests talk to the database as the OWNER, not as the application role.
 *
 * Row-level security reads `app.school_ids`, which `src/lib/db.ts` sets from a
 * React `cache()` store — and that only exists inside a request. There is no
 * request here, so as the app role every scoped query would correctly return
 * nothing and every fixture lookup would fail on an empty result. That would be
 * RLS working, not a bug, and it would make these tests unable to test anything
 * else.
 *
 * The consequence, stated plainly: NOTHING IN THIS SUITE EXERCISES RLS. The
 * policies are proven separately and against a real database, by
 * `prisma/rls-verify.sql` and `npm run rls:verify`. Do not read a green suite as
 * evidence that tenant isolation holds.
 */
const adminEnv = process.env as Record<string, string | undefined>;
// The app role's own URL, as dotenv resolved it (the environment first, then
// .env), kept before it is swapped for the owner's: tests/rls-app-role.test.ts
// connects as it. On CI the .env is the example's placeholders and the real
// URL is only in the environment, so reading the file would name a database
// that does not exist there.
adminEnv.DATABASE_APP_URL ??= adminEnv.DATABASE_URL;
if (adminEnv.DATABASE_ADMIN_URL) adminEnv.DATABASE_URL = adminEnv.DATABASE_ADMIN_URL;

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV ??= "test";

/**
 * Rate-limit counters start empty for every run.
 *
 * ⚠ THEY OUTLIVE A TEST RUN, which is the whole reason this is here. A limit is
 * a row that persists, so a suite signing in twice per run exhausts its
 * fifteen-minute allowance after a handful of `npm test`s — and then fails, in
 * a file nobody edited, with an error about attempts rather than about the
 * thing under test. It cost an afternoon of chasing the wrong suites.
 *
 * Cleared here rather than per suite for two reasons. Anonymous limits key on
 * the client address, and a test has none — so every suite shares one bucket
 * and per-suite cleanup races between parallel workers. And a fresh counter is
 * what a fresh deployment has, which is the state a test should start from.
 *
 * The limits themselves are exercised deliberately in `tests/rate-limit.test.ts`
 * and `tests/passwords.test.ts`, which own their buckets.
 */
import { PrismaClient } from "@prisma/client";

const setupDb = new PrismaClient();
/**
 * EXCEPT the limiter's own suite. `setupFiles` runs once per WORKER, so a
 * worker starting up would otherwise wipe counters that `rate-limit.test.ts` is
 * in the middle of asserting on, in another worker, and fail it for a reason
 * that has nothing to do with the code. Its buckets are prefixed `zz-test:`
 * and it cleans up after itself.
 */
await setupDb.rateLimit.deleteMany({ where: { NOT: { bucket: { startsWith: "zz-test:" } } } });
await setupDb.$disconnect();
