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
if (adminEnv.DATABASE_ADMIN_URL) adminEnv.DATABASE_URL = adminEnv.DATABASE_ADMIN_URL;

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV ??= "test";
