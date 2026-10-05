import { researchDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { researchDesk } from "@/lib/duty-desks";

/** GET /api/v1/duties/research — the research dean's read: the college's research register, each teacher's API-score inputs, the years. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(researchDeskSchema.parse(await researchDesk(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/research");
  }
}
