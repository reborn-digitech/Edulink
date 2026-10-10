import { useEffect, useState } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { SchoolModuleCode } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Empty, Screen, Text } from "@/components";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { MODULE_KEYS } from "@/screens/modules/role-home";

/**
 * What the college desks' native screens share (the parity batch, 10 Oct
 * 2026, R-4): whether the active college has a module on, the screen that
 * says so when it has not, the "offline" line a decision screen shows (a
 * decision with a reason is never queued in the outbox: it is sent live, and
 * the screen says so while the phone is offline), and money in the reader's
 * language.
 */
export function useModuleOn(module: SchoolModuleCode | null): boolean {
  const session = useSession();
  if (!module) return true;
  return session.status === "signed-in" && (session.me.modules ?? []).includes(module);
}

/** The screen a module's door would refuse: the module's name, and More. */
export function ModuleOffScreen({ title, module }: { title: string; module: SchoolModuleCode }) {
  const t = useT();
  const router = useRouter();
  const name = t(MODULE_KEYS[module].name);
  return (
    <Screen title={title}>
      <Empty icon="puzzle" title={t("modules.offTitle", { module: name })} body={t("modules.offBodyCollege", { module: name })} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
    </Screen>
  );
}

/** Whether the phone believes it is online (React Query's onlineManager; the web target's navigator.onLine, a phone's NetInfo). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setOnline), []);
  return online;
}

/** One line under a decision's buttons while offline: a decision is sent live, never queued, so it waits for the signal. */
export function OfflineDecisionNote() {
  const t = useT();
  const online = useOnline();
  if (online) return null;
  return (
    <Text variant="xs" tone="warn" accessibilityLiveRegion="polite">
      {t("deskParity.offlineDecision")}
    </Text>
  );
}

export const money = (paise: number, locale: Parameters<typeof formatPaise>[1]) => formatPaise(paise, locale);

/** Whole rupees typed ("1250" or "1,250") to paise; null when it is not a figure above nothing. */
export function paiseOfTyped(typed: string): number | null {
  const n = Number(typed.trim().replace(/,/g, ""));
  return typed.trim() !== "" && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

/** A whole number typed; null otherwise. */
export function intOfTyped(typed: string): number | null {
  const n = Number(typed.trim());
  return typed.trim() !== "" && Number.isInteger(n) ? n : null;
}

/** Today as YYYY-MM-DD in the phone's own clock, for a date field's default. */
export function todayKey(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
