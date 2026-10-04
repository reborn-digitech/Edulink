import { globalFeedKindsSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { globalFeedKinds, setGlobalFeedKinds } from "@/lib/college-profile";

/** GET /api/v1/admin/feed-kinds — whose global posts this institution reads: schools', colleges' or both (4 Oct 2026). The office and the head. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(globalFeedKindsSchema.parse(await globalFeedKinds(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/feed-kinds");
  }
}

/** POST /api/v1/admin/feed-kinds — choose; the admin's alone, audited feed.global.kinds. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = globalFeedKindsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const saved = await setGlobalFeedKinds(ctx, parsed.data.choice);
    return ok(globalFeedKindsSchema.parse({ choice: saved.choice }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/feed-kinds");
  }
}
