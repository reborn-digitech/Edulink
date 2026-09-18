import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { api } from "./api";
import { useSession } from "./session";
import { screenFor } from "./links";

/**
 * Two kinds of link open the app: the SSO hand-off (edulink://sso?code=…),
 * which is exchanged for a session here and nowhere else, and a
 * notification's URL (the same path the web writes), mapped to a screen by
 * lib/links.ts. A URL with no screen opens the web in the system browser.
 */
export function useDeepLinks() {
  const router = useRouter();
  const session = useSession();
  // The session object changes on every state update; the effect must not
  // re-run for that (it would exchange the same SSO code again and again),
  // so it reaches the latest accept() through a ref.
  const acceptRef = useRef(session.accept);
  useEffect(() => {
    acceptRef.current = session.accept;
  });
  const handledInitial = useRef(false);

  useEffect(() => {
    let alive = true;
    const handle = async (url: string | null) => {
      if (!url || !alive) return;
      const parsed = Linking.parse(url);
      if (parsed.hostname === "sso" || parsed.path === "sso") {
        const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
        if (!code) return;
        const res = await api().post<SessionResponse>("/api/v1/auth/sso/exchange", { code, device: "Relay app" });
        if (res.ok) await acceptRef.current(res.data);
        return;
      }
      const target = screenFor(parsed.path ? `/${parsed.path}${parsed.queryParams ? "?" + new URLSearchParams(parsed.queryParams as Record<string, string>).toString() : ""}` : "/");
      if (target) router.push({ pathname: target.pathname as never, params: target.params });
    };
    if (!handledInitial.current) {
      handledInitial.current = true;
      void Linking.getInitialURL().then(handle);
    }
    const sub = Linking.addEventListener("url", (e) => void handle(e.url));

    // A tapped notification carries the server's URL in its data.
    let notifSub: { remove(): void } | null = null;
    if (Platform.OS !== "web") {
      notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          const target = screenFor(url);
          if (target) router.push({ pathname: target.pathname as never, params: target.params });
        }
      });
    }
    return () => {
      alive = false;
      sub.remove();
      notifSub?.remove();
    };
  }, [router]);
}
