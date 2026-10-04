import { projectReviewSchema, projectViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { reviewProject } from "@/lib/placement-projects";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ projectId: string }> };

/** POST /api/v1/placement/projects/{projectId}/review — The guide records a review. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("HOD", "FACULTY");
    const p = await params;
    const parsed = projectReviewSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(projectViewSchema.parse(await reviewProject(ctx, p.projectId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/projects/[projectId]/review");
  }
}
