import { dreamFlagSaveSchema, placementChangedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { setDreamFlag } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ membershipId: string }> };

/** POST /api/v1/placement/students/{membershipId}/dream — The TPO grants or withdraws a student's dream flag. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = dreamFlagSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(placementChangedSchema.parse(await setDreamFlag(ctx, p.membershipId, b.on)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/students/[membershipId]/dream");
  }
}
