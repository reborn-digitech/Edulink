import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { forSchool } from "./tenant-context";
import { isModuleOn } from "./modules";
import { siteEditor } from "./site-admin";
import { appUrl, draftConfigFor, SITE_POST_WHERE } from "./site-publish";
import { readJsonArray, type MediaItem } from "./json";
import type { ActiveContext } from "./session";

/**
 * A LINK TO REVIEW THE WEBSITE'S DRAFT, SIGNED OUT (website-two, 16 October 2026). The office or the head makes one
 * from the editor's header so a principal or a colleague can read the draft before it is published, with no account:
 * /sites/review/<token>, read-only, never indexed, never cached, valid up to seven days, revocable; making a new link
 * revokes the one before it, so one link is open at a time. Only the token's SHA-256 is stored, so the link is shown
 * once, when it is made. The review route finds the school by the hash (a live row is readable with no session,
 * GLOBALLY_READABLE in scripts/gen-rls.ts) and renders the draft under the school's own binding; the module must be on.
 * Making and revoking are audited (site.share.create, site.share.revoke).
 */

export const SITE_SHARE_MAX_DAYS = 7;
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");

export type SiteShareRow = { id: string; createdAt: Date; expiresAt: Date; byName: string | null };

/** Make a review link, revoking any still open; the URL (with the token) is returned this once. */
export async function createSiteShare(ctx: ActiveContext, days: number, now: Date = new Date()): Promise<{ id: string; url: string; expiresAt: Date }> {
  const ed = await siteEditor(ctx);
  const span = Math.max(1, Math.min(SITE_SHARE_MAX_DAYS, Math.floor(days)));
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + span * 24 * 60 * 60_000);
  const made = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.schoolSiteShare.updateMany({ where: { schoolId: ed.schoolId, revokedAt: null }, data: { revokedAt: now } });
    return tx.schoolSiteShare.create({ data: { schoolId: ed.schoolId, tokenHash: hashOf(token), createdByUserId: ed.userId, expiresAt }, select: { id: true } });
  });
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.share.create", targetType: "SchoolSiteShare", targetId: made.id, meta: { days: span } });
  return { id: made.id, url: `${appUrl()}/sites/review/${token}`, expiresAt };
}

/** The links still open: neither revoked nor expired. */
export async function siteShares(ctx: ActiveContext, now: Date = new Date()): Promise<SiteShareRow[]> {
  const ed = await siteEditor(ctx);
  const rows = await db.schoolSiteShare.findMany({ where: { schoolId: ed.schoolId, revokedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, expiresAt: true, createdByUserId: true } });
  const people = rows.length ? await db.user.findMany({ where: { id: { in: rows.map((r) => r.createdByUserId) } }, select: { id: true, name: true } }) : [];
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt, expiresAt: r.expiresAt, byName: nameOf.get(r.createdByUserId) ?? null }));
}

/** Revoke a link; the review route answers 404 from the next request. A link already closed is not found. */
export async function revokeSiteShare(ctx: ActiveContext, shareId: string, now: Date = new Date()): Promise<void> {
  const ed = await siteEditor(ctx);
  const done = await db.schoolSiteShare.updateMany({ where: { id: shareId, schoolId: ed.schoolId, revokedAt: null }, data: { revokedAt: now } });
  if (done.count === 0) throw new AccessError("siteEditor.shareNotFound", "NOT_FOUND");
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.share.revoke", targetType: "SchoolSiteShare", targetId: shareId });
}

/** The school a review token opens, or null: unknown, revoked, expired, or the module off. Signed out. */
export async function schoolForReviewToken(token: string, now: Date = new Date()): Promise<string | null> {
  if (!TOKEN.test(token)) return null;
  const row = await db.schoolSiteShare.findFirst({ where: { tokenHash: hashOf(token), revokedAt: null, expiresAt: { gt: now } }, select: { schoolId: true } });
  if (!row) return null;
  // The school id is the database's own answer, so binding to it is the rule tenant-context.ts asks for.
  return (await forSchool(row.schoolId, () => isModuleOn(row.schoolId, "WEBSITE"))) ? row.schoolId : null;
}

/**
 * The file route's question for a picture on a review page (?review=<token>): open while the link is, and only for a
 * file the school's draft names or uploaded for its site.
 */
export async function siteReviewFileOpen(fileId: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  const schoolId = await schoolForReviewToken(token);
  if (!schoolId) return false;
  return forSchool(schoolId, async () => {
    const uploaded = await db.schoolSiteFile.count({ where: { schoolId, fileId } });
    if (uploaded > 0) return true;
    const named = await db.schoolSite.count({ where: { schoolId, configJson: { contains: `"fileId":"${fileId}"` } } });
    if (named > 0) return true;
    // website-three (17 Oct 2026): a faculty member's photo on the page they published, which the draft's Faculty page shows.
    if ((await db.facultyPublicProfile.count({ where: { schoolId, publicPhotoFileId: fileId } })) > 0) return true;
    // TA-394: a news item's picture, the first picture of a post the draft names by id only (a first draft never saved too).
    const { config } = await draftConfigFor(schoolId);
    if (config.newsPostIds.length === 0) return false;
    const posts = await db.post.findMany({ where: { schoolId, id: { in: config.newsPostIds }, ...SITE_POST_WHERE }, select: { media: true } });
    return posts.some((p) => readJsonArray<MediaItem>(p.media).find((m) => m && m.kind === "image" && typeof m.fileId === "string" && m.fileId.length > 0)?.fileId === fileId);
  });
}
