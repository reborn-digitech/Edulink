import { signaturesViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { signaturesView } from "@/lib/signatures";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/signatures — the reader's own signature, the seal, and the papers waiting for the reader's. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(signaturesViewSchema.parse(await signaturesView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures");
  }
}
