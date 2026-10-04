import { grievanceDeskSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { grievanceDesk } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/grievances — Student grievances with the UGC time limit and the month's summary (ragging and harassment read by the office and the head alone). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(grievanceDeskSchema.parse(await grievanceDesk(ctx, new URL(request.url).searchParams.get("month") ?? undefined)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/grievances");
  }
}
