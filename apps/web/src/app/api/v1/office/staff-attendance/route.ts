import { staffRegisterMarkSchema, staffRegisterMarkedSchema, staffRegisterQuerySchema, staffRegisterSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { markStaffRegister, staffRegister } from "@/lib/staff-attendance";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/staff-attendance?date= — the staff register for a day. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = staffRegisterQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffRegisterSchema.parse(await staffRegister(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/staff-attendance");
  }
}

/** POST /api/v1/office/staff-attendance — mark the day. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = staffRegisterMarkSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffRegisterMarkedSchema.parse(await markStaffRegister(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/staff-attendance");
  }
}
