import { internshipDecideSchema, internshipViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideInternship } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ internshipId: string }> };

/** POST /api/v1/placement/internships/{internshipId}/decide — Approve a proposed internship, or refuse it. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "HOD");
    const p = await params;
    const parsed = internshipDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(internshipViewSchema.parse(await decideInternship(ctx, p.internshipId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/internships/[internshipId]/decide");
  }
}
