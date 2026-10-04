import { academicsChangedResultSchema, lateRegistrationDecideSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideLateRegistration } from "@/lib/academics-registration";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ id: string }> };

/** POST /api/v1/academics/late-registrations/{id}/decide — The principal approves or refuses a late registration. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const p = await params;
    const parsed = lateRegistrationDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsChangedResultSchema.parse(await decideLateRegistration(ctx, p.id, q.approve)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/late-registrations/[id]/decide");
  }
}
