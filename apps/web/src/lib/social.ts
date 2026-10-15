import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import type { SocialError, SocialErrorCode, SocialNetwork, SocialPostOut, SocialView } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { open, seal, sealingAvailable } from "./secret-box";
import { forSchool } from "./tenant-context";
import { readJsonArray, type MediaItem } from "./json";
import { readStoredFile } from "./storage";
import { appUrl, publishedSiteFor } from "./site-publish";
import { siteHostFor } from "./site-hosts";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";
import {
  FACEBOOK_TEXT_MAX,
  INSTAGRAM_CAPTION_MAX,
  checkPageToken,
  exchangeForLongLivedToken,
  igCreateMedia,
  igPublish,
  listPages,
  metaConfig,
  permalinkOf,
  publishFeed,
  publishPhoto,
  trimTo,
  type FetchImpl,
  type GraphResult,
  type MetaConfig,
  type MetaPage,
} from "./social-meta";

/**
 * A SCHOOL POSTS TO ITS FACEBOOK PAGE AND INSTAGRAM ACCOUNT (meta-posting, the owner's ask of 15 October 2026).
 * The one writer of SocialConnection and SocialPost.
 *
 *   Connect      the school's ADMIN, once, at /admin/settings/social: Facebook Login (the routes under
 *                /api/social/meta), a long-lived user token sealed into a ten-minute cookie, then one Page chosen;
 *                its Page token is sealed (secret-box, bound to the school) into SocialConnection with the Instagram
 *                professional account linked to it, if any. Disconnect deletes the row. Both audited.
 *   Compose      a SCHOOL-wide post by the ADMIN (never a CLASS post, never a staff-only notice) may tick "Also post
 *                to Facebook" and "Also post to Instagram"; the copy leaves the platform and Meta's terms apply, and
 *                a post with pictures needs the admin's tick that the people shown consented to publication (policy
 *                0002). Instagram needs a picture. Publishing queues one SocialPost per network.
 *   Send         the job social:send, every minute: Facebook is a photo post (the first picture uploaded as bytes)
 *                or a text post with a link to the school's website when it is live; Instagram is a container from
 *                the first picture, fetched by Meta through a short-lived public link (kind "social" in files.ts),
 *                then its publication. Three attempts an hour apart, then FAILED; Retry queues it again.
 *   Upkeep       the job social:refresh, daily, checks each Page token and marks the connection "reconnect" when
 *                Meta says it no longer works; the settings page and the composer say so.
 *
 * Deleting or taking down a post here does not delete its copy on Meta: the status line says so, and the
 * SocialPost row is kept with no foreign key to the post for that reason.
 */

export const SOCIAL_MAX_ATTEMPTS = 3;
const RETRY_AFTER_MS = 60 * 60 * 1000;
/** How long after SENT Meta may still fetch the picture (it fetches at once; the window is slack, not a feature). */
export const SOCIAL_PICTURE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Failures no wait will mend: the admin must act (reconnect, link Instagram) or there is nothing to send. */
const PERMANENT: readonly SocialErrorCode[] = ["RECONNECT", "NOT_CONNECTED", "NO_INSTAGRAM", "NO_PICTURE", "POST_GONE", "PERMISSION"];

const tokenBinding = (schoolId: string) => `social:${schoolId}:page-token`;
const pickBinding = (schoolId: string, userId: string) => `social:${schoolId}:${userId}:pick`;

function office(ctx: ActiveContext): { schoolId: string; userId: string } {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("social.refuseRole");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}

function readError(raw: string | null): SocialError | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SocialError>;
    return typeof parsed.code === "string" ? { code: parsed.code as SocialErrorCode, detail: typeof parsed.detail === "string" ? parsed.detail : null } : null;
  } catch {
    return null;
  }
}
const writeError = (e: SocialError) => JSON.stringify({ code: e.code, detail: e.detail ? e.detail.slice(0, 280) : null });

/* -------------------------------------------------------------------------- */
/* The connection                                                              */
/* -------------------------------------------------------------------------- */

const CONNECTION = { provider: true, pageId: true, pageName: true, igUserId: true, igUsername: true, connectedAt: true, lastCheckedAt: true, tokenExpiresAt: true, error: true } as const;

/** The settings page's and GET /api/v1/admin/social's answer. */
export async function socialView(ctx: ActiveContext): Promise<SocialView> {
  const me = office(ctx);
  const row = await db.socialConnection.findFirst({ where: { schoolId: me.schoolId }, select: CONNECTION });
  return {
    configured: metaConfig() !== null,
    sealing: sealingAvailable(),
    connection: row
      ? {
          provider: "META",
          pageId: row.pageId,
          pageName: row.pageName,
          igUserId: row.igUserId,
          igUsername: row.igUsername,
          connectedAt: row.connectedAt.toISOString(),
          lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
          tokenExpiresAt: row.tokenExpiresAt?.toISOString() ?? null,
          needsReconnect: row.error === "RECONNECT",
        }
      : null,
  };
}

export type CallbackOutcome = { ok: true; pickCookie: string } | { ok: false; reason: "state" | "exchange" | "nopages" | "sealing" | "role" };

/**
 * The callback's work after the state check (the route checks the cookie against the session): the code for a
 * long-lived user token, the Pages it manages (at least one, or there is nothing to pick), and the token sealed
 * for the pick cookie, bound to this school and this admin.
 */
export async function completeMetaLogin(ctx: ActiveContext, code: string, redirectUri: string, f: FetchImpl = fetch, now = Date.now()): Promise<CallbackOutcome> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) return { ok: false, reason: "role" };
  const cfg = metaConfig();
  if (!cfg) return { ok: false, reason: "state" };
  if (!sealingAvailable()) return { ok: false, reason: "sealing" };
  const token = await exchangeForLongLivedToken(cfg, code, redirectUri, f, now);
  if (!token.ok) return { ok: false, reason: "exchange" };
  const pages = await listPages(cfg, token.value.token, f);
  if (!pages.ok) return { ok: false, reason: "exchange" };
  if (pages.value.length === 0) return { ok: false, reason: "nopages" };
  const pick = JSON.stringify({ t: token.value.token, e: token.value.expiresAt?.toISOString() ?? null });
  return { ok: true, pickCookie: seal(pick, pickBinding(ctx.schoolId, ctx.user.id)) };
}

function openPick(ctx: { schoolId: string; userId: string }, sealed: string | null | undefined): { token: string; expiresAt: Date | null } | null {
  if (!sealed) return null;
  try {
    const parsed = JSON.parse(open(sealed, pickBinding(ctx.schoolId, ctx.userId))) as { t?: string; e?: string | null };
    if (!parsed.t) return null;
    return { token: parsed.t, expiresAt: parsed.e ? new Date(parsed.e) : null };
  } catch {
    return null;
  }
}

export type PagePick = { id: string; name: string; igUsername: string | null };

/** The Pages to choose from, read again from Meta with the token in the pick cookie; null when the cookie is gone or stale. */
export async function pagesToPick(ctx: ActiveContext, pickCookie: string | null | undefined, f: FetchImpl = fetch): Promise<GraphResult<PagePick[]> | null> {
  const me = office(ctx);
  const cfg = metaConfig();
  const pick = openPick(me, pickCookie);
  if (!cfg || !pick) return null;
  const pages = await listPages(cfg, pick.token, f);
  if (!pages.ok) return pages;
  return { ok: true, value: pages.value.map((p) => ({ id: p.id, name: p.name, igUsername: p.igUsername })) };
}

/** Choose a Page: its token sealed into the school's connection (replacing any), audited. */
export async function connectPage(ctx: ActiveContext, pickCookie: string | null | undefined, pageId: string, f: FetchImpl = fetch): Promise<SocialView> {
  const me = office(ctx);
  const cfg = metaConfig();
  if (!cfg) throw new AccessError("social.refuseNotConfigured");
  if (!sealingAvailable()) throw new AccessError("social.refuseSealing");
  const pick = openPick(me, pickCookie);
  if (!pick) throw new AccessError("social.refusePickExpired");
  const pages = await listPages(cfg, pick.token, f);
  if (!pages.ok) throw new AccessError("social.refuseMeta");
  const page: MetaPage | undefined = pages.value.find((p) => p.id === pageId);
  if (!page) throw new AccessError("social.refusePickExpired");
  const data = {
    provider: "META",
    pageId: page.id,
    pageName: page.name,
    igUserId: page.igUserId,
    igUsername: page.igUsername,
    pageTokenSealed: seal(page.accessToken, tokenBinding(me.schoolId)),
    // A Page token taken from a long-lived user token does not expire; the user token's date is kept for the record.
    tokenExpiresAt: pick.expiresAt,
    connectedByUserId: me.userId,
    connectedAt: new Date(),
    lastCheckedAt: new Date(),
    error: null,
  };
  await db.socialConnection.upsert({ where: { schoolId: me.schoolId }, create: { schoolId: me.schoolId, ...data }, update: data });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "social.connect", targetType: "SocialConnection", targetId: page.id, meta: { pageId: page.id, pageName: page.name, instagram: page.igUsername } });
  return socialView(ctx);
}

/**
 * Disconnect (DELETE /api/v1/admin/social): the row goes; what was already posted on Meta stays there. Audited. The
 * Page the screen shows is named, so a stale screen (another Page connected since) disconnects nothing.
 */
export async function disconnectSocial(ctx: ActiveContext, pageId: string): Promise<{ disconnected: boolean }> {
  const me = office(ctx);
  const row = await db.socialConnection.findFirst({ where: { schoolId: me.schoolId }, select: { id: true, pageId: true, pageName: true } });
  if (!row) return { disconnected: false };
  if (row.pageId !== pageId) throw new RuleRefusal("social.refuseStale", 409);
  await db.socialConnection.deleteMany({ where: { id: row.id, schoolId: me.schoolId } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "social.disconnect", targetType: "SocialConnection", targetId: row.pageId, meta: { pageId: row.pageId, pageName: row.pageName } });
  return { disconnected: true };
}

/* -------------------------------------------------------------------------- */
/* The composer                                                                */
/* -------------------------------------------------------------------------- */

export type ComposerSocial = { pageName: string; igUsername: string | null; instagram: boolean; needsReconnect: boolean };

/** What the composer offers this person: nothing unless an ADMIN, Meta configured and a connection. */
export async function composerSocial(ctx: ActiveContext): Promise<ComposerSocial | null> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId || !metaConfig()) return null;
  const row = await db.socialConnection.findFirst({ where: { schoolId: ctx.schoolId }, select: { pageName: true, igUserId: true, igUsername: true, error: true } });
  if (!row) return null;
  return { pageName: row.pageName, igUsername: row.igUsername, instagram: row.igUserId !== null, needsReconnect: row.error === "RECONNECT" };
}

export type SocialAsk = { facebook: boolean; instagram: boolean; consent: boolean };

/**
 * Whether a post may go out as asked, checked BEFORE the post or its pictures are stored, so a refused copy never
 * leaves a post behind that the admin thought would also go to Meta. Answers the refusal's key, or null.
 */
export async function checkSocialAsk(ctx: ActiveContext, ask: SocialAsk, post: { scope: string; audience: string; media: { kind: "image" | "video" }[] }): Promise<TranslationKey | null> {
  if (!ask.facebook && !ask.instagram) return null;
  if (ctx.role !== "ADMIN" || !ctx.schoolId) return "social.refuseRole";
  if (post.scope !== "SCHOOL" || post.audience === "TEACHERS") return "social.refuseScope";
  const offer = await composerSocial(ctx);
  if (!offer) return "social.refuseNotConnected";
  if (offer.needsReconnect) return "social.refuseReconnect";
  if (ask.instagram && !offer.instagram) return "social.refuseNoInstagram";
  if (ask.instagram && !post.media.some((m) => m.kind === "image")) return "social.refuseNoPicture";
  if (post.media.length > 0 && !ask.consent) return "social.refuseConsent";
  return null;
}

function firstImage(media: string): string | null {
  return readJsonArray<MediaItem>(media).find((m) => m && m.kind === "image" && typeof m.fileId === "string" && m.fileId.length > 0)?.fileId ?? null;
}

/** Queue the copies for a post just published (the composer's action, after checkSocialAsk). Audited. */
export async function queueSocialPosts(ctx: ActiveContext, postId: string, ask: SocialAsk): Promise<SocialNetwork[]> {
  const me = office(ctx);
  const networks: SocialNetwork[] = [...(ask.facebook ? (["FACEBOOK"] as const) : []), ...(ask.instagram ? (["INSTAGRAM"] as const) : [])];
  if (networks.length === 0) return [];
  const post = await db.post.findFirst({ where: { id: postId, schoolId: me.schoolId, scope: "SCHOOL", status: "APPROVED" }, select: { id: true, media: true, audience: true } });
  if (!post || post.audience === "TEACHERS") throw new AccessError("social.refuseScope");
  const fileId = firstImage(post.media);
  if (ask.instagram && !fileId) throw new AccessError("social.refuseNoPicture");
  await db.socialPost.createMany({
    data: networks.map((network) => ({ schoolId: me.schoolId, postId: post.id, network, status: "QUEUED", fileId, pictureToken: fileId ? randomBytes(24).toString("base64url") : null, queuedByUserId: me.userId })),
    skipDuplicates: true,
  });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "social.queue", targetType: "Post", targetId: post.id, meta: { networks, picture: fileId !== null } });
  return networks;
}

/* -------------------------------------------------------------------------- */
/* The post's status lines                                                     */
/* -------------------------------------------------------------------------- */

const POST_ROW = { id: true, postId: true, network: true, status: true, remoteUrl: true, error: true, attempts: true, createdAt: true, sentAt: true, nextAttemptAt: true } as const;

function postOut(row: { id: string; postId: string; network: string; status: string; remoteUrl: string | null; error: string | null; attempts: number; createdAt: Date; sentAt: Date | null; nextAttemptAt: Date }): SocialPostOut {
  return {
    id: row.id,
    postId: row.postId,
    network: row.network as SocialNetwork,
    status: row.status as SocialPostOut["status"],
    remoteUrl: row.remoteUrl,
    error: readError(row.error),
    attempts: row.attempts,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    nextAttemptAt: row.status === "QUEUED" ? row.nextAttemptAt.toISOString() : null,
  };
}

/** The copies of one post (GET /api/v1/admin/social/posts?postId=, and the post's own page for the admin). */
export async function socialPostsFor(ctx: ActiveContext, postId: string): Promise<SocialPostOut[]> {
  const me = office(ctx);
  const rows = await db.socialPost.findMany({ where: { schoolId: me.schoolId, postId }, select: POST_ROW, orderBy: { network: "asc" } });
  return rows.map(postOut);
}

/** Retry (POST /api/v1/admin/social/posts/{id}/retry): a FAILED copy queued again with three fresh attempts. Audited. */
export async function retrySocialPost(ctx: ActiveContext, socialPostId: string, now: Date = new Date()): Promise<SocialPostOut> {
  const me = office(ctx);
  const row = await db.socialPost.findFirst({ where: { id: socialPostId, schoolId: me.schoolId }, select: { id: true, status: true, network: true, postId: true, fileId: true } });
  if (!row) throw new AccessError("social.refuseNotFound", "NOT_FOUND");
  if (row.status !== "FAILED") throw new RuleRefusal("social.refuseNotFailed", 409);
  await db.socialPost.updateMany({ where: { id: row.id, schoolId: me.schoolId, status: "FAILED" }, data: { status: "QUEUED", attempts: 0, error: null, nextAttemptAt: now, pictureToken: row.fileId ? randomBytes(24).toString("base64url") : null } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "social.retry", targetType: "SocialPost", targetId: row.id, meta: { network: row.network, postId: row.postId } });
  const fresh = await db.socialPost.findFirstOrThrow({ where: { id: row.id, schoolId: me.schoolId }, select: POST_ROW });
  return postOut(fresh);
}

/* -------------------------------------------------------------------------- */
/* The picture Meta fetches                                                    */
/* -------------------------------------------------------------------------- */

/** The ?social= value of a copy's picture link: the school, the copy and its random token. */
export function pictureParam(row: { schoolId: string; id: string; pictureToken: string }): string {
  return `${row.schoolId}.${row.id}.${row.pictureToken}`;
}

export function pictureUrl(base: string, row: { schoolId: string; id: string; fileId: string; pictureToken: string }): string {
  return `${base.replace(/\/+$/, "")}/api/files/${encodeURIComponent(row.fileId)}?social=${encodeURIComponent(pictureParam(row))}`;
}

/**
 * Whether ?social= opens this file to anyone holding the link (files route, kind "social"): the copy names this
 * file, its token matches, and it is QUEUED (being sent or waiting for its next attempt) or was SENT within the last
 * twenty-four hours. Anything else, including a FAILED copy, is the file route's ordinary 404.
 */
export async function socialPictureOpen(fileId: string, param: string | null, now: number = Date.now()): Promise<boolean> {
  if (!param) return false;
  const match = /^([A-Za-z0-9_-]{1,64})\.([A-Za-z0-9_-]{1,64})\.([A-Za-z0-9_-]{32})$/.exec(param);
  if (!match) return false;
  const [, schoolId, id, token] = match as unknown as [string, string, string, string];
  const row = await forSchool(schoolId, () => db.socialPost.findFirst({ where: { id, schoolId, fileId }, select: { status: true, sentAt: true, pictureToken: true } }));
  if (!row?.pictureToken) return false;
  const want = Buffer.from(row.pictureToken);
  const got = Buffer.from(token);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
  if (row.status === "QUEUED") return true;
  return row.status === "SENT" && row.sentAt !== null && now - row.sentAt.getTime() <= SOCIAL_PICTURE_WINDOW_MS;
}

/** A picture as Meta takes it: JPEG for Instagram (which takes nothing else), and for Facebook anything but a JPEG or a PNG. */
export async function asJpeg(bytes: Buffer, mime: string): Promise<{ bytes: Buffer; mime: string }> {
  if (mime === "image/jpeg") return { bytes, mime };
  const out = await sharp(bytes).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
  return { bytes: out, mime: "image/jpeg" };
}

/* -------------------------------------------------------------------------- */
/* The sender                                                                  */
/* -------------------------------------------------------------------------- */

export type SendDeps = { now: Date; fetchImpl: FetchImpl; cfg: MetaConfig | null; appUrl: string; readFile?: (fileId: string) => Promise<{ bytes: Buffer; mime: string } | null>; siteLink?: (schoolId: string) => Promise<string | null> };

export function liveSendDeps(now: Date = new Date()): SendDeps {
  return { now, fetchImpl: fetch, cfg: metaConfig(), appUrl: appUrl() };
}

/** The school's live website's news, when it has one: a published site on a LIVE domain. */
export async function siteLinkFor(schoolId: string): Promise<string | null> {
  const [site, host] = await Promise.all([publishedSiteFor(schoolId), siteHostFor(schoolId)]);
  return site && host ? `https://${host}/#news` : null;
}

type SendRow = { id: string; schoolId: string; postId: string; network: string; fileId: string | null; pictureToken: string | null; attempts: number };

/** One attempt at one copy. Answers what it came to; never throws for Meta's or the network's failure. Caller binds the school. */
export async function sendSocialPost(row: SendRow, deps: SendDeps): Promise<{ status: "SENT" | "QUEUED" | "FAILED"; error?: SocialError }> {
  const attempts = row.attempts + 1;
  const done = async (result: GraphResult<{ remoteId: string; remoteUrl: string | null }>) => {
    if (result.ok) {
      await db.socialPost.update({ where: { id: row.id }, data: { status: "SENT", remoteId: result.value.remoteId, remoteUrl: result.value.remoteUrl, error: null, attempts, sentAt: deps.now } });
      return { status: "SENT" as const };
    }
    const final = attempts >= SOCIAL_MAX_ATTEMPTS || PERMANENT.includes(result.error.code);
    await db.socialPost.update({ where: { id: row.id }, data: { status: final ? "FAILED" : "QUEUED", error: writeError(result.error), attempts, nextAttemptAt: new Date(deps.now.getTime() + RETRY_AFTER_MS) } });
    if (result.error.code === "RECONNECT") await db.socialConnection.updateMany({ where: { schoolId: row.schoolId }, data: { error: "RECONNECT", lastCheckedAt: deps.now } });
    return { status: final ? ("FAILED" as const) : ("QUEUED" as const), error: result.error };
  };
  const refuse = (code: SocialErrorCode, detail: string | null = null) => done({ ok: false, error: { code, detail } });

  const cfg = deps.cfg;
  if (!cfg) return refuse("NOT_CONNECTED");
  const post = await db.post.findFirst({ where: { id: row.postId, schoolId: row.schoolId }, select: { title: true, body: true, status: true, scope: true } });
  if (!post || post.status !== "APPROVED" || post.scope !== "SCHOOL") return refuse("POST_GONE");
  const connection = await db.socialConnection.findFirst({ where: { schoolId: row.schoolId }, select: { pageId: true, igUserId: true, pageTokenSealed: true } });
  if (!connection) return refuse("NOT_CONNECTED");
  let token: string;
  try {
    token = open(connection.pageTokenSealed, tokenBinding(row.schoolId));
  } catch {
    return refuse("RECONNECT");
  }
  const text = [post.title.trim(), post.body.trim()].filter(Boolean).join("\n\n");
  const f = deps.fetchImpl;

  if (row.network === "FACEBOOK") {
    const link = await (deps.siteLink ?? siteLinkFor)(row.schoolId);
    let published: GraphResult<{ id: string }>;
    if (row.fileId) {
      const stored = await (deps.readFile ?? readStoredFile)(row.fileId);
      if (!stored) return refuse("MEDIA", "the picture is no longer stored");
      const picture = stored.mime === "image/png" ? stored : await asJpeg(stored.bytes, stored.mime);
      const caption = trimTo(link ? `${text}\n\n${link}` : text, FACEBOOK_TEXT_MAX);
      published = await publishPhoto(cfg, connection.pageId, token, { bytes: picture.bytes, mime: picture.mime, caption }, f);
    } else {
      published = await publishFeed(cfg, connection.pageId, token, { message: trimTo(text, FACEBOOK_TEXT_MAX), link }, f);
    }
    if (!published.ok) return done(published);
    return done({ ok: true, value: { remoteId: published.value.id, remoteUrl: await permalinkOf(cfg, published.value.id, token, "FACEBOOK", f) } });
  }

  // INSTAGRAM: a picture Meta fetches by URL, then the publication.
  if (!connection.igUserId) return refuse("NO_INSTAGRAM");
  if (!row.fileId || !row.pictureToken) return refuse("NO_PICTURE");
  const imageUrl = pictureUrl(deps.appUrl, { schoolId: row.schoolId, id: row.id, fileId: row.fileId, pictureToken: row.pictureToken });
  const container = await igCreateMedia(cfg, connection.igUserId, token, { imageUrl, caption: trimTo(text, INSTAGRAM_CAPTION_MAX) }, f);
  if (!container.ok) return done(container);
  const media = await igPublish(cfg, connection.igUserId, token, container.value.id, f);
  if (!media.ok) return done(media);
  return done({ ok: true, value: { remoteId: media.value.id, remoteUrl: await permalinkOf(cfg, media.value.id, token, "INSTAGRAM", f) } });
}

/**
 * social:send (every minute): every QUEUED copy whose time has come, oldest first, fifty a run, each under its
 * school. A copy is CLAIMED before it is sent (its next attempt pushed an hour on), so a run that dies mid-send
 * leaves it to be tried again in an hour rather than sent twice in the next minute. Counts only.
 */
export async function drainSocialQueue(deps: SendDeps = liveSendDeps(), scope?: { schoolIds?: string[] }, limit = 50): Promise<{ sent: number; failed: number; waiting: number; perSchool: Record<string, Record<string, number>> }> {
  const out = { sent: 0, failed: 0, waiting: 0, perSchool: {} as Record<string, Record<string, number>> };
  if (!deps.cfg) return out;
  const rows = await db.socialPost.findMany({
    where: { status: "QUEUED", nextAttemptAt: { lte: deps.now }, ...(scope?.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, schoolId: true, postId: true, network: true, fileId: true, pictureToken: true, attempts: true, nextAttemptAt: true },
  });
  for (const row of rows) {
    const result = await forSchool(row.schoolId, async () => {
      const claimed = await db.socialPost.updateMany({ where: { id: row.id, status: "QUEUED", nextAttemptAt: row.nextAttemptAt }, data: { nextAttemptAt: new Date(deps.now.getTime() + RETRY_AFTER_MS) } });
      if (claimed.count === 0) return null;
      return sendSocialPost(row, deps);
    });
    if (!result) continue;
    const bucket = result.status === "SENT" ? "sent" : result.status === "FAILED" ? "failed" : "waiting";
    out[bucket] += 1;
    out.perSchool[row.schoolId] = { ...(out.perSchool[row.schoolId] ?? {}), [bucket]: (out.perSchool[row.schoolId]?.[bucket] ?? 0) + 1 };
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Token upkeep                                                                */
/* -------------------------------------------------------------------------- */

/**
 * social:refresh (daily): each connection's Page token asked GET /me. A token Meta refuses (expired, revoked, a
 * permission taken away) marks the connection RECONNECT, and the settings page and the composer say "Reconnect
 * Facebook"; one that answers clears it. A network failure changes nothing. The state's change is audited under no
 * actor. Counts only.
 */
export async function refreshSocialConnections(deps: Pick<SendDeps, "now" | "fetchImpl" | "cfg"> = liveSendDeps(), scope?: { schoolIds?: string[] }): Promise<{ checked: number; ok: number; reconnect: number; unreachable: number; perSchool: Record<string, Record<string, number>> }> {
  const out = { checked: 0, ok: 0, reconnect: 0, unreachable: 0, perSchool: {} as Record<string, Record<string, number>> };
  const cfg = deps.cfg;
  if (!cfg) return out;
  const rows = await db.socialConnection.findMany({ where: scope?.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}, select: { id: true, schoolId: true, pageId: true, pageTokenSealed: true, error: true }, take: 2000 });
  for (const row of rows) {
    const bucket = await forSchool(row.schoolId, async () => {
      let answer: GraphResult<{ id: string }>;
      try {
        answer = await checkPageToken(cfg, open(row.pageTokenSealed, tokenBinding(row.schoolId)), deps.fetchImpl);
      } catch {
        answer = { ok: false, error: { code: "RECONNECT", detail: null } };
      }
      if (!answer.ok && answer.error.code === "NETWORK") return "unreachable" as const;
      const error = answer.ok ? null : "RECONNECT";
      await db.socialConnection.update({ where: { id: row.id }, data: { lastCheckedAt: deps.now, error } });
      if (error !== row.error) {
        await audit({ schoolId: row.schoolId, actorUserId: null, action: "social.connection.status", targetType: "SocialConnection", targetId: row.pageId, meta: { from: row.error ?? "OK", to: error ?? "OK" } });
      }
      return answer.ok ? ("ok" as const) : ("reconnect" as const);
    });
    out.checked += 1;
    out[bucket] += 1;
    out.perSchool[row.schoolId] = { ...(out.perSchool[row.schoolId] ?? {}), [bucket]: (out.perSchool[row.schoolId]?.[bucket] ?? 0) + 1 };
  }
  return out;
}
