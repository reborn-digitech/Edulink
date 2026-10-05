import { labBatchMoveSchema, labBatchesSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { moveToLabBatch } from "@/lib/stream-records";

/** POST /api/v1/stream-records/lab-batches/{batchId}/members — the office moves students of the division into this batch (audited streamRecords.labBatches.move). */
export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { batchId } = await params;
    const parsed = labBatchMoveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(labBatchesSchema.parse(await moveToLabBatch(ctx, batchId, parsed.data.studentMembershipIds)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/lab-batches/[batchId]/members");
  }
}
