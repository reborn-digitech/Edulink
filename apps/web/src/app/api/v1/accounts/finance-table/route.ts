import { financeTableQuerySchema, financeTableSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { financeTableFor } from "@/lib/accounts";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/accounts/finance-table — Three years of fees, scholarships, salaries, purchases and the library's spend (AICTE disclosure, NAAC criterion 4, NIRF). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL", "IQAC");
    const parsed = financeTableQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(financeTableSchema.parse(await financeTableFor(ctx, q.years)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/finance-table");
  }
}
