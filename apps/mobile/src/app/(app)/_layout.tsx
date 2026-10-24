import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { inboxSchema, notificationsSchema } from "@edulink/contracts";
import { Icon, Loading, TabLabel } from "@/components";
import { useRole, useSession } from "@/lib/session";
import { ChooseContext } from "@/components/choose-context";
import { ALL_TAB_SCREENS, HIDDEN_SCREENS, TABS, featuresOf, tabShown } from "@/lib/nav";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { type } from "@edulink/tokens";
import { consolesFor } from "@/screens/shared/console-home";
import { ViduraHost, viduraAccess } from "@/screens/shared/vidura";
import { WEB_HOME } from "@/lib/links";
import { startOutboxRunner } from "@/lib/outbox-runner";

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
 * they get a stack whose index is their console; everyone else chooses where
 * to go.
 */
export default function AppLayout() {
  const role = useRole();
  const session = useSession();
  const t = useT();
  const th = useTheme();
  const badges = useBadges(Boolean(role));
  // The outbox drains from here, once for the whole app (QA-15, 24 Oct 2026): a screen that queued a write
  // and forgot to start the runner (the clinical logbook) held the row until some other screen started it.
  // Idempotent: the screens that call useOutboxRunner() themselves change nothing.
  const signedIn = session.status === "signed-in";
  useEffect(() => {
    if (signedIn) startOutboxRunner();
  }, [signedIn]);
  // Five labels share the width. At 320 px a tab is 64 px and "Assignments"
  // ended in an ellipsis (measured by e2e/ux.spec.ts), so the label steps
  // down on narrow screens — to 10 below 340 px, which is the size iOS's own
  // tab bars use — rather than being cut off.
  const { width } = useWindowDimensions();
  const labelSize = width < 340 ? type.xs.size - 2 : width < 375 ? type.xs.size - 1 : type.xs.size;
  if (!role) {
    if (session.status !== "signed-in") return <Loading />;
    // The operator and the content team: a stack, whose index is their console
    // (screens/shared/console-home.tsx), so what they open from it renders.
    if (consolesFor(session.me).length > 0) return <Stack screenOptions={{ headerShown: false }} />;
    return <ChooseContext />;
  }
  // A tab of a module the active school has off is not drawn (3 Oct 2026).
  const modules = session.status === "signed-in" ? (session.me.modules ?? []) : [];
  // …and a duty's tab only for whoever holds it (5 Oct 2026).
  // …and a platform feature's tab only while the operator has it on (15 Oct 2026; /me's `features`).
  const tabs = TABS[role].filter((tab) => tabShown(tab, modules, session.status === "signed-in" ? (session.me.duties ?? []) : [], featuresOf(session.status === "signed-in" ? session.me : null)));
  // Vidura's round button and sheet over every screen (pass 1, 17 Oct 2026), where the web draws its button.
  return (
    <ViduraHost access={viduraAccess(session.status === "signed-in" ? session.me : null)} home={WEB_HOME[role] ?? "/"}>
    <Tabs
      // "Back" from a screen opened from More goes to More, not to the first tab.
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // The bar is the frame: dark's navy in both themes, with dark's accents (lib/theme.tsx).
        tabBarActiveTintColor: th.frame.accentStrong,
        tabBarInactiveTintColor: th.frame.fgMuted,
        tabBarStyle: { backgroundColor: th.frame.surface, borderTopColor: th.frame.border, minHeight: 56 },
        // Our own label, so it shrinks to fit instead of ending in "…" — large
        // text on Android — and takes back the library's 5 pt pressable padding
        // that once cut off "Attendance" (components/tab-label.tsx).
        tabBarLabel: ({ color, children, position }) => (
          <TabLabel color={String(color)} position={position} size={labelSize}>
            {children}
          </TabLabel>
        ),
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
    </ViduraHost>
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
