import { antiRaggingRegisterSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { antiRaggingRegister } from "@/lib/anti-ragging";

/** GET /api/v1/duties/anti-ragging — the anti-ragging register (5 Oct 2026): a FACULTY or HOD holding ANTI_RAGGING_SQUAD (the gate checks the duty first), the office and the head. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(antiRaggingRegisterSchema.parse(await antiRaggingRegister(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/duties/anti-ragging");
  }
}
