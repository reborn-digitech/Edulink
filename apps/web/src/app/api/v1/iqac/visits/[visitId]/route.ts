import { visitDetailSchema, visitUpdateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { updateVisit, visitDetail } from "@/lib/peer-visits";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ visitId: string }> };

/** GET /api/v1/iqac/visits/{visitId} — The visit's file: schedule, evidence index (resolved), the SAR pack read from the filings. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD", "PRINCIPAL", "ADMIN");
    const p = await params;
    return ok(visitDetailSchema.parse(await visitDetail(ctx, p.visitId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits/[visitId]");
  }
}

/** POST /api/v1/iqac/visits/{visitId} — The title, the dates, the team, the status. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD");
    const p = await params;
    const parsed = visitUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(visitDetailSchema.parse(await updateVisit(ctx, p.visitId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits/[visitId]");
  }
}
