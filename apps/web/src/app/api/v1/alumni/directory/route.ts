import { alumniDirectoryJoinSchema, alumniDirectoryMeSchema, alumniDirectorySchema } from "@edulink/contracts";
import { alumniDirectory, joinAlumniDirectory, leaveAlumniDirectory } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { AccessError } from "@/lib/access-error";

/** GET /api/v1/alumni/directory — the listed alumni; for the school's alumni and staff. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(alumniDirectorySchema.parse(await alumniDirectory(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/directory");
  }
}

/** PUT /api/v1/alumni/directory — join, or change one's entry (an adult alumnus). */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiSession();
    // The role before the body: anyone else is a 403, never a 422 (the catalog's promise, which the sweep checks).
    if (ctx.role !== "ALUMNUS") throw new AccessError("access.wrongRoleForThisAction");
    const parsed = alumniDirectoryJoinSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(alumniDirectoryMeSchema.parse(await joinAlumniDirectory(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/directory");
  }
}

/** DELETE /api/v1/alumni/directory — leave it; what was written goes too. */
export async function DELETE() {
  try {
    const ctx = await requireApiSession();
    return ok(alumniDirectoryMeSchema.parse(await leaveAlumniDirectory(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/directory");
  }
}
