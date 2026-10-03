import { hostelVisitorCreateSchema, hostelVisitorsQuerySchema, hostelVisitorsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listVisitors, signVisitorIn } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/visitors — The visitor book for a day. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    const parsed = hostelVisitorsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(hostelVisitorsSchema.parse(await listVisitors(ctx, q.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/visitors");
  }
}

/** POST /api/v1/hostel/visitors — A visitor signed in. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelVisitorCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelVisitorsSchema.parse(await signVisitorIn(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/visitors");
  }
}
