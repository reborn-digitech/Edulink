import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";
import { Button } from "./button";
import { Icon } from "./icon";
import { Bone } from "./chrome";

/**
 * The four states every screen has, from one set: the web's EmptyState and
 * PageSkeleton, and an error with a retry. Each announces itself to a screen
 * reader (accessibilityRole / liveRegion), so a person who cannot see the
 * spinner is told the screen is loading.
 */
export function Loading({ label }: { label?: string }) {
  const t = useTheme();
  const tr = useT();
  // The shape of a screen's first cards rather than a spinner: the eye lands
  // where the data will. The name stays "Loading…" for a screen reader, and
  // the whole block is one element so it is said once.
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label ?? tr("ui.loading")} style={{ gap: t.space[3], paddingVertical: t.space[2] }}>
      <View style={{ flexDirection: "row", gap: t.space[3] }}>
        <View style={{ flex: 1, backgroundColor: t.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.border, padding: t.space[3], gap: t.space[2] }}>
          <Bone width="50%" height={10} />
          <Bone width="35%" height={22} />
        </View>
        <View style={{ flex: 1, backgroundColor: t.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.border, padding: t.space[3], gap: t.space[2] }}>
          <Bone width="60%" height={10} />
          <Bone width="30%" height={22} />
        </View>
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={{ backgroundColor: t.surface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.border, padding: t.space[4], gap: t.space[3] }}>
          <Bone width="45%" height={16} />
          <Bone width="90%" />
          <Bone width="75%" />
          <Bone width="60%" />
        </View>
      ))}
    </View>
  );
}

export function Empty({ title, body, action, icon = "tray" }: { title: string; body?: string; action?: ReactNode; icon?: string }) {
  const t = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: t.space[6], alignItems: "center", gap: t.space[2], backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius.lg }}>
      <View style={{ width: 56, height: 56, borderRadius: t.radius.xl, backgroundColor: t.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: t.space[1] }}>
        <Icon name={icon} size={28} color={t.fgSubtle} weight="duotone" />
      </View>
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

/**
 * A list row: a tappable line with a title, a caption and something on the
 * right. With an `icon` it leads with it in a soft tile; a tappable row ends
 * in a chevron unless something else sits on the right, so it looks like
 * something that opens.
 */
export function Row({ title, caption, right, onPress, icon }: { title: string; caption?: string; right?: ReactNode; onPress?: () => void; icon?: string }) {
  const t = useTheme();
  const inner = (
    <View style={{ minHeight: t.tap, flexDirection: "row", alignItems: "center", gap: t.space[3], paddingVertical: t.space[2] }}>
      {icon ? (
        <View style={{ width: 40, height: 40, borderRadius: t.radius.md, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={20} color={t.accentStrong} weight="duotone" />
        </View>
      ) : null}
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
      {onPress && !right ? <Icon name="caretRight" size={16} color={t.fgSubtle} weight="bold" /> : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={caption ? `${title}, ${caption}` : title}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {inner}
    </Pressable>
  );
}
