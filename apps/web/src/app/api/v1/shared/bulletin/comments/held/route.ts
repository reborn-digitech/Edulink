import { bulletinHeldCommentsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { readHeldComments } from "@/lib/api-reads/shared";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/bulletin/comments/held — the comments waiting on the reader, oldest first: an admin's are everything held at the school, a teacher's the ones on their classes' posts. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    return ok(bulletinHeldCommentsSchema.parse(await readHeldComments(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/comments/held");
  }
}
