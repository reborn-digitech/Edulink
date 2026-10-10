import "server-only";
import { db } from "./db";
import { readAttachments, readMedia } from "./files";
import { blobStore } from "./blob-store";

/**
 * Reclaiming stored files that nothing references any more.
 *
 * Deleting a post or an assignment leaves its bytes on disk. They are already
 * unreachable — `authorizeFileRead` denies anything no record claims, and there
 * is a test for exactly that — so this is a disk problem, not a disclosure one.
 * That is also why it is a deliberate sweep rather than a cascade: a cascade
 * that fires on the wrong delete destroys a child's work with no way back,
 * whereas an unreferenced file costs kilobytes until someone runs this.
 *
 * THE ORDER BELOW IS THE SAFETY PROPERTY. The store — a disk or a bucket,
 * blob-store.ts decides — is listed BEFORE the references are read:
 *
 *   * list disk (t0) → read references (t1)
 *   * a file written after t0 is not a candidate at all;
 *   * a reference written between t0 and t1 is still seen.
 *
 * Reading references first would invert both, and an upload landing mid-scan
 * would be deleted out from under the request that was still writing its row.
 * The grace window below is the second belt: nothing recently modified is ever
 * a candidate, however the scan interleaved.
 */

/*
 * The store is resolved per call (blob-store.ts reads the environment when
 * asked), which is what lets the test point this sweep — the one thing here
 * that DELETES — at a scratch directory rather than the real store.
 */

/** Only ever a UUID plus a known extension — the same shape storage.ts writes. */
const STORED_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i;

/**
 * How recently a file may have been touched and still be left alone.
 *
 * An upload writes bytes first and the row that references them a moment later.
 * An hour is far longer than that gap and costs nothing but a later sweep.
 */
export const DEFAULT_GRACE_MS = 60 * 60 * 1000;

export type OrphanCandidate = {
  fileId: string;
  bytes: number;
  modifiedAt: Date;
};

export type OrphanReport = {
  /** Files on disk matching the stored-name shape. */
  scanned: number;
  /** Distinct file ids referenced by some record. */
  referenced: number;
  /** Unreferenced, and older than the grace window. */
  orphans: OrphanCandidate[];
  /** Unreferenced but too recent to touch — probably mid-upload. */
  skippedRecent: number;
  /** Names in the storage tree that storage.ts did not write. Never deleted. */
  unrecognised: string[];
  /** Empty unless `dryRun` was false. */
  deleted: string[];
  bytesReclaimed: number;
  /** Files some record points at whose bytes are NOT on disk. See below. */
  missing: number;
  /**
   * The sweep's per-school story, and it is the INVERSE of the orphans. An
   * orphan belongs to nobody by definition — no record claims it, so there is
   * no school to tell. But a reference whose bytes are gone is the opposite
   * failure, it has an owner, and it is the one a school must hear about: a
   * submission or an attachment somebody will one day click is not there.
   * Zero-missing schools are absent, so absence stays health.
   */
  perSchool: Record<string, { missing: number }>;
};

/**
 * EVERY COLUMN A STORED FILE IS REFERENCED FROM, named `model.column` — exactly the lookups
 * `authorizeFileRead` (files.ts) makes by a file's id. THEY MUST STAY IN STEP: a kind of file served there
 * and not claimed here is a live file this sweep deletes. It drifted once already: by 11 October 2026 the
 * route served admission documents, expert KYC, scholarship claims, studio work, offer letters, internship
 * files and IQAC files that no line here claimed, so a non-dry sweep would have deleted every one of them
 * (integration, 11 Oct 2026). `tests/orphans-kinds.test.ts` reads the lookups out of authorizeFileRead's
 * source and fails when the two lists differ; the `Record` below fails to compile when a name has no reader.
 */
export const FILE_REFERENCES = [
  "school.logoPath",
  "quizQuestion.imageKey",
  "quizQuestion.translations.imageKey",
  "submission.attachments",
  "application.documentsJson",
  "expertProfile.kycDocumentIds",
  "collegeApplication.documentsJson",
  "scholarshipClaim.documentsJson",
  "purchaseRecord.billFileId",
  "attendanceCondonation.documentFileId",
  "courseFileItem.fileId",
  "studioSubmission.fileId",
  "offer.letterFileId",
  "internship.reportFileId",
  "internship.parentDeclarationFileId",
  "iqacFile.fileId",
  "assignment.attachments",
  "post.media",
] as const;

export type FileReference = (typeof FILE_REFERENCES)[number];

/** The file ids a JSON column names, whatever its shape (`[{"fileId":…}]` or `{"marksheet":{"fileId":…}}`). */
function fileIdsInJson(raw: string | null | undefined): string[] {
  return [...(raw ?? "").matchAll(/"fileId"\s*:\s*"([^"]+)"/g)].map((m) => m[1]!);
}

type Claimed = { fileId: string | null | undefined; schoolId: string | null }[];

/** One reader per column: the claimed file ids with the school whose record claims them (null: nobody's, e.g. the shared quiz bank). */
const READERS: Record<FileReference, () => Promise<Claimed>> = {
  "school.logoPath": async () => (await db.school.findMany({ where: { logoPath: { not: null } }, select: { id: true, logoPath: true } })).map((r) => ({ fileId: r.logoPath, schoolId: r.id })),
  // figures (10 Oct 2026): the quiz bank's drawn figures, the question's and each translation's (no school: the bank is shared).
  "quizQuestion.imageKey": async () => (await db.quizQuestion.findMany({ where: { imageKey: { not: null } }, select: { imageKey: true } })).map((r) => ({ fileId: r.imageKey, schoolId: null })),
  "quizQuestion.translations.imageKey": async () => (await db.quizQuestionTranslation.findMany({ where: { imageKey: { not: null } }, select: { imageKey: true } })).map((r) => ({ fileId: r.imageKey, schoolId: null })),
  "submission.attachments": async () => (await db.submission.findMany({ select: { schoolId: true, attachments: true } })).flatMap((r) => readAttachments(r.attachments).map((a) => ({ fileId: a.fileId, schoolId: r.schoolId }))),
  "application.documentsJson": async () => (await db.application.findMany({ where: { documentsJson: { contains: '"fileId"' } }, select: { schoolId: true, documentsJson: true } })).flatMap((r) => fileIdsInJson(r.documentsJson).map((fileId) => ({ fileId, schoolId: r.schoolId }))),
  // An expert's KYC papers: the person's, no school's.
  "expertProfile.kycDocumentIds": async () => (await db.expertProfile.findMany({ where: { kycDocumentIds: { isEmpty: false } }, select: { kycDocumentIds: true } })).flatMap((r) => r.kycDocumentIds.map((fileId) => ({ fileId, schoolId: null }))),
  "collegeApplication.documentsJson": async () => (await db.collegeApplication.findMany({ where: { documentsJson: { contains: '"fileId"' } }, select: { schoolId: true, documentsJson: true } })).flatMap((r) => fileIdsInJson(r.documentsJson).map((fileId) => ({ fileId, schoolId: r.schoolId }))),
  "scholarshipClaim.documentsJson": async () => (await db.scholarshipClaim.findMany({ where: { documentsJson: { contains: '"fileId"' } }, select: { schoolId: true, documentsJson: true } })).flatMap((r) => fileIdsInJson(r.documentsJson).map((fileId) => ({ fileId, schoolId: r.schoolId }))),
  // A purchase record's scanned bill (the INVENTORY module).
  "purchaseRecord.billFileId": async () => (await db.purchaseRecord.findMany({ where: { billFileId: { not: null } }, select: { schoolId: true, billFileId: true } })).map((r) => ({ fileId: r.billFileId, schoolId: r.schoolId })),
  // A condonation's document and a course file's resources (the college's academics, 4 Oct 2026).
  "attendanceCondonation.documentFileId": async () => (await db.attendanceCondonation.findMany({ where: { documentFileId: { not: null } }, select: { schoolId: true, documentFileId: true } })).map((r) => ({ fileId: r.documentFileId, schoolId: r.schoolId })),
  "courseFileItem.fileId": async () => (await db.courseFileItem.findMany({ where: { fileId: { not: null } }, select: { schoolId: true, fileId: true } })).map((r) => ({ fileId: r.fileId, schoolId: r.schoolId })),
  // A studio submission's work (R-56, the studio half, 10 Oct 2026).
  "studioSubmission.fileId": async () => (await db.studioSubmission.findMany({ where: { fileId: { not: null } }, select: { schoolId: true, fileId: true } })).map((r) => ({ fileId: r.fileId, schoolId: r.schoolId })),
  // The placement cell's offer letters and internship papers.
  "offer.letterFileId": async () => (await db.offer.findMany({ where: { letterFileId: { not: null } }, select: { schoolId: true, letterFileId: true } })).map((r) => ({ fileId: r.letterFileId, schoolId: r.schoolId })),
  "internship.reportFileId": async () => (await db.internship.findMany({ where: { reportFileId: { not: null } }, select: { schoolId: true, reportFileId: true } })).map((r) => ({ fileId: r.reportFileId, schoolId: r.schoolId })),
  "internship.parentDeclarationFileId": async () => (await db.internship.findMany({ where: { parentDeclarationFileId: { not: null } }, select: { schoolId: true, parentDeclarationFileId: true } })).map((r) => ({ fileId: r.parentDeclarationFileId, schoolId: r.schoolId })),
  "iqacFile.fileId": async () => (await db.iqacFile.findMany({ select: { schoolId: true, fileId: true } })).map((r) => ({ fileId: r.fileId, schoolId: r.schoolId })),
  "assignment.attachments": async () => (await db.assignment.findMany({ select: { schoolId: true, attachments: true } })).flatMap((r) => readAttachments(r.attachments).map((a) => ({ fileId: a.fileId, schoolId: r.schoolId }))),
  "post.media": async () => (await db.post.findMany({ select: { schoolId: true, media: true } })).flatMap((r) => readMedia(r.media).map((m) => ({ fileId: m.fileId, schoolId: r.schoolId }))),
};

/**
 * Every file id any record currently points at, with the school to tell when its bytes are gone.
 *
 * First claimer wins the label; every claimer keeps the file alive either way. The empty string labels a
 * reference with no school to tell (a null-school post, the quiz bank, an expert's KYC) — still referenced,
 * still counted missing when gone, just nobody's card to land on.
 */
async function referencedFileIds(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const reference of FILE_REFERENCES) {
    for (const { fileId, schoolId } of await READERS[reference]()) {
      if (fileId && !ids.has(fileId)) ids.set(fileId, schoolId ?? "");
    }
  }
  return ids;
}

/** Everything in the originals namespace, with the size and mtime of each. */
async function listStored(): Promise<{ files: OrphanCandidate[]; unrecognised: string[]; rootReadable: boolean }> {
  const files: OrphanCandidate[] = [];
  const unrecognised: string[] = [];

  const store = blobStore("files");
  const rootReadable = await store.probe();
  if (rootReadable) {
    for await (const object of store.list()) {
      const entry = object.name.split("/").pop() ?? object.name;
      if (!STORED_NAME.test(entry) || object.name !== `${entry.slice(0, 2)}/${entry}`) {
        unrecognised.push(object.name);
        continue;
      }
      files.push({ fileId: entry, bytes: object.size, modifiedAt: object.modifiedAt });
    }
  }

  return { files, unrecognised, rootReadable };
}

/**
 * Finds — and optionally deletes — unreferenced files.
 *
 * `dryRun` defaults to TRUE. Reporting is the safe default for something whose
 * only failure mode is deleting a child's work; a caller has to say out loud
 * that it wants files removed.
 */
export async function reclaimOrphans(
  opts: { dryRun?: boolean; graceMs?: number } = {},
): Promise<OrphanReport> {
  const dryRun = opts.dryRun ?? true;
  const graceMs = opts.graceMs ?? DEFAULT_GRACE_MS;

  // Disk first — see the note at the top of this file.
  const { files, unrecognised, rootReadable } = await listStored();
  const referenced = await referencedFileIds();

  /**
   * AN UNREADABLE DISK IS NOT AN EMPTY ONE. Reading a root that is not there
   * as "no files" is right on a fresh deployment with nothing uploaded yet,
   * and wrong the moment the database says files exist: then the sweep has
   * been pointed at the wrong path, or the volume is not mounted, and a
   * nightly "done, nothing to reclaim" would keep the jobs page green while
   * the real disk fills. Deleting nothing is still the safe outcome; saying
   * "done" is not. A battery found this reporting a clean sweep of a file.
   */
  if (!rootReadable && referenced.size > 0) {
    throw new Error(`Storage (${blobStore("files").describe()}) is not readable, but ${referenced.size} file(s) are on record — nothing swept`);
  }

  // The other direction: a record whose bytes are not there. Only judged when
  // the disk actually answered — the unreadable-root case threw above.
  const onDisk = new Set(files.map((file) => file.fileId));
  let missing = 0;
  const perSchool: Record<string, { missing: number }> = {};
  if (rootReadable) {
    for (const [fileId, schoolId] of referenced) {
      if (onDisk.has(fileId)) continue;
      missing++;
      if (schoolId) (perSchool[schoolId] ??= { missing: 0 }).missing++;
    }
  }

  const cutoff = Date.now() - graceMs;
  let skippedRecent = 0;
  const orphans: OrphanCandidate[] = [];

  for (const file of files) {
    if (referenced.has(file.fileId)) continue;
    if (file.modifiedAt.getTime() > cutoff) {
      skippedRecent++;
      continue;
    }
    orphans.push(file);
  }

  const deleted: string[] = [];
  let bytesReclaimed = 0;

  if (!dryRun) {
    for (const orphan of orphans) {
      // Rebuilt from the validated name, never from anything user-supplied, so
      // this cannot address anything outside the originals namespace.
      try {
        await blobStore("files").delete(`${orphan.fileId.slice(0, 2)}/${orphan.fileId}`);
        deleted.push(orphan.fileId);
        bytesReclaimed += orphan.bytes;
        // A phone's unattached upload is an orphan like any other once the
        // grace has passed; its ticket must go with the bytes, or a later
        // post could attach a file that no longer exists.
        await db.uploadTicket.deleteMany({ where: { fileId: orphan.fileId } }).catch(() => {});
      } catch {
        // Already gone is the desired end state; anything else is reported by
        // simply not appearing in `deleted`.
      }
    }
  }

  return {
    scanned: files.length,
    referenced: referenced.size,
    orphans,
    skippedRecent,
    unrecognised,
    deleted,
    bytesReclaimed,
    missing,
    perSchool,
  };
}
