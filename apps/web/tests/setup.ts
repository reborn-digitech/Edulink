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
 *
 * AND login-limits.test.ts's own buckets, for the same reason across PROCESSES (QA campaign of 24 October 2026,
 * docs/qa/campaign-2026-10-24/unit.md): a second vitest process on the same database — a single file run beside
 * the full suite, another session's battery — runs this setup and wiped `login:+919876511001` while that suite was
 * counting its ten failures, so its eleventh sign-in passed (seen in a full run, reproduced 1 run in 4 with a
 * concurrent process, 0 in 3 alone). Those buckets are keyed on that suite's own test identities, which it clears
 * before and after each test itself. The shared `login-global` bucket is still wiped, as before.
 */
const SUITE_OWNED_BUCKETS = ["login:+919876511001", "login:zzlimits.h4nd@edulink.local", "login-addr:203.0.113.77"];
await setupDb.rateLimit.deleteMany({
  where: { NOT: [{ bucket: { startsWith: "zz-test:" } }, { bucket: { in: SUITE_OWNED_BUCKETS } }, { bucket: { contains: "@zzloginlimits.test" } }] },
});
await setupDb.$disconnect();

/**
 * THE PLATFORM'S FEATURE SWITCHES ARE ALL ON FOR THE SUITES (15 Oct 2026). The developer's database has every
 * feature off until the operator switches it on (src/lib/platform-features.ts), and the suites that exercise
 * the assistant, practice, sessions, vacancies or texts were written for a platform where they ran. The
 * library honours this process-local list while VITEST is set and never otherwise; a suite about the switch
 * itself (tests/platform-features.test.ts) sets its own list, or null to read the table.
 */
import { PLATFORM_FEATURES } from "@edulink/contracts";

(globalThis as Record<string, unknown>).__edulinkPlatformFeaturesForTests = [...PLATFORM_FEATURES];
