import { Pressable, View } from "react-native";
import { LOCALES } from "@edulink/i18n";
import { Text } from "./text";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/** The three languages, each named in itself, as a radio group. */
export function LanguageRow() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const th = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t("language.groupLabel")} style={{ flexDirection: "row", gap: th.space[1], backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[1], marginTop: th.space[4] }}>
      {LOCALES.map((l) => {
        const on = l.code === locale;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            aria-checked={on}
            accessibilityLabel={l.english}
            onPress={() => setLocale(l.code)}
            style={{ flex: 1, minHeight: th.tap, alignItems: "center", justifyContent: "center", borderRadius: th.radius.sm, backgroundColor: on ? th.surface : undefined }}
          >
            <Text variant="sm" bold={on} tone={on ? "fg" : "muted"}>
              {l.native}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
