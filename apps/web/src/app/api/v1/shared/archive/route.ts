import { archivePageSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readArchive, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/archive — the closed years, and `?year=` (the newest otherwise) opened as this role sees it; a guardian picks `?child=`. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    return ok(archivePageSchema.parse(await readArchive(ctx, { year: text(params, "year"), child: text(params, "child") })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/archive");
  }
}
