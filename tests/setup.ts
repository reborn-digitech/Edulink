/**
 * Vitest setup.
 *
 * Loads .env so integration tests hit the same DATABASE_URL and VAPID keys the
 * dev server uses. NODE_ENV is assigned through a cast because @types/node
 * declares it readonly, but vitest needs it set before Prisma initialises.
 */
import { config } from "dotenv";

config({ path: ".env" });

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV ??= "test";
