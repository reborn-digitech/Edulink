import { operatorPassOrdersSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { operatorPassOrders } from "@/lib/pass-orders";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/pass-orders — this month's pass revenue by plan and the last twenty orders (17 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(operatorPassOrdersSchema.parse(await operatorPassOrders(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/pass-orders");
  }
}
