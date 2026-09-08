import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import type { ApiResult } from "@edulink/contracts";
import { Icon, Text } from "@/components";
import { API_BASE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { countQueued, enqueue, onQueueEvent } from "@/lib/outbox";
import { flushOutbox, startOutboxRunner } from "@/lib/outbox-runner";
import { ApiRefused } from "@/lib/query";

/**
 * What the teacher's screens share: the outbox badge ("N waiting to send",
 * the web's OutboxBadge), the write-or-queue rule, and the few date words a
 * phone shows without a calendar library.
 */

/** Opens the same page on the web, signed in there — the class page with its code, a new message to anyone at the school. */
export function openWeb(path: string): void {
  void Linking.openURL(`${API_BASE}${path}`);
}

/** How many items wait in the outbox, for one tag or all; live. */
export function useQueuedCount(tag?: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void countQueued(tag).then((n) => {
        if (alive) setCount(n);
      });
    };
    refresh();
    const stopListening = onQueueEvent(refresh);
    return () => {
      alive = false;
      stopListening();
    };
  }, [tag]);
  return count;
}

/** Starts the reconnect listeners once, and flushes when this screen opens. */
export function useOutboxRunner(): void {
  useEffect(() => {
    startOutboxRunner();
  }, []);
}

export function OutboxBadge({ tag }: { tag?: string }) {
  const count = useQueuedCount(tag);
  const t = useT();
  const th = useTheme();
  if (count === 0) return null;
  const label = count === 1 ? t("shell.outboxOne") : t("shell.outboxCount", { count });
  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${label}. ${t("shell.outboxHint")}`}
      style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], alignSelf: "flex-start", backgroundColor: th.warnSoft, borderRadius: th.radius.xl, paddingHorizontal: th.space[3], minHeight: 32 }}
    >
      <Icon name="tray" color={th.warn} size={16} weight="bold" />
      <Text variant="xs" bold tone="warn">
        {label}
      </Text>
    </View>
  );
}

export type WriteOutcome = { kind: "sent" } | { kind: "queued" } | { kind: "refused"; status: number; message: string };

/**
 * The web register's rule: a network-shaped failure (status 0) or a server
 * failure (5xx) goes to the outbox and will be replayed; a 4xx is a refusal
 * the person has to see. `body` is queued exactly as the API took it.
 */
export async function writeOrQueue(result: ApiResult<unknown>, item: { url: string; body: unknown; tag: string }): Promise<WriteOutcome> {
  if (result.ok) {
    void flushOutbox();
    return { kind: "sent" };
  }
  if (result.status === 0 || result.status >= 500) {
    await enqueue({ url: item.url, method: "POST", body: JSON.stringify(item.body), tag: item.tag });
    return { kind: "queued" };
  }
  return { kind: "refused", status: result.status, message: result.error };
}

/** For mutationFn: throws the refusal so React Query reports it, otherwise resolves. */
export function throwIfRefused(outcome: WriteOutcome): Exclude<WriteOutcome, { kind: "refused" }> {
  if (outcome.kind === "refused") throw new ApiRefused(outcome.status, outcome.message);
  return outcome;
}

/** The app's three languages as BCP 47 tags for the date formatter: India's day-month order. */
function tagFor(locale: string): string {
  return locale.includes("-") ? locale : `${locale}-IN`;
}

/** "Mon, 7 Sept" from a YYYY-MM-DD key, in the reader's language. */
export function dayLabel(dateKey: string, locale: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(tagFor(locale), { weekday: "short", day: "numeric", month: "short" });
}

/** "7 Sep, 14:05" from an ISO instant. */
export function whenLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(tagFor(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "2 hours ago" / "in 3 days", the web's relativeTime. */
export function relativeTime(iso: string, locale: string, now: Date = new Date()): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return iso;
  const rtf = new Intl.RelativeTimeFormat(tagFor(locale), { numeric: "auto" });
  const diffMs = target.getTime() - now.getTime();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return rtf.format(Math.round(diffMs / 1000), "second");
}

/** "09:40" from minutes after midnight. */
export function clock(minute: number | null): string {
  if (minute === null) return "";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

/** Today as YYYY-MM-DD on the device's clock. */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
