import { viduraRenderingsQuerySchema, viduraRenderingsSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listRenderings } from "@/lib/assistant/renderings";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/vidura/renderings?language=&status=&kind=&page= — the guide's Hindi and Marathi renderings for a speaker to read (Vidura pass 2), with the counts. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = viduraRenderingsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraRenderingsSchema.parse(await listRenderings(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/vidura/renderings");
  }
}
