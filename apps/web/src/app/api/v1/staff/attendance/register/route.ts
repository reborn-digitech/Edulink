import { registerQuerySchema, registerSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { registerFor } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/attendance/register?classId=&date= — the register the way /api/attendance GET opens it: duty first, then the tenant boundary. Marking goes through POST /api/attendance. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = registerQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(registerSchema.parse(await registerFor(ctx, parsed.data.classId, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/attendance/register");
  }
}
