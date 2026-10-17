import "server-only";
import type { SiteFileUse } from "@edulink/contracts";
import { db } from "./db";
import { storeFile, UploadError, deleteStoredFile } from "./storage";
import { siteEditor } from "./site-admin";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { readJson } from "./json";
import { draftFileUses } from "./site-content";
import { forgetFileInOldVersions } from "./site-publish";
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

export type SiteFileRow = { fileId: string; kind: "IMAGE" | "PDF"; name: string; size: number; createdAt: Date; usedBy: { use: SiteFileUse; label: string }[] };
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
  return { ok: true, file: { ...row, kind, usedBy: [] } };
}

/**
 * WHERE EACH FILE IS USED (website-three, 17 Oct 2026): the saved draft's parts that name it (draftFileUses) and the live
 * site when a page of it shows the file (SchoolSiteVersion.imageFileIds). The editor's own unsaved changes are its own
 * to show; this is what the server holds.
 */
async function usesFor(schoolId: string): Promise<Map<string, { use: SiteFileUse; label: string }[]>> {
  const [site, live] = await Promise.all([
    db.schoolSite.findUnique({ where: { schoolId }, select: { configJson: true } }),
    db.schoolSiteVersion.findFirst({ where: { schoolId, liveAt: { not: null } }, select: { imageFileIds: true } }),
  ]);
  // The stored draft as it stands; a field that does not read is simply not counted (the editor repairs it on open).
  const config = readJson<Parameters<typeof draftFileUses>[0] | null>(site?.configJson, null);
  const uses = new Map<string, { use: SiteFileUse; label: string }[]>();
  if (config) {
    try {
      const raw = config as Partial<Parameters<typeof draftFileUses>[0]>;
      const safe = { ...raw, heroPicture: raw.heroPicture ?? null, facilities: raw.facilities ?? [], albums: raw.albums ?? [], achievements: raw.achievements ?? [], prospectusFileId: raw.prospectusFileId ?? null, downloads: raw.downloads ?? [] } as Parameters<typeof draftFileUses>[0];
      for (const [fileId, list] of draftFileUses(safe)) uses.set(fileId, list);
    } catch {
      // A hand-edited draft of the wrong shape names nothing here.
    }
  }
  for (const fileId of live?.imageFileIds ?? []) uses.set(fileId, [...(uses.get(fileId) ?? []), { use: "LIVE", label: "" }]);
  return uses;
}

/** The files uploaded for the site, newest first, each with where it is used. */
export async function siteFiles(ctx: ActiveContext): Promise<SiteFileRow[]> {
  const ed = await siteEditor(ctx);
  const [rows, uses] = await Promise.all([
    db.schoolSiteFile.findMany({ where: { schoolId: ed.schoolId }, orderBy: { createdAt: "desc" }, take: SITE_FILES_MAX, select: { fileId: true, kind: true, name: true, size: true, createdAt: true } }),
    usesFor(ed.schoolId),
  ]);
  return rows.map((r) => ({ ...r, kind: r.kind === "PDF" ? "PDF" : "IMAGE", usedBy: uses.get(r.fileId) ?? [] }));
}

export type SiteFileDeleteResult = { ok: true } | { ok: false; status: 409; errorKey: TranslationKey; usedBy: { use: SiteFileUse; label: string }[] };

/**
 * DELETE A FILE UPLOADED FOR THE SITE (website-three, 17 Oct 2026), from the editor's Files panel: refused while the saved
 * draft or the live site uses it (409, naming where), so a page never loses its picture or its PDF under it; otherwise
 * the row and the stored bytes go at once, and the versions kept from before forget it (site-publish.ts, their one
 * writer), so the orphan sweep does not report bytes missing for a page nobody serves; an older version restored as the
 * draft draws without it. The 120-file cap counts what is left. Audited site.file.delete.
 */
export async function deleteSiteFile(ctx: ActiveContext, fileId: string): Promise<SiteFileDeleteResult> {
  const ed = await siteEditor(ctx);
  const row = await db.schoolSiteFile.findFirst({ where: { schoolId: ed.schoolId, fileId }, select: { id: true, kind: true } });
  if (!row) throw new AccessError("siteThree.fileNotFound", "NOT_FOUND");
  const usedBy = (await usesFor(ed.schoolId)).get(fileId) ?? [];
  if (usedBy.length) return { ok: false, status: 409, errorKey: "siteThree.refuseFileInUse", usedBy };
  await db.schoolSiteFile.delete({ where: { id: row.id } });
  await forgetFileInOldVersions(ed.schoolId, fileId);
  await deleteStoredFile(fileId);
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.file.delete", targetType: "SchoolSiteFile", targetId: row.id, meta: { kind: row.kind } });
  return { ok: true };
}
