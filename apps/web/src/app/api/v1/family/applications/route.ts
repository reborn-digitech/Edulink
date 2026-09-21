import { applyBodySchema, applicationSchema, applicationsListSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { apply, familyApplications } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/family/applications — mine, everywhere. */
export async function GET() {
  try {
    const ctx = await requireApiFamily();
    return ok(applicationsListSchema.parse(await familyApplications(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications");
  }
}

/** POST /api/v1/family/applications — apply for a child. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiFamily();
    const parsed = applyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await apply(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications");
  }
}
