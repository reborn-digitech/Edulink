import { Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";

/**
 * An on/off setting: the whole row is the switch — a label, an optional
 * hint, and a drawn track on the right — at least the tap height, with one
 * accessible name and a checked state.
 *
 * Not React Native's <Switch>: on the web target it renders a 20 px control
 * (the UI/UX audit measured every switch in the app at 20 px tall), and
 * wrapping it in a bigger pressable would leave its own focusable input
 * hidden inside, which is an accessibility violation of its own. So the
 * track and thumb are drawn, and the row does the switching.
 */
export function SwitchRow({ label, hint, value, onChange, disabled }: { label: string; hint?: string; value: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  const th = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      aria-checked={value}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onChange(!value);
      }}
      style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], opacity: disabled ? 0.5 : pressed ? 0.8 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="base" bold>
          {label}
        </Text>
        {hint ? (
          <Text variant="xs" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={{ width: 46, height: 28, borderRadius: th.radius.xl, backgroundColor: value ? th.accent : th.border, padding: 2, alignItems: value ? "flex-end" : "flex-start", justifyContent: "center" }}>
        <View style={{ width: 24, height: 24, borderRadius: th.radius.xl, backgroundColor: th.surface }} />
      </View>
    </Pressable>
  );
}
