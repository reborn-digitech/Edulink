import { useState } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Me } from "@edulink/contracts";
import { inboxSchema, notificationsSchema } from "@edulink/contracts";
import { Button, Icon, Loading } from "@/components";
import { useRole, useSession } from "@/lib/session";
import { ChooseContext } from "@/components/choose-context";
import { ALL_TAB_SCREENS, HIDDEN_SCREENS, TABS } from "@/lib/nav";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { type } from "@edulink/tokens";
import { OperatorHome } from "@/screens/operator/home";
import { AppAdminHome } from "@/screens/operator/app-admin";

/**
 * The shell: a bottom tab bar per role mirroring the web NAV's primaries, and
 * "More" for the rest. Every tab screen is declared once; the ones a role
 * has no tab for are hidden (href: null) rather than absent, so a deep link
 * to /attendance still resolves for a guardian and a teacher alike. Every
 * other route file is named here too (HIDDEN_SCREENS, checked against the
 * disk by a test): the Tabs navigator lists every file it finds, and an
 * unnamed one appears in the bar with a default icon on the web target.
 *
 * No role: the operator and the content team have none by design (the web's
 * /root and /appadmin sit outside the school shell for the same reason), so
 * they get their own screen; everyone else chooses where to go.
 */
export default function AppLayout() {
  const role = useRole();
  const session = useSession();
  const t = useT();
  const th = useTheme();
  const badges = useBadges(Boolean(role));
  if (!role) return session.status === "signed-in" ? <NoRole me={session.me} /> : <Loading />;
  const tabs = TABS[role];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: th.accentStrong,
        tabBarInactiveTintColor: th.fgMuted,
        tabBarStyle: { backgroundColor: th.surface, borderTopColor: th.border, minHeight: 56 },
        // Five labels share 390 pt and the library pads each pressable 5 pt on
        // a style the item prop cannot reach, so "Attendance" ended in an
        // ellipsis; the label takes that padding back.
        tabBarLabelStyle: { fontSize: type.xs.size, fontWeight: "600", marginHorizontal: -th.space[1], maxWidth: "120%" },
        tabBarBadgeStyle: { backgroundColor: th.danger, color: th.fgInverse, fontSize: type.xs.size },
      }}
    >
      {ALL_TAB_SCREENS.map((name) => {
        const tab = tabs.find((x) => x.name === name);
        if (name === "more") {
          return (
            <Tabs.Screen
              key="more"
              name="more"
              options={{
                title: t("nav.more"),
                tabBarIcon: ({ color, size }) => <Icon name="dots" color={String(color)} size={size} weight="bold" />,
                tabBarAccessibilityLabel: t("nav.more"),
                tabBarBadge: badges.notifications > 0 ? badges.notifications : undefined,
              }}
            />
          );
        }
        const badge = name === "messages" && badges.messages > 0 ? badges.messages : undefined;
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              href: tab ? undefined : null,
              title: tab ? t(tab.labelKey) : name,
              tabBarAccessibilityLabel: tab ? t(tab.labelKey) : undefined,
              tabBarBadge: badge,
              tabBarIcon: ({ color, size, focused }) => <Icon name={tab?.icon ?? "house"} color={String(color)} size={size} weight={focused ? "fill" : "regular"} />,
            }}
          />
        );
      })}
      {HIDDEN_SCREENS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null, title: name === "notifications" ? t("shell.notifications") : undefined }} />
      ))}
    </Tabs>
  );
}

/**
 * The counts the bar shows: unread messages on the Messages tab, unread
 * notices on More. Polled gently; the screens' own queries share the inbox
 * key, so opening the inbox refreshes the badge too. The tab's accessible
 * name stays the plain label (the battery and a screen reader both find a
 * tab by it); the badge is the number drawn on it.
 */
function useBadges(enabled: boolean): { messages: number; notifications: number } {
  const inbox = useQuery({
    queryKey: ["shared", "inbox"],
    queryFn: async () => inboxSchema.parse(unwrap(await api().get("/api/v1/shared/inbox"))),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const notices = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => notificationsSchema.parse(unwrap(await api().get("/api/v1/shared/notifications?limit=1&filter=unread"))),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  return { messages: inbox.data?.unreadTotal ?? 0, notifications: notices.data?.unreadCount ?? 0 };
}

type Console = "operator" | "appadmin";

/** Signed in with no active role: the operator's or content team's screen, or the picker. */
function NoRole({ me }: { me: Me }) {
  const t = useT();
  const th = useTheme();
  const [open, setOpen] = useState<Console | null>(null);
  const consoles: Console[] = [...(me.user.isSuperuser ? ["operator" as const] : []), ...(me.user.isAppAdmin ? ["appadmin" as const] : [])];
  // Nobody to be at any school: the console is the whole app for them.
  const only = me.contexts.length === 0 ? (consoles[0] ?? null) : open;
  if (only === "operator" || only === "appadmin") {
    return (
      <View style={{ flex: 1 }}>
        {me.contexts.length > 0 ? (
          <View style={{ paddingHorizontal: th.space[4], paddingTop: th.space[3] }}>
            <Button label={t("switch.whereToGo")} variant="ghost" onPress={() => setOpen(null)} />
          </View>
        ) : null}
        {only === "operator" ? <OperatorHome /> : <AppAdminHome />}
      </View>
    );
  }
  return <ChooseContext consoles={consoles} onConsole={setOpen} />;
}
