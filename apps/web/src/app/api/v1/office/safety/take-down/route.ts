import { officeTakeDownBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeContent } from "@/lib/safety";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/safety/take-down — take reported content down and close
 * every report against it. The note is the reason the author is shown; a post
 * becomes rejected, a comment removed. Another school's content is a 404.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeTakeDownBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await removeContent(ctx, parsed.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/safety/take-down");
  }
}
