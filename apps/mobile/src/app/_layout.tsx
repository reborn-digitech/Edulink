import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { makeQueryClient } from "@/lib/query";
import { SessionProvider, useSession } from "@/lib/session";
import { I18nProvider } from "@/lib/i18n";
import { RoleThemeProvider } from "@/lib/theme";

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

function Gate() {
  const session = useSession();
  const segments = useSegments();
  const router = useRouter();
  const scheme = useColorScheme();
  const inAuth = segments[0] === "(auth)";

  useEffect(() => {
    if (session.status === "loading") return;
    if (session.status === "signed-out" && !inAuth) router.replace("/(auth)");
    if (session.status === "signed-in" && inAuth) router.replace("/(app)");
  }, [session.status, inAuth, router]);

  return (
    <RoleThemeProvider role={session.status === "signed-in" ? session.me.active.role : null}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </RoleThemeProvider>
  );
}
