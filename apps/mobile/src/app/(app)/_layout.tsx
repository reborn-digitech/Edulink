import { Tabs } from "expo-router";
import { Icon, Loading } from "@/components";
import { useRole, useSession } from "@/lib/session";
import { ChooseContext } from "@/components/choose-context";
import { ALL_TAB_SCREENS, TABS } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * The shell: a bottom tab bar per role mirroring the web NAV's primaries, and
 * "More" for the rest. Every tab screen is declared once; the ones a role
 * has no tab for are hidden (href: null) rather than absent, so a deep link
 * to /attendance still resolves for a guardian and a teacher alike.
 */
export default function AppLayout() {
  const role = useRole();
  const session = useSession();
  const t = useT();
  const th = useTheme();
  if (!role) return session.status === "signed-in" ? <ChooseContext /> : <Loading />;
  const tabs = TABS[role];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: th.accentStrong,
        tabBarInactiveTintColor: th.fgMuted,
        tabBarStyle: { backgroundColor: th.surface, borderTopColor: th.border, minHeight: 56 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {ALL_TAB_SCREENS.map((name) => {
        const tab = tabs.find((x) => x.name === name);
        if (name === "more") {
          return <Tabs.Screen key="more" name="more" options={{ title: t("nav.more"), tabBarIcon: ({ color, size }) => <Icon name="dots" color={String(color)} size={size} weight="bold" />, tabBarAccessibilityLabel: t("nav.more") }} />;
        }
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              href: tab ? undefined : null,
              title: tab ? t(tab.labelKey) : name,
              tabBarAccessibilityLabel: tab ? t(tab.labelKey) : undefined,
              tabBarIcon: ({ color, size, focused }) => <Icon name={tab?.icon ?? "house"} color={String(color)} size={size} weight={focused ? "fill" : "regular"} />,
            }}
          />
        );
      })}
      <Tabs.Screen name="notifications" options={{ href: null, title: t("shell.notifications") }} />
      {["marks", "exams", "meetings", "bulletin", "timetable", "staff", "calendar", "reviews"].map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
