import { contestSubmitSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { submitEntry } from "@/lib/competitions";
import { submitUrlSchema } from "@/lib/competition-forms";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/contest/competitions/{competitionId}/submit — a pupil hands in
 * (or replaces) the link to their work. A link, not a file: `submissionUrl`
 * is what the entry holds, and work goes to the organiser's own site. Refused
 * until a guardian has said yes, after the competition ends, and once a result
 * is recorded — all in submitEntry.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { competitionId } = await params;
    const parsed = contestSubmitSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const url = submitUrlSchema(t).safeParse(parsed.data.url);
    if (!url.success) {
      const sentence = url.error.issues[0]?.message ?? t("competitions.linkNotValid");
      return apiRefused({ error: sentence, issues: { url: sentence } });
    }
    await submitEntry(ctx, competitionId, url.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/submit");
  }
}
