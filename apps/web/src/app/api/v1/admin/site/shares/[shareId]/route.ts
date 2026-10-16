import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { revokeSiteShare } from "@/lib/site-share";

/** DELETE /api/v1/admin/site/shares/{shareId} — revoke a review link: it answers 404 from the next request; audited (website-two, 16 Oct 2026). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ shareId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await revokeSiteShare(ctx, (await params).shareId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/shares/revoke");
  }
}
