import { leaveDecideBodySchema, leaveDecidedSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { decideLeave } from "@/lib/leave";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/leave/{leaveId}/decide — approve or decline. Approving
 * writes cover for every class the applicant is due in, in one transaction,
 * inside decideLeave; nobody signs off their own absence, whatever the role.
 */
export async function POST(request: Request, { params }: { params: Promise<{ leaveId: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const { leaveId } = await params;
    const parsed = leaveDecideBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const request_ = await db.leaveRequest.findFirst({ where: { id: leaveId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!request_) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const { decision, ...opts } = parsed.data;
    const result = await decideLeave(ctx, request_.id, decision, opts);
    if (!result.ok) return apiRefused(result);
    return ok(leaveDecidedSchema.parse({ ok: true, coversCreated: result.coversCreated }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/leave/[leaveId]/decide");
  }
}
