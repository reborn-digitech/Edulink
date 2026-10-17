import { NextResponse } from "next/server";
import { apiErrorSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { deleteSiteFile } from "@/lib/site-files";
import { fileUseText } from "@/lib/site-content";

/**
 * DELETE /api/v1/admin/site/files/{fileId} — delete a picture or PDF uploaded for the website (website-three, 17 Oct 2026):
 * 409 CONFLICT naming where while the saved draft or the live site uses it, 404 for a file that is not this school's
 * upload; the row and the bytes go at once otherwise. Audited.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const done = await deleteSiteFile(ctx, (await params).fileId);
    if (!done.ok) {
      const t = await getT();
      const where = done.usedBy.map((u) => fileUseText(t, u)).join(", ");
      return NextResponse.json(apiErrorSchema.parse({ error: t(done.errorKey, { where }), code: "CONFLICT" }), { status: done.status });
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/files/delete");
  }
}
