"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DeviceMobileIcon } from "@phosphor-icons/react";
import { InstallButton } from "@/components/install-button";
import { useT } from "@/lib/i18n";

/**
 * "Put Shalaghar on your home screen", on the guardian's and the pupil's
 * overview — the two people most likely to be on a phone browser, and the
 * bridge until the store app ships.
 *
 * Shown only where installing is possible right now: Chromium has offered
 * its prompt (app-runtime keeps it on window), or this is iOS Safari, where
 * the button explains Share → Add to Home Screen. Already installed, or a
 * desktop browser with nothing to offer: nothing renders, and nothing moved
 * — the card sits at the end of the page, so a late decision cannot shift
 * what is above it.
 */
const subscribeToNothing = () => () => {};
const readIsIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
const notOnTheServer = () => false;

export function InstallCard() {
  const t = useT();
  const iosHint = useSyncExternalStore(subscribeToNothing, readIsIosSafari, notOnTheServer);
  const [installable, setInstallable] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    const check = () => {
      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as { standalone?: boolean }).standalone === true,
      );
      setInstallable(Boolean((window as unknown as { __edulinkInstallPrompt?: Event }).__edulinkInstallPrompt));
    };
    check();
    window.addEventListener("edulink:installable", check);
    window.addEventListener("appinstalled", check);
    return () => {
      window.removeEventListener("edulink:installable", check);
      window.removeEventListener("appinstalled", check);
    };
  }, []);

  if (standalone || (!installable && !iosHint)) return null;

  return (
    <section
      aria-label={t("ui.installCardTitle")}
      className="flex flex-col gap-3 rounded-[--radius-lg] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <DeviceMobileIcon weight="duotone" className="mt-0.5 size-6 shrink-0 text-accent-strong" aria-hidden />
        <div>
          <h2 className="text-base font-bold text-fg">{t("ui.installCardTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t("ui.installCardBody")}</p>
        </div>
      </div>
      <InstallButton className="shrink-0" />
    </section>
  );
}
