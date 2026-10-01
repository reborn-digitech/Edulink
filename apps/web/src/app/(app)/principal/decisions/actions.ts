"use server";

import { decisionsQuerySchema, type Decisions } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { listDecisions } from "@/lib/decision-log";

/**
 * The next page of the head's decision log, for the list's "Show more".
 * The same lib call the page made for its first page, with the cursor the
 * page handed the list; the session, not the argument, decides whose rows.
 */
export async function loadMoreDecisions(input: { from?: string; to?: string; kind?: string; cursor: string }): Promise<Decisions> {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const parsed = decisionsQuerySchema.safeParse(input);
  if (!parsed.success) return { items: [], nextCursor: null, total: 0, own: ctx.role === "PRINCIPAL" };
  return listDecisions(ctx, parsed.data);
}
