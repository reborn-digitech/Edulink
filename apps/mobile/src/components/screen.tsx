import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";
import { PageTitle } from "./page-title";
import { Icon } from "./icon";
import { useBack } from "./chrome";

/**
 * The page: safe area, the ground colour, a title the screen reader hears
 * first (accessibilityRole header), a description, and pull-to-refresh when
 * the screen has server state. The same shape as the web's PageHeader.
 * A screen that is not a tab (its route wraps it in <BackTo>) gets a back
 * button above the title; forms stay above the keyboard on iOS.
 */
export function Screen({
  title,
  description,
  children,
  refreshing,
  onRefresh,
  scroll = true,
  ...rest
}: ViewProps & { title?: string; description?: string; children: ReactNode; refreshing?: boolean; onRefresh?: () => void; scroll?: boolean }) {
  const t = useTheme();
  const back = useBack();
  const header = title || back ? (
    <View style={{ paddingHorizontal: t.space[4], paddingTop: back ? t.space[1] : t.space[3], paddingBottom: t.space[2], gap: t.space[1] }}>
      {back ? <BackButton onBack={back.onBack} /> : null}
      {title ? (
      <Text variant="2xl" bold accessibilityRole="header">
        {title}
      </Text>
      ) : null}
      {description ? (
        <Text variant="sm" tone="muted">
          {description}
        </Text>
      ) : null}
    </View>
  ) : null;
  const body = (
    <View style={{ paddingHorizontal: t.space[4], paddingBottom: t.space[8], gap: t.space[3] }} {...rest}>
      {children}
    </View>
  );
  return (
    <SafeAreaView role="main" edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <PageTitle title={title} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={t.accent} /> : undefined}>
          {header}
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {header}
          {body}
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** "‹ Back": the previous screen, or the route's fallback when the app was opened straight onto this one. */
function BackButton({ onBack }: { onBack: () => void }) {
  const t = useTheme();
  const tr = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr("common.back")}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onBack();
      }}
      style={({ pressed }) => ({ alignSelf: "flex-start", minHeight: t.tap, marginLeft: -t.space[2], paddingHorizontal: t.space[2], flexDirection: "row", alignItems: "center", gap: t.space[1], opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name="caretLeft" size={20} color={t.accentStrong} weight="bold" />
      <Text variant="base" bold tone="accent">
        {tr("common.back")}
      </Text>
    </Pressable>
  );
}
