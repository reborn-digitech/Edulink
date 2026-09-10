import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { deleteStoredFile } from "./storage";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The school's logo: one stored file named on the School row.
 *
 * Two ways in, one way the row changes. The settings page crops in the
 * browser and uploads the PNG through its server action; the phone uploads
 * through POST /api/v1/uploads and then names the file it got back. Both end
 * in `setSchoolLogo`, which writes the row first and deletes the old file only
 * after — the reverse order would leave the school with no logo if the write
 * failed.
 */

/** Logos are small by nature; a 2 MB cap stops someone uploading a poster. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export type LogoResult =
  | { ok: true; logoPath: string | null }
  | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number> };

function adminSchool(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  return ctx.schoolId;
}

/** Points the school at a file already stored; deletes the file it replaces. */
export async function setSchoolLogo(ctx: ActiveContext, storedFileId: string): Promise<LogoResult> {
  const schoolId = adminSchool(ctx);
  const previous = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { logoPath: true } });

  try {
    await db.school.update({ where: { id: schoolId }, data: { logoPath: storedFileId } });
  } catch (error) {
    // Do not leave an orphan on disk if the row did not take.
    await deleteStoredFile(storedFileId);
    console.error("[setSchoolLogo] db write failed", error);
    return { ok: false, errorKey: "settings.couldNotSaveImage" };
  }

  if (previous.logoPath && previous.logoPath !== storedFileId) {
    await deleteStoredFile(previous.logoPath);
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "school.logo.update",
    targetType: "School",
    targetId: schoolId,
  });
  return { ok: true, logoPath: storedFileId };
}

/**
 * The phone's way in: a file this person uploaded (their UploadTicket, not
 * yet spent) becomes the logo, and the ticket is spent so the same id cannot
 * be named twice. Somebody else's file id is "not found", as it is for a post.
 */
export async function adoptLogoUpload(ctx: ActiveContext, fileId: string): Promise<LogoResult> {
  adminSchool(ctx);
  const ticket = await db.uploadTicket.findFirst({
    where: { fileId, userId: ctx.user.id, consumedAt: null },
    select: { fileId: true, mime: true, size: true },
  });
  if (!ticket) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!ticket.mime.startsWith("image/") || ticket.mime === "image/svg+xml") return { ok: false, errorKey: "settings.mustBeImage" };
  if (ticket.size > LOGO_MAX_BYTES) return { ok: false, errorKey: "refusal.fileTooLargeLimit", errorVars: { mb: 2 } };

  const spent = await db.uploadTicket.updateMany({ where: { fileId: ticket.fileId, consumedAt: null }, data: { consumedAt: new Date() } });
  if (spent.count === 0) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  return setSchoolLogo(ctx, ticket.fileId);
}

/** Takes the logo off the school and deletes the file. No logo is already the end state. */
export async function removeSchoolLogo(ctx: ActiveContext): Promise<{ ok: true }> {
  const schoolId = adminSchool(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { logoPath: true } });
  if (!school.logoPath) return { ok: true };

  await db.school.update({ where: { id: schoolId }, data: { logoPath: null } });
  await deleteStoredFile(school.logoPath);

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "school.logo.remove",
    targetType: "School",
    targetId: schoolId,
  });
  return { ok: true };
}
