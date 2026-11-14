import { admissionRoundDatesSchema, admissionRoundSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveRoundDates } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ roundId: string }> };

/** POST /api/v1/college/admissions/rounds/{roundId}/dates — Change a round's opening and closing days only (TA-572): extend it, or close it by moving the closing day; the seats are kept. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { roundId } = await params;
    const parsed = admissionRoundDatesSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(admissionRoundSchema.parse(await saveRoundDates(ctx, roundId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/rounds/[roundId]/dates");
  }
}
