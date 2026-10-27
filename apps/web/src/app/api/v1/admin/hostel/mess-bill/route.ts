import { messBillBodySchema, messBillResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { billMess } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/admin/hostel/mess-bill — the office bills a month's mess to each boarder's ledger under the Mess fee
 * head, at their house's monthly charge, due on the tenth of the next month; a month billed twice bills nobody twice
 * (owner-batch-item5, 27 Oct 2026). A school's door, and a college's office may use it too; the college's accounts
 * desk has /api/v1/accounts/mess-bill. Who may, and "once", are billMess's.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = messBillBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(messBillResultSchema.parse(await billMess(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/hostel/mess-bill");
  }
}
