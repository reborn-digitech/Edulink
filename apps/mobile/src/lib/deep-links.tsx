import { useContext, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { QueryClientContext } from "@tanstack/react-query";
import type { SessionResponse } from "@edulink/contracts";
import { api, API_BASE } from "./api";
import { isTwoFactor } from "./two-factor";
import { useSession } from "./session";
import { screenFor, webPathUrl } from "./links";
import { takeVerifier } from "./sso-handoff";

/**
 * Two kinds of link open the app: the SSO hand-off (edulink://sso?code=…),
 * which is exchanged for a session here and nowhere else, with the verifier
 * this app kept when it began the sign-in (lib/sso-handoff.ts), and a
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
  // The query cache, when there is a provider: a notice says something changed, so what is on screen is read again.
  const queryClient = useContext(QueryClientContext);
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  });

  useEffect(() => {
    let alive = true;
    const handle = async (url: string | null) => {
      if (!url || !alive) return;
      const parsed = Linking.parse(url);
      if (parsed.hostname === "sso" || parsed.path === "sso") {
        const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
        if (!code) return;
        // Only a hand-off this app began: the verifier it kept is what the
        // server asks for beside the code. A code that arrives with none
        // kept is somebody else's link, and is not sent anywhere.
        const verifier = await takeVerifier();
        if (!verifier) return;
        const res = await api().post<SessionResponse>("/api/v1/auth/sso/exchange", { code, verifier, device: "Shalaghar app" });
        if (!res.ok) return;
        // Two-step sign-in: the provider was the first step; the code screen is the second.
        if (isTwoFactor(res.data)) {
          router.push({ pathname: "/(auth)/two-factor", params: { challenge: res.data.challenge } } as never);
          return;
        }
        await acceptRef.current(res.data);
        return;
      }
      // A link with no path (the app opened by its bare scheme) goes nowhere, as before "/" became the home (TA-499).
      if (!parsed.path) return;
      const target = screenFor(`/${parsed.path}${parsed.queryParams ? "?" + new URLSearchParams(parsed.queryParams as Record<string, string>).toString() : ""}`);
      if (target) router.push({ pathname: target.pathname as never, params: target.params });
    };
    if (!handledInitial.current) {
      handledInitial.current = true;
      void Linking.getInitialURL().then(handle);
    }
    const sub = Linking.addEventListener("url", (e) => void handle(e.url));

    // A tapped notification carries the server's URL in its data.
    let notifSub: { remove(): void } | null = null;
    let receivedSub: { remove(): void } | null = null;
    if (Platform.OS !== "web") {
      // A push that arrives while the app is open is shown, as it is with the app closed (TA-432, 13 Nov 2026): with no
      // handler expo-notifications presents nothing in the foreground, and the urgent cover notice went unseen. The
      // notices list and the badge are read again at once rather than at the badge's next two-minute poll.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true }),
      });
      receivedSub = Notifications.addNotificationReceivedListener(() => {
        void queryClientRef.current?.invalidateQueries({ queryKey: ["notifications"] });
      });
      notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          // What the notice is about changed on the server (TA-164): every screen's answer is marked old and those on
          // screen, the one the notice opens included, are read again rather than shown as first read days ago.
          void queryClientRef.current?.invalidateQueries();
          const target = screenFor(url);
          if (target) router.push({ pathname: target.pathname as never, params: target.params });
          // A notice for a page the phone has not (a guardian's placement consent, QA-70) opens it on the web, signed in,
          // as a notice opened from the list does, rather than nothing.
          else {
            const web = webPathUrl(url, API_BASE);
            if (web) void Linking.openURL(web);
          }
        }
      });
    }
    return () => {
      alive = false;
      sub.remove();
      notifSub?.remove();
      receivedSub?.remove();
    };
  }, [router]);
}
