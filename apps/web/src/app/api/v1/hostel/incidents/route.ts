import { hostelIncidentCreateSchema, hostelIncidentsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { hostelIncidents, recordHostelIncident } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/incidents — The incident log, as far as it happened in a hostel. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    return ok(hostelIncidentsSchema.parse(await hostelIncidents(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/incidents");
  }
}

/** POST /api/v1/hostel/incidents — The warden records an incident in the school's log, tagged with the hostel. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelIncidentCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelIncidentsSchema.parse(await recordHostelIncident(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/incidents");
  }
}
