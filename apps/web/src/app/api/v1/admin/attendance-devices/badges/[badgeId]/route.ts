import { okSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeBadge } from "@/lib/attendance-devices";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ badgeId: string }> };

/** DELETE /api/v1/admin/attendance-devices/badges/{badgeId} — The office takes a badge away. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const p = await params;
    await removeBadge(ctx, p.badgeId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices/badges/[badgeId]");
  }
}
