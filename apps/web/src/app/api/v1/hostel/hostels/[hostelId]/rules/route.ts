import { hostelRulesBodySchema, hostelRulesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveHostelRules } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ hostelId: string }> };

/** POST /api/v1/hostel/hostels/{hostelId}/rules — A college hostel's rules: the curfew, night-outs, the mess's monthly charge. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { hostelId } = await params;
    const parsed = hostelRulesBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelRulesSchema.parse(await saveHostelRules(ctx, hostelId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/hostels/[hostelId]/rules");
  }
}
