import { useEffect, useState } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, useColorScheme, View } from "react-native";
import * as Device from "expo-device";
import { makeQueryClient } from "@/lib/query";
import { SessionProvider, useSession } from "@/lib/session";
import { I18nProvider, useT } from "@/lib/i18n";
import { RoleThemeProvider, useTheme } from "@/lib/theme";
import { useDeepLinks } from "@/lib/deep-links";
import { registerForPush } from "@/lib/push";
import { useVersionGate } from "@/lib/version";
import { installCrashReporter, sendPendingCrash, setCurrentScreen } from "@/lib/crash";
import { UpdateRequired } from "@/screens/shared/update-required";
import { Text, ToastProvider } from "@/components";

/**
 * The root: providers, then the one rule of the router — no session, the
 * (auth) group; a session, the (app) group. The decision waits for storage
 * to be read once ("loading"), so nobody sees the sign-in screen flash.
 */
export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SessionProvider>
          <Gate />
        </SessionProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

/**
 * A jailbroken or rooted phone is warned, not blocked: the person may have
 * no other phone, and a school's attendance still has to be marked. The
 * check is best-effort (Expo calls it experimental) and never runs on the web.
 */
function useRootedWarning(): boolean {
  const [rooted, setRooted] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let alive = true;
    Device.isRootedExperimentalAsync()
      .then((yes) => {
        if (alive) setRooted(yes);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return rooted;
}

function RootedBanner() {
  const t = useT();
  const th = useTheme();
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: th.warnSoft, paddingHorizontal: th.space[4], paddingVertical: th.space[2], gap: th.space[1] }}>
      <Text bold>{t("security.rootedTitle")}</Text>
      <Text variant="sm" tone="muted">{t("security.rootedBody")}</Text>
    </View>
  );
}

function Gate() {
  const session = useSession();
  const queryClient = useQueryClient();
  const rooted = useRootedWarning();
  const segments = useSegments();
  const router = useRouter();
  const scheme = useColorScheme();
  const inAuth = segments[0] === "(auth)";
  const pathname = usePathname();
  const version = useVersionGate();

  useDeepLinks();

  // The crash reporter chains onto the global handler once, at mount, and
  // learns the route that is up so a crash can say where it happened.
  useEffect(() => {
    installCrashReporter();
  }, []);
  useEffect(() => {
    setCurrentScreen(pathname);
  }, [pathname]);

  useEffect(() => {
    if (session.status === "loading") return;
    // A signed-out phone remembers nothing of the last person: the cache goes with them.
    if (session.status === "signed-out") queryClient.clear();
    if (session.status === "signed-out" && !inAuth) router.replace("/(auth)");
    if (session.status === "signed-in" && inAuth) router.replace("/(app)");
    // Best-effort, every start while signed in: the token can rotate; and
    // the last start's crash, if there was one, goes to the server now.
    if (session.status === "signed-in") {
      void registerForPush();
      void sendPendingCrash();
    }
  }, [session.status, inAuth, router, queryClient]);

  // Below the store's minimum: the update screen, and nothing else. The
  // theme still follows the role so the screen looks like the app it replaces.
  if (version.state === "update-required" && version.policy) {
    return (
      <RoleThemeProvider role={session.status === "signed-in" ? session.me.active.role : null}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <UpdateRequired policy={version.policy} />
      </RoleThemeProvider>
    );
  }

  return (
    <RoleThemeProvider role={session.status === "signed-in" ? session.me.active.role : null}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ToastProvider>
        <View style={{ flex: 1 }}>
          {rooted ? <RootedBanner /> : null}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </View>
      </ToastProvider>
    </RoleThemeProvider>
  );
}
