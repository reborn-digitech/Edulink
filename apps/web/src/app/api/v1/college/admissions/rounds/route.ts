import { admissionRoundSaveSchema, admissionRoundsSchema, collegeSavedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listRounds, saveRound } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/college/admissions/rounds — The college's admission rounds with their seats, allotments, applications and admissions. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    return ok(admissionRoundsSchema.parse(await listRounds(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/rounds");
  }
}

/** POST /api/v1/college/admissions/rounds — Open (or correct) a round: CAP 1–3, institute-level or merit, with the seat matrix by category. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = admissionRoundSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeSavedSchema.parse(await saveRound(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/rounds");
  }
}
