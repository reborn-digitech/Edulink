import { substitutionAssignSchema, substitutionAssignedSchema, substitutionBoardQuerySchema, substitutionBoardSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assignSubstitute, substitutionBoard } from "@/lib/substitutions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/substitutions?date= — the board for a day. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = substitutionBoardQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(substitutionBoardSchema.parse(await substitutionBoard(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/substitutions");
  }
}

/** POST /api/v1/office/substitutions — name who takes a lesson on a day. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = substitutionAssignSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(substitutionAssignedSchema.parse(await assignSubstitute(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/substitutions");
  }
}
