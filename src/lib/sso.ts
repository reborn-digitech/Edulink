import "server-only";
import { createHash, createPublicKey, createPrivateKey, randomBytes, sign as cryptoSign, verify as cryptoVerify, type KeyObject } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";

/**
 * Single sign-on: Google, Microsoft and Apple, as plain OIDC authorization-
 * code + PKCE, implemented directly on `fetch` and `node:crypto`.
 *
 * NO SDK, DELIBERATELY. The three flows differ in a handful of parameters and
 * one signature algorithm; a client library would bring a dependency tree and
 * its own session machinery into the one file of this app where trust matters
 * most. Everything here is the standard, readable in order: build the
 * authorize URL, exchange the code, verify the ID token against the
 * provider's published keys, then hand the verified identity to the linking
 * policy below.
 *
 * SSO SIGNS PEOPLE IN; IT NEVER SIGNS THEM UP. See SsoIdentity in the schema:
 * an identity that matches no existing account is refused with directions.
 * The subject is the key and the email is only the introduction — first
 * sign-in links by VERIFIED email, every later one matches (provider, sub).
 *
 * A PROVIDER EXISTS ONLY WHEN ITS ENV VARS DO. With nothing configured the
 * login page shows no buttons and the routes answer 404 — the feature is
 * invisible rather than half-working.
 */

export type SsoProviderId = "google" | "microsoft" | "apple";
export const SSO_PROVIDERS: SsoProviderId[] = ["google", "microsoft", "apple"];

export const SSO_COOKIE = "edulink.sso";
/** Ten minutes to come back from the provider — generous, then gone. */
export const SSO_COOKIE_MAX_AGE = 600;

type ProviderConfig = {
  id: SsoProviderId;
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  jwksUrl: string;
  /** Exact issuer, or a prefix when the provider mints per-tenant issuers. */
  issuer: { exact?: string; prefix?: string };
  scope: string;
  /** Apple posts the code cross-site instead of redirecting with a query. */
  usesFormPost: boolean;
  clientSecret: () => string;
};

function appleSecretFromEnv(): string {
  return appleClientSecret({
    clientId: process.env.SSO_APPLE_CLIENT_ID!.trim(),
    teamId: process.env.SSO_APPLE_TEAM_ID!.trim(),
    keyId: process.env.SSO_APPLE_KEY_ID!.trim(),
    // A .p8 pasted into an env file arrives with literal \n.
    privateKeyPem: process.env.SSO_APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });
}

function providerConfig(id: SsoProviderId): ProviderConfig | null {
  if (id === "google") {
    const clientId = process.env.SSO_GOOGLE_CLIENT_ID?.trim();
    const secret = process.env.SSO_GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !secret) return null;
    return {
      id,
      clientId,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: { exact: "https://accounts.google.com" },
      scope: "openid email profile",
      usesFormPost: false,
      clientSecret: () => secret,
    };
  }
  if (id === "microsoft") {
    const clientId = process.env.SSO_MICROSOFT_CLIENT_ID?.trim();
    const secret = process.env.SSO_MICROSOFT_CLIENT_SECRET?.trim();
    if (!clientId || !secret) return null;
    const tenant = process.env.SSO_MICROSOFT_TENANT?.trim() || "common";
    return {
      id,
      clientId,
      authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      jwksUrl: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
      // "common" mints one issuer per home tenant; a fixed tenant is exact.
      issuer:
        tenant === "common" || tenant === "organizations" || tenant === "consumers"
          ? { prefix: "https://login.microsoftonline.com/" }
          : { exact: `https://login.microsoftonline.com/${tenant}/v2.0` },
      scope: "openid email profile",
      usesFormPost: false,
      clientSecret: () => secret,
    };
  }
  const clientId = process.env.SSO_APPLE_CLIENT_ID?.trim();
  if (
    !clientId ||
    !process.env.SSO_APPLE_TEAM_ID?.trim() ||
    !process.env.SSO_APPLE_KEY_ID?.trim() ||
    !process.env.SSO_APPLE_PRIVATE_KEY?.trim()
  ) {
    return null;
  }
  return {
    id: "apple",
    clientId,
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    jwksUrl: "https://appleid.apple.com/auth/keys",
    issuer: { exact: "https://appleid.apple.com" },
    scope: "name email",
    usesFormPost: true,
    clientSecret: appleSecretFromEnv,
  };
}

/** The providers whose env vars are actually present — what the login page shows. */
export function enabledProviders(): SsoProviderId[] {
  return SSO_PROVIDERS.filter((id) => providerConfig(id) !== null);
}

/* -------------------------------------------------------------------------- */
/* Starting the dance                                                          */
/* -------------------------------------------------------------------------- */

const b64url = (buf: Buffer) => buf.toString("base64url");

export type SsoBegin = {
  authorizeUrl: string;
  /** JSON for the transient cookie: proof the callback belongs to this browser. */
  cookieValue: string;
};

export function beginSso(id: SsoProviderId, redirectUri: string): SsoBegin | null {
  const cfg = providerConfig(id);
  if (!cfg) return null;

  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (cfg.usesFormPost) url.searchParams.set("response_mode", "form_post");

  return {
    authorizeUrl: url.toString(),
    cookieValue: JSON.stringify({ p: id, s: state, n: nonce, v: verifier }),
  };
}

/* -------------------------------------------------------------------------- */
/* Verifying what came back                                                    */
/* -------------------------------------------------------------------------- */

export type SsoIdentityClaims = {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export type CallbackResult =
  | { ok: true; identity: SsoIdentityClaims }
  | { ok: false; reason: "state" | "exchange" | "token" };

type Jwk = { kid?: string; kty: string; [key: string]: unknown };
type JwksFetcher = (url: string) => Promise<{ keys: Jwk[] }>;

/** Provider keys, cached briefly — every login must not refetch them. */
const jwksCache = new Map<string, { at: number; keys: Jwk[] }>();
const JWKS_TTL_MS = 10 * 60 * 1000;

async function fetchJwks(url: string): Promise<{ keys: Jwk[] }> {
  const hit = jwksCache.get(url);
  if (hit && Date.now() - hit.at < JWKS_TTL_MS) return { keys: hit.keys };
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`JWKS ${url} answered ${response.status}`);
  const body = (await response.json()) as { keys: Jwk[] };
  jwksCache.set(url, { at: Date.now(), keys: body.keys });
  return body;
}

/**
 * Verify an RS256 ID token against the provider's published keys, then check
 * the claims that make it THIS app's token for THIS login: issuer, audience,
 * expiry, nonce. Exported with an injectable JWKS fetcher so the test suite
 * can hold the whole verification path with its own keys.
 */
export async function verifyIdToken(
  idToken: string,
  opts: {
    jwksUrl: string;
    issuer: { exact?: string; prefix?: string };
    audience: string;
    nonce: string;
    fetchKeys?: JwksFetcher;
  },
): Promise<Record<string, unknown> | null> {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  const [headerRaw, payloadRaw, signatureRaw] = parts as [string, string, string];

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(headerRaw, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadRaw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  // All three providers sign RS256. Anything else — especially "none" — is
  // refused outright rather than negotiated with.
  if (header.alg !== "RS256") return null;

  const { keys } = await (opts.fetchKeys ?? fetchJwks)(opts.jwksUrl);
  const jwk = keys.find((k) => k.kid === header.kid) ?? (keys.length === 1 ? keys[0] : undefined);
  if (!jwk) return null;

  let publicKey: KeyObject;
  try {
    publicKey = createPublicKey({ key: jwk as never, format: "jwk" });
  } catch {
    return null;
  }
  const signed = Buffer.from(`${headerRaw}.${payloadRaw}`);
  const signature = Buffer.from(signatureRaw, "base64url");
  if (!cryptoVerify("RSA-SHA256", signed, publicKey, signature)) return null;

  const iss = typeof payload.iss === "string" ? payload.iss : "";
  if (opts.issuer.exact && iss !== opts.issuer.exact) return null;
  if (opts.issuer.prefix && !iss.startsWith(opts.issuer.prefix)) return null;

  const aud = payload.aud;
  const audOk = Array.isArray(aud) ? aud.includes(opts.audience) : aud === opts.audience;
  if (!audOk) return null;

  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp * 1000 < Date.now()) return null;

  if (payload.nonce !== opts.nonce) return null;

  return payload;
}

function claimsToIdentity(id: SsoProviderId, claims: Record<string, unknown>): SsoIdentityClaims {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const email = str(claims.email)?.toLowerCase() ?? null;

  // What "verified" means differs per provider, and the linking policy trusts
  // only verified addresses:
  //   Google  — email_verified, a real boolean.
  //   Apple   — verified by construction (and relay addresses still route).
  //   Microsoft — the email claim on a v2 token comes from the account's own
  //     identity; there is no separate verified flag to read.
  const emailVerified =
    id === "google"
      ? claims.email_verified === true
      : id === "apple"
        ? claims.email_verified === true || claims.email_verified === "true" || email !== null
        : email !== null;

  return {
    subject: String(claims.sub ?? ""),
    email,
    emailVerified: emailVerified && email !== null,
    name: str(claims.name),
  };
}

/**
 * The callback's whole job: state must match the cookie, the code must
 * exchange, and the ID token must verify. Anything less is a reason, not an
 * identity.
 */
export async function completeSso(
  id: SsoProviderId,
  params: { code: string | null; state: string | null },
  cookieValue: string | null,
  redirectUri: string,
): Promise<CallbackResult> {
  const cfg = providerConfig(id);
  if (!cfg) return { ok: false, reason: "state" };

  let saved: { p: string; s: string; n: string; v: string };
  try {
    saved = JSON.parse(cookieValue ?? "");
  } catch {
    return { ok: false, reason: "state" };
  }
  if (!params.code || !params.state || saved.p !== id || saved.s !== params.state) {
    return { ok: false, reason: "state" };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret(),
    code_verifier: saved.v,
  });
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return { ok: false, reason: "exchange" };
  }
  if (!tokenResponse.ok) return { ok: false, reason: "exchange" };
  const tokens = (await tokenResponse.json().catch(() => null)) as { id_token?: string } | null;
  if (!tokens?.id_token) return { ok: false, reason: "exchange" };

  const claims = await verifyIdToken(tokens.id_token, {
    jwksUrl: cfg.jwksUrl,
    issuer: cfg.issuer,
    audience: cfg.clientId,
    nonce: saved.n,
  });
  if (!claims || typeof claims.sub !== "string" || !claims.sub) {
    return { ok: false, reason: "token" };
  }

  return { ok: true, identity: claimsToIdentity(id, claims) };
}

/* -------------------------------------------------------------------------- */
/* The linking policy                                                          */
/* -------------------------------------------------------------------------- */

export type SignInResult =
  | { ok: true; userId: string; linked: boolean }
  | { ok: false; reason: "no-account" | "disabled" };

/**
 * Turn a verified external identity into an EduLink user, or refuse.
 *
 *   1. (provider, sub) already linked  -> that user, always — email may have
 *      changed at the provider and must not matter.
 *   2. Unlinked, but a VERIFIED email matches an existing account -> link now
 *      (audited) and sign in.
 *   3. Anything else -> no-account. SSO never creates users; accounts come
 *      from invites, join codes and registration, where a school vouches for
 *      the person.
 *
 * Disabled and merged-away accounts refuse exactly as password login does —
 * a Google button must not be a side door past a suspension.
 */
export async function signInWithSso(
  id: SsoProviderId,
  identity: SsoIdentityClaims,
): Promise<SignInResult> {
  const existing = await db.ssoIdentity.findUnique({
    where: { provider_subject: { provider: id, subject: identity.subject } },
    select: { id: true, userId: true, user: { select: { disabledAt: true, mergedIntoUserId: true } } },
  });

  if (existing) {
    if (existing.user.disabledAt || existing.user.mergedIntoUserId) {
      return { ok: false, reason: "disabled" };
    }
    await db.ssoIdentity.update({
      where: { id: existing.id },
      data: { lastUsedAt: new Date(), email: identity.email },
    });
    return { ok: true, userId: existing.userId, linked: false };
  }

  if (!identity.emailVerified || !identity.email) {
    return { ok: false, reason: "no-account" };
  }

  const user = await db.user.findUnique({
    where: { email: identity.email },
    select: { id: true, disabledAt: true, mergedIntoUserId: true },
  });
  if (!user) return { ok: false, reason: "no-account" };
  if (user.disabledAt || user.mergedIntoUserId) return { ok: false, reason: "disabled" };

  await db.ssoIdentity.create({
    data: { userId: user.id, provider: id, subject: identity.subject, email: identity.email },
  });
  await audit({
    schoolId: null,
    actorUserId: user.id,
    action: "auth.ssoLink",
    targetType: "User",
    targetId: user.id,
    meta: { provider: id },
  });

  return { ok: true, userId: user.id, linked: true };
}

/* -------------------------------------------------------------------------- */
/* Apple's client secret                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Apple's "client secret" is not a string from a dashboard but a short-lived
 * ES256 JWT the app signs itself with the downloaded .p8 key. Minted fresh
 * per exchange; Apple allows up to six months of validity, this uses five
 * minutes because there is no reason to hold a longer one in memory.
 */
export function appleClientSecret(input: {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKeyPem: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: "ES256", kid: input.keyId })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        iss: input.teamId,
        iat: now,
        exp: now + 300,
        aud: "https://appleid.apple.com",
        sub: input.clientId,
      }),
    ),
  );
  const signingInput = Buffer.from(`${header}.${payload}`);
  const key = createPrivateKey(input.privateKeyPem);
  // JOSE wants the raw r||s form, not ASN.1 — `ieee-p1363` is that.
  const signature = cryptoSign("sha256", signingInput, { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${b64url(signature)}`;
}
