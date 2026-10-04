import { operatorRecruitersSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { listRecruiters } from "@/lib/operator-college";

/** GET /api/v1/operator/recruiters — every recruiter account, disabled first, with its company and live sessions. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    const rows = await listRecruiters(ctx);
    return ok(operatorRecruitersSchema.parse({ items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), disabledAt: r.disabledAt?.toISOString() ?? null })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/recruiters");
  }
}
