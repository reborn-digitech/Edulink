import { activitiesSchema, activitySaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addActivity, listActivities } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/activities — The activity register (an HOD's: the department's). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    return ok(activitiesSchema.parse(await listActivities(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/activities");
  }
}

/** POST /api/v1/iqac/activities — Record an activity with its head count and the staff who took part. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "HOD");
    const parsed = activitySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(activitiesSchema.parse(await addActivity(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/activities");
  }
}
