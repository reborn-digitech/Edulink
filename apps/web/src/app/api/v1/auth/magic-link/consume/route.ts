import { magicLinkConsumeSchema } from "@edulink/contracts";
import { claimToken } from "@/lib/auth-tokens";
import { magicLinkHolder } from "@/lib/magic-link";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { twoFactorGate } from "@/lib/api-two-factor";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/auth/magic-link/consume — the link's token, once, for a session.
 * The claim is the same single-use, expiry-checked update the web's /magic
 * route makes, so a link opened in the browser and pasted into the app cannot
 * both sign in.
 */
export async function POST(request: Request) {
  try {
    const parsed = magicLinkConsumeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const claim = await claimToken(parsed.data.token, "MAGIC_LINK");
    const t = await getT();
    if (!claim.ok) {
      const key = claim.reason === "EXPIRED" ? "login.linkExpired" : claim.reason === "USED" ? "login.linkUsed" : "login.noMatch";
      return NextResponse.json({ error: t(key), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    // The web's /magic checks, asked once (TA-040): disabled, the address the link went to still the account's,
    // a closed outside account; and a never-verified account taken back for the mailbox's owner (TA-035).
    const holder = await magicLinkHolder(claim);
    if (!holder.ok) {
      // The operator closed this outside account (G4-28): 403 with the sentence, as POST /api/v1/auth/login answers.
      if (holder.reason !== "bad") return NextResponse.json({ error: t(holder.reason === "closedRecruiter" ? "riskDecisions.signInClosedRecruiter" : "riskDecisions.signInClosedExpert"), code: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
      return NextResponse.json({ error: t("login.noMatch"), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const user = holder.user;
    const second = await twoFactorGate(user.id, "magic-link");
    if (second) return second;
    // The reclaim is recorded on the sign-in's row, as /magic records it (meta.reclaimed).
    return issueApiSession(request, user.id, user, "magic-link", parsed.data.device, holder.reclaimed ? { reclaimed: true } : undefined);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/magic-link/consume");
  }
}
