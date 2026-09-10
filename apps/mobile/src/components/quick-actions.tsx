import { Pressable, View } from "react-native";
import type { QuickAction } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";
import { Icon } from "./icon";

/**
 * A role's shortcuts as tiles, two to a row, each at least the tap height and
 * named for a screen reader with the web's own label and hint. The screen
 * passes `onOpen` (it owns the router), so this stays renderable in a test.
 */
export function QuickActions({ actions, onOpen }: { actions: QuickAction[]; onOpen: (href: string) => void }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
      {actions.map((a) => (
        <Pressable
          key={a.labelKey}
          accessibilityRole="button"
          accessibilityLabel={t(a.labelKey)}
          accessibilityHint={t(a.hintKey)}
          onPress={() => {
            haptics.tap();
            onOpen(a.href);
          }}
          style={({ pressed }) => ({
            flexGrow: 1,
            flexBasis: "46%",
            minHeight: th.tap + th.space[4],
            flexDirection: "row",
            alignItems: "center",
            gap: th.space[3],
            paddingHorizontal: th.space[3],
            paddingVertical: th.space[3],
            borderRadius: th.radius.lg,
            borderWidth: 1,
            borderColor: th.border,
            backgroundColor: pressed ? th.accentSoft : th.surface,
          })}
        >
          <View style={{ width: 36, height: 36, borderRadius: th.radius.md, backgroundColor: th.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Icon name={a.icon} size={20} color={th.accentStrong} weight="duotone" />
          </View>
          <Text variant="sm" bold style={{ flexShrink: 1 }}>
            {t(a.labelKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
