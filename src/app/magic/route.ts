import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { claimToken } from "@/lib/auth-tokens";
import { createSession } from "@/lib/session";
import { resolveContext } from "@/app/login/actions";

/**
 * The link the login page's "email me a sign-in link instead" has been sending.
 *
 * ⚠ THIS ROUTE DID NOT EXIST, and it is the worse half of the pair. `/verify`
 * was a button in a welcome email; this is an advertised way to sign in, three
 * clicks from the front door, which sent a real email containing a real token
 * and a URL that 404ed. Anybody without their password who took the offer got
 * nowhere. It sat in this repo's README under "Verified working".
 *
 * ⚠ A ROUTE HANDLER AND NOT A PAGE, which the first version got wrong and a
 * walkthrough caught. Signing somebody in means writing a cookie, and Next.js
 * refuses that from a Server Component — "Cookies can only be modified in a
 * Server Action or Route Handler". The page rendered fine for every FAILING
 * token, which is exactly what the sweep exercised with its junk token, so the
 * 500 lived only on the success path. Opening a real emailed link is what found
 * it.
 *
 * FAILURES REDIRECT TO `/login` WITH A REASON rather than rendering their own
 * page. A handler cannot render, and the login form is where somebody holding a
 * dead link needs to be anyway — the message meets them next to the password
 * box that still works.
 *
 * SPENDING THE TOKEN AND MINTING THE SESSION ARE ONE REQUEST, spend first.
 * `claimToken` consumes with a conditional UPDATE, so a mail client that
 * prefetches the link and the person who then clicks it cannot both be signed
 * in — one wins and the other is told the link was used.
 *
 * IT REUSES `resolveContext`, whose own comment has always said it is exported
 * because "the magic link and invite-acceptance routes need exactly the same
 * logic". This is the magic-link caller it was written for, finally.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const origin = request.nextUrl.origin;
  const away = (reason: string) => NextResponse.redirect(new URL(`/login?link=${reason}`, origin));

  const claim = await claimToken(token, "MAGIC_LINK");
  if (!claim.ok) {
    return away(claim.reason === "EXPIRED" ? "expired" : claim.reason === "USED" ? "used" : "bad");
  }

  /**
   * A disabled account must not be let in by a link minted before it was turned
   * off. The equivalent check at password login lives in `login`, which this
   * route does not go through — so it is repeated here rather than assumed.
   */
  const user = await db.user.findUnique({
    where: { id: claim.userId },
    select: { id: true, disabledAt: true, lastRole: true, lastSchoolId: true },
  });
  if (!user || user.disabledAt) return away("bad");

  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);
  await createSession(user.id, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { via: "magic-link", role: context.role },
  });

  return NextResponse.redirect(new URL(context.redirectTo, origin));
}
