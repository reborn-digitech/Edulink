import { condonationDecideSchema, condonationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideCondonation } from "@/lib/academics-attendance";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ id: string }> };

/** POST /api/v1/academics/condonations/{id}/decide — The HOD approves above the department's floor, forwards or refuses; the principal decides what was forwarded. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("HOD", "PRINCIPAL");
    const p = await params;
    const parsed = condonationDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(condonationSchema.parse(await decideCondonation(ctx, p.id, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/condonations/[id]/decide");
  }
}
