import { gigCompanyBodySchema, gigCompanySavedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { saveCompanyDetails } from "@/lib/gig-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/company — the company as the seller on its tax invoices: legal name, GSTIN, address, state, SAC, the series prefix and the GST rate on the commission. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = gigCompanyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveCompanyDetails(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigCompanySavedSchema.parse({ company: result.company }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/company");
  }
}
