import { internshipListSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listInternships } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/placement/internships — Internships under the AICTE policy. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "HOD", "FACULTY", "ADMIN", "PRINCIPAL");
    return ok(internshipListSchema.parse(await listInternships(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/internships");
  }
}
