import { squadRoundSaveSchema, squadRoundSchema, squadRoundsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listSquadRounds, logSquadRound } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/squad-rounds — The anti-ragging squad's rounds. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL", "IQAC");
    return ok(squadRoundsSchema.parse(await listSquadRounds(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/squad-rounds");
  }
}

/** POST /api/v1/hostel/squad-rounds — Log a round of the anti-ragging squad. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = squadRoundSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(squadRoundSchema.parse(await logSquadRound(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/squad-rounds");
  }
}
