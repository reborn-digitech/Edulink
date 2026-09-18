import { familyIncidentsQuerySchema, familyIncidentsSchema } from "@edulink/contracts";
import { requireApiParent, selectChild } from "@/lib/api-reads/family";
import { familyIncidents } from "@/lib/incidents";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/incidents?childId= — a child's incidents and sick-room visits, with the school's follow-up. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyIncidentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const { selectedId } = await selectChild(ctx, parsed.data.childId);
    return ok(familyIncidentsSchema.parse(await familyIncidents(ctx, selectedId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/incidents");
  }
}
