import { applicationSchema, applicationBookSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { bookSlot } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/applications/{applicationId}/book — book a sitting. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiFamily();
    const { applicationId } = await params;
    const parsed = applicationBookSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await bookSlot(ctx, applicationId, parsed.data.slotId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications/[applicationId]/book");
  }
}
