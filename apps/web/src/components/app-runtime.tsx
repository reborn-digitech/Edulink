"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushQueue, onQueueEvent, setOutboxOwner } from "@/lib/offline-queue";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { RouterNudge } from "@/lib/navigation";

/**
 * Cross-cutting client runtime, mounted once in the root layout:
 *   * registers the service worker
 *   * shows the offline banner and flushes the outbox on reconnect
 *   * surfaces "update available" when a new SW takes over
 *   * captures the Android install prompt for our own Install button
 *
 * Renders nothing except the connectivity banner.
 */

/* ---- connectivity as a subscription, not a mirror --------------------------
 *
 * `navigator.onLine` is external state that the browser already publishes
 * events for, so it is read through `useSyncExternalStore` rather than copied
 * into a useState by a mount effect. The server snapshot is `true` — an
 * offline banner is not a thing to render into HTML nobody could have fetched
 * while offline — and React swaps in the real value on hydration.
 */
function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
const readConnectivity = () => navigator.onLine;
const assumeOnline = () => true;

/**
 * `owner` is the signed-in person's id, null when nobody is signed in, and
 * undefined when the document cannot know: the worker's precached /offline
 * fallback, built once at install for whoever was signed in then (TA-215).
 */
export function AppRuntime({ owner }: { owner: string | null | undefined }) {
  const t = useT();
  const { toast } = useToast();
  const online = useSyncExternalStore(subscribeToConnectivity, readConnectivity, assumeOnline);
  const [updateReady, setUpdateReady] = useState(false);
  const wasOffline = useRef(false);

  /* ---- whose device this is right now ----
   *
   * The outbox and the worker's caches are per browser, not per person. The
   * layout says who is signed in on every page; when that changes, the rows
   * another person queued are dropped and the private caches cleared, and
   * the worker is told the same, so the next person on a staff-room machine
   * starts with nothing of the last.
   *
   * The offline fallback names no owner (TA-215): its copy was built for
   * whoever was signed in when the worker installed, and taking that as a
   * change would delete the queued register of the person in front of it,
   * under a page saying the register was kept.
   */
  useEffect(() => {
    if (owner === undefined) return;
    void setOutboxOwner(owner).then(({ changed }) => {
      if (!changed) return;
      navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PRIVATE" });
    });
  }, [owner]);

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

  /* ---- what a reconnection COSTS: flushing the outbox, and saying so -------
   *
   * The banner itself is handled by the subscription above. This effect exists
   * for the side of reconnecting that is not a render: emptying the offline
   * queue and telling the user what went out, or what still has not.
   */
  useEffect(() => {
    wasOffline.current = !navigator.onLine;

    const goOnline = async () => {
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
  }, [toast, t]);

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
    [toast, t],
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
      <RouterNudge />
      {/*
        Two elements for one banner, and the split is the accessibility fix.
        The visual bar has to STAY MOUNTED while online — the slide-out is a
        transform on an existing element — but a mounted `role="status"` with
        "Offline" in it is announced by screen readers on every page, online or
        not; a walkthrough found it on the accessibility tree of every screen.
        So the live region is its own visually-hidden element, permanently
        mounted (a live region only announces content INSERTED after it
        exists) and holding text only while actually offline, and the animated
        bar below is presentation only.
      */}
      <div role="status" aria-live="polite" className="sr-only">
        {online ? null : t("shell.offline")}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2",
          "bg-warn px-4 py-2 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] text-sm font-semibold text-white",
          "transition-transform duration-[var(--dur)] ease-[var(--ease-out)]",
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
            className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            {t("ui.refresh")}
          </button>
        </div>
      )}
    </>
  );
}
