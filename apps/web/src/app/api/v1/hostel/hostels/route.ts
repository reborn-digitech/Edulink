import { hostelSaveSchema, hostelsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { hostelsView, saveHostel } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/hostels — The houses, their rooms and who sleeps where. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    return ok(hostelsSchema.parse(await hostelsView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/hostels");
  }
}

/** POST /api/v1/hostel/hostels — The office makes or changes a house. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = hostelSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelsSchema.parse(await saveHostel(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/hostels");
  }
}
