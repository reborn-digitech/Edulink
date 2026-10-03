import { alumniPostCreatedSchema, alumniPostSchema } from "@edulink/contracts";
import { createPost } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { AccessError } from "@/lib/access-error";

/**
 * POST /api/v1/alumni/posts — a former pupil shares a post with the old
 * school: school-wide, held for the office, and only while the school lets
 * its alumni post (createPost asks alumni.ts). The ordinary compose door
 * stays closed to the role; this one says what an alumnus may send.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    if (ctx.role !== "ALUMNUS") throw new AccessError("access.wrongRoleForThisAction");
    const parsed = alumniPostSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const created = await createPost(ctx, { scope: "SCHOOL", title: parsed.data.title, body: parsed.data.body, tags: [], media: [], category: "PEOPLE" });
    return ok(alumniPostCreatedSchema.parse(created), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/posts");
  }
}
