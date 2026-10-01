"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon, CalendarPlusIcon, CopyIcon } from "@phosphor-icons/react";
import { expertCalendarTokenSchema } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";

/**
 * "Subscribe in your calendar": the feed URL a calendar application follows,
 * made on first press and rotated by the same door. Shown absolute, because
 * what the person pastes into Google Calendar or Apple Calendar must stand on
 * its own; the server returns it relative and the page knows its own origin.
 */
export function CalendarCard({ initialUrl }: { initialUrl: string | null }) {
  const t = useT();
  const { toast } = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const absolute = url ? (typeof window === "undefined" ? url : new URL(url, window.location.origin).toString()) : null;

  async function rotate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/expert/calendar/token", { method: "POST" });
      if (!response.ok) throw new Error(t("expert.calendarDidNotMint"));
      setUrl(expertCalendarTokenSchema.parse(await response.json()).url);
      toast({ tone: "ok", title: t("expert.calendarMinted") });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("expert.calendarDidNotMint"));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!absolute) return;
    try {
      await navigator.clipboard.writeText(absolute);
      toast({ tone: "ok", title: t("expert.calendarCopied") });
    } catch {
      setError(t("totp.copyFailed"));
    }
  }

  return (
    <Card data-testid="expert-calendar">
      <CardHeader icon={<CalendarPlusIcon weight="duotone" className="size-5" />} title={t("expert.calendarTitle")} description={t("expert.calendarBody")} />
      <CardBody className="space-y-3">
        {absolute ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{t("expert.calendarUrl")}</p>
            <code className="block break-all rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-xs text-fg" data-testid="calendar-url">
              {absolute}
            </code>
            <p className="text-xs text-fg-muted">{t("expert.calendarRotateHint")}</p>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">{t("expert.calendarNone")}</p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {absolute && (
            <Button type="button" variant="secondary" icon={<CopyIcon weight="bold" />} onClick={() => void copy()}>
              {t("expert.calendarCopy")}
            </Button>
          )}
          <Button type="button" variant={absolute ? "ghost" : "primary"} loading={busy} icon={<ArrowsClockwiseIcon weight="bold" />} onClick={() => void rotate()} data-testid="calendar-rotate">
            {absolute ? t("expert.calendarRotate") : t("expert.calendarMint")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
