import { capImportBodySchema, capImportResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { importAllotments } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ roundId: string }> };

/** POST /api/v1/college/admissions/rounds/{roundId}/import — Import the CET Cell's allotment list for the round, pasted in the Cell's column order; the same list twice adds nothing. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { roundId } = await params;
    const parsed = capImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(capImportResultSchema.parse(await importAllotments(ctx, roundId, b.text)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/rounds/[roundId]/import");
  }
}
