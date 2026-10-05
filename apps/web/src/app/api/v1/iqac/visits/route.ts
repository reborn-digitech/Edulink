import { visitDetailSchema, visitListSchema, visitSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createVisit, listVisits } from "@/lib/peer-visits";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/iqac/visits — The peer-team visits the reader may see, and what they may make. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD", "PRINCIPAL", "ADMIN");
    return ok(visitListSchema.parse(await listVisits(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits");
  }
}

/** POST /api/v1/iqac/visits — A visit: NAAC by the IQAC, NBA by the IQAC or the department's HOD. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD");
    const parsed = visitSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(visitDetailSchema.parse(await createVisit(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits");
  }
}
