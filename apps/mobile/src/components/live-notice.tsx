import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";
import { Text } from "./text";

const SHOWN_MS = 4_000;
const FADE_MS = 700;

/**
 * One quiet line that says a screen just changed under the reader's eyes —
 * "Updated by a colleague." — the web's components/live-notice.tsx: shown
 * for four seconds, faded out over most of a second, then gone from the
 * layout rather than holding a blank line open. Each new `stamp` shows it
 * again; null shows nothing. It is said once to a screen reader (the
 * announcement, not a live region that would repeat on every re-render).
 * In tests the fade is a cut, as the Bone's breathing is.
 */
export function LiveNotice({ stamp, children }: { stamp: number | null; children: string }) {
  // The stamp whose four seconds are up; a new stamp is a new line.
  const [gone, setGone] = useState<number | null>(null);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (stamp === null) return;
    opacity.setValue(1);
    AccessibilityInfo.announceForAccessibility?.(children);
    let fade: Animated.CompositeAnimation | null = null;
    const hold = setTimeout(() => {
      if (process.env.NODE_ENV === "test") {
        setGone(stamp);
        return;
      }
      fade = Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true });
      fade.start(({ finished }) => {
        if (finished) setGone(stamp);
      });
    }, SHOWN_MS);
    return () => {
      clearTimeout(hold);
      fade?.stop();
    };
    // The sentence is read when the stamp changes; a translated line changing on its own is not a new notice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp, opacity]);

  if (stamp === null || gone === stamp) return null;
  return (
    <Animated.View style={{ opacity }} testID="live-notice">
      <Text variant="xs" tone="muted" bold>
        {children}
      </Text>
    </Animated.View>
  );
}
