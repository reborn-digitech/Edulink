import { classArchiveBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { archiveClass, restoreClass } from "@/app/(app)/admin/classes/actions";

/**
 * POST /api/v1/admin/classes/{classId}/archive — `archived: true` archives
 * (never deletes: a class owns attendance and grades), `false` restores.
 * Restoring is idempotent; archiving an archived class is refused with 422,
 * as the action refuses it; another school's class is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = classArchiveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const klass = await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    const result = parsed.data.archived ? await archiveClass(klass.id) : await restoreClass(klass.id);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/archive");
  }
}
