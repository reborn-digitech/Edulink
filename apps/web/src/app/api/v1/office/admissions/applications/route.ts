import { applicationSaveSchema, applicationSchema, applicationsListSchema, officeApplicationsQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeApplications, officeApply } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/admissions/applications?cycleId=&status=&grade= — the pipeline. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeApplicationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationsListSchema.parse(await officeApplications(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications");
  }
}

/** POST /api/v1/office/admissions/applications — a walk-in family's form. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = applicationSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await officeApply(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications");
  }
}
