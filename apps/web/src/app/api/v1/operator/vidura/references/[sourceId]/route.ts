import { viduraReferenceActSchema, viduraReferenceReadSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { actOnReferenceSource } from "@/lib/assistant/references";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/operator/vidura/references/{sourceId} — ENABLE, DISABLE or EDIT a source (pass 4). Audited; the same act again changes nothing. */
export async function POST(request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { sourceId } = await params;
    const parsed = viduraReferenceActSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraReferenceReadSchema.parse({ source: await actOnReferenceSource(ctx, sourceId, parsed.data) }));
  } catch (error) {
    return moduleFailure(error, "api/v1/operator/vidura/references/[sourceId]");
  }
}
