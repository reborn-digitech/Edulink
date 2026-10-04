import { driveUpdateSchema, driveViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { driveView, updateDrive } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** GET /api/v1/placement/drives/{driveId} — One drive. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(driveViewSchema.parse(await driveView(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]");
  }
}

/** POST /api/v1/placement/drives/{driveId} — The host's TPO edits a drive or moves it on. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = driveUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(driveViewSchema.parse(await updateDrive(ctx, p.driveId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]");
  }
}
