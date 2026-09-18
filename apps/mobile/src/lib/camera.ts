import { Linking, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PickError, uploadPicked, type Picked } from "./pick-file";

/**
 * Photograph the work and upload it: the one place the app touches the
 * camera, for the one thing that needs it — a pupil handing in the pages
 * of a notebook.
 *
 * WHY THE CAMERA AND NOT THE ROLL. Decision 0002 took every camera and
 * photo-library permission out of the app while nothing used them; the
 * camera comes back here, alone. It asks for one permission, at the moment
 * of the first hand-in, and yields one picture the pupil takes there and
 * then; the photo library is never asked for (app.json turns the plugin's
 * photos permission off), so nothing already on the phone is reachable
 * through this app. A pupil with an old picture uses the system document
 * picker beside this button, which hands over that one file and no more.
 *
 * The picture is re-encoded as a JPEG at 0.7 so a 12-megapixel page fits
 * the server's 5 MB image cap; EXIF, including where the photo was taken,
 * is stripped on the server before the bytes are stored.
 */
export type CameraOutcome = { picked: Picked } | { denied: true } | null;

/** Nothing to take a photo with on the web target; the button is not shown. */
export const CAMERA_AVAILABLE = Platform.OS !== "web";

/** Resolves to the uploaded photo, `denied` when the camera permission is refused, or null when the pupil backed out. */
export async function takePhotoAndUpload(fallbackError: string): Promise<CameraOutcome> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { denied: true };
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false, exif: false });
  if (shot.canceled || !shot.assets?.length) return null;
  const asset = shot.assets[0]!;
  const name = asset.fileName ?? `photo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`;
  const picked = await uploadPicked({ uri: asset.uri, name, mime: asset.mimeType ?? "image/jpeg", file: asset.file ?? undefined }, fallbackError);
  return { picked };
}

/** The phone's own settings page, where a refused permission is switched back on. */
export function openAppSettings(): void {
  void Linking.openSettings().catch(() => {});
}

export { PickError };
