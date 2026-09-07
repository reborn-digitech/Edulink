import { familyExploreQuerySchema, familyExploreSchema } from "@edulink/contracts";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { exploreDirectory } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/explore?q=&country=&region= — the directory of published schools, for anybody signed in with a role. */
export async function GET(request: Request) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const parsed = familyExploreQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyExploreSchema.parse(await exploreDirectory(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/explore");
  }
}
