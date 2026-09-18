import { officeCircularsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeCirculars } from "@/lib/circulars";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/circulars — every circular with its reach, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(officeCircularsSchema.parse(await officeCirculars(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/circulars");
  }
}
