import { competitionEventBodySchema, competitionEventCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createCompetitionEvent } from "@/lib/competition-events";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/admin/calendar/competitions — the office adds a competition to the school calendar (decision 0007,
 * 6 Nov 2026): one tenant transaction makes the Competition (published, the school's own) and its calendar row.
 * The office's alone, as the calendar is. A rule the event breaks (an end before the start, a board setting off
 * the list) is a 422 in words.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = competitionEventBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await underRules("api/v1/admin/calendar/competitions", async () => ok(competitionEventCreatedSchema.parse(await createCompetitionEvent(ctx, parsed.data)), 201));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/competitions");
  }
}
