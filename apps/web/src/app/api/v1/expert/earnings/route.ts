import { expertEarningsSchema } from "@edulink/contracts";
import { expertEarnings } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/earnings — on hold, due, paid out and refunded, seat by seat with the gross, the commission, the GST and the net; the payouts with the company's reference; the invoices. */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertEarningsSchema.parse(await expertEarnings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/earnings");
  }
}
