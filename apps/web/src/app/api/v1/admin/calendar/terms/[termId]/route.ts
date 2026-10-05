import { okSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { deleteTerm } from "@/lib/terms";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * DELETE /api/v1/admin/calendar/terms/{termId} — remove a term (the web's
 * removeTerm). The office's alone, as on the web: the head makes terms but
 * does not remove them. The series and cards that named it keep their marks
 * and lose the label; refused (422) while a published card reports into it.
 * Another school's term is a 404.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ termId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { termId } = await params;
    const result = await deleteTerm(ctx, termId);
    if (!result.ok) {
      if (result.errorKey === "terms.notFound") throw new AccessError(result.errorKey, "NOT_FOUND");
      return apiRefused(result);
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/terms/[termId]");
  }
}
