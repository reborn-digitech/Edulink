import { schoolWeekSavedSchema, schoolWeekSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { schoolWeekOf, setSchoolWeek } from "@/lib/substitutions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/school-week — the weekday numbers the school teaches on. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(schoolWeekSchema.parse(await schoolWeekOf(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/school-week");
  }
}

/** POST /api/v1/office/school-week — set the school's teaching week. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = schoolWeekSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(schoolWeekSavedSchema.parse(await setSchoolWeek(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/school-week");
  }
}
