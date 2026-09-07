import { mentoringPageSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readMentoring, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/mentoring — my mentorships (`?status=ACTIVE|REQUESTED|CLOSED`), plus the requests waiting on the office. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    return ok(mentoringPageSchema.parse(await readMentoring(ctx, { status: text(query(request), "status") })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/mentoring");
  }
}
