"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { deleteStoredFile, storeFile, UploadError } from "@/lib/storage";
import { schoolDetailsSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";

export type SettingsState = { ok: boolean; errors: FieldErrors };

/** Logos are small by nature; a 2 MB cap stops someone uploading a poster. */
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export async function saveSchoolDetails(input: unknown): Promise<SettingsState> {
  let ctx;
  try {
    ctx = await requireApiRole("ADMIN");
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    throw error;
  }

  const parsed = schoolDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;

  await db.school.update({
    where: { id: ctx.schoolId },
    data: {
      name: d.name,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone || null,
      website: d.website || null,
      addressLine: d.addressLine || null,
      city: d.city || null,
      region: d.region || null,
      postalCode: d.postalCode || null,
      country: d.country || null,
      gradeLow: d.gradeLow || null,
      gradeHigh: d.gradeHigh || null,
      timezone: d.timezone,
      brandPrimary: d.brandPrimary || null,
    },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "school.settings.update",
    targetType: "School",
    targetId: ctx.schoolId,
    meta: { name: d.name, timezone: d.timezone, brand: d.brandPrimary || null },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, errors: {} };
}

export type LogoState = { ok: boolean; error?: string; logoPath?: string };

/**
 * Replaces the school logo.
 *
 * Takes FormData rather than a typed object because a File cannot cross a server
 * action boundary any other way. The old file is deleted only AFTER the new row
 * is committed — the reverse order would leave the school with no logo if the
 * write failed.
 */
export async function uploadLogo(formData: FormData): Promise<LogoState> {
  let ctx;
  try {
    ctx = await requireApiRole("ADMIN");
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image first." };

  let storedFileId: string;
  try {
    const result = await storeFile(file, { maxBytes: LOGO_MAX_BYTES });
    if (result.kind !== "image") {
      await deleteStoredFile(result.fileId);
      return { ok: false, error: "That needs to be an image, not a document." };
    }
    storedFileId = result.fileId;
  } catch (error) {
    // UploadError messages are written for the person uploading, so pass them
    // through rather than replacing them with something generic.
    if (error instanceof UploadError) return { ok: false, error: error.message };
    console.error("[uploadLogo]", error);
    return { ok: false, error: "We could not save that image." };
  }

  const previous = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { logoPath: true },
  });

  try {
    await db.school.update({
      where: { id: ctx.schoolId },
      data: { logoPath: storedFileId },
    });
  } catch (error) {
    // Do not leave an orphan on disk if the row did not take.
    await deleteStoredFile(storedFileId);
    console.error("[uploadLogo] db write failed", error);
    return { ok: false, error: "We could not save that image." };
  }

  if (previous.logoPath && previous.logoPath !== storedFileId) {
    await deleteStoredFile(previous.logoPath);
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "school.logo.update",
    targetType: "School",
    targetId: ctx.schoolId,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, logoPath: storedFileId };
}

export async function removeLogo(): Promise<LogoState> {
  try {
    const ctx = await requireApiRole("ADMIN");

    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { logoPath: true },
    });
    if (!school.logoPath) return { ok: true };

    await db.school.update({ where: { id: ctx.schoolId }, data: { logoPath: null } });
    await deleteStoredFile(school.logoPath);

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "school.logo.remove",
      targetType: "School",
      targetId: ctx.schoolId,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[removeLogo]", error);
    return { ok: false, error: "Something went wrong." };
  }
}
