/**
 * Typed access to the String-backed JSON columns.
 *
 * SQLite has no Json type, and keeping the schema portable means we do the
 * parsing. Every read is total: a corrupt or hand-edited column returns the
 * caller's fallback instead of throwing somewhere deep inside a render. (§5)
 */

export function readJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    // Shallow-merge object shapes so a column written before a field existed
    // still yields a complete object.
    if (
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      typeof fallback === "object" &&
      fallback !== null &&
      !Array.isArray(fallback)
    ) {
      return { ...(fallback as object), ...(parsed as object) } as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function readJsonArray<T>(raw: string | null | undefined): T[] {
  const value = readJson<T[]>(raw, []);
  return Array.isArray(value) ? value : [];
}

export function writeJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export type Attachment = {
  fileId: string;
  name: string;
  size: number;
  mime: string;
};

export type MediaItem = {
  fileId: string;
  kind: "image" | "video" | "file";
  /** Required at write time — a bulletin image with no alt text fails validation. */
  alt: string;
};
