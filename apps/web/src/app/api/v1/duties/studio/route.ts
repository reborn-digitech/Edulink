import { studioDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { studioDesk } from "@/lib/studio";

/** GET /api/v1/duties/studio — the studio coordinator's desk: studios with their stages, the juries and their panels, the sheets waiting for a signature (R-56, the studio half, 10 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(studioDeskSchema.parse(await studioDesk(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/studio");
  }
}
