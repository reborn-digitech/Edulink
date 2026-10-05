import { tallyPayrollQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { tallyPayroll } from "@/lib/tally-export";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, budget, EXPORT_BUDGET } from "@/lib/api-v1";

/** GET /api/v1/tally/payroll?month=&format= — A locked payroll month as one Tally Journal voucher (XML or a CSV day book; audited). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "ACCOUNTS");
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = tallyPayrollQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const file = await tallyPayroll(ctx, parsed.data.month, parsed.data.format);
    return new Response(file.content, { headers: { "content-type": `${file.mime}; charset=utf-8`, "content-disposition": `attachment; filename="${file.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/tally/payroll");
  }
}
