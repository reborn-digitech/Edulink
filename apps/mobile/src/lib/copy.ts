import { Platform, Share } from "react-native";

/**
 * Putting a short text where the person can paste it.
 *
 * The phone has no clipboard module (the app takes no dependency for one
 * line), so on a device the share sheet is the way — it offers "Copy" and
 * every app that takes text, which for a two-step sign-in key means the
 * authenticator app itself. On the web target the browser's clipboard is
 * there and is used. Resolves to whether anything was done, so the screen
 * can say so.
 */
export async function copyText(text: string, title?: string): Promise<boolean> {
  if (Platform.OS === "web") {
    const clipboard = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator?.clipboard;
    if (!clipboard) return false;
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  try {
    const result = await Share.share({ message: text, ...(title ? { title } : {}) });
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}
