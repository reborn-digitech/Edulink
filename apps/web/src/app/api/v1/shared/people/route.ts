import { inboxPeopleSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readPeople, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/people — who the caller may write to at `?school=` (their first school otherwise), `?q=` on the name. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    return ok(inboxPeopleSchema.parse(await readPeople(ctx, { school: text(params, "school"), q: text(params, "q") })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/people");
  }
}
