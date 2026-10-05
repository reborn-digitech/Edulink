import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { claimToken } from "@/lib/auth-tokens";
import { createSession } from "@/lib/session";
import { closedOutsideAccount, resolveContext } from "@/lib/resolve-context";
import { getT } from "@/lib/i18n/server";
import { twoFactorChallengeFor, twoFactorCookieOptions, TWO_FACTOR_COOKIE } from "@/lib/two-factor";

/**
 * The link the login page's "email me a sign-in link instead" sends.
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
 * ⚠ GET SHOWS A BUTTON; POST SPENDS THE TOKEN. The first working version spent
 * it on GET, and a GET is what everything that is not the person does: the
 * mail provider's link scanner, the messaging app's preview, the browser's
 * prefetch. Each of those burned the link before it was clicked — and worse,
 * each of them could be signed in by it, and a link somebody else was made
 * to open signed THEIR browser in as the sender (login CSRF). So the GET
 * renders one small page whose only control is a form that POSTs the token
 * back, and the POST does what the GET used to. A scanner sees a page and
 * follows no form; the person presses the button.
 *
 * FAILURES REDIRECT TO `/login` WITH A REASON rather than rendering their own
 * page. The login form is where somebody holding a dead link needs to be
 * anyway — the message meets them next to the password box that still works.
 *
 * SPENDING THE TOKEN AND MINTING THE SESSION ARE ONE REQUEST, spend first.
 * `claimToken` consumes with a conditional UPDATE, so two presses of the
 * button cannot both be signed in — one wins and the other is told the link
 * was used. And the address the link was minted for must still be the
 * account's: an email changed after the link was sent means the old inbox
 * no longer speaks for the account.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const origin = request.nextUrl.origin;
  if (!token) return NextResponse.redirect(new URL("/login?link=bad", origin));

  const t = await getT();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(t("magic.pageTitle"))}</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f6f7f9; color: #1a1d21; display: grid; min-height: 100vh; place-items: center; }
  main { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 420px; width: calc(100% - 32px); box-shadow: 0 8px 30px rgba(0,0,0,.06); text-align: center; }
  h1 { font-size: 1.35rem; margin: 0 0 12px; }
  p { margin: 0 0 24px; line-height: 1.5; color: #4b5563; }
  button { font: inherit; font-weight: 600; background: #1d4ed8; color: #fff; border: 0; border-radius: 12px; padding: 14px 24px; width: 100%; cursor: pointer; }
  button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
  @media (prefers-color-scheme: dark) { body { background: #0f1115; color: #e5e7eb; } main { background: #171a21; box-shadow: none; } p { color: #9ca3af; } }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(t("magic.title"))}</h1>
<p>${escapeHtml(t("magic.body"))}</p>
<form method="post" action="/magic">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<button type="submit">${escapeHtml(t("magic.continue"))}</button>
</form>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const away = (reason: string) => NextResponse.redirect(new URL(`/login?link=${reason}`, origin), 303);

  // Only this site's own page may post the token back. A form on another
  // site carrying somebody's token would otherwise sign this browser in as
  // that somebody — the login CSRF the GET-spends-it version already had.
  const from = request.headers.get("origin");
  const ours = new Set([origin, process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")].filter(Boolean));
  if (from && !ours.has(from)) return away("bad");

  const form = await request.formData().catch(() => null);
  const raw = form?.get("token");
  const token = typeof raw === "string" ? raw.trim() : "";

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
    select: { id: true, email: true, disabledAt: true, lastRole: true, lastSchoolId: true },
  });
  if (!user || user.disabledAt) return away("bad");
  // The link was sent to one address; the account must still be at it.
  if (claim.email && claim.email.toLowerCase() !== (user.email ?? "").toLowerCase()) return away("bad");

  // An outside account the operator closed, the person's only way in (G4-28, risks batch 5 Oct 2026): told, not let in.
  const closed = await closedOutsideAccount(user.id);
  if (closed) return away(closed === "RECRUITER" ? "closedRecruiter" : "closedExpert");

  // Two-step sign-in: the link was the first step; the code page is the second.
  const challenge = await twoFactorChallengeFor(user.id, "magic-link");
  if (challenge) {
    const step = NextResponse.redirect(new URL("/login/code", origin), 303);
    step.cookies.set(TWO_FACTOR_COOKIE, challenge, twoFactorCookieOptions());
    return step;
  }

  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);
  await createSession(user.id, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { via: "magic-link", role: context.role },
  });

  return NextResponse.redirect(new URL(context.redirectTo, origin), 303);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
