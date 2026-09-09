import { appAdminCompetitionsSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { appAdminCompetitions } from "@/lib/api-reads/operator";

/** GET /api/v1/appadmin/competitions — the platform competitions, the content team's list (the operator reads it too). */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(appAdminCompetitionsSchema.parse(await appAdminCompetitions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/competitions");
  }
}
