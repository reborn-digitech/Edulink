import { internalMarksResultSchema, internalMarksSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveInternalMarks } from "@/lib/academics-assessment";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** POST /api/v1/academics/offerings/{offeringId}/internal/marks — Marks for one component, as a list or a pasted sheet; a change takes the countersign away; 409 once released or locked. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = internalMarksSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(internalMarksResultSchema.parse(await saveInternalMarks(ctx, p.offeringId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/internal/marks");
  }
}
