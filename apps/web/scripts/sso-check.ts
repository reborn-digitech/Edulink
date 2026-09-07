/**
 * The SSO live-credential walk.
 *
 *   npm run sso:check              — every configured provider
 *   npm run sso:check -- google    — one of them
 *
 * SSO is the one go-live item that cannot be finished by a script, because
 * the last step needs a human, a browser and a real account at the provider.
 * What this does is everything BEFORE that step, so the only thing left to
 * discover by hand is the thing that genuinely requires a hand:
 *
 *   - which providers are configured, half-configured, or deliberately off;
 *   - THE EXACT REDIRECT URI this installation will send, printed to be
 *     compared against the provider console — `redirect_uri_mismatch` is the
 *     single commonest way a correct SSO setup fails, and it fails at the
 *     provider, after the person has already typed their password;
 *   - that the provider's JWKS endpoint is reachable and its keys parse,
 *     which is what every sign-in depends on and nothing else checks;
 *   - for Apple, that the .p8 survived being pasted into an env file — a
 *     multi-line PEM through a shell is the most fragile value in this app,
 *     and a broken one is invisible until the first exchange;
 *   - and finally an authorize URL to open, which is the human half.
 *
 * No secret is printed. Client ids are printed: they ship to every browser.
 */
import { ssoStatus, SSO_REQUIRED_VARS } from "../src/lib/env";
import { SSO_PROVIDERS, appleClientSecret, ssoRedirectUri, type SsoProviderId } from "../src/lib/sso";

const JWKS_URLS: Record<SsoProviderId, () => string> = {
  google: () => "https://www.googleapis.com/oauth2/v3/certs",
  microsoft: () =>
    `https://login.microsoftonline.com/${process.env.SSO_MICROSOFT_TENANT?.trim() || "common"}/discovery/v2.0/keys`,
  apple: () => "https://appleid.apple.com/auth/keys",
};

/** Shapes each console hands out. Wrong-shaped means pasted from the wrong box. */
function idLooksRight(provider: SsoProviderId, id: string): string | null {
  if (provider === "google" && !id.endsWith(".apps.googleusercontent.com")) {
    return 'a Google client id normally ends ".apps.googleusercontent.com"';
  }
  if (provider === "microsoft" && !/^[0-9a-f-]{36}$/i.test(id)) {
    return "a Microsoft application (client) id is a 36-character GUID";
  }
  if (provider === "apple" && !id.includes(".")) {
    return "an Apple client id is the Services ID, in reverse-DNS form";
  }
  return null;
}

async function checkJwks(provider: SsoProviderId): Promise<{ ok: boolean; detail: string }> {
  const url = JWKS_URLS[provider]();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, detail: `${url} answered HTTP ${res.status}` };
    const body = (await res.json()) as { keys?: unknown[] };
    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      return { ok: false, detail: `${url} returned no keys` };
    }
    return { ok: true, detail: `${body.keys.length} signing key(s) from ${url}` };
  } catch (error) {
    const cause = (error as { cause?: { message?: string } }).cause;
    const detail = cause?.message ?? (error instanceof Error ? error.message : String(error));
    return { ok: false, detail: `could not reach ${url}: ${detail}` };
  }
}

function checkAppleSecret(): { ok: boolean; detail: string } {
  try {
    const jwt = appleClientSecret({
      clientId: process.env.SSO_APPLE_CLIENT_ID!.trim(),
      teamId: process.env.SSO_APPLE_TEAM_ID!.trim(),
      keyId: process.env.SSO_APPLE_KEY_ID!.trim(),
      privateKeyPem: process.env.SSO_APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    });
    // Decoded and shown so the operator can compare against the console. The
    // signature is not printed; the claims are not secret.
    const [h, p] = jwt.split(".");
    const header = JSON.parse(Buffer.from(h!, "base64url").toString()) as { kid?: string };
    const claims = JSON.parse(Buffer.from(p!, "base64url").toString()) as { iss?: string; sub?: string; aud?: string };
    return {
      ok: true,
      detail: `client secret minted — kid ${header.kid}, team (iss) ${claims.iss}, services id (sub) ${claims.sub}, aud ${claims.aud}`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: `could not mint the client secret from SSO_APPLE_PRIVATE_KEY: ${error instanceof Error ? error.message : String(error)}. A .p8 in an env file needs its newlines as literal \\n.`,
    };
  }
}

async function main() {
  const only = process.argv[2]?.trim().toLowerCase();
  if (only && !SSO_PROVIDERS.includes(only as SsoProviderId)) {
    console.error(`Unknown provider "${only}". One of: ${SSO_PROVIDERS.join(", ")}`);
    process.exit(2);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
  console.log(`Origin: ${appUrl}`);
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    console.log("  ⚠ NEXT_PUBLIC_APP_URL is not set, so that origin is a guess — and the redirect URIs below are guesses with it.");
  }
  console.log("");

  const statuses = ssoStatus();
  let configured = 0;
  let failed = 0;

  for (const provider of SSO_PROVIDERS) {
    if (only && provider !== only) continue;
    const status = statuses.find((s) => s.provider === provider)!;
    console.log(`── ${provider}`);

    if (status.state === "absent") {
      console.log(`   off — none of ${SSO_REQUIRED_VARS[provider].join(", ")} is set. Nothing to check.`);
      console.log("");
      continue;
    }
    if (status.state === "partial") {
      console.log(`   ✗ HALF-CONFIGURED: ${status.missing.join(", ")} missing. The button will not appear at all.`);
      failed++;
      console.log("");
      continue;
    }

    configured++;
    // The line worth comparing character by character against the console.
    // The SAME function the start and callback routes call, so this is not a
    // description of the redirect URI — it is the redirect URI.
    console.log(`   redirect URI: ${ssoRedirectUri(appUrl, provider)}`);
    console.log("      ^ this must be registered at the provider EXACTLY, including scheme and any trailing path.");

    const clientId = process.env[SSO_REQUIRED_VARS[provider][0]]!.trim();
    console.log(`   client id: ${clientId}`);
    const shape = idLooksRight(provider, clientId);
    if (shape) {
      console.log(`      ⚠ ${shape} — check it came from the right box.`);
    }

    if (provider === "apple") {
      const apple = checkAppleSecret();
      console.log(`   ${apple.ok ? "✓" : "✗"} ${apple.detail}`);
      if (!apple.ok) failed++;
    }

    const jwks = await checkJwks(provider);
    console.log(`   ${jwks.ok ? "✓" : "✗"} ${jwks.detail}`);
    if (!jwks.ok) failed++;

    console.log(`   open this to finish by hand:  ${appUrl}/api/sso/${provider}/start`);
    console.log("");
  }

  if (configured === 0 && failed === 0) {
    console.log("No SSO provider is configured. That is a valid installation — the login page simply shows no SSO buttons.");
    process.exit(0);
  }
  if (failed > 0) {
    console.error(`${failed} problem(s) above. Fix them before anybody tries to sign in.`);
    process.exit(1);
  }
  console.log("Configuration and provider keys check out.");
  console.log("THE LAST STEP NEEDS A PERSON: open the start URL above, sign in with a real account whose");
  console.log("VERIFIED email already exists on this installation, and confirm you land back signed in.");
  console.log("SSO signs people in and never signs them up — an unknown identity is refused by design.");
  process.exit(0);
}

main().catch((error) => {
  console.error("sso:check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
