import { officeCsvExportSchema, officeRegisterExportQuerySchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { registerExport } from "@/lib/attendance-export";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/attendance/export/register — one class's month as the inspection-shaped CSV, as text for the share sheet. Audited. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeRegisterExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const file = await registerExport(ctx, parsed.data.classId, parsed.data.month);
    if (!file) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    return ok(officeCsvExportSchema.parse(file));
  } catch (error) {
    return apiFailure(error, "api/v1/office/attendance/export/register");
  }
}
