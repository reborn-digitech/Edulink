import { projectListSchema, projectSaveSchema, projectViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createProject, listProjects } from "@/lib/placement-projects";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/projects — Students' projects. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("HOD", "FACULTY");
    return ok(projectListSchema.parse(await listProjects(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/projects");
  }
}

/** POST /api/v1/placement/projects — Set up a project with its students and guide. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("HOD", "FACULTY");
    const parsed = projectSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(projectViewSchema.parse(await createProject(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/projects");
  }
}
