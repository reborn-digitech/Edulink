import { admissionRegisterQuerySchema, officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { admissionRegister } from "@/lib/college-admissions";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/college/admissions/register — The admission register of an intake as the university inspects it, as CSV text. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const parsed = admissionRegisterQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    const t = await getT();
    const file = await admissionRegister(ctx, q.intakeYear, t);
    return ok(officeCsvExportSchema.parse({ ...file, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/register");
  }
}
