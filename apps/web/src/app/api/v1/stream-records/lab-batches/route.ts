import { labBatchesQuerySchema, labBatchesSchema } from "@edulink/contracts";
import { apiInvalid, ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { labBatches } from "@/lib/stream-records";

/** GET /api/v1/stream-records/lab-batches — every division (or one) with its lab batches and the students in none (stream records, 5 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "FACULTY");
    const parsed = labBatchesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(labBatchesSchema.parse(await labBatches(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/lab-batches");
  }
}
