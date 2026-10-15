import { z } from "zod";

/**
 * A SCHOOL'S FACEBOOK PAGE AND INSTAGRAM ACCOUNT, FOR POSTING (meta-posting, 16 October 2026).
 *
 * The school's admin connects one Facebook Page once at /admin/settings/social (Facebook Login, the OAuth routes
 * under /api/social/meta); the Instagram professional account linked to that Page comes with it. A school-wide post
 * published with "Also post to Facebook" or "Also post to Instagram" ticked queues one SocialPost per network, which
 * the social:send job sends. Every failure is a code the page words, with Meta's own words after it where Meta gave
 * some. The doors: GET/DELETE /api/v1/admin/social, GET /api/v1/admin/social/posts?postId=, POST
 * /api/v1/admin/social/posts/{socialPostId}/retry. Nothing of this reaches the phone yet.
 */

export const SOCIAL_NETWORKS = ["FACEBOOK", "INSTAGRAM"] as const;
export const socialNetworkSchema = z.enum(SOCIAL_NETWORKS);
export type SocialNetwork = z.infer<typeof socialNetworkSchema>;

export const SOCIAL_POST_STATUSES = ["QUEUED", "SENT", "FAILED"] as const;
export const socialPostStatusSchema = z.enum(SOCIAL_POST_STATUSES);
export type SocialPostStatus = z.infer<typeof socialPostStatusSchema>;

/**
 * Why a copy did not go: the Page's token no longer works (RECONNECT), Meta refused the permission (PERMISSION), Meta
 * could not fetch the picture (MEDIA), the post has no picture for Instagram (NO_PICTURE), the school is no longer
 * connected or has no Instagram account (NOT_CONNECTED, NO_INSTAGRAM), Meta did not answer (NETWORK), the post is gone
 * (POST_GONE), or anything else Meta said (META).
 */
export const SOCIAL_ERROR_CODES = ["RECONNECT", "PERMISSION", "MEDIA", "NO_PICTURE", "NOT_CONNECTED", "NO_INSTAGRAM", "NETWORK", "POST_GONE", "META"] as const;
export const socialErrorCodeSchema = z.enum(SOCIAL_ERROR_CODES);
export type SocialErrorCode = z.infer<typeof socialErrorCodeSchema>;
export const socialErrorSchema = z.object({ code: socialErrorCodeSchema, detail: z.string().nullable() });
export type SocialError = z.infer<typeof socialErrorSchema>;

const iso = z.string().datetime();

export const socialConnectionSchema = z.object({
  provider: z.literal("META"),
  pageId: z.string(),
  pageName: z.string(),
  igUserId: z.string().nullable(),
  igUsername: z.string().nullable(),
  connectedAt: iso,
  lastCheckedAt: iso.nullable(),
  tokenExpiresAt: iso.nullable(),
  /** True when the last check of the Page's token failed: the admin must connect again. */
  needsReconnect: z.boolean(),
});
export type SocialConnectionOut = z.infer<typeof socialConnectionSchema>;

/** GET /api/v1/admin/social: whether the platform has Meta configured, whether secrets can be sealed, and the connection. */
export const socialViewSchema = z.object({
  configured: z.boolean(),
  sealing: z.boolean(),
  connection: socialConnectionSchema.nullable(),
});
export type SocialView = z.infer<typeof socialViewSchema>;

/** DELETE /api/v1/admin/social: the Page the screen shows, so a stale screen disconnects nothing. */
export const socialDisconnectBodySchema = z.object({ pageId: z.string().trim().min(1).max(64) });
/** DELETE /api/v1/admin/social. */
export const socialDisconnectedSchema = z.object({ disconnected: z.boolean() });

export const socialPostSchema = z.object({
  id: z.string(),
  postId: z.string(),
  network: socialNetworkSchema,
  status: socialPostStatusSchema,
  remoteUrl: z.string().nullable(),
  error: socialErrorSchema.nullable(),
  attempts: z.number().int(),
  createdAt: iso,
  sentAt: iso.nullable(),
  nextAttemptAt: iso.nullable(),
});
export type SocialPostOut = z.infer<typeof socialPostSchema>;

/** GET /api/v1/admin/social/posts?postId= */
export const socialPostsQuerySchema = z.object({ postId: z.string().min(1).max(64) });
export const socialPostListSchema = z.object({ items: z.array(socialPostSchema) });
