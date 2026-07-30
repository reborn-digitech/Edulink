/**
 * Strips metadata from uploaded images.
 *
 * A phone photo carries EXIF, and EXIF routinely carries GPS coordinates. A
 * child posting a picture taken at home to a class bulletin would otherwise
 * publish where they live to everyone who can read the post — and to anyone the
 * post is forwarded to afterwards. Nothing in the product wants that data, so it
 * never gets stored. This runs before the bytes reach disk, not on the way out,
 * because a file that was written once with coordinates in it has already leaked
 * if the storage directory is ever backed up or copied.
 *
 * Deliberately no image library. Adding `sharp` for this pulls in a native
 * binary and re-encodes every upload — this only needs to walk a container
 * format and drop segments, which is the same kind of byte-level work
 * `storage.ts` already does to sniff magic numbers.
 *
 * These functions never parse the metadata they remove. They locate whole
 * segments by marker and drop them, so a malformed or hostile EXIF payload is
 * discarded rather than interpreted.
 *
 * On anything unexpected the remainder of the file is passed through unchanged:
 * a corrupt upload should fail later, on decode, rather than be silently
 * truncated into a file that half-renders.
 */

/** JPEG APP2 holds the ICC colour profile; dropping it visibly shifts colours. */
const JPEG_APP2 = 0xe2;

/** PNG chunks that carry free text, timestamps or an embedded EXIF block. */
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

export function stripImageMetadata(bytes: Buffer, mime: string): Buffer {
  switch (mime) {
    case "image/jpeg":
      return stripJpeg(bytes);
    case "image/png":
      return stripPng(bytes);
    case "image/webp":
      return stripWebp(bytes);
    default:
      // GIF carries comment and application extensions but no EXIF in practice,
      // and PDF is not an image. Both are returned untouched rather than being
      // rewritten by code that has no test covering them.
      return bytes;
  }
}

/**
 * JPEG is SOI, then a run of marker segments, then entropy-coded scan data.
 * EXIF and XMP both live in APP1; other APPn slots hold assorted vendor blobs.
 * APP0 (JFIF) and APP2 (ICC) are kept because they affect how the image decodes.
 */
function stripJpeg(bytes: Buffer): Buffer {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;

  const out: Buffer[] = [bytes.subarray(0, 2)];
  let i = 2;

  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1]!;

    // Standalone markers: no length field follows.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      out.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    // Start of scan: everything after this is compressed image data.
    if (marker === 0xda) break;
    if (marker === 0xd9) break;

    if (i + 4 > bytes.length) break;
    const length = bytes.readUInt16BE(i + 2);
    // A segment length counts its own two bytes, so anything under 2 is broken.
    if (length < 2 || i + 2 + length > bytes.length) break;

    const isAppSegment = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;
    const drop = (isAppSegment && marker !== 0xe0 && marker !== JPEG_APP2) || isComment;

    if (!drop) out.push(bytes.subarray(i, i + 2 + length));
    i += 2 + length;
  }

  // Whatever is left — scan data, or a stretch we could not parse — is kept
  // verbatim so the image still decodes.
  if (i < bytes.length) out.push(bytes.subarray(i));
  return Buffer.concat(out);
}

/** PNG is an 8-byte signature then length/type/data/CRC chunks. */
function stripPng(bytes: Buffer): Buffer {
  const SIGNATURE = 8;
  if (bytes.length < SIGNATURE + 12) return bytes;

  const out: Buffer[] = [bytes.subarray(0, SIGNATURE)];
  let i = SIGNATURE;

  while (i + 8 <= bytes.length) {
    const dataLength = bytes.readUInt32BE(i);
    const type = bytes.toString("latin1", i + 4, i + 8);
    const total = 12 + dataLength; // length + type + data + CRC

    if (dataLength > bytes.length || i + total > bytes.length) break;

    if (!PNG_DROP.has(type)) out.push(bytes.subarray(i, i + total));
    i += total;

    if (type === "IEND") break;
  }

  if (i < bytes.length) out.push(bytes.subarray(i));
  return Buffer.concat(out);
}

/**
 * WebP is a RIFF container. EXIF and XMP are separate chunks, and an extended
 * (VP8X) file advertises their presence in a flags byte — so the flags have to
 * be cleared too, or a decoder is told to look for a chunk that is now gone.
 */
function stripWebp(bytes: Buffer): Buffer {
  if (bytes.length < 12) return bytes;
  if (bytes.toString("latin1", 0, 4) !== "RIFF") return bytes;
  if (bytes.toString("latin1", 8, 12) !== "WEBP") return bytes;

  const out: Buffer[] = [];
  let i = 12;
  let dropped = false;

  while (i + 8 <= bytes.length) {
    const fourCC = bytes.toString("latin1", i, i + 4);
    const size = bytes.readUInt32LE(i + 4);
    // Chunk payloads are padded to an even length.
    const total = 8 + size + (size % 2);

    if (size > bytes.length || i + total > bytes.length) break;

    if (fourCC === "EXIF" || fourCC === "XMP ") {
      dropped = true;
    } else if (fourCC === "VP8X" && size >= 1) {
      const chunk = Buffer.from(bytes.subarray(i, i + total));
      // Flags byte: bit 3 EXIF, bit 2 XMP.
      chunk[8] = chunk[8]! & ~0x08 & ~0x04;
      out.push(chunk);
    } else {
      out.push(bytes.subarray(i, i + total));
    }
    i += total;
  }

  if (i < bytes.length) out.push(bytes.subarray(i));
  if (!dropped) return bytes;

  const body = Buffer.concat(out);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "latin1");
  // RIFF size covers "WEBP" plus every chunk that follows it.
  header.writeUInt32LE(4 + body.length, 4);
  header.write("WEBP", 8, "latin1");
  return Buffer.concat([header, body]);
}
