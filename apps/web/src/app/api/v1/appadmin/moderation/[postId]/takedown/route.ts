import { okSchema, takedownBodySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { platformTakedown } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/appadmin/moderation/{postId}/takedown — down for every school, with the reason the school is told. */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { postId } = await params;
    const parsed = takedownBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await platformTakedown(ctx, postId, parsed.data.reason);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/moderation/[postId]/takedown");
  }
}
