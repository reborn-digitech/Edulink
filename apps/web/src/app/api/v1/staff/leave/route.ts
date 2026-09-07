import { NextResponse } from "next/server";
import { apiErrorSchema, applyLeaveSchema, leaveAppliedSchema, staffLeaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffLeave } from "@/lib/api-reads/staff";
import { applyForLeave } from "@/lib/leave";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/leave — my leave: the balance, every request, and the colleagues I could nominate to cover. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL");
    return ok(staffLeaveSchema.parse(await staffLeave(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/leave");
  }
}

/**
 * POST /api/v1/staff/leave — ask to be away. A principal may apply too; the
 * approval side refuses self-approval separately. The lib's refusals (dates
 * backwards, a clash with an open request, a nominee who cannot cover) come
 * back as a 422 in the caller's language, the way the form shows them.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL");
    const parsed = applyLeaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await applyForLeave(ctx, parsed.data);
    if (!result.ok) {
      const t = await getT();
      const error = result.errorKey ? t(result.errorKey, result.errorVars) : (result.error ?? t("common.checkTheForm"));
      return NextResponse.json(apiErrorSchema.parse({ error, code: "BAD_REQUEST" }), { status: 422, headers: { "Cache-Control": "no-store" } });
    }
    return ok(leaveAppliedSchema.parse({ id: result.id }));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/leave");
  }
}
