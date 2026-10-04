import { academicsIdResultSchema, internalComponentSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveComponent } from "@/lib/academics-assessment";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** POST /api/v1/academics/offerings/{offeringId}/internal/components — A component made or changed; weights may not pass the scheme's internal total; 409 once locked or released. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = internalComponentSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveComponent(ctx, p.offeringId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/internal/components");
  }
}
