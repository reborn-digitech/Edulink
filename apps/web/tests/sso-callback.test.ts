/**
 * THE SSO CALLBACK, END TO END IN THE LIBRARY (QA campaign of 24 October 2026, unit layer).
 *
 * tests/sso.test.ts holds the ID-token check with an injected key fetcher and the linking policy; `completeSso`,
 * the callback's whole job (the state cookie against the query, the code exchange with the PKCE verifier, the
 * token verified against the provider's published keys), had no test: src/lib/sso.ts lines 328–380 at 0 hits in
 * the campaign's coverage run. This drives it with `fetch` stubbed for the token endpoint and the keys endpoint and
 * a key pair of the test's own, with Google configured by a made-up client id that reaches no real provider.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { beginSso, completeSso, enabledProviders } from "@/lib/sso";

const CLIENT_ID = "zz-qa-client.apps.googleusercontent.com";
const REDIRECT = "http://localhost:3000/api/sso/google/callback";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...(publicKey.export({ format: "jwk" }) as Record<string, unknown>), kid: "zz-qa-key", alg: "RS256", use: "sig" };
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
function mint(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: "RS256", kid: "zz-qa-key" }): string {
  const h = b64(JSON.stringify(header));
  const p = b64(JSON.stringify(claims));
  return `${h}.${p}.${b64(cryptoSign("RSA-SHA256", Buffer.from(`${h}.${p}`), privateKey))}`;
}

type Call = { url: string; method: string; body: URLSearchParams | null };
let calls: Call[] = [];
let tokenAnswer: () => Response | Promise<Response>;
let jwksAnswer: () => Response | Promise<Response>;

/** A started sign-in: the cookie the browser carries and the state and nonce the provider echoes. */
function started() {
  const begun = beginSso("google", REDIRECT)!;
  const saved = JSON.parse(begun.cookieValue) as { p: string; s: string; n: string; v: string };
  return { cookie: begun.cookieValue, ...saved };
}
const claimsFor = (nonce: string, extra: Record<string, unknown> = {}) => ({
  iss: "https://accounts.google.com",
  aud: CLIENT_ID,
  sub: "zz-qa-google-sub-1",
  exp: Math.floor(Date.now() / 1000) + 300,
  nonce,
  email: "ZZ.QA.Person@Example.test",
  email_verified: true,
  name: " ZZ QA Person ",
  ...extra,
});

beforeEach(() => {
  calls = [];
  vi.stubEnv("SSO_GOOGLE_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("SSO_GOOGLE_CLIENT_SECRET", "zz-qa-client-secret");
  jwksAnswer = () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
  tokenAnswer = () => new Response("{}", { status: 200 });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? "GET", body: init.body instanceof URLSearchParams ? init.body : null });
    if (url === TOKEN_URL) return tokenAnswer();
    if (url === JWKS_URL) return jwksAnswer();
    throw new Error(`unexpected fetch ${url}`);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the state cookie is the proof the answer belongs to this browser", () => {
  it("a provider that is not configured answers 'state' and fetches nothing", async () => {
    vi.stubEnv("SSO_GOOGLE_CLIENT_SECRET", "");
    expect(enabledProviders()).not.toContain("google");
    expect(await completeSso("google", { code: "c", state: "s" }, JSON.stringify({ p: "google", s: "s", n: "n", v: "v" }), REDIRECT)).toEqual({ ok: false, reason: "state" });
    expect(calls).toHaveLength(0);
  });

  it("⚠ no cookie, a cookie that is not JSON, another provider's cookie, another state, or no code: 'state', before any exchange", async () => {
    const s = started();
    const cases: [Parameters<typeof completeSso>[1], string | null][] = [
      [{ code: "c", state: s.s }, null],
      [{ code: "c", state: s.s }, "not json"],
      [{ code: "c", state: s.s }, JSON.stringify({ ...JSON.parse(s.cookie), p: "microsoft" })],
      [{ code: "c", state: "another-state" }, s.cookie],
      [{ code: null, state: s.s }, s.cookie],
      [{ code: "c", state: null }, s.cookie],
      [{ code: "", state: s.s }, s.cookie],
    ];
    for (const [params, cookie] of cases) expect(await completeSso("google", params, cookie, REDIRECT)).toEqual({ ok: false, reason: "state" });
    expect(calls).toHaveLength(0);
  });
});

describe("the exchange", () => {
  it("posts the code with the redirect URI, the client's secret and the PKCE verifier from the cookie", async () => {
    const s = started();
    tokenAnswer = () => new Response(JSON.stringify({ id_token: mint(claimsFor(s.n)) }), { status: 200 });
    const result = await completeSso("google", { code: "zz-code-1", state: s.s }, s.cookie, REDIRECT);
    expect(result).toEqual({ ok: true, identity: { subject: "zz-qa-google-sub-1", email: "zz.qa.person@example.test", emailVerified: true, name: "ZZ QA Person" } });
    const exchange = calls.find((c) => c.url === TOKEN_URL)!;
    expect(exchange.method).toBe("POST");
    expect(Object.fromEntries(exchange.body!)).toEqual({ grant_type: "authorization_code", code: "zz-code-1", redirect_uri: REDIRECT, client_id: CLIENT_ID, client_secret: "zz-qa-client-secret", code_verifier: s.v });
  });

  it("an unreachable token endpoint, a refusal, a body that is not JSON, or no id_token: 'exchange'", async () => {
    const s = started();
    const answers: (() => Response | Promise<Response>)[] = [
      () => Promise.reject(new TypeError("fetch failed")),
      () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
      () => new Response("<html>oops</html>", { status: 200 }),
      () => new Response(JSON.stringify({ access_token: "only" }), { status: 200 }),
    ];
    for (const a of answers) {
      tokenAnswer = a;
      expect(await completeSso("google", { code: "c", state: s.s }, s.cookie, REDIRECT)).toEqual({ ok: false, reason: "exchange" });
    }
    expect(calls.some((c) => c.url === JWKS_URL)).toBe(false);
  });
});

describe("the token", () => {
  it("⚠ a token minted for another login (its nonce), for another client, unsigned, tampered, expired or with no subject: 'token'", async () => {
    const s = started();
    const good = mint(claimsFor(s.n));
    const [h, , sig] = good.split(".");
    const bad = [
      mint(claimsFor("another-login")),
      mint(claimsFor(s.n, { aud: "someone-else" })),
      mint(claimsFor(s.n, { iss: "https://accounts.google.com.evil.test" })),
      mint(claimsFor(s.n), { alg: "none", kid: "zz-qa-key" }),
      `${h}.${b64(JSON.stringify(claimsFor(s.n, { sub: "someone-else" })))}.${sig}`,
      mint(claimsFor(s.n, { exp: Math.floor(Date.now() / 1000) - 5 })),
      mint(claimsFor(s.n, { sub: "" })),
      mint(claimsFor(s.n, { sub: 42 })),
      "not.a-token",
    ];
    for (const idToken of bad) {
      tokenAnswer = () => new Response(JSON.stringify({ id_token: idToken }), { status: 200 });
      expect(await completeSso("google", { code: "c", state: s.s }, s.cookie, REDIRECT)).toEqual({ ok: false, reason: "token" });
    }
  });

  it("an unverified Google address comes back as unverified, for the linking policy to refuse", async () => {
    const s = started();
    tokenAnswer = () => new Response(JSON.stringify({ id_token: mint(claimsFor(s.n, { email_verified: false })) }), { status: 200 });
    const result = await completeSso("google", { code: "c", state: s.s }, s.cookie, REDIRECT);
    expect(result.ok && result.identity.emailVerified).toBe(false);
  });

  it("the provider's keys are fetched once and kept: a second sign-in reads no keys", async () => {
    for (let i = 0; i < 2; i++) {
      const s = started();
      tokenAnswer = () => new Response(JSON.stringify({ id_token: mint(claimsFor(s.n)) }), { status: 200 });
      expect((await completeSso("google", { code: "c", state: s.s }, s.cookie, REDIRECT)).ok).toBe(true);
    }
    // The cache is the module's and outlives a test: at most one keys read in this file.
    expect(calls.filter((c) => c.url === JWKS_URL).length).toBeLessThanOrEqual(1);
    expect(calls.filter((c) => c.url === TOKEN_URL)).toHaveLength(2);
  });
});

describe("Microsoft's issuer", () => {
  it("with the common tenant takes any tenant's issuer under login.microsoftonline.com/, and nothing that merely starts like it", async () => {
    vi.stubEnv("SSO_MICROSOFT_CLIENT_ID", "zz-qa-ms-client");
    vi.stubEnv("SSO_MICROSOFT_CLIENT_SECRET", "zz-qa-ms-secret");
    vi.stubEnv("SSO_MICROSOFT_TENANT", "");
    const msJwks = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
    const msToken = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    let idToken = "";
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === msJwks) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      if (url === msToken) return new Response(JSON.stringify({ id_token: idToken }), { status: 200 });
      throw new Error(`unexpected fetch ${url}`);
    });
    const begun = beginSso("microsoft", "http://localhost:3000/api/sso/microsoft/callback")!;
    const saved = JSON.parse(begun.cookieValue) as { s: string; n: string };
    const claims = (iss: string) => ({ iss, aud: "zz-qa-ms-client", sub: "zz-ms-sub", exp: Math.floor(Date.now() / 1000) + 300, nonce: saved.n, email: "zz@tenant.test", tid: "zz-tenant" });
    idToken = mint(claims("https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0"));
    const ok = await completeSso("microsoft", { code: "c", state: saved.s }, begun.cookieValue, "x");
    // Signed in, but the address is not vouched for without xms_edov or a listed tenant (tests/sso.test.ts).
    expect(ok).toMatchObject({ ok: true, identity: { subject: "zz-ms-sub", emailVerified: false } });
    idToken = mint(claims("https://login.microsoftonline.com.evil.test/v2.0"));
    expect(await completeSso("microsoft", { code: "c", state: saved.s }, begun.cookieValue, "x")).toEqual({ ok: false, reason: "token" });
  });
});

describe("an outage at the provider's keys", () => {
  // QA-28 (unit.md U-2): a keys endpoint that is down or refuses used to throw out of completeSso, so the callback
  // route answered 500; completeSso now answers "token" and the route sends the person to /login with "failed".
  it("answers 'token' rather than throw when the keys cannot be read", async () => {
    vi.stubEnv("SSO_MICROSOFT_CLIENT_ID", "zz-qa-ms-client");
    vi.stubEnv("SSO_MICROSOFT_CLIENT_SECRET", "zz-qa-ms-secret");
    vi.stubEnv("SSO_MICROSOFT_TENANT", "zz-qa-keys-down");
    const begun = beginSso("microsoft", "x")!;
    const saved = JSON.parse(begun.cookieValue) as { s: string; n: string };
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("/token")) return new Response(JSON.stringify({ id_token: mint({ iss: "https://login.microsoftonline.com/zz-qa-keys-down/v2.0", aud: "zz-qa-ms-client", sub: "s", exp: Math.floor(Date.now() / 1000) + 300, nonce: saved.n }) }), { status: 200 });
      return new Response("unavailable", { status: 503 });
    });
    expect(await completeSso("microsoft", { code: "c", state: saved.s }, begun.cookieValue, "x")).toEqual({ ok: false, reason: "token" });
  });
});
