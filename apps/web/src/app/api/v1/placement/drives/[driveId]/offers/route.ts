import { offerSaveSchema, offerViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cellActor, recordOffer } from "@/lib/placement";
import { recruiterActor } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/placement/drives/{driveId}/offers — An offer, by the host's TPO or the bound recruiter. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "RECRUITER");
    const p = await params;
    const parsed = offerSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(offerViewSchema.parse(await recordOffer(ctx.role === "RECRUITER" ? await recruiterActor(ctx, p.driveId) : await cellActor(ctx, p.driveId), b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]/offers");
  }
}
