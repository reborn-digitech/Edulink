/**
 * Vitest setup.
 *
 * Loads .env so integration tests hit the same DATABASE_URL the dev server
 * uses. NODE_ENV is assigned through a cast because @types/node declares it
 * readonly, but vitest genuinely needs it set before Prisma initialises.
 */
import { config } from "dotenv";

config({ path: ".env" });

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV ??= "test";
env.AUTH_SECRET ??= "test-secret-not-used-for-real-sessions";
