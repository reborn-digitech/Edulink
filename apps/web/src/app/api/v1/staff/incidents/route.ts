import { incidentCreateSchema, incidentSchema, incidentsListSchema, incidentsQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { listIncidents, recordIncident } from "@/lib/incidents";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/incidents — the log: the school's for the office and the head, a teacher's own pupils' for a teacher. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = incidentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(incidentsListSchema.parse(await listIncidents(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/incidents");
  }
}

/** POST /api/v1/staff/incidents — record one; the family is told at once unless asked not to. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = incidentCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(incidentSchema.parse(await recordIncident(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/staff/incidents");
  }
}
