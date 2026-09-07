import { staffClassesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffClasses } from "@/lib/api-reads/staff";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/classes — my classes (every living class for the office), with today's register state. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    return ok(staffClassesSchema.parse(await staffClasses(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/classes");
  }
}
