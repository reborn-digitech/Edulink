import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { SocialError, SocialErrorCode } from "@edulink/contracts";

/**
 * META'S GRAPH API, THE FEW CALLS A SCHOOL'S POSTING NEEDS (meta-posting, 16 October 2026).
 *
 * NO SDK, like sso.ts and messaging.ts: Facebook Login's code exchange, the long-lived token, the Pages a person
 * manages, a Page post (text, or a photo uploaded as bytes), Instagram's two steps (a media container from a picture
 * Meta fetches by URL, then its publication), a permalink, and the token check the refresh job runs. Every call has
 * a timeout and carries `appsecret_proof` (HMAC-SHA256 of the token under the app secret), which Meta checks when the
 * app's "Require App Secret" switch is on, so a token lifted from a log or a row is worth nothing without the secret.
 *
 * TOKENS NEVER REACH A LOG OR AN ERROR. A failure is a code (SOCIAL_ERROR_CODES) with Meta's own message beside it,
 * which never contains the token; a fetch that throws is NETWORK, never its message (an undici error can carry the
 * URL, and a GET's URL carries the token).
 *
 * A PLATFORM WITHOUT META_APP_ID AND META_APP_SECRET HAS NO META: metaConfig() is null, the settings page says the
 * platform has not configured it and offers nothing, and the OAuth routes answer 404.
 */

export type MetaConfig = { appId: string; appSecret: string; graphBase: string; dialogBase: string };
export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

/** The permissions the school's admin is asked for, and that the Meta app must have through App Review. */
export const META_SCOPES = ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish", "business_management"] as const;

/** Meta's limits, kept well inside: a Page post's text, and an Instagram caption. */
export const FACEBOOK_TEXT_MAX = 60_000;
export const INSTAGRAM_CAPTION_MAX = 2_200;

const TIMEOUT_MS = 20_000;

/** The Meta app from the environment, or null when the platform has not configured one. */
export function metaConfig(env: Record<string, string | undefined> = process.env): MetaConfig | null {
  const appId = env.META_APP_ID?.trim();
  const appSecret = env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;
  const version = env.META_GRAPH_VERSION?.trim() || "v23.0";
  return { appId, appSecret, graphBase: `https://graph.facebook.com/${version}`, dialogBase: `https://www.facebook.com/${version}` };
}

/** The redirect URI, built in ONE place (sso.ts says why): byte-identical at the start, at the exchange, and in the Meta app's settings. */
export function metaRedirectUri(origin: string): string {
  return `${origin.trim().replace(/\/$/, "")}/api/social/meta/callback`;
}

/** The transient cookie that ties the callback to this browser, this school and this admin. */
export const META_STATE_COOKIE = "edulink.meta";
/** The long-lived user token, sealed, between the callback and the admin's choice of Page. */
export const META_PICK_COOKIE = "edulink.meta.pick";
/** Where the pick cookie is read: the settings page and its server actions, nowhere else. */
export const META_PICK_COOKIE_PATH = "/admin/settings/social";
export const META_COOKIE_MAX_AGE = 600;

export type MetaState = { s: string; school: string; u: string };

/** Facebook Login's dialog for this school's admin, and the cookie that proves the answer comes back to them. */
export function beginMetaLogin(cfg: MetaConfig, redirectUri: string, who: { schoolId: string; userId: string }): { authorizeUrl: string; cookieValue: string } {
  const state = randomBytes(24).toString("base64url");
  const url = new URL(`${cfg.dialogBase}/dialog/oauth`);
  url.searchParams.set("client_id", cfg.appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES.join(","));
  const saved: MetaState = { s: state, school: who.schoolId, u: who.userId };
  return { authorizeUrl: url.toString(), cookieValue: JSON.stringify(saved) };
}

/** The saved state, when the cookie holds one. */
export function readMetaState(cookieValue: string | null | undefined): MetaState | null {
  try {
    const saved = JSON.parse(cookieValue ?? "") as Partial<MetaState>;
    if (typeof saved.s !== "string" || typeof saved.school !== "string" || typeof saved.u !== "string") return null;
    return { s: saved.s, school: saved.school, u: saved.u };
  } catch {
    return null;
  }
}

export function appSecretProof(cfg: MetaConfig, token: string): string {
  return createHmac("sha256", cfg.appSecret).update(token).digest("hex");
}

export type GraphResult<T> = { ok: true; value: T } | { ok: false; error: SocialError };

const fail = (code: SocialErrorCode, detail: string | null = null): { ok: false; error: SocialError } => ({ ok: false, error: { code, detail } });

/**
 * Meta's error as ours. 190 (and its OAuth cousins) is a token that no longer works; 10 and 200-299 a permission
 * the Page or the app lacks; 324, 9004 and Instagram's 2207xxx subcodes a picture Meta could not fetch or take.
 */
export function graphError(status: number, body: unknown): SocialError {
  const e = (body as { error?: { message?: unknown; code?: unknown; error_subcode?: unknown; type?: unknown } } | null)?.error;
  const message = typeof e?.message === "string" ? e.message.slice(0, 280) : null;
  const code = typeof e?.code === "number" ? e.code : null;
  const sub = typeof e?.error_subcode === "number" ? e.error_subcode : null;
  if (code === 190 || code === 102 || code === 463 || code === 467 || (status === 401 && e?.type === "OAuthException")) return { code: "RECONNECT", detail: message };
  if (code === 10 || (code !== null && code >= 200 && code <= 299)) return { code: "PERMISSION", detail: message };
  if (code === 324 || code === 9004 || code === 36003 || (sub !== null && sub >= 2207000 && sub < 2208000)) return { code: "MEDIA", detail: message };
  return { code: "META", detail: message ?? `HTTP ${status}` };
}

async function call<T>(f: FetchImpl, url: string, init: RequestInit): Promise<GraphResult<T>> {
  let response: Response;
  try {
    response = await f(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return fail("NETWORK");
  }
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok || (body && typeof body === "object" && "error" in body)) return { ok: false, error: graphError(response.status, body) };
  return { ok: true, value: body as T };
}

function get<T>(cfg: MetaConfig, f: FetchImpl, path: string, params: Record<string, string>, token?: string): Promise<GraphResult<T>> {
  const url = new URL(`${cfg.graphBase}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (token) {
    url.searchParams.set("access_token", token);
    url.searchParams.set("appsecret_proof", appSecretProof(cfg, token));
  }
  return call<T>(f, url.toString(), { method: "GET", headers: { accept: "application/json" } });
}

function post<T>(cfg: MetaConfig, f: FetchImpl, path: string, params: Record<string, string>, token: string): Promise<GraphResult<T>> {
  const body = new URLSearchParams({ ...params, access_token: token, appsecret_proof: appSecretProof(cfg, token) });
  return call<T>(f, `${cfg.graphBase}${path}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body });
}

/* -------------------------------------------------------------------------- */
/* Facebook Login                                                              */
/* -------------------------------------------------------------------------- */

/** The code for a short-lived user token, then that for a long-lived one (about sixty days). */
export async function exchangeForLongLivedToken(cfg: MetaConfig, code: string, redirectUri: string, f: FetchImpl = fetch, now = Date.now()): Promise<GraphResult<{ token: string; expiresAt: Date | null }>> {
  const short = await get<{ access_token?: string }>(cfg, f, "/oauth/access_token", { client_id: cfg.appId, client_secret: cfg.appSecret, redirect_uri: redirectUri, code });
  if (!short.ok) return short;
  if (!short.value.access_token) return fail("META", "no access token");
  const long = await get<{ access_token?: string; expires_in?: number }>(cfg, f, "/oauth/access_token", { grant_type: "fb_exchange_token", client_id: cfg.appId, client_secret: cfg.appSecret, fb_exchange_token: short.value.access_token });
  if (!long.ok) return long;
  if (!long.value.access_token) return fail("META", "no long-lived token");
  const expiresAt = typeof long.value.expires_in === "number" && long.value.expires_in > 0 ? new Date(now + long.value.expires_in * 1000) : null;
  return { ok: true, value: { token: long.value.access_token, expiresAt } };
}

export type MetaPage = { id: string; name: string; accessToken: string; igUserId: string | null; igUsername: string | null };

/**
 * The Pages this person manages, each with its own Page token (which, taken from a long-lived user token, does not
 * expire) and the Instagram professional account linked to it, if any.
 */
export async function listPages(cfg: MetaConfig, userToken: string, f: FetchImpl = fetch): Promise<GraphResult<MetaPage[]>> {
  type Raw = { data?: { id?: string; name?: string; access_token?: string; instagram_business_account?: { id?: string; username?: string } }[] };
  const listed = await get<Raw>(cfg, f, "/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "100" }, userToken);
  if (!listed.ok) return listed;
  const pages: MetaPage[] = [];
  for (const p of listed.value.data ?? []) {
    if (!p.id || !p.access_token) continue;
    pages.push({ id: p.id, name: (p.name ?? p.id).slice(0, 200), accessToken: p.access_token, igUserId: p.instagram_business_account?.id ?? null, igUsername: p.instagram_business_account?.username ?? null });
  }
  return { ok: true, value: pages };
}

/* -------------------------------------------------------------------------- */
/* Posting                                                                     */
/* -------------------------------------------------------------------------- */

/** A text post on the Page, with a link when there is one. Answers the post's id. */
export async function publishFeed(cfg: MetaConfig, pageId: string, token: string, input: { message: string; link: string | null }, f: FetchImpl = fetch): Promise<GraphResult<{ id: string }>> {
  const r = await post<{ id?: string }>(cfg, f, `/${encodeURIComponent(pageId)}/feed`, { message: input.message, ...(input.link ? { link: input.link } : {}) }, token);
  if (!r.ok) return r;
  return r.value.id ? { ok: true, value: { id: r.value.id } } : fail("META", "no post id");
}

/** A photo post on the Page, the picture's bytes uploaded with it (no public link needed). Answers the Page post's id. */
export async function publishPhoto(cfg: MetaConfig, pageId: string, token: string, input: { bytes: Buffer; mime: string; caption: string }, f: FetchImpl = fetch): Promise<GraphResult<{ id: string }>> {
  const form = new FormData();
  form.set("caption", input.caption);
  form.set("access_token", token);
  form.set("appsecret_proof", appSecretProof(cfg, token));
  form.set("source", new Blob([new Uint8Array(input.bytes)], { type: input.mime }), "picture");
  const r = await call<{ id?: string; post_id?: string }>(f, `${cfg.graphBase}/${encodeURIComponent(pageId)}/photos`, { method: "POST", headers: { accept: "application/json" }, body: form });
  if (!r.ok) return r;
  const id = r.value.post_id ?? r.value.id;
  return id ? { ok: true, value: { id } } : fail("META", "no photo id");
}

/** Instagram's first step: a media container from a JPEG Meta fetches by URL. Answers the container's id. */
export async function igCreateMedia(cfg: MetaConfig, igUserId: string, token: string, input: { imageUrl: string; caption: string }, f: FetchImpl = fetch): Promise<GraphResult<{ id: string }>> {
  const r = await post<{ id?: string }>(cfg, f, `/${encodeURIComponent(igUserId)}/media`, { image_url: input.imageUrl, caption: input.caption }, token);
  if (!r.ok) return r;
  return r.value.id ? { ok: true, value: { id: r.value.id } } : fail("META", "no container id");
}

/** Instagram's second step: publish the container. Answers the media's id. */
export async function igPublish(cfg: MetaConfig, igUserId: string, token: string, creationId: string, f: FetchImpl = fetch): Promise<GraphResult<{ id: string }>> {
  const r = await post<{ id?: string }>(cfg, f, `/${encodeURIComponent(igUserId)}/media_publish`, { creation_id: creationId }, token);
  if (!r.ok) return r;
  return r.value.id ? { ok: true, value: { id: r.value.id } } : fail("META", "no media id");
}

/** Where a Page post or an Instagram media can be seen; null when Meta does not say (the post went out regardless). */
export async function permalinkOf(cfg: MetaConfig, objectId: string, token: string, network: "FACEBOOK" | "INSTAGRAM", f: FetchImpl = fetch): Promise<string | null> {
  const field = network === "FACEBOOK" ? "permalink_url" : "permalink";
  const r = await get<Record<string, unknown>>(cfg, f, `/${encodeURIComponent(objectId)}`, { fields: field }, token);
  if (!r.ok) return null;
  const value = r.value[field];
  return typeof value === "string" && /^https:\/\//.test(value) ? value.slice(0, 500) : null;
}

/** The refresh job's check: does the Page token still answer GET /me? */
export async function checkPageToken(cfg: MetaConfig, token: string, f: FetchImpl = fetch): Promise<GraphResult<{ id: string }>> {
  const r = await get<{ id?: string }>(cfg, f, "/me", { fields: "id" }, token);
  if (!r.ok) return r;
  return r.value.id ? { ok: true, value: { id: r.value.id } } : fail("RECONNECT", null);
}

/** Text cut to Meta's limit at a word where it can be, with an ellipsis. */
export function trimTo(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.8 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
