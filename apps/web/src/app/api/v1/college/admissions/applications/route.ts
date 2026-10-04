import { collegeApplicationCreateSchema, collegeApplicationSchema, collegeApplicationsQuerySchema, collegeApplicationsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createApplication, listApplications } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/college/admissions/applications — Applications, by round and status. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const parsed = collegeApplicationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(collegeApplicationsSchema.parse(await listApplications(ctx, q)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications");
  }
}

/** POST /api/v1/college/admissions/applications — An application from an imported allotment row (the same row twice is the same application) or, in a merit round, typed by the office. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = collegeApplicationCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await createApplication(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications");
  }
}
