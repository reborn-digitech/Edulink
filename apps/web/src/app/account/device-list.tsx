"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { SignOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { signOutDevice, signOutEverywhereElse } from "./actions";

export type Device = {
  id: string;
  label: string;
  ip: string | null;
  /** "Last used … · signed in …", already translated by the server page —
      the relative times inside are values and stay English. */
  meta: string;
};

/**
 * Device management.
 *
 * This is the concrete reason sessions are opaque server-side rows rather than
 * JWTs: a parent who used a library computer needs to be able to end that
 * session from here, and a stateless token cannot be recalled.
 */
export function DeviceList({
  devices,
  currentSessionId,
}: {
  devices: Device[];
  currentSessionId: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const others = devices.filter((d) => d.id !== currentSessionId);

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {devices.map((device) => {
          const isCurrent = device.id === currentSessionId;
          return (
            <li
              key={device.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-fg">
                  <span className="truncate">{device.label}</span>
                  {isCurrent && (
                    <Badge tone="ok" size="sm">
                      {t("account.thisDevice")}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-fg-muted">
                  {device.meta}
                  {device.ip ? ` · ${device.ip}` : ""}
                </p>
              </div>

              {!isCurrent && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger-soft"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await signOutDevice(device.id);
                      toast(
                        result.ok
                          ? { tone: "ok", title: t("account.deviceSignedOut") }
                          : {
                              tone: "danger",
                              title: t("account.couldNotSignOut"),
                              description: result.error,
                            },
                      );
                      router.refresh();
                    })
                  }
                >
                  {t("shell.signOut")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {others.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          icon={<SignOutIcon weight="bold" />}
          onClick={() =>
            startTransition(async () => {
              const result = await signOutEverywhereElse();
              toast({
                tone: "ok",
                title:
                  result.count === 1
                    ? t("account.devicesOutOne")
                    : t("account.devicesOutMany", { count: result.count }),
                description: t("account.stillSignedInHere"),
              });
              router.refresh();
            })
          }
        >
          {t("account.signOutEverywhereElse")}
        </Button>
      )}
    </div>
  );
}
