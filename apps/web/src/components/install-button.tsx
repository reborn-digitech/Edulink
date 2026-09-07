"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DeviceMobileIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Install affordance.
 *
 * Chrome's own mini-infobar is easy to miss and cannot be re-triggered, so
 * AppRuntime captures `beforeinstallprompt` and this button replays it on
 * demand. iOS never fires that event at all, so Safari users get the manual
 * Add to Home Screen instructions instead of a button that would do nothing.
 */
/* ---- which browser this is, read once and never again ----------------------
 *
 * The user agent cannot change under a running page, so `subscribe` has
 * nothing to listen to and returns a no-op unsubscribe. That is not a misuse
 * of `useSyncExternalStore`: what is wanted here is the third argument, a
 * SERVER snapshot of `false`, which is how a browser-only fact gets read
 * without the hydration mismatch that a lazy useState initialiser would cause
 * and without the mount effect that would set state for a render.
 */
const subscribeToNothing = () => () => {};
const readIsIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
const notOnTheServer = () => false;

export function InstallButton({ className }: { className?: string }) {
  const t = useT();
  const [installable, setInstallable] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const iosHint = useSyncExternalStore(subscribeToNothing, readIsIosSafari, notOnTheServer);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = () => {
      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as { standalone?: boolean }).standalone === true,
      );
      setInstallable(
        Boolean((window as unknown as { __edulinkInstallPrompt?: Event }).__edulinkInstallPrompt),
      );
    };
    check();

    window.addEventListener("edulink:installable", check);
    window.addEventListener("appinstalled", check);
    return () => {
      window.removeEventListener("edulink:installable", check);
      window.removeEventListener("appinstalled", check);
    };
  }, []);

  if (standalone) {
    return (
      <p className={className}>
        <span className="inline-flex items-center gap-2 rounded-full bg-ok-soft px-3.5 py-1.5 text-xs font-semibold text-ok">
          <DeviceMobileIcon weight="fill" className="size-4" />
          {t("ui.installedApp")}
        </span>
      </p>
    );
  }

  if (iosHint) {
    return (
      <p
        className={`inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs text-fg-muted ${className ?? ""}`}
      >
        <ShareNetworkIcon weight="bold" className="size-4 text-accent" />
        {/* One sentence — the bold OS names went with the fragments, and the
            names themselves are the ones iOS shows in this language. */}
        {t("ui.installHowTo")}
      </p>
    );
  }

  if (!installable) return null;

  return (
    <Button
      variant="secondary"
      className={className}
      loading={busy}
      icon={<DeviceMobileIcon weight="bold" />}
      onClick={async () => {
        const event = (window as unknown as { __edulinkInstallPrompt?: BeforeInstallPromptEvent })
          .__edulinkInstallPrompt;
        if (!event) return;
        setBusy(true);
        try {
          await event.prompt();
          const { outcome } = await event.userChoice;
          if (outcome === "accepted") {
            // The event is single-use; Chrome refuses a second prompt() call.
            delete (window as unknown as { __edulinkInstallPrompt?: Event }).__edulinkInstallPrompt;
            setInstallable(false);
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {t("ui.install")}
    </Button>
  );
}
