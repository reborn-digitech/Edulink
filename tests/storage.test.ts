import { afterAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { deleteStoredFile, etagFor, readStoredFile, storeFile, UploadError, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * File storage.
 *
 * This module was written early, carefully, and then never imported by anything
 * for the whole build — so none of its safety claims had ever executed. That is
 * exactly the shape of the three silent failures already found in this codebase,
 * so it gets tested before any screen depends on it.
 *
 * The claims under test:
 *   * content type comes from MAGIC BYTES, never the browser's Content-Type;
 *   * SVG is refused (it is an executable document, not an image);
 *   * the caller's filename is never used as a path;
 *   * a traversal-shaped fileId reads nothing.
 */

const stored: string[] = [];

afterAll(async () => {
  await Promise.all(stored.map((id) => deleteStoredFile(id)));
});

/** Minimal valid file headers, so we are testing the sniffing not a fixture. */
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
  ...Array.from({ length: 40 }, (_, i) => i), // filler
]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 40 }, () => 0x00)]);
const GIF = Buffer.from([...Buffer.from("GIF89a"), ...Array.from({ length: 40 }, () => 0x00)]);
const PDF = Buffer.from([...Buffer.from("%PDF-1.7"), ...Array.from({ length: 40 }, () => 0x20)]);
const WEBP = Buffer.from([
  ...Buffer.from("RIFF"),
  0x00, 0x00, 0x00, 0x00,
  ...Buffer.from("WEBP"),
  ...Array.from({ length: 30 }, () => 0x00),
]);

function file(bytes: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

async function keep(promise: ReturnType<typeof storeFile>) {
  const result = await promise;
  stored.push(result.fileId);
  return result;
}

describe("accepted types", () => {
  it("stores a PNG and reports the sniffed mime", async () => {
    const result = await keep(storeFile(file(PNG, "logo.png", "image/png")));
    expect(result.mime).toBe("image/png");
    expect(result.kind).toBe("image");
    expect(result.fileId).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(result.size).toBe(PNG.byteLength);
  });

  it("stores JPEG, GIF, WebP and PDF", async () => {
    const cases: [Buffer, string, string, "image" | "file"][] = [
      [JPEG, "a.jpg", "image/jpeg", "image"],
      [GIF, "a.gif", "image/gif", "image"],
      [WEBP, "a.webp", "image/webp", "image"],
      [PDF, "a.pdf", "application/pdf", "file"],
    ];
    for (const [bytes, name, mime, kind] of cases) {
      const result = await keep(storeFile(file(bytes, name, mime)));
      expect(result.mime, name).toBe(mime);
      expect(result.kind, name).toBe(kind);
    }
  });

  it("round-trips the exact bytes", async () => {
    const result = await keep(storeFile(file(PNG, "round.png", "image/png")));
    const read = await readStoredFile(result.fileId);
    expect(read).not.toBeNull();
    expect(read!.mime).toBe("image/png");
    expect(Buffer.compare(read!.bytes, PNG)).toBe(0);
  });
});

describe("content-type is sniffed, not trusted", () => {
  it("⚠ refuses a text file claiming to be a PNG", async () => {
    // The whole point: a browser-supplied Content-Type is attacker-controlled.
    const evil = Buffer.from('<?php system($_GET["c"]); ?>');
    await expect(storeFile(file(evil, "shell.png", "image/png"))).rejects.toBeInstanceOf(UploadError);
  });

  it("⚠ refuses an SVG even with a valid image content-type", async () => {
    // SVG is an executable document; a stored one becomes stored XSS.
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
    await expect(storeFile(file(svg, "logo.svg", "image/svg+xml"))).rejects.toBeInstanceOf(UploadError);
    await expect(storeFile(file(svg, "logo.png", "image/png"))).rejects.toBeInstanceOf(UploadError);
  });

  it("refuses HTML, JS and a zip disguised as an image", async () => {
    for (const [bytes, name] of [
      [Buffer.from("<!doctype html><script>alert(1)</script>"), "x.png"],
      [Buffer.from("alert(1)"), "x.jpg"],
      [Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]), "x.png"], // PK zip
    ] as [Buffer, string][]) {
      await expect(storeFile(file(bytes, name, "image/png")), name).rejects.toBeInstanceOf(UploadError);
    }
  });

  it("names the accepted formats in the error, so the message is actionable", async () => {
    await expect(storeFile(file(Buffer.from("nope"), "x.png", "image/png"))).rejects.toThrow(/PNG/);
  });
});

describe("size limits", () => {
  it("refuses an empty file", async () => {
    await expect(storeFile(file(Buffer.alloc(0), "empty.png", "image/png"))).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it("refuses a file over the limit", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_UPLOAD_BYTES + 1)]);
    await expect(storeFile(file(big, "big.png", "image/png"))).rejects.toBeInstanceOf(UploadError);
  });

  it("honours a caller-supplied lower limit", async () => {
    await expect(
      storeFile(file(PNG, "small.png", "image/png"), { maxBytes: 8 }),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it("states the limit in MB so the message is useful", async () => {
    // Must actually EXCEED the limit — an earlier version of this test passed a
    // 48-byte file against a 1 MB cap and asserted on a rejection that never
    // came.
    const overOneMb = Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]);
    await expect(
      storeFile(file(overOneMb, "big.png", "image/png"), { maxBytes: 1024 * 1024 }),
    ).rejects.toThrow(/1 MB/);
  });
});

describe("the caller's filename is never a path", () => {
  it("⚠ ignores a traversal filename entirely", async () => {
    const result = await keep(storeFile(file(PNG, "../../../../etc/passwd.png", "image/png")));
    // Stored name is a UUID; the original survives only as display metadata.
    expect(result.fileId).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(result.fileId).not.toContain("..");
    expect(result.fileId).not.toContain("/");
    // And the file really is readable at its safe id.
    expect(await readStoredFile(result.fileId)).not.toBeNull();
  });

  it("strips newlines from the display name (header injection)", async () => {
    const result = await keep(
      storeFile(file(PNG, "evil\r\nContent-Type: text/html.png", "image/png")),
    );
    expect(result.name).not.toMatch(/[\r\n]/);
  });

  it("caps a very long display name", async () => {
    const result = await keep(storeFile(file(PNG, "a".repeat(500) + ".png", "image/png")));
    expect(result.name.length).toBeLessThanOrEqual(200);
  });
});

describe("reading is guarded", () => {
  it("⚠ returns null for traversal-shaped ids rather than reading a file", async () => {
    for (const id of [
      "../../../../etc/passwd",
      "../.env",
      "..%2f..%2f.env",
      "/etc/passwd",
      "dev.db",
      "",
      "not-a-uuid.png",
      "0000.png",
      "../../prisma/dev.db",
    ]) {
      expect(await readStoredFile(id), id).toBeNull();
    }
  });

  it("returns null for a well-formed id that does not exist", async () => {
    expect(await readStoredFile("11111111-2222-3333-4444-555555555555.png")).toBeNull();
  });

  it("never reads the repo's own .env, however it is addressed", async () => {
    // Belt and braces: the guard is a regex, so prove the practical outcome.
    const real = await readFile(".env", "utf8").catch(() => null);
    expect(real).not.toBeNull(); // the file does exist
    for (const id of ["../.env", "../../.env", ".env"]) {
      expect(await readStoredFile(id)).toBeNull();
    }
  });
});

describe("deletion", () => {
  it("removes the file and is safe to repeat", async () => {
    const result = await storeFile(file(PNG, "gone.png", "image/png"));
    expect(await readStoredFile(result.fileId)).not.toBeNull();

    await deleteStoredFile(result.fileId);
    expect(await readStoredFile(result.fileId)).toBeNull();

    // Already-gone is the desired end state, not an error.
    await expect(deleteStoredFile(result.fileId)).resolves.toBeUndefined();
  });

  it("ignores a traversal id instead of unlinking something real", async () => {
    await expect(deleteStoredFile("../.env")).resolves.toBeUndefined();
    expect(await readFile(".env", "utf8").catch(() => null)).not.toBeNull();
  });
});

describe("etag", () => {
  it("is stable for identical bytes and differs otherwise", () => {
    expect(etagFor(PNG)).toBe(etagFor(Buffer.from(PNG)));
    expect(etagFor(PNG)).not.toBe(etagFor(JPEG));
    expect(etagFor(PNG)).toMatch(/^"[0-9a-f]{40}"$/);
  });
});
