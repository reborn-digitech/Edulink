import { expertInvoicesSchema } from "@edulink/contracts";
import { expertInvoices } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/invoices — the company's tax invoices to this expert for its commission, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertInvoicesSchema.parse(await expertInvoices(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/invoices");
  }
}
