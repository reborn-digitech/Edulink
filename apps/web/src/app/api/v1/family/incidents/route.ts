import { familyIncidentsQuerySchema, familyIncidentsSchema } from "@edulink/contracts";
import { requireApiReader, selectChild } from "@/lib/api-reads/family";
import { familyIncidents } from "@/lib/incidents";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/incidents?childId= — a child's incidents and sick-room visits, with the school's follow-up; a pupil's own, read-only, from the age the school sets (self-read.ts decides, in familyIncidents). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyIncidentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const selectedId = ctx.role === "STUDENT" ? ctx.membershipId! : (await selectChild(ctx, parsed.data.childId)).selectedId;
    return ok(familyIncidentsSchema.parse(await familyIncidents(ctx, selectedId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/incidents");
  }
}
