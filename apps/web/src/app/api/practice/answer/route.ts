import { NextResponse } from "next/server";
import { webPracticeAnswerBodySchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid } from "@/lib/api-v1";
import { FeatureOffError, PlanRequiredError } from "@/lib/access-error";
import { submitAnswerIdempotent, normaliseLanguage } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";

/**
 * The practice answer endpoint — the target of the offline outbox, so it is a
 * route handler (a service worker can replay a plain fetch; it cannot replay a
 * server action) and it MUST be safe to call twice with the same body. The
 * idempotency guarantee lives in `submitAnswerIdempotent`, where the test
 * suite can hold it.
 *
 * A malformed body is a 422 in the v1 doors' own shape (R-51, 5 October
 * 2026), validated with the contract the catalog names, as every v1 door and
 * openapi.json say; it was a bare 400. The outbox treats both as "rejected,
 * do not replay" (offline-queue.ts: any 4xx but 401 and 429).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = webPracticeAnswerBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiInvalid(parsed);
    const body = parsed.data;

    const outcome = await submitAnswerIdempotent(
      ctx,
      body.attemptId,
      body.questionId,
      body.chosenIndex,
      normaliseLanguage(ctx.user.prefs.locale),
    );
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    // The question bank switched off (404 FEATURE_OFF) or a plan the pupil lacks (402 PLAN_REQUIRED): answered as every
    // v1 door answers them, with the envelope code the catalog publishes for this door (x-feature, x-plans). Mapped by
    // hand below they were a bare 404 and a 403 (the page sweep of 16 Oct 2026).
    if (error instanceof FeatureOffError || error instanceof PlanRequiredError) return apiFailure(error, "api/practice/answer");
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: (await getT())(error.key, error.vars) }, { status });
    }
    console.error("[practice answer]", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
