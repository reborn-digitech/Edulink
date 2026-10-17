import { passOrderReadSchema } from "@edulink/contracts";
import { passOrderStatus } from "@/lib/pass-orders";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/account/pass/orders/{id} — one of my pass orders, with its checkout while it waits; the panel polls it (17 Oct 2026). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiSession();
    return ok(passOrderReadSchema.parse(await passOrderStatus(ctx, (await params).id)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/orders/[id]");
  }
}
