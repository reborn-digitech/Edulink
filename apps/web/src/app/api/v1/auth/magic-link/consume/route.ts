import { magicLinkConsumeSchema } from "@edulink/contracts";
import { claimToken } from "@/lib/auth-tokens";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
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
    const user = await db.user.findUnique({ where: { id: claim.userId }, select: { id: true, disabledAt: true, lastRole: true, lastSchoolId: true } });
    if (!user || user.disabledAt) {
      return NextResponse.json({ error: t("login.noMatch"), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return issueApiSession(request, user.id, user, "magic-link", parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/magic-link/consume");
  }
}
