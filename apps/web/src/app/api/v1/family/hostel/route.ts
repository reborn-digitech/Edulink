import { familyHostelQuerySchema, familyHostelSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { familyHostel } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/hostel — A boarder's room, tonight's roll call, leave and today's menu. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const parsed = familyHostelQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(familyHostelSchema.parse(await familyHostel(ctx, q.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/hostel");
  }
}
