import { gigPayeeBodySchema, gigPayeeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { savePayee } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/gigs/payee — the contributor's own UPI id and the name on it: where the company pays them. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = gigPayeeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await savePayee(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPayeeSchema.parse({ payee: result.payee }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/payee");
  }
}
