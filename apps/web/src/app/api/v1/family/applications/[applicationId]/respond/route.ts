import { applicationSchema, applicationRespondSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { respond } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/applications/{applicationId}/respond — answer the offer. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiFamily();
    const { applicationId } = await params;
    const parsed = applicationRespondSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await respond(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications/[applicationId]/respond");
  }
}
