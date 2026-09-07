import { NextResponse } from "next/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { submitAnswerIdempotent, normaliseLanguage } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";

/**
 * The practice answer endpoint — the target of the offline outbox, so it is a
 * route handler (a service worker can replay a plain fetch; it cannot replay a
 * server action) and it MUST be safe to call twice with the same body. The
 * idempotency guarantee lives in `submitAnswerIdempotent`, where the test
 * suite can hold it.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const body = (await request.json().catch(() => null)) as {
      attemptId?: string;
      questionId?: string;
      chosenIndex?: number;
    } | null;
    if (
      !body ||
      typeof body.attemptId !== "string" ||
      typeof body.questionId !== "string" ||
      typeof body.chosenIndex !== "number"
    ) {
      return NextResponse.json({ error: "Expected attemptId, questionId, chosenIndex." }, { status: 400 });
    }

    const outcome = await submitAnswerIdempotent(
      ctx,
      body.attemptId,
      body.questionId,
      body.chosenIndex,
      normaliseLanguage(ctx.user.prefs.locale),
    );
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: (await getT())(error.key, error.vars) }, { status });
    }
    console.error("[practice answer]", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
