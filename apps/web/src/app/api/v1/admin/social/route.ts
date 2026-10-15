import { socialDisconnectBodySchema, socialDisconnectedSchema, socialViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { disconnectSocial, socialView } from "@/lib/social";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/**
 * The school's Facebook Page connection (meta-posting, 16 Oct 2026); the school's ADMIN alone. Connecting is the
 * browser's Facebook Login (/api/social/meta/start, then the pick at /admin/settings/social), not a door.
 */

/** GET /api/v1/admin/social — whether the platform has Meta, whether secrets can be sealed, and the connection. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(socialViewSchema.parse(await socialView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/social");
  }
}

/** DELETE /api/v1/admin/social — disconnect the Page named in the body ({ pageId }, the one shown); what was posted on Meta stays there; audited. */
export async function DELETE(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = socialDisconnectBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(socialDisconnectedSchema.parse(await disconnectSocial(ctx, parsed.data.pageId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/social");
  }
}
