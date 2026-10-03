import { familyHostelLeaveCreateSchema, hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { requestLeave } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/hostel/leave — Ask for leave: a guardian's ask is their consent; a minor's waits for one. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const parsed = familyHostelLeaveCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelLeaveRowSchema.parse(await requestLeave(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/hostel/leave");
  }
}
