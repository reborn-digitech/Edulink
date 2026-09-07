import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { Text } from "./text";
import { Button } from "./button";

/**
 * The four states every screen has, from one set: the web's EmptyState and
 * PageSkeleton, and an error with a retry. Each announces itself to a screen
 * reader (accessibilityRole / liveRegion), so a person who cannot see the
 * spinner is told the screen is loading.
 */
export function Loading({ label }: { label?: string }) {
  const t = useTheme();
  const tr = useT();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label ?? tr("ui.loading")} style={{ padding: t.space[8], alignItems: "center", gap: t.space[3] }}>
      <ActivityIndicator color={t.accent} size="large" />
      <Text variant="sm" tone="muted">
        {label ?? tr("ui.loading")}
      </Text>
    </View>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: t.space[6], alignItems: "center", gap: t.space[2], backgroundColor: t.surfaceMuted, borderRadius: t.radius.lg }}>
      <Text variant="lg" bold style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body ? (
        <Text variant="sm" tone="muted" style={{ textAlign: "center" }}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: t.space[2] }}>{action}</View> : null}
    </View>
  );
}

export function Failed({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  const tr = useT();
  return (
    <View style={{ padding: t.space[5], gap: t.space[3], backgroundColor: t.dangerSoft, borderRadius: t.radius.lg }}>
      {/* The sentence is the alert; the button stays its own element, so a
          screen reader reaches it instead of hearing one grouped blob. */}
      <Text variant="base" bold tone="danger" accessibilityRole="alert" accessibilityLiveRegion="assertive">
        {message}
      </Text>
      {onRetry ? <Button label={tr("common.retry")} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

/** A list row: a tappable line with a title, a caption and something on the right. */
export function Row({ title, caption, right, onPress }: { title: string; caption?: string; right?: ReactNode; onPress?: () => void }) {
  const t = useTheme();
  const inner = (
    <View style={{ minHeight: t.tap, flexDirection: "row", alignItems: "center", gap: t.space[3], paddingVertical: t.space[2] }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="base" bold={Boolean(onPress)}>
          {title}
        </Text>
        {caption ? (
          <Text variant="sm" tone="muted">
            {caption}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={caption ? `${title}, ${caption}` : title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  );
}
