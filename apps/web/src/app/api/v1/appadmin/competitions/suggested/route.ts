import { COMPETITION_SUGGESTION_SHOWS, competitionSuggestionsSchema, type CompetitionSuggestionShow } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskSuggestions } from "@/lib/competition-crawl-desk";
import { ok } from "@/lib/api-v1";
import { deskFailure } from "../../competition-crawl/_shared";

/** GET /api/v1/appadmin/competitions/suggested?show=SUGGESTED|CHANGED|DISMISSED — the "Suggested from the web" tab. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const raw = new URL(request.url).searchParams.get("show") ?? "SUGGESTED";
    const show = ((COMPETITION_SUGGESTION_SHOWS as readonly string[]).includes(raw) ? raw : "SUGGESTED") as CompetitionSuggestionShow;
    return ok(competitionSuggestionsSchema.parse(await deskSuggestions(ctx, show)));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competitions/suggested");
  }
}
