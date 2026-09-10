import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * A touch that answers back: a light tick when a choice is made, a success
 * or warning pattern when a save lands or is refused. Never on the web
 * target (no motor) and never where the platform refuses — a haptic is a
 * nicety, and a failure to buzz must never become a failure to save.
 */
function safe(run: () => Promise<void>): void {
  if (Platform.OS === "web") return;
  try {
    void run().catch(() => {});
  } catch {
    /* no haptics engine */
  }
}

export const haptics = {
  tap: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
