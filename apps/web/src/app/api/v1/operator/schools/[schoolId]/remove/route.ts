import { okSchema, operatorSchoolRemoveBodySchema } from "@edulink/contracts";
import { AccessError, requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { getSchool, removeSchool } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/**
 * POST /api/v1/operator/schools/{schoolId}/remove — take a school off the
 * server: the roll becomes leavers with their certificates, and it can be
 * restored. The body carries the school's exact name, typed, and the handler
 * checks it before anything moves — the web's prompt, held on the server.
 * Audited as superuser.school.remove.
 */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorSchoolRemoveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const school = await getSchool(ctx, schoolId);
    if (!school) throw new AccessError("root.noSuchSchool", "NOT_FOUND");
    if (parsed.data.confirmName.trim() !== school.name) return apiRefused({ errorKey: "root.removeMismatch" });
    const result = await removeSchool(ctx, schoolId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/remove");
  }
}
