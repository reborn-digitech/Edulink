import { driveListSchema, driveSaveSchema, driveViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listDrives, openDrive } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/drives — The college's drives and the pooled drives it is a guest of. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(driveListSchema.parse(await listDrives(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives");
  }
}

/** POST /api/v1/placement/drives — The TPO opens a drive. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = driveSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(driveViewSchema.parse(await openDrive(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives");
  }
}
