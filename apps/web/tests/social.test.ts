/**
 * A SCHOOL POSTS TO ITS FACEBOOK PAGE AND INSTAGRAM ACCOUNT (meta-posting, 16 October 2026).
 *
 * What is proved, with Meta's Graph API fully faked (every fetch answered here, every call recorded): Facebook Login
 * (the dialog's URL and scopes; the callback's state check against the cookie, the school and the admin; the code's
 * exchange for a long-lived token; the Pages listed; the sealed pick cookie; the refusals), the Page chosen and
 * sealed, Disconnect; the composer's rules (ADMIN, school-wide, not a staff notice, a connection, Instagram's picture,
 * the consent tick) through the server action itself; the sender for both networks (a Facebook text post with the
 * site's link, a Facebook photo uploaded as bytes, Instagram's two steps with the picture fetched by its public link,
 * the no-picture refusal), the picture link's window, three attempts an hour apart then FAILED, Retry, a token Meta
 * no longer accepts; the refresh job; the four doors; the catalog, the unversioned list, the jobs and the audit words.
 * ZZ rows of its own only, removed after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { socialPostListSchema, socialPostSchema, socialViewSchema } from "@edulink/contracts";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

import { ENDPOINTS } from "@/lib/api-catalog";
import { OUTSIDE_THE_CATALOG } from "@/lib/api-catalog/unversioned";
import { JOBS } from "@/lib/jobs";
import { actionKey } from "@/lib/safety-labels";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { open } from "@/lib/secret-box";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { beginMetaLogin, META_PICK_COOKIE, META_SCOPES, META_STATE_COOKIE, metaConfig, metaRedirectUri, graphError, trimTo, type FetchImpl } from "@/lib/social-meta";
import {
  checkSocialAsk,
  composerSocial,
  connectPage,
  disconnectSocial,
  drainSocialQueue,
  pagesToPick,
  queueSocialPosts,
  refreshSocialConnections,
  retrySocialPost,
  sendSocialPost,
  socialPictureOpen,
  socialPostsFor,
  socialView,
  SOCIAL_PICTURE_WINDOW_MS,
  type SendDeps,
} from "@/lib/social";
import { GET as startGet } from "@/app/api/social/meta/start/route";
import { GET as callbackGet } from "@/app/api/social/meta/callback/route";
import { DELETE as socialDelete, GET as socialGet } from "@/app/api/v1/admin/social/route";
import { GET as postsGet } from "@/app/api/v1/admin/social/posts/route";
import { POST as retryPost } from "@/app/api/v1/admin/social/posts/[socialPostId]/retry/route";
import { submitPost } from "@/app/(app)/bulletin/actions";
import { GET as fileGet } from "@/app/api/files/[fileId]/route";
import { deleteStoredFile, storeFile } from "@/lib/storage";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", other: "", admin: "", teacher: "", otherAdmin: "" };
const ORIGIN = "http://localhost:3000";
const savedEnv = { META_APP_ID: process.env.META_APP_ID, META_APP_SECRET: process.env.META_APP_SECRET, META_GRAPH_VERSION: process.env.META_GRAPH_VERSION, FEES_SECRET_KEY: process.env.FEES_SECRET_KEY, NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL };
const PAGE_TOKEN = "zz-page-token-SECRET-1";
const USER_TOKEN = "zz-long-user-token-SECRET";

async function as(userId: string, role: string | null, schoolId: string | null = ids.school): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

async function refusedWith(promise: Promise<unknown>, key: string, kind: typeof AccessError | typeof RuleRefusal = AccessError) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(kind);
  expect((error as AccessError).key).toBe(key);
}

type Call = { method: string; url: URL; body: URLSearchParams | FormData | null };

/**
 * A fake Graph API. Answers by path; every call recorded. `pages` is what /me/accounts lists; `fail` maps a path
 * suffix to a Graph error (or "throw" for a network failure).
 */
function fakeGraph(opts: { pages?: unknown[]; fail?: Record<string, { status: number; error: Record<string, unknown> } | "throw">; meId?: string } = {}) {
  const calls: Call[] = [];
  const fetchImpl: FetchImpl = async (input, init) => {
    const url = new URL(input);
    const body = init?.body instanceof FormData ? init.body : init?.body ? new URLSearchParams(String(init.body)) : null;
    calls.push({ method: init?.method ?? "GET", url, body });
    for (const [suffix, how] of Object.entries(opts.fail ?? {})) {
      if (url.pathname.endsWith(suffix)) {
        if (how === "throw") throw new Error(`connect ECONNREFUSED ${input}`);
        return Response.json({ error: how.error }, { status: how.status });
      }
    }
    const path = url.pathname.replace(/^\/v[\d.]+/, "");
    if (path === "/oauth/access_token") {
      if (url.searchParams.get("grant_type") === "fb_exchange_token") return Response.json({ access_token: USER_TOKEN, token_type: "bearer", expires_in: 5_184_000 });
      return Response.json({ access_token: "zz-short-token", token_type: "bearer", expires_in: 3600 });
    }
    if (path === "/me/accounts") return Response.json({ data: opts.pages ?? [{ id: "9001", name: "ZZ Social Page", access_token: PAGE_TOKEN, instagram_business_account: { id: "17841", username: "zz_social" } }] });
    if (path === "/me") return Response.json({ id: opts.meId ?? "9001" });
    if (path.endsWith("/feed")) return Response.json({ id: "9001_111" });
    if (path.endsWith("/photos")) return Response.json({ id: "555", post_id: "9001_222" });
    if (path.endsWith("/media_publish")) return Response.json({ id: "ig-media-333" });
    if (path.endsWith("/media")) return Response.json({ id: "ig-container-444" });
    if (url.searchParams.get("fields") === "permalink_url") return Response.json({ permalink_url: `https://www.facebook.com/${path.slice(1)}` });
    if (url.searchParams.get("fields") === "permalink") return Response.json({ permalink: `https://www.instagram.com/p/${path.slice(1)}/` });
    return Response.json({ error: { message: "unknown path", code: 100 } }, { status: 400 });
  };
  return { calls, fetchImpl };
}

let png: Buffer;

beforeAll(async () => {
  process.env.META_APP_ID = "zz-meta-app";
  process.env.META_APP_SECRET = "zz-meta-app-secret";
  delete process.env.META_GRAPH_VERSION;
  process.env.NEXT_PUBLIC_APP_URL = ORIGIN;
  if (!process.env.FEES_SECRET_KEY) process.env.FEES_SECRET_KEY = randomBytes(32).toString("base64");
  png = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#3366cc" } }).png().toBuffer();

  const school = (name: string, slug: string, code: string) =>
    db.school.create({ data: { name, slug, code, contactEmail: `${slug}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.school = (await school(`ZZ Social ${STAMP}`, `zz-social-${STAMP}`, `ZSO${String(STAMP).slice(-6)}`)).id;
  ids.other = (await school(`ZZ Social Other ${STAMP}`, `zz-social-other-${STAMP}`, `ZSX${String(STAMP).slice(-6)}`)).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ Social ${who}`, email: `zz-social-${who.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
  const [admin, teacher, otherAdmin] = await Promise.all([user("Admin"), user("Teacher"), user("OtherAdmin")]);
  Object.assign(ids, { admin: admin.id, teacher: teacher.id, otherAdmin: otherAdmin.id });
  await db.membership.createMany({
    data: [
      { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: teacher.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
      { userId: otherAdmin.id, schoolId: ids.other, role: "ADMIN", status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  __resetCookies();
  __setHeaders({});
  const users = [ids.admin, ids.teacher, ids.otherAdmin];
  const schools = [ids.school, ids.other];
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.socialPost.deleteMany({ where: { schoolId: { in: schools } } });
  await db.socialConnection.deleteMany({ where: { schoolId: { in: schools } } });
  await db.post.deleteMany({ where: { schoolId: { in: schools } } });
  await db.rateLimit.deleteMany({ where: { bucket: { contains: ids.admin } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

/** A NextRequest to the callback with the state cookie the start route would have set. */
function callbackRequest(query: string, cookie: string | null): NextRequest {
  return new NextRequest(`${ORIGIN}/api/social/meta/callback?${query}`, { headers: cookie ? { cookie: `${META_STATE_COOKIE}=${encodeURIComponent(cookie)}` } : {} });
}
function setCookieValue(response: Response, name: string): string | null {
  const all = response.headers.getSetCookie();
  const line = all.find((l) => l.startsWith(`${name}=`));
  if (!line) return null;
  return decodeURIComponent(line.slice(name.length + 1).split(";")[0]!);
}

/* -------------------------------------------------------------------------- */

describe("Facebook Login: the dialog and the callback", () => {
  it("sends the admin to Facebook's dialog with the six permissions, the redirect URI and a state the cookie keeps", async () => {
    const cfg = metaConfig()!;
    const begun = beginMetaLogin(cfg, metaRedirectUri(ORIGIN), { schoolId: ids.school, userId: ids.admin });
    const url = new URL(begun.authorizeUrl);
    expect(url.origin + url.pathname).toBe("https://www.facebook.com/v23.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("zz-meta-app");
    expect(url.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/api/social/meta/callback`);
    expect(url.searchParams.get("scope")!.split(",")).toEqual([...META_SCOPES]);
    expect(META_SCOPES).toEqual(["pages_show_list", "pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish", "business_management"]);
    expect(JSON.parse(begun.cookieValue)).toEqual({ s: url.searchParams.get("state"), school: ids.school, u: ids.admin });

    await as(ids.admin, "ADMIN");
    const start = await startGet(new NextRequest(`${ORIGIN}/api/social/meta/start`));
    expect(start.status).toBe(307);
    expect(start.headers.get("location")).toMatch(/^https:\/\/www\.facebook\.com\/v23\.0\/dialog\/oauth\?/);
    expect(setCookieValue(start, META_STATE_COOKIE)).toContain(ids.school);
    await as(ids.teacher, "TEACHER");
    expect((await startGet(new NextRequest(`${ORIGIN}/api/social/meta/start`))).status).toBe(404);
  });

  it("refuses an answer whose state is not the cookie's, or whose cookie names another school or person, before asking Meta anything", async () => {
    const graph = fakeGraph();
    vi.stubGlobal("fetch", graph.fetchImpl);
    await as(ids.admin, "ADMIN");
    const cookie = JSON.stringify({ s: "the-state", school: ids.school, u: ids.admin });
    const where = (r: Response) => new URL(r.headers.get("location")!).search;
    expect(where(await callbackGet(callbackRequest("code=c1&state=another", cookie)))).toBe("?meta=state");
    expect(where(await callbackGet(callbackRequest("code=c1&state=the-state", null)))).toBe("?meta=state");
    expect(where(await callbackGet(callbackRequest("code=c1&state=the-state", JSON.stringify({ s: "the-state", school: ids.other, u: ids.admin }))))).toBe("?meta=state");
    expect(where(await callbackGet(callbackRequest("code=c1&state=the-state", JSON.stringify({ s: "the-state", school: ids.school, u: ids.teacher }))))).toBe("?meta=state");
    expect(where(await callbackGet(callbackRequest("error=access_denied&state=the-state", cookie)))).toBe("?meta=denied");
    expect(graph.calls).toHaveLength(0);
    await as(ids.teacher, "TEACHER");
    expect(where(await callbackGet(callbackRequest("code=c1&state=the-state", JSON.stringify({ s: "the-state", school: ids.school, u: ids.teacher }))))).toBe("?meta=role");
  });

  it("exchanges the code for a long-lived token, lists the Pages, and hands back a sealed pick cookie", async () => {
    const graph = fakeGraph();
    vi.stubGlobal("fetch", graph.fetchImpl);
    await as(ids.admin, "ADMIN");
    const response = await callbackGet(callbackRequest("code=the-code&state=s1", JSON.stringify({ s: "s1", school: ids.school, u: ids.admin })));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname + new URL(response.headers.get("location")!).search).toBe("/admin/settings/social?pick=1");
    const [exchange, longLived, accounts] = graph.calls;
    expect(exchange!.url.searchParams.get("code")).toBe("the-code");
    expect(exchange!.url.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/api/social/meta/callback`);
    expect(longLived!.url.searchParams.get("grant_type")).toBe("fb_exchange_token");
    expect(longLived!.url.searchParams.get("fb_exchange_token")).toBe("zz-short-token");
    expect(accounts!.url.pathname).toMatch(/\/me\/accounts$/);
    expect(accounts!.url.searchParams.get("access_token")).toBe(USER_TOKEN);
    expect(accounts!.url.searchParams.get("appsecret_proof")).toMatch(/^[0-9a-f]{64}$/);
    const pick = setCookieValue(response, META_PICK_COOKIE)!;
    expect(pick).toMatch(/^v2\./);
    expect(pick).not.toContain(USER_TOKEN);
    // The state cookie is cleared on the way out.
    expect(response.headers.getSetCookie().some((l) => l.startsWith(`${META_STATE_COOKIE}=;`) || /edulink\.meta=;/.test(l))).toBe(true);

    // The admin picks: the Pages are read again with the sealed token; another admin's session cannot open it.
    const ctx = await as(ids.admin, "ADMIN");
    const listed = await pagesToPick(ctx, pick, graph.fetchImpl);
    expect(listed).toEqual({ ok: true, value: [{ id: "9001", name: "ZZ Social Page", igUsername: "zz_social" }] });
    const other = await as(ids.otherAdmin, "ADMIN", ids.other);
    expect(await pagesToPick(other, pick, graph.fetchImpl)).toBeNull();
    await refusedWith(connectPage(other, pick, "9001", graph.fetchImpl), "social.refusePickExpired");
  });

  it("refuses a person with no Page, and a failed exchange", async () => {
    await as(ids.admin, "ADMIN");
    const cookie = JSON.stringify({ s: "s2", school: ids.school, u: ids.admin });
    vi.stubGlobal("fetch", fakeGraph({ pages: [] }).fetchImpl);
    expect(new URL((await callbackGet(callbackRequest("code=c&state=s2", cookie))).headers.get("location")!).search).toBe("?meta=nopages");
    vi.stubGlobal("fetch", fakeGraph({ fail: { "/oauth/access_token": { status: 400, error: { message: "Invalid verification code format.", code: 100 } } } }).fetchImpl);
    expect(new URL((await callbackGet(callbackRequest("code=c&state=s2", cookie))).headers.get("location")!).search).toBe("?meta=exchange");
  });

  it("answers 404 on both routes while the platform has no Meta app", async () => {
    delete process.env.META_APP_ID;
    try {
      expect(metaConfig()).toBeNull();
      expect((await startGet(new NextRequest(`${ORIGIN}/api/social/meta/start`))).status).toBe(404);
      expect((await callbackGet(callbackRequest("code=c&state=s", null))).status).toBe(404);
      const ctx = await as(ids.admin, "ADMIN");
      expect((await socialView(ctx)).configured).toBe(false);
      expect(await composerSocial(ctx)).toBeNull();
    } finally {
      process.env.META_APP_ID = "zz-meta-app";
    }
  });
});

describe("the Page chosen, and Disconnect", () => {
  it("seals the Page's token bound to the school, keeps the linked Instagram account, and audits it", async () => {
    const graph = fakeGraph();
    const ctx = await as(ids.admin, "ADMIN");
    const { seal } = await import("@/lib/secret-box");
    const pick = seal(JSON.stringify({ t: USER_TOKEN, e: null }), `social:${ids.school}:${ids.admin}:pick`);
    await refusedWith(connectPage(ctx, pick, "no-such-page", graph.fetchImpl), "social.refusePickExpired");
    const view = await connectPage(ctx, pick, "9001", graph.fetchImpl);
    expect(socialViewSchema.parse(view).connection).toMatchObject({ pageId: "9001", pageName: "ZZ Social Page", igUserId: "17841", igUsername: "zz_social", needsReconnect: false });
    const row = await db.socialConnection.findUniqueOrThrow({ where: { schoolId: ids.school } });
    expect(row.pageTokenSealed).not.toContain(PAGE_TOKEN);
    expect(open(row.pageTokenSealed, `social:${ids.school}:page-token`)).toBe(PAGE_TOKEN);
    expect(() => open(row.pageTokenSealed, `social:${ids.other}:page-token`)).toThrow();
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.connect" } })).toBe(1);
    expect(await composerSocial(ctx)).toEqual({ pageName: "ZZ Social Page", igUsername: "zz_social", instagram: true, needsReconnect: false });
    // Only the school's ADMIN.
    await refusedWith(socialView(await as(ids.teacher, "TEACHER")), "social.refuseRole");
  });

  it("disconnects only the Page the screen shows, and audits it; the doors answer the same", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    await refusedWith(disconnectSocial(ctx, "another-page"), "social.refuseStale", RuleRefusal);
    const get = await socialGet();
    expect(get.status).toBe(200);
    expect(socialViewSchema.parse(await get.json()).connection?.pageId).toBe("9001");
    const empty = await socialDelete(new Request(`${ORIGIN}/api/v1/admin/social`, { method: "DELETE" }));
    expect(empty.status).toBe(422);
    const stale = await socialDelete(new Request(`${ORIGIN}/api/v1/admin/social`, { method: "DELETE", body: JSON.stringify({ pageId: "another-page" }), headers: { "content-type": "application/json" } }));
    expect(stale.status).toBe(409);
    expect(await db.socialConnection.count({ where: { schoolId: ids.school } })).toBe(1);
    await as(ids.teacher, "TEACHER");
    expect((await socialGet()).status).toBe(403);
    await as(ids.admin, "ADMIN");
    const gone = await socialDelete(new Request(`${ORIGIN}/api/v1/admin/social`, { method: "DELETE", body: JSON.stringify({ pageId: "9001" }), headers: { "content-type": "application/json" } }));
    expect(await gone.json()).toEqual({ disconnected: true });
    expect(await db.socialConnection.count({ where: { schoolId: ids.school } })).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.disconnect" } })).toBe(1);
    expect(await disconnectSocial(ctx, "9001")).toEqual({ disconnected: false });
  });
});

/** Connect the school's fake Page again (the sender's tests need one). */
async function connectAgain(igUserId: string | null = "17841") {
  const { seal } = await import("@/lib/secret-box");
  const data = { pageId: "9001", pageName: "ZZ Social Page", igUserId, igUsername: igUserId ? "zz_social" : null, pageTokenSealed: seal(PAGE_TOKEN, `social:${ids.school}:page-token`), connectedByUserId: ids.admin, error: null };
  await db.socialConnection.upsert({ where: { schoolId: ids.school }, create: { schoolId: ids.school, ...data }, update: data });
}

async function makePost(title: string, media: { fileId: string; kind: "image" | "video"; alt: string }[] = [], extra: Record<string, unknown> = {}) {
  return db.post.create({ data: { schoolId: ids.school, authorUserId: ids.admin, scope: "SCHOOL", status: "APPROVED", title, body: "ZZ body of the post.", media: JSON.stringify(media), category: "UPDATES", ...extra }, select: { id: true } });
}

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe("the composer: who may, what may go, and the queue", () => {
  it("says no to a teacher, a class post, a staff notice, no connection, Instagram with no picture, and pictures without consent", async () => {
    const admin = await as(ids.admin, "ADMIN");
    const fb = { facebook: true, instagram: false, consent: false };
    const school = { scope: "SCHOOL", audience: "ALL", media: [] as { kind: "image" | "video" }[] };
    expect(await checkSocialAsk(admin, { facebook: false, instagram: false, consent: false }, school)).toBeNull();
    expect(await checkSocialAsk(admin, fb, school)).toBe("social.refuseNotConnected");
    await connectAgain();
    expect(await checkSocialAsk(admin, fb, school)).toBeNull();
    expect(await checkSocialAsk(await as(ids.teacher, "TEACHER"), fb, school)).toBe("social.refuseRole");
    const again = await as(ids.admin, "ADMIN");
    expect(await checkSocialAsk(again, fb, { ...school, scope: "CLASS" })).toBe("social.refuseScope");
    expect(await checkSocialAsk(again, fb, { ...school, audience: "TEACHERS" })).toBe("social.refuseScope");
    expect(await checkSocialAsk(again, { facebook: false, instagram: true, consent: true }, school)).toBe("social.refuseNoPicture");
    expect(await checkSocialAsk(again, { facebook: false, instagram: true, consent: true }, { ...school, media: [{ kind: "video" }] })).toBe("social.refuseNoPicture");
    expect(await checkSocialAsk(again, fb, { ...school, media: [{ kind: "image" }] })).toBe("social.refuseConsent");
    expect(await checkSocialAsk(again, { facebook: true, instagram: true, consent: true }, { ...school, media: [{ kind: "image" }] })).toBeNull();
    await connectAgain(null);
    expect(await checkSocialAsk(again, { facebook: false, instagram: true, consent: true }, { ...school, media: [{ kind: "image" }] })).toBe("social.refuseNoInstagram");
    await connectAgain();
  });

  it("publishes through the composer's own action and queues the copy; a refused copy leaves no post behind", async () => {
    await as(ids.admin, "ADMIN");
    const base = { scope: "SCHOOL", category: "UPDATES", font: "default", classId: "", audience: "ALL", audienceGrade: "", requiresAck: "", body: "Sports day moves to Friday." };
    const refused = await submitPost(form({ ...base, title: `ZZ Refused ${STAMP}`, socialInstagram: "on", socialConsent: "on" }));
    expect(refused.ok).toBe(false);
    expect(refused.errors.social).toBeTruthy();
    expect(await db.post.count({ where: { schoolId: ids.school, title: `ZZ Refused ${STAMP}` } })).toBe(0);

    const done = await submitPost(form({ ...base, title: `ZZ Sports day ${STAMP}`, socialFacebook: "on" }));
    expect(done).toMatchObject({ ok: true, status: "APPROVED" });
    expect(done.socialError).toBeUndefined();
    const rows = await db.socialPost.findMany({ where: { schoolId: ids.school, postId: done.postId! } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ network: "FACEBOOK", status: "QUEUED", attempts: 0, fileId: null, queuedByUserId: ids.admin });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.queue", targetId: done.postId! } })).toBe(1);

    // A post without the boxes queues nothing.
    const plain = await submitPost(form({ ...base, title: `ZZ Plain ${STAMP}` }));
    expect(await db.socialPost.count({ where: { postId: plain.postId! } })).toBe(0);
    await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
  });

  it("queues both networks for a post with a picture, with the picture and a random token for its link", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Picture ${STAMP}`, [{ fileId: `zz-social-${STAMP}.png`, kind: "image", alt: "ZZ a picture" }]);
    expect(await queueSocialPosts(ctx, post.id, { facebook: true, instagram: true, consent: true })).toEqual(["FACEBOOK", "INSTAGRAM"]);
    const rows = await db.socialPost.findMany({ where: { postId: post.id }, orderBy: { network: "asc" } });
    expect(rows.map((r) => [r.network, r.status, r.fileId])).toEqual([
      ["FACEBOOK", "QUEUED", `zz-social-${STAMP}.png`],
      ["INSTAGRAM", "QUEUED", `zz-social-${STAMP}.png`],
    ]);
    expect(rows[0]!.pictureToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(rows[0]!.pictureToken).not.toBe(rows[1]!.pictureToken);
    // Queued twice is the same two rows.
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: true, consent: true });
    expect(await db.socialPost.count({ where: { postId: post.id } })).toBe(2);
    const textOnly = await makePost(`ZZ Text ${STAMP}`);
    await refusedWith(queueSocialPosts(ctx, textOnly.id, { facebook: false, instagram: true, consent: true }), "social.refuseNoPicture");
    const staffOnly = await makePost(`ZZ Staff ${STAMP}`, [], { audience: "TEACHERS" });
    await refusedWith(queueSocialPosts(ctx, staffOnly.id, { facebook: true, instagram: false, consent: true }), "social.refuseScope");
    await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
  });
});

describe("the sender, both networks (Graph faked)", () => {
  const deps = (graph: { fetchImpl: FetchImpl }, now = new Date(), over: Partial<SendDeps> = {}): SendDeps => ({
    now,
    fetchImpl: graph.fetchImpl,
    cfg: metaConfig(),
    appUrl: "https://app.zz.test",
    readFile: async () => ({ bytes: png, mime: "image/png" }),
    siteLink: async () => "https://www.zz-social.test/#news",
    ...over,
  });
  const rowOf = (id: string) => db.socialPost.findUniqueOrThrow({ where: { id } });

  it("posts text to the Page's feed with the site's link, and keeps the post's permalink", async () => {
    await connectAgain();
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Feed ${STAMP}`);
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: false, consent: false });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const graph = fakeGraph();
    expect(await sendSocialPost(row, deps(graph))).toEqual({ status: "SENT" });
    const feed = graph.calls.find((c) => c.url.pathname.endsWith("/9001/feed"))!;
    expect(feed.method).toBe("POST");
    const body = feed.body as URLSearchParams;
    expect(body.get("message")).toBe(`ZZ Feed ${STAMP}\n\nZZ body of the post.`);
    expect(body.get("link")).toBe("https://www.zz-social.test/#news");
    expect(body.get("access_token")).toBe(PAGE_TOKEN);
    expect(body.get("appsecret_proof")).toMatch(/^[0-9a-f]{64}$/);
    expect(await rowOf(row.id)).toMatchObject({ status: "SENT", remoteId: "9001_111", remoteUrl: "https://www.facebook.com/9001_111", attempts: 1, error: null });
    const [out] = await socialPostsFor(ctx, post.id);
    expect(socialPostSchema.parse(out)).toMatchObject({ network: "FACEBOOK", status: "SENT", remoteUrl: "https://www.facebook.com/9001_111" });
    // No live site: no link.
    const post2 = await makePost(`ZZ Feed two ${STAMP}`);
    await queueSocialPosts(ctx, post2.id, { facebook: true, instagram: false, consent: false });
    const row2 = await db.socialPost.findFirstOrThrow({ where: { postId: post2.id } });
    const graph2 = fakeGraph();
    await sendSocialPost(row2, deps(graph2, new Date(), { siteLink: async () => null }));
    expect((graph2.calls.find((c) => c.url.pathname.endsWith("/feed"))!.body as URLSearchParams).has("link")).toBe(false);
  });

  it("uploads the first picture to the Page as a photo with the caption", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Photo ${STAMP}`, [{ fileId: `zz-photo-${STAMP}.png`, kind: "image", alt: "ZZ" }]);
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: false, consent: true });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const graph = fakeGraph();
    expect(await sendSocialPost(row, deps(graph))).toEqual({ status: "SENT" });
    const photo = graph.calls.find((c) => c.url.pathname.endsWith("/9001/photos"))!;
    const body = photo.body as FormData;
    expect(body.get("caption")).toBe(`ZZ Photo ${STAMP}\n\nZZ body of the post.\n\nhttps://www.zz-social.test/#news`);
    expect(body.get("source")).toBeInstanceOf(Blob);
    expect((await rowOf(row.id)).remoteId).toBe("9001_222");
  });

  it("takes Instagram's two steps with the picture's public link, which opens while queued and for a day after it is sent", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const fileId = `zz-ig-${STAMP}.png`;
    const post = await makePost(`ZZ Instagram ${STAMP}`, [{ fileId, kind: "image", alt: "ZZ" }]);
    await queueSocialPosts(ctx, post.id, { facebook: false, instagram: true, consent: true });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const param = `${ids.school}.${row.id}.${row.pictureToken}`;
    expect(await socialPictureOpen(fileId, param)).toBe(true); // QUEUED
    expect(await socialPictureOpen(fileId, `${ids.school}.${row.id}.${"x".repeat(32)}`)).toBe(false);
    expect(await socialPictureOpen("another-file.png", param)).toBe(false);
    expect(await socialPictureOpen(fileId, `${ids.other}.${row.id}.${row.pictureToken}`)).toBe(false);
    expect(await socialPictureOpen(fileId, null)).toBe(false);

    const now = new Date();
    const graph = fakeGraph();
    expect(await sendSocialPost(row, deps(graph, now))).toEqual({ status: "SENT" });
    const media = graph.calls.find((c) => c.url.pathname.endsWith("/17841/media"))!;
    const imageUrl = new URL((media.body as URLSearchParams).get("image_url")!);
    expect(imageUrl.origin + imageUrl.pathname).toBe(`https://app.zz.test/api/files/${fileId}`);
    expect(imageUrl.searchParams.get("social")).toBe(param);
    expect((media.body as URLSearchParams).get("caption")).toBe(`ZZ Instagram ${STAMP}\n\nZZ body of the post.`);
    const publish = graph.calls.find((c) => c.url.pathname.endsWith("/17841/media_publish"))!;
    expect((publish.body as URLSearchParams).get("creation_id")).toBe("ig-container-444");
    expect(graph.calls.indexOf(media)).toBeLessThan(graph.calls.indexOf(publish));
    expect(await rowOf(row.id)).toMatchObject({ status: "SENT", remoteId: "ig-media-333", remoteUrl: "https://www.instagram.com/p/ig-media-333/" });

    expect(await socialPictureOpen(fileId, param, now.getTime() + 60_000)).toBe(true);
    expect(await socialPictureOpen(fileId, param, now.getTime() + SOCIAL_PICTURE_WINDOW_MS + 60_000)).toBe(false);
  });

  it("refuses Instagram for a copy with no picture at once, and a Page with no Instagram account", async () => {
    const post = await makePost(`ZZ No picture ${STAMP}`);
    const row = await db.socialPost.create({ data: { schoolId: ids.school, postId: post.id, network: "INSTAGRAM", queuedByUserId: ids.admin } });
    const graph = fakeGraph();
    expect(await sendSocialPost(row, deps(graph))).toMatchObject({ status: "FAILED", error: { code: "NO_PICTURE" } });
    expect(graph.calls).toHaveLength(0);
    expect(await rowOf(row.id)).toMatchObject({ status: "FAILED", attempts: 1 });
    await connectAgain(null);
    const post2 = await makePost(`ZZ No account ${STAMP}`, [{ fileId: "zz-x.png", kind: "image", alt: "ZZ" }]);
    const row2 = await db.socialPost.create({ data: { schoolId: ids.school, postId: post2.id, network: "INSTAGRAM", fileId: "zz-x.png", pictureToken: "t".repeat(32), queuedByUserId: ids.admin } });
    expect(await sendSocialPost(row2, deps(graph))).toMatchObject({ status: "FAILED", error: { code: "NO_INSTAGRAM" } });
    await connectAgain();
  });

  it("tries three times an hour apart through the job, then FAILED with Meta's words; Retry queues it again", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Retries ${STAMP}`);
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: false, consent: false });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const graph = fakeGraph({ fail: { "/feed": { status: 500, error: { message: "An unexpected error has occurred. Please retry your request later.", code: 2, type: "OAuthException" } } } });
    const scope = { schoolIds: [ids.school] };
    const t0 = new Date(Date.now() + 1000);
    expect(await drainSocialQueue(deps(graph, t0), scope)).toMatchObject({ sent: 0, failed: 0, waiting: 1 });
    let now = await rowOf(row.id);
    expect(now).toMatchObject({ status: "QUEUED", attempts: 1 });
    expect(now.nextAttemptAt.getTime()).toBe(t0.getTime() + 3_600_000);
    expect(JSON.parse(now.error!)).toEqual({ code: "META", detail: "An unexpected error has occurred. Please retry your request later." });
    // Not due yet: nothing happens.
    expect(await drainSocialQueue(deps(graph, new Date(t0.getTime() + 30 * 60_000)), scope)).toMatchObject({ sent: 0, failed: 0, waiting: 0 });
    await drainSocialQueue(deps(graph, new Date(t0.getTime() + 3_600_000)), scope);
    expect(await rowOf(row.id)).toMatchObject({ status: "QUEUED", attempts: 2 });
    expect(await drainSocialQueue(deps(graph, new Date(t0.getTime() + 2 * 3_600_000)), scope)).toMatchObject({ failed: 1 });
    now = await rowOf(row.id);
    expect(now).toMatchObject({ status: "FAILED", attempts: 3 });
    expect(graph.calls.filter((c) => c.url.pathname.endsWith("/feed"))).toHaveLength(3);
    // The token is never in the error.
    expect(now.error).not.toContain(PAGE_TOKEN);

    const [listed] = (socialPostListSchema.parse(await (await postsGet(new Request(`${ORIGIN}/api/v1/admin/social/posts?postId=${post.id}`))).json())).items;
    expect(listed).toMatchObject({ status: "FAILED", error: { code: "META" }, attempts: 3, nextAttemptAt: null });
    const retried = await retryPost(new Request(`${ORIGIN}/x`, { method: "POST" }), { params: Promise.resolve({ socialPostId: row.id }) });
    expect(retried.status).toBe(200);
    expect(socialPostSchema.parse(await retried.json())).toMatchObject({ status: "QUEUED", attempts: 0, error: null });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.retry", targetId: row.id } })).toBe(1);
    const twice = await retryPost(new Request(`${ORIGIN}/x`, { method: "POST" }), { params: Promise.resolve({ socialPostId: row.id }) });
    expect(twice.status).toBe(409);
    expect((await retryPost(new Request(`${ORIGIN}/x`, { method: "POST" }), { params: Promise.resolve({ socialPostId: "no-such-copy" }) })).status).toBe(404);
    await refusedWith(retrySocialPost(ctx, row.id), "social.refuseNotFailed", RuleRefusal);
    // Another school's admin cannot see or retry it.
    const other = await as(ids.otherAdmin, "ADMIN", ids.other);
    expect(await socialPostsFor(other, post.id)).toEqual([]);
    await refusedWith(retrySocialPost(other, row.id), "social.refuseNotFound");
    await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
  });

  it("fails at once on a token Meta no longer accepts, and the composer and the settings say reconnect", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Expired ${STAMP}`);
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: false, consent: false });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const graph = fakeGraph({ fail: { "/feed": { status: 400, error: { message: "Error validating access token: Session has expired.", code: 190, type: "OAuthException" } } } });
    expect(await sendSocialPost(row, deps(graph))).toMatchObject({ status: "FAILED", error: { code: "RECONNECT" } });
    expect(await composerSocial(ctx)).toMatchObject({ needsReconnect: true });
    expect((await socialView(ctx)).connection?.needsReconnect).toBe(true);
    expect(await checkSocialAsk(ctx, { facebook: true, instagram: false, consent: false }, { scope: "SCHOOL", audience: "ALL", media: [] })).toBe("social.refuseReconnect");
    await connectAgain();
    await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
  });

  it("does not send a copy whose post was taken down, and a network failure waits for the next attempt", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const post = await makePost(`ZZ Down ${STAMP}`);
    await queueSocialPosts(ctx, post.id, { facebook: true, instagram: false, consent: false });
    const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
    const net = fakeGraph({ fail: { "/feed": "throw" } });
    expect(await sendSocialPost(row, deps(net))).toMatchObject({ status: "QUEUED", error: { code: "NETWORK", detail: null } });
    await db.post.update({ where: { id: post.id }, data: { status: "TAKEN_DOWN" } });
    const graph = fakeGraph();
    expect(await sendSocialPost({ ...row, attempts: 1 }, deps(graph))).toMatchObject({ status: "FAILED", error: { code: "POST_GONE" } });
    expect(graph.calls).toHaveLength(0);
    await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
  });
});

describe("the picture Meta fetches, through the file route", () => {
  it("serves the queued copy's picture as a JPEG to anyone with the link, and nothing without it", async () => {
    const stored = await storeFile(new File([new Uint8Array(png)], "zz-social.png", { type: "image/png" }));
    try {
      const ctx = await as(ids.admin, "ADMIN");
      const post = await makePost(`ZZ File route ${STAMP}`, [{ fileId: stored.fileId, kind: "image", alt: "ZZ" }]);
      await queueSocialPosts(ctx, post.id, { facebook: false, instagram: true, consent: true });
      const row = await db.socialPost.findFirstOrThrow({ where: { postId: post.id } });
      __resetCookies(); // signed out, as Meta's fetcher is
      const url = (param: string) => `${ORIGIN}/api/files/${stored.fileId}?social=${encodeURIComponent(param)}`;
      const params = { params: Promise.resolve({ fileId: stored.fileId }) };
      const served = await fileGet(new Request(url(`${ids.school}.${row.id}.${row.pictureToken}`)), params);
      expect(served.status).toBe(200);
      expect(served.headers.get("content-type")).toBe("image/jpeg");
      expect(served.headers.get("cache-control")).toContain("no-store");
      const bytes = Buffer.from(await served.arrayBuffer());
      expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
      expect((await fileGet(new Request(url(`${ids.school}.${row.id}.${"y".repeat(32)}`)), params)).status).toBe(404);
      await db.socialPost.update({ where: { id: row.id }, data: { status: "FAILED" } });
      expect((await fileGet(new Request(url(`${ids.school}.${row.id}.${row.pictureToken}`)), params)).status).toBe(404);
    } finally {
      await deleteStoredFile(stored.fileId);
      await db.socialPost.deleteMany({ where: { schoolId: ids.school } });
    }
  });
});

describe("the Page token's daily check", () => {
  it("clears the mark when Meta answers, marks reconnect when it refuses, and leaves it when Meta is unreachable", async () => {
    await connectAgain();
    const scope = { schoolIds: [ids.school] };
    const cfg = metaConfig();
    const ok = fakeGraph();
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: ok.fetchImpl, cfg }, scope)).toMatchObject({ checked: 1, ok: 1, reconnect: 0 });
    expect(ok.calls[0]!.url.pathname).toMatch(/\/me$/);
    expect(ok.calls[0]!.url.searchParams.get("fields")).toBe("id");
    expect(ok.calls[0]!.url.searchParams.get("access_token")).toBe(PAGE_TOKEN);
    const refused = fakeGraph({ fail: { "/me": { status: 400, error: { message: "The session has been invalidated.", code: 190 } } } });
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: refused.fetchImpl, cfg }, scope)).toMatchObject({ reconnect: 1 });
    expect((await db.socialConnection.findUniqueOrThrow({ where: { schoolId: ids.school } })).error).toBe("RECONNECT");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.connection.status", actorUserId: null } })).toBe(1);
    const down = fakeGraph({ fail: { "/me": "throw" } });
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: down.fetchImpl, cfg }, scope)).toMatchObject({ unreachable: 1 });
    expect((await db.socialConnection.findUniqueOrThrow({ where: { schoolId: ids.school } })).error).toBe("RECONNECT");
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: ok.fetchImpl, cfg }, scope)).toMatchObject({ ok: 1 });
    expect((await db.socialConnection.findUniqueOrThrow({ where: { schoolId: ids.school } })).error).toBeNull();
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "social.connection.status" } })).toBe(2);
  });
});

describe("the catalog, the jobs, the words", () => {
  it("lists the four doors for the ADMIN alone, and the two OAuth routes outside the catalog", () => {
    const doors = ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/admin/social"));
    expect(doors.map((d) => `${d.method} ${d.path}`).sort()).toEqual(["DELETE /api/v1/admin/social", "GET /api/v1/admin/social", "GET /api/v1/admin/social/posts", "POST /api/v1/admin/social/posts/{socialPostId}/retry"]);
    for (const d of doors) expect(d.access).toEqual(["ADMIN"]);
    expect(OUTSIDE_THE_CATALOG.map((o) => o.path)).toEqual(expect.arrayContaining(["/api/social/meta/start", "/api/social/meta/callback"]));
  });

  it("sends every minute and checks tokens at 04:10, each narrowable to a school", () => {
    expect(JOBS["social:send"]).toMatchObject({ schedule: "* * * * *", describeKey: "root.jobDescSocialSend", narrows: ["schoolIds"] });
    expect(JOBS["social:refresh"]).toMatchObject({ schedule: "10 4 * * *", describeKey: "root.jobDescSocialRefresh", narrows: ["schoolIds"] });
  });

  it("has words for every audit row it writes", () => {
    for (const action of ["social.connect", "social.disconnect", "social.queue", "social.retry", "social.connection.status"]) expect(actionKey(action)).not.toBeNull();
  });

  it("words Meta's errors as codes and never as the token; trims text to Meta's limits", () => {
    expect(graphError(400, { error: { code: 190, message: "expired" } })).toEqual({ code: "RECONNECT", detail: "expired" });
    expect(graphError(403, { error: { code: 200, message: "no" } }).code).toBe("PERMISSION");
    expect(graphError(400, { error: { code: 9004, message: "bad url" } }).code).toBe("MEDIA");
    expect(graphError(400, { error: { code: 36003, error_subcode: 2207026, message: "ratio" } }).code).toBe("MEDIA");
    expect(graphError(502, null)).toEqual({ code: "META", detail: "HTTP 502" });
    expect(trimTo("a ".repeat(3000), 2200).length).toBeLessThanOrEqual(2200);
    expect(trimTo("short", 2200)).toBe("short");
  });
});
