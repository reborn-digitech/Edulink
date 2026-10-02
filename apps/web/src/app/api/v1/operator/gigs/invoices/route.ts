import { gigOperatorInvoicesSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { operatorInvoices } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/gigs/invoices — every tax invoice the company has issued to an expert, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(gigOperatorInvoicesSchema.parse(await operatorInvoices(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/invoices");
  }
}
