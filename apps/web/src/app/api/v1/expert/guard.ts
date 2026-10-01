import { AccessError } from "@/lib/tenancy";
import { requireApiSession } from "@/lib/api-reads/shared";
import type { ActiveContext } from "@/lib/session";

/**
 * The expert's own doors beyond their words — papers, free duty, the
 * calendar feed. The ROLE alone is the gate, not a published profile:
 * an expert sends their papers before anybody lists them, and
 * src/lib/expert-kyc.ts refuses a role with no profile row.
 */
export async function requireApiExpertRole(): Promise<ActiveContext> {
  const ctx = await requireApiSession();
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  return ctx;
}
