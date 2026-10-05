import { cohortRemoveBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeFromCohort } from "@/lib/cohort";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/classes/{classId}/pupils/remove — take one pupil off a
 * class's roll (the web's dropFromCohort, A3-inventory-7), keeping everything
 * they did in it. The office's alone. A POST with the pupil in the body, not
 * a DELETE on the pupil's path: a body-less call must never be the act. One
 * not on the roll is a 422; a class of another school is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = cohortRemoveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await removeFromCohort(ctx, classId, parsed.data.studentMembershipId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/pupils/remove");
  }
}
