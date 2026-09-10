import { contestCreatedSchema, contestPlatformCreateSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { createPlatformCompetition, readPlatformCompetitionForm } from "@/lib/app-admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "../../../shared/helpers";

/**
 * POST /api/v1/appadmin/competitions/drafts — the content team posts a
 * competition for every school, saved as a DRAFT; publishing is its own press.
 * Read by the same form reader the web's action uses.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = contestPlatformCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const read = readPlatformCompetitionForm(parsed.data);
    if (!read.ok) return refused(read.errorKey);
    const competitionId = await createPlatformCompetition(ctx, read.input);
    return ok(contestCreatedSchema.parse({ competitionId, status: "DRAFT" }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/competitions/drafts");
  }
}
