import { labBatchSplitSchema, labBatchesSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { splitLabBatches } from "@/lib/stream-records";

/** POST /api/v1/stream-records/lab-batches/split — the office splits a division evenly into lab batches by roll number (audited streamRecords.labBatches.split). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = labBatchSplitSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(labBatchesSchema.parse(await splitLabBatches(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/lab-batches/split");
  }
}
