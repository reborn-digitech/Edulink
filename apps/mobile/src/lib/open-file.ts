import * as WebBrowser from "expo-web-browser";
import { fileLinkSchema } from "@edulink/contracts";
import { api, API_BASE, errorText } from "./api";

/**
 * Open one stored file outside the app — a pupil's PDF, a Word handout — in
 * the phone's in-app browser sheet. The browser has no bearer token, so the
 * app first asks the API for a five-minute link (POST /api/v1/files/{id}/link,
 * which runs the same read rule as the file itself) and opens that. Pictures
 * never come here: expo-image draws them with the token in a header.
 *
 * Resolves to null once the sheet is open, or to the sentence a screen should
 * show (the server's own refusal, or `fallbackError`).
 */
export async function openFile(fileId: string, fallbackError: string): Promise<string | null> {
  const result = await api().post(`/api/v1/files/${encodeURIComponent(fileId)}/link`);
  if (!result.ok) return errorText(result, fallbackError);
  const parsed = fileLinkSchema.safeParse(result.data);
  if (!parsed.success) return fallbackError;
  try {
    await WebBrowser.openBrowserAsync(`${API_BASE}${parsed.data.url}`);
    return null;
  } catch {
    return fallbackError;
  }
}
