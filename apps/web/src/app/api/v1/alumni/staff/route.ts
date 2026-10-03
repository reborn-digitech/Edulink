import { alumniStaffSchema } from "@edulink/contracts";
import { alumniStaff } from "@/lib/alumni";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/alumni/staff — the staff a former pupil may write to, former teachers first; `?q=` on the name. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const q = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
    return ok(alumniStaffSchema.parse(await alumniStaff(ctx, q)));
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/staff");
  }
}
