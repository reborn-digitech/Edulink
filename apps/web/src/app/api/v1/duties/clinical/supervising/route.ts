import { clinicalSupervisionSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { clinicalSupervision } from "@/lib/clinical";

/** GET /api/v1/duties/clinical/supervising — a faculty member's own clinical postings and the entries waiting for their signature; no duty needed. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(clinicalSupervisionSchema.parse(await clinicalSupervision(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical/supervising");
  }
}
