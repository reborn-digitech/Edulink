import { assistantSuggestionsSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { assistantSuggestions } from "@/lib/assistant/service";
import { assistantFailure, requireAssistantSession } from "@/lib/assistant/http";

/**
 * GET /api/v1/assistant/suggestions?page=/student/assignments — three questions for an empty drawer (Vidura pass 1,
 * 17 Oct 2026), per role and page, in the reader's language, from the help index. Reads nothing of the person's own.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireAssistantSession();
    const page = new URL(request.url).searchParams.get("page");
    return ok(assistantSuggestionsSchema.parse(await assistantSuggestions(ctx, page)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/suggestions");
  }
}
