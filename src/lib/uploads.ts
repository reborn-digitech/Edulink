import "server-only";
import { deleteStoredFile, storeFile, UploadError, type StoredFile } from "./storage";
import type { Attachment } from "./json";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Turning picked files into stored attachments.
 *
 * Three screens now upload: the bulletin, assignments and hand-ins. They share
 * this because the interesting part is not storing a file, it is what happens
 * when the *second* one fails — without a rollback the first is already on disk
 * with nothing referencing it, and `files.ts` denies anything no record claims,
 * so it becomes a byte-for-byte leak that no user can ever see or delete.
 *
 * A `fileId` is minted here and returned to the caller to persist alongside the
 * record it belongs to. It is never accepted from a client: `files.ts`
 * authorises a stored file by finding the record that mentions it, so a caller
 * able to name an arbitrary id could point their own row at somebody else's
 * attachment and inherit its audience. (§6, and the convention in the README)
 */

/** Total attachments per record. Matches the copy already shipped in the UI. */
export const MAX_ATTACHMENTS = 5;

/** Same rule as UploadError below it: the message is a KEY, the boundary owns the words. */
export class AttachmentError extends Error {
  constructor(
    readonly key: TranslationKey,
    readonly vars?: Record<string, string | number>,
  ) {
    super(key);
    this.name = "AttachmentError";
  }
}

/**
 * Stores every file, or none of them.
 *
 * Returns the attachments to persist. On any failure the partial writes are
 * removed and an `AttachmentError` carrying a message safe to show the uploader
 * is thrown.
 */
export async function storeAttachments(
  files: File[],
  opts: { max?: number } = {},
): Promise<Attachment[]> {
  const max = opts.max ?? MAX_ATTACHMENTS;
  const real = files.filter((file) => file instanceof File && file.size > 0);

  if (real.length === 0) return [];
  if (real.length > max) {
    throw new AttachmentError(max === 1 ? "ui.upToFilesOne" : "ui.upToFilesMany", { max });
  }

  const stored: StoredFile[] = [];
  try {
    for (const file of real) {
      stored.push(await storeFile(file));
    }
  } catch (error) {
    await discard(stored.map((s) => s.fileId));
    // UploadError messages are written for the person uploading; anything else
    // is ours and should not be shown to a child as-is.
    if (error instanceof UploadError) throw new AttachmentError(error.key, error.vars);
    throw error;
  }

  return stored.map((s) => ({
    fileId: s.fileId,
    name: s.name,
    size: s.size,
    mime: s.mime,
  }));
}

/**
 * Deletes stored files that nothing references any more.
 *
 * Used when a write fails after the bytes landed, and when a hand-in replaces
 * an earlier one — a child who re-submits should not leave their first attempt
 * sitting in storage forever, reachable by anyone who later reuses the id.
 */
export async function discard(fileIds: string[]): Promise<void> {
  await Promise.all(fileIds.map((id) => deleteStoredFile(id)));
}
