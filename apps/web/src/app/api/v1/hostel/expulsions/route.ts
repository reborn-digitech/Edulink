import { hostelExpulsionProposeSchema, hostelExpulsionSchema, hostelExpulsionsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listExpulsions, proposeExpulsion } from "@/lib/head-approvals";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/expulsions — every proposal to end a boarder's place, those waiting for the principal first (5 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    return ok(hostelExpulsionsSchema.parse(await listExpulsions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/expulsions");
  }
}

/** POST /api/v1/hostel/expulsions — the warden or the office proposes ending a boarder's place; only the principal decides. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelExpulsionProposeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(hostelExpulsionSchema.parse(await proposeExpulsion(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/expulsions");
  }
}
