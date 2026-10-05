import { cohortAddBodySchema, cohortAddedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { enrolStudents } from "@/lib/cohort";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/classes/{classId}/pupils — put pupils of the school on a
 * class's roll (the web's addToCohort, A3-inventory-7). The office's alone.
 * Idempotent: a pupil already on the roll is a no-op, one removed earlier is
 * revived with their old attendance. Ids that are not this school's active
 * pupils are a 422 and nothing is added; a class of another school is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = cohortAddBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await enrolStudents(ctx, classId, parsed.data.studentMembershipIds);
    if (!result.ok) return apiRefused(result);
    return ok(cohortAddedSchema.parse({ added: result.added }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/pupils");
  }
}
