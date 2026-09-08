import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";
import { PageTitle } from "./page-title";

/**
 * The page: safe area, the ground colour, a title the screen reader hears
 * first (accessibilityRole header), a description, and pull-to-refresh when
 * the screen has server state. The same shape as the web's PageHeader.
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
  const header = title ? (
    <View style={{ paddingHorizontal: t.space[4], paddingTop: t.space[3], paddingBottom: t.space[2], gap: t.space[1] }}>
      <Text variant="2xl" bold accessibilityRole="header">
        {title}
      </Text>
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
    </SafeAreaView>
  );
}
