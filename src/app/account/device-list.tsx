"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { signOutDevice, signOutEverywhereElse } from "./actions";

export type Device = {
  id: string;
  label: string;
  ip: string | null;
  lastSeen: string;
  since: string;
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
              className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-fg">
                  <span className="truncate">{device.label}</span>
                  {isCurrent && (
                    <Badge tone="ok" size="sm">
                      This device
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-fg-muted">
                  Last used {device.lastSeen} · signed in {device.since}
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
                          ? { tone: "ok", title: "Device signed out" }
                          : { tone: "danger", title: "Could not sign it out", description: result.error },
                      );
                      router.refresh();
                    })
                  }
                >
                  Sign out
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
                title: `${result.count} device${result.count === 1 ? "" : "s"} signed out`,
                description: "You are still signed in here.",
              });
              router.refresh();
            })
          }
        >
          Sign out everywhere else
        </Button>
      )}
    </div>
  );
}
