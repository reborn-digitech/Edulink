import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { admissionRegister } from "@/lib/college-admissions";
import { budget, EXPORT_BUDGET } from "@/lib/api-v1";

/** The admission register of an intake (`?intakeYear=2026`) as the university inspects it, as a CSV file (4 Oct 2026). */
export async function GET(request: Request) {
  const t = await getT();
  try {
    const ctx = await requireApiUser();
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const year = Number(new URL(request.url).searchParams.get("intakeYear"));
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return new Response(t("common.checkTheForm"), { status: 422 });
    return exportResponse(request, await admissionRegister(ctx, year, t));
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response(t(error.key, error.vars), { status });
    }
    console.error("[admission register]", error);
    return new Response(t("common.somethingWrong"), { status: 500 });
  }
}
