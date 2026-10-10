import { gigPayeeBodySchema, gigPayeeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assertPayeeDoorOpen } from "@/lib/question-gig";
import { savePayee } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/gigs/payee — the contributor's own UPI id and the name on it: where the company pays them. Open while the gig is, or while the teacher is still owed for earlier questions. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    // quiz-board (11 Oct 2026): the one door the closed gig keeps, for a teacher still owed money; 404 otherwise (review-queue, 10 Oct).
    await assertPayeeDoorOpen(ctx.user.id);
    const parsed = gigPayeeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await savePayee(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPayeeSchema.parse({ payee: result.payee }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/payee");
  }
}
