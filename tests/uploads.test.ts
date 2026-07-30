import { afterAll, describe, expect, it } from "vitest";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { storeAttachments, discard, AttachmentError, MAX_ATTACHMENTS } from "@/lib/uploads";

/**
 * Attachment storage, all-or-nothing.
 *
 * The property worth testing is the failure path. When the second of two files
 * is rejected, the first is already written — and because `files.ts` denies any
 * file no record claims, an orphan is invisible to every user and reclaimable by
 * nobody. So the test that matters is not "it stores files", it is "after a
 * failure, storage is exactly as it was".
 */

const ROOT = resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");
const written: string[] = [];

afterAll(async () => {
  await discard(written);
});

/** Every stored filename, across the 2-character shard directories. */
async function snapshot(): Promise<Set<string>> {
  const names = new Set<string>();
  const shards = await readdir(ROOT).catch(() => [] as string[]);
  for (const shard of shards) {
    const entries = await readdir(join(ROOT, shard)).catch(() => [] as string[]);
    for (const entry of entries) names.add(entry);
  }
  return names;
}

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ...Array.from({ length: 40 }, (_, i) => i),
]);
const PDF = Buffer.from([...Buffer.from("%PDF-1.7"), ...Array.from({ length: 40 }, () => 0x20)]);
/** Passes an extension check, fails a magic-byte one. */
const NOT_REALLY_A_PNG = Buffer.from("<?php echo 'hello'; ?>", "latin1");

function file(bytes: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("storing", () => {
  it("returns one attachment per file, with the sniffed mime", async () => {
    const result = await storeAttachments([
      file(PNG, "diagram.png", "image/png"),
      file(PDF, "worksheet.pdf", "application/pdf"),
    ]);
    written.push(...result.map((a) => a.fileId));

    expect(result).toHaveLength(2);
    expect(result[0]!.mime).toBe("image/png");
    expect(result[1]!.mime).toBe("application/pdf");
    // The display name is kept, but the stored id never is.
    expect(result[0]!.name).toBe("diagram.png");
    expect(result[0]!.fileId).toMatch(/^[0-9a-f-]{36}\.png$/);
  });

  it("ignores empty slots so an untouched picker is not an error", async () => {
    const result = await storeAttachments([file(Buffer.alloc(0), "nothing.png", "image/png")]);
    expect(result).toEqual([]);
  });

  it("refuses more than the cap", async () => {
    const many = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) =>
      file(PNG, `f${i}.png`, "image/png"),
    );
    const before = await snapshot();
    await expect(storeAttachments(many)).rejects.toBeInstanceOf(AttachmentError);
    // Rejected on the count, before anything was written.
    expect(await snapshot()).toEqual(before);
  });
});

describe("all or nothing", () => {
  it("⚠ writes nothing when a later file is rejected", async () => {
    const before = await snapshot();

    await expect(
      storeAttachments([
        file(PNG, "fine.png", "image/png"),
        file(NOT_REALLY_A_PNG, "sneaky.png", "image/png"),
      ]),
    ).rejects.toBeInstanceOf(AttachmentError);

    // The first file was already on disk when the second failed. If this set
    // has grown, that byte sequence is now unreachable and unreclaimable.
    expect(await snapshot()).toEqual(before);
  });

  it("reports the reason in words meant for the person uploading", async () => {
    await expect(
      storeAttachments([file(NOT_REALLY_A_PNG, "sneaky.png", "image/png")]),
    ).rejects.toThrow(/not supported/i);
  });
});

describe("discard", () => {
  it("removes stored files and tolerates ids that are already gone", async () => {
    const [attachment] = await storeAttachments([file(PNG, "temp.png", "image/png")]);
    const before = await snapshot();
    expect(before.has(attachment!.fileId)).toBe(true);

    await discard([attachment!.fileId]);
    expect((await snapshot()).has(attachment!.fileId)).toBe(false);

    // Called twice — replacing a hand-in should not fail because a file is
    // already missing.
    await expect(discard([attachment!.fileId])).resolves.toBeUndefined();
  });
});
