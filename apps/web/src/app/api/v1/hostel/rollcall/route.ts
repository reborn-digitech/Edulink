import { hostelRollCallQuerySchema, hostelRollCallResultSchema, hostelRollCallSheetSchema, hostelRollCallTakeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { rollCallSheet, takeRollCall } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/rollcall — A roll call's sheet: as taken, or ready to take. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    const parsed = hostelRollCallQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(hostelRollCallSheetSchema.parse(await rollCallSheet(ctx, q.hostelId, q.slot, q.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/rollcall");
  }
}

/** POST /api/v1/hostel/rollcall — Take a roll call, once per hostel, day and slot; the same sheet replayed is the same call. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelRollCallTakeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelRollCallResultSchema.parse(await takeRollCall(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/rollcall");
  }
}
