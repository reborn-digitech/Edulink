import { filingsViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { filingsView } from "@/lib/filings";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/filings — the identity, the readiness and the grades. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(filingsViewSchema.parse(await filingsView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/filings");
  }
}
