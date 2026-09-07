import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * A button: at least the tap-target height from the tokens (48), a role and
 * a label a screen reader can say, and a busy state that keeps the label so
 * the button does not change width while it works.
 */
export function Button({
  label,
  variant = "primary",
  busy,
  icon,
  disabled,
  style,
  ...rest
}: Omit<PressableProps, "children" | "style"> & { label: string; variant?: Variant; busy?: boolean; icon?: ReactNode; style?: object }) {
  const t = useTheme();
  const bg = { primary: t.accent, secondary: t.surfaceMuted, ghost: "transparent", danger: t.dangerSoft }[variant];
  const fg = { primary: t.accentFg, secondary: t.fg, ghost: t.accentStrong, danger: t.danger }[variant];
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(off), busy: Boolean(busy) }}
      disabled={off}
      hitSlop={4}
      style={({ pressed }) => [
        { minHeight: t.tap, paddingHorizontal: t.space[5], borderRadius: t.radius.md, backgroundColor: bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: t.space[2], opacity: off ? 0.6 : pressed ? 0.85 : 1 },
        variant === "secondary" ? { borderWidth: 1, borderColor: t.border } : null,
        style,
      ]}
      {...rest}
    >
      {busy ? <ActivityIndicator color={fg} /> : icon ? <View>{icon}</View> : null}
      <Text variant="base" bold style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
