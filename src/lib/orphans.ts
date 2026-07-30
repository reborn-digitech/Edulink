import "server-only";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { db } from "./db";
import { readAttachments, readMedia } from "./files";

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
 * THE ORDER BELOW IS THE SAFETY PROPERTY. The disk is listed BEFORE the
 * references are read:
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

/**
 * Resolved per call rather than at import.
 *
 * `storage.ts` can bind its root once because it only ever writes where the app
 * is configured to write. This one DELETES, and a test that cannot point it at
 * a scratch directory has to be run against the real store — which is how a
 * suite ends up quietly reclaiming files it did not create.
 */
function storageRoot(): string {
  return resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");
}

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
};

/**
 * Every file id any record currently points at.
 *
 * These four are exactly the four branches in `authorizeFileRead`. THEY MUST
 * STAY IN STEP: a new kind of attachment that is added there but not here makes
 * this sweep delete live files. `tests/orphans.test.ts` pins one of each kind so
 * that dropping one of these queries fails loudly.
 */
async function referencedFileIds(): Promise<Set<string>> {
  const ids = new Set<string>();

  const [schools, assignments, submissions, posts] = await Promise.all([
    db.school.findMany({ where: { logoPath: { not: null } }, select: { logoPath: true } }),
    db.assignment.findMany({ select: { attachments: true } }),
    db.submission.findMany({ select: { attachments: true } }),
    db.post.findMany({ select: { media: true } }),
  ]);

  for (const school of schools) if (school.logoPath) ids.add(school.logoPath);
  for (const row of assignments) for (const a of readAttachments(row.attachments)) ids.add(a.fileId);
  for (const row of submissions) for (const a of readAttachments(row.attachments)) ids.add(a.fileId);
  for (const row of posts) for (const m of readMedia(row.media)) ids.add(m.fileId);

  return ids;
}

/** Everything under the shard directories, with the size and mtime of each. */
async function listStored(): Promise<{ files: OrphanCandidate[]; unrecognised: string[] }> {
  const files: OrphanCandidate[] = [];
  const unrecognised: string[] = [];

  const root = storageRoot();
  const shards = await readdir(root).catch(() => [] as string[]);
  for (const shard of shards) {
    const shardPath = join(root, shard);
    const entries = await readdir(shardPath).catch(() => [] as string[]);
    for (const entry of entries) {
      if (!STORED_NAME.test(entry)) {
        unrecognised.push(join(shard, entry));
        continue;
      }
      const info = await stat(join(shardPath, entry)).catch(() => null);
      if (!info?.isFile()) continue;
      files.push({ fileId: entry, bytes: info.size, modifiedAt: info.mtime });
    }
  }

  return { files, unrecognised };
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
  const { files, unrecognised } = await listStored();
  const referenced = await referencedFileIds();

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
      // this cannot address a path outside the storage root.
      const target = join(storageRoot(), orphan.fileId.slice(0, 2), orphan.fileId);
      try {
        await unlink(target);
        deleted.push(orphan.fileId);
        bytesReclaimed += orphan.bytes;
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
  };
}
