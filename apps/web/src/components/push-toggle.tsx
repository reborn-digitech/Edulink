"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellSlashIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * Turns Web Push on for this device.
 *
 * Three things have to line up, and the UI says which one is missing rather
 * than failing silently:
 *   * a service worker (production build only)
 *   * notification permission (a one-shot browser prompt — if denied, only the
 *     user can undo it from browser settings, so we say so)
 *   * a subscription registered against our VAPID key, POSTed to /api/push
 */

type State =
  | "checking"
  | "unsupported"
  | "no-sw"
  | "denied"
  | "off"
  | "on"
  | "working";

/** VAPID keys are base64url; PushManager wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushToggle({ className }: { className?: string }) {
  const t = useT();
  const { toast } = useToast();
  const [state, setState] = useState<State>("checking");
  const [devices, setDevices] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (!("serviceWorker" in navigator)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      // In dev there is no service worker at all, so there is nothing to
      // subscribe to. Say that instead of showing a button that cannot work.
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        if (!cancelled) setState("no-sw");
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const query = existing ? `?endpoint=${encodeURIComponent(existing.endpoint)}` : "";
      const server = await fetch(`/api/push${query}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (cancelled) return;
      setDevices(server?.devices ?? 0);

      // The browser can hold a subscription the server has never seen (cleared
      // database, or the POST failed last time). Re-register rather than
      // reporting "on" and delivering nothing.
      if (existing && !server?.subscribed) {
        const ok = await registerWithServer(existing);
        setState(ok ? "on" : "off");
        return;
      }

      setState(existing ? "on" : "off");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function registerWithServer(subscription: PushSubscription): Promise<boolean> {
    const json = subscription.toJSON() as { keys?: { p256dh?: string; auth?: string } };
    if (!json.keys?.p256dh || !json.keys.auth) return false;

    const response = await fetch("/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    return response.ok;
  }

  async function enable() {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        // env.ts refuses to boot a deployed instance without this, so reaching
        // here means a local build with no keys generated.
        toast({
          tone: "danger",
          title: t("push.notConfigured"),
          description: t("push.noVapid"),
        });
        setState("off");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const ok = await registerWithServer(subscription);
      if (!ok) {
        await subscription.unsubscribe().catch(() => {});
        toast({ tone: "danger", title: t("push.couldNotTurnOn") });
        setState("off");
        return;
      }

      setState("on");
      setDevices((d) => d + 1);
      toast({
        tone: "ok",
        title: t("push.onToastTitle"),
        description: t("push.onToastBody"),
      });
    } catch (error) {
      console.error("[push] subscribe failed", error);
      toast({
        tone: "danger",
        title: t("push.couldNotTurnOn"),
        description: error instanceof Error ? error.message : undefined,
      });
      setState("off");
    }
  }

  async function disable() {
    setState("working");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
        await subscription.unsubscribe();
      }
      setState("off");
      setDevices((d) => Math.max(0, d - 1));
      toast({ tone: "neutral", title: t("push.offToast") });
    } catch {
      setState("on");
      toast({ tone: "danger", title: t("push.couldNotTurnOff") });
    }
  }

  const shell = (children: React.ReactNode) => (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border p-4",
        className,
      )}
    >
      {children}
    </div>
  );

  if (state === "checking") {
    return shell(<p className="text-sm text-fg-muted">{t("push.checking")}</p>);
  }

  if (state === "unsupported") {
    return shell(
      <>
        <BellSlashIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-fg-muted">{t("push.unsupported")}</p>
      </>,
    );
  }

  if (state === "no-sw") {
    return shell(
      <>
        <WarningIcon weight="fill" className="size-5 shrink-0 text-warn" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-fg-muted">{t("push.needsApp")}</p>
      </>,
    );
  }

  if (state === "denied") {
    return shell(
      <>
        <BellSlashIcon className="size-5 shrink-0 text-danger" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-fg-muted">{t("push.blocked")}</p>
      </>,
    );
  }

  const on = state === "on";

  return shell(
    <>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          on ? "bg-ok-soft text-ok" : "bg-surface-muted text-fg-muted",
        )}
      >
        {on ? <BellIcon weight="fill" className="size-5" /> : <BellSlashIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">
          {on ? t("push.onTitle") : t("push.offTitle")}
        </p>
        <p className="text-xs text-fg-muted">
          {on
            ? devices > 1
              ? t("push.devicesRegistered", { count: devices })
              : t("push.toldWhenClosed")
            : t("push.turnOnHint")}
        </p>
      </div>
      <Button
        variant={on ? "secondary" : "primary"}
        loading={state === "working"}
        onClick={on ? disable : enable}
      >
        {on ? t("push.turnOff") : t("push.turnOn")}
      </Button>
    </>,
  );
}
