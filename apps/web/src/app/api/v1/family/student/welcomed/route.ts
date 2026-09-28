import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { markWelcomed } from "@/lib/student-welcome";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/family/student/welcomed — the pupil put their welcome away; it is not offered again. No body. */
export async function POST() {
  try {
    const ctx = await requireApiRole("STUDENT");
    await markWelcomed(ctx);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/welcomed");
  }
}
