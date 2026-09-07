import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";

export function Card({ title, action, children, style, ...rest }: ViewProps & { title?: string; action?: ReactNode; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.border, padding: t.space[4], gap: t.space[3] }, style]} {...rest}>
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: t.space[3], flexWrap: "wrap" }}>
          <Text variant="lg" bold accessibilityRole="header" style={{ flexShrink: 1 }}>
            {title}
          </Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A figure with a caption — the web's StatTile. */
export function Stat({ label, value, tone = "fg" }: { label: string; value: string | number; tone?: "fg" | "ok" | "warn" | "danger" | "accent" }) {
  const t = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minWidth: 120, backgroundColor: t.surfaceMuted, borderRadius: t.radius.md, padding: t.space[3], gap: 2 }}>
      <Text variant="xs" tone="subtle">
        {label}
      </Text>
      <Text variant="2xl" bold tone={tone} style={{ fontVariant: ["tabular-nums"] }}>
        {String(value)}
      </Text>
    </View>
  );
}
