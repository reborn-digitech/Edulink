import { iqacEvidenceUploadSchema, iqacFilesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listEvidence, uploadEvidence } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/evidence — The documents the IQAC cites. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(iqacFilesSchema.parse(await listEvidence(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/evidence");
  }
}

/** POST /api/v1/iqac/evidence — Register an uploaded file (its upload ticket) as evidence. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = iqacEvidenceUploadSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(iqacFilesSchema.parse(await uploadEvidence(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/evidence");
  }
}
