import "server-only";
import type { PrismaClient } from "@prisma/client";
import type { CollegeSyllabi } from "@edulink/contracts";
import { db } from "./db";
import { collegeSyllabi } from "./college-syllabi";
import { reviewerRole } from "./quiz-review";
import type { ActiveContext } from "./session";

/**
 * The generation card's college catalogue (college-content, 12 October 2026): the streams with a syllabus
 * in the corpus, their programmes, documents and units, and the streams with none. The content team's and
 * the operator's (the bank desk's gate). The corpus changes only when the fetcher runs, so the read is kept
 * for ten minutes.
 */
const TTL_MS = 10 * 60_000;
let cached: { at: number; value: CollegeSyllabi } | null = null;

export async function deskCollegeSyllabi(session: ActiveContext): Promise<CollegeSyllabi> {
  reviewerRole(session);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  // The content tables are outside the tenant fence; the extended client is read as the plain one (as quiz-jobs-desk.ts does).
  const value = await collegeSyllabi(db as unknown as PrismaClient);
  cached = { at: Date.now(), value };
  return value;
}
