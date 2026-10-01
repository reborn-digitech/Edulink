import { searchQuerySchema, searchResultsSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, budget, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { searchEverything } from "@/lib/search";
import { query } from "../shared/helpers";

/** A person may search this often in a minute; a loop over the box would otherwise run five queries a keystroke. */
export const SEARCH_BUDGET = { limit: 120, windowMs: 60 * 1000 };

/**
 * GET /api/v1/search?q=&limit= — one search across people, posts, messages,
 * papers and the role's pages, fenced to what the caller already sees
 * (lib/search.ts). `q` is two to eighty characters once trimmed; anything
 * else is 422 before a query runs.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    const parsed = searchQuerySchema.safeParse({ q: params.get("q") ?? "", limit: params.get("limit") ?? undefined });
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`search:${ctx.user.id}`, SEARCH_BUDGET.limit, SEARCH_BUDGET.windowMs);
    if (refused) return refused;
    return ok(searchResultsSchema.parse(await searchEverything(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/search");
  }
}
