"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { saveNotifThresholds } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * The school's own housekeeping numbers. Two boxes, blank = the platform's;
 * the copy above says what each number does and that unread is never
 * deleted, because a form that changes retention should say what it
 * retains.
 */
export function NotifTidyForm({
  initialAutoRead,
  initialExpire,
  defaults,
}: {
  initialAutoRead: number | null;
  initialExpire: number | null;
  defaults: { read: number; expire: number };
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [autoRead, setAutoRead] = useState(initialAutoRead?.toString() ?? "");
  const [expire, setExpire] = useState(initialExpire?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveNotifThresholds({ autoReadDays: autoRead, expireDays: expire });
      if (!result.ok) {
        setError(result.error ?? t("notif.tidyNotSaved"));
        return;
      }
      toast({ tone: "ok", title: t("notif.tidySaved") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" data-testid="notif-tidy-form">
      <p className="text-sm leading-relaxed text-fg-muted">
        {t("notif.tidyBody", { read: defaults.read, expire: defaults.expire })}
      </p>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("notif.autoReadField")}
          inputMode="numeric"
          placeholder={String(defaults.read)}
          value={autoRead}
          onChange={(e) => setAutoRead(e.target.value)}
          data-testid="notif-autoread"
        />
        <TextField
          label={t("notif.expireField")}
          inputMode="numeric"
          placeholder={String(defaults.expire)}
          value={expire}
          onChange={(e) => setExpire(e.target.value)}
          data-testid="notif-expire"
        />
      </div>
      <Button size="sm" onClick={save} loading={pending}>
        {t("common.save")}
      </Button>
    </div>
  );
}
