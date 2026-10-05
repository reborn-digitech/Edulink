import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";
import { PageTitle } from "./page-title";
import { Icon } from "./icon";
import { useBack } from "./chrome";
import { useSessionIfAny } from "@/lib/session";
import type { TranslationKey } from "@edulink/i18n";

/**
 * The page: safe area, the ground colour with the role's colour washing
 * down behind the title in the light theme, a title the screen reader hears
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
      {title ? <StreamChip /> : null}
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
    <SafeAreaView role="main" edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: t.canvas }}>
      {t.theme === "light" ? <Wash /> : null}
      <PageTitle title={title} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll ? (
        // On the web target the page's scroller takes the keyboard's focus, so a screen whose content holds
        // nothing focusable (a desk home of figures) can still be scrolled from the keyboard: axe's
        // scrollable-region-focusable, serious, on the IQAC, placement and accounts homes once a suite walked them
        // (B-22, campaign 2026-10-04). A phone scrolls by touch and is left as it was.
        <ScrollView focusable={Platform.OS === "web"} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={t.accent} /> : undefined}>
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

/**
 * The role's colour fading down behind the page title, as the web's shell
 * draws it (globals.css, data-wash): a fixed band the content scrolls over.
 * Light only; dark keeps its two tones as they were.
 */
function Wash() {
  const t = useTheme();
  return (
    <Svg testID="wash" pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0 }} width="100%" height={t.wash.height} aria-hidden>
      <Defs>
        <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.accent} stopOpacity={t.wash.alpha} />
          <Stop offset="1" stopColor={t.accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
    </Svg>
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

/**
 * The college's streams under every page's title (5 Oct 2026), as the web's
 * shell draws them beside the college's name: the college's name and one
 * quiet chip, the streams joined. Nothing at a school, at a college with no
 * stream recorded, or before the session is read.
 */
function StreamChip() {
  const t = useTheme();
  const tr = useT();
  const session = useSessionIfAny();
  const me = session?.status === "signed-in" ? session.me : null;
  const streams = me?.streams ?? [];
  if (!me || streams.length === 0) return null;
  const names = streams.map((code) => tr(`streams.${code}.name` as TranslationKey)).join(" · ");
  const place = me.contexts.find((c) => c.schoolId === me.active.schoolId)?.schoolName;
  return (
    <View testID="stream-chip" accessible accessibilityLabel={[place, tr("streams.chipLabel", { streams: names })].filter(Boolean).join(", ")} style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: t.space[2] }}>
      {place ? (
        <Text variant="xs" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
          {place}
        </Text>
      ) : null}
      <View style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.surfaceMuted, borderRadius: t.radius.xl, paddingHorizontal: t.space[2], flexShrink: 1 }}>
        <Text variant="xs" tone="muted" numberOfLines={1}>
          {names}
        </Text>
      </View>
    </View>
  );
}
