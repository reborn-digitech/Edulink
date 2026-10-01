import { expertFreeDutySchema } from "@edulink/contracts";
import { freeDutyRemaining } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/free-duty — what the expert still owes free this period before a price may be asked (decision 0004). */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertFreeDutySchema.parse(await freeDutyRemaining(ctx.user.id)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/free-duty");
  }
}
