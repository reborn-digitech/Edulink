import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * meta-posting (16 October 2026): a school's Facebook Page and Instagram account, connected once by the school's
 * ADMIN, and the copies of school-wide posts sent there (src/lib/social.ts; tests/social.test.ts). Connecting is the
 * browser's Facebook Login (/api/social/meta/start and /callback, listed in unversioned.ts with the SSO routes) and
 * the Page's pick on /admin/settings/social; these doors read the connection, disconnect it and follow the copies.
 * The sweep never disconnects ZZ Northgate's fixture Page (the body must name it, so the empty body is a 422) and
 * never queues its fixture copy again (the sample is the SENT copy, which is not FAILED: 409). Nothing of this
 * reaches the phone yet.
 */
export const SOCIAL: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/social", summary: "Whether the platform has a Meta app configured and can seal the Page's key, and the school's Facebook Page connection (the Page, its linked Instagram professional account, when it was last checked, whether it must be reconnected)", access: ["ADMIN"], response: c.socialViewSchema, sample: "/api/v1/admin/social" },
  { method: "DELETE", path: "/api/v1/admin/social", summary: "Disconnect the school's Facebook Page (the one named in the body); the Page's key is deleted, and what was already posted on Facebook or Instagram stays there; audited", access: ["ADMIN"], request: c.socialDisconnectBodySchema, response: c.socialDisconnectedSchema, emptyBodyStatus: 422, sample: "/api/v1/admin/social" },
  { method: "GET", path: "/api/v1/admin/social/posts", summary: "The copies of one school post sent, or being sent, to the school's Facebook Page and Instagram account: queued, posted with a link, or failed with the reason", access: ["ADMIN"], request: c.socialPostsQuerySchema, response: c.socialPostListSchema, sample: (fx) => (fx.postId ? `/api/v1/admin/social/posts?postId=${fx.postId}` : null) },
  { method: "POST", path: "/api/v1/admin/social/posts/{socialPostId}/retry", summary: "Queue a failed copy of a post for Facebook or Instagram again, with three fresh attempts; a copy that has not failed is refused (409); audited", access: ["ADMIN"], response: c.socialPostSchema, emptyBodyStatus: 409, sample: "/api/v1/admin/social/posts/zz-social-sent-northgate/retry" },
];
