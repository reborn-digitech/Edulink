"use client";

import { useEffect, useRef, useState } from "react";
import { flushQueue, onQueueEvent } from "@/lib/offline-queue";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * Cross-cutting client runtime, mounted once in the root layout:
 *   * registers the service worker
 *   * shows the offline banner and flushes the outbox on reconnect
 *   * surfaces "update available" when a new SW takes over
 *   * captures the Android install prompt for our own Install button
 *
 * Renders nothing except the connectivity banner.
 */
export function AppRuntime() {
  const t = useT();
  const { toast } = useToast();
  const [online, setOnline] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);
  const wasOffline = useRef(false);

  /* ---- service worker ---- */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // next.config disables SW generation in dev, so there is nothing to
    // register there and attempting it just logs a 404.
    if (process.env.NODE_ENV === "development") return;

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // "installed" with an existing controller means this is an update,
            // not a first install.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch((error) => console.error("[sw] registration failed", error));

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- connectivity ---- */
  useEffect(() => {
    setOnline(navigator.onLine);
    wasOffline.current = !navigator.onLine;

    const goOnline = async () => {
      setOnline(true);
      if (!wasOffline.current) return;
      wasOffline.current = false;

      const { sent, failed } = await flushQueue();
      if (sent > 0) {
        toast({
          tone: "ok",
          title: sent === 1 ? t("ui.syncedOne") : t("ui.syncedMany", { count: sent }),
          description: t("ui.offlineSaved"),
        });
      }
      if (failed > 0) {
        toast({
          tone: "warn",
          title: t("ui.stillWaiting"),
          description: t("ui.couldNotSendYet", { count: failed }),
        });
      }
    };

    const goOffline = () => {
      setOnline(false);
      wasOffline.current = true;
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Also flush on load in case the browser came back while we were closed and
    // Background Sync is unsupported (Safari).
    if (navigator.onLine) void flushQueue();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [toast]);

  /* ---- outbox rejections need to be seen, not swallowed ---- */
  useEffect(
    () =>
      onQueueEvent((event) => {
        if (event.type === "rejected") {
          toast({
            tone: "danger",
            duration: null,
            title: t("ui.changeRejected"),
            description:
              t("ui.changeDiscarded"),
          });
        }
      }),
    [toast],
  );

  /* ---- install prompt capture ---- */
  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      // Stashed globally so the Install button anywhere in the app can call it.
      (window as unknown as { __edulinkInstallPrompt?: Event }).__edulinkInstallPrompt = event;
      window.dispatchEvent(new CustomEvent("edulink:installable"));
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2",
          "bg-warn px-4 py-2 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] text-sm font-semibold text-white",
          "transition-transform duration-[--dur] ease-[--ease-out]",
          online ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
          <path
            d="M1 5.5a10 10 0 0 1 14 0M3.5 9a6.5 6.5 0 0 1 9 0M8 12.5v.1"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {t("shell.offline")}
      </div>

      {updateReady && (
        <div className="fixed inset-x-0 bottom-0 z-[95] flex items-center justify-center gap-3 border-t border-border bg-surface px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shadow-lg">
          <span className="text-sm font-medium text-fg">{t("ui.newVersion")}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-[--radius-md] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            {t("ui.refresh")}
          </button>
        </div>
      )}
    </>
  );
}
