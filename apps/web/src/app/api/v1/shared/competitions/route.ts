import { competitionsPageSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readCompetitions, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/competitions — the school's and the platform's, open ones unless `?show=all`, `?subject=` to narrow. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    return ok(competitionsPageSchema.parse(await readCompetitions(ctx, { openOnly: params.get("show") !== "all", subject: text(params, "subject") })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions");
  }
}
