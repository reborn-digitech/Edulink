import { okSchema, operatorAppointBodySchema, operatorContentTeamSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { appointAppAdmin } from "@/lib/superuser";
import { operatorContentTeam, operatorRefused } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/content-team — everybody holding the content-team flag, oldest first. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(operatorContentTeamSchema.parse(await operatorContentTeam(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/content-team");
  }
}

/** POST /api/v1/operator/content-team — appoint the account behind an email; the person registers first. Audited as superuser.appadmin.appoint. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorAppointBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await appointAppAdmin(ctx, parsed.data.email);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/content-team");
  }
}
