import { operatorDashboardQuerySchema, operatorDashboardSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { operatorDashboard } from "@/lib/subscriptions";

/** GET /api/v1/operator/dashboard — the web's /root for the phone: the tiles, the schools narrowed by q, state, plan and partner, the partners and what each is owed, and the schools due within a week. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorDashboardQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const d = await operatorDashboard(ctx, parsed.data);
    return ok(
      operatorDashboardSchema.parse({
        month: d.month,
        tiles: d.tiles,
        partners: d.partners,
        plans: d.plans,
        // At most 200, as the overview is: a phone scrolls a list, not a ledger.
        rows: d.rows.slice(0, 200).map((r) => ({
          id: r.id,
          name: r.name,
          city: r.city,
          removedAt: r.removedAt,
          verifiedAt: r.verifiedAt,
          pendingAdminInvites: r.pendingAdminInvites,
          plan: r.plan,
          pupils: r.pupils,
          subscription: r.subscription,
          dueTone: r.dueTone,
          commission: r.commission,
          contact: r.contact,
          lastActivityAt: r.lastActivityAt,
        })),
        dueSoon: d.dueSoon,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/operator/dashboard");
  }
}
