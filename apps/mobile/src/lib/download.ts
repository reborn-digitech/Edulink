import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { apiErrorSchema } from "@edulink/contracts";
import { API_BASE, apiLocale, sessionToken } from "./api";

/**
 * A file the API renders on the way out — a report card as a PDF, a class's
 * cards as one bundle — fetched with the bearer token and handed to the
 * phone's share sheet. The api client turns every body into JSON text, which
 * would garble bytes, so this reads the response as an ArrayBuffer itself,
 * with the same token and language header the client sends. On the phone the
 * bytes land in the cache directory and expo-sharing opens the sheet; on the
 * web target a blob link saves the file the way a browser does.
 *
 * `bytesApi.get(path)` keeps the client's shape so the catalog gate
 * (test/lib/api-catalog.test.ts) sees the path like any other call.
 */
export type Fetched = { ok: true; bytes: Uint8Array; mime: string } | { ok: false; error: string };

let downloadFetch: typeof fetch | null = null;
/** Tests inject the fake fetch the download should reach. */
export function __setDownloadFetch(next: typeof fetch | null): void {
  downloadFetch = next;
}

export const bytesApi = {
  async get(path: string, fallbackError: string): Promise<Fetched> {
    const headers: Record<string, string> = { Accept: "application/pdf, application/octet-stream, */*", "Accept-Language": apiLocale() };
    const token = await sessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let response: Response;
    try {
      response = await (downloadFetch ?? globalThis.fetch)(`${API_BASE}${path}`, { method: "GET", headers });
    } catch (cause) {
      return { ok: false, error: cause instanceof Error && cause.message ? cause.message : fallbackError };
    }
    if (!response.ok) {
      const text = await response.text();
      const parsed = apiErrorSchema.safeParse(safeJson(text));
      return { ok: false, error: parsed.success && parsed.data.error.trim() ? parsed.data.error : fallbackError };
    }
    return { ok: true, bytes: new Uint8Array(await response.arrayBuffer()), mime: response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream" };
  },
};

/** Every file the share sheet is handed is named so sign-out can find it. */
const SHARED_PREFIX = "relay-shared-";

/**
 * The files this person shared from the phone — a report card, a certificate,
 * a class bundle — sit in the cache directory after the sheet closes, and the
 * cache is the device's, not the account's. Sign-out removes them, so the
 * next person on a shared phone cannot open the last person's cards from a
 * file browser. Native only; the web target saved through the browser.
 */
export async function clearSharedFiles(): Promise<number> {
  if (Platform.OS === "web") return 0;
  let removed = 0;
  try {
    for (const entry of new Directory(Paths.cache).list()) {
      if (entry instanceof File && entry.name.startsWith(SHARED_PREFIX)) {
        entry.delete();
        removed++;
      }
    }
  } catch {
    // A cache directory that cannot be read has nothing of ours to remove.
  }
  return removed;
}

/** Hand fetched bytes over. Resolves to null once the sheet is open (or the file saved on the web), else the sentence to show. */
export async function shareBytes(got: { bytes: Uint8Array; mime: string }, fileName: string, fallbackError: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      saveOnWeb(got.bytes, got.mime, fileName);
      return null;
    }
    const file = new File(Paths.cache, SHARED_PREFIX + safeName(fileName));
    file.write(got.bytes);
    await Sharing.shareAsync(file.uri, { mimeType: got.mime, UTI: got.mime === "application/pdf" ? "com.adobe.pdf" : undefined, dialogTitle: fileName });
    return null;
  } catch {
    return fallbackError;
  }
}

/** A title becomes a file name: no path separators or other characters a file system refuses, never empty. */
export function safeName(name: string): string {
  const cleaned = Array.from(name)
    .map((ch) => (ch.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(ch) ? " " : ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "file";
}

function saveOnWeb(bytes: Uint8Array, mime: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName(fileName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
