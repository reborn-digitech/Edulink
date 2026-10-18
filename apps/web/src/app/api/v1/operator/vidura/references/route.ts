import { viduraReferenceAddSchema, viduraReferenceReadSchema, viduraReferenceSourcesSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { addReferenceSource, listReferenceSources } from "@/lib/assistant/references";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/operator/vidura/references — Vidura's reference allow-list, every source on and off (pass 4). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(viduraReferenceSourcesSchema.parse(await listReferenceSources(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/operator/vidura/references");
  }
}

/** POST /api/v1/operator/vidura/references — add a source (201): https on its own host, "{topic}" in its template, never Medium. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = viduraReferenceAddSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraReferenceReadSchema.parse({ source: await addReferenceSource(ctx, parsed.data) }), 201);
  } catch (error) {
    return moduleFailure(error, "api/v1/operator/vidura/references");
  }
}
