import { passOrdersSchema } from "@edulink/contracts";
import { myPassOrders } from "@/lib/pass-orders";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/account/pass/orders — the passes I paid for or hold, newest first (17 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(passOrdersSchema.parse({ orders: await myPassOrders(ctx) }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/orders");
  }
}
