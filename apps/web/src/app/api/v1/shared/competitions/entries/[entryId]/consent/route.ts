import { okSchema } from "@edulink/contracts";
import { giveConsent } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/competitions/entries/{entryId}/consent — a guardian says yes to their child's entry. */
export async function POST(_request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { entryId } = await params;
    await giveConsent(ctx, entryId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions/entries/[entryId]/consent");
  }
}
