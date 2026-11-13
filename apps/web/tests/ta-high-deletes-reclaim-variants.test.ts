/**
 * TA-139, the reclaim's half (with TA-008): the nightly sweep deletes originals
 * itself in src/lib/orphans.ts, and left their 320, 640 and 1280 pixel copies
 * in the variants namespace for good. Now an orphan's copies go with it, and a
 * copy whose original is already gone is removed once it is past the grace
 * window; a copy of a live picture, a fresh copy and a name storage.ts would
 * not write are left alone, and a dry run deletes nothing.
 *
 * The store is a scratch directory under the system's temp folder (and its
 * "-variants" sibling), never the app's; the live picture is the logo of a
 * scratch ZZ school of this suite's own, removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const STORE = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const root = join(tmpdir(), `zz-ta139-store-${Date.now()}`);
  process.env.STORAGE_DIR = root;
  return { root, variants: `${root}-variants` };
});

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { blobStore } from "@/lib/blob-store";
import { reclaimOrphans, type OrphanReport } from "@/lib/orphans";

const db = new PrismaClient();
const STAMP = Date.now();
const OLD = 2 * 60 * 60 * 1000;

const ORPHAN = `${randomUUID()}.png`; // no record names it: goes, with its three copies
const LIVE = `${randomUUID()}.png`; // the scratch school's logo: stays, with its copy
const GONE = `${randomUUID()}.jpg`; // deleted long ago: only an old copy is left
const GONE_FRESH = `${randomUUID()}.webp`; // only a copy made a moment ago is left
const NOT_OURS = `${GONE.slice(0, 2)}/notes.webp`;
const copy = (fileId: string, width: number) => `${fileId.slice(0, 2)}/${fileId}.w${width}.webp`;

async function put(root: string, name: string, ageMs: number): Promise<void> {
  const target = join(root, name);
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, Buffer.from("bytes"));
  const when = new Date(Date.now() - ageMs);
  await utimes(target, when, when);
}
const there = (root: string, name: string) => stat(join(root, name)).then(() => true, () => false);

let schoolId = "";
let dry: OrphanReport;
let wet: OrphanReport;

beforeAll(async () => {
  if (blobStore("files").describe() !== STORE.root || blobStore("variants").describe() !== STORE.variants) throw new Error("not this suite's scratch store: nothing swept");
  schoolId = (await db.school.create({ data: { name: `ZZ TA Variants School ${STAMP}`, slug: `zz-thdv-${STAMP}`, code: `ZZTHDV${STAMP}`, contactEmail: `zz-thdv-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true, logoPath: LIVE }, select: { id: true } })).id;

  await put(STORE.root, `${ORPHAN.slice(0, 2)}/${ORPHAN}`, OLD);
  await put(STORE.root, `${LIVE.slice(0, 2)}/${LIVE}`, OLD);
  for (const width of [320, 640, 1280]) await put(STORE.variants, copy(ORPHAN, width), OLD);
  await put(STORE.variants, copy(LIVE, 320), OLD);
  await put(STORE.variants, copy(GONE, 640), OLD);
  await put(STORE.variants, copy(GONE_FRESH, 320), 0);
  await put(STORE.variants, NOT_OURS, OLD);

  dry = await reclaimOrphans({ dryRun: true });
  wet = await reclaimOrphans({ dryRun: false });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
  await rm(STORE.root, { recursive: true, force: true });
  await rm(STORE.variants, { recursive: true, force: true });
});

describe("TA-139: the reclaim and the resized copies", () => {
  it("TA-139: a dry run counts the copy whose original is gone and deletes nothing", async () => {
    expect({ scanned: dry.scanned, orphans: dry.orphans.map((o) => o.fileId), staleVariants: dry.staleVariants, variantsDeleted: dry.variantsDeleted }).toEqual({ scanned: 2, orphans: [ORPHAN], staleVariants: 1, variantsDeleted: 0 });
  });

  it("TA-139: an orphan's three copies go with it", async () => {
    expect(wet.deleted).toEqual([ORPHAN]);
    expect({ original: await there(STORE.root, `${ORPHAN.slice(0, 2)}/${ORPHAN}`), w320: await there(STORE.variants, copy(ORPHAN, 320)), w640: await there(STORE.variants, copy(ORPHAN, 640)), w1280: await there(STORE.variants, copy(ORPHAN, 1280)) }).toEqual({ original: false, w320: false, w640: false, w1280: false });
  });

  it("TA-139: an old copy whose original is already gone is removed", async () => {
    expect({ staleVariants: wet.staleVariants, variantsDeleted: wet.variantsDeleted, copy: await there(STORE.variants, copy(GONE, 640)) }).toEqual({ staleVariants: 1, variantsDeleted: 1, copy: false });
  });

  it("TA-139: a live picture's copy, a fresh copy and a name storage.ts would not write stay", async () => {
    expect({ live: await there(STORE.root, `${LIVE.slice(0, 2)}/${LIVE}`), liveCopy: await there(STORE.variants, copy(LIVE, 320)), freshCopy: await there(STORE.variants, copy(GONE_FRESH, 320)), notOurs: await there(STORE.variants, NOT_OURS) }).toEqual({ live: true, liveCopy: true, freshCopy: true, notOurs: true });
  });
});
