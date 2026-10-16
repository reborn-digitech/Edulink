import "server-only";
import { db } from "./db";
import { storeFile, UploadError, deleteStoredFile } from "./storage";
import { siteEditor } from "./site-admin";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * FILES UPLOADED FOR A SCHOOL'S WEBSITE (website-two, 16 October 2026): a picture (the hero, a facility, an album, an
 * achievement) or a PDF (the prospectus, the downloads), uploaded by the office or the head from the editor. The bytes
 * go through the one store (storage.ts: sniffed, EXIF stripped, 5 MB at most) and a SchoolSiteFile row names them for
 * the school, so the file route lets the office and the head read a file that is only in the draft (files.ts), the
 * orphan sweep keeps it (orphans.ts), and the save accepts it where the draft names it (site-admin.ts). It becomes
 * public only while a live page shows it (SchoolSiteVersion.imageFileIds). A picture of people is shown only with
 * the consent tick where the draft uses it (decision 0002); uploading is not publishing.
 */

export const SITE_FILE_MAX_BYTES = 5 * 1024 * 1024;
/** Files a school's site keeps at most: a site needs a handful, and a cap stops the store becoming a drive. */
export const SITE_FILES_MAX = 120;

export type SiteFileRow = { fileId: string; kind: "IMAGE" | "PDF"; name: string; size: number; createdAt: Date };
export type SiteFileResult = { ok: true; file: SiteFileRow } | { ok: false; errorKey: TranslationKey; vars?: Record<string, string | number> };

/** Store an uploaded picture or PDF for the site. `want` is what the editor's control asked for. */
export async function uploadSiteFile(ctx: ActiveContext, file: File, want: "IMAGE" | "PDF"): Promise<SiteFileResult> {
  const ed = await siteEditor(ctx);
  if ((await db.schoolSiteFile.count({ where: { schoolId: ed.schoolId } })) >= SITE_FILES_MAX) return { ok: false, errorKey: "siteEditor.refuseTooManyFiles", vars: { max: SITE_FILES_MAX } };
  let stored;
  try {
    stored = await storeFile(file, { maxBytes: SITE_FILE_MAX_BYTES });
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, errorKey: error.key, vars: error.vars };
    throw error;
  }
  const kind = stored.mime === "application/pdf" ? "PDF" : stored.kind === "image" && stored.mime !== "image/gif" ? "IMAGE" : null;
  if (kind !== want) {
    await deleteStoredFile(stored.fileId);
    return { ok: false, errorKey: want === "PDF" ? "siteEditor.refuseNotPdf" : "siteEditor.refuseNotPicture" };
  }
  const row = await db.schoolSiteFile.create({
    data: { schoolId: ed.schoolId, fileId: stored.fileId, kind, mime: stored.mime, size: stored.size, name: stored.name, uploadedByUserId: ed.userId },
    select: { fileId: true, kind: true, name: true, size: true, createdAt: true },
  });
  return { ok: true, file: { ...row, kind } };
}

/** The files uploaded for the site, newest first. */
export async function siteFiles(ctx: ActiveContext): Promise<SiteFileRow[]> {
  const ed = await siteEditor(ctx);
  const rows = await db.schoolSiteFile.findMany({ where: { schoolId: ed.schoolId }, orderBy: { createdAt: "desc" }, take: SITE_FILES_MAX, select: { fileId: true, kind: true, name: true, size: true, createdAt: true } });
  return rows.map((r) => ({ ...r, kind: r.kind === "PDF" ? "PDF" : "IMAGE" }));
}
