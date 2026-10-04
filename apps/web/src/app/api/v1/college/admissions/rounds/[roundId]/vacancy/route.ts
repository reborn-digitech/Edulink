import { vacancyReportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { vacancyReport } from "@/lib/college-admissions";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ roundId: string }> };

/** GET /api/v1/college/admissions/rounds/{roundId}/vacancy — Seats against admissions by category for the round's intake: the vacancy report. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const { roundId } = await params;
    return ok(vacancyReportSchema.parse(await vacancyReport(ctx, roundId)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/rounds/[roundId]/vacancy");
  }
}
