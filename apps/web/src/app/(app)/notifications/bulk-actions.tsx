"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChecksIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { clearRead, markAllRead } from "./actions";
import { useT } from "@/lib/i18n";

export function BulkActions({
  unreadCount,
  readCount,
}: {
  unreadCount: number;
  readCount: number;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (unreadCount === 0 && readCount === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {unreadCount > 0 && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          icon={<ChecksIcon weight="bold" />}
          onClick={() =>
            startTransition(async () => {
              const result = await markAllRead();
              toast({
                tone: "ok",
                title: t("notif.markedRead", { count: result.count }),
              });
              router.refresh();
            })
          }
        >
          {t("notif.markAllRead")}
        </Button>
      )}

      {readCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          className="text-fg-muted"
          icon={<TrashIcon weight="bold" />}
          onClick={() =>
            startTransition(async () => {
              const result = await clearRead();
              toast({
                tone: "neutral",
                title: t("notif.clearedCount", { count: result.count }),
                // Says what was NOT touched, so nobody wonders whether a
                // message about their child was thrown away.
                description: t("notif.unreadKept"),
              });
              router.refresh();
            })
          }
        >
          {t("notif.clearRead", { count: readCount })}
        </Button>
      )}
    </div>
  );
}
