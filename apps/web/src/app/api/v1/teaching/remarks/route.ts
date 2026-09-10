import { teachingRemarkPeopleSchema, teachingRemarkStartedSchema, teachingStartRemarkSchema } from "@edulink/contracts";
import { createThread } from "@/lib/remarks";
import { requireApiSession } from "@/lib/api-reads/shared";
import { assertMayStartThread, remarkPeople } from "@/lib/api-reads/teaching";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * GET /api/v1/teaching/remarks — who this person may write about or to: a
 * teacher's pupils (with how many guardians each has, so a message to nobody
 * is visible before it is written), a pupil's teachers, a guardian's children
 * and theirs. The web's /remarks/new reads.
 */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    assertMayStartThread(ctx);
    return ok(teachingRemarkPeopleSchema.parse(await remarkPeople(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/remarks");
  }
}

/**
 * POST /api/v1/teaching/remarks — the web's startThread: one conversation
 * between a teacher, a pupil and that pupil's guardians. `createThread` makes
 * each starter prove their link to the pair; the web's action has no rate
 * limit and neither does this.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    assertMayStartThread(ctx);
    const parsed = teachingStartRemarkSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { threadId } = await createThread(ctx, parsed.data);
    return ok(teachingRemarkStartedSchema.parse({ threadId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/remarks");
  }
}
