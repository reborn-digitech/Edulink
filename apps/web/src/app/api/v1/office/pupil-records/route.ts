import { officeRecordsQuerySchema, officeRecordsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeRecords } from "@/lib/pupil-records";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/pupil-records?missing=1 — every pupil and what is still blank. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeRecordsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(officeRecordsSchema.parse(await officeRecords(ctx, parsed.data.missing === "1")));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records");
  }
}
