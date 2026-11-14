import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { uploadResultSchema } from "@edulink/contracts";
import { api, errorText } from "./api";

/**
 * Choose one file from the phone and upload it: the one way the app takes a
 * file (a Social Media picture, a competition entry, an assignment handout,
 * a school logo).
 *
 * WHY A DOCUMENT PICKER. The camera and photo-library permissions were taken
 * out of the app in Phase 6 (docs/decisions/0002, the minors' data policy):
 * a pupil's phone should not grant a school app its whole camera roll. The
 * system document picker asks for no permission at all — the person picks
 * one file in the system's own sheet and only that file is handed over — so
 * it fits the policy and still reaches Photos on iOS and Files everywhere.
 * The camera alone returned for photo hand-ins (lib/camera.ts); the library
 * permission did not.
 *
 * The bytes go to POST /api/v1/uploads, which sniffs the type, caps the size
 * and strips EXIF; what comes back is the id a later request names. The
 * picked file never touches the app's own storage beyond the picker's cache.
 */
/**
 * `localUri`: the phone's own copy of what was picked (TA-565). An upload is not readable through the file route
 * until a hand-in or a post names it, so a picture just picked is drawn from here; it never goes to the server.
 */
export type Picked = { fileId: string; mime: string; size: number; name: string; localUri?: string };
export type PickKind = "image" | "media" | "document" | "any";

const TYPES: Record<PickKind, string[] | string> = {
  image: ["image/*"],
  media: ["image/*", "video/*"],
  // What POST /api/v1/uploads stores (PDF and pictures): a Word file was offered here and refused every time (TA-585).
  document: ["application/pdf", "image/*"],
  any: "*/*",
};

export class PickError extends Error {}

/**
 * Resolves to the uploaded file, or null when the person closed the picker.
 * A refusal from the server (too big, wrong type, rate limit) throws a
 * PickError carrying the server's own sentence, ready for a toast or a field.
 */
export async function pickAndUpload(kind: PickKind, fallbackError: string): Promise<Picked | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: TYPES[kind], copyToCacheDirectory: true, multiple: false });
  if (picked.canceled || !picked.assets?.length) return null;
  const asset = picked.assets[0]!;
  return uploadPicked({ uri: asset.uri, name: asset.name || "file", mime: asset.mimeType ?? "application/octet-stream", file: asset.file }, fallbackError);
}

/** One local file — from the picker or the camera (lib/camera.ts) — posted to /api/v1/uploads. */
export async function uploadPicked(asset: { uri: string; name: string; mime: string; file?: File }, fallbackError: string): Promise<Picked> {
  const { uri, name, mime } = asset;
  const form = new FormData();
  if (Platform.OS === "web" && asset.file) {
    form.append("file", asset.file, name);
  } else {
    // React Native's FormData streams a file from its uri; the object shape is RN's, not the DOM's.
    form.append("file", { uri, name, type: mime } as unknown as Blob);
  }
  const result = await api().post("/api/v1/uploads", form);
  if (!result.ok) {
    const fieldError = result.issues?.file;
    throw new PickError(fieldError ?? errorText(result, fallbackError));
  }
  const data = uploadResultSchema.parse(result.data);
  return { fileId: data.fileId, mime: data.mime, size: data.size, name, localUri: uri };
}
