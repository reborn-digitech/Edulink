import type { Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { type } from "@edulink/tokens";
import { Text } from "./text";

/** A labelled input with an error line the screen reader reads with it. A ref reaches the input, so a screen can bring it into focus. */
export function Field({ label, error, hint, style, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string; ref?: Ref<TextInput> }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[1] }}>
      <Text variant="sm" bold>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={t.fgSubtle}
        style={[
          { minHeight: t.tap, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: t.radius.md, paddingHorizontal: t.space[4], fontSize: type.base.size, color: t.fg, backgroundColor: t.surface },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="xs" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
