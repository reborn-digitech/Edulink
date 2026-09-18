import { healthCardSaveSchema, healthCardSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { healthCardFor, saveHealthCard } from "@/lib/health";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ membershipId: string }> };

/** GET /api/v1/staff/pupils/{membershipId}/health — the card, for the office, the head and the pupil's own teachers. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    return ok(healthCardSchema.parse(await healthCardFor(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/pupils/health");
  }
}

/** POST /api/v1/staff/pupils/{membershipId}/health — the office or the head writes the whole card. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    const parsed = healthCardSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(healthCardSchema.parse(await saveHealthCard(ctx, membershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/pupils/health");
  }
}
