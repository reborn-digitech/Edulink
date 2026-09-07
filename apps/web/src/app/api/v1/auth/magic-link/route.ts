import { magicLinkRequestSchema } from "@edulink/contracts";
import { requestMagicLink } from "@/app/login/actions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/auth/magic-link — email a sign-in link.
 *
 * The same action the login page uses, which answers ok whether or not the
 * address is known (an unknown address must not be distinguishable). The link
 * lands on the web's /magic page; the app opens it through the deep link the
 * page redirects to when the session is minted, or pastes the token into
 * /magic-link/consume. Only a rate limit is an error here.
 */
export async function POST(request: Request) {
  try {
    const parsed = magicLinkRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await requestMagicLink(parsed.data);
    if (!state.ok) {
      return NextResponse.json({ error: state.errors._form ?? "Refused", code: "RATE_LIMITED" }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/auth/magic-link");
  }
}
