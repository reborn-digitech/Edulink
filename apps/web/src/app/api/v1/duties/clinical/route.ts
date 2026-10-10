import { clinicalDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { clinicalDesk } from "@/lib/clinical";

/** GET /api/v1/duties/clinical — the clinical coordinator's desk: sites and departments, the postings by rotation, the signing queue (R-56, 10 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(clinicalDeskSchema.parse(await clinicalDesk(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical");
  }
}
