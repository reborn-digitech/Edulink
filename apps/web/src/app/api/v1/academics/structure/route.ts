import { academicsStructureSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { academicsStructure } from "@/lib/academics";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/structure — The college's academic structure: departments, programmes, schemes, courses with outcomes, terms, rooms, divisions, bells, faculty. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "FACULTY");
    return ok(academicsStructureSchema.parse(await academicsStructure(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/structure");
  }
}
